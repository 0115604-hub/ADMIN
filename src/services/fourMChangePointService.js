import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebase.js";

const COLLECTION_NAME = "four_m_change_points";
const LOCAL_STORAGE_KEY = "factory_four_m_change_points_v1";
const OVERRIDES_STORAGE_KEY = "factory_four_m_overrides_v1";

// Helper: Read 4M manual overrides
export const getFourMOverrides = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      if (raw) return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.error("Local storage read error for 4M overrides:", e);
  }
  return {};
};

// Helper: Save 4M manual overrides
export const saveFourMOverrides = (map) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map || {}));
    }
  } catch (e) {
    console.error("Local storage write error for 4M overrides:", e);
  }
};

// Helper: 4M Badge Color
export const getFourMBadgeColor = (fourM) => {
  switch (fourM) {
    case "Machine":
      return "bg-indigo-100 text-indigo-900 border-indigo-300";
    case "Material":
      return "bg-rose-100 text-rose-900 border-rose-300";
    case "Man":
      return "bg-sky-100 text-sky-900 border-sky-300";
    case "Method":
    default:
      return "bg-amber-100 text-amber-900 border-amber-300";
  }
};

// Helper: 4M Record Company Standardizer (소속사명 추출 헬퍼)
export const getFourMRecordCompany = (rec) => {
  if (!rec) return "오륙";
  const rawComp = rec.company || rec.contractor || rec.raw?.company || rec.raw?.contractor;
  if (rawComp) {
    const s = String(rawComp).trim();
    if (s.includes("유성")) return "유성";
    if (s.includes("조영")) return "조영";
    if (s.includes("한울")) return "한울";
    if (s.includes("부림")) return "부림텍";
    if (s.includes("오륙") || s.includes("설압출")) return "오륙";
  }
  const text = `${rec.title || ""} ${rec.content || ""} ${rec.line || ""} ${rec.plant || ""}`;
  const m = text.match(/\[(오륙|유성|조영|한울|부림텍|부림|설압출)\]/);
  if (m && m[1]) {
    return m[1] === "부림" ? "부림텍" : (m[1] === "설압출" ? "오륙" : m[1]);
  }
  const pm = text.match(/\((오륙|유성|조영|한울|부림텍|부림|설압출)\)/);
  if (pm && pm[1]) {
    return pm[1] === "부림" ? "부림텍" : (pm[1] === "설압출" ? "오륙" : pm[1]);
  }
  if (text.includes("유성")) return "유성";
  if (text.includes("조영")) return "조영";
  if (text.includes("한울")) return "한울";
  if (text.includes("부림")) return "부림텍";
  if (text.includes("오륙") || text.includes("설압출")) return "오륙";

  if (String(rec.plant || "").includes("한림")) return "한울";
  return "오륙";
};

// ⭐ 4M 공식 관리대장 영구 보존 및 복구용 원본 기준 데이터 (이창엽 책임 품질보증 공식 등록분)
export const DEFAULT_OFFICIAL_4M_RECORDS = [
  {
    id: "ledger_man_log_auto_2026-10-12_유성_론나차이",
    originalId: "man_log_auto_2026-10-12_유성_론나차이",
    rawId: "auto_2026-10-12_유성_론나차이",
    fourM: "Man",
    origin: "4M 대체투입",
    sourceType: "MAN_ABSENCE_LOG",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    company: "유성",
    plant: "삼랑진공장",
    line: "압출 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "[유성] 론나차이(사원, 유성) 결근 ➔ 이성기(대표이사) 대체투입",
    date: "2026-10-12",
    time: "",
    content: "[4M Man 인원변동 결근내역]\n• 소속업체: 유성\n• 소속부서: 생산팀\n• 결근근로자: 론나차이 (사원, Lv.4)\n• 대체작업자: 이성기 (대표이사, 생산팀)\n• 결근사유: 병결\n• 담당공정: 압출 공정",
    actionResult: "대체작업자 이성기(대표이사) 투입 완료 (초물검사 완료 / 특별교육 완료)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-08:41",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_man_log_auto_2026-10-12_유성_론나차이_1793058086561",
    targetDate: "2026-10-12",
    registeredAt: "2026-10-27 08:41"
  },
  {
    id: "ledger_man_log_auto_2026-10-12_유성_팔라",
    originalId: "man_log_auto_2026-10-12_유성_팔라",
    rawId: "auto_2026-10-12_유성_팔라",
    fourM: "Man",
    origin: "결근발생",
    sourceType: "MAN_ABSENCE_LOG",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    company: "유성",
    plant: "삼랑진공장",
    line: "압출 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "[유성] 팔라(사원, 유성) 결근 ➔ [라인비가동]",
    date: "2026-10-12",
    time: "",
    content: "[4M Man 인원변동 결근내역]\n• 소속업체: 유성\n• 소속부서: 생산팀\n• 결근근로자: 팔라 (사원, Lv.3)\n• 대체작업자: 라인비가동 (대체 미투입)\n• 결근사유: 병결\n• 담당공정: 압출 공정",
    actionResult: "라인 비가동 (공정 정지/품질영향 없음)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-08:43",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_man_log_auto_2026-10-12_유성_팔라_1793058214342",
    targetDate: "2026-10-12",
    registeredAt: "2026-10-27 08:43"
  },
  {
    id: "ledger_man_log_auto_2026-10-12_조영_윤의정",
    originalId: "man_log_auto_2026-10-12_조영_윤의정",
    rawId: "auto_2026-10-12_조영_윤의정",
    fourM: "Man",
    origin: "결근발생",
    sourceType: "MAN_ABSENCE_LOG",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    company: "조영",
    plant: "한림공장",
    line: "소재준비 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "[조영] 윤의정(사원, 가공관리팀) 결근 ➔ [라인비가동]",
    date: "2026-10-12",
    time: "",
    content: "[4M Man 인원변동 결근내역]\n• 소속업체: 조영\n• 소속부서: 가공관리팀\n• 결근근로자: 윤의정 (사원, Lv.3)\n• 대체작업자: 라인비가동 (대체 미투입)\n• 결근사유: 개인사정\n• 담당공정: 소재준비 공정",
    actionResult: "라인 비가동 (공정 정지/품질영향 없음)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-08:46",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_man_log_auto_2026-10-12_조영_윤의정_1793058413459",
    targetDate: "2026-10-12",
    registeredAt: "2026-10-27 08:46"
  },
  {
    id: "ledger_man_log_auto_2026-10-13_유성_론나차이",
    originalId: "man_log_auto_2026-10-13_유성_론나차이",
    rawId: "auto_2026-10-13_유성_론나차이",
    fourM: "Man",
    origin: "4M 대체투입",
    sourceType: "MAN_ABSENCE_LOG",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    company: "유성",
    plant: "삼랑진공장",
    line: "압출 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "[유성] 론나차이(사원, 유성) 결근 ➔ 이성기(대표이사) 대체투입",
    date: "2026-10-13",
    time: "",
    content: "[4M Man 인원변동 결근내역]\n• 소속업체: 유성\n• 소속부서: 생산팀\n• 결근근로자: 론나차이 (사원, Lv.4)\n• 대체작업자: 이성기 (대표이사, 생산팀)\n• 결근사유: 병결\n• 담당공정: 압출 공정",
    actionResult: "대체작업자 이성기(대표이사) 투입 완료 (초물검사 완료 / 특별교육 완료)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-08:54",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_man_log_auto_2026-10-13_유성_론나차이_1793058873183",
    targetDate: "2026-10-13",
    registeredAt: "2026-10-27 08:54"
  },
  {
    id: "ledger_man_log_auto_2026-10-14_유성_론나차이",
    originalId: "man_log_auto_2026-10-14_유성_론나차이",
    rawId: "auto_2026-10-14_유성_론나차이",
    fourM: "Man",
    origin: "4M 대체투입",
    sourceType: "MAN_ABSENCE_LOG",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    company: "유성",
    plant: "삼랑진공장",
    line: "압출 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "[유성] 론나차이(사원, 유성) 결근 ➔ 이성기(대표이사) 대체투입",
    date: "2026-10-14",
    time: "",
    content: "[4M Man 인원변동 결근내역]\n• 소속업체: 유성\n• 소속부서: 생산팀\n• 결근근로자: 론나차이 (사원, Lv.4)\n• 대체작업자: 이성기 (대표이사, 생산팀)\n• 결근사유: 병결\n• 담당공정: 압출 공정",
    actionResult: "대체작업자 이성기(대표이사) 투입 완료 (초물검사 완료 / 특별교육 완료)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-08:55",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_man_log_auto_2026-10-14_유성_론나차이_1793058904685",
    targetDate: "2026-10-14",
    registeredAt: "2026-10-27 08:55"
  },
  {
    id: "ledger_mach_qual_1792626820469_4r5z",
    originalId: "mach_qual_1792626820469_4r5z",
    rawId: "1792626820469_4r5z",
    fourM: "Material",
    origin: "부적합경보",
    sourceType: "QUALITY_ALERT",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    company: "조영",
    plant: "삼랑진공장",
    line: "가공 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "PU O/BELT 외관 스코치",
    date: "2026-10-22",
    time: "",
    content: "PU O/BELT 외관 스코치 불량 발생 - 한도견본 대조 및 가공 조건 수정 필요",
    actionResult: "가공 온도 프로파일 재설정 및 압출 속도 조정 완료 (초·중·종물 한도검사 합격)",
    actionAuthor: "이창엽",
    actionAt: "2026-10-27-09:25",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_mach_qual_1792626820469_4r5z_1793060701646",
    targetDate: "2026-10-22",
    registeredAt: "2026-10-27 09:25"
  },
  {
    id: "ledger_mach_qual_1792545529692_5r70",
    originalId: "mach_qual_1792545529692_5r70",
    rawId: "1792545529692_5r70",
    fourM: "Material",
    origin: "부적합경보",
    sourceType: "QUALITY_ALERT",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    company: "조영",
    plant: "삼랑진공장",
    line: "가공 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "HR (포터2) FRT G/RUN RH 립 제거 누락",
    date: "2026-10-08",
    time: "",
    content: "HR G/RUN - HR (포터2) FRT G/RUN RH 립 제거 누락 발생",
    actionResult: "자동차 담당자 면담시 마킹 안하기로 협의 완료 (예전과 동일) - 근거 10년간 동일 불량 없음",
    actionAuthor: "이창엽",
    actionAt: "2026-10-26-16:37",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_mach_qual_1792545529692_5r70_1793000275067",
    targetDate: "2026-10-08",
    registeredAt: "2026-10-26 16:37"
  },
  {
    id: "ledger_hanul_qual_1791757670265",
    originalId: "hanul_qual_1791757670265",
    rawId: "1791757670265",
    fourM: "Material",
    origin: "부적합경보",
    sourceType: "QUALITY_ALERT",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    company: "한울",
    plant: "한림공장",
    line: "소재준비 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "9BQC G/RUN PRI RH 글라스스크래치 다량발생 중.",
    date: "2026-10-12",
    time: "",
    content: "9BQC (G/RUN) - 9BQC G/RUN PRI RH 글라스스크래치 다량발생 중. 5,052EA 선별 진행",
    actionResult: "9BQC G/RUN Glass PRI RH 전수 선별 및 가류 온도/클립 점검 완료",
    actionAuthor: "이창엽",
    actionAt: "2026-10-26-14:19",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    approvalDocId: "appr_4m_ledger_hanul_qual_1791757670265_1792991956764",
    targetDate: "2026-10-12",
    registeredAt: "2026-10-26 14:19"
  },
  {
    id: "ledger_urg_issue_1791284063707",
    originalId: "issue_1791284063707",
    rawId: "1791284063707",
    fourM: "Material",
    origin: "부적합경보",
    sourceType: "QUALITY_ALERT",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    company: "한울",
    plant: "한림공장",
    line: "소재준비 공정",
    writer: "이창엽 책임",
    registeredBy: "이창엽",
    classifiedBy: "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    title: "9BQC G/RUN FIXED LH3호기 상단찍힘",
    date: "2026-10-06",
    time: "",
    content: "9BQC G/RUN FIXED LH3호기 상단찍힘 발생",
    actionResult: "금형 인서트 지그 교체 및 초물 검사 완료",
    actionAuthor: "이창엽",
    actionAt: "2026-10-06",
    isResolved: true,
    severity: "NORMAL",
    approvalStatus: "PENDING_APPROVAL",
    targetDate: "2026-10-06",
    registeredAt: "2026-10-06"
  }
];


// ⭐ Core Canonical ID Extractor: Strips all legacy & source prefixes to obtain the unique event timestamp/hash
export const getCore4MId = (idOrItem) => {
  if (!idOrItem) return "";
  const rawId = typeof idOrItem === "object"
    ? String(idOrItem.id || idOrItem.originalId || idOrItem.rawId || idOrItem.raw?.id || "")
    : String(idOrItem);

  return rawId
    .trim()
    .replace(/^ledger_/, "")
    .replace(/^urg_/, "")
    .replace(/^ext_q_/, "")
    .replace(/^hanul_q_/, "")
    .replace(/^ys_q_/, "")
    .replace(/^mach_q_/, "")
    .replace(/^ext_qual_/, "")
    .replace(/^hanul_qual_/, "")
    .replace(/^ys_qual_/, "")
    .replace(/^mach_qual_/, "")
    .replace(/^issue_/, "")
    .trim();
};

// ⭐ Normalized Title & Date Key for cross-collection duplicate prevention
export const getNormalizedTitleKey = (item) => {
  if (!item) return "";
  const title = String(item.title || item.defectType || item.content || "")
    .replace(/^\[(한울 부적합|유성 부적합|부적합경보|TPM 이상)\]\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
  const date = String(item.date || item.targetDate || item.startDate || "").slice(0, 10);
  return `${title}___${date}`;
};

// ⭐ Robust 4M Record Merger: Merges two representations of the same underlying event into a single canonical row
export const mergeUnified4MRecords = (existing, incoming) => {
  const isResolved = Boolean(
    existing.isResolved ||
    incoming.isResolved ||
    existing.status === "RESOLVED" ||
    incoming.status === "RESOLVED" ||
    existing.status === "CLOSED" ||
    incoming.status === "CLOSED" ||
    (existing.actionResult && String(existing.actionResult).trim().length > 0) ||
    (incoming.actionResult && String(incoming.actionResult).trim().length > 0)
  );

  const bestActionResult = (incoming.actionResult && String(incoming.actionResult).trim().length > 0)
    ? incoming.actionResult
    : (existing.actionResult || "");

  const bestActionAuthor = incoming.actionAuthor || existing.actionAuthor || (isResolved ? "관리자" : "");
  const bestActionAt = incoming.actionAt || existing.actionAt || "";

  const isManualFourM = Boolean(existing.isManualFourM || incoming.isManualFourM);
  const fourM = (incoming.isManualFourM && incoming.fourM)
    ? incoming.fourM
    : (existing.isManualFourM && existing.fourM)
    ? existing.fourM
    : incoming.fourM || existing.fourM;

  const preferredSourceType =
    existing.sourceType === "QUALITY_ALERT" || incoming.sourceType === "QUALITY_ALERT"
      ? "QUALITY_ALERT"
      : (existing.sourceType || incoming.sourceType);
  const preferredRaw =
    existing.sourceType === "QUALITY_ALERT" && existing.raw
      ? existing.raw
      : incoming.sourceType === "QUALITY_ALERT" && incoming.raw
      ? incoming.raw
      : (existing.raw || incoming.raw);
  const preferredOrigin =
    existing.sourceType === "QUALITY_ALERT" && existing.origin
      ? existing.origin
      : incoming.sourceType === "QUALITY_ALERT" && incoming.origin
      ? incoming.origin
      : (existing.origin || incoming.origin);

  return {
    ...existing,
    ...incoming,
    id: existing.id || incoming.id,
    sourceType: preferredSourceType,
    origin: preferredOrigin,
    raw: preferredRaw,
    ledgerRaw: incoming.isOfficialLedger ? incoming.raw : (existing.isOfficialLedger ? existing.raw : undefined),
    fourM,
    isManualFourM,
    badgeColor: incoming.badgeColor || existing.badgeColor,
    actionResult: bestActionResult,
    actionAuthor: bestActionAuthor,
    actionAt: bestActionAt,
    isResolved,
    validation: isResolved ? (incoming.validation || existing.validation || "초·중·종물 한도견본 대조 및 유효성 확인") : "유효성 검증 대기중",
    isRegisteredInLedger: Boolean(existing.isRegisteredInLedger || incoming.isRegisteredInLedger || incoming.isOfficialLedger || existing.isOfficialLedger),
    images: Array.from(new Set([...(existing.images || []), ...(incoming.images || [])])),
    actionImages: Array.from(new Set([...(existing.actionImages || []), ...(incoming.actionImages || [])])),
    replies: [...(existing.replies || []), ...(incoming.replies || [])].filter(
      (r, idx, arr) => arr.findIndex((other) => other.id === r.id || other.createdAt === r.createdAt) === idx
    ),
    // 👑 경영진 결재 및 CAPA 필드 불변 보존
    approvalStatus: incoming.approvalStatus || existing.approvalStatus || "",
    approvalDocId: incoming.approvalDocId || existing.approvalDocId || "",
    approvedBy: incoming.approvedBy || existing.approvedBy || "",
    approvedTitle: incoming.approvedTitle || existing.approvedTitle || "",
    approvedAt: incoming.approvedAt || existing.approvedAt || "",
    approvalSignature: incoming.approvalSignature || existing.approvalSignature || "",
    approvalComment: incoming.approvalComment || existing.approvalComment || "",
    targetApprover: incoming.targetApprover || existing.targetApprover || "",
    approvalRequestedAt: incoming.approvalRequestedAt || existing.approvalRequestedAt || "",
    rootCause: incoming.rootCause || existing.rootCause || "",
    whyAnalysis: incoming.whyAnalysis || existing.whyAnalysis || "",
    correctiveAction: incoming.correctiveAction || existing.correctiveAction || "",
    isSqNotice: incoming.isSqNotice !== undefined ? incoming.isSqNotice : existing.isSqNotice,
    beforePhotos: (Array.isArray(incoming.beforePhotos) && incoming.beforePhotos.length > 0) ? incoming.beforePhotos : (existing.beforePhotos || []),
    afterPhotos: (Array.isArray(incoming.afterPhotos) && incoming.afterPhotos.length > 0) ? incoming.afterPhotos : (existing.afterPhotos || [])
  };
};

// Helper: Read local storage (공식 대장 등재분 영구 보존 및 누락 복구 보장)
export const getLocalFourMChangePoints = () => {
  try {
    let localList = [];
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localList = parsed;
      }
    }
    const map = new Map();
    DEFAULT_OFFICIAL_4M_RECORDS.forEach((r) => {
      if (r && r.id) map.set(r.id, r);
    });
    localList.forEach((r) => {
      if (r && r.id) {
        const existing = map.get(r.id);
        map.set(r.id, existing ? { ...existing, ...r } : r);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
      return (b.date || "").localeCompare(a.date || "");
    });
  } catch (e) {
    console.error("Local storage read error for 4M change points:", e);
    return DEFAULT_OFFICIAL_4M_RECORDS;
  }
};

// Firestore 동기화 보완 헬퍼 (공식 대장 기본 레코드 영구 보장)
export const syncDefaultFourMRecordsToFirestore = async () => {
  if (!db) return;
  try {
    for (const item of DEFAULT_OFFICIAL_4M_RECORDS) {
      const docRef = doc(db, COLLECTION_NAME, item.id);
      await setDoc(docRef, item, { merge: true });
    }
  } catch (e) {
    console.warn("syncDefaultFourMRecordsToFirestore error:", e);
  }
};

// Helper: Save local storage and immediately push to all subscribers
export const saveLocalFourMChangePoints = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
    }
    fourMCache = items;
    fourMSubscribers.forEach((cb) => {
      try {
        cb(items);
      } catch (err) {}
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_four_m_updated", { detail: items }));
    }
  } catch (e) {
    console.error("Local storage write error for 4M change points:", e);
  }
};

// ⚡ Singleton Multiplexed Real-time Listener (Single-Flight Pattern)
let activeFourMUnsub = null;
let fourMCache = null;
const fourMSubscribers = new Set();
let fourMCleanupTimer = null;

// Real-time Cloud Synchronization (Firestore authoritative stream, Multi-Subscriber Shared)
export const subscribeFourMChangePoints = (onUpdate) => {
  if (typeof onUpdate !== "function") return () => {};

  fourMSubscribers.add(onUpdate);

  // Immediately serve cached data (zero-latency initial render)
  if (fourMCache) {
    onUpdate(fourMCache);
  } else {
    fourMCache = getLocalFourMChangePoints();
    onUpdate(fourMCache);
  }

  // Cancel any pending teardown timer
  if (fourMCleanupTimer) {
    clearTimeout(fourMCleanupTimer);
    fourMCleanupTimer = null;
  }

  // Open single Firestore stream if not already active
  if (!activeFourMUnsub && db) {
    try {
      // Trigger background sync for official records
      syncDefaultFourMRecordsToFirestore().catch(() => {});

      const colRef = collection(db, COLLECTION_NAME);
      activeFourMUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList = [];
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              remoteList.push({ id: d.id, ...d.data() });
            });
          }

          // Merge with DEFAULT_OFFICIAL_4M_RECORDS to guarantee all official records are permanently preserved
          const map = new Map();
          DEFAULT_OFFICIAL_4M_RECORDS.forEach((r) => {
            if (r && r.id) map.set(r.id, r);
          });
          remoteList.forEach((r) => {
            if (r && r.id) {
              const existing = map.get(r.id);
              map.set(r.id, existing ? { ...existing, ...r } : r);
            }
          });

          // Single sort for all subscribers
          const mergedList = Array.from(map.values()).sort((a, b) => {
            if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
            return (b.date || "").localeCompare(a.date || "");
          });

          fourMCache = mergedList;
          saveLocalFourMChangePoints(mergedList);

          // Dispatch to all subscribers
          fourMSubscribers.forEach((cb) => {
            try {
              cb(mergedList);
            } catch (err) {
              console.error("4M subscriber callback error:", err);
            }
          });
        },
        (error) => {
          console.warn("Firestore four_m_change_points sync warning:", error);
          const fallback = getLocalFourMChangePoints();
          fourMSubscribers.forEach((cb) => cb(fallback));
        }
      );
    } catch (e) {
      console.error("subscribeFourMChangePoints error:", e);
    }
  }

  // Return unsubscribe for this specific subscriber
  return () => {
    fourMSubscribers.delete(onUpdate);
    // Debounced teardown after 5 seconds of zero subscribers
    if (fourMSubscribers.size === 0 && activeFourMUnsub) {
      fourMCleanupTimer = setTimeout(() => {
        if (fourMSubscribers.size === 0 && activeFourMUnsub) {
          activeFourMUnsub();
          activeFourMUnsub = null;
        }
      }, 5000);
    }
  };
};

/**
 * 🌟 4M 변동점 카테고리 판별 (Machine / Material / Method / Man)
 * - 1순위: 관리자 수동 재분류 override 맵 및 명시적 4M 설정값
 * - 2순위: 키워드 기반 자동 판별
 *   - 가류조, 온조기, 압출기, 모터, 설비 등: Machine
 *   - 코팅, 원료, 클립, 불량, 스크래치, 자재 등: Material
 *   - 결근, 인원, 대체, 교대 등: Man
 *   - 작업표준, 조건, 공정, 레시피 등: Method
 */
export const determineFourMCategory = (item) => {
  if (!item) return "Method";

  // 1. 관리자 수동 재분류(Override) 맵 확인
  const overrides = getFourMOverrides();
  const possibleIds = [
    item.id,
    item.originalId,
    item.rawId,
    item.raw?.id,
    item._docId,
    item.customId
  ].filter(Boolean);

  for (const rawKey of possibleIds) {
    const sId = String(rawKey).trim();
    if (overrides[sId] && ["Machine", "Man", "Material", "Method"].includes(overrides[sId])) {
      return overrides[sId];
    }
    const cleanId = sId
      .replace(/^ledger_/, "")
      .replace(/^urg_/, "")
      .replace(/^ext_q_/, "")
      .replace(/^hanul_q_/, "")
      .replace(/^ys_q_/, "")
      .replace(/^mach_q_/, "");
    if (cleanId && overrides[cleanId] && ["Machine", "Man", "Material", "Method"].includes(overrides[cleanId])) {
      return overrides[cleanId];
    }
  }

  // 2. 항목 객체에 명시된 수동 4M 설정 확인
  if (item.manualFourM && ["Machine", "Man", "Material", "Method"].includes(item.manualFourM)) {
    return item.manualFourM;
  }
  if (item.isManualFourM && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
  }
  if (item.isOfficialLedger && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
  }

  const text = `${item.title || ""} ${item.content || ""} ${item.defectType || ""} ${item.details || ""} ${item.line || ""} ${item.origin || ""} ${item.category || ""}`.toLowerCase();

  // 1. Man (결근, 대체투입, 작업자 교체 등 인원 변동)
  if (
    text.includes("결근") ||
    text.includes("대체투입") ||
    text.includes("대체 투입") ||
    text.includes("인원교체") ||
    text.includes("작업자교체") ||
    text.includes("작업자 변경") ||
    text.includes("작업자변경") ||
    text.includes("신규 작업자") ||
    text.includes("신규작업자") ||
    text.includes("신규 투입") ||
    text.includes("신규투입") ||
    text.includes("작업 실수") ||
    text.includes("작업자 부주의") ||
    text.includes("미숙련") ||
    text.includes("휴가") ||
    (text.includes("인원") && (text.includes("부족") || text.includes("변동") || text.includes("대체")))
  ) {
    return "Man";
  }

  // 2. Machine (가류조, 온조기, 압출기, 모터, RPM, 설비, 머신 등)
  if (
    text.includes("가류조") ||
    text.includes("온조기") ||
    text.includes("압출기") ||
    text.includes("인취기") ||
    text.includes("머신기") ||
    text.includes("머신") ||
    text.includes("설비") ||
    text.includes("기계") ||
    text.includes("금형") ||
    text.includes("치구") ||
    text.includes("로봇") ||
    text.includes("모터") ||
    text.includes("rpm") ||
    text.includes("히터") ||
    text.includes("센서") ||
    text.includes("칠러") ||
    text.includes("수리") ||
    text.includes("tpm") ||
    text.includes("정비") ||
    text.includes("보전") ||
    text.includes("단선") ||
    text.includes("누유") ||
    text.includes("과열") ||
    text.includes("라인정지")
  ) {
    return "Machine";
  }

  // 3. Material (코팅, 클립, 원료, 배합, 고무, 원자재, 소재, 불량 등)
  if (
    text.includes("코팅") ||
    text.includes("클립") ||
    text.includes("원료") ||
    text.includes("배합") ||
    text.includes("원자재") ||
    text.includes("소재") ||
    text.includes("불량") ||
    text.includes("이물") ||
    text.includes("스크래치") ||
    text.includes("기포") ||
    text.includes("누락") ||
    text.includes("치수") ||
    text.includes("박리") ||
    text.includes("테이프") ||
    text.includes("본드") ||
    text.includes("철심") ||
    text.includes("고무") ||
    text.includes("도포") ||
    text.includes("단면") ||
    text.includes("탄화") ||
    text.includes("스코치") ||
    text.includes("nct") ||
    text.includes("선별")
  ) {
    return "Material";
  }

  // 4. Method
  return "Method";
};

/**
 * 🌟 4M 변동점 카테고리 수동 변경 및 영구 동기화
 * - Machine / Material / Man / Method
 * - 로컬 override 맵, four_m_change_points(Firestore/Local), urgent_issues 동시 반영
 */
export const updateFourMClassification = async (itemOrId, newFourM, modifierName = "관리자") => {
  if (!newFourM || !["Machine", "Man", "Material", "Method"].includes(newFourM)) {
    console.warn("Invalid 4M category:", newFourM);
    return null;
  }

  const isObj = typeof itemOrId === "object" && itemOrId !== null;
  const targetId = isObj
    ? String(itemOrId.id || itemOrId.originalId || itemOrId.rawId || itemOrId.raw?.id || "").trim()
    : String(itemOrId || "").trim();

  if (!targetId) return null;

  const rawId = isObj ? String(itemOrId.rawId || itemOrId.raw?.id || "").trim() : "";
  const origId = isObj ? String(itemOrId.originalId || "").trim() : "";
  const cleanId = targetId
    .replace(/^ledger_/, "")
    .replace(/^urg_/, "")
    .replace(/^ext_q_/, "")
    .replace(/^hanul_q_/, "")
    .replace(/^ys_q_/, "")
    .replace(/^mach_q_/, "");

  // 1. 4M Overrides 맵에 영구 저장 (로컬 캐시 및 즉시 반영)
  const overrides = getFourMOverrides();
  const allKeyVariants = [
    targetId,
    `ledger_${targetId}`,
    origId,
    origId ? `ledger_${origId}` : "",
    rawId,
    rawId ? `ledger_${rawId}` : "",
    cleanId,
    cleanId ? `ledger_${cleanId}` : "",
    cleanId ? `urg_${cleanId}` : ""
  ].filter(Boolean);

  allKeyVariants.forEach((k) => {
    overrides[k] = newFourM;
  });
  saveFourMOverrides(overrides);

  // 2. 공식 대장(four_m_change_points) 로컬 스토리지 및 Firestore 업데이트
  const current = getLocalFourMChangePoints();
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const badgeColor = getFourMBadgeColor(newFourM);

  let matchFound = false;
  const updatedList = current.map((item) => {
    const iId = String(item.id || "");
    const iOrig = String(item.originalId || "");
    const iRaw = String(item.rawId || "");
    const isMatch =
      allKeyVariants.includes(iId) ||
      allKeyVariants.includes(iOrig) ||
      allKeyVariants.includes(iRaw) ||
      (cleanId && (iId.includes(cleanId) || iOrig.includes(cleanId) || iRaw.includes(cleanId)));

    if (isMatch) {
      matchFound = true;
      return {
        ...item,
        fourM: newFourM,
        badgeColor,
        isManualFourM: true,
        modifiedAt: nowStr,
        modifiedBy: modifierName || "관리자"
      };
    }
    return item;
  });

  // 대장에 미등록된 항목이더라도 4M을 수정하면 공식 대장에 등록
  if (!matchFound && isObj) {
    const sanitizedObj = {
      ...itemOrId,
      fourM: newFourM,
      badgeColor,
      isManualFourM: true,
      modifiedAt: nowStr,
      modifiedBy: modifierName || "관리자"
    };
    await registerToFourMLedger(sanitizedObj, modifierName);
  } else {
    saveLocalFourMChangePoints(updatedList);
  }

  // 3. Firestore four_m_change_points 컬렉션 문서 업데이트
  if (db) {
    const docIdsToUpdate = new Set();
    if (targetId.startsWith("ledger_")) docIdsToUpdate.add(targetId);
    else {
      docIdsToUpdate.add(targetId);
      docIdsToUpdate.add(`ledger_${targetId}`);
    }
    if (cleanId) docIdsToUpdate.add(`ledger_${cleanId}`);

    for (const dId of docIdsToUpdate) {
      try {
        await setDoc(
          doc(db, COLLECTION_NAME, dId),
          {
            fourM: newFourM,
            badgeColor,
            isManualFourM: true,
            modifiedAt: nowStr,
            modifiedBy: modifierName || "관리자"
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore update four_m_change_point error:", dId, e);
      }
    }

    // 4. 원본 컬렉션(urgent_issues 등)이 존재할 경우 해당 문서도 동기화
    try {
      const urgentDocId = (isObj && isObj.raw?.id) || cleanId;
      if (urgentDocId) {
        await setDoc(
          doc(db, "urgent_issues", urgentDocId),
          {
            fourM: newFourM,
            isManualFourM: true,
            modifiedAt: nowStr
          },
          { merge: true }
        );
      }
    } catch (e) {
      // safe fallback
    }
  }

  // 5. 전역 윈도우 이벤트 발행
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("fourM_override_updated", {
        detail: { id: targetId, newFourM }
      })
    );
  }

  return getLocalFourMChangePoints();
};

// Register (Copy) a Record into Official 4M Change Point Ledger
export const registerToFourMLedger = async (record, registeredBy = "관리자") => {
  if (!record) return null;

  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const originalId = String(record.id || "").trim();
  const rawId = String(record.raw?.id || record.id || "").trim();
  const ledgerId = originalId.startsWith("ledger_") ? originalId : `ledger_${originalId || Date.now()}`;

  const current = getLocalFourMChangePoints();
  const existingIdx = current.findIndex(
    (it) =>
      it.id === ledgerId ||
      it.originalId === originalId ||
      (rawId && (it.rawId === rawId || it.originalId === rawId)) ||
      it.id === originalId
  );
  const existing = existingIdx >= 0 ? current[existingIdx] : null;

  // Sanitize record to avoid undefined keys or complex non-serializable objects (such as circular refs in raw)
  const ledgerItem = {
    id: ledgerId,
    originalId: originalId,
    rawId: rawId,
    fourM: record.fourM || existing?.fourM || "Machine",
    origin: record.origin || existing?.origin || "변동점",
    sourceType: record.sourceType || existing?.sourceType || "",
    badgeColor: record.badgeColor || existing?.badgeColor || "",
    plant: record.plant || existing?.plant || "삼랑진공장",
    line: record.line || existing?.line || "",
    writer: record.writer || existing?.writer || "",
    title: record.title || existing?.title || "",
    // 🔒 [P2-5 & P2-6] 발생일자 및 최초등록일시 불변 락 (기존 등록건은 원천 불변)
    date: existing?.date ? existing.date : (record.date || nowStr.slice(0, 10)),
    time: record.time || existing?.time || "",
    content: record.content !== undefined ? record.content : (existing?.content || ""),
    actionResult: record.actionResult || existing?.actionResult || "",
    actionAuthor: record.actionAuthor || existing?.actionAuthor || "",
    actionAt: record.actionAt || existing?.actionAt || "",
    images: Array.isArray(record.images) ? record.images : (existing?.images || []),
    actionImages: Array.isArray(record.actionImages) ? record.actionImages : (existing?.actionImages || []),
    replies: Array.isArray(record.replies) ? record.replies : (existing?.replies || []),
    isResolved: Boolean(record.isResolved !== undefined ? record.isResolved : existing?.isResolved),
    severity: record.severity || existing?.severity || "NORMAL",
    downtimeMinutes: Number(record.downtimeMinutes !== undefined ? record.downtimeMinutes : existing?.downtimeMinutes) || 0,
    scrapKg: Number(record.scrapKg !== undefined ? record.scrapKg : existing?.scrapKg) || 0,
    registeredAt: existing?.registeredAt ? existing.registeredAt : (record.registeredAt || nowStr),
    registeredBy: registeredBy || existing?.registeredBy || "이창엽",
    classifiedBy: registeredBy || existing?.classifiedBy || "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    // 👑 4단계 전자결재 및 경영진 승인 동기화 필드
    approvalStatus: record.approvalStatus || existing?.approvalStatus || "",
    approvalDocId: record.approvalDocId || existing?.approvalDocId || "",
    approvedBy: record.approvedBy || existing?.approvedBy || "",
    approvedTitle: record.approvedTitle || existing?.approvedTitle || "",
    approvedAt: record.approvedAt || existing?.approvedAt || "",
    approvalSignature: record.approvalSignature || existing?.approvalSignature || "",
    approvalComment: record.approvalComment || existing?.approvalComment || "",
    targetApprover: record.targetApprover || existing?.targetApprover || "",
    approvalRequestedAt: record.approvalRequestedAt || existing?.approvalRequestedAt || "",
    // 🔍 3단계 5-Why 원인분석 및 CAPA 대책 필드
    rootCause: record.rootCause || existing?.rootCause || "",
    whyAnalysis: record.whyAnalysis || existing?.whyAnalysis || "",
    correctiveAction: record.correctiveAction || existing?.correctiveAction || "",
    isSqNotice: Boolean(record.isSqNotice !== undefined ? record.isSqNotice : existing?.isSqNotice),
    beforePhotos: Array.isArray(record.beforePhotos) ? record.beforePhotos : (existing?.beforePhotos || []),
    afterPhotos: Array.isArray(record.afterPhotos) ? record.afterPhotos : (existing?.afterPhotos || []),
    targetDate: record.targetDate || existing?.targetDate || ""
  };

  // Strip any undefined keys
  Object.keys(ledgerItem).forEach((k) => {
    if (ledgerItem[k] === undefined) delete ledgerItem[k];
  });

  // 1. [P2-6] Firestore 원자적 트랜잭션 (runTransaction) 적용으로 동시 수정 경합(Race Condition) 방어
  if (db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, ledgerId);
      const committedItem = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        const remoteData = snap.exists() ? snap.data() : null;

        // 원격 문서가 이미 존재하면 클라우드 발생일자 및 등록일시 절대 불변 보존
        const enforcedDate = remoteData?.date || ledgerItem.date;
        const enforcedRegisteredAt = remoteData?.registeredAt || ledgerItem.registeredAt;

        const merged = {
          ...remoteData,
          ...ledgerItem,
          date: enforcedDate,
          registeredAt: enforcedRegisteredAt,
          updatedAt: nowStr
        };

        Object.keys(merged).forEach((k) => {
          if (merged[k] === undefined) delete merged[k];
        });

        transaction.set(docRef, merged, { merge: true });
        return merged;
      });

      // 로컬 스토리지 캐시 동기화
      const nextLocal = existingIdx >= 0
        ? current.map((it, idx) => (idx === existingIdx ? committedItem : it))
        : [committedItem, ...current];
      saveLocalFourMChangePoints(nextLocal);
      return committedItem;
    } catch (e) {
      console.warn("Firestore runTransaction 4M ledger fallback:", e);
    }
  }

  // 오프라인 폴백
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ledgerItem;
  } else {
    updated = [ledgerItem, ...current];
  }

  saveLocalFourMChangePoints(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, ledgerId), ledgerItem, { merge: true });
  } catch (e) {
    console.warn("Firestore save four_m_change_point fallback to local:", e);
  }

  return ledgerItem;
};

// Unregister (Delete) from Official 4M Change Point Ledger
export const unregisterFromFourMLedger = async (ledgerOrOriginalId) => {
  const targetId = typeof ledgerOrOriginalId === "object"
    ? String(ledgerOrOriginalId?.id || ledgerOrOriginalId?.originalId || ledgerOrOriginalId?.raw?.id || "").trim()
    : String(ledgerOrOriginalId || "").trim();

  if (!targetId) return getLocalFourMChangePoints();

  const current = getLocalFourMChangePoints();

  // Find all matched records
  const matched = current.filter(
    (it) =>
      it.id === targetId ||
      it.originalId === targetId ||
      it.rawId === targetId ||
      it.id === `ledger_${targetId}` ||
      `ledger_${it.originalId}` === targetId ||
      (it.originalId && targetId.includes(it.originalId)) ||
      (it.id && targetId.includes(it.id))
  );

  const matchedDocIds = new Set(matched.map((m) => m.id));
  if (targetId.startsWith("ledger_")) {
    matchedDocIds.add(targetId);
  } else {
    matchedDocIds.add(`ledger_${targetId}`);
  }
  matchedDocIds.add(targetId);

  const updated = current.filter(
    (it) =>
      !matchedDocIds.has(it.id) &&
      it.originalId !== targetId &&
      it.rawId !== targetId &&
      !matched.some((m) => m.id === it.id)
  );

  saveLocalFourMChangePoints(updated);

  // Delete matching documents from Firestore
  for (const docId of matchedDocIds) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
    } catch (e) {
      console.warn("Firestore delete four_m_change_point error:", docId, e);
    }
  }

  return updated;
};

// Purge all MAN / Absence change points from Official Ledger (Firestore & LocalStorage)
export const purgeManFourMChangePoints = async () => {
  const current = getLocalFourMChangePoints();
  const remaining = current.filter(
    (it) =>
      it.fourM?.toUpperCase() !== "MAN" &&
      !String(it.sourceType || "").includes("MAN_ABSENCE") &&
      !String(it.id || "").includes("man_") &&
      !String(it.originalId || "").includes("man_")
  );
  saveLocalFourMChangePoints(remaining);

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        const data = d.data();
        const isMan =
          data.fourM?.toUpperCase() === "MAN" ||
          String(data.sourceType || "").includes("MAN_ABSENCE") ||
          String(d.id).includes("man_") ||
          String(data.originalId || "").includes("man_") ||
          String(data.id || "").includes("man_");
        if (isMan) {
          await deleteDoc(doc(db, COLLECTION_NAME, d.id));
        }
      }
    } catch (e) {
      console.warn("Firestore purgeManFourMChangePoints error:", e);
    }
  }

  return remaining;
};

// Purge ALL change points from Official Ledger
export const purgeAllFourMChangePoints = async () => {
  saveLocalFourMChangePoints([]);
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, d.id));
      }
    } catch (e) {
      console.warn("Firestore purgeAllFourMChangePoints error:", e);
    }
  }
  return [];
};

/**
 * 🌟 [품질 단일 원천 원칙] 부적합경보/품질이슈의 공식 4M 대장 자동 동기화 중단
 * (모든 변동점은 하단 통합 취합 패널로만 모이며, 이창엽 품질관리자가 직접 분류/등록한 건만 공식 대장에 등재됨)
 */
export const syncQualityAlertToFourMLedger = async (alertItem, originName = "부적합경보") => {
  return null;
};

/**
 * 🌟 [품질 단일 원천 원칙] 전 공정 부적합경보의 공식 4M 대장 일괄 자동 동기화 중단
 */
export const autoSyncAllQualityIssuesToFourMLedger = async (qualityLists = {}) => {
  return [];
};

