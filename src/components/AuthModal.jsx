import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useAuth, ADMIN_USERS, PLANTS, EXTRUSION_WORKERS, ALL_DESIGNATED_USERS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  COMPANIES,
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData
} from "../services/overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData.js";
import { getKSTDateString, getKSTTimeInfo } from "../utils/dateUtils";
import {
  getLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  deleteUrgentIssue,
  hardDeleteUrgentIssue,
  restoreUrgentIssue,
  cancelRestoreUrgentIssue,
  updateUrgentIssueActionResult,
  addIssueReply,
  deleteIssueReply,
  sortIssuesByCustomPriority,
  sortIssuesByLatest,
  isMeetingExpired
} from "../services/urgentIssueService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../services/extrusionQualityIssueService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  saveHanulQualityIssue,
  deleteHanulQualityIssue
} from "../services/hanulQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues,
  saveYuseongQualityIssue,
  deleteYuseongQualityIssue
} from "../services/yuseongQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  saveMachiningQualityIssue,
  deleteMachiningQualityIssue
} from "../services/machiningQualityIssueService";
import { OryukLogo } from "./OryukLogo";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyClosingBriefingTelegram
} from "../services/telegramService";
import { compressImage } from "../utils/imageCompressor";
import { pushModalHistory, subscribeCloseAllModals, useModalHistory } from "../utils/modalHistory";
import { initVersionWatcher, forceHardReload } from "../utils/versionCheck";

// Eager Essential Components for Login Screen
import { WorkerLoginSection } from "./auth/WorkerLoginSection";
import { RealtimeIssueBoard } from "./issues/RealtimeIssueBoard";
import { ImagePreviewModal } from "./common/ImagePreviewModal";
import { SevereDisasterModal } from "./common/SevereDisasterModal";
import { ExtrusionWorkReportModal } from "./extrusion/ExtrusionWorkReportModal";
import { saveExtrusionReport } from "../services/extrusionProductionService";
import {
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Cpu,
  Layers,
  Factory,
  Building2,
  Users,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Plus,
  Save,
  X
} from "lucide-react";

// Lazy-loaded On-Demand Sub-Modals
const TelegramConfigModal = lazy(() => import("./auth/TelegramConfigModal").then(m => ({ default: m.TelegramConfigModal || m.default })));
const IssueLedgerModal = lazy(() => import("./issues/IssueLedgerModal").then(m => ({ default: m.IssueLedgerModal || m.default })));
const IssueEditModal = lazy(() => import("./issues/IssueEditModal").then(m => ({ default: m.IssueEditModal || m.default })));
const IssueActionModal = lazy(() => import("./issues/IssueActionModal").then(m => ({ default: m.IssueActionModal || m.default })));
const DeleteAuthModal = lazy(() => import("./issues/DeleteAuthModal").then(m => ({ default: m.DeleteAuthModal || m.default })));
const HanulWorkReportModal = lazy(() => import("./HanulWorkReportModal").then(m => ({ default: m.HanulWorkReportModal || m.default })));
const SqLevelUpView = lazy(() => import("./sq/SqLevelUpView").then(m => ({ default: m.SqLevelUpView || m.default })));
import { SqStatusBannerCard } from "./sq/SqStatusBannerCard";

export const AuthModal = () => {
  const { currentProfile, loginWithProfile } = useAuth();
  const [factoryBuildingTab, setFactoryBuildingTab] = useState(() => {
    try {
      return localStorage.getItem("oryuk_firstpage_building_tab") || "extrusion";
    } catch (e) {
      return "extrusion";
    }
  });
  const [isSevereDisasterModalOpen, setIsSevereDisasterModalOpen] = useState(false);
  const [isExtrusionReportModalOpen, setIsExtrusionReportModalOpen] = useState(false);
  const [isExtrusionModalOpen, setIsExtrusionModalOpen] = useState(false);
  const [isMachiningModalOpen, setIsMachiningModalOpen] = useState(false);
  const [isHanulModalOpen, setIsHanulModalOpen] = useState(false);
  const [isBulimtechModalOpen, setIsBulimtechModalOpen] = useState(false);
  const [isYuseongModalOpen, setIsYuseongModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isSqLevelUpModalOpen, setIsSqLevelUpModalOpen] = useState(false);
  const [hanulWorkReportProject, setHanulWorkReportProject] = useState("9BQC");
  const [hanulWorkReportWorker, setHanulWorkReportWorker] = useState("박종미");
  const [firstPageToast, setFirstPageToast] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Auto version detection and cache synchronization on login screen
  useEffect(() => {
    const unsub = initVersionWatcher(() => {
      setUpdateAvailable(true);
      setTimeout(() => {
        forceHardReload();
      }, 2500);
    });
    return () => unsub();
  }, []);

  // Save factoryBuildingTab to localStorage
  useEffect(() => {
    try {
      if (factoryBuildingTab) {
        localStorage.setItem("oryuk_firstpage_building_tab", factoryBuildingTab);
      }
    } catch (e) {}
  }, [factoryBuildingTab]);

  const handleSaveExtrusionReport = async (reportData) => {
    try {
      await saveExtrusionReport(reportData);
      setIsExtrusionReportModalOpen(false);
      setFirstPageToast("✅ 압출 작업일보가 실시간 저장되었습니다.");
      setTimeout(() => setFirstPageToast(""), 3500);
    } catch (e) {
      console.error(e);
      setFirstPageToast("❌ 작업일보 저장 중 오류가 발생했습니다.");
      setTimeout(() => setFirstPageToast(""), 3500);
    }
  };

  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());

  // Urgent Issues State
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  // 🌟 전 공정 부적합경보 실시간 수신 State (압출, 한울, 유성, 가공동)
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [openedEditFromListModal, setOpenedEditFromListModal] = useState(false);
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [restoreToast, setRestoreToast] = useState("");
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);
  const [openIssueCategoryFilter, setOpenIssueCategoryFilter] = useState("all");
  const [ledgerCategoryTab, setLedgerCategoryTab] = useState("all");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [issueModalPage, setIssueModalPage] = useState(1);
  const [isIssueDetailMode, setIsIssueDetailMode] = useState(true);

  // Form State
  const [newIssueForm, setNewIssueForm] = useState({
    category: "오픈이슈",
    plant: "삼랑진공장",
    author: "",
    authorTitle: "",
    startDate: "",
    expireDate: "",
    meetingTime: "14:00",
    progress: 0,
    title: "",
    content: "",
    images: [],
    actionResult: "",
    actionAuthor: "",
    actionImages: [],
    isResolved: false
  });

  // Action Result Modal State
  const [actionModalData, setActionModalData] = useState({
    isOpen: false,
    issue: null,
    actionResult: "",
    actionAuthor: "",
    actionImages: []
  });

  // Reply Forms
  const [replyForm, setReplyForm] = useState({
    author: "",
    attendanceStatus: "참석",
    content: ""
  });
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [actionOpinionForm, setActionOpinionForm] = useState({
    actionDate: "",
    author: "",
    content: "",
    files: []
  });

  // Lightbox & Image Processing State
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [isProcessingIssueImages, setIsProcessingIssueImages] = useState(false);
  const [isProcessingActionImages, setIsProcessingActionImages] = useState(false);

  // Telegram Config & Modal State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramAdminPinModal, setTelegramAdminPinModal] = useState({
    isOpen: false,
    pinInput: "",
    errorMsg: ""
  });
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [sendingClosingBriefing, setSendingClosingBriefing] = useState(false);
  const [closingBriefingToast, setClosingBriefingToast] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [telegramSavedToast, setTelegramSavedToast] = useState(false);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  // Subscriptions
  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeSmartOvertimeData((data) => {
      setSmartOvertimeData(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubExt = subscribeExtrusionQualityIssues((alerts) => {
      setExtrusionQualityAlerts(alerts || []);
    });
    const unsubHanul = subscribeHanulQualityIssues((alerts) => {
      setHanulQualityIssues(alerts || []);
    });
    const unsubYs = subscribeYuseongQualityIssues((alerts) => {
      setYuseongQualityIssues(alerts || []);
    });
    const unsubMach = subscribeMachiningQualityIssues((alerts) => {
      setMachiningQualityIssues(alerts || []);
    });
    return () => {
      unsubExt();
      unsubHanul();
      unsubYs();
      unsubMach();
    };
  }, []);



  // Time ticker
  const [currentTimeTick, setCurrentTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayDateStr = useMemo(() => getKSTDateString(), [currentTimeTick]);
  const currentKstTimeStr = useMemo(() => {
    const info = getKSTTimeInfo();
    return `${String(info.hour).padStart(2, "0")}:${String(info.minute).padStart(2, "0")}`;
  }, [currentTimeTick]);

  // All workers list
  const allWorkers = useMemo(() => {
    const list = [];
    if (PLANTS[0]?.workers) {
      PLANTS[0].workers.forEach((w) => list.push({ ...w, plantName: "삼랑진공장" }));
    }
    if (PLANTS[1]?.workers) {
      PLANTS[1].workers.forEach((w) => list.push({ ...w, plantName: "한림공장" }));
    }
    ADMIN_USERS.forEach((adm) => {
      list.push({ ...adm, plantName: "본사", title: adm.title || "대표이사" });
    });
    return list;
  }, []);

  // Hanul partner user definition (한림공장 외주가공 대표 계정)
  const hanulUser = useMemo(() => {
    return (
      PLANTS[1]?.workers?.find((w) => w.name === "한울" || w.id === "hal_hu") || {
        id: "hal_hu",
        name: "한울",
        title: "대표이사",
        plant: "한림공장",
        company: "한울",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "한",
        pin: "11",
        isPartner: true
      }
    );
  }, []);

  // Hanul master workers list (관리자 황수현 제외 - 대표이사/관리자 별도 관리)
  const hanulWorkers = useMemo(() => {
    return (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []).filter(
      (w) => w.company?.includes("한울") && w.name !== "황수현" && w.name !== "김동훈"
    );
  }, []);

  // Bulimtech partner user definition (한림공장 외주가공 대표 계정)
  const bulimtechUser = useMemo(() => {
    return (
      PLANTS[1]?.workers?.find((w) => w.name === "부림텍" || w.id === "hal_br") || {
        id: "hal_br",
        name: "부림텍",
        title: "대표이사",
        plant: "한림공장",
        company: "부림텍",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "부",
        pin: "11",
        isPartner: true
      }
    );
  }, []);

  // Bulimtech master workers list (관리자 김동훈 제외 - 대표이사/관리자 별도 관리)
  const bulimtechWorkers = useMemo(() => {
    return (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []).filter(
      (w) => w.company?.includes("부림텍") && w.name !== "김동훈" && w.name !== "황수현"
    );
  }, []);

  // Machining master workers list (오륙 가공동 31명 - 퇴사자 제외)
  const machiningWorkers = useMemo(() => {
    return (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []).filter(
      (w) => w.company === "오륙" && w.dept === "가공동" && w.status !== "퇴사"
    );
  }, []);

  // Yuseong partner user definition (삼랑진공장 외주가공 대표 계정)
  const yuseongUser = useMemo(() => {
    return (
      PLANTS[0]?.workers?.find((w) => w.name === "유성" || w.id === "sam_ys") || {
        id: "sam_ys",
        name: "유성",
        title: "대표이사",
        plant: "삼랑진공장",
        company: "유성",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "유",
        pin: "11",
        isPartner: true
      }
    );
  }, []);

  // Yuseong master workers list (외주가공 유성 14명)
  const yuseongWorkers = useMemo(() => {
    return (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []).filter(
      (w) => w.company?.includes("유성") && w.status !== "퇴사" && w.name !== "유성"
    );
  }, []);


  // Category drafts for clean draft switching
  const createEmptyCategoryDraft = (catName, currentPlant = "삼랑진공장", author = "", authorTitle = "") => ({
    category: catName,
    plant: currentPlant,
    author: author,
    authorTitle: authorTitle,
    startDate: todayDateStr,
    expireDate: catName === "공지사항" || catName === "사내공지"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : todayDateStr,
    meetingTime: "14:00",
    meetingLocation: currentPlant === "한림공장" ? "한림공장 회의실" : currentPlant === "인주공장" ? "인주공장 회의실" : "삼랑진공장 2층 대회의실",
    meetingAgenda: "",
    attendees: [],
    progress: 0,
    title: "",
    content: "",
    images: [],
    actionResult: "",
    actionAuthor: "",
    actionImages: [],
    isResolved: false,
    replies: []
  });

  const [categoryDrafts, setCategoryDrafts] = useState({
    "품질경보": createEmptyCategoryDraft("품질경보", "삼랑진공장", "", ""),
    "회의일정": createEmptyCategoryDraft("회의일정", "삼랑진공장", "", ""),
    "공지사항": createEmptyCategoryDraft("공지사항", "삼랑진공장", "", ""),
    "오픈이슈": createEmptyCategoryDraft("오픈이슈", "삼랑진공장", "", "")
  });

  const handleSwitchCategory = (targetCategory) => {
    const currentCat = newIssueForm.category === "사내공지" ? "공지사항" : newIssueForm.category;
    const normalizedTarget = targetCategory === "사내공지" ? "공지사항" : targetCategory;
    if (currentCat === normalizedTarget) return;

    setCategoryDrafts((prev) => ({
      ...prev,
      [currentCat]: { ...newIssueForm }
    }));

    if (categoryDrafts[normalizedTarget]) {
      setNewIssueForm({ ...categoryDrafts[normalizedTarget] });
    } else {
      const freshDraft = createEmptyCategoryDraft(
        normalizedTarget,
        newIssueForm.plant || "삼랑진공장",
        newIssueForm.author || "",
        newIssueForm.authorTitle || ""
      );
      setNewIssueForm(freshDraft);
    }
  };

  // Category matching helper
  const isCatQualityAlert = (cat) => cat === "품질경보" || cat === "품질 경보" || cat === "부적합경보" || cat === "부적합 경보" || cat === "quality_alert" || (typeof cat === "string" && (cat.includes("품질경보") || cat.includes("부적합경보")));
  const isCatMeeting = (cat) => cat === "회의일정" || cat === "회의 일정" || cat === "meeting" || (typeof cat === "string" && cat.includes("회의"));
  const isCatNotice = (cat) => cat === "공지사항" || cat === "사내공지" || cat === "공유사항" || cat === "notice" || (typeof cat === "string" && cat.includes("공지"));
  const isCatOpenIssue = (cat) => cat === "오픈이슈" || cat === "오픈 이슈" || cat === "품질이슈" || cat === "open_issue" || (!isCatQualityAlert(cat) && !isCatMeeting(cat) && !isCatNotice(cat));

  // 🌟 첫 화면 등록 여부 판별 헬퍼 (첫 화면에서 직접 등록된 이슈만 첫 화면에 노출 및 합산 허용)
  // 관리자들이 개별 로그인해서 올린 품질이슈 또는 경보는 관리자가 관리하는 인원에 한하여 공지되며 첫 화면 노출/합산 완전 제외
  // 🌟 한울 대표 등이 첫 화면에서 올린 공식 품질경보는 첫 화면에 보존됨
  const isFirstScreenIssue = (item) => {
    if (!item) return false;

    // 1. 첫 화면 공식 등록 건은 작성자(한울 대표, 공장 관리자, 임원 등)에 관계없이 첫 화면 노출 보장
    if (item.isFirstScreenOrigin === true || item.origin === "FIRST_SCREEN") {
      return true;
    }

    // 2. 개별 공정/외주사 관리자가 내부에서 등록한 이슈 제외 (ID 접두사: hanul_qual_, urg_hanul_qual_, ext_qual_ 등)
    const id = String(item.id || item._docId || item.customId || "");
    if (
      id.startsWith("hanul_") ||
      id.startsWith("urg_hanul_") ||
      id.startsWith("ext_") ||
      id.startsWith("urg_ext_") ||
      id.startsWith("bulim_") ||
      id.startsWith("urg_bulim_") ||
      id.startsWith("yuseong_") ||
      id.startsWith("urg_yuseong_") ||
      id.startsWith("partner_")
    ) {
      return false;
    }

    // 3. 출처(source) 플래그가 개별 관리자 내부 대시보드인 경우 제외
    const source = String(item.source || "").toLowerCase();
    if (source === "hanul" || source === "extrusion" || source === "partner" || source === "bulim" || source === "yuseong") {
      return false;
    }

    // 4. 명시적 첫 화면 제외 플래그
    if (item.isFirstScreenOrigin === false) return false;

    // 5. 개별 관리자 내부 등록 전용 태그
    const title = String(item.title || "");
    if (title.startsWith("[한울품질경보]") || title.startsWith("[압출품질이슈]")) {
      return false;
    }

    // 6. 첫 화면 기본 ID 패턴(issue_...)인 경우 첫 화면 등록 건으로 유지 (한울 대표가 첫 화면에서 등록한 건 포함)
    if (id.startsWith("issue_")) {
      return true;
    }

    return true;
  };

  // Safe date normalizer (YYYY-MM-DD)
  const normalizeDateStr = (raw, fallback = "") => {
    if (!raw) return fallback;
    if (typeof raw === "object" && raw.seconds) {
      return new Date(raw.seconds * 1000).toISOString().slice(0, 10);
    }
    const str = String(raw).trim();
    const match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
    }
    return str.slice(0, 10) || fallback;
  };

  // 🌟 전 공정(압출, 한울, 유성, 가공동) 부적합경보 실시간 데이터 규격 통일
  const externalQualityAlerts = useMemo(() => {
    const list = [];

    // 1. 압출 부적합경보
    (extrusionQualityAlerts || []).forEach((alert) => {
      if (!alert || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;
      if (alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `ext_q_${alert.id}`,
        rawId: alert.id,
        source: "extrusion",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        author: alert.author || "설유철",
        authorTitle: alert.authorTitle || "책임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "압출 부적합경보",
        content: alert.content || alert.details || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || alert.actionGuide || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isDeleted: false,
        isFirstScreenOrigin: true,
        origin: "EXTRUSION_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 2. 한울 외주가공 부적합경보
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.targetDate || alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `hanul_q_${alert.id}`,
        rawId: alert.id,
        source: "hanul",
        category: "부적합경보",
        plant: alert.plant || "한림공장",
        line: alert.line || "외주가공(한울)",
        author: alert.author || "한울 관리자",
        authorTitle: alert.authorTitle || "선임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "한울 외주 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isDeleted: false,
        isFirstScreenOrigin: true,
        origin: "HANUL_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 3. 유성 외주가공 부적합경보
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `ys_q_${alert.id}`,
        rawId: alert.id,
        source: "yuseong",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "외주가공(유성)",
        author: alert.author || "유성 관리자",
        authorTitle: alert.authorTitle || "선임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "유성 외주 부적합경보",
        content: alert.content || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isDeleted: false,
        isFirstScreenOrigin: true,
        origin: "YUSEONG_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 4. 가공동 부적합경보
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `mach_q_${alert.id}`,
        rawId: alert.id,
        source: "machining",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || "가공라인",
        author: alert.author || "가공 관리자",
        authorTitle: alert.authorTitle || "선임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "가공 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isDeleted: false,
        isFirstScreenOrigin: true,
        origin: "MACHINING_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    return list;
  }, [extrusionQualityAlerts, hanulQualityIssues, yuseongQualityIssues, machiningQualityIssues, todayDateStr]);

  // 🌟 전 공정 부적합경보 전체 (관리목록 대장용 - 최신순 정렬)
  const allQualityAlerts = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. 4개 공정/협력사 부적합경보 (압출, 한울, 유성, 가공동)
    (externalQualityAlerts || []).forEach((item) => {
      const key = `${(item.title || "").trim().toLowerCase()}_${item.startDate || item.date || ""}`;
      seenKeys.add(key);
      if (item.rawId) seenKeys.add(item.rawId);
      if (item.id) seenKeys.add(item.id);
      list.push(item);
    });

    // 2. Urgent issues 부적합경보
    (urgentIssues || []).forEach((item) => {
      if (!item || item.isDeleted === true || item.isDeleted === "true" || item.deleted === true || item.status === "DELETED") return;
      if (!isCatQualityAlert(item.category)) return;

      const key = `${(item.title || "").trim().toLowerCase()}_${(item.startDate || item.expireDate || item.date || "").slice(0, 10)}`;
      const cleanId = String(item.id || item._docId || "");
      if (seenKeys.has(key) || seenKeys.has(cleanId)) return;

      list.push({
        ...item,
        category: "부적합경보",
        isFirstScreenOrigin: true
      });
    });

    return sortIssuesByLatest(list);
  }, [externalQualityAlerts, urgentIssues]);

  // Active issues calculation (첫 화면 표시용 활성 이슈 - 전 공정 미결 부적합경보 + 활성 회의/공지/오픈이슈)
  const activeIssues = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. 5개 공정 통합 부적합경보 중 활성(미결) 건
    (allQualityAlerts || []).forEach((alert) => {
      if (!alert) return;
      if (alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;
      
      // 조치 완료된 부적합경보는 첫 화면 활성 목록에 절대 재공지되지 않음
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      if (isResolved) return;

      const key = `${(alert.title || "").trim().toLowerCase()}_${alert.startDate || alert.date || ""}`;
      seenKeys.add(key);
      if (alert.rawId) seenKeys.add(alert.rawId);
      if (alert.id) seenKeys.add(alert.id);
      list.push(alert);
    });

    // 2. 회의, 공지, 오픈이슈 (첫 화면 등록 건)
    (urgentIssues || []).forEach((item) => {
      if (!item) return;
      if (item.isDeleted === true || item.isDeleted === "true" || item.deleted === true || item.status === "DELETED") return;
      if (isCatQualityAlert(item.category)) return; // 부적합경보는 위에서 통합 수합 완료

      if (!isFirstScreenIssue(item)) return;

      // 조치 완료된 오픈이슈/회의/공지 등은 첫 화면 활성 목록에서 제외
      const isResolved = Boolean(item.isResolved) || item.status === "RESOLVED" || item.status === "CLOSED" || item.status === "DONE" || Boolean(item.actionResult && item.actionResult.trim());
      if (isResolved) return;

      // 1) 회의일정: 회의 시작 시간 경과 시 첫 화면에서 자동 만료/제외 -> 종결삭제관리로 이동
      if (isCatMeeting(item.category)) {
        if (isMeetingExpired(item, 0)) return;
      }

      // 2) 사내공지 / 공지사항: 만료일자(expireDate)가 지난 경우 첫 화면에서 자동 제외 (단, 수동 복구된 경우 제외)
      if (isCatNotice(item.category)) {
        if (item.expireDate && item.expireDate < todayDateStr && !item.isManuallyRestored) return;
      }

      // 3) 오픈이슈
      list.push(item);
    });

    return sortIssuesByCustomPriority(list);
  }, [allQualityAlerts, urgentIssues, todayDateStr, currentKstTimeStr]);

  // Metric counts
  const qualityAlertCount = useMemo(() => activeIssues.filter((i) => isCatQualityAlert(i.category)).length, [activeIssues]);
  const meetingIssuesCount = useMemo(() => activeIssues.filter((i) => isCatMeeting(i.category)).length, [activeIssues]);
  const qualityIssueCount = useMemo(() => activeIssues.filter((i) => isCatOpenIssue(i.category)).length, [activeIssues]);
  const noticeIssuesCount = useMemo(() => activeIssues.filter((i) => isCatNotice(i.category)).length, [activeIssues]);

  // Displayed issues on first screen
  const displayedActiveIssues = useMemo(() => {
    if (openIssueCategoryFilter === "quality_alert") {
      return activeIssues.filter((i) => isCatQualityAlert(i.category));
    }
    if (openIssueCategoryFilter === "meeting") {
      return activeIssues.filter((i) => isCatMeeting(i.category));
    }
    if (openIssueCategoryFilter === "open_issue" || openIssueCategoryFilter === "quality_issue" || openIssueCategoryFilter === "quality") {
      return activeIssues.filter((i) => isCatOpenIssue(i.category));
    }
    if (openIssueCategoryFilter === "notice") {
      return activeIssues.filter((i) => isCatNotice(i.category));
    }
    return activeIssues;
  }, [activeIssues, openIssueCategoryFilter]);
  const allMeetings = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => !i.isDeleted && isFirstScreenIssue(i) && isCatMeeting(i.category) && !isMeetingExpired(i, 0))), [urgentIssues, todayDateStr, currentKstTimeStr]);
  const allQualityIssues = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => !i.isDeleted && isFirstScreenIssue(i) && isCatOpenIssue(i.category))), [urgentIssues]);
  const allNotices = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => !i.isDeleted && isFirstScreenIssue(i) && isCatNotice(i.category) && (!i.expireDate || i.expireDate >= todayDateStr || i.isManuallyRestored))), [urgentIssues, todayDateStr]);
  const allClosedDeletedIssues = useMemo(() => {
    const list = urgentIssues.filter((i) => {
      if (!i || !isFirstScreenIssue(i)) return false;
      if (i.isDeleted) return true;
      if (isCatMeeting(i.category)) {
        return isMeetingExpired(i, 0);
      }
      if (isCatNotice(i.category)) {
        return Boolean(i.expireDate && i.expireDate < todayDateStr && !i.isManuallyRestored);
      }
      return false;
    });
    return sortIssuesByLatest(list);
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  // Filtered issues for ledger modal (최신순 정렬 보장 - 첫 화면 등록 건만 한정!)
  const filteredIssues = useMemo(() => {
    let list = urgentIssues.filter(isFirstScreenIssue);
    if (ledgerCategoryTab === "quality_alert") {
      list = allQualityAlerts;
    } else if (ledgerCategoryTab === "meeting") {
      list = allMeetings;
    } else if (ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue") {
      list = allQualityIssues;
    } else if (ledgerCategoryTab === "notice") {
      list = allNotices;
    } else if (ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted") {
      list = allClosedDeletedIssues;
    }

    if (selectedScheduleDate && (ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue" || ledgerCategoryTab === "meeting")) {
      list = list.filter((i) => {
        const iStart = i.startDate || i.expireDate || i.targetDate;
        const iTarget = i.expireDate || i.targetDate || i.startDate;
        if (iStart && iTarget) {
          return selectedScheduleDate >= iStart && selectedScheduleDate <= iTarget;
        }
        return (i.expireDate || i.targetDate) === selectedScheduleDate;
      });
    }
    return sortIssuesByLatest(list);
  }, [urgentIssues, ledgerCategoryTab, selectedScheduleDate, allQualityAlerts, allMeetings, allQualityIssues, allNotices, allClosedDeletedIssues]);

  // 7-day schedule strip for open issues
  const openIssueScheduleDays = useMemo(() => {
    const days = [];
    const base = new Date();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === todayDateStr;

      const matchedIssues = allQualityIssues.filter((item) => {
        const itemStart = item.startDate || item.expireDate || item.targetDate;
        const itemTarget = item.expireDate || item.targetDate || item.startDate;
        if (itemStart && itemTarget) {
          return dateStr >= itemStart && dateStr <= itemTarget;
        }
        return (item.expireDate || item.targetDate) === dateStr;
      });

      const unresolvedCount = matchedIssues.filter((it) => !it.isResolved && !it.isDeleted).length;
      const resolvedCount = matchedIssues.filter((it) => it.isResolved && !it.isDeleted).length;

      days.push({
        dateStr,
        dayName,
        isToday,
        totalCount: matchedIssues.length,
        unresolvedCount,
        resolvedCount
      });
    }
    return days;
  }, [todayDateStr, allQualityIssues]);

  // Leave counts
  const samrangjinLeaveCount = useMemo(() => {
    if (!PLANTS[0]?.workers || !annualLeaves) return 0;
    return PLANTS[0].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const hanlimLeaveCount = useMemo(() => {
    if (!PLANTS[1]?.workers || !annualLeaves) return 0;
    return PLANTS[1].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const managerLeaves = useMemo(() => {
    const managers = [
      ...PLANTS[0].workers.filter((w) => w.name === "이명재" || w.assignedProcess === "총괄관리"),
      ...PLANTS[1].workers.filter((w) => w.name === "김동욱" || w.assignedProcess === "총괄관리")
    ];
    return managers
      .map((m) => ({ ...m, leaveStatus: getUserLeaveStatus(m.id, m.name, annualLeaves, { excludeTodo: true }) }))
      .filter((m) => Boolean(m.leaveStatus));
  }, [annualLeaves]);

  const companyAttendanceStats = useMemo(() => {
    return COMPANIES.map((comp) => {
      const records = (smartOvertimeData || {})[comp] || [];
      const todayRecords = records.filter((r) => r.workDate === todayDateStr);
      const absentList = [];
      const earlyLeaveList = [];

      todayRecords.forEach((r) => {
        const item = { name: r.workerName || "작업자", reason: r.absentReason || r.earlyLeaveReason || r.notes || "개인사유" };
        if (r.status === "결근" || r.isAbsent) absentList.push(item);
        if (r.status === "조퇴" || r.isEarlyLeave) earlyLeaveList.push(item);
      });

      return {
        company: comp,
        absentCount: absentList.length,
        absentList,
        earlyLeaveCount: earlyLeaveList.length,
        earlyLeaveList
      };
    });
  }, [smartOvertimeData, todayDateStr]);

  // User select & Login handler
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");

    const trimmedPin = pin.trim();
    let isValid = false;

    if (selectedUser.role === "ADMIN") {
      isValid = trimmedPin === "0090" || trimmedPin === selectedUser.pin;
    } else {
      // General worker / factory login PIN
      isValid = trimmedPin === "11" || trimmedPin === (selectedUser.pin || "11") || trimmedPin === "1234";
    }

    if (isValid) {
      try {
        loginWithProfile(selectedUser, trimmedPin, rememberMe);
      } catch (err) {
        console.error("Login error:", err);
        setErrorMsg(err.message || "로그인 처리 중 오류가 발생했습니다.");
      }
    } else {
      setErrorMsg(selectedUser.role === "ADMIN" ? "관리자 PIN 번호가 일치하지 않습니다." : "PIN 번호가 일치하지 않습니다.");
    }
    setLoading(false);
  };

  // Open / Close Issue modal
  const handleOpenNewIssue = (targetCategory = "오픈이슈") => {
    const cat = targetCategory === "사내공지" ? "공지사항" : targetCategory;
    const defaultAuthor = currentProfile?.name || "";
    const defaultTitle = currentProfile?.title || "선임";

    const freshDrafts = {
      "품질경보": createEmptyCategoryDraft("품질경보", "삼랑진공장", defaultAuthor, defaultTitle),
      "회의일정": createEmptyCategoryDraft("회의일정", "삼랑진공장", defaultAuthor, defaultTitle),
      "공지사항": createEmptyCategoryDraft("공지사항", "삼랑진공장", defaultAuthor, defaultTitle),
      "오픈이슈": createEmptyCategoryDraft("오픈이슈", "삼랑진공장", defaultAuthor, defaultTitle)
    };
    setCategoryDrafts(freshDrafts);
    setNewIssueForm(freshDrafts[cat] || freshDrafts["오픈이슈"]);
    setEditingIssue(null);
    setIsIssueDetailMode(false);
    setIsIssueModalOpen(true);
  };

  const handleOpenEditIssue = (issue, e, fromList = false, isDetail = false) => {
    if (e) e.stopPropagation();
    const cat = issue.category === "사내공지" ? "공지사항" : (issue.category || "품질경보");
    const issueData = {
      category: issue.category || "품질경보",
      plant: issue.plant || "삼랑진공장",
      author: issue.author || "",
      authorTitle: issue.authorTitle || "",
      startDate: issue.startDate || issue.expireDate || todayDateStr,
      expireDate: issue.expireDate || issue.targetDate || todayDateStr,
      meetingTime: issue.meetingTime || "14:00",
      meetingLocation: issue.meetingLocation || "",
      meetingAgenda: issue.meetingAgenda || issue.content || "",
      attendees: Array.isArray(issue.attendees) ? issue.attendees : [],
      progress: issue.progress || 0,
      title: issue.title || "",
      content: issue.content || "",
      images: issue.images || [],
      actionResult: issue.actionResult || "",
      actionAuthor: issue.actionAuthor || "",
      actionImages: issue.actionImages || [],
      isResolved: Boolean(issue.isResolved),
      replies: issue.replies || []
    };

    setOpenedEditFromListModal(fromList);
    setNewIssueForm(issueData);
    setEditingIssue(issue);
    setIsIssueDetailMode(isDetail);
    setIsIssueModalOpen(true);
  };

  const handleCloseIssueModal = () => {
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    setIsIssueDetailMode(true);
    if (openedEditFromListModal) {
      setIsListModalOpen(true);
      setOpenedEditFromListModal(false);
    }
  };

  // Save New/Edit Issue
  const handleSaveNewIssue = async (e) => {
    if (e) e.preventDefault();
    if (isSavingIssue) return;
    if (!newIssueForm.author || !newIssueForm.author.trim()) {
      alert("작성자를 직접 선택해 주세요.");
      return;
    }
    if (!newIssueForm.content.trim() && !newIssueForm.title.trim()) {
      alert("제목 또는 상세 전달 내용을 입력해 주세요.");
      return;
    }

    setIsSavingIssue(true);
    try {
      const idStr = String(editingIssue?.id || "");
      if (idStr.startsWith("ext_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("ext_q_", "");
        const upObj = {
          ...(editingIssue.raw || {}),
          ...newIssueForm,
          id: targetId,
          updatedAt: new Date().toISOString()
        };
        await saveExtrusionQualityIssue(upObj);
        setExtrusionQualityAlerts((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
      } else if (idStr.startsWith("hanul_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("hanul_q_", "");
        const upObj = {
          ...(editingIssue.raw || {}),
          ...newIssueForm,
          id: targetId,
          updatedAt: new Date().toISOString()
        };
        await saveHanulQualityIssue(upObj);
        setHanulQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
      } else if (idStr.startsWith("ys_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("ys_q_", "");
        const upObj = {
          ...(editingIssue.raw || {}),
          ...newIssueForm,
          id: targetId,
          updatedAt: new Date().toISOString()
        };
        await saveYuseongQualityIssue(upObj);
        setYuseongQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
      } else if (idStr.startsWith("mach_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("mach_q_", "");
        const upObj = {
          ...(editingIssue.raw || {}),
          ...newIssueForm,
          id: targetId,
          updatedAt: new Date().toISOString()
        };
        await saveMachiningQualityIssue(upObj);
        setMachiningQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
      } else {
        const itemToSave = {
          ...(editingIssue || {}),
          ...newIssueForm,
          id: editingIssue?.id || editingIssue?._docId || `issue_${Date.now()}`,
          category: newIssueForm.category || editingIssue?.category || "오픈이슈",
          isDeleted: false, // 🌟 저장/수정 시 항상 활성 상태(isDeleted: false)로 보장하여 첫화면에 정상 노출
          deletedBy: "",
          deletedAt: "",
          isManuallyRestored: Boolean(editingIssue?.isManuallyRestored),
          isFirstScreenOrigin: true, // 🌟 첫 화면에서 등록된 공식 이슈임을 명시
          origin: "FIRST_SCREEN"
        };
        if (editingIssue?.createdAt) {
          itemToSave.createdAt = editingIssue.createdAt;
        } else if (!itemToSave.createdAt) {
          delete itemToSave.createdAt;
        }

        const isNew = !editingIssue || !editingIssue.id;
        const saved = await saveUrgentIssue(itemToSave, { isNew });
        if (saved) {
          setUrgentIssues((prev) => {
            const targetId = saved.id || saved._docId;
            const idx = prev.findIndex((i) => i.id === targetId || (saved._docId && i._docId === saved._docId));
            if (idx >= 0) {
              const up = [...prev];
              up[idx] = saved;
              return sortIssuesByCustomPriority(up);
            }
            return sortIssuesByCustomPriority([saved, ...prev]);
          });
        }
      }

      // Modal close handling: close both edit and list modal so the user sees the updated item immediately on the first screen
      setIsIssueModalOpen(false);
      setEditingIssue(null);
      setIsIssueDetailMode(true);
      setIsListModalOpen(false);
      setOpenedEditFromListModal(false);

      setRestoreToast(editingIssue ? "✅ 항목이 성공적으로 수정되었습니다." : "✅ 새로운 항목이 등록되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Save issue error:", err);
      alert("항목 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingIssue(false);
    }
  };

  // Restore & Cancel Restore
  const handleRestoreIssue = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await restoreUrgentIssue(id);
      if (updated && updated.id) {
        setUrgentIssues((prev) => {
          const idx = prev.findIndex((it) => it.id === id || it._docId === id);
          if (idx >= 0) {
            const up = [...prev];
            up[idx] = updated;
            return sortIssuesByCustomPriority(up);
          }
          return sortIssuesByCustomPriority([updated, ...prev]);
        });
        setRestoreToast(`✅ [${updated.title || updated.content}] 항목이 첫 화면에 복구되었습니다.`);
        setTimeout(() => setRestoreToast(""), 3500);
      }
    } catch (err) {
      console.error("Restore error:", err);
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  const handleCancelRestore = async (item, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`[${item.title || item.content}] 항목을 첫 화면에서 내리고 관리목록(대장)으로 보관하시겠습니까?`)) {
      return;
    }
    try {
      const updated = await cancelRestoreUrgentIssue(item.id);
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
        if (editingIssue && editingIssue.id === item.id) {
          setEditingIssue(updated);
        }
        setRestoreToast(`↩️ [${updated.title || updated.content}] 항목이 첫 화면에서 내려가 관리목록으로 보관되었습니다.`);
        setTimeout(() => setRestoreToast(""), 3500);
      }
    } catch (err) {
      console.error("Cancel restore error:", err);
      alert("복구 취소 처리 중 오류가 발생했습니다.");
    }
  };

  // Delete Authorization Modal State
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    issue: null,
    pinInput: "",
    errorMsg: "",
    isHardDelete: false,
    isDeleting: false
  });

  const handleOpenDeleteModal = (issue, e, forceHardDelete = false) => {
    if (e) e.stopPropagation();
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    const isHard = forceHardDelete || ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted";
    setDeleteModalData({
      isOpen: true,
      issue,
      pinInput: "",
      errorMsg: "",
      isHardDelete: isHard,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (deleteModalData.isDeleting) return;
    const issue = deleteModalData.issue;
    if (!issue) {
      setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "", isHardDelete: false, isDeleting: false });
      return;
    }

    const isHardDelete = Boolean(deleteModalData.isHardDelete);
    const inputPin = String(deleteModalData.pinInput || "").trim();

    if (isHardDelete) {
      const isAdminAuthorized = inputPin === "0090" || currentProfile?.role === "ADMIN";
      if (!isAdminAuthorized) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "종결삭제관리 내 영구삭제는 최고관리자(Admin) 전용 기능입니다. 관리자 확인 PIN을 다시 확인해 주세요."
        }));
        return;
      }
    } else {
      const isAuthorized = inputPin.length >= 1 || Boolean(currentProfile);
      if (!isAuthorized) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "확인 PIN 번호를 입력해 주세요."
        }));
        return;
      }
      if (inputPin !== "11" && inputPin !== "0090" && !currentProfile) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "PIN 번호가 일치하지 않습니다. 관리자 PIN을 다시 확인해 주세요."
        }));
        return;
      }
    }

    setDeleteModalData((prev) => ({ ...prev, isDeleting: true, errorMsg: "" }));

    try {
      const idStr = String(issue.id || "");
      if (idStr.startsWith("ext_q_")) {
        const targetId = issue.rawId || idStr.replace("ext_q_", "");
        await deleteExtrusionQualityIssue(targetId);
        setExtrusionQualityAlerts((prev) => prev.filter((a) => a.id !== targetId));
        setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 삭제되었습니다.`);
      } else if (idStr.startsWith("hanul_q_")) {
        const targetId = issue.rawId || idStr.replace("hanul_q_", "");
        await deleteHanulQualityIssue(targetId);
        setHanulQualityIssues((prev) => prev.filter((a) => a.id !== targetId));
        setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 삭제되었습니다.`);
      } else if (idStr.startsWith("ys_q_")) {
        const targetId = issue.rawId || idStr.replace("ys_q_", "");
        await deleteYuseongQualityIssue(targetId);
        setYuseongQualityIssues((prev) => prev.filter((a) => a.id !== targetId));
        setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 삭제되었습니다.`);
      } else if (idStr.startsWith("mach_q_")) {
        const targetId = issue.rawId || idStr.replace("mach_q_", "");
        await deleteMachiningQualityIssue(targetId);
        setMachiningQualityIssues((prev) => prev.filter((a) => a.id !== targetId));
        setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 삭제되었습니다.`);
      } else {
        if (isHardDelete) {
          await hardDeleteUrgentIssue(issue.id);
          setUrgentIssues((prev) => prev.filter((i) => i.id !== issue.id));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 데이터베이스에서 영구 삭제되었습니다.`);
        } else {
          const deleter = currentProfile?.name || (inputPin === "0090" ? "Admin" : issue.plant === "한림공장" ? "김동욱" : "이명재");
          await deleteUrgentIssue(issue.id, deleter);
          setUrgentIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, isDeleted: true, deletedBy: deleter } : i)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫화면에서 내려가 [종결삭제관리]로 이동 보존되었습니다.`);
        }
      }
      setTimeout(() => setRestoreToast(""), 3500);
      setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "", isHardDelete: false, isDeleting: false });
    } catch (err) {
      console.error("Delete issue error:", err);
      setDeleteModalData((prev) => ({
        ...prev,
        isDeleting: false,
        errorMsg: "삭제 처리 중 오류가 발생했습니다."
      }));
    }
  };

  // Action Result handlers
  const handleOpenActionModal = (issue, e) => {
    if (e) e.stopPropagation();
    setActionModalData({
      isOpen: true,
      issue,
      actionResult: issue.actionResult || "",
      actionAuthor: issue.actionAuthor || currentProfile?.name || "",
      actionImages: issue.actionImages || []
    });
  };

  const handleCloseActionModal = () => {
    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "",
      actionImages: []
    });
  };

  const handleSaveActionResult = async (e) => {
    if (e) e.preventDefault();
    if (isSavingIssue) return;
    if (!actionModalData.issue) return;
    if (!actionModalData.actionAuthor || !actionModalData.actionAuthor.trim()) {
      alert("조치자(또는 작성자)를 직접 선택해 주세요.");
      return;
    }
    if (!actionModalData.actionResult.trim()) {
      alert("조치결과 내용을 입력해 주세요.");
      return;
    }

    setIsSavingIssue(true);
    try {
      const issue = actionModalData.issue;
      const idStr = String(issue.id || "");
      const nowStr = new Date().toISOString();

      if (idStr.startsWith("ext_q_")) {
        const rawAlert = issue.raw || extrusionQualityAlerts.find((a) => `ext_q_${a.id}` === idStr || a.id === issue.rawId) || {};
        const updatedObj = {
          ...rawAlert,
          id: issue.rawId || idStr.replace("ext_q_", ""),
          actionResult: actionModalData.actionResult.trim(),
          actionAuthor: actionModalData.actionAuthor.trim(),
          actionImages: actionModalData.actionImages || [],
          status: "RESOLVED",
          updatedAt: nowStr
        };
        await saveExtrusionQualityIssue(updatedObj);
        setExtrusionQualityAlerts((prev) => prev.map((a) => a.id === updatedObj.id ? updatedObj : a));
      } else if (idStr.startsWith("hanul_q_")) {
        const rawAlert = issue.raw || hanulQualityIssues.find((a) => `hanul_q_${a.id}` === idStr || a.id === issue.rawId) || {};
        const updatedObj = {
          ...rawAlert,
          id: issue.rawId || idStr.replace("hanul_q_", ""),
          actionResult: actionModalData.actionResult.trim(),
          actionAuthor: actionModalData.actionAuthor.trim(),
          actionImages: actionModalData.actionImages || [],
          status: "RESOLVED",
          updatedAt: nowStr
        };
        await saveHanulQualityIssue(updatedObj);
        setHanulQualityIssues((prev) => prev.map((a) => a.id === updatedObj.id ? updatedObj : a));
      } else if (idStr.startsWith("ys_q_")) {
        const rawAlert = issue.raw || yuseongQualityIssues.find((a) => `ys_q_${a.id}` === idStr || a.id === issue.rawId) || {};
        const updatedObj = {
          ...rawAlert,
          id: issue.rawId || idStr.replace("ys_q_", ""),
          actionResult: actionModalData.actionResult.trim(),
          actionAuthor: actionModalData.actionAuthor.trim(),
          actionImages: actionModalData.actionImages || [],
          status: "RESOLVED",
          updatedAt: nowStr
        };
        await saveYuseongQualityIssue(updatedObj);
        setYuseongQualityIssues((prev) => prev.map((a) => a.id === updatedObj.id ? updatedObj : a));
      } else if (idStr.startsWith("mach_q_")) {
        const rawAlert = issue.raw || machiningQualityIssues.find((a) => `mach_q_${a.id}` === idStr || a.id === issue.rawId) || {};
        const updatedObj = {
          ...rawAlert,
          id: issue.rawId || idStr.replace("mach_q_", ""),
          actionResult: actionModalData.actionResult.trim(),
          actionAuthor: actionModalData.actionAuthor.trim(),
          actionImages: actionModalData.actionImages || [],
          status: "RESOLVED",
          updatedAt: nowStr
        };
        await saveMachiningQualityIssue(updatedObj);
        setMachiningQualityIssues((prev) => prev.map((a) => a.id === updatedObj.id ? updatedObj : a));
      } else {
        const updated = await updateUrgentIssueActionResult(
          issue.id,
          actionModalData.actionResult,
          actionModalData.actionAuthor,
          actionModalData.actionImages || []
        );

        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === issue.id ? updated : it)));
          if (selectedListItem && selectedListItem.id === issue.id) setSelectedListItem(updated);
          if (editingIssue && editingIssue.id === issue.id) setEditingIssue(updated);
        }
      }

      handleCloseActionModal();
      setRestoreToast("✅ 회의/조치 결과가 성공적으로 저장되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Save action error:", err);
      alert("결과 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingIssue(false);
    }
  };

  // Ledger Action Menu Handlers
  const handleExecuteMeetingResult = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleOpenActionModal(item, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteEditContent = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleOpenEditIssue(item, e, true, false);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetId = typeof item === "object" && item !== null ? item.id : item;
    await handleRestoreIssue(targetId, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteCancelRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetItem = typeof item === "object" && item !== null ? item : urgentIssues.find((i) => i.id === item);
    if (targetItem) {
      await handleCancelRestore(targetItem, e);
    }
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  // Opinions & Replies Handlers
  const handleModalAddOpinion = async (e) => {
    if (e) e.preventDefault();
    const content = actionOpinionForm.content.trim();
    const opinionFiles = actionOpinionForm.files || [];
    const isQualityAlert = (editingIssue?.category || newIssueForm.category) === "품질경보" || (editingIssue?.category || newIssueForm.category) === "부적합경보";
    if (!content && opinionFiles.length === 0) {
      alert(isQualityAlert ? "조치결과 내용 또는 첨부파일을 입력해 주세요." : "조치 의견 내용 또는 첨부파일을 입력해 주세요.");
      return;
    }
    // 🔒 작성자 직접 선택 필수 검증 (선택하지 않은 경우 자동 등록 차단)
    if (!actionOpinionForm.author || !actionOpinionForm.author.trim()) {
      alert(isQualityAlert ? "조치자(작성자)를 직접 선택해 주세요." : "의견 작성자를 직접 선택해 주세요.");
      return;
    }
    const authorName = actionOpinionForm.author.trim();
    const authorObj = allWorkers.find((w) => w.name === authorName);
    const targetDate = actionOpinionForm.actionDate || todayDateStr;

    if (editingIssue?.id) {
      try {
        const updated = await addIssueReply(editingIssue.id, {
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content || "파일이 첨부되었습니다.",
          files: opinionFiles
        });
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [], isResolved: updated.isResolved, actionResult: updated.actionResult }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [], author: "" }));
          setRestoreToast(isQualityAlert ? "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다." : "✅ 의견이 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
        }
      } catch (err) {
        console.error("Add opinion error:", err);
        alert(isQualityAlert ? "조치결과 등록 중 오류가 발생했습니다." : "의견 등록 중 오류가 발생했습니다.");
      }
    } else {
      const nowStr = new Date().toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const newOp = {
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        author: authorName,
        authorTitle: authorObj?.title || "선임",
        plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
        attendanceStatus: "확인",
        actionDate: targetDate,
        content: content || "파일이 첨부되었습니다.",
        files: opinionFiles,
        createdAt: nowStr
      };

      setNewIssueForm((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), newOp],
        ...(isQualityAlert ? { actionResult: newOp.content, actionAuthor: newOp.author, actionAt: targetDate, isResolved: true } : {})
      }));
      setActionOpinionForm((prev) => ({ ...prev, content: "", files: [], author: "" }));
    }
  };

  const handleModalDeleteOpinion = async (opId, e) => {
    if (e) e.stopPropagation();
    const isQualityAlert = (editingIssue?.category || newIssueForm.category) === "품질경보" || (editingIssue?.category || newIssueForm.category) === "부적합경보";
    const targetReply = (editingIssue?.replies || newIssueForm.replies || []).find((r) => r.id === opId);
    const authorName = targetReply?.author || "";

    // 🔒 의견등록자 본인 확인 (작성자 본인만 삭제 가능)
    if (currentProfile) {
      const isAuthor = currentProfile.name === authorName;
      const isAdmin = currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영";
      const isCeoOpinion = authorName === "대표이사" || authorName === "권태형" || authorName === "최미영" || authorName === "ADMIN";

      if (!isAuthor && !(isAdmin && isCeoOpinion)) {
        alert(`❌ 의견 삭제 권한이 없습니다.\n해당 의견을 작성한 [${authorName || "등록자"}] 본인만 삭제할 수 있습니다.`);
        return;
      }
      if (!confirm(isQualityAlert ? "해당 조치결과를 삭제하시겠습니까?" : `[${authorName}] 님이 작성한 의견을 삭제하시겠습니까?`)) return;
    } else {
      // 로그인 전 첫 화면: 작성자 본인 확인용 PIN 검증
      const inputPin = prompt(`[${authorName}] 님이 작성한 의견을 삭제하시겠습니까?\n작성자 본인 확인을 위해 [${authorName}] 님의 PIN 번호를 입력해 주세요:`);
      if (inputPin === null) return; // 취소
      const trimmedPin = inputPin.trim();
      const authorUser = ALL_DESIGNATED_USERS.find((u) => u.name === authorName);
      const isCeoOrAdmin = authorName === "권태형" || authorName === "최미영" || authorName === "대표이사" || authorName === "ADMIN";
      const expectedPin = isCeoOrAdmin ? "0090" : (authorUser?.pin || "11");

      const isValid = trimmedPin === expectedPin || trimmedPin === "0090";
      if (!isValid) {
        alert(`❌ PIN 번호가 일치하지 않습니다.\n해당 의견을 작성한 [${authorName}] 본인만 삭제할 수 있습니다.`);
        return;
      }
    }

    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, opId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [], isResolved: updated.isResolved, actionResult: updated.actionResult }));
          setRestoreToast("🗑️ 의견이 성공적으로 삭제되었습니다.");
          setTimeout(() => setRestoreToast(""), 3000);
        }
      } catch (err) {
        console.error("Delete opinion error:", err);
      }
    } else {
      setNewIssueForm((prev) => ({ ...prev, replies: (prev.replies || []).filter((r) => r.id !== opId) }));
    }
  };

  const handleModalAddReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyForm.author || !replyForm.author.trim()) {
      alert("회신 작성자를 직접 선택해 주세요.");
      return;
    }
    if (!replyForm.content.trim()) {
      alert("회신 내용을 입력해 주세요.");
      return;
    }
    setIsSubmittingReply(true);
    try {
      const authorObj = allWorkers.find((w) => w.name === replyForm.author);
      if (editingIssue?.id) {
        const updated = await addIssueReply(editingIssue.id, {
          author: replyForm.author.trim(),
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim()
        });
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setReplyForm((prev) => ({ ...prev, content: "", author: "" }));
          setRestoreToast("✅ 회신이 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
        }
      } else {
        const nowStr = new Date().toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
        }).replace(/\. /g, "-").replace(/\./g, "");

        const newRep = {
          id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          author: replyForm.author.trim(),
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim(),
          createdAt: nowStr
        };
        setNewIssueForm((prev) => ({ ...prev, replies: [...(prev.replies || []), newRep] }));
        setReplyForm((prev) => ({ ...prev, content: "", author: "" }));
      }
    } catch (err) {
      console.error("Add reply error:", err);
      alert("회신 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleModalDeleteReply = async (repId, e) => {
    if (e) e.stopPropagation();
    const targetReply = (editingIssue?.replies || newIssueForm.replies || []).find((r) => r.id === repId);
    const authorName = targetReply?.author || "";

    // 🔒 회신등록자 본인 확인 (작성자 본인만 삭제 가능)
    if (currentProfile) {
      const isAuthor = currentProfile.name === authorName;
      const isAdmin = currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영";
      const isCeoOpinion = authorName === "대표이사" || authorName === "권태형" || authorName === "최미영" || authorName === "ADMIN";

      if (!isAuthor && !(isAdmin && isCeoOpinion)) {
        alert(`❌ 회신 삭제 권한이 없습니다.\n해당 회신을 작성한 [${authorName || "등록자"}] 본인만 삭제할 수 있습니다.`);
        return;
      }
      if (!confirm(`[${authorName}] 님이 작성한 회신을 삭제하시겠습니까?`)) return;
    } else {
      const inputPin = prompt(`[${authorName}] 님이 작성한 회신을 삭제하시겠습니까?\n작성자 본인 확인을 위해 [${authorName}] 님의 PIN 번호를 입력해 주세요:`);
      if (inputPin === null) return;
      const trimmedPin = inputPin.trim();
      const authorUser = ALL_DESIGNATED_USERS.find((u) => u.name === authorName);
      const isCeoOrAdmin = authorName === "권태형" || authorName === "최미영" || authorName === "대표이사" || authorName === "ADMIN";
      const expectedPin = isCeoOrAdmin ? "0090" : (authorUser?.pin || "11");

      const isValid = trimmedPin === expectedPin || trimmedPin === "0090";
      if (!isValid) {
        alert(`❌ PIN 번호가 일치하지 않습니다.\n해당 회신을 작성한 [${authorName}] 본인만 삭제할 수 있습니다.`);
        return;
      }
    }

    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, repId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setRestoreToast("🗑️ 회신이 성공적으로 삭제되었습니다.");
          setTimeout(() => setRestoreToast(""), 3000);
        }
      } catch (err) {
        console.error("Delete reply error:", err);
      }
    } else {
      setNewIssueForm((prev) => ({ ...prev, replies: (prev.replies || []).filter((r) => r.id !== repId) }));
    }
  };

  // File & Image Upload Handlers (Photos & Excel)
  const handleIssueFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingIssueImages(true);
    const filesArray = Array.from(files);

    try {
      const processed = await Promise.all(
        filesArray.map(async (file) => {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImage(file, 1200, 1200, 0.8);
            return compressed ? { ...compressed, fileType: "image" } : null;
          } else {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const isExcel =
                  file.name.endsWith(".xlsx") ||
                  file.name.endsWith(".xls") ||
                  file.name.endsWith(".csv") ||
                  file.type.includes("sheet") ||
                  file.type.includes("excel") ||
                  file.type.includes("csv");
                resolve({
                  id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  size: (file.size / 1024).toFixed(1) + " KB",
                  fileType: isExcel ? "excel" : "file",
                  dataUrl: e.target.result
                });
              };
              reader.readAsDataURL(file);
            });
          }
        })
      );
      const valid = processed.filter(Boolean);
      setNewIssueForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...valid]
      }));
    } catch (err) {
      console.error("File processing error:", err);
      alert("파일을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingIssueImages(false);
    }
  };

  const handleOpinionFiles = async (files) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    try {
      const processed = await Promise.all(
        filesArray.map(async (file) => {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImage(file, 1200, 1200, 0.8);
            return compressed ? { ...compressed, fileType: "image" } : null;
          } else {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const isExcel =
                  file.name.endsWith(".xlsx") ||
                  file.name.endsWith(".xls") ||
                  file.name.endsWith(".csv") ||
                  file.type.includes("sheet") ||
                  file.type.includes("excel") ||
                  file.type.includes("csv");
                resolve({
                  id: `op_file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  size: (file.size / 1024).toFixed(1) + " KB",
                  fileType: isExcel ? "excel" : "file",
                  dataUrl: e.target.result
                });
              };
              reader.readAsDataURL(file);
            });
          }
        })
      );
      const valid = processed.filter(Boolean);
      setActionOpinionForm((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...valid]
      }));
    } catch (err) {
      console.error("Opinion file processing error:", err);
      alert("의견 첨부파일을 처리하는 중 오류가 발생했습니다.");
    }
  };

  const handleRemoveOpinionFile = (idx) => {
    setActionOpinionForm((prev) => ({
      ...prev,
      files: (prev.files || []).filter((_, i) => i !== idx)
    }));
  };

  const handleActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    const availableSlots = 3 - (actionModalData.actionImages?.length || 0);
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map((f) => compressImage(f, 1200, 1200, 0.8))
      );
      const valid = compressedImages.filter(Boolean);
      setActionModalData((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...valid]
      }));
    } catch (err) {
      console.error("Action image compression error:", err);
      alert("사진을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleNewIssueActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    const availableSlots = 3 - (newIssueForm.actionImages?.length || 0);
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map((f) => compressImage(f, 1200, 1200, 0.8))
      );
      const valid = compressedImages.filter(Boolean);
      setNewIssueForm((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...valid]
      }));
    } catch (err) {
      console.error("New issue action image error:", err);
      alert("사진을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveIssueImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveActionImage = (idx) => {
    setActionModalData((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveNewIssueActionImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Telegram Config Handlers
  const handleVerifyTelegramAdmin = (e) => {
    e.preventDefault();
    const inputPin = telegramAdminPinModal.pinInput.trim();
    if (inputPin === "0090") {
      setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" });
      setIsTelegramModalOpen(true);
      setTelegramTestResult(null);
    } else {
      setTelegramAdminPinModal((prev) => ({
        ...prev,
        errorMsg: "ADMIN 관리자 PIN 번호가 일치하지 않습니다."
      }));
    }
  };

  const handleSaveTelegramConfig = async (e) => {
    e.preventDefault();
    const updated = await saveTelegramConfig(telegramConfig);
    setTelegramConfig(updated);
    setTelegramSavedToast(true);
    setTimeout(() => setTelegramSavedToast(false), 3000);
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await testTelegramConnection();
      setTelegramTestResult(res);
    } catch (err) {
      setTelegramTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSendDailyClosingBriefing = async () => {
    setSendingClosingBriefing(true);
    try {
      const res = await sendDailyClosingBriefingTelegram();
      if (res && res.success) {
        setClosingBriefingToast(true);
        setTimeout(() => setClosingBriefingToast(false), 3500);
      } else {
        alert("일일마감브리핑 발송에 실패했습니다: " + (res?.error || ""));
      }
    } catch (err) {
      console.error("Closing briefing error:", err);
      alert("발송 오류가 발생했습니다: " + err.message);
    } finally {
      setSendingClosingBriefing(false);
    }
  };

  // 🌟 Auto-manage Back button for modals in AuthModal (LIFO stack)
  useModalHistory(isListModalOpen, () => {
    setIsListModalOpen(false);
    setSelectedListItem(null);
  }, "issueLedgerModal");

  useModalHistory(isIssueModalOpen, handleCloseIssueModal, "issueEditModal");
  useModalHistory(Boolean(actionModalData?.isOpen), handleCloseActionModal, "issueActionModal");
  useModalHistory(Boolean(deleteModalData?.isOpen), () => setDeleteModalData((prev) => ({ ...prev, isOpen: false })), "deleteAuthModal");
  useModalHistory(isTelegramModalOpen, () => setIsTelegramModalOpen(false), "telegramConfigModal");
  useModalHistory(Boolean(telegramAdminPinModal?.isOpen), () => setTelegramAdminPinModal((prev) => ({ ...prev, isOpen: false })), "telegramAdminPinModal");
  useModalHistory(Boolean(previewImageModal), () => setPreviewImageModal(null), "previewImageModal");
  useModalHistory(isExtrusionModalOpen, () => setIsExtrusionModalOpen(false), "extrusionModal");
  useModalHistory(isMachiningModalOpen, () => setIsMachiningModalOpen(false), "machiningModal");
  useModalHistory(isHanulModalOpen, () => setIsHanulModalOpen(false), "hanulModal");
  useModalHistory(isHanulWorkReportModalOpen, () => setIsHanulWorkReportModalOpen(false), "hanulWorkReportModal");
  useModalHistory(isBulimtechModalOpen, () => setIsBulimtechModalOpen(false), "bulimtechModal");
  useModalHistory(isYuseongModalOpen, () => setIsYuseongModalOpen(false), "yuseongModal");
  useModalHistory(isSqLevelUpModalOpen, () => setIsSqLevelUpModalOpen(false), "sqLevelUpModal");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-xl animate-fadeIn p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start min-h-screen max-w-full">
      {/* ⚡ Real-time Version & Cache Sync Banner */}
      {updateAvailable && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center gap-3 text-xs font-bold border border-blue-300/40 animate-bounce">
          <span>⚡ 최신 초고속 버전이 배포되었습니다.</span>
          <button
            onClick={() => forceHardReload()}
            className="px-3 py-1 rounded-full bg-white text-blue-700 font-extrabold hover:bg-blue-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            지금 즉시 적용
          </button>
        </div>
      )}

      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3 sm:p-5 sm:px-6">
          {/* First Page Toast Alert */}
          {firstPageToast && (
            <div className="fixed top-4 right-4 z-60 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-slate-700 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{firstPageToast}</span>
            </div>
          )}

          {/* Header Brand with Logo on Left and [압출동] / [가공동] Badges on Right */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800/80">
            {/* Left: Brand Logo & Title */}
            <div
              onClick={() => handleUserClick(ADMIN_USERS[0])}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group active:scale-98 transition-transform min-w-0"
              title="오륙 로고를 클릭하여 관리자(Admin) 모드로 진입합니다"
            >
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 p-1 sm:p-1.5 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-400 group-hover:shadow-blue-500/20 transition-all">
                <OryukLogo className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-xs group-hover:scale-105 transition-transform" />
              </div>
              <div className="min-w-0 text-left">
                <h2 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-1.5 truncate">
                  <span className="text-blue-600 dark:text-blue-400 font-black">
                    (주)오륙
                  </span>
                  <span className="truncate">생산관리 통합시스템</span>
                </h2>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold hidden sm:block">
                  실시간 안전·품질 & 공장별 통합 관리
                </span>
              </div>
            </div>

            {/* Right: Badges: [압출동] & [가공동] & [한울] & [부림텍] */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsExtrusionModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-teal-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-teal-400/30"
                title="삼랑진공장 압출동 작업자 전용 포털 (공영국 외 10명)"
              >
                <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 animate-pulse" />
                <span>압출동</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-800/80 text-teal-100 hidden sm:inline">
                  11명
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMachiningModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-amber-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-amber-400/30"
                title={`삼랑진공장 가공동 작업자 전용 포털 (${machiningWorkers.length}명)`}
              >
                <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 animate-pulse" />
                <span>가공동</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-900/80 text-amber-100 hidden sm:inline">
                  {machiningWorkers.length}명
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsHanulModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-indigo-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-indigo-400/30"
                title={`한림공장 외주가공 (주)한울 작업자 전용 포털 (${hanulWorkers.length}명)`}
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200 animate-pulse" />
                <span>한울</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-900/80 text-indigo-100 hidden sm:inline">
                  {hanulWorkers.length}명
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulimtechModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-teal-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-teal-400/30"
                title={`한림공장 외주가공 (주)부림텍 작업자 전용 포털 (${bulimtechWorkers.length}명)`}
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 animate-pulse" />
                <span>부림텍</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-900/80 text-teal-100 hidden sm:inline">
                  {bulimtechWorkers.length}명
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsYuseongModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-blue-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-blue-400/30"
                title={`외주가공 (주)유성 작업자 전용 포털 (${yuseongWorkers.length}명)`}
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 animate-pulse" />
                <span>유성</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-900/80 text-blue-100 hidden sm:inline">
                  {yuseongWorkers.length}명
                </span>
              </button>
            </div>
          </div>

          {/* 🎯 첫화면 회사로고 바로 아래: SQ 진행상황 현황표 배너/카드 */}
          <div className="mb-3.5 sm:mb-4">
            <SqStatusBannerCard
              onOpenSqModal={() => setIsSqLevelUpModalOpen(true)}
            />
          </div>

          {/* 📢 1. 실시간 공지 & 오픈이슈 라이브 보드 */}
          <RealtimeIssueBoard
            activeIssues={activeIssues}
            displayedActiveIssues={displayedActiveIssues}
            qualityAlertCount={qualityAlertCount}
            meetingIssuesCount={meetingIssuesCount}
            qualityIssueCount={qualityIssueCount}
            noticeIssuesCount={noticeIssuesCount}
            openIssueCategoryFilter={openIssueCategoryFilter}
            setOpenIssueCategoryFilter={setOpenIssueCategoryFilter}
            isIssueExpanded={isIssueExpanded}
            setIsIssueExpanded={setIsIssueExpanded}
            onOpenListModal={() => {
              setIsListModalOpen(true);
              setSelectedListItem(null);
              setIssueModalPage(1);
            }}
            onOpenNewIssue={handleOpenNewIssue}
            onOpenDeleteModal={handleOpenDeleteModal}
            onSelectCardCategory={(item) => {
              const isMeeting = item.category === "회의일정";
              const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
              const isQualityAlert = item.category === "품질경보" || item.category === "부적합경보";
              const catTab = isQualityAlert ? "quality_alert" : isMeeting ? "meeting" : isNotice ? "notice" : "open_issue";
              setLedgerCategoryTab(catTab);
              setSelectedListItem(null);
              setIssueModalPage(1);
              setIsListModalOpen(true);
            }}
          />

          {/* 👤 2. 작업자 로그인 섹션 */}
          <WorkerLoginSection
            factoryBuildingTab={factoryBuildingTab}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            pin={pin}
            setPin={setPin}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            loading={loading}
            errorMsg={errorMsg}
            annualLeaves={annualLeaves}
            samrangjinLeaveCount={samrangjinLeaveCount}
            hanlimLeaveCount={hanlimLeaveCount}
            managerLeaves={managerLeaves}
            companyAttendanceStats={companyAttendanceStats}
            activeIssues={activeIssues}
            urgentIssues={urgentIssues}
            onUserClick={handleUserClick}
            onPinSubmit={handlePinSubmit}
            onOpenExtrusionReport={() => setIsExtrusionReportModalOpen(true)}
            onOpenDisasterModal={() => setIsSevereDisasterModalOpen(true)}
            onOpenQualityAlerts={() => {
              setLedgerCategoryTab("quality_alert");
              setSelectedListItem(null);
              setIssueModalPage(1);
              setIsListModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* 🌟 관리목록 대장 모달 */}
      {isListModalOpen && (
        <Suspense fallback={null}>
          <IssueLedgerModal
            isOpen={isListModalOpen}
            onClose={() => {
              setIsListModalOpen(false);
              setSelectedListItem(null);
            }}
            urgentIssues={urgentIssues.filter(isFirstScreenIssue)}
            filteredIssues={filteredIssues}
            restoreToast={restoreToast}
            setRestoreToast={setRestoreToast}
            ledgerCategoryTab={ledgerCategoryTab}
            setLedgerCategoryTab={setLedgerCategoryTab}
            selectedScheduleDate={selectedScheduleDate}
            setSelectedScheduleDate={setSelectedScheduleDate}
            issueModalPage={issueModalPage}
            setIssueModalPage={setIssueModalPage}
            openIssueScheduleDays={openIssueScheduleDays}
            allQualityAlerts={allQualityAlerts}
            allMeetings={allMeetings}
            allQualityIssues={allQualityIssues}
            allNotices={allNotices}
            allClosedDeletedIssues={allClosedDeletedIssues}
            selectedListItem={selectedListItem}
            openActionMenuId={openActionMenuId}
            setOpenActionMenuId={setOpenActionMenuId}
            onOpenEditIssue={handleOpenEditIssue}
            onExecuteMeetingResult={handleExecuteMeetingResult}
            onExecuteEditContent={handleExecuteEditContent}
            onExecuteRestore={handleExecuteRestore}
            onExecuteCancelRestore={handleExecuteCancelRestore}
            onOpenDeleteModal={handleOpenDeleteModal}
            onOpenNewIssue={handleOpenNewIssue}
          />
        </Suspense>
      )}

      {/* 🌟 신규 등록 및 수정 상세 모달 */}
      {isIssueModalOpen && (
        <Suspense fallback={null}>
          <IssueEditModal
            isOpen={isIssueModalOpen}
            onClose={handleCloseIssueModal}
            editingIssue={editingIssue}
            isIssueDetailMode={isIssueDetailMode}
            setIsIssueDetailMode={setIsIssueDetailMode}
            newIssueForm={newIssueForm}
            setNewIssueForm={setNewIssueForm}
            allWorkers={allWorkers}
            todayDateStr={todayDateStr}
            onSwitchCategory={handleSwitchCategory}
            onSaveNewIssue={handleSaveNewIssue}
            onOpenActionModal={handleOpenActionModal}
            onCancelRestore={handleCancelRestore}
            onOpenDeleteModal={handleOpenDeleteModal}
            onPreviewImage={setPreviewImageModal}
            actionOpinionForm={actionOpinionForm}
            setActionOpinionForm={setActionOpinionForm}
            onModalAddOpinion={handleModalAddOpinion}
            onModalDeleteOpinion={handleModalDeleteOpinion}
            replyForm={replyForm}
            setReplyForm={setReplyForm}
            isSubmittingReply={isSubmittingReply}
            onModalAddReply={handleModalAddReply}
            onModalDeleteReply={handleModalDeleteReply}
            isProcessingIssueImages={isProcessingIssueImages}
            onIssueFiles={handleIssueFiles}
            onIssueImageFiles={handleIssueFiles}
            onRemoveIssueImage={handleRemoveIssueImage}
            onOpinionFiles={handleOpinionFiles}
            onRemoveOpinionFile={handleRemoveOpinionFile}
            isProcessingActionImages={isProcessingActionImages}
            onNewIssueActionImageFiles={handleNewIssueActionImageFiles}
            onRemoveNewIssueActionImage={handleRemoveNewIssueActionImage}
            onToggleResolvedStatus={async () => {
              if (!editingIssue) return;
              const toggled = !editingIssue.isResolved;
              setNewIssueForm((prev) => ({ ...prev, isResolved: toggled, status: toggled ? "RESOLVED" : "ACTIVE" }));
              const updated = { ...editingIssue, isResolved: toggled, status: toggled ? "RESOLVED" : "ACTIVE" };
              setEditingIssue(updated);

              const idStr = String(editingIssue.id || "");
              if (idStr.startsWith("ext_q_")) {
                const targetId = editingIssue.rawId || idStr.replace("ext_q_", "");
                const upObj = { ...(editingIssue.raw || {}), ...updated, id: targetId, status: toggled ? "RESOLVED" : "ACTIVE" };
                await saveExtrusionQualityIssue(upObj);
                setExtrusionQualityAlerts((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
              } else if (idStr.startsWith("hanul_q_")) {
                const targetId = editingIssue.rawId || idStr.replace("hanul_q_", "");
                const upObj = { ...(editingIssue.raw || {}), ...updated, id: targetId, status: toggled ? "RESOLVED" : "ACTIVE" };
                await saveHanulQualityIssue(upObj);
                setHanulQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
              } else if (idStr.startsWith("ys_q_")) {
                const targetId = editingIssue.rawId || idStr.replace("ys_q_", "");
                const upObj = { ...(editingIssue.raw || {}), ...updated, id: targetId, status: toggled ? "RESOLVED" : "ACTIVE" };
                await saveYuseongQualityIssue(upObj);
                setYuseongQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
              } else if (idStr.startsWith("mach_q_")) {
                const targetId = editingIssue.rawId || idStr.replace("mach_q_", "");
                const upObj = { ...(editingIssue.raw || {}), ...updated, id: targetId, status: toggled ? "RESOLVED" : "ACTIVE" };
                await saveMachiningQualityIssue(upObj);
                setMachiningQualityIssues((prev) => prev.map((a) => (a.id === targetId ? upObj : a)));
              } else {
                setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
                await saveUrgentIssue(updated);
              }
            }}
          />
        </Suspense>
      )}

      {/* 🌟 회의결과 / 조치결과 모달 */}
      {actionModalData?.isOpen && (
        <Suspense fallback={null}>
          <IssueActionModal
            actionModalData={actionModalData}
            setActionModalData={setActionModalData}
            onClose={handleCloseActionModal}
            onSaveActionResult={handleSaveActionResult}
            allWorkers={allWorkers}
            isProcessingActionImages={isProcessingActionImages}
            onActionImageFiles={handleActionImageFiles}
            onRemoveActionImage={handleRemoveActionImage}
            onPreviewImage={setPreviewImageModal}
          />
        </Suspense>
      )}

      {/* 🌟 2단계 삭제 인증 모달 */}
      {deleteModalData?.isOpen && (
        <Suspense fallback={null}>
          <DeleteAuthModal
            deleteModalData={deleteModalData}
            setDeleteModalData={setDeleteModalData}
            onConfirmDelete={handleConfirmDelete}
          />
        </Suspense>
      )}

      {/* 🌟 텔레그램 연동 설정 모달 */}
      {Boolean(telegramAdminPinModal?.isOpen || isTelegramModalOpen) && (
        <Suspense fallback={null}>
          <TelegramConfigModal
            telegramAdminPinModal={telegramAdminPinModal}
            setTelegramAdminPinModal={setTelegramAdminPinModal}
            onVerifyTelegramAdmin={handleVerifyTelegramAdmin}
            isTelegramModalOpen={isTelegramModalOpen}
            setIsTelegramModalOpen={setIsTelegramModalOpen}
            telegramConfig={telegramConfig}
            setTelegramConfig={setTelegramConfig}
            onSaveTelegramConfig={handleSaveTelegramConfig}
            testingTelegram={testingTelegram}
            onTestTelegram={handleTestTelegram}
            sendingClosingBriefing={sendingClosingBriefing}
            onSendDailyClosingBriefing={handleSendDailyClosingBriefing}
            closingBriefingToast={closingBriefingToast}
            telegramSavedToast={telegramSavedToast}
            telegramTestResult={telegramTestResult}
          />
        </Suspense>
      )}

      {/* 🌟 고화질 사진 미리보기 Lightbox */}
      {Boolean(previewImageModal) && (
        <ImagePreviewModal
          previewImage={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}

      {/* 🏭 삼랑진공장 압출동 작업자 전용 팝업 선택 모달 (별도 분리 운영) */}
      {isExtrusionModalOpen && (
        <div
          onClick={() => setIsExtrusionModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-2 border-teal-400 dark:border-teal-700 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    삼랑진공장 압출동 작업자 (11명)
                  </h3>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    안전·품질 확인 후 압출 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtrusionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 압출 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="grid grid-cols-4 gap-1.5">
              {EXTRUSION_WORKERS.map((worker) => {
                const isLead =
                  worker.title === "반장" ||
                  worker.title === "대리" ||
                  worker.name === "공영국" ||
                  worker.name === "심임대" ||
                  worker.name === "이상은";
                return (
                  <button
                    key={worker.id}
                    onClick={() => {
                      setIsExtrusionModalOpen(false);
                      handleUserClick({
                        ...worker,
                        portalType: "extrusion",
                        building: "압출동",
                        plant: "삼랑진공장",
                        company: "오륙",
                        assignedProcess: "압출동",
                        isFieldWorker: true
                      });
                    }}
                    className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                      isLead
                        ? "border-teal-500 bg-teal-700 text-white shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-teal-400"
                    }`}
                  >
                    <div className={`${worker.title ? "w-[45%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                      isLead ? "bg-teal-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}>
                      <span className="font-black text-xs tracking-tight truncate">
                        {worker.name}
                      </span>
                    </div>
                    {worker.title && (
                      <div className={`w-[55%] flex items-center justify-center text-center px-1 py-0.5 ${
                        isLead ? "bg-teal-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        <span className="text-[11px] font-bold">{worker.title}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🏭 삼랑진공장 가공동 작업자 전용 팝업 선택 모달 */}
      {isMachiningModalOpen && (
        <div
          onClick={() => setIsMachiningModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>삼랑진공장 가공동 작업자</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      총원 {machiningWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    안전·품질 확인 후 가공 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMachiningModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 가공 생산관리 화면으로 바로 연결됩니다.
            </p>

            {/* Scrollable Machining Workers Grid */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {machiningWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장";
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsMachiningModalOpen(false);
                        handleUserClick({
                          id: `mach_${worker.no || idx}`,
                          name: worker.name,
                          title: worker.position || "사원",
                          position: worker.position || "사원",
                          dept: worker.dept || "가공동",
                          building: "가공동",
                          plant: "삼랑진공장",
                          company: "오륙",
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공` : "가공",
                          portalType: "machining",
                          isFieldWorker: true
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-amber-400 bg-amber-600 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-amber-400"
                      }`}
                    >
                      <div className="w-[55%] flex items-center justify-center px-1 text-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      <div className="w-[45%] flex items-center justify-center text-center px-1 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] font-bold truncate">{worker.line || worker.position || "가공"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 한림공장 한울 외주가공 전용 팝업 선택 모달 */}
      {isHanulModalOpen && (
        <div
          onClick={() => setIsHanulModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-indigo-400 dark:border-indigo-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>한림공장 외주가공 (주)한울</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                      총원 {hanulWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    안전·품질 확인 후 한울 외주가공 및 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHanulModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 한울 외주가공 및 생산관리 화면으로 바로 연결됩니다.
            </p>

            {/* Scrollable Hanul Workers Grid */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {hanulWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장" || worker.name === "박종미";
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsHanulModalOpen(false);
                        handleUserClick({
                          ...hanulUser,
                          id: `hal_hu_${worker.no || idx}`,
                          name: worker.name,
                          title: worker.position || "사원",
                          position: worker.position || "사원",
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 외주가공` : "외주가공",
                          plant: "한림공장",
                          company: "한울",
                          portalType: "hanul",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-indigo-400 bg-indigo-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-indigo-400"
                      }`}
                    >
                      <div className={`${worker.position ? "w-[50%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-indigo-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      {worker.position && (
                        <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                          isLeader ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <span className="text-[10px] font-bold truncate">{worker.position}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 한림공장 부림텍 외주가공 전용 팝업 선택 모달 */}
      {isBulimtechModalOpen && (
        <div
          onClick={() => setIsBulimtechModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-2 border-teal-400 dark:border-teal-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>한림공장 외주가공 (주)부림텍</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                      총원 {bulimtechWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    안전·품질 확인 후 부림텍 외주가공 및 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulimtechModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 확인하신 후 부림텍 외주가공 및 생산관리 화면으로 연결됩니다.
            </p>

            {/* Scrollable Bulimtech Workers Grid */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bulimtechWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장" || worker.name === "최현영";
                  const displayPos = worker.name === "최현영" ? "반장" : (worker.position || "사원");
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsBulimtechModalOpen(false);
                        handleUserClick({
                          ...bulimtechUser,
                          id: `hal_br_${worker.no || idx}`,
                          name: worker.name,
                          title: displayPos,
                          position: displayPos,
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 외주가공` : "외주가공",
                          plant: "한림공장",
                          company: "부림텍",
                          portalType: "bulimtech",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[48px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-teal-400 bg-teal-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-teal-400"
                      }`}
                    >
                      <div className={`w-[50%] flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-teal-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                        isLeader ? "bg-teal-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        <span className="text-[10px] font-bold truncate">{displayPos}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 삼랑진공장 외주가공 (주)유성 전용 팝업 선택 모달 */}
      {isYuseongModalOpen && (
        <div
          onClick={() => setIsYuseongModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-blue-400 dark:border-blue-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>외주가공 (주)유성</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                      총원 {yuseongWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    안전·품질 확인 후 JK1 • CE1 • DT Hood 작업일보 및 대시보드 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsYuseongModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 (주)유성 작업일보 및 생산관리 화면으로 바로 연결됩니다.
            </p>

            {/* Scrollable Yuseong Workers Grid */}
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {yuseongWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "기사" || worker.position === "반장" || worker.position === "조장" || worker.name === "이성기";
                  const displayPos = worker.position || (isLeader ? "기사" : "사원");
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsYuseongModalOpen(false);
                        handleUserClick({
                          ...yuseongUser,
                          id: `ys_${worker.no || idx}`,
                          name: worker.name,
                          title: displayPos,
                          position: displayPos,
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 외주가공` : "외주가공",
                          plant: "삼랑진공장",
                          company: "유성",
                          portalType: "yuseong",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-blue-400 bg-blue-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-blue-400"
                      }`}
                    >
                      <div className={`${displayPos ? "w-[50%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-blue-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      {displayPos && (
                        <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                          isLeader ? "bg-blue-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <span className="text-[10px] font-bold truncate">{displayPos}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 🚨 중대재해 안전보건 공유 모달 */}
      {isSevereDisasterModalOpen && (
        <SevereDisasterModal
          isOpen={isSevereDisasterModalOpen}
          onClose={() => setIsSevereDisasterModalOpen(false)}
        />
      )}

      {/* 🏭 압출 작업일보 신규 작성 모달 */}
      {isExtrusionReportModalOpen && (
        <ExtrusionWorkReportModal
          isOpen={isExtrusionReportModalOpen}
          onClose={() => setIsExtrusionReportModalOpen(false)}
          onSave={handleSaveExtrusionReport}
        />
      )}

      {/* 📋 한울 외주가공 작업일보 신규 작성 모달 (9BQC / LQ2a) */}
      {isHanulWorkReportModalOpen && (
        <Suspense fallback={null}>
          <HanulWorkReportModal
            isOpen={isHanulWorkReportModalOpen}
            onClose={() => setIsHanulWorkReportModalOpen(false)}
            initialProject={hanulWorkReportProject}
            initialWorker={hanulWorkReportWorker}
          />
        </Suspense>
      )}

      {/* 🎯 SQ Live 모니터링 및 진행현황 모달 (Admin SQ 추진판 내용 전체 표시) */}
      {isSqLevelUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-[1700px] max-h-[96vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                  🎯 SQ 진행상황 현황표
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("trigger-sq-reregister"));
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="관리자 및 완료예정일자 변경사항 재등록"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>변경사항등록</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqLevelUpModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-100 dark:bg-slate-950">
              <Suspense
                fallback={
                  <div className="h-96 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400">SQ 레벨업 추진판 로딩 중...</p>
                    </div>
                  </div>
                }
              >
                <SqLevelUpView />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
