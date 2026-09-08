// Smart Overtime & Attendance Service (잔업 스마트 통합관리대장)
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

export const COMPANIES = ["(주)오륙", "(주)조영산업", "한울", "부림텍"];

export const ATTENDANCE_OPTIONS = [
  { code: "🟢", label: "🟢 정시(8H, 잔업0H)", otHours: 0, workHours: 8, bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300" },
  { code: "19", label: "🟡 19시(+2H 잔업, 10H)", otHours: 2, workHours: 10, bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300" },
  { code: "21", label: "🟠 21시(+4H 잔업, 12H)", otHours: 4, workHours: 12, bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300" },
  { code: "22", label: "🔴 22시(+5H 잔업, 13H)", otHours: 5, workHours: 13, bg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300" },
  { code: "특근", label: "🌙 주말특근(8H)", otHours: 8, workHours: 8, bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300" },
  { code: "야간", label: "🌌 야간근무(8H)", otHours: 0, workHours: 8, bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300" },
  { code: "주야", label: "⚡ 주야맞교대(+4H, 12H)", otHours: 4, workHours: 12, bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300" },
  { code: "-", label: "- 휴무/공휴일(0H)", otHours: 0, workHours: 0, bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300" },
  { code: "연차", label: "🌴 연차(휴무)", otHours: 0, workHours: 0, bg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300" },
  { code: "반차", label: "⛅ 반차(4H)", otHours: 0, workHours: 4, bg: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300" },
  { code: "결근", label: "❌ 결근(0H)", otHours: 0, workHours: 0, bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300" }
];

export const getOptionMeta = (code) => {
  if (!code) return { code: "", label: "미입력", otHours: 0, workHours: 0, bg: "bg-slate-50 text-slate-400 border-slate-200" };
  const strCode = String(code).trim();
  const found = ATTENDANCE_OPTIONS.find((o) => o.code === strCode);
  if (found) return found;
  if (strCode === "정시" || strCode === "17") return ATTENDANCE_OPTIONS[0];
  if (strCode === "19시") return ATTENDANCE_OPTIONS[1];
  if (strCode === "21시") return ATTENDANCE_OPTIONS[2];
  if (strCode === "22시") return ATTENDANCE_OPTIONS[3];
  return { code: strCode, label: strCode, otHours: 0, workHours: 8, bg: "bg-blue-50 text-blue-800 border-blue-200" };
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

export const calculateDailySummary = (attendanceList, dayNum) => {
  if (!Array.isArray(attendanceList)) {
    return {
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

  let totalAttended = 0;
  let regularCount = 0;
  let ot19Count = 0;
  let ot21Count = 0;
  let ot22Count = 0;
  let specialNightCount = 0;
  let dayOtHours = 0;
  let dayTotalHours = 0;

  const companyBreakdown = {};
  COMPANIES.forEach((comp) => {
    companyBreakdown[comp] = {
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

  attendanceList.forEach((worker) => {
    const comp = worker.company || "(주)오륙";
    if (!companyBreakdown[comp]) {
      companyBreakdown[comp] = { total: 0, attended: 0, regular: 0, ot19: 0, ot21: 0, ot22: 0, specialNight: 0, otHours: 0, totalHours: 0 };
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

  const totalWorkers = list.reduce((acc, c) => acc + c.workerCount, 0);
  const totalWorkDays = list.reduce((acc, c) => acc + c.totalWorkDays, 0);
  const totalWeekdayOt = list.reduce((acc, c) => acc + c.weekdayOtHours, 0);
  const totalWeekendOt = list.reduce((acc, c) => acc + c.weekendOtHours, 0);
  const totalNightDays = list.reduce((acc, c) => acc + c.nightDays, 0);

  const grandTotalRow = {
    company: "🏆 4개사 총 합계",
    workerCount: totalWorkers,
    totalWorkDays,
    weekdayOtHours: totalWeekdayOt,
    weekendOtHours: totalWeekendOt,
    nightDays: totalNightDays,
    totalHours: grandTotalHours,
    ratio: 100
  };

  return [...list, grandTotalRow];
};

export const calculateDeptSummary = (attendanceList) => {
  if (!Array.isArray(attendanceList)) return [];

  const map = {};
  attendanceList.forEach((w) => {
    const dept = w.dept || "기타";
    if (!map[dept]) {
      map[dept] = {
        dept,
        workerCount: 0,
        totalWorkDays: 0,
        weekdayOtHours: 0,
        weekendOtHours: 0,
        nightDays: 0,
        totalHours: 0
      };
    }
    const totals = calculateWorkerMonthlyTotals(w);
    map[dept].workerCount++;
    map[dept].totalWorkDays += totals.workDays;
    map[dept].weekdayOtHours += totals.weekdayOtHours;
    map[dept].weekendOtHours += totals.weekendOtHours;
    map[dept].nightDays += totals.nightDays;
    map[dept].totalHours += totals.totalHours;
  });

  return Object.values(map).sort((a, b) => b.totalHours - a.totalHours);
};

// LocalStorage & Cloud Sync
export const getLocalSmartOvertimeData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.attendanceMatrix) && parsed.attendanceMatrix.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to parse local smart overtime data:", err);
  }
  return INITIAL_SMART_OVERTIME_DATA;
};

export const saveSmartOvertimeData = async (data) => {
  if (!data) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Cloud Firestore Sync
    if (db) {
      const docRef = doc(db, "smart_overtime_data", FIRESTORE_DOC_ID);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  } catch (err) {
    console.error("Failed to save smart overtime data:", err);
    return false;
  }
};

export const subscribeSmartOvertimeData = (callback) => {
  if (!db) {
    callback(getLocalSmartOvertimeData());
    return () => {};
  }

  try {
    const docRef = doc(db, "smart_overtime_data", FIRESTORE_DOC_ID);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          if (cloudData && Array.isArray(cloudData.attendanceMatrix)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            callback(cloudData);
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
  const currentData = data || getLocalSmartOvertimeData();
  const wb = XLSX.utils.book_new();

  // Sheet 0: 일자별_근태정리본
  const s0Rows = [
    ["2026년 9월 일자별 근태 및 잔업 일일 종합 정리본 (4개사 통합)"],
    ["※ [B4] 셀에서 날짜를 선택하면 4개사 전사 일일 실적 요약표 및 전 작업자 상세 근태/잔업 내역이 실시간 자동 정리되어 표시됩니다."],
    ["📅 조회 대상 일자", null, "👥 당일 출근총원", "🟢 정시(0H)", "🟡 19시(+2H)", "🟠 21시(+4H)", "🔴 22시(+5H)", "🌙 특근/야간", "⚡ 당일 잔업합계(H)", null, "⏱ 당일 총투입공수"]
  ];
  const daySummary = calculateDailySummary(currentData.attendanceMatrix, 8);
  s0Rows.push(["9월 8일", null, daySummary.totalAttended, daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.specialNightCount, daySummary.dayOtHours, null, daySummary.dayTotalHours]);
  s0Rows.push([]);
  s0Rows.push(["🏢 4개사별 당일 근태 및 투입공수 요약"]);
  s0Rows.push(["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "직급", "근태/잔업", "잔업시간(H)", "총근무시간(H)", "비고"]);

  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[8] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s0Rows.push([idx + 1, w.company, w.dept, w.line, w.name, "작업원", val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws0 = XLSX.utils.aoa_to_sheet(s0Rows);
  XLSX.utils.book_append_sheet(wb, ws0, "📋 일자별_근태정리본");

  // Sheet 1: 일일근태_간편입력
  const s1Rows = [
    ["일일 근태 및 잔업 스마트 간편 등록 대장 (4개사 통합)"],
    ["💡 [사용안내] ① [A4] 일자 및 [C4] 업체를 선택하세요. ② [F열]에서 [🟢(정시) / 19 / 21 / 22 / 야간 / 특근] 드롭다운을 선택하면 잔업 및 총 근무시간이 실시간 자동 계산됩니다."],
    ["📅 작성 대상 일자", null, "🏢 관리 대상 업체", "🟢 정시근무", "🟡 19시 (+2H)", "🟠 21시 (+4H)", "🔴 22시 (+5H)", "⚡ 당일 잔업합계", "⏱ 당일 총근무공수"],
    ["9월 8일", null, "전체(4개사)", daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.dayOtHours, daySummary.dayTotalHours],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "⭐ 잔업/근태 선택 (🟢/19/21/22)", "잔업시간 (H)", "총 근무시간 (H)", "비고 (조출/특이사항)"]
  ];
  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[8] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s1Rows.push([idx + 1, w.company, w.dept, w.line, w.name, val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "📝 일일근태_간편입력");

  // Sheet 2: 9월_종합_현황판
  const s2Rows = [
    ["2026년 9월 4개사 통합 근태 및 잔업 스마트 종합관리대장 (오륙 / 조영산업 / 한울 / 부림텍)"],
    ["※ [A4] 셀에서 일자(9월 1일~9월 30일)를 선택하면 4개사 전체 및 업체별 당일 실적이 실시간 자동 집계됩니다. (🟢=정시, 19=+2H, 21=+4H, 22=+5H)"],
    ["📅 조회 대상 일자", null, "👥 4개사 전사 총원", null, "🟢 정시근무(0H)", null, null, "🟡 19시(+2H)", null, null, "🟠 21시(+4H)", null, null, "🔴 22시(+5H)", null, null, "🌙 야간/특근", null, null, "⚡ 9월 평일잔업 누적", null, null, null, "🎯 9월 주말특근 누적", null, null, null, "⏱ 9월 전사 총 누적 투입공수 (기본근무 + 평일잔업 + 주말특근)"],
    ["9월 8일", null, currentData.attendanceMatrix.length, null, daySummary.regularCount, null, null, daySummary.ot19Count, null, null, daySummary.ot21Count, null, null, daySummary.ot22Count, null, null, daySummary.specialNightCount, null, null, 1646, null, null, null, 424, null, null, null, 24110],
    ["No.", "소속 업체", "소속 부서", "차종/라인", "성명", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월", "화", "수", "출근일수", "평일잔업(H)", "주말특근(H)", "야간(일)", "총공수(H)"],
    [null, null, null, null, null, "9월 1일", "9월 2일", "9월 3일", "9월 4일", "9월 5일", "9월 6일", "9월 7일", "9월 8일", "9월 9일", "9월 10일", "9월 11일", "9월 12일", "9월 13일", "9월 14일", "9월 15일", "9월 16일", "9월 17일", "9월 18일", "9월 19일", "9월 20일", "9월 21일", "9월 22일", "9월 23일", "9월 24일", "9월 25일", "9월 26일", "9월 27일", "9월 28일", "9월 29일", "9월 30일"]
  ];

  currentData.attendanceMatrix.forEach((w, idx) => {
    const totals = calculateWorkerMonthlyTotals(w);
    const row = [
      idx + 1,
      w.company,
      w.dept,
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
    ["2026년 9월 업체별 근태 및 잔업 투입공수 통합 결산표"],
    [],
    ["구분 (업체명)", "관리 인원수", "누적 출근일수", "평일잔업 누계(H)", "주말특근 누계(H)", "야간근무 누계(일)", "총 투입공수(H)", "공수 비중(%)"]
  ];
  const compSummary = calculateCompanySummary(currentData.attendanceMatrix);
  compSummary.forEach((c) => {
    s3Rows.push([c.company, c.workerCount, c.totalWorkDays, c.weekdayOtHours, c.weekendOtHours, c.nightDays, c.totalHours, c.ratio / 100]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
  XLSX.utils.book_append_sheet(wb, ws3, "🏢 업체별_통합_결산요약");

  // Sheet 4: 인원정보_마스터관리
  const s4Rows = [
    ["4개사 소속 인원 정보 마스터 관리 대장 (성명 / 부서 / 차종 / 업체 직접 추가·수정·삭제 가능)"],
    ["💡 [인원 추가/삭제 안내] ① 새 작업자 추가 시 아래 빈 행에 소속업체(드롭다운), 부서, 차종, 성명을 입력하면 모든 시트에 자동 등록됩니다. ② 행을 삭제하거나 재직상태를 '퇴사'로 변경하셔도 INDEX 참조 수식 적용으로 다른 시트에 #REF! 에러가 발생하지 않습니다."],
    [],
    ["No.", "소속 업체명", "소속 부서 / 공정", "담당 차종 / 라인", "작업자 성명", "직급 / 직책", "고용 형태", "재직 상태", "비고 (특이사항)"]
  ];
  const workers = currentData.masterWorkers || [];
  workers.forEach((w, idx) => {
    s4Rows.push([idx + 1, w.company, w.dept, w.line, w.name, w.position || "작업원", w.employmentType || "정규직", w.status || "재직", w.note || ""]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
  XLSX.utils.book_append_sheet(wb, ws4, "👥 인원정보_마스터관리");

  // Sheet 5: 부서및공정별_통계분석
  const s5Rows = [
    ["부서 및 차종/공정별 근태 통계 집계표"],
    [],
    ["구분(부서/라인)", "인원수", "누적출근일수", "평일잔업(H)", "주말특근(H)", "야간근무(일)", "총 투입공수(H)"]
  ];
  const deptSummary = calculateDeptSummary(currentData.attendanceMatrix);
  deptSummary.forEach((d) => {
    s5Rows.push([d.dept, d.workerCount, d.totalWorkDays, d.weekdayOtHours, d.weekendOtHours, d.nightDays, d.totalHours]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
  XLSX.utils.book_append_sheet(wb, ws5, "📈 부서및공정별_통계분석");

  // Write and Download
  XLSX.writeFile(wb, "잔업_스마트_통합관리대장(오륙_4개사).xlsx");
};

// Excel Import
export const importSmartOvertimeFromExcel = (arrayBuffer) => {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  let masterWorkers = [];
  let attendanceMatrix = [];

  // Parse Master Workers
  if (wb.Sheets["👥 인원정보_마스터관리"]) {
    const s4 = XLSX.utils.sheet_to_json(wb.Sheets["👥 인원정보_마스터관리"], { header: 1 });
    for (let i = 4; i < s4.length; i++) {
      const row = s4[i];
      if (row && row[4]) {
        masterWorkers.push({
          no: row[0] || (masterWorkers.length + 1),
          company: row[1] || "(주)오륙",
          dept: row[2] || "",
          line: row[3] || "",
          name: row[4],
          position: row[5] || "작업원",
          employmentType: row[6] || "정규직",
          status: row[7] || "재직",
          note: row[8] || ""
        });
      }
    }
  }

  // Parse 9월_종합_현황판 or 일자별_근태정리본
  const s2Sheet = wb.Sheets["📊 9월_종합_현황판"] || wb.Sheets[wb.SheetNames[2]];
  if (s2Sheet) {
    const s2 = XLSX.utils.sheet_to_json(s2Sheet, { header: 1 });
    for (let r = 6; r < s2.length; r++) {
      const row = s2[r];
      if (!row || !row[4]) continue;
      const daily = {};
      for (let c = 5; c <= 34; c++) {
        const dayNum = c - 4;
        daily[dayNum] = row[c] !== undefined && row[c] !== null ? String(row[c]) : "";
      }
      attendanceMatrix.push({
        no: row[0] || (attendanceMatrix.length + 1),
        company: row[1] || "(주)오륙",
        dept: row[2] || "",
        line: row[3] || "",
        name: row[4],
        daily
      });
    }
  }

  if (attendanceMatrix.length === 0 && masterWorkers.length > 0) {
    attendanceMatrix = masterWorkers.map((m, idx) => ({
      no: idx + 1,
      company: m.company,
      dept: m.dept,
      line: m.line,
      name: m.name,
      daily: {}
    }));
  }

  return {
    year: 2026,
    month: 9,
    masterWorkers: masterWorkers.length > 0 ? masterWorkers : INITIAL_SMART_OVERTIME_DATA.masterWorkers,
    attendanceMatrix: attendanceMatrix.length > 0 ? attendanceMatrix : INITIAL_SMART_OVERTIME_DATA.attendanceMatrix
  };
};
