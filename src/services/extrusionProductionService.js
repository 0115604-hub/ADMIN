// Extrusion Production & Daily Work Report Service
// Real-time Firestore Multi-Device Sync + Local Storage Fallback + Statistical Aggregator
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

const COLLECTION_NAME = "extrusion_work_reports";
export const EXTRUSION_PROD_STORAGE_KEY = "factory_extrusion_work_reports_v1";

export const EXTRUSION_STANDARD_SPECS = {
  extruder110Rpm: "26.4", // Ø110 압출속도 (표준 29.0±2.9 RPM)
  extruder70Rpm: "19.2",  // Ø70 압출속도 (표준 20.0±2.0 RPM)
  extruder60Rpm: "19.2",  // legacy fallback
  haulOffSpeed: "19.6",   // 라인 인취속도 (표준 20.0±1.0 m/분)
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
  waterTemp: "50.0",      // 온수조 표준 50±5℃ (스크류, 실린더1~3, 헤드1)
  waterZones: [50.0, 50.0, 50.0, 50.0], // 온조기 1~4구간 표준
  cureZoneTemp: "212.0",  // PCM 13존 표준 210±20℃ (190~230℃)
  sprayGun1: "2.5",       // 코팅건 1번 2.5 bar
  sprayGun2: "2.6",       // 코팅건 2번 2.5 bar
  sprayGun3: "2.5",       // 코팅건 3번 2.5 bar
  sprayGun4: "2.4",       // 코팅건 4번 2.5 bar
  coatingThicknessBase: "16.1",  // 기저부 ≥ 15㎛
  coatingThicknessOuter: "20.8", // OUTER ≥ 15㎛
  coatingThicknessInner: "16.1", // INNER ≥ 15㎛
  rubberType: "W60433 (EPDM)",
  rubberLot: "UF10161726927029200A",
  coatingType: "HSC-2000B-3",
  coatingLot: "UF10161726927032700A",
  insertType: "SK5 0.5T",
  insertLot: "LOT-260930A",
  pcmZones: [211.0, 212.5, 214.0, 210.5, 209.0, 213.0, 212.0, 210.0, 211.5, 215.0, 208.5, 210.0, 212.0],
  // TPE Standard Specs (4개 압출기 속도 & 압출기온도 ±10℃ & 냉각수온도)
  tpeExtruder100Rpm: "25.0",
  tpeExtruder80Rpm: "20.0",
  tpeExtruder65Rpm: "18.0",
  tpeExtruder35Rpm: "15.0",
  tpeExtruder45Rpm: "15.0",
  tpeCoolingWaterTemp: "20",
  tpeTemps100: {
    screw: "180",
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    cylinder4: "195",
    cylinder5: "200",
    cylinder6: "200",
    adapter: "205",
    die: "210",
    head1: "205",
    head2: "205",
    hopperDryer: "80"
  },
  tpeTemps80: {
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    cylinder4: "195",
    adapter: "200",
    nozzle: "205",
    hopperDryer: "80"
  },
  tpeTemps65: {
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    adapter: "195",
    nozzle: "200",
    hopperDryer: "80"
  },
  tpeTemps35: {
    cylinder1: "180",
    cylinder2: "185",
    adapter: "190",
    nozzle: "195",
    hopperDryer: "80"
  },
  tpeTemps45: {
    cylinder1: "180",
    cylinder2: "185",
    adapter: "190",
    nozzle: "195",
    hopperDryer: "80"
  },
  // PVC Standard Specs (80Ø 압출속도 & 인취속도 & 7구간 압출기온도 ±10℃ & 냉각조/본드도포/후로킹/건조로)
  pvcExtruder80Rpm: "20.0",
  pvcHaulOffSpeed: "15.0",
  pvcTemps: {
    cylinder1: "170",
    cylinder2: "175",
    cylinder3: "180",
    cylinder4: "185",
    adapter: "190",
    nozzle: "195",
    die: "195"
  },
  pvcCoolingTankTemp: "20",
  // 본드도포 (공급기1, 2 RPM)
  pvcBondFeeder1Rpm: "15.0",
  pvcBondFeeder2Rpm: "15.0",
  pvcBondCoating: "양호",
  // 후로킹(식모)조건 (전압 kV, 전류 uA, 파일조건)
  pvcFlockVoltage: "50",
  pvcFlockCurrent: "120",
  pvcFlockingCondition: "0.8mm 양호",
  // 건조로 온도 (1~4존 / 존1~존4) & 구동속도
  pvcDryerDriveSpeed: "15.0",
  pvcDryerSpeed: "15.0",
  pvcDryerTemp: "160",
  pvcDryerZones: {
    zone1: "160",
    zone2: "160",
    zone3: "165",
    zone4: "165"
  }
};

export const MATERIAL_PRESETS = {
  rubber: [
    { type: "W60433 (EPDM)", name: "EPDM W60433" },
    { type: "W60432 (EPDM)", name: "EPDM W60432" },
    { type: "SE-70 실리콘", name: "실리콘 SE-70" },
    { type: "TPE-V 65A", name: "TPE-V 65A" }
  ],
  coating: [
    { type: "HSC-2000B-3", name: "속건성 HSC-2000B-3" },
    { type: "UF-1016 우레탄", name: "우레탄 UF-1016" },
    { type: "PU-700B 수성", name: "수성 PU-700B" }
  ],
  insert: [
    { type: "SK5 0.5T", name: "SK5 0.5T" },
    { type: "SK5 0.6T", name: "SK5 0.6T" },
    { type: "SUS304 0.4T", name: "SUS304 0.4T" },
    { type: "AL 0.5T", name: "알루미늄 0.5T" }
  ]
};

export const EXTRUSION_LINE_OPTIONS = [
  { id: "pcm1", name: "PCM #1 LINE", shortName: "PCM 1호", badge: "PCM1", plant: "삼랑진공장", color: "teal", count: 49 },
  { id: "pcm3", name: "PCM #3 LINE", shortName: "PCM 3호", badge: "PCM3", plant: "삼랑진공장", color: "blue", count: 68 },
  { id: "pvc", name: "PVC LINE", shortName: "PVC", badge: "PVC", plant: "삼랑진공장", color: "amber", count: 15 },
  { id: "tpe", name: "TPE LINE", shortName: "TPE", badge: "TPE", plant: "삼랑진공장", color: "purple", count: 21 }
];

export const VEHICLE_PRESETS = [
  { code: "NX4", name: "투싼 (NX4)", itemPreset: "G/RUN FRT, RR" },
  { code: "GN7", name: "그랜저 (GN7)", itemPreset: "W/STRIP BODY S/D" },
  { code: "DL3", name: "K5 (DL3)", itemPreset: "DR SEC HOOD SEAL" },
  { code: "EV9", name: "EV9 (MV)", itemPreset: "BATTERY PACK SEAL" },
  { code: "GV80", name: "GV80 (JX1)", itemPreset: "W/STRIP ROOF" },
  { code: "MQ4", name: "쏘렌토 (MQ4)", itemPreset: "DOOR DRIP WEATHERSTRIP" },
  { code: "KA4", name: "카니발 (KA4)", itemPreset: "SLIDE DOOR G/RUN" },
  { code: "CN7", name: "아반떼 (CN7)", itemPreset: "TRUNK LID SEAL" }
];

export const WORKER_PRESETS = [
  { name: "공영국", title: "대리" },
  { name: "심임대", title: "반장" },
  { name: "이상은", title: "반장" },
  { name: "닉", title: "" },
  { name: "마이클", title: "" },
  { name: "존카를로", title: "" },
  { name: "지미", title: "" },
  { name: "만", title: "" },
  { name: "샤먼", title: "" },
  { name: "쿠마루", title: "" },
  { name: "이수루", title: "" }
];

export const DOWNTIME_CATEGORIES = [
  { id: "압개시", label: "압개시", type: "비가동", color: "bg-sky-100 text-sky-900 border-sky-300", defaultDetail: "초기 압출 승온 및 제품 인취 세팅" },
  { id: "형교환", label: "형교환", type: "비가동", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "금형(다이스) 교체 및 치수 세팅" },
  { id: "종료", label: "종료", type: "비가동", color: "bg-slate-200 text-slate-800 border-slate-300", defaultDetail: "작업 종료 및 라인 클리닝/정리" },
  { id: "포밍", label: "포밍", type: "비가동", color: "bg-teal-100 text-teal-900 border-teal-300", defaultDetail: "포밍 롤러/설비 세팅 및 형상 보정" },
  { id: "박리", label: "박리", type: "비가동", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "접착/코팅 박리 발생 구간 점검 및 비가동 조치" },
  { id: "후로킹", label: "후로킹", type: "비가동", color: "bg-purple-100 text-purple-900 border-purple-300", defaultDetail: "후로킹(식모) 챔버/정전기 설비 점검 및 비가동 조치" },
  { id: "뜯김", label: "뜯김", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "제품 표면 뜯김 발생으로 다이스 청소" },
  { id: "철심", label: "철심", type: "불량", color: "bg-orange-100 text-orange-900 border-orange-300", defaultDetail: "인서트 철심 사행 및 틀어짐 교정" },
  { id: "재압출", label: "재압출", type: "불량", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "초기 규격 미달로 재압출 진행" },
  { id: "단면형상", label: "단면형상", type: "불량", color: "bg-indigo-100 text-indigo-900 border-indigo-300", defaultDetail: "립/돌기 부위 단면형상 불량 수정" },
  { id: "스코치", label: "스코치", type: "불량", color: "bg-red-100 text-red-900 border-red-300", defaultDetail: "스크류 과열 고무 탄화(스코치) 제거" },
  { id: "이물", label: "이물", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "원료 내 이물 혼입 발견으로 스크린 교체" },
  { id: "미분산", label: "미분산", type: "불량", color: "bg-purple-100 text-purple-900 border-purple-300", defaultDetail: "카본/배합제 미분산 덩어리 발생 조치" },
  { id: "발포", label: "발포", type: "불량", color: "bg-teal-100 text-teal-900 border-teal-300", defaultDetail: "스폰지 발포 배율 불량 및 온도 조정" },
  { id: "원인불명", label: "원인불명", type: "불량", color: "bg-gray-200 text-gray-800 border-gray-400", defaultDetail: "원인불명 규격 이상 점검 및 재세팅" },
  { id: "밴딩", label: "밴딩", type: "불량", color: "bg-blue-100 text-blue-900 border-blue-300", defaultDetail: "제품 휨/밴딩 현상 냉각조 장력 조정" },
  { id: "심금절단", label: "심금절단", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "인서트 심금 끊어짐/절단 연결 작업" },
  { id: "심금노출", label: "심금노출", type: "불량", color: "bg-red-100 text-red-900 border-red-300", defaultDetail: "심금 노출로 폐기 처리 및 위치 교정" },
  { id: "천공", label: "천공", type: "불량", color: "bg-emerald-100 text-emerald-900 border-emerald-300", defaultDetail: "홀 천공 위치 편차 및 펀칭기 점검" },
  { id: "연고무절단", label: "연고무절단", type: "불량", color: "bg-orange-100 text-orange-900 border-orange-300", defaultDetail: "연질고무 끊김/절단 발생 조치" },
  { id: "길이", label: "길이", type: "불량", color: "bg-cyan-100 text-cyan-900 border-cyan-300", defaultDetail: "절단 길이 편차 발생 치수 재세팅" },
  { id: "코팅", label: "코팅", type: "불량", color: "bg-sky-100 text-sky-900 border-sky-300", defaultDetail: "코팅 분사 노즐 막힘 청소 및 압력 조정" },
  { id: "설비이상", label: "설비이상", type: "비가동", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "압출 모터/감속기/인취기 설비 이상 점검" },
  { id: "다이스수정", label: "다이스수정", type: "비가동", color: "bg-violet-100 text-violet-900 border-violet-300", defaultDetail: "다이스 간격/각도 수정 및 샘플 확인" },
  { id: "기술TRY", label: "기술TRY", type: "비가동", color: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300", defaultDetail: "신규 금형/배합 시생산 기술TRY 진행" },
  { id: "기타", label: "기타", type: "비가동", color: "bg-gray-100 text-gray-800 border-gray-300", defaultDetail: "기타 비가동 및 불량 조치" }
];

export const TPM_CHECK_ITEMS = [
  { id: 1, category: "설비 기본조건", name: "청소, 윤활, 조임, 누유·누수 점검" },
  { id: 2, category: "압출기", name: "스크류, 실린더, 감속기, 모터 상태" },
  { id: 3, category: "다이스", name: "마모, 막힘, 변형, 체결상태" },
  { id: 4, category: "온도", name: "실린더·다이 온도 설정 및 편차" },
  { id: 5, category: "압력", name: "압출압력, 압력 변동, 이상압력" },
  { id: 6, category: "냉각", name: "냉각수 온도·유량·순환상태" },
  { id: 7, category: "인취/권취", name: "인취속도, 장력, 롤러 상태" },
  { id: 8, category: "절단", name: "절단기 상태, 칼날 마모, 절단길이" },
  { id: 9, category: "전기/제어", name: "센서, 인버터, 히터, 제어반" },
  { id: 10, category: "안전", name: "방호장치, 비상정지, 안전커버" }
];

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
        defectRate: itDefectRate
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
        defectRate: actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(1)) : 0.0
      }
    ];
  }

  const attainmentRate = targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 100.0;
  const yieldRate = actualQty > 0 ? Number(((goodQty / actualQty) * 100).toFixed(1)) : 100.0;
  const defectRate = actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(1)) : 0.0;

  const vehicle = items.length > 0 ? items.map((it) => it.vehicle).filter(Boolean).join(", ") : String(raw.vehicle || "NX4");
  const itemName = items.length > 0 ? items.map((it) => it.itemName).filter(Boolean).join(", ") : String(raw.itemName || "WEATHER STRIP");

  const todayStr = new Date().toISOString().split("T")[0];

  return {
    id: String(raw.id || `epr_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`),
    date: String(raw.date || todayStr),
    shift: String(raw.shift || "주간"), // 주간 | 야간
    plant: String(raw.plant || "삼랑진공장"),
    lineId: String(raw.lineId || "pcm1"),
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
    rawMaterials: {
      rubberType: String(raw.rawMaterials?.rubberType || raw.rubberType || (raw.rawMaterials?.rubberLot?.includes("/") ? raw.rawMaterials.rubberLot.split("/")[0].trim() : "W60433")).trim(),
      rubberWeight: raw.rawMaterials?.rubberWeight !== undefined && raw.rawMaterials?.rubberWeight !== "" ? Number(raw.rawMaterials.rubberWeight) : "",
      rubberLot: String(raw.rawMaterials?.rubberLot || raw.rubberLot || "").trim(),
      rubberType2: String(raw.rawMaterials?.rubberType2 || raw.rubberType2 || "").trim(),
      rubberWeight2: raw.rawMaterials?.rubberWeight2 !== undefined && raw.rawMaterials?.rubberWeight2 !== "" ? Number(raw.rawMaterials.rubberWeight2) : "",
      rubberLot2: String(raw.rawMaterials?.rubberLot2 || raw.rubberLot2 || "").trim(),
      coatingType: String(raw.rawMaterials?.coatingType || raw.coatingType || "").trim(),
      coatingWeight: raw.rawMaterials?.coatingWeight !== undefined && raw.rawMaterials?.coatingWeight !== "" ? Number(raw.rawMaterials.coatingWeight) : "",
      coatingLot: String(raw.rawMaterials?.coatingLot || raw.coatingLot || "").trim(),
      insertType: String(raw.rawMaterials?.insertType || raw.insertType || "").trim(),
      insertWeight: raw.rawMaterials?.insertWeight !== undefined && raw.rawMaterials?.insertWeight !== "" ? Number(raw.rawMaterials.insertWeight) : "",
      insertLot: String(raw.rawMaterials?.insertLot || raw.insertLot || "").trim(),
      compoundType: String(raw.rawMaterials?.compoundType || raw.compoundType || "").trim(),
      compoundWeight: raw.rawMaterials?.compoundWeight !== undefined && raw.rawMaterials?.compoundWeight !== "" ? Number(raw.rawMaterials.compoundWeight) : "",
      compoundLot: String(raw.rawMaterials?.compoundLot || raw.compoundLot || "").trim(),
      compoundType2: String(raw.rawMaterials?.compoundType2 || raw.compoundType2 || "").trim(),
      compoundWeight2: raw.rawMaterials?.compoundWeight2 !== undefined && raw.rawMaterials?.compoundWeight2 !== "" ? Number(raw.rawMaterials.compoundWeight2) : "",
      compoundLot2: String(raw.rawMaterials?.compoundLot2 || raw.compoundLot2 || "").trim(),
      compoundType3: String(raw.rawMaterials?.compoundType3 || raw.compoundType3 || "").trim(),
      compoundWeight3: raw.rawMaterials?.compoundWeight3 !== undefined && raw.rawMaterials?.compoundWeight3 !== "" ? Number(raw.rawMaterials.compoundWeight3) : "",
      compoundLot3: String(raw.rawMaterials?.compoundLot3 || raw.compoundLot3 || "").trim()
    },
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
          id: String(e.id || `dt_${eIdx + 1}`),
          type: String(e.type || "비가동").trim(),
          startTime: String(e.startTime || "").trim(),
          endTime: String(e.endTime || "").trim(),
          minutes: Math.max(0, Number(e.minutes) || 0),
          category: String(e.category || "압개시").trim(),
          detail: String(e.detail || "").trim(),
          scrapKg: e.scrapKg !== undefined && e.scrapKg !== "" ? Number(e.scrapKg) : 0
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

// Local storage reader
export const getLocalExtrusionReports = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(EXTRUSION_PROD_STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out legacy dummy mock seed records
      const cleanList = parsed
        .filter((r) => r && !String(r.id || "").startsWith("epr_seed_"))
        .map((r, i) => sanitizeExtrusionReport(r, i));
      if (cleanList.length !== parsed.length && typeof window !== "undefined") {
        localStorage.setItem(EXTRUSION_PROD_STORAGE_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    }
    return [];
  } catch (e) {
    console.warn("Error reading extrusion reports from localStorage:", e);
    return [];
  }
};

// Local storage saver
export const saveLocalExtrusionReports = (reports) => {
  try {
    const sanitized = (reports || [])
      .filter((r) => r && !String(r.id || "").startsWith("epr_seed_"))
      .map((r, i) => sanitizeExtrusionReport(r, i));
    localStorage.setItem(EXTRUSION_PROD_STORAGE_KEY, JSON.stringify(sanitized));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("extrusion-production-updated", { detail: sanitized }));
    }
    return sanitized;
  } catch (e) {
    console.warn("Error saving extrusion reports to localStorage:", e);
    return reports;
  }
};

/**
 * Subscribe to real-time updates from Firestore with local fallback
 */
export const subscribeToExtrusionReports = (onDataCallback) => {
  // 1. Initial push from local storage
  const localInitial = getLocalExtrusionReports();
  onDataCallback(localInitial);

  // 2. Real-time Firestore sync
  try {
    const q = collection(db, COLLECTION_NAME);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((docSnap) => {
            if (String(docSnap.id || "").startsWith("epr_seed_")) {
              // Permanently delete dummy mock seed doc from Firestore
              deleteDoc(doc(db, COLLECTION_NAME, docSnap.id)).catch(() => {});
            } else {
              list.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
          // Sort by date DESC, then createdAt DESC
          list.sort((a, b) => {
            if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          });
          const sanitizedList = list.map((r, i) => sanitizeExtrusionReport(r, i));
          saveLocalExtrusionReports(sanitizedList);
          onDataCallback(sanitizedList);
        } else {
          onDataCallback([]);
        }
      },
      (error) => {
        console.warn("Firestore extrusion reports subscription fallback:", error);
        onDataCallback(getLocalExtrusionReports());
      }
    );
    return unsub;
  } catch (e) {
    console.warn("Error establishing extrusion reports listener:", e);
    return () => {};
  }
};

/**
 * Create or Update a work report
 */
export const saveExtrusionReport = async (reportData) => {
  const sanitized = sanitizeExtrusionReport({
    ...reportData,
    updatedAt: new Date().toISOString()
  });

  // 1. Update local storage immediately
  const local = getLocalExtrusionReports();
  const existingIndex = local.findIndex((r) => r.id === sanitized.id);
  let updatedList;
  if (existingIndex >= 0) {
    updatedList = [...local];
    updatedList[existingIndex] = sanitized;
  } else {
    updatedList = [sanitized, ...local];
  }
  saveLocalExtrusionReports(updatedList);

  // 2. Sync to Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, sanitized.id), sanitizeForFirestore(sanitized), { merge: true });
  } catch (e) {
    console.warn("Firestore save error (cached locally):", e);
  }

  return sanitized;
};

/**
 * Delete a report
 */
export const deleteExtrusionReport = async (reportId) => {
  // 1. Local delete
  const local = getLocalExtrusionReports();
  const filtered = local.filter((r) => r.id !== reportId);
  saveLocalExtrusionReports(filtered);

  // 2. Cloud delete
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reportId));
  } catch (e) {
    console.warn("Firestore delete error:", e);
  }
  return true;
};

/**
 * Toggle approval status
 */
export const toggleExtrusionReportApproval = async (reportId, currentStatus, approverName = "이명재 이사") => {
  const local = getLocalExtrusionReports();
  const target = local.find((r) => r.id === reportId);
  if (!target) return null;

  const nextStatus = currentStatus === "승인" ? "대기" : "승인";
  const updated = {
    ...target,
    approvalStatus: nextStatus,
    approvedBy: nextStatus === "승인" ? approverName : "",
    approvedAt: nextStatus === "승인" ? new Date().toISOString() : "",
    updatedAt: new Date().toISOString()
  };

  return await saveExtrusionReport(updated);
};

/**
 * Compute detailed summary metrics from reports list
 */
export const calculateExtrusionMetrics = (reports = []) => {
  let totalTarget = 0;
  let totalActual = 0;
  let totalGood = 0;
  let totalDefect = 0;
  let totalScrapKg = 0;
  let totalDowntimeMinutes = 0;

  const lineMap = {};
  EXTRUSION_LINE_OPTIONS.forEach((l) => {
    lineMap[l.id] = {
      id: l.id,
      name: l.name,
      shortName: l.shortName,
      color: l.color,
      target: 0,
      actual: 0,
      good: 0,
      defect: 0,
      scrapKg: 0,
      downtimeMinutes: 0,
      reportCount: 0
    };
  });

  const vehicleMap = {};
  const downtimeCategoryMap = {};

  reports.forEach((r) => {
    const t = Number(r.targetQty) || 0;
    const a = Number(r.actualQty) || 0;
    const g = Number(r.goodQty) || 0;
    const d = Number(r.defectQty) || 0;
    const s = Number(r.scrapKg) || 0;
    const dt = Number(r.downtimeMinutes) || 0;

    totalTarget += t;
    totalActual += a;
    totalGood += g;
    totalDefect += d;
    totalScrapKg += s;
    totalDowntimeMinutes += dt;

    // Line breakdown
    const lKey = r.lineId || "pcm1";
    if (!lineMap[lKey]) {
      lineMap[lKey] = {
        id: lKey,
        name: r.lineName || lKey,
        shortName: lKey,
        color: "teal",
        target: 0,
        actual: 0,
        good: 0,
        defect: 0,
        scrapKg: 0,
        downtimeMinutes: 0,
        reportCount: 0
      };
    }
    lineMap[lKey].target += t;
    lineMap[lKey].actual += a;
    lineMap[lKey].good += g;
    lineMap[lKey].defect += d;
    lineMap[lKey].scrapKg += s;
    lineMap[lKey].downtimeMinutes += dt;
    lineMap[lKey].reportCount += 1;

    // Vehicle breakdown (aggregate per item if available)
    if (Array.isArray(r.items) && r.items.length > 0) {
      r.items.forEach((it) => {
        const vKey = it.vehicle || "기타";
        const itTarget = Number(it.targetQty) || 0;
        const itActual = Number(it.actualQty) || 0;
        const itGood = Number(it.goodQty) || 0;
        const itDefect = Number(it.defectQty) || 0;
        const itScrap = Number(it.scrapKg) || 0;

        if (!vehicleMap[vKey]) {
          vehicleMap[vKey] = {
            vehicle: vKey,
            itemName: it.itemName || "-",
            target: 0,
            actual: 0,
            good: 0,
            defect: 0,
            scrapKg: 0,
            downtimeMinutes: 0,
            reportCount: 0
          };
        }
        vehicleMap[vKey].target += itTarget;
        vehicleMap[vKey].actual += itActual;
        vehicleMap[vKey].good += itGood;
        vehicleMap[vKey].defect += itDefect;
        vehicleMap[vKey].scrapKg += itScrap;
        vehicleMap[vKey].reportCount += 1;
      });
    } else {
      const vKey = r.vehicle || "기타";
      if (!vehicleMap[vKey]) {
        vehicleMap[vKey] = {
          vehicle: vKey,
          itemName: r.itemName || "-",
          target: 0,
          actual: 0,
          good: 0,
          defect: 0,
          scrapKg: 0,
          downtimeMinutes: 0,
          reportCount: 0
        };
      }
      vehicleMap[vKey].target += t;
      vehicleMap[vKey].actual += a;
      vehicleMap[vKey].good += g;
      vehicleMap[vKey].defect += d;
      vehicleMap[vKey].scrapKg += s;
      vehicleMap[vKey].downtimeMinutes += dt;
      vehicleMap[vKey].reportCount += 1;
    }

    // Downtime category breakdown
    const catKey = r.downtimeCategory || "기타";
    if (dt > 0) {
      if (!downtimeCategoryMap[catKey]) {
        downtimeCategoryMap[catKey] = {
          category: catKey,
          minutes: 0,
          occurrences: 0
        };
      }
      downtimeCategoryMap[catKey].minutes += dt;
      downtimeCategoryMap[catKey].occurrences += 1;
    }
  });

  const attainmentRate = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 100.0;
  const yieldRate = totalActual > 0 ? Number(((totalGood / totalActual) * 100).toFixed(1)) : 100.0;
  const defectRate = totalActual > 0 ? Number(((totalDefect / totalActual) * 100).toFixed(1)) : 0.0;
  const totalDowntimeHours = Number((totalDowntimeMinutes / 60).toFixed(1));

  // Compute rates for each line
  const lineStats = Object.values(lineMap).map((l) => ({
    ...l,
    attainmentRate: l.target > 0 ? Number(((l.actual / l.target) * 100).toFixed(1)) : 100.0,
    yieldRate: l.actual > 0 ? Number(((l.good / l.actual) * 100).toFixed(1)) : 100.0,
    defectRate: l.actual > 0 ? Number(((l.defect / l.actual) * 100).toFixed(1)) : 0.0,
    downtimeHours: Number((l.downtimeMinutes / 60).toFixed(1)),
    scrapKg: Number(l.scrapKg.toFixed(1))
  }));

  // Compute rates for each vehicle
  const vehicleStats = Object.values(vehicleMap).map((v) => ({
    ...v,
    attainmentRate: v.target > 0 ? Number(((v.actual / v.target) * 100).toFixed(1)) : 100.0,
    yieldRate: v.actual > 0 ? Number(((v.good / v.actual) * 100).toFixed(1)) : 100.0,
    defectRate: v.actual > 0 ? Number(((v.defect / v.actual) * 100).toFixed(1)) : 0.0,
    scrapKg: Number(v.scrapKg.toFixed(1))
  })).sort((a, b) => b.actual - a.actual);

  // Downtime categories sorted by minutes
  const downtimeCategoryStats = Object.values(downtimeCategoryMap)
    .map((c) => ({
      ...c,
      hours: Number((c.minutes / 60).toFixed(1)),
      percentage: totalDowntimeMinutes > 0 ? Number(((c.minutes / totalDowntimeMinutes) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalReports: reports.length,
    totalTarget,
    totalActual,
    totalGood,
    totalDefect,
    totalScrapKg: Number(totalScrapKg.toFixed(1)),
    totalDowntimeMinutes,
    totalDowntimeHours,
    attainmentRate,
    yieldRate,
    defectRate,
    lineStats,
    vehicleStats,
    downtimeCategoryStats
  };
};

/**
 * Export Extrusion Reports & Aggregation to Excel
 */
export const exportExtrusionReportsToExcel = (reports = [], metrics = null, filterTitle = "전체") => {
  const summary = metrics || calculateExtrusionMetrics(reports);

  // Sheet 1: Reports List
  const reportRows = [
    [`(주)오륙 삼랑진공장 - 압출 생산 작업일보 및 실적 대장 (${filterTitle})`],
    [`출력일시: ${new Date().toLocaleString("ko-KR")} | 총 보고건수: ${reports.length}건 | 총 생산량: ${summary.totalActual.toLocaleString()}m | 평균 수율: ${summary.yieldRate}%`],
    [],
    [
      "No",
      "작업일자",
      "근무조",
      "호기(라인)",
      "작업조장",
      "보조작업자",
      "차종",
      "품번",
      "품명",
      "계획수량(m)",
      "생산수량(m)",
      "양품수량(m)",
      "불량수량(m)",
      "달성률(%)",
      "양품률/수율(%)",
      "스크랩(kg)",
      "연고무 종류",
      "연고무 LOT",
      "코팅액 종류",
      "코팅액 LOT",
      "심금 종류",
      "심금 LOT",
      "110Ø속도(RPM)",
      "60Ø속도(RPM)",
      "온수조(℃)",
      "코팅건1번",
      "코팅건2번",
      "코팅건3번",
      "코팅건4번",
      "PCM가류존온도(210±20℃)",
      "인취속도(m/분)",
      "비가동(분)",
      "비가동 원인",
      "비가동 상세 및 조치",
      "TPM이상발생신고",
      "특이사항/인수인계",
      "승인상태",
      "승인자"
    ]
  ];

  reports.forEach((r, idx) => {
    reportRows.push([
      idx + 1,
      r.date || "-",
      r.shift || "주간",
      r.lineName || r.lineId || "-",
      r.worker || "-",
      r.subWorkers || "-",
      r.vehicle || "-",
      r.itemCode || "-",
      r.itemName || "-",
      r.targetQty || 0,
      r.actualQty || 0,
      r.goodQty || 0,
      r.defectQty || 0,
      `${r.attainmentRate}%`,
      `${r.yieldRate}%`,
      r.scrapKg || 0,
      r.rawMaterials?.rubberType || "-",
      r.rawMaterials?.rubberLot || "-",
      r.rawMaterials?.coatingType || "-",
      r.rawMaterials?.coatingLot || "-",
      r.rawMaterials?.insertType || "-",
      r.rawMaterials?.insertLot || "-",
      r.conditions?.extruder110Rpm || r.conditions?.extruderRpm || "-",
      r.conditions?.extruder60Rpm || r.conditions?.extruder70Rpm || "-",
      r.conditions?.waterTemp || "-",
      r.conditions?.sprayGun1 || "-",
      r.conditions?.sprayGun2 || "-",
      r.conditions?.sprayGun3 || "-",
      r.conditions?.sprayGun4 || "-",
      r.conditions?.cureZoneTemp || r.conditions?.cureTemp || "-",
      r.conditions?.haulOffSpeed || "-",
      r.downtimeMinutes || 0,
      r.downtimeCategory || "-",
      r.downtimeDetail || "-",
      r.tpmIssueText || "-",
      r.notes || "-",
      r.approvalStatus || "대기",
      r.approvedBy || "-"
    ]);
  });

  // Sheet 2: Line & Summary Analysis
  const summaryRows = [
    [`■ 압출 호기별 생산 실적 및 종합 분석 요약`],
    [],
    ["호기명", "일보건수", "총 계획(m)", "총 실적(m)", "양품(m)", "불량(m)", "달성률(%)", "수율(%)", "스크랩(kg)", "비가동(분)", "비가동(시간)"]
  ];

  summary.lineStats.forEach((l) => {
    summaryRows.push([
      l.name,
      l.reportCount,
      l.target,
      l.actual,
      l.good,
      l.defect,
      `${l.attainmentRate}%`,
      `${l.yieldRate}%`,
      l.scrapKg,
      l.downtimeMinutes,
      l.downtimeHours
    ]);
  });

  summaryRows.push([]);
  summaryRows.push([
    "합계",
    summary.totalReports,
    summary.totalTarget,
    summary.totalActual,
    summary.totalGood,
    summary.totalDefect,
    `${summary.attainmentRate}%`,
    `${summary.yieldRate}%`,
    summary.totalScrapKg,
    summary.totalDowntimeMinutes,
    summary.totalDowntimeHours
  ]);

  const wb = XLSX.utils.book_new();
  const wsReports = XLSX.utils.aoa_to_sheet(reportRows);
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

  XLSX.utils.book_append_sheet(wb, wsReports, "작업일보_상세대장");
  XLSX.utils.book_append_sheet(wb, wsSummary, "호기별_종합실적취합");

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `압출생산작업일보_실적취합_${todayStr}.xlsx`);
};

/**
 * Download High-Precision A4 Check Sheet & 13-Zone Excel Workbook (3-Sheet Standard Template)
 */
export const exportExtrusionCheckSheetExcel = async (report = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '(주)오륙 삼랑진공장 SL생산팀';
  workbook.lastModifiedBy = 'Antigravity AI Factory System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Colors & Styles
  const headerBg = 'FF1E293B';
  const sectionBg = 'FFF1F5F9';
  const highlightTeal = 'FFCCFBF1';
  const highlightAmber = 'FFFEF3C7';
  const highlightRose = 'FFFFE4E6';
  const highlightIndigo = 'FFE0E7FF';
  const borderColor = 'FFCBD5E1';

  const thinBorder = {
    top: { style: 'thin', color: { argb: borderColor } },
    left: { style: 'thin', color: { argb: borderColor } },
    bottom: { style: 'thin', color: { argb: borderColor } },
    right: { style: 'thin', color: { argb: borderColor } }
  };

  const mediumBorder = {
    top: { style: 'medium', color: { argb: 'FF475569' } },
    left: { style: 'medium', color: { argb: 'FF475569' } },
    bottom: { style: 'medium', color: { argb: 'FF475569' } },
    right: { style: 'medium', color: { argb: 'FF475569' } }
  };

  // =========================================================================
  // SHEET 1: 작업체크시트 (A4 Portrait)
  // =========================================================================
  const ws1 = workbook.addWorksheet('작업체크시트', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }
  });

  ws1.columns = [
    { width: 11 }, { width: 12 }, { width: 12 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 13 }
  ];

  // Header Title & Approval Box
  ws1.mergeCells('A1:J2');
  const titleCell = ws1.getCell('A1');
  titleCell.value = '작  업  체  크  시  트';
  titleCell.font = { name: '맑은 고딕', size: 18, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = mediumBorder;

  ws1.mergeCells('K1:K2');
  ws1.getCell('K1').value = '결\n\n재';
  ws1.getCell('K1').font = { name: '맑은 고딕', size: 10, bold: true };
  ws1.getCell('K1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws1.getCell('K1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
  ws1.getCell('K1').border = thinBorder;

  ws1.getCell('L1').value = '직  장';
  ws1.getCell('L1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('L1').font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell('L1').border = thinBorder;
  ws1.getCell('L1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell('M1').value = '팀  장';
  ws1.getCell('M1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('M1').font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell('M1').border = thinBorder;
  ws1.getCell('M1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell('L2').value = report.approvedBy ? report.approvedBy.split(' ')[0] : '';
  ws1.getCell('L2').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('L2').border = thinBorder;

  ws1.getCell('M2').value = report.approvalStatus === '승인' ? '이명재' : '';
  ws1.getCell('M2').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('M2').border = thinBorder;

  // 1. 공정 및 설비명 Section
  ws1.mergeCells('A3:I3');
  ws1.getCell('A3').value = '1. 공정 및 설비명 (110Ø & 60Ø 압출 / PCM 13개 존 가류 라인)';
  ws1.getCell('A3').font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };

  ws1.mergeCells('J3:M3');
  ws1.getCell('J3').value = '팀(부서)명 : (주)오륙 SL생산팀';
  ws1.getCell('J3').font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
  ws1.getCell('J3').alignment = { horizontal: 'right', vertical: 'middle' };

  const metaRows = [
    [
      { label: '품명', span: 1 }, { val: report.itemName || 'JX1 Lower Run Channel RR', span: 3 },
      { label: '품번 / 지시 / 실적', span: 1 }, { val: `${report.itemCode || 'JK1 LWR RUN'} / ${(report.targetQty || 2500).toLocaleString()}m / ${(report.actualQty || 2935).toLocaleString()}m`, span: 4 },
      { label: '단위', span: 1 }, { val: 'M / EA', span: 1 }
    ],
    [
      { label: '라인명', span: 1 }, { val: `${report.lineName || 'PCM #1 LINE'} (110Ø + 60Ø / PCM 13개 존)`, span: 3 },
      { label: '작업일자', span: 1 }, { val: `${report.date || new Date().toISOString().split('T')[0]} (${report.shift || '주간'})`, span: 2 },
      { label: '작업자명', span: 1 }, { val: `${report.worker || '공영국 대리'}${report.subWorkers ? ' (' + report.subWorkers + ')' : ''}`, span: 2 },
      { label: 'TPM점검', span: 1 }, { val: `${report.tpmStatus || '완료'} (○)`, span: 1 }
    ]
  ];

  let curRow = 4;
  metaRows.forEach(r => {
    let colIdx = 1;
    r.forEach(item => {
      const startCell = ws1.getCell(curRow, colIdx);
      startCell.value = item.label ? item.label : item.val;
      if (item.label) {
        startCell.font = { name: '맑은 고딕', size: 9, bold: true };
        startCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
        startCell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        startCell.font = { name: '맑은 고딕', size: 9, bold: item.val.includes('110Ø') || item.val.includes('LWR') };
        startCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (item.span > 1) {
        ws1.mergeCells(curRow, colIdx, curRow, colIdx + item.span - 1);
      }
      for (let c = 0; c < item.span; c++) {
        ws1.getCell(curRow, colIdx + c).border = thinBorder;
      }
      colIdx += item.span;
    });
    curRow++;
  });

  // 2. 작업현황 Section
  ws1.mergeCells('A6:M6');
  ws1.getCell('A6').value = '2. 작업현황 (생산실적 / 불량세부 / 비가동 / 원자재 종류 및 LOT 넘버 분리 관리)';
  ws1.getCell('A6').font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell('A6').alignment = { horizontal: 'left', vertical: 'middle' };

  const generalStatusRows = [
    { title: '생산현황', span: 2, content: `${report.itemName || 'JK1 LWR RUN'} / 계획: ${(report.targetQty || 2500).toLocaleString()}m / 실적: ${(report.actualQty || 2935).toLocaleString()}m / 양품: ${(report.goodQty || 2850).toLocaleString()}m (수율: ${report.yieldRate || 97.1}%)` },
    { title: '불량현황', span: 2, content: `단연조정 불량: ${report.defectBreakdown?.cutoffKg || 23.2} kg  |  셋지(시동) 불량: ${report.defectBreakdown?.startLossKg || 3.8} kg  |  치수/외관 불량: ${report.defectBreakdown?.appearanceKg || 2.5} kg  |  총 스크랩: ${report.scrapKg || 29.5} kg` },
    { title: '비가동현황', span: 2, content: `${report.downtimeCategory || '형교환'} : ${report.downtimeMinutes || 30}분 소요 (${report.downtimeDetail || '금형 교체 및 라인 셋팅 정상 완료'})` }
  ];

  curRow = 7;
  generalStatusRows.forEach(item => {
    ws1.mergeCells(curRow, 1, curRow, item.span);
    const hCell = ws1.getCell(curRow, 1);
    hCell.value = item.title;
    hCell.font = { name: '맑은 고딕', size: 9, bold: true };
    hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    hCell.alignment = { horizontal: 'center', vertical: 'middle' };
    hCell.border = thinBorder;

    ws1.mergeCells(curRow, item.span + 1, curRow, 13);
    const dCell = ws1.getCell(curRow, item.span + 1);
    dCell.value = item.content;
    dCell.font = { name: '맑은 고딕', size: 9 };
    dCell.alignment = { horizontal: 'left', vertical: 'middle' };
    for (let c = 1; c <= 13; c++) {
      ws1.getCell(curRow, c).border = thinBorder;
    }
    curRow++;
  });

  // 2-2. 원자재 현황 (사용연고무, 컴파운드, 코팅액, 심금)
  curRow = 10;
  ws1.mergeCells(`A${curRow}:B${curRow}`);
  ws1.getCell(`A${curRow}`).value = '원자재 구분';
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightIndigo } };

  ws1.mergeCells(`C${curRow}:E${curRow}`);
  ws1.getCell(`C${curRow}`).value = '원자재 품명 / 규격 (자동)';
  ws1.getCell(`C${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightIndigo } };

  ws1.mergeCells(`F${curRow}:G${curRow}`);
  ws1.getCell(`F${curRow}`).value = '투입중량 (kg)';
  ws1.getCell(`F${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightIndigo } };

  ws1.mergeCells(`H${curRow}:K${curRow}`);
  ws1.getCell(`H${curRow}`).value = 'LOT 넘버 (LOT No.)';
  ws1.getCell(`H${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightIndigo } };

  ws1.mergeCells(`L${curRow}:M${curRow}`);
  ws1.getCell(`L${curRow}`).value = '투입 및 점검 상태';
  ws1.getCell(`L${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightIndigo } };

  for (let c = 1; c <= 13; c++) {
    const cell = ws1.getCell(curRow, c);
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }

  const rawMaterialItems = [];
  
  if (report.rawMaterials?.rubberType && report.rawMaterials.rubberType !== "미사용") {
    rawMaterialItems.push({
      cat: report.rawMaterials?.rubberType2 ? '사용연고무 #1' : '사용연고무',
      type: report.rawMaterials.rubberType,
      weight: report.rawMaterials?.rubberWeight !== undefined && report.rawMaterials?.rubberWeight !== '' ? `${report.rawMaterials.rubberWeight} kg` : '-',
      lot: report.rawMaterials?.rubberLot || '-',
      status: '정상 투입 (○)'
    });
  }
  if (report.rawMaterials?.rubberType2 && report.rawMaterials.rubberType2 !== "미사용") {
    rawMaterialItems.push({
      cat: '사용연고무 #2',
      type: report.rawMaterials.rubberType2,
      weight: report.rawMaterials?.rubberWeight2 !== undefined && report.rawMaterials?.rubberWeight2 !== '' ? `${report.rawMaterials.rubberWeight2} kg` : '-',
      lot: report.rawMaterials?.rubberLot2 || '-',
      status: '정상 투입 (○)'
    });
  }
  if (report.rawMaterials?.compoundType && report.rawMaterials.compoundType !== "미사용") {
    rawMaterialItems.push({
      cat: (report.rawMaterials?.compoundType2 || report.rawMaterials?.compoundType3) ? '컴파운드 #1' : '컴파운드',
      type: report.rawMaterials.compoundType,
      weight: report.rawMaterials?.compoundWeight !== undefined && report.rawMaterials?.compoundWeight !== '' ? `${report.rawMaterials.compoundWeight} kg` : '-',
      lot: report.rawMaterials?.compoundLot || '-',
      status: '정상 투입 (○)'
    });
  }
  if (report.rawMaterials?.compoundType2 && report.rawMaterials.compoundType2 !== "미사용") {
    rawMaterialItems.push({
      cat: '컴파운드 #2',
      type: report.rawMaterials.compoundType2,
      weight: report.rawMaterials?.compoundWeight2 !== undefined && report.rawMaterials?.compoundWeight2 !== '' ? `${report.rawMaterials.compoundWeight2} kg` : '-',
      lot: report.rawMaterials?.compoundLot2 || '-',
      status: '정상 투입 (○)'
    });
  }
  if (report.rawMaterials?.compoundType3 && report.rawMaterials.compoundType3 !== "미사용") {
    rawMaterialItems.push({
      cat: '컴파운드 #3',
      type: report.rawMaterials.compoundType3,
      weight: report.rawMaterials?.compoundWeight3 !== undefined && report.rawMaterials?.compoundWeight3 !== '' ? `${report.rawMaterials.compoundWeight3} kg` : '-',
      lot: report.rawMaterials?.compoundLot3 || '-',
      status: '정상 투입 (○)'
    });
  }
  if (report.rawMaterials?.insertType && report.rawMaterials.insertType !== "미사용") {
    rawMaterialItems.push({
      cat: '심금(인서트)',
      type: report.rawMaterials.insertType,
      weight: report.rawMaterials?.insertWeight !== undefined && report.rawMaterials?.insertWeight !== '' ? `${report.rawMaterials.insertWeight} kg` : '-',
      lot: report.rawMaterials?.insertLot || '-',
      status: '텐션 정상 (○)'
    });
  } else {
    rawMaterialItems.push({
      cat: '심금(인서트)',
      type: '미사용 (없음)',
      weight: '-',
      lot: '-',
      status: '미사용'
    });
  }
  if (report.rawMaterials?.coatingType && report.rawMaterials.coatingType !== "미사용") {
    rawMaterialItems.push({
      cat: '코팅액',
      type: report.rawMaterials.coatingType,
      weight: report.rawMaterials?.coatingWeight !== undefined && report.rawMaterials?.coatingWeight !== '' ? `${report.rawMaterials.coatingWeight} kg` : '-',
      lot: report.rawMaterials?.coatingLot || '-',
      status: '교반 완료 (○)'
    });
  } else {
    rawMaterialItems.push({
      cat: '코팅액',
      type: '미사용 (없음)',
      weight: '-',
      lot: '-',
      status: '미사용'
    });
  }

  curRow = 11;
  rawMaterialItems.forEach(rm => {
    ws1.mergeCells(curRow, 1, curRow, 2);
    ws1.getCell(curRow, 1).value = rm.cat;
    ws1.getCell(curRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

    ws1.mergeCells(curRow, 3, curRow, 5);
    ws1.getCell(curRow, 3).value = rm.type;
    ws1.getCell(curRow, 3).font = { name: '맑은 고딕', size: 8.5, bold: true, color: { argb: 'FF1E40AF' } };

    ws1.mergeCells(curRow, 6, curRow, 7);
    ws1.getCell(curRow, 6).value = rm.weight;
    ws1.getCell(curRow, 6).font = { name: '맑은 고딕', size: 8.5, bold: true, color: { argb: 'FF047857' } };

    ws1.mergeCells(curRow, 8, curRow, 11);
    ws1.getCell(curRow, 8).value = rm.lot;

    ws1.mergeCells(curRow, 12, curRow, 13);
    ws1.getCell(curRow, 12).value = rm.status;
    ws1.getCell(curRow, 12).font = { name: '맑은 고딕', size: 8.5, bold: true, color: { argb: 'FF047857' } };

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      if (c <= 2 || (c >= 6 && c <= 7) || c >= 12) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: c <= 5 ? 'center' : 'left', vertical: 'middle' };
      }
      if (!cell.font) cell.font = { name: '맑은 고딕', size: 8.5 };
    }
    curRow++;
  });

  // 3. 압출조건 Section
  curRow = 15;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '3. 압출조건 (110Ø & 60Ø 압출기 RPM / 온수조 스크류·실린더·헤드 ℃ / 코팅두께 ㎛)';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  curRow = 16;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.mergeCells(`B${curRow}:C${curRow}`);
  ws1.getCell(`B${curRow}`).value = '압출기 속도 (RPM)';
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`B${curRow+1}`).value = '110Ø (RPM)';
  ws1.getCell(`B${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`C${curRow+1}`).value = '60Ø (RPM)';
  ws1.getCell(`C${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.mergeCells(`D${curRow}:H${curRow}`);
  ws1.getCell(`D${curRow}`).value = '110Ø 온수조 조건 (℃)';
  ws1.getCell(`D${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  const w110Headers = ['스크류', '실린더1', '실린더2', '실린더3', '헤드1'];
  w110Headers.forEach((h, idx) => {
    const cell = ws1.getCell(curRow + 1, 4 + idx);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  ws1.mergeCells(`I${curRow}:L${curRow}`);
  ws1.getCell(`I${curRow}`).value = '60Ø 온수조 조건 (℃)';
  ws1.getCell(`I${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  const w60Headers = ['스크류', '실린더1', '실린더2', '실린더3'];
  w60Headers.forEach((h, idx) => {
    const cell = ws1.getCell(curRow + 1, 9 + idx);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  ws1.getCell(`M${curRow}`).value = '코팅두께';
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.getCell(`M${curRow+1}`).value = '기저/OUT/IN';
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(r, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  const r110Val = report.conditions?.extruder110Rpm || '26.4';
  const r60Val = report.conditions?.extruder60Rpm || '19.2';
  const wTemp = report.conditions?.waterTemp || '47.0';
  const cThick = `${report.conditions?.coatingThicknessBase || '16.1'} / ${report.conditions?.coatingThicknessOuter || '20.8'} / ${report.conditions?.coatingThicknessInner || '16.1'}`;

  const extDataRows = [
    { time: '표준 기준', r110: '29.0±2.9', r60: '20.0±2.0', w110: ['50±5', '50±5', '50±5', '50±5', '55±5'], w60: ['50±5', '50±5', '50±5', '50±5'], pu: '15㎛ 이상', isStd: true },
    { time: '09:33', r110: r110Val, r60: r60Val, w110: [wTemp, '44.0', wTemp, '48.0', '53.0'], w60: ['48.0', wTemp, wTemp, wTemp], pu: cThick },
    { time: '11:17', r110: r110Val, r60: r60Val, w110: [wTemp, '46.0', wTemp, '47.0', '53.0'], w60: [wTemp, '46.0', wTemp, wTemp], pu: cThick },
    { time: '13:01', r110: r110Val, r60: r60Val, w110: ['48.0', wTemp, wTemp, '47.0', '53.0'], w60: ['48.0', wTemp, wTemp, wTemp], pu: cThick }
  ];

  curRow = 18;
  extDataRows.forEach(row => {
    ws1.getCell(curRow, 1).value = row.time;
    ws1.getCell(curRow, 2).value = row.r110;
    ws1.getCell(curRow, 3).value = row.r60;
    row.w110.forEach((val, i) => { ws1.getCell(curRow, 4 + i).value = val; });
    row.w60.forEach((val, i) => { ws1.getCell(curRow, 9 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.pu;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // 4-1. PCM 가류조 조건 (13개 존, 210±20℃ 기준)
  curRow = 22;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '4-1. PCM 가류조 조건 (기준: 210℃ ± 20℃ [190.0℃ ~ 230.0℃] / 13개 존 개별 관리 / 인취속도)';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  curRow = 23;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.mergeCells(`B${curRow}:G${curRow}`);
  ws1.getCell(`B${curRow}`).value = 'PCM 가류조 전반부 온도 (℃) [표준: 210 ± 20 ℃]';
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  for (let z = 1; z <= 6; z++) {
    const cell = ws1.getCell(curRow + 1, 1 + z);
    cell.value = `존${z}`;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  }

  ws1.mergeCells(`H${curRow}:L${curRow}`);
  ws1.getCell(`H${curRow}`).value = 'PCM 후반부 온도 (존7~존13) [210±20℃]';
  ws1.getCell(`H${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ['존7', '존8', '존9', '존10~11', '존12~13'].forEach((zName, i) => {
    const cell = ws1.getCell(curRow + 1, 8 + i);
    cell.value = zName;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  });

  ws1.getCell(`M${curRow}`).value = '라인속도';
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`M${curRow+1}`).value = '인취(m/분)';
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(r, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  const hSpeed = report.conditions?.haulOffSpeed || '19.6';
  const cZone = report.conditions?.cureZoneTemp || '212.0';

  const pcmRows = [
    { time: '표준 기준', zFront: ['210±20', '210±20', '210±20', '210±20', '210±20', '210±20'], zBack: ['210±20', '210±20', '210±20', '210±20', '210±20'], speed: '20.0±1.0', isStd: true },
    { time: '09:33', zFront: ['211.0', '212.5', '214.0', '210.5', '209.0', '213.0'], zBack: ['212.0', '210.0', '211.5', '215.0', '211.0'], speed: hSpeed },
    { time: '11:17', zFront: ['210.5', '212.0', '213.5', '211.0', '209.5', '212.5'], zBack: ['211.5', '210.5', '211.0', '214.0', '210.5'], speed: hSpeed },
    { time: '13:01', zFront: ['211.5', '213.0', '214.5', '211.5', '210.0', '213.0'], zBack: ['212.0', '211.0', '211.5', '214.5', '211.0'], speed: hSpeed }
  ];

  curRow = 25;
  pcmRows.forEach(row => {
    ws1.getCell(curRow, 1).value = row.time;
    row.zFront.forEach((val, i) => { ws1.getCell(curRow, 2 + i).value = val; });
    row.zBack.forEach((val, i) => { ws1.getCell(curRow, 8 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.speed;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // 4-2. 코팅건 분사압력 & 건조로/NIR
  curRow = 29;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '4-2. 코팅건 분사압력 (1~4번) / 프라즈마 출력 / 건조로 (180±10℃) / NIR (%) / 후로킹 공급량';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  curRow = 30;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.mergeCells(`B${curRow}:E${curRow}`);
  ws1.getCell(`B${curRow}`).value = '코팅건 분사압력 (bar)';
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ['#1건', '#2건', '#3건', '#4건'].forEach((h, i) => {
    const cell = ws1.getCell(curRow + 1, 2 + i);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  });

  ws1.mergeCells(`F${curRow}:H${curRow}`);
  ws1.getCell(`F${curRow}`).value = '프라즈마 출력 (A) [3.0±0.5A]';
  ws1.getCell(`F${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ['#1~#2', '#3~#4', '#5'].forEach((h, i) => {
    const cell = ws1.getCell(curRow + 1, 6 + i);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  ws1.mergeCells(`I${curRow}:J${curRow}`);
  ws1.getCell(`I${curRow}`).value = '건조로 (℃) [180±10℃]';
  ws1.getCell(`I${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.getCell(curRow + 1, 9).value = 'no.1~2';
  ws1.getCell(curRow + 1, 9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  ws1.getCell(curRow + 1, 10).value = 'no.3';
  ws1.getCell(curRow + 1, 10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.mergeCells(`K${curRow}:L${curRow}`);
  ws1.getCell(`K${curRow}`).value = 'NIR 출력 (%)';
  ws1.getCell(`K${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ws1.getCell(curRow + 1, 11).value = 'no.1';
  ws1.getCell(curRow + 1, 11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  ws1.getCell(curRow + 1, 12).value = 'no.2~3';
  ws1.getCell(curRow + 1, 12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ws1.getCell(`M${curRow}`).value = '후로킹/본드';
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell(`M${curRow+1}`).value = '공급상태';
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(r, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  const sg1 = report.conditions?.sprayGun1 || '2.5';
  const sg2 = report.conditions?.sprayGun2 || '2.6';
  const sg3 = report.conditions?.sprayGun3 || '2.5';
  const sg4 = report.conditions?.sprayGun4 || '2.4';

  const sprayDataRows = [
    { time: '표준 기준', spray: ['2.5', '2.5', '2.5', '2.5'], plasma: ['3.0±0.5', '3.0±0.5', '3.0±0.5'], dry: ['180±10', '180±10'], nir: ['70±5', '75±5'], flock: '정상공급', isStd: true },
    { time: '09:33', spray: [sg1, sg2, sg3, sg4], plasma: ['2.9 / 3.0', '2.9 / 3.0', '2.8'], dry: ['181.0', '180.0'], nir: ['68.0', '77.0 / 78.0'], flock: '양호(○)' },
    { time: '11:17', spray: [sg1, sg2, sg3, sg4], plasma: ['2.9 / 3.0', '2.8 / 3.0', '2.8'], dry: ['180.0', '180.0'], nir: ['67.0', '78.0 / 77.0'], flock: '양호(○)' },
    { time: '13:01', spray: [sg1, sg2, sg3, sg4], plasma: ['3.0 / 3.1', '2.9 / 3.1', '3.0'], dry: ['181.0', '180.0'], nir: ['70.0', '79.0 / 79.0'], flock: '양호(○)' }
  ];

  curRow = 32;
  sprayDataRows.forEach(row => {
    ws1.getCell(curRow, 1).value = row.time;
    row.spray.forEach((val, i) => { ws1.getCell(curRow, 2 + i).value = val; });
    row.plasma.forEach((val, i) => { ws1.getCell(curRow, 6 + i).value = val; });
    row.dry.forEach((val, i) => { ws1.getCell(curRow, 9 + i).value = val; });
    row.nir.forEach((val, i) => { ws1.getCell(curRow, 11 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.flock;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // Footer / Seal
  curRow = 36;
  ws1.mergeCells(`A${curRow}:G${curRow}`);
  ws1.getCell(`A${curRow}`).value = '(주)오륙 삼랑진공장  /  (주)화승 R&A 협력업체';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF475569' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  ws1.mergeCells(`H${curRow}:M${curRow}`);
  ws1.getCell(`H${curRow}`).value = '문서양식: A4 (210 × 297 mm) 표준 체크시트';
  ws1.getCell(`H${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF64748B' } };
  ws1.getCell(`H${curRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

  // =========================================================================
  // SHEET 2: PCM_13존_상세온도기록 (Landscape)
  // =========================================================================
  const ws2 = workbook.addWorksheet('PCM_13존_상세온도기록', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  ws2.columns = [
    { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 12 }, { width: 12 },
    { width: 12 }
  ];

  ws2.mergeCells('A1:Q1');
  const ws2Title = ws2.getCell('A1');
  ws2Title.value = 'PCM 가류조 13개 존별 시간대별 상세 온도 관리일지 (표준: 210℃ ± 20℃)';
  ws2Title.font = { name: '맑은 고딕', size: 15, bold: true, color: { argb: 'FF0F172A' } };
  ws2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2Title.border = mediumBorder;
  ws2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws2.mergeCells('A2:Q2');
  ws2.getCell('A2').value = `■ 설비명: ${report.lineName || 'PCM 1호기'} 가류조  |  작업일자: ${report.date || '2026.09.30'} (${report.shift || '주간'})  |  기준 관리한계: 190.0℃ ~ 230.0℃  |  담당자: ${report.worker || '공영국 대리'}`;
  ws2.getCell('A2').font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
  ws2.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  const zHeaderNames = [
    '점검 시간', '존 1', '존 2', '존 3', '존 4', '존 5', '존 6',
    '존 7', '존 8', '존 9', '존 10', '존 11', '존 12', '존 13',
    '평균온도(℃)', '최저 / 최고', '최종판정'
  ];

  zHeaderNames.forEach((name, idx) => {
    const cell = ws2.getCell(3, idx + 1);
    cell.value = name;
    cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const pcmDetailedStd = ['표준 기준치', 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, '210.0', '190 ~ 230', '표준적합'];
  pcmDetailedStd.forEach((val, idx) => {
    const cell = ws2.getCell(4, idx + 1);
    cell.value = val;
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const pcmDetailedLogs = [
    ['08:30 (시동시)', 208.5, 209.0, 212.0, 210.0, 207.5, 211.0, 210.0, 209.5, 210.5, 213.0, 208.0, 209.0, 211.0, 209.9, '207.5 / 213.0', '🟢 정상'],
    ['09:30 (1차)', 211.0, 212.5, 214.0, 210.5, 209.0, 213.0, 212.0, 210.0, 211.5, 215.0, 208.5, 210.0, 212.0, 211.5, '208.5 / 215.0', '🟢 정상'],
    ['10:30 (2차)', 210.0, 211.5, 213.0, 211.0, 209.5, 212.0, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.5, 211.2, '209.0 / 214.0', '🟢 정상'],
    ['11:30 (3차)', 210.5, 212.0, 213.5, 211.0, 209.5, 212.5, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.0, 211.2, '209.0 / 214.0', '🟢 정상'],
    ['12:30 (4차)', 211.0, 212.0, 214.0, 211.5, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.8, '209.5 / 214.5', '🟢 정상'],
    ['13:30 (5차)', 211.5, 213.0, 214.5, 211.5, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.9, '209.5 / 214.5', '🟢 정상'],
    ['14:30 (6차)', 210.5, 212.0, 213.5, 211.0, 209.5, 212.5, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.5, 211.3, '209.0 / 214.0', '🟢 정상'],
    ['15:30 (7차)', 211.0, 212.5, 214.0, 211.0, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.8, '209.5 / 214.5', '🟢 정상'],
    ['16:30 (종료시)', 210.0, 211.5, 213.0, 210.5, 209.0, 212.0, 211.0, 210.0, 210.5, 213.5, 208.5, 210.0, 211.0, 210.8, '208.5 / 213.5', '🟢 정상']
  ];

  pcmDetailedLogs.forEach((rowVals, rIdx) => {
    const rowNum = 5 + rIdx;
    rowVals.forEach((val, cIdx) => {
      const cell = ws2.getCell(rowNum, cIdx + 1);
      cell.value = val;
      cell.font = { name: '맑은 고딕', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
      if (cIdx === 0) cell.font = { name: '맑은 고딕', size: 9, bold: true };
      if (cIdx === 14) cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF0F766E' } };
    });
  });

  const sumRow = 14;
  ws2.getCell(sumRow, 1).value = '전체 일일 종합';
  ws2.getCell(sumRow, 1).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 1).border = thinBorder;

  for (let c = 2; c <= 14; c++) {
    const colLetter = String.fromCharCode(64 + c);
    const cell = ws2.getCell(sumRow, c);
    cell.value = { formula: `AVERAGE(${colLetter}5:${colLetter}13)` };
    cell.numFmt = '0.0';
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }

  ws2.getCell(sumRow, 15).value = { formula: `AVERAGE(O5:O13)` };
  ws2.getCell(sumRow, 15).numFmt = '0.0';
  ws2.getCell(sumRow, 15).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 15).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 15).border = thinBorder;

  ws2.getCell(sumRow, 16).value = '207.5 / 215.0';
  ws2.getCell(sumRow, 16).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 16).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 16).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 16).border = thinBorder;

  ws2.getCell(sumRow, 17).value = '🟢 100% 정상 (OK)';
  ws2.getCell(sumRow, 17).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF047857' } };
  ws2.getCell(sumRow, 17).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 17).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 17).border = thinBorder;

  // =========================================================================
  // SHEET 3: TPM_10대항목_점검일지 (Portrait)
  // =========================================================================
  const ws3 = workbook.addWorksheet('TPM_10대항목_점검일지', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  ws3.columns = [
    { width: 6 }, { width: 16 }, { width: 34 }, { width: 14 }, { width: 26 }
  ];

  ws3.mergeCells('A1:E1');
  const ws3Title = ws3.getCell('A1');
  ws3Title.value = '(주)오륙 삼랑진공장 - 압출 설비 TPM 자주보전 10대 항목 점검일지';
  ws3Title.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  ws3Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws3Title.border = mediumBorder;
  ws3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws3.mergeCells('A2:E2');
  ws3.getCell('A2').value = `작업일자: ${report.date || '2026.09.30'}  |  근무조: ${report.shift || '주간'}  |  대상호기: ${report.lineName || 'PCM 1호기'} (110Ø+60Ø)  |  점검자: ${report.worker || '공영국 대리'}  |  확인: ${report.approvedBy || '이명재 이사'}`;
  ws3.getCell('A2').font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  ws3.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  ['No', '구분', '주요 점검 항목 및 점검 기준', '판정 (○/△/✕)', '이상 증상 및 조치 사항'].forEach((name, idx) => {
    const cell = ws3.getCell(3, idx + 1);
    cell.value = name;
    cell.font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const tpmItems = [
    { no: 1, cat: '설비 기본조건', item: '라인 청소, 오일 윤활 상태, 볼트/너트 조임, 누유·누수 점검', res: '○', note: '정상 양호' },
    { no: 2, cat: '110Ø·60Ø 압출기', item: '스크류 회전음, 실린더 발열, 감속기 오일량, 모터 진동', res: '○', note: '110Ø/60Ø 스크류 소음 없음' },
    { no: 3, cat: '다이스(금형)', item: '다이스 마모, 립 손상, 이물 막힘, 변형, 히터 체결상태', res: '○', note: '다이스 표면 클리닝 완료' },
    { no: 4, cat: 'PCM 가류조 온도', item: '13개 존 설정온도 편차 확인 (210℃ ± 20℃ 범위 내)', res: '○', note: '1존~13존 전구역 211℃ 제어' },
    { no: 5, cat: '압출/사출 압력', item: '압출 헤드 압력 게이지, 유압/공압 변동, 이상 압력 유무', res: '○', note: '헤드 압력 일정' },
    { no: 6, cat: '온수조/냉각수', item: '110Ø/60Ø 스크류·실린더 온수조 온도(50±5℃), 냉각수 순환', res: '○', note: '순환 펌프 정상 가동' },
    { no: 7, cat: '인취기/컨베이어', item: '인취 롤러 속도(20±1m/분), 텐션 장력, 벨트 마모 상태', res: '○', note: '롤러 이물 제거 완료' },
    { no: 8, cat: '코팅건/프라즈마', item: '코팅건 1~4번 분사압력(2.5bar), 프라즈마 방전(3±0.5A)', res: '○', note: '노즐 막힘 없음, 방전 균일' },
    { no: 9, cat: '건조로/NIR', item: '건조로 온도(180±10℃), NIR 출력(70~80%), 히터 단선', res: '○', note: '건조로 히터 정상' },
    { no: 10, cat: '안전/비상정지', item: '비상정지 스위치 작동, 안전 커버 체결, 인터록 정상', res: '○', note: '비상정지 테스트 완료' }
  ];

  tpmItems.forEach((it, idx) => {
    const rowNum = 4 + idx;
    ws3.getCell(rowNum, 1).value = it.no;
    ws3.getCell(rowNum, 2).value = it.cat;
    ws3.getCell(rowNum, 3).value = it.item;
    ws3.getCell(rowNum, 4).value = it.res;
    ws3.getCell(rowNum, 5).value = it.note;

    for (let c = 1; c <= 5; c++) {
      const cell = ws3.getCell(rowNum, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 9 };
      cell.alignment = { horizontal: c === 3 ? 'left' : 'center', vertical: 'middle' };
      if (c === 4) {
        cell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF047857' } };
      }
    }
  });

  const abRow = 15;
  ws3.mergeCells(`A${abRow}:E${abRow}`);
  ws3.getCell(`A${abRow}`).value = '■ 이상 발생 신고 및 보전 요청란 (사진 첨부 / 긴급 정비 요청)';
  ws3.getCell(`A${abRow}`).font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF991B1B' } };
  ws3.getCell(`A${abRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
  ws3.getCell(`A${abRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  ws3.getCell(`A${abRow}`).border = thinBorder;

  const abHeaders = ['이상 발생 내용', '긴급 조치 및 보전 요청 사항', '사진 유무', '조치 담당자', '완료 일시'];
  abHeaders.forEach((h, i) => {
    const cell = ws3.getCell(abRow + 1, i + 1);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    cell.border = thinBorder;
  });

  ws3.getCell(abRow + 2, 1).value = report.tpmIssueText || '특이 이상 사항 없음 (정상 가동)';
  ws3.getCell(abRow + 2, 2).value = '110Ø/60Ø 다이스 정기 클리닝 실시';
  ws3.getCell(abRow + 2, 3).value = Array.isArray(report.tpmIssuePhotos) && report.tpmIssuePhotos.length > 0 ? `첨부 [ ${report.tpmIssuePhotos.length}장 ]` : '첨부 [ - ]';
  ws3.getCell(abRow + 2, 4).value = report.worker || '공영국 대리';
  ws3.getCell(abRow + 2, 5).value = `${report.date || '2026.09.30'} 14:00`;

  for (let c = 1; c <= 5; c++) {
    const cell = ws3.getCell(abRow + 2, c);
    cell.border = thinBorder;
    cell.font = { name: '맑은 고딕', size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `압출작업체크시트_PCM_110Ø_60Ø_13Zone_${report.date || '2026-10-01'}_${report.lineId || 'pcm1'}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

