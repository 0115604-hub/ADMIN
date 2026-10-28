import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentYearMonth } from "../../context/MonthContext";
import {
  COMPANIES,
  cleanCompanyName,
  calculateDailySummary,
  getLocalSmartOvertimeData,
  subscribeSmartOvertimeData
} from "../../services/overtimeSmartService.js";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  isWeekendByDate
} from "../../services/overtimeService";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs
} from "../../services/approvalService";
import {
  getWorkerPersonnelCard,
  getLocalPersonnelCardsMap,
  subscribePersonnelCards
} from "../../services/personnelCardService.js";
import { getKSTDateString } from "../../utils/dateUtils";
import { pushModalHistory, subscribeCloseAllModals } from "../../utils/modalHistory";
import {
  getDayOfWeekKorean,
  getDayOfWeekFullKorean
} from "./overtimeHelpers.jsx";
import {
  calculateDateContext,
  calculatePrevYearMonth,
  buildWorkerMgmtList,
  calculateWorkerMgmtStats,
  calculateUnwrittenCompanies,
  buildFilteredAttendanceWorkers
} from "./overtimeStateHelpers.js";
import {
  updateWorkerDayAttendance,
  promptCustomOtHours,
  submitCompanyDayAttendance,
  approveCompanyDayAttendance,
  unlockCompanyDayAttendance,
  copyAllFilteredWorkersSameAsPrevDay,
  fillAllFilteredWorkersRegular,
  exportExcelAttendance
} from "./overtimeAttendanceHandlers.js";
import {
  quickAddCompanyWorker,
  confirmDeleteWorker,
  savePersonnelCard,
  deleteReportAction
} from "./overtimeWorkerCardHandlers.js";

export const useOvertimeStatusState = () => {
  const { currentProfile, isAdmin } = useAuth();

  // Selected Month (Standard KST YYYY-MM)
  const selectedMonth = useMemo(() => {
    try {
      const kst = getKSTDateString(new Date());
      if (kst && kst.length >= 7) return kst.slice(0, 7);
    } catch (e) {}
    return getCurrentYearMonth() || "2026-10";
  }, []);

  const [currentYear, currentMonthNum] = useMemo(() => {
    const ym = selectedMonth || getCurrentYearMonth();
    const parts = ym.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonthNum, 0).getDate();
  }, [currentYear, currentMonthNum]);

  const prevYearMonth = useMemo(() => {
    return calculatePrevYearMonth(currentYear, currentMonthNum);
  }, [currentYear, currentMonthNum]);

  const [prevYear, prevMonthNum] = useMemo(() => {
    const parts = prevYearMonth.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [prevYearMonth]);

  // Matrix View Month State
  const [matrixViewMonth, setMatrixViewMonth] = useState(() => selectedMonth || "2026-10");
  const [lastSelectedPastMonth, setLastSelectedPastMonth] = useState(() => prevYearMonth || "2026-09");
  const [isPastMonthDropdownOpen, setIsPastMonthDropdownOpen] = useState(false);
  const pastMonthDropdownRef = useRef(null);
  const [matrixCustomMonthData, setMatrixCustomMonthData] = useState(null);

  const { matrixYear, matrixMonthNum, matrixDaysInMonth } = useMemo(() => {
    return calculateDateContext(selectedMonth, prevYearMonth, matrixViewMonth);
  }, [selectedMonth, prevYearMonth, matrixViewMonth]);

  // Labels & Weekend checkers
  const getDayLabel = (d) => getDayOfWeekKorean(d, currentYear, currentMonthNum);
  const getDayFullLabel = (d) => getDayOfWeekFullKorean(d, currentYear, currentMonthNum);
  const isWeekendDay = (d) => isWeekendByDate(d, currentYear, currentMonthNum);
  const getMatrixDayLabel = (d) => getDayOfWeekKorean(d, matrixYear, matrixMonthNum);
  const isMatrixWeekendDay = (d) => isWeekendByDate(d, matrixYear, matrixMonthNum);

  // Smart Data & Ledgers
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData(selectedMonth || "2026-10"));
  const [prevMonthData, setPrevMonthData] = useState(() => getLocalSmartOvertimeData(prevYearMonth || "2026-09"));
  const [activeTab, setActiveTab] = useState("daily_input");
  const [detailSubTab, setDetailSubTab] = useState("monthly_matrix");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 4M & Personnel Card Modals
  const [isAbsence4MModalOpen, setIsAbsence4MModalOpen] = useState(false);
  const [absence4MCompany, setAbsence4MCompany] = useState("오륙");
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());
  const [selectedPersonnelWorker, setSelectedPersonnelWorker] = useState(null);
  const [selectedPersonnelWorkerIndex, setSelectedPersonnelWorkerIndex] = useState(-1);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [workerMgmtCompanyFilter, setWorkerMgmtCompanyFilter] = useState("오륙");
  const [workerMgmtSearch, setWorkerMgmtSearch] = useState("");
  const [workerMgmtSkillFilter, setWorkerMgmtSkillFilter] = useState("ALL");
  const [workerMgmtMultiSkillOnly, setWorkerMgmtMultiSkillOnly] = useState(false);
  const [showAddWorkerDrawer, setShowAddWorkerDrawer] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [isDeletingWorker, setIsDeletingWorker] = useState(false);

  // Daily View states
  const [selectedDay, setSelectedDay] = useState(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      return !isNaN(day) && day >= 1 && day <= 31 ? day : new Date().getDate() || 1;
    } catch (e) {
      return new Date().getDate() || 1;
    }
  });

  const [isDayUnlockedForEdit, setIsDayUnlockedForEdit] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(() => {
    try {
      const saved = window.sessionStorage?.getItem("oryuk_selected_company_filter");
      if (saved && saved !== "전체") {
        window.sessionStorage?.removeItem("oryuk_selected_company_filter");
        return saved;
      }
    } catch {}
    return "오륙";
  });
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState(() => selectedCompanyFilter || "오륙");
  const [reportListFilter, setReportListFilter] = useState(() => selectedCompanyFilter || "오륙");
  const [dateSortOrder, setDateSortOrder] = useState("DESC");
  const [reportListSearch, setReportListSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Quick New Worker states
  const [quickNewWorkerCompany, setQuickNewWorkerCompany] = useState("오륙");
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("생산팀");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("압출");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("사원");

  // Reports & Approvals
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);

  // Toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  // Subscriptions & Sync
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      setIsLegacyModalOpen(false);
      setSelectedLegacyReport(null);
      setIsPersonnelModalOpen(false);
      setSelectedPersonnelWorker(null);
      setIsAbsence4MModalOpen(false);
      setWorkerToDelete(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedMonth) setMatrixViewMonth(selectedMonth);
  }, [selectedMonth, currentProfile?.name]);

  useEffect(() => {
    if (prevYearMonth) setLastSelectedPastMonth(prevYearMonth);
  }, [prevYearMonth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pastMonthDropdownRef.current && !pastMonthDropdownRef.current.contains(e.target)) {
        setIsPastMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!matrixViewMonth || matrixViewMonth === selectedMonth || matrixViewMonth === prevYearMonth) {
      setMatrixCustomMonthData(null);
      return;
    }
    setMatrixCustomMonthData(getLocalSmartOvertimeData(matrixViewMonth));
    const unsub = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setMatrixCustomMonthData(newData);
      }
    }, matrixViewMonth);
    return () => unsub();
  }, [matrixViewMonth, selectedMonth, prevYearMonth]);

  useEffect(() => {
    const handleNavWorkerMgmt = () => {
      setActiveTab("detail");
      setDetailSubTab("worker_management");
    };
    window.addEventListener("oryuk_open_worker_management", handleNavWorkerMgmt);
    return () => window.removeEventListener("oryuk_open_worker_management", handleNavWorkerMgmt);
  }, []);

  useEffect(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      setSelectedDay((prev) => {
        if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
          return day;
        }
        return prev > daysInMonth ? daysInMonth : prev;
      });
    } catch (e) {
      setSelectedDay((prev) => (prev > daysInMonth ? daysInMonth : prev));
    }
  }, [currentProfile?.name, daysInMonth]);

  useEffect(() => {
    if (selectedCompanyFilter && COMPANIES.includes(selectedCompanyFilter)) {
      setMatrixCompanyFilter(selectedCompanyFilter);
      setWorkerMgmtCompanyFilter(selectedCompanyFilter);
      setQuickNewWorkerCompany(selectedCompanyFilter);
      setReportListFilter(selectedCompanyFilter);
    }
  }, [selectedCompanyFilter]);

  useEffect(() => {
    if (workerMgmtCompanyFilter && COMPANIES.includes(workerMgmtCompanyFilter)) {
      setQuickNewWorkerCompany(workerMgmtCompanyFilter);
    }
  }, [workerMgmtCompanyFilter]);

  useEffect(() => {
    const currentYM = selectedMonth || "2026-10";
    const prevYM = prevYearMonth || "2026-09";

    setSmartData(getLocalSmartOvertimeData(currentYM));
    setPrevMonthData(getLocalSmartOvertimeData(prevYM));

    const unsubSmart = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setSmartData(newData);
      }
    }, currentYM);

    const unsubPrev = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setPrevMonthData(newData);
      }
    }, prevYM);

    const unsubLegacy = subscribeOvertimeReports((reports) => {
      setLegacyReports(reports);
      if (reports.length > 0) {
        setSelectedLegacyReport((prev) => prev || reports[0]);
      }
    });

    const unsubApproval = subscribeApprovalDocs((docs) => {
      if (Array.isArray(docs)) {
        setApprovalDocs(docs);
      }
    });

    const unsubCards = subscribePersonnelCards((cards) => {
      setPersonnelCardsMap(cards || {});
    });

    const handleCardUpdated = (e) => {
      if (e?.detail?.deleted && e?.detail?.cardKey) {
        setPersonnelCardsMap((prev) => {
          const next = { ...prev };
          delete next[e.detail.cardKey];
          if (e.detail.company && e.detail.name) {
            delete next[`${e.detail.company}_${e.detail.name}`];
          }
          return next;
        });
        return;
      }
      if (e?.detail?.cardKey && e?.detail?.cardData) {
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [e.detail.cardKey]: e.detail.cardData,
          [`${cleanCompanyName(e.detail.cardData.company)}_${e.detail.cardData.name}`]: e.detail.cardData,
          [`${e.detail.cardData.company}_${e.detail.cardData.name}`]: e.detail.cardData
        }));
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("oryuk_personnel_card_updated", handleCardUpdated);
    }

    return () => {
      unsubSmart();
      unsubPrev();
      unsubLegacy();
      unsubApproval();
      unsubCards();
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_personnel_card_updated", handleCardUpdated);
      }
    };
  }, [selectedMonth, prevYearMonth]);

  useEffect(() => {
    setIsDayUnlockedForEdit(false);
  }, [selectedDay, selectedCompanyFilter, selectedMonth]);

  const currentCompanyDayKey = `${cleanCompanyName(selectedCompanyFilter)}_${selectedDay}`;
  const currentCompanyApproval = smartData?.companyApprovalStatus?.[currentCompanyDayKey];
  const isDayLocked = currentCompanyApproval?.status === "APPROVED" && !isDayUnlockedForEdit;

  // Single Source of Truth: effectiveMatrix
  const effectiveMatrix = useMemo(() => {
    return smartData?.attendanceMatrix || smartData?.masterWorkers || [];
  }, [smartData]);

  const dailySummary = useMemo(() => {
    return calculateDailySummary(effectiveMatrix || [], selectedDay, currentYear, currentMonthNum);
  }, [effectiveMatrix, selectedDay, currentYear, currentMonthNum]);

  const unwrittenCompanies = useMemo(() => {
    return calculateUnwrittenCompanies({
      selectedDay,
      currentYear,
      currentMonthNum,
      legacyReports,
      smartData,
      effectiveMatrix
    });
  }, [effectiveMatrix, smartData, legacyReports, selectedDay, currentYear, currentMonthNum]);

  const filteredAttendanceWorkers = useMemo(() => {
    return buildFilteredAttendanceWorkers({
      effectiveMatrix,
      personnelCardsMap,
      selectedCompanyFilter
    });
  }, [effectiveMatrix, personnelCardsMap, selectedCompanyFilter]);

  const workerMgmtList = useMemo(() => {
    return buildWorkerMgmtList({
      attendanceMatrix: smartData.attendanceMatrix,
      personnelCardsMap,
      workerMgmtCompanyFilter,
      workerMgmtSkillFilter,
      workerMgmtMultiSkillOnly,
      workerMgmtSearch
    });
  }, [smartData.attendanceMatrix, personnelCardsMap, workerMgmtCompanyFilter, workerMgmtSkillFilter, workerMgmtMultiSkillOnly, workerMgmtSearch]);

  const workerMgmtStats = useMemo(() => {
    return calculateWorkerMgmtStats(workerMgmtList);
  }, [workerMgmtList]);

  // Modal open helpers
  const handleSelectCompanyAttendanceTable = (compName) => {
    const cleanComp = cleanCompanyName(compName);
    setSelectedCompanyFilter(cleanComp);
    setActiveTab("daily_input");
  };

  const handleOpenManageWorkers = (compName) => {
    const cleanComp = cleanCompanyName(compName || "오륙");
    setWorkerMgmtCompanyFilter(cleanComp);
    setQuickNewWorkerCompany(cleanComp);
    setActiveTab("detail");
    setDetailSubTab("worker_management");
  };

  const handleOpenAbsence4M = (compName) => {
    pushModalHistory("absence_4m_modal");
    setAbsence4MCompany(cleanCompanyName(compName || "오륙"));
    setIsAbsence4MModalOpen(true);
  };

  const handleOpenLegacyReport = (report) => {
    pushModalHistory("overtime_report_detail");
    setSelectedLegacyReport(report);
    setIsLegacyModalOpen(true);
  };

  const handleOpenPersonnelCard = (worker, originalIndex) => {
    pushModalHistory("personnel_card_modal");
    const cleanComp = cleanCompanyName(worker?.company);
    const cardKey = `${cleanComp}_${worker?.name}`;
    const savedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${worker?.company}_${worker?.name}`] || worker?.personnelCard || worker?.card;
    const card = savedCard
      ? getWorkerPersonnelCard({ ...worker, personnelCard: savedCard }, (typeof originalIndex === "number" && originalIndex >= 0 ? originalIndex + 1 : 1))
      : getWorkerPersonnelCard(worker, (typeof originalIndex === "number" && originalIndex >= 0 ? originalIndex + 1 : 1));
    const enrichedWorker = {
      ...worker,
      position: card?.position || savedCard?.position || worker?.position || "사원",
      dept: card?.dept || savedCard?.dept || worker?.dept || "생산팀",
      personnelCard: card || savedCard || worker?.personnelCard || worker?.card
    };
    setSelectedPersonnelWorker(enrichedWorker);
    setSelectedPersonnelWorkerIndex(
      typeof originalIndex === "number" ? originalIndex : (worker?.originalMatrixIndex ?? -1)
    );
    setIsPersonnelModalOpen(true);
  };

  const handleEditReport = (report) => {
    if (!report) return;
    if (report.workDate) {
      const parts = report.workDate.split("-");
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d)) setSelectedDay(d);
      }
    }
    if (report.company && report.company !== "전체" && report.company !== "5개사 통합") {
      setSelectedCompanyFilter(cleanCompanyName(report.company));
    } else if (report.plant === "삼랑진공장") {
      setSelectedCompanyFilter("오륙");
    } else if (report.plant === "한림공장") {
      setSelectedCompanyFilter("조영");
    } else {
      setSelectedCompanyFilter("오륙");
    }
    setIsLegacyModalOpen(false);
    setSelectedLegacyReport(null);
    setIsDayUnlockedForEdit(true);
    setActiveTab("daily_input");
    triggerToast(`✏️ ${report.workDate ? report.workDate.split("-")[1] + "월 " + report.workDate.split("-")[2] + "일" : ""} [${report.company || report.plant || "오륙"}] 근태 수정 화면으로 이동했습니다. 작업자 근태 변경 후 [수정 및 재등록]을 클릭하세요.`);
  };

  const handleOpenDeleteWorkerModal = (worker, originalIndex) => {
    if (!worker) return;
    setWorkerToDelete({
      name: (worker.name || "").trim(),
      company: cleanCompanyName(worker.company),
      rawCompany: worker.company,
      dept: worker.dept,
      line: worker.line || worker.dept || "라인",
      position: worker.position || "사원",
      originalIndex: typeof originalIndex === "number" ? originalIndex : (worker.originalMatrixIndex ?? -1)
    });
  };

  // Actions wrapped
  const handleUpdateWorkerDayAttendance = (targetWorkerOrIndex, newCode) =>
    updateWorkerDayAttendance({
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
    });

  const handleCustomOtHours = (worker) =>
    promptCustomOtHours({
      isDayLocked,
      setIsDayUnlockedForEdit,
      worker,
      selectedDay,
      onUpdateAttendance: handleUpdateWorkerDayAttendance
    });

  const handleSubmitCompanyDayAttendance = () =>
    submitCompanyDayAttendance({
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
    });

  const handleApproveCompanyDayAttendance = () =>
    approveCompanyDayAttendance({
      selectedCompanyFilter,
      selectedDay,
      smartData,
      currentProfile,
      currentMonthNum,
      setSmartData,
      setIsDayUnlockedForEdit,
      triggerToast,
      selectedMonth
    });

  const handleUnlockCompanyDayAttendance = () =>
    unlockCompanyDayAttendance({
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
    });

  const handleSetAllFilteredWorkersSameAsPrevDay = () =>
    copyAllFilteredWorkersSameAsPrevDay({
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
    });

  const handleSetAllFilteredWorkersRegular = () =>
    fillAllFilteredWorkersRegular({
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
    });

  const handleExportExcel = () =>
    exportExcelAttendance({
      matrixViewMonth,
      selectedMonth,
      smartData,
      prevYearMonth,
      prevMonthData,
      matrixCustomMonthData,
      triggerToast
    });

  const handleDeleteReport = (reportOrId, e) =>
    deleteReportAction({
      reportOrId,
      e,
      legacyReports,
      smartData,
      selectedLegacyReport,
      setLegacyReports,
      setIsLegacyModalOpen,
      setSelectedLegacyReport,
      triggerToast
    });

  const handleQuickAddCompanyWorker = (e) =>
    quickAddCompanyWorker({
      quickNewWorkerName,
      quickNewWorkerCompany,
      workerMgmtCompanyFilter,
      selectedCompanyFilter,
      quickNewWorkerDept,
      quickNewWorkerLine,
      quickNewWorkerPos,
      daysInMonth,
      isWeekendDay,
      currentProfile,
      selectedMonth,
      setIsSaving,
      setSmartData,
      setWorkerMgmtCompanyFilter,
      setQuickNewWorkerCompany,
      setPersonnelCardsMap,
      setQuickNewWorkerName,
      triggerToast
    });

  const handleConfirmDeleteWorker = () =>
    confirmDeleteWorker({
      workerToDelete,
      setIsDeletingWorker,
      selectedMonth,
      prevYearMonth,
      legacyReports,
      setSmartData,
      setPrevMonthData,
      setPersonnelCardsMap,
      setLegacyReports,
      setWorkerToDelete,
      triggerToast
    });

  const handleSavePersonnelCard = (updatedCardData) =>
    savePersonnelCard({
      updatedCardData,
      selectedPersonnelWorkerIndex,
      smartData,
      currentProfile,
      selectedMonth,
      setIsSaving,
      setPersonnelCardsMap,
      setSmartData,
      triggerToast
    });

  return {
    currentProfile,
    isAdmin,
    selectedMonth,
    currentYear,
    currentMonthNum,
    daysInMonth,
    prevYearMonth,
    prevYear,
    prevMonthNum,
    matrixViewMonth,
    setMatrixViewMonth,
    lastSelectedPastMonth,
    setLastSelectedPastMonth,
    isPastMonthDropdownOpen,
    setIsPastMonthDropdownOpen,
    pastMonthDropdownRef,
    matrixCustomMonthData,
    matrixYear,
    matrixMonthNum,
    matrixDaysInMonth,
    getDayLabel,
    getDayFullLabel,
    isWeekendDay,
    getMatrixDayLabel,
    isMatrixWeekendDay,
    smartData,
    prevMonthData,
    activeTab,
    setActiveTab,
    detailSubTab,
    setDetailSubTab,
    hasUnsavedChanges,
    isAbsence4MModalOpen,
    setIsAbsence4MModalOpen,
    absence4MCompany,
    personnelCardsMap,
    selectedPersonnelWorker,
    setSelectedPersonnelWorker,
    selectedPersonnelWorkerIndex,
    isPersonnelModalOpen,
    setIsPersonnelModalOpen,
    workerMgmtCompanyFilter,
    setWorkerMgmtCompanyFilter,
    workerMgmtSearch,
    setWorkerMgmtSearch,
    workerMgmtSkillFilter,
    setWorkerMgmtSkillFilter,
    workerMgmtMultiSkillOnly,
    setWorkerMgmtMultiSkillOnly,
    showAddWorkerDrawer,
    setShowAddWorkerDrawer,
    workerToDelete,
    setWorkerToDelete,
    isDeletingWorker,
    selectedDay,
    setSelectedDay,
    isDayUnlockedForEdit,
    setIsDayUnlockedForEdit,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    matrixCompanyFilter,
    setMatrixCompanyFilter,
    reportListFilter,
    setReportListFilter,
    dateSortOrder,
    setDateSortOrder,
    reportListSearch,
    setReportListSearch,
    isSaving,
    toastMessage,
    showToast,
    quickNewWorkerCompany,
    setQuickNewWorkerCompany,
    quickNewWorkerName,
    setQuickNewWorkerName,
    quickNewWorkerDept,
    setQuickNewWorkerDept,
    quickNewWorkerLine,
    setQuickNewWorkerLine,
    quickNewWorkerPos,
    setQuickNewWorkerPos,
    legacyReports,
    approvalDocs,
    selectedLegacyReport,
    setSelectedLegacyReport,
    isLegacyModalOpen,
    setIsLegacyModalOpen,
    triggerToast,
    effectiveMatrix,
    dailySummary,
    unwrittenCompanies,
    filteredAttendanceWorkers,
    workerMgmtList,
    workerMgmtStats,
    handleSelectCompanyAttendanceTable,
    handleOpenManageWorkers,
    handleOpenAbsence4M,
    handleOpenLegacyReport,
    handleOpenPersonnelCard,
    handleEditReport,
    handleOpenDeleteWorkerModal,
    handleUpdateWorkerDayAttendance,
    handleCustomOtHours,
    handleSubmitCompanyDayAttendance,
    handleApproveCompanyDayAttendance,
    handleUnlockCompanyDayAttendance,
    handleSetAllFilteredWorkersSameAsPrevDay,
    handleSetAllFilteredWorkersRegular,
    handleExportExcel,
    handleDeleteReport,
    handleQuickAddCompanyWorker,
    handleConfirmDeleteWorker,
    handleSavePersonnelCard
  };
};
