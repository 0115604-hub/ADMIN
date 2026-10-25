// Smart Overtime & Attendance Service (잔업 스마트 통합관리대장 - 5개사 통합)
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";
import * as XLSX from "xlsx";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData.js";
import { sanitizeForFirestore } from "../utils/firestoreUtils.js";

const STORAGE_KEY = "oryuk_smart_overtime_data_v2_sept";
const FIRESTORE_DOC_ID = "overtime_2026_09";

export const COMPANIES = ["오륙", "유성", "조영", "한울", "부림텍"];

export const getReportDateSortKey = (report) => {
  if (!report) return "0000-00-00";
  const rawDate = report.workDate || "";
  if (rawDate) {
    const match = String(rawDate).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (match) {
      const y = match[1] || "2026";
      const m = String(parseInt(match[2], 10)).padStart(2, "0");
      const d = String(parseInt(match[3], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const raw = String(report.workDateFormatted || report.title || "");
  const match2 = raw.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (match2) {
    const y = match2[1] || "2026";
    const m = String(parseInt(match2[2], 10)).padStart(2, "0");
    const d = String(parseInt(match2[3], 10)).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "2026-10-01";
};

export const cleanCompanyName = (comp) => {
  if (!comp) return "오륙";
  const str = String(comp).trim();
  if (str.includes("오륙")) return "오륙";
  if (str.includes("조영")) return "조영";
  if (str.includes("유성")) return "유성";
  if (str.includes("한울")) return "한울";
  if (str.includes("부림")) return "부림텍";
  return str.replace(/^\(주\)\s*/, "").replace(/주식회사\s*/, "").replace(/산업$/, "").trim();
};

export const DEPARTMENTS = ["생산팀", "압출관리팀", "가공관리팀", "품질관리팀", "설비보전팀", "물류팀", "관리팀"];

export const normalizeDept = (dept) => {
  if (!dept) return "생산팀";
  const str = String(dept).trim();
  if (DEPARTMENTS.includes(str)) return str;
  if (str === "물류팀" || str === "물류" || str.includes("물류") || str.includes("출하") || str.includes("창고") || str.includes("자재")) return "물류팀";
  if (str === "설비보전팀" || str === "설비보전" || str === "설비팀" || str === "보전팀" || str === "공무팀" || str.includes("설비") || str.includes("보전") || str.includes("공무")) return "설비보전팀";
  if (str === "품질관리팀" || str === "품질팀" || str === "품질부" || str.includes("품질")) return "품질관리팀";
  if (str === "생산팀" || str === "생산") return "생산팀";
  if (str === "압출관리팀" || str === "압출동" || (str.includes("압출") && !str.includes("생산"))) return "압출관리팀";
  if (str === "가공관리팀" || str === "가공동" || str.includes("가공") || str.includes("프레스") || str.includes("용접") || str.includes("성형") || str.includes("도장") || str.includes("조인트") || str.includes("사상") || str.includes("코팅")) return "가공관리팀";
  if (str === "관리팀" || str === "관리부" || str.includes("관리") || str.includes("총무") || str.includes("총괄") || str.includes("기술") || str.includes("경영") || str.includes("회계")) return "관리팀";
  if (str.includes("생산")) return "생산팀";
  return "생산팀";
};

export const KOREAN_PUBLIC_HOLIDAYS_2026 = new Set([
  "2026-01-01", // 신정
  "2026-02-16", "2026-02-17", "2026-02-18", // 설날 연휴
  "2026-03-01", "2026-03-02", // 삼일절 및 대체공휴일
  "2026-05-05", // 어린이날
  "2026-05-24", "2026-05-25", // 부처님오신날 및 대체공휴일
  "2026-06-03", // 제9회 전국동시지방선거
  "2026-06-06", // 현충일
  "2026-08-15", "2026-08-17", // 광복절 및 대체공휴일
  "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", // 추석 연휴 및 대체공휴일
  "2026-10-03", "2026-10-05", // 개천절 및 대체공휴일
  "2026-10-09", // 한글날
  "2026-12-25"  // 성탄절
]);

export const KOREAN_HOLIDAY_NAMES_2026 = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 전날",
  "2026-02-17": "설날",
  "2026-02-18": "설날 다음날",
  "2026-03-01": "3·1절",
  "2026-03-02": "3·1절 대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-03": "지방선거",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 전날",
  "2026-09-25": "추석",
  "2026-09-26": "추석 다음날",
  "2026-09-27": "추석 대체공휴일",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절"
};

export const getKoreanHolidayInfo = (dateStrOrDay, year = 2026, month = 10) => {
  let y = Number(year) || 2026;
  let m = Number(month) || 10;
  let d = null;

  if (typeof dateStrOrDay === "number") {
    d = dateStrOrDay;
  } else if (dateStrOrDay) {
    const rawStr = String(dateStrOrDay).trim();
    const p = rawStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (p) {
      y = parseInt(p[1], 10);
      m = parseInt(p[2], 10);
      d = parseInt(p[3], 10);
    } else {
      const mMatch = rawStr.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (mMatch) {
        if (mMatch[1]) y = parseInt(mMatch[1], 10);
        m = parseInt(mMatch[2], 10);
        d = parseInt(mMatch[3], 10);
      }
    }
  }

  if (!d) {
    return {
      isHoliday: false,
      holidayName: "",
      isWeekend: false,
      isOffDay: false,
      dayOfWeek: -1,
      dayOfWeekStr: "",
      fullLabel: "",
      ymd: ""
    };
  }

  const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const holidayName = KOREAN_HOLIDAY_NAMES_2026[ymd] || "";
  const isHoliday = !!holidayName;

  const dt = new Date(y, m - 1, d);
  const dayOfWeek = !isNaN(dt.getTime()) ? dt.getDay() : -1;
  const dayOfWeekNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeekStr = dayOfWeek >= 0 ? dayOfWeekNames[dayOfWeek] : "";
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let fullLabel = `${m}월 ${d}일 (${dayOfWeekStr}요일)`;
  if (isHoliday) {
    fullLabel += ` 🔴 [${holidayName}]`;
  } else if (isWeekend) {
    fullLabel += ` [${dayOfWeekStr === "일" ? "일요특근" : "토요특근"}]`;
  }

  return {
    isHoliday,
    holidayName,
    isWeekend,
    isOffDay: isHoliday || isWeekend,
    dayOfWeek,
    dayOfWeekStr,
    fullLabel,
    ymd
  };
};

export const isWeekendByDate = (dateStrOrDay, year = 2026, month = 10) => {
  if (typeof dateStrOrDay === "number") {
    const d = dateStrOrDay;
    const y = Number(year) || 2026;
    const m = Number(month) || 10;
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    return false;
  }
  if (!dateStrOrDay) return false;
  const rawStr = String(dateStrOrDay).trim();
  const p = rawStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (p) {
    const y = parseInt(p[1], 10);
    const m = parseInt(p[2], 10);
    const d = parseInt(p[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  const mMatch = rawStr.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (mMatch) {
    const y = mMatch[1] ? parseInt(mMatch[1], 10) : (year || 2026);
    const m = parseInt(mMatch[2], 10);
    const d = parseInt(mMatch[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  return false;
};

export const COMPANY_APPROVAL_MANAGERS = {
  "오륙": {
    company: "오륙",
    plant: "삼랑진공장",
    author: "조인주 선임",
    drafter: "조인주",
    drafterRole: "선임",
    lead: "윤경수",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "유성": {
    company: "유성",
    plant: "삼랑진공장",
    author: "이성기 선임",
    drafter: "이성기",
    drafterRole: "선임",
    lead: "설유철",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "조영": {
    company: "조영",
    plant: "한림공장",
    author: "오상민 선임",
    drafter: "오상민",
    drafterRole: "선임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "한울": {
    company: "한울",
    plant: "한림공장",
    author: "황수현 선임",
    drafter: "황수현",
    drafterRole: "선임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "부림텍": {
    company: "부림텍",
    plant: "한림공장",
    author: "김동훈 책임",
    drafter: "김동훈",
    drafterRole: "책임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "전체": {
    company: "5개사 통합",
    plant: "삼랑진/한림공장",
    author: "조인주 / 오상민 선임",
    drafter: "조인주",
    drafterRole: "선임",
    lead: "윤경수 / 김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  // Aliases for legacy compatibility
  "주)오륙": { company: "오륙", plant: "삼랑진공장", author: "조인주 선임", drafter: "조인주", drafterRole: "선임", lead: "윤경수", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)오륙": { company: "오륙", plant: "삼랑진공장", author: "조인주 선임", drafter: "조인주", drafterRole: "선임", lead: "윤경수", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)유성": { company: "유성", plant: "삼랑진공장", author: "이성기 선임", drafter: "이성기", drafterRole: "선임", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)유성": { company: "유성", plant: "삼랑진공장", author: "이성기 선임", drafter: "이성기", drafterRole: "선임", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "유성산업": { company: "유성", plant: "삼랑진공장", author: "이성기 선임", drafter: "이성기", drafterRole: "선임", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)조영": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)조영": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)조영산업": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "조영산업": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)한울": { company: "한울", plant: "한림공장", author: "황수현 선임", drafter: "황수현", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)한울": { company: "한울", plant: "한림공장", author: "황수현 선임", drafter: "황수현", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)부림텍": { company: "부림텍", plant: "한림공장", author: "김동훈 책임", drafter: "김동훈", drafterRole: "책임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)부림텍": { company: "부림텍", plant: "한림공장", author: "김동훈 책임", drafter: "김동훈", drafterRole: "책임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "부림": { company: "부림텍", plant: "한림공장", author: "김동훈 책임", drafter: "김동훈", drafterRole: "책임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" }
};

export const COMPANY_THEMES = {
  "오륙": {
    name: "오륙",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
  },
  "조영": {
    name: "조영",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700",
    text: "text-purple-900 dark:text-purple-100",
    accent: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/30",
    btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20"
  },
  "한울": {
    name: "한울",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-100",
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
  },
  "부림텍": {
    name: "부림텍",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border-amber-200 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-100",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
  },
  "유성": {
    name: "유성",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-300 dark:border-cyan-700",
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/80 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700",
    text: "text-cyan-900 dark:text-cyan-100",
    accent: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/30",
    btn: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20"
  },
  // Aliases
  "주)오륙": { name: "오륙", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", accent: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" },
  "(주)오륙": { name: "오륙", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", accent: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" },
  "주)조영": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "(주)조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "(주)조영": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" }
};

export const ATTENDANCE_OPTIONS = [
  { code: "정시", label: "🟢 출근 (정시, 8H)", shortLabel: "정시", otHours: 0, workHours: 8, bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300" },
  { code: "잔업", label: "⚡ 잔업 (8H + 잔업)", shortLabel: "잔업", otHours: 2, workHours: 10, bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300" },
  { code: "특근", label: "🌙 특근 (주말/휴일, 8H)", shortLabel: "특근", otHours: 8, workHours: 8, bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300" },
  { code: "결근", label: "❌ 결근/휴무 (0H)", shortLabel: "결근/휴무", otHours: 0, workHours: 0, bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300" }
];

export const getOptionMeta = (code) => {
  if (!code) return { code: "", label: "미입력", shortLabel: "미입력", otHours: 0, workHours: 0, bg: "bg-slate-50 text-slate-400 border-slate-200" };
  const strCode = String(code).trim();
  const found = ATTENDANCE_OPTIONS.find((o) => o.code === strCode);
  if (found) return found;
  if (strCode === "정시" || strCode === "17" || strCode === "🟢" || strCode.includes("정시") || strCode === "출근") return ATTENDANCE_OPTIONS[0];
  if (strCode === "야간" || strCode.includes("야간")) {
    return {
      code: "야간",
      label: "🌌 야간 (8H)",
      shortLabel: "야간",
      otHours: 0,
      workHours: 8,
      bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300"
    };
  }
  if (strCode === "연차" || strCode.includes("연차")) {
    return {
      code: "연차",
      label: "🌴 연차 (0H)",
      shortLabel: "연차",
      otHours: 0,
      workHours: 0,
      bg: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300"
    };
  }
  if (strCode.includes("잔업") || strCode === "19" || strCode === "19시" || strCode === "21" || strCode === "21시" || strCode === "22" || strCode === "22시" || strCode === "주야") {
    const { weekdayOt, workHours } = calculateWorkerDailyHours(strCode);
    return {
      code: strCode,
      label: `⚡ 잔업 (+${weekdayOt}H, 총${workHours}H)`,
      shortLabel: weekdayOt > 0 ? `잔업(+${weekdayOt}H)` : "잔업",
      otHours: weekdayOt,
      workHours,
      bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
    };
  }
  if (strCode === "특근" || strCode === "주말특근" || strCode.includes("특근")) return ATTENDANCE_OPTIONS[2];
  if (strCode === "-" || strCode === "휴무" || strCode === "미출근" || strCode.includes("미출근") || strCode === "결근" || strCode.includes("결근") || strCode === "휴가" || strCode === "반차") {
    return ATTENDANCE_OPTIONS[3];
  }
  return { code: strCode, label: strCode, shortLabel: strCode, otHours: 0, workHours: 8, bg: "bg-blue-50 text-blue-800 border-blue-200" };
};

export const cleanWorkerNameOnly = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/\([^)]*\)/g, "")
    .replace(/(선임|책임|이사|대표|대표이사|사원|반장|조장|직장|주임|대리|과장|차장|부장|팀장|실장|상무|전무)/g, "")
    .replace(/[\s\t\r\n]+/g, "")
    .trim();
};

export const calculateWorkerDailyHours = (code) => {
  if (!code) return { isAttended: false, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 0 };
  const strCode = String(code).trim();
  if (
    strCode === "-" ||
    strCode === "휴무" ||
    strCode === "미출근" ||
    strCode.includes("미출근") ||
    strCode === "결근" ||
    strCode.includes("결근") ||
    strCode === "병결" ||
    strCode.includes("병결") ||
    strCode === "사결" ||
    strCode.includes("사결") ||
    strCode === "공결" ||
    strCode.includes("공결") ||
    strCode === "병가" ||
    strCode.includes("병가") ||
    strCode === "휴가" ||
    strCode.includes("휴가") ||
    strCode === "연차" ||
    strCode.includes("연차") ||
    strCode === "" ||
    strCode === "미입력" ||
    strCode === "undefined" ||
    strCode === "null"
  ) {
    return { isAttended: false, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 0 };
  }
  if (strCode === "반차" || strCode.includes("반차")) {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 4 };
  }
  if (strCode === "🟢" || strCode === "정시" || strCode === "17" || strCode.includes("정시") || strCode.includes("🟢") || strCode === "출근") {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 8 };
  }
  // Custom overtime direct hours: e.g. 잔업(+3H), 잔업(3), 잔업3, 잔업+2, etc.
  const customOtMatch = strCode.match(/잔업\s*\(?\+?(\d+(?:\.\d+)?)\s*H?\)?/i);
  if (customOtMatch) {
    const otH = parseFloat(customOtMatch[1]) || 2;
    return { isAttended: true, weekdayOt: otH, weekendOt: 0, nightDay: 0, workHours: 8 + otH };
  }
  if (strCode === "19" || strCode === "19시" || strCode.includes("19")) {
    return { isAttended: true, weekdayOt: 2, weekendOt: 0, nightDay: 0, workHours: 10 };
  }
  if (strCode === "21" || strCode === "21시" || strCode.includes("21")) {
    return { isAttended: true, weekdayOt: 4, weekendOt: 0, nightDay: 0, workHours: 12 };
  }
  if (strCode === "22" || strCode === "22시" || strCode.includes("22")) {
    return { isAttended: true, weekdayOt: 5, weekendOt: 0, nightDay: 0, workHours: 13 };
  }
  if (strCode === "특근" || strCode === "주말특근" || strCode.includes("특근")) {
    const customSpMatch = strCode.match(/특근\s*\(?\+?(\d+(?:\.\d+)?)\s*H?\)?/i);
    const spH = customSpMatch ? (parseFloat(customSpMatch[1]) || 8) : 8;
    return { isAttended: true, weekdayOt: 0, weekendOt: spH, nightDay: 0, workHours: spH };
  }
  if (strCode === "야간" || strCode.includes("야간")) {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 1, workHours: 8 };
  }
  if (strCode === "주야" || strCode.includes("주야")) {
    return { isAttended: true, weekdayOt: 4, weekendOt: 0, nightDay: 1, workHours: 12 };
  }
  if (strCode === "잔업") {
    return { isAttended: true, weekdayOt: 2, weekendOt: 0, nightDay: 0, workHours: 10 };
  }
  return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 8 };
};

export const calculateWorkerMonthlyTotals = (workerRecord, daysCount = 30) => {
  let workDays = 0;
  let weekdayOtHours = 0;
  let weekendOtHours = 0;
  let nightDays = 0;
  let totalHours = 0;

  if (!workerRecord || !workerRecord.daily) {
    return { workDays: 0, weekdayOtHours: 0, weekendOtHours: 0, nightDays: 0, totalHours: 0 };
  }

  const maxDay = typeof daysCount === "number" ? daysCount : 30;
  for (let d = 1; d <= maxDay; d++) {
    const val = workerRecord.daily[d] !== undefined ? workerRecord.daily[d] : workerRecord.daily[String(d)];
    const { isAttended, weekdayOt, weekendOt, nightDay, workHours } = calculateWorkerDailyHours(val);
    if (isAttended) workDays++;
    weekdayOtHours += weekdayOt;
    weekendOtHours += weekendOt;
    nightDays += nightDay;
    totalHours += workHours;
  }

  return {
    workDays,
    weekdayOtHours,
    weekendOtHours,
    nightDays,
    totalHours
  };
};

export const calculateDailySummary = (attendanceList, dayNum = 8, year = 2026, month = 10) => {
  if (!Array.isArray(attendanceList)) {
    return {
      totalWorkers: 0,
      totalAttended: 0,
      regularCount: 0,
      ot19Count: 0,
      ot21Count: 0,
      ot22Count: 0,
      specialNightCount: 0,
      dayOtHours: 0,
      dayTotalHours: 0,
      companyBreakdown: {}
    };
  }

  const isWeekend = isWeekendByDate(dayNum, year, month);
  const companyBreakdown = {};
  COMPANIES.forEach((comp) => {
    companyBreakdown[comp] = {
      company: comp,
      total: 0,
      attended: 0,
      regular: 0,
      ot19: 0,
      ot21: 0,
      ot22: 0,
      specialNight: 0,
      absent: 0,
      leave: 0,
      otWorkers: 0,
      otHours: 0,
      totalHours: 0
    };
  });

  let totalAttended = 0;
  let regularCount = 0;
  let ot19Count = 0;
  let ot21Count = 0;
  let ot22Count = 0;
  let specialNightCount = 0;
  let dayOtHours = 0;
  let dayTotalHours = 0;

  attendanceList.forEach((worker) => {
    const comp = cleanCompanyName(worker.company);
    if (!companyBreakdown[comp]) {
      companyBreakdown[comp] = {
        company: comp,
        total: 0,
        attended: 0,
        regular: 0,
        ot19: 0,
        ot21: 0,
        ot22: 0,
        specialNight: 0,
        absent: 0,
        leave: 0,
        otWorkers: 0,
        otHours: 0,
        totalHours: 0
      };
    }
    companyBreakdown[comp].total++;

    const val = (worker.daily && (worker.daily[dayNum] !== undefined ? worker.daily[dayNum] : worker.daily[String(dayNum)])) ?? worker[dayNum] ?? worker[String(dayNum)] ?? "";
    const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    const ot = weekdayOt + weekendOt;

    if (isAttended) {
      totalAttended++;
      companyBreakdown[comp].attended++;
    }

    const str = String(val).trim();
    if (str === "🟢" || str === "정시" || str === "17" || str === "출근" || str.includes("정시") || str.includes("🟢")) {
      regularCount++;
      companyBreakdown[comp].regular++;
    } else if (str === "19" || str === "19시" || str.includes("19")) {
      ot19Count++;
      companyBreakdown[comp].ot19++;
    } else if (str === "21" || str === "21시" || str.includes("21")) {
      ot21Count++;
      companyBreakdown[comp].ot21++;
    } else if (str === "22" || str === "22시" || str.includes("22")) {
      ot22Count++;
      companyBreakdown[comp].ot22++;
    } else if (str === "특근" || str === "주말특근" || str.includes("특근") || str === "야간" || str.includes("야간") || str === "주야" || str.includes("주야")) {
      specialNightCount++;
      companyBreakdown[comp].specialNight++;
    } else if (
      str === "결근" ||
      str === "무단결근" ||
      str === "병결" ||
      str.includes("병결") ||
      str === "사결" ||
      str.includes("사결") ||
      str === "공결" ||
      str.includes("공결") ||
      str.includes("결근")
    ) {
      // 주말 및 법정 휴무일은 전원 필수 출근일이 아니므로 결근으로 집계하지 않음
      if (!isWeekend) {
        companyBreakdown[comp].absent = (companyBreakdown[comp].absent || 0) + 1;
      }
    } else if (
      str === "연차" ||
      str === "반차" ||
      str === "휴가" ||
      str === "병가" ||
      str.includes("휴가") ||
      str.includes("연차") ||
      str.includes("병가")
    ) {
      companyBreakdown[comp].leave = (companyBreakdown[comp].leave || 0) + 1;
    }

    if (ot > 0) {
      companyBreakdown[comp].otWorkers = (companyBreakdown[comp].otWorkers || 0) + 1;
    }

    dayOtHours += ot;
    dayTotalHours += workHours;
    companyBreakdown[comp].otHours += ot;
    companyBreakdown[comp].totalHours += workHours;
  });

  return {
    totalWorkers: attendanceList.length,
    totalAttended,
    regularCount,
    ot19Count,
    ot21Count,
    ot22Count,
    specialNightCount,
    dayOtHours,
    dayTotalHours,
    companyBreakdown
  };
};

export const calculateCompanySummary = (attendanceList) => {
  if (!Array.isArray(attendanceList)) return [];

  const map = {};
  COMPANIES.forEach((comp) => {
    map[comp] = {
      company: comp,
      workerCount: 0,
      totalWorkDays: 0,
      weekdayOtHours: 0,
      weekendOtHours: 0,
      nightDays: 0,
      totalHours: 0
    };
  });

  let grandTotalHours = 0;

  attendanceList.forEach((worker) => {
    const comp = cleanCompanyName(worker.company);
    if (!map[comp]) {
      map[comp] = {
        company: comp,
        workerCount: 0,
        totalWorkDays: 0,
        weekdayOtHours: 0,
        weekendOtHours: 0,
        nightDays: 0,
        totalHours: 0
      };
    }

    const totals = calculateWorkerMonthlyTotals(worker);
    map[comp].workerCount++;
    map[comp].totalWorkDays += totals.workDays;
    map[comp].weekdayOtHours += totals.weekdayOtHours;
    map[comp].weekendOtHours += totals.weekendOtHours;
    map[comp].nightDays += totals.nightDays;
    map[comp].totalHours += totals.totalHours;

    grandTotalHours += totals.totalHours;
  });

  const list = COMPANIES.map((comp) => {
    const item = map[comp] || { company: comp, workerCount: 0, totalWorkDays: 0, weekdayOtHours: 0, weekendOtHours: 0, nightDays: 0, totalHours: 0 };
    const ratio = grandTotalHours > 0 ? (item.totalHours / grandTotalHours) * 100 : 0;
    return {
      ...item,
      ratio: Number(ratio.toFixed(2))
    };
  });

  return list;
};

export const calculateDeptSummary = (attendanceList, dayNum = 8) => {
  if (!Array.isArray(attendanceList)) return [];
  const map = {};

  attendanceList.forEach((worker) => {
    const normDept = normalizeDept(worker.dept);
    const key = `${worker.company}__${normDept}`;
    if (!map[key]) {
      map[key] = {
        company: worker.company,
        dept: normDept,
        workerCount: 0,
        attendedCount: 0,
        regularCount: 0,
        otCount: 0,
        otHours: 0,
        totalHours: 0
      };
    }

    map[key].workerCount++;
    const val = worker.daily ? worker.daily[dayNum] : "";
    const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    const ot = weekdayOt + weekendOt;

    if (isAttended) map[key].attendedCount++;
    if (val === "🟢" || val === "정시" || val === "17") map[key].regularCount++;
    if (ot > 0) map[key].otCount++;
    map[key].otHours += ot;
    map[key].totalHours += workHours;
  });

  return Object.values(map);
};

// Ensure all 5 companies are present even if loading from older cached storage
// ⭐ Build Synchronized Attendance Matrix from Registered Reports (Tab 4 근태/특근관리 기준)
export const buildMatrixFromReports = (masterWorkers, reports, targetYear = null, targetMonth = null) => {
  const workers = Array.isArray(masterWorkers) && masterWorkers.length > 0 
    ? masterWorkers 
    : (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []);

  // 1. Initialize base matrix with clean daily records (prevent unrecorded/future dates from leaking dirty state)
  const matrix = workers.map((w, idx) => {
    return {
      no: idx + 1,
      company: cleanCompanyName(w.company),
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: (w.name || "").trim(),
      position: w.position || "사원",
      daily: { ...(w.daily || {}) }
    };
  });

  if (!Array.isArray(reports) || reports.length === 0) {
    return matrix;
  }

  // Helper to normalize company name
  const matchCompany = (comp1, comp2) => {
    if (!comp1 || !comp2) return false;
    const c1 = cleanCompanyName(comp1);
    const c2 = cleanCompanyName(comp2);
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  // 2. Iterate through reports
  reports.forEach((report) => {
    if (!report) return;
    // Skip synthesized reports (they are composite views of child reports)
    if (report.isSynthesized) return;

    let repDateStr = report.workDate || "";
    if (!repDateStr) {
      const match2 = String(report.workDateFormatted || report.title || "").match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        const y = match2[1] || "2026";
        const m = String(parseInt(match2[2], 10)).padStart(2, "0");
        const d = String(parseInt(match2[3], 10)).padStart(2, "0");
        repDateStr = `${y}-${m}-${d}`;
      }
    }
    const p = String(repDateStr).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!p) return;
    const repYear = parseInt(p[1], 10);
    const repMonth = parseInt(p[2], 10);
    const day = parseInt(p[3], 10);
    if (isNaN(day) || day < 1 || day > 31) return;
    if (targetYear && repYear !== Number(targetYear)) return;
    if (targetMonth && repMonth !== Number(targetMonth)) return;

    const isWeekend = isWeekendByDate(day, repYear, repMonth);

    // Identify target companies for this report
    const rawComp = String(report.company || "").trim();
    const isAllGroup = !rawComp || rawComp === "전체" || rawComp === "5개사 통합" || rawComp === "전사" || rawComp === "통합" || rawComp === "ALL";
    let targetCompanies = [];
    if (!isAllGroup) {
      targetCompanies = [cleanCompanyName(report.company)];
    } else if (report.plant === "삼랑진공장") {
      targetCompanies = ["오륙", "유성"];
    } else if (report.plant === "한림공장") {
      targetCompanies = ["조영", "한울", "부림텍"];
    } else if (Array.isArray(report.companies) && report.companies.length > 0) {
      targetCompanies = report.companies.map(cleanCompanyName);
    } else {
      targetCompanies = COMPANIES.map(cleanCompanyName);
    }

    // Apply items from the report
    let hasAppliedAnyItem = false;
    if (Array.isArray(report.items) && report.items.length > 0) {
      report.items.forEach((it) => {
        if (!it) return;
        // Case A: item has individual workerName or name
        const wName = String(it.workerName || it.name || it.worker || it.empName || it.userName || "").trim();
        if (wName) {
          const cleanItName = cleanWorkerNameOnly(wName);
          const itComp = cleanCompanyName(it.company || it.factory || "");
          const targetW = matrix.find((w) => {
            const cleanW = cleanWorkerNameOnly(w.name);
            const sameName = (w.name || "").trim() === wName || (cleanItName && cleanW === cleanItName);
            if (!sameName) return false;
            const wComp = cleanCompanyName(w.company);
            if (itComp && itComp !== "전체" && itComp !== "5개사 통합") {
              return matchCompany(itComp, wComp);
            }
            return targetCompanies.some(tc => matchCompany(tc, wComp));
          });

          if (targetW) {
            hasAppliedAnyItem = true;
            let rawCode = it.attendanceCode || it.code || it.attendance || it.status || it.category || "";
            const codeStr = String(rawCode || "").trim();
            const contentStr = `${it.workContent || ""} ${it.workDetails || ""} ${it.note || ""}`;
            // 🔒 100% Strict Preservation: Honor the exact attendance code registered by worker/manager
            let code = codeStr;
            if (!code) {
              if (contentStr.includes("결근")) code = "결근";
              else if (contentStr.includes("병결")) code = "병결";
              else if (contentStr.includes("사결")) code = "사결";
              else if (contentStr.includes("공결")) code = "공결";
              else if (contentStr.includes("연차")) code = "연차";
              else if (contentStr.includes("휴가")) code = "휴가";
              else if (contentStr.includes("반차")) code = "반차";
              else if (contentStr.includes("야간")) code = "야간";
              else if (it.hours >= 13 || it.endTime === "22:00") code = "22";
              else if (it.hours >= 12 || it.endTime === "21:00") code = "21";
              else if (it.hours >= 10 || it.endTime === "19:00") code = "19";
              else if (it.hours > 0) code = isWeekend ? "특근" : "🟢";
              else code = isWeekend ? "-" : "결근";
            }

            targetW.daily[day] = code;
            targetW.daily[String(day)] = code;
          }
        }
        // Case B: item has category group with names string
        else if (it.names) {
          const namesList = String(it.names).split(",").map((s) => s.trim()).filter(Boolean);
          namesList.forEach((n) => {
            const cleanN = cleanWorkerNameOnly(n);
            const targetW = matrix.find((w) => {
              const cleanW = cleanWorkerNameOnly(w.name);
              const sameName = (w.name || "").trim() === n || (cleanN && cleanW === cleanN);
              if (!sameName) return false;
              if (it.company) return matchCompany(it.company, w.company);
              return targetCompanies.some(tc => matchCompany(tc, w.company));
            });

            if (targetW) {
              hasAppliedAnyItem = true;
              let rawCode = it.attendanceCode || it.code || it.attendance || it.status || "";
              let code = String(rawCode || "").trim();
              if (!code) {
                if (it.hours >= 13) code = "22";
                else if (it.hours >= 12) code = "21";
                else if (it.hours >= 10) code = "19";
                else code = isWeekend ? "특근" : "🟢";
              }
              targetW.daily[day] = code;
              targetW.daily[String(day)] = code;
            }
          });
        }
      });
    }

    // 🔒 Case C eliminated: Never auto-fill non-participating workers with "🟢"
  });

  return matrix;
};

/**
 * ⭐ [강력한 상호 자동 치유 엔진] 보고서(overtime_reports)와 대장(attendanceMatrix) 간 불일치 실시간 영구 해소
 * - 대장 셀이 미작성(비어있거나 미입력, 또는 출근코드 누락) 상태인데 해당 날짜에 승인/등록된 일일 보고서가 존재할 경우,
 *   보고서의 실제 작업자별 근태 코드(19, 21, 22, 야간, 정시 등)를 대장 매트릭스로 즉시 주입(Hydration).
 * - 반대로 대장에 이미 등록된 수기 수정본은 최우선 보존(Authoritative Preserve).
 */
export const reconcileMatrixWithReports = (baseMatrix, reports, targetYear = null, targetMonth = null) => {
  if (!Array.isArray(baseMatrix) || baseMatrix.length === 0) {
    return { matrix: [], hasHealed: false };
  }
  if (!Array.isArray(reports) || reports.length === 0) {
    return { matrix: baseMatrix, hasHealed: false };
  }

  let hasHealed = false;
  const matchCompany = (comp1, comp2) => {
    if (!comp1 || !comp2) return false;
    const c1 = cleanCompanyName(comp1);
    const c2 = cleanCompanyName(comp2);
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  const matrix = baseMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  reports.forEach((rep) => {
    if (!rep || rep.isSynthesized) return;

    let repDateStr = rep.workDate || "";
    if (!repDateStr) {
      const match2 = String(rep.workDateFormatted || rep.title || "").match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        const y = match2[1] || "2026";
        const m = String(parseInt(match2[2], 10)).padStart(2, "0");
        const d = String(parseInt(match2[3], 10)).padStart(2, "0");
        repDateStr = `${y}-${m}-${d}`;
      }
    }
    const p = String(repDateStr).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!p) return;
    const repYear = parseInt(p[1], 10);
    const repMonth = parseInt(p[2], 10);
    const day = parseInt(p[3], 10);
    if (isNaN(day) || day < 1 || day > 31) return;

    if (targetYear && repYear !== Number(targetYear)) return;
    if (targetMonth && repMonth !== Number(targetMonth)) return;

    const isWeekend = isWeekendByDate(day, repYear, repMonth);

    // Identify target companies for this report
    const rawComp = String(rep.company || "").trim();
    const isAllGroup = !rawComp || rawComp === "전체" || rawComp === "5개사 통합" || rawComp === "전사" || rawComp === "통합" || rawComp === "ALL";
    let targetCompanies = [];
    if (!isAllGroup) {
      targetCompanies = [cleanCompanyName(rep.company)];
    } else if (rep.plant === "삼랑진공장") {
      targetCompanies = ["오륙", "유성"];
    } else if (rep.plant === "한림공장") {
      targetCompanies = ["조영", "한울", "부림텍"];
    } else if (Array.isArray(rep.companies) && rep.companies.length > 0) {
      targetCompanies = rep.companies.map(cleanCompanyName);
    } else {
      targetCompanies = COMPANIES.map(cleanCompanyName);
    }

    if (Array.isArray(rep.items) && rep.items.length > 0) {
      rep.items.forEach((it) => {
        if (!it) return;
        const wName = String(it.workerName || it.name || it.worker || it.empName || it.userName || "").trim();
        if (!wName) return;
        const cleanItName = cleanWorkerNameOnly(wName);
        const itComp = cleanCompanyName(it.company || it.factory || "");

        const targetW = matrix.find((w) => {
          const cleanW = cleanWorkerNameOnly(w.name);
          const sameName = (w.name || "").trim() === wName || (cleanItName && cleanW === cleanItName);
          if (!sameName) return false;
          const wComp = cleanCompanyName(w.company);
          if (itComp && itComp !== "전체" && itComp !== "5개사 통합") {
            return matchCompany(itComp, wComp);
          }
          return targetCompanies.some((tc) => matchCompany(tc, wComp));
        });

        if (targetW) {
          const curVal = targetW.daily ? (targetW.daily[day] !== undefined ? targetW.daily[day] : targetW.daily[String(day)]) : undefined;
          const curStr = String(curVal ?? "").trim();
          const isCurEmpty = !curStr || curStr === "" || curStr === "미입력" || curStr === "undefined" || curStr === "null";

          let rawCode = it.attendanceCode || it.code || it.attendance || it.status || "";
          let code = String(rawCode || "").trim();
          if (!code) {
            const contentStr = `${it.workContent || ""} ${it.workDetails || ""} ${it.note || ""}`;
            if (contentStr.includes("결근")) code = "결근";
            else if (contentStr.includes("병결")) code = "병결";
            else if (contentStr.includes("사결")) code = "사결";
            else if (contentStr.includes("공결")) code = "공결";
            else if (contentStr.includes("연차")) code = "연차";
            else if (contentStr.includes("휴가")) code = "휴가";
            else if (contentStr.includes("반차")) code = "반차";
            else if (contentStr.includes("야간")) code = "야간";
            else if (it.hours >= 13 || it.endTime === "22:00") code = "22";
            else if (it.hours >= 12 || it.endTime === "21:00") code = "21";
            else if (it.hours >= 10 || it.endTime === "19:00") code = "19";
            else if (it.hours > 0) code = isWeekend ? "특근" : "🟢";
            else code = isWeekend ? "-" : "결근";
          }

          // 🔒 Strict Preservation: ONLY hydrate if the matrix cell is truly empty/unwritten.
          // Never overwrite an explicit entry (like '-', '결근', '연차', '반차', '정시', '19', '21', etc.)
          if (isCurEmpty) {
            if (!targetW.daily) targetW.daily = {};
            targetW.daily[day] = code;
            targetW.daily[String(day)] = code;
            hasHealed = true;
          }
        }
      });
    }
  });

  return { matrix, hasHealed };
};

export const ensureAllCompaniesPresent = (data) => {
  if (!data || !Array.isArray(data.attendanceMatrix) || data.attendanceMatrix.length === 0) {
    return INITIAL_SMART_OVERTIME_DATA;
  }

  const matrix = data.attendanceMatrix.map((w) => {
    const rawName = (w.name || "").trim();
    const comp = cleanCompanyName(w.company);
    return {
      ...w,
      company: comp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: rawName,
      position: w.position || "사원",
      daily: { ...(w.daily || {}) }
    };
  });

  const master = matrix.map((w) => ({
    company: w.company,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: w.name,
    position: w.position || "사원",
    employmentType: w.employmentType || "정규직",
    status: w.status || "재직",
    note: w.note || ""
  }));

  const compCounters = {};
  const reindexedMatrix = matrix.map((w) => {
    const comp = cleanCompanyName(w.company);
    compCounters[comp] = (compCounters[comp] || 0) + 1;
    return {
      ...w,
      company: comp,
      companyNo: compCounters[comp],
      no: compCounters[comp]
    };
  });

  const compMasterCounters = {};
  const reindexedMaster = master.map((w) => {
    const comp = cleanCompanyName(w.company);
    compMasterCounters[comp] = (compMasterCounters[comp] || 0) + 1;
    return {
      ...w,
      company: comp,
      companyNo: compMasterCounters[comp],
      no: compMasterCounters[comp]
    };
  });

  return {
    ...data,
    attendanceMatrix: reindexedMatrix,
    masterWorkers: reindexedMaster
  };
};

export const COMPANY_MODULE_SLUGS = {
  "오륙": "oryuk",
  "유성": "yuseong",
  "조영": "joyoung",
  "한울": "hanul",
  "부림텍": "burimtech"
};

export const getCompanySlug = (company) => {
  const clean = cleanCompanyName(company);
  return COMPANY_MODULE_SLUGS[clean] || "oryuk";
};

export const getStorageKeyForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `oryuk_smart_overtime_data_${clean}`;
};

export const getFirestoreDocIdForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `overtime_${clean}`;
};

// 🌟 5개사 완전 독립 스토리지 키 및 Firestore 문서 ID (업체 간 간섭/덮어쓰기 0% 원천 격리)
export const getStorageKeyForCompanyMonth = (company, yearMonth = "2026-10") => {
  const cleanYM = String(yearMonth || "2026-10").replace(/-/g, "_");
  const slug = getCompanySlug(company);
  return `oryuk_smart_overtime_comp_${slug}_${cleanYM}`;
};

export const getFirestoreDocIdForCompanyMonth = (company, yearMonth = "2026-10") => {
  const cleanYM = String(yearMonth || "2026-10").replace(/-/g, "_");
  const slug = getCompanySlug(company);
  return `overtime_${cleanYM}_${slug}`;
};

// 당월(10월 등) 작성중인 빈 월간 근태 대장 템플릿 생성 (143명 마스터 전원 포함, 일자별 데이터는 신규 입력용)
export const createEmptySmartOvertimeData = (year = 2026, month = 10) => {
  const master = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).map((w, idx) => ({
    ...w,
    no: w.no || idx + 1
  }));
  const matrix = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).map((w, idx) => ({
    no: w.no || idx + 1,
    company: w.company,
    dept: w.dept,
    line: w.line,
    name: w.name,
    position: w.position || "사원",
    daily: {}
  }));
  return {
    year: Number(year) || 2026,
    month: Number(month) || 10,
    masterWorkers: master,
    attendanceMatrix: matrix
  };
};

// 업체별 빈 템플릿 생성 (단일 업체 소속 인원만 독립 추출)
export const createEmptyCompanyOvertimeData = (company, year = 2026, month = 10) => {
  const cleanComp = cleanCompanyName(company);
  const initialCompWorkers = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).filter(
    (w) => cleanCompanyName(w.company) === cleanComp
  );
  const master = initialCompWorkers.map((w, idx) => ({
    ...w,
    company: cleanComp,
    companyNo: idx + 1,
    no: idx + 1
  }));
  const matrix = initialCompWorkers.map((w, idx) => ({
    no: idx + 1,
    companyNo: idx + 1,
    company: cleanComp,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: (w.name || "").trim(),
    position: w.position || "사원",
    daily: {}
  }));
  return {
    company: cleanComp,
    year: Number(year) || 2026,
    month: Number(month) || 10,
    masterWorkers: master,
    attendanceMatrix: matrix,
    companyApprovalStatus: {},
    recentAuditLogs: []
  };
};

// 업체별 독립 저장 큐 및 상태 추적기 (5개사 각각 독립 동작)
const companySaveQueues = {
  "오륙": Promise.resolve(),
  "유성": Promise.resolve(),
  "조영": Promise.resolve(),
  "한울": Promise.resolve(),
  "부림텍": Promise.resolve()
};
const inFlightCompanySaves = {
  "오륙": 0,
  "유성": 0,
  "조영": 0,
  "한울": 0,
  "부림텍": 0
};
const lastCompanySaveEpoch = {
  "오륙": 0,
  "유성": 0,
  "조영": 0,
  "한울": 0,
  "부림텍": 0
};

// 🌟 인메모리 단일 진실 캐시 (localStorage 용량 초과(QuotaExceededError) 시에도 데이터 유실/원복 0% 보장)
const memoryCompanyLedgerCache = {};

// 🌟 5개사 개별 인원 추가/삭제 영구 오버라이드 저장소 (초기 마스터 데이터나 구버전 캐시에서 삭제된 인원이 되살아나는 현상 100% 차단)
const ROSTER_OVERRIDES_KEY = "oryuk_company_roster_overrides_v1";
let memoryRosterOverrides = null;

const getRosterOverridesMap = () => {
  if (memoryRosterOverrides && typeof memoryRosterOverrides === "object") {
    return memoryRosterOverrides;
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(ROSTER_OVERRIDES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          memoryRosterOverrides = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {}
  memoryRosterOverrides = {};
  return memoryRosterOverrides;
};

const getCompanyRosterOverrides = (company) => {
  const cleanComp = cleanCompanyName(company);
  const map = getRosterOverridesMap();
  const entry = map[cleanComp] || {};
  return {
    deletedNames: Array.isArray(entry.deletedNames) ? entry.deletedNames : [],
    addedWorkers: Array.isArray(entry.addedWorkers) ? entry.addedWorkers : []
  };
};

const saveCompanyRosterOverrides = (company, { deletedNames, addedWorkers }) => {
  const cleanComp = cleanCompanyName(company);
  const map = getRosterOverridesMap();
  map[cleanComp] = {
    deletedNames: Array.from(new Set((deletedNames || []).map((n) => String(n || "").trim()).filter(Boolean))),
    addedWorkers: Array.isArray(addedWorkers) ? addedWorkers : [],
    updatedAt: new Date().toISOString()
  };
  memoryRosterOverrides = map;
  safeSetLocalStorage(ROSTER_OVERRIDES_KEY, JSON.stringify(map));
};

const applyCompanyRosterOverrides = (company, workersList = [], cloudDeletedNames = [], cloudAddedWorkers = []) => {
  const cleanComp = cleanCompanyName(company);
  const localOv = getCompanyRosterOverrides(cleanComp);
  const deletedSet = new Set([
    ...(localOv.deletedNames || []).map((n) => String(n || "").trim()),
    ...(Array.isArray(cloudDeletedNames) ? cloudDeletedNames : []).map((n) => String(n || "").trim())
  ].filter(Boolean));

  // 1. 삭제된 인원 제외
  const filtered = (workersList || []).filter((w) => {
    if (!w) return false;
    const wName = String(w.name || "").trim();
    if (!wName) return false;
    if (deletedSet.has(wName)) return false;
    return cleanCompanyName(w.company || cleanComp) === cleanComp;
  });

  // 2. 추가된 인원 병합 (이미 목록에 있으면 최신 부서/직위/공정 유지, 없으면 끝에 추가)
  const mergedAdded = [...(Array.isArray(cloudAddedWorkers) ? cloudAddedWorkers : []), ...(localOv.addedWorkers || [])];
  mergedAdded.forEach((addedW) => {
    if (!addedW || !addedW.name) return;
    const aName = String(addedW.name).trim();
    if (!aName || deletedSet.has(aName)) return;
    const existingIdx = filtered.findIndex((w) => String(w.name || "").trim() === aName);
    if (existingIdx === -1) {
      filtered.push({
        company: cleanComp,
        dept: normalizeDept(addedW.dept || "생산팀"),
        line: addedW.line || normalizeDept(addedW.dept || "생산팀"),
        name: aName,
        position: addedW.position || "사원",
        daily: { ...(addedW.daily || {}) }
      });
    }
  });

  return filtered.map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));
};

const stripHeavyWorkerFields = (w, cleanComp, idx) => {
  if (!w) return w;
  const copy = { ...w };
  delete copy.personnelCard;
  delete copy.card;
  delete copy.photoUrl;
  return {
    ...copy,
    company: cleanComp,
    companyNo: idx + 1,
    no: idx + 1,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: (w.name || "").trim(),
    position: w.position || "사원",
    daily: { ...(w.daily || {}) }
  };
};

const safeSetLocalStorage = (key, valueStr) => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, valueStr);
    return true;
  } catch (err) {
    // QuotaExceededError 발생 시 구 통합 레거시 키 및 중복 인사카드 키들을 정리하여 용량 확보 후 재시도
    try {
      const legacyKeysToPurge = [
        STORAGE_KEY,
        "oryuk_smart_overtime_data_2026_09",
        "oryuk_smart_overtime_data_2026-09",
        "oryuk_overtime_reports_backup",
        "oryuk_personnel_cards_comp_oryuk",
        "oryuk_personnel_cards_comp_yuseong",
        "oryuk_personnel_cards_comp_joyoung",
        "oryuk_personnel_cards_comp_hanul",
        "oryuk_personnel_cards_comp_burimtech"
      ];
      legacyKeysToPurge.forEach((lk) => {
        try {
          if (lk && lk !== key) window.localStorage.removeItem(lk);
        } catch (e) {}
      });
      window.localStorage.setItem(key, valueStr);
      return true;
    } catch (retryErr) {
      console.warn(`[safeSetLocalStorage] ${key} 로컬 캐시 저장 생략 (인메모리 및 클라우드 정상 유지):`, retryErr?.name || retryErr);
      return false;
    }
  }
};

// 🌟 비동기 디바운스 로컬스토리지 저장 (연속 클릭 시 메인 스레드 JSON.stringify 블로킹 원천 제거)
const pendingLocalStorageTimers = {};
const debouncedSaveCompanyLocal = (compKey, payloadObj, delayMs = 120) => {
  if (typeof window === "undefined") return;
  if (pendingLocalStorageTimers[compKey]) {
    clearTimeout(pendingLocalStorageTimers[compKey]);
  }
  pendingLocalStorageTimers[compKey] = setTimeout(() => {
    delete pendingLocalStorageTimers[compKey];
    try {
      safeSetLocalStorage(compKey, JSON.stringify(payloadObj));
    } catch (e) {}
  }, delayMs);
};

// 🌟 클라우드 스냅샷 수신 완료 여부 및 1회 복구 완료 여부 캐시
const cloudSnapshotHydrated = {};
const healedCloudOnce = {};
const legacyHealParsedCache = {};
const pendingCloudSyncTimers = {};
const pendingCloudSyncMeta = {};

// 단일 업체의 로컬 데이터 로드 (인메모리 캐시 -> 독립 로컬키 -> 초기 마스터 데이터 순, 삭제/추가 오버라이드 항상 적용)
export const getLocalCompanyOvertimeData = (company, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cacheKey = `${cleanComp}_${ym}`;

  // 0. 인메모리 최신 캐시가 존재하면 즉시 반환
  if (memoryCompanyLedgerCache[cacheKey] && Array.isArray(memoryCompanyLedgerCache[cacheKey].attendanceMatrix)) {
    return memoryCompanyLedgerCache[cacheKey];
  }

  const compKey = getStorageKeyForCompanyMonth(cleanComp, ym);
  const parts = ym.split("-").map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 10;

  try {
    // 1. 독립된 업체 전용 스토리지 키 확인
    const rawComp = localStorage.getItem(compKey);
    if (rawComp) {
      const parsed = JSON.parse(rawComp);
      if (parsed && Array.isArray(parsed.attendanceMatrix)) {
        const workers = applyCompanyRosterOverrides(
          cleanComp,
          parsed.attendanceMatrix,
          parsed.deletedWorkerNames,
          parsed.addedWorkers
        );

        // 🌟 혹시 이전 통합 키(`oryuk_smart_overtime_data_YYYY_MM`)에 누락된 일자의 근태나 마감 상태가 남아있다면 월별 1회만 파싱하여 병합 복구
        const legacyKeyForHeal = getStorageKeyForMonth(ym);
        let legacyWorkersMap = null;
        let legacyApprovalsMap = {};
        try {
          if (legacyHealParsedCache[legacyKeyForHeal] === undefined) {
            const rawLegHeal = localStorage.getItem(legacyKeyForHeal);
            legacyHealParsedCache[legacyKeyForHeal] = rawLegHeal ? JSON.parse(rawLegHeal) : null;
          }
          const parsedLegHeal = legacyHealParsedCache[legacyKeyForHeal];
          if (parsedLegHeal) {
            if (Array.isArray(parsedLegHeal.attendanceMatrix)) {
              legacyWorkersMap = new Map();
              parsedLegHeal.attendanceMatrix.forEach((lw) => {
                if (cleanCompanyName(lw?.company) === cleanComp && lw?.name) {
                  legacyWorkersMap.set(String(lw.name).trim(), lw.daily || {});
                }
              });
            }
            if (parsedLegHeal.companyApprovalStatus) {
              Object.entries(parsedLegHeal.companyApprovalStatus).forEach(([k, v]) => {
                if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
                  legacyApprovalsMap[k] = v;
                }
              });
            }
          }
        } catch (e) {}

        const healedWorkers = legacyWorkersMap
          ? workers.map((w) => {
              const legDaily = legacyWorkersMap.get(String(w.name).trim()) || {};
              return {
                ...w,
                daily: { ...legDaily, ...(w.daily || {}) }
              };
            })
          : workers;

        const loaded = {
          company: cleanComp,
          year,
          month,
          masterWorkers: healedWorkers.map((w, idx) => ({
            no: idx + 1,
            companyNo: idx + 1,
            company: cleanComp,
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            name: w.name,
            position: w.position || "사원",
            employmentType: w.employmentType || "정규직",
            status: w.status || "재직",
            note: w.note || ""
          })),
          attendanceMatrix: healedWorkers,
          companyApprovalStatus: { ...legacyApprovalsMap, ...(parsed.companyApprovalStatus || {}) },
          recentAuditLogs: (parsed.recentAuditLogs || []).slice(0, 30),
          updatedAt: parsed.updatedAt || null
        };
        memoryCompanyLedgerCache[cacheKey] = loaded;
        return loaded;
      }
    }

    // 2. 기존 통합 스토리지 키가 있다면 해당 업체 데이터만 추출하여 독립 키로 즉시 마이그레이션 후 구 키 삭제
    const legacyKey = getStorageKeyForMonth(ym);
    const rawLegacy = localStorage.getItem(legacyKey) || ((ym === "2026-09" || ym === "2026_09") ? localStorage.getItem(STORAGE_KEY) : null);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (parsedLegacy && Array.isArray(parsedLegacy.attendanceMatrix)) {
        const normalizedLegacy = ensureAllCompaniesPresent(parsedLegacy);
        const compWorkers = applyCompanyRosterOverrides(
          cleanComp,
          (normalizedLegacy.attendanceMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp)
        );
        const compApprovals = {};
        Object.entries(normalizedLegacy.companyApprovalStatus || {}).forEach(([k, v]) => {
          if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
            compApprovals[k] = v;
          }
        });
        const migrated = {
          company: cleanComp,
          year,
          month,
          masterWorkers: compWorkers.map((w, idx) => ({
            no: idx + 1,
            companyNo: idx + 1,
            company: cleanComp,
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            name: w.name,
            position: w.position || "사원",
            employmentType: w.employmentType || "정규직",
            status: w.status || "재직",
            note: w.note || ""
          })),
          attendanceMatrix: compWorkers,
          companyApprovalStatus: compApprovals,
          recentAuditLogs: (normalizedLegacy.recentAuditLogs || []).filter((l) => cleanCompanyName(l.company) === cleanComp).slice(0, 30),
          updatedAt: normalizedLegacy.updatedAt || new Date().toISOString()
        };
        memoryCompanyLedgerCache[cacheKey] = migrated;
        safeSetLocalStorage(compKey, JSON.stringify(migrated));
        return migrated;
      }
    }

    // 3. 9월 마감 데이터인 경우 마스터 초기 데이터에서 해당 업체만 추출
    if (ym === "2026-09" || ym === "2026_09") {
      const normSept = ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
      const septWorkers = applyCompanyRosterOverrides(
        cleanComp,
        (normSept.attendanceMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp)
      );
      const septData = {
        company: cleanComp,
        year: 2026,
        month: 9,
        masterWorkers: septWorkers,
        attendanceMatrix: septWorkers,
        companyApprovalStatus: {},
        recentAuditLogs: []
      };
      memoryCompanyLedgerCache[cacheKey] = septData;
      return septData;
    }
  } catch (err) {
    console.warn(`[${cleanComp}] 독립 근태 데이터 로드 경고:`, err);
  }

  const emptyFallback = createEmptyCompanyOvertimeData(cleanComp, year, month);
  const overriddenWorkers = applyCompanyRosterOverrides(cleanComp, emptyFallback.attendanceMatrix);
  const finalFallback = {
    ...emptyFallback,
    masterWorkers: overriddenWorkers.map((w, idx) => ({
      no: idx + 1,
      companyNo: idx + 1,
      company: cleanComp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "사원",
      employmentType: "정규직",
      status: "재직",
      note: ""
    })),
    attendanceMatrix: overriddenWorkers
  };
  memoryCompanyLedgerCache[cacheKey] = finalFallback;
  return finalFallback;
};

// 5개 독립 업체 모듈을 읽어 화면 표시용 객체로 조립 (물리적 저장은 5개사 완전 분리)
export const getLocalSmartOvertimeData = (targetYearMonth = null) => {
  try {
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const ym = targetYearMonth || nowKst || "2026-10";
    const parts = ym.split("-").map(Number);
    const year = parts[0] || 2026;
    const month = parts[1] || 10;

    const allMatrix = [];
    const allMaster = [];
    let mergedApprovalStatus = {};
    const allAuditLogs = [];

    COMPANIES.forEach((comp) => {
      const compData = getLocalCompanyOvertimeData(comp, ym);
      (compData.attendanceMatrix || []).forEach((w, idx) => {
        allMatrix.push({
          ...w,
          company: comp,
          companyNo: idx + 1,
          no: idx + 1
        });
      });
      (compData.masterWorkers || []).forEach((w, idx) => {
        allMaster.push({
          ...w,
          company: comp,
          companyNo: idx + 1,
          no: idx + 1
        });
      });
      mergedApprovalStatus = {
        ...mergedApprovalStatus,
        ...(compData.companyApprovalStatus || {})
      };
      if (Array.isArray(compData.recentAuditLogs)) {
        allAuditLogs.push(...compData.recentAuditLogs);
      }
    });

    return {
      year,
      month,
      masterWorkers: allMaster,
      attendanceMatrix: allMatrix,
      companyApprovalStatus: mergedApprovalStatus,
      recentAuditLogs: allAuditLogs.slice(0, 100)
    };
  } catch (err) {
    console.warn("Failed to assemble 5-company smart overtime data:", err);
    return ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
  }
};

// 🌟 5개사 개별 전용: 신규 근로자 등록 함수 (타사 간섭 0%, 인메모리 + 로컬스토리지 + Firestore 즉시 반영)
export const registerCompanyWorker = async (company, workerInfo, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cleanName = String(workerInfo?.name || "").trim();
  if (!cleanName) throw new Error("근로자 성명을 입력해주세요.");

  const dept = normalizeDept(workerInfo?.dept || "생산팀");
  const line = String(workerInfo?.line || dept).trim();
  const position = String(workerInfo?.position || "사원").trim();
  const daily = workerInfo?.daily && typeof workerInfo.daily === "object" ? { ...workerInfo.daily } : {};

  // 1. 업체별 로스터 오버라이드 갱신 (삭제 목록에서 해제 & 추가 목록에 등록)
  const currentOv = getCompanyRosterOverrides(cleanComp);
  const nextDeleted = (currentOv.deletedNames || []).filter((n) => n !== cleanName);
  const nextAdded = (currentOv.addedWorkers || []).filter((w) => String(w?.name || "").trim() !== cleanName);
  nextAdded.push({ company: cleanComp, dept, line, name: cleanName, position });
  saveCompanyRosterOverrides(cleanComp, { deletedNames: nextDeleted, addedWorkers: nextAdded });

  // 2. 해당 업체의 현재 월 데이터 로드 및 인원 추가/갱신
  const existingComp = getLocalCompanyOvertimeData(cleanComp, ym);
  const baseWorkers = [...(existingComp.attendanceMatrix || [])];
  const existingIdx = baseWorkers.findIndex((w) => String(w?.name || "").trim() === cleanName);

  if (existingIdx >= 0) {
    baseWorkers[existingIdx] = {
      ...baseWorkers[existingIdx],
      company: cleanComp,
      dept,
      line,
      name: cleanName,
      position
    };
  } else {
    baseWorkers.push({
      no: baseWorkers.length + 1,
      companyNo: baseWorkers.length + 1,
      company: cleanComp,
      dept,
      line,
      name: cleanName,
      position,
      daily
    });
  }

  const fullLedger = getLocalSmartOvertimeData(ym);
  const otherCompanyWorkers = (fullLedger.attendanceMatrix || []).filter(
    (w) => cleanCompanyName(w.company) !== cleanComp
  );
  const updatedLedger = {
    ...fullLedger,
    attendanceMatrix: [...otherCompanyWorkers, ...baseWorkers]
  };

  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    isWorkerListChange: true,
    auditMeta: {
      operator: workerInfo?.operator || "관리자",
      source: "WORKER_REGISTER",
      reason: `[${cleanComp}] ${cleanName} (${dept}/${position}) 신규 근로자 등록`
    }
  });

  return getLocalSmartOvertimeData(ym);
};

// 🌟 5개사 개별 전용: 근로자 영구 삭제 함수 (타사 간섭 0%, 인메모리 + 로컬스토리지 + Firestore 완전 삭제)
export const removeCompanyWorker = async (company, workerName, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cleanName = String(workerName || "").trim();
  if (!cleanName) throw new Error("삭제할 근로자 성명이 없습니다.");

  // 1. 업체별 로스터 오버라이드에 영구 삭제 등록 (초기 데이터나 구버전 스냅샷에서 부활 방지)
  const currentOv = getCompanyRosterOverrides(cleanComp);
  const nextDeleted = Array.from(new Set([...(currentOv.deletedNames || []), cleanName]));
  const nextAdded = (currentOv.addedWorkers || []).filter(
    (w) => String(w?.name || "").trim() !== cleanName
  );
  saveCompanyRosterOverrides(cleanComp, { deletedNames: nextDeleted, addedWorkers: nextAdded });

  // 2. 인메모리 캐시 및 로컬스토리지의 모든 월(당월/전월 등)에서 해당 업체의 해당 작업자 즉시 제거
  Object.keys(memoryCompanyLedgerCache).forEach((k) => {
    if (k.startsWith(`${cleanComp}_`) && k !== `${cleanComp}_${ym}`) {
      const cached = memoryCompanyLedgerCache[k];
      if (cached && Array.isArray(cached.attendanceMatrix)) {
        const filtered = cached.attendanceMatrix
          .filter((w) => String(w?.name || "").trim() !== cleanName)
          .map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));
        memoryCompanyLedgerCache[k] = {
          ...cached,
          attendanceMatrix: filtered,
          masterWorkers: filtered.map((w, idx) => ({
            no: idx + 1,
            companyNo: idx + 1,
            company: cleanComp,
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            name: w.name,
            position: w.position || "사원",
            employmentType: "정규직",
            status: "재직",
            note: ""
          }))
        };
      }
    }
  });

  // 3. 당월 해당 업체 데이터에서 해당 근로자 제거 후 저장
  const existingComp = getLocalCompanyOvertimeData(cleanComp, ym);
  const remainingCompWorkers = (existingComp.attendanceMatrix || []).filter(
    (w) => String(w?.name || "").trim() !== cleanName
  );

  const fullLedger = getLocalSmartOvertimeData(ym);
  const otherCompanyWorkers = (fullLedger.attendanceMatrix || []).filter(
    (w) => cleanCompanyName(w.company) !== cleanComp
  );
  const updatedLedger = {
    ...fullLedger,
    attendanceMatrix: [...otherCompanyWorkers, ...remainingCompWorkers]
  };

  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    isWorkerListChange: true,
    auditMeta: {
      operator: "관리자",
      source: "WORKER_PERMANENT_DELETE",
      reason: `[${cleanComp}] ${cleanName} 근로자 영구 삭제`
    }
  });

  return getLocalSmartOvertimeData(ym);
};

// 🌟 단일 업체 전용 독립 저장 함수 (오직 해당 업체의 인메모리 캐시, localStorage 키, Firestore 문서만 단독 업데이트)
export const saveSingleCompanyOvertimeModule = async (company, data, ym, options = {}) => {
  const cleanComp = cleanCompanyName(company);
  const cacheKey = `${cleanComp}_${ym}`;
  const compKey = getStorageKeyForCompanyMonth(cleanComp, ym);
  const compDocId = getFirestoreDocIdForCompanyMonth(cleanComp, ym);
  const parts = String(ym || "2026-10").split("-").map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 10;
  const nowIso = new Date().toISOString();

  lastCompanySaveEpoch[cleanComp] = Date.now();

  // 1. 해당 업체 기존 로컬 데이터 로드
  const existingCompLocal = getLocalCompanyOvertimeData(cleanComp, ym);
  const incomingCompWorkers = (data?.attendanceMatrix || [])
    .filter((w) => cleanCompanyName(w.company) === cleanComp)
    .map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));

  const baseCompWorkers = (options.isWorkerListChange || options.fullReplace || incomingCompWorkers.length > 0)
    ? incomingCompWorkers
    : (existingCompLocal.attendanceMatrix || []);

  const overriddenCompWorkers = applyCompanyRosterOverrides(cleanComp, baseCompWorkers);

  const mergedCompWorkers = overriddenCompWorkers.map((w, idx) => {
    const prevW = (existingCompLocal.attendanceMatrix || []).find(
      (pw) => (pw.name || "").trim() === (w.name || "").trim()
    );
    const prevDaily = prevW?.daily || {};
    const nextDaily = w.daily || {};
    const combinedDaily = options.fullReplace
      ? { ...nextDaily }
      : { ...prevDaily, ...nextDaily };

    if (options.clearedDay) {
      delete combinedDaily[options.clearedDay];
      delete combinedDaily[String(options.clearedDay)];
    }
    if (options.targetDay !== undefined && options.targetDay !== null) {
      const tDay = options.targetDay;
      const tVal = nextDaily[tDay] ?? nextDaily[String(tDay)];
      if (!tVal || tVal === "미입력" || tVal === "undefined" || tVal === "null") {
        delete combinedDaily[tDay];
        delete combinedDaily[String(tDay)];
      } else {
        combinedDaily[tDay] = tVal;
        combinedDaily[String(tDay)] = tVal;
      }
    }

    Object.keys(combinedDaily).forEach((d) => {
      const val = combinedDaily[d];
      if (val === "" || val === "미입력" || val === "undefined" || val === "null") {
        delete combinedDaily[d];
        delete combinedDaily[String(d)];
      }
    });

    return {
      ...stripHeavyWorkerFields(w, cleanComp, idx),
      daily: combinedDaily
    };
  });

  const compApprovals = { ...(existingCompLocal.companyApprovalStatus || {}) };
  Object.entries(data?.companyApprovalStatus || {}).forEach(([k, v]) => {
    if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
      compApprovals[k] = v;
    }
  });
  if (options.clearedDay) {
    delete compApprovals[`${cleanComp}_${options.clearedDay}`];
  }

  const currentOv = getCompanyRosterOverrides(cleanComp);

  const nextCompPayload = {
    company: cleanComp,
    year,
    month,
    masterWorkers: mergedCompWorkers.map((w, idx) => ({
      no: idx + 1,
      companyNo: idx + 1,
      company: cleanComp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "사원",
      employmentType: w.employmentType || "정규직",
      status: w.status || "재직",
      note: w.note || ""
    })),
    attendanceMatrix: mergedCompWorkers,
    deletedWorkerNames: currentOv.deletedNames || [],
    addedWorkers: currentOv.addedWorkers || [],
    companyApprovalStatus: compApprovals,
    recentAuditLogs: (existingCompLocal.recentAuditLogs || []).slice(0, 30),
    updatedAt: nowIso
  };

  // 🌟 1순위: 인메모리 캐시 즉시 갱신 (0ms, localStorage 용량과 무관하게 100% 반영 보장)
  memoryCompanyLedgerCache[cacheKey] = nextCompPayload;

  // 🌟 2순위: 독립 로컬 스토리지 비동기 디바운스 저장 (연속 클릭 시 메인 스레드 렉 제거) 및 화면 동기화 이벤트 발송
  debouncedSaveCompanyLocal(compKey, nextCompPayload, 120);
  if (!options.skipEventDispatch && typeof window !== "undefined") {
    const assembledNow = getLocalSmartOvertimeData(ym);
    window.dispatchEvent(new CustomEvent("oryuk_smart_overtime_updated", { detail: { ...assembledNow, yearMonth: ym, updatedCompany: cleanComp } }));
  }

  // 🌟 3순위: 연속 클릭 병합(Coalescing) 클라우드 동기화 — 30~50명 연속 클릭 시 30번 네트워크 왕복하지 않고 최신 상태로 1회만 초고속 일괄 저장
  const prevMeta = pendingCloudSyncMeta[cacheKey] || { clearedDays: new Set(), targetDays: new Set(), fullReplace: false, auditMetas: [] };
  if (options.clearedDay) prevMeta.clearedDays.add(options.clearedDay);
  if (options.targetDay !== undefined && options.targetDay !== null) prevMeta.targetDays.add(options.targetDay);
  if (options.fullReplace) prevMeta.fullReplace = true;
  if (options.auditMeta) prevMeta.auditMetas.push(options.auditMeta);
  pendingCloudSyncMeta[cacheKey] = prevMeta;

  if (pendingCloudSyncTimers[cacheKey]) {
    clearTimeout(pendingCloudSyncTimers[cacheKey]);
  }

  const delayMs = options.immediateCloudSync ? 10 : 250;

  return new Promise((resolve) => {
    pendingCloudSyncTimers[cacheKey] = setTimeout(() => {
      delete pendingCloudSyncTimers[cacheKey];
      const metaSnapshot = pendingCloudSyncMeta[cacheKey] || { clearedDays: new Set(), targetDays: new Set(), fullReplace: false, auditMetas: [] };
      delete pendingCloudSyncMeta[cacheKey];

      inFlightCompanySaves[cleanComp] = (inFlightCompanySaves[cleanComp] || 0) + 1;
      const runCompanyCloudSync = async () => {
        try {
          if (!db) return true;
          lastCompanySaveEpoch[cleanComp] = Date.now();
          const compRef = doc(db, "smart_overtime_ledger", compDocId);
          const latestCompLocal = memoryCompanyLedgerCache[cacheKey] || nextCompPayload;
          let finalCompMatrix = applyCompanyRosterOverrides(
            cleanComp,
            latestCompLocal.attendanceMatrix || []
          );
          let existingAuditLogs = Array.isArray(latestCompLocal.recentAuditLogs) ? latestCompLocal.recentAuditLogs : [];
          let existingApprovalStatus = { ...(latestCompLocal.companyApprovalStatus || {}) };
          const changedAudits = [];

          // 🌟 이미 onSnapshot으로 클라우드 최신 상태가 인메모리에 동기화된 경우, 불필요한 getDoc 네트워크 왕복을 생략하여 저장 속도를 2배 이상 단축
          const needsRemoteRead = !cloudSnapshotHydrated[cacheKey];
          if (needsRemoteRead) {
            try {
              const snap = await getDoc(compRef);
              if (snap.exists()) {
                cloudSnapshotHydrated[cacheKey] = true;
                const cloudComp = snap.data();
                existingAuditLogs = Array.isArray(cloudComp?.recentAuditLogs) ? cloudComp.recentAuditLogs : existingAuditLogs;
                existingApprovalStatus = (cloudComp && typeof cloudComp.companyApprovalStatus === "object" && cloudComp.companyApprovalStatus !== null)
                  ? { ...cloudComp.companyApprovalStatus, ...existingApprovalStatus }
                  : existingApprovalStatus;
                metaSnapshot.clearedDays.forEach((cd) => {
                  delete existingApprovalStatus[`${cleanComp}_${cd}`];
                });

                if (cloudComp && Array.isArray(cloudComp.attendanceMatrix) && cloudComp.attendanceMatrix.length > 0) {
                  finalCompMatrix = finalCompMatrix.map((localW, idx) => {
                    const cloudW = cloudComp.attendanceMatrix.find(
                      (cw) => (cw.name || "").trim() === (localW.name || "").trim()
                    );
                    if (!cloudW) return localW;
                    const cloudDaily = cloudW.daily || {};
                    const localDaily = localW.daily || {};
                    const mergedDaily = metaSnapshot.fullReplace
                      ? { ...localDaily }
                      : { ...cloudDaily, ...localDaily };

                    metaSnapshot.targetDays.forEach((tDay) => {
                      const tVal = localDaily[tDay] ?? localDaily[String(tDay)];
                      if (!tVal || tVal === "미입력" || tVal === "undefined" || tVal === "null") {
                        delete mergedDaily[tDay];
                        delete mergedDaily[String(tDay)];
                      } else {
                        mergedDaily[tDay] = tVal;
                        mergedDaily[String(tDay)] = tVal;
                      }
                    });
                    metaSnapshot.clearedDays.forEach((cd) => {
                      delete mergedDaily[cd];
                      delete mergedDaily[String(cd)];
                    });

                    Object.keys(mergedDaily).forEach((d) => {
                      const val = mergedDaily[d];
                      if (val === "" || val === "미입력" || val === "undefined" || val === "null") {
                        delete mergedDaily[d];
                        delete mergedDaily[String(d)];
                      }
                    });

                    return {
                      ...stripHeavyWorkerFields(cloudW, cleanComp, idx),
                      ...stripHeavyWorkerFields(localW, cleanComp, idx),
                      daily: mergedDaily
                    };
                  });
                }
              }
            } catch (readErr) {
              console.warn(`[${cleanComp}] Firestore 개별 문서 조회 경고:`, readErr);
            }
          }

          const lastAuditMeta = metaSnapshot.auditMetas[metaSnapshot.auditMetas.length - 1];
          if (lastAuditMeta && lastAuditMeta.reason) {
            changedAudits.push({
              worker: "-",
              company: cleanComp,
              day: Array.from(metaSnapshot.targetDays)[0] || 0,
              before: "-",
              after: "-",
              operator: lastAuditMeta.operator || "현장관리자",
              source: lastAuditMeta.source || "USER_DIRECT_ACTION",
              reason: lastAuditMeta.reason,
              timestamp: new Date().toISOString()
            });
          }

          const updatedAuditLogs = [...changedAudits, ...existingAuditLogs].slice(0, 30);
          const mergedApprovalStatus = {
            ...existingApprovalStatus,
            ...(latestCompLocal.companyApprovalStatus || {})
          };
          metaSnapshot.clearedDays.forEach((cd) => {
            delete mergedApprovalStatus[`${cleanComp}_${cd}`];
          });
          const finalUpdatedAt = new Date().toISOString();
          const latestOv = getCompanyRosterOverrides(cleanComp);

          const cloudPayload = {
            company: cleanComp,
            year,
            month,
            masterWorkers: finalCompMatrix.map((w, idx) => ({
              no: idx + 1,
              companyNo: idx + 1,
              company: cleanComp,
              dept: normalizeDept(w.dept),
              line: w.line || normalizeDept(w.dept),
              name: w.name,
              position: w.position || "사원",
              employmentType: w.employmentType || "정규직",
              status: w.status || "재직",
              note: w.note || ""
            })),
            attendanceMatrix: finalCompMatrix,
            deletedWorkerNames: latestOv.deletedNames || [],
            addedWorkers: latestOv.addedWorkers || [],
            companyApprovalStatus: mergedApprovalStatus,
            recentAuditLogs: updatedAuditLogs,
            updatedAt: finalUpdatedAt
          };

          lastCompanySaveEpoch[cleanComp] = Date.now();
          memoryCompanyLedgerCache[cacheKey] = cloudPayload;
          debouncedSaveCompanyLocal(compKey, cloudPayload, 200);

          await setDoc(compRef, sanitizeForFirestore(cloudPayload));
          cloudSnapshotHydrated[cacheKey] = true;
          lastCompanySaveEpoch[cleanComp] = Date.now();
          return true;
        } catch (err) {
          console.error(`[${cleanComp}] 독립 근태 모듈 저장 실패:`, err);
          return false;
        } finally {
          inFlightCompanySaves[cleanComp] = Math.max(0, (inFlightCompanySaves[cleanComp] || 1) - 1);
        }
      };

      companySaveQueues[cleanComp] = (companySaveQueues[cleanComp] || Promise.resolve())
        .then(runCompanyCloudSync, runCompanyCloudSync)
        .then(resolve, () => resolve(false));
    }, delayMs);
  });
};

export const saveSmartOvertimeData = async (data, targetYearMonth = null, options = {}) => {
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || (data?.year && data?.month ? `${data.year}-${String(data.month).padStart(2, "0")}` : (nowKst || "2026-10"));

  const targetComp = options.targetCompany ? cleanCompanyName(options.targetCompany) : null;
  const isSingleCompany = targetComp && COMPANIES.includes(targetComp);

  // 🌟 단일 업체 지정 시 오직 해당 업체의 독립 모듈만 저장 (다른 4개사 데이터는 건드리지 않음)
  if (isSingleCompany) {
    return saveSingleCompanyOvertimeModule(targetComp, data, ym, options);
  }

  // 전체 저장(엑셀 일괄 업로드 등)인 경우에도 5개사 개별 모듈로 각각 독립 분산 저장
  await Promise.all(
    COMPANIES.map((comp) => saveSingleCompanyOvertimeModule(comp, data, ym, options))
  );
  return true;
};

export const saveCompanyDayApprovalStatus = async (currentLedger, ym, company, day, statusData, extraOptions = {}) => {
  const cleanComp = cleanCompanyName(company);
  const approvalKey = `${cleanComp}_${day}`;
  const currentStatusMap = currentLedger?.companyApprovalStatus || {};
  const updatedStatusMap = {
    ...currentStatusMap,
    [approvalKey]: {
      company: cleanComp,
      day: Number(day),
      ...statusData,
      updatedAt: new Date().toISOString()
    }
  };
  const updatedLedger = {
    ...currentLedger,
    companyApprovalStatus: updatedStatusMap
  };
  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    targetDay: day,
    immediateCloudSync: true,
    ...extraOptions,
    auditMeta: {
      operator: statusData.operator || statusData.submittedBy || statusData.approvedBy || "관리자",
      source: "APPROVAL_STATUS_UPDATE",
      reason: `${cleanComp} Day ${day} 결재 상태: ${statusData.status}`
    }
  });
  return getLocalSmartOvertimeData(ym);
};

// 🌟 5개사 독립 문서 실시간 구독 (각 회사가 자기 문서만 독립 수신하므로 타사 저장과 절대 충돌하지 않음)
export const subscribeSmartOvertimeData = (callback, targetYearMonth = null) => {
  try {
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const ym = targetYearMonth || nowKst || "2026-10";

    // 🌟 5개사 스냅샷이 동시에 도착할 때 5번 연속 리렌더링되지 않도록 16ms(1프레임) 단위로 배칭
    let notifyTimer = null;
    const scheduleNotify = () => {
      if (notifyTimer) return;
      notifyTimer = setTimeout(() => {
        notifyTimer = null;
        callback(getLocalSmartOvertimeData(ym));
      }, 16);
    };

    const handleCustom = (e) => {
      if (e && e.detail) {
        if (!e.detail.yearMonth || e.detail.yearMonth === ym) {
          callback(e.detail);
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("oryuk_smart_overtime_updated", handleCustom);
    }

    if (!db) {
      callback(getLocalSmartOvertimeData(ym));
      return () => {
        if (notifyTimer) clearTimeout(notifyTimer);
        if (typeof window !== "undefined") {
          window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
        }
      };
    }

    // 5개 협력사 각각의 독립 Firestore 문서(`overtime_2026_10_oryuk` 등)를 개별로 구독
    const unsubList = COMPANIES.map((comp) => {
      const cacheKey = `${comp}_${ym}`;
      const compKey = getStorageKeyForCompanyMonth(comp, ym);
      const compDocId = getFirestoreDocIdForCompanyMonth(comp, ym);
      const compRef = doc(db, "smart_overtime_ledger", compDocId);

      return onSnapshot(
        compRef,
        (docSnap) => {
          cloudSnapshotHydrated[cacheKey] = true;

          // 해당 업체가 현재 로컬 저장 중이거나 저장 예약/직후(5초 이내)이면 인메모리 최신 상태 유지
          if (
            pendingCloudSyncTimers[cacheKey] ||
            (inFlightCompanySaves[comp] || 0) > 0 ||
            Date.now() - (lastCompanySaveEpoch[comp] || 0) < 5000
          ) {
            scheduleNotify();
            return;
          }

          if (docSnap.exists()) {
            const cloudComp = docSnap.data();
            if (cloudComp && Array.isArray(cloudComp.attendanceMatrix)) {
              const localComp = getLocalCompanyOvertimeData(comp, ym);
              const isLocalNewer = Boolean(
                localComp?.updatedAt &&
                (!cloudComp.updatedAt || String(localComp.updatedAt) > String(cloudComp.updatedAt))
              );

              // 클라우드 문서의 삭제/추가 오버라이드가 있고 클라우드가 더 최신이면 로컬 오버라이드에도 병합
              if (!isLocalNewer && (Array.isArray(cloudComp.deletedWorkerNames) || Array.isArray(cloudComp.addedWorkers))) {
                const localOv = getCompanyRosterOverrides(comp);
                const mergedDel = Array.from(new Set([
                  ...(localOv.deletedNames || []),
                  ...(cloudComp.deletedWorkerNames || [])
                ]));
                const mergedAdd = [...(localOv.addedWorkers || [])];
                (cloudComp.addedWorkers || []).forEach((cw) => {
                  if (!cw || !cw.name) return;
                  const cName = String(cw.name).trim();
                  if (!mergedDel.includes(cName) && !mergedAdd.some((aw) => String(aw?.name || "").trim() === cName)) {
                    mergedAdd.push(cw);
                  }
                });
                saveCompanyRosterOverrides(comp, { deletedNames: mergedDel, addedWorkers: mergedAdd });
              }

              const baseMatrix = isLocalNewer
                ? (localComp.attendanceMatrix || [])
                : (cloudComp.attendanceMatrix || []);

              const overriddenWorkers = applyCompanyRosterOverrides(
                comp,
                baseMatrix,
                cloudComp.deletedWorkerNames,
                cloudComp.addedWorkers
              );

              let localAddedDaysCount = 0;
              const mergedWorkers = overriddenWorkers.map((w, idx) => {
                const cw = (cloudComp.attendanceMatrix || []).find(
                  (item) => (item.name || "").trim() === (w.name || "").trim()
                );
                const lw = (localComp.attendanceMatrix || []).find(
                  (item) => (item.name || "").trim() === (w.name || "").trim()
                );
                const cDaily = cw?.daily || {};
                const lDaily = lw?.daily || {};
                Object.keys(lDaily).forEach((dk) => {
                  const lVal = String(lDaily[dk] || "").trim();
                  if (lVal && lVal !== "-" && lVal !== "미입력" && !cDaily[dk]) {
                    localAddedDaysCount++;
                  }
                });
                // 🌟 항상 로컬과 클라우드의 일자별 근태 데이터를 합집합(Union)으로 병합하여, 어느 한쪽에만 남은 일자 데이터가 유실되지 않도록 보호
                const daily = isLocalNewer
                  ? { ...cDaily, ...lDaily }
                  : { ...lDaily, ...cDaily };
                return {
                  ...stripHeavyWorkerFields(w, comp, idx),
                  daily
                };
              });

              const mergedApprovals = isLocalNewer
                ? { ...(cloudComp.companyApprovalStatus || {}), ...(localComp.companyApprovalStatus || {}) }
                : { ...(localComp.companyApprovalStatus || {}), ...(cloudComp.companyApprovalStatus || {}) };

              const latestOv = getCompanyRosterOverrides(comp);

              const updatedCompData = {
                ...cloudComp,
                company: comp,
                masterWorkers: mergedWorkers.map((w, idx) => ({
                  no: idx + 1,
                  companyNo: idx + 1,
                  company: comp,
                  dept: normalizeDept(w.dept),
                  line: w.line || normalizeDept(w.dept),
                  name: w.name,
                  position: w.position || "사원",
                  employmentType: w.employmentType || "정규직",
                  status: w.status || "재직",
                  note: w.note || ""
                })),
                attendanceMatrix: mergedWorkers,
                deletedWorkerNames: latestOv.deletedNames || [],
                addedWorkers: latestOv.addedWorkers || [],
                companyApprovalStatus: mergedApprovals,
                recentAuditLogs: (cloudComp.recentAuditLogs || []).slice(0, 30),
                updatedAt: isLocalNewer ? localComp.updatedAt : cloudComp.updatedAt
              };

              memoryCompanyLedgerCache[cacheKey] = updatedCompData;
              debouncedSaveCompanyLocal(compKey, updatedCompData, 200);

              // 로컬에만 남아있던 일자 데이터가 발견되어 병합된 경우 세션당 1회만 클라우드에 백업 저장 (무한 스냅샷 루프 방지)
              if (localAddedDaysCount > 0 && !healedCloudOnce[cacheKey]) {
                healedCloudOnce[cacheKey] = true;
                setDoc(compRef, sanitizeForFirestore(updatedCompData)).catch(() => {});
              }

              scheduleNotify();
              return;
            }
          }
          scheduleNotify();
        },
        (err) => {
          console.warn(`[${comp}] 독립 근태 구독 오류:`, err);
          scheduleNotify();
        }
      );
    });

    return () => {
      if (notifyTimer) clearTimeout(notifyTimer);
      unsubList.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
      }
    };
  } catch (err) {
    console.error("Failed to subscribe 5-company smart overtime data:", err);
    callback(getLocalSmartOvertimeData(targetYearMonth));
    return () => {};
  }
};

// Excel Export (6 Sheets)
export const exportSmartOvertimeToExcel = (data) => {
  const currentData = ensureAllCompaniesPresent(data || getLocalSmartOvertimeData());
  const year = currentData.year || 2026;
  const month = currentData.month || 10;
  const daysInMonth = new Date(year, month, 0).getDate();
  const sampleDay = Math.min(8, daysInMonth);
  const wb = XLSX.utils.book_new();

  // Sheet 0: 일자별_근태정리본
  const s0Rows = [
    [`${year}년 ${month}월 일자별 근태 및 잔업 일일 종합 정리본 (5개사 통합)`],
    ["※ [B4] 셀에서 날짜를 선택하면 5개사 전사 일일 실적 요약표 및 전 작업자 상세 근태/잔업 내역이 실시간 자동 정리되어 표시됩니다."],
    ["📅 조회 대상 일자", null, "👥 당일 출근총원", "🟢 정시(0H)", "🟡 19시(+2H)", "🟠 21시(+4H)", "🔴 22시(+5H)", "🌙 특근/야간", "⚡ 당일 잔업합계(H)", null, "⏱ 당일 총투입공수"]
  ];
  const daySummary = calculateDailySummary(currentData.attendanceMatrix, sampleDay);
  s0Rows.push([`${month}월 ${sampleDay}일`, null, daySummary.totalAttended, daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.specialNightCount, daySummary.dayOtHours, null, daySummary.dayTotalHours]);
  s0Rows.push([]);
  s0Rows.push(["🏢 5개사별 당일 근태 및 투입공수 요약"]);
  s0Rows.push(["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "직급", "근태/잔업", "잔업시간(H)", "총근무시간(H)", "비고"]);

  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[sampleDay] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s0Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "사원", val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws0 = XLSX.utils.aoa_to_sheet(s0Rows);
  XLSX.utils.book_append_sheet(wb, ws0, "📋 일자별_근태정리본");

  // Sheet 1: 일일근태_간편입력
  const s1Rows = [
    [`${year}년 ${month}월 일일 근태 및 잔업 스마트 간편 등록 대장 (5개사 통합)`],
    ["💡 [사용안내] ① [A4] 일자 및 [C4] 업체를 선택하세요. ② [F열]에서 [🟢(정시) / 19 / 21 / 22 / 야간 / 특근] 드롭다운을 선택하면 잔업 및 총 근무시간이 실시간 자동 계산됩니다."],
    ["📅 작성 대상 일자", null, "🏢 관리 대상 업체", "🟢 정시근무", "🟡 19시 (+2H)", "🟠 21시 (+4H)", "🔴 22시 (+5H)", "⚡ 당일 잔업합계", "⏱ 당일 총근무공수"],
    [`${month}월 ${sampleDay}일`, null, "전체(5개사)", daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.dayOtHours, daySummary.dayTotalHours],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "⭐ 잔업/근태 선택 (🟢/19/21/22)", "잔업시간 (H)", "총 근무시간 (H)", "비고 (조출/특이사항)"]
  ];
  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[sampleDay] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s1Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "📝 일일근태_간편입력");

  // Sheet 2: 월간_종합_현황판
  const daysHeader = [];
  for (let d = 1; d <= daysInMonth; d++) {
    daysHeader.push(`${month}월 ${d}일`);
  }
  const s2Rows = [
    [`${year}년 ${month}월 5개사 통합 근태 및 잔업 스마트 종합관리대장 (오륙 / 유성 / 조영 / 한울 / 부림텍)`],
    [`※ [A4] 셀에서 일자(${month}월 1일~${month}월 ${daysInMonth}일)를 선택하면 5개사 전체 및 업체별 당일 실적이 실시간 자동 집계됩니다. (🟢=정시, 19=+2H, 21=+4H, 22=+5H)`],
    ["📅 조회 대상 일자", null, "👥 5개사 전사 총원", null, "🟢 정시근무(0H)", null, null, "🟡 19시(+2H)", null, null, "🟠 21시(+4H)", null, null, "🔴 22시(+5H)", null, null, "🌙 야간/특근", null, null, `⚡ ${month}월 평일잔업 누적`, null, null, null, `🎯 ${month}월 주말특근 누적`, null, null, null, `⏱ ${month}월 전사 총 누적 투입공수`],
    [`${month}월 ${sampleDay}일`, null, currentData.attendanceMatrix.length, null, daySummary.regularCount, null, null, daySummary.ot19Count, null, null, daySummary.ot21Count, null, null, daySummary.ot22Count, null, null, daySummary.specialNightCount, null, null, 1680, null, null, null, 440, null, null, null, 25200],
    ["No.", "소속 업체", "소속 부서", "차종/라인", "성명", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`), "출근일수", "평일잔업(H)", "주말특근(H)", "야간(일)", "총공수(H)"],
    [null, null, null, null, null, ...daysHeader]
  ];

  currentData.attendanceMatrix.forEach((w, idx) => {
    const totals = calculateWorkerMonthlyTotals(w, daysInMonth);
    const row = [
      idx + 1,
      w.company,
      normalizeDept(w.dept),
      w.line,
      w.name
    ];
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(w.daily ? w.daily[d] || "" : "");
    }
    row.push(totals.workDays, totals.weekdayOtHours, totals.weekendOtHours, totals.nightDays, totals.totalHours);
    s2Rows.push(row);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, `📊 ${month}월_종합_현황판`);

  // Sheet 3: 업체별_통합_결산요약
  const s3Rows = [
    [`${year}년 ${month}월 5개사 업체별 근태 및 잔업 투입공수 통합 결산표`],
    [],
    ["구분 (업체명)", "관리 인원수", "누적 출근일수", "평일잔업 누계(H)", "주말특근 누계(H)", "야간근무 누계(일)", "총 투입공수(H)", "공수 비중(%)"]
  ];
  const compSummary = calculateCompanySummary(currentData.attendanceMatrix);
  compSummary.forEach((c) => {
    s3Rows.push([c.company, c.workerCount, c.totalWorkDays, c.weekdayOtHours, c.weekendOtHours, c.nightDays, c.totalHours, c.ratio / 100]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
  XLSX.utils.book_append_sheet(wb, ws3, "🏢 업체별_통합_결산요약");

  // Sheet 4: 부서별_투입공수_분석
  const s4Rows = [
    [`${year}년 ${month}월 5개사 부서별 인원 및 투입공수 현황 분석표`],
    [],
    ["소속 업체", "소속 부서", "배속 인원수", "당일 출근인원", "정시근무 인원", "잔업자 수", "당일 잔업시간(H)", "당일 총투입공수(H)"]
  ];
  const deptSummary = calculateDeptSummary(currentData.attendanceMatrix, sampleDay);
  deptSummary.forEach((d) => {
    s4Rows.push([d.company, d.dept, d.workerCount, d.attendedCount, d.regularCount, d.otCount, d.otHours, d.totalHours]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
  XLSX.utils.book_append_sheet(wb, ws4, "📈 부서별_투입공수_분석");

  // Sheet 5: 마스터_인원관리대장
  const s5Rows = [
    [`${year}년 ${month}월 5개사 전사 마스터 인원 관리 대장`],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "성명", "직급", "고용 형태", "재직 상태", "비고"]
  ];
  currentData.masterWorkers.forEach((w, idx) => {
    s5Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "사원", w.employmentType || "정규직", w.status || "재직", w.note || ""]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
  XLSX.utils.book_append_sheet(wb, ws5, "👥 마스터_인원관리대장");

  // Download Excel File
  const filename = `${year}년${String(month).padStart(2, "0")}월_5개사_잔업스마트통합관리대장_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};

// Excel Import Handler
export const importSmartOvertimeFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const matrixSheetName = workbook.SheetNames.find((s) => s.includes("현황판") || s.includes("종합")) || workbook.SheetNames[0];
        const ws = workbook.Sheets[matrixSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerRowIndex = jsonRows.findIndex((row) => row && (row.includes("소속 업체") || row.includes("성명") || row.includes("이름")));
        if (headerRowIndex === -1) headerRowIndex = 4;

        const importedMatrix = [];
        const importedWorkers = [];

        for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
          const r = jsonRows[i];
          if (!r || r.length < 5) continue;
          const no = Number(r[0]) || i;
          const company = String(r[1] || "").trim();
          const dept = normalizeDept(r[2] || "생산팀");
          const line = String(r[3] || "").trim();
          const name = String(r[4] || "").trim();
          if (!name) continue;

          const daily = {};
          for (let d = 1; d <= 30; d++) {
            const val = r[4 + d];
            daily[d] = val !== undefined && val !== null ? String(val).trim() : "";
          }

          importedMatrix.push({
            no,
            company: company || "(주)오륙",
            dept,
            line: line || "1라인",
            name,
            daily
          });

          importedWorkers.push({
            no,
            company: company || "(주)오륙",
            dept,
            line: line || "1라인",
            name,
            position: "사원",
            employmentType: "정규직",
            status: "재직",
            note: ""
          });
        }

        if (importedMatrix.length > 0) {
          // Assign per-company sequential number (1..N per company)
          const compCounters = {};
          importedMatrix.forEach((w) => {
            const c = cleanCompanyName(w.company);
            compCounters[c] = (compCounters[c] || 0) + 1;
            w.no = compCounters[c];
          });
          const compCounters2 = {};
          importedWorkers.forEach((w) => {
            const c = cleanCompanyName(w.company);
            compCounters2[c] = (compCounters2[c] || 0) + 1;
            w.no = compCounters2[c];
          });

          const updatedLedger = {
            year: 2026,
            month: 9,
            masterWorkers: importedWorkers,
            attendanceMatrix: importedMatrix
          };
          await saveSmartOvertimeData(updatedLedger);
          resolve(updatedLedger);
        } else {
          reject(new Error("유효한 근태 데이터 행을 찾을 수 없습니다."));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 🔒 Forensic Audit Viewer: Retrieve latest cell-level attendance change audits
 */
export const getRecentAttendanceAudits = async (targetYearMonth = null) => {
  try {
    const ym = targetYearMonth || "2026-10";
    const docId = getFirestoreDocIdForMonth(ym);
    if (!db) return [];
    const ref = doc(db, "smart_overtime_ledger", docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data()?.recentAuditLogs || [];
    }
    return [];
  } catch (err) {
    console.warn("Failed to fetch recent attendance audits:", err);
    return [];
  }
};
