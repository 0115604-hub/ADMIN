import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Layers,
  Sparkles,
  Trash2,
  TrendingUp,
  Cpu,
  Calendar,
  Sun,
  Moon,
  Zap,
  Activity,
  Plus,
  Check,
  FileCheck2,
  FileSpreadsheet,
  Package,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Camera,
  AlertOctagon,
  Wrench,
  Thermometer,
  Gauge,
  Flame,
  Droplets
} from "lucide-react";
import {
  WORKER_PRESETS,
  DOWNTIME_CATEGORIES,
  TPM_CHECK_ITEMS,
  EXTRUSION_STANDARD_SPECS,
  exportExtrusionCheckSheetExcel,
  sanitizeExtrusionReport
} from "../../services/extrusionProductionService";
import {
  getItemsByLine
} from "../../data/extrusionItemsData";
import {
  EPDM_RUBBERS,
  EPDM_COMPOUNDS,
  EPDM_INSERTS,
  EPDM_COATINGS,
  getMaterialBOMForItem
} from "../../data/extrusionRawMaterialsData";

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

// Clean line definitions (깔끔한 라인명)
const CLEAN_LINE_OPTIONS = [
  { id: "pcm1", name: "PCM 1호", fullName: "PCM #1 LINE", color: "teal" },
  { id: "pcm3", name: "PCM 3호", fullName: "PCM #3 LINE", color: "blue" },
  { id: "pvc", name: "PVC", fullName: "PVC LINE", color: "amber" },
  { id: "tpe", name: "TPE", fullName: "TPE LINE", color: "purple" }
];

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
    type: type || "비가동", // "비가동" | "불량" | "복합"
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

  // Helper to check if TPM check was already done today for the specified worker (초/중/종물 3회 접속 고려)
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
  
  // Step state: 'tpm' (1단계: TPM 점검) or 'report' (2단계: 작업일보 작성)
  const [currentStep, setCurrentStep] = useState(isEditing ? "report" : "tpm");

  // Photo Capture & Preview states
  const fileInputRef = useRef(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);

  // TPM Checks State (10 items)
  const [tpmChecks, setTpmChecks] = useState(() => {
    return TPM_CHECK_ITEMS.map((it) => ({
      id: it.id,
      status: "OK", // 'OK' | 'WARN' | 'NG'
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
        cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp, // PCM 13존 210±20℃
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
            cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp, // PCM 13존 210±20℃
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

  if (!isOpen) return null;

  // Multi-item shift-level aggregated totals
  const itemsList = Array.isArray(formData?.items) ? formData.items : [];
  const totalTargetQty = itemsList.reduce((sum, it) => sum + (Number(it?.targetQty) || 0), 0);
  const totalActualQty = itemsList.reduce((sum, it) => sum + (Number(it?.actualQty) || 0), 0);
  const totalGoodQty = itemsList.reduce((sum, it) => sum + (Number(it?.goodQty) || 0), 0);
  const totalDefectQty = itemsList.reduce((sum, it) => sum + (Number(it?.defectQty) || 0), 0);
  const totalScrapKg = Number(itemsList.reduce((sum, it) => sum + (Number(it?.scrapKg) || 0), 0).toFixed(1));

  const totalAttainmentRate = totalTargetQty > 0 ? ((totalActualQty / totalTargetQty) * 100).toFixed(1) : "100.0";
  const totalYieldRate = totalActualQty > 0 ? ((totalGoodQty / totalActualQty) * 100).toFixed(1) : "100.0";
  const totalDefectRate = totalActualQty > 0 ? ((totalDefectQty / totalActualQty) * 100).toFixed(1) : "0.0";

  // Multi-downtime aggregated totals
  const dtEvents = Array.isArray(formData?.downtimeEvents) ? formData.downtimeEvents : [];
  const totalDowntimeMinutes = dtEvents.reduce((sum, ev) => sum + (Number(ev?.minutes) || 0), 0);
  const totalDowntimeScrapKg = Number(dtEvents.reduce((sum, ev) => sum + (Number(ev?.scrapKg) || 0), 0).toFixed(1));

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
      } else if (field === "detailPreset") {
        next.detail = value;
        const matched = DOWNTIME_CATEGORIES.find(
          (c) => c.defaultDetail === value || `[${c.label}] ${c.defaultDetail}` === value || c.label === value
        );
        if (matched) {
          next.category = matched.id;
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

  const handleDowntimeEventChange = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.downtimeEvents || [])];
      const target = { ...(list[index] || createDefaultDowntimeEvent()) };

      if (field === "minutes" || field === "scrapKg") {
        target[field] = value === "" ? "" : Math.max(0, Number(value));
      } else if (field === "type") {
        target.type = value;
      } else if (field === "category") {
        target.category = value;
        const catObj = DOWNTIME_CATEGORIES.find((c) => c.id === value);
        if (!target.detail || DOWNTIME_CATEGORIES.some((c) => c.defaultDetail === target.detail)) {
          target.detail = catObj?.defaultDetail || "";
        }
      } else if (field === "detailPreset") {
        target.detail = value;
        const matched = DOWNTIME_CATEGORIES.find((c) => c.defaultDetail === value || `[${c.label}] ${c.defaultDetail}` === value);
        if (matched) {
          target.category = matched.id;
        }
      } else {
        target[field] = value;
      }

      if (field === "startTime" || field === "endTime") {
        const s = field === "startTime" ? value : target.startTime;
        const e = field === "endTime" ? value : target.endTime;
        if (s && e) {
          const comp = calculateMinutesFromTime(s, e);
          target.minutes = comp;
        }
      }

      list[index] = target;
      return { ...prev, downtimeEvents: list };
    });
  };

  const handleDowntimeChange = (field, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setFormData((prev) => ({ ...prev, [field]: num }));
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
    e.preventDefault();
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
    } catch (e) {
      console.warn("localStorage error:", e);
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

          {currentStep === "tpm" ? (
            <button
              type="button"
              onClick={handleSetAllTpmOk}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>⚡ 전체 양호(○) 일괄 체크</span>
            </button>
          ) : (
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
          /* ========================================================================= */
          /* STEP 1: TPM 점검일지 화면 */
          /* ========================================================================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
            {/* Guide Header Banner */}
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-black text-teal-900 dark:text-teal-200 text-xs sm:text-sm">
                    압출 설비 TPM 10대 자주보전 항목 점검 (필수)
                  </h4>
                  <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 mt-0.5">
                    각 항목의 점검 상태(양호/요관찰/불량)를 탭하여 체크해 주세요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-teal-600 text-white shadow-2xs">
                  총 {TPM_CHECK_ITEMS.length}개 항목
                </span>
              </div>
            </div>

            {/* TPM 10 Items List - Simplified & Directly Tappable */}
            <div className="space-y-2">
              {TPM_CHECK_ITEMS.map((item, idx) => {
                const currentCheck = tpmChecks.find((c) => c.id === item.id) || { status: "OK", note: "" };
                const isOK = currentCheck.status === "OK";
                const isWarn = currentCheck.status === "WARN";
                const isNG = currentCheck.status === "NG";

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isNG
                        ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
                        : isWarn
                        ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Item Index, Category & Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black text-[11px] shrink-0">
                          {item.category}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {item.name}
                        </span>
                      </div>

                      {/* Right: 3-Way Tappable Buttons (○ 양호 / △ 요관찰 / ✕ 불량) */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "OK")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isOK
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <span>○</span>
                          <span>양호</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "WARN")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isWarn
                              ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          }`}
                        >
                          <span>△</span>
                          <span>요관찰</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "NG")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isNG
                              ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          }`}
                        >
                          <span>✕</span>
                          <span>불량</span>
                        </button>
                      </div>
                    </div>

                    {/* Note Input for Warn/NG */}
                    {(isWarn || isNG) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={currentCheck.note}
                          onChange={(e) => handleTpmNoteChange(item.id, e.target.value)}
                          placeholder="이상 증상 및 조치 내용 입력 (선택)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* 맨 아래 이상발생신고란 한 줄 + 사진촬영 */}
            {/* ========================================================================= */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
                    <AlertOctagon className="w-4 h-4" />
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    이상발생신고
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold hidden sm:inline">
                    (설비/안전/품질 특이사항 발생 시 기재 및 사진 첨부)
                  </span>
                </div>

                {/* Camera Capture Button */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoCapture}
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCapturingPhoto}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCapturingPhoto ? "압축중..." : "📷 사진촬영"}</span>
                  </button>
                </div>
              </div>

              {/* Single Line Text Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.tpmIssueText || ""}
                  onChange={(e) => setFormData({ ...formData, tpmIssueText: e.target.value })}
                  placeholder="이상 발생 내용 및 긴급 조치 요청사항을 입력하세요 (선택)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Photos Preview Thumbnails */}
              {Array.isArray(formData.tpmIssuePhotos) && formData.tpmIssuePhotos.length > 0 && (
                <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1">
                  {formData.tpmIssuePhotos.map((photo, pIdx) => (
                    <div key={photo.id || pIdx} className="relative group shrink-0">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || "이상발생 사진"}
                        onClick={() => setSelectedPhotoPreview(photo.dataUrl)}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-amber-400 dark:border-amber-600 shadow-xs cursor-pointer hover:opacity-90 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer transition active:scale-90"
                        title="사진 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-slate-950/70 text-white text-[9px] font-bold">
                        {photo.size || "사진"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEP 2: 압출 작업일보 및 체크시트 화면 */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">

            {/* ========================================================================= */}
            {/* Section 1: Basic Info (Clean Line Buttons, Shift, Date, Worker Dropdown) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ① 기본 정보 (1. 공정 및 설비명)
                </span>
                <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300">
                  삼랑진공장 압출동 · SL생산팀
                </span>
              </div>

              {/* Clean Line Selection Buttons */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1.5">
                  생산 호기(라인명) 선택 *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CLEAN_LINE_OPTIONS.map((l) => {
                    const isSel = formData.lineId === l.id;
                    const activeStyle =
                      l.id === "pcm1" ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-400/40" :
                      l.id === "pcm3" ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40" :
                      l.id === "pvc" ? "bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40" :
                      "bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/40";

                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleLineSelect(l.id, l.fullName)}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                          isSel
                            ? activeStyle
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <span>{l.name}</span>
                        {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                    작업일자 *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  {errors.date && <p className="text-rose-500 text-[10px] mt-0.5">{errors.date}</p>}
                </div>

                {/* Shift Toggle */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                    근무조 *
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, shift: "주간" })}
                      className={`py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        formData.shift === "주간"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>주간</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, shift: "야간" })}
                      className={`py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        formData.shift === "야간"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>야간</span>
                    </button>
                  </div>
                </div>

                {/* Worker Dropdown */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                    작업자명 (작업조장 / 담당) *
                  </label>
                  <select
                    value={formData.worker}
                    onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-teal-500 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer shadow-xs text-xs sm:text-sm"
                  >
                    <option value="">-- 작업자를 선택하세요 --</option>
                    {WORKER_PRESETS.map((w) => (
                      <option key={w.name} value={`${w.name} ${w.title}`}>
                        {w.name} {w.title} ({w.role})
                      </option>
                    ))}
                    <option value="현해">현해</option>
                    <option value="TEST">TEST</option>
                  </select>
                  {errors.worker && <p className="text-rose-500 text-[10px] mt-0.5">{errors.worker}</p>}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Section 2: Multi-Item Production Management (2. 작업현황 - 생산현황) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ② 생산 품목 현황 (다품종 교체 생산 지원)
                </span>
                <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                  {formData.lineName || "PCM #1 LINE"} · 등록 품목 {(formData.items || []).length}개
                </span>
              </div>

              {errors.items && <p className="text-rose-500 text-xs font-bold">{errors.items}</p>}

              {/* List of Item Cards */}
              <div className="space-y-3">
                {(formData.items || []).map((item, index) => {
                  const itActual = Number(item?.actualQty) || 0;
                  const itGood = Number(item?.goodQty) || 0;
                  const itTarget = Number(item?.targetQty) || 0;
                  const itYield = itActual > 0 ? ((itGood / itActual) * 100).toFixed(1) : "100.0";
                  const itAttain = itTarget > 0 ? ((itActual / itTarget) * 100).toFixed(1) : "100.0";
                  const currentVal = `${item?.vehicle || ""}:::${item?.itemName || ""}`;

                  return (
                    <div
                      key={item?.id || index}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200/90 dark:border-blue-900/60 shadow-xs space-y-3"
                    >
                      {/* Item Card Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs">
                            품목 #{index + 1}
                          </span>
                          {index > 0 && (
                            <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                              🔄 품종 교체 생산
                            </span>
                          )}
                          {item?.vehicle && item?.itemName && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs hidden sm:inline">
                              [{item.vehicle}] {item.itemName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            수율 {itYield}% (달성 {itAttain}%)
                          </span>
                          {(formData.items || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              title="이 품목 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">삭제</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Item Dropdown */}
                      <div>
                        <label className="block text-[11px] font-black text-blue-900 dark:text-blue-300 mb-1">
                          📦 생산 품명 선택 (차종/품명 이니셜순 정렬) *
                        </label>
                        <select
                          value={currentVal}
                          onChange={(e) => handleItemFieldChange(index, "itemSelect", e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-600 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer shadow-xs"
                        >
                          <option value="">
                            -- [{CLEAN_LINE_OPTIONS.find((l) => l.id === formData?.lineId || l.fullName === formData?.lineId || l.name === formData?.lineId)?.name || "라인"}] 아이템을 선택하세요 (총 {activeLineItems.length}개) --
                          </option>
                          {activeLineItems.map((it) => (
                            <option key={it.id} value={`${it.vehicle}:::${it.itemName}`}>
                              [{it.vehicle}] {it.itemName}{it.isAS ? " 🛠️(A/S)" : ""}
                            </option>
                          ))}
                        </select>

                        {/* Minimal Raw Material BOM & Weight/LOT Direct Inputs (한줄짜리 간략한 뱃지) */}
                        {(() => {
                          if (!item?.vehicle || !item?.itemName) return null;
                          const itemBOM = getMaterialBOMForItem(item.vehicle, item.itemName) || {};

                          const ALL_MATERIAL_SLOTS = [
                            {
                              id: "rubberType",
                              weightKey: "rubberWeight",
                              lotKey: "rubberLot",
                              icon: "⬛",
                              label: "연고무1",
                              val: (formData?.rawMaterials?.rubberType !== undefined && formData?.rawMaterials?.rubberType !== "") ? formData.rawMaterials.rubberType : (itemBOM.rubberType || "W60433"),
                              defaultVal: EPDM_RUBBERS[0]?.name || "W60712$2",
                              containerCls: "bg-slate-900/90 dark:bg-slate-950 border-slate-700 text-slate-100",
                              specTextCls: "text-amber-300",
                              required: true
                            },
                            {
                              id: "rubberType2",
                              weightKey: "rubberWeight2",
                              lotKey: "rubberLot2",
                              icon: "⬛",
                              label: "연고무2",
                              val: formData?.rawMaterials?.rubberType2 !== undefined ? formData.rawMaterials.rubberType2 : (itemBOM.rubberType2 || ""),
                              defaultVal: EPDM_RUBBERS[1]?.name || "W60712$1",
                              containerCls: "bg-slate-900/90 dark:bg-slate-950 border-slate-700 text-slate-100",
                              specTextCls: "text-amber-300",
                              required: false
                            },
                            {
                              id: "compoundType",
                              weightKey: "compoundWeight",
                              lotKey: "compoundLot",
                              icon: "🧬",
                              label: "컴파운드1",
                              val: (formData?.rawMaterials?.compoundType !== undefined && formData?.rawMaterials?.compoundType !== "") ? formData.rawMaterials.compoundType : (itemBOM.compoundType || "IA4-75B_1"),
                              defaultVal: EPDM_COMPOUNDS[0]?.name || "IA4-75B_1",
                              containerCls: "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                              specTextCls: "text-emerald-300",
                              required: true
                            },
                            {
                              id: "compoundType2",
                              weightKey: "compoundWeight2",
                              lotKey: "compoundLot2",
                              icon: "🧬",
                              label: "컴파운드2",
                              val: formData?.rawMaterials?.compoundType2 !== undefined ? formData.rawMaterials.compoundType2 : (itemBOM.compoundType2 || ""),
                              defaultVal: EPDM_COMPOUNDS[1]?.name || "B64E",
                              containerCls: "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                              specTextCls: "text-emerald-300",
                              required: false
                            },
                            {
                              id: "compoundType3",
                              weightKey: "compoundWeight3",
                              lotKey: "compoundLot3",
                              icon: "🧬",
                              label: "컴파운드3",
                              val: formData?.rawMaterials?.compoundType3 !== undefined ? formData.rawMaterials.compoundType3 : (itemBOM.compoundType3 || ""),
                              defaultVal: EPDM_COMPOUNDS[2]?.name || "L2KIA7-35B",
                              containerCls: "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                              specTextCls: "text-emerald-300",
                              required: false
                            },
                            {
                              id: "insertType",
                              weightKey: "insertWeight",
                              lotKey: "insertLot",
                              icon: "⚙️",
                              label: "심금",
                              val: (formData?.rawMaterials?.insertType !== undefined && formData?.rawMaterials?.insertType !== "") ? formData.rawMaterials.insertType : (itemBOM.insertType || "SUS430(0.4*51*3)"),
                              defaultVal: EPDM_INSERTS[0]?.name || "SUS430(0.4*51*3)",
                              containerCls: "bg-amber-950/80 dark:bg-amber-950 border-amber-700/80 text-amber-100",
                              specTextCls: "text-amber-300",
                              required: false
                            },
                            {
                              id: "coatingType",
                              weightKey: "coatingWeight",
                              lotKey: "coatingLot",
                              icon: "🧪",
                              label: "코팅액",
                              val: (formData?.rawMaterials?.coatingType !== undefined && formData?.rawMaterials?.coatingType !== "") ? formData.rawMaterials.coatingType : (itemBOM.coatingType || "HSC-2000-B-3"),
                              defaultVal: EPDM_COATINGS[0]?.name || "HSC-2000-B-3",
                              containerCls: "bg-sky-950/80 dark:bg-sky-950 border-sky-700/80 text-sky-100",
                              specTextCls: "text-sky-300",
                              required: false
                            }
                          ];

                          const activeSlots = ALL_MATERIAL_SLOTS.filter(s => s.val && typeof s.val === "string" && s.val.trim() !== "" && s.val.trim() !== "미사용");
                          const unusedSlots = ALL_MATERIAL_SLOTS.filter(s => !s.val || typeof s.val !== "string" || s.val.trim() === "" || s.val.trim() === "미사용");

                          return (
                            <div className="pt-2 pb-0.5 space-y-2">
                              {activeSlots.length > 0 ? (
                                <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950 border-2 border-slate-700/80 shadow-md space-y-2">
                                  {/* Header: Concise single-line badge */}
                                  <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1 border-b border-slate-800">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-xs">
                                        🌿 원재료 BOM
                                      </span>
                                      <span className="text-[11px] font-bold text-emerald-300">
                                        투입 중량 &amp; LOT
                                      </span>
                                    </div>

                                    {/* Quick Add Unused Materials if needed */}
                                    {unusedSlots.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-[10px] text-slate-400 font-bold">➕ 추가:</span>
                                        {unusedSlots.map((u) => (
                                          <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => {
                                              const bVal = itemBOM[u.id];
                                              const valToSet = (bVal && bVal !== "미사용") ? bVal : u.defaultVal;
                                              handleNestedFieldChange("rawMaterials", u.id, valToSet);
                                            }}
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition active:scale-95 cursor-pointer flex items-center gap-0.5"
                                          >
                                            <span>{u.icon}</span>
                                            <span>+{u.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Single-line compact material cards */}
                                  <div className="space-y-1.5">
                                    {activeSlots.map((slot) => {
                                      const currentWeight = formData.rawMaterials?.[slot.weightKey] ?? "";
                                      const currentLot = formData.rawMaterials?.[slot.lotKey] || "";

                                      return (
                                        <div
                                          key={slot.id}
                                          className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-xs ${slot.containerCls}`}
                                        >
                                          {/* Left Badge: Name & Spec */}
                                          <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-[140px] sm:w-[170px] shrink-0">
                                            <div className="flex items-center gap-1 truncate">
                                              <span className="text-xs">{slot.icon}</span>
                                              <span className="opacity-80 font-bold text-[10.5px]">{slot.label}:</span>
                                              <span className={`text-xs font-black truncate ${slot.specTextCls}`}>{slot.val}</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleNestedFieldChange("rawMaterials", slot.id, "미사용")}
                                              className="sm:hidden text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                                              title="이 자재 미사용 처리"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Right Direct Inputs: 중량(kg) & LOT 넘버 in a single line */}
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className="flex items-center gap-1 flex-1">
                                              <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap shrink-0">
                                                중량(kg)
                                              </span>
                                              <input
                                                type="number"
                                                step="0.1"
                                                value={currentWeight}
                                                onChange={(e) => handleNestedFieldChange("rawMaterials", slot.weightKey, e.target.value)}
                                                placeholder="0.0"
                                                className="w-full px-2 py-1 rounded-lg bg-slate-800/90 dark:bg-slate-900 border border-emerald-500/80 text-xs font-black text-emerald-300 placeholder-emerald-600/60 text-right focus:ring-1 focus:ring-emerald-400 focus:outline-hidden"
                                              />
                                            </div>
                                            <div className="flex items-center gap-1 flex-1">
                                              <span className="text-[10px] font-black text-indigo-300 whitespace-nowrap shrink-0">
                                                LOT
                                              </span>
                                              <input
                                                type="text"
                                                value={currentLot}
                                                onChange={(e) => handleNestedFieldChange("rawMaterials", slot.lotKey, e.target.value)}
                                                placeholder="LOT No."
                                                className="w-full px-2 py-1 rounded-lg bg-slate-800/90 dark:bg-slate-900 border border-indigo-400/80 text-xs font-bold text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleNestedFieldChange("rawMaterials", slot.id, "미사용")}
                                              className="hidden sm:block text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer shrink-0"
                                              title="이 자재 미사용 처리"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span>🌿</span>
                                    <span>선택된 품목에 매칭된 BOM 원재료가 없습니다.</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] text-slate-500 font-bold">자재 추가:</span>
                                    {unusedSlots.map((u) => (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleNestedFieldChange("rawMaterials", u.id, u.defaultVal)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 cursor-pointer"
                                      >
                                        <span>{u.icon}</span>
                                        <span>+{u.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Item Quantities */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                            지시/계획수량 (m)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.targetQty}
                            onChange={(e) => handleItemFieldChange(index, "targetQty", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                            작업/총실적 (m) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.actualQty}
                            onChange={(e) => handleItemFieldChange(index, "actualQty", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 font-black text-right text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                            양품수량 (m) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.goodQty}
                            onChange={(e) => handleItemFieldChange(index, "goodQty", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-blue-700 dark:text-blue-400 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                            불량수량 (m)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.defectQty}
                            onChange={(e) => handleItemFieldChange(index, "defectQty", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-rose-600 dark:text-rose-400 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                            스크랩 (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.scrapKg}
                            onChange={(e) => handleItemFieldChange(index, "scrapKg", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-amber-600 dark:text-amber-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ➕ Add Item Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>➕ 생산품목 추가 (주/야간 품종 교체 생산)</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* Section 3: Curing Temp, Water Temp & Coating Pressure (제목 삭제 및 뱃지만 심플 구성) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  ③ 작업조건
                </span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-black text-[10.5px] border border-orange-300">
                    가류조
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[10.5px] border border-teal-300">
                    온조기
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[10.5px] border border-sky-300">
                    코팅압력
                  </span>
                </div>
              </div>

              {/* 1. 가류조 온도: 1~13존 한줄 패널 */}
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-orange-300/80 dark:border-orange-900/60 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-black text-xs">
                    🔥 가류조 (210±20℃)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = prompt("13개 가류존에 일괄 적용할 온도를 입력하세요(℃):", "210.0");
                      if (val && !isNaN(Number(val))) {
                        const num = Number(val);
                        setFormData((prev) => ({
                          ...prev,
                          conditions: {
                            ...(prev.conditions || {}),
                            cureZoneTemp: String(num),
                            pcmZones: Array(13).fill(num)
                          }
                        }));
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-black border border-orange-200 transition cursor-pointer"
                  >
                    ⚡ 일괄설정
                  </button>
                </div>

                {/* 13 Zones Horizontal Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth">
                  {Array.from({ length: 13 }).map((_, zIdx) => {
                    const zoneNum = zIdx + 1;
                    const currentZoneVal = formData.conditions?.pcmZones?.[zIdx] ?? EXTRUSION_STANDARD_SPECS.pcmZones[zIdx] ?? 210.0;
                    return (
                      <div
                        key={`pcm_zone_${zoneNum}`}
                        className="flex flex-col items-center justify-between min-w-[56px] sm:min-w-[62px] p-1.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/80 shrink-0"
                      >
                        <span className="text-[9.5px] font-black text-orange-800 dark:text-orange-300">
                          {zoneNum}존
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          value={currentZoneVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const curZones = Array.isArray(prev.conditions?.pcmZones) && prev.conditions.pcmZones.length === 13
                                ? [...prev.conditions.pcmZones]
                                : [...EXTRUSION_STANDARD_SPECS.pcmZones];
                              curZones[zIdx] = val === "" ? "" : Number(val);
                              return {
                                ...prev,
                                conditions: {
                                  ...(prev.conditions || {}),
                                  pcmZones: curZones,
                                  cureZoneTemp: String(curZones[0] || 210.0)
                                }
                              };
                            });
                          }}
                          className="w-full text-center bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded py-1 font-black text-xs text-orange-950 dark:text-orange-100 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                        />
                        <span className="text-[8.5px] text-slate-400 font-bold">℃</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 온조기 온도: 1~4구간 한줄 패널 */}
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-900/60 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-black text-xs">
                    💧 온조기 (50±5℃)
                  </span>
                </div>

                {/* 4 Sections Grid */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[
                    { idx: 0, label: "1구간", defaultVal: 47.0 },
                    { idx: 1, label: "2구간", defaultVal: 48.5 },
                    { idx: 2, label: "3구간", defaultVal: 49.0 },
                    { idx: 3, label: "4구간", defaultVal: 47.5 }
                  ].map((sec) => {
                    const curSecVal = formData.conditions?.waterZones?.[sec.idx] ?? EXTRUSION_STANDARD_SPECS.waterZones?.[sec.idx] ?? sec.defaultVal;
                    return (
                      <div
                        key={`water_zone_${sec.idx}`}
                        className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80"
                      >
                        <span className="text-[10px] font-black text-teal-800 dark:text-teal-300">
                          {sec.label}
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          value={curSecVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const curWaterZones = Array.isArray(prev.conditions?.waterZones) && prev.conditions.waterZones.length === 4
                                ? [...prev.conditions.waterZones]
                                : [47.0, 48.5, 49.0, 47.5];
                              curWaterZones[sec.idx] = val === "" ? "" : Number(val);
                              return {
                                ...prev,
                                conditions: {
                                  ...(prev.conditions || {}),
                                  waterZones: curWaterZones,
                                  waterTemp: String(curWaterZones[0] || 50.0)
                                }
                              };
                            });
                          }}
                          className="w-full text-center bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded py-1 font-black text-xs sm:text-sm text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                        />
                        <span className="text-[8.5px] text-slate-400 font-bold">℃</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. 코팅 분사압력: 1~3번건 한줄 패널 (제목 삭제 및 뱃지 3개) */}
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-300/80 dark:border-sky-900/60 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-black text-xs">
                    🧪 코팅압력 (2.5±0.3 bar)
                  </span>
                </div>

                {/* 3 Guns Grid (3개의 뱃지만 깔끔하게 노출) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { id: "sprayGun1", label: "1번건", defaultVal: "2.5" },
                    { id: "sprayGun2", label: "2번건", defaultVal: "2.6" },
                    { id: "sprayGun3", label: "3번건", defaultVal: "2.5" }
                  ].map((gun) => {
                    const curGunVal = formData.conditions?.[gun.id] ?? gun.defaultVal;
                    return (
                      <div
                        key={gun.id}
                        className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80"
                      >
                        <span className="text-[10px] font-black text-sky-800 dark:text-sky-300">
                          {gun.label}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          value={curGunVal}
                          onChange={(e) => handleNestedFieldChange("conditions", gun.id, e.target.value)}
                          placeholder="2.5"
                          className="w-full text-center bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded py-1 font-black text-xs sm:text-sm text-sky-950 dark:text-sky-100 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                        <span className="text-[8.5px] text-slate-400 font-bold">bar</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Section 4: 비가동 및 불량내역 (간결하고 직관적인 통합 등록) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              {/* Header & Badges */}
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-amber-500" />
                    ④ 비가동 및 불량내역
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    총 {dtEvents.length}건
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    ⏱️ {totalDowntimeMinutes}분
                  </span>
                  {totalDowntimeScrapKg > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                      🗑️ {totalDowntimeScrapKg}kg
                    </span>
                  )}
                </div>
              </div>

              {/* Simple Clean Input Card */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs space-y-2">
                {/* 1행: 항목(22개) / 시작~종료 / 소요시간 / 폐기량 */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
                  {/* 항목 선택 (4 cols) */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      불량/비가동 항목 (22종)
                    </label>
                    <select
                      value={downtimeDraft.category || "압개시"}
                      onChange={(e) => handleDowntimeDraftChange("category", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-800 text-xs font-black text-amber-950 dark:text-amber-200 cursor-pointer focus:ring-1 focus:ring-amber-500"
                    >
                      {DOWNTIME_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({["압개시", "형교환", "종료", "설비이상", "다이스수정", "기술TRY"].includes(c.id) ? "비가동" : "불량"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 시작 ~ 종료 시간 (4 cols) */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      시간 (시작 ~ 종료)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={downtimeDraft.startTime || ""}
                        onChange={(e) => handleDowntimeDraftChange("startTime", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400 text-xs">~</span>
                      <input
                        type="time"
                        value={downtimeDraft.endTime || ""}
                        onChange={(e) => handleDowntimeDraftChange("endTime", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* 소요시간 (2 cols) */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      소요시간(분)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={downtimeDraft.minutes ?? ""}
                      onChange={(e) => handleDowntimeDraftChange("minutes", e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-800 text-xs font-black text-right text-rose-700 dark:text-rose-300"
                    />
                  </div>

                  {/* 폐기량 (2 cols) */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      폐기중량(kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={downtimeDraft.scrapKg ?? ""}
                      onChange={(e) => handleDowntimeDraftChange("scrapKg", e.target.value)}
                      placeholder="0.0"
                      className="w-full px-2 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-slate-800 text-xs font-black text-right text-orange-700 dark:text-orange-300"
                    />
                  </div>
                </div>

                {/* 2행: 내역 직접입력/드롭다운선택 + [등록] 버튼 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={downtimeDraft.detail || ""}
                    onChange={(e) => handleDowntimeDraftChange("detail", e.target.value)}
                    placeholder="발생 내역 및 조치 내용을 입력하세요 (직접 입력 또는 자동 문구 수정)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddDraftEvent}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>등록</span>
                  </button>
                </div>
              </div>

              {/* 등록된 목록 (간결한 1줄 카드 목록) */}
              {dtEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {dtEvents.map((ev, idx) => {
                    const isDefect = ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category) || ev.type === "불량";
                    return (
                      <div
                        key={ev.id || `dt_item_${idx}`}
                        className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-400 transition"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            isDefect ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {ev.category || "압개시"}
                          </span>

                          {(ev.startTime || ev.endTime) && (
                            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                              {ev.startTime || "--:--"}~{ev.endTime || "--:--"}
                            </span>
                          )}

                          {ev.minutes > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[10.5px] font-black shrink-0">
                              {ev.minutes}분
                            </span>
                          )}

                          {Number(ev.scrapKg) > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 text-[10.5px] font-black shrink-0">
                              폐기 {ev.scrapKg}kg
                            </span>
                          )}

                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate min-w-[80px]" title={ev.detail}>
                            {ev.detail || "-"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDowntimeEvent(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2.5 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  등록된 비가동 및 불량 내역이 없습니다.
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* Section 5: Notes & Handover */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="block font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                ⑤ 특이사항 및 교대 인수인계 사항
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="교대 작업자에게 전달할 내용이나 설비 이상 조짐, 원료 수급 이슈 등을 자유롭게 기재하세요."
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
              />
            </div>
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
