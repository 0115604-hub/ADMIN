import {
  cleanCompanyName,
  cleanWorkerNameOnly,
  calculateWorkerDailyHours,
  saveSmartOvertimeData,
  saveCompanyDayApprovalStatus,
  normalizeDept,
  exportSmartOvertimeToExcel,
  getLocalSmartOvertimeData
} from "../../services/overtimeSmartService.js";
import {
  getPlantForCompany,
  saveOvertimeReport
} from "../../services/overtimeService";
import { syncPlantOvertimeToApprovalBox } from "../../services/approvalService";
import {
  computeCopyPrevDayAttendance,
  computeFillAllFilteredWorkersRegular
} from "./overtimeAttendanceActions.js";

// 1-Click Update Worker Attendance for Selected Day
export const updateWorkerDayAttendance = async ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  effectiveMatrix,
  smartData,
  targetWorkerOrIndex,
  newCode,
  selectedDay,
  currentYear,
  currentMonthNum,
  selectedMonth,
  currentProfile,
  setSmartData,
  setHasUnsavedChanges,
  triggerToast
}) => {
  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }

  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);
  let targetIdx = -1;

  if (typeof targetWorkerOrIndex === "object" && targetWorkerOrIndex !== null) {
    if (typeof targetWorkerOrIndex.originalMatrixIndex === "number" && currentMatrix[targetWorkerOrIndex.originalMatrixIndex]) {
      targetIdx = targetWorkerOrIndex.originalMatrixIndex;
    } else {
      const wName = (targetWorkerOrIndex.name || "").trim();
      const wClean = cleanWorkerNameOnly(wName);
      const wComp = cleanCompanyName(targetWorkerOrIndex.company);
      targetIdx = currentMatrix.findIndex(
        (w) => ((w.name || "").trim() === wName || (wClean && cleanWorkerNameOnly(w.name) === wClean)) && cleanCompanyName(w.company) === wComp
      );
    }
  } else if (typeof targetWorkerOrIndex === "number") {
    targetIdx = targetWorkerOrIndex;
  }

  if (targetIdx === -1 || !currentMatrix[targetIdx]) return;

  const updatedMatrix = currentMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  const finalCode = (newCode !== undefined && newCode !== null) ? newCode : "";
  if (!finalCode || finalCode === "미입력") {
    delete updatedMatrix[targetIdx].daily[selectedDay];
    delete updatedMatrix[targetIdx].daily[String(selectedDay)];
  } else {
    updatedMatrix[targetIdx].daily[selectedDay] = finalCode;
    updatedMatrix[targetIdx].daily[String(selectedDay)] = finalCode;
  }

  const newLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix
  };

  setSmartData(newLedger);
  setHasUnsavedChanges(true);
  const targetComp = updatedMatrix[targetIdx]?.company;
  const workerName = updatedMatrix[targetIdx]?.name || "작업자";
  triggerToast(`💾 ${workerName} [${finalCode || "선택없음"}] 즉시 적용되었습니다.`);

  saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
    targetCompany: targetComp,
    targetDay: selectedDay,
    skipEventDispatch: true,
    auditMeta: {
      operator: currentProfile?.name || "현장관리자",
      source: "CELL_1CLICK_UPDATE",
      reason: `${workerName} Day ${selectedDay} 근태 변경: ${finalCode || "(미등록)"}`
    }
  }).catch((err) => console.warn("근태 백그라운드 저장 경고:", err));
};

// Custom Overtime Hours Direct Prompt
export const promptCustomOtHours = ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  worker,
  selectedDay,
  onUpdateAttendance
}) => {
  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }
  const currentVal = (worker.daily && (worker.daily[selectedDay] !== undefined ? worker.daily[selectedDay] : worker.daily[String(selectedDay)])) ?? "";
  const currentHours = calculateWorkerDailyHours(currentVal).weekdayOt || 2;
  const input = window.prompt(`⏱️ ${worker.name}님의 ${selectedDay}일 잔업 시간을 입력하세요.\n(시간 단위 숫자, 예: 1.5, 2, 3, 4, 5):`, currentHours);
  if (input !== null) {
    const parsed = parseFloat(input);
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed === 0) {
        onUpdateAttendance(worker, "정시");
      } else {
        onUpdateAttendance(worker, `잔업(+${parsed}H)`);
      }
    }
  }
};

// Submit Company Day Attendance (Weekday: auto-approve / Weekend: create special report)
export const submitCompanyDayAttendance = async ({
  selectedCompanyFilter,
  selectedDay,
  isWeekendDay,
  currentProfile,
  effectiveMatrix,
  smartData,
  currentYear,
  currentMonthNum,
  selectedMonth,
  legacyReports,
  setSmartData,
  setIsDayUnlockedForEdit,
  setHasUnsavedChanges,
  triggerToast,
  setLegacyReports,
  getDayLabel
}) => {
  const comp = selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter;
  const cleanComp = cleanCompanyName(comp);
  const d = selectedDay || 1;
  const isWk = isWeekendDay(d);
  const authorName = currentProfile?.name || "현장관리자";
  const nowTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);
  const updatedMatrix = currentMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  let autoFilledCount = 0;
  if (!isWk) {
    updatedMatrix.forEach((w) => {
      const wComp = cleanCompanyName(w.company);
      if (wComp === cleanComp) {
        const curVal = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
        const strVal = String(curVal || "").trim();
        if (!strVal || strVal === "미입력" || strVal === "undefined" || strVal === "null") {
          w.daily[d] = "🟢";
          w.daily[String(d)] = "🟢";
          autoFilledCount++;
        }
      }
    });
  }

  const compWorkers = updatedMatrix.filter((w) => cleanCompanyName(w.company) === cleanComp);
  const attended = compWorkers.filter((w) => {
    const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
    return calculateWorkerDailyHours(val).isAttended;
  }).length;
  const totalHours = compWorkers.reduce((sum, w) => {
    const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
    return sum + (calculateWorkerDailyHours(val).workHours || 0);
  }, 0);
  const otHours = compWorkers.reduce((sum, w) => {
    const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
    const { weekdayOt, weekendOt } = calculateWorkerDailyHours(val);
    return sum + (weekdayOt + weekendOt);
  }, 0);

  // 1️⃣ 평일 근태: 작성자 전결(APPROVED) 즉시 마감 처리
  if (!isWk) {
    const approvalKey = `${cleanComp}_${d}`;
    const statusData = {
      status: "APPROVED",
      submittedBy: authorName,
      submittedAt: nowTime,
      approvedBy: `${authorName} (작성자 전결)`,
      approvedAt: nowTime,
      attendedCount: attended,
      otHours,
      totalHours
    };
    const optimisticLedger = {
      ...smartData,
      year: currentYear,
      month: currentMonthNum,
      attendanceMatrix: updatedMatrix,
      companyApprovalStatus: {
        ...(smartData?.companyApprovalStatus || {}),
        [approvalKey]: {
          company: cleanComp,
          day: Number(d),
          ...statusData,
          updatedAt: new Date().toISOString()
        }
      }
    };

    setSmartData(optimisticLedger);
    setIsDayUnlockedForEdit(false);
    setHasUnsavedChanges(false);
    triggerToast(`✅ [${cleanComp}] ${currentMonthNum}월 ${d}일(${getDayLabel(d)}) 평일 근태가 등록 완료되었습니다.`);

    saveCompanyDayApprovalStatus(optimisticLedger, selectedMonth || "2026-10", cleanComp, d, statusData, { skipEventDispatch: true }).catch((err) => {
      console.error(err);
    });
    return;
  }

  // 2️⃣ 특근일(주말/공휴일): 5개사 개별 특근보고서 작성 및 상신
  const workDateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const plant = getPlantForCompany(cleanComp);
  const compSlugMap = { "오륙": "oryuk", "유성": "yuseong", "조영": "joyoung", "한울": "hanul", "부림텍": "burimtech" };
  const compSlug = compSlugMap[cleanComp] || "oryuk";
  const reportId = `report_ot_${compSlug}_${workDateStr.replace(/-/g, "_")}`;

  const reportItems = compWorkers.map((w, idx) => {
    const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? "";
    const { workHours, weekdayOt, weekendOt } = calculateWorkerDailyHours(val);
    return {
      no: idx + 1,
      company: cleanComp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      workerName: w.name,
      position: w.position || "사원",
      attendanceCode: val || "-",
      hours: workHours || 0,
      otHours: (weekdayOt || 0) + (weekendOt || 0),
      cost: (workHours || 0) * 15000
    };
  });

  const specialReport = {
    id: reportId,
    plant,
    company: cleanComp,
    companies: [cleanComp],
    workDate: workDateStr,
    workDateFormatted: `${workDateStr} (${getDayLabel(d)})`,
    title: `${currentMonthNum}월 ${d}일(${getDayLabel(d)}) ${cleanComp} 특근보고서`,
    reportCategory: "WEEKEND_SPECIAL",
    author: authorName,
    totalWorkers: attended,
    attendedWorkers: attended,
    totalHours,
    otHours,
    cost: totalHours * 15000,
    items: reportItems,
    reasons: [`[${cleanComp}] ${currentMonthNum}월 ${d}일(${getDayLabel(d)}) 휴일 특근 실시 (투입 ${attended}명 / ${totalHours} M/H)`],
    status: "PENDING",
    updatedAt: new Date().toISOString()
  };

  const approvalKey = `${cleanComp}_${d}`;
  const statusData = {
    status: "SUBMITTED",
    submittedBy: authorName,
    submittedAt: nowTime,
    attendedCount: attended,
    otHours,
    totalHours
  };

  const optimisticWeekendLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix,
    companyApprovalStatus: {
      ...(smartData?.companyApprovalStatus || {}),
      [approvalKey]: {
        company: cleanComp,
        day: Number(d),
        ...statusData,
        updatedAt: new Date().toISOString()
      }
    }
  };

  const nextReports = [
    specialReport,
    ...(legacyReports || []).filter((r) => r && r.id !== reportId)
  ];

  setLegacyReports(nextReports);
  setSmartData(optimisticWeekendLedger);
  setIsDayUnlockedForEdit(false);
  setHasUnsavedChanges(false);
  triggerToast(`📤 [${cleanComp}] ${currentMonthNum}월 ${d}일(${getDayLabel(d)}) 개별 특근보고서가 상신되었습니다.`);

  Promise.all([
    saveOvertimeReport(specialReport),
    saveCompanyDayApprovalStatus(optimisticWeekendLedger, selectedMonth || "2026-10", cleanComp, d, statusData, { skipEventDispatch: true }),
    syncPlantOvertimeToApprovalBox({
      plant,
      company: cleanComp,
      workDate: workDateStr,
      matrix: updatedMatrix,
      reports: nextReports
    })
  ]).catch((err) => {
    console.error("특근보고서 백그라운드 저장 경고:", err);
  });
};

// Approve Company Day Attendance
export const approveCompanyDayAttendance = async ({
  selectedCompanyFilter,
  selectedDay,
  smartData,
  currentProfile,
  currentMonthNum,
  setSmartData,
  setIsDayUnlockedForEdit,
  triggerToast,
  selectedMonth
}) => {
  const comp = selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter;
  const cleanComp = cleanCompanyName(comp);
  const d = selectedDay || 1;
  const approvalKey = `${cleanComp}_${d}`;

  const currentStatus = smartData?.companyApprovalStatus?.[approvalKey] || {};
  const statusData = {
    ...currentStatus,
    status: "APPROVED",
    approvedBy: currentProfile?.name || "권태형 대표",
    approvedAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  };

  const optimisticLedger = {
    ...smartData,
    companyApprovalStatus: {
      ...(smartData?.companyApprovalStatus || {}),
      [approvalKey]: {
        company: cleanComp,
        day: Number(d),
        ...statusData,
        updatedAt: new Date().toISOString()
      }
    }
  };

  setSmartData(optimisticLedger);
  setIsDayUnlockedForEdit(false);
  triggerToast(`🎉 [${cleanComp}] ${currentMonthNum}월 ${d}일 근태가 최종 승인(마감)되었습니다!`);

  saveCompanyDayApprovalStatus(optimisticLedger, selectedMonth || "2026-10", cleanComp, d, statusData).catch((err) => {
    console.error(err);
  });
};

// Unlock Company Day Attendance
export const unlockCompanyDayAttendance = async ({
  selectedCompanyFilter,
  selectedDay,
  effectiveMatrix,
  smartData,
  currentYear,
  currentMonthNum,
  setSmartData,
  setIsDayUnlockedForEdit,
  setHasUnsavedChanges,
  triggerToast,
  selectedMonth,
  currentProfile
}) => {
  const comp = selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter;
  const cleanComp = cleanCompanyName(comp);
  const d = selectedDay || 1;
  const approvalKey = `${cleanComp}_${d}`;

  const currentMatrix = (effectiveMatrix && effectiveMatrix.length > 0)
    ? [...effectiveMatrix]
    : (smartData?.attendanceMatrix || []);

  const updatedMatrix = currentMatrix.map((w) => {
    if (cleanCompanyName(w.company) !== cleanComp) return w;
    const newDaily = { ...(w.daily || {}) };
    delete newDaily[d];
    delete newDaily[String(d)];
    return {
      ...w,
      daily: newDaily
    };
  });

  const updatedApprovalStatus = { ...(smartData?.companyApprovalStatus || {}) };
  delete updatedApprovalStatus[approvalKey];

  const optimisticLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix,
    companyApprovalStatus: updatedApprovalStatus
  };

  setSmartData(optimisticLedger);
  setIsDayUnlockedForEdit(true);
  setHasUnsavedChanges(false);
  triggerToast(`🔓 [${cleanComp}] ${currentMonthNum}월 ${d}일 마감이 해제되고 근태가 초기화(작성전)되었습니다.`);

  saveSmartOvertimeData(optimisticLedger, selectedMonth || "2026-10", {
    targetCompany: cleanComp,
    targetDay: d,
    clearedDay: d,
    auditMeta: {
      operator: currentProfile?.name || "관리자",
      source: "UNLOCK_AND_CLEAR_DAY",
      reason: `${cleanComp} Day ${d} 마감 해제 및 당일 근태 초기화`
    }
  }).catch((err) => {
    console.error(err);
  });
};

// Copy Previous Day Attendance
export const copyAllFilteredWorkersSameAsPrevDay = async ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  filteredAttendanceWorkers,
  isWeekendDay,
  selectedDay,
  currentMonthNum,
  currentYear,
  daysInMonth,
  selectedCompanyFilter,
  effectiveMatrix,
  smartData,
  prevMonthData,
  prevYear,
  prevMonthNum,
  setSmartData,
  setHasUnsavedChanges,
  triggerToast,
  selectedMonth,
  currentProfile,
  getDayLabel
}) => {
  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }
  if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;

  if (isWeekendDay(selectedDay)) {
    triggerToast(`⚠️ 달력기준 특근일(${currentMonthNum}월 ${selectedDay}일 ${getDayLabel(selectedDay)}요일 - 주말/공휴일)은 '전일과동일' 적용 대상에서 제외됩니다.`);
    return;
  }

  const res = computeCopyPrevDayAttendance({
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
  });

  if (!res) return;
  const { updatedMatrix, appliedCount, sourceDayLabel, sourceMonthLabel, targetSourceDay } = res;

  const newLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix
  };

  setSmartData(newLedger);
  setHasUnsavedChanges(true);
  triggerToast(`📋 [${selectedCompanyFilter === "전체" ? "전사" : selectedCompanyFilter}] ${sourceMonthLabel} ${targetSourceDay}일(${sourceDayLabel}) 근태가 당일(${currentMonthNum}월 ${selectedDay}일)로 복사되었습니다. (${appliedCount}명)`);
  await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
    targetCompany: selectedCompanyFilter,
    targetDay: selectedDay,
    auditMeta: {
      operator: currentProfile?.name || "현장관리자",
      source: "COPY_PREV_DAY",
      reason: `${selectedCompanyFilter} Day ${selectedDay}에 ${sourceMonthLabel} ${targetSourceDay}일 근태 복사 (${appliedCount}명)`
    }
  });
};

// Fill Regular Hours
export const fillAllFilteredWorkersRegular = async ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  filteredAttendanceWorkers,
  isWeekendDay,
  selectedDay,
  effectiveMatrix,
  smartData,
  currentYear,
  currentMonthNum,
  setSmartData,
  setHasUnsavedChanges,
  triggerToast,
  selectedMonth,
  currentProfile
}) => {
  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }
  if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;

  const isWk = isWeekendDay(selectedDay);
  const { updatedMatrix, updatedCount } = computeFillAllFilteredWorkersRegular({
    filteredAttendanceWorkers,
    selectedDay,
    isWeekend: isWk,
    effectiveMatrix,
    smartData
  });

  const newLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix
  };

  setSmartData(newLedger);
  setHasUnsavedChanges(true);
  triggerToast(`${isWk ? "🌙" : "🟢"} [${selectedCompanyFilter === "전체" ? "5개사 전원" : selectedCompanyFilter}] ${updatedCount}명 ${currentMonthNum}월 ${selectedDay}일 ${isWk ? "특근(8H)" : "정시(🟢)"}로 일괄 선택되었습니다. (결근/연차 인원 보존)`);
  await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
    targetCompany: selectedCompanyFilter,
    targetDay: selectedDay,
    auditMeta: {
      operator: currentProfile?.name || "현장관리자",
      source: "BULK_SET_ALL_REGULAR",
      reason: `${currentMonthNum}월 ${selectedDay}일 전체 인원 정시 채우기 (${updatedCount}명)`
    }
  });
};

// Excel Export
export const exportExcelAttendance = ({
  matrixViewMonth,
  selectedMonth,
  smartData,
  prevYearMonth,
  prevMonthData,
  matrixCustomMonthData,
  triggerToast
}) => {
  try {
    const isCurrent = matrixViewMonth === (selectedMonth || "2026-10");
    const targetData = isCurrent
      ? smartData
      : matrixViewMonth === (prevYearMonth || "2026-09")
      ? (prevMonthData || getLocalSmartOvertimeData(prevYearMonth || "2026-09"))
      : (matrixCustomMonthData || getLocalSmartOvertimeData(matrixViewMonth));
    const filename = exportSmartOvertimeToExcel(targetData);
    triggerToast(`📥 엑셀 다운로드 완료 (${filename})`);
  } catch (err) {
    alert("엑셀 내보내기 중 오류가 발생했습니다: " + err.message);
  }
};
