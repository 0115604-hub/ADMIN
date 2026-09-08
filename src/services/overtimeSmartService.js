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

const STORAGE_KEY = "oryuk_smart_overtime_data_v1";
const FIRESTORE_DOC_ID = "overtime_2026_09";

export const COMPANIES = ["(주)오륙", "(주)조영산업", "한울", "부림텍", "유성"];

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
  "(주)오륙": {
    company: "(주)오륙",
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
    author: "김유성 반장",
    drafter: "김유성",
    drafterRole: "반장",
    lead: "설유철",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "유성대표",
    ceoRole: "대표"
  },
  "(주)조영산업": {
    company: "(주)조영산업",
    plant: "한림공장",
    author: "송원호 담당",
    drafter: "송원호",
    drafterRole: "담당",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "조영대표",
    ceoRole: "대표"
  },
  "한울": {
    company: "한울",
    plant: "한림공장",
    author: "안태식 담당",
    drafter: "안태식",
    drafterRole: "담당",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "한울대표",
    ceoRole: "대표"
  },
  "부림텍": {
    company: "부림텍",
    plant: "한림공장",
    author: "표성준 담당",
    drafter: "표성준",
    drafterRole: "담당",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "부림대표",
    ceoRole: "대표"
  },
  "전체": {
    company: "5개사 통합",
    plant: "삼랑진/한림공장",
    author: "양인나 / 우창용 선임",
    drafter: "양인나",
    drafterRole: "선임",
    lead: "윤경수 / 김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  }
};

export const COMPANY_THEMES = {
  "(주)오륙": {
    name: "(주)오륙",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
  },
  "(주)조영산업": {
    name: "(주)조영산업",
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
  }
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
  if (strCode === "-" || strCode === "휴무" || strCode === "결근" || strCode === "연차" || strCode === "") {
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

export const calculateWorkerMonthlyTotals = (workerRecord) => {
  let workDays = 0;
  let weekdayOtHours = 0;
  let weekendOtHours = 0;
  let nightDays = 0;
  let totalHours = 0;

  if (!workerRecord || !workerRecord.daily) {
    return { workDays: 0, weekdayOtHours: 0, weekendOtHours: 0, nightDays: 0, totalHours: 0 };
  }

  for (let d = 1; d <= 30; d++) {
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
    const comp = worker.company || "(주)오륙";
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
    const comp = worker.company || "(주)오륙";
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
export const ensureAllCompaniesPresent = (data) => {
  if (!data || !Array.isArray(data.attendanceMatrix) || data.attendanceMatrix.length === 0) {
    return INITIAL_SMART_OVERTIME_DATA;
  }

  let matrix = data.attendanceMatrix.map((w, idx) => ({
    ...w,
    no: idx + 1,
    dept: normalizeDept(w.dept)
  }));
  let master = (data.masterWorkers || []).map((w, idx) => ({
    ...w,
    no: idx + 1,
    dept: normalizeDept(w.dept)
  }));

  const existingCompanies = new Set(matrix.map((w) => w.company));

  // Check if any company from INITIAL_SMART_OVERTIME_DATA (like '유성') is missing
  COMPANIES.forEach((comp) => {
    if (!existingCompanies.has(comp)) {
      const initialWorkersForComp = INITIAL_SMART_OVERTIME_DATA.masterWorkers.filter((w) => w.company === comp);
      const initialMatrixForComp = INITIAL_SMART_OVERTIME_DATA.attendanceMatrix.filter((w) => w.company === comp);
      master.push(...initialWorkersForComp);
      matrix.push(...initialMatrixForComp);
    }
  });

  const reindexedMatrix = matrix.map((w, idx) => ({ ...w, no: idx + 1 }));
  const reindexedMaster = master.map((w, idx) => ({ ...w, no: idx + 1 }));

  return {
    ...data,
    attendanceMatrix: reindexedMatrix,
    masterWorkers: reindexedMaster
  };
};

export const getLocalSmartOvertimeData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.attendanceMatrix) && parsed.attendanceMatrix.length > 0) {
        return ensureAllCompaniesPresent(parsed);
      }
    }
  } catch (err) {
    console.warn("Failed to load local smart overtime data:", err);
  }
  return INITIAL_SMART_OVERTIME_DATA;
};

export const saveSmartOvertimeData = async (data) => {
  try {
    const normalizedData = ensureAllCompaniesPresent(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));

    if (db) {
      const ref = doc(db, "smart_overtime_ledger", FIRESTORE_DOC_ID);
      await setDoc(
        ref,
        {
          year: normalizedData.year || 2026,
          month: normalizedData.month || 9,
          masterWorkers: normalizedData.masterWorkers || [],
          attendanceMatrix: normalizedData.attendanceMatrix || [],
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
    return true;
  } catch (err) {
    console.error("Failed to save smart overtime data:", err);
    return false;
  }
};

export const subscribeSmartOvertimeData = (callback) => {
  try {
    if (!db) {
      callback(getLocalSmartOvertimeData());
      return () => {};
    }

    const ref = doc(db, "smart_overtime_ledger", FIRESTORE_DOC_ID);
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData && Array.isArray(cloudData.attendanceMatrix) && cloudData.attendanceMatrix.length > 0) {
            const normalized = ensureAllCompaniesPresent(cloudData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            callback(normalized);
            return;
          }
        }
        callback(getLocalSmartOvertimeData());
      },
      (error) => {
        console.warn("Firestore smart overtime listener error:", error);
        callback(getLocalSmartOvertimeData());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error("Failed to subscribe smart overtime data:", err);
    callback(getLocalSmartOvertimeData());
    return () => {};
  }
};

// Excel Export (6 Sheets)
export const exportSmartOvertimeToExcel = (data) => {
  const currentData = ensureAllCompaniesPresent(data || getLocalSmartOvertimeData());
  const wb = XLSX.utils.book_new();

  // Sheet 0: 일자별_근태정리본
  const s0Rows = [
    ["2026년 9월 일자별 근태 및 잔업 일일 종합 정리본 (5개사 통합)"],
    ["※ [B4] 셀에서 날짜를 선택하면 5개사 전사 일일 실적 요약표 및 전 작업자 상세 근태/잔업 내역이 실시간 자동 정리되어 표시됩니다."],
    ["📅 조회 대상 일자", null, "👥 당일 출근총원", "🟢 정시(0H)", "🟡 19시(+2H)", "🟠 21시(+4H)", "🔴 22시(+5H)", "🌙 특근/야간", "⚡ 당일 잔업합계(H)", null, "⏱ 당일 총투입공수"]
  ];
  const daySummary = calculateDailySummary(currentData.attendanceMatrix, 8);
  s0Rows.push(["9월 8일", null, daySummary.totalAttended, daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.specialNightCount, daySummary.dayOtHours, null, daySummary.dayTotalHours]);
  s0Rows.push([]);
  s0Rows.push(["🏢 5개사별 당일 근태 및 투입공수 요약"]);
  s0Rows.push(["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "직급", "근태/잔업", "잔업시간(H)", "총근무시간(H)", "비고"]);

  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[8] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s0Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "작업원", val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws0 = XLSX.utils.aoa_to_sheet(s0Rows);
  XLSX.utils.book_append_sheet(wb, ws0, "📋 일자별_근태정리본");

  // Sheet 1: 일일근태_간편입력
  const s1Rows = [
    ["일일 근태 및 잔업 스마트 간편 등록 대장 (5개사 통합)"],
    ["💡 [사용안내] ① [A4] 일자 및 [C4] 업체를 선택하세요. ② [F열]에서 [🟢(정시) / 19 / 21 / 22 / 야간 / 특근] 드롭다운을 선택하면 잔업 및 총 근무시간이 실시간 자동 계산됩니다."],
    ["📅 작성 대상 일자", null, "🏢 관리 대상 업체", "🟢 정시근무", "🟡 19시 (+2H)", "🟠 21시 (+4H)", "🔴 22시 (+5H)", "⚡ 당일 잔업합계", "⏱ 당일 총근무공수"],
    ["9월 8일", null, "전체(5개사)", daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.dayOtHours, daySummary.dayTotalHours],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "⭐ 잔업/근태 선택 (🟢/19/21/22)", "잔업시간 (H)", "총 근무시간 (H)", "비고 (조출/특이사항)"]
  ];
  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[8] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s1Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "📝 일일근태_간편입력");

  // Sheet 2: 9월_종합_현황판
  const s2Rows = [
    ["2026년 9월 5개사 통합 근태 및 잔업 스마트 종합관리대장 (오륙 / 조영산업 / 한울 / 부림텍 / 유성)"],
    ["※ [A4] 셀에서 일자(9월 1일~9월 30일)를 선택하면 5개사 전체 및 업체별 당일 실적이 실시간 자동 집계됩니다. (🟢=정시, 19=+2H, 21=+4H, 22=+5H)"],
    ["📅 조회 대상 일자", null, "👥 5개사 전사 총원", null, "🟢 정시근무(0H)", null, null, "🟡 19시(+2H)", null, null, "🟠 21시(+4H)", null, null, "🔴 22시(+5H)", null, null, "🌙 야간/특근", null, null, "⚡ 9월 평일잔업 누적", null, null, null, "🎯 9월 주말특근 누적", null, null, null, "⏱ 9월 전사 총 누적 투입공수 (기본근무 + 평일잔업 + 주말특근)"],
    ["9월 8일", null, currentData.attendanceMatrix.length, null, daySummary.regularCount, null, null, daySummary.ot19Count, null, null, daySummary.ot21Count, null, null, daySummary.ot22Count, null, null, daySummary.specialNightCount, null, null, 1680, null, null, null, 440, null, null, null, 25200],
    ["No.", "소속 업체", "소속 부서", "차종/라인", "성명", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "출근일수", "평일잔업(H)", "주말특근(H)", "야간(일)", "총공수(H)"],
    [null, null, null, null, null, "9월 1일", "9월 2일", "9월 3일", "9월 4일", "9월 5일", "9월 6일", "9월 7일", "9월 8일", "9월 9일", "9월 10일", "9월 11일", "9월 12일", "9월 13일", "9월 14일", "9월 15일", "9월 16일", "9월 17일", "9월 18일", "9월 19일", "9월 20일", "9월 21일", "9월 22일", "9월 23일", "9월 24일", "9월 25일", "9월 26일", "9월 27일", "9월 28일", "9월 29일", "9월 30일"]
  ];

  currentData.attendanceMatrix.forEach((w, idx) => {
    const totals = calculateWorkerMonthlyTotals(w);
    const row = [
      idx + 1,
      w.company,
      normalizeDept(w.dept),
      w.line,
      w.name
    ];
    for (let d = 1; d <= 30; d++) {
      row.push(w.daily ? w.daily[d] || "" : "");
    }
    row.push(totals.workDays, totals.weekdayOtHours, totals.weekendOtHours, totals.nightDays, totals.totalHours);
    s2Rows.push(row);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, "📊 9월_종합_현황판");

  // Sheet 3: 업체별_통합_결산요약
  const s3Rows = [
    ["2026년 9월 5개사 업체별 근태 및 잔업 투입공수 통합 결산표"],
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
    ["2026년 9월 5개사 부서별 인원 및 투입공수 현황 분석표"],
    [],
    ["소속 업체", "소속 부서", "배속 인원수", "당일 출근인원", "정시근무 인원", "잔업자 수", "당일 잔업시간(H)", "당일 총투입공수(H)"]
  ];
  const deptSummary = calculateDeptSummary(currentData.attendanceMatrix, 8);
  deptSummary.forEach((d) => {
    s4Rows.push([d.company, d.dept, d.workerCount, d.attendedCount, d.regularCount, d.otCount, d.otHours, d.totalHours]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
  XLSX.utils.book_append_sheet(wb, ws4, "📈 부서별_투입공수_분석");

  // Sheet 5: 마스터_인원관리대장
  const s5Rows = [
    ["2026년 9월 5개사 전사 마스터 인원 관리 대장"],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "성명", "직급", "고용 형태", "재직 상태", "비고"]
  ];
  currentData.masterWorkers.forEach((w, idx) => {
    s5Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "작업원", w.employmentType || "정규직", w.status || "재직", w.note || ""]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
  XLSX.utils.book_append_sheet(wb, ws5, "👥 마스터_인원관리대장");

  // Download Excel File
  const filename = `2026년09월_5개사_잔업스마트통합관리대장_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
