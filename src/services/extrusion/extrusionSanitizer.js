import { EXTRUSION_STANDARD_SPECS, TPM_CHECK_ITEMS } from "./extrusionProductionConstants";
import { getKSTDateString } from "../../utils/dateUtils";

/**
 * 표준 라인 키 정규화 (pcm1, pcm3, pvc, tpe)
 */
export const normalizeExtrusionLineKey = (lineVal) => {
  const s = String(lineVal || "").toLowerCase().trim();
  if (s.includes("pcm1") || s.includes("1호") || s.includes("pcm #1")) return "pcm1";
  if (s.includes("pcm3") || s.includes("3호") || s.includes("pcm #3")) return "pcm3";
  if (s.includes("pvc")) return "pvc";
  if (s.includes("tpe") || s.includes("4호")) return "tpe";
  return s.replace(/[^a-z0-9]/g, "") || "pcm1";
};

/**
 * 🎯 1일자 + 1라인 + 1근무조 = 단 1장의 일보 고유 식별키 생성
 * 예: 2026-10-29_pcm3_주간
 */
export const computeExtrusionDocKey = (date, line, shift = "주간") => {
  const d = String(date || getKSTDateString()).slice(0, 10);
  const l = normalizeExtrusionLineKey(line);
  const s = String(shift || "주간").includes("야") ? "야간" : "주간";
  return `${d}_${l}_${s}`;
};

/**
 * Clean & Format raw materials data object
 */
export const sanitizeRawMaterials = (rawMat = {}) => {
  return {
    rubberType: String(rawMat.rubberType || (rawMat.rubberLot?.includes("/") ? rawMat.rubberLot.split("/")[0].trim() : "")).trim(),
    rubberWeight: rawMat.rubberWeight !== undefined && rawMat.rubberWeight !== "" && !isNaN(Number(rawMat.rubberWeight)) ? Number(rawMat.rubberWeight) : "",
    rubberLot: String(rawMat.rubberLot || "").trim(),
    rubberType2: String(rawMat.rubberType2 || "").trim(),
    rubberWeight2: rawMat.rubberWeight2 !== undefined && rawMat.rubberWeight2 !== "" && !isNaN(Number(rawMat.rubberWeight2)) ? Number(rawMat.rubberWeight2) : "",
    rubberLot2: String(rawMat.rubberLot2 || "").trim(),
    coatingType: String(rawMat.coatingType || "").trim(),
    coatingWeight: rawMat.coatingWeight !== undefined && rawMat.coatingWeight !== "" && !isNaN(Number(rawMat.coatingWeight)) ? Number(rawMat.coatingWeight) : "",
    coatingLot: String(rawMat.coatingLot || "").trim(),
    insertType: String(rawMat.insertType || "").trim(),
    insertWeight: rawMat.insertWeight !== undefined && rawMat.insertWeight !== "" && !isNaN(Number(rawMat.insertWeight)) ? Number(rawMat.insertWeight) : "",
    insertLot: String(rawMat.insertLot || "").trim(),
    compoundType: String(rawMat.compoundType || "").trim(),
    compoundWeight: rawMat.compoundWeight !== undefined && rawMat.compoundWeight !== "" && !isNaN(Number(rawMat.compoundWeight)) ? Number(rawMat.compoundWeight) : "",
    compoundLot: String(rawMat.compoundLot || "").trim(),
    compoundType2: String(rawMat.compoundType2 || "").trim(),
    compoundWeight2: rawMat.compoundWeight2 !== undefined && rawMat.compoundWeight2 !== "" && !isNaN(Number(rawMat.compoundWeight2)) ? Number(rawMat.compoundWeight2) : "",
    compoundLot2: String(rawMat.compoundLot2 || "").trim(),
    compoundType3: String(rawMat.compoundType3 || "").trim(),
    compoundWeight3: rawMat.compoundWeight3 !== undefined && rawMat.compoundWeight3 !== "" && !isNaN(Number(rawMat.compoundWeight3)) ? Number(rawMat.compoundWeight3) : "",
    compoundLot3: String(rawMat.compoundLot3 || "").trim(),
    compoundType4: String(rawMat.compoundType4 || "").trim(),
    compoundWeight4: rawMat.compoundWeight4 !== undefined && rawMat.compoundWeight4 !== "" && !isNaN(Number(rawMat.compoundWeight4)) ? Number(rawMat.compoundWeight4) : "",
    compoundLot4: String(rawMat.compoundLot4 || "").trim()
  };
};

/**
 * Clean & Format a single report entry
 */
export const sanitizeExtrusionReport = (raw = {}, idx = 0) => {
  let items = [];
  if (Array.isArray(raw.items) && raw.items.length > 0) {
    items = raw.items.map((it, i) => {
      const itTarget = Math.max(0, Number(it.targetQty) || 0);
      const itActual = Math.max(0, Number(it.actualQty) || 0);
      const itGood = Math.max(0, Number(it.goodQty) || 0);
      const itDefect = Math.max(0, Number(it.defectQty) || Math.max(0, itActual - itGood));
      const itScrap = Math.max(0, Number(it.scrapKg) || 0);
      const itAttainment = itTarget > 0 ? Number(((itActual / itTarget) * 100).toFixed(1)) : 100.0;
      const itYield = itActual > 0 ? Number(((itGood / itActual) * 100).toFixed(1)) : 100.0;
      const itDefectRate = itActual > 0 ? Number(((itDefect / itActual) * 100).toFixed(1)) : 0.0;

      const rawMatSource = it.rawMaterials || (i === 0 ? raw.rawMaterials : null) || {};

      return {
        id: String(it.id || `item_${i + 1}`),
        vehicle: String(it.vehicle || "").trim(),
        itemName: String(it.itemName || "").trim(),
        itemCode: String(it.itemCode || "").trim(),
        targetQty: itTarget,
        actualQty: itActual,
        goodQty: itGood,
        defectQty: itDefect,
        scrapKg: itScrap,
        yieldRate: itYield,
        attainmentRate: itAttainment,
        defectRate: itDefectRate,
        rawMaterials: sanitizeRawMaterials(rawMatSource)
      };
    });
  }

  let targetQty = Math.max(0, Number(raw.targetQty) || 0);
  let actualQty = Math.max(0, Number(raw.actualQty) || 0);
  let goodQty = Math.max(0, Number(raw.goodQty) || 0);
  let defectQty = Math.max(0, Number(raw.defectQty) || Math.max(0, actualQty - goodQty));
  let scrapKg = Math.max(0, Number(raw.scrapKg) || 0);
  const downtimeMinutes = Math.max(0, Number(raw.downtimeMinutes) || 0);

  if (items.length > 0) {
    targetQty = items.reduce((sum, it) => sum + it.targetQty, 0);
    actualQty = items.reduce((sum, it) => sum + it.actualQty, 0);
    goodQty = items.reduce((sum, it) => sum + it.goodQty, 0);
    defectQty = items.reduce((sum, it) => sum + it.defectQty, 0);
    scrapKg = Number(items.reduce((sum, it) => sum + it.scrapKg, 0).toFixed(1));
  } else if (raw.vehicle || raw.itemName) {
    const defaultRaw = raw.rawMaterials || {
      rubberType: raw.rubberType,
      compoundType: raw.compoundType,
      insertType: raw.insertType,
      coatingType: raw.coatingType
    };
    items = [
      {
        id: "item_1",
        vehicle: String(raw.vehicle || "").trim(),
        itemName: String(raw.itemName || "").trim(),
        itemCode: String(raw.itemCode || "").trim(),
        targetQty,
        actualQty,
        goodQty,
        defectQty,
        scrapKg,
        yieldRate: actualQty > 0 ? Number(((goodQty / actualQty) * 100).toFixed(1)) : 100.0,
        attainmentRate: targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 100.0,
        defectRate: actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(1)) : 0.0,
        rawMaterials: sanitizeRawMaterials(defaultRaw)
      }
    ];
  }

  const attainmentRate = targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 100.0;
  const yieldRate = actualQty > 0 ? Number(((goodQty / actualQty) * 100).toFixed(1)) : 100.0;
  const defectRate = actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(1)) : 0.0;

  const vehicle = items.length > 0 ? items.map((it) => it.vehicle).filter(Boolean).join(", ") : String(raw.vehicle || "NX4");
  const itemName = items.length > 0 ? items.map((it) => it.itemName).filter(Boolean).join(", ") : String(raw.itemName || "WEATHER STRIP");

  const todayStr = getKSTDateString();
  const topRawMaterials = sanitizeRawMaterials(raw.rawMaterials || items[0]?.rawMaterials || {});

  const repDate = String(raw.date || todayStr).slice(0, 10);
  const repLineId = normalizeExtrusionLineKey(raw.lineId || raw.line || raw.lineName || "pcm1");
  const repShift = String(raw.shift || "주간").includes("야") ? "야간" : "주간";
  const standardDocKey = computeExtrusionDocKey(repDate, repLineId, repShift);

  return {
    id: String(raw.id || standardDocKey),
    docKey: standardDocKey,
    date: repDate,
    shift: repShift, // 주간 | 야간
    plant: String(raw.plant || "삼랑진공장"),
    lineId: repLineId,
    lineName: String(raw.lineName || "PCM #1 LINE"),
    worker: String(raw.worker || "공영국 대리"),
    subWorkers: String(raw.subWorkers || ""),
    vehicle,
    itemCode: String(raw.itemCode || ""),
    itemName,
    items,
    targetQty,
    actualQty,
    goodQty,
    defectQty,
    scrapKg,
    yieldRate,
    attainmentRate,
    defectRate,
    rawMaterials: topRawMaterials,
    defectBreakdown: {
      cutoffKg: Math.max(0, Number(raw.defectBreakdown?.cutoffKg || raw.cutoffKg) || 0),
      startLossKg: Math.max(0, Number(raw.defectBreakdown?.startLossKg || raw.startLossKg) || 0),
      appearanceKg: Math.max(0, Number(raw.defectBreakdown?.appearanceKg || raw.appearanceKg) || 0)
    },
    conditions: {
      extruder110Rpm: String(raw.conditions?.extruder110Rpm || raw.extruder110Rpm || raw.conditions?.extruderRpm || "26.4").trim(),
      extruder70Rpm: String(raw.conditions?.extruder70Rpm || raw.extruder70Rpm || raw.conditions?.extruder60Rpm || raw.extruder60Rpm || "19.2").trim(),
      extruder60Rpm: String(raw.conditions?.extruder60Rpm || raw.extruder60Rpm || raw.conditions?.extruder70Rpm || "19.2").trim(),
      haulOffSpeed: String(raw.conditions?.haulOffSpeed || raw.haulOffSpeed || "19.6").trim(),
      waterZones110: {
        screw: String(raw.conditions?.waterZones110?.screw || raw.conditions?.water110Screw || "50.0").trim(),
        cylinder1: String(raw.conditions?.waterZones110?.cylinder1 || raw.conditions?.water110Cyl1 || "50.0").trim(),
        cylinder2: String(raw.conditions?.waterZones110?.cylinder2 || raw.conditions?.water110Cyl2 || "50.0").trim(),
        cylinder3: String(raw.conditions?.waterZones110?.cylinder3 || raw.conditions?.water110Cyl3 || "50.0").trim(),
        head: String(raw.conditions?.waterZones110?.head || raw.conditions?.water110Head || "50.0").trim()
      },
      waterZones70: {
        screw: String(raw.conditions?.waterZones70?.screw || raw.conditions?.water70Screw || "50.0").trim(),
        cylinder1: String(raw.conditions?.waterZones70?.cylinder1 || raw.conditions?.water70Cyl1 || "50.0").trim(),
        cylinder2: String(raw.conditions?.waterZones70?.cylinder2 || raw.conditions?.water70Cyl2 || "50.0").trim(),
        cylinder3: String(raw.conditions?.waterZones70?.cylinder3 || raw.conditions?.water70Cyl3 || "50.0").trim()
      },
      waterTemp: String(raw.conditions?.waterTemp || raw.waterTemp || "50.0").trim(),
      waterZones: Array.isArray(raw.conditions?.waterZones) && raw.conditions.waterZones.length === 4
        ? raw.conditions.waterZones.map(z => Number(z) || 50.0)
        : (Array.isArray(raw.waterZones) && raw.waterZones.length === 4 ? raw.waterZones.map(z => Number(z) || 50.0) : [50.0, 50.0, 50.0, 50.0]),
      cureZoneTemp: String(raw.conditions?.cureZoneTemp || raw.cureZoneTemp || raw.conditions?.cureTemp || "212.0").trim(), // 210±20℃ (존1~존13)
      pcmZones: Array.isArray(raw.conditions?.pcmZones) && raw.conditions.pcmZones.length === 13
        ? raw.conditions.pcmZones.map(z => Number(z) || 210.0)
        : (Array.isArray(raw.pcmZones) && raw.pcmZones.length === 13 ? raw.pcmZones.map(z => Number(z) || 210.0) : [...EXTRUSION_STANDARD_SPECS.pcmZones]),
      sprayGun1: String(raw.conditions?.sprayGun1 || raw.sprayGun1 || "2.5").trim(),
      sprayGun2: String(raw.conditions?.sprayGun2 || raw.sprayGun2 || "2.6").trim(),
      sprayGun3: String(raw.conditions?.sprayGun3 || raw.sprayGun3 || "2.5").trim(),
      sprayGun4: String(raw.conditions?.sprayGun4 || raw.sprayGun4 || "2.4").trim(),
      // TPE 속도 & 온도 & 냉각수온도
      tpeExtruder100Rpm: String(raw.conditions?.tpeExtruder100Rpm || raw.tpeExtruder100Rpm || "25.0").trim(),
      tpeExtruder80Rpm: String(raw.conditions?.tpeExtruder80Rpm || raw.tpeExtruder80Rpm || "20.0").trim(),
      tpeExtruder65Rpm: String(raw.conditions?.tpeExtruder65Rpm || raw.tpeExtruder65Rpm || "18.0").trim(),
      tpeExtruder35Rpm: String(raw.conditions?.tpeExtruder35Rpm || raw.conditions?.tpeExtruder45Rpm || raw.tpeExtruder35Rpm || raw.tpeExtruder45Rpm || "15.0").trim(),
      tpeExtruder45Rpm: String(raw.conditions?.tpeExtruder35Rpm || raw.conditions?.tpeExtruder45Rpm || raw.tpeExtruder35Rpm || raw.tpeExtruder45Rpm || "15.0").trim(),
      tpeCoolingWaterTemp: String(raw.conditions?.tpeCoolingWaterTemp || raw.tpeCoolingWaterTemp || raw.conditions?.coolingWaterTemp || "20").trim(),
      tpeTemps100: {
        screw: String(raw.conditions?.tpeTemps100?.screw ?? "180").replace(/\.0+$/, "").trim(),
        cylinder1: String(raw.conditions?.tpeTemps100?.cylinder1 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.tpeTemps100?.cylinder2 ?? "185").replace(/\.0+$/, "").trim(),
        cylinder3: String(raw.conditions?.tpeTemps100?.cylinder3 ?? "190").replace(/\.0+$/, "").trim(),
        cylinder4: String(raw.conditions?.tpeTemps100?.cylinder4 ?? "195").replace(/\.0+$/, "").trim(),
        cylinder5: String(raw.conditions?.tpeTemps100?.cylinder5 ?? "200").replace(/\.0+$/, "").trim(),
        cylinder6: String(raw.conditions?.tpeTemps100?.cylinder6 ?? "200").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.tpeTemps100?.adapter ?? "205").replace(/\.0+$/, "").trim(),
        die: String(raw.conditions?.tpeTemps100?.die ?? "210").replace(/\.0+$/, "").trim(),
        head1: String(raw.conditions?.tpeTemps100?.head1 ?? "205").replace(/\.0+$/, "").trim(),
        head2: String(raw.conditions?.tpeTemps100?.head2 ?? "205").replace(/\.0+$/, "").trim(),
        hopperDryer: String(raw.conditions?.tpeTemps100?.hopperDryer ?? "80").replace(/\.0+$/, "").trim()
      },
      tpeTemps80: {
        cylinder1: String(raw.conditions?.tpeTemps80?.cylinder1 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.tpeTemps80?.cylinder2 ?? "185").replace(/\.0+$/, "").trim(),
        cylinder3: String(raw.conditions?.tpeTemps80?.cylinder3 ?? "190").replace(/\.0+$/, "").trim(),
        cylinder4: String(raw.conditions?.tpeTemps80?.cylinder4 ?? "195").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.tpeTemps80?.adapter ?? "200").replace(/\.0+$/, "").trim(),
        nozzle: String(raw.conditions?.tpeTemps80?.nozzle ?? "205").replace(/\.0+$/, "").trim(),
        hopperDryer: String(raw.conditions?.tpeTemps80?.hopperDryer ?? "80").replace(/\.0+$/, "").trim()
      },
      tpeTemps65: {
        cylinder1: String(raw.conditions?.tpeTemps65?.cylinder1 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.tpeTemps65?.cylinder2 ?? "185").replace(/\.0+$/, "").trim(),
        cylinder3: String(raw.conditions?.tpeTemps65?.cylinder3 ?? "190").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.tpeTemps65?.adapter ?? "195").replace(/\.0+$/, "").trim(),
        nozzle: String(raw.conditions?.tpeTemps65?.nozzle ?? "200").replace(/\.0+$/, "").trim(),
        hopperDryer: String(raw.conditions?.tpeTemps65?.hopperDryer ?? "80").replace(/\.0+$/, "").trim()
      },
      tpeTemps35: {
        cylinder1: String(raw.conditions?.tpeTemps35?.cylinder1 ?? raw.conditions?.tpeTemps45?.cylinder1 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.tpeTemps35?.cylinder2 ?? raw.conditions?.tpeTemps45?.cylinder2 ?? "185").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.tpeTemps35?.adapter ?? raw.conditions?.tpeTemps45?.adapter ?? "190").replace(/\.0+$/, "").trim(),
        nozzle: String(raw.conditions?.tpeTemps35?.nozzle ?? raw.conditions?.tpeTemps45?.nozzle ?? "195").replace(/\.0+$/, "").trim(),
        hopperDryer: String(raw.conditions?.tpeTemps35?.hopperDryer ?? raw.conditions?.tpeTemps45?.hopperDryer ?? "80").replace(/\.0+$/, "").trim()
      },
      tpeTemps45: {
        cylinder1: String(raw.conditions?.tpeTemps35?.cylinder1 ?? raw.conditions?.tpeTemps45?.cylinder1 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.tpeTemps35?.cylinder2 ?? raw.conditions?.tpeTemps45?.cylinder2 ?? "185").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.tpeTemps35?.adapter ?? raw.conditions?.tpeTemps45?.adapter ?? "190").replace(/\.0+$/, "").trim(),
        nozzle: String(raw.conditions?.tpeTemps35?.nozzle ?? raw.conditions?.tpeTemps45?.nozzle ?? "195").replace(/\.0+$/, "").trim(),
        hopperDryer: String(raw.conditions?.tpeTemps35?.hopperDryer ?? raw.conditions?.tpeTemps45?.hopperDryer ?? "80").replace(/\.0+$/, "").trim()
      },
      // PVC 속도 & 7구간 온도 & 냉각조/본드도포/후로킹/건조로
      pvcExtruder80Rpm: String(raw.conditions?.pvcExtruder80Rpm || raw.pvcExtruder80Rpm || raw.conditions?.extruder80Rpm || "20.0").trim(),
      pvcHaulOffSpeed: String(raw.conditions?.pvcHaulOffSpeed || raw.pvcHaulOffSpeed || raw.conditions?.haulOffSpeed || "15.0").trim(),
      pvcCoolingTankTemp: String(raw.conditions?.pvcCoolingTankTemp || raw.pvcCoolingTankTemp || raw.conditions?.coolingTankTemp || "20").replace(/\.0+$/, "").trim(),
      pvcBondFeeder1Rpm: String(raw.conditions?.pvcBondFeeder1Rpm || raw.pvcBondFeeder1Rpm || "15.0").trim(),
      pvcBondFeeder2Rpm: String(raw.conditions?.pvcBondFeeder2Rpm || raw.pvcBondFeeder2Rpm || "15.0").trim(),
      pvcBondCoating: String(raw.conditions?.pvcBondCoating || raw.pvcBondCoating || raw.conditions?.bondCoating || "양호").trim(),
      pvcFlockVoltage: String(raw.conditions?.pvcFlockVoltage || raw.pvcFlockVoltage || "50").replace(/\.0+$/, "").trim(),
      pvcFlockCurrent: String(raw.conditions?.pvcFlockCurrent || raw.pvcFlockCurrent || "120").replace(/\.0+$/, "").trim(),
      pvcFlockingCondition: String(raw.conditions?.pvcFlockingCondition || raw.pvcFlockingCondition || raw.conditions?.flockingCondition || "0.8mm 양호").trim(),
      pvcDryerDriveSpeed: String(raw.conditions?.pvcDryerDriveSpeed || raw.pvcDryerDriveSpeed || raw.conditions?.pvcDryerSpeed || "15.0").trim(),
      pvcDryerSpeed: String(raw.conditions?.pvcDryerSpeed || raw.pvcDryerSpeed || raw.conditions?.pvcDryerDriveSpeed || "15.0").trim(),
      pvcDryerTemp: String(raw.conditions?.pvcDryerTemp || raw.pvcDryerTemp || raw.conditions?.dryerTemp || "160").replace(/\.0+$/, "").trim(),
      pvcDryerZones: {
        zone1: String(raw.conditions?.pvcDryerZones?.zone1 ?? (Array.isArray(raw.conditions?.pvcDryerZones) ? raw.conditions.pvcDryerZones[0] : null) ?? raw.conditions?.pvcDryerTemp ?? "160").replace(/\.0+$/, "").trim(),
        zone2: String(raw.conditions?.pvcDryerZones?.zone2 ?? (Array.isArray(raw.conditions?.pvcDryerZones) ? raw.conditions.pvcDryerZones[1] : null) ?? raw.conditions?.pvcDryerTemp ?? "160").replace(/\.0+$/, "").trim(),
        zone3: String(raw.conditions?.pvcDryerZones?.zone3 ?? (Array.isArray(raw.conditions?.pvcDryerZones) ? raw.conditions.pvcDryerZones[2] : null) ?? "165").replace(/\.0+$/, "").trim(),
        zone4: String(raw.conditions?.pvcDryerZones?.zone4 ?? (Array.isArray(raw.conditions?.pvcDryerZones) ? raw.conditions.pvcDryerZones[3] : null) ?? "165").replace(/\.0+$/, "").trim()
      },
      pvcTemps: {
        cylinder1: String(raw.conditions?.pvcTemps?.cylinder1 ?? "170").replace(/\.0+$/, "").trim(),
        cylinder2: String(raw.conditions?.pvcTemps?.cylinder2 ?? "175").replace(/\.0+$/, "").trim(),
        cylinder3: String(raw.conditions?.pvcTemps?.cylinder3 ?? "180").replace(/\.0+$/, "").trim(),
        cylinder4: String(raw.conditions?.pvcTemps?.cylinder4 ?? "185").replace(/\.0+$/, "").trim(),
        adapter: String(raw.conditions?.pvcTemps?.adapter ?? "190").replace(/\.0+$/, "").trim(),
        nozzle: String(raw.conditions?.pvcTemps?.nozzle ?? "195").replace(/\.0+$/, "").trim(),
        die: String(raw.conditions?.pvcTemps?.die ?? "195").replace(/\.0+$/, "").trim()
      }
    },
    tpmStatus: String(raw.tpmStatus || "완료"),
    tpmChecks: Array.isArray(raw.tpmChecks) && raw.tpmChecks.length > 0
      ? raw.tpmChecks.map(c => ({ id: c.id, status: c.status || "OK", note: c.note || "" }))
      : TPM_CHECK_ITEMS.map(c => ({ id: c.id, status: "OK", note: "" })),
    tpmIssueText: String(raw.tpmIssueText || raw.tpmIssueReport?.text || "").trim(),
    tpmIssuePhotos: Array.isArray(raw.tpmIssuePhotos)
      ? raw.tpmIssuePhotos
      : (Array.isArray(raw.tpmIssueReport?.photos) ? raw.tpmIssueReport.photos : (raw.tpmIssuePhoto ? [raw.tpmIssuePhoto] : [])),
    downtimeEvents: Array.isArray(raw.downtimeEvents) && raw.downtimeEvents.length > 0
      ? raw.downtimeEvents.map((e, eIdx) => ({
          ...e,
          id: String(e.id || `dt_${eIdx + 1}`),
          type: String(e.type || "비가동").trim(),
          startTime: String(e.startTime || "").trim(),
          endTime: String(e.endTime || "").trim(),
          minutes: Math.max(0, Number(e.minutes) || 0),
          category: String(e.category || "압개시").trim(),
          detail: String(e.detail || "").trim(),
          scrapKg: e.scrapKg !== undefined && e.scrapKg !== "" ? Number(e.scrapKg) : 0,
          beforePhoto: e.beforePhoto || null,
          afterPhoto: e.afterPhoto || null
        }))
      : (downtimeMinutes > 0 || raw.downtimeDetail
          ? [{
              id: "dt_1",
              type: "비가동",
              startTime: String(raw.startTime || "").trim(),
              endTime: String(raw.endTime || "").trim(),
              minutes: downtimeMinutes,
              category: String(raw.downtimeCategory || "압개시"),
              detail: String(raw.downtimeDetail || ""),
              scrapKg: Number(raw.downtimeScrapKg) || 0
            }]
          : []),
    downtimeMinutes,
    downtimeScrapKg: Math.max(0, Number(raw.downtimeScrapKg) || (Array.isArray(raw.downtimeEvents) ? raw.downtimeEvents.reduce((acc, e) => acc + (Number(e.scrapKg) || 0), 0) : 0)),
    downtimeCategory: String(raw.downtimeCategory || (Array.isArray(raw.downtimeEvents) && raw.downtimeEvents[0]?.category) || "압개시"),
    downtimeDetail: String(raw.downtimeDetail || ""),
    notes: String(raw.notes || ""),
    approvalStatus: String(raw.approvalStatus || "대기"), // 대기 | 승인 | 반려
    approvedBy: String(raw.approvedBy || ""),
    approvedAt: String(raw.approvedAt || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString())
  };
};

// Initial Seed Data (더미데이터 영구삭제 완료 - 빈 배열 유지)
export const INITIAL_EXTRUSION_REPORTS = [];
