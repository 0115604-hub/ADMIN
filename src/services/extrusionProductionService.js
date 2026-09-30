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

const COLLECTION_NAME = "extrusion_work_reports";
export const EXTRUSION_PROD_STORAGE_KEY = "factory_extrusion_work_reports_v1";

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
  { name: "공영국", title: "대리", role: "압출동 조장/관리", plant: "삼랑진공장" },
  { name: "심임대", title: "반장", role: "압출 1호기 반장", plant: "삼랑진공장" },
  { name: "이상은", title: "반장", role: "압출 3호기 반장", plant: "삼랑진공장" },
  { name: "설유철", title: "책임", role: "압출동 관리", plant: "삼랑진공장" },
  { name: "윤경수", title: "책임", role: "가공/압출 총괄", plant: "삼랑진공장" },
  { name: "이창엽", title: "책임", role: "품질관리", plant: "삼랑진공장" },
  { name: "전재율", title: "책임", role: "설비보전", plant: "삼랑진공장" },
  { name: "이명재", title: "이사", role: "공장 총괄", plant: "삼랑진공장" },
  { name: "양인나", title: "선임", role: "가공동 관리", plant: "삼랑진공장" },
  { name: "유동길", title: "선임", role: "가공동 관리", plant: "삼랑진공장" },
  { name: "조인주", title: "선임", role: "경리업무", plant: "삼랑진공장" },
  { name: "이상기", title: "사원", role: "품질관리", plant: "삼랑진공장" },
  { name: "닉", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "마이클", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "존카를로", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "지미", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "만", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "샤먼", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "쿠마루", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" },
  { name: "이수루", title: "사원", role: "압출동 오퍼레이터", plant: "삼랑진공장" }
];

export const DOWNTIME_CATEGORIES = [
  { id: "형교환", label: "형교환", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { id: "승온/준비", label: "승온/준비", color: "bg-sky-100 text-sky-900 border-sky-300" },
  { id: "설비고장", label: "설비고장", color: "bg-rose-100 text-rose-900 border-rose-300" },
  { id: "품질불량", label: "품질불량", color: "bg-orange-100 text-orange-900 border-orange-300" },
  { id: "자재대기", label: "자재대기", color: "bg-purple-100 text-purple-900 border-purple-300" },
  { id: "작업자교대", label: "작업자교대", color: "bg-blue-100 text-blue-900 border-blue-300" },
  { id: "라인정지", label: "라인정지", color: "bg-slate-200 text-slate-800 border-slate-300" },
  { id: "청소/정리", label: "청소/정리", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { id: "기타", label: "기타", color: "bg-gray-100 text-gray-800 border-gray-300" }
];

export const TPM_CHECK_ITEMS = [
  {
    id: 1,
    category: "설비 기본조건",
    name: "청소, 윤활, 조임, 누유·누수 점검",
    desc: "설비 본체/바닥 청결, 급유상태, 볼트 풀림, 유압유/냉각수 누설 여부 (육안/촉감)",
    cycle: "1회/일"
  },
  {
    id: 2,
    category: "압출기",
    name: "스크류, 실린더, 감속기, 모터 상태",
    desc: "스크류 회전음 정상 여부, 모터/감속기 이상 발열 및 진동 (110Ø / 70Ø 청음/촉감)",
    cycle: "1회/일"
  },
  {
    id: 3,
    category: "다이스",
    name: "마모, 막힘, 변형, 체결상태",
    desc: "다이스 토출구 이물질, 마모/스크래치, 히터 밀착 및 볼트 체결 (육안/공구)",
    cycle: "교체시/일"
  },
  {
    id: 4,
    category: "온도",
    name: "실린더·다이 온도 설정 및 편차",
    desc: "설정치(SV) 대비 현재치(PV) 편차 ±5℃ 이내 유지, 열전대 단선 유무",
    cycle: "수시"
  },
  {
    id: 5,
    category: "압력",
    name: "압출압력, 압력 변동, 이상압력",
    desc: "수지 압력 지침 안정 여부, 급격한 압력 상승 및 맥동 유무 (압력계)",
    cycle: "수시"
  },
  {
    id: 6,
    category: "냉각",
    name: "냉각수 온도·유량·순환상태",
    desc: "수온 적정(20±5℃), 수로 막힘/누수 없음, 펌프 순환 압력 (유량계/육안)",
    cycle: "1회/일"
  },
  {
    id: 7,
    category: "인취/권취",
    name: "인취속도, 장력, 롤러 상태",
    desc: "인취 롤러 마모/이물 없음, 롤러 속도 동기화(20±1m/분), 벨트 장력",
    cycle: "1회/일"
  },
  {
    id: 8,
    category: "절단",
    name: "절단기 상태, 칼날 마모, 절단길이",
    desc: "칼날 이 빠짐/마모 없음, 절단 단면 직각도/버(Burr) 없음, 치수 편차",
    cycle: "수시"
  },
  {
    id: 9,
    category: "전기/제어",
    name: "센서, 인버터, 히터, 제어반",
    desc: "조작반 램프/스위치 정상, 배선 손상/분진 없음, 인버터 알람 유무 (육안)",
    cycle: "1회/일"
  },
  {
    id: 10,
    category: "안전",
    name: "방호장치, 비상정지, 안전커버",
    desc: "비상정지(E-Stop) 즉시 작동 시험, 회전부 안전커버 체결, 도어 인터록",
    cycle: "1회/교대(필수)"
  }
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
      rubberLot: String(raw.rawMaterials?.rubberLot || raw.rubberLot || "").trim(),
      coatingLot: String(raw.rawMaterials?.coatingLot || raw.coatingLot || "").trim(),
      insertLot: String(raw.rawMaterials?.insertLot || raw.insertLot || "").trim()
    },
    defectBreakdown: {
      cutoffKg: Math.max(0, Number(raw.defectBreakdown?.cutoffKg || raw.cutoffKg) || 0),
      startLossKg: Math.max(0, Number(raw.defectBreakdown?.startLossKg || raw.startLossKg) || 0),
      appearanceKg: Math.max(0, Number(raw.defectBreakdown?.appearanceKg || raw.appearanceKg) || 0)
    },
    conditions: {
      extruder110Rpm: String(raw.conditions?.extruder110Rpm || raw.extruder110Rpm || raw.conditions?.extruderRpm || "").trim(),
      extruder70Rpm: String(raw.conditions?.extruder70Rpm || raw.extruder70Rpm || "").trim(),
      waterTemp: String(raw.conditions?.waterTemp || raw.waterTemp || "").trim(),
      cureZoneTemp: String(raw.conditions?.cureZoneTemp || raw.cureZoneTemp || raw.conditions?.cureTemp || "").trim(), // 210±20℃
      haulOffSpeed: String(raw.conditions?.haulOffSpeed || raw.haulOffSpeed || "").trim(),
      sprayGun1: String(raw.conditions?.sprayGun1 || raw.sprayGun1 || "").trim(),
      sprayGun2: String(raw.conditions?.sprayGun2 || raw.sprayGun2 || "").trim(),
      sprayGun3: String(raw.conditions?.sprayGun3 || raw.sprayGun3 || "").trim(),
      sprayGun4: String(raw.conditions?.sprayGun4 || raw.sprayGun4 || "").trim()
    },
    tpmStatus: String(raw.tpmStatus || "완료"),
    tpmChecks: Array.isArray(raw.tpmChecks) && raw.tpmChecks.length > 0
      ? raw.tpmChecks.map(c => ({ id: c.id, status: c.status || "OK", note: c.note || "" }))
      : TPM_CHECK_ITEMS.map(c => ({ id: c.id, status: "OK", note: "" })),
    downtimeMinutes,
    downtimeCategory: String(raw.downtimeCategory || "형교환"),
    downtimeDetail: String(raw.downtimeDetail || ""),
    notes: String(raw.notes || ""),
    approvalStatus: String(raw.approvalStatus || "대기"), // 대기 | 승인 | 반려
    approvedBy: String(raw.approvedBy || ""),
    approvedAt: String(raw.approvedAt || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString())
  };
};

// Initial Seed Data for immediate preview
export const INITIAL_EXTRUSION_REPORTS = [
  {
    id: "epr_seed_01",
    date: new Date().toISOString().split("T")[0],
    shift: "주간",
    plant: "삼랑진공장",
    lineId: "pcm1",
    lineName: "PCM #1 LINE",
    worker: "설유철 책임",
    subWorkers: "유동길",
    vehicle: "NX4",
    itemCode: "86811-N9000",
    itemName: "NX4 G/RUN FRT LH",
    targetQty: 4800,
    actualQty: 4720,
    goodQty: 4610,
    defectQty: 110,
    scrapKg: 18.5,
    yieldRate: 97.7,
    attainmentRate: 98.3,
    defectRate: 2.3,
    downtimeMinutes: 45,
    downtimeCategory: "형교환",
    downtimeDetail: "NX4 ➔ GN7 금형 교체 및 치수 셋팅 (45분)",
    notes: "압출 속도 12m/min 정상 유지, 외관 스크래치 없음",
    approvalStatus: "승인",
    approvedBy: "이명재 이사",
    approvedAt: new Date().toISOString()
  },
  {
    id: "epr_seed_02",
    date: new Date().toISOString().split("T")[0],
    shift: "주간",
    plant: "삼랑진공장",
    lineId: "pcm3",
    lineName: "PCM #3 LINE",
    worker: "윤경수 책임",
    subWorkers: "조인주",
    vehicle: "GN7",
    itemCode: "82110-GN700",
    itemName: "GN7 W/STRIP BODY S/D",
    targetQty: 3600,
    actualQty: 3550,
    goodQty: 3480,
    defectQty: 70,
    scrapKg: 12.0,
    yieldRate: 98.0,
    attainmentRate: 98.6,
    defectRate: 2.0,
    downtimeMinutes: 30,
    downtimeCategory: "승온/준비",
    downtimeDetail: "다이헤드 승온 및 원료 수지 투입 준비 (30분)",
    notes: "특이사항 없음, 야간조 인수인계 완료",
    approvalStatus: "승인",
    approvedBy: "이명재 이사",
    approvedAt: new Date().toISOString()
  },
  {
    id: "epr_seed_03",
    date: new Date().toISOString().split("T")[0],
    shift: "야간",
    plant: "삼랑진공장",
    lineId: "pvc",
    lineName: "PVC LINE",
    worker: "이상기 사원",
    subWorkers: "",
    vehicle: "DL3",
    itemCode: "83120-L3000",
    itemName: "DL3 DR SEC HOOD SEAL",
    targetQty: 2400,
    actualQty: 2310,
    goodQty: 2240,
    defectQty: 70,
    scrapKg: 8.5,
    yieldRate: 97.0,
    attainmentRate: 96.3,
    defectRate: 3.0,
    downtimeMinutes: 50,
    downtimeCategory: "설비고장",
    downtimeDetail: "냉각수 순환 펌프 압력 저하 점검 및 필터 청소",
    notes: "보전반 전재율 책임 점검 완료 후 재가동",
    approvalStatus: "대기",
    approvedBy: "",
    approvedAt: ""
  },
  {
    id: "epr_seed_04",
    date: new Date().toISOString().split("T")[0],
    shift: "주간",
    plant: "삼랑진공장",
    lineId: "tpe",
    lineName: "TPE LINE",
    worker: "유성 반장",
    subWorkers: "",
    vehicle: "EV9",
    itemCode: "85100-EV900",
    itemName: "EV9 BATTERY PACK SEAL",
    targetQty: 2000,
    actualQty: 1980,
    goodQty: 1950,
    defectQty: 30,
    scrapKg: 6.2,
    yieldRate: 98.5,
    attainmentRate: 99.0,
    defectRate: 1.5,
    downtimeMinutes: 20,
    downtimeCategory: "청소/정리",
    downtimeDetail: "라인 주변 정리 및 다이스 표면 이물질 제거",
    notes: "TPE 수지 점도 양호, 품질 합격 판정",
    approvalStatus: "승인",
    approvedBy: "이명재 이사",
    approvedAt: new Date().toISOString()
  }
];

// Local storage reader
export const getLocalExtrusionReports = () => {
  try {
    const raw = localStorage.getItem(EXTRUSION_PROD_STORAGE_KEY);
    if (!raw) return INITIAL_EXTRUSION_REPORTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r, i) => sanitizeExtrusionReport(r, i));
    }
    return INITIAL_EXTRUSION_REPORTS;
  } catch (e) {
    console.warn("Error reading extrusion reports from localStorage:", e);
    return INITIAL_EXTRUSION_REPORTS;
  }
};

// Local storage saver
export const saveLocalExtrusionReports = (reports) => {
  try {
    const sanitized = (reports || []).map((r, i) => sanitizeExtrusionReport(r, i));
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
            list.push({ id: docSnap.id, ...docSnap.data() });
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
          // If Firestore is empty, sync our initial seed reports to cloud once
          const initialData = getLocalExtrusionReports();
          initialData.forEach((item) => {
            setDoc(doc(db, COLLECTION_NAME, item.id), sanitizeForFirestore(item), { merge: true }).catch(() => {});
          });
          onDataCallback(initialData);
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
      "연고무 LOT",
      "코팅액 LOT",
      "심금 LOT",
      "110Ø속도(RPM)",
      "70Ø속도(RPM)",
      "온수조(℃)",
      "코팅건1번",
      "코팅건2번",
      "코팅건3번",
      "코팅건4번",
      "가류존온도(210±20℃)",
      "인취속도(m/분)",
      "비가동(분)",
      "비가동 원인",
      "비가동 상세 및 조치",
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
      r.rawMaterials?.rubberLot || "-",
      r.rawMaterials?.coatingLot || "-",
      r.rawMaterials?.insertLot || "-",
      r.conditions?.extruder110Rpm || r.conditions?.extruderRpm || "-",
      r.conditions?.extruder70Rpm || "-",
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
