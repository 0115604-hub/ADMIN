import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useMonth } from "../../../context/MonthContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { getLocalAccessLogs, subscribeAccessLogs } from "../../../services/accessLogService";
import { pushModalHistory } from "../../../utils/modalHistory";

import { useWorkerDashboardIdentity } from "./useWorkerDashboardIdentity";
import { useWorkerDashboardMetrics } from "./useWorkerDashboardMetrics";

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
  const {
    selectedMonth,
    currentMonthData,
    uploadMonthlyData,
    availableMonths,
    changeMonth,
    currentYearMonth,
    allMonthlyData
  } = useMonth();
  const { formatAmount } = useCurrency();

  // 1. Identity & Role
  const identity = useWorkerDashboardIdentity({ currentProfile, isAdmin });

  // 2. Metrics & Date Labels
  const metrics = useWorkerDashboardMetrics({
    selectedMonth,
    currentMonthData,
    allMonthlyData
  });

  // Shared Toast states
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");

  // Access Logs State for ADMIN (실시간 상시 동기화)
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState(null);
  const [accessLogs, setAccessLogs] = useState(() => getLocalAccessLogs());

  useEffect(() => {
    const unsub = subscribeAccessLogs((logs) => {
      setAccessLogs(logs);
    });
    return () => unsub();
  }, []);

  const handleOpenWorkerLogs = (worker) => {
    pushModalHistory("worker_access_logs");
    const freshLogs = getLocalAccessLogs();
    setAccessLogs(freshLogs);
    setSelectedWorkerForLogs(worker);
  };

  // Sub-Hook 1: 5-Company Attendance & Overtime Ledger
  const attendance = useWorkerCompanyAttendance({
    currentProfile,
    isAdmin,
    isMyeongjae: identity.isMyeongjae,
    isDongwook: identity.isDongwook,
    isPartnerProfile: identity.isPartnerProfile,
    isHanulManager: identity.isHanulManager,
    isHanul: identity.isHanul,
    isBurimtechManager: identity.isBurimtechManager,
    isBurimtech: identity.isBurimtech,
    isYuseongManager: identity.isYuseongManager
  });

  // Sub-Hook 2: Quality Issues & Real-time Metrics
  const quality = useWorkerQualityMetrics({
    selectedMonth,
    currentYearMonth
  });

  // Sub-Hook 3: Worker Schedule & Weekly Calendar
  const workerSchedule = useWorkerSchedule({
    currentProfile,
    workerFullName: identity.workerFullName,
    workerPlant: identity.workerPlant,
    officialTitle: identity.officialTitle,
    isAdmin,
    todayDateStr: metrics.todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // Sub-Hook 4: Company Common Schedule & Comments
  const commonSchedule = useCommonSchedule({
    currentProfile,
    isAdmin,
    todayDateStr: metrics.todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // Sub-Hook 5: Work Log CRUD, Maintenance Items, and Pagination
  const workLogCrud = useWorkLogCrud({
    currentProfile,
    workerFullName: identity.workerFullName,
    workerPlant: identity.workerPlant,
    workerPosition: identity.workerPosition,
    workerDept: identity.workerDept,
    assignedProcess: identity.assignedProcess,
    officialTitle: identity.officialTitle,
    isAdmin,
    isMyeongjae: identity.isMyeongjae,
    isDongwook: identity.isDongwook,
    isInjoo: identity.isInjoo,
    isJaeyul: identity.isJaeyul,
    isQualityWorker: identity.isQualityWorker,
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
    workerFullName: identity.workerFullName,
    workerPlant: identity.workerPlant,
    selectedMonth,
    currentYearMonth,
    uploadMonthlyData,
    onBulkUpload,
    changeMonth,
    uncompletedCommonSchedules: commonSchedule.uncompletedCommonSchedules,
    todayDateStr: metrics.todayDateStr,
    totalSales: metrics.totalSales,
    totalPurchases: metrics.totalPurchases,
    salesAchievementPct: metrics.salesAchievementPct,
    purchaseAchievementPct: metrics.purchaseAchievementPct,
    setToastMessage,
    setLogSavedToast
  });

  return {
    // Auth & Identity
    currentProfile,
    isOperator,
    isAdmin,
    logout,
    ...identity,

    // Common date & month
    selectedMonth,
    currentMonthData,
    uploadMonthlyData,
    availableMonths,
    changeMonth,
    currentYearMonth,
    allMonthlyData,
    formatAmount,
    ...metrics,

    // Access Logs
    selectedWorkerForLogs,
    setSelectedWorkerForLogs,
    accessLogs,
    handleOpenWorkerLogs,

    // Toast
    logSavedToast,
    setLogSavedToast,
    toastMessage,
    setToastMessage,

    // Sub-Hook Objects (for explicit destructuring in DashboardViewRouter and WorkerDashboardModals)
    attendance,
    quality,
    workerSchedule,
    commonSchedule,
    workLogCrud,
    dashboardExcel,

    // Spreads from Sub-Hooks (for direct top-level access)
    ...attendance,
    ...quality,
    ...workerSchedule,
    ...commonSchedule,
    ...workLogCrud,
    ...dashboardExcel,

    // Navigation callback
    onNavigateTab
  };
}
