import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Cpu, Target, Gauge, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import { DigitalInspectionModal } from "./sq/DigitalInspectionModal";

import { SevereDisasterBar } from "./SevereDisasterBar";
import FieldWorkerDashboardView from "./dashboard/FieldWorkerDashboardView";
import { useAuth, PLANTS, ADMIN_USERS, isManagerOrAdminUser } from "../context/AuthContext";
import { useMonth, DEFAULT_MONTH_LIST } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  getLocalSmartOvertimeData,
  calculateDailySummary,
  subscribeSmartOvertimeData,
  cleanCompanyName,
  getReportDateSortKey
} from "../services/overtimeSmartService.js";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  isApprovalDocPending
} from "../services/approvalService";
import { getLocalAccessLogs, subscribeAccessLogs } from "../services/accessLogService";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  getLatestOvertimeSummary,
  formatKoreanWorkDate,
  isWeekendByDate
} from "../services/overtimeService";
import { isWorkLogApproved } from "../services/workLogService";
import {
  subscribeQualityRecords,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  getPreviousYearMonth,
  QUALITY_CORE_ITEMS
} from "../services/qualityService";
import { getKSTDateString, formatKSTDate, formatRelativeAccessTime } from "../utils/dateUtils";
import { pushModalHistory, useModalHistory } from "../utils/modalHistory";
import { ExtrusionWorkerDashboardView } from "./extrusion/ExtrusionWorkerDashboardView";
import { isExtrusionWorkerProfile } from "../services/extrusionQualityIssueService";
import { HanulWorkerDashboardView } from "./hanul/HanulWorkerDashboardView";
import { isHanulWorkerProfile } from "../services/hanulQualityIssueService";
import { MachiningWorkerDashboardView } from "./machining/MachiningWorkerDashboardView";
import { isMachiningWorkerProfile } from "../services/machiningQualityIssueService";
import { YuseongWorkerDashboardView } from "./yuseong/YuseongWorkerDashboardView";
import { isYuseongWorkerProfile } from "../services/yuseongQualityIssueService";
import { UnifiedAbnormalityControlPanel } from "./dashboard/UnifiedAbnormalityControlPanel";
import { DashboardModalsContainer } from "./dashboard/DashboardModalsContainer";
import { getWorkerPersonnelCard, isWorkerManagerRole } from "../services/personnelCardService";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  HanulAndSevereDisasterSection,
  SalesPurchaseSummarySection,
  AttendanceSummarySection,
  QualityStatusSection,
  ExtrusionDowntimeSection,
  DailyWorkLogTableSection,
  AdminAccessAndIncidentSection
} from "./dashboard/sections";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../services/hanulQualityIssueService";
import {
  useCommonSchedule,
  useWorkerSchedule,
  useDashboardExcel,
  useWorkLogCrud,
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
} from "../hooks/dashboard";

export {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
};

// 30분 단위 시간 선택 목록 (종일 + 24시간 30분 간격)
const TIME_OPTIONS_30MIN = [
  "종일",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30"
];

// Storage key for Extrusion 4-Lines Downtime Data (Synced directly with ExtrusionDowntimeView)
const STORAGE_KEY_EXTRUSION = "factory_extrusion_downtime_user_uploaded_v5";

// Dynamic Extrusion 4-Lines Summary calculated purely from real uploaded data
export const getExtrusionSummaryData = () => {
  let store = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXTRUSION);
    if (saved) {
      store = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load extrusion data:", e);
  }

  const lines = [
    { id: "pcm1", name: "PCM 1호기", plant: "삼랑진공장" },
    { id: "pcm3", name: "PCM 3호기", plant: "삼랑진공장" },
    { id: "tpe1", name: "TPE 1호기", plant: "삼랑진공장" },
    { id: "pvc1", name: "PVC 1호기", plant: "삼랑진공장" }
  ];

  return lines.map((l) => {
    const records = store[l.id] || [];
    const totalDowntimeMinutes = records.reduce((sum, r) => sum + (Number(r.durationMinutes) || 0), 0);
    const issueCount = records.length;
    const latest = records[records.length - 1];

    let status = "정상가동";
    let statusColor = "emerald";
    if (totalDowntimeMinutes > 180) {
      status = "가동주의";
      statusColor = "rose";
    } else if (totalDowntimeMinutes > 60) {
      status = "점검대기";
      statusColor = "amber";
    }

    return {
      id: l.id,
      name: l.name,
      plant: l.plant,
      status,
      statusColor,
      totalDowntimeMinutes,
      issueCount,
      mainReason: latest ? `${latest.reason || "설비점검"} (${latest.durationMinutes}분)` : "특이사항 없음",
      actionTaken: latest ? latest.actionTaken || "조치 완료" : "정상 운전",
      recentDate: latest?.date || "-"
    };
  });
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, currentMonthData, uploadMonthlyData, availableMonths, changeMonth, currentYearMonth, allMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  const isManagerRole = isWorkerManagerRole(currentProfile);
  const workerPlant = currentProfile?.plant || "삼랑진공장";
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

  const isHanul = !isExtrusionWorker && isHanulWorkerProfile(currentProfile);

  const isBurimtech = !isExtrusionWorker && !isHanul && Boolean(
    currentProfile?.portalType === "bulimtech" ||
    currentProfile?.company === "부림텍" ||
    currentProfile?.name === "부림텍" ||
    String(currentProfile?.id || "").startsWith("hal_br_")
  );

  const isPartnerProfile = !currentProfile?.isFieldWorker && (
    currentProfile?.isPartner ||
    currentProfile?.name === "유성" ||
    currentProfile?.name === "한울" ||
    currentProfile?.name === "부림텍" ||
    (!String(currentProfile?.id || "").includes("_") && (currentProfile?.company === "유성" || currentProfile?.company === "한울" || currentProfile?.company === "부림텍"))
  );

  const assignedProcess = currentProfile?.assignedProcess || (
    currentProfile?.building === "압출동" ? "압출" :
    isExtrusionWorker ? "압출" :
    isHanul ? "외주가공 (한울)" :
    isBurimtech ? "외주가공 (부림텍)" :
    isPartnerProfile ? "외주가공" :
    "가공"
  );

  const isTestUser = currentProfile?.name === "TEST" || currentProfile?.id === "hal_test";
  const [isHanulSettlementModalOpen, setIsHanulSettlementModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isHanulQualityIssueModalOpen, setIsHanulQualityIssueModalOpen] = useState(false);
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [hanulReportProject, setHanulReportProject] = useState("9BQC");
  const [hanulReportProcess, setHanulReportProcess] = useState("소재준비");
  const [hanulReportEditData, setHanulReportEditData] = useState(null);
  const [isWorkLogsSummaryModalOpen, setIsWorkLogsSummaryModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  useModalHistory(isHanulSettlementModalOpen, () => setIsHanulSettlementModalOpen(false), "workerDashboardHanulModal");
  useModalHistory(isHanulWorkReportModalOpen, () => setIsHanulWorkReportModalOpen(false), "workerDashboardHanulReportModal");
  useModalHistory(isHanulQualityIssueModalOpen, () => setIsHanulQualityIssueModalOpen(false), "workerDashboardHanulQualityModal");
  useModalHistory(isWorkLogsSummaryModalOpen, () => setIsWorkLogsSummaryModalOpen(false), "workerDashboardWorkLogsSummaryModal");

  useEffect(() => {
    const unsub = subscribeHanulQualityIssues((list) => {
      setHanulQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const activeHanulQualityCount = useMemo(() => {
    return (hanulQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [hanulQualityIssues]);

  const handleOpenHanulReport = (proj = "9BQC", proc = "소재준비", editData = null) => {
    setHanulReportProject(proj);
    setHanulReportProcess(proc);
    setHanulReportEditData(editData);
    setIsHanulWorkReportModalOpen(true);
  };

  const handleOpenHanulSettlementModal = () => {
    pushModalHistory("hanul_settlement_modal");
    setIsHanulSettlementModalOpen(true);
  };

  const [selectedOvertimeReportForModal, setSelectedOvertimeReportForModal] = useState(null);

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

  // Extrusion 4-Lines Downtime Summary (실시간 업로드 데이터 연동)
  const [extrusionSummaryList, setExtrusionSummaryList] = useState(() => getExtrusionSummaryData());

  useEffect(() => {
    const refreshExtrusionData = () => {
      setExtrusionSummaryList(getExtrusionSummaryData());
    };
    window.addEventListener("storage", refreshExtrusionData);
    window.addEventListener("focus", refreshExtrusionData);
    window.addEventListener("extrusion-data-updated", refreshExtrusionData);
    return () => {
      window.removeEventListener("storage", refreshExtrusionData);
      window.removeEventListener("focus", refreshExtrusionData);
      window.removeEventListener("extrusion-data-updated", refreshExtrusionData);
    };
  }, []);

  // 5 Company Smart Overtime Ledger & Reports Subscription
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());

  useEffect(() => {
    const unsubSmart = subscribeSmartOvertimeData((data) => {
      if (data && data.attendanceMatrix) {
        setSmartOvertimeData(data);
      }
    });
    const unsubReports = subscribeOvertimeReports((reports) => {
      setOvertimeReports(reports || []);
    });
    const handleOvertimeUpdated = (e) => {
      if (e.detail?.reports) {
        setOvertimeReports(e.detail.reports);
      } else {
        setOvertimeReports(getLocalOvertimeReports());
      }
    };
    window.addEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    return () => {
      unsubSmart();
      unsubReports();
      window.removeEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    };
  }, []);

  // 당일 작성여부 및 미작성 업체 계산 (보고서와 대장 실시간 통합)
  const { companyOverviewStats, unwrittenCompanies } = useMemo(() => {
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const todayStr = getKSTDateString();
    const todayParts = todayStr.split("-");
    const todayDayNum = todayParts.length === 3 ? parseInt(todayParts[2], 10) : new Date().getDate();
    const todayYear = todayParts.length === 3 ? parseInt(todayParts[0], 10) : 2026;
    const todayMonth = todayParts.length === 3 ? parseInt(todayParts[1], 10) : 10;

    const matrix = rawMatrix;
    const daily = calculateDailySummary(matrix, todayDayNum, todayYear, todayMonth);
    const companyStyles = {
      "오륙": { dot: "bg-blue-500", borderHover: "hover:border-blue-400 dark:hover:border-blue-500", badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800" },
      "조영": { dot: "bg-purple-500", borderHover: "hover:border-purple-400 dark:hover:border-purple-500", badgeColor: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800" },
      "한울": { dot: "bg-emerald-500", borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500", badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800" },
      "부림텍": { dot: "bg-amber-500", borderHover: "hover:border-amber-400 dark:hover:border-amber-500", badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800" },
      "유성": { dot: "bg-cyan-500", borderHover: "hover:border-cyan-400 dark:hover:border-cyan-500", badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800" }
    };

    const companies = ["오륙", "조영", "한울", "부림텍", "유성"].map((name) => {
      const styles = companyStyles[name] || companyStyles["오륙"];
      const cleanCompName = cleanCompanyName(name);
      const b = daily?.companyBreakdown?.[cleanCompName] || daily?.companyBreakdown?.[name];
      const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === cleanCompName);
      const hasDirectReport = (overtimeReports || []).some((r) => {
        if (!r) return false;
        const rDateKey = getReportDateSortKey(r);
        if (rDateKey !== todayStr) return false;
        const rComp = cleanCompanyName(r.company || "");
        if (rComp && rComp !== "전체" && rComp !== "5개사 통합" && rComp !== "전사" && rComp !== "통합" && rComp !== "ALL") {
          return rComp === cleanCompName;
        }
        if (Array.isArray(r.companies) && r.companies.length > 0) {
          return r.companies.some((c) => cleanCompanyName(c) === cleanCompName);
        }
        return false;
      });

      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[todayDayNum] !== undefined ? w.daily[todayDayNum] : w.daily[String(todayDayNum)])) ?? w[todayDayNum] ?? w[String(todayDayNum)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;

      // 🔒 [단일 진실의 원천 원칙] 원장에 등록된 작업원(compWorkers)이 존재하는 협력사는
      // 당일 근태 대장에 실제 입력(enteredCount > 0)되어야만 '작성완료'로 판정합니다.
      // 대장이 비어있는(enteredCount === 0) 상태에서 보고서만 임의 생성된 유령 보고서는 작성완료로 인정하지 않습니다.
      const isWritten = compWorkers.length > 0 ? enteredCount > 0 : hasDirectReport;
      const shortName = name.replace(/[()주]/g, "");

      const workers = b?.total && b.total > 0 ? b.total : compWorkers.length;
      const attended = b ? (b.attended || 0) : 0;
      const absent = b ? (b.absent || 0) : 0;
      const otWorkers = b ? (b.otWorkers || 0) : 0;
      const otHours = b ? (b.otHours || 0) : 0;
      const totalHours = b ? (b.totalHours || 0) : 0;

      const statusBadgeText = isWritten ? "작성완료" : "작성전";
      const statusBadgeClass = isWritten
        ? "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
        : "bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold";

      return {
        name,
        shortName,
        isWritten,
        statusBadgeText,
        statusBadgeClass,
        workers,
        attended,
        absent,
        otWorkers,
        otHours,
        totalHours,
        dot: styles.dot,
        borderHover: styles.borderHover,
        badgeColor: styles.badgeColor,
        isTotal: false
      };
    });

    const unwritten = companies.filter((c) => !c.isWritten);

    const totalWorkers = companies.reduce((acc, c) => acc + (c.workers || 0), 0);
    const totalAttended = companies.reduce((acc, c) => acc + (c.attended || 0), 0);
    const totalAbsent = companies.reduce((acc, c) => acc + (c.absent || 0), 0);
    const totalOtWorkers = companies.reduce((acc, c) => acc + (c.otWorkers || 0), 0);
    const totalOtHours = companies.reduce((acc, c) => acc + (c.otHours || 0), 0);
    const totalHours = companies.reduce((acc, c) => acc + (c.totalHours || 0), 0);

    const totalItem = {
      name: "전회사 TOTAL",
      shortName: "전사",
      isWritten: unwritten.length === 0,
      statusBadgeText: unwritten.length === 0 ? "전사 완료" : `${5 - unwritten.length}/5 완료`,
      statusBadgeClass: unwritten.length === 0
        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
        : "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700",
      workers: totalWorkers,
      attended: totalAttended,
      absent: totalAbsent,
      otWorkers: totalOtWorkers,
      otHours: totalOtHours,
      totalHours: totalHours,
      dot: "bg-rose-500",
      borderHover: "hover:border-cyan-500 dark:hover:border-cyan-400 ring-1 ring-cyan-400/40 dark:ring-cyan-500/30",
      badgeColor: "text-cyan-800 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800",
      isTotal: true
    };

    return {
      companyOverviewStats: [totalItem, ...companies],
      unwrittenCompanies: unwritten
    };
  }, [smartOvertimeData, overtimeReports]);

  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());

  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
    });
    const handleApprovalUpdated = (e) => {
      if (e.detail?.docs) {
        setApprovalDocs(e.detail.docs);
      } else {
        setApprovalDocs(getLocalApprovalDocs());
      }
    };
    window.addEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    return () => {
      unsub();
      window.removeEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    };
  }, []);

  const pendingCount = useMemo(() => {
    return approvalDocs.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
  }, [approvalDocs, currentProfile, isAdmin]);

  const holdCount = useMemo(() => approvalDocs.filter((d) => d.status === "HOLD").length, [approvalDocs]);

  // Plant-specific approval authority
  const canApproveSamrangjin = isMyeongjae || (currentProfile?.plant === "삼랑진공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;
  const canApproveHallim = isDongwook || (currentProfile?.plant === "한림공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;

  const canApproveLog = (log) => {
    if (!log) return false;
    if (isAdmin) return true;
    if (log.plant === "삼랑진공장" && canApproveSamrangjin) return true;
    if (log.plant === "한림공장" && canApproveHallim) return true;
    return false;
  };

  // Access Logs State for ADMIN
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

  // 특근보고서 결재 완료 여부 확인
  const isOvertimeReportApproved = useCallback((rep) => {
    if (!rep) return false;
    const isWk = isWeekendByDate(rep.workDate || rep.title || rep.workDateFormatted);
    if (!isWk) return true;

    if (rep.approvalStatus === "결재완료" || rep.approvalStatus === "APPROVED" || rep.status === "APPROVED" || rep.status === "결재완료") {
      return true;
    }
    if (Array.isArray(rep.approval) && rep.approval.length > 0 && rep.approval.every((st) => st.status === "완료" || st.status === "APPROVED")) {
      return true;
    }
    if (Array.isArray(approvalDocs)) {
      const isSam = rep.plant === "삼랑진공장" || rep.company === "(주)오륙" || rep.company === "유성" || rep.plant?.includes("삼랑진");
      const plantKey = isSam ? "samrangjin" : "hanlim";
      const targetPlant = isSam ? "삼랑진공장" : "한림공장";
      const dateKey = rep.workDate ? rep.workDate.replace(/-/g, "") : "";
      const matchedDoc = approvalDocs.find((d) => {
        const isOt = d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "OVERTIME";
        if (!isOt) return false;
        const matchesPlant = d.plant === targetPlant || d.targetPlant === targetPlant || (d.id && d.id.includes(plantKey)) || (d.title && d.title.includes(isSam ? "삼랑진" : "한림"));
        const matchesDate = (dateKey && d.id && d.id.includes(dateKey)) || d.workDate === rep.workDate || (d.title && rep.workDate && d.title.includes(rep.workDate));
        return matchesPlant && matchesDate;
      });
      if (matchedDoc) {
        if (matchedDoc.status === "APPROVED" || matchedDoc.status === "결재완료") {
          return true;
        }
        if (Array.isArray(matchedDoc.steps) && matchedDoc.steps.every((st) => st.status === "APPROVED" || st.status === "완료")) {
          return true;
        }
      }
    }
    return false;
  }, [approvalDocs]);

  // 공장별 최신 실시간 미결재 특근보고서 (주말/휴일 특근보고서 대상)
  const pendingApprovalCards = useMemo(() => {
    if (!Array.isArray(overtimeReports)) return [];
    const list = [];
    const sorted = [...overtimeReports].sort((a, b) => (b.workDate || "").localeCompare(a.workDate || ""));

    const samReport = sorted.find((r) => {
      const isSam = r.plant === "삼랑진공장" || r.company === "(주)오륙" || r.company === "유성";
      return isSam && !isOvertimeReportApproved(r);
    });
    if (samReport) list.push({ ...samReport, plantName: "삼랑진공장" });

    const halReport = sorted.find((r) => {
      const isHal = r.plant === "한림공장" || r.company === "조영" || r.company === "한울" || r.company === "부림텍";
      return isHal && !isOvertimeReportApproved(r);
    });
    if (halReport) list.push({ ...halReport, plantName: "한림공장" });

    return list;
  }, [overtimeReports, isOvertimeReportApproved]);

  const getReportWorkersList = (report) => {
    if (!report) return [];
    if (Array.isArray(report.workers) && report.workers.length > 0) {
      return report.workers;
    }
    const cleanComp = cleanCompanyName(report.company || "");
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const matched = rawMatrix.filter((w) => cleanCompanyName(w.company) === cleanComp);
    if (matched.length > 0) {
      return matched.map((w, idx) => ({
        id: idx + 1,
        name: w.name,
        company: w.company,
        line: w.process || "생산",
        hours: 8,
        overtimeHours: 2,
        tasks: report.workContent || "휴일 특근 및 생산라인 가동"
      }));
    }
    return [
      { id: 1, name: "심임대", company: "(주)오륙", line: "JA G-RUN", hours: 8, overtimeHours: 2.5, tasks: "금형 교체 및 조립" },
      { id: 2, name: "이상은", company: "(주)오륙", line: "NX4 G-RUN", hours: 8, overtimeHours: 2.0, tasks: "원소재 검사 및 포장" },
      { id: 3, name: "최현영", company: "(주)오륙", line: "HR G-RUN", hours: 8, overtimeHours: 2.0, tasks: "완제품 적재 및 출하" }
    ];
  };

  // Quality Real-time data for Dashboard
  const [qualityRecords, setQualityRecords] = useState([]);
  const [qualityPopupItem, setQualityPopupItem] = useState(null);

  useEffect(() => {
    const unsub = subscribeQualityRecords((recs) => {
      setQualityRecords(recs);
    });
    return () => unsub();
  }, []);

  const handleOpenQualityPopup = (it) => {
    pushModalHistory("quality_popup");
    setQualityPopupItem(it);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setQualityPopupItem(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const prevYearMonth = useMemo(() => {
    return getPreviousYearMonth(selectedMonth || currentYearMonth || "2026-09");
  }, [selectedMonth, currentYearMonth]);

  const liveQualityPrevMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, prevYearMonth);
  }, [qualityRecords, prevYearMonth]);

  const liveQualityCurrentMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const liveQualityDaily = useMemo(() => {
    return getQualityDailyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const handleExportQualityItemExcel = (targetItem) => {
    if (!targetItem) return;
    const rows = [
      [`[${targetItem.name}] ${selectedMonth || "2026-09"} 일자별 품질 검사 & 불량 정리본`],
      ["차종", targetItem.carModel, "조회기준월", selectedMonth || "2026-09", "품질목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["검사일자", "요일", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "품질 손실금액(원)", "주요 불량 사유(WORST)"]
    ];

    liveQualityDaily.forEach((d) => {
      const it = d.items?.[targetItem.id] || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "-" };
      rows.push([
        d.date,
        `${d.dayOfWeek}요일`,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        it.lossAmount,
        it.worstReason || "-"
      ]);
    });

    rows.push([]);
    rows.push([
      "월간 누계 합계",
      "-",
      targetItem.inspectQty,
      targetItem.defectQty,
      `${targetItem.defectRate}%`,
      targetItem.lossAmount,
      targetItem.worstReason
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, targetItem.carModel);
    XLSX.writeFile(wb, `${targetItem.carModel}_일자별품질정리본_${selectedMonth || "2026-09"}.xlsx`);
  };

  // Shared Toast states
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");

  const todayDateStr = useMemo(() => getKSTDateString(), []);

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

  // =========================================================================
  // 🪝 4 Dedicated Modular Custom Hooks (Step 4 Refactoring)
  // =========================================================================

  // 1. Worker Schedule & Weekly Calendar Hook
  const {
    annualLeaves,
    myActiveLeaves,
    handleDeleteLeave,
    handleReactivateLeave,
    scheduleSelectedDate,
    setScheduleSelectedDate,
    scheduleLeaveType,
    setScheduleLeaveType,
    scheduleReasonInput,
    setScheduleReasonInput,
    sharedWorkers,
    setSharedWorkers,
    isShareDropdownOpen,
    setIsShareDropdownOpen,
    shareDropdownRef,
    scheduleSaving,
    showMiniCalendar,
    setShowMiniCalendar,
    scheduleDetailModal,
    setScheduleDetailModal,
    scheduleAttachedFiles,
    isProcessingScheduleFiles,
    scheduleCameraInputRef,
    scheduleFileInputRef,
    handleScheduleFiles,
    handleRemoveScheduleFile,
    sharedReplyModalItem,
    setSharedReplyModalItem,
    replyTextInput,
    setReplyTextInput,
    replySubmitting,
    sharedSenderConfirmModalItem,
    setSharedSenderConfirmModalItem,
    confirmSubmitting,
    toggleSharedWorker,
    togglePlantSharedWorkers,
    scheduleWeekAnchor,
    handlePrevWeek,
    handleNextWeek,
    handleResetToToday,
    myWeeklyCalendarDays,
    handleRequestDismissOrDelete,
    handleSendSharedReply,
    handleConfirmSenderDismiss,
    handleRegisterSchedule
  } = useWorkerSchedule({
    currentProfile,
    workerFullName,
    workerPlant,
    officialTitle,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // 2. Company Common Schedule & Comments Hook
  const {
    commonSchedules,
    commonScheduleFilterTab,
    setCommonScheduleFilterTab,
    commonScheduleForm,
    setCommonScheduleForm,
    commonScheduleSaving,
    commonScheduleModalOpen,
    setCommonScheduleModalOpen,
    selectedCommonScheduleForComments,
    setSelectedCommonScheduleForComments,
    commonScheduleCommentInput,
    setCommonScheduleCommentInput,
    commonScheduleCommentSubmitting,
    allActiveCommonSchedules,
    hasNewScheduleMessage,
    uncompletedCommonSchedules,
    scheduleCounts,
    modalFilteredSchedules,
    handleToggleCompleteCommonSchedule,
    handleRegisterCommonSchedule,
    handleDeleteCommonSchedule,
    handleAddCommonScheduleComment,
    handleDeleteCommonScheduleComment
  } = useCommonSchedule({
    currentProfile,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // 3. Work Log CRUD, Maintenance Items, and Pagination Hook
  const {
    workLogs,
    currentLogPage,
    setCurrentLogPage,
    isModalOpen,
    setIsModalOpen,
    selectedLogDetail,
    setSelectedLogDetail,
    filterPlant,
    setFilterPlant,
    approvalCommentInput,
    setApprovalCommentInput,
    editingLog,
    setEditingLog,
    editFormData,
    setEditFormData,
    editMaintenanceItems,
    isEditProcessingImages,
    workerLogScope,
    setWorkerLogScope,
    workerLogApprovalFilter,
    setWorkerLogApprovalFilter,
    formData,
    setFormData,
    isSavingLog,
    isProcessingImages,
    previewImageModal,
    setPreviewImageModal,
    maintenanceItems,
    pendingSamrangjinCount,
    pendingHallimCount,
    todayLog,
    workerLogsList,
    filteredLogs,
    totalLogPages,
    paginatedLogs,
    handleOpenWorkLogModal,
    handleOpenLogDetail,
    handleWorkLogImageFiles,
    handleRemoveWorkLogImage,
    handleAddMaintenanceItem,
    handleRemoveMaintenanceItem,
    handleUpdateMaintenanceItem,
    handleMaintenanceItemImageFiles,
    handleRemoveMaintenanceItemImage,
    handleApproveLog,
    handleBatchApproveLogs,
    handleRejectLog,
    handleSaveLog,
    handleDeleteLog,
    handleOpenEditModal,
    handleEditLogImageFiles,
    handleRemoveEditLogImage,
    handleAddEditMaintenanceItem,
    handleRemoveEditMaintenanceItem,
    handleUpdateEditMaintenanceItem,
    handleEditMaintenanceItemImageFiles,
    handleRemoveEditMaintenanceItemImage,
    handleSaveEditedLog
  } = useWorkLogCrud({
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

  // 4. Dashboard Excel (Quality & General PnL) Hook
  const {
    dailyPnLModalOpen,
    setDailyPnLModalOpen,
    sendingDailyPnL,
    customPnLBriefing,
    setCustomPnLBriefing,
    selectedPnLChannel,
    setSelectedPnLChannel,
    handleSendDailyPnLTelegram,
    qualityFiles,
    setQualityFiles,
    qualityUploadSuccess,
    setQualityUploadSuccess,
    qualityFileInputRef,
    handleQualityFiles,
    handleQualityDrag,
    handleQualityDrop,
    qualityDragActive,
    qualityParsing,
    qualityUploading,
    qualitySuccessMessage,
    handleConfirmQualityUpload,
    fileInputRef,
    dragActive,
    parsing,
    uploading,
    parsedResult,
    setParsedResult,
    uploadSuccess,
    setUploadSuccess,
    successMessage,
    handleExcelFile,
    handleDrag,
    handleDrop,
    handleConfirmExcelUpload
  } = useDashboardExcel({
    workerFullName,
    workerPlant,
    selectedMonth,
    currentYearMonth,
    uploadMonthlyData,
    onBulkUpload,
    changeMonth,
    uncompletedCommonSchedules,
    todayDateStr,
    totalSales,
    totalPurchases,
    salesAchievementPct,
    purchaseAchievementPct,
    setToastMessage,
    setLogSavedToast
  });

  // 🌟 압출동 일반 현장작업자 로그인 시
  const isExtrusionOperatorWorker =
    isExtrusionWorkerProfile(currentProfile) &&
    currentProfile?.name !== "설유철" &&
    currentProfile?.id !== "sam_yc" &&
    !isAdmin;

  if (isExtrusionOperatorWorker) {
    return (
      <ExtrusionWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // 🌟 한울 외주가공 현장작업자
  const isHanulOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isHanulWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isHanulOperatorWorker) {
    return (
      <HanulWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // 🌟 삼랑진공장 가공동 현장작업자 (JA, NX4, NX4a, HR G/RUN 4대 차종)
  const isMachiningOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isMachiningWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isMachiningOperatorWorker) {
    return (
      <MachiningWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // 🌟 (주)유성 외주가공 현장작업자 (JK1 Part'g, CE1 Part'g, DT Hood)
  const isYuseongOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isYuseongWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isYuseongOperatorWorker) {
    return (
      <YuseongWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-fadeIn pb-12 max-w-[1600px] w-full mx-auto px-0.5 sm:px-0 min-w-0 max-w-full">
      {!isManagerOrAdmin ? (
        /* 🏭 [현장 작업자 전용 모드] */
        <FieldWorkerDashboardView
          workerPlant={workerPlant}
          workerFullName={workerFullName}
          workerPosition={workerPosition}
          assignedProcess={assignedProcess}
          todayFormattedLabel={todayFormattedLabel}
          handleOpenWorkLogModal={handleOpenWorkLogModal}
          isExtrusionWorkerOnly={isExtrusionWorkerOnly}
          onNavigateTab={onNavigateTab}
          todayLog={todayLog}
          isWorkLogApproved={isWorkLogApproved}
          handleOpenLogDetail={handleOpenLogDetail}
          handleOpenEditModal={handleOpenEditModal}
          workerLogsList={workerLogsList}
          workerLogScope={workerLogScope}
          setWorkerLogScope={setWorkerLogScope}
          workerLogApprovalFilter={workerLogApprovalFilter}
          setWorkerLogApprovalFilter={setWorkerLogApprovalFilter}
          currentProfile={currentProfile}
          handleDeleteLog={handleDeleteLog}
        />
      ) : (
        <>
          {/* 🌟 압출동 일반작업자 전용 상단 배너 */}
          {(currentProfile?.building === "압출동" || currentProfile?.id?.startsWith("ext_") || currentProfile?.name === "공영국") && currentProfile?.name !== "설유철" && currentProfile?.id !== "sam_yc" && (
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    🏭 삼랑진공장 압출동 작업자 모드 ({currentProfile.name}{currentProfile.title ? ` ${currentProfile.title}` : ""})
                  </h3>
                  <p className="text-xs text-teal-100 font-medium">
                    압출 생산관리 탭에서 실시간 작업일보 작성 및 생산실적/비가동 분석을 확인하세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem("factory_extrusion_active_subtab", "production");
                  } catch (e) {}
                  if (onNavigateTab) onNavigateTab("extrusion_downtime");
                }}
                className="px-4 py-2 rounded-xl bg-white text-teal-800 font-black text-xs sm:text-sm hover:bg-teal-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer text-center"
              >
                🏭 압출 생산관리 및 작업일보 바로가기 ➡️
              </button>
            </div>
          )}

          {/* 🛡️ [한림공장 TEST 전용] 관제 패널 */}
          {isTestUser && (
            <UnifiedAbnormalityControlPanel
              workLogs={workLogs}
              currentProfile={currentProfile}
              onOpenWorkLogDetail={(log) => setSelectedLogDetail(log)}
              onOpenExtrusionReport={() => {
                try {
                  localStorage.setItem("factory_extrusion_active_subtab", "production");
                } catch (e) {}
                if (onNavigateTab) onNavigateTab("extrusion_downtime");
              }}
              onOpenIssueModal={() => {
                if (onNavigateTab) onNavigateTab("quality_control");
              }}
            />
          )}

          {/* 📌 사내 공통일정 */}
          <CommonScheduleBar
            isAdmin={isAdmin}
            hasNewScheduleMessage={hasNewScheduleMessage}
            allActiveCommonSchedules={allActiveCommonSchedules}
            setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
            todayDateStr={todayDateStr}
            isGeneralManager={isGeneralManager}
            handleDeleteCommonSchedule={handleDeleteCommonSchedule}
            setCommonScheduleModalOpen={setCommonScheduleModalOpen}
          />

          {/* 🌟 작업자 일정/연차 및 스마트 캘린더 센터 */}
          <WorkerScheduleCalendarSection
            workerPlant={workerPlant}
            workerFullName={workerFullName}
            onNavigateTab={onNavigateTab}
            pendingCount={pendingCount}
            holdCount={holdCount}
            officialTitle={officialTitle}
            isAdmin={isAdmin}
            isManagerRole={isManagerRole}
            scheduleLeaveType={scheduleLeaveType}
            setScheduleLeaveType={setScheduleLeaveType}
            scheduleSelectedDate={scheduleSelectedDate}
            setScheduleSelectedDate={setScheduleSelectedDate}
            scheduleReasonInput={scheduleReasonInput}
            setScheduleReasonInput={setScheduleReasonInput}
            handleRegisterSchedule={handleRegisterSchedule}
            scheduleSaving={scheduleSaving}
            scheduleCameraInputRef={scheduleCameraInputRef}
            scheduleFileInputRef={scheduleFileInputRef}
            handleScheduleFiles={handleScheduleFiles}
            scheduleAttachedFiles={scheduleAttachedFiles}
            isProcessingScheduleFiles={isProcessingScheduleFiles}
            handleRemoveScheduleFile={handleRemoveScheduleFile}
            setPreviewImageModal={setPreviewImageModal}
            shareDropdownRef={shareDropdownRef}
            isShareDropdownOpen={isShareDropdownOpen}
            setIsShareDropdownOpen={setIsShareDropdownOpen}
            sharedWorkers={sharedWorkers}
            setSharedWorkers={setSharedWorkers}
            toggleSharedWorker={toggleSharedWorker}
            togglePlantSharedWorkers={togglePlantSharedWorkers}
            currentProfile={currentProfile}
            ADMIN_USERS={ADMIN_USERS}
            PLANTS={PLANTS}
            myActiveLeaves={myActiveLeaves}
            todayDateStr={todayDateStr}
            formatKSTDate={formatKSTDate}
            setScheduleDetailModal={setScheduleDetailModal}
            handleRequestDismissOrDelete={handleRequestDismissOrDelete}
            showMiniCalendar={showMiniCalendar}
            setShowMiniCalendar={setShowMiniCalendar}
            scheduleWeekAnchor={scheduleWeekAnchor}
            handlePrevWeek={handlePrevWeek}
            handleResetToToday={handleResetToToday}
            handleNextWeek={handleNextWeek}
            myWeeklyCalendarDays={myWeeklyCalendarDays}
          />

          {/* 🌟 한울 외주가공 지출내역 / 품질경보 / 일보 & 중대재해 안전판 */}
          <HanulAndSevereDisasterSection
            isHanul={isHanul}
            isAdmin={isAdmin}
            handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
            setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
            activeHanulQualityCount={activeHanulQualityCount}
            handleOpenHanulReport={handleOpenHanulReport}
            currentProfile={currentProfile}
            SevereDisasterBar={SevereDisasterBar}
          />

          {/* 1. 매입매출현황 요약 */}
          <SalesPurchaseSummarySection
            monthTitle={monthTitle}
            currentMonthData={currentMonthData}
            todayFormattedLabel={todayFormattedLabel}
            onNavigateTab={onNavigateTab}
            formatAmount={formatAmount}
            totalSales={totalSales}
            totalPurchases={totalPurchases}
            purchaseRatio={purchaseRatio}
          />

          {/* 2. 근태현황 및 관리 */}
          <AttendanceSummarySection
            todayFormattedLabel={todayFormattedLabel}
            unwrittenCompanies={unwrittenCompanies}
            onNavigateTab={onNavigateTab}
            companyOverviewStats={companyOverviewStats}
            pendingApprovalCards={pendingApprovalCards}
            pushModalHistory={pushModalHistory}
            setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
            formatKoreanWorkDate={formatKoreanWorkDate}
          />

          {/* 3. 금형별 일일품질 요약 */}
          <QualityStatusSection
            selectedMonth={selectedMonth}
            onNavigateTab={onNavigateTab}
            liveQualityCurrentMonthly={liveQualityCurrentMonthly}
            liveQualityPrevMonthly={liveQualityPrevMonthly}
            handleOpenQualityPopup={handleOpenQualityPopup}
          />

          {/* 4. 압출동 주간 비가동내역 요약 */}
          <ExtrusionDowntimeSection
            onNavigateTab={onNavigateTab}
            extrusionSummaryList={extrusionSummaryList}
          />

          {/* 5. 일일업무일지 현황 */}
          <DailyWorkLogTableSection
            isMyeongjae={isMyeongjae}
            isDongwook={isDongwook}
            isAdmin={isAdmin}
            pendingSamrangjinCount={pendingSamrangjinCount}
            pendingHallimCount={pendingHallimCount}
            setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
            filterPlant={filterPlant}
            setFilterPlant={setFilterPlant}
            workLogs={workLogs}
            pushModalHistory={pushModalHistory}
            paginatedLogs={paginatedLogs}
            handleOpenLogDetail={handleOpenLogDetail}
            canApproveLog={canApproveLog}
            isWorkLogApproved={isWorkLogApproved}
            handleOpenEditModal={handleOpenEditModal}
            handleDeleteLog={handleDeleteLog}
            currentProfile={currentProfile}
            filteredLogs={filteredLogs}
            currentLogPage={currentLogPage}
            setCurrentLogPage={setCurrentLogPage}
            LOGS_PER_PAGE={LOGS_PER_PAGE}
            totalLogPages={totalLogPages}
            handleOpenWorkLogModal={handleOpenWorkLogModal}
          />

          {/* 6. 실시간 접속기록 현황 & 7. 시스템 오류 및 조치 이력 관리 */}
          <AdminAccessAndIncidentSection
            isAdmin={isAdmin}
            PLANTS={PLANTS}
            accessLogs={accessLogs}
            handleOpenWorkerLogs={handleOpenWorkerLogs}
            formatRelativeAccessTime={formatRelativeAccessTime}
            onNavigateTab={onNavigateTab}
          />
        </>
      )}

      {/* 🌟 전체 대시보드 모달 컨테이너 (13개 핵심 모달 통합 관리) */}
      <DashboardModalsContainer
        selectedLogDetail={selectedLogDetail}
        setSelectedLogDetail={setSelectedLogDetail}
        handleOpenLogDetail={handleOpenLogDetail}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={handleOpenEditModal}
        setPreviewImageModal={setPreviewImageModal}
        canApproveLog={canApproveLog}
        approvalCommentInput={approvalCommentInput}
        setApprovalCommentInput={setApprovalCommentInput}
        handleRejectLog={handleRejectLog}
        handleApproveLog={handleApproveLog}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        handleDeleteLog={handleDeleteLog}
        editingLog={editingLog}
        setEditingLog={setEditingLog}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleSaveEditedLog={handleSaveEditedLog}
        editMaintenanceItems={editMaintenanceItems}
        handleAddEditMaintenanceItem={handleAddEditMaintenanceItem}
        handleRemoveEditMaintenanceItem={handleRemoveEditMaintenanceItem}
        handleUpdateEditMaintenanceItem={handleUpdateEditMaintenanceItem}
        isEditProcessingImages={isEditProcessingImages}
        handleEditMaintenanceItemImageFiles={handleEditMaintenanceItemImageFiles}
        handleRemoveEditMaintenanceItemImage={handleRemoveEditMaintenanceItemImage}
        handleEditLogImageFiles={handleEditLogImageFiles}
        handleRemoveEditLogImage={handleRemoveEditLogImage}
        selectedWorkerForLogs={selectedWorkerForLogs}
        setSelectedWorkerForLogs={setSelectedWorkerForLogs}
        accessLogs={accessLogs}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isInjoo={isInjoo}
        isJaeyul={isJaeyul}
        isExtrusionWorker={isExtrusionWorker}
        isQualityWorker={isQualityWorker}
        isGeneralManager={isGeneralManager}
        logout={logout}
        assignedProcess={assignedProcess}
        formData={formData}
        setFormData={setFormData}
        handleSaveLog={handleSaveLog}
        isSavingLog={isSavingLog}
        logSavedToast={logSavedToast}
        formatAmount={formatAmount}
        workerFullName={workerFullName}
        workerPlant={workerPlant}
        officialTitle={officialTitle}
        workerDept={workerDept}
        workerPosition={workerPosition}
        isProcessingImages={isProcessingImages}
        handleWorkLogImageFiles={handleWorkLogImageFiles}
        handleRemoveWorkLogImage={handleRemoveWorkLogImage}
        previewImageModal={previewImageModal}
        selectedMonth={selectedMonth}
        currentYearMonth={currentYearMonth}
        availableMonths={availableMonths}
        DEFAULT_MONTH_LIST={DEFAULT_MONTH_LIST}
        parsedResult={parsedResult}
        setParsedResult={setParsedResult}
        uploadSuccess={uploadSuccess}
        setUploadSuccess={setUploadSuccess}
        fileInputRef={fileInputRef}
        handleExcelFile={handleExcelFile}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        dragActive={dragActive}
        parsing={parsing}
        uploading={uploading}
        successMessage={successMessage}
        handleConfirmExcelUpload={handleConfirmExcelUpload}
        maintenanceItems={maintenanceItems}
        handleAddMaintenanceItem={handleAddMaintenanceItem}
        handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
        handleUpdateMaintenanceItem={handleUpdateMaintenanceItem}
        handleMaintenanceItemImageFiles={handleMaintenanceItemImageFiles}
        handleRemoveMaintenanceItemImage={handleRemoveMaintenanceItemImage}
        qualityFiles={qualityFiles}
        setQualityFiles={setQualityFiles}
        qualityUploadSuccess={qualityUploadSuccess}
        setQualityUploadSuccess={setQualityUploadSuccess}
        qualityFileInputRef={qualityFileInputRef}
        handleQualityFiles={handleQualityFiles}
        handleQualityDrag={handleQualityDrag}
        handleQualityDrop={handleQualityDrop}
        qualityDragActive={qualityDragActive}
        qualityParsing={qualityParsing}
        qualityUploading={qualityUploading}
        qualitySuccessMessage={qualitySuccessMessage}
        handleConfirmQualityUpload={handleConfirmQualityUpload}
        commonScheduleModalOpen={commonScheduleModalOpen}
        setCommonScheduleModalOpen={setCommonScheduleModalOpen}
        commonScheduleForm={commonScheduleForm}
        setCommonScheduleForm={setCommonScheduleForm}
        commonScheduleSaving={commonScheduleSaving}
        handleRegisterCommonSchedule={handleRegisterCommonSchedule}
        todayDateStr={todayDateStr}
        TIME_OPTIONS_30MIN={TIME_OPTIONS_30MIN}
        scheduleCounts={scheduleCounts}
        commonScheduleFilterTab={commonScheduleFilterTab}
        setCommonScheduleFilterTab={setCommonScheduleFilterTab}
        modalFilteredSchedules={modalFilteredSchedules}
        handleToggleCompleteCommonSchedule={handleToggleCompleteCommonSchedule}
        handleDeleteCommonSchedule={handleDeleteCommonSchedule}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
        dailyPnLModalOpen={dailyPnLModalOpen}
        setDailyPnLModalOpen={setDailyPnLModalOpen}
        selectedPnLChannel={selectedPnLChannel}
        setSelectedPnLChannel={setSelectedPnLChannel}
        sendingDailyPnL={sendingDailyPnL}
        handleSendDailyPnLTelegram={handleSendDailyPnLTelegram}
        customPnLBriefing={customPnLBriefing}
        setCustomPnLBriefing={setCustomPnLBriefing}
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        salesAchievementPct={salesAchievementPct}
        purchaseAchievementPct={purchaseAchievementPct}
        prevMonthKey={prevMonthKey}
        uncompletedCommonSchedules={uncompletedCommonSchedules}
        scheduleDetailModal={scheduleDetailModal}
        setScheduleDetailModal={setScheduleDetailModal}
        myWeeklyCalendarDays={myWeeklyCalendarDays}
        annualLeaves={annualLeaves}
        handleReactivateLeave={handleReactivateLeave}
        handleDeleteLeave={handleDeleteLeave}
        handleRequestDismissOrDelete={handleRequestDismissOrDelete}
        setScheduleSelectedDate={setScheduleSelectedDate}
        sharedReplyModalItem={sharedReplyModalItem}
        setSharedReplyModalItem={setSharedReplyModalItem}
        replySubmitting={replySubmitting}
        replyTextInput={replyTextInput}
        setReplyTextInput={setReplyTextInput}
        handleSendSharedReply={handleSendSharedReply}
        sharedSenderConfirmModalItem={sharedSenderConfirmModalItem}
        setSharedSenderConfirmModalItem={setSharedSenderConfirmModalItem}
        confirmSubmitting={confirmSubmitting}
        handleConfirmSenderDismiss={handleConfirmSenderDismiss}
        qualityPopupItem={qualityPopupItem}
        setQualityPopupItem={setQualityPopupItem}
        liveQualityDaily={liveQualityDaily}
        handleExportQualityItemExcel={handleExportQualityItemExcel}
        selectedCommonScheduleForComments={selectedCommonScheduleForComments}
        commonScheduleCommentInput={commonScheduleCommentInput}
        setCommonScheduleCommentInput={setCommonScheduleCommentInput}
        commonScheduleCommentSubmitting={commonScheduleCommentSubmitting}
        handleAddCommonScheduleComment={handleAddCommonScheduleComment}
        handleDeleteCommonScheduleComment={handleDeleteCommonScheduleComment}
        selectedOvertimeReportForModal={selectedOvertimeReportForModal}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        getReportWorkersList={getReportWorkersList}
        onNavigateTab={onNavigateTab}
        isWorkLogsSummaryModalOpen={isWorkLogsSummaryModalOpen}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        workLogs={workLogs}
        handleBatchApproveLogs={handleBatchApproveLogs}
        isHanulSettlementModalOpen={isHanulSettlementModalOpen}
        setIsHanulSettlementModalOpen={setIsHanulSettlementModalOpen}
        getPreviousYearMonth={getPreviousYearMonth}
        isHanulWorkReportModalOpen={isHanulWorkReportModalOpen}
        setIsHanulWorkReportModalOpen={setIsHanulWorkReportModalOpen}
        hanulReportProject={hanulReportProject}
        hanulReportProcess={hanulReportProcess}
        hanulReportEditData={hanulReportEditData}
        isHanulQualityIssueModalOpen={isHanulQualityIssueModalOpen}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
      />

      {/* ⚡ 현장 모바일 초중종/TPM 간편 점검 모달 */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />
    </div>
  );
};

export default WorkerDashboard;
