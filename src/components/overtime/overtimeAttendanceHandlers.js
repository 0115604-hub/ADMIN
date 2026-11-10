
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

// ⭐ 근태 작성/수정 허용 사용자 검증 (조인주, 오상민, 유성대표, 부림텍대표, 한울대표, 최고관리자)
export const isAuthorizedAttendanceWriter = (profile, isAdmin = false) => {
  if (isAdmin) return true;
  const role = profile?.role;
  const name = String(profile?.name || "").trim();
  const id = String(profile?.id || "").trim();
  const comp = String(profile?.company || "").trim();

  // 최고 관리자
  if (role === "ADMIN" || role === "CEO" || id === "admin_kwon" || id === "admin_choi" || name === "권태형" || name === "최미영") {
    return true;
  }

  // 1. 조인주 (삼랑진공장 오륙 근태관리 선임)
  if (name === "조인주" || id === "sam_ij") return true;

  // 2. 오상민 (한림공장 가공동 관리 선임)
  if (name === "오상민" || id === "hal_sm") return true;

  // 3. 유성 대표 (유성 대표이사)
  if (name === "유성" || comp === "유성" || id === "sam_ys") return true;

  // 4. 부림텍 대표 (부림텍 대표이사)
  if (name === "부림텍" || comp === "부림텍" || id === "hal_br") return true;

  // 5. 한울 대표 (한울 대표이사)
  if (name === "한울" || comp === "한울" || id === "hal_hu") return true;

  return false;
};

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
  isAdmin,
  setSmartData,
  setHasUnsavedChanges,
  triggerToast
}) => {
  // 권한 체크
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    triggerToast("⚠️ 근태 작성 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }

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

// Prompt Custom OT Hours
export const promptCustomOtHours = ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  worker,
  selectedDay,
  currentProfile,
  isAdmin,
  onUpdateAttendance,
  triggerToast
}) => {
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    if (triggerToast) triggerToast("⚠️ 근태 작성 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }
  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }
  const cleanWorkerName = worker.name ? worker.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";
  const curVal = (worker.daily && (worker.daily[selectedDay] !== undefined ? worker.daily[selectedDay] : worker.daily[String(selectedDay)])) ?? "";
  const input = window.prompt(
    `[${cleanWorkerName}] ${selectedDay}일 잔업/특근 인정시간(H)을 직접 입력하세요:\n\n예: 2, 2.5, 4, 8, 11 (또는 19시, 21시)`,
    curVal || "2.5"
  );
  if (input !== null) {
    const trimmed = input.trim();
    if (trimmed) {
      onUpdateAttendance(worker, trimmed);
    }
  }
};

// Submit Company Day Attendance (평일: 작성자전결 마감 / 주말: 개별 특근보고서 상신)
export const submitCompanyDayAttendance = async ({
  selectedCompanyFilter,
  selectedDay,
  isWeekendDay,
  currentProfile,
  isAdmin,
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
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    triggerToast("⚠️ 근태 작성 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }

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
      if (cleanCompanyName(w.company) === cleanComp) {
        if (!w.daily) w.daily = {};
        const strVal = String((w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)]) || "").trim();
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
      workDate: workDateStr
    })
  ]).catch((err) => {
    console.error("특근보고서 상신 에러:", err);
  });
};

// Approve Company Day Attendance (최종 승인)
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
  const existing = smartData?.companyApprovalStatus?.[approvalKey] || {};
  const nowTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const statusData = {
    ...existing,
    status: "APPROVED",
    approvedBy: currentProfile?.name || "권태형 대표이사",
    approvedAt: nowTime
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
  triggerToast(`🎉 [${cleanComp}] ${currentMonthNum}월 ${d}일 근태가 최종 승인(마감)되었습니다.`);

  await saveCompanyDayApprovalStatus(optimisticLedger, selectedMonth || "2026-10", cleanComp, d, statusData, { skipEventDispatch: true });
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
  currentProfile,
  isAdmin
}) => {
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    triggerToast("⚠️ 근태 해제/수정 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }

  const comp = selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter;
  const cleanComp = cleanCompanyName(comp);
  const d = selectedDay || 1;
  const approvalKey = `${cleanComp}_${d}`;

  const optimisticLedger = {
    ...smartData,
    companyApprovalStatus: {
      ...(smartData?.companyApprovalStatus || {}),
      [approvalKey]: {
        company: cleanComp,
        day: Number(d),
        status: "DRAFT",
        unlockedBy: currentProfile?.name || "관리자",
        unlockedAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        updatedAt: new Date().toISOString()
      }
    }
  };

  setSmartData(optimisticLedger);
  setIsDayUnlockedForEdit(true);
  setHasUnsavedChanges(true);
  triggerToast(`🔓 [${cleanComp}] ${currentMonthNum}월 ${d}일 마감이 해제되었습니다. 수정 후 다시 등록하세요.`);

  await saveCompanyDayApprovalStatus(
    optimisticLedger,
    selectedMonth || "2026-10",
    cleanComp,
    d,
    { status: "DRAFT" },
    { skipEventDispatch: true }
  );
};

// Copy Prev Day Attendance
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
  isAdmin,
  getDayLabel
}) => {
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    triggerToast("⚠️ 근태 작성 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }

  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }

  const { updatedMatrix, copiedCount, sourceDateLabel } = computeCopyPrevDayAttendance({
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
    getDayLabel
  });

  if (copiedCount === 0) {
    triggerToast("복사할 대상 작업자가 없거나 직전 평일 근태가 존재하지 않습니다.");
    return;
  }

  const newLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix
  };

  setSmartData(newLedger);
  setHasUnsavedChanges(true);
  triggerToast(`📋 [${sourceDateLabel}] 근태가 [${selectedCompanyFilter === "전체" ? "전체" : selectedCompanyFilter}] ${copiedCount}명에게 복사되었습니다.`);

  saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
    targetCompany: selectedCompanyFilter === "전체" ? undefined : selectedCompanyFilter,
    targetDay: selectedDay,
    skipEventDispatch: true,
    auditMeta: {
      operator: currentProfile?.name || "현장관리자",
      source: "COPY_PREV_DAY",
      reason: `Day ${selectedDay}에 ${sourceDateLabel} 근태 일괄 복사 (${copiedCount}명)`
    }
  }).catch((err) => console.warn("일괄 복사 저장 경고:", err));
};

// Fill All Filtered Workers Regular
export const fillAllFilteredWorkersRegular = async ({
  isDayLocked,
  setIsDayUnlockedForEdit,
  filteredAttendanceWorkers,
  isWeekendDay,
  selectedDay,
  currentMonthNum,
  currentYear,
  selectedCompanyFilter,
  effectiveMatrix,
  smartData,
  setSmartData,
  setHasUnsavedChanges,
  triggerToast,
  selectedMonth,
  currentProfile,
  isAdmin
}) => {
  if (!isAuthorizedAttendanceWriter(currentProfile, isAdmin)) {
    triggerToast("⚠️ 근태 작성 권한이 없습니다. (조인주, 오상민, 유성대표, 부림텍대표, 한울대표만 가능)");
    return;
  }

  if (isDayLocked) {
    setIsDayUnlockedForEdit(true);
  }

  const { updatedMatrix, updatedCount, defaultCode } = computeFillAllFilteredWorkersRegular({
    filteredAttendanceWorkers,
    isWeekendDay,
    selectedDay,
    currentMonthNum,
    currentYear,
    selectedCompanyFilter,
    effectiveMatrix,
    smartData
  });

  if (updatedCount === 0) {
    triggerToast("반영할 작업자가 없습니다.");
    return;
  }

  const newLedger = {
    ...smartData,
    year: currentYear,
    month: currentMonthNum,
    attendanceMatrix: updatedMatrix
  };

  setSmartData(newLedger);
  setHasUnsavedChanges(true);
  triggerToast(`⚡ [${selectedCompanyFilter === "전체" ? "전체" : selectedCompanyFilter}] 작업자 ${updatedCount}명 근태가 [${defaultCode}]로 일괄 적용되었습니다.`);

  saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
    targetCompany: selectedCompanyFilter === "전체" ? undefined : selectedCompanyFilter,
    targetDay: selectedDay,
    skipEventDispatch: true,
    auditMeta: {
      operator: currentProfile?.name || "현장관리자",
      source: "FILL_REGULAR_ALL",
      reason: `Day ${selectedDay} [${defaultCode}] 일괄 적용 (${updatedCount}명)`
    }
  }).catch((err) => console.warn("일괄 출근 저장 경고:", err));
};

// Export Excel Attendance
export const exportExcelAttendance = async ({
  smartData,
  currentYear,
  currentMonthNum,
  selectedMonth,
  selectedCompanyFilter,
  daysInMonth,
  getKoreanHolidayInfo,
  getDayLabel,
  triggerToast
}) => {
  try {
    triggerToast("📊 엑셀 내보내기 파일을 생성 중입니다...");
    await exportSmartOvertimeToExcel({
      matrix: smartData?.attendanceMatrix || [],
      year: currentYear,
      month: currentMonthNum,
      selectedMonth,
      filterCompany: selectedCompanyFilter === "전체" ? "" : selectedCompanyFilter,
      daysInMonth,
      getKoreanHolidayInfo,
      getDayLabel
    });
    triggerToast("✅ 엑셀 파일이 성공적으로 다운로드되었습니다.");
  } catch (err) {
    console.error("Excel export error:", err);
    triggerToast("❌ 엑셀 내보내기 중 오류가 발생했습니다.");
  }
};
