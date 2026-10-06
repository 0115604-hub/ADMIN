// Smart Overtime & Attendance Service (잔업 스마트 통합관리대장 - 5개사 통합)
import {
  collection,
  doc,
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

export const COMPANIES = ["오륙", "조영", "유성", "한울", "부림텍"];

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

export const DEPARTMENTS = ["관리부", "가공동", "압출동"];

export const normalizeDept = (dept) => {
  if (!dept) return "압출동";
  const str = String(dept).trim();
  if (str === "관리부" || str === "가공동" || str === "압출동") return str;
  if (str.includes("관리") || str.includes("총괄") || str.includes("기술") || str.includes("출하")) return "관리부";
  if (str.includes("가공") || str.includes("프레스") || str.includes("용접") || str.includes("성형") || str.includes("도장")) return "가공동";
  return "압출동";
};

export const COMPANY_APPROVAL_MANAGERS = {
  "오륙": {
    company: "오륙",
    plant: "삼랑진공장",
    author: "양인나 선임",
    drafter: "양인나",
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
    author: "유동길 선임",
    drafter: "유동길",
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
    author: "김동욱 책임",
    drafter: "김동욱",
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
  "부림텍": {
    company: "부림텍",
    plant: "한림공장",
    author: "김동욱 책임",
    drafter: "김동욱",
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
    author: "양인나 / 오상민 선임",
    drafter: "양인나",
    drafterRole: "선임",
    lead: "윤경수 / 김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  // Aliases for legacy compatibility
  "(주)오륙": { company: "오륙", plant: "삼랑진공장", author: "양인나 선임", drafter: "양인나", drafterRole: "선임", lead: "윤경수", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)조영산업": { company: "조영", plant: "한림공장", author: "김동욱 책임", drafter: "김동욱", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "조영산업": { company: "조영", plant: "한림공장", author: "김동욱 책임", drafter: "김동욱", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" }
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
  "(주)오륙": { name: "오륙", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", accent: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" },
  "(주)조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "(주)조영": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" }
};

export const ATTENDANCE_OPTIONS = [
  { code: "🟢", label: "🟢 정시 (8H, 잔업0H)", shortLabel: "정시", otHours: 0, workHours: 8, bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300" },
  { code: "19", label: "🟡 19시 (+2H 잔업, 10H)", shortLabel: "19시(+2H)", otHours: 2, workHours: 10, bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300" },
  { code: "21", label: "🟠 21시 (+4H 잔업, 12H)", shortLabel: "21시(+4H)", otHours: 4, workHours: 12, bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300" },
  { code: "22", label: "🔴 22시 (+5H 잔업, 13H)", shortLabel: "22시(+5H)", otHours: 5, workHours: 13, bg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300" },
  { code: "특근", label: "🌙 주말특근 (8H, 특근)", shortLabel: "주말특근", otHours: 8, workHours: 8, bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300" },
  { code: "야간", label: "🌌 야간근무 (8H, 야간)", shortLabel: "야간근무", otHours: 0, workHours: 8, bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300" },
  { code: "주야", label: "⚡ 주야맞교대 (+4H, 12H)", shortLabel: "주야교대", otHours: 4, workHours: 12, bg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300" },
  { code: "-", label: "- 휴무/공휴일 (0H)", shortLabel: "휴무", otHours: 0, workHours: 0, bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300" },
  { code: "휴가", label: "🏖️ 휴가 (휴무, 0H)", shortLabel: "휴가", otHours: 0, workHours: 0, bg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300" },
  { code: "연차", label: "🌴 연차휴가 (휴무, 0H)", shortLabel: "연차", otHours: 0, workHours: 0, bg: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300" },
  { code: "반차", label: "⛅ 오전/오후 반차 (4H)", shortLabel: "반차", otHours: 0, workHours: 4, bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300" },
  { code: "결근", label: "❌ 결근/무단결근 (0H)", shortLabel: "결근", otHours: 0, workHours: 0, bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300" }
];

export const getOptionMeta = (code) => {
  if (!code) return { code: "", label: "미입력", shortLabel: "미입력", otHours: 0, workHours: 0, bg: "bg-slate-50 text-slate-400 border-slate-200" };
  const strCode = String(code).trim();
  const found = ATTENDANCE_OPTIONS.find((o) => o.code === strCode);
  if (found) return found;
  if (strCode === "정시" || strCode === "17") return ATTENDANCE_OPTIONS[0];
  if (strCode === "19시") return ATTENDANCE_OPTIONS[1];
  if (strCode === "21시") return ATTENDANCE_OPTIONS[2];
  if (strCode === "22시") return ATTENDANCE_OPTIONS[3];
  return { code: strCode, label: strCode, shortLabel: strCode, otHours: 0, workHours: 8, bg: "bg-blue-50 text-blue-800 border-blue-200" };
};

export const calculateWorkerDailyHours = (code) => {
  if (!code) return { isAttended: false, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 0 };
  const strCode = String(code).trim();
  if (strCode === "-" || strCode === "휴무" || strCode === "결근" || strCode === "휴가" || strCode === "연차" || strCode === "") {
    return { isAttended: false, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 0 };
  }
  if (strCode === "반차") {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 4 };
  }
  if (strCode === "🟢" || strCode === "정시" || strCode === "17") {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 0, workHours: 8 };
  }
  if (strCode === "19" || strCode === "19시") {
    return { isAttended: true, weekdayOt: 2, weekendOt: 0, nightDay: 0, workHours: 10 };
  }
  if (strCode === "21" || strCode === "21시") {
    return { isAttended: true, weekdayOt: 4, weekendOt: 0, nightDay: 0, workHours: 12 };
  }
  if (strCode === "22" || strCode === "22시") {
    return { isAttended: true, weekdayOt: 5, weekendOt: 0, nightDay: 0, workHours: 13 };
  }
  if (strCode === "특근" || strCode === "주말특근") {
    return { isAttended: true, weekdayOt: 0, weekendOt: 8, nightDay: 0, workHours: 8 };
  }
  if (strCode === "야간") {
    return { isAttended: true, weekdayOt: 0, weekendOt: 0, nightDay: 1, workHours: 8 };
  }
  if (strCode === "주야") {
    return { isAttended: true, weekdayOt: 4, weekendOt: 0, nightDay: 1, workHours: 12 };
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
    const val = workerRecord.daily[d];
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

export const calculateDailySummary = (attendanceList, dayNum = 8) => {
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

    const val = worker.daily ? worker.daily[dayNum] : "";
    const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    const ot = weekdayOt + weekendOt;

    if (isAttended) {
      totalAttended++;
      companyBreakdown[comp].attended++;
    }

    const str = String(val).trim();
    if (str === "🟢" || str === "정시" || str === "17") {
      regularCount++;
      companyBreakdown[comp].regular++;
    } else if (str === "19" || str === "19시") {
      ot19Count++;
      companyBreakdown[comp].ot19++;
    } else if (str === "21" || str === "21시") {
      ot21Count++;
      companyBreakdown[comp].ot21++;
    } else if (str === "22" || str === "22시") {
      ot22Count++;
      companyBreakdown[comp].ot22++;
    } else if (str === "특근" || str === "주말특근" || str === "야간" || str === "주야") {
      specialNightCount++;
      companyBreakdown[comp].specialNight++;
    } else if (str === "결근") {
      companyBreakdown[comp].absent = (companyBreakdown[comp].absent || 0) + 1;
    } else if (str === "연차" || str === "반차") {
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
export const buildMatrixFromReports = (masterWorkers, reports) => {
  const workers = Array.isArray(masterWorkers) && masterWorkers.length > 0 
    ? masterWorkers 
    : (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []);

  // 1. Initialize base matrix preserving worker's daily records
  const matrix = workers.map((w, idx) => {
    const daily = { ...(w.daily || {}) };
    return {
      no: idx + 1,
      company: cleanCompanyName(w.company),
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "작업원",
      daily
    };
  });

  if (!Array.isArray(reports) || reports.length === 0) {
    return matrix;
  }

  // Helper to normalize company name
  const matchCompany = (comp1, comp2) => {
    if (!comp1 || !comp2) return false;
    const c1 = String(comp1).replace(/[()]/g, "").trim();
    const c2 = String(comp2).replace(/[()]/g, "").trim();
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  // 2. Iterate through reports
  reports.forEach((report) => {
    if (!report || !report.workDate) return;
    const parts = String(report.workDate).split("-");
    if (parts.length < 3) return;
    const day = parseInt(parts[2], 10);
    if (isNaN(day) || day < 1 || day > 31) return;

    const isWeekend = (day === 5 || day === 6 || day === 12 || day === 13 || day === 19 || day === 20 || day === 26 || day === 27);

    // Identify target companies for this report
    let targetCompanies = [];
    if (report.company && report.company !== "전체") {
      targetCompanies = [report.company];
    } else if (report.plant === "삼랑진공장") {
      targetCompanies = ["(주)오륙", "유성"];
    } else if (report.plant === "한림공장") {
      targetCompanies = ["(주)조영산업", "한울", "부림텍"];
    } else if (Array.isArray(report.companies) && report.companies.length > 0) {
      targetCompanies = report.companies;
    } else {
      targetCompanies = COMPANIES;
    }

    // Apply items from the report
    if (Array.isArray(report.items)) {
      report.items.forEach((it) => {
        // Case A: item has individual workerName
        if (it.workerName) {
          const wName = String(it.workerName).trim();
          const targetW = matrix.find((w) => {
            const sameName = w.name.trim() === wName;
            if (!sameName) return false;
            if (it.company) return matchCompany(it.company, w.company);
            return targetCompanies.some(tc => matchCompany(tc, w.company));
          }) || matrix.find((w) => w.name.trim() === wName);

          if (targetW) {
            let code = it.attendanceCode;
            if (!code || code === "특근" || code === "주말특근") {
              if (it.hours === 10 || it.endTime === "19:00") code = "19";
              else if (it.hours === 12 || it.endTime === "21:00") code = "21";
              else if (it.hours === 13 || it.endTime === "22:00") code = "22";
              else code = isWeekend ? "특근" : "🟢";
            }
            targetW.daily[day] = code;
          }
        }
        // Case B: item has category group with names string
        else if (it.names) {
          const namesList = String(it.names).split(",").map((s) => s.trim()).filter(Boolean);
          namesList.forEach((n) => {
            const targetW = matrix.find((w) => {
              const sameName = w.name.trim() === n;
              if (!sameName) return false;
              if (it.company) return matchCompany(it.company, w.company);
              return targetCompanies.some(tc => matchCompany(tc, w.company));
            }) || matrix.find((w) => w.name.trim() === n);

            if (targetW) {
              let code = "🟢";
              if (it.hours >= 13) code = "22";
              else if (it.hours >= 12) code = "21";
              else if (it.hours >= 10) code = "19";
              else code = isWeekend ? "특근" : "🟢";
              targetW.daily[day] = code;
            }
          });
        }
      });
    }
  });

  return matrix;
};

export const YUSEONG_WORKER_NAMES = new Set([
  "이성기", "조마루", "쏘탈", "론나차이", "마리오", "제날드", "팔라", "누리",
  "데란스", "포티퐁", "린", "넷플립", "제인", "그레이스"
]);

export const ensureAllCompaniesPresent = (data) => {
  if (!data || !Array.isArray(data.attendanceMatrix) || data.attendanceMatrix.length === 0) {
    return INITIAL_SMART_OVERTIME_DATA;
  }

  // 1. Filter out duplicate dummy single worker if present
  let filteredMatrix = data.attendanceMatrix.filter((w) => {
    if (w.company === "유성" && w.dept === "관리부" && w.line === "관리부" && w.name === "이성기") {
      const hasRealYuseongLee = data.attendanceMatrix.some(
        (o) => o.name === "이성기" && (o.line?.includes("유성") || o.dept === "압출동")
      );
      if (hasRealYuseongLee) return false;
    }
    return true;
  });

  let matrix = filteredMatrix.map((w, idx) => {
    const rawName = (w.name || "").trim();
    let comp = cleanCompanyName(w.company);
    // Auto-fix if Yuseong worker was mistakenly grouped in Oryuk
    if (YUSEONG_WORKER_NAMES.has(rawName)) {
      comp = "유성";
    }

    return {
      ...w,
      company: comp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: rawName,
      position: w.position || "작업원",
      daily: { ...(w.daily || {}) }
    };
  });

  let master = (data.masterWorkers && Array.isArray(data.masterWorkers) && data.masterWorkers.length === matrix.length)
    ? data.masterWorkers
        .filter((w) => {
          if (w.company === "유성" && w.dept === "관리부" && w.line === "관리부" && w.name === "이성기") {
            const hasReal = data.masterWorkers.some((o) => o.name === "이성기" && (o.line?.includes("유성") || o.dept === "압출동"));
            if (hasReal) return false;
          }
          return true;
        })
        .map((w, idx) => {
          const rawName = (w.name || matrix[idx]?.name || "").trim();
          let comp = cleanCompanyName(w.company || matrix[idx]?.company || "오륙");
          if (YUSEONG_WORKER_NAMES.has(rawName)) {
            comp = "유성";
          }
          return {
            ...w,
            company: comp,
            dept: normalizeDept(w.dept || matrix[idx]?.dept),
            line: w.line || matrix[idx]?.line || normalizeDept(w.dept),
            name: rawName,
            position: w.position || matrix[idx]?.position || "작업원",
            employmentType: w.employmentType || "정규직",
            status: w.status || "재직",
            note: w.note || ""
          };
        })
    : matrix.map((w) => ({
        company: w.company,
        dept: normalizeDept(w.dept),
        line: w.line || normalizeDept(w.dept),
        name: w.name,
        position: w.position || "작업원",
        employmentType: w.employmentType || "정규직",
        status: w.status || "재직",
        note: w.note || ""
      }));

  const existingCompanies = new Set(matrix.map((w) => w.company));

  // Check if any company from INITIAL_SMART_OVERTIME_DATA is completely missing
  COMPANIES.forEach((comp) => {
    if (!existingCompanies.has(comp)) {
      const initialWorkersForComp = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).filter((w) => w.company === comp);
      const initialMatrixForComp = (INITIAL_SMART_OVERTIME_DATA.attendanceMatrix || []).filter((w) => w.company === comp);
      master.push(...initialWorkersForComp);
      matrix.push(...initialMatrixForComp);
    }
  });

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

export const getStorageKeyForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `oryuk_smart_overtime_data_${clean}`;
};

export const getFirestoreDocIdForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `overtime_${clean}`;
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
    position: w.position || "작업원",
    daily: {}
  }));
  return {
    year: Number(year) || 2026,
    month: Number(month) || 10,
    masterWorkers: master,
    attendanceMatrix: matrix
  };
};

export const getLocalSmartOvertimeData = (targetYearMonth = null) => {
  try {
    const ym = targetYearMonth || "2026-10";
    const key = getStorageKeyForMonth(ym);

    // 1. If requesting September (2026-09), return authoritative INITIAL_SMART_OVERTIME_DATA
    if (ym === "2026-09" || ym === "2026_09") {
      const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.attendanceMatrix) && parsed.attendanceMatrix.length >= 100) {
          return ensureAllCompaniesPresent(parsed);
        }
      }
      return ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
    }

    // 2. Check month-specific key (e.g. 2026-10)
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.attendanceMatrix) && parsed.attendanceMatrix.length > 0) {
        return ensureAllCompaniesPresent(parsed);
      }
    }

    // 3. Fallback for new months (e.g. 10월): create fresh template with 143 workers
    const parts = ym.split("-").map(Number);
    return createEmptySmartOvertimeData(parts[0] || 2026, parts[1] || 10);
  } catch (err) {
    console.warn("Failed to load local smart overtime data:", err);
  }
  return ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
};

export const saveSmartOvertimeData = async (data, targetYearMonth = null) => {
  try {
    const ym = targetYearMonth || (data?.year && data?.month ? `${data.year}-${String(data.month).padStart(2, "0")}` : "2026-10");
    const key = getStorageKeyForMonth(ym);
    const docId = getFirestoreDocIdForMonth(ym);

    const normalizedData = ensureAllCompaniesPresent(data);
    localStorage.setItem(key, JSON.stringify(normalizedData));
    if (ym === "2026-09" || ym === "2026_09") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
    }

    // Dispatch custom event for immediate same-page multi-component updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_smart_overtime_updated", { detail: { ...normalizedData, yearMonth: ym } }));
    }

    if (db) {
      const ref = doc(db, "smart_overtime_ledger", docId);
      await setDoc(
        ref,
        sanitizeForFirestore({
          year: normalizedData.year || parseInt(ym.split("-")[0], 10) || 2026,
          month: normalizedData.month || parseInt(ym.split("-")[1], 10) || 10,
          masterWorkers: normalizedData.masterWorkers || [],
          attendanceMatrix: normalizedData.attendanceMatrix || [],
          updatedAt: new Date().toISOString()
        }),
        { merge: true }
      );
    }
    return true;
  } catch (err) {
    console.error("Failed to save smart overtime data:", err);
    return false;
  }
};

export const subscribeSmartOvertimeData = (callback, targetYearMonth = null) => {
  try {
    const ym = targetYearMonth || "2026-10";
    const key = getStorageKeyForMonth(ym);
    const docId = getFirestoreDocIdForMonth(ym);

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
        if (typeof window !== "undefined") {
          window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
        }
      };
    }

    const ref = doc(db, "smart_overtime_ledger", docId);
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData && Array.isArray(cloudData.attendanceMatrix) && cloudData.attendanceMatrix.length > 0) {
            const normalized = ensureAllCompaniesPresent(cloudData);
            localStorage.setItem(key, JSON.stringify(normalized));
            callback(normalized);
            return;
          }
        }
        callback(getLocalSmartOvertimeData(ym));
      },
      (error) => {
        console.warn("Firestore smart overtime listener error:", error);
        callback(getLocalSmartOvertimeData(ym));
      }
    );
    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
      }
    };
  } catch (err) {
    console.error("Failed to subscribe smart overtime data:", err);
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
    s0Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "작업원", val || "-", weekdayOt + weekendOt, workHours, ""]);
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
    [`${year}년 ${month}월 5개사 통합 근태 및 잔업 스마트 종합관리대장 (오륙 / 조영 / 한울 / 부림텍 / 유성)`],
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
    s5Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "작업원", w.employmentType || "정규직", w.status || "재직", w.note || ""]);
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
          const dept = normalizeDept(r[2] || "압출동");
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
            position: "작업원",
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
