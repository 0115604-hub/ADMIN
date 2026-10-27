import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import {
  sendApprovalDraftTelegram,
  sendApprovalStepTelegram,
  sendApprovalHoldTelegram,
  sendApprovalRejectTelegram
} from "./telegramService";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { cleanCompanyName, getLocalSmartOvertimeData } from "./overtimeSmartService";
import { isWeekendByDate } from "./overtimeService";

const COLLECTION_NAME = "approval_documents";
const DELETED_COLLECTION_NAME = "deleted_approval_documents";
const LOCAL_STORAGE_KEY = "oryuk_approval_documents_v10_unified";
const DELETED_STORAGE_KEY = "oryuk_approval_deleted_ids_v10";

// ⭐ 과거 레거시 로컬 캐시 키 영구 파기 (오래된 더미데이터 및 좀비 서류 부활 원천 차단)
if (typeof window !== "undefined") {
  try {
    [
      "oryuk_approval_documents_v9_master",
      "oryuk_approval_documents_v8_stable",
      "oryuk_approval_documents_v7_clean",
      "oryuk_approval_documents_v6_clean",
      "oryuk_approval_documents_v5"
    ].forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

export const DEFAULT_DELETED_APPROVAL_IDS = [
  "appr_4m_ledger_man_log_auto_2026-10-12_유성_론나차이_1793058086561",
  "appr_4m_ledger_man_log_auto_2026-10-12_유성_팔라_1793058214342",
  "appr_4m_ledger_man_log_auto_2026-10-12_조영_윤의정_1793058413459",
  "appr_4m_ledger_man_log_auto_2026-10-13_유성_론나차이_1793058873183",
  "appr_4m_ledger_man_log_auto_2026-10-14_유성_론나차이_1793058904685",
  "appr_4m_ledger_mach_qual_1792626820469_4r5z_1793060701646",
  // 구버전 합성 공장별 특근 더미데이터 영구 차단
  "appr_ot_samrangjin_20260905",
  "appr_ot_samrangjin_20261003",
  "appr_ot_samrangjin_20261005",
  "appr_ot_samrangjin_20261009",
  "appr_ot_samrangjin_20261010",
  "appr_ot_samrangjin_20261017",
  "appr_ot_samrangjin_20261018",
  "appr_ot_samrangjin_20261024",
  "appr_ot_samrangjin_latest",
  "appr_ot_hanlim_20260906",
  "appr_ot_hanlim_20260914"
];

// ⭐ Helper: Manage permanently deleted document IDs (Tombstone blacklist)
export const getDeletedApprovalIds = () => {
  const set = new Set(DEFAULT_DELETED_APPROVAL_IDS);
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(id));
      }
    }
  } catch (e) {}
  return set;
};

export const saveDeletedApprovalIds = (setOrArr) => {
  try {
    const arr = Array.from(setOrArr);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
};

export const PLANT_COMPANIES_MAP = {
  "삼랑진공장": ["오륙", "(주)오륙", "유성", "유성산업"],
  "한림공장": ["조영", "(주)조영산업", "조영산업", "한울", "부림텍"]
};

// List of authorized managers by Title / Hierarchy
export const APPROVAL_MANAGERS = {
  // 1. 기안자 목록 (관리자, 선임, 작업자 전체)
  DRAFTERS: [
    // 본사 / 임원
    { name: "권태형", title: "대표이사", plant: "본사", process: "총괄대표", isManager: true },
    { name: "최미영", title: "전무", plant: "본사", process: "경영총괄", isManager: true },
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리", isManager: true },
    // 삼랑진공장 관리/책임/선임
    { name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 관리", isManager: true },
    { name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리", isManager: true },
    { name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전", isManager: true },
    { name: "양인나", title: "선임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "유동길", title: "선임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "조인주", title: "선임", plant: "삼랑진공장", process: "경리업무", isManager: true },
    { name: "이상기", title: "주임", plant: "삼랑진공장", process: "품질관리", isManager: true },
    // 협력업체 관리자 (삼랑진/유성)
    { name: "이성기", title: "선임", plant: "삼랑진공장", process: "유성 관리자", company: "유성", isManager: true },
    // 한림공장 관리/책임/선임/사원
    { name: "김동욱", title: "책임", plant: "한림공장", process: "총괄관리", isManager: true },
    { name: "오상민", title: "선임", plant: "한림공장", process: "조영 관리자", company: "조영", isManager: true },
    { name: "황수현", title: "선임", plant: "한림공장", process: "한울 관리자", company: "한울", isManager: true },
    { name: "김동훈", title: "책임", plant: "한림공장", process: "부림텍 관리자", company: "부림텍", isManager: true },
    { name: "정현규", title: "사원", plant: "한림공장", process: "가공동 관리", isManager: true },
    // 압출동 작업자
    { name: "공영국", title: "대리", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "심임대", title: "반장", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "이상은", title: "반장", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "닉", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "마이클", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "존카를로", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "지미", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "만", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "샤먼", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "쿠마루", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "이수루", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false }
  ],
  // 2. 책임 (중간결재자 - 관리자 및 책임/선임/반장 전체)
  LEADS: [
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리" },
    { name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 관리" },
    { name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리" },
    { name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전" },
    { name: "이성기", title: "선임", plant: "삼랑진공장", process: "유성 관리자", company: "유성" },
    { name: "김동욱", title: "책임", plant: "한림공장", process: "총괄관리" },
    { name: "오상민", title: "선임", plant: "한림공장", process: "조영 관리자", company: "조영" },
    { name: "황수현", title: "선임", plant: "한림공장", process: "한울 관리자", company: "한울" },
    { name: "김동훈", title: "책임", plant: "한림공장", process: "부림텍 관리자", company: "부림텍" },
    { name: "양인나", title: "선임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "유동길", title: "선임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "조인주", title: "선임", plant: "삼랑진공장", process: "경리업무" },
    { name: "공영국", title: "대리", plant: "삼랑진공장", process: "압출동" },
    { name: "심임대", title: "반장", plant: "삼랑진공장", process: "압출동" },
    { name: "이상은", title: "반장", plant: "삼랑진공장", process: "압출동" }
  ],
  // 3. 이사 (임원 결재자)
  DIRECTORS: [
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리" },
    { name: "최미영", title: "전무", plant: "본사", process: "경영총괄" },
    { name: "이명재 / 최미영", title: "이사/전무", plant: "공통", process: "공동 결재 권한" }
  ],
  // 4. 대표 (최종 결재자)
  CEO: [
    { name: "권태형", title: "대표이사", plant: "본사", process: "대표이사" },
    { name: "최미영", title: "전무", plant: "본사", process: "전무" }
  ]
};

// Safe Timestamp Parser (handles Korean date strings, ISO, milliseconds, and YYYY-MM-DD cleanly)
export const parseSafeTimestamp = (val) => {
  if (!val) return 0;
  if (typeof val === "number" && !isNaN(val)) return val;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  if (!str) return 0;

  // Direct parse or ISO
  let t = new Date(str).getTime();
  if (!isNaN(t) && t > 0) return t;

  // Replace dots: "2026. 10. 02. 07:50" -> "2026-10-02T07:50:00"
  const m = str.match(/(\d{4})\s*[-/.년]\s*(\d{1,2})\s*[-/.월]\s*(\d{1,2})(?:[.\s일]*(\d{1,2}):(\d{1,2}))?/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const hr = m[4] ? parseInt(m[4], 10) : 12;
    const min = m[5] ? parseInt(m[5], 10) : 0;
    return new Date(y, mon, d, hr, min, 0).getTime();
  }

  const idMatch = str.match(/2026\d{4}|\d{10,13}/);
  if (idMatch) {
    if (idMatch[0].length === 8) {
      const y = parseInt(idMatch[0].slice(0, 4), 10);
      const mon = parseInt(idMatch[0].slice(4, 6), 10) - 1;
      const day = parseInt(idMatch[0].slice(6, 8), 10);
      return new Date(y, mon, day, 18, 0, 0).getTime();
    }
    const num = parseInt(idMatch[0], 10);
    if (!isNaN(num)) return num;
  }

  return 0;
};

// ⭐ Accurate Chronological Timestamp for Sorting Approval Documents (Today/Recent drafts always on top!)
export function getApprovalDocSortTimestamp(doc) {
  if (!doc) return 0;

  // 1. Direct manual draft or recent submission: Use createdAt timestamp if from current/future date
  if (doc.createdAt) {
    const tCreated = parseSafeTimestamp(doc.createdAt);
    // If createdAt is a valid specific timestamp and not an auto-synthesized past report
    if (tCreated > 0 && !doc.id?.startsWith("appr_ot_") && !doc.id?.startsWith("appr_att_")) {
      return tCreated;
    }
  }

  // 2. Overtime report with explicit workDate (e.g. "2026-09-12" or "2026-09-19")
  if (doc.workDate && typeof doc.workDate === "string") {
    const m = doc.workDate.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mon = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      return new Date(y, mon, d, 18, 0, 0).getTime();
    }
  }

  // 3. ID containing canonical YYYYMMDD date (e.g. appr_ot_samrangjin_20260912 -> 2026-09-12)
  if (doc.id && typeof doc.id === "string") {
    const idDateMatch = doc.id.match(/(2026\d{4})/);
    if (idDateMatch) {
      const y = parseInt(idDateMatch[1].slice(0, 4), 10);
      const mon = parseInt(idDateMatch[1].slice(4, 6), 10) - 1;
      const d = parseInt(idDateMatch[1].slice(6, 8), 10);
      return new Date(y, mon, d, 18, 0, 0).getTime();
    }
  }

  // 4. Extract date from title (e.g. "9월 12일", "9월 19일")
  if (doc.title && typeof doc.title === "string") {
    const titleDateMatch = doc.title.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (titleDateMatch) {
      const mon = parseInt(titleDateMatch[1], 10) - 1;
      const d = parseInt(titleDateMatch[2], 10);
      return new Date(2026, mon, d, 18, 0, 0).getTime();
    }
  }

  // 5. Fallback: createdAt -> updatedAt -> id timestamp
  if (doc.createdAt) {
    const t = parseSafeTimestamp(doc.createdAt);
    if (t > 0) return t;
  }
  if (doc.updatedAt) {
    const t = parseSafeTimestamp(doc.updatedAt);
    if (t > 0) return t;
  }
  if (doc.id) {
    const t = parseSafeTimestamp(doc.id);
    if (t > 0) return t;
  }

  return 0;
}

// ⭐ 결재선 자동 생성 로직 (100% 정립된 5대 표준 결재라인 구축)
// 1. [4M 변동점 및 시정대책(CAPA) 전용 3단계]: 이창엽 책임(상신) ➔ 이명재 이사(검토) ➔ 권태형 대표이사(승인)
// 2. [공정 관리자(책임) 직접 기안 4단계]: 기안 상신 ➔ 책임 전결(자동) ➔ 이명재 이사(대기) ➔ 권태형 대표이사(대기)
// 3. [일반 사원/선임/작업자 기안 4단계]: 기안 상신 ➔ 부서별 책임자 ➔ 이명재 이사 ➔ 권태형 대표이사
// 4. [주말/공휴일 특근보고서 4단계]: 공장 취합자 ➔ 생산 총괄 책임자 ➔ 이명재 이사 ➔ 권태형 대표이사
// 5. [임원/대표이사 직접 기안]: 이명재 이사(3단계 전결) / 권태형 대표이사(전단계 대표 전결)
export function getAutoApprovalSteps(
  plant,
  drafterName,
  drafterTitle,
  department,
  leadName = null,
  ceoName = "대표이사",
  directorName = null,
  docType = null
) {
  const isHanlim = plant === "한림공장";
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const ceoTitle = ceoName === "최미영" ? "전무" : "대표이사";
  const finalCeoName = ceoName === "최미영" ? "최미영" : "권태형";

  // 1. [4M 변동점 및 시정대책(CAPA) 전용 결재라인] (3단계 고정)
  const is4MDoc =
    docType === "FOUR_M_CHANGE_POINT" ||
    docType === "CHANGE_POINT" ||
    (department?.includes("품질") && drafterName === "이창엽" && !docType?.includes("OVERTIME"));

  if (is4MDoc) {
    return [
      {
        role: "담당",
        name: "이창엽",
        title: "책임",
        status: "APPROVED",
        date: nowStr,
        comment: "4M 변동점 및 시정대책(CAPA) 기안 상신"
      },
      {
        role: "검토",
        name: "이명재",
        title: "이사",
        status: "PENDING",
        date: "",
        comment: ""
      },
      {
        role: "승인",
        name: finalCeoName,
        title: ceoTitle,
        status: "WAITING",
        date: "",
        comment: ""
      }
    ];
  }

  // 5-A. [대표이사 / 전무 직접 기안] (전단계 대표 전결 자동 승인)
  const isCeoDrafter =
    drafterName === "권태형" ||
    drafterName === "최미영" ||
    drafterTitle === "대표이사" ||
    drafterTitle === "대표" ||
    drafterTitle === "전무";

  if (isCeoDrafter) {
    const chiefName = drafterName || finalCeoName;
    const chiefTitle = drafterTitle || ceoTitle;
    return [
      { role: "담당", name: chiefName, title: chiefTitle, status: "APPROVED", date: nowStr, comment: "기안 상신" },
      { role: "책임", name: chiefName, title: "책임", status: "APPROVED", date: nowStr, comment: "대표 전결" },
      { role: "이사", name: chiefName, title: "이사", status: "APPROVED", date: nowStr, comment: "대표 전결" },
      { role: "대표", name: chiefName, title: chiefTitle, status: "APPROVED", date: nowStr, comment: "대표이사 최종 승인" }
    ];
  }

  // 5-B. [이명재 이사 직접 기안] (3단계 이사 전결 ➔ 대표이사 최종승인 대기)
  const isDirectorDrafter =
    drafterName === "이명재" ||
    drafterTitle === "이사" ||
    (directorName && directorName.includes(drafterName));

  if (isDirectorDrafter) {
    return [
      { role: "담당", name: "이명재", title: "이사", status: "APPROVED", date: nowStr, comment: "기안 상신" },
      { role: "책임", name: "이명재", title: "책임", status: "APPROVED", date: nowStr, comment: "책임 전결" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: nowStr, comment: "이사 전결" },
      { role: "대표", name: finalCeoName, title: ceoTitle, status: "PENDING", date: "", comment: "" }
    ];
  }

  // 3단계 이사 결재자 지정 (삼랑진: 이명재 이사 / 한림: 이명재/최미영)
  let step3Name = directorName || (isHanlim ? "이명재 / 최미영" : "이명재");
  let step3Title = isHanlim && !directorName ? "이사/전무" : (step3Name === "최미영" ? "전무" : "이사");

  // 2단계 책임 결재자 결정
  let step2Name = leadName;
  let step2Title = "책임";

  if (step2Name) {
    const foundLead = APPROVAL_MANAGERS.LEADS.find((m) => m.name === step2Name);
    if (foundLead) {
      step2Title = foundLead.title || "책임";
    }
  } else {
    if (isHanlim) {
      step2Name = "김동욱";
      step2Title = "책임";
    } else {
      if (department?.includes("품질")) {
        step2Name = "이창엽";
        step2Title = "책임";
      } else if (department?.includes("설비")) {
        step2Name = "전재율";
        step2Title = "책임";
      } else if (department?.includes("가공") || department?.includes("유성")) {
        step2Name = "윤경수";
        step2Title = "책임";
      } else {
        step2Name = "설유철";
        step2Title = "책임";
      }
    }
  }

  // 2. [공정 관리자(책임) 직접 기안 결재라인] (책임 전결형 4단계)
  // 윤경수, 이창엽, 설유철, 전재율, 김동욱 등 공정 관리자(책임)가 직접 기안하는 경우
  // 본인의 2단계 책임 단계는 기안과 동시에 '책임 전결'로 자동 승인 처리되어
  // 타 책임자에게 불필요하게 대기하지 않고 상위 결재권자(이명재 이사)에게 즉시 도달하도록 자동 생성
  const PROCESS_LEAD_NAMES = ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"];
  const isProcessManagerLead =
    PROCESS_LEAD_NAMES.includes(drafterName) ||
    drafterTitle === "책임" ||
    drafterName === step2Name ||
    APPROVAL_MANAGERS.LEADS.some((m) => m.name === drafterName && m.title === "책임");

  if (isProcessManagerLead) {
    return [
      {
        role: "담당",
        name: drafterName || "기안자",
        title: drafterTitle || "책임",
        status: "APPROVED",
        date: nowStr,
        comment: "기안 상신"
      },
      {
        role: "책임",
        name: drafterName,
        title: drafterTitle || "책임",
        status: "APPROVED",
        date: nowStr,
        comment: "책임 전결"
      },
      {
        role: "이사",
        name: step3Name,
        title: step3Title,
        status: "PENDING",
        date: "",
        comment: ""
      },
      {
        role: "대표",
        name: finalCeoName,
        title: ceoTitle,
        status: "WAITING",
        date: "",
        comment: ""
      }
    ];
  }

  // 3. [일반 사원 / 선임 / 작업자 기안 결재라인] (표준 4단계)
  return [
    {
      role: "담당",
      name: drafterName || "기안자",
      title: drafterTitle || "선임",
      status: "APPROVED",
      date: nowStr,
      comment: "기안 상신"
    },
    {
      role: "책임",
      name: step2Name,
      title: step2Title,
      status: "PENDING",
      date: "",
      comment: ""
    },
    {
      role: "이사",
      name: step3Name,
      title: step3Title,
      status: "WAITING",
      date: "",
      comment: ""
    },
    {
      role: "대표",
      name: finalCeoName,
      title: ceoTitle,
      status: "WAITING",
      date: "",
      comment: ""
    }
  ];
}

// ⭐ 2026년 10월 18일 이하(<= 2026-10-18) 전자결재 문서 판별 헬퍼 (10월 18일까지의 과거 이력 서류만 결재완료 처리)
export const APPROVAL_AUTO_COMPLETE_CUTOFF_DATE = "2026-10-18";
export const APPROVAL_AUTO_COMPLETE_CUTOFF_TS = new Date(2026, 9, 18, 23, 59, 59, 999).getTime();

export function isApprovalDocOnOrBeforeOct18(d) {
  if (!d || typeof d !== "object") return false;
  if (d.status === "REJECTED" || d.status === "HOLD") return false;

  // 1. 명시적 workDate 확인 (예: "2026-10-18", "2026. 10. 17.", "2026-09-28")
  if (d.workDate && typeof d.workDate === "string") {
    const m = d.workDate.match(/(\d{4})\s*[-/.년]\s*(\d{1,2})\s*[-/.월]\s*(\d{1,2})/);
    if (m) {
      const ymd = `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, "0")}-${String(parseInt(m[3], 10)).padStart(2, "0")}`;
      if (ymd > APPROVAL_AUTO_COMPLETE_CUTOFF_DATE) return false;
      return true;
    }
  }

  // 1-b. createdAt 문자열 직접 날짜 추출 확인 (예: "2026. 10. 15. 14:30")
  if (d.createdAt && typeof d.createdAt === "string") {
    const cm = d.createdAt.match(/(\d{4})\s*[-/.년]\s*(\d{1,2})\s*[-/.월]\s*(\d{1,2})/);
    if (cm) {
      const ymd = `${cm[1]}-${String(parseInt(cm[2], 10)).padStart(2, "0")}-${String(parseInt(cm[3], 10)).padStart(2, "0")}`;
      if (ymd > APPROVAL_AUTO_COMPLETE_CUTOFF_DATE) return false;
      return true;
    }
  }

  // 2. 문서 ID 내 날짜(2026MMDD) 확인 (예: appr_ot_oryuk_20261018)
  if (d.id && typeof d.id === "string") {
    const idDateMatch = d.id.match(/(2026\d{4})/);
    if (idDateMatch) {
      if (Number(idDateMatch[1]) > 20261018) return false;
      return true;
    }
  }

  // 3. 제목 내 날짜("10월 18일", "9월 20일" 등) 확인
  if (d.title && typeof d.title === "string") {
    const titleDateMatch = d.title.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
    if (titleDateMatch) {
      const y = titleDateMatch[1] ? parseInt(titleDateMatch[1], 10) : 2026;
      const mon = parseInt(titleDateMatch[2], 10);
      const day = parseInt(titleDateMatch[3], 10);
      const ymd = `${y}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (ymd > APPROVAL_AUTO_COMPLETE_CUTOFF_DATE) return false;
      return true;
    }
  }

  // 4. 기안일시(createdAt) 또는 정렬 타임스탬프 기준 확인 (2026-10-18 23:59:59 이하)
  if (d.createdAt) {
    const tCreated = parseSafeTimestamp(d.createdAt);
    if (tCreated > APPROVAL_AUTO_COMPLETE_CUTOFF_TS) return false;
    if (tCreated > 0 && tCreated <= APPROVAL_AUTO_COMPLETE_CUTOFF_TS) {
      return true;
    }
  }

  const sortTs = getApprovalDocSortTimestamp(d);
  if (sortTs > APPROVAL_AUTO_COMPLETE_CUTOFF_TS) return false;
  if (sortTs > 0 && sortTs <= APPROVAL_AUTO_COMPLETE_CUTOFF_TS) {
    return true;
  }

  return false;
}
export const isApprovalDocOnOrBeforeCutoff = isApprovalDocOnOrBeforeOct18;

// Clean and Normalize Document: calculate true step statuses without altering user document data
// ⭐ 결재 자동 승인 방지 & 결재선 구조 무조건 보장 (단, 10월 18일까지의 과거 문서는 모두 결재완료 보장)
// ⚠️ 4M 변동점 결재라인: 이창엽 책임(상신) ➔ 이명재 이사(검토) ➔ 권태형 대표이사(승인) 전용 3단계
export function normalizeApprovalDoc(d) {
  if (!d || typeof d !== "object") return d;
  const isHanlim = d.plant === "한림공장";
  const is4M = isFourMApprovalDoc(d);

  // Guarantee proper steps (4M = 3 steps strictly, others = 4 steps)
  let rawSteps = null;
  if (is4M) {
    const isDocFullyApproved =
      d.status === "APPROVED" ||
      d.approvalStatus === "APPROVED" ||
      (Array.isArray(d.steps) && d.steps.length > 0 && d.steps[d.steps.length - 1]?.status === "APPROVED");

    if (Array.isArray(d.steps) && d.steps.length === 3) {
      rawSteps = d.steps;
    } else if (Array.isArray(d.steps) && d.steps.length === 4) {
      // 🌟 과거 4단계 잔여 찌꺼기를 정식 3단계(이창엽 책임 -> 이명재 이사 -> 권태형 대표이사)로 무결점 마이그레이션!
      const s0 = d.steps[0] || {};
      const s1 = d.steps[1] || {};
      const s2 = d.steps[2] || {};
      const s3 = d.steps[3] || {};

      const step0Approved = true;
      const step1Approved = isDocFullyApproved || s2.status === "APPROVED";
      const step2Approved = isDocFullyApproved || s3.status === "APPROVED";
      const isRejected = d.status === "REJECTED" || s1.status === "REJECTED" || s2.status === "REJECTED";

      rawSteps = [
        {
          role: "담당",
          name: s0.name || d.drafter || "이창엽",
          title: "책임",
          status: "APPROVED",
          date: s0.date || d.createdAt || "",
          comment: s0.comment || "4M 변동점 및 시정대책(CAPA) 기안 상신"
        },
        {
          role: "검토",
          name: s2.name?.includes("최미영") && !s2.name?.includes("이명재") ? s2.name : "이명재",
          title: s2.title || "이사",
          status: step1Approved ? "APPROVED" : (isRejected ? "REJECTED" : "PENDING"),
          date: s2.date || (step1Approved ? (d.updatedAt || d.createdAt || "") : ""),
          comment: s2.comment || (step1Approved ? "승인" : (s1.comment && s1.comment !== "승인" ? s1.comment : ""))
        },
        {
          role: "승인",
          name: s3.name === "최미영" ? "최미영" : "권태형",
          title: s3.title === "전무" ? "전무" : "대표이사",
          status: step2Approved ? "APPROVED" : (step1Approved ? "PENDING" : "WAITING"),
          date: s3.date || (step2Approved ? (d.updatedAt || d.createdAt || "") : ""),
          comment: s3.comment || (step2Approved ? "대표이사 최종 승인" : "")
        }
      ];
    } else if (isDocFullyApproved) {
      rawSteps = [
        { role: "담당", name: d.drafter || "이창엽", title: "책임", status: "APPROVED", date: d.createdAt || "", comment: "4M 변동점 및 시정대책(CAPA) 기안 상신" },
        { role: "검토", name: "이명재", title: "이사", status: "APPROVED", date: d.updatedAt || d.createdAt || "", comment: "승인" },
        { role: "승인", name: "권태형", title: "대표이사", status: "APPROVED", date: d.updatedAt || d.createdAt || "", comment: "대표이사 최종 승인" }
      ];
    } else {
      rawSteps = [
        { role: "담당", name: d.drafter || "이창엽", title: "책임", status: "APPROVED", date: d.createdAt || "", comment: "4M 변동점 및 시정대책(CAPA) 기안 상신" },
        { role: "검토", name: "이명재", title: "이사", status: "PENDING", date: "", comment: "" },
        { role: "승인", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
      ];
    }
  } else if (Array.isArray(d.steps) && d.steps.length === 4) {
    rawSteps = d.steps;
  } else {
    try {
      rawSteps = getAutoApprovalSteps(
        d.plant,
        d.drafter || "기안자",
        d.drafterTitle || "선임",
        d.department || "생산총괄",
        d.leadName || null,
        d.ceoName || "대표이사",
        d.directorName || null
      );
    } catch (e) {
      rawSteps = [
        { role: "담당", name: d.drafter || "기안자", title: d.drafterTitle || "선임", status: "APPROVED", date: "", comment: "" },
        { role: "책임", name: "설유철", title: "책임", status: "PENDING", date: "", comment: "" },
        { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
        { role: "대표", name: "대표이사", title: "대표이사", status: "WAITING", date: "", comment: "" }
      ];
    }
  }

  const fixedSteps = rawSteps.map((st, idx) => {
    if (!st) {
      const defaultRoles = is4M ? ["담당", "검토", "승인"] : ["담당", "책임", "이사", "대표"];
      return { role: defaultRoles[idx] || "검토", name: "", title: "", status: idx === 0 ? "APPROVED" : "WAITING", date: "", comment: "" };
    }
    if (is4M) {
      if (idx === 0) {
        return {
          ...st,
          role: "담당",
          name: st.name || d.drafter || "이창엽",
          title: "책임",
          status: st.status || "APPROVED"
        };
      }
      if (idx === 1) {
        return {
          ...st,
          role: "검토",
          name: st.name || "이명재",
          title: st.title || "이사"
        };
      }
      if (idx === 2) {
        return {
          ...st,
          role: "승인",
          name: st.name || "권태형",
          title: st.title || "대표이사"
        };
      }
      return st;
    }
    if (st.role === "이사") {
      const isApprovedByChoi = st.name === "최미영";
      const isApprovedByLee = st.name === "이명재";
      let normName = st.name || "이명재";
      let normTitle = "이사";

      if (isApprovedByChoi) {
        normName = "최미영";
        normTitle = "전무";
      } else if (isApprovedByLee) {
        normName = "이명재";
        normTitle = "이사";
      } else if (st.name?.includes("최미영") && st.name?.includes("이명재")) {
        normName = "이명재 / 최미영";
        normTitle = st.date ? "이사" : "이사/전무";
      } else if (isHanlim && (!st.name || st.name === "이명재/최미영")) {
        normName = "이명재 / 최미영";
        normTitle = st.date ? "이사" : "이사/전무";
      }

      return {
        ...st,
        name: normName,
        title: normTitle
      };
    }
    if (st.role === "대표") {
      return {
        ...st,
        name: st.name === "최미영" ? "최미영" : (st.name || "대표이사"),
        title: st.name === "최미영" ? "전무" : "대표"
      };
    }
    return st;
  });

  // ⭐ 공정 관리자(책임) 직접 기안 서류 자동 전결 치유:
  // 일반 결재 서류에서 기안자가 책임자인데 2단계(책임)가 미결(PENDING)로 멈춰있는 경우 자동 책임 전결 승인 및 3단계(이명재 이사)로 전환
  if (!is4M && fixedSteps.length === 4) {
    const drafterName = d.drafter || "";
    const drafterTitle = d.drafterTitle || "";
    const isProcessLead =
      ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"].includes(drafterName) ||
      drafterTitle === "책임" ||
      APPROVAL_MANAGERS.LEADS.some((m) => m.name === drafterName && m.title === "책임");

    if (isProcessLead && fixedSteps[1].status === "PENDING" && fixedSteps[2].status === "WAITING") {
      fixedSteps[1] = {
        ...fixedSteps[1],
        name: drafterName,
        title: drafterTitle || "책임",
        status: "APPROVED",
        date: fixedSteps[1].date || d.createdAt || fixedSteps[0]?.date || "",
        comment: fixedSteps[1].comment || "책임 전결"
      };
      fixedSteps[2] = {
        ...fixedSteps[2],
        status: "PENDING"
      };
    }
  }

  // ⭐ 10월 18일까지(<= 2026-10-18)의 과거 이력 전자결재문서만 결재완료(4/4 또는 3/3) 보장
  // 🔒 활성 검토 중인 서류(PENDING 또는 HOLD 단계가 명시된 미결 서류)는 절대 무단 완료 처리하지 않음
  const hasActivePendingStep = fixedSteps.some((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  const isOnOrBeforeCutoff = isApprovalDocOnOrBeforeCutoff(d) && d.status !== "REJECTED" && !hasActivePendingStep;

  if (isOnOrBeforeCutoff) {
    const docDate = d.workDate ? `${d.workDate} 18:00` : (d.createdAt || "2026-10-18 18:00");
    const completedSteps = fixedSteps.map((st, idx) => ({
      ...st,
      name: is4M
        ? (idx === 0 ? (st.name || "이창엽") : idx === 1 ? "이명재" : "권태형")
        : (idx === 2 && st.name?.includes("이명재") ? "이명재" : (idx === 3 && (!st.name || st.name === "대표이사") ? "권태형" : st.name)),
      title: is4M
        ? (idx === 0 ? "책임" : idx === 1 ? "이사" : "대표이사")
        : (idx === 2 ? (st.name === "최미영" ? "전무" : "이사") : (idx === 3 ? (st.name === "최미영" ? "전무" : "대표이사") : st.title)),
      status: "APPROVED",
      date: st.date || docDate,
      comment: st.comment || (idx === 0 ? "기안 상신" : idx === fixedSteps.length - 1 ? "대표이사 최종 승인" : "승인")
    }));

    return {
      ...d,
      currentStep: fixedSteps.length,
      status: "APPROVED",
      holdReason: "",
      rejectReason: "",
      steps: completedSteps
    };
  }

  // Calculate true approval step status based strictly on the steps
  const approvedCount = fixedSteps.filter((st) => st && st.status === "APPROVED").length;
  let computedStatus = "IN_PROGRESS";
  let computedStep = approvedCount + 1;

  if (approvedCount === fixedSteps.length && fixedSteps.length > 0) {
    computedStatus = "APPROVED";
    computedStep = fixedSteps.length;
  } else if (fixedSteps.some((st) => st && st.status === "REJECTED")) {
    computedStatus = "REJECTED";
    computedStep = fixedSteps.findIndex((st) => st && st.status === "REJECTED") + 1;
  } else if (fixedSteps.some((st) => st && st.status === "HOLD")) {
    computedStatus = "HOLD";
    computedStep = fixedSteps.findIndex((st) => st && st.status === "HOLD") + 1;
  } else {
    // 이미 최종 승인(APPROVED) 상태이고 마지막 단계가 승인된 경우 안전 유지
    if ((d.status === "APPROVED" || d.approvalStatus === "APPROVED") && fixedSteps[fixedSteps.length - 1]?.status === "APPROVED") {
      computedStatus = "APPROVED";
      computedStep = fixedSteps.length;
    } else {
      computedStatus = "IN_PROGRESS";
      computedStep = Math.min(Math.max(1, approvedCount + 1), fixedSteps.length);
    }
  }

  // ⭐ Single Source of Truth: 결재 활성 단계(PENDING 또는 HOLD) 인덱스 및 결재자 확정
  const activeStepIdx = fixedSteps.findIndex((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  const activeStep = activeStepIdx >= 0 ? fixedSteps[activeStepIdx] : null;

  return {
    ...d,
    category: d.category || (is4M ? "4M변동점" : isOvertimeApprovalDoc(d) ? "특근보고서" : "품의서"),
    typeName: d.typeName || (is4M ? "4M 변동점 및 CAPA 승인 품의서" : isOvertimeApprovalDoc(d) ? "특근보고서" : "품의서"),
    currentStep: computedStep,
    status: computedStatus,
    steps: fixedSteps,
    activeStepIndex: activeStepIdx,
    activeApproverName: activeStep?.name || "",
    activeApproverRole: activeStep?.role || ""
  };
}

// ⭐ 1. 전사 결재 완료 여부 순수 판정 (Single Source of Truth)
export function isApprovalDocApproved(doc) {
  if (!doc) return false;
  if (isApprovalDocHold(doc) || isApprovalDocRejected(doc)) return false;
  const s = doc.status;
  if (s === "APPROVED" || s === "완료" || s === "결재완료") return true;
  if (Array.isArray(doc.steps) && doc.steps.length > 0 && doc.steps.every((st) => st && st.status === "APPROVED")) return true;
  return false;
}

// ⭐ 2. 보류 여부 판정 (Single Source of Truth)
export function isApprovalDocHold(doc) {
  if (!doc) return false;
  const s = doc.status;
  return s === "HOLD" || (Array.isArray(doc.steps) && doc.steps.some((st) => st && st.status === "HOLD"));
}

// ⭐ 3. 반려 여부 판정 (Single Source of Truth)
export function isApprovalDocRejected(doc) {
  if (!doc) return false;
  const s = doc.status;
  return s === "REJECTED" || (Array.isArray(doc.steps) && doc.steps.some((st) => st && st.status === "REJECTED"));
}

// ⭐ 4. 전사 진행중(미결) 여부 순수 판정 (완료/보류/반려가 아닌 모든 서류는 100% 진행중)
export function isApprovalDocInProgress(doc) {
  if (!doc) return false;
  if (isApprovalDocHold(doc) || isApprovalDocRejected(doc) || isApprovalDocApproved(doc)) return false;
  return true;
}

// ⭐ 5. 사용자별 결재 대기 판정 (Single Source of Truth 단일 진실 원천 기반 1원화)
export function isApprovalDocPending(doc, currentProfile = null, isAdmin = false) {
  if (!isApprovalDocInProgress(doc)) return false;

  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";
  const isProfileAdmin = Boolean(
    isAdmin ||
    currentProfile?.role === "ADMIN" ||
    currentProfile?.id === "admin" ||
    currentProfile?.id === "admin_kwon" ||
    currentProfile?.id === "admin_choi" ||
    userName === "권태형" ||
    userTitle.includes("대표")
  );

  // 1. 최고 경영진 (권태형 대표이사 / ADMIN): 전사 진행 중인 모든 문서는 100% 결재 대기 보장
  if (isProfileAdmin) {
    return true;
  }

  if (!userName) return false;

  // 2. 기안자 본인이 기안하여 진행 중인 문서: 목록 및 카운트 상시 유지
  if (doc.drafter && (doc.drafter === userName || doc.drafter.includes(userName) || userName.includes(doc.drafter))) {
    return true;
  }

  // 3. 활성 단계 결재자 매칭 (Single Source of Truth)
  const activeStep = doc.steps?.find((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  if (!activeStep) return false;

  // 3-1. 결재선에 지정된 본인 이름 직접 일치
  if (activeStep.name && (activeStep.name === userName || activeStep.name.includes(userName) || userName.includes(activeStep.name))) {
    return true;
  }

  // 3-2. 이명재 이사 (삼랑진공장 총괄): 삼랑진공장 4M 변동점 문서이거나, 삼랑진공장 서류의 이사/검토 단계
  const isDirector = userName === "이명재" || userTitle.includes("이사");
  if (isDirector) {
    const isSamrangjin = doc.plant === "삼랑진공장" || !doc.plant;
    const is4M = isFourMApprovalDoc(doc);
    const isDirectorStep = activeStep.role === "이사" || activeStep.role === "검토";
    if (isSamrangjin && (is4M || isDirectorStep)) {
      return true;
    }
  }

  // 3-3. 공정 책임자 (activeStep.role === "책임")
  if (activeStep.role === "책임") {
    const userPlant = currentProfile?.plant || "";
    const docPlant = doc.plant || "";
    if (docPlant && userPlant && docPlant === userPlant) {
      if (
        userTitle === "책임" ||
        userTitle === "선임" ||
        userTitle === "대리" ||
        userTitle === "반장" ||
        userTitle === "대표" ||
        userTitle.includes("관리자")
      ) {
        return true;
      }
    }
  }

  return false;
}

export function isApprovalDocMyDraft(doc, currentProfile, isAdmin) {
  if (!doc) return false;
  const userName = currentProfile?.name || "";
  if (!userName) return false;
  return (
    doc.drafter === userName ||
    (doc.drafter && doc.drafter.includes(userName)) ||
    (isAdmin && (doc.drafter === "권태형" || doc.drafter === "최미영" || doc.drafter === "대표이사"))
  );
}

// ⭐ 특근보고서 여부 판정 (주말/공휴일 공장 취합 및 특근 신청 서류)
export function isOvertimeApprovalDoc(doc) {
  if (!doc) return false;
  if (doc.id && String(doc.id).startsWith("appr_4m_")) return false; // 4M 변동점 결재서류 우선 배제
  if (doc.id && String(doc.id).startsWith("appr_ot_")) return true;
  if (doc.type === "OVERTIME" || doc.docType === "OVERTIME") return true;
  if (doc.category === "특근보고서" || doc.typeName?.includes("특근")) return true;
  if (doc.title && (doc.title.includes("특근") || doc.title.includes("특근보고서"))) return true;
  return false;
}

// ⭐ 4M 변동점 결재서류 여부 판정 (4M 변동점 및 CAPA 승인 품의서 등)
export function isFourMApprovalDoc(doc) {
  if (!doc) return false;
  if (doc.id && doc.id.startsWith("appr_4m_")) return true;
  if (doc.type === "FOUR_M_CHANGE_POINT" || doc.type === "CHANGE_POINT" || doc.docType === "FOUR_M_CHANGE_POINT") return true;
  if (doc.category === "4M변동점" || doc.typeName?.includes("4M") || doc.typeName?.includes("변동점")) return true;
  if (doc.title && (doc.title.includes("4M") || doc.title.includes("변동점"))) return true;
  return false;
}

// ⭐ 일반 결재서류 여부 판정 (특근보고서 및 4M변동점을 제외한 품의서, 기안서, 연차/휴가 신청서 등)
export function isGeneralApprovalDoc(doc) {
  if (!doc) return false;
  return !isOvertimeApprovalDoc(doc) && !isFourMApprovalDoc(doc);
}

// Helper: Read local storage with safe normalization
export function getLocalApprovalDocs() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data || data === "[]" || data === "null" || data === "undefined" || data.trim() === "") {
      return [];
    }

    let parsed = [];
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      parsed = [];
    }

    const deletedIds = getDeletedApprovalIds();
    const docMap = new Map();
    if (Array.isArray(parsed)) {
      parsed.forEach((d) => {
        if (d && d.id && !deletedIds.has(d.id)) {
          try {
            const normalized = normalizeApprovalDoc(d);
            docMap.set(d.id, normalized);
          } catch (normErr) {
            docMap.set(d.id, d);
          }
        }
      });
    }

    const list = Array.from(docMap.values());
    list.sort((a, b) => {
      const tA = getApprovalDocSortTimestamp(a);
      const tB = getApprovalDocSortTimestamp(b);
      return tB - tA;
    });

    return list;
  } catch (e) {
    console.error("Local storage read error for approval documents:", e);
    return [];
  }
}

// Helper: Save local storage
export function saveLocalApprovalDocs(docs) {
  try {
    const cleanDocs = (docs || []).filter((d) => d && d.id);
    const normalized = cleanDocs.map((d) => {
      try {
        return normalizeApprovalDoc(d);
      } catch (e) {
        return d;
      }
    });
    cachedApprovalDocs = normalized; // 🌟 Always keep in-memory cache in sync
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("oryuk_approval_document_updated", { detail: { docs: normalized } }));
      } catch (evtErr) {}
    }
  } catch (e) {
    console.error("Local storage write error for approval documents:", e);
  }
}

// Real-time Cloud Synchronization with Robust Local Merge & Permanent Document Retention
// ⚡ 성능 최적화: 싱글톤 멀티플렉싱(Single-Flight) 리스너 & 인메모리 캐시 공유
let activeApprovalDocsUnsub = null;
const approvalDocsSubscribers = new Set();
let cachedApprovalDocs = null;
let approvalDocsTeardownTimer = null;

export function subscribeApprovalDocs(onUpdate) {
  if (typeof onUpdate !== "function") return () => {};

  // 1. 인메모리 캐시 또는 로컬스토리지 즉시 반환 (UI 지연 0ms)
  const local = (Array.isArray(cachedApprovalDocs) && cachedApprovalDocs.length > 0)
    ? cachedApprovalDocs
    : getLocalApprovalDocs();
  if (Array.isArray(local) && local.length > 0) {
    cachedApprovalDocs = local;
    try { onUpdate(local); } catch (e) { console.error("Initial onUpdate error:", e); }
  }

  approvalDocsSubscribers.add(onUpdate);

  if (approvalDocsTeardownTimer) {
    clearTimeout(approvalDocsTeardownTimer);
    approvalDocsTeardownTimer = null;
  }

  // 2. 단 하나의 공유 Firestore 리스너만 가동 (중복 쿼리 및 대량 localStorage 쓰기 완전 차단)
  if (!activeApprovalDocsUnsub) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      activeApprovalDocsUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteDocs = [];
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              const rawDoc = { id: d.id, ...d.data() };
              try {
                const normalized = normalizeApprovalDoc(rawDoc);
                if (normalized && normalized.id) {
                  remoteDocs.push(normalized);
                }
              } catch (e) {
                if (rawDoc.id) remoteDocs.push(rawDoc);
              }
            });
          }

          // ⭐ MERGE STRATEGY: Remote Firestore snapshot is authoritative.
          // Fallback to local storage ONLY for un-synced offline drafts that don't exist in Firestore yet.
          const deletedIds = getDeletedApprovalIds();
          const localDocs = getLocalApprovalDocs().filter((d) => d && d.id && !deletedIds.has(d.id));
          const docMap = new Map();

          // 1. Remote Firestore documents are the single authoritative source of truth
          remoteDocs.forEach((r) => {
            if (r && r.id && !deletedIds.has(r.id)) {
              docMap.set(r.id, r);
            }
          });

          // 2. Keep local offline documents ONLY if they do not exist in Firestore at all
          localDocs.forEach((localDoc) => {
            if (localDoc && localDoc.id && !deletedIds.has(localDoc.id) && !docMap.has(localDoc.id)) {
              docMap.set(localDoc.id, localDoc);
            }
          });

          const mergedList = Array.from(docMap.values()).map((d) => {
            try {
              return normalizeApprovalDoc(d);
            } catch (e) {
              return d;
            }
          });

          mergedList.sort((a, b) => {
            const tA = getApprovalDocSortTimestamp(a);
            const tB = getApprovalDocSortTimestamp(b);
            return tB - tA;
          });

          cachedApprovalDocs = mergedList;
          saveLocalApprovalDocs(mergedList);
          approvalDocsSubscribers.forEach((cb) => {
            try { cb(mergedList); } catch (e) { console.error("approval subscriber cb error:", e); }
          });
        },
        (error) => {
          console.warn("Firestore approval sync warning:", error);
          const fallback = getLocalApprovalDocs();
          cachedApprovalDocs = fallback;
          approvalDocsSubscribers.forEach((cb) => {
            try { cb(fallback); } catch (e) { console.error("approval subscriber cb error:", e); }
          });
        }
      );
    } catch (e) {
      console.error("subscribeApprovalDocs error:", e);
      const fallback = getLocalApprovalDocs();
      onUpdate(fallback);
    }
  }

  // 3. 디바운스된 해제 (탭 전환 시 불필요한 재연결 방지)
  return () => {
    approvalDocsSubscribers.delete(onUpdate);
    if (approvalDocsSubscribers.size === 0) {
      approvalDocsTeardownTimer = setTimeout(() => {
        if (approvalDocsSubscribers.size === 0 && activeApprovalDocsUnsub) {
          activeApprovalDocsUnsub();
          activeApprovalDocsUnsub = null;
        }
      }, 5000);
    }
  };
}

// Check Approval Role Permission
export function checkApprovalPermission(docItem, currentProfile, isAdmin) {
  if (!docItem || !docItem.steps) {
    return { canApprove: false, reason: "문서 정보가 없습니다." };
  }

  if (docItem.status === "APPROVED") {
    return { canApprove: false, reason: "최종 승인 완료된 문서입니다." };
  }

  const activeStepIdx = docItem.steps.findIndex((st) => st.status === "PENDING" || st.status === "HOLD");
  if (activeStepIdx === -1) {
    return { canApprove: false, reason: "결재 대기 중인 단계가 없습니다." };
  }

  const activeStep = docItem.steps[activeStepIdx];
  const stepRole = activeStep.role; // 담당, 책임, 이사, 대표
  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";

  // 1. ADMIN Mode -> Top Authority (권태형 대표이사 또는 최미영 전무)
  if (isAdmin) {
    const adminApprover = currentProfile?.name || "권태형";
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: true,
      approverName: adminApprover
    };
  }

  // 1-1. Designated Approver Direct Match (결재선에 명시된 지정자 본인 일치 시 즉시 승인 권한 부여)
  const isDirectTarget = activeStep.name && (activeStep.name === userName || activeStep.name.includes(userName) || userName.includes(activeStep.name));
  if (isDirectTarget) {
    const isCeoOrDirector = userName === "권태형" || userName === "최미영" || userName === "이명재" || userName === "김동욱" || userTitle.includes("대표") || userTitle.includes("전무") || userTitle.includes("이사");
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: isCeoOrDirector,
      approverName: userName
    };
  }

  // ⭐ 4M 변동점 결재서류 전용 결재라인 권한 판정: 이창엽(상신/기안) ➔ 이명재(검토) ➔ 권태형(최종승인)
  if (isFourMApprovalDoc(docItem)) {
    if (activeStepIdx === 0) {
      // 4M 변동점 기안/상신은 현장 및 공장 모든 관리자가 상신할 수 있으며, 결재선에는 공식 담당자인 이창엽 책임으로 상신 기록됨
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: "이창엽"
      };
    }

    if (activeStepIdx === 1) {
      if (userName === "이명재" || userTitle.includes("이사") || userName === "권태형" || userTitle.includes("대표") || isDirectTarget || isAdmin) {
        return {
          canApprove: true,
          stepIndex: activeStepIdx,
          stepRole,
          approverName: (userName === "권태형" || userTitle.includes("대표")) ? "권태형" : "이명재"
        };
      }
      return { canApprove: false, reason: "[검토] 이명재 이사 결재 권한이 필요합니다." };
    }

    if (activeStepIdx === 2) {
      if (userName === "권태형" || userTitle.includes("대표") || isDirectTarget || isAdmin) {
        return {
          canApprove: true,
          stepIndex: activeStepIdx,
          stepRole,
          isRepresentative: true,
          approverName: "권태형"
        };
      }
      return { canApprove: false, reason: "[최종 승인] 권태형 대표이사 결재 권한이 필요합니다." };
    }
  }

  // 2. Step 1: 담당 (All Workers / 전작업자)
  if (stepRole === "담당") {
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      approverName: userName || "담당자"
    };
  }

  // 3. Step 2: 책임 / 검토 (지정된 관리자/책임자 또는 공정 관리 직급)
  if (stepRole === "책임" || stepRole === "검토") {
    const isStepTarget = isDirectTarget;
    const isLeadTitle =
      userTitle === "책임" ||
      userTitle === "총괄" ||
      userTitle === "선임" ||
      userTitle === "대리" ||
      userTitle === "반장" ||
      userTitle === "대표" ||
      userTitle.includes("대표") ||
      userTitle.includes("관리자");

    const userComp = cleanCompanyName(currentProfile?.company || "");
    const docComp = cleanCompanyName(docItem.company || "");
    const isSameCompanyLead = userComp && docComp && userComp === docComp;

    const isPlantLead =
      (docItem.plant === "한림공장" && (userName === "김동욱" || userName === "오상민" || userName === "황수현" || userName === "김동훈" || isLeadTitle)) ||
      (docItem.plant === "삼랑진공장" && (userName === "설유철" || userName === "윤경수" || userName === "이창엽" || userName === "전재율" || userName === "양인나" || userName === "유동길" || userName === "조인주" || userName === "이성기" || isLeadTitle)) ||
      userName === "이명재" || userName === "최미영" || userName === "권태형" || userName === "김동욱"; // 상위 결재자/임원 전결 가능

    if (isStepTarget || isPlantLead || isSameCompanyLead || isLeadTitle || isAdmin) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: userName || activeStep.name
      };
    }
    return {
      canApprove: false,
      reason: `[${activeStep.name || "책임/검토"}] 결재 권한이 필요합니다. (지정 결재자: ${activeStep.name})`
    };
  }

  // 4. Step 3: 이사 (이명재 이사, 최미영 전무 등 임원 결재, 대표이사 권태형 전결 가능)
  if (stepRole === "이사") {
    const isTargetLee = !activeStep.name || activeStep.name.includes("이명재");
    const isTargetChoi = activeStep.name?.includes("최미영");

    if (
      userName === "이명재" ||
      userName === "최미영" ||
      userName === "김동욱" ||
      userName === "권태형" ||
      userTitle === "대표" ||
      userTitle === "대표이사" ||
      userTitle === "이사" ||
      userTitle === "전무" ||
      isAdmin ||
      (isTargetLee && (userName === "이명재" || userTitle === "이사")) ||
      (isTargetChoi && (userName === "최미영" || userTitle === "전무"))
    ) {
      let approver = "이명재";
      if (userName === "최미영" || userTitle === "전무" || currentProfile?.id === "admin_choi") {
        approver = "최미영";
      } else if (userName === "김동욱") {
        approver = "김동욱";
      } else if (userName === "권태형" || userTitle === "대표이사" || userTitle === "대표") {
        approver = "권태형";
      } else if (userName === "이명재" || userTitle === "이사") {
        approver = "이명재";
      } else if (isAdmin) {
        approver = currentProfile?.name === "최미영" ? "최미영" : (currentProfile?.name === "권태형" ? "권태형" : (activeStep.name === "최미영" ? "최미영" : "이명재"));
      }

      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: approver
      };
    }
    return {
      canApprove: false,
      reason: `[임원 결재] 이명재 이사 또는 최미영 전무 결재 권한이 필요합니다. (지정: ${activeStep.name})`
    };
  }

  // 5. Step 4: 대표 / 승인 (권태형 대표이사, 최미영 전무, 지정 결재자)
  if (stepRole === "대표" || stepRole === "승인") {
    const isTargetDirect = activeStep.name && (activeStep.name === userName || activeStep.name.includes(userName) || userName.includes(activeStep.name));
    const priorApprovedBySelf = Array.isArray(docItem.steps) && docItem.steps.slice(0, activeStepIdx).some((st) => st?.status === "APPROVED" && st?.name && (st.name === userName || st.name.includes(userName)));

    // 최고 경영진 권한자 (권태형 대표이사, 최미영 전무, ADMIN)
    if (isAdmin || userName === "권태형" || userName === "최미영" || userTitle === "대표" || userTitle === "대표이사" || userTitle === "전무") {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        isRepresentative: true,
        approverName: userName || "권태형"
      };
    }

    // 본인이 지정된 결재자이고 이전 단계에서 이미 결재한 경우가 아닌 경우
    if (isTargetDirect && !priorApprovedBySelf) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        isRepresentative: true,
        approverName: userName
      };
    }

    return {
      canApprove: false,
      reason: `[대표이사] 최종 승인 권한이 필요합니다. (지정 결재자: ${activeStep.name || "권태형 대표이사"})`
    };
  }

  return { canApprove: false, reason: "결재 권한이 없습니다." };
};

// Save or Create an Approval Document (All Workers can draft)
export const saveApprovalDocument = async (docData, options = {}) => {
  const id = docData.id || `appr_${Date.now()}`;
  
  // Explicitly remove from deleted blacklist so newly saved/drafted docs are never suppressed
  try {
    const deletedIds = getDeletedApprovalIds();
    if (deletedIds.has(id)) {
      deletedIds.delete(id);
      saveDeletedApprovalIds(deletedIds);
    }
  } catch (e) {}

  const current = getLocalApprovalDocs();
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const fullItem = normalizeApprovalDoc({
    ...docData,
    id,
    docNumber: docData.docNumber || `ORYUK-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
    status: docData.status || "IN_PROGRESS",
    currentStep: docData.currentStep || 2,
    createdAt: docData.createdAt || nowStr,
    updatedAt: nowStr,
    rejectReason: docData.rejectReason || "",
    holdReason: docData.holdReason || "",
    steps: docData.steps || getAutoApprovalSteps(
      docData.plant,
      docData.drafter,
      docData.drafterTitle,
      docData.department,
      docData.leadName,
      docData.ceoName,
      docData.directorName,
      docData.type || docData.docType || docData.category
    ),
    isDirectManualDraft: options.isDirectManualDraft ?? docData.isDirectManualDraft ?? true
  });

  const existingIdx = current.findIndex((d) => d.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalApprovalDocs(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), sanitizeForFirestore(fullItem));
  } catch (e) {
    console.warn("Firestore save approval document fallback to local:", e);
  }

  // Telegram alert on new draft submission (ONLY for direct manual draft submission, NEVER on background sync or deletion)
  const shouldSendDraftTelegram =
    existingIdx < 0 &&
    options.isDirectManualDraft === true &&
    !options.suppressTelegram &&
    !docData._suppressTelegram;

  if (shouldSendDraftTelegram) {
    sendApprovalDraftTelegram(fullItem).catch((err) => {
      console.warn("Telegram draft alert error:", err);
    });
  }

  return fullItem;
};

// Approve Step (중간결재 승인 및 대표/ADMIN 최종 전결 승인 지원)
export const approveDocumentStep = async (docId, stepIndex, approverName, comment = "승인", options = {}) => {
  const current = getLocalApprovalDocs();
  let target = current.find((d) => d.id === docId);

  // If target missing locally or incomplete, fetch live from Firestore
  if (!target || !target.steps || target.steps.length === 0) {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, docId));
      if (snap.exists()) {
        target = { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn("Could not fetch remote doc in approveDocumentStep:", e);
    }
  }
  if (!target || !target.steps) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const lastIdx = target.steps.length - 1;
  const isFinalStep = stepIndex >= lastIdx;
  const isBatchAll = Boolean(options.isBatchCompleteAll);

  let updatedSteps;
  if (isBatchAll) {
    // ADMIN 일괄 결재 버튼 전용 (전체 미결 단계 일괄 승인 완료)
    const ceoTitle = approverName === "최미영" ? "전무" : approverName === "김동욱" ? "책임" : "대표이사";
    const ceoComment = comment || "대표 전결 일괄 최종 승인";

    updatedSteps = target.steps.map((st, idx) => {
      if (st && st.status === "APPROVED" && st.date) {
        return st;
      }
      return {
        ...st,
        name: idx === lastIdx ? (approverName || "권태형") : (st.name || approverName),
        title: idx === lastIdx ? ceoTitle : (st.title || "검토"),
        status: "APPROVED",
        date: st.date || nowStr,
        comment: st.comment || (idx === 0 ? "기안 상신" : (idx === lastIdx ? ceoComment : "승인"))
      };
    });
  } else {
    // ⭐ 정석 단계별 순차 승인 (담당 ➔ 책임 ➔ 이사 ➔ 대표)
    // 현재 단계(stepIndex)만 APPROVED 처리하고, 다음 단계(stepIndex + 1)를 PENDING으로 활성화합니다.
    updatedSteps = target.steps.map((st, idx) => {
      if (idx === stepIndex) {
        let finalTitle = st.title;
        if (approverName === "최미영") finalTitle = "전무";
        else if (approverName === "이명재") finalTitle = "이사";
        else if (approverName === "김동욱") finalTitle = "책임";
        else if (approverName === "권태형") finalTitle = "대표이사";
        else if (approverName === "설유철" || approverName === "윤경수" || approverName === "이창엽" || approverName === "전재율") finalTitle = "책임";

        return {
          ...st,
          name: approverName || st.name,
          title: finalTitle || st.title,
          status: "APPROVED",
          date: nowStr,
          comment: comment || (idx === 0 ? "기안 상신" : (idx === lastIdx ? "대표이사 최종 승인" : "승인"))
        };
      }
      if (idx === stepIndex + 1 && (st.status === "WAITING" || st.status === "HOLD")) {
        return { ...st, status: "PENDING" };
      }
      return st;
    });
  }

  const isAllApproved = updatedSteps.every((st) => st.status === "APPROVED");
  const nextStep = isAllApproved ? updatedSteps.length : Math.min(stepIndex + 2, updatedSteps.length);

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    currentStep: nextStep,
    status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
    holdReason: "",
    rejectReason: ""
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // ⭐ Bidirectional Overtime Sync: If this is an Overtime report, immediately sync status to overtime_reports
  if (isOvertimeApprovalDoc(updatedTarget)) {
    try {
      const overtimeRaw = typeof window !== "undefined" ? localStorage.getItem("official_overtime_reports_store_v7_company_reports") : null;
      if (overtimeRaw) {
        const overtimeList = JSON.parse(overtimeRaw);
        if (Array.isArray(overtimeList)) {
          const plantName = updatedTarget.plant;
          const workDate = updatedTarget.workDate;
          const dateClean = workDate ? workDate.replace(/-/g, "") : "";

          let modified = false;
          const updatedOvertimeList = overtimeList.map((rep) => {
            const isSam = rep.plant === "삼랑진공장" || rep.company === "(주)오륙" || rep.company === "유성" || rep.plant?.includes("삼랑진");
            const repPlant = isSam ? "삼랑진공장" : "한림공장";
            const matchesPlant = repPlant === plantName || rep.plant === plantName || (updatedTarget.id && updatedTarget.id.includes(isSam ? "samrangjin" : "hanlim"));
            const matchesDate = rep.workDate === workDate || (dateClean && rep.workDate && rep.workDate.replace(/-/g, "") === dateClean);

            if (matchesPlant && matchesDate) {
              modified = true;
              return {
                ...rep,
                approvalStatus: isAllApproved ? "결재완료" : "결재진행중",
                status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
                approval: updatedSteps,
                approvedAt: nowStr,
                approverName: approverName,
                updatedAt: new Date().toISOString()
              };
            }
            return rep;
          });

          if (modified) {
            localStorage.setItem("official_overtime_reports_store_v7_company_reports", JSON.stringify(updatedOvertimeList));
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("oryuk_overtime_reports_updated", { detail: { plant: plantName, workDate } }));
            }
            // Background sync matching documents to Firestore overtime_reports
            updatedOvertimeList.filter(r => r.workDate === workDate).forEach(async (r) => {
              if (r.id) {
                try {
                  await setDoc(doc(db, "overtime_reports", r.id), sanitizeForFirestore(r), { merge: true });
                } catch (e) {}
              }
            });
          }
        }
      }
    } catch (otSyncErr) {
      console.warn("Could not sync overtime reports in approveDocumentStep:", otSyncErr);
    }
  }

  // ⭐ Bidirectional 4M Change Point Sync: If this is a 4M Change Point document, immediately sync status to four_m_change_points
  if (isFourMApprovalDoc(updatedTarget)) {
    try {
      const fourMRaw = typeof window !== "undefined" ? localStorage.getItem("oryuk_four_m_change_points_v2") : null;
      if (fourMRaw) {
        const fourMList = JSON.parse(fourMRaw);
        if (Array.isArray(fourMList)) {
          let modified = false;
          const updated4MList = fourMList.map((item) => {
            const matchesId =
              item.approvalDocId === updatedTarget.id ||
              (item.id && updatedTarget.id && updatedTarget.id.includes(item.id)) ||
              (item.id && updatedTarget.id && updatedTarget.id.includes(String(item.id).replace(/^ledger_/, ""))) ||
              (item.originalId && updatedTarget.id && updatedTarget.id.includes(item.originalId));

            if (matchesId) {
              modified = true;
              return {
                ...item,
                approvalStatus: isAllApproved ? "APPROVED" : "PENDING_APPROVAL",
                approvedBy: approverName,
                approvedTitle: approverName === "최미영" ? "전무" : approverName === "이명재" ? "이사" : approverName === "김동욱" ? "책임" : "대표이사",
                approvedAt: nowStr,
                approvalComment: comment || (isAllApproved ? "최종 승인 완료" : "검토 승인"),
                isResolved: true,
                status: isAllApproved ? "RESOLVED" : (item.status || "IN_PROGRESS"),
                updatedAt: nowStr
              };
            }
            return item;
          });

          if (modified) {
            localStorage.setItem("oryuk_four_m_change_points_v2", JSON.stringify(updated4MList));
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("oryuk_four_m_updated", { detail: updated4MList }));
            }
            // Background sync matching documents to Firestore four_m_change_points
            updated4MList.forEach(async (it) => {
              const matched =
                it.approvalDocId === updatedTarget.id ||
                (it.id && updatedTarget.id && updatedTarget.id.includes(it.id));
              if (matched && it.id && db) {
                try {
                  await setDoc(doc(db, "four_m_change_points", it.id), sanitizeForFirestore(it), { merge: true });
                } catch (e) {}
              }
            });
          }
        }
      }
    } catch (fourMSyncErr) {
      console.warn("Could not sync 4M change points in approveDocumentStep:", fourMSyncErr);
    }
  }

  // Telegram notification on step approval (오직 최종 승인 완료 시에만 발송)
  if (isAllApproved) {
    sendApprovalStepTelegram(updatedTarget, approverName, comment, true).catch((err) => {
      console.warn("Telegram approval step alert error:", err);
    });
  }

  return saved;
};

// Hold Step (보류 처리)
export const holdDocumentStep = async (docId, stepIndex, holderName, holdReason) => {
  const current = getLocalApprovalDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedSteps = target.steps.map((st, idx) => {
    if (idx === stepIndex) {
      let finalTitle = st.title;
      if (holderName === "최미영") finalTitle = "전무";
      else if (holderName === "이명재") finalTitle = "이사";
      else if (holderName === "권태형") finalTitle = "대표이사";

      return {
        ...st,
        name: holderName || st.name,
        title: finalTitle || st.title,
        status: "HOLD",
        date: nowStr,
        comment: holdReason || "보류"
      };
    }
    return st;
  });

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "HOLD",
    holdReason: holdReason || "검토 필요로 인한 보류"
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on hold
  sendApprovalHoldTelegram(updatedTarget, holderName, holdReason).catch((err) => {
    console.warn("Telegram hold alert error:", err);
  });

  return saved;
};

// Reject Step (반려 처리)
export const rejectDocumentStep = async (docId, stepIndex, rejectorName, rejectReason) => {
  const current = getLocalApprovalDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedSteps = target.steps.map((st, idx) => {
    if (idx === stepIndex) {
      let finalTitle = st.title;
      if (rejectorName === "최미영") finalTitle = "전무";
      else if (rejectorName === "이명재") finalTitle = "이사";
      else if (rejectorName === "권태형") finalTitle = "대표이사";

      return {
        ...st,
        name: rejectorName || st.name,
        title: finalTitle || st.title,
        status: "REJECTED",
        date: nowStr,
        comment: rejectReason || "반려"
      };
    }
    return st;
  });

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "REJECTED",
    rejectReason: rejectReason || "보완 필요 반려"
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on rejection
  sendApprovalRejectTelegram(updatedTarget, rejectorName, rejectReason).catch((err) => {
    console.warn("Telegram reject alert error:", err);
  });

  return saved;
};

// Permanent Delete Document (영구 삭제)
export const deleteApprovalDocument = async (id) => {
  if (!id) return getLocalApprovalDocs();

  // 1. Record in local deleted blacklist
  const deletedIds = getDeletedApprovalIds();
  deletedIds.add(id);
  saveDeletedApprovalIds(deletedIds);

  // 2. Remove from local storage
  const current = getLocalApprovalDocs();
  const updated = current.filter((d) => d.id !== id);
  saveLocalApprovalDocs(updated);

  // 3. Remove from Firestore approval_documents and record in deleted_approval_documents
  try {
    await setDoc(doc(db, DELETED_COLLECTION_NAME, id), {
      id,
      deletedAt: new Date().toISOString(),
      isDeleted: true
    }, { merge: true });
  } catch (e) {}

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore delete approval fallback to local:", e);
  }

  return updated;
};

// ⭐ 공장별 소속 협력사 근태/특근보고서 결재함 자동 취합 및 등록 연동 (Plant-Level Attendance & Overtime Approval Synthesis)
// 삼랑진공장: (주)오륙, 유성 취합 ➔ 결재함 자동 등록
// 한림공장: (주)조영산업, 한울, 부림텍 취합 ➔ 결재함 자동 등록
// 주말 (토~일) 또는 특근 지정: 특근보고서 취합 (Overtime)
export const syncPlantOvertimeToApprovalBox = async ({
  plant = null,
  company = null,
  workDate = null,
  matrix = null,
  reports = null,
  isDeleteAction = false
} = {}) => {
  try {
    // 1. Determine target plants to aggregate
    let targetPlants = [];
    const cleanComp = cleanCompanyName(company);
    if (plant === "삼랑진공장" || cleanComp === "오륙" || cleanComp === "유성") {
      targetPlants = ["삼랑진공장"];
    } else if (plant === "한림공장" || cleanComp === "조영" || cleanComp === "한울" || cleanComp === "부림텍") {
      targetPlants = ["한림공장"];
    } else {
      targetPlants = ["삼랑진공장", "한림공장"];
    }

    // 2. Parse day and workDate
    let yearNum = 2026;
    let monthNum = 10;
    let dayNum = 1;
    let workDateStr = "2026-10-01";
    if (typeof workDate === "number") {
      dayNum = workDate;
      const now = new Date();
      yearNum = now.getFullYear();
      monthNum = now.getMonth() + 1;
      workDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    } else if (typeof workDate === "string" && workDate) {
      const match = workDate.match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
      if (match) {
        yearNum = match[1] ? parseInt(match[1], 10) : 2026;
        monthNum = parseInt(match[2], 10);
        dayNum = parseInt(match[3], 10);
        workDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      }
    }

    const dayOfWeekNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dt = new Date(yearNum, monthNum - 1, dayNum);
    const dayOfWeekIndex = dt.getDay(); // 0 = 일, 6 = 토
    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6 || isWeekendByDate(workDateStr);
    const dayLabel = dayOfWeekNames[dayOfWeekIndex] || (isWeekend ? "토" : "목");

    let allReports = Array.isArray(reports) ? reports : null;
    if (allReports === null) {
      const repMap = new Map();
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) parsed.forEach((r) => r.id && repMap.set(r.id, r));
          }
        } catch (e) {}
      }
      try {
        const snap = await getDocs(collection(db, "overtime_reports"));
        if (!snap.empty) {
          snap.forEach((d) => repMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Could not fetch overtime_reports from Firestore in sync:", e);
      }
      allReports = Array.from(repMap.values());
    }
    if (!allReports) allReports = [];

    let allMatrix = Array.isArray(matrix) ? matrix : null;
    if (allMatrix === null && typeof window !== "undefined") {
      try {
        const ym = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
        const smartData = getLocalSmartOvertimeData(ym);
        allMatrix = smartData?.attendanceMatrix || [];
      } catch (e) {}
    }
    if (!allMatrix) allMatrix = [];

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const deletedIds = getDeletedApprovalIds();
    const syncedDocs = [];

    // Check whether this is genuine weekend overtime or legal holiday
    const isActualOvertime = isWeekend || isWeekendByDate(workDateStr);

    // ⭐ 평일은 작성자 전결로 처리하므로 전자결재함 문서 생성을 하지 않음 (주말/공휴일 특근만 5개사 개별로 상신)
    if (!isActualOvertime) {
      return [];
    }

    const COMP_SLUG_MAP = {
      "오륙": "oryuk",
      "유성": "yuseong",
      "조영": "joyoung",
      "한울": "hanul",
      "부림텍": "burimtech"
    };

    const targetCompanyList = cleanComp && COMP_SLUG_MAP[cleanComp]
      ? [cleanComp]
      : ["오륙", "유성", "조영", "한울", "부림텍"];

    for (const targetComp of targetCompanyList) {
      const compSlug = COMP_SLUG_MAP[targetComp] || "oryuk";
      const targetPlant = (targetComp === "오륙" || targetComp === "유성") ? "삼랑진공장" : "한림공장";

      const compReports = allReports.filter((r) => {
        if (!r || r.isSynthesized) return false;
        const repComp = cleanCompanyName(r.company);
        if (repComp !== targetComp) return false;
        const dateMatch = (
          r.workDate === workDateStr ||
          (r.workDate && r.workDate.endsWith(String(dayNum).padStart(2, "0")) && r.workDate.includes(String(monthNum).padStart(2, "0"))) ||
          (r.title && r.title.includes(`${monthNum}월 ${dayNum}일`))
        );
        return dateMatch;
      });

      const canonicalDocId = `appr_ot_${compSlug}_${workDateStr.replace(/-/g, "")}`;

      if (deletedIds.has(canonicalDocId) || compReports.length === 0) {
        continue;
      }

      const compRep = compReports[0];
      const attendedItems = (compRep.items || []).filter((it) => {
        const isOff = Number(it.hours || 0) === 0 || it.attendanceCode === "-" || it.attendanceCode === "휴무" || it.attendanceCode === "결근" || it.attendanceCode === "연차" || it.attendanceCode === "휴가" || it.startTime === "-";
        return !isOff;
      });

      const workerCount = Number(compRep.attendedWorkers) || (attendedItems.length > 0 ? attendedItems.length : (Number(compRep.totalWorkers) || 0));
      const workerHours = Number(compRep.totalHours) || (attendedItems.reduce((s, it) => s + (Number(it.hours) || 0) * (Number(it.count) || 1), 0)) || (workerCount * 8);
      const workerCost = Number(compRep.cost) || (workerHours * 15000);

      if (workerCount === 0) {
        continue;
      }

      const workerNames = attendedItems.map((it) => it.workerName || it.names).filter(Boolean);
      const localDoc = getLocalApprovalDocs().find((d) => d.id === canonicalDocId);

      let cloudDoc = null;
      try {
        const docSnap = await getDoc(doc(db, COLLECTION_NAME, canonicalDocId));
        if (docSnap.exists()) {
          cloudDoc = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (e) {}

      const existingDoc = cloudDoc || localDoc;

      const isPastOvertime = Boolean(workDateStr && workDateStr <= "2026-10-18");

      const repApproval = (Array.isArray(compRep.approval) && compRep.approval.length === 4)
        ? compRep.approval
        : ((Array.isArray(compRep.steps) && compRep.steps.length === 4) ? compRep.steps : null);

      const isRepPendingCEO = (repApproval && repApproval[3]?.status === "PENDING") || compRep.status === "IN_PROGRESS" || compRep.approvalStatus === "결재진행중";

      const priorSteps = (isRepPendingCEO && repApproval)
        ? repApproval
        : (Array.isArray(cloudDoc?.steps) && cloudDoc.steps.length > 0
          ? cloudDoc.steps
          : (Array.isArray(localDoc?.steps) && localDoc.steps.length > 0 ? localDoc.steps : (repApproval || [])));

      const drafterName = compRep.author?.split(" ")[0] || (targetPlant === "삼랑진공장" ? "조인주" : "오상민");
      const drafterTitle = compRep.authorTitle || "선임";
      const leadName = targetPlant === "한림공장" ? "김동욱" : "윤경수";

      const title = `[특근보고서] ${monthNum}월 ${dayNum}일(${dayLabel}) ${targetComp} 특근보고서`;
      const department = `${targetPlant} (${targetComp})`;
      const content = `■ ${monthNum}월 ${dayNum}일(${dayLabel}) [${targetComp}] 특근보고서\n\n1. 특근 요약\n• 소속: ${targetPlant} - ${targetComp}\n• 특근 투입: ${workerCount}명 (${workerHours} M/H) | 예상 노무비: ₩${workerCost.toLocaleString()}\n\n2. 투입 작업자 명단\n• ${workerNames.join(", ") || "특근 투입 인원"}\n\n3. 주요 작업 내용\n• 현대/기아 납품 물량 대응 및 ${targetComp} 주말/공휴일 특근 가동`;

      const isAlreadyFullyApproved = isPastOvertime || (!isRepPendingCEO && existingDoc?.status === "APPROVED" && Array.isArray(priorSteps) && priorSteps.length === 4 && priorSteps.every((s) => s && s.status === "APPROVED" && s.date));

      const step0 = {
        role: "담당",
        name: priorSteps[0]?.name || drafterName,
        title: priorSteps[0]?.title || drafterTitle,
        status: "APPROVED",
        date: priorSteps[0]?.date || `${workDateStr} 18:00:00`,
        comment: priorSteps[0]?.comment || "특근보고서 개별 상신"
      };

      const isLeadDrafter =
        ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"].includes(drafterName) ||
        drafterTitle === "책임" ||
        drafterName === leadName;
      const isStep1Approved = isAlreadyFullyApproved || isPastOvertime || isLeadDrafter || priorSteps[1]?.status === "APPROVED";
      const isStep1Hold = !isPastOvertime && priorSteps[1]?.status === "HOLD";
      const isStep1Rejected = !isPastOvertime && priorSteps[1]?.status === "REJECTED";
      const step1 = {
        role: "책임",
        name: isLeadDrafter ? drafterName : (priorSteps[1]?.name || leadName),
        title: priorSteps[1]?.title || "책임",
        status: isStep1Approved ? "APPROVED" : (isStep1Hold ? "HOLD" : (isStep1Rejected ? "REJECTED" : "PENDING")),
        date: priorSteps[1]?.date || (isStep1Approved ? `${workDateStr} 18:30:00` : ""),
        comment: priorSteps[1]?.comment || (isStep1Approved ? (isLeadDrafter ? "책임 전결" : "승인") : "")
      };

      const isStep2Approved = isAlreadyFullyApproved || isPastOvertime || priorSteps[2]?.status === "APPROVED";
      const isStep2Hold = !isPastOvertime && priorSteps[2]?.status === "HOLD";
      const isStep2Rejected = !isPastOvertime && priorSteps[2]?.status === "REJECTED";
      const isHanlim = targetPlant === "한림공장";
      const step2 = {
        role: "이사",
        name: priorSteps[2]?.name || (isHanlim ? "이명재/최미영" : "이명재"),
        title: priorSteps[2]?.title || (isHanlim && !isStep2Approved ? "이사/전무" : (priorSteps[2]?.name === "최미영" ? "전무" : "이사")),
        status: isStep2Approved ? "APPROVED" : (isStep2Hold ? "HOLD" : (isStep2Rejected ? "REJECTED" : (isStep1Approved ? "PENDING" : "WAITING"))),
        date: priorSteps[2]?.date || (isStep2Approved ? `${workDateStr} 19:00:00` : ""),
        comment: priorSteps[2]?.comment || (isStep2Approved ? "승인" : "")
      };

      const isStep3Approved = isAlreadyFullyApproved || (!isRepPendingCEO && priorSteps[3]?.status === "APPROVED" && Boolean(priorSteps[3]?.date));
      const isStep3Hold = !isPastOvertime && priorSteps[3]?.status === "HOLD";
      const isStep3Rejected = !isPastOvertime && priorSteps[3]?.status === "REJECTED";
      const step3 = {
        role: "대표",
        name: priorSteps[3]?.name === "최미영" ? "최미영" : "권태형",
        title: priorSteps[3]?.title || (priorSteps[3]?.name === "최미영" ? "전무" : "대표이사"),
        status: isStep3Approved ? "APPROVED" : (isStep3Hold ? "HOLD" : (isStep3Rejected ? "REJECTED" : (isStep2Approved ? "PENDING" : "WAITING"))),
        date: isStep3Approved ? (priorSteps[3]?.date || `${workDateStr} 19:30:00`) : "",
        comment: isStep3Approved ? (priorSteps[3]?.comment || "대표이사 최종 승인") : (priorSteps[3]?.comment || "")
      };

      let steps = [step0, step1, step2, step3];
      const approvedCount = steps.filter((st) => st.status === "APPROVED").length;

      let finalDocStatus = "IN_PROGRESS";
      let finalCurrentStep = 2;
      if (approvedCount === 4) {
        finalDocStatus = "APPROVED";
        finalCurrentStep = 4;
      } else if (steps.some((st) => st.status === "REJECTED")) {
        finalDocStatus = "REJECTED";
        finalCurrentStep = steps.findIndex((st) => st.status === "REJECTED") + 1;
      } else if (steps.some((st) => st.status === "HOLD")) {
        finalDocStatus = "HOLD";
        finalCurrentStep = steps.findIndex((st) => st.status === "HOLD") + 1;
      } else {
        finalDocStatus = "IN_PROGRESS";
        finalCurrentStep = Math.min(approvedCount + 1, 4);
      }

      // 🔒 [결재 무단변경 원천차단] 진행 중인(IN_PROGRESS, HOLD, REJECTED) 결재 서류의 결재선과 진행 상태는 절대 덮어쓰지 않고 영구 보존
      if (existingDoc && Array.isArray(existingDoc.steps) && existingDoc.steps.length === 4) {
        const isExistingActive = existingDoc.status === "IN_PROGRESS" || existingDoc.status === "HOLD" || existingDoc.status === "REJECTED";
        if (isExistingActive && !isPastOvertime) {
          steps = existingDoc.steps;
          finalDocStatus = existingDoc.status;
          finalCurrentStep = existingDoc.currentStep || Math.min(steps.filter((st) => st?.status === "APPROVED").length + 1, 4);
        }
      }

      const approvalDoc = normalizeApprovalDoc({
        id: canonicalDocId,
        docNumber: existingDoc?.docNumber || `ORYUK-${yearNum}-${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}-${compSlug.toUpperCase()}`,
        type: "OVERTIME",
        typeName: "특근보고서",
        title,
        plant: targetPlant,
        company: targetComp,
        department,
        drafter: step0.name,
        drafterTitle: step0.title,
        workDate: workDateStr,
        createdAt: existingDoc?.createdAt || `${workDateStr} 18:00:00`,
        updatedAt: existingDoc?.updatedAt || `${workDateStr} 18:00:00`,
        content,
        amount: `₩${workerCost.toLocaleString()}`,
        status: finalDocStatus,
        currentStep: finalCurrentStep,
        steps,
        rejectReason: existingDoc?.rejectReason || "",
        holdReason: existingDoc?.holdReason || ""
      });

      const saved = await saveApprovalDocument(approvalDoc, { suppressTelegram: true });
      syncedDocs.push(saved);
    }

    return syncedDocs;
  } catch (err) {
    console.error("syncPlantOvertimeToApprovalBox error:", err);
    return [];
  }
};

/**
 * 🌟 Auto-scan and sync all weekend overtime reports in Firestore to the approval box
 */
export const syncAllOvertimeReportsToApprovalBox = async () => {
  try {
    const repMap = new Map();
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) parsed.forEach((r) => r.id && repMap.set(r.id, r));
        }
      } catch (e) {}
    }
    try {
      const snap = await getDocs(collection(db, "overtime_reports"));
      if (!snap.empty) {
        snap.forEach((d) => repMap.set(d.id, { id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Could not fetch overtime_reports from Firestore in syncAll:", e);
    }
    const allReports = Array.from(repMap.values());

    const weekendDates = new Set();
    allReports.forEach((r) => {
      if (r.workDate) {
        const parts = String(r.workDate).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
        const y = parts && parts[1] ? parseInt(parts[1], 10) : 2026;
        const m = parts && parts[2] ? parseInt(parts[2], 10) : 10;
        const d = parts && parts[3] ? parseInt(parts[3], 10) : 1;
        const dt = new Date(y, m - 1, d);
        const dow = dt.getDay();
        const isWk = dow === 0 || dow === 6 || isWeekendByDate(r.workDate);
        if (isWk) {
          weekendDates.add(r.workDate);
        }
      }
    });

    const results = [];
    for (const workDate of Array.from(weekendDates)) {
      const res = await syncPlantOvertimeToApprovalBox({
        workDate,
        reports: allReports
      });
      if (Array.isArray(res)) results.push(...res);
    }
    return results;
  } catch (err) {
    console.error("syncAllOvertimeReportsToApprovalBox error:", err);
    return [];
  }
};


