import {
  DOWNTIME_CATEGORIES,
  EXTRUSION_STANDARD_SPECS
} from "../../../services/extrusionProductionService";
import { getItemsByLine } from "../../../data/extrusionItemsData";
import { getMaterialBOMForItem } from "../../../data/extrusionRawMaterialsData";
import { getKSTDateString } from "../../../utils/dateUtils";

// Client-side image compression for fast sync & light Firestore storage
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
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
      img.onerror = () => {
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          dataUrl: event.target.result
        });
      };
    };
  });
};

export const createDefaultItem = (lineId, suffix = Date.now()) => {
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
export const mapInitialItems = (initialData, defaultLine = "pcm1") => {
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

export const calculateMinutesFromTime = (startTime, endTime) => {
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

export const createDefaultDowntimeEvent = (type = "비가동", category = "압개시", suffix = Date.now()) => {
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

export const isTpmAlreadyDone = (targetDate, targetWorker, existingReports = []) => {
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

export const mapInitialFormData = (initialData, todayStr, defaultWorker = "공영국 대리") => {
  if (!initialData) return createDefaultFormData(todayStr, defaultWorker);

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
};

export const createDefaultFormData = (todayStr, defaultWorker = "공영국 대리") => {
  const defaultItem = createDefaultItem("pcm1");
  return {
    date: todayStr || getKSTDateString(),
    shift: "주간",
    plant: "삼랑진공장",
    lineId: "pcm1",
    lineName: "PCM #1 LINE",
    worker: defaultWorker,
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
      cureZoneTemp: EXTRUSION_STANDARD_SPECS.cureZoneTemp,
      sprayGun1: EXTRUSION_STANDARD_SPECS.sprayGun1,
      sprayGun2: EXTRUSION_STANDARD_SPECS.sprayGun2,
      sprayGun3: EXTRUSION_STANDARD_SPECS.sprayGun3,
      sprayGun4: EXTRUSION_STANDARD_SPECS.sprayGun4,
      coatingThicknessBase: EXTRUSION_STANDARD_SPECS.coatingThicknessBase,
      coatingThicknessOuter: EXTRUSION_STANDARD_SPECS.coatingThicknessOuter,
      coatingThicknessInner: EXTRUSION_STANDARD_SPECS.coatingThicknessInner,
      pcmZones: [...EXTRUSION_STANDARD_SPECS.pcmZones],
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
    downtimeCategory: "형교환",
    downtimeDetail: "",
    downtimeScrapKg: "",
    notes: "",
    approvalStatus: "대기"
  };
};
