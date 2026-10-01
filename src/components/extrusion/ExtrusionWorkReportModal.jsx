import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  CheckCircle2,
  Zap,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  FileSpreadsheet,
  ShieldCheck
} from "lucide-react";
import {
  DOWNTIME_CATEGORIES,
  TPM_CHECK_ITEMS,
  EXTRUSION_STANDARD_SPECS,
  exportExtrusionCheckSheetExcel,
  sanitizeExtrusionReport
} from "../../services/extrusionProductionService";
import { getItemsByLine } from "../../data/extrusionItemsData";
import { getMaterialBOMForItem } from "../../data/extrusionRawMaterialsData";

import ExtrusionTPMStep from "./modal/ExtrusionTPMStep";
import ExtrusionBasicInfoSection, { CLEAN_LINE_OPTIONS } from "./modal/ExtrusionBasicInfoSection";
import ExtrusionProductionItemsSection from "./modal/ExtrusionProductionItemsSection";
import ExtrusionConditionsSection from "./modal/ExtrusionConditionsSection";
import ExtrusionDowntimeSection from "./modal/ExtrusionDowntimeSection";
import ExtrusionNotesSection from "./modal/ExtrusionNotesSection";

// Client-side image compression for fast sync & light Firestore storage
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: ((dataUrl.length * (3 / 4)) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
    };
  });
};

const createDefaultItem = (lineId, suffix = Date.now()) => {
  const lineItems = getItemsByLine(lineId || "pcm1");
  const first = lineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };
  return {
    id: `item_${suffix}_${Math.random().toString(36).substring(2, 6)}`,
    vehicle: first.vehicle,
    itemName: first.itemName,
    itemCode: "",
    targetQty: 2000,
    actualQty: 1950,
    goodQty: 1900,
    defectQty: 50,
    scrapKg: 7.5
  };
};

const calculateMinutesFromTime = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const [sH, sM] = String(startTime).split(":").map(Number);
    const [eH, eM] = String(endTime).split(":").map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
    let sMin = sH * 60 + sM;
    let eMin = eH * 60 + eM;
    if (eMin < sMin) {
      eMin += 24 * 60; // 야간 교대(자정 넘어가는 경우)
    }
    return Math.max(0, eMin - sMin);
  } catch (e) {
    return 0;
  }
};

const createDefaultDowntimeEvent = (type = "비가동", category = "압개시", suffix = Date.now()) => {
  const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === category) || DOWNTIME_CATEGORIES[0];
  return {
    id: `dt_${suffix}_${Math.random().toString(36).substring(2, 6)}`,
    type: type || "비가동",
    startTime: "08:00",
    endTime: "08:30",
    minutes: 30,
    category: category || "압개시",
    detail: catObj?.defaultDetail || "초기 압출 승온 및 제품 인취 세팅",
    scrapKg: ""
  };
};

export const ExtrusionWorkReportModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing = false,
  existingReports = []
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Helper to check if TPM check was already done today for the specified worker
  const isTpmAlreadyDone = (targetDate, targetWorker) => {
    if (!targetDate || !targetWorker) return false;
    try {
      const workerClean = String(targetWorker || "").trim();
      if (!workerClean) return false;
      const key = `extrusion_tpm_done_${targetDate}_${workerClean}`;
      if (typeof window !== "undefined" && window.localStorage && localStorage.getItem(key) === "true") return true;

      // Check if any report today for this worker already completed TPM
      if (Array.isArray(existingReports) && existingReports.length > 0) {
        const workerFirstName = workerClean.split(" ")[0];
        const match = existingReports.some(
          (r) => r && r.date === targetDate && String(r.worker || "").includes(workerFirstName) && r.tpmStatus === "완료"
        );
        if (match) return true;
      }
    } catch (e) {
      console.warn("isTpmAlreadyDone check error:", e);
    }
    return false;
  };

  // Step state: 'tpm' or 'report'
  const [currentStep, setCurrentStep] = useState(isEditing ? "report" : "tpm");

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
    if (initialData) {
      const items = (Array.isArray(initialData.items) && initialData.items.length > 0)
        ? initialData.items.map((it, i) => ({
            id: it.id || `item_${i + 1}`,
            vehicle: it.vehicle || "",
            itemName: it.itemName || "",
            itemCode: it.itemCode || "",
            targetQty: it.targetQty ?? 2000,
            actualQty: it.actualQty ?? 1950,
            goodQty: it.goodQty ?? 1900,
            defectQty: it.defectQty ?? 50,
            scrapKg: it.scrapKg ?? 7.5
          }))
        : [
            {
              id: "item_1",
              vehicle: initialData.vehicle || "BC4T",
              itemName: initialData.itemName || "D/SIDE D",
              itemCode: initialData.itemCode || "",
              targetQty: initialData.targetQty ?? 4000,
              actualQty: initialData.actualQty ?? 3950,
              goodQty: initialData.goodQty ?? 3880,
              defectQty: initialData.defectQty ?? 70,
              scrapKg: initialData.scrapKg ?? 15.0
            }
          ];

      return {
        ...initialData,
        items,
        tpmIssueText: initialData?.tpmIssueText || initialData?.tpmIssueReport?.text || "",
        tpmIssuePhotos: Array.isArray(initialData?.tpmIssuePhotos)
          ? initialData.tpmIssuePhotos
          : (Array.isArray(initialData?.tpmIssueReport?.photos) ? initialData.tpmIssueReport.photos : []),
        rawMaterials: {
          rubberType: initialData?.rawMaterials?.rubberType || (initialData?.rawMaterials?.rubberLot?.includes("/") ? initialData.rawMaterials.rubberLot.split("/")[0].trim() : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).rubberType || "")),
          rubberWeight: initialData?.rawMaterials?.rubberWeight ?? "",
          rubberLot: initialData?.rawMaterials?.rubberLot || "",
          rubberType2: initialData?.rawMaterials?.rubberType2 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).rubberType2 || "",
          rubberWeight2: initialData?.rawMaterials?.rubberWeight2 ?? "",
          rubberLot2: initialData?.rawMaterials?.rubberLot2 || "",
          coatingType: initialData?.rawMaterials?.coatingType !== undefined ? initialData.rawMaterials.coatingType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).coatingType || ""),
          coatingWeight: initialData?.rawMaterials?.coatingWeight ?? "",
          coatingLot: initialData?.rawMaterials?.coatingLot || "",
          insertType: initialData?.rawMaterials?.insertType !== undefined ? initialData.rawMaterials.insertType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).insertType || ""),
          insertWeight: initialData?.rawMaterials?.insertWeight ?? "",
          insertLot: initialData?.rawMaterials?.insertLot || "",
          compoundType: initialData?.rawMaterials?.compoundType !== undefined ? initialData.rawMaterials.compoundType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType || ""),
          compoundWeight: initialData?.rawMaterials?.compoundWeight ?? "",
          compoundLot: initialData?.rawMaterials?.compoundLot || "",
          compoundType2: initialData?.rawMaterials?.compoundType2 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType2 || "",
          compoundWeight2: initialData?.rawMaterials?.compoundWeight2 ?? "",
          compoundLot2: initialData?.rawMaterials?.compoundLot2 || "",
          compoundType3: initialData?.rawMaterials?.compoundType3 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType3 || "",
          compoundWeight3: initialData?.rawMaterials?.compoundWeight3 ?? "",
          compoundLot3: initialData?.rawMaterials?.compoundLot3 || ""
        },
        defectBreakdown: {
          cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
          startLossKg: initialData?.defectBreakdown?.startLossKg || "",
          appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
        },
        downtimeEvents: Array.isArray(initialData?.downtimeEvents) && initialData.downtimeEvents.length > 0
          ? initialData.downtimeEvents.map((e, idx) => ({
              id: e.id || `dt_${idx + 1}`,
              type: e.type || (["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅", "다이스수정"].includes(e.category) ? "불량" : "비가동"),
              startTime: e.startTime || "",
              endTime: e.endTime || "",
              minutes: Number(e.minutes) || 0,
              category: e.category || "압개시",
              detail: e.detail || "",
              scrapKg: e.scrapKg ?? ""
            }))
          : (initialData?.downtimeMinutes > 0 || initialData?.downtimeDetail || initialData?.startTime
              ? [{
                  id: "dt_1",
                  type: "비가동",
                  startTime: initialData?.startTime || "08:00",
                  endTime: initialData?.endTime || "08:30",
                  minutes: Number(initialData?.downtimeMinutes) || 30,
                  category: initialData?.downtimeCategory || "압개시",
                  detail: initialData?.downtimeDetail || "",
                  scrapKg: initialData?.downtimeScrapKg ?? ""
                }]
              : [createDefaultDowntimeEvent("비가동", "압개시")]),
        downtimeMinutes: Number(initialData?.downtimeMinutes) || 30,
        downtimeCategory: initialData?.downtimeCategory || "압개시",
        downtimeDetail: initialData?.downtimeDetail || "",
        downtimeScrapKg: initialData?.downtimeScrapKg ?? "",
        conditions: {
          extruder110Rpm: initialData?.conditions?.extruder110Rpm || initialData?.conditions?.extruderRpm || EXTRUSION_STANDARD_SPECS.extruder110Rpm,
          extruder60Rpm: initialData?.conditions?.extruder60Rpm || initialData?.conditions?.extruder70Rpm || EXTRUSION_STANDARD_SPECS.extruder60Rpm,
          waterTemp: initialData?.conditions?.waterTemp || EXTRUSION_STANDARD_SPECS.waterTemp,
          waterZones: Array.isArray(initialData?.conditions?.waterZones) && initialData.conditions.waterZones.length === 4
            ? initialData.conditions.waterZones
            : [...(EXTRUSION_STANDARD_SPECS.waterZones || [47.0, 48.5, 49.0, 47.5])],
          cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || EXTRUSION_STANDARD_SPECS.cureZoneTemp,
          haulOffSpeed: initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.haulOffSpeed,
          sprayGun1: initialData?.conditions?.sprayGun1 || EXTRUSION_STANDARD_SPECS.sprayGun1,
          sprayGun2: initialData?.conditions?.sprayGun2 || EXTRUSION_STANDARD_SPECS.sprayGun2,
          sprayGun3: initialData?.conditions?.sprayGun3 || EXTRUSION_STANDARD_SPECS.sprayGun3,
          sprayGun4: initialData?.conditions?.sprayGun4 || EXTRUSION_STANDARD_SPECS.sprayGun4,
          coatingThicknessBase: initialData?.conditions?.coatingThicknessBase || EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
          coatingThicknessOuter: initialData?.conditions?.coatingThicknessOuter || EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
          coatingThicknessInner: initialData?.conditions?.coatingThicknessInner || EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
          pcmZones: Array.isArray(initialData?.conditions?.pcmZones) && initialData.conditions.pcmZones.length === 13
            ? initialData.conditions.pcmZones
            : [...EXTRUSION_STANDARD_SPECS.pcmZones]
        }
      };
    }

    const defaultItem = createDefaultItem("pcm1");
    const defaultBOM = getMaterialBOMForItem(defaultItem.vehicle, defaultItem.itemName);

    return {
      date: todayStr,
      shift: "주간",
      plant: "삼랑진공장",
      lineId: "pcm1",
      lineName: "PCM #1 LINE",
      worker: "공영국 대리",
      subWorkers: "",
      items: [defaultItem],
      tpmIssueText: "",
      tpmIssuePhotos: [],
      rawMaterials: {
        rubberType: defaultBOM.rubberType || "",
        rubberWeight: "",
        rubberLot: "",
        rubberType2: defaultBOM.rubberType2 || "",
        rubberWeight2: "",
        rubberLot2: "",
        coatingType: defaultBOM.coatingType || "",
        coatingWeight: "",
        coatingLot: "",
        insertType: defaultBOM.insertType || "",
        insertWeight: "",
        insertLot: "",
        compoundType: defaultBOM.compoundType || "",
        compoundWeight: "",
        compoundLot: "",
        compoundType2: defaultBOM.compoundType2 || "",
        compoundWeight2: "",
        compoundLot2: "",
        compoundType3: defaultBOM.compoundType3 || "",
        compoundWeight3: "",
        compoundLot3: ""
      },
      defectBreakdown: {
        cutoffKg: "",
        startLossKg: "",
        appearanceKg: ""
      },
      conditions: {
        extruder110Rpm: EXTRUSION_STANDARD_SPECS.extruder110Rpm,
        extruder60Rpm: EXTRUSION_STANDARD_SPECS.extruder60Rpm,
        waterTemp: EXTRUSION_STANDARD_SPECS.waterTemp,
        waterZones: [...(EXTRUSION_STANDARD_SPECS.waterZones || [47.0, 48.5, 49.0, 47.5])],
        cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp,
        haulOffSpeed: EXTRUSION_STANDARD_SPECS.haulOffSpeed,
        sprayGun1: EXTRUSION_STANDARD_SPECS.sprayGun1,
        sprayGun2: EXTRUSION_STANDARD_SPECS.sprayGun2,
        sprayGun3: EXTRUSION_STANDARD_SPECS.sprayGun3,
        sprayGun4: EXTRUSION_STANDARD_SPECS.sprayGun4,
        coatingThicknessBase: EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
        coatingThicknessOuter: EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
        coatingThicknessInner: EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
        pcmZones: [...EXTRUSION_STANDARD_SPECS.pcmZones]
      },
      downtimeEvents: [createDefaultDowntimeEvent()],
      downtimeMinutes: 30,
      downtimeCategory: "형교환",
      downtimeDetail: "",
      downtimeScrapKg: "",
      notes: "",
      approvalStatus: "대기"
    };
  });

  const [errors, setErrors] = useState({});

  // Items for currently selected line
  const activeLineItems = useMemo(() => {
    return getItemsByLine(formData?.lineId || "pcm1") || [];
  }, [formData?.lineId]);

  // TPM completion state
  const isTpmCompleted = useMemo(() => {
    if (isEditing) return true;
    if (currentStep === "report") return true;
    if (isTpmAlreadyDone(formData?.date, formData?.worker)) return true;
    if (Array.isArray(tpmChecks) && tpmChecks.length === TPM_CHECK_ITEMS.length && tpmChecks.every(c => c && c.status)) return true;
    return false;
  }, [isEditing, currentStep, formData?.date, formData?.worker, tpmChecks]);

  // Sync on modal open or initialData change
  useEffect(() => {
    if (isOpen) {
      const targetWorker = initialData?.worker || formData?.worker || "공영국 대리";
      const targetDate = initialData?.date || todayStr;
      const alreadyDone = isEditing || isTpmAlreadyDone(targetDate, targetWorker);
      setCurrentStep(alreadyDone ? "report" : "tpm");
      if (initialData) {
        const items = (Array.isArray(initialData.items) && initialData.items.length > 0)
          ? initialData.items.map((it, i) => ({
              id: it.id || `item_${i + 1}`,
              vehicle: it.vehicle || "",
              itemName: it.itemName || "",
              itemCode: it.itemCode || "",
              targetQty: it.targetQty ?? 2000,
              actualQty: it.actualQty ?? 1950,
              goodQty: it.goodQty ?? 1900,
              defectQty: it.defectQty ?? 50,
              scrapKg: it.scrapKg ?? 7.5
            }))
          : [
              {
                id: "item_1",
                vehicle: initialData.vehicle || "BC4T",
                itemName: initialData.itemName || "D/SIDE D",
                itemCode: initialData.itemCode || "",
                targetQty: initialData.targetQty ?? 4000,
                actualQty: initialData.actualQty ?? 3950,
                goodQty: initialData.goodQty ?? 3880,
                defectQty: initialData.defectQty ?? 70,
                scrapKg: initialData.scrapKg ?? 15.0
              }
            ];

        if (Array.isArray(initialData.tpmChecks) && initialData.tpmChecks.length > 0) {
          setTpmChecks(initialData.tpmChecks);
        } else {
          setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        }

        setFormData({
          ...initialData,
          items,
          rawMaterials: {
            rubberType: initialData?.rawMaterials?.rubberType || (initialData?.rawMaterials?.rubberLot?.includes("/") ? initialData.rawMaterials.rubberLot.split("/")[0].trim() : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).rubberType || "")),
            rubberWeight: initialData?.rawMaterials?.rubberWeight ?? "",
            rubberLot: initialData?.rawMaterials?.rubberLot || "",
            rubberType2: initialData?.rawMaterials?.rubberType2 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).rubberType2 || "",
            rubberWeight2: initialData?.rawMaterials?.rubberWeight2 ?? "",
            rubberLot2: initialData?.rawMaterials?.rubberLot2 || "",
            coatingType: initialData?.rawMaterials?.coatingType !== undefined ? initialData.rawMaterials.coatingType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).coatingType || ""),
            coatingWeight: initialData?.rawMaterials?.coatingWeight ?? "",
            coatingLot: initialData?.rawMaterials?.coatingLot || "",
            insertType: initialData?.rawMaterials?.insertType !== undefined ? initialData.rawMaterials.insertType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).insertType || ""),
            insertWeight: initialData?.rawMaterials?.insertWeight ?? "",
            insertLot: initialData?.rawMaterials?.insertLot || "",
            compoundType: initialData?.rawMaterials?.compoundType !== undefined ? initialData.rawMaterials.compoundType : (getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType || ""),
            compoundWeight: initialData?.rawMaterials?.compoundWeight ?? "",
            compoundLot: initialData?.rawMaterials?.compoundLot || "",
            compoundType2: initialData?.rawMaterials?.compoundType2 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType2 || "",
            compoundWeight2: initialData?.rawMaterials?.compoundWeight2 ?? "",
            compoundLot2: initialData?.rawMaterials?.compoundLot2 || "",
            compoundType3: initialData?.rawMaterials?.compoundType3 || getMaterialBOMForItem(items[0]?.vehicle, items[0]?.itemName).compoundType3 || "",
            compoundWeight3: initialData?.rawMaterials?.compoundWeight3 ?? "",
            compoundLot3: initialData?.rawMaterials?.compoundLot3 || ""
          },
          defectBreakdown: {
            cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
            startLossKg: initialData?.defectBreakdown?.startLossKg || "",
            appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
          },
          downtimeEvents: Array.isArray(initialData?.downtimeEvents) && initialData.downtimeEvents.length > 0
            ? initialData.downtimeEvents.map((e, idx) => ({
                id: e.id || `dt_${idx + 1}`,
                type: e.type || (["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅", "다이스수정"].includes(e.category) ? "불량" : "비가동"),
                startTime: e.startTime || "",
                endTime: e.endTime || "",
                minutes: Number(e.minutes) || 0,
                category: e.category || "압개시",
                detail: e.detail || "",
                scrapKg: e.scrapKg ?? ""
              }))
            : (initialData?.downtimeMinutes > 0 || initialData?.downtimeDetail || initialData?.startTime
                ? [{
                    id: "dt_1",
                    type: "비가동",
                    startTime: initialData?.startTime || "08:00",
                    endTime: initialData?.endTime || "08:30",
                    minutes: Number(initialData?.downtimeMinutes) || 30,
                    category: initialData?.downtimeCategory || "압개시",
                    detail: initialData?.downtimeDetail || "",
                    scrapKg: initialData?.downtimeScrapKg ?? ""
                  }]
                : [createDefaultDowntimeEvent("비가동", "압개시")]),
          downtimeMinutes: Number(initialData?.downtimeMinutes) || 30,
          downtimeCategory: initialData?.downtimeCategory || "압개시",
          downtimeDetail: initialData?.downtimeDetail || "",
          downtimeScrapKg: initialData?.downtimeScrapKg ?? "",
          conditions: {
            extruder110Rpm: initialData?.conditions?.extruder110Rpm || initialData?.conditions?.extruderRpm || EXTRUSION_STANDARD_SPECS.extruder110Rpm,
            extruder60Rpm: initialData?.conditions?.extruder60Rpm || initialData?.conditions?.extruder70Rpm || EXTRUSION_STANDARD_SPECS.extruder60Rpm,
            waterTemp: initialData?.conditions?.waterTemp || EXTRUSION_STANDARD_SPECS.waterTemp,
            waterZones: Array.isArray(initialData?.conditions?.waterZones) && initialData.conditions.waterZones.length === 4
              ? initialData.conditions.waterZones
              : [...(EXTRUSION_STANDARD_SPECS.waterZones || [47.0, 48.5, 49.0, 47.5])],
            cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || EXTRUSION_STANDARD_SPECS.cureZoneTemp,
            haulOffSpeed: initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.haulOffSpeed,
            sprayGun1: initialData?.conditions?.sprayGun1 || EXTRUSION_STANDARD_SPECS.sprayGun1,
            sprayGun2: initialData?.conditions?.sprayGun2 || EXTRUSION_STANDARD_SPECS.sprayGun2,
            sprayGun3: initialData?.conditions?.sprayGun3 || EXTRUSION_STANDARD_SPECS.sprayGun3,
            sprayGun4: initialData?.conditions?.sprayGun4 || EXTRUSION_STANDARD_SPECS.sprayGun4,
            coatingThicknessBase: initialData?.conditions?.coatingThicknessBase || EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
            coatingThicknessOuter: initialData?.conditions?.coatingThicknessOuter || EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
            coatingThicknessInner: initialData?.conditions?.coatingThicknessInner || EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
            pcmZones: Array.isArray(initialData?.conditions?.pcmZones) && initialData.conditions.pcmZones.length === 13
              ? initialData.conditions.pcmZones
              : [...EXTRUSION_STANDARD_SPECS.pcmZones]
          }
        });
      } else {
        const defItem = createDefaultItem("pcm1");
        const defBOM = getMaterialBOMForItem(defItem.vehicle, defItem.itemName);

        setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        setFormData({
          date: todayStr,
          shift: "주간",
          plant: "삼랑진공장",
          lineId: "pcm1",
          lineName: "PCM #1 LINE",
          worker: "공영국 대리",
          subWorkers: "",
          items: [defItem],
          rawMaterials: {
            rubberType: defBOM.rubberType || "",
            rubberWeight: "",
            rubberLot: "",
            rubberType2: defBOM.rubberType2 || "",
            rubberWeight2: "",
            rubberLot2: "",
            coatingType: defBOM.coatingType || "",
            coatingWeight: "",
            coatingLot: "",
            insertType: defBOM.insertType || "",
            insertWeight: "",
            insertLot: "",
            compoundType: defBOM.compoundType || "",
            compoundWeight: "",
            compoundLot: "",
            compoundType2: defBOM.compoundType2 || "",
            compoundWeight2: "",
            compoundLot2: "",
            compoundType3: defBOM.compoundType3 || "",
            compoundWeight3: "",
            compoundLot3: ""
          },
          defectBreakdown: {
            cutoffKg: "",
            startLossKg: "",
            appearanceKg: ""
          },
          conditions: {
            extruder110Rpm: EXTRUSION_STANDARD_SPECS.extruder110Rpm,
            extruder60Rpm: EXTRUSION_STANDARD_SPECS.extruder60Rpm,
            waterTemp: EXTRUSION_STANDARD_SPECS.waterTemp,
            waterZones: [...(EXTRUSION_STANDARD_SPECS.waterZones || [47.0, 48.5, 49.0, 47.5])],
            cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp,
            haulOffSpeed: EXTRUSION_STANDARD_SPECS.haulOffSpeed,
            sprayGun1: EXTRUSION_STANDARD_SPECS.sprayGun1,
            sprayGun2: EXTRUSION_STANDARD_SPECS.sprayGun2,
            sprayGun3: EXTRUSION_STANDARD_SPECS.sprayGun3,
            sprayGun4: EXTRUSION_STANDARD_SPECS.sprayGun4,
            coatingThicknessBase: EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
            coatingThicknessOuter: EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
            coatingThicknessInner: EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
            pcmZones: [...EXTRUSION_STANDARD_SPECS.pcmZones]
          },
          downtimeEvents: [createDefaultDowntimeEvent("비가동", "압개시")],
          downtimeMinutes: 30,
          downtimeCategory: "압개시",
          downtimeDetail: "",
          downtimeScrapKg: "",
          notes: "",
          approvalStatus: "대기"
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, isEditing]);

  // Multi-item shift-level aggregated totals
  const itemsList = Array.isArray(formData?.items) ? formData.items : [];
  const totalTargetQty = itemsList.reduce((sum, it) => sum + (Number(it?.targetQty) || 0), 0);
  const totalActualQty = itemsList.reduce((sum, it) => sum + (Number(it?.actualQty) || 0), 0);
  const totalGoodQty = itemsList.reduce((sum, it) => sum + (Number(it?.goodQty) || 0), 0);
  const totalDefectQty = itemsList.reduce((sum, it) => sum + (Number(it?.defectQty) || 0), 0);
  const totalScrapKg = Number(itemsList.reduce((sum, it) => sum + (Number(it?.scrapKg) || 0), 0).toFixed(1));

  const totalAttainmentRate = totalTargetQty > 0 ? ((totalActualQty / totalTargetQty) * 100).toFixed(1) : "100.0";
  const totalYieldRate = totalActualQty > 0 ? ((totalGoodQty / totalActualQty) * 100).toFixed(1) : "100.0";

  // Multi-downtime aggregated totals
  const dtEvents = Array.isArray(formData?.downtimeEvents) ? formData.downtimeEvents : [];
  const totalDowntimeMinutes = dtEvents.reduce((sum, ev) => sum + (Number(ev?.minutes) || 0), 0);
  const totalDowntimeScrapKg = Number(dtEvents.reduce((sum, ev) => sum + (Number(ev?.scrapKg) || 0), 0).toFixed(1));

  // Multi-worker selection helpers
  const handleToggleWorker = (workerStr) => {
    setFormData((prev) => {
      const cur = String(prev.worker || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const simpleName = workerStr.split(" ")[0];
      const exists = cur.some((w) => w === workerStr || w.startsWith(simpleName) || simpleName.startsWith(w));

      let updated;
      if (exists) {
        updated = cur.filter((w) => w !== workerStr && !w.startsWith(simpleName) && !simpleName.startsWith(w));
      } else {
        updated = [...cur, workerStr];
      }

      const nextWorker = updated.join(", ");
      return {
        ...prev,
        worker: nextWorker
      };
    });
  };

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

  // Switch line
  const handleLineSelect = (lineId, fullName) => {
    const newLineItems = getItemsByLine(lineId);
    const defaultNewItem = newLineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };

    const updatedItems = formData.items.map((it) => {
      const exists = newLineItems.some((n) => n.vehicle === it.vehicle && n.itemName === it.itemName);
      if (exists) return it;
      return {
        ...it,
        vehicle: defaultNewItem.vehicle,
        itemName: defaultNewItem.itemName
      };
    });

    const activeItem = updatedItems[0] || defaultNewItem;
    const bom = getMaterialBOMForItem(activeItem.vehicle, activeItem.itemName);

    setFormData((prev) => ({
      ...prev,
      lineId,
      lineName: fullName,
      items: updatedItems.length > 0 ? updatedItems : [createDefaultItem(lineId)],
      rawMaterials: {
        ...prev.rawMaterials,
        rubberType: bom.rubberType || prev.rawMaterials?.rubberType || "",
        rubberType2: bom.rubberType2 !== undefined ? bom.rubberType2 : (prev.rawMaterials?.rubberType2 || ""),
        coatingType: bom.coatingType !== undefined ? bom.coatingType : (prev.rawMaterials?.coatingType || ""),
        insertType: bom.insertType !== undefined ? bom.insertType : (prev.rawMaterials?.insertType || ""),
        compoundType: bom.compoundType !== undefined ? bom.compoundType : (prev.rawMaterials?.compoundType || ""),
        compoundType2: bom.compoundType2 !== undefined ? bom.compoundType2 : (prev.rawMaterials?.compoundType2 || ""),
        compoundType3: bom.compoundType3 !== undefined ? bom.compoundType3 : (prev.rawMaterials?.compoundType3 || "")
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
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
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

        // Auto-match BOM from master EPDM data
        const bom = getMaterialBOMForItem(targetItem.vehicle, targetItem.itemName);
        if (bom) {
          nextRawMaterials = {
            ...nextRawMaterials,
            rubberType: bom.rubberType !== undefined ? bom.rubberType : (nextRawMaterials.rubberType || ""),
            rubberType2: bom.rubberType2 !== undefined ? bom.rubberType2 : (nextRawMaterials.rubberType2 || ""),
            compoundType: bom.compoundType !== undefined ? bom.compoundType : (nextRawMaterials.compoundType || ""),
            compoundType2: bom.compoundType2 !== undefined ? bom.compoundType2 : (nextRawMaterials.compoundType2 || ""),
            compoundType3: bom.compoundType3 !== undefined ? bom.compoundType3 : (nextRawMaterials.compoundType3 || ""),
            insertType: bom.insertType !== undefined ? bom.insertType : (nextRawMaterials.insertType || ""),
            coatingType: bom.coatingType !== undefined ? bom.coatingType : (nextRawMaterials.coatingType || "")
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

  const handleDowntimeDraftChange = (field, value) => {
    setDowntimeDraft((prev) => {
      const next = { ...prev };
      if (field === "minutes" || field === "scrapKg") {
        next[field] = value === "" ? "" : Math.max(0, Number(value));
      } else if (field === "type") {
        next.type = value;
        if (value === "불량" && next.category === "압개시") {
          next.category = "뜯김";
          const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === "뜯김");
          next.detail = catObj?.defaultDetail || "";
        } else if (value === "비가동" && next.category === "뜯김") {
          next.category = "형교환";
          const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === "형교환");
          next.detail = catObj?.defaultDetail || "";
        }
      } else if (field === "category") {
        next.category = value;
        const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === value);
        const isDefectCategory = ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(value);
        next.type = isDefectCategory ? "불량" : "비가동";
        if (!next.detail || DOWNTIME_CATEGORIES.some((c) => c.defaultDetail === next.detail)) {
          next.detail = catObj?.defaultDetail || "";
        }
      } else {
        next[field] = value;
      }

      if (field === "startTime" || field === "endTime") {
        const s = field === "startTime" ? value : next.startTime;
        const e = field === "endTime" ? value : next.endTime;
        if (s && e) {
          const comp = calculateMinutesFromTime(s, e);
          next.minutes = comp;
        }
      }

      return next;
    });
  };

  const handleAddDraftEvent = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const category = downtimeDraft.category || "압개시";
    const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === category);
    const detail = String(downtimeDraft.detail || "").trim() || catObj?.defaultDetail || `${category} 조치`;
    const minutes = Number(downtimeDraft.minutes) || (downtimeDraft.startTime && downtimeDraft.endTime ? calculateMinutesFromTime(downtimeDraft.startTime, downtimeDraft.endTime) : 0);
    const scrapKg = downtimeDraft.scrapKg !== "" && downtimeDraft.scrapKg !== undefined ? Number(downtimeDraft.scrapKg) : 0;

    const newEvent = {
      id: `dt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: downtimeDraft.type || "비가동",
      category,
      startTime: downtimeDraft.startTime || "",
      endTime: downtimeDraft.endTime || "",
      minutes,
      scrapKg,
      detail
    };

    setFormData((prev) => ({
      ...prev,
      downtimeEvents: [...(prev.downtimeEvents || []), newEvent]
    }));

    // Smart reset for next input entry
    setDowntimeDraft((prev) => {
      const nextType = prev.type || "비가동";
      const nextCat = nextType === "불량" ? "뜯김" : "형교환";
      const nextCatObj = DOWNTIME_CATEGORIES.find((c) => c.id === nextCat);
      return {
        type: nextType,
        category: nextCat,
        startTime: prev.endTime || "",
        endTime: "",
        minutes: 0,
        scrapKg: "",
        detail: nextCatObj?.defaultDetail || ""
      };
    });
  };

  const handleRemoveDowntimeEvent = (index) => {
    setFormData((prev) => ({
      ...prev,
      downtimeEvents: (prev.downtimeEvents || []).filter((_, i) => i !== index)
    }));
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

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      return;
    }

    // Mark TPM as completed for this worker today
    const key = `extrusion_tpm_done_${formData.date}_${String(formData.worker).trim()}`;
    try {
      localStorage.setItem(key, "true");
    } catch (err) {
      console.warn("localStorage error:", err);
    }

    let dtList = Array.isArray(formData?.downtimeEvents) ? [...formData.downtimeEvents] : [];
    
    // Auto-bundle draft if user filled out the form but forgot to click "등록"
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
        minutes: Number(downtimeDraft.minutes) || (downtimeDraft.startTime && downtimeDraft.endTime ? calculateMinutesFromTime(downtimeDraft.startTime, downtimeDraft.endTime) : 0),
        scrapKg: Number(downtimeDraft.scrapKg) || 0,
        detail: String(downtimeDraft.detail || "").trim() || catObj?.defaultDetail || `${category} 조치`
      });
    }

    const sumDtMinutes = dtList.reduce((acc, ev) => acc + (Number(ev?.minutes) || 0), 0);
    const sumDtScrapKg = Number(dtList.reduce((acc, ev) => acc + (Number(ev?.scrapKg) || 0), 0).toFixed(1));
    const primaryCategory = dtList[0]?.category || formData.downtimeCategory || "형교환";
    const primaryDetail = dtList
      .map((e) => (e.detail ? `[${e.startTime || ""}~${e.endTime || ""} ${e.category || ""}] ${e.detail}${Number(e.scrapKg) > 0 ? ` (폐기 ${e.scrapKg}kg)` : ""}` : ""))
      .filter(Boolean)
      .join(" / ") || formData.downtimeDetail || "";

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

    onSave(reportToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Zap className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isEditing ? "압출 작업일보 및 체크시트 수정" : "압출 TPM 점검 및 작업일보 작성"}
                </h3>
                {isTpmCompleted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs shrink-0 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    TPM 완료
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-200/80 font-medium">
                {currentStep === "tpm"
                  ? "[1단계] 설비 TPM 자주보전 10대 항목 일일 점검"
                  : "[2단계] 다품종 생산실적 & 실시간 작업체크시트"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Tabs Header */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep("tpm")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "tpm"
                  ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1단계: TPM 설비 자주보전 점검</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setCurrentStep("report")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "report"
                  ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>2단계: 작업일보 및 체크시트 작성</span>
            </button>
          </div>

          {currentStep !== "tpm" && (
            <button
              type="button"
              onClick={handleDownloadCheckSheet}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs transition active:scale-95 cursor-pointer border border-teal-500/40 flex items-center gap-1 shadow-2xs shrink-0"
              title="작성 중인 데이터로 A4 3시트 엑셀 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
              <span>A4 엑셀 출력</span>
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        {currentStep === "tpm" ? (
          /* STEP 1: TPM 점검일지 화면 */
          <ExtrusionTPMStep
            tpmChecks={tpmChecks}
            onTpmCheckChange={handleTpmStatusChange}
            onTpmNoteChange={handleTpmNoteChange}
            onSetAllOk={handleSetAllTpmOk}
            tpmIssueText={formData.tpmIssueText}
            onTpmIssueTextChange={(text) => setFormData((prev) => ({ ...prev, tpmIssueText: text }))}
            tpmIssuePhotos={formData.tpmIssuePhotos}
            onPhotoCapture={handlePhotoCapture}
            onRemovePhoto={handleRemovePhoto}
            onSelectPhotoPreview={(url) => setSelectedPhotoPreview(url)}
            isCapturingPhoto={isCapturingPhoto}
            fileInputRef={fileInputRef}
          />
        ) : (
          /* STEP 2: 압출 작업일보 및 체크시트 화면 */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
            {/* Section 1: 기본 정보 (미니멀 & 11명 작업자 뱃지) */}
            <ExtrusionBasicInfoSection
              formData={formData}
              onLineSelect={handleLineSelect}
              onDateChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              onShiftChange={(shift) => setFormData((prev) => ({ ...prev, shift }))}
              onToggleWorker={handleToggleWorker}
              errors={errors}
            />

            {/* Section 2: Multi-Item Production Management */}
            <ExtrusionProductionItemsSection
              formData={formData}
              activeLineItems={activeLineItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onItemFieldChange={handleItemFieldChange}
              onNestedFieldChange={handleNestedFieldChange}
              errors={errors}
            />

            {/* Section 3: Curing Temp, Water Temp & Coating Pressure */}
            <ExtrusionConditionsSection
              formData={formData}
              onNestedFieldChange={handleNestedFieldChange}
              setFormData={setFormData}
            />

            {/* Section 4: 비가동 및 불량내역 (간결하고 직관적인 통합 등록) */}
            <ExtrusionDowntimeSection
              downtimeDraft={downtimeDraft}
              onDowntimeDraftChange={handleDowntimeDraftChange}
              onAddDraftEvent={handleAddDraftEvent}
              downtimeEvents={formData.downtimeEvents}
              onRemoveDowntimeEvent={handleRemoveDowntimeEvent}
              totalDowntimeMinutes={totalDowntimeMinutes}
              totalDowntimeScrapKg={totalDowntimeScrapKg}
            />

            {/* Section 5: Notes & Handover */}
            <ExtrusionNotesSection
              notes={formData.notes}
              onNotesChange={(notes) => setFormData((prev) => ({ ...prev, notes }))}
            />
          </form>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          {currentStep === "tpm" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleProceedToReport}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>TPM 점검 완료 ➔ 작업일보 작성 진행</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>TPM 점검표 다시보기</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "작업일보 수정 저장" : "실시간 작업일보 등록"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enlarged Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="확대 사진"
              className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrusionWorkReportModal;
