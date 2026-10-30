import { getWorkerPersonnelCard } from "../../services/personnelCardService.js";
import {
  COMPANIES,
  cleanCompanyName,
  normalizeDept
} from "../../services/overtimeSmartService.js";
import { isWeekendByDate } from "../../services/overtimeService";
import { getReportDateSortKey } from "./overtimeHelpers.jsx";

// Calculate dates and days in month
export const calculateDateContext = (selectedMonth, prevYearMonth, matrixViewMonth) => {
  const parts = (selectedMonth || "2026-10").split("-").map(Number);
  const currentYear = parts[0] || 2026;
  const currentMonthNum = parts[1] || 10;
  const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();

  const prevParts = (prevYearMonth || "2026-09").split("-").map(Number);
  const prevYear = prevParts[0] || 2026;
  const prevMonthNum = prevParts[1] || 9;

  const matrixParts = (matrixViewMonth || selectedMonth || "2026-10").split("-").map(Number);
  const matrixYear = matrixParts[0] || 2026;
  const matrixMonthNum = matrixParts[1] || 10;
  const matrixDaysInMonth = new Date(matrixYear, matrixMonthNum, 0).getDate();

  return {
    currentYear,
    currentMonthNum,
    daysInMonth,
    prevYear,
    prevMonthNum,
    matrixYear,
    matrixMonthNum,
    matrixDaysInMonth
  };
};

// Calculate previous month string YYYY-MM
export const calculatePrevYearMonth = (currentYear, currentMonthNum) => {
  let y = currentYear;
  let m = currentMonthNum - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
};

// Worker management list filtering and enrichment
export const buildWorkerMgmtList = ({
  attendanceMatrix,
  personnelCardsMap,
  workerMgmtCompanyFilter,
  workerMgmtSkillFilter,
  workerMgmtMultiSkillOnly,
  workerMgmtSearch
}) => {
  const compCounters = {};
  const matrix = (attendanceMatrix || []).map((w, originalIdx) => {
    const c = cleanCompanyName(w.company);
    compCounters[c] = (compCounters[c] || 0) + 1;
    const cardKey = `${c}_${w.name}`;
    const existingSavedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
    const card = existingSavedCard
      ? getWorkerPersonnelCard({ ...w, personnelCard: existingSavedCard }, compCounters[c])
      : getWorkerPersonnelCard(w, compCounters[c]);
    return {
      ...w,
      dept: card.dept || normalizeDept(w.dept),
      position: card.position || w.position || "사원",
      companyNo: compCounters[c],
      originalMatrixIndex: originalIdx,
      personnelCard: card,
      card
    };
  });

  return matrix.filter((w) => {
    if (workerMgmtCompanyFilter && workerMgmtCompanyFilter !== "전체") {
      if (cleanCompanyName(w.company) !== cleanCompanyName(workerMgmtCompanyFilter)) return false;
    }

    if (workerMgmtSkillFilter !== "ALL") {
      const targetLvl = Number(workerMgmtSkillFilter);
      if (w.card?.skillLevel !== targetLvl) return false;
    }

    if (workerMgmtMultiSkillOnly && !w.card?.isMultiSkill) {
      return false;
    }

    if (workerMgmtSearch && workerMgmtSearch.trim()) {
      const q = workerMgmtSearch.trim().toLowerCase();
      const str = `${w.name} ${w.company} ${w.dept} ${w.line} ${w.position} ${w.card?.empNo || ""} ${w.card?.mainProcess || ""} ${(w.card?.subProcesses || []).join(" ")}`.toLowerCase();
      if (!str.includes(q)) return false;
    }

    return true;
  }).sort((a, b) => {
    const orderA = COMPANIES.indexOf(cleanCompanyName(a.company));
    const orderB = COMPANIES.indexOf(cleanCompanyName(b.company));
    const compDiff = (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    if (compDiff !== 0) return compDiff;
    return (a.companyNo || 0) - (b.companyNo || 0);
  });
};

// Calculate worker management statistics
export const calculateWorkerMgmtStats = (workerMgmtList) => {
  const list = workerMgmtList || [];
  const total = list.length;
  let masterCount = 0;
  let multiSkillCount = 0;
  list.forEach((w) => {
    const card = w.card || w.personnelCard || {};
    if (card.skillLevel >= 4) masterCount++;
    if (card.isMultiSkill) multiSkillCount++;
  });
  return {
    total,
    masterCount,
    multiSkillCount,
    cardCompleteRate: "100%"
  };
};

// Calculate unwritten companies for top cards
export const calculateUnwrittenCompanies = ({
  selectedDay,
  currentYear,
  currentMonthNum,
  legacyReports,
  smartData,
  effectiveMatrix
}) => {
  const d = selectedDay || 1;
  const targetDateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return COMPANIES.filter((comp) => {
    const cleanComp = cleanCompanyName(comp);
    // 당일 원장 상의 근태 입력 인원수 (단일 진실 원천: 1명 이상 실제 등록 시 작성후)
    const compWorkers = (effectiveMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp);
    if (compWorkers.length === 0) return true;

    const enteredCount = compWorkers.filter((w) => {
      const v = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)];
      const str = String(v ?? "").trim();
      return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
    }).length;

    // 실제 입력된 인원이 1명 이상이어야만 작성후(!isUnwritten)로 판정 (캐시/보고서/더미 의존 영구 제거)
    const isWritten = enteredCount > 0;
    return !isWritten;
  }).map((name) => ({ name, shortName: name.replace(/[()주]/g, "") }));
};

// Filtered attendance rows for Daily Input and Summary tabs
export const buildFilteredAttendanceWorkers = ({
  effectiveMatrix,
  personnelCardsMap,
  selectedCompanyFilter
}) => {
  const compCounters = {};
  const matrixWithCompanyNo = (effectiveMatrix || []).map((w, originalIdx) => {
    const c = cleanCompanyName(w.company);
    compCounters[c] = (compCounters[c] || 0) + 1;
    const cardKey = `${c}_${w.name}`;
    const existingSavedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
    const card = existingSavedCard
      ? getWorkerPersonnelCard({ ...w, personnelCard: existingSavedCard }, compCounters[c])
      : getWorkerPersonnelCard(w, compCounters[c]);
    return {
      ...w,
      dept: card.dept || normalizeDept(w.dept),
      position: card.position || w.position || "사원",
      mainProcess: card.mainProcess || w.mainProcess || "",
      empNo: card.empNo || w.empNo || "",
      skillLevel: card.skillLevel || 1,
      isMultiSkill: card.isMultiSkill || false,
      companyNo: compCounters[c],
      originalMatrixIndex: originalIdx,
      personnelCard: card,
      card
    };
  });

  let list = matrixWithCompanyNo;
  if (selectedCompanyFilter !== "전체") {
    list = list.filter((w) => cleanCompanyName(w.company) === cleanCompanyName(selectedCompanyFilter));
  }
  return [...list].sort((a, b) => {
    const orderA = COMPANIES.indexOf(cleanCompanyName(a.company));
    const orderB = COMPANIES.indexOf(cleanCompanyName(b.company));
    const compDiff = (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    if (compDiff !== 0) return compDiff;
    return (a.companyNo || 0) - (b.companyNo || 0);
  });
};
