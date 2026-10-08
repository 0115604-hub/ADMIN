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
  ZoomIn,
  MessageCircle,
  CalendarDays
} from "lucide-react";
import { ADMIN_USERS, EXTRUSION_WORKERS, useAuth } from "../../context/AuthContext";
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
  isScheduleExpired,
  isScheduleAdminRestricted,
  addCommonScheduleComment,
  deleteCommonScheduleComment
} from "../../services/commonScheduleService";
import {
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData,
  calculateDailySummary,
  COMPANIES,
  cleanCompanyName,
  buildMatrixFromReports
} from "../../services/overtimeSmartService";
import {
  subscribeOvertimeReports,
  getLocalOvertimeReports
} from "../../services/overtimeService";
import {
  subscribe4MAbsenceLogs,
  getLocal4MAbsenceLogsMap
} from "../../services/absence4MService";
import {
  subscribePersonnelCards,
  getLocalPersonnelCardsMap
} from "../../services/personnelCardService";
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

  // 💬 일정 상세 & 의견/메시지 모달 State
  const [selectedScheduleForComments, setSelectedScheduleForComments] = useState(null);
  const [scheduleCommentInput, setScheduleCommentInput] = useState("");
  const [scheduleCommentSubmitting, setScheduleCommentSubmitting] = useState(false);

  // Real-time Service Streams
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [absenceLogsMap, setAbsenceLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [extrusionQualityIssues, setExtrusionQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [fourMLedgerRecords, setFourMLedgerRecords] = useState(() => getLocalFourMChangePoints());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());
  const [localUrgentIssues, setLocalUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());

  const bodyRef = useRef(null);
  const pinInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Subscriptions
  useEffect(() => {
    const unsubDisaster = subscribeSevereDisasterPhotos((photos) => setDisasterPhotos(photos || []));
    const unsubSched = subscribeCommonSchedules((scheds) => setCommonSchedules(scheds || []));
    const unsubOvertime = subscribeSmartOvertimeData((data) => { if (data) setSmartOvertimeData(data); });
    const unsubReports = subscribeOvertimeReports((reps) => { if (reps) setOvertimeReports(reps); });
    const unsubAbsence = subscribe4MAbsenceLogs((logs) => { if (logs) setAbsenceLogsMap(logs); });
    const unsubExtQual = subscribeExtrusionQualityIssues((list) => setExtrusionQualityIssues(list || []));
    const unsub4M = subscribeFourMChangePoints((list) => setFourMLedgerRecords(list || []));
    const unsubExtRep = subscribeToExtrusionReports((reps) => setExtrusionReports(reps || []));
    const unsubLogs = subscribeWorkLogs((logs) => setWorkLogs(logs || []));
    const unsubUrg = subscribeUrgentIssues((issues) => setLocalUrgentIssues(issues || []));
    const unsubCards = subscribePersonnelCards((cards) => { if (cards) setPersonnelCardsMap(cards); });

    const handleCardEvent = (e) => {
      if (e.detail?.cardData) {
        const { cardKey, cardData } = e.detail;
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [cardKey]: cardData,
          [`${cleanCompanyName(cardData.company)}_${cardData.name}`]: cardData,
          [`${cardData.company}_${cardData.name}`]: cardData
        }));
      }
    };
    window.addEventListener("oryuk_personnel_card_updated", handleCardEvent);

    return () => {
      if (unsubDisaster) unsubDisaster();
      if (unsubSched) unsubSched();
      if (unsubOvertime) unsubOvertime();
      if (unsubAbsence) unsubAbsence();
      if (unsubExtQual) unsubExtQual();
      if (unsub4M) unsub4M();
      if (unsubExtRep) unsubExtRep();
      if (unsubLogs) unsubLogs();
      if (unsubUrg) unsubUrg();
      if (unsubCards) unsubCards();
      window.removeEventListener("oryuk_personnel_card_updated", handleCardEvent);
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
  // 1. 압출동 작업자: EXTRUSION_WORKERS (11명) / building === "압출동" / id starts with "ext_"
  // 2. 관리자: 첫화면의 모든 명찰(본사 대표이사/전무, 삼랑진공장, 한림공장)은 관리자임!
  // =========================================================================
  const isExtrusionWorker = useMemo(() => {
    if (!selectedUser) return false;
    return Boolean(
      EXTRUSION_WORKERS.some((w) => w.id === selectedUser.id || w.name === selectedUser.name) ||
      selectedUser.building === "압출동" ||
      selectedUser.id?.startsWith("ext_")
    );
  }, [selectedUser]);

  const isAdminUser = useMemo(() => {
    if (!selectedUser) return false;
    return !isExtrusionWorker;
  }, [selectedUser, isExtrusionWorker]);

  const isSamrangjinManager = useMemo(() => {
    if (!selectedUser) return false;
    return selectedUser.plant === "삼랑진공장" || String(selectedUser.id || "").startsWith("sam_");
  }, [selectedUser]);

  const isHallimManager = useMemo(() => {
    if (!selectedUser) return false;
    return selectedUser.plant === "한림공장" || String(selectedUser.id || "").startsWith("hal_");
  }, [selectedUser]);

  const isHeadquarterAdmin = useMemo(() => {
    if (!selectedUser) return false;
    return (
      selectedUser.plant === "본사" ||
      selectedUser.role === "ADMIN" ||
      selectedUser.name === "권태형" ||
      selectedUser.name === "최미영" ||
      selectedUser.id === "admin" ||
      selectedUser.id === "admin_kwon" ||
      selectedUser.id === "admin_choi"
    );
  }, [selectedUser]);

  // 협력업체 대표 = 해당 업체만 / 삼랑진 관리자 = 오륙, 유성 / 한림 관리자 = 조영, 한울, 부림텍 / 본사 = 전체
  const visibleAttendanceCompanies = useMemo(() => {
    if (!selectedUser) return ["오륙", "유성", "조영", "한울", "부림텍"];
    if (selectedUser.isPartner || selectedUser.company === "유성" || selectedUser.name === "유성") return ["유성"];
    if (selectedUser.isPartner || selectedUser.company === "조영" || selectedUser.name === "조영") return ["조영"];
    if (selectedUser.isPartner || selectedUser.company === "한울" || selectedUser.name === "한울") return ["한울"];
    if (selectedUser.isPartner || selectedUser.company === "부림텍" || selectedUser.name === "부림텍") return ["부림텍"];
    if (isSamrangjinManager) return ["오륙", "유성"];
    if (isHallimManager) return ["조영", "한울", "부림텍"];
    return ["오륙", "유성", "조영", "한울", "부림텍"];
  }, [selectedUser, isSamrangjinManager, isHallimManager]);

  const isProcessingWorker = useMemo(() => {
    return false;
  }, []);

  const todayKst = getKSTDateString();

  // =========================================================================
  // 🌟 1. 4M 변동점 데이터 실시간 통합 파싱 (설비수리 + 비가동 + TPM + 불량 + 품질경보 3건 전체)
  // =========================================================================
  const allUnified4MRecords = useMemo(() => {
    const unified = [];
    const sourceIssues = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;

    // 1-1. 품질경보 (Method) - 전체 품질경보 3건 누락 없이 수집
    (sourceIssues || []).forEach((issue) => {
      if (!issue || issue.isDeleted === true || issue.isDeleted === "true" || issue.deleted === true) return;
      const rawCat = String(issue.category || "").trim();
      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "품질 경보" ||
        rawCat === "품질이슈" ||
        rawCat === "품질 이슈" ||
        rawCat.includes("품질") ||
        rawCat.toLowerCase().includes("quality") ||
        String(issue.title || "").includes("품질경보") ||
        String(issue.content || "").includes("품질경보") ||
        issue.type === "QUALITY_ALERT" ||
        issue.type === "품질경보";

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
        const catClean = String(ev.category || "").replace(/\s+/g, "").toUpperCase();
        // ⭐ 사용자 요청: 압개시, 형교환, 종료, 기술TRY 항목은 일상 셋업/정상 공정 비가동이므로 4M 변동점 적용에서 완전 제외
        if (
          catClean === "압개시" ||
          catClean === "형교환" ||
          catClean === "종료" ||
          catClean === "기술TRY" ||
          catClean.startsWith("압개시") ||
          catClean.startsWith("형교환") ||
          catClean.startsWith("종료") ||
          catClean.startsWith("기술TRY")
        ) {
          return;
        }

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

    // 1-5. 5개사 결근 및 대체투입 인원변동 (Man)
    const registeredKeys = new Set();
    const absenceList = Object.values(absenceLogsMap || {});
    absenceList.forEach((log) => {
      if (!log || !log.date) return;
      const compClean = cleanCompanyName(log.company || "오륙");
      const workerName = String(log.absentWorker?.name || log.name || "").trim();
      const key = `${compClean}_${workerName}_${log.date}`;
      registeredKeys.add(key);

      const cardKey = `${compClean}_${workerName}`;
      const absentCard = personnelCardsMap[cardKey] || personnelCardsMap[`${log.company}_${workerName}`] || log.absentWorker || {};
      const absentDept = absentCard.dept || log.absentWorker?.dept || "생산팀";
      const absentPos = absentCard.position || log.absentWorker?.position || "사원";
      const absentSkill = absentCard.skillLevel || log.absentWorker?.skillLevel || 3;
      const absentMainProc = absentCard.mainProcess || log.process || log.line || "압출";
      const absentReason = log.absentWorker?.reason || log.reason || "휴가";

      const isSub = Boolean(log.substituteWorker?.name && log.substituteWorker?.name !== "라인비가동" && !log.substituteWorker?.isLineStopped);
      const isLineStopped = log.substituteWorker?.name === "라인비가동" || log.substituteWorker?.isLineStopped;

      let subName = isLineStopped ? "라인비가동" : (log.substituteWorker?.name || "");
      let subPos = "사원";
      if (isSub) {
        const subCardKey = `${compClean}_${log.substituteWorker.name}`;
        const subCard = personnelCardsMap[subCardKey] || personnelCardsMap[`${log.company}_${log.substituteWorker.name}`] || log.substituteWorker || {};
        subPos = subCard.position || log.substituteWorker.position || "사원";
      }

      const isExt = String(absentMainProc || "").includes("압출");

      const title = isLineStopped
        ? `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ [라인비가동]`
        : `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ ${isSub ? `${subName}(${subPos}) 대체투입` : "대체 미투입"}`;

      unified.push({
        id: `man_log_${log.id || key}`,
        fourM: "Man",
        origin: isSub ? "4M 대체투입" : "결근발생",
        plant: log.plant || (compClean === "오륙" || compClean === "유성" ? "삼랑진공장" : "한림공장"),
        line: `${absentMainProc} 공정`,
        title,
        content: `• 소속: ${compClean} ${absentDept} | 결근자: ${workerName}(${absentPos}, Lv.${absentSkill}) | 사유: ${absentReason}`,
        actionResult: isLineStopped ? "라인 비가동 (공정 정지)" : (isSub ? `대체작업자 ${subName}(${subPos}) 투입 완료` : "라인 작업 조정"),
        date: log.date,
        isResolved: isSub || isLineStopped,
        isExtrusion: isExt
      });
    });

    // 출근부 결근 연동
    const ym = smartOvertimeData?.yearMonth || todayKst.slice(0, 7);
    const matrix = smartOvertimeData?.attendanceMatrix || [];
    matrix.forEach((w) => {
      if (!w || !w.name) return;
      const rawComp = w.company || "오륙";
      const compClean = cleanCompanyName(rawComp);
      const workerName = String(w.name).trim();

      const cardKey = `${compClean}_${workerName}`;
      const card = personnelCardsMap[cardKey] || personnelCardsMap[`${rawComp}_${workerName}`] || w.personnelCard || {};
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : compClean;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      const resolvedSkill = card?.skillLevel || 3;
      const resolvedMainProc = card?.mainProcess || w.line || "압출";

      for (let d = 1; d <= 31; d++) {
        const val = w[d] !== undefined ? w[d] : w[String(d)];
        if (!val) continue;
        const strVal = String(val).trim();
        if (strVal === "결근" || strVal === "무단결근" || strVal === "휴가" || strVal === "연차" || strVal === "반차" || strVal.includes("결근")) {
          const dStr = String(d).padStart(2, "0");
          const dateStr = `${ym}-${dStr}`;
          const key = `${resolvedComp}_${workerName}_${dateStr}`;
          if (registeredKeys.has(key)) continue;
          registeredKeys.add(key);

          const isExt = String(resolvedMainProc || "").includes("압출");

          unified.push({
            id: `man_matrix_${resolvedComp}_${workerName}_${dateStr}`,
            fourM: "Man",
            origin: "결근발생",
            plant: (resolvedComp === "오륙" || resolvedComp === "유성") ? "삼랑진공장" : "한림공장",
            line: `${resolvedMainProc} 공정`,
            title: `[${resolvedComp}] ${workerName}(${resolvedPos}, ${resolvedDept}) 결근 발생`,
            content: `• 소속: ${resolvedComp} ${resolvedDept} | 결근자: ${workerName}(${resolvedPos}, Lv.${resolvedSkill}) | 근태: ${strVal}`,
            actionResult: "대체인원 투입 점검, 특별교육 및 공정 관리",
            date: dateStr,
            isResolved: false,
            isExtrusion: isExt
          });
        }
      }
    });

    return unified.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [urgentIssues, localUrgentIssues, workLogs, extrusionReports, extrusionQualityIssues, smartOvertimeData, absenceLogsMap, todayKst, personnelCardsMap]);

  // 🌟 최근 2건의 4M 변동점 발생공지 (압출동 작업자 및 관리자 공통 동일 노출)
  const recent4MRecords = useMemo(() => {
    return allUnified4MRecords.slice(0, 2);
  }, [allUnified4MRecords]);

  // 압출동 전용 변동점 발생공지 (동일 내용 2건)
  const extrusion4MRecords = recent4MRecords;

  // 가공동 전용 변동점 발생공지 (동일 내용 2건)
  const processing4MRecords = recent4MRecords;

  // 관리자 전용 4M 통계
  const stats4M = useMemo(() => {
    const officialCount = fourMLedgerRecords.length;
    const machineCount = allUnified4MRecords.filter((r) => r.fourM === "Machine").length;
    const manCount = allUnified4MRecords.filter((r) => r.fourM === "Man").length;
    const materialCount = allUnified4MRecords.filter((r) => r.fourM === "Material").length;
    const methodCount = allUnified4MRecords.filter((r) => r.fourM === "Method").length;
    return {
      officialCount,
      machineCount,
      manCount,
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
  // 🌟 3. 관리자 일정 및 근태 통계 (본사 임원 vs 일반 관리자 일정 분리)
  // =========================================================================
  // 미완료 사내 일정
  const uncompletedCommonSchedules = useMemo(() => {
    const list = [];
    const todayStr = getKSTDateString();
    const now = Date.now();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    // 1. 공통 일정 (commonSchedules)
    (commonSchedules || []).forEach((s) => {
      if (!s || s.isCompleted || isScheduleExpired(s)) return;

      // 🔒 [철칙] ADMIN에서 작성된 내용은 타 일반 관리자(삼랑진/한림)에게 절대 공유/노출 금지
      if (!isHeadquarterAdmin) {
        if (isScheduleAdminRestricted(s)) return;

        const target = String(s.target || "").trim();
        // 타 공장 전용 일정 필터링
        if (isSamrangjinManager && target.includes("한림")) return;
        if (isHallimManager && target.includes("삼랑진")) return;
      }

      const comments = Array.isArray(s.comments) ? s.comments : [];
      const isRecentItem = s.createdAt && (now - new Date(s.createdAt).getTime()) < TWO_DAYS_MS;
      const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;
      const isRecentComment = latestComment && latestComment.createdAt && (now - new Date(latestComment.createdAt).getTime()) < TWO_DAYS_MS;
      const hasNewMessage = Boolean(isRecentItem || isRecentComment || comments.length > 0);

      list.push({
        id: s.id || s._docId || Math.random(),
        target: s.target || "공통",
        title: s.title,
        startDate: s.startDate || s.date,
        endDate: s.endDate || s.startDate || s.date,
        time: s.time || "",
        author: s.author || "ADMIN",
        createdAt: s.createdAt,
        comments,
        hasNewMessage,
        isRecent: isRecentItem,
        isCommonSchedule: true,
        rawSchedule: s
      });
    });

    // 2. 해당 일반 관리자 본인의 등록/공유 일정 (annualLeaves) 연동
    if (selectedUser && Array.isArray(annualLeaves)) {
      const uid = selectedUser.id;
      const uname = selectedUser.name;

      annualLeaves.forEach((l) => {
        if (!l || l.isCompleted || l.isDismissed) return;

        // 🔒 ADMIN이 작성한 일정/근태는 타 일반 관리자에게 절대 노출 금지
        const isLeaveAdmin =
          l.userId === "admin_kwon" ||
          l.userId === "admin_choi" ||
          l.userId === "admin" ||
          l.userName === "권태형" ||
          l.userName === "최미영" ||
          l.role === "ADMIN" ||
          l.plant === "본사";
        if (!isHeadquarterAdmin && isLeaveAdmin) return;

        const isMyLeave = (uid && l.userId === uid) || (uname && l.userName === uname);
        const isSharedToMe = Boolean(l.isSharedRecipient && ((uid && l.userId === uid) || (uname && l.userName === uname)));

        if (isMyLeave || isSharedToMe) {
          const sDate = l.startDate || l.date || "";
          const eDate = l.endDate || sDate;
          if (sDate && eDate && sDate <= todayStr && todayStr <= eDate) {
            const label = l.reason || l.leaveType || "일정";
            const already = list.some((item) => item.title === label);
            if (!already) {
              const isRecentLeave = l.createdAt && (now - new Date(l.createdAt).getTime()) < TWO_DAYS_MS;
              list.push({
                id: `leave_${l.id}`,
                target: isSharedToMe ? `공유(${l.sharedBy || "동료"})` : (l.leaveType || "개인"),
                title: label,
                startDate: sDate,
                endDate: eDate,
                time: "",
                author: l.userName || "관리자",
                comments: [],
                hasNewMessage: Boolean(isSharedToMe || isRecentLeave),
                isRecent: isRecentLeave,
                isCommonSchedule: false,
                rawSchedule: l
              });
            }
          }
        }
      });
    }

    return list.sort((a, b) => {
      // 새로운 메시지가 있는 항목을 우선 표시
      if (a.hasNewMessage && !b.hasNewMessage) return -1;
      if (!a.hasNewMessage && b.hasNewMessage) return 1;
      const aStart = a.startDate || a.date || "";
      const bStart = b.startDate || b.date || "";
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      return (a.time || "").localeCompare(b.time || "");
    });
  }, [commonSchedules, annualLeaves, selectedUser, isHeadquarterAdmin, isSamrangjinManager, isHallimManager]);

  // ⭐ 일정패널 전체 점멸 여부 (새로운 메시지/의견/신규 일정이 입력된 경우 true)
  const hasAnyNewScheduleMessage = useMemo(() => {
    return (uncompletedCommonSchedules || []).some((s) => s.hasNewMessage);
  }, [uncompletedCommonSchedules]);

  // 💬 일정 댓글/의견 추가 핸들러
  const handleAddScheduleComment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedScheduleForComments || !scheduleCommentInput.trim() || scheduleCommentSubmitting) return;

    setScheduleCommentSubmitting(true);
    try {
      const authorName = selectedUser?.name || "관리자";
      const authorRole = selectedUser?.title || selectedUser?.position || "관리자";
      const authorPlant = isHeadquarterAdmin ? "본사" : isSamrangjinManager ? "삼랑진공장" : "한림공장";

      const { updatedItem } = await addCommonScheduleComment(selectedScheduleForComments.id, {
        author: authorName,
        role: authorRole,
        plant: authorPlant,
        text: scheduleCommentInput.trim()
      });

      if (updatedItem) {
        setSelectedScheduleForComments(updatedItem);
      }
      setScheduleCommentInput("");
    } catch (err) {
      console.error("Failed to add schedule comment:", err);
      alert("의견 등록 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setScheduleCommentSubmitting(false);
    }
  };

  const handleDeleteScheduleComment = async (commentId) => {
    if (!selectedScheduleForComments || !commentId) return;
    if (!window.confirm("이 의견을 삭제하시겠습니까?")) return;
    try {
      const { updatedItem } = await deleteCommonScheduleComment(selectedScheduleForComments.id, commentId);
      if (updatedItem) {
        setSelectedScheduleForComments(updatedItem);
      }
    } catch (err) {
      console.error("Failed to delete schedule comment:", err);
    }
  };

  // 당일 일자 및 일일 근태 요약 (보고서와 실시간 동기화)
  const todayDayNum = useMemo(() => {
    const kst = getKSTDateString();
    const p = kst.split("-");
    return p.length === 3 ? parseInt(p[2], 10) : new Date().getDate();
  }, []);
  const unifiedPinMatrix = useMemo(() => {
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const todayKst = getKSTDateString();
    const p = todayKst.split("-");
    const todayYear = parseInt(p[0], 10) || 2026;
    const todayMonth = parseInt(p[1], 10) || 10;
    return (overtimeReports && overtimeReports.length > 0)
      ? buildMatrixFromReports(rawMatrix, overtimeReports, todayYear, todayMonth)
      : rawMatrix;
  }, [smartOvertimeData, overtimeReports]);

  const dailyOvertimeSummary = useMemo(() => {
    if (!unifiedPinMatrix || unifiedPinMatrix.length === 0) return null;
    return calculateDailySummary(unifiedPinMatrix, todayDayNum);
  }, [unifiedPinMatrix, todayDayNum]);

  const unwrittenCompanies = useMemo(() => {
    const matrix = unifiedPinMatrix || [];
    return COMPANIES.filter((comp) => {
      const cleanCompName = cleanCompanyName(comp);
      const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === cleanCompName);
      if (compWorkers.length === 0) return false;
      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[todayDayNum] !== undefined ? w.daily[todayDayNum] : w.daily[String(todayDayNum)])) ?? w[todayDayNum] ?? w[String(todayDayNum)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;
      return enteredCount === 0;
    });
  }, [unifiedPinMatrix, todayDayNum]);

  const isAfter9AM = useMemo(() => new Date().getHours() >= 9, []);

  // 당일 근태
  const leaveStatus = useMemo(() => {
    if (!selectedUser) return null;
    return getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });
  }, [selectedUser, annualLeaves]);

  if (!selectedUser) return null;

  const expectedPin = selectedUser?.pin || (isHeadquarterAdmin ? "0090" : "11");

  const checkPinValidity = (val) => {
    const trimmed = String(val || "").trim();
    if (isHeadquarterAdmin) {
      return trimmed === "0090" || trimmed === selectedUser.pin;
    }
    return trimmed === "11" || trimmed === selectedUser.pin || trimmed === "0090" || trimmed === "1234";
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
              isHeadquarterAdmin
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
                : isSamrangjinManager
                ? "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"
                : isHallimManager
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
                : isExtrusionWorker
                ? "bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"
                : "bg-gradient-to-r from-slate-500 via-blue-500 to-slate-600"
            }`}
          />

          {/* 🌟 1. Header: Avatar + Name + PIN input */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/90 dark:bg-slate-900/90">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md shrink-0 ${
                  isHeadquarterAdmin
                    ? "bg-blue-600 ring-2 ring-blue-400/40"
                    : isSamrangjinManager
                    ? "bg-amber-600 ring-2 ring-amber-400/40"
                    : isHallimManager
                    ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                    : isExtrusionWorker
                    ? "bg-indigo-600 ring-2 ring-indigo-400/40"
                    : "bg-slate-700 ring-2 ring-slate-400/40"
                }`}
              >
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-black text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight truncate">
                  {selectedUser.name} {selectedUser.title || (isHeadquarterAdmin ? "대표이사" : selectedUser.isPartner ? "대표이사" : "관리자")}
                </h3>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    isHeadquarterAdmin
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : selectedUser.isPartner
                      ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                      : isSamrangjinManager
                      ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : isHallimManager
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : isExtrusionWorker
                      ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200"
                  }`}
                >
                  {isHeadquarterAdmin
                    ? "경영총괄/대표이사"
                    : selectedUser.isPartner
                    ? `협력업체 (${selectedUser.name})`
                    : isSamrangjinManager
                    ? "삼랑진공장 관리자"
                    : isHallimManager
                    ? "한림공장 관리자"
                    : isExtrusionWorker
                    ? "압출동 작업자"
                    : "관리자"}
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
                    중대재해공유판, 품질이슈 및 4M 변동점 발생공지를 확인바랍니다.
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {isExtrusionWorker
                      ? "인증 시 [중대재해공유판 + 압출 품질이슈 + 4M 변동점 발생공지]가 표시됩니다."
                      : isProcessingWorker
                      ? "인증 시 [중대재해공유판 + 가공 품질이슈 + 4M 변동점 발생공지]가 표시됩니다."
                      : "인증 시 [중대재해공유판 + 관리자 일정 + 4M 변동점 발생공지 + 근태정보]가 표시됩니다."}
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

                      {/* 2. 4M 변동점 발생공지 (동일 내용 최근 2건) */}
                      <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 4M 변동점 발생공지
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                설비수리 • 비가동 • TPM • 불량손실 • 품질경보
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700">
                            최근 {recent4MRecords.length}건
                          </span>
                        </div>

                        {recent4MRecords.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {recent4MRecords.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800 border border-indigo-300" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                      {item.plant?.replace("공장", "")} • {item.line}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h6>
                                {item.content && item.content !== item.title && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                    {item.content}
                                  </p>
                                )}
                                {item.actionResult && (
                                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    ↳ 🟢 <b>[조치]</b> {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-indigo-800/80 dark:text-indigo-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-indigo-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            <span>최근 등록된 변동점이 없습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 2: 가공동 작업자 -> 가공 품질이슈 + 4M 변동점 발생공지 */}
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

                      {/* 2. 4M 변동점 발생공지 */}
                      <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 4M 변동점 발생공지
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                설비수리 • 비가동 • TPM • 불량손실 • 품질경보
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700">
                            최근 {recent4MRecords.length}건
                          </span>
                        </div>

                        {recent4MRecords.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {recent4MRecords.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-1 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800 border border-indigo-300" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                      {item.plant?.replace("공장", "")} • {item.line}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h6>
                                {item.content && item.content !== item.title && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                    {item.content}
                                  </p>
                                )}
                                {item.actionResult && (
                                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    ↳ 🟢 <b>[조치]</b> {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-indigo-800/80 dark:text-indigo-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-indigo-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            <span>최근 등록된 변동점이 없습니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 3: 관리자 -> 일정 + 변동점 + 근태정보 순으로 표시 */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {isAdminUser && (
                    <div className="space-y-3.5 flex flex-col justify-between h-full">
                      {/* 1. 사내 공통일정 / 관리자 일정 (새 메시지 등록 시 점멸 효과) */}
                      <div className={`p-3.5 rounded-3xl transition-all duration-300 space-y-2.5 ${
                        hasAnyNewScheduleMessage
                          ? "bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-indigo-50/95 dark:from-indigo-950/85 dark:via-purple-950/70 dark:to-indigo-950/85 border-2 border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-400/40 shadow-xl shadow-indigo-500/25 animate-pulse"
                          : "bg-slate-50 dark:bg-slate-800/70 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-sm"
                      }`}>
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl text-white shadow-xs shrink-0 ${
                              hasAnyNewScheduleMessage ? "bg-gradient-to-br from-rose-500 to-indigo-600 animate-bounce" : "bg-indigo-600"
                            }`}>
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                  {isHeadquarterAdmin
                                    ? "📌 본사 & 사내 공통일정"
                                    : isSamrangjinManager
                                    ? "📌 삼랑진공장 관리자 일정"
                                    : "📌 한림공장 관리자 일정"}
                                </span>
                                {hasAnyNewScheduleMessage && (
                                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 animate-pulse flex items-center gap-1 shadow-sm shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    <span>새 메시지 도착</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                {isHeadquarterAdmin
                                  ? "본사 및 전사 진행 중인 미완료 일정"
                                  : isSamrangjinManager
                                  ? "삼랑진공장 및 개인 미완료 일정"
                                  : "한림공장 및 개인 미완료 일정"}
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                            hasAnyNewScheduleMessage
                              ? "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700"
                              : "text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800"
                          }`}>
                            {uncompletedCommonSchedules.length}건 진행중
                          </span>
                        </div>

                        {uncompletedCommonSchedules.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                            {uncompletedCommonSchedules.map((schedule) => {
                              const sDate = schedule.startDate || schedule.date;
                              const eDate = schedule.endDate || sDate;
                              const dateText = sDate === eDate || !eDate ? sDate : `${sDate}~${eDate}`;
                              const commentCount = schedule.comments?.length || 0;
                              return (
                                <div
                                  key={schedule.id || schedule._docId}
                                  onClick={() => {
                                    if (schedule.rawSchedule) {
                                      setSelectedScheduleForComments(schedule.rawSchedule);
                                    }
                                  }}
                                  className={`p-2 rounded-xl border shadow-2xs text-xs flex items-center justify-between gap-1.5 transition-all cursor-pointer hover:scale-[1.01] ${
                                    schedule.hasNewMessage
                                      ? "bg-indigo-50/90 dark:bg-indigo-900/60 border-indigo-400 dark:border-indigo-500 ring-2 ring-purple-400/70 animate-pulse"
                                      : "bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  }`}
                                  title="클릭 시 일정 상세 및 의견/메시지 확인"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 shrink-0">
                                      {schedule.target || "공통"}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                      {schedule.title}
                                    </span>
                                    {commentCount > 0 && (
                                      <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-purple-600 text-white animate-pulse flex items-center gap-0.5 shrink-0 shadow-2xs">
                                        <MessageCircle className="w-2.5 h-2.5" />
                                        <span>의견 {commentCount}</span>
                                      </span>
                                    )}
                                    {commentCount === 0 && schedule.isRecent && (
                                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-600 text-white animate-pulse shrink-0">
                                        ⚡ NEW
                                      </span>
                                    )}
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

                      {/* 2. 4M 변동점 발생공지 (최근 2건 및 4M 현황) */}
                      <div className="p-3.5 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 4M 변동점 발생공지
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                설비수리 • 비가동 • TPM • 불량손실 • 품질경보
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">
                              ⭐ 대장 {stats4M.officialCount}
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

                        {recent4MRecords.length > 0 ? (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                            {recent4MRecords.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                                      item.origin === "설비수리" ? "bg-indigo-100 text-indigo-800 border border-indigo-300" :
                                      item.origin === "비가동" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                      item.origin === "TPM 이상신고" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}>
                                      {item.origin}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                                      {item.plant?.replace("공장", "")} • {item.line}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <h6 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h6>
                                {item.content && item.content !== item.title && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                    {item.content}
                                  </p>
                                )}
                                {item.actionResult && (
                                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    ↳ 🟢 <b>[조치결과]</b> {item.actionResult}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-3 text-center text-xs text-slate-400 font-bold">
                            등록된 변동점이 없습니다.
                          </div>
                        )}
                      </div>

                      {/* 3. 실시간 근태정보 (공장별 필터: 삼랑진=오륙·유성 / 한림=조영·한울·부림텍 / 본사=전사) */}
                      <div className="p-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-emerald-200 dark:border-emerald-800/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                👥 실시간 근태현황정보
                              </span>
                              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                {isSamrangjinManager
                                  ? "오륙 • 유성 (삼랑진공장)"
                                  : isHallimManager
                                  ? "조영 • 한울 • 부림텍 (한림공장)"
                                  : "오륙·유성 (삼랑진) / 조영·한울·부림텍 (한림)"}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10.5px] font-black text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200">
                            당일 {todayDayNum}일 기준
                          </span>
                        </div>

                        <div className={`grid gap-1.5 text-[10px] ${
                          visibleAttendanceCompanies.length === 2 ? "grid-cols-2" :
                          visibleAttendanceCompanies.length === 3 ? "grid-cols-3" :
                          "grid-cols-5"
                        }`}>
                          {visibleAttendanceCompanies.map((comp) => {
                            const b = dailyOvertimeSummary?.companyBreakdown?.[comp] || { attended: 0, total: 0, otWorkers: 0 };
                            const isUn = unwrittenCompanies.includes(comp);
                            return (
                              <div key={comp} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-0.5 shadow-2xs">
                                <span className="font-black text-slate-800 dark:text-slate-200 block truncate text-[11px]">{comp}</span>
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">{b.attended}/{b.total}명</span>
                                <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-bold block">잔업 {b.otWorkers}명</span>
                                {isUn ? (
                                  <span className="text-[9px] text-rose-500 font-bold block">{isAfter9AM ? "미작성" : "작성전"}</span>
                                ) : (
                                  <span className="text-[9px] text-emerald-500 font-bold block">완료</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
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

      {/* 💬 Schedule Detail & Comments Modal for Admin */}
      {selectedScheduleForComments && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedScheduleForComments(null);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-indigo-500/50 shadow-2xl animate-scaleUp overflow-hidden cursor-default text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                    공통일정 상세 및 의견 교환
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    일정 세부 내용을 확인하고 관련 의견이나 메시지를 남길 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheduleForComments(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800 flex-1 text-xs">
              {/* Schedule Info Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                      {selectedScheduleForComments.target || "공통"}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                      {selectedScheduleForComments.startDate || selectedScheduleForComments.date}
                      {selectedScheduleForComments.endDate && selectedScheduleForComments.endDate !== (selectedScheduleForComments.startDate || selectedScheduleForComments.date)
                        ? ` ~ ${selectedScheduleForComments.endDate}`
                        : ""}
                    </span>
                    {selectedScheduleForComments.time && selectedScheduleForComments.time !== "종일" && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        [{selectedScheduleForComments.time}]
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    등록자: {selectedScheduleForComments.author || "ADMIN"}
                  </span>
                </div>

                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                  {selectedScheduleForComments.title}
                </h4>
              </div>

              {/* Comments / Messages Section */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-purple-500" />
                    <span>실시간 의견 및 메시지</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {(selectedScheduleForComments.comments || []).length}건
                  </span>
                </div>

                {/* Comment List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  {(!selectedScheduleForComments.comments || selectedScheduleForComments.comments.length === 0) ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      등록된 의견이 없습니다. 아래 입력창에 첫 의견을 남겨보세요!
                    </div>
                  ) : (
                    selectedScheduleForComments.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span>{cmt.author}</span>
                            {cmt.role && (
                              <span className="text-[10px] font-normal text-slate-400">({cmt.role})</span>
                            )}
                            {cmt.plant && (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {cmt.plant}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteScheduleComment(cmt.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                              title="삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {cmt.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input Form */}
                <form onSubmit={handleAddScheduleComment} className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                    <span>
                      작성자: <strong className="text-slate-900 dark:text-white">{selectedUser?.name || "관리자"}</strong> ({selectedUser?.title || "관리자"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="의견이나 피드백 메시지를 입력하세요..."
                      value={scheduleCommentInput}
                      onChange={(e) => setScheduleCommentInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-slate-900 dark:text-white text-xs font-medium"
                      maxLength={200}
                    />
                    <button
                      type="submit"
                      disabled={scheduleCommentSubmitting || !scheduleCommentInput.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {scheduleCommentSubmitting ? "등록중..." : "의견 등록"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedScheduleForComments(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
