import { cleanCompanyName, cleanWorkerNameOnly } from "../../services/overtimeSmartService.js";
import { getDayOfWeekKorean } from "./overtimeHelpers.jsx";
import { isWeekendByDate } from "../../services/overtimeService";

/**
 * 1-Click Copy Closest Previous Weekday's Attendance to Selected Day
 * Returns { updatedMatrix, appliedCount, sourceDayLabel, sourceMonthLabel, targetSourceDay } or null if skipped
 */
export function computeCopyPrevDayAttendance({
  filteredAttendanceWorkers,
  selectedDay,
  currentMonthNum,
  currentYear,
  daysInMonth,
  selectedCompanyFilter,
  effectiveMatrix,
  smartData,
  prevMonthData,
  prevYear,
  prevMonthNum
}) {
  const targetCompClean = cleanCompanyName(selectedCompanyFilter);

  // Helper: 해당 업체(독립 모듈)의 특정 일자에 입력된 근태 데이터가 존재하는지 확인
  const hasCompanyDataOnDay = (d, matrixSource) => {
    if (!d || d < 1) return false;
    return (matrixSource || []).some((w) => {
      if (selectedCompanyFilter !== "전체" && cleanCompanyName(w.company) !== targetCompClean) {
        return false;
      }
      const v = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
      const strV = String(v).trim();
      return strV && strV !== "-" && strV !== "휴무" && strV !== "미입력" && strV !== "undefined" && strV !== "null";
    });
  };

  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);

  let targetSourceDay = null;
  let sourceMatrix = currentMatrix;
  let sourceMonthLabel = `${currentMonthNum}월`;

  // 1. 선택된 업체의 직전 평일 탐색
  for (let d = selectedDay - 1; d >= 1; d--) {
    if (!isWeekendByDate(d, currentYear, currentMonthNum) && hasCompanyDataOnDay(d, currentMatrix)) {
      targetSourceDay = d;
      break;
    }
  }

  // 2. 이전 평일에 없으면 이후 평일 중 가장 가까운 작성된 평일 탐색
  if (!targetSourceDay) {
    for (let d = 1; d <= daysInMonth; d++) {
      if (d !== selectedDay && !isWeekendByDate(d, currentYear, currentMonthNum) && hasCompanyDataOnDay(d, currentMatrix)) {
        targetSourceDay = d;
        break;
      }
    }
  }

  // 3. 당월 평일에 없으면 전월(prevMonthData) 마지막 평일 탐색
  if (!targetSourceDay && prevMonthData && Array.isArray(prevMonthData.attendanceMatrix)) {
    const prevDaysCount = new Date(prevYear, prevMonthNum, 0).getDate();
    for (let d = prevDaysCount; d >= 1; d--) {
      if (!isWeekendByDate(d, prevYear, prevMonthNum) && hasCompanyDataOnDay(d, prevMonthData.attendanceMatrix)) {
        targetSourceDay = d;
        sourceMatrix = prevMonthData.attendanceMatrix;
        sourceMonthLabel = `${prevMonthNum}월`;
        break;
      }
    }
  }

  // 4. 그래도 없으면 직전 평일 일자 선택
  if (!targetSourceDay) {
    for (let d = selectedDay - 1; d >= 1; d--) {
      if (!isWeekendByDate(d, currentYear, currentMonthNum)) {
        targetSourceDay = d;
        break;
      }
    }
  }
  if (!targetSourceDay) {
    targetSourceDay = 1;
  }

  const sourceDayLabel = sourceMatrix === currentMatrix
    ? getDayOfWeekKorean(targetSourceDay, currentYear, currentMonthNum)
    : getDayOfWeekKorean(targetSourceDay, prevYear, prevMonthNum);

  const updatedMatrix = currentMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));
  let appliedCount = 0;

  filteredAttendanceWorkers.forEach((worker) => {
    let idx = -1;
    if (typeof worker.originalMatrixIndex === "number" && updatedMatrix[worker.originalMatrixIndex]) {
      idx = worker.originalMatrixIndex;
    } else {
      const wClean = cleanWorkerNameOnly(worker.name);
      const wComp = cleanCompanyName(worker.company);
      idx = updatedMatrix.findIndex(
        (mw) => ((mw.name || "").trim() === (worker.name || "").trim() || (wClean && cleanWorkerNameOnly(mw.name) === wClean)) && cleanCompanyName(mw.company) === wComp
      );
    }

    if (idx >= 0 && updatedMatrix[idx]) {
      let sourceVal = "";
      if (sourceMatrix === currentMatrix) {
        sourceVal = (updatedMatrix[idx].daily && (updatedMatrix[idx].daily[targetSourceDay] !== undefined ? updatedMatrix[idx].daily[targetSourceDay] : updatedMatrix[idx].daily[String(targetSourceDay)])) ?? "";
      } else {
        const pWorker = sourceMatrix.find(
          (pw) => cleanCompanyName(pw.company) === cleanCompanyName(worker.company) && (pw.name === worker.name || (cleanWorkerNameOnly(pw.name) === cleanWorkerNameOnly(worker.name)))
        );
        if (pWorker) {
          sourceVal = (pWorker.daily && (pWorker.daily[targetSourceDay] !== undefined ? pWorker.daily[targetSourceDay] : pWorker.daily[String(targetSourceDay)])) ?? pWorker[targetSourceDay] ?? "";
        }
      }

      let codeToApply = String(sourceVal || "").trim();
      if (!codeToApply || codeToApply === "undefined" || codeToApply === "null" || codeToApply === "미입력") {
        codeToApply = "🟢";
      }
      updatedMatrix[idx].daily[selectedDay] = codeToApply;
      updatedMatrix[idx].daily[String(selectedDay)] = codeToApply;
      appliedCount++;
    }
  });

  return {
    updatedMatrix,
    appliedCount,
    sourceDayLabel,
    sourceMonthLabel,
    targetSourceDay
  };
}

/**
 * 1-Click Set Missing Workers to Regular/Overtime
 * Returns { updatedMatrix, updatedCount }
 */
export function computeFillMissingWorkersRegular({
  missingAttendanceWorkers,
  selectedDay,
  isWeekend,
  effectiveMatrix,
  smartData
}) {
  const targetCode = isWeekend ? "특근" : "🟢";
  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);
  const updatedMatrix = currentMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  let updatedCount = 0;
  missingAttendanceWorkers.forEach((worker) => {
    let idx = -1;
    if (typeof worker.originalMatrixIndex === "number" && updatedMatrix[worker.originalMatrixIndex]) {
      idx = worker.originalMatrixIndex;
    } else {
      const wClean = cleanWorkerNameOnly(worker.name);
      const wComp = cleanCompanyName(worker.company);
      idx = updatedMatrix.findIndex(
        (mw) => ((mw.name || "").trim() === (worker.name || "").trim() || (wClean && cleanWorkerNameOnly(mw.name) === wClean)) && cleanCompanyName(mw.company) === wComp
      );
    }

    if (idx >= 0 && updatedMatrix[idx]) {
      const currentVal = String(updatedMatrix[idx].daily[selectedDay] || "").trim();
      if (!currentVal || currentVal === "미입력" || currentVal === "undefined" || currentVal === "null") {
        updatedMatrix[idx].daily[selectedDay] = targetCode;
        updatedMatrix[idx].daily[String(selectedDay)] = targetCode;
        updatedCount++;
      }
    }
  });

  return { updatedMatrix, updatedCount };
}

/**
 * 1-Click Set All Filtered Workers to Regular/Overtime
 * Preserves 결근/병결/사결/공결/연차/휴가/병가
 * Returns { updatedMatrix, updatedCount }
 */
export function computeFillAllFilteredWorkersRegular({
  filteredAttendanceWorkers,
  selectedDay,
  isWeekend,
  effectiveMatrix,
  smartData
}) {
  const targetCode = isWeekend ? "특근" : "🟢";
  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);

  const updatedMatrix = currentMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  let updatedCount = 0;
  filteredAttendanceWorkers.forEach((worker) => {
    let idx = -1;
    if (typeof worker.originalMatrixIndex === "number" && updatedMatrix[worker.originalMatrixIndex]) {
      idx = worker.originalMatrixIndex;
    } else {
      const wClean = cleanWorkerNameOnly(worker.name);
      const wComp = cleanCompanyName(worker.company);
      idx = updatedMatrix.findIndex(
        (mw) => ((mw.name || "").trim() === (worker.name || "").trim() || (wClean && cleanWorkerNameOnly(mw.name) === wClean)) && cleanCompanyName(mw.company) === wComp
      );
    }

    if (idx >= 0 && updatedMatrix[idx]) {
      const existingVal = String(updatedMatrix[idx].daily[selectedDay] || "").trim();
      if (
        existingVal === "결근" ||
        existingVal === "병결" ||
        existingVal === "사결" ||
        existingVal === "공결" ||
        existingVal === "연차" ||
        existingVal === "휴가" ||
        existingVal === "병가"
      ) {
        return;
      }
      updatedMatrix[idx].daily[selectedDay] = targetCode;
      updatedMatrix[idx].daily[String(selectedDay)] = targetCode;
      updatedCount++;
    }
  });

  return { updatedMatrix, updatedCount };
}

/**
 * Clear Selected Day Attendance Matrix
 * Returns { updatedMatrix, updatedApprovalStatus }
 */
export function computeClearDayAttendance({
  smartData,
  selectedCompanyFilter,
  selectedDay,
  companiesList = []
}) {
  const currentMatrix = smartData.attendanceMatrix || [];
  const updatedMatrix = currentMatrix.map((w) => {
    const wComp = cleanCompanyName(w.company);
    const isTarget = selectedCompanyFilter === "전체" || wComp === cleanCompanyName(selectedCompanyFilter);
    if (!isTarget) return w;
    const newDaily = { ...(w.daily || {}) };
    delete newDaily[selectedDay];
    delete newDaily[String(selectedDay)];
    return {
      ...w,
      daily: newDaily
    };
  });

  const updatedApprovalStatus = { ...(smartData.companyApprovalStatus || {}) };
  if (selectedCompanyFilter === "전체") {
    companiesList.forEach((c) => {
      delete updatedApprovalStatus[`${cleanCompanyName(c)}_${selectedDay}`];
    });
  } else {
    delete updatedApprovalStatus[`${cleanCompanyName(selectedCompanyFilter)}_${selectedDay}`];
  }

  return { updatedMatrix, updatedApprovalStatus };
}
