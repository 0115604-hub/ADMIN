import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Eye,
  CheckCircle2,
  Activity,
  KeyRound,
  Lock,
  BellRing,
  Clock,
  UserCheck,
  Building2,
  Tag,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
  CheckSquare,
  ListTodo,
  Users,
  Megaphone,
  Wrench,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Plus,
  Check,
  ZoomIn
} from "lucide-react";
import { ADMIN_USERS, useAuth } from "../../context/AuthContext";
import { getUserLeaveStatus, getLeaveTypeMeta } from "../../services/annualLeaveService";
import { subscribeSevereDisasterPhotos } from "../../services/severeDisasterService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  isExtrusionWorkerProfile
} from "../../services/extrusionQualityIssueService";
import {
  subscribeCommonSchedules,
  getLocalCommonSchedules,
  isScheduleExpired
} from "../../services/commonScheduleService";
import {
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData,
  calculateDailySummary,
  COMPANIES
} from "../../services/overtimeSmartService";
import {
  subscribeFourMChangePoints,
  getLocalFourMChangePoints
} from "../../services/fourMChangePointService";
import {
  subscribeToExtrusionReports
} from "../../services/extrusionProductionService";
import {
  subscribeWorkLogs,
  getWorkLogs
} from "../../services/workLogService";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../services/urgentIssueService";
import { getKSTDateString } from "../../utils/dateUtils";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { useModalHistory, clearModalStack } from "../../utils/modalHistory";

export const WorkerPinModal = ({
  selectedUser,
  setSelectedUser,
  annualLeaves = [],
  activeIssues = [],
  urgentIssues = [],
  managerLeaves = [],
  companyAttendanceStats = []
}) => {
  const { loginWithProfile } = useAuth();
  const [disasterPhotos, setDisasterPhotos] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Real-time Service Streams
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [extrusionQualityIssues, setExtrusionQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [fourMLedgerRecords, setFourMLedgerRecords] = useState(() => getLocalFourMChangePoints());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const [localUrgentIssues, setLocalUrgentIssues] = useState(() => getLocalUrgentIssues());

  const bodyRef = useRef(null);
  const pinInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Subscriptions
  useEffect(() => {
    const unsubDisaster = subscribeSevereDisasterPhotos((photos) => setDisasterPhotos(photos || []));
    const unsubSched = subscribeCommonSchedules((scheds) => setCommonSchedules(scheds || []));
    const unsubOvertime = subscribeSmartOvertimeData((data) => { if (data) setSmartOvertimeData(data); });
    const unsubExtQual = subscribeExtrusionQualityIssues((list) => setExtrusionQualityIssues(list || []));
    const unsub4M = subscribeFourMChangePoints((list) => setFourMLedgerRecords(list || []));
    const unsubExtRep = subscribeToExtrusionReports((reps) => setExtrusionReports(reps || []));
    const unsubLogs = subscribeWorkLogs((logs) => setWorkLogs(logs || []));
    const unsubUrg = subscribeUrgentIssues((issues) => setLocalUrgentIssues(issues || []));

    return () => {
      if (unsubDisaster) unsubDisaster();
      if (unsubSched) unsubSched();
      if (unsubOvertime) unsubOvertime();
      if (unsubExtQual) unsubExtQual();
      if (unsub4M) unsub4M();
      if (unsubExtRep) unsubExtRep();
      if (unsubLogs) unsubLogs();
      if (unsubUrg) unsubUrg();
    };
  }, []);

  // Initialize state when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setPinInput("");
      setIsPinVerified(false);
      setPinError(false);
      setTimeout(() => {
        if (pinInputRef.current) {
          try {
            pinInputRef.current.focus({ preventScroll: true });
          } catch (e) {
            pinInputRef.current.focus();
          }
        }
        if (overlayRef.current) {
          overlayRef.current.scrollTop = 0;
        }
      }, 50);
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
    }
  }, [selectedUser]);

  // Register with browser history for Back button
  useModalHistory(Boolean(selectedUser), () => setSelectedUser(null), "workerPinModal");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedUser]);

  // Dismiss virtual keyboard on mobile as soon as PIN is verified
  useEffect(() => {
    if (isPinVerified) {
      if (pinInputRef.current) {
        pinInputRef.current.blur();
      }
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }
  }, [isPinVerified]);

  // =========================================================================
  // 🌟 Role Identification
  // =========================================================================
  const isAdminUser = useMemo(() => {
    if (!selectedUser) return false;
    return (
      selectedUser.role === "ADMIN" ||
      selectedUser.id === "admin" ||
      selectedUser.name === "권태형" ||
      selectedUser.name === "최미영" ||
      selectedUser.name === "이명재" ||
      selectedUser.name === "김동욱" ||
      selectedUser.assignedProcess === "총괄관리" ||
      ADMIN_USERS.some((a) => a.id === selectedUser.id || a.name === selectedUser.name)
    );
  }, [selectedUser]);

  const isExtrusionWorker = useMemo(() => {
    if (!selectedUser || isAdminUser) return false;
    return Boolean(
      isExtrusionWorkerProfile(selectedUser) ||
      selectedUser.building === "압출동" ||
      selectedUser.assignedProcess?.includes("압출") ||
      selectedUser.id?.startsWith("ext_") ||
      selectedUser.name === "설유철" ||
      selectedUser.name === "공영국" ||
      selectedUser.name === "심임대" ||
      selectedUser.name === "이상은"
    );
  }, [selectedUser, isAdminUser]);

  const isProcessingWorker = useMemo(() => {
    return !isAdminUser && !isExtrusionWorker;
  }, [isAdminUser, isExtrusionWorker]);

  const todayKst = getKSTDateString();

  // =========================================================================
  // 🌟 1. 4M 변동점 데이터 실시간 통합 파싱 (설비수리 + 비가동 + TPM + 불량 + 품질경보)
  // =========================================================================
  const allUnified4MRecords = useMemo(() => {
    const unified = [];
    const sourceIssues = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;

    // 1-1. 품질경보 (Method)
    (sourceIssues || []).forEach((issue) => {
      if (!issue || issue.isDeleted) return;
      const rawCat = String(issue.category || "").trim();
      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "품질 경보" ||
        rawCat === "품질이슈" ||
        rawCat.includes("품질");
      if (!isQualityAlert) return;

      const lineStr = String(issue.line || issue.process || "").trim();
      const titleStr = String(issue.title || "").trim();
      const isExt = lineStr.includes("압출") || lineStr.includes("PCM") || lineStr.includes("PVC") || lineStr.includes("TPE") || titleStr.includes("압출");

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: "Method",
        origin: "품질경보",
        plant: issue.plant || "삼랑진공장",
        line: lineStr || (isExt ? "압출라인" : "가공/품질"),
        title: issue.title || issue.content || "(품질경보 발령)",
        content: issue.content || issue.details || "",
        actionResult: issue.actionResult || "",
        date: issue.date || (issue.createdAt ? String(issue.createdAt).slice(0, 10) : todayKst),
        isResolved: Boolean(issue.isResolved || (issue.actionResult && issue.actionResult.trim())),
        isExtrusion: isExt
      });
    });

    // 1-2. 설비수리 (전재율 책임 - Machine)
    (workLogs || []).forEach((log) => {
      if (log.isDeleted) return;
      const isJeonOrMaintenance = log.writer === "전재율" || log.process === "설비보전" || (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0);
      if (!isJeonOrMaintenance) return;

      let mItems = [];
      if (Array.isArray(log.maintenanceItems)) {
        mItems = log.maintenanceItems;
      } else if (typeof log.maintenanceItems === "string" && log.maintenanceItems.startsWith("[")) {
        try { mItems = JSON.parse(log.maintenanceItems); } catch (e) {}
      }

      let repairSummary = mItems.map((m) => `[${m.equipmentName || m.category || "설비"}] ${m.content || ""}`.trim()).filter(Boolean).join(" / ");
      if (!repairSummary && log.workContent) {
        repairSummary = log.workContent.split("\n")[0];
      }
      const lineOrEq = log.line || (mItems[0] ? `${mItems[0].category}` : "설비보전");
      const isExt = String(lineOrEq || repairSummary).includes("압출") || String(lineOrEq || repairSummary).includes("PCM") || String(lineOrEq || repairSummary).includes("PVC") || String(lineOrEq || repairSummary).includes("TPE");

      unified.push({
        id: `wl_${log.id}`,
        fourM: "Machine",
        origin: "설비수리",
        plant: log.plant || "삼랑진공장",
        line: lineOrEq,
        title: repairSummary || `[${lineOrEq}] 설비 점검 및 보전수리`,
        content: log.workContent || repairSummary,
        actionResult: log.approvalComment || "수리 및 점검 조치 완료",
        date: log.date || todayKst,
        isResolved: true,
        isExtrusion: isExt
      });
    });

    // 1-3. 압출 작업일보 비가동 & TPM 이상신고 (Machine & Material)
    (extrusionReports || []).forEach((report) => {
      if (report.tpmIssueText) {
        unified.push({
          id: `ext_tpm_${report.id}`,
          fourM: "Machine",
          origin: "TPM 이상신고",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          title: `[${report.lineName || report.lineId || "압출"}] ${report.tpmIssueText}`,
          content: report.tpmIssueText,
          actionResult: report.notes || "",
          date: report.date || todayKst,
          isResolved: report.approvalStatus === "승인",
          isExtrusion: true
        });
      }

      (report.downtimeEvents || []).forEach((ev, evIdx) => {
        const isDefect = ev.type === "불량" || ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "발포"].includes(ev.category);
        unified.push({
          id: `ext_dt_${report.id}_${evIdx}`,
          fourM: isDefect ? "Material" : "Machine",
          origin: isDefect ? "불량손실" : "비가동",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          title: `[${report.lineName || report.lineId || "압출"}] ${ev.category} ${ev.detail ? `(${ev.detail})` : ""}`,
          content: ev.detail || `${ev.category} 발생`,
          actionResult: report.notes || "현장 즉시 조치 완료",
          date: report.date || todayKst,
          isResolved: true,
          isExtrusion: true
        });
      });
    });

    // 1-4. 압출 품질이슈 (Method)
    (extrusionQualityIssues || []).forEach((alert) => {
      if (String(alert.id).startsWith("demo_") || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2") return;
      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: "Method",
        origin: "품질경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        title: alert.title || `[품질경보] ${alert.defectType}`,
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        date: alert.date || todayKst,
        isResolved: alert.status === "RESOLVED" || Boolean(alert.actionResult),
        isExtrusion: true
      });
    });

    return unified.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [urgentIssues, localUrgentIssues, workLogs, extrusionReports, extrusionQualityIssues, todayKst]);

  // 압출동 전용 변동점 발생상황 (압출 라인 한정)
  const extrusion4MRecords = useMemo(() => {
    return allUnified4MRecords.filter((r) => r.isExtrusion).slice(0, 5);
  }, [allUnified4MRecords]);

  // 가공동 전용 변동점 발생상황 (가공 라인 + 설비보전 + 전사 품질)
  const processing4MRecords = useMemo(() => {
    const plantFilter = selectedUser?.plant?.replace("공장", "") || "";
    return allUnified4MRecords
      .filter((r) => !r.isExtrusion || r.origin === "설비수리" || r.origin === "품질경보")
      .filter((r) => !plantFilter || !r.plant || r.plant.includes(plantFilter))
      .slice(0, 5);
  }, [allUnified4MRecords, selectedUser]);

  // 관리자 전용 4M 통계
  const stats4M = useMemo(() => {
    const officialCount = fourMLedgerRecords.length;
    const machineCount = allUnified4MRecords.filter((r) => r.fourM === "Machine").length;
    const materialCount = allUnified4MRecords.filter((r) => r.fourM === "Material").length;
    const methodCount = allUnified4MRecords.filter((r) => r.fourM === "Method").length;
    return {
      officialCount,
      machineCount,
      materialCount,
      methodCount,
      totalCount: allUnified4MRecords.length
    };
  }, [fourMLedgerRecords, allUnified4MRecords]);

  // =========================================================================
  // 🌟 2. 역할별 품질이슈 및 공지 데이터
  // =========================================================================
  // 2-1. 압출동 품질이슈 (설유철 책임 등록)
  const activeExtrusionIssues = useMemo(() => {
    return (extrusionQualityIssues || []).filter((it) => it && it.status === "ACTIVE");
  }, [extrusionQualityIssues]);

  // 2-2. 가공동 품질이슈 (품질경보 및 긴급 품질안건)
  const processingQualityIssues = useMemo(() => {
    const list = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;
    return (list || []).filter((it) => {
      if (!it || it.isDeleted) return false;
      const cat = String(it.category || "").trim();
      return cat === "품질경보" || cat === "품질 경보" || cat === "품질이슈" || cat.includes("품질");
    }).slice(0, 4);
  }, [urgentIssues, localUrgentIssues]);

  // =========================================================================
  // 🌟 3. 관리자 일정 및 근태 통계
  // =========================================================================
  // 미완료 사내 공통일정
  const uncompletedCommonSchedules = useMemo(() => {
    return (commonSchedules || [])
      .filter((s) => !s.isCompleted && !isScheduleExpired(s))
      .sort((a, b) => {
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules]);

  // 당일 일자 및 일일 근태 요약
  const todayDayNum = useMemo(() => new Date().getDate(), []);
  const dailyOvertimeSummary = useMemo(() => {
    if (!smartOvertimeData || !smartOvertimeData.attendanceMatrix) return null;
    return calculateDailySummary(smartOvertimeData.attendanceMatrix, todayDayNum);
  }, [smartOvertimeData, todayDayNum]);

  const unwrittenCompanies = useMemo(() => {
    const matrix = smartOvertimeData?.attendanceMatrix || [];
    return COMPANIES.filter((comp) => {
      const compWorkers = matrix.filter((w) => w.company === comp || (comp.includes("조영") && (w.company || "").includes("조영")));
      const enteredCount = compWorkers.filter((w) => {
        const v = w.daily?.[todayDayNum];
        return v !== undefined && v !== null && String(v).trim() !== "" && String(v).trim() !== "미입력";
      }).length;
      return enteredCount === 0;
    });
  }, [smartOvertimeData, todayDayNum]);

  const isAfter9AM = useMemo(() => new Date().getHours() >= 9, []);

  // 당일 근태
  const leaveStatus = useMemo(() => {
    if (!selectedUser) return null;
    return getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });
  }, [selectedUser, annualLeaves]);

  if (!selectedUser) return null;

  const expectedPin = selectedUser?.pin || (isAdminUser ? "0090" : "11");

  const checkPinValidity = (val) => {
    const trimmed = String(val || "").trim();
    if (isAdminUser) {
      return trimmed === "0090" || trimmed === selectedUser.pin;
    }
    return trimmed === "11" || trimmed === expectedPin || trimmed === "1234";
  };

  const handlePinChange = (e) => {
    const val = e.target.value;
    setPinInput(val);
    setPinError(false);

    if (checkPinValidity(val)) {
      setIsPinVerified(true);
      if (pinInputRef.current) pinInputRef.current.blur();
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }
  };

  const handlePinSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (checkPinValidity(pinInput)) {
      setIsPinVerified(true);
      setPinError(false);
      if (pinInputRef.current) pinInputRef.current.blur();
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    } else {
      setPinError(true);
      setIsPinVerified(false);
    }
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isPinVerified) {
      if (checkPinValidity(pinInput)) {
        setIsPinVerified(true);
      } else {
        setPinError(true);
        if (pinInputRef.current) {
          try {
            pinInputRef.current.focus({ preventScroll: true });
          } catch (err) {
            pinInputRef.current.focus();
          }
        }
        return;
      }
    }

    setIsLoggingIn(true);
    try {
      clearModalStack();
      if (
        selectedUser?.building === "압출동" ||
        selectedUser?.assignedProcess === "압출동" ||
        selectedUser?.id?.startsWith("ext_") ||
        selectedUser?.name === "공영국"
      ) {
        try {
          localStorage.setItem("factory_extrusion_active_subtab", "production");
        } catch (e) {}
      }
      loginWithProfile(selectedUser, true, false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Worker login error:", err);
      alert("로그인 중 오류가 발생했습니다: " + (err.message || ""));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <div
        ref={overlayRef}
        onClick={() => setSelectedUser(null)}
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-3 md:p-4 animate-fadeIn overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden animate-scaleUp relative flex flex-col my-2 sm:my-4"
        >
          {/* Top Decorative Accent Line */}
          <div
            className={`h-1.5 w-full shrink-0 ${
              isAdminUser
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
                : isExtrusionWorker
                ? "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"
                : selectedUser.plant === "한림공장"
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
                : "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"
            }`}
          />

          {/* 🌟 1. Header: Avatar + Name + PIN input */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/90 dark:bg-slate-900/90">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md shrink-0 ${
                  isAdminUser
                    ? "bg-blue-600 ring-2 ring-blue-400/40"
                    : isExtrusionWorker
                    ? "bg-indigo-600 ring-2 ring-indigo-400/40"
                    : selectedUser.plant === "한림공장"
                    ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                    : "bg-amber-600 ring-2 ring-amber-400/40"
                }`}
              >
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-black text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight truncate">
                  {selectedUser.name} {selectedUser.title || (isAdminUser ? "대표이사" : "작업자")}
                </h3>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    isAdminUser
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : isExtrusionWorker
                      ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {isAdminUser ? "경영총괄/관리자" : isExtrusionWorker ? "압출동" : selectedUser.plant || "가공동"}
                </span>

                {/* PIN Input Badge */}
                <form onSubmit={handlePinSubmit} className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 transition-all ${
                      isPinVerified
                        ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-400/30"
                        : pinError
                        ? "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 animate-pulse"
                        : "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400 shadow-2xs"
                    }`}
                  >
                    <KeyRound
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isPinVerified ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                    <span className="text-[10px] font-black text-slate-400 select-none">PIN:</span>
                    <input
                      ref={pinInputRef}
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder=""
                      value={pinInput}
                      onChange={handlePinChange}
                      className="w-14 sm:w-16 bg-transparent text-xs sm:text-sm font-black text-center tracking-widest text-slate-900 dark:text-white outline-none"
                      autoFocus
                    />
                    {isPinVerified ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>인증</span>
                      </span>
                    ) : (
                      <button
                        type="submit"
                        className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition shadow-2xs"
                      >
                        입력
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🌟 2. Body: 핀번호 입력 전/후 뷰 */}
          <div ref={bodyRef} className="p-3.5 sm:p-5 md:p-6 space-y-4">
            {!isPinVerified ? (
              /* 🔒 PIN 입력 전 화면 */
              <div className="py-16 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto animate-fadeIn">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {selectedUser.name} {selectedUser.title || ""}님, <br className="hidden sm:inline" />
                    중대재해공유판, 품질이슈 및 변동점 발생상황을 확인바랍니다.
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {isExtrusionWorker
                      ? "인증 시 [중대재해공유판 + 압출 품질이슈 + 변동점 발생상황]이 표시됩니다."
                      : isProcessingWorker
                      ? "인증 시 [중대재해공유판 + 가공 품질이슈 + 변동점 발생상황]이 표시됩니다."
                      : "인증 시 [중대재해공유판 + 사내일정 + 근태정보 + 변동점 발생상황]이 표시됩니다."}
                  </p>
                </div>
              </div>
            ) : (
              /* ✅ PIN 인증 완료 시 역할별 통합 화면 */
              <div className="space-y-4 animate-fadeIn">
                {/* 당일 근태 알림 */}
                {leaveStatus && (
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 flex items-center justify-between gap-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-rose-950 dark:text-rose-100 block text-xs truncate">
                          당일 근태 알림: {selectedUser.name} {selectedUser.title} ({leaveStatus.fullLabel || leaveStatus.label})
                        </span>
                        {leaveStatus.reason && (
                          <span className="text-[11px] text-rose-700 dark:text-rose-300 block truncate font-medium">
                            사유: {leaveStatus.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shrink-0 shadow-xs">
                      {leaveStatus.displayBadge || "근태등록"}
                    </span>
                  </div>
                )}

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
                  {/* ===================================================================== */}
                  {/* [좌측 패널] 🚨 중대재해공유판 (모든 사용자 공통) */}
                  {/* ===================================================================== */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-amber-950/30 border-2 border-amber-300/90 dark:border-amber-700/80 flex flex-col justify-between space-y-3.5 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm md:text-base font-black text-slate-900 dark:text-white block leading-tight">
                              🚨 중대재해공유판
                            </span>
                            <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
                              (사진 2배 확대 뷰 • 탭 시 고화질 원본)
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700">
                          {disasterPhotos.length}장 등록됨
                        </span>
                      </div>

                      {/* 대형 안전 사진 그리드 */}
                      {disasterPhotos.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {disasterPhotos.slice(0, 4).map((photo, index) => (
                              <div
                                key={photo.id}
                                onClick={() =>
                                  setPreviewImage({
                                    list: disasterPhotos.map((p) => ({
                                      url: p.url || p.dataUrl,
                                      name: `${p.name || "중대재해·안전 점검 사진"} (${p.uploaderName || "이명재 이사"})`
                                    })),
                                    index: index,
                                    url: photo.url || photo.dataUrl,
                                    name: `${photo.name || "중대재해·안전 점검 사진"} (${photo.uploaderName || "이명재 이사"})`
                                  })
                                }
                                className="group relative aspect-16/10 rounded-2xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 hover:border-rose-500 cursor-pointer shadow-md transition-all hover:scale-102 bg-slate-950"
                                title={`${photo.name} (${photo.uploaderName || "이명재 이사"}) - 클릭 시 확대`}
                              >
                                <img
                                  src={photo.url || photo.dataUrl}
                                  alt={photo.name}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-2.5 text-white">
                                  <div className="self-end p-1 rounded-lg bg-black/50 backdrop-blur-xs">
                                    <Eye className="w-4 h-4 text-white drop-shadow" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-black drop-shadow block truncate">
                                      {photo.name || "안전 현장 사진"}
                                    </span>
                                    <span className="text-[10px] text-amber-200 font-bold drop-shadow block">
                                      {photo.uploaderName || "이명재 이사"} • {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString("ko-KR") : "공유됨"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {disasterPhotos.length > 4 && (
                            <div
                              onClick={() =>
                                setPreviewImage({
                                  list: disasterPhotos.map((p) => ({
                                    url: p.url || p.dataUrl,
                                    name: `${p.name || "중대재해·안전 점검 사진"} (${p.uploaderName || "이명재 이사"})`
                                  })),
                                  index: 4,
                                  url: disasterPhotos[4]?.url || disasterPhotos[4]?.dataUrl,
                                  name: `${disasterPhotos[4]?.name || "중대재해·안전 점검 사진"} (${disasterPhotos[4]?.uploaderName || "이명재 이사"})`
                                })
                              }
                              className="text-right pt-1 cursor-pointer group"
                            >
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 group-hover:underline group-hover:text-rose-600 transition-colors">
                                외 {disasterPhotos.length - 4}장의 안전 사진 더보기 (전체 {disasterPhotos.length}장 ➡️)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 flex flex-col items-center justify-center">
                          <ShieldAlert className="w-8 h-8 text-amber-500/50 mb-1" />
                          <span>공유된 중대재해·안전 사진이 없습니다.</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-amber-300/50 dark:border-amber-700/50 flex items-center justify-between text-[11px] font-bold text-amber-800/90 dark:text-amber-300/90">
                      <span>게시 관리: 이명재 이사</span>
                      <span>클릭 시 원본 확대 팝업</span>
                    </div>
                  </div>

                  {/* ===================================================================== */}
                  {/* [우측 패널] 역할별 맞춤 화면 (압출동 / 가공동 / 관리자) */}
                  {/* ===================================================================== */}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 1: 압출동 작업자 -> 압출 품질이슈 + 압출 변동점 발생상황 */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {isExtrusionWorker && (
                    <div className="space-y-3.5 flex flex-col justify-between h-full">
                      {/* 1. 압출동 품질이슈 */}
                      <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                🚨 압출동 품질이슈
                              </span>
                              <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-300">
                                설유철 책임 공지 • 라인별 불량 원인 및 조치
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-rose-900 dark:text-rose-200 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700">
                            {activeExtrusionIssues.length}건 진행중
                          </span>
                        </div>

                        {activeExtrusionIssues.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {activeExtrusionIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                      {issue.line}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      {issue.defectType}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{issue.date || issue.createdAt?.slice(0, 10)}</span>
                                </div>
                                <h5 className="font-black text-slate-900 dark:text-white text-xs">{issue.title}</h5>
                                {issue.content && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                                    {issue.content}
                                  </p>
                                )}
                                {(issue.actionResult || issue.actionGuide) && (
                                  <div className="text-[10.5px] text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                    ↳ 🟢 <b>[조치]</b> {issue.actionResult || issue.actionGuide}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-rose-800/80 dark:text-rose-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-rose-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-rose-400" />
                            <span>현재 진행 중인 압출 품질이슈가 없습니다.</span>
                          </div>
                        )}
                      </div>

                      {/* 2. 압출동 변동점 발생상황 */}
                      <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 압출동 변동점 발생상황
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                PCM 1·3호 / PVC / TPE 설비수리·비가동·불량·TPM
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700">
                            {extrusion4MRecords.length}건 최근
                          </span>
                        </div>

                        {extrusion4MRecords.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {extrusion4MRecords.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800 border border-indigo-300" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{item.line}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h6>
                                {item.actionResult && (
                                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md">
                                    ↳ 🟢 <b>[조치]</b> {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-indigo-800/80 dark:text-indigo-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-indigo-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            <span>최근 등록된 압출 변동점이 없습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 2: 가공동 작업자 -> 가공 품질이슈 + 가공 변동점 발생상황 */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {isProcessingWorker && (
                    <div className="space-y-3.5 flex flex-col justify-between h-full">
                      {/* 1. 가공동 품질이슈 */}
                      <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                🚨 가공동 품질이슈 & 품질경보
                              </span>
                              <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-300">
                                {selectedUser.plant || "가공동"} 품질경보 및 중점 불량 관리
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-rose-900 dark:text-rose-200 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700">
                            {processingQualityIssues.length}건 발령중
                          </span>
                        </div>

                        {processingQualityIssues.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {processingQualityIssues.map((issue) => (
                              <div
                                key={issue.id || issue._docId}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-600 text-white">
                                      {issue.category || "품질경보"}
                                    </span>
                                    <span className="text-slate-500 font-bold text-[10.5px]">{issue.plant}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{issue.date || issue.startDate || todayKst}</span>
                                </div>
                                <h5 className="font-black text-slate-900 dark:text-white text-xs">{issue.title}</h5>
                                {issue.content && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                                    {issue.content}
                                  </p>
                                )}
                                {issue.actionResult && (
                                  <div className="text-[10.5px] text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                    ↳ 🟢 <b>[조치]</b> {issue.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-rose-800/80 dark:text-rose-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-rose-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-rose-400" />
                            <span>현재 진행 중인 가공 품질이슈가 없습니다.</span>
                          </div>
                        )}
                      </div>

                      {/* 2. 가공동 변동점 발생상황 */}
                      <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 가공동 변동점 발생상황
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                전재율 책임 설비수리·가공불량·비가동 현황
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700">
                            {processing4MRecords.length}건 최근
                          </span>
                        </div>

                        {processing4MRecords.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {processing4MRecords.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800 border border-indigo-300" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{item.line}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h6>
                                {item.actionResult && (
                                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md">
                                    ↳ 🟢 <b>[조치]</b> {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-indigo-800/80 dark:text-indigo-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-indigo-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            <span>최근 등록된 가공 변동점이 없습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 3: 관리자 -> 사내일정 + 근태정보 + 전사 변동점 발생상황 */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {isAdminUser && (
                    <div className="space-y-3.5 flex flex-col justify-between h-full">
                      {/* 1. 사내 공통일정 */}
                      <div className="p-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📌 사내 공통일정 (미완료 일정)
                              </span>
                              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                전사 및 공장별 진행 중인 일정
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                            {uncompletedCommonSchedules.length}건 진행중
                          </span>
                        </div>

                        {uncompletedCommonSchedules.length > 0 ? (
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                            {uncompletedCommonSchedules.map((schedule) => {
                              const sDate = schedule.startDate || schedule.date;
                              const eDate = schedule.endDate || sDate;
                              const dateText = sDate === eDate || !eDate ? sDate : `${sDate}~${eDate}`;
                              return (
                                <div
                                  key={schedule.id || schedule._docId}
                                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs text-xs flex items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 shrink-0">
                                      {schedule.target || "공통"}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                      {schedule.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{dateText}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-2.5 text-center text-xs text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200">
                            진행 중인 미완료 공통일정이 없습니다.
                          </div>
                        )}
                      </div>

                      {/* 2. 실시간 근태정보 */}
                      <div className="p-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-emerald-200 dark:border-emerald-800/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                👥 전사 실시간 근태현황정보
                              </span>
                              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                오륙·유성 (삼랑진) / 조영·한울·부림텍 (한림)
                              </span>
                            </div>
                          </div>

                          <span className="text-[10.5px] font-black text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200">
                            당일 {todayDayNum}일 기준
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                          {["오륙", "유성", "조영", "한울", "부림텍"].map((comp) => {
                            const b = dailyOvertimeSummary?.companyBreakdown?.[comp] || { attended: 0, total: 0, otWorkers: 0 };
                            const isUn = unwrittenCompanies.includes(comp);
                            return (
                              <div key={comp} className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-0.5">
                                <span className="font-black text-slate-800 dark:text-slate-200 block truncate">{comp}</span>
                                <span className="font-bold text-slate-900 dark:text-white block">{b.attended}/{b.total}명</span>
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block">잔업 {b.otWorkers}명</span>
                                {isUn ? (
                                  <span className="text-[8.5px] text-rose-500 font-bold block">{isAfter9AM ? "미작성" : "작성전"}</span>
                                ) : (
                                  <span className="text-[8.5px] text-emerald-500 font-bold block">완료</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. 전사 변동점 발생상황 */}
                      <div className="p-3.5 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 4M 변동점 발생상황 (통합 관리대장)
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                삼랑진·한림 공장 설비수리·비가동·불량·품질경보
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">
                              ⭐ 대장 {stats4M.officialCount}건
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                              설비 {stats4M.machineCount}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
                              불량 {stats4M.materialCount}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              경보 {stats4M.methodCount}
                            </span>
                          </div>
                        </div>

                        {allUnified4MRecords.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                            {allUnified4MRecords.slice(0, 4).map((item) => (
                              <div
                                key={item.id}
                                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-0.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800" :
                                      "bg-rose-100 text-rose-800"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                                      {item.plant?.replace("공장", "")} • {item.line}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs truncate">{item.title}</h6>
                                {item.actionResult && (
                                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate">
                                    ↳ 🟢 [조치] {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2 text-center text-xs text-slate-400 font-bold">
                            등록된 변동점이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🌟 3. Footer: 확인완료 작업개시 버튼 */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 sm:py-3.5 md:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base md:text-lg shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>확인완료 작업개시</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Disaster Images */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
};
