import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  User,
  Save,
  FileText,
  Send,
  Copy,
  Users,
  Layers,
  Sparkles,
  Award,
  CheckCheck,
  Building2,
  Factory,
  Eye,
  Check,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3,
  CalendarDays,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Zap,
  CheckSquare,
  PauseCircle,
  Stamp,
  Star
} from "lucide-react";
import PersonnelCardModal from "./PersonnelCardModal.jsx";
import Absence4MModal from "./Absence4MModal.jsx";
import {
  getWorkerPersonnelCard,
  saveWorkerPersonnelCard,
  getSkillMeta,
  getNationalityMeta,
  getInspectorGradeMeta,
  SKILL_LEVEL_META,
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate,
  DEPARTMENTS_LIST,
  POSITIONS_LIST,
  STANDARD_PROCESS_LIST,
  isPartnerCompany,
  normalizeStandardDept,
  normalizeStandardPosition,
  getLocalPersonnelCardsMap,
  subscribePersonnelCards,
  deleteWorkerPersonnelCard
} from "../services/personnelCardService.js";
import { useAuth } from "../context/AuthContext";
import { useMonth, getCurrentYearMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";
import {
  COMPANIES,
  DEPARTMENTS,
  COMPANY_THEMES,
  cleanCompanyName,
  cleanWorkerNameOnly,
  COMPANY_APPROVAL_MANAGERS,
  ATTENDANCE_OPTIONS,
  getOptionMeta,
  calculateWorkerDailyHours,
  calculateWorkerMonthlyTotals,
  calculateDailySummary,
  getLocalSmartOvertimeData,
  saveSmartOvertimeData,
  registerCompanyWorker,
  removeCompanyWorker,
  saveCompanyDayApprovalStatus,
  subscribeSmartOvertimeData,
  exportSmartOvertimeToExcel,
  normalizeDept,
  ensureAllCompaniesPresent,
  getKoreanHolidayInfo,
  KOREAN_HOLIDAY_NAMES_2026
} from "../services/overtimeSmartService.js";
import {
  getLocalOvertimeReports,
  saveLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate,
  calculateReportMetrics,
  PLANT_COMPANIES,
  getPlantForCompany,
  isWeekendByDate
} from "../services/overtimeService";
import {
  syncPlantOvertimeToApprovalBox,
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  approveDocumentStep,
  checkApprovalPermission
} from "../services/approvalService";
import { KWON_SIGNATURE_BLACK } from "../assets/kwonSignature";
import { getKSTDateString } from "../utils/dateUtils";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";


// 🧩 Extracted Overtime Helper Functions & Re-exports
import {
  getDayOfWeekKorean,
  getDayOfWeekFullKorean,
  getReportDateSortKey,
  formatShortMonthDay,
  renderPlantBadge,
  renderCompanyBadge,
  getFullCompanyPlantLabel,
  getCleanReportSummary,
  getCleanReportTitle,
  getCleanReportReason,
  getLiveApprovalForReport
} from "./overtime/overtimeHelpers.jsx";

export {
  getDayOfWeekKorean,
  getDayOfWeekFullKorean,
  getReportDateSortKey,
  formatShortMonthDay,
  renderPlantBadge,
  renderCompanyBadge,
  getFullCompanyPlantLabel,
  getCleanReportSummary,
  getCleanReportTitle,
  getCleanReportReason,
  getLiveApprovalForReport
};

// 🧩 Modular Overtime Subcomponents
import { OvertimeTopSection } from "./overtime/OvertimeTopSection.jsx";
import { OvertimeDailyInputTab } from "./overtime/OvertimeDailyInputTab.jsx";
import { OvertimeDailySummaryView } from "./overtime/OvertimeDailySummaryView.jsx";
import { OvertimeMonthlyMatrixView } from "./overtime/OvertimeMonthlyMatrixView.jsx";
import { OvertimeWorkerManagementView } from "./overtime/OvertimeWorkerManagementView.jsx";
import { OvertimeReportsTab } from "./overtime/OvertimeReportsTab.jsx";
import { OvertimeReportDetailModal } from "./overtime/OvertimeReportDetailModal.jsx";
import { OvertimeDeleteWorkerModal } from "./overtime/OvertimeDeleteWorkerModal.jsx";
import {
  computeCopyPrevDayAttendance,
  computeFillMissingWorkersRegular,
  computeFillAllFilteredWorkersRegular,
  computeClearDayAttendance
} from "./overtime/overtimeAttendanceActions.js";


export const OvertimeStatusView = ({ onNavigateTab }) => {
  const { currentProfile, isAdmin } = useAuth();

  // 🌟 Global Auto-close all modals on popstate (뒤로가기 시 팝업 닫기)
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

  // ⭐ 5개 협력사 카드(뱃지) 탭 시 팝업 없이 즉시 해당 업체의 근태선택 테이블 표시
  const handleSelectCompanyAttendanceTable = (compName) => {
    const cleanComp = cleanCompanyName(compName);
    setSelectedCompanyFilter(cleanComp);
    setActiveTab("daily_input");
  };

  const handleOpenManageWorkers = (compName) => {
    // 인원관리 탭으로 바로 전환하며 해당 업체를 기본 필터 및 등록 대상 업체로 설정
    const cleanComp = cleanCompanyName(compName || "오륙");
    setWorkerMgmtCompanyFilter(cleanComp);
    setQuickNewWorkerCompany(cleanComp);
    setActiveTab("detail");
    setDetailSubTab("worker_management");
  };

  // ⭐ 결근 관리 및 4M Man 작업자 변경점 모달 열기 핸들러
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

  // ⭐ 제조현장 인사카드 모달 열기 핸들러
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

  // 🌟 일일 근태 입력 및 대시보드 연동은 항상 실시간 KST 당월(예: 2026-10)을 단일 기준으로 사용
  // (상단 헤더 월 선택기가 9월 손익조회 등으로 변경되어 있어도 당일 근태가 9월에 잘못 저장되는 현상 원천 차단)
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

  const getDayLabel = (d) => getDayOfWeekKorean(d, currentYear, currentMonthNum);
  const getDayFullLabel = (d) => getDayOfWeekFullKorean(d, currentYear, currentMonthNum);
  const isWeekendDay = (d) => isWeekendByDate(d, currentYear, currentMonthNum);

  // 🗓️ 지난달 (Previous Month) 자동 계산 (예: 2026-10 -> 2026-09)
  const prevYearMonth = useMemo(() => {
    let y = currentYear;
    let m = currentMonthNum - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }, [currentYear, currentMonthNum]);

  const [prevYear, prevMonthNum] = useMemo(() => {
    const parts = prevYearMonth.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [prevYearMonth]);

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장 - 당월 작성중 vs 지난달 마감 분리)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData(selectedMonth || "2026-10"));
  const [prevMonthData, setPrevMonthData] = useState(() => getLocalSmartOvertimeData(prevYearMonth || "2026-09"));
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' | 'detail' | 'legacy_reports'
  const [detailSubTab, setDetailSubTab] = useState("monthly_matrix"); // 'monthly_matrix' | 'daily_summary' | 'worker_management'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ⭐ 4M 결근 관리 모달 State
  const [isAbsence4MModalOpen, setIsAbsence4MModalOpen] = useState(false);
  const [absence4MCompany, setAbsence4MCompany] = useState("오륙");

  // ⭐ 인원관리 및 인사카드 전용 State
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

  // ⭐ 월간 종합현황 대장 전용 조회 월 (기본값: 로그인 당월)
  const [matrixViewMonth, setMatrixViewMonth] = useState(() => selectedMonth || "2026-10");
  const [lastSelectedPastMonth, setLastSelectedPastMonth] = useState(() => prevYearMonth || "2026-09");
  const [isPastMonthDropdownOpen, setIsPastMonthDropdownOpen] = useState(false);
  const pastMonthDropdownRef = useRef(null);
  const [matrixCustomMonthData, setMatrixCustomMonthData] = useState(null);

  // 페이지 진입 및 로그인/당월 변경 시 항상 로그인 당월이 기본 표시되도록 동기화
  useEffect(() => {
    if (selectedMonth) {
      setMatrixViewMonth(selectedMonth);
    }
  }, [selectedMonth, currentProfile?.name]);

  useEffect(() => {
    if (prevYearMonth) {
      setLastSelectedPastMonth(prevYearMonth);
    }
  }, [prevYearMonth]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pastMonthDropdownRef.current && !pastMonthDropdownRef.current.contains(e.target)) {
        setIsPastMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 과거 특정 월(예: 8월, 7월 등) 선택 시 해당 월 데이터 실시간 구독 및 로드
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

  // ⭐ [인원관리 단일 기준] 대시보드 및 외부에서 1클릭 인원관리 탭 직접 진입 리스너
  useEffect(() => {
    const handleNavWorkerMgmt = () => {
      setActiveTab("detail");
      setDetailSubTab("worker_management");
    };
    window.addEventListener("oryuk_open_worker_management", handleNavWorkerMgmt);
    return () => window.removeEventListener("oryuk_open_worker_management", handleNavWorkerMgmt);
  }, []);

  const [matrixYear, matrixMonthNum] = useMemo(() => {
    const ym = matrixViewMonth || selectedMonth || "2026-10";
    const parts = ym.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [matrixViewMonth, selectedMonth]);

  const matrixDaysInMonth = useMemo(() => {
    return new Date(matrixYear, matrixMonthNum, 0).getDate();
  }, [matrixYear, matrixMonthNum]);

  const getMatrixDayLabel = (d) => getDayOfWeekKorean(d, matrixYear, matrixMonthNum);
  const getMatrixDayFullLabel = (d) => getDayOfWeekFullKorean(d, matrixYear, matrixMonthNum);
  const isMatrixWeekendDay = (d) => isWeekendByDate(d, matrixYear, matrixMonthNum);

  // Daily views state (로그인 및 접속 시점의 실시간 당일 일자로 기본 선택)
  const [selectedDay, setSelectedDay] = useState(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      return !isNaN(day) && day >= 1 && day <= 31 ? day : new Date().getDate() || 1;
    } catch (e) {
      return new Date().getDate() || 1;
    }
  });

  // 로그인 사용자 변경 또는 월 변경 시 당일 일자 자동 동기화
  useEffect(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
        setSelectedDay(day);
      } else if (selectedDay > daysInMonth) {
        setSelectedDay(daysInMonth);
      }
    } catch (e) {
      if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
    }
  }, [currentProfile?.name, daysInMonth]);

  // 🔒 Freeze Lock State: Prevent accidental/tampered changes to finalized days
  const [isDayUnlockedForEdit, setIsDayUnlockedForEdit] = useState(false);

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(() => {
    try {
      const saved = window.sessionStorage?.getItem("oryuk_selected_company_filter");
      if (saved && saved !== "전체") {
        window.sessionStorage?.removeItem("oryuk_selected_company_filter");
        return saved;
      }
    } catch {
      // ignore
    }
    return "오륙";
  });
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState(() => selectedCompanyFilter || "오륙");
  const [reportListFilter, setReportListFilter] = useState(() => selectedCompanyFilter || "오륙");

  // 5개사 독립 모듈: 선택된 업체 변경 시 상세보기/인원관리/보고서 필터 동기화
  useEffect(() => {
    if (selectedCompanyFilter && COMPANIES.includes(selectedCompanyFilter)) {
      setMatrixCompanyFilter(selectedCompanyFilter);
      setWorkerMgmtCompanyFilter(selectedCompanyFilter);
      setQuickNewWorkerCompany(selectedCompanyFilter);
      setReportListFilter(selectedCompanyFilter);
    }
  }, [selectedCompanyFilter]);
  const [dateSortOrder, setDateSortOrder] = useState("DESC"); // "DESC" (가까운 날 / 최신순), "ASC" (과거순 1일->30일)
  const [reportListSearch, setReportListSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // ⭐ 5개사 인원관리 신규 근로자 등록 State (선택된 업체 필터와 자동 연동)
  const [quickNewWorkerCompany, setQuickNewWorkerCompany] = useState("오륙");
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("생산팀");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("압출");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("사원");

  useEffect(() => {
    if (workerMgmtCompanyFilter && COMPANIES.includes(workerMgmtCompanyFilter)) {
      setQuickNewWorkerCompany(workerMgmtCompanyFilter);
    }
  }, [workerMgmtCompanyFilter]);

  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);

  // Show Toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const currentYM = selectedMonth || "2026-10";
    const prevYM = prevYearMonth || "2026-09";

    // Immediate sync from local storage
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
      if (reports.length > 0 && !selectedLegacyReport) {
        setSelectedLegacyReport(reports[0]);
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

  // 🔒 평일(작성자 전결) 또는 특근(최종 승인) 완료(APPROVED) 상태일 때 편집 잠금
  const currentCompanyDayKey = `${cleanCompanyName(selectedCompanyFilter)}_${selectedDay}`;
  const currentCompanyApproval = smartData?.companyApprovalStatus?.[currentCompanyDayKey];
  const isDayLocked = currentCompanyApproval?.status === "APPROVED" && !isDayUnlockedForEdit;

  // Sync state to local/cloud (Explicit Save Action - 5개사 독립 모듈 기준)
  const handleSaveLedger = async (updatedData, targetYM = null, explicitCompany = null) => {
    setIsSaving(true);
    try {
      const ym = targetYM || selectedMonth || "2026-10";
      if (ym === (selectedMonth || "2026-10")) {
        setSmartData(updatedData);
      } else {
        setPrevMonthData(updatedData);
      }
      await saveSmartOvertimeData(updatedData, ym, {
        targetCompany: explicitCompany || selectedCompanyFilter,
        auditMeta: {
          operator: currentProfile?.name || "관리자",
          source: "MANUAL_SAVE_BUTTON",
          reason: "관리자 업체별 원장 수동 저장"
        }
      });
      
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Update Worker Attendance for Selected Day (Local Staging + Auto Save)
  const handleUpdateWorkerDayAttendance = async (targetWorkerOrIndex, newCode) => {
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

  // ⏱️ 잔업 시간 직접 입력 핸들러
  const handleCustomOtHours = (worker) => {
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
          handleUpdateWorkerDayAttendance(worker, "정시");
        } else {
          handleUpdateWorkerDayAttendance(worker, `잔업(+${parsed}H)`);
        }
      }
    }
  };

  // 📤 평일: [작성자 전결] 즉시 마감 처리 / 특근일(주말·공휴일): [5개사 개별 특근보고서] 작성 및 상신
  const handleSubmitCompanyDayAttendance = async () => {
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

    // 1️⃣ 평일 근태: 작성자 전결(APPROVED) 원클릭 즉시 마감 처리 (서버 대기 없이 0초 즉시 반영)
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

      // 화면 상태 즉시 갱신 (작성완료 ✅ 배지 및 근태 즉시 표시)
      setSmartData(optimisticLedger);
      setIsDayUnlockedForEdit(false);
      setHasUnsavedChanges(false);
      triggerToast(`✅ [${cleanComp}] ${currentMonthNum}월 ${d}일(${getDayLabel(d)}) 평일 근태가 등록 완료되었습니다.`);

      // 백그라운드 저장
      saveCompanyDayApprovalStatus(optimisticLedger, selectedMonth || "2026-10", cleanComp, d, statusData, { skipEventDispatch: true }).catch((err) => {
        console.error(err);
      });
      return;
    }

    // 2️⃣ 특근일(주말/공휴일): 5개사 개별 특근보고서 작성 및 상신 (0ms 낙관적 즉시 반영 + 백그라운드 병렬 동기화)
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

    // 🌟 화면 상태 0초 즉시 갱신 (서버 응답 대기 없이 즉시 상신완료 📤 배지 표시)
    setLegacyReports(nextReports);
    setSmartData(optimisticWeekendLedger);
    setIsDayUnlockedForEdit(false);
    setHasUnsavedChanges(false);
    triggerToast(`📤 [${cleanComp}] ${currentMonthNum}월 ${d}일(${getDayLabel(d)}) 개별 특근보고서가 상신되었습니다.`);

    // 백그라운드 병렬 저장
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

  // ✅ 1단계 심플 승인: [최종 승인] (즉시 반영)
  const handleApproveCompanyDayAttendance = async () => {
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

  // 🔓 [마감 해제]: 해당 업체·일자의 기존 근태 등록을 즉시 삭제하고 '작성전' 상태로 초기화
  const handleUnlockCompanyDayAttendance = async () => {
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

    // 화면 상태 즉시 갱신 (기존 근태 삭제 + 작성전 배지 즉시 표시)
    setSmartData(optimisticLedger);
    setIsDayUnlockedForEdit(true);
    setHasUnsavedChanges(false);
    triggerToast(`🔓 [${cleanComp}] ${currentMonthNum}월 ${d}일 마감이 해제되고 근태가 초기화(작성전)되었습니다.`);

    // 백그라운드 저장 (해당 일자 근태 및 마감 상태 완전 초기화)
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

  // 1-Click Copy Closest Previous Weekday's Attendance to Selected Day (5개사 개별 독립 모듈 기준)
  // 1-Click Copy Closest Previous Weekday's Attendance to Selected Day (5개사 개별 독립 모듈 기준)
  const handleSetAllFilteredWorkersSameAsPrevDay = async () => {
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

  const handleSetMissingWorkersRegular = async () => {
    if (isDayLocked) {
      setIsDayUnlockedForEdit(true);
    }
    if (!missingAttendanceWorkers || missingAttendanceWorkers.length === 0) {
      triggerToast("ℹ️ 미선택된 근로자가 없습니다. (모든 근로자의 근태가 입력되어 있습니다)");
      return;
    }

    const isWk = isWeekendDay(selectedDay);
    const { updatedMatrix, updatedCount } = computeFillMissingWorkersRegular({
      missingAttendanceWorkers,
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
    triggerToast(`${isWk ? "🌙" : "🟢"} [${selectedCompanyFilter === "전체" ? "전사" : selectedCompanyFilter}] 미입력 ${updatedCount}명이 ${isWk ? "특근(8H)" : "정시(🟢)"}로 채워졌습니다. (기존 잔업/야간/결근/병결 인원 안전 보존)`);
    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
      targetCompany: selectedCompanyFilter,
      targetDay: selectedDay,
      auditMeta: {
        operator: currentProfile?.name || "현장관리자",
        source: "BULK_FILL_MISSING_REGULAR",
        reason: `${currentMonthNum}월 ${selectedDay}일 미입력 인원 정시 채우기 (${updatedCount}명)`
      }
    });
  };

  // 1-Click Set All Filtered Workers to "🟢 정시" for Selected Day (Preserves 결근/병결/휴가 사유자)
  const handleSetAllFilteredWorkersRegular = async () => {
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

  // 🗑️ 당일 근태 전체 비우기 (선택된 협력사 또는 전체의 선택된 날짜 근태 초기화)
  const handleClearCurrentDayAttendance = async () => {
    if (isDayLocked) {
      setIsDayUnlockedForEdit(true);
    }
    const compLabel = selectedCompanyFilter === "전체" ? "전사 5개사" : selectedCompanyFilter;

    setIsSaving(true);
    try {
      const { updatedMatrix, updatedApprovalStatus } = computeClearDayAttendance({
        smartData,
        selectedCompanyFilter,
        selectedDay,
        companiesList: COMPANIES
      });

      const newLedger = {
        ...smartData,
        year: currentYear,
        month: currentMonthNum,
        attendanceMatrix: updatedMatrix,
        companyApprovalStatus: updatedApprovalStatus
      };

      setSmartData(newLedger);
      setHasUnsavedChanges(true);

      await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
        targetCompany: selectedCompanyFilter,
        targetDay: selectedDay,
        clearedDay: selectedDay,
        auditMeta: {
          operator: currentProfile?.name || "현장관리자",
          source: "DAY_CLEAR_ACTION",
          reason: `${compLabel} Day ${selectedDay} 근태 전체 초기화 (미작성 전환)`
        }
      });
      triggerToast(`🗑️ [${compLabel}] ${currentMonthNum}월 ${selectedDay}일 근태가 초기화(미작성)되었습니다.`);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ 초기화 중 오류가 발생했습니다: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
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

  // ⭐ USER ACTION: 5개사 개별 특근보고서 삭제 핸들러
  const handleDeleteReport = async (reportOrId, e) => {
    if (e) e.stopPropagation();
    const reportId = typeof reportOrId === "object" ? reportOrId.id : reportOrId;
    const targetRep = typeof reportOrId === "object" ? reportOrId : legacyReports.find((r) => r.id === reportId);
    const repName = targetRep?.title || "선택한 특근보고서";

    if (!window.confirm(`정말로 이 특근보고서를 삭제하시겠습니까?\n(${repName})`)) return;
    try {
      await deleteOvertimeReport(reportId);
      const nextReports = legacyReports.filter((r) => r.id !== reportId);
      setLegacyReports(nextReports);

      const currentMatrix = smartData.attendanceMatrix || [];
      if (targetRep) {
        await syncPlantOvertimeToApprovalBox({
          plant: targetRep.plant,
          company: targetRep.company,
          workDate: targetRep.workDate,
          matrix: currentMatrix,
          reports: nextReports,
          isDeleteAction: true
        });
      }

      if (selectedLegacyReport && selectedLegacyReport.id === reportId) {
        setIsLegacyModalOpen(false);
        setSelectedLegacyReport(null);
      }
      triggerToast("🗑️ 특근보고서가 정상적으로 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    }
  };

  // ⭐ 5개사 개별 인원관리: 신규 근로자 등록 핸들러
  const handleQuickAddCompanyWorker = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = quickNewWorkerName.trim();
    if (!name) {
      alert("근로자 성명을 입력해주세요.");
      return;
    }

    const company = cleanCompanyName(
      quickNewWorkerCompany ||
      (workerMgmtCompanyFilter && workerMgmtCompanyFilter !== "전체" ? workerMgmtCompanyFilter : selectedCompanyFilter) ||
      "오륙"
    );
    const dept = normalizeStandardDept(quickNewWorkerDept || "생산팀", company);
    const mainProc = (quickNewWorkerLine || "압출").trim();
    const line = mainProc || dept;
    const position = normalizeStandardPosition(quickNewWorkerPos || "사원", company);

    // Build standard attendance record for current month
    const emptyDaily = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const isWk = isWeekendDay(d);
      emptyDaily[d] = isWk ? "-" : "";
    }

    try {
      setIsSaving(true);
      // 1. 5개사 독립 모듈에 해당 업체 근로자 즉시 등록 및 동기화
      const updatedData = await registerCompanyWorker(
        company,
        {
          name,
          dept,
          line,
          position,
          daily: emptyDaily,
          operator: currentProfile?.name || "관리자"
        },
        selectedMonth || "2026-10"
      );

      setSmartData(updatedData);
      setWorkerMgmtCompanyFilter(company);
      setQuickNewWorkerCompany(company);

      // 2. 신규 근로자 기본 인사카드 자동 생성 및 클라우드 동기화
      const compWorkers = (updatedData.attendanceMatrix || []).filter(
        (w) => cleanCompanyName(w.company) === company
      );
      const nextNo = compWorkers.length || 1;
      const cardKey = `${company}_${name}`;
      const initialCard = getWorkerPersonnelCard(
        {
          name,
          company,
          dept,
          line,
          position,
          personnelCard: {
            name,
            company,
            dept,
            position,
            mainProcess: STANDARD_PROCESS_LIST.includes(mainProc) ? mainProc : "압출"
          }
        },
        nextNo
      );
      await saveWorkerPersonnelCard(cardKey, initialCard);
      setPersonnelCardsMap((prev) => ({ ...prev, [cardKey]: initialCard }));

      setQuickNewWorkerName("");
      triggerToast(`🎉 [${company}] ${name} (${dept} / ${position}) 신규 근로자 등록 완료!`);
    } catch (err) {
      console.error("Failed to register worker:", err);
      alert("근로자 등록 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ⭐ 근로자 인원 영구 삭제 모달 열기 핸들러 (인사카드/마스터 명단에서 완전 영구 삭제)
  const handleOpenDeleteWorkerModal = (worker, originalIndex) => {
    if (!worker) return;
    setWorkerToDelete({
      name: (worker.name || "").trim(),
      company: cleanCompanyName(worker.company),
      rawCompany: worker.company,
      dept: normalizeDept(worker.dept),
      line: worker.line || normalizeDept(worker.dept) || "라인",
      position: worker.position || "사원",
      originalIndex: typeof originalIndex === "number" ? originalIndex : (worker.originalMatrixIndex ?? -1)
    });
  };

  // ⭐ 5개사 개별 인원관리: 근로자 인원 영구 삭제 확인 및 실행 핸들러
  const handleConfirmDeleteWorker = async () => {
    if (!workerToDelete) return;
    setIsDeletingWorker(true);
    try {
      const { name, company, position } = workerToDelete;
      const cleanComp = cleanCompanyName(company);

      // 1. 인사카드 클라우드(Firestore) 및 로컬스토리지에서 영구 삭제
      await deleteWorkerPersonnelCard(cleanComp, name);

      // 2. 5개사 독립 스마트 근태 대장에서 해당 업체 인원 영구 삭제
      const updatedData = await removeCompanyWorker(cleanComp, name, selectedMonth || "2026-10");
      setSmartData(updatedData);
      setPrevMonthData(getLocalSmartOvertimeData(prevYearMonth || "2026-09"));

      // 3. 로컬 personnelCardsMap 상태 즉시 동기화
      setPersonnelCardsMap((prev) => {
        const next = { ...prev };
        delete next[`${cleanComp}_${name}`];
        delete next[`${company}_${name}`];
        delete next[`${workerToDelete.rawCompany}_${name}`];
        return next;
      });

      // 4. 등록된 일일 보고서에서도 퇴사자 인원 자동 정리 (유령 데이터 방지)
      if (Array.isArray(legacyReports)) {
        const updatedLegacyReports = legacyReports.map((r) => {
          if (!r || cleanCompanyName(r.company) !== cleanComp) return r;
          const filteredItems = (r.items || []).filter(
            (it) => (it.workerName || it.name || "").trim() !== name.trim()
          );
          if (filteredItems.length === (r.items || []).length) return r;
          const reindexedItems = filteredItems.map((it, i) => ({ ...it, no: i + 1 }));
          const totalHours = reindexedItems.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
          const totalOtHours = reindexedItems.reduce((sum, it) => sum + (Number(it.otHours) || 0), 0);
          const updatedRep = {
            ...r,
            items: reindexedItems,
            totalWorkers: reindexedItems.length,
            attendedWorkers: reindexedItems.filter((it) => it.hours > 0).length,
            totalHours,
            otHours: totalOtHours,
            cost: totalHours * 15000,
            updatedAt: new Date().toISOString()
          };
          saveOvertimeReport(updatedRep).catch(() => {});
          return updatedRep;
        });
        setLegacyReports(updatedLegacyReports);
        saveLocalOvertimeReports(updatedLegacyReports);
      }

      setWorkerToDelete(null);
      triggerToast(`🗑️ [${cleanComp}] ${name} (${position}) 인원이 마스터 명단 및 인사카드에서 영구 삭제되었습니다.`);
    } catch (err) {
      console.error("Worker delete error:", err);
      triggerToast("⚠️ 근로자 삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsDeletingWorker(false);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
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

  // ⭐ 제조현장 인사카드 저장 및 실시간 대장 동기화 핸들러
  const handleSavePersonnelCard = async (updatedCardData) => {
    setIsSaving(true);
    try {
      const cleanComp = cleanCompanyName(updatedCardData.company);
      const cardKey = `${cleanComp}_${updatedCardData.name}`;

      // 1. 즉시 React 상태(personnelCardsMap) 업데이트 -> UI가 1ms만에 즉시 리렌더링됨
      setPersonnelCardsMap((prev) => ({
        ...prev,
        [cardKey]: updatedCardData,
        [`${updatedCardData.company}_${updatedCardData.name}`]: updatedCardData
      }));

      const currentMatrix = [...(smartData.attendanceMatrix || [])];
      let targetIdx = selectedPersonnelWorkerIndex;

      if (targetIdx < 0 || targetIdx >= currentMatrix.length) {
        targetIdx = currentMatrix.findIndex(
          (w) => cleanCompanyName(w.company) === cleanComp && w.name === updatedCardData.name
        );
      }

      if (targetIdx >= 0 && currentMatrix[targetIdx]) {
        const nextRow = {
          ...currentMatrix[targetIdx],
          name: updatedCardData.name,
          company: cleanComp,
          dept: normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
          line: updatedCardData.line || updatedCardData.mainProcess || normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
          position: updatedCardData.position,
          empNo: updatedCardData.empNo,
          joinDate: updatedCardData.joinDate,
          tenure: updatedCardData.tenure,
          career: updatedCardData.career,
          mainProcess: updatedCardData.mainProcess,
          processYear: updatedCardData.processYear,
          skillLevel: updatedCardData.skillLevel,
          skillGrade: updatedCardData.skillGrade,
          isMultiSkill: updatedCardData.isMultiSkill,
          subProcesses: updatedCardData.subProcesses
        };
        delete nextRow.personnelCard;
        delete nextRow.card;
        delete nextRow.photoUrl;
        currentMatrix[targetIdx] = nextRow;
      }

      const reindexedMatrix = currentMatrix.map((w, idx) => ({ ...w, no: idx + 1 }));
      const reindexedMaster = reindexedMatrix.map((w, idx) => {
        const masterRow = {
          ...w,
          no: idx + 1,
          company: w.company,
          dept: normalizeStandardDept(w.dept, w.company),
          line: w.line || normalizeStandardDept(w.dept, w.company),
          name: w.name,
          position: w.position || updatedCardData.position,
          empNo: w.empNo || updatedCardData.empNo
        };
        delete masterRow.personnelCard;
        delete masterRow.card;
        delete masterRow.photoUrl;
        return masterRow;
      });

      const updatedData = {
        ...smartData,
        masterWorkers: reindexedMaster,
        attendanceMatrix: reindexedMatrix
      };

      // 2. 즉시 smartData 상태 업데이트
      setSmartData(updatedData);

      // 3. 로컬 및 클라우드 비동기 저장
      await saveWorkerPersonnelCard(cardKey, updatedCardData);
      await saveSmartOvertimeData(updatedData, selectedMonth || "2026-10", {
        targetCompany: cleanComp,
        auditMeta: {
          operator: currentProfile?.name || "관리자",
          source: "PERSONNEL_CARD_UPDATE",
          reason: `[${updatedCardData.company}] ${updatedCardData.name} 인사카드 정보 갱신`
        }
      });

      triggerToast(`🎉 [${updatedCardData.company}] ${updatedCardData.name}님의 제조현장 인사카드가 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      alert("인사카드 저장 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ⭐ 인원관리 탭 작업자 목록 및 필터링 (인사카드 포함)
  const workerMgmtList = useMemo(() => {
    const compCounters = {};
    const matrix = (smartData.attendanceMatrix || []).map((w, originalIdx) => {
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
      // 5개사 독립 모듈 필터
      if (workerMgmtCompanyFilter && workerMgmtCompanyFilter !== "전체") {
        if (cleanCompanyName(w.company) !== cleanCompanyName(workerMgmtCompanyFilter)) return false;
      }

      // Skill Level Filter
      if (workerMgmtSkillFilter !== "ALL") {
        const targetLvl = Number(workerMgmtSkillFilter);
        if (w.card?.skillLevel !== targetLvl) return false;
      }

      // Multi-skill Only
      if (workerMgmtMultiSkillOnly && !w.card?.isMultiSkill) {
        return false;
      }

      // Search Filter
      if (workerMgmtSearch.trim()) {
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
  }, [smartData.attendanceMatrix, personnelCardsMap, workerMgmtCompanyFilter, workerMgmtSkillFilter, workerMgmtMultiSkillOnly, workerMgmtSearch]);

  // ⭐ 인원관리 KPI 통계 요약 (선택된 협력사 독립 모듈 기준)
  const workerMgmtStats = useMemo(() => {
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
  }, [workerMgmtList]);

  // 🔒 Master Matrix (단일 진실 원천)
  const effectiveMatrix = useMemo(() => {
    return smartData?.attendanceMatrix || smartData?.masterWorkers || [];
  }, [smartData]);

  // Calculations & Summaries for 5 Companies
  const dailySummary = useMemo(() => {
    return calculateDailySummary(effectiveMatrix || [], selectedDay, currentYear, currentMonthNum);
  }, [effectiveMatrix, selectedDay, currentYear, currentMonthNum]);

  const unwrittenCompanies = useMemo(() => {
    const d = selectedDay || 1;
    const targetDateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return COMPANIES.filter((comp) => {
      const cleanComp = cleanCompanyName(comp);
      // 1. 등록된 특근 보고서가 존재하는지 확인
      const hasReport = (legacyReports || []).some((r) => {
        if (!r) return false;
        const rDateKey = getReportDateSortKey(r);
        if (rDateKey !== targetDateStr) return false;
        const rComp = cleanCompanyName(r.company || "");
        return rComp === cleanComp;
      });
      if (hasReport) return false;

      // 2. 전자결재 승인/상신 상태 확인
      const approvalKey = `${cleanComp}_${d}`;
      const approvalEntry = smartData?.companyApprovalStatus?.[approvalKey];
      const approvalStatus = approvalEntry?.status || "DRAFT";
      if (approvalStatus === "APPROVED" || approvalStatus === "SUBMITTED" || (approvalEntry?.attendedCount > 0)) {
        return false;
      }

      // 3. 당일 원장 상의 근태 입력 인원수 (1명 이상 입력 시 작성후로 판정)
      const compWorkers = (effectiveMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp);
      if (compWorkers.length === 0) return true;

      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;

      // ⭐ 작성후 판정: 1명 이상 입력 시 작성후(isWritten)이므로 미작성 목록(unwritten)에서 제외(false)
      const isWritten = enteredCount > 0;
      return !isWritten;
    }).map((name) => ({ name, shortName: name.replace(/[()주]/g, "") }));
  }, [effectiveMatrix, smartData?.companyApprovalStatus, legacyReports, selectedDay, currentYear, currentMonthNum]);

  // Filtered attendance rows for Daily Input and Summary tabs (인사카드 마스터 기준 부서/직위/공정 100% 동기화)
  const filteredAttendanceWorkers = useMemo(() => {
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
  }, [effectiveMatrix, personnelCardsMap, selectedCompanyFilter]);

  // 🚨 미입력/누락된 근태 작업자 실시간 집계 (선택된 일자 및 조회 대상 기준)
  const missingAttendanceWorkers = useMemo(() => {
    const d = selectedDay || 1;
    return (filteredAttendanceWorkers || []).filter((w) => {
      const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)] ?? "";
      const str = String(val || "").trim();
      return !str || str === "미입력" || str === "undefined" || str === "null";
    });
  }, [filteredAttendanceWorkers, selectedDay]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-cyan-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-black tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* 🧭 Top Section: Toolbar & 5 Company Summary Cards */}
      <OvertimeTopSection
        currentMonthNum={currentMonthNum}
        selectedDay={selectedDay}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setDetailSubTab={setDetailSubTab}
        selectedMonth={selectedMonth}
        setMatrixViewMonth={setMatrixViewMonth}
        legacyReports={legacyReports}
        unwrittenCompanies={unwrittenCompanies}
        smartData={smartData}
        COMPANIES={COMPANIES}
        cleanCompanyName={cleanCompanyName}
        selectedCompanyFilter={selectedCompanyFilter}
        handleSelectCompanyAttendanceTable={handleSelectCompanyAttendanceTable}
        dailySummary={dailySummary}
        isWeekendDay={isWeekendDay}
        handleOpenManageWorkers={handleOpenManageWorkers}
        setQuickNewWorkerName={setQuickNewWorkerName}
        setQuickNewWorkerLine={setQuickNewWorkerLine}
        handleOpenAbsence4M={handleOpenAbsence4M}
      />

      {/* 📝 TAB 1: 근태/잔업/특근 일일 등록 */}
      {activeTab === "daily_input" && (
        <OvertimeDailyInputTab
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          daysInMonth={daysInMonth}
          getKoreanHolidayInfo={getKoreanHolidayInfo}
          currentYear={currentYear}
          currentMonthNum={currentMonthNum}
          getDayFullLabel={getDayFullLabel}
          getDayLabel={getDayLabel}
          selectedCompanyFilter={selectedCompanyFilter}
          setSelectedCompanyFilter={setSelectedCompanyFilter}
          cleanCompanyName={cleanCompanyName}
          smartData={smartData}
          isWeekendDay={isWeekendDay}
          handleUnlockCompanyDayAttendance={handleUnlockCompanyDayAttendance}
          handleApproveCompanyDayAttendance={handleApproveCompanyDayAttendance}
          handleSubmitCompanyDayAttendance={handleSubmitCompanyDayAttendance}
          isSaving={isSaving}
          filteredAttendanceWorkers={filteredAttendanceWorkers}
          handleSetAllFilteredWorkersSameAsPrevDay={handleSetAllFilteredWorkersSameAsPrevDay}
          handleSetAllFilteredWorkersRegular={handleSetAllFilteredWorkersRegular}
          calculateWorkerDailyHours={calculateWorkerDailyHours}
          handleOpenPersonnelCard={handleOpenPersonnelCard}
          handleUpdateWorkerDayAttendance={handleUpdateWorkerDayAttendance}
          handleCustomOtHours={handleCustomOtHours}
        />
      )}

      {/* 📊 TAB 2: 상세 (월간 종합현황 대장 / 일자별 종합 집계 / 인원관리 & 인사카드) */}
      {(activeTab === "detail" || activeTab === "monthly_matrix" || activeTab === "daily_summary" || activeTab === "worker_management") && (
        <div className="space-y-4">
          {/* Sub-Tab Navigation Bar within Detail */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700/80 w-fit flex-wrap shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("daily_input")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs text-cyan-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-cyan-500/30"
              title="당일 근태 등록 화면으로 이동합니다."
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>오늘 등록으로</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDetailSubTab("monthly_matrix");
                setMatrixViewMonth(selectedMonth || "2026-10");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "monthly_matrix"
                  ? "bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>📅 월간 종합현황 대장</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200 border border-purple-700/60 font-mono font-bold">
                {matrixMonthNum}월 ({matrixViewMonth === (selectedMonth || "2026-10") ? "당월" : matrixViewMonth === prevYearMonth ? "지난달 실적" : "마감 실적"})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDetailSubTab("daily_summary")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "daily_summary"
                  ? "bg-cyan-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📊 각사별 일일현황</span>
            </button>

            <button
              type="button"
              onClick={() => setDetailSubTab("worker_management")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "worker_management"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>🪪 인원관리 및 인사카드</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 border border-emerald-700/60 font-mono font-bold">
                {workerMgmtStats.total}명
              </span>
            </button>
          </div>

          {/* Sub-tab 1: Daily Summary View */}
          {detailSubTab === "daily_summary" && (
            <OvertimeDailySummaryView
              currentMonthNum={currentMonthNum}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              daysInMonth={daysInMonth}
              getKoreanHolidayInfo={getKoreanHolidayInfo}
              currentYear={currentYear}
              getDayFullLabel={getDayFullLabel}
              dailySummary={dailySummary}
              handleSelectCompanyAttendanceTable={handleSelectCompanyAttendanceTable}
            />
          )}

          {/* Sub-tab 2: Monthly Matrix View */}
          {detailSubTab === "monthly_matrix" && (
            <OvertimeMonthlyMatrixView
              matrixViewMonth={matrixViewMonth}
              setMatrixViewMonth={setMatrixViewMonth}
              selectedMonth={selectedMonth}
              prevYearMonth={prevYearMonth}
              currentMonthNum={currentMonthNum}
              currentYear={currentYear}
              prevMonthNum={prevMonthNum}
              prevYear={prevYear}
              smartData={smartData}
              prevMonthData={prevMonthData}
              matrixCustomMonthData={matrixCustomMonthData}
              getLocalSmartOvertimeData={getLocalSmartOvertimeData}
              lastSelectedPastMonth={lastSelectedPastMonth}
              setLastSelectedPastMonth={setLastSelectedPastMonth}
              personnelCardsMap={personnelCardsMap}
              getWorkerPersonnelCard={getWorkerPersonnelCard}
              normalizeDept={normalizeDept}
              matrixCompanyFilter={matrixCompanyFilter}
              setMatrixCompanyFilter={setMatrixCompanyFilter}
              COMPANIES={COMPANIES}
              cleanCompanyName={cleanCompanyName}
              matrixDaysInMonth={matrixDaysInMonth}
              matrixYear={matrixYear}
              matrixMonthNum={matrixMonthNum}
              calculateWorkerMonthlyTotals={calculateWorkerMonthlyTotals}
              pastMonthDropdownRef={pastMonthDropdownRef}
              isPastMonthDropdownOpen={isPastMonthDropdownOpen}
              setIsPastMonthDropdownOpen={setIsPastMonthDropdownOpen}
              triggerToast={triggerToast}
              handleExportExcel={handleExportExcel}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              getKoreanHolidayInfo={getKoreanHolidayInfo}
              getMatrixDayLabel={getMatrixDayLabel}
              COMPANY_THEMES={COMPANY_THEMES}
              handleOpenPersonnelCard={handleOpenPersonnelCard}
              isMatrixWeekendDay={isMatrixWeekendDay}
              setIsDayUnlockedForEdit={setIsDayUnlockedForEdit}
              setActiveTab={setActiveTab}
              calculateWorkerDailyHours={calculateWorkerDailyHours}
            />
          )}

          {/* Sub-tab 3: Worker Management View */}
          {detailSubTab === "worker_management" && (
            <OvertimeWorkerManagementView
              workerMgmtStats={workerMgmtStats}
              showAddWorkerDrawer={showAddWorkerDrawer}
              setShowAddWorkerDrawer={setShowAddWorkerDrawer}
              handleQuickAddCompanyWorker={handleQuickAddCompanyWorker}
              quickNewWorkerCompany={quickNewWorkerCompany}
              setQuickNewWorkerCompany={setQuickNewWorkerCompany}
              setWorkerMgmtCompanyFilter={setWorkerMgmtCompanyFilter}
              COMPANIES={COMPANIES}
              quickNewWorkerName={quickNewWorkerName}
              setQuickNewWorkerName={setQuickNewWorkerName}
              quickNewWorkerDept={quickNewWorkerDept}
              setQuickNewWorkerDept={setQuickNewWorkerDept}
              DEPARTMENTS_LIST={DEPARTMENTS_LIST}
              quickNewWorkerLine={quickNewWorkerLine}
              setQuickNewWorkerLine={setQuickNewWorkerLine}
              STANDARD_PROCESS_LIST={STANDARD_PROCESS_LIST}
              quickNewWorkerPos={quickNewWorkerPos}
              setQuickNewWorkerPos={setQuickNewWorkerPos}
              POSITIONS_LIST={POSITIONS_LIST}
              workerMgmtCompanyFilter={workerMgmtCompanyFilter}
              workerMgmtSkillFilter={workerMgmtSkillFilter}
              setWorkerMgmtSkillFilter={setWorkerMgmtSkillFilter}
              workerMgmtMultiSkillOnly={workerMgmtMultiSkillOnly}
              setWorkerMgmtMultiSkillOnly={setWorkerMgmtMultiSkillOnly}
              workerMgmtSearch={workerMgmtSearch}
              setWorkerMgmtSearch={setWorkerMgmtSearch}
              workerMgmtList={workerMgmtList}
              getWorkerPersonnelCard={getWorkerPersonnelCard}
              COMPANY_THEMES={COMPANY_THEMES}
              cleanCompanyName={cleanCompanyName}
              getSkillMeta={getSkillMeta}
              getNationalityMeta={getNationalityMeta}
              getInspectorGradeMeta={getInspectorGradeMeta}
              handleOpenPersonnelCard={handleOpenPersonnelCard}
              handleOpenDeleteWorkerModal={handleOpenDeleteWorkerModal}
            />
          )}
        </div>
      )}

      {/* 📑 TAB 3: 특근보고서 관리 */}
      {activeTab === "legacy_reports" && (
        <OvertimeReportsTab
          legacyReports={legacyReports}
          isWeekendByDate={isWeekendByDate}
          reportListFilter={reportListFilter}
          setReportListFilter={setReportListFilter}
          cleanCompanyName={cleanCompanyName}
          reportListSearch={reportListSearch}
          setReportListSearch={setReportListSearch}
          getReportDateSortKey={getReportDateSortKey}
          dateSortOrder={dateSortOrder}
          setDateSortOrder={setDateSortOrder}
          COMPANIES={COMPANIES}
          setActiveTab={setActiveTab}
          formatShortMonthDay={formatShortMonthDay}
          getPlantForCompany={getPlantForCompany}
          renderPlantBadge={renderPlantBadge}
          renderCompanyBadge={renderCompanyBadge}
          handleOpenLegacyReport={handleOpenLegacyReport}
          handleEditReport={handleEditReport}
          handleDeleteReport={handleDeleteReport}
        />
      )}

      {/* 📑 MODAL: 특근보고서 상세 및 결재 */}
      <OvertimeReportDetailModal
        isOpen={isLegacyModalOpen}
        onClose={() => {
          setIsLegacyModalOpen(false);
          setSelectedLegacyReport(null);
        }}
        selectedLegacyReport={selectedLegacyReport}
        approvalDocs={approvalDocs}
        cleanCompanyName={cleanCompanyName}
        getPlantForCompany={getPlantForCompany}
        getLiveApprovalForReport={getLiveApprovalForReport}
        KWON_SIGNATURE_BLACK={KWON_SIGNATURE_BLACK}
        handleDeleteReport={handleDeleteReport}
        checkApprovalPermission={checkApprovalPermission}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        approveDocumentStep={approveDocumentStep}
        triggerToast={triggerToast}
        handleEditReport={handleEditReport}
      />

      {/* 🪪 MODAL: 제조현장 인사카드 작성 및 관리 */}
      {isPersonnelModalOpen && selectedPersonnelWorker && (
        <PersonnelCardModal
          isOpen={isPersonnelModalOpen}
          onClose={() => {
            setIsPersonnelModalOpen(false);
            setSelectedPersonnelWorker(null);
          }}
          worker={selectedPersonnelWorker}
          workerIndex={selectedPersonnelWorkerIndex}
          onSave={handleSavePersonnelCard}
          onDelete={handleOpenDeleteWorkerModal}
        />
      )}

      {/* 👥 MODAL: 4M 결근 관리 및 변동점 MAN 연동 */}
      {isAbsence4MModalOpen && (
        <Absence4MModal
          isOpen={isAbsence4MModalOpen}
          onClose={() => setIsAbsence4MModalOpen(false)}
          initialCompany={absence4MCompany}
          selectedDay={selectedDay}
          currentYear={currentYear}
          currentMonth={currentMonthNum}
          attendanceMatrix={effectiveMatrix || smartData.attendanceMatrix || []}
          onSaveSyncWithReports={() => {}}
        />
      )}

      {/* 🗑️ MODAL: 인원 영구 삭제 확인 */}
      <OvertimeDeleteWorkerModal
        workerToDelete={workerToDelete}
        onClose={() => setWorkerToDelete(null)}
        isDeletingWorker={isDeletingWorker}
        handleConfirmDeleteWorker={handleConfirmDeleteWorker}
      />
    </div>
  );
};

export default OvertimeStatusView;
