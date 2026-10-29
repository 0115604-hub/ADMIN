import { useState, useEffect, useMemo, useRef } from "react";
import {
  TPM_CHECK_ITEMS,
  EXTRUSION_STANDARD_SPECS,
  DOWNTIME_CATEGORIES,
  WORKER_PRESETS,
  exportExtrusionCheckSheetExcel,
  sanitizeExtrusionReport
} from "../../../services/extrusionProductionService";
import { useAuth } from "../../../context/AuthContext";
import { getKSTDateString } from "../../../utils/dateUtils";
import { getItemsByLine } from "../../../data/extrusionItemsData";
import { getMaterialBOMForItem } from "../../../data/extrusionRawMaterialsData";
import { useModalHistory } from "../../../utils/modalHistory";
import {
  compressImage,
  createDefaultItem,
  calculateMinutesFromTime,
  isTpmAlreadyDone,
  mapInitialFormData,
  createDefaultFormData
} from "./extrusionReportHelpers";

export const useExtrusionWorkReportState = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing = false,
  existingReports = []
}) => {
  useModalHistory(isOpen, onClose, "extrusionWorkReportModal");
  const { currentProfile } = useAuth();
  const todayStr = useMemo(() => getKSTDateString(), []);

  // Compute defaultWorker dynamically from logged-in operator/profile
  const defaultWorker = useMemo(() => {
    if (!currentProfile?.name) return "공영국 대리";
    const matched = WORKER_PRESETS.find((w) => w.name === currentProfile.name);
    if (matched) {
      return matched.title ? `${matched.name} ${matched.title}` : matched.name;
    }
    return currentProfile.title ? `${currentProfile.name} ${currentProfile.title}` : currentProfile.name;
  }, [currentProfile]);

  // Step state: 'tpm' (1단계: TPM 점검) or 'report' (2단계: 작업일보 작성)
  const [currentStep, setCurrentStep] = useState(isEditing ? "report" : "tpm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo Capture & Preview states
  const fileInputRef = useRef(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);

  // TPM Checks State (10 items)
  const [tpmChecks, setTpmChecks] = useState(() => {
    return TPM_CHECK_ITEMS.map((it) => ({
      id: it.id,
      status: "OK",
      note: ""
    }));
  });

  // Dedicated Downtime & Defect Draft Input Form state
  const [downtimeDraft, setDowntimeDraft] = useState({
    type: "비가동",
    category: "압개시",
    startTime: "08:00",
    endTime: "08:30",
    minutes: 30,
    scrapKg: "",
    detail: "초기 압출 승온 및 제품 인취 세팅"
  });

  const [formData, setFormData] = useState(() => {
    return mapInitialFormData(initialData, todayStr, defaultWorker);
  });

  const [errors, setErrors] = useState({});

  // Line identification
  const isTPELine = formData?.lineId === "tpe" || String(formData?.lineName || "").toLowerCase().includes("tpe");
  const isPVCLine = formData?.lineId === "pvc" || String(formData?.lineName || "").toLowerCase().includes("pvc");

  // Items for currently selected line
  const activeLineItems = useMemo(() => {
    return getItemsByLine(formData?.lineId || "pcm1") || [];
  }, [formData?.lineId]);

  // TPM completion state
  const isTpmCompleted = useMemo(() => {
    if (isEditing) return true;
    if (currentStep === "report") return true;
    if (isTpmAlreadyDone(formData?.date, formData?.worker, existingReports)) return true;
    if (Array.isArray(tpmChecks) && tpmChecks.length === TPM_CHECK_ITEMS.length && tpmChecks.every(c => c && c.status)) return true;
    return false;
  }, [isEditing, currentStep, formData?.date, formData?.worker, existingReports, tpmChecks]);

  // Current workers array (for 11-person multi-select)
  const currentWorkers = useMemo(() => {
    const list = [];
    if (formData?.worker) list.push(formData.worker);
    if (formData?.subWorkers) {
      const subs = String(formData.subWorkers)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      list.push(...subs);
    }
    return Array.from(new Set(list));
  }, [formData?.worker, formData?.subWorkers]);

  const handleToggleWorker = (workerLabel) => {
    let list = [...currentWorkers];
    const exists = list.some(
      (cw) =>
        cw === workerLabel ||
        cw.startsWith(workerLabel) ||
        workerLabel.startsWith(cw)
    );
    if (exists) {
      list = list.filter(
        (cw) =>
          cw !== workerLabel &&
          !cw.startsWith(workerLabel) &&
          !workerLabel.startsWith(cw)
      );
    } else {
      list.push(workerLabel);
    }
    setFormData((prev) => ({
      ...prev,
      worker: list[0] || "",
      subWorkers: list.slice(1).join(", ")
    }));
  };

  // Sync on modal open or initialData change
  useEffect(() => {
    if (isOpen) {
      const targetWorker = initialData?.worker || defaultWorker;
      const targetDate = initialData?.date || todayStr;
      const alreadyDone = isEditing || isTpmAlreadyDone(targetDate, targetWorker, existingReports);
      setCurrentStep(alreadyDone ? "report" : "tpm");

      if (initialData) {
        if (Array.isArray(initialData.tpmChecks) && initialData.tpmChecks.length > 0) {
          setTpmChecks(initialData.tpmChecks);
        } else {
          setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        }
        setFormData(mapInitialFormData(initialData, targetDate, defaultWorker));
      } else {
        // 신규 작성 진입 시에도 동일 날짜+기본라인+주간에 작성된 일보가 이미 존재하는지 자동 확인
        const initialLineId = "pcm1";
        const initialShift = "주간";
        const existingTicket = (existingReports || []).find((r) => {
          if (!r) return false;
          const rDate = r.date || r.workDate;
          const rLine = r.lineId || r.line;
          const rShift = r.shift || "주간";
          return rDate === targetDate && (rLine === initialLineId || String(r.lineName || "").includes("1호")) && rShift === initialShift;
        });

        if (existingTicket) {
          // 이미 관리자나 동료 작업자가 등록해둔 일보가 있으면 그대로 열어 이어쓰기 지원
          setFormData(mapInitialFormData(existingTicket, targetDate, defaultWorker));
          if (Array.isArray(existingTicket.tpmChecks) && existingTicket.tpmChecks.length > 0) {
            setTpmChecks(existingTicket.tpmChecks);
          } else {
            setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
          }
          setCurrentStep("report");
        } else {
          setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
          setFormData(createDefaultFormData(targetDate, defaultWorker));
        }
      }
      setErrors({});
    }
  }, [isOpen, initialData, isEditing, existingReports, todayStr, defaultWorker]);

  // Multi-item shift-level aggregated totals
  const itemsList = Array.isArray(formData?.items) ? formData.items : [];
  const totalTargetQty = itemsList.reduce((sum, it) => sum + (Number(it?.targetQty) || 0), 0);
  const totalActualQty = itemsList.reduce((sum, it) => sum + (Number(it?.actualQty) || 0), 0);
  const totalGoodQty = itemsList.reduce((sum, it) => sum + (Number(it?.goodQty) || 0), 0);
  const totalDefectQty = itemsList.reduce((sum, it) => sum + (Number(it?.defectQty) || 0), 0);
  const totalScrapKg = Number(itemsList.reduce((sum, it) => sum + (Number(it?.scrapKg) || 0), 0).toFixed(1));

  const totalAttainmentRate = totalTargetQty > 0 ? ((totalActualQty / totalTargetQty) * 100).toFixed(1) : "100.0";
  const totalYieldRate = totalActualQty > 0 ? ((totalGoodQty / totalActualQty) * 100).toFixed(1) : "100.0";

  // TPM Handlers
  const handleTpmStatusChange = (itemId, status) => {
    setTpmChecks((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status } : it))
    );
  };

  const handleTpmNoteChange = (itemId, note) => {
    setTpmChecks((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, note } : it))
    );
  };

  const handleSetAllTpmOk = () => {
    setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
  };

  // Proceed to Step 2 & record TPM completion for date + worker
  const handleProceedToReport = () => {
    const key = `extrusion_tpm_done_${formData.date}_${String(formData.worker).trim()}`;
    try {
      localStorage.setItem(key, "true");
    } catch (e) {
      console.warn("localStorage error:", e);
    }
    setCurrentStep("report");
  };

  // Photo capture handler for Abnormality Report
  const handlePhotoCapture = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsCapturingPhoto(true);
    try {
      const newPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1200, 1200, 0.8);
        newPhotos.push(compressed);
      }
      setFormData((prev) => ({
        ...prev,
        tpmIssuePhotos: [...(prev.tpmIssuePhotos || []), ...newPhotos]
      }));
    } catch (err) {
      console.error("사진 첨부/촬영 처리 오류:", err);
    } finally {
      setIsCapturingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (photoId) => {
    setFormData((prev) => ({
      ...prev,
      tpmIssuePhotos: (prev.tpmIssuePhotos || []).filter((p) => p.id !== photoId)
    }));
  };

  // Switch line (동일 일자+라인+근무조에 이미 작성된 공동 작업일보가 있을 경우 자동 이어쓰기 취합)
  const handleLineSelect = (lineId, fullName) => {
    const nextDate = formData?.date || todayStr;
    const nextShift = formData?.shift || "주간";

    // 기존 일보 중 [일자 + 라인 + 주/야간]이 일치하는 공동 일보 탐색
    const existingSameReport = (existingReports || []).find((r) => {
      if (!r || r.id === formData?.id) return false;
      return (
        (r.date === nextDate || r.workDate === nextDate) &&
        (r.lineId === lineId || r.line === lineId || r.lineName === fullName) &&
        (r.shift || "주간") === nextShift
      );
    });

    if (existingSameReport && !isEditing) {
      // 이미 해당 라인에 작성 중인 일보가 있으면 그대로 승계하여 1장으로 취합
      const mapped = mapInitialFormData(existingSameReport, nextDate, defaultWorker);
      setFormData({
        ...mapped,
        id: existingSameReport.id,
        lineId,
        lineName: fullName || existingSameReport.lineName
      });
      return;
    }

    const newLineItems = getItemsByLine(lineId);
    const defaultNewItem = newLineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };

    const updatedItems = formData.items.map((it) => {
      const exists = newLineItems.some((n) => n.vehicle === it.vehicle && n.itemName === it.itemName);
      const vehicle = exists ? it.vehicle : defaultNewItem.vehicle;
      const itemName = exists ? it.itemName : defaultNewItem.itemName;
      const bom = getMaterialBOMForItem(vehicle, itemName, lineId) || {};

      const itRaw = it.rawMaterials || {};
      const newRaw = exists
        ? {
            ...itRaw,
            rubberType: bom.rubberType || itRaw.rubberType || "",
            rubberType2: bom.rubberType2 !== undefined ? bom.rubberType2 : (itRaw.rubberType2 || ""),
            coatingType: bom.coatingType !== undefined ? bom.coatingType : (itRaw.coatingType || "미사용"),
            insertType: bom.insertType !== undefined ? bom.insertType : (itRaw.insertType || "미사용"),
            compoundType: bom.compoundType !== undefined ? bom.compoundType : (itRaw.compoundType || ""),
            compoundType2: bom.compoundType2 !== undefined ? bom.compoundType2 : (itRaw.compoundType2 || ""),
            compoundType3: bom.compoundType3 !== undefined ? bom.compoundType3 : (itRaw.compoundType3 || ""),
            compoundType4: bom.compoundType4 !== undefined ? bom.compoundType4 : (itRaw.compoundType4 || "")
          }
        : {
            rubberType: bom.rubberType || "",
            rubberWeight: "",
            rubberLot: itRaw.rubberLot || "",
            rubberType2: bom.rubberType2 || "",
            rubberWeight2: "",
            rubberLot2: itRaw.rubberLot2 || "",
            coatingType: bom.coatingType || "미사용",
            coatingWeight: "",
            coatingLot: itRaw.coatingLot || "",
            insertType: bom.insertType || "미사용",
            insertWeight: "",
            insertLot: itRaw.insertLot || "",
            compoundType: bom.compoundType || "",
            compoundWeight: "",
            compoundLot: itRaw.compoundLot || "",
            compoundType2: bom.compoundType2 || "",
            compoundWeight2: "",
            compoundLot2: itRaw.compoundLot2 || "",
            compoundType3: bom.compoundType3 || "",
            compoundWeight3: "",
            compoundLot3: itRaw.compoundLot3 || "",
            compoundType4: bom.compoundType4 || "",
            compoundWeight4: "",
            compoundLot4: itRaw.compoundLot4 || ""
          };

      return {
        ...it,
        vehicle,
        itemName,
        rawMaterials: newRaw
      };
    });

    const activeItem = updatedItems[0] || defaultNewItem;
    const activeRaw = activeItem.rawMaterials || {};

    setFormData((prev) => ({
      ...prev,
      lineId,
      lineName: fullName,
      items: updatedItems.length > 0 ? updatedItems : [createDefaultItem(lineId)],
      rawMaterials: {
        ...prev.rawMaterials,
        ...activeRaw
      }
    }));
  };

  // Add Item
  const handleAddItem = () => {
    const newItem = createDefaultItem(formData.lineId, formData.items.length + 1);
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => {
      const remainingItems = prev.items.filter((_, i) => i !== index);
      const primaryRaw = remainingItems[0]?.rawMaterials || prev.rawMaterials;
      return {
        ...prev,
        items: remainingItems,
        rawMaterials: { ...primaryRaw }
      };
    });
  };

  // Update specific item field
  const handleItemFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      const targetItem = { ...nextItems[index] };
      let nextRawMaterials = { ...prev.rawMaterials };

      if (field === "itemSelect") {
        const [v, n] = value.split(":::");
        targetItem.vehicle = v || "";
        targetItem.itemName = n || "";

        const bom = getMaterialBOMForItem(targetItem.vehicle, targetItem.itemName, prev.lineId) || {};

        targetItem.rawMaterials = {
          rubberType: bom.rubberType !== undefined ? bom.rubberType : "",
          rubberWeight: "",
          rubberLot: targetItem.rawMaterials?.rubberLot || "",
          rubberType2: bom.rubberType2 !== undefined ? bom.rubberType2 : "",
          rubberWeight2: "",
          rubberLot2: targetItem.rawMaterials?.rubberLot2 || "",
          compoundType: bom.compoundType !== undefined ? bom.compoundType : "",
          compoundWeight: "",
          compoundLot: targetItem.rawMaterials?.compoundLot || "",
          compoundType2: bom.compoundType2 !== undefined ? bom.compoundType2 : "",
          compoundWeight2: "",
          compoundLot2: targetItem.rawMaterials?.compoundLot2 || "",
          compoundType3: bom.compoundType3 !== undefined ? bom.compoundType3 : "",
          compoundWeight3: "",
          compoundLot3: targetItem.rawMaterials?.compoundLot3 || "",
          compoundType4: bom.compoundType4 !== undefined ? bom.compoundType4 : "",
          compoundWeight4: "",
          compoundLot4: targetItem.rawMaterials?.compoundLot4 || "",
          insertType: bom.insertType !== undefined ? bom.insertType : "미사용",
          insertWeight: "",
          insertLot: targetItem.rawMaterials?.insertLot || "",
          coatingType: bom.coatingType !== undefined ? bom.coatingType : "미사용",
          coatingWeight: "",
          coatingLot: targetItem.rawMaterials?.coatingLot || ""
        };

        if (index === 0) {
          nextRawMaterials = {
            ...nextRawMaterials,
            ...targetItem.rawMaterials
          };
        }
      } else if (["targetQty", "actualQty", "goodQty", "defectQty", "scrapKg"].includes(field)) {
        const num = value === "" ? "" : Math.max(0, Number(value));
        targetItem[field] = num;

        if (field === "actualQty" || field === "goodQty") {
          const act = field === "actualQty" ? (num === "" ? 0 : num) : Number(targetItem.actualQty) || 0;
          const gd = field === "goodQty" ? (num === "" ? 0 : num) : Number(targetItem.goodQty) || 0;
          targetItem.defectQty = Math.max(0, act - gd);
        }
      } else {
        targetItem[field] = value;
      }

      nextItems[index] = targetItem;
      return { ...prev, items: nextItems, rawMaterials: nextRawMaterials };
    });
  };

  // Update specific item's raw material field (weight, LOT, or type)
  const handleItemRawMaterialChange = (itemIndex, key, value) => {
    setFormData((prev) => {
      const nextItems = [...(prev.items || [])];
      const targetItem = { ...(nextItems[itemIndex] || {}) };
      const currentItemRaw = targetItem.rawMaterials || (itemIndex === 0 ? prev.rawMaterials : null) || {};

      targetItem.rawMaterials = {
        ...currentItemRaw,
        [key]: value
      };
      nextItems[itemIndex] = targetItem;

      let nextRawMaterials = { ...prev.rawMaterials };
      if (itemIndex === 0) {
        nextRawMaterials = {
          ...nextRawMaterials,
          [key]: value
        };
      }

      return {
        ...prev,
        items: nextItems,
        rawMaterials: nextRawMaterials
      };
    });
  };

  const handleNestedFieldChange = (parentKey, childKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value
      }
    }));
  };

  const handleWaterZone110Change = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        waterZones110: {
          ...(prev.conditions?.waterZones110 || {}),
          [key]: value
        }
      }
    }));
  };

  const handleWaterZone70Change = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        waterZones70: {
          ...(prev.conditions?.waterZones70 || {}),
          [key]: value
        }
      }
    }));
  };

  const handleBatchWaterZones = (tempVal = "50.0") => {
    const valStr = String(tempVal);
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        waterTemp: valStr,
        waterZones110: {
          screw: valStr,
          cylinder1: valStr,
          cylinder2: valStr,
          cylinder3: valStr,
          head: valStr
        },
        waterZones70: {
          screw: valStr,
          cylinder1: valStr,
          cylinder2: valStr,
          cylinder3: valStr
        }
      }
    }));
  };

  const handleTpeTempChange = (extruderKey, zoneKey, value) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        [extruderKey]: {
          ...(prev.conditions?.[extruderKey] || {}),
          [zoneKey]: value
        }
      }
    }));
  };

  const handlePvcTempChange = (zoneKey, value) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        pvcTemps: {
          ...(prev.conditions?.pvcTemps || {}),
          [zoneKey]: value
        }
      }
    }));
  };

  const handlePvcDryerZoneChange = (zoneKey, value) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        pvcDryerZones: {
          ...(prev.conditions?.pvcDryerZones || {}),
          [zoneKey]: value
        }
      }
    }));
  };

  const handleDownloadCheckSheet = async () => {
    try {
      await exportExtrusionCheckSheetExcel({
        ...formData,
        items: formData.items,
        totalTargetQty,
        totalActualQty,
        totalGoodQty,
        totalDefectQty,
        totalScrapKg,
        yieldRate: totalYieldRate,
        attainmentRate: totalAttainmentRate,
        tpmChecks
      });
    } catch (e) {
      console.error(e);
      alert("체크시트 엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const newErrors = {};

    if (!formData.date) newErrors.date = "작업일자를 입력해주세요.";
    if (!formData.worker) newErrors.worker = "작업자를 선택해주세요.";

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "생산 품목을 최소 1개 이상 추가해주세요.";
    } else {
      const hasInvalid = formData.items.some((it) => !it.vehicle || !it.itemName);
      if (hasInvalid) {
        newErrors.items = "모든 품목의 아이템을 선택해주세요.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrMsg = Object.values(newErrors)[0];
      if (firstErrMsg) alert(firstErrMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      // Mark TPM as completed for this worker today
      const key = `extrusion_tpm_done_${formData.date}_${String(formData.worker).trim()}`;
      try {
        localStorage.setItem(key, "true");
      } catch (err) {
        console.warn("localStorage error:", err);
      }

      let dtList = Array.isArray(formData?.downtimeEvents) ? [...formData.downtimeEvents] : [];

      // Auto-bundle draft if user filled out the form but forgot to click "내역 등록"
      if (
        dtList.length === 0 &&
        (Number(downtimeDraft.minutes) > 0 ||
          downtimeDraft.detail ||
          downtimeDraft.scrapKg !== "" ||
          (downtimeDraft.startTime && downtimeDraft.endTime))
      ) {
        const category = downtimeDraft.category || "압개시";
        const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === category);
        dtList.push({
          id: `dt_${Date.now()}_auto`,
          type: downtimeDraft.type || "비가동",
          category,
          startTime: downtimeDraft.startTime || "",
          endTime: downtimeDraft.endTime || "",
          minutes:
            Number(downtimeDraft.minutes) ||
            (downtimeDraft.startTime && downtimeDraft.endTime
              ? calculateMinutesFromTime(downtimeDraft.startTime, downtimeDraft.endTime)
              : 0),
          scrapKg: Number(downtimeDraft.scrapKg) || 0,
          detail: String(downtimeDraft.detail || "").trim() || catObj?.defaultDetail || `${category} 조치`
        });
      }

      const sumDtMinutes = dtList.reduce((acc, ev) => acc + (Number(ev?.minutes) || 0), 0);
      const sumDtScrapKg = Number(dtList.reduce((acc, ev) => acc + (Number(ev?.scrapKg) || 0), 0).toFixed(1));
      const primaryCategory = dtList[0]?.category || formData.downtimeCategory || "형교환";
      const primaryDetail =
        dtList
          .map((ev) =>
            ev.detail
              ? `[${ev.startTime || ""}~${ev.endTime || ""} ${ev.category || ""}] ${ev.detail}${
                  Number(ev.scrapKg) > 0 ? ` (폐기 ${ev.scrapKg}kg)` : ""
                }`
              : ""
          )
          .filter(Boolean)
          .join(" / ") ||
        formData.downtimeDetail ||
        "";

      const reportToSave = sanitizeExtrusionReport({
        ...formData,
        items: formData.items,
        targetQty: totalTargetQty,
        actualQty: totalActualQty,
        goodQty: totalGoodQty,
        defectQty: totalDefectQty,
        scrapKg: totalScrapKg,
        tpmStatus: "완료",
        tpmChecks,
        tpmIssueText: formData.tpmIssueText || "",
        tpmIssuePhotos: formData.tpmIssuePhotos || [],
        downtimeEvents: dtList,
        downtimeMinutes: sumDtMinutes,
        downtimeScrapKg: sumDtScrapKg,
        downtimeCategory: primaryCategory,
        downtimeDetail: primaryDetail
      });

      if (typeof onSave === "function") {
        await onSave(reportToSave);
      }
    } catch (saveErr) {
      console.error("Extrusion submit error:", saveErr);
      alert("작업일보 저장 중 오류가 발생했습니다: " + (saveErr?.message || "다시 시도해주세요."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    todayStr,
    currentStep,
    setCurrentStep,
    fileInputRef,
    isCapturingPhoto,
    selectedPhotoPreview,
    setSelectedPhotoPreview,
    tpmChecks,
    formData,
    setFormData,
    errors,
    isTPELine,
    isPVCLine,
    activeLineItems,
    isTpmCompleted,
    currentWorkers,
    handleToggleWorker,
    handleTpmStatusChange,
    handleTpmNoteChange,
    handleSetAllTpmOk,
    handleProceedToReport,
    handlePhotoCapture,
    handleRemovePhoto,
    handleLineSelect,
    handleAddItem,
    handleRemoveItem,
    handleItemFieldChange,
    handleItemRawMaterialChange,
    handleNestedFieldChange,
    handleWaterZone110Change,
    handleWaterZone70Change,
    handleBatchWaterZones,
    handleTpeTempChange,
    handlePvcTempChange,
    handlePvcDryerZoneChange,
    handleDownloadCheckSheet,
    handleSubmit,
    isSubmitting
  };
};
