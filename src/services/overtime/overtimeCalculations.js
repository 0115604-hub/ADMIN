/**
 * Worker Hours & Daily/Monthly Overtime Calculation Engine
 */
import {
  isWeekendByDate,
  normalizeDept,
  cleanCompanyName,
  COMPANIES
} from "./overtimeConstants.js";

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
