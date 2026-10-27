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
import { getWorkLogText } from "../../services/workLogI18nService";
import { useModalHistory } from "../../utils/modalHistory";
import CommonDowntimeDefectPanel from "../common/CommonDowntimeDefectPanel";
import ExtrusionReportHeaderNav from "./report/ExtrusionReportHeaderNav";
import ExtrusionReportTpmPanel from "./report/ExtrusionReportTpmPanel";
import ExtrusionReportBasicInfo from "./report/ExtrusionReportBasicInfo";
import ExtrusionReportItemProduction from "./report/ExtrusionReportItemProduction";
import ExtrusionReportMachineConditions from "./report/ExtrusionReportMachineConditions";
import ExtrusionReportNotesAndDowntime from "./report/ExtrusionReportNotesAndDowntime";
import ExtrusionReportFooter from "./report/ExtrusionReportFooter";
import ExtrusionReportPhotoModal from "./report/ExtrusionReportPhotoModal";

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
  const bom = getMaterialBOMForItem(first.vehicle, first.itemName, lineId) || {};
  return {
    id: `item_${suffix}_${Math.random().toString(36).substring(2, 6)}`,
    vehicle: first.vehicle,
    itemName: first.itemName,
    itemCode: "",
    targetQty: 2000,
    actualQty: 1950,
    goodQty: 1900,
    defectQty: 50,
    scrapKg: 7.5,
    rawMaterials: {
      rubberType: bom.rubberType || "",
      rubberWeight: "",
      rubberLot: "",
      rubberType2: bom.rubberType2 || "",
      rubberWeight2: "",
      rubberLot2: "",
      coatingType: bom.coatingType || "미사용",
      coatingWeight: "",
      coatingLot: "",
      insertType: bom.insertType || "미사용",
      insertWeight: "",
      insertLot: "",
      compoundType: bom.compoundType || "",
      compoundWeight: "",
      compoundLot: "",
      compoundType2: bom.compoundType2 || "",
      compoundWeight2: "",
      compoundLot2: "",
      compoundType3: bom.compoundType3 || "",
      compoundWeight3: "",
      compoundLot3: "",
      compoundType4: bom.compoundType4 || "",
      compoundWeight4: "",
      compoundLot4: ""
    }
  };
};

// Helper: map items from initialData, ensuring each item has its own isolated rawMaterials
const mapInitialItems = (initialData, defaultLine = "pcm1") => {
  const lineId = initialData?.lineId || defaultLine;
  if (Array.isArray(initialData?.items) && initialData.items.length > 0) {
    return initialData.items.map((it, i) => {
      const itBOM = getMaterialBOMForItem(it.vehicle, it.itemName, lineId) || {};
      const itRaw = it.rawMaterials || (i === 0 ? initialData.rawMaterials : null) || {};
      return {
        id: it.id || `item_${i + 1}`,
        vehicle: it.vehicle || "",
        itemName: it.itemName || "",
        itemCode: it.itemCode || "",
        targetQty: it.targetQty ?? 2000,
        actualQty: it.actualQty ?? 1950,
        goodQty: it.goodQty ?? 1900,
        defectQty: it.defectQty ?? 50,
        scrapKg: it.scrapKg ?? 7.5,
        rawMaterials: {
          rubberType: itRaw.rubberType !== undefined ? itRaw.rubberType : (itBOM.rubberType || ""),
          rubberWeight: itRaw.rubberWeight ?? "",
          rubberLot: itRaw.rubberLot || "",
          rubberType2: itRaw.rubberType2 !== undefined ? itRaw.rubberType2 : (itBOM.rubberType2 || ""),
          rubberWeight2: itRaw.rubberWeight2 ?? "",
          rubberLot2: itRaw.rubberLot2 || "",
          coatingType: itRaw.coatingType !== undefined ? itRaw.coatingType : (itBOM.coatingType || "미사용"),
          coatingWeight: itRaw.coatingWeight ?? "",
          coatingLot: itRaw.coatingLot || "",
          insertType: itRaw.insertType !== undefined ? itRaw.insertType : (itBOM.insertType || "미사용"),
          insertWeight: itRaw.insertWeight ?? "",
          insertLot: itRaw.insertLot || "",
          compoundType: itRaw.compoundType !== undefined ? itRaw.compoundType : (itBOM.compoundType || ""),
          compoundWeight: itRaw.compoundWeight ?? "",
          compoundLot: itRaw.compoundLot || "",
          compoundType2: itRaw.compoundType2 !== undefined ? itRaw.compoundType2 : (itBOM.compoundType2 || ""),
          compoundWeight2: itRaw.compoundWeight2 ?? "",
          compoundLot2: itRaw.compoundLot2 || "",
          compoundType3: itRaw.compoundType3 !== undefined ? itRaw.compoundType3 : (itBOM.compoundType3 || ""),
          compoundWeight3: itRaw.compoundWeight3 ?? "",
          compoundLot3: itRaw.compoundLot3 || "",
          compoundType4: itRaw.compoundType4 !== undefined ? itRaw.compoundType4 : (itBOM.compoundType4 || ""),
          compoundWeight4: itRaw.compoundWeight4 ?? "",
          compoundLot4: itRaw.compoundLot4 || ""
        }
      };
    });
  } else if (initialData?.vehicle || initialData?.itemName) {
    const v = initialData.vehicle || "BC4T";
    const n = initialData.itemName || "D/SIDE D";
    const bom = getMaterialBOMForItem(v, n, lineId) || {};
    const itRaw = initialData?.rawMaterials || {};
    return [
      {
        id: "item_1",
        vehicle: v,
        itemName: n,
        itemCode: initialData?.itemCode || "",
        targetQty: initialData?.targetQty ?? 4000,
        actualQty: initialData?.actualQty ?? 3950,
        goodQty: initialData?.goodQty ?? 3880,
        defectQty: initialData?.defectQty ?? 70,
        scrapKg: initialData?.scrapKg ?? 15.0,
        rawMaterials: {
          rubberType: itRaw.rubberType !== undefined ? itRaw.rubberType : (bom.rubberType || ""),
          rubberWeight: itRaw.rubberWeight ?? "",
          rubberLot: itRaw.rubberLot || "",
          rubberType2: itRaw.rubberType2 !== undefined ? itRaw.rubberType2 : (bom.rubberType2 || ""),
          rubberWeight2: itRaw.rubberWeight2 ?? "",
          rubberLot2: itRaw.rubberLot2 || "",
          coatingType: itRaw.coatingType !== undefined ? itRaw.coatingType : (bom.coatingType || "미사용"),
          coatingWeight: itRaw.coatingWeight ?? "",
          coatingLot: itRaw.coatingLot || "",
          insertType: itRaw.insertType !== undefined ? itRaw.insertType : (bom.insertType || "미사용"),
          insertWeight: itRaw.insertWeight ?? "",
          insertLot: itRaw.insertLot || "",
          compoundType: itRaw.compoundType !== undefined ? itRaw.compoundType : (bom.compoundType || ""),
          compoundWeight: itRaw.compoundWeight ?? "",
          compoundLot: itRaw.compoundLot || "",
          compoundType2: itRaw.compoundType2 !== undefined ? itRaw.compoundType2 : (bom.compoundType2 || ""),
          compoundWeight2: itRaw.compoundWeight2 ?? "",
          compoundLot2: itRaw.compoundLot2 || "",
          compoundType3: itRaw.compoundType3 !== undefined ? itRaw.compoundType3 : (bom.compoundType3 || ""),
          compoundWeight3: itRaw.compoundWeight3 ?? "",
          compoundLot3: itRaw.compoundLot3 || "",
          compoundType4: itRaw.compoundType4 !== undefined ? itRaw.compoundType4 : (bom.compoundType4 || ""),
          compoundWeight4: itRaw.compoundWeight4 ?? "",
          compoundLot4: itRaw.compoundLot4 || ""
        }
      }
    ];
  }
  return [createDefaultItem(lineId)];
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
  useModalHistory(isOpen, onClose, "extrusionWorkReportModal");
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
      const items = mapInitialItems(initialData, initialData?.lineId || "pcm1");
      const primaryRaw = items[0]?.rawMaterials || {};

      return {
        ...initialData,
        items,
        tpmIssueText: initialData?.tpmIssueText || initialData?.tpmIssueReport?.text || "",
        tpmIssuePhotos: Array.isArray(initialData?.tpmIssuePhotos)
          ? initialData.tpmIssuePhotos
          : (Array.isArray(initialData?.tpmIssueReport?.photos) ? initialData.tpmIssueReport.photos : []),
        rawMaterials: {
          ...primaryRaw
        },
        defectBreakdown: {
          cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
          startLossKg: initialData?.defectBreakdown?.startLossKg || "",
          appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
        },
        downtimeEvents: Array.isArray(initialData?.downtimeEvents) && initialData.downtimeEvents.length > 0
          ? initialData.downtimeEvents.map((e, idx) => ({
              id: e.id || `dt_${idx + 1}`,
              type: e.type || (DOWNTIME_CATEGORIES.find((c) => c.id === e.category)?.type || (["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(e.category) ? "불량" : "비가동")),
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
          extruder70Rpm: initialData?.conditions?.extruder70Rpm || initialData?.conditions?.extruder60Rpm || EXTRUSION_STANDARD_SPECS.extruder70Rpm,
          extruder60Rpm: initialData?.conditions?.extruder60Rpm || initialData?.conditions?.extruder70Rpm || EXTRUSION_STANDARD_SPECS.extruder60Rpm,
          haulOffSpeed: initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.haulOffSpeed,
          waterZones110: {
            screw: initialData?.conditions?.waterZones110?.screw || initialData?.conditions?.water110Screw || "50.0",
            cylinder1: initialData?.conditions?.waterZones110?.cylinder1 || initialData?.conditions?.water110Cyl1 || "50.0",
            cylinder2: initialData?.conditions?.waterZones110?.cylinder2 || initialData?.conditions?.water110Cyl2 || "50.0",
            cylinder3: initialData?.conditions?.waterZones110?.cylinder3 || initialData?.conditions?.water110Cyl3 || "50.0",
            head: initialData?.conditions?.waterZones110?.head || initialData?.conditions?.water110Head || "50.0"
          },
          waterZones70: {
            screw: initialData?.conditions?.waterZones70?.screw || initialData?.conditions?.water70Screw || "50.0",
            cylinder1: initialData?.conditions?.waterZones70?.cylinder1 || initialData?.conditions?.water70Cyl1 || "50.0",
            cylinder2: initialData?.conditions?.waterZones70?.cylinder2 || initialData?.conditions?.water70Cyl2 || "50.0",
            cylinder3: initialData?.conditions?.waterZones70?.cylinder3 || initialData?.conditions?.water70Cyl3 || "50.0"
          },
          waterTemp: initialData?.conditions?.waterTemp || EXTRUSION_STANDARD_SPECS.waterTemp,
          waterZones: Array.isArray(initialData?.conditions?.waterZones) && initialData.conditions.waterZones.length === 4
            ? initialData.conditions.waterZones
            : [...(EXTRUSION_STANDARD_SPECS.waterZones || [50.0, 50.0, 50.0, 50.0])],
          cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || EXTRUSION_STANDARD_SPECS.cureZoneTemp,
          sprayGun1: initialData?.conditions?.sprayGun1 || EXTRUSION_STANDARD_SPECS.sprayGun1,
          sprayGun2: initialData?.conditions?.sprayGun2 || EXTRUSION_STANDARD_SPECS.sprayGun2,
          sprayGun3: initialData?.conditions?.sprayGun3 || EXTRUSION_STANDARD_SPECS.sprayGun3,
          sprayGun4: initialData?.conditions?.sprayGun4 || EXTRUSION_STANDARD_SPECS.sprayGun4,
          coatingThicknessBase: initialData?.conditions?.coatingThicknessBase || EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
          coatingThicknessOuter: initialData?.conditions?.coatingThicknessOuter || EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
          coatingThicknessInner: initialData?.conditions?.coatingThicknessInner || EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
          pcmZones: Array.isArray(initialData?.conditions?.pcmZones) && initialData.conditions.pcmZones.length === 13
            ? initialData.conditions.pcmZones
            : [...EXTRUSION_STANDARD_SPECS.pcmZones],
          // TPE 4개 압출기 속도 & 압출기온도(±10℃) & 냉각수온도
          tpeExtruder100Rpm: initialData?.conditions?.tpeExtruder100Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder100Rpm,
          tpeExtruder80Rpm: initialData?.conditions?.tpeExtruder80Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder80Rpm,
          tpeExtruder65Rpm: initialData?.conditions?.tpeExtruder65Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder65Rpm,
          tpeExtruder35Rpm: initialData?.conditions?.tpeExtruder35Rpm || initialData?.conditions?.tpeExtruder45Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
          tpeExtruder45Rpm: initialData?.conditions?.tpeExtruder35Rpm || initialData?.conditions?.tpeExtruder45Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
          tpeCoolingWaterTemp: initialData?.conditions?.tpeCoolingWaterTemp || EXTRUSION_STANDARD_SPECS.tpeCoolingWaterTemp,
          tpeTemps100: {
            screw: initialData?.conditions?.tpeTemps100?.screw || EXTRUSION_STANDARD_SPECS.tpeTemps100.screw,
            cylinder1: initialData?.conditions?.tpeTemps100?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder1,
            cylinder2: initialData?.conditions?.tpeTemps100?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder2,
            cylinder3: initialData?.conditions?.tpeTemps100?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder3,
            cylinder4: initialData?.conditions?.tpeTemps100?.cylinder4 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder4,
            cylinder5: initialData?.conditions?.tpeTemps100?.cylinder5 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder5,
            cylinder6: initialData?.conditions?.tpeTemps100?.cylinder6 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder6,
            adapter: initialData?.conditions?.tpeTemps100?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps100.adapter,
            die: initialData?.conditions?.tpeTemps100?.die || EXTRUSION_STANDARD_SPECS.tpeTemps100.die,
            head1: initialData?.conditions?.tpeTemps100?.head1 || EXTRUSION_STANDARD_SPECS.tpeTemps100.head1,
            head2: initialData?.conditions?.tpeTemps100?.head2 || EXTRUSION_STANDARD_SPECS.tpeTemps100.head2,
            hopperDryer: initialData?.conditions?.tpeTemps100?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps100.hopperDryer
          },
          tpeTemps80: {
            cylinder1: initialData?.conditions?.tpeTemps80?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder1,
            cylinder2: initialData?.conditions?.tpeTemps80?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder2,
            cylinder3: initialData?.conditions?.tpeTemps80?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder3,
            cylinder4: initialData?.conditions?.tpeTemps80?.cylinder4 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder4,
            adapter: initialData?.conditions?.tpeTemps80?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps80.adapter,
            nozzle: initialData?.conditions?.tpeTemps80?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps80.nozzle,
            hopperDryer: initialData?.conditions?.tpeTemps80?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps80.hopperDryer
          },
          tpeTemps65: {
            cylinder1: initialData?.conditions?.tpeTemps65?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder1,
            cylinder2: initialData?.conditions?.tpeTemps65?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder2,
            cylinder3: initialData?.conditions?.tpeTemps65?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder3,
            adapter: initialData?.conditions?.tpeTemps65?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps65.adapter,
            nozzle: initialData?.conditions?.tpeTemps65?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps65.nozzle,
            hopperDryer: initialData?.conditions?.tpeTemps65?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps65.hopperDryer
          },
          tpeTemps35: {
            cylinder1: initialData?.conditions?.tpeTemps35?.cylinder1 || initialData?.conditions?.tpeTemps45?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder1,
            cylinder2: initialData?.conditions?.tpeTemps35?.cylinder2 || initialData?.conditions?.tpeTemps45?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder2,
            adapter: initialData?.conditions?.tpeTemps35?.adapter || initialData?.conditions?.tpeTemps45?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps35.adapter,
            nozzle: initialData?.conditions?.tpeTemps35?.nozzle || initialData?.conditions?.tpeTemps45?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps35.nozzle,
            hopperDryer: initialData?.conditions?.tpeTemps35?.hopperDryer || initialData?.conditions?.tpeTemps45?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps35.hopperDryer
          },
          tpeTemps45: {
            cylinder1: initialData?.conditions?.tpeTemps35?.cylinder1 || initialData?.conditions?.tpeTemps45?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder1,
            cylinder2: initialData?.conditions?.tpeTemps35?.cylinder2 || initialData?.conditions?.tpeTemps45?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder2,
            adapter: initialData?.conditions?.tpeTemps35?.adapter || initialData?.conditions?.tpeTemps45?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps35.adapter,
            nozzle: initialData?.conditions?.tpeTemps35?.nozzle || initialData?.conditions?.tpeTemps45?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps35.nozzle,
            hopperDryer: initialData?.conditions?.tpeTemps35?.hopperDryer || initialData?.conditions?.tpeTemps45?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps35.hopperDryer
          },
          // PVC 80Ø 속도 & 7구간 압출기온도(±10℃) & 냉각조/본드도포/후로킹/건조로
          pvcExtruder80Rpm: initialData?.conditions?.pvcExtruder80Rpm || EXTRUSION_STANDARD_SPECS.pvcExtruder80Rpm,
          pvcHaulOffSpeed: initialData?.conditions?.pvcHaulOffSpeed || initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.pvcHaulOffSpeed,
          pvcCoolingTankTemp: initialData?.conditions?.pvcCoolingTankTemp || EXTRUSION_STANDARD_SPECS.pvcCoolingTankTemp,
          pvcBondFeeder1Rpm: initialData?.conditions?.pvcBondFeeder1Rpm || EXTRUSION_STANDARD_SPECS.pvcBondFeeder1Rpm,
          pvcBondFeeder2Rpm: initialData?.conditions?.pvcBondFeeder2Rpm || EXTRUSION_STANDARD_SPECS.pvcBondFeeder2Rpm,
          pvcBondCoating: initialData?.conditions?.pvcBondCoating || EXTRUSION_STANDARD_SPECS.pvcBondCoating,
          pvcFlockVoltage: initialData?.conditions?.pvcFlockVoltage || EXTRUSION_STANDARD_SPECS.pvcFlockVoltage,
          pvcFlockCurrent: initialData?.conditions?.pvcFlockCurrent || EXTRUSION_STANDARD_SPECS.pvcFlockCurrent,
          pvcFlockingCondition: initialData?.conditions?.pvcFlockingCondition || initialData?.conditions?.flockingCondition || EXTRUSION_STANDARD_SPECS.pvcFlockingCondition,
          pvcDryerDriveSpeed: initialData?.conditions?.pvcDryerDriveSpeed || initialData?.conditions?.pvcDryerSpeed || EXTRUSION_STANDARD_SPECS.pvcDryerDriveSpeed,
          pvcDryerSpeed: initialData?.conditions?.pvcDryerSpeed || initialData?.conditions?.pvcDryerDriveSpeed || EXTRUSION_STANDARD_SPECS.pvcDryerSpeed,
          pvcDryerTemp: initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerTemp,
          pvcDryerZones: {
            zone1: initialData?.conditions?.pvcDryerZones?.zone1 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[0] : null) || initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone1,
            zone2: initialData?.conditions?.pvcDryerZones?.zone2 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[1] : null) || initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone2,
            zone3: initialData?.conditions?.pvcDryerZones?.zone3 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[2] : null) || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone3,
            zone4: initialData?.conditions?.pvcDryerZones?.zone4 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[3] : null) || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone4
          },
          pvcTemps: {
            cylinder1: initialData?.conditions?.pvcTemps?.cylinder1 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder1,
            cylinder2: initialData?.conditions?.pvcTemps?.cylinder2 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder2,
            cylinder3: initialData?.conditions?.pvcTemps?.cylinder3 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder3,
            cylinder4: initialData?.conditions?.pvcTemps?.cylinder4 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder4,
            adapter: initialData?.conditions?.pvcTemps?.adapter || EXTRUSION_STANDARD_SPECS.pvcTemps.adapter,
            nozzle: initialData?.conditions?.pvcTemps?.nozzle || EXTRUSION_STANDARD_SPECS.pvcTemps.nozzle,
            die: initialData?.conditions?.pvcTemps?.die || EXTRUSION_STANDARD_SPECS.pvcTemps.die
          }
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
        ...defaultItem.rawMaterials
      },
      defectBreakdown: {
        cutoffKg: "",
        startLossKg: "",
        appearanceKg: ""
      },
      conditions: {
        extruder110Rpm: EXTRUSION_STANDARD_SPECS.extruder110Rpm,
        extruder70Rpm: EXTRUSION_STANDARD_SPECS.extruder70Rpm,
        extruder60Rpm: EXTRUSION_STANDARD_SPECS.extruder60Rpm,
        haulOffSpeed: EXTRUSION_STANDARD_SPECS.haulOffSpeed,
        waterZones110: {
          screw: "50.0",
          cylinder1: "50.0",
          cylinder2: "50.0",
          cylinder3: "50.0",
          head: "50.0"
        },
        waterZones70: {
          screw: "50.0",
          cylinder1: "50.0",
          cylinder2: "50.0",
          cylinder3: "50.0"
        },
        waterTemp: EXTRUSION_STANDARD_SPECS.waterTemp,
        waterZones: [...(EXTRUSION_STANDARD_SPECS.waterZones || [50.0, 50.0, 50.0, 50.0])],
        cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp, // PCM 13존 210±20℃
        sprayGun1: EXTRUSION_STANDARD_SPECS.sprayGun1,
        sprayGun2: EXTRUSION_STANDARD_SPECS.sprayGun2,
        sprayGun3: EXTRUSION_STANDARD_SPECS.sprayGun3,
        sprayGun4: EXTRUSION_STANDARD_SPECS.sprayGun4,
        coatingThicknessBase: EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
        coatingThicknessOuter: EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
        coatingThicknessInner: EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
        pcmZones: [...EXTRUSION_STANDARD_SPECS.pcmZones],
        // TPE 4개 압출기 속도 & 압출기온도(±10℃) & 냉각수온도
        tpeExtruder100Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder100Rpm,
        tpeExtruder80Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder80Rpm,
        tpeExtruder65Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder65Rpm,
        tpeExtruder35Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
        tpeExtruder45Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
        tpeCoolingWaterTemp: EXTRUSION_STANDARD_SPECS.tpeCoolingWaterTemp,
        tpeTemps100: { ...EXTRUSION_STANDARD_SPECS.tpeTemps100 },
        tpeTemps80: { ...EXTRUSION_STANDARD_SPECS.tpeTemps80 },
        tpeTemps65: { ...EXTRUSION_STANDARD_SPECS.tpeTemps65 },
        tpeTemps35: { ...EXTRUSION_STANDARD_SPECS.tpeTemps35 },
        tpeTemps45: { ...EXTRUSION_STANDARD_SPECS.tpeTemps35 },
        // PVC 80Ø 속도 & 7구간 압출기온도(±10℃) & 냉각조/본드도포/후로킹/건조로
        pvcExtruder80Rpm: EXTRUSION_STANDARD_SPECS.pvcExtruder80Rpm,
        pvcHaulOffSpeed: EXTRUSION_STANDARD_SPECS.pvcHaulOffSpeed,
        pvcCoolingTankTemp: EXTRUSION_STANDARD_SPECS.pvcCoolingTankTemp,
        pvcBondFeeder1Rpm: EXTRUSION_STANDARD_SPECS.pvcBondFeeder1Rpm,
        pvcBondFeeder2Rpm: EXTRUSION_STANDARD_SPECS.pvcBondFeeder2Rpm,
        pvcBondCoating: EXTRUSION_STANDARD_SPECS.pvcBondCoating,
        pvcFlockVoltage: EXTRUSION_STANDARD_SPECS.pvcFlockVoltage,
        pvcFlockCurrent: EXTRUSION_STANDARD_SPECS.pvcFlockCurrent,
        pvcFlockingCondition: EXTRUSION_STANDARD_SPECS.pvcFlockingCondition,
        pvcDryerDriveSpeed: EXTRUSION_STANDARD_SPECS.pvcDryerDriveSpeed,
        pvcDryerSpeed: EXTRUSION_STANDARD_SPECS.pvcDryerSpeed,
        pvcDryerTemp: EXTRUSION_STANDARD_SPECS.pvcDryerTemp,
        pvcDryerZones: { ...EXTRUSION_STANDARD_SPECS.pvcDryerZones },
        pvcTemps: { ...EXTRUSION_STANDARD_SPECS.pvcTemps }
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
        const items = mapInitialItems(initialData, initialData?.lineId || "pcm1");
        const primaryRaw = items[0]?.rawMaterials || {};

        if (Array.isArray(initialData.tpmChecks) && initialData.tpmChecks.length > 0) {
          setTpmChecks(initialData.tpmChecks);
        } else {
          setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        }

        setFormData({
          ...initialData,
          items,
          rawMaterials: {
            ...primaryRaw
          },
          defectBreakdown: {
            cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
            startLossKg: initialData?.defectBreakdown?.startLossKg || "",
            appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
          },
          downtimeEvents: Array.isArray(initialData?.downtimeEvents) && initialData.downtimeEvents.length > 0
            ? initialData.downtimeEvents.map((e, idx) => ({
                id: e.id || `dt_${idx + 1}`,
                type: e.type || (DOWNTIME_CATEGORIES.find((c) => c.id === e.category)?.type || (["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(e.category) ? "불량" : "비가동")),
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
            extruder70Rpm: initialData?.conditions?.extruder70Rpm || initialData?.conditions?.extruder60Rpm || EXTRUSION_STANDARD_SPECS.extruder70Rpm,
            extruder60Rpm: initialData?.conditions?.extruder60Rpm || initialData?.conditions?.extruder70Rpm || EXTRUSION_STANDARD_SPECS.extruder60Rpm,
            haulOffSpeed: initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.haulOffSpeed,
            waterZones110: {
              screw: initialData?.conditions?.waterZones110?.screw || initialData?.conditions?.water110Screw || "50.0",
              cylinder1: initialData?.conditions?.waterZones110?.cylinder1 || initialData?.conditions?.water110Cyl1 || "50.0",
              cylinder2: initialData?.conditions?.waterZones110?.cylinder2 || initialData?.conditions?.water110Cyl2 || "50.0",
              cylinder3: initialData?.conditions?.waterZones110?.cylinder3 || initialData?.conditions?.water110Cyl3 || "50.0",
              head: initialData?.conditions?.waterZones110?.head || initialData?.conditions?.water110Head || "50.0"
            },
            waterZones70: {
              screw: initialData?.conditions?.waterZones70?.screw || initialData?.conditions?.water70Screw || "50.0",
              cylinder1: initialData?.conditions?.waterZones70?.cylinder1 || initialData?.conditions?.water70Cyl1 || "50.0",
              cylinder2: initialData?.conditions?.waterZones70?.cylinder2 || initialData?.conditions?.water70Cyl2 || "50.0",
              cylinder3: initialData?.conditions?.waterZones70?.cylinder3 || initialData?.conditions?.water70Cyl3 || "50.0"
            },
            waterTemp: initialData?.conditions?.waterTemp || EXTRUSION_STANDARD_SPECS.waterTemp,
            waterZones: Array.isArray(initialData?.conditions?.waterZones) && initialData.conditions.waterZones.length === 4
              ? initialData.conditions.waterZones
              : [...(EXTRUSION_STANDARD_SPECS.waterZones || [50.0, 50.0, 50.0, 50.0])],
            cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || EXTRUSION_STANDARD_SPECS.cureZoneTemp,
            sprayGun1: initialData?.conditions?.sprayGun1 || EXTRUSION_STANDARD_SPECS.sprayGun1,
            sprayGun2: initialData?.conditions?.sprayGun2 || EXTRUSION_STANDARD_SPECS.sprayGun2,
            sprayGun3: initialData?.conditions?.sprayGun3 || EXTRUSION_STANDARD_SPECS.sprayGun3,
            sprayGun4: initialData?.conditions?.sprayGun4 || EXTRUSION_STANDARD_SPECS.sprayGun4,
            coatingThicknessBase: initialData?.conditions?.coatingThicknessBase || EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
            coatingThicknessOuter: initialData?.conditions?.coatingThicknessOuter || EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
            coatingThicknessInner: initialData?.conditions?.coatingThicknessInner || EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
            pcmZones: Array.isArray(initialData?.conditions?.pcmZones) && initialData.conditions.pcmZones.length === 13
              ? initialData.conditions.pcmZones
              : [...EXTRUSION_STANDARD_SPECS.pcmZones],
            // TPE 4개 압출기 속도 & 압출기온도(±10℃) & 냉각수온도
            tpeExtruder100Rpm: initialData?.conditions?.tpeExtruder100Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder100Rpm,
            tpeExtruder80Rpm: initialData?.conditions?.tpeExtruder80Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder80Rpm,
            tpeExtruder65Rpm: initialData?.conditions?.tpeExtruder65Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder65Rpm,
            tpeExtruder35Rpm: initialData?.conditions?.tpeExtruder35Rpm || initialData?.conditions?.tpeExtruder45Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
            tpeExtruder45Rpm: initialData?.conditions?.tpeExtruder35Rpm || initialData?.conditions?.tpeExtruder45Rpm || EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
            tpeCoolingWaterTemp: initialData?.conditions?.tpeCoolingWaterTemp || EXTRUSION_STANDARD_SPECS.tpeCoolingWaterTemp,
            tpeTemps100: {
              screw: initialData?.conditions?.tpeTemps100?.screw || EXTRUSION_STANDARD_SPECS.tpeTemps100.screw,
              cylinder1: initialData?.conditions?.tpeTemps100?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder1,
              cylinder2: initialData?.conditions?.tpeTemps100?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder2,
              cylinder3: initialData?.conditions?.tpeTemps100?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder3,
              cylinder4: initialData?.conditions?.tpeTemps100?.cylinder4 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder4,
              cylinder5: initialData?.conditions?.tpeTemps100?.cylinder5 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder5,
              cylinder6: initialData?.conditions?.tpeTemps100?.cylinder6 || EXTRUSION_STANDARD_SPECS.tpeTemps100.cylinder6,
              adapter: initialData?.conditions?.tpeTemps100?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps100.adapter,
              die: initialData?.conditions?.tpeTemps100?.die || EXTRUSION_STANDARD_SPECS.tpeTemps100.die,
              head1: initialData?.conditions?.tpeTemps100?.head1 || EXTRUSION_STANDARD_SPECS.tpeTemps100.head1,
              head2: initialData?.conditions?.tpeTemps100?.head2 || EXTRUSION_STANDARD_SPECS.tpeTemps100.head2,
              hopperDryer: initialData?.conditions?.tpeTemps100?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps100.hopperDryer
            },
            tpeTemps80: {
              cylinder1: initialData?.conditions?.tpeTemps80?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder1,
              cylinder2: initialData?.conditions?.tpeTemps80?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder2,
              cylinder3: initialData?.conditions?.tpeTemps80?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder3,
              cylinder4: initialData?.conditions?.tpeTemps80?.cylinder4 || EXTRUSION_STANDARD_SPECS.tpeTemps80.cylinder4,
              adapter: initialData?.conditions?.tpeTemps80?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps80.adapter,
              nozzle: initialData?.conditions?.tpeTemps80?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps80.nozzle,
              hopperDryer: initialData?.conditions?.tpeTemps80?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps80.hopperDryer
            },
            tpeTemps65: {
              cylinder1: initialData?.conditions?.tpeTemps65?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder1,
              cylinder2: initialData?.conditions?.tpeTemps65?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder2,
              cylinder3: initialData?.conditions?.tpeTemps65?.cylinder3 || EXTRUSION_STANDARD_SPECS.tpeTemps65.cylinder3,
              adapter: initialData?.conditions?.tpeTemps65?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps65.adapter,
              nozzle: initialData?.conditions?.tpeTemps65?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps65.nozzle,
              hopperDryer: initialData?.conditions?.tpeTemps65?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps65.hopperDryer
            },
            tpeTemps35: {
              cylinder1: initialData?.conditions?.tpeTemps35?.cylinder1 || initialData?.conditions?.tpeTemps45?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder1,
              cylinder2: initialData?.conditions?.tpeTemps35?.cylinder2 || initialData?.conditions?.tpeTemps45?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder2,
              adapter: initialData?.conditions?.tpeTemps35?.adapter || initialData?.conditions?.tpeTemps45?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps35.adapter,
              nozzle: initialData?.conditions?.tpeTemps35?.nozzle || initialData?.conditions?.tpeTemps45?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps35.nozzle,
              hopperDryer: initialData?.conditions?.tpeTemps35?.hopperDryer || initialData?.conditions?.tpeTemps45?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps35.hopperDryer
            },
            tpeTemps45: {
              cylinder1: initialData?.conditions?.tpeTemps35?.cylinder1 || initialData?.conditions?.tpeTemps45?.cylinder1 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder1,
              cylinder2: initialData?.conditions?.tpeTemps35?.cylinder2 || initialData?.conditions?.tpeTemps45?.cylinder2 || EXTRUSION_STANDARD_SPECS.tpeTemps35.cylinder2,
              adapter: initialData?.conditions?.tpeTemps35?.adapter || initialData?.conditions?.tpeTemps45?.adapter || EXTRUSION_STANDARD_SPECS.tpeTemps35.adapter,
              nozzle: initialData?.conditions?.tpeTemps35?.nozzle || initialData?.conditions?.tpeTemps45?.nozzle || EXTRUSION_STANDARD_SPECS.tpeTemps35.nozzle,
              hopperDryer: initialData?.conditions?.tpeTemps35?.hopperDryer || initialData?.conditions?.tpeTemps45?.hopperDryer || EXTRUSION_STANDARD_SPECS.tpeTemps35.hopperDryer
            },
            // PVC 80Ø 속도 & 7구간 압출기온도(±10℃) & 냉각조/본드도포/후로킹/건조로
            pvcExtruder80Rpm: initialData?.conditions?.pvcExtruder80Rpm || EXTRUSION_STANDARD_SPECS.pvcExtruder80Rpm,
            pvcHaulOffSpeed: initialData?.conditions?.pvcHaulOffSpeed || initialData?.conditions?.haulOffSpeed || EXTRUSION_STANDARD_SPECS.pvcHaulOffSpeed,
            pvcCoolingTankTemp: initialData?.conditions?.pvcCoolingTankTemp || EXTRUSION_STANDARD_SPECS.pvcCoolingTankTemp,
            pvcBondFeeder1Rpm: initialData?.conditions?.pvcBondFeeder1Rpm || EXTRUSION_STANDARD_SPECS.pvcBondFeeder1Rpm,
            pvcBondFeeder2Rpm: initialData?.conditions?.pvcBondFeeder2Rpm || EXTRUSION_STANDARD_SPECS.pvcBondFeeder2Rpm,
            pvcBondCoating: initialData?.conditions?.pvcBondCoating || EXTRUSION_STANDARD_SPECS.pvcBondCoating,
            pvcFlockVoltage: initialData?.conditions?.pvcFlockVoltage || EXTRUSION_STANDARD_SPECS.pvcFlockVoltage,
            pvcFlockCurrent: initialData?.conditions?.pvcFlockCurrent || EXTRUSION_STANDARD_SPECS.pvcFlockCurrent,
            pvcFlockingCondition: initialData?.conditions?.pvcFlockingCondition || initialData?.conditions?.flockingCondition || EXTRUSION_STANDARD_SPECS.pvcFlockingCondition,
            pvcDryerDriveSpeed: initialData?.conditions?.pvcDryerDriveSpeed || initialData?.conditions?.pvcDryerSpeed || EXTRUSION_STANDARD_SPECS.pvcDryerDriveSpeed,
            pvcDryerSpeed: initialData?.conditions?.pvcDryerSpeed || initialData?.conditions?.pvcDryerDriveSpeed || EXTRUSION_STANDARD_SPECS.pvcDryerSpeed,
            pvcDryerTemp: initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerTemp,
            pvcDryerZones: {
              zone1: initialData?.conditions?.pvcDryerZones?.zone1 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[0] : null) || initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone1,
              zone2: initialData?.conditions?.pvcDryerZones?.zone2 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[1] : null) || initialData?.conditions?.pvcDryerTemp || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone2,
              zone3: initialData?.conditions?.pvcDryerZones?.zone3 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[2] : null) || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone3,
              zone4: initialData?.conditions?.pvcDryerZones?.zone4 || (Array.isArray(initialData?.conditions?.pvcDryerZones) ? initialData.conditions.pvcDryerZones[3] : null) || EXTRUSION_STANDARD_SPECS.pvcDryerZones.zone4
            },
            pvcTemps: {
              cylinder1: initialData?.conditions?.pvcTemps?.cylinder1 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder1,
              cylinder2: initialData?.conditions?.pvcTemps?.cylinder2 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder2,
              cylinder3: initialData?.conditions?.pvcTemps?.cylinder3 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder3,
              cylinder4: initialData?.conditions?.pvcTemps?.cylinder4 || EXTRUSION_STANDARD_SPECS.pvcTemps.cylinder4,
              adapter: initialData?.conditions?.pvcTemps?.adapter || EXTRUSION_STANDARD_SPECS.pvcTemps.adapter,
              nozzle: initialData?.conditions?.pvcTemps?.nozzle || EXTRUSION_STANDARD_SPECS.pvcTemps.nozzle,
              die: initialData?.conditions?.pvcTemps?.die || EXTRUSION_STANDARD_SPECS.pvcTemps.die
            }
          }
        });
      } else {
        const defItem = createDefaultItem("pcm1");

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
            ...defItem.rawMaterials
          },
          defectBreakdown: {
            cutoffKg: "",
            startLossKg: "",
            appearanceKg: ""
          },
          conditions: {
            extruder110Rpm: EXTRUSION_STANDARD_SPECS.extruder110Rpm,
            extruder70Rpm: EXTRUSION_STANDARD_SPECS.extruder70Rpm,
            extruder60Rpm: EXTRUSION_STANDARD_SPECS.extruder60Rpm,
            haulOffSpeed: EXTRUSION_STANDARD_SPECS.haulOffSpeed,
            waterZones110: {
              screw: "50.0",
              cylinder1: "50.0",
              cylinder2: "50.0",
              cylinder3: "50.0",
              head: "50.0"
            },
            waterZones70: {
              screw: "50.0",
              cylinder1: "50.0",
              cylinder2: "50.0",
              cylinder3: "50.0"
            },
            waterTemp: EXTRUSION_STANDARD_SPECS.waterTemp,
            waterZones: [...(EXTRUSION_STANDARD_SPECS.waterZones || [50.0, 50.0, 50.0, 50.0])],
            cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp, // PCM 13존 210±20℃
            sprayGun1: EXTRUSION_STANDARD_SPECS.sprayGun1,
            sprayGun2: EXTRUSION_STANDARD_SPECS.sprayGun2,
            sprayGun3: EXTRUSION_STANDARD_SPECS.sprayGun3,
            sprayGun4: EXTRUSION_STANDARD_SPECS.sprayGun4,
            coatingThicknessBase: EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
            coatingThicknessOuter: EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
            coatingThicknessInner: EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
            pcmZones: [...EXTRUSION_STANDARD_SPECS.pcmZones],
            // TPE 4개 압출기 속도 & 압출기온도(±10℃) & 냉각수온도
            tpeExtruder100Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder100Rpm,
            tpeExtruder80Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder80Rpm,
            tpeExtruder65Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder65Rpm,
            tpeExtruder35Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
            tpeExtruder45Rpm: EXTRUSION_STANDARD_SPECS.tpeExtruder35Rpm,
            tpeCoolingWaterTemp: EXTRUSION_STANDARD_SPECS.tpeCoolingWaterTemp,
            tpeTemps100: { ...EXTRUSION_STANDARD_SPECS.tpeTemps100 },
            tpeTemps80: { ...EXTRUSION_STANDARD_SPECS.tpeTemps80 },
            tpeTemps65: { ...EXTRUSION_STANDARD_SPECS.tpeTemps65 },
            tpeTemps35: { ...EXTRUSION_STANDARD_SPECS.tpeTemps35 },
            tpeTemps45: { ...EXTRUSION_STANDARD_SPECS.tpeTemps35 },
            // PVC 80Ø 속도 & 7구간 압출기온도(±10℃) & 냉각조/본드도포/후로킹/건조로
            pvcExtruder80Rpm: EXTRUSION_STANDARD_SPECS.pvcExtruder80Rpm,
            pvcHaulOffSpeed: EXTRUSION_STANDARD_SPECS.pvcHaulOffSpeed,
            pvcCoolingTankTemp: EXTRUSION_STANDARD_SPECS.pvcCoolingTankTemp,
            pvcBondFeeder1Rpm: EXTRUSION_STANDARD_SPECS.pvcBondFeeder1Rpm,
            pvcBondFeeder2Rpm: EXTRUSION_STANDARD_SPECS.pvcBondFeeder2Rpm,
            pvcBondCoating: EXTRUSION_STANDARD_SPECS.pvcBondCoating,
            pvcFlockVoltage: EXTRUSION_STANDARD_SPECS.pvcFlockVoltage,
            pvcFlockCurrent: EXTRUSION_STANDARD_SPECS.pvcFlockCurrent,
            pvcFlockingCondition: EXTRUSION_STANDARD_SPECS.pvcFlockingCondition,
            pvcDryerDriveSpeed: EXTRUSION_STANDARD_SPECS.pvcDryerDriveSpeed,
            pvcDryerSpeed: EXTRUSION_STANDARD_SPECS.pvcDryerSpeed,
            pvcDryerTemp: EXTRUSION_STANDARD_SPECS.pvcDryerTemp,
            pvcDryerZones: { ...EXTRUSION_STANDARD_SPECS.pvcDryerZones },
            pvcTemps: { ...EXTRUSION_STANDARD_SPECS.pvcTemps }
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
  const totalDefectRate = totalActualQty > 0 ? ((totalDefectQty / totalActualQty) * 100).toFixed(1) : "0.0";

  // Multi-downtime aggregated totals
  const dtEvents = Array.isArray(formData?.downtimeEvents) ? formData.downtimeEvents : [];
  const totalDowntimeMinutes = dtEvents.reduce((sum, ev) => sum + (Number(ev?.minutes) || 0), 0);
  const totalDowntimeScrapKg = Number(dtEvents.reduce((sum, ev) => sum + (Number(ev?.scrapKg) || 0), 0).toFixed(1));

  // Multi-worker selection helpers (압출동 11명 복수선택)
  const currentWorkers = useMemo(() => {
    if (!formData.worker) return [];
    return String(formData.worker)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formData.worker]);

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

        // Auto-match BOM from master EPDM & Excel BOM data
        const bom = getMaterialBOMForItem(targetItem.vehicle, targetItem.itemName, prev.lineId) || {};
        
        // Reset raw material weights when item changes, so previous item's weights NEVER bleed through!
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

      // Also sync top-level rawMaterials with primary item (item 0) for backward compatibility
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

  const handleBatchTpeExtruderTemps = (targetTemp = "190") => {
    const val = prompt("TPE 4개 압출기 전체 온도에 일괄 적용할 온도를 입력하세요(℃):", targetTemp);
    if (!val || isNaN(Number(val))) return;
    const numStr = String(Math.round(Number(val)));
    setFormData((prev) => {
      const updateExtruder = (extKey) => {
        const current = prev.conditions?.[extKey] || EXTRUSION_STANDARD_SPECS[extKey] || {};
        const res = {};
        Object.keys(current).forEach((k) => {
          res[k] = k === "hopperDryer" ? String(current[k] || "80").replace(/\.0+$/, "") : numStr;
        });
        return res;
      };

      return {
        ...prev,
        conditions: {
          ...(prev.conditions || {}),
          tpeTemps100: updateExtruder("tpeTemps100"),
          tpeTemps80: updateExtruder("tpeTemps80"),
          tpeTemps65: updateExtruder("tpeTemps65"),
          tpeTemps35: updateExtruder("tpeTemps35"),
          tpeTemps45: updateExtruder("tpeTemps35")
        }
      };
    });
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

  const handleBatchPvcExtruderTemps = (targetTemp = "180") => {
    const val = prompt("PVC 압출기 7개 전체 온도에 일괄 적용할 온도를 입력하세요(℃):", targetTemp);
    if (!val || isNaN(Number(val))) return;
    const numStr = String(Math.round(Number(val)));
    setFormData((prev) => {
      const current = prev.conditions?.pvcTemps || EXTRUSION_STANDARD_SPECS.pvcTemps || {};
      const res = {};
      Object.keys(current).forEach((k) => {
        res[k] = numStr;
      });
      return {
        ...prev,
        conditions: {
          ...(prev.conditions || {}),
          pvcTemps: res
        }
      };
    });
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

  const handleBatchPvcDryerTemps = (targetTemp = "160") => {
    const val = prompt("PVC 건조로 4개 존 전체 온도에 일괄 적용할 온도를 입력하세요(℃):", targetTemp);
    if (!val || isNaN(Number(val))) return;
    const numStr = String(Math.round(Number(val)));
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        pvcDryerTemp: numStr,
        pvcDryerZones: {
          zone1: numStr,
          zone2: numStr,
          zone3: numStr,
          zone4: numStr
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header & Step Progression Tabs */}
        <ExtrusionReportHeaderNav
          isEditing={isEditing}
          isTpmCompleted={isTpmCompleted}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onClose}
          handleExportExcel={handleExportExcel}
        />

        {/* Scrollable Form Body */}
        {currentStep === "tpm" ? (
          /* STEP 1: TPM 점검일지 화면 */
          <ExtrusionReportTpmPanel
            formData={formData}
            handleTpmStatusToggle={handleTpmStatusToggle}
            handleTpmNotesChange={handleTpmNotesChange}
            fileInputRef={fileInputRef}
            handlePhotoCapture={handlePhotoCapture}
            isUploadingPhoto={isUploadingPhoto}
            handleRemovePhoto={handleRemovePhoto}
            setSelectedPhotoPreview={setSelectedPhotoPreview}
            TPM_CHECK_ITEMS={TPM_CHECK_ITEMS}
          />
        ) : (
          /* STEP 2: 압출 작업일보 및 체크시트 화면 */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
            {/* Section 1: 기본 정보 */}
            <ExtrusionReportBasicInfo
              formData={formData}
              setFormData={setFormData}
              handleLineSelect={handleLineSelect}
              WORKER_PRESETS={WORKER_PRESETS}
            />

            {/* Section 2: 품목별 생산 실적 및 투입원료 LOT */}
            <ExtrusionReportItemProduction
              formData={formData}
              setFormData={setFormData}
              isTPELine={isTPELine}
              isPVCLine={isPVCLine}
              itemsList={itemsList}
              handleItemSelect={handleItemSelect}
              handleItemDetailChange={handleItemDetailChange}
              handleItemRawMaterialChange={handleItemRawMaterialChange}
              handleRemoveItem={handleRemoveItem}
              handleAddItem={handleAddItem}
              totalQtyMeters={totalQtyMeters}
              totalWeightProducedKg={totalWeightProducedKg}
              totalScrapWeightKg={totalScrapWeightKg}
              lineTotalMaterialWeightKg={lineTotalMaterialWeightKg}
              lossRatePercent={lossRatePercent}
            />

            {/* Section 3: 압출기 속도 & 온도 작업조건 */}
            <ExtrusionReportMachineConditions
              formData={formData}
              isTPELine={isTPELine}
              isPVCLine={isPVCLine}
              handleNestedFieldChange={handleNestedFieldChange}
              handleBatchWaterZones={handleBatchWaterZones}
              handleWaterZone110Change={handleWaterZone110Change}
              handleWaterZone70Change={handleWaterZone70Change}
              handleTpeZoneChange={handleTpeZoneChange}
              handlePvcZoneChange={handlePvcZoneChange}
              handlePvcDryingZoneChange={handlePvcDryingZoneChange}
              setFormData={setFormData}
              EXTRUSION_STANDARD_SPECS={EXTRUSION_STANDARD_SPECS}
            />

            {/* Section 4 & 5: 비가동/부적합 및 특이사항 */}
            <ExtrusionReportNotesAndDowntime
              formData={formData}
              setFormData={setFormData}
              dtEvents={dtEvents}
            />
          </form>
        )}

        {/* Footer Actions */}
        <ExtrusionReportFooter
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onClose}
          handleProceedToReport={handleProceedToReport}
          handleSubmit={handleSubmit}
          isEditing={isEditing}
        />
      </div>

      {/* Enlarged Photo Preview Modal */}
      <ExtrusionReportPhotoModal
        photoUrl={selectedPhotoPreview}
        onClose={() => setSelectedPhotoPreview(null)}
      />
    </div>
  );
};

export default ExtrusionWorkReportModal;
