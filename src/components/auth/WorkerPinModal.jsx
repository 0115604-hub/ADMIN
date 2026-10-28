import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
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
  Plus,
  Check,
  ZoomIn,
  MessageCircle,
  CalendarDays,
  FileSpreadsheet
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
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../../services/hanulQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues
} from "../../services/machiningQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues
} from "../../services/yuseongQualityIssueService";
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
  cleanCompanyName
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
  getLocalPersonnelCardsMap,
  isWorkerManagerRole
} from "../../services/personnelCardService";
import {
  getCore4MId,
  getNormalizedTitleKey,
  mergeUnified4MRecords,
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  determineFourMCategory
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
  getLocalUrgentIssues,
  isMeetingExpired
} from "../../services/urgentIssueService";
import { getKSTDateString } from "../../utils/dateUtils";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
const HanulWorkReportModal = lazy(() => import("../HanulWorkReportModal"));
import { isExcludedFromWorkReport } from "../../services/hanulWorkReportService";
import { isExcludedFromMachiningWorkReport } from "../../services/machiningWorkReportService";
const MachiningWorkReportModal = lazy(() => import("../machining/MachiningWorkReportModal"));
const YuseongWorkReportModal = lazy(() => import("../yuseong/YuseongWorkReportModal"));
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

  // 📋 한울 작업일보 (9BQC / LQ2a) 모달 State
  const [isHanulWorkReportOpen, setIsHanulWorkReportOpen] = useState(false);
  const [hanulReportProject, setHanulReportProject] = useState("9BQC");

  const handleOpenHanulReport = (proj = "9BQC") => {
    setHanulReportProject(proj);
    setIsHanulWorkReportOpen(true);
  };

  // 📋 가공동 작업일보 (JA / NX4 / NX4a / HR) 모달 State
  const [isMachiningWorkReportOpen, setIsMachiningWorkReportOpen] = useState(false);
  const [machiningReportProject, setMachiningReportProject] = useState("JA");

  const handleOpenMachiningReport = (proj = "JA") => {
    setMachiningReportProject(proj);
    setIsMachiningWorkReportOpen(true);
  };

  // 📋 유성 작업일보 (JK1 / CE1 / DT) 모달 State
  const [isYuseongWorkReportOpen, setIsYuseongWorkReportOpen] = useState(false);
  const [yuseongReportProject, setYuseongReportProject] = useState("JK1");

  const handleOpenYuseongReport = (proj = "JK1") => {
    setYuseongReportProject(proj);
    setIsYuseongWorkReportOpen(true);
  };

  // 💬 일정 상세 & 의견/메시지 모달 State
  const [selectedScheduleForComments, setSelectedScheduleForComments] = useState(null);
  const [scheduleCommentInput, setScheduleCommentInput] = useState("");
  const [scheduleCommentSubmitting, setScheduleCommentSubmitting] = useState(false);

  // Real-time Service Streams
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [absenceLogsMap, setAbsenceLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [extrusionQualityIssues, setExtrusionQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
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
    const unsubHanulQual = subscribeHanulQualityIssues((list) => setHanulQualityIssues(list || []));
    const unsubMachQual = subscribeMachiningQualityIssues((list) => setMachiningQualityIssues(list || []));
    const unsubYuseongQual = subscribeYuseongQualityIssues((list) => setYuseongQualityIssues(list || []));
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
      if (unsubReports) unsubReports();
      if (unsubAbsence) unsubAbsence();
      if (unsubExtQual) unsubExtQual();
      if (unsubHanulQual) unsubHanulQual();
      if (unsubMachQual) unsubMachQual();
      if (unsubYuseongQual) unsubYuseongQual();
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

  // Ensure modal scroll starts at top on open
  useEffect(() => {
    if (selectedUser) {
      const resetScroll = () => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
        if (overlayRef.current) overlayRef.current.scrollTop = 0;
      };
      resetScroll();
      const t1 = setTimeout(resetScroll, 20);
      return () => clearTimeout(t1);
    }
  }, [selectedUser]);

  // Dismiss virtual keyboard on mobile as soon as PIN is verified & scroll body to top
  useEffect(() => {
    if (isPinVerified) {
      if (pinInputRef.current) {
        pinInputRef.current.blur();
      }
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      const resetScroll = () => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
        if (overlayRef.current) overlayRef.current.scrollTop = 0;
      };
      resetScroll();
      const t1 = setTimeout(resetScroll, 20);
      const t2 = setTimeout(resetScroll, 100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isPinVerified]);

  // =========================================================================
  // 🌟 Role Identification
  // 1. 압출동 작업자: portalType === 'extrusion' / EXTRUSION_WORKERS (11명) / building === "압출동" / id starts with "ext_"
  // 2. 관리자: 첫화면의 모든 명찰(본사 대표이사/전무, 삼랑진공장, 한림공장)은 관리자임!
  // =========================================================================
  const isExtrusionWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (selectedUser.portalType === "extrusion") return true;
    if (selectedUser.portalType === "hanul" || selectedUser.portalType === "bulimtech" || selectedUser.portalType === "machining") return false;
    return Boolean(
      EXTRUSION_WORKERS.some((w) => w.id === selectedUser.id || w.name === selectedUser.name) ||
      selectedUser.building === "압출동" ||
      selectedUser.id?.startsWith("ext_") ||
      selectedUser.assignedProcess === "압출동" ||
      (selectedUser.plant === "삼랑진공장" && ["공영국", "심임대", "이상은", "닉", "마이클", "존카를로", "지미", "만", "샤먼", "쿠마루", "이수루"].includes(selectedUser.name))
    );
  }, [selectedUser]);

  // 🌟 가공동 작업자 판별 (상단 가공동 31명 포털 및 가공 현장 인원)
  const isMachiningWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (isExtrusionWorker) return false;
    if (selectedUser.portalType === "machining") return true;
    if (selectedUser.portalType === "extrusion" || selectedUser.portalType === "hanul" || selectedUser.portalType === "bulimtech" || selectedUser.portalType === "yuseong" || selectedUser.portalType === "joyoung") return false;
    return Boolean(
      selectedUser.building === "가공동" ||
      selectedUser.dept === "가공동" ||
      selectedUser.dept === "가공관리팀" ||
      String(selectedUser.dept || "").includes("가공") ||
      String(selectedUser.id || "").startsWith("mach_") ||
      (selectedUser.company === "오륙" && (
        selectedUser.dept === "가공동" ||
        selectedUser.dept === "가공관리팀" ||
        ["JA", "HR", "NX4", "NX4a", "Channel", "JA.HR", "NX4.NX4a", "조인트", "검사", "사상", "소재준비"].includes(selectedUser.line)
      ))
    );
  }, [selectedUser, isExtrusionWorker]);

  // 🌟 1. 한울 및 부림텍 현장 작업자 판별 (첫 화면 아래쪽 대표이사 hal_hu, hal_br는 관리자이므로 제외)
  const isHanulOrBurim = useMemo(() => {
    if (!selectedUser) return false;
    if (isExtrusionWorker || isMachiningWorker) return false;
    // 첫 화면 아래쪽 대표이사(hal_hu, hal_br)는 관리자이므로 현장작업자에서 명확히 제외
    if (!selectedUser.isFieldWorker && (selectedUser.id === "hal_hu" || selectedUser.id === "hal_br" || selectedUser.title === "대표이사")) {
      return false;
    }
    if (selectedUser.portalType === "hanul" || selectedUser.portalType === "bulimtech") return true;
    if (selectedUser.portalType === "extrusion" || selectedUser.portalType === "machining") return false;

    const comp = String(selectedUser.company || "");
    const name = String(selectedUser.name || "");
    const id = String(selectedUser.id || "");
    const plant = String(selectedUser.plant || "");

    return Boolean(
      selectedUser.isFieldWorker && (
        comp.includes("한울") ||
        comp.includes("부림") ||
        name === "한울" ||
        name === "부림텍" ||
        id.startsWith("hal_hu_") ||
        id.startsWith("hal_br_") ||
        (plant === "한림공장" && (
          selectedUser.line === "9BQC" ||
          selectedUser.line === "LQ2" ||
          selectedUser.line === "LQ2a" ||
          [
            "박종미", "마이클", "마크", "로렉스", "무피드", "마틴",
            "박민정", "지라완", "레이놀드", "맥리", "조제인", "새드릭", "니사낫",
            "수파따", "와히드", "찬티마", "데이브", "위간", "프랭클린", "에일리",
            "마이카", "알프레도", "아이린", "에릭", "언"
          ].includes(name)
        ))
      )
    );
  }, [selectedUser, isExtrusionWorker, isMachiningWorker]);

  const isHanul = useMemo(() => {
    if (!isHanulOrBurim) return false;
    if (isExtrusionWorker || isMachiningWorker) return false;
    if (selectedUser?.portalType === "bulimtech") return false;
    if (selectedUser?.portalType === "hanul") return true;

    const comp = String(selectedUser?.company || "");
    const name = String(selectedUser?.name || "");
    const id = String(selectedUser?.id || "");
    const plant = String(selectedUser?.plant || "");
    return Boolean(
      selectedUser?.isFieldWorker && (
        comp.includes("한울") ||
        name === "한울" ||
        id.startsWith("hal_hu_") ||
        (plant === "한림공장" && (
          selectedUser?.line === "9BQC" ||
          selectedUser?.line === "LQ2" ||
          selectedUser?.line === "LQ2a" ||
          [
            "박종미", "마이클", "마크", "로렉스", "무피드", "마틴",
            "박민정", "지라완", "레이놀드", "맥리", "조제인", "새드릭", "니사낫",
            "수파따", "와히드", "찬티마", "데이브", "위간", "프랭클린", "에일리",
            "마이카", "알프레도", "아이린", "에릭", "언"
          ].includes(name)
        ))
      )
    );
  }, [selectedUser, isHanulOrBurim, isExtrusionWorker, isMachiningWorker]);

  const isBurimtech = useMemo(() => {
    if (!isHanulOrBurim) return false;
    if (isExtrusionWorker || isMachiningWorker || isHanul) return false;
    if (selectedUser?.portalType === "bulimtech") return true;
    return !isHanul;
  }, [isHanulOrBurim, isHanul, isExtrusionWorker, isMachiningWorker, selectedUser]);

  // Backward compatibility alias for Hanul worker checks
  const isHanulWorker = isHanul;

  // 🌟 (주)유성 현장 작업자 판별 (첫 화면 아래쪽 유성 대표이사는 관리자이므로 제외)
  const isYuseongWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (isExtrusionWorker || isMachiningWorker || isHanulOrBurim) return false;
    if (!selectedUser.isFieldWorker && (selectedUser.id === "sam_ys" || selectedUser.title === "대표이사")) {
      return false;
    }
    if (selectedUser.portalType === "yuseong") return true;
    const comp = String(selectedUser.company || "");
    const name = String(selectedUser.name || "");
    const id = String(selectedUser.id || "");
    return Boolean(
      selectedUser.isFieldWorker && (
        comp.includes("유성") ||
        id.startsWith("ys_") ||
        [
          "이성기", "조마루", "쏘탈", "론나차이", "마리오", "제날드",
          "팔라", "누리", "데란스", "포티퐁", "린", "넷플립", "제인", "그레이스"
        ].includes(name)
      )
    );
  }, [selectedUser, isExtrusionWorker, isMachiningWorker, isHanulOrBurim]);

  // 🌟 (주)조영 현장 작업자 판별 (김동욱 관리자가 올린 부적합경보 전용 수신 대상)
  const isJoyoungWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (isExtrusionWorker || isMachiningWorker || isHanulOrBurim || isYuseongWorker) return false;
    if (!selectedUser.isFieldWorker && (selectedUser.id === "hal_dw" || selectedUser.name === "김동욱" || selectedUser.title === "대표이사")) {
      return false;
    }
    if (selectedUser.portalType === "joyoung") return true;
    const comp = String(selectedUser.company || "");
    const id = String(selectedUser.id || "");
    return Boolean(
      selectedUser.isFieldWorker && (
        comp.includes("조영") ||
        id.startsWith("jy_") ||
        id.startsWith("hal_jy_")
      )
    );
  }, [selectedUser, isExtrusionWorker, isMachiningWorker, isHanulOrBurim, isYuseongWorker]);

  // 🌟 6대 현장 작업자 (압출동, 가공동, 한울, 부림텍, 유성, 조영) 통합 판별 - 첫화면 아래쪽 인원은 100% 관리자
  const isFieldWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (!selectedUser.isFieldWorker) return false;
    return Boolean(
      isExtrusionWorker ||
      isHanulOrBurim ||
      isMachiningWorker ||
      isYuseongWorker ||
      isJoyoungWorker ||
      selectedUser?.isFieldWorker
    );
  }, [isExtrusionWorker, isHanulOrBurim, isMachiningWorker, isYuseongWorker, isJoyoungWorker, selectedUser]);

  // 🌟 2. 첫화면 아래 협력업체 대표이사 계정 판별 (유성, 한울, 부림텍 등 첫화면 아래 대표이사 전원)
  const isCompanyRepresentative = useMemo(() => {
    if (!selectedUser) return false;
    if (selectedUser.isFieldWorker) return false;
    return Boolean(
      selectedUser.id === "sam_ys" ||
      selectedUser.id === "hal_hu" ||
      selectedUser.id === "hal_br" ||
      selectedUser.name === "한울" ||
      selectedUser.name === "부림텍" ||
      selectedUser.name === "유성" ||
      selectedUser.title === "대표이사"
    );
  }, [selectedUser]);

  // 🌟 3. 관리자 화면 표시 대상: 본사 임원, 공장 관리자, 협력사 대표이사(유성, 한울, 부림텍)
  const isAdminUser = useMemo(() => {
    if (!selectedUser) return false;
    if (selectedUser.isFieldWorker) return false;
    return true;
  }, [selectedUser]);

  const isSamrangjinManager = useMemo(() => {
    if (!selectedUser) return false;
    if (selectedUser.isFieldWorker) return false;
    return selectedUser.plant === "삼랑진공장" || String(selectedUser.id || "").startsWith("sam_");
  }, [selectedUser]);

  const isHallimManager = useMemo(() => {
    if (!selectedUser) return false;
    if (selectedUser.isFieldWorker) return false;
    return selectedUser.plant === "한림공장" || String(selectedUser.id || "").startsWith("hal_");
  }, [selectedUser]);

  // ⭐ 현장작업자 중 관리자 여부 (인사카드에서 '관리자' 선택자 또는 공영국/심임대/이상은/설유철/박종미/최현영)
  const isWorkerManager = useMemo(() => {
    return isWorkerManagerRole(selectedUser, personnelCardsMap);
  }, [selectedUser, personnelCardsMap]);

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



  const isProcessingWorker = useMemo(() => {
    if (!selectedUser) return false;
    if (isHanulOrBurim) return false;
    if (isCompanyRepresentative) return false;
    return Boolean(
      (selectedUser.isFieldWorker && !isExtrusionWorker) ||
      (selectedUser.assignedProcess?.includes("외주가공") && selectedUser.isFieldWorker)
    );
  }, [selectedUser, isHanulOrBurim, isCompanyRepresentative, isExtrusionWorker]);

  const todayKst = getKSTDateString();

  // =========================================================================
  // 🌟 1. 4M 변동점 데이터 실시간 통합 파싱 (설비수리 + 비가동 + TPM + 불량 + 품질경보 3건 전체)
  // =========================================================================
  const allUnified4MRecords = useMemo(() => {
    const unified = [];
    const sourceIssues = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;
    const seenAlertIds = new Set();

    // 1-1. 전사 긴급이슈 부적합경보 (Method/Machine/Material)
    (sourceIssues || []).forEach((issue) => {
      if (!issue) return;
      const isDel = issue.isDeleted === true || issue.isDeleted === "true" || issue.deleted === true;
      const rawCat = String(issue.category || "").trim();
      // 🔒 오픈이슈, 회의일정, 사내공지는 4M 변동점에서 완전 제외
      if (
        rawCat === "오픈이슈" ||
        rawCat === "open_issue" ||
        rawCat.includes("오픈이슈") ||
        rawCat === "회의일정" ||
        rawCat.includes("회의") ||
        rawCat === "공지사항" ||
        rawCat === "사내공지" ||
        rawCat === "공유사항"
      ) {
        return;
      }

      const titleLower = String(issue.title || "").toLowerCase();
      const contentLower = String(issue.content || "").toLowerCase();
      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "부적합경보" ||
        rawCat === "품질 경보" ||
        rawCat === "부적합 경보" ||
        rawCat === "품질이슈" ||
        rawCat === "품질 이슈" ||
        rawCat.includes("품질") ||
        rawCat.includes("부적합") ||
        rawCat.toLowerCase().includes("quality") ||
        titleLower.includes("품질경보") ||
        titleLower.includes("부적합경보") ||
        titleLower.includes("가류조") ||
        titleLower.includes("코팅") ||
        titleLower.includes("클립") ||
        titleLower.includes("불량") ||
        titleLower.includes("이상") ||
        contentLower.includes("가류조") ||
        contentLower.includes("코팅") ||
        contentLower.includes("클립") ||
        issue.type === "QUALITY_ALERT" ||
        issue.type === "품질경보";

      if (!isQualityAlert) return;

      const rawId = String(issue.id || issue._docId || "");
      if (rawId) {
        if (seenAlertIds.has(rawId)) return;
        seenAlertIds.add(rawId);
      }

      const lineStr = String(issue.line || issue.process || "").trim();
      const titleStr = String(issue.title || "").trim();
      const isExt = lineStr.includes("압출") || lineStr.includes("PCM") || lineStr.includes("PVC") || lineStr.includes("TPE") || titleStr.includes("압출");

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: determineFourMCategory(issue),
        origin: "부적합경보",
        plant: issue.plant || "삼랑진공장",
        line: lineStr || (isExt ? "압출라인" : "가공/품질"),
        title: issue.title || issue.content || "(부적합경보 발령)",
        content: issue.content || issue.details || "",
        actionResult: issue.actionResult || "",
        date: issue.date || (issue.createdAt ? String(issue.createdAt).slice(0, 10) : todayKst),
        isResolved: Boolean(issue.isResolved || (issue.actionResult && String(issue.actionResult).trim()) || isDel),
        isExtrusion: isExt
      });
    });

    // 1-1-A. 압출 부적합경보
    (extrusionQualityIssues || []).forEach((alert) => {
      if (!alert || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;
      if (alert.isDeleted === true || alert.status === "DELETED") return;
      const rawId = String(alert.id || "");
      if (rawId) {
        if (seenAlertIds.has(rawId) || seenAlertIds.has(`ext_q_${rawId}`)) return;
        seenAlertIds.add(rawId);
        seenAlertIds.add(`ext_q_${rawId}`);
      }

      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.lineName || alert.lineId || "압출라인",
        title: alert.title ? `[압출] ${alert.title}` : `[압출] ${alert.defectType || "품질이상"}`,
        content: alert.content || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || "",
        date: alert.date || (alert.createdAt ? String(alert.createdAt).slice(0, 10) : todayKst),
        isResolved: alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && String(alert.actionResult).trim())),
        isExtrusion: true
      });
    });

    // 1-1-B. 한울 외주가공 부적합경보
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;
      const rawId = String(alert.id || "");
      if (rawId) {
        if (seenAlertIds.has(rawId) || seenAlertIds.has(`hanul_q_${rawId}`)) return;
        seenAlertIds.add(rawId);
        seenAlertIds.add(`hanul_q_${rawId}`);
      }

      unified.push({
        id: `hanul_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        plant: alert.plant || "한림공장",
        line: alert.line || "외주가공(한울)",
        title: alert.title ? `[한울] ${alert.title}` : `[한울] ${alert.defectType || "품질이상"}`,
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        date: alert.targetDate || alert.date || (alert.createdAt ? String(alert.createdAt).slice(0, 10) : todayKst),
        isResolved: alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && String(alert.actionResult).trim())),
        isExtrusion: false
      });
    });

    // 1-1-C. 유성 외주가공 부적합경보
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;
      const rawId = String(alert.id || "");
      if (rawId) {
        if (seenAlertIds.has(rawId) || seenAlertIds.has(`ys_q_${rawId}`)) return;
        seenAlertIds.add(rawId);
        seenAlertIds.add(`ys_q_${rawId}`);
      }

      unified.push({
        id: `ys_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "외주가공(유성)",
        title: alert.title ? `[유성] ${alert.title}` : `[유성] ${alert.defectType || "품질이상"}`,
        content: alert.content || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        date: alert.date || (alert.createdAt ? String(alert.createdAt).slice(0, 10) : todayKst),
        isResolved: alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && String(alert.actionResult).trim())),
        isExtrusion: false
      });
    });

    // 1-1-D. 가공동 부적합경보
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;
      const rawId = String(alert.id || "");
      if (rawId) {
        if (seenAlertIds.has(rawId) || seenAlertIds.has(`mach_q_${rawId}`)) return;
        seenAlertIds.add(rawId);
        seenAlertIds.add(`mach_q_${rawId}`);
      }

      unified.push({
        id: `mach_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || "가공동",
        title: alert.title ? `[가공] ${alert.title}` : `[가공] ${alert.defectType || "가공 품질이상"}`,
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        date: alert.date || (alert.createdAt ? String(alert.createdAt).slice(0, 10) : todayKst),
        isResolved: alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && String(alert.actionResult).trim())),
        isExtrusion: false
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
      if (!alert || String(alert.id).startsWith("demo_") || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2") return;
      const rawId = String(alert.id || "");
      if (rawId) {
        if (seenAlertIds.has(rawId) || seenAlertIds.has(`ext_q_${rawId}`)) return;
        seenAlertIds.add(rawId);
        seenAlertIds.add(`ext_q_${rawId}`);
      }

      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: "Method",
        origin: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        title: alert.title || `[압출] ${alert.defectType || "압출 품질이상"}`,
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

    // 1-6. [Canonical 4M Pipeline] 공식 4M 변동점 관리대장 등록 건 직접 수합 및 완전 단일화
    const rawLedgerItems = (fourMLedgerRecords || []).filter((rec) => {
      if (!rec) return false;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      return !(
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      );
    }).map((rec) => {
      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");
      const lineStr = String(rec.line || "").trim();
      const isExt = lineStr.includes("압출") || lineStr.includes("PCM") || lineStr.includes("PVC") || lineStr.includes("TPE");
      return {
        id: recId.startsWith("ledger_") ? recId : `ledger_${recId}`,
        originalId: origId || recId,
        rawId: rawId,
        fourM: rec.fourM || determineFourMCategory(rec),
        origin: rec.origin || "변동점대장",
        plant: rec.plant || "삼랑진공장",
        line: rec.line || (isExt ? "압출라인" : "가공/품질"),
        title: rec.title || "(변동점)",
        content: rec.content || "",
        actionResult: rec.actionResult || "",
        date: rec.date || todayKst,
        isResolved: Boolean(rec.isResolved),
        isExtrusion: isExt,
        isOfficialLedger: true
      };
    });

    // 🔒 Canonical Single Source of Truth Pipeline
    const canonicalMap = new Map();
    const titleIndexMap = new Map();

    [...unified, ...rawLedgerItems].forEach((item) => {
      if (!item) return;
      const coreId = getCore4MId(item);
      const titleKey = getNormalizedTitleKey(item);

      let matchedKey = null;
      if (coreId && coreId.length >= 8 && canonicalMap.has(`core_${coreId}`)) {
        matchedKey = `core_${coreId}`;
      } else if (titleKey && titleIndexMap.has(titleKey)) {
        matchedKey = titleIndexMap.get(titleKey);
      }

      if (matchedKey && canonicalMap.has(matchedKey)) {
        const existing = canonicalMap.get(matchedKey);
        canonicalMap.set(matchedKey, mergeUnified4MRecords(existing, item));
      } else {
        const primaryKey = (coreId && coreId.length >= 8) ? `core_${coreId}` : `item_${item.id || Math.random()}`;
        canonicalMap.set(primaryKey, item);
        if (titleKey) {
          titleIndexMap.set(titleKey, primaryKey);
        }
      }
    });

    return Array.from(canonicalMap.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [
    urgentIssues,
    localUrgentIssues,
    fourMLedgerRecords,
    workLogs,
    extrusionReports,
    extrusionQualityIssues,
    hanulQualityIssues,
    yuseongQualityIssues,
    machiningQualityIssues,
    smartOvertimeData,
    absenceLogsMap,
    todayKst,
    personnelCardsMap
  ]);

  // 🌟 이창엽의 4M 정식대장 최신 5건 (시간순 정렬)
  const official4MLedgerTop5 = useMemo(() => {
    const list = Array.isArray(fourMLedgerRecords) ? [...fourMLedgerRecords] : [];
    // Only official ledger records (이창엽 품질책임자 공식대장 등재건)
    const officialList = list.filter((r) => r.isOfficialLedger !== false);

    // 시간순(최신순) 정렬: 발생일자(date) 또는 등록일시(registeredAt) 최신순
    officialList.sort((a, b) => {
      const dateA = a.date || a.registeredAt?.slice(0, 10) || "";
      const dateB = b.date || b.registeredAt?.slice(0, 10) || "";
      if (dateB !== dateA) return dateB.localeCompare(dateA);

      const regA = a.registeredAt || a.time || "";
      const regB = b.registeredAt || b.time || "";
      if (regB !== regA) return regB.localeCompare(regA);

      return (b.id || "").localeCompare(a.id || "");
    });

    return officialList.slice(0, 5);
  }, [fourMLedgerRecords]);

  // 🌟 4M 변동점 발생공지 (모든 부적합경보 100% 최우선 포함 + 최신 설비/인원/불량 변동점)
  const recent4MRecords = useMemo(() => {
    // 1. 등록된 모든 부적합경보 - 4M 분류(Machine/Material/Method)와 무관하게 100% 최우선 수집
    const qualityAlerts = allUnified4MRecords.filter(
      (r) => r.origin === "부적합경보" || r.origin === "품질경보" || r.sourceType === "QUALITY_ALERT"
    );

    // 2. 기타 4M 변동점 (설비수리, 결근, 작업일보 등)
    const other4MRecords = allUnified4MRecords.filter(
      (r) => r.origin !== "부적합경보" && r.origin !== "품질경보" && r.sourceType !== "QUALITY_ALERT"
    );

    // 3. 부적합경보 정렬: 미조치건 우선 -> 최신순
    const sortedQualityAlerts = [...qualityAlerts].sort((a, b) => {
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      return (b.date || "").localeCompare(a.date || "");
    });

    // ⭐ 부적합경보는 단 1건도 누락 없이 전부 상단에 올리고, 기타 4M 변동점 최근 10건 병합
    return [...sortedQualityAlerts, ...other4MRecords.slice(0, 10)];
  }, [allUnified4MRecords]);

  // 압출동 전용 변동점 발생공지
  const extrusion4MRecords = recent4MRecords;

  // 가공동 전용 변동점 발생공지
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
  // 🌟 2. 현장 작업자 전용 2개 패널 데이터 (소속 관리자 이슈 1:1 전담 매칭 + 첫화면 품질경보/당일공지)
  // - 설유철 관리자 ➔ 압출동 현장작업자에게만
  // - 윤경수·이창엽 관리자 ➔ 가공동 현장작업자에게만
  // - 한울 관리자 ➔ 한울 현장작업자에게만
  // - 부림텍 관리자 ➔ 부림 현장작업자에게만
  // - 김동욱 관리자 ➔ 조영 현장작업자에게만
  // - 유성 관리자 ➔ 유성 현장작업자에게만
  // =========================================================================
  const managerQualitySection = useMemo(() => {
    let sectorName = "가공동";
    let managerName = "윤경수·이창엽 책임";
    let subText = "윤경수·이창엽 책임 공지 • 가공동 라인별 품질이슈 및 긴급공지";
    const issues = [];
    const sourceIssues = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;

    if (isExtrusionWorker) {
      // 1) 설유철 관리자가 올린 부적합경보등록 ➔ 압출동 현장작업자에게만
      sectorName = "압출동";
      managerName = "설유철 책임";
      subText = "설유철 책임 공지 • 압출동 라인별 불량 원인 및 조치";

      (extrusionQualityIssues || []).forEach((eq) => {
        if (!eq || eq.status === "RESOLVED") return;
        const causeImgs = Array.isArray(eq.causeImages) ? eq.causeImages : [];
        const actionImgs = Array.isArray(eq.actionImages) ? eq.actionImages : [];
        const rawImgs = Array.isArray(eq.images) ? eq.images : [...causeImgs, ...actionImgs];
        const allImgs = rawImgs.map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `ext_q_${eq.id}`,
          title: eq.title,
          content: eq.content,
          line: eq.line,
          defectType: eq.defectType,
          actionResult: eq.actionResult || eq.actionGuide,
          images: allImgs,
          date: eq.date || (eq.createdAt ? String(eq.createdAt).slice(0, 10) : todayKst),
          author: eq.author || "설유철 책임"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const isSeol = u.author === "설유철" || String(u.author || "").includes("설유철") || u.targetWorkerGroup === "extrusion";
        if (isSeol) {
          issues.push({
            id: `urg_ext_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "압출동",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author ? `${u.author} ${u.authorTitle || ""}`.trim() : "설유철 책임"
          });
        }
      });
    } else if (isHanul) {
      // 2) 한울 관리자가 올린 부적합경보등록 ➔ 한울 현장작업자에게만
      sectorName = "(주)한울";
      managerName = "한울 관리자";
      subText = "한울 관리자 공지 • 9BQC / LQ2 외주가공 품질이슈 및 공지";

      (hanulQualityIssues || []).forEach((hq) => {
        if (!hq || hq.status === "RESOLVED") return;
        const comp = String(hq.company || "한울").trim();
        const author = String(hq.author || "").trim();
        const isStrictlyHanul =
          hq.targetWorkerGroup === "hanul" ||
          (comp === "한울" && author !== "김동욱" && !author.includes("부림") && !author.includes("유성"));
        if (!isStrictlyHanul) return;

        const causeImgs = Array.isArray(hq.causeImages) ? hq.causeImages : [];
        const actionImgs = Array.isArray(hq.actionImages) ? hq.actionImages : [];
        const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `hq_${hq.id}`,
          title: hq.title,
          content: hq.defectDescription || hq.content,
          line: hq.line || "9BQC/LQ2",
          defectType: hq.defectType,
          actionResult: hq.actionPlan || hq.actionResult,
          images: allImgs,
          date: hq.date || todayKst,
          author: hq.author || "한울 관리자"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const comp = String(u.company || "").trim();
        const author = String(u.author || "").trim();
        if (u.targetWorkerGroup === "hanul" || comp === "한울" || author === "한울" || author === "황수현") {
          issues.push({
            id: `urg_hu_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "한울",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author || "한울 관리자"
          });
        }
      });
    } else if (isBurimtech) {
      // 3) 부림텍 관리자가 올린 부적합경보등록 ➔ 부림 현장작업자에게만
      sectorName = "(주)부림텍";
      managerName = "부림텍 관리자";
      subText = "부림텍 관리자 공지 • 부림텍 외주가공 품질이슈 및 공지";

      (hanulQualityIssues || []).forEach((hq) => {
        if (!hq || hq.status === "RESOLVED") return;
        const comp = String(hq.company || "").trim();
        const author = String(hq.author || "").trim();
        const isStrictlyBurimtech =
          hq.targetWorkerGroup === "burimtech" ||
          comp === "부림텍" ||
          author.includes("부림") ||
          author === "김동훈";
        if (!isStrictlyBurimtech) return;

        const causeImgs = Array.isArray(hq.causeImages) ? hq.causeImages : [];
        const actionImgs = Array.isArray(hq.actionImages) ? hq.actionImages : [];
        const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `hq_br_${hq.id}`,
          title: hq.title,
          content: hq.defectDescription || hq.content,
          line: hq.line || "부림텍",
          defectType: hq.defectType,
          actionResult: hq.actionPlan || hq.actionResult,
          images: allImgs,
          date: hq.date || todayKst,
          author: hq.author || "부림텍 관리자"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const comp = String(u.company || "").trim();
        const author = String(u.author || "").trim();
        if (u.targetWorkerGroup === "burimtech" || comp.includes("부림") || author.includes("부림") || author === "김동훈") {
          issues.push({
            id: `urg_br_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "부림텍",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author || "부림텍 관리자"
          });
        }
      });
    } else if (isJoyoungWorker) {
      // 4) 김동욱 관리자가 올린 부적합경보등록 ➔ 조영 현장작업자에게만
      sectorName = "(주)조영";
      managerName = "김동욱 책임";
      subText = "김동욱 책임 공지 • 한림공장 (주)조영 품질이슈 및 공지";

      (hanulQualityIssues || []).forEach((hq) => {
        if (!hq || hq.status === "RESOLVED") return;
        const comp = String(hq.company || "").trim();
        const author = String(hq.author || "").trim();
        const isStrictlyJoyoung =
          hq.targetWorkerGroup === "joyoung" ||
          comp === "조영" ||
          author === "김동욱";
        if (!isStrictlyJoyoung) return;

        const causeImgs = Array.isArray(hq.causeImages) ? hq.causeImages : [];
        const actionImgs = Array.isArray(hq.actionImages) ? hq.actionImages : [];
        const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `hq_jy_${hq.id}`,
          title: hq.title,
          content: hq.defectDescription || hq.content,
          line: hq.line || "한림공장 조영",
          defectType: hq.defectType,
          actionResult: hq.actionPlan || hq.actionResult,
          images: allImgs,
          date: hq.date || todayKst,
          author: hq.author || "김동욱 책임"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const comp = String(u.company || "").trim();
        const author = String(u.author || "").trim();
        if (u.targetWorkerGroup === "joyoung" || comp === "조영" || author === "김동욱") {
          issues.push({
            id: `urg_jy_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "한림공장 조영",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author || "김동욱 책임"
          });
        }
      });
    } else if (isYuseongWorker) {
      // 5) 유성 관리자가 올린 부적합경보등록 ➔ 유성 현장작업자에게만
      sectorName = "(주)유성";
      managerName = "유성 관리자";
      subText = "유성 관리자 공지 • JK1 Part'g / CE1 Part'g / DT Hood 품질이슈 및 공지";

      (yuseongQualityIssues || []).forEach((yq) => {
        if (!yq || yq.status === "RESOLVED") return;
        const causeImgs = Array.isArray(yq.causeImages) ? yq.causeImages : [];
        const actionImgs = Array.isArray(yq.actionImages) ? yq.actionImages : [];
        const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `yq_${yq.id}`,
          title: yq.title,
          content: yq.defectDescription || yq.content,
          line: yq.line || yq.project || "유성",
          defectType: yq.defectType,
          actionResult: yq.actionPlan || yq.actionResult,
          images: allImgs,
          date: yq.date || todayKst,
          author: yq.author || "유성 관리자"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const comp = String(u.company || "").trim();
        const author = String(u.author || "").trim();
        if (u.targetWorkerGroup === "yuseong" || comp.includes("유성") || author.includes("유성")) {
          issues.push({
            id: `urg_ys_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "유성",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author || "유성 관리자"
          });
        }
      });
    } else if (isMachiningWorker) {
      // 6) 윤경수·이창엽 관리자가 올린 부적합경보등록 ➔ 가공동 현장작업자에게만
      sectorName = "가공동";
      managerName = "윤경수·이창엽 책임";
      subText = "윤경수·이창엽 책임 공지 • JA / NX4 / NX4a / HR 가공 라인별 품질이슈 및 공지";

      (machiningQualityIssues || []).forEach((mq) => {
        if (!mq || mq.status === "RESOLVED") return;
        const causeImgs = Array.isArray(mq.causeImages) ? mq.causeImages : [];
        const actionImgs = Array.isArray(mq.actionImages) ? mq.actionImages : [];
        const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

        issues.push({
          id: `mq_${mq.id}`,
          title: mq.title,
          content: mq.defectDescription || mq.content,
          line: mq.line || "가공동",
          defectType: mq.defectType,
          actionResult: mq.actionPlan || mq.actionResult,
          images: allImgs,
          date: mq.date || todayKst,
          author: mq.author || "윤경수 책임"
        });
      });

      (sourceIssues || []).forEach((u) => {
        if (!u || u.isDeleted || u.deleted) return;
        const isYoonOrLee =
          u.targetWorkerGroup === "machining" ||
          u.author === "윤경수" ||
          String(u.author || "").includes("윤경수") ||
          u.author === "이창엽" ||
          String(u.author || "").includes("이창엽");
        if (isYoonOrLee) {
          issues.push({
            id: `urg_mach_${u.id}`,
            title: u.title,
            content: u.content,
            line: u.line || "가공동",
            defectType: u.defectType || u.category,
            actionResult: u.actionResult || u.actionGuide,
            images: u.images || [],
            date: u.date || (u.createdAt ? String(u.createdAt).slice(0, 10) : todayKst),
            author: u.author ? `${u.author} ${u.authorTitle || ""}`.trim() : "윤경수 책임"
          });
        }
      });
    }

    const seen = new Set();
    const dedupedIssues = [];
    issues.forEach((it) => {
      const key = `${it.title}_${it.date}`;
      if (!seen.has(key) && !seen.has(it.id)) {
        seen.add(key);
        seen.add(it.id);
        dedupedIssues.push(it);
      }
    });

    return {
      sectorName,
      managerName,
      subText,
      issues: dedupedIssues.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    };
  }, [isExtrusionWorker, isHanul, isBurimtech, isJoyoungWorker, isMachiningWorker, isYuseongWorker, extrusionQualityIssues, hanulQualityIssues, machiningQualityIssues, yuseongQualityIssues, urgentIssues, localUrgentIssues, todayKst]);

  // 2-2. [패널 3] 첫화면 품질경보 & 당일 사내공지 (사내공지 당일 1일 한정 노출)
  const firstScreenQualityAndNotices = useMemo(() => {
    const sourceIssues = Array.isArray(urgentIssues) && urgentIssues.length > 0 ? urgentIssues : localUrgentIssues;
    const list = [];
    const seenIds = new Set();

    (sourceIssues || []).forEach((item) => {
      if (!item || item.isDeleted === true || item.deleted === true) return;

      const id = String(item.id || item._docId || "");
      if (
        id.startsWith("hanul_qual_") ||
        id.startsWith("urg_hanul_") ||
        id.startsWith("ext_qual_") ||
        id.startsWith("urg_ext_") ||
        id.startsWith("mach_qual_") ||
        id.startsWith("urg_mach_") ||
        id.startsWith("mq_") ||
        id.startsWith("yq_") ||
        id.startsWith("urg_ys_")
      ) {
        return;
      }
      if (item.isFirstScreenOrigin === false) return;

      const cat = String(item.category || "").trim();
      const isQualityAlert = cat === "품질경보" || cat === "부적합경보" || cat === "품질 경보" || cat === "quality_alert" || cat.includes("품질경보") || cat.includes("부적합경보");
      const isNotice = cat === "공지사항" || cat === "사내공지" || cat === "공유사항" || cat === "notice" || cat.includes("공지");

      if (!isQualityAlert && !isNotice) return;

      // 🌟 사내공지 1일 한정 룰:
      // "혹 첫화면에 사내공지가 뜨면 하루에 한해서 보여지도록 구성하고싶음."
      if (isNotice) {
        const noticeDate = item.date || (item.createdAt ? String(item.createdAt).slice(0, 10) : "");
        if (noticeDate !== todayKst) {
          return;
        }
      }

      const uniqueKey = item.id || item._docId || Math.random();
      if (seenIds.has(uniqueKey)) return;
      seenIds.add(uniqueKey);

      list.push({
        id: uniqueKey,
        category: isQualityAlert ? "부적합경보" : "사내공지",
        isQualityAlert,
        isNotice,
        plant: item.plant || "전사",
        title: item.title || item.content || "(공지)",
        content: item.content || item.title || "",
        actionResult: item.actionResult || item.actionGuide || "",
        author: item.author || item.registeredBy || "",
        date: item.date || (item.createdAt ? String(item.createdAt).slice(0, 10) : todayKst),
        images: Array.isArray(item.images) ? item.images : []
      });
    });

    // 🌟 한울 / 이창엽 / 윤경수가 [첫화면 전사등록] 뱃지를 선택하여 올린 부적합경보도 첫화면 품질경보 패널에 연동
    [...(hanulQualityIssues || []), ...(machiningQualityIssues || [])].forEach((ext) => {
      if (!ext || ext.isDeleted || ext.deleted || ext.status === "DELETED") return;
      if (ext.isFirstScreenBroadcast !== true) return;
      if (ext.isClosedByAdmin && !ext.isManuallyRestored) return;

      const uniqueKey = `broadcast_${ext.id}`;
      if (seenIds.has(uniqueKey)) return;
      seenIds.add(uniqueKey);

      const causeImgs = Array.isArray(ext.causeImages) ? ext.causeImages : [];
      const actionImgs = Array.isArray(ext.actionImages) ? ext.actionImages : [];
      const allImgs = [...causeImgs, ...actionImgs].map((img) => (typeof img === "object" ? (img.dataUrl || img.url) : img)).filter(Boolean);

      list.push({
        id: uniqueKey,
        category: "부적합경보",
        isQualityAlert: true,
        isNotice: false,
        plant: ext.plant || "전사",
        title: ext.title || "(부적합경보)",
        content: ext.content || "",
        actionResult: ext.actionResult || "",
        author: ext.author || "",
        date: ext.date || (ext.createdAt ? String(ext.createdAt).slice(0, 10) : todayKst),
        images: allImgs
      });
    });

    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [urgentIssues, localUrgentIssues, hanulQualityIssues, machiningQualityIssues, todayKst]);

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
  const { todayYear, todayMonth, todayDayNum } = useMemo(() => {
    const kst = getKSTDateString();
    const p = kst.split("-");
    return {
      todayYear: p.length === 3 ? parseInt(p[0], 10) : 2026,
      todayMonth: p.length === 3 ? parseInt(p[1], 10) : 10,
      todayDayNum: p.length === 3 ? parseInt(p[2], 10) : new Date().getDate()
    };
  }, []);



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
    if (isPinVerified) {
      handleLogin(e);
      return;
    }
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

  const handleOpenExtrusionReportAction = (e) => {
    try {
      localStorage.setItem("factory_extrusion_active_subtab", "production");
      sessionStorage.setItem("auto_open_extrusion_report", "true");
    } catch (err) {}
    handleLogin(e);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-extrusion-work-report-modal"));
    }, 200);
  };

  const handleOpenGeneralWorkLogAction = (e) => {
    try {
      sessionStorage.setItem("auto_open_worker_worklog", "true");
    } catch (err) {}
    handleLogin(e);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-worker-worklog-modal"));
    }, 200);
  };

  const handleOpenHanulReportAction = (proj = "9BQC", e) => {
    try {
      sessionStorage.setItem("auto_open_hanul_report", proj);
    } catch (err) {}
    handleLogin(e);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-hanul-work-report-modal", { detail: { project: proj } }));
    }, 200);
  };

  const handleOpenMachiningReportAction = (proj = "JA", e) => {
    try {
      sessionStorage.setItem("auto_open_machining_report", proj);
    } catch (err) {}
    handleLogin(e);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-machining-work-report-modal", { detail: { project: proj } }));
    }, 200);
  };

  const handleOpenYuseongReportAction = (proj = "JK1", e) => {
    try {
      sessionStorage.setItem("auto_open_yuseong_report", proj);
    } catch (err) {}
    handleLogin(e);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-yuseong-work-report-modal", { detail: { project: proj } }));
    }, 200);
  };

  // 🌟 전 작업자 및 관리자 통합 안전·4M 확인 후 작업개시 액션
  const handleStartWork = (e) => {
    if (isExtrusionWorker) {
      handleOpenExtrusionReportAction(e);
    } else if (isHanul) {
      handleOpenHanulReportAction("9BQC", e);
    } else if (isMachiningWorker) {
      handleOpenMachiningReportAction("JA", e);
    } else if (isYuseongWorker) {
      handleOpenYuseongReportAction("JK1", e);
    } else if (isBurimtech || isJoyoungWorker || isFieldWorker) {
      handleOpenGeneralWorkLogAction(e);
    } else {
      handleLogin(e);
    }
  };

  return (
    <>
      <div
        ref={overlayRef}
        onClick={() => setSelectedUser(null)}
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex justify-center items-start p-0 sm:p-3 md:p-4 pt-0 sm:pt-4 md:pt-6 animate-fadeIn overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl ${
            isPinVerified
              ? "min-h-[100dvh] sm:min-h-0 h-[100dvh] sm:h-[90vh] sm:max-h-[90vh]"
              : "min-h-[100dvh] sm:min-h-0 h-auto sm:max-h-[92dvh]"
          } rounded-none sm:rounded-3xl border-0 sm:border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden relative flex flex-col m-0 sm:mx-auto text-left`}
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
                ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"
                : isYuseongWorker
                ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-600"
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
                    : isCompanyRepresentative
                    ? "bg-purple-600 ring-2 ring-purple-400/40"
                    : isFieldWorker
                    ? isWorkerManager
                      ? "bg-indigo-600 ring-2 ring-indigo-400/40"
                      : "bg-slate-700 ring-2 ring-slate-400/40"
                    : isSamrangjinManager
                    ? "bg-amber-600 ring-2 ring-amber-400/40"
                    : isHallimManager
                    ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                    : "bg-slate-700 ring-2 ring-slate-400/40"
                }`}
              >
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-black text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight truncate">
                  {selectedUser.name}{" "}
                  {selectedUser.title ||
                    (isHeadquarterAdmin
                      ? "대표이사"
                      : isCompanyRepresentative
                      ? "대표이사"
                      : isWorkerManager
                      ? selectedUser.name === "공영국"
                        ? "대리"
                        : "반장"
                      : "사원")}
                </h3>

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
                      placeholder="••••"
                      value={pinInput}
                      onChange={handlePinChange}
                      className="w-14 sm:w-16 bg-transparent text-xs sm:text-sm font-black text-center tracking-widest text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
          <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain p-3 sm:p-5 md:p-6 space-y-4">
            {!isPinVerified ? (
              /* 🔒 PIN 입력 전 화면 */
              <div className="py-10 sm:py-16 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto animate-fadeIn">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {selectedUser.name} {selectedUser.title || "사원"}님, <br className="hidden sm:inline" />
                    안전수칙과 4M 변동점 확인을 위해 PIN을 입력해 주세요.
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    인증 시 [중대재해공유판 + 4M 현황요약 + 품질·안전 공지] 확인 후 작업개시가 가능합니다.
                  </p>
                </div>

                {/* 모바일 및 터치 환경을 위한 중앙 대형 PIN 입력 폼 */}
                <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-800 shadow-sm focus-within:ring-4 focus-within:ring-blue-400/30">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="PIN 4자리 입력"
                      value={pinInput}
                      onChange={handlePinChange}
                      className="w-36 text-center text-lg font-black tracking-widest bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal"
                    />
                  </div>
                  {pinError && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                      {pinError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    비밀번호 확인
                  </button>
                </form>
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
                  {/* 현장 작업자 통합 뷰 (압출동 / 가공동 / 한울 / 부림텍 4개 포털 100% 동일 형식) */}
                  {/* [패널 2: 소속 관리자 품질이슈/긴급공지] + [패널 3: 첫화면 품질경보 & 당일 공지] */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {!isAdminUser && (
                    <div className="space-y-3.5 flex flex-col justify-between h-full">
                      {/* =============================================================== */}
                      {/* [패널 1] 📋 4M 현황요약 (이창엽 책임 4M 정식 관리대장 최신 5건 시간순) */}
                      {/* =============================================================== */}
                      <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-sm space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between pb-1 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                                <Activity className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                  📋 4M 현황요약
                                </span>
                                <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                  이창엽 책임 4M 정식 관리대장 (시간순 최신 5건)
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700 shrink-0">
                              {official4MLedgerTop5.length}건 등재
                            </span>
                          </div>

                          {official4MLedgerTop5.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                              {official4MLedgerTop5.map((item) => {
                                const isQuality = item.origin === "부적합경보" || item.origin === "품질경보" || item.fourM === "Method" || item.sourceType === "QUALITY_ALERT";
                                return (
                                  <div
                                    key={item.id}
                                    className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs space-y-1 shadow-2xs border transition-all ${
                                      isQuality
                                        ? "border-rose-300 dark:border-rose-800/90 ring-1 ring-rose-300/40 dark:ring-rose-900/40 bg-rose-50/20"
                                        : "border-indigo-100 dark:border-indigo-900/60"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                                          isQuality
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : item.origin === "설비수리" || item.fourM === "Machine"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : item.origin === "비가동"
                                            ? "bg-orange-600 text-white shadow-xs"
                                            : item.origin === "TPM 이상신고"
                                            ? "bg-amber-600 text-white shadow-xs"
                                            : item.origin === "불량손실" || item.fourM === "Material"
                                            ? "bg-rose-500 text-white shadow-xs"
                                            : item.fourM === "Man"
                                            ? "bg-purple-600 text-white shadow-xs"
                                            : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                                        }`}>
                                          {item.origin || item.fourM || "4M"}
                                        </span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                                          {item.company ? `${item.company} • ` : ""}{item.plant ? `${item.plant.replace("공장", "")} • ` : ""}{item.line}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.date}</span>
                                    </div>
                                    <h6 className="font-black text-slate-900 dark:text-white text-xs leading-snug">{item.title}</h6>
                                    {item.content && item.content !== item.title && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed line-clamp-2">
                                        {item.content}
                                      </p>
                                    )}
                                    {item.actionResult ? (
                                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        ↳ 🟢 <b>[조치결과]</b> {item.actionResult}
                                      </div>
                                    ) : (
                                      isQuality && (
                                        <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-1 rounded-md border border-rose-200 dark:border-rose-800">
                                          ↳ 🚨 <b>[조치대기]</b> 현장 조치 및 유효성 확인 대기중
                                        </div>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-4 text-center text-xs text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900">
                              등록된 4M 정식대장 변동점이 없습니다.
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                          <span>품질책임: 이창엽 책임</span>
                          <span>시간순 최신 5건</span>
                        </div>
                      </div>

                      {/* =============================================================== */}
                      {/* [패널 2] 소속 관리자 품질이슈 또는 긴급공지 */}
                      {/* =============================================================== */}
                      <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 shadow-sm space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                  🚨 현장내 품질이슈 및 긴급공지
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-black text-rose-900 dark:text-rose-200 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 shrink-0">
                              {managerQualitySection.issues.length}건 등록됨
                            </span>
                          </div>

                          {managerQualitySection.issues.length > 0 ? (
                            <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                              {managerQualitySection.issues.map((issue) => (
                                <div
                                  key={issue.id}
                                  className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs shadow-2xs hover:border-rose-400 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      {issue.line && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                          {issue.line}
                                        </span>
                                      )}
                                      {issue.defectType && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                          {issue.defectType}
                                        </span>
                                      )}
                                      {issue.author && (
                                        <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                          {issue.author}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">{issue.date}</span>
                                  </div>
                                  <h5 className="font-black text-slate-900 dark:text-white text-xs">{issue.title}</h5>
                                  {issue.content && issue.content !== issue.title && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                                      {issue.content}
                                    </p>
                                  )}
                                  {/* 첨부 이미지 썸네일 */}
                                  {Array.isArray(issue.images) && issue.images.length > 0 && (
                                    <div className="flex gap-1.5 overflow-x-auto py-1">
                                      {issue.images.slice(0, 4).map((img, imgIdx) => {
                                        const imgUrl = typeof img === "object" ? (img.url || img.dataUrl) : img;
                                        if (!imgUrl) return null;
                                        return (
                                          <div
                                            key={imgIdx}
                                            onClick={() => setPreviewImage({
                                              list: issue.images.map((im) => ({ url: typeof im === "object" ? (im.url || im.dataUrl) : im, name: String(issue.title || "") })),
                                              index: imgIdx,
                                              url: imgUrl,
                                              name: String(issue.title || "")
                                            })}
                                            className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                          >
                                            <img src={imgUrl} alt="첨부" className="w-full h-full object-cover" />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {issue.actionResult && (
                                    <div className="text-[10.5px] text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                      ↳ 🟢 <b>[조치사항]</b> {typeof issue.actionResult === "string" ? issue.actionResult : String(issue.actionResult || "")}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-rose-800/80 dark:text-rose-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-rose-300 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-rose-400" />
                              <span>현재 진행 중인 {managerQualitySection.managerName} 품질이슈 및 긴급공지가 없습니다.</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-300">
                          <span>게시 관리: {managerQualitySection.managerName}</span>
                          <span>최신순 정렬</span>
                        </div>
                      </div>

                      {/* =============================================================== */}
                      {/* [패널 3] 첫화면 품질경보 & 당일 사내공지 (사내공지 당일 1일 한정 노출) */}
                      {/* =============================================================== */}
                      <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 shadow-sm space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-xl bg-amber-600 text-white shadow-xs">
                                <Megaphone className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                  📢 첫화면 부적합경보 & 당일 공지
                                </span>
                                <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                                  전사 부적합경보 발령건 • 사내공지는 등록 당일(1일간) 한정 노출
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-black text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 shrink-0">
                              {firstScreenQualityAndNotices.length}건 발령중
                            </span>
                          </div>

                          {firstScreenQualityAndNotices.length > 0 ? (
                            <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                              {firstScreenQualityAndNotices.map((item) => {
                                const isNotice = item.isNotice;
                                return (
                                  <div
                                    key={item.id}
                                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 space-y-1 text-xs shadow-2xs hover:border-amber-400 transition-colors"
                                  >
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                          isNotice ? "bg-blue-600 text-white" : "bg-rose-600 text-white"
                                        }`}>
                                          {item.category}
                                        </span>
                                        {isNotice && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                                            당일공지
                                          </span>
                                        )}
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                          {item.plant} {item.author ? `• ${item.author}` : ""}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                    </div>
                                    <h5 className="font-black text-slate-900 dark:text-white text-xs">{item.title}</h5>
                                    {item.content && item.content !== item.title && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                                        {item.content}
                                      </p>
                                    )}
                                    {/* 첨부 이미지 썸네일 */}
                                    {Array.isArray(item.images) && item.images.length > 0 && (
                                      <div className="flex gap-1.5 overflow-x-auto py-1">
                                        {item.images.slice(0, 4).map((img, imgIdx) => {
                                          const imgUrl = typeof img === "object" ? (img.url || img.dataUrl) : img;
                                          if (!imgUrl) return null;
                                          return (
                                            <div
                                              key={imgIdx}
                                              onClick={() => setPreviewImage({
                                                list: item.images.map((im) => ({ url: typeof im === "object" ? (im.url || im.dataUrl) : im, name: String(item.title || "") })),
                                                index: imgIdx,
                                                url: imgUrl,
                                                name: String(item.title || "")
                                              })}
                                              className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                            >
                                              <img src={imgUrl} alt="첨부" className="w-full h-full object-cover" />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {item.actionResult && (
                                      <div className="text-[10.5px] text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                        ↳ 🟢 <b>[조치사항]</b> {typeof item.actionResult === "string" ? item.actionResult : String(item.actionResult || "")}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-amber-800/80 dark:text-amber-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-amber-300 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-amber-400" />
                              <span>첫화면에 등록된 부적합경보 또는 당일 공지사항이 없습니다.</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          <span>첫화면 부적합경보 실시간 연동</span>
                          <span>공지는 등록 당일만 표시</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────────── */}
                  {/* CASE 3: 관리자 -> 일정 + 변동점 + 근태정보 순으로 표시 (공간 없이 붙여서 표시) */}
                  {/* ───────────────────────────────────────────────────────────────── */}
                  {isAdminUser && (
                    <div
                      className={`rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col divide-y-2 divide-indigo-200/90 dark:divide-indigo-800/80 bg-white dark:bg-slate-900 transition-all duration-300 ${
                        hasAnyNewScheduleMessage
                          ? "border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-400/30 shadow-indigo-500/20"
                          : "border-indigo-300/90 dark:border-indigo-800/80"
                      }`}
                    >
                      {/* 1. 사내 공통일정 / 관리자 일정 (새 메시지 등록 시 점멸 효과) */}
                      <div
                        className={`p-3.5 sm:p-4 space-y-2.5 transition-all duration-300 ${
                          hasAnyNewScheduleMessage
                            ? "bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-indigo-50/95 dark:from-indigo-950/85 dark:via-purple-950/70 dark:to-indigo-950/85 animate-pulse"
                            : "bg-slate-50/90 dark:bg-slate-800/60"
                        }`}
                      >
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
                                    : isCompanyRepresentative
                                    ? `📌 ${selectedUser.company || selectedUser.name} 대표 일정 및 공지`
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
                                  : isCompanyRepresentative
                                  ? `${selectedUser.company || selectedUser.name} 및 전사 진행 중인 공통 일정`
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
                          <div className="space-y-1.5 max-h-36 sm:max-h-40 overflow-y-auto pr-0.5 custom-scrollbar">
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
                                    <span className="font-bold text-slate-900 dark:text-white text-xs break-words">
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

                      {/* 2. 4M 현황요약 (이창엽 책임 4M 정식대장 최신 5건 시간순 표시) */}
                      <div className="p-3.5 sm:p-4 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-2 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between pb-1 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                                📋 4M 현황요약
                              </span>
                              <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                                이창엽 책임 4M 정식 관리대장 (시간순 최신 5건)
                              </span>
                            </div>
                          </div>

                          {/* 오른쪽 뱃지 5개 전부 삭제하여 심플하게 구성 */}
                        </div>

                        {official4MLedgerTop5.length > 0 ? (
                          <div className="space-y-1.5 overflow-y-auto pr-0.5 custom-scrollbar flex-1 min-h-0">
                            {official4MLedgerTop5.map((item) => {
                              const isQuality = item.origin === "부적합경보" || item.origin === "품질경보" || item.fourM === "Method" || item.sourceType === "QUALITY_ALERT";
                              return (
                                <div
                                  key={item.id}
                                  className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs space-y-1 shadow-2xs border transition-all ${
                                    isQuality
                                      ? "border-rose-300 dark:border-rose-800/90 ring-1 ring-rose-300/40 dark:ring-rose-900/40 bg-rose-50/20"
                                      : "border-indigo-100 dark:border-indigo-900/60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                                        isQuality
                                          ? "bg-rose-600 text-white shadow-xs"
                                          : item.origin === "설비수리" || item.fourM === "Machine"
                                          ? "bg-indigo-600 text-white shadow-xs"
                                          : item.origin === "비가동"
                                          ? "bg-orange-600 text-white shadow-xs"
                                          : item.origin === "TPM 이상신고"
                                          ? "bg-amber-600 text-white shadow-xs"
                                          : item.origin === "불량손실" || item.fourM === "Material"
                                          ? "bg-rose-500 text-white shadow-xs"
                                          : item.fourM === "Man"
                                          ? "bg-purple-600 text-white shadow-xs"
                                          : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                                      }`}>
                                        {item.origin || item.fourM || "4M"}
                                      </span>
                                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                                        {item.company ? `${item.company} • ` : ""}{item.plant ? `${item.plant.replace("공장", "")} • ` : ""}{item.line}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.date}</span>
                                  </div>
                                  <h6 className="font-black text-slate-900 dark:text-white text-xs leading-snug">{item.title}</h6>
                                  {item.content && item.content !== item.title && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed line-clamp-2">
                                      {item.content}
                                    </p>
                                  )}
                                  {item.actionResult ? (
                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                      ↳ 🟢 <b>[조치결과]</b> {item.actionResult}
                                    </div>
                                  ) : (
                                    isQuality && (
                                      <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-1 rounded-md border border-rose-200 dark:border-rose-800">
                                        ↳ 🚨 <b>[조치대기]</b> 현장 조치 및 유효성 확인 대기중
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900">
                            등록된 4M 정식대장 변동점이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🌟 확인완료 작업개시 버튼: 중대재해 및 4M을 모두 확인한 후 스크롤 맨 마지막에서 탭 */}
                <div className="pt-3 pb-8 sm:pb-4 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartWork}
                    disabled={isLoggingIn}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.99] text-white font-black text-base sm:text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200 shrink-0" />
                    <span>{isLoggingIn ? "작업 개시 처리 중..." : "확인완료 작업개시"}</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </button>
                  <p className="text-center text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 font-bold">
                    중대재해 안전수칙과 4M 변동점을 모두 확인하였으며, 안전 작업을 시작합니다.
                  </p>
                </div>
              </div>
            )}
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

      {/* 📋 한울 외주가공 작업일보 모달 (9BQC G/RUN / LQ2a Hood Side) */}
      {isHanulWorkReportOpen && (
        <Suspense fallback={null}>
          <HanulWorkReportModal
            isOpen={isHanulWorkReportOpen}
            onClose={() => setIsHanulWorkReportOpen(false)}
            initialProject={hanulReportProject}
            initialWorker={
              selectedUser?.name && !isExcludedFromWorkReport(selectedUser.name)
                ? selectedUser.name
                : "박종미"
            }
          />
        </Suspense>
      )}

      {/* 📋 삼랑진공장 가공동 작업일보 모달 (JA / NX4 / NX4a / HR G/RUN) */}
      {isMachiningWorkReportOpen && (
        <Suspense fallback={null}>
          <MachiningWorkReportModal
            isOpen={isMachiningWorkReportOpen}
            onClose={() => setIsMachiningWorkReportOpen(false)}
            initialProject={machiningReportProject}
            initialWorker={
              selectedUser?.name && !isExcludedFromMachiningWorkReport(selectedUser.name)
                ? selectedUser.name
                : "크리스토퍼"
            }
          />
        </Suspense>
      )}

      {/* 📋 외주가공 (주)유성 작업일보 모달 (JK1 Part'g / CE1 Part'g / DT Hood) */}
      {isYuseongWorkReportOpen && (
        <Suspense fallback={null}>
          <YuseongWorkReportModal
            isOpen={isYuseongWorkReportOpen}
            onClose={() => setIsYuseongWorkReportOpen(false)}
            initialProject={yuseongReportProject}
            initialWorker={selectedUser?.name || "이성기"}
          />
        </Suspense>
      )}
    </>
  );
};
