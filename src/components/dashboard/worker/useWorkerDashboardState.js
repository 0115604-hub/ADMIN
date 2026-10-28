import { useState, useEffect, useMemo } from "react";
import { useAuth, isManagerOrAdminUser } from "../../../context/AuthContext";
import { useMonth } from "../../../context/MonthContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { getLocalAccessLogs, subscribeAccessLogs } from "../../../services/accessLogService";
import { formatKoreanWorkDate } from "../../../services/overtimeService";
import { getKSTDateString, formatRelativeAccessTime } from "../../../utils/dateUtils";
import { pushModalHistory } from "../../../utils/modalHistory";
import { isExtrusionWorkerProfile } from "../../../services/extrusionQualityIssueService";
import { isHanulWorkerProfile } from "../../../services/hanulQualityIssueService";
import { isMachiningWorkerProfile } from "../../../services/machiningQualityIssueService";
import { isYuseongWorkerProfile } from "../../../services/yuseongQualityIssueService";
import { getWorkerPersonnelCard, isWorkerManagerRole } from "../../../services/personnelCardService";

import {
  useCommonSchedule,
  useWorkerSchedule,
  useDashboardExcel,
  useWorkLogCrud,
  useWorkerCompanyAttendance,
  useWorkerQualityMetrics
} from "../../../hooks/dashboard";

/**
 * useWorkerDashboardState
 * Main Facade Hook for Worker & Manager Dashboard:
 * Coordinates worker identity, schedules, work log CRUD, excel processing,
 * 5-company attendance matrix, and plant quality metrics into a single Lego architecture.
 */
export function useWorkerDashboardState({ onBulkUpload, onNavigateTab }) {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, currentMonthData, uploadMonthlyData, availableMonths, changeMonth, currentYearMonth, allMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  // Worker Identity & Role calculations
  const isManagerRole = isWorkerManagerRole(currentProfile);
  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const isSamrangjin = workerPlant === "삼랑진공장" || String(currentProfile?.id || "").startsWith("sam_");
  const isHallim = workerPlant === "한림공장" || String(currentProfile?.id || "").startsWith("hal_");
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || (
    currentProfile?.name === "공영국" ? "대리" :
    ["심임대", "이상은", "박종미", "최현영"].includes(currentProfile?.name) ? "반장" :
    currentProfile?.name === "설유철" ? "책임" :
    (isManagerRole ? "반장" : "사원")
  );
  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isJaeyul = currentProfile?.name === "전재율" || currentProfile?.id === "sam_jy" || currentProfile?.assignedProcess === "설비보전";
  const isQualityWorker = currentProfile?.assignedProcess === "품질관리" || currentProfile?.name === "이창엽" || currentProfile?.name === "이상기" || currentProfile?.id === "sam_cy" || currentProfile?.id === "sam_sg";
  const isExtrusionWorker =
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    isExtrusionWorkerProfile(currentProfile);

  // 한울 관리자 (대표이사 hal_hu, 황수현 대표 등 가공/협력업체 한울 관리자)
  const isHanulManager = Boolean(
    currentProfile?.name === "한울" ||
    currentProfile?.id === "hal_hu" ||
    currentProfile?.name === "황수현" ||
    String(currentProfile?.id || "").startsWith("hal_hu") ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("한울") || currentProfile?.company === "한울"))
  );

  // 한울 전체 (관리자 + 작업자)
  const isHanul = isHanulManager || Boolean(
    !isExtrusionWorker && (
      currentProfile?.company?.includes("한울") ||
      currentProfile?.company === "한울" ||
      currentProfile?.name === "한울" ||
      String(currentProfile?.id || "").startsWith("hal_hu") ||
      isHanulWorkerProfile(currentProfile)
    )
  );

  // 부림텍 관리자 (김동훈 책임, 대표이사 hal_br 등)
  const isBurimtechManager = Boolean(
    currentProfile?.name === "부림텍" ||
    currentProfile?.id === "hal_br" ||
    currentProfile?.name === "김동훈" ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("부림") || currentProfile?.company === "부림텍"))
  );

  const isBurimtech = isBurimtechManager || Boolean(
    !isExtrusionWorker && !isHanul && (
      currentProfile?.portalType === "bulimtech" ||
      currentProfile?.company?.includes("부림") ||
      currentProfile?.name === "부림텍" ||
      currentProfile?.name === "김동훈" ||
      String(currentProfile?.id || "").startsWith("hal_br_")
    )
  );

  // 유성 관리자 (이성기 선임, 대표이사 sam_ys 등)
  const isYuseongManager = Boolean(
    currentProfile?.name === "유성" ||
    currentProfile?.id === "sam_ys" ||
    currentProfile?.name === "이성기" ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("유성") || currentProfile?.company === "유성"))
  );

  // 협력사 대표/관리자 판별 (한울, 부림텍, 유성 등)
  const isPartnerProfile = Boolean(
    isHanulManager ||
    isBurimtechManager ||
    isYuseongManager ||
    (!currentProfile?.isFieldWorker && (
      currentProfile?.isPartner ||
      currentProfile?.name === "유성" ||
      currentProfile?.name === "한울" ||
      currentProfile?.name === "부림텍" ||
      currentProfile?.company === "유성" ||
      currentProfile?.company === "한울" ||
      currentProfile?.company === "부림텍" ||
      (!String(currentProfile?.id || "").includes("_") && (currentProfile?.company === "유성" || currentProfile?.company === "한울" || currentProfile?.company === "부림텍"))
    ))
  );

  const assignedProcess = currentProfile?.assignedProcess || (
    currentProfile?.building === "압출동" ? "압출" :
    isExtrusionWorker ? "압출" :
    isHanul ? "가공/협력업체 (한울)" :
    isBurimtech ? "가공/협력업체 (부림텍)" :
    isPartnerProfile ? "가공/협력업체" :
    "가공"
  );

  const workerCard = useMemo(() => {
    return getWorkerPersonnelCard(currentProfile || {});
  }, [currentProfile]);

  const isJaeyulWorker = isJaeyul || currentProfile?.name === "전재율" || currentProfile?.assignedProcess === "설비보전";
  const isHeadquarterUser = isAdmin || currentProfile?.role === "ADMIN" || currentProfile?.name === "권태형" || currentProfile?.name === "최미영" || currentProfile?.plant === "본사";
  const isMyeongjae = currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj";
  const isDongwook = currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw";
  const isGeneralManager = isMyeongjae || isDongwook || isAdmin || currentProfile?.assignedProcess === "총괄관리";

  const workerDept = isPartnerProfile
    ? (currentProfile?.name || currentProfile?.company || "유성")
    : isHeadquarterUser
    ? "본사 관리팀"
    : (isGeneralManager || isInjoo || currentProfile?.assignedProcess === "총괄관리" || currentProfile?.assignedProcess === "관리팀")
    ? "관리팀"
    : (isJaeyulWorker ? "설비보전팀" : isQualityWorker ? "품질관리팀" : isExtrusionWorker ? "압출관리팀" : (workerCard?.dept || "생산팀"));
  const workerPosition = isPartnerProfile
    ? "대표이사"
    : (officialTitle || workerCard?.position || "사원");
  const isManagerOrAdmin = isManagerOrAdminUser(currentProfile, isAdmin);
  const isExtrusionWorkerOnly = isExtrusionWorkerProfile(currentProfile);

  // Operator Worker Role Bools
  const isExtrusionOperatorWorker =
    isExtrusionWorkerProfile(currentProfile) &&
    currentProfile?.name !== "설유철" &&
    currentProfile?.id !== "sam_yc" &&
    !isAdmin;

  const isHanulOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isHanulWorkerProfile(currentProfile) &&
    !isAdmin;

  const isMachiningOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isMachiningWorkerProfile(currentProfile) &&
    !isAdmin;

  const isYuseongOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isYuseongWorkerProfile(currentProfile) &&
    !isAdmin;

  const isOperatorWorker =
    isExtrusionOperatorWorker ||
    isHanulOperatorWorker ||
    isMachiningOperatorWorker ||
    isYuseongOperatorWorker;

  // Shared Toast states
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");

  const todayDateStr = useMemo(() => getKSTDateString(), []);

  // 오늘 날짜 포맷 (예: 9월 14일 (월))
  const todayFormattedLabel = useMemo(() => {
    const todayStr = getKSTDateString();
    const parts = todayStr.split("-");
    if (parts.length === 3) {
      const dateObj = new Date(`${todayStr}T00:00:00+09:00`);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[dateObj.getDay()] || "";
      return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일 (${dayName})`;
    }
    return todayStr;
  }, []);

  // Safe selected month & PnL metrics
  const safeSelectedMonth = selectedMonth || "2026-09";
  const monthParts = safeSelectedMonth.split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "09"}월`;

  const totalSales = currentMonthData?.salesSummary?.totalSales || currentMonthData?.totalSales || 0;
  const totalPurchases =
    currentMonthData?.purchaseSummary?.ledgerBenchmark ||
    currentMonthData?.purchaseSummary?.totalExpenses ||
    currentMonthData?.jajaeSummary?.totalAmount ||
    currentMonthData?.totalExpenses ||
    0;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "0.0";

  const prevMonthKey = useMemo(() => {
    if (!safeSelectedMonth) return "2026-08";
    const [y, m] = safeSelectedMonth.split("-").map(Number);
    const prevD = new Date(y || 2026, (m || 9) - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [safeSelectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || prevMonthData?.totalSales || 0;
  const prevPurchases =
    prevMonthData?.purchaseSummary?.ledgerBenchmark ||
    prevMonthData?.purchaseSummary?.totalExpenses ||
    prevMonthData?.jajaeSummary?.totalAmount ||
    prevMonthData?.totalExpenses ||
    0;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "100.0";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "100.0";

  // Access Logs State for ADMIN
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState(null);
  const [accessLogs, setAccessLogs] = useState(() => getLocalAccessLogs());

  useEffect(() => {
    if (!selectedWorkerForLogs) return;
    const unsub = subscribeAccessLogs((logs) => {
      setAccessLogs(logs);
    });
    return () => unsub();
  }, [selectedWorkerForLogs]);

  const handleOpenWorkerLogs = (worker) => {
    pushModalHistory("worker_access_logs");
    const freshLogs = getLocalAccessLogs();
    setAccessLogs(freshLogs);
    setSelectedWorkerForLogs(worker);
  };

  // Sub-Hook 1: 5-Company Attendance & Overtime Ledger
  const {
    extrusionSummaryList,
    smartOvertimeData,
    overtimeReports,
    companyOverviewStats,
    unwrittenCompanies,
    filteredCompanyOverviewStats,
    filteredUnwrittenCompanies,
    approvalDocs,
    pendingCount,
    holdCount,
    canApproveSamrangjin,
    canApproveHallim,
    canApproveLog,
    isOvertimeReportApproved,
    pendingApprovalCards,
    filteredPendingApprovalCards,
    selectedOvertimeReportForModal,
    setSelectedOvertimeReportForModal,
    getReportWorkersList
  } = useWorkerCompanyAttendance({
    currentProfile,
    isAdmin,
    isMyeongjae,
    isDongwook,
    isPartnerProfile,
    isHanulManager,
    isHanul,
    isBurimtechManager,
    isBurimtech,
    isYuseongManager
  });

  // Sub-Hook 2: Quality Issues & Real-time Metrics
  const {
    hanulQualityIssues,
    machiningQualityIssues,
    extrusionQualityIssues,
    yuseongQualityIssues,
    activeHanulQualityCount,
    activeMachiningQualityCount,
    activeExtrusionQualityCount,
    activeYuseongQualityCount,
    handleOpenHanulReport,
    handleOpenHanulSettlementModal,
    handleOpenYuseongReport,
    isHanulSettlementModalOpen,
    setIsHanulSettlementModalOpen,
    isHanulWorkReportModalOpen,
    setIsHanulWorkReportModalOpen,
    isHanulQualityIssueModalOpen,
    setIsHanulQualityIssueModalOpen,
    hanulReportProject,
    hanulReportProcess,
    hanulReportEditData,
    isYuseongWorkReportModalOpen,
    setIsYuseongWorkReportModalOpen,
    yuseongReportProject,
    yuseongReportEditData,
    isInspectionModalOpen,
    setIsInspectionModalOpen,
    isWorkLogsSummaryModalOpen,
    setIsWorkLogsSummaryModalOpen,
    qualityRecords,
    qualityPopupItem,
    setQualityPopupItem,
    handleOpenQualityPopup,
    prevYearMonth,
    liveQualityPrevMonthly,
    liveQualityCurrentMonthly,
    liveQualityDaily,
    handleExportQualityItemExcel,
    getPreviousYearMonth
  } = useWorkerQualityMetrics({
    selectedMonth,
    currentYearMonth
  });

  // Sub-Hook 3: Worker Schedule & Weekly Calendar
  const workerSchedule = useWorkerSchedule({
    currentProfile,
    workerFullName,
    workerPlant,
    officialTitle,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // Sub-Hook 4: Company Common Schedule & Comments
  const commonSchedule = useCommonSchedule({
    currentProfile,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // Sub-Hook 5: Work Log CRUD, Maintenance Items, and Pagination
  const workLogCrud = useWorkLogCrud({
    currentProfile,
    workerFullName,
    workerPlant,
    workerPosition,
    workerDept,
    assignedProcess,
    officialTitle,
    isAdmin,
    isMyeongjae,
    isDongwook,
    isInjoo,
    isJaeyul,
    isQualityWorker,
    isOperator,
    setToastMessage,
    setLogSavedToast
  });

  const { handleOpenWorkLogModal } = workLogCrud;

  // Header "✍️ 일보작성" 버튼 연동 리스너 및 핀 로그인 즉시 일보작성 연결
  useEffect(() => {
    const handleOpen = () => {
      handleOpenWorkLogModal();
    };
    window.addEventListener("open-worker-worklog-modal", handleOpen);

    try {
      if (sessionStorage.getItem("auto_open_worker_worklog") === "true") {
        sessionStorage.removeItem("auto_open_worker_worklog");
        setTimeout(() => {
          handleOpenWorkLogModal();
        }, 100);
      }
    } catch (e) {}

    return () => window.removeEventListener("open-worker-worklog-modal", handleOpen);
  }, [handleOpenWorkLogModal]);

  // Sub-Hook 6: Dashboard Excel (Quality & General PnL)
  const dashboardExcel = useDashboardExcel({
    workerFullName,
    workerPlant,
    selectedMonth,
    currentYearMonth,
    uploadMonthlyData,
    onBulkUpload,
    changeMonth,
    uncompletedCommonSchedules: commonSchedule.uncompletedCommonSchedules,
    todayDateStr,
    totalSales,
    totalPurchases,
    salesAchievementPct,
    purchaseAchievementPct,
    setToastMessage,
    setLogSavedToast
  });

  return {
    // Auth & Identity
    currentProfile,
    isOperator,
    isAdmin,
    logout,
    isManagerRole,
    workerPlant,
    isSamrangjin,
    isHallim,
    workerFullName,
    officialTitle,
    isInjoo,
    isJaeyul,
    isQualityWorker,
    isExtrusionWorker,
    isHanulManager,
    isHanul,
    isBurimtechManager,
    isBurimtech,
    isYuseongManager,
    isPartnerProfile,
    assignedProcess,
    workerCard,
    isJaeyulWorker,
    isHeadquarterUser,
    isMyeongjae,
    isDongwook,
    isGeneralManager,
    workerDept,
    workerPosition,
    isManagerOrAdmin,
    isExtrusionWorkerOnly,
    // Operator worker booleans
    isExtrusionOperatorWorker,
    isHanulOperatorWorker,
    isMachiningOperatorWorker,
    isYuseongOperatorWorker,
    isOperatorWorker,
    // Common date & month
    selectedMonth,
    currentMonthData,
    uploadMonthlyData,
    availableMonths,
    changeMonth,
    currentYearMonth,
    allMonthlyData,
    formatAmount,
    todayFormattedLabel,
    todayDateStr,
    safeSelectedMonth,
    monthTitle,
    prevMonthKey,
    // Quality & Issues
    hanulQualityIssues,
    machiningQualityIssues,
    extrusionQualityIssues,
    yuseongQualityIssues,
    activeHanulQualityCount,
    activeMachiningQualityCount,
    activeExtrusionQualityCount,
    activeYuseongQualityCount,
    handleOpenHanulReport,
    handleOpenHanulSettlementModal,
    handleOpenYuseongReport,
    isHanulSettlementModalOpen,
    setIsHanulSettlementModalOpen,
    isHanulWorkReportModalOpen,
    setIsHanulWorkReportModalOpen,
    isHanulQualityIssueModalOpen,
    setIsHanulQualityIssueModalOpen,
    hanulReportProject,
    hanulReportProcess,
    hanulReportEditData,
    isYuseongWorkReportModalOpen,
    setIsYuseongWorkReportModalOpen,
    yuseongReportProject,
    yuseongReportEditData,
    isInspectionModalOpen,
    setIsInspectionModalOpen,
    qualityRecords,
    qualityPopupItem,
    setQualityPopupItem,
    handleOpenQualityPopup,
    prevYearMonth,
    liveQualityPrevMonthly,
    liveQualityCurrentMonthly,
    liveQualityDaily,
    handleExportQualityItemExcel,
    getPreviousYearMonth,
    // Summary & Reports
    extrusionSummaryList,
    smartOvertimeData,
    overtimeReports,
    companyOverviewStats,
    unwrittenCompanies,
    filteredCompanyOverviewStats,
    filteredUnwrittenCompanies,
    approvalDocs,
    pendingCount,
    holdCount,
    canApproveSamrangjin,
    canApproveHallim,
    canApproveLog,
    selectedOvertimeReportForModal,
    setSelectedOvertimeReportForModal,
    isOvertimeReportApproved,
    pendingApprovalCards,
    filteredPendingApprovalCards,
    getReportWorkersList,
    formatKoreanWorkDate,
    // Access logs
    selectedWorkerForLogs,
    setSelectedWorkerForLogs,
    accessLogs,
    handleOpenWorkerLogs,
    formatRelativeAccessTime,
    // PnL metrics
    totalSales,
    totalPurchases,
    purchaseRatio,
    salesAchievementPct,
    purchaseAchievementPct,
    // Toast
    logSavedToast,
    toastMessage,
    // Work log summary modal
    isWorkLogsSummaryModalOpen,
    setIsWorkLogsSummaryModalOpen,
    // 6 Modular Hook returns
    workerSchedule,
    commonSchedule,
    workLogCrud,
    dashboardExcel,
    // Navigation
    onBulkUpload,
    onNavigateTab
  };
}
