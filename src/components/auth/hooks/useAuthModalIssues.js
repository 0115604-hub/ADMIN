import { useState, useEffect, useMemo } from "react";
import { useAuth, ALL_DESIGNATED_USERS } from "../../../context/AuthContext";
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
  isMeetingExpired,
  isIssueClosed,
  isLegacyDismissedQualityAlert
} from "../../../services/urgentIssueService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../../../services/extrusionQualityIssueService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  saveHanulQualityIssue,
  deleteHanulQualityIssue
} from "../../../services/hanulQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues,
  saveYuseongQualityIssue,
  deleteYuseongQualityIssue
} from "../../../services/yuseongQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  saveMachiningQualityIssue,
  deleteMachiningQualityIssue
} from "../../../services/machiningQualityIssueService";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyClosingBriefingTelegram,
  sendQualityActionTelegram
} from "../../../services/telegramService";
import { compressImage } from "../../../utils/imageCompressor";
import { useModalHistory } from "../../../utils/modalHistory";

/**
 * useAuthModalIssues
 * Custom hook encapsulating all Urgent Issue & Telegram management logic for AuthModal:
 * - Subscriptions (Urgent, Extrusion, Hanul, Yuseong, Machining quality issues)
 * - CRUD operations, restore/cancel-restore, opinions, replies, image compression
 * - Telegram test & daily closing briefing dispatch
 * - Modal history back button registration
 */
export const useAuthModalIssues = ({ todayDateStr, currentKstTimeStr, allWorkers = [] }) => {
  const { currentProfile } = useAuth();

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

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
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

    // 2. 개별 공정/협력업체 관리자가 내부에서 등록한 이슈 제외 (ID 접두사: hanul_qual_, urg_hanul_qual_, ext_qual_ 등)
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
      const closedByAdmin = Boolean(alert.isClosedByAdmin) || isLegacyDismissedQualityAlert({ ...alert, category: "부적합경보" });
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
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        origin: "EXTRUSION_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 2. 한울 / 조영 부적합경보 (첫화면 전사등록 뱃지 선택 건에 한하여 첫화면 노출)
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;
      if (alert.isFirstScreenBroadcast !== true) return;

      const dateStr = normalizeDateStr(alert.targetDate || alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) && !alert.isManuallyRestored;
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `hanul_q_${alert.id}`,
        rawId: alert.id,
        source: "hanul",
        category: "부적합경보",
        plant: alert.plant || "한림공장",
        line: alert.line || "가공/협력업체(한울)",
        author: alert.author || "한울 관리자",
        authorTitle: alert.authorTitle || "대표",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "한울 협력업체 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        isFirstScreenBroadcast: true,
        origin: "HANUL_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 3. 유성 가공/협력업체 부적합경보
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) || isLegacyDismissedQualityAlert({ ...alert, category: "부적합경보" });
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `ys_q_${alert.id}`,
        rawId: alert.id,
        source: "yuseong",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "가공/협력업체(유성)",
        author: alert.author || "유성 관리자",
        authorTitle: alert.authorTitle || "대표",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "유성 협력업체 부적합경보",
        content: alert.content || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        origin: "YUSEONG_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 4. 오륙 / 가공동 부적합경보 (첫화면 전사등록 뱃지 선택 건에 한하여 첫화면 노출)
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;
      if (alert.isFirstScreenBroadcast !== true) return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) && !alert.isManuallyRestored;
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
        authorTitle: alert.authorTitle || "책임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "오륙 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        isFirstScreenBroadcast: true,
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
    const keyToIdx = new Map();

    // 1. 4개 공정/협력사 부적합경보 (압출, 한울, 유성, 가공동)
    (externalQualityAlerts || []).forEach((item) => {
      const idx = list.length;
      const key = `${(item.title || "").trim().toLowerCase()}_${item.startDate || item.date || ""}`;
      keyToIdx.set(key, idx);
      if (item.rawId) {
        keyToIdx.set(String(item.rawId), idx);
        const tsMatch = String(item.rawId).match(/(\d{13})/);
        if (tsMatch) keyToIdx.set(`ts_${tsMatch[1]}`, idx);
      }
      if (item.id) keyToIdx.set(String(item.id), idx);
      list.push(item);
    });

    // 2. Urgent issues 부적합경보 (첫화면 공식 등록 건 및 전사등록 허용 건만 수합)
    (urgentIssues || []).forEach((item) => {
      if (!item) return;
      if (!isCatQualityAlert(item.category)) return;
      if (!isFirstScreenIssue(item) && item.isFirstScreenBroadcast !== true) return;

      const key = `${(item.title || "").trim().toLowerCase()}_${(item.startDate || item.expireDate || item.date || "").slice(0, 10)}`;
      const cleanId = String(item.id || item._docId || "");
      const tsMatch = cleanId.match(/(\d{13})/);
      const tsKey = tsMatch ? `ts_${tsMatch[1]}` : "";

      const matchedIdx =
        keyToIdx.get(cleanId) ??
        (tsKey ? keyToIdx.get(tsKey) : undefined) ??
        keyToIdx.get(key);

      if (matchedIdx !== undefined && list[matchedIdx]) {
        const existing = list[matchedIdx];
        const hasIncomingAction = Boolean(
          (item.actionResult && String(item.actionResult).trim().length > 0) ||
          (Array.isArray(item.actionImages) && item.actionImages.length > 0) ||
          (Array.isArray(item.replies) && item.replies.length > 0)
        );
        const hasExistingAction = Boolean(
          (existing.actionResult && String(existing.actionResult).trim().length > 0) ||
          (Array.isArray(existing.actionImages) && existing.actionImages.length > 0) ||
          (Array.isArray(existing.replies) && existing.replies.length > 0)
        );
        if (hasIncomingAction && !hasExistingAction) {
          list[matchedIdx] = {
            ...existing,
            actionResult: item.actionResult || existing.actionResult || "",
            actionAuthor: item.actionAuthor || existing.actionAuthor || "",
            actionAt: item.actionAt || existing.actionAt || "",
            actionImages: Array.from(new Set([...(existing.actionImages || []), ...(item.actionImages || [])])),
            replies: Array.isArray(item.replies) && item.replies.length > 0 ? item.replies : (existing.replies || []),
            isResolved: Boolean(existing.isResolved || item.isResolved || item.actionResult),
            status: "RESOLVED"
          };
        } else if (hasIncomingAction && hasExistingAction) {
          list[matchedIdx] = {
            ...existing,
            actionResult: existing.actionResult || item.actionResult || "",
            actionAuthor: existing.actionAuthor || item.actionAuthor || "",
            actionAt: existing.actionAt || item.actionAt || "",
            actionImages: Array.from(new Set([...(existing.actionImages || []), ...(item.actionImages || [])])),
            replies: [...(existing.replies || []), ...(item.replies || [])].filter(
              (r, i, arr) => arr.findIndex((o) => o.id === r.id || (o.content === r.content && o.author === r.author)) === i
            ),
            isResolved: true,
            status: "RESOLVED"
          };
        }
        return;
      }

      list.push({
        ...item,
        category: "부적합경보",
        isFirstScreenOrigin: true
      });
    });

    return sortIssuesByLatest(list);
  }, [externalQualityAlerts, urgentIssues]);

  // Active issues calculation (첫 화면 표시용 활성 이슈 - 전 공정 부적합경보(관리자 삭제 전까지 노출) + 활성 회의/공지/오픈이슈)
  const activeIssues = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. 5개 공정 통합 부적합경보
    // 🌟 핵심 규칙: 부적합경보는 조치결과(actionResult / isResolved)가 입력되더라도,
    // 권태형(대표이사), 이명재(이사), 김동욱(책임)이 첫 화면에서 [이 항목 삭제]를 처리할 때까지 계속 노출됨!
    // (기존 부적합경보 중 NE1a 외의 항목들은 이미 권한자가 첫화면 삭제 처리 완료)
    (allQualityAlerts || []).forEach((alert) => {
      if (!alert) return;
      if (isIssueClosed(alert, todayDateStr)) {
        return;
      }

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
  const allMeetings = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => isFirstScreenIssue(i) && isCatMeeting(i.category))), [urgentIssues]);
  const allQualityIssues = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => isFirstScreenIssue(i) && isCatOpenIssue(i.category))), [urgentIssues]);
  const allNotices = useMemo(() => sortIssuesByLatest(urgentIssues.filter((i) => isFirstScreenIssue(i) && isCatNotice(i.category))), [urgentIssues]);

  // 🌟 카테고리별 종료된 건수 (완료/만료/종결/삭제 - 대장 모달 탭 배지 표시용)
  const closedQualityAlertCount = useMemo(() => {
    return (allQualityAlerts || []).filter((it) => isIssueClosed(it, todayDateStr)).length;
  }, [allQualityAlerts, todayDateStr]);

  const closedMeetingCount = useMemo(() => {
    return (allMeetings || []).filter((it) => isIssueClosed(it, todayDateStr)).length;
  }, [allMeetings, todayDateStr]);

  const closedQualityIssueCount = useMemo(() => {
    return (allQualityIssues || []).filter((it) => isIssueClosed(it, todayDateStr)).length;
  }, [allQualityIssues, todayDateStr]);

  const closedNoticeCount = useMemo(() => {
    return (allNotices || []).filter((it) => isIssueClosed(it, todayDateStr)).length;
  }, [allNotices, todayDateStr]);

  const totalClosedCount = useMemo(() => {
    return closedQualityAlertCount + closedMeetingCount + closedQualityIssueCount + closedNoticeCount;
  }, [closedQualityAlertCount, closedMeetingCount, closedQualityIssueCount, closedNoticeCount]);

  // Filtered issues for ledger modal (최신순 정렬 보장 - 종결/삭제 건까지 카테고리별로 통합!)
  const filteredIssues = useMemo(() => {
    let list = [];
    if (ledgerCategoryTab === "quality_alert") {
      list = allQualityAlerts;
    } else if (ledgerCategoryTab === "meeting") {
      list = allMeetings;
    } else if (ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue") {
      list = allQualityIssues;
    } else if (ledgerCategoryTab === "notice") {
      list = allNotices;
    } else {
      // "all" tab
      const seen = new Set();
      const merged = [];
      [...(allQualityAlerts || []), ...(allMeetings || []), ...(allQualityIssues || []), ...(allNotices || [])].forEach((item) => {
        const id = item.id || item._docId || item.customId;
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(item);
        }
      });
      list = merged;
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
  }, [ledgerCategoryTab, selectedScheduleDate, allQualityAlerts, allMeetings, allQualityIssues, allNotices]);

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
    const issueDate = issue.date || issue.startDate || (issue.createdAt ? issue.createdAt.slice(0, 10) : "") || issue.expireDate || todayDateStr;
    const defaultAuthor = issue.author || currentProfile?.name || "현장담당자";
    const defaultActionAuthor = issue.actionAuthor || currentProfile?.name || issue.author || "현장담당자";
    const issueData = {
      category: issue.category || "품질경보",
      plant: issue.plant || "삼랑진공장",
      author: defaultAuthor,
      authorTitle: issue.authorTitle || "",
      date: issueDate,
      startDate: issue.startDate || issueDate,
      expireDate: issue.expireDate || issue.targetDate || issueDate,
      createdAt: issue.createdAt,
      meetingTime: issue.meetingTime || "14:00",
      meetingLocation: issue.meetingLocation || "",
      meetingAgenda: issue.meetingAgenda || issue.content || "",
      attendees: Array.isArray(issue.attendees) ? issue.attendees : [],
      progress: issue.progress || 0,
      title: issue.title || "",
      content: issue.content || "",
      images: issue.images || [],
      actionResult: issue.actionResult || "",
      actionAuthor: defaultActionAuthor,
      actionImages: issue.actionImages || [],
      isResolved: Boolean(issue.isResolved),
      replies: issue.replies || []
    };

    setActionOpinionForm((prev) => ({
      ...prev,
      author: prev.author || defaultActionAuthor,
      actionDate: prev.actionDate || todayDateStr
    }));

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
    const resolvedAuthor =
      (newIssueForm.author && newIssueForm.author.trim()) ||
      (editingIssue?.author && String(editingIssue.author).trim()) ||
      (newIssueForm.actionAuthor && newIssueForm.actionAuthor.trim()) ||
      (currentProfile?.name && currentProfile.name.trim()) ||
      "";
    if (!resolvedAuthor) {
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
      const explicitDate =
        newIssueForm.date ||
        newIssueForm.expireDate ||
        editingIssue?.date ||
        editingIssue?.raw?.date ||
        (editingIssue?.createdAt ? editingIssue.createdAt.slice(0, 10) : todayDateStr);

      const hasActionResult = Boolean(
        (newIssueForm.actionResult && newIssueForm.actionResult.trim().length > 0) ||
        (Array.isArray(newIssueForm.actionImages) && newIssueForm.actionImages.length > 0)
      );
      const effectiveActionAuthor =
        (newIssueForm.actionAuthor && newIssueForm.actionAuthor.trim()) ||
        (editingIssue?.actionAuthor && String(editingIssue.actionAuthor).trim()) ||
        (currentProfile?.name && currentProfile.name.trim()) ||
        resolvedAuthor;
      const nowTimeStr = new Date().toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const isQualityCat =
        newIssueForm.category === "부적합경보" ||
        newIssueForm.category === "품질경보" ||
        editingIssue?.category === "부적합경보" ||
        editingIssue?.category === "품질경보";
      const hadPreviousAction = Boolean(
        editingIssue?.actionResult && String(editingIssue.actionResult).trim().length > 0
      );

      let syncedReplies = Array.isArray(newIssueForm.replies) ? [...newIssueForm.replies] : (Array.isArray(editingIssue?.replies) ? [...editingIssue.replies] : []);
      if (hasActionResult && newIssueForm.actionResult && newIssueForm.actionResult.trim()) {
        const trimmedRes = newIssueForm.actionResult.trim();
        const alreadyInReplies = syncedReplies.some((r) => (r.content || "").trim() === trimmedRes);
        if (!alreadyInReplies) {
          syncedReplies.push({
            id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            author: effectiveActionAuthor,
            authorTitle: currentProfile?.title || "책임",
            plant: newIssueForm.plant || editingIssue?.plant || "삼랑진공장",
            attendanceStatus: "확인",
            actionDate: todayDateStr,
            content: trimmedRes,
            files: newIssueForm.actionImages || [],
            createdAt: nowTimeStr
          });
        }
      }

      const normalizedForm = {
        ...newIssueForm,
        author: resolvedAuthor,
        actionAuthor: hasActionResult ? effectiveActionAuthor : (newIssueForm.actionAuthor || ""),
        actionAt: hasActionResult ? (editingIssue?.actionAt || nowTimeStr) : (editingIssue?.actionAt || ""),
        isResolved: hasActionResult ? true : Boolean(newIssueForm.isResolved),
        status: hasActionResult ? "RESOLVED" : (editingIssue?.status || "ACTIVE"),
        replies: syncedReplies
      };

      if (idStr.startsWith("ext_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("ext_q_", "");
        const { raw: _ignoreRaw, ...restEditing } = editingIssue || {};
        const upObj = {
          ...(editingIssue.raw || {}),
          ...restEditing,
          ...normalizedForm,
          id: targetId,
          date: explicitDate,
          updatedAt: new Date().toISOString()
        };
        await saveExtrusionQualityIssue(upObj);
        setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? upObj : a)));
      } else if (idStr.startsWith("hanul_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("hanul_q_", "");
        const { raw: _ignoreRaw, ...restEditing } = editingIssue || {};
        const upObj = {
          ...(editingIssue.raw || {}),
          ...restEditing,
          ...normalizedForm,
          id: targetId,
          date: explicitDate,
          updatedAt: new Date().toISOString()
        };
        await saveHanulQualityIssue(upObj);
        setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? upObj : a)));
      } else if (idStr.startsWith("ys_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("ys_q_", "");
        const { raw: _ignoreRaw, ...restEditing } = editingIssue || {};
        const upObj = {
          ...(editingIssue.raw || {}),
          ...restEditing,
          ...normalizedForm,
          id: targetId,
          date: explicitDate,
          updatedAt: new Date().toISOString()
        };
        await saveYuseongQualityIssue(upObj);
        setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? upObj : a)));
      } else if (idStr.startsWith("mach_q_")) {
        const targetId = editingIssue.rawId || idStr.replace("mach_q_", "");
        const { raw: _ignoreRaw, ...restEditing } = editingIssue || {};
        const upObj = {
          ...(editingIssue.raw || {}),
          ...restEditing,
          ...normalizedForm,
          id: targetId,
          date: explicitDate,
          updatedAt: new Date().toISOString()
        };
        await saveMachiningQualityIssue(upObj);
        setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? upObj : a)));
      } else {
        const itemToSave = {
          ...(editingIssue || {}),
          ...normalizedForm,
          id: editingIssue?.id || editingIssue?._docId || `issue_${Date.now()}`,
          category: normalizedForm.category || editingIssue?.category || "오픈이슈",
          isDeleted: false, // 🌟 저장/수정 시 항상 활성 상태(isDeleted: false)로 보장하여 첫화면에 정상 노출
          isClosedByAdmin: false,
          deletedBy: "",
          deletedAt: "",
          isFirstScreenOrigin: true, // 🌟 첫 화면에서 등록된 공식 이슈임을 명시
          origin: "FIRST_SCREEN"
        };
        if (editingIssue?.isManuallyRestored !== undefined) {
          itemToSave.isManuallyRestored = Boolean(editingIssue.isManuallyRestored);
        }
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

      if (isQualityCat && hasActionResult && !hadPreviousAction) {
        sendQualityActionTelegram(
          { ...(editingIssue || {}), ...normalizedForm, category: "부적합경보" },
          {
            actionAuthor: effectiveActionAuthor,
            actionContent: normalizedForm.actionResult || "조치 사진 첨부 완료",
            images: normalizedForm.actionImages || []
          }
        ).catch((err) => {
          console.warn("Telegram action notification error:", err);
        });
      }

      // Modal close handling: close both edit and list modal so the user sees the updated item immediately on the first screen
      setIsIssueModalOpen(false);
      setEditingIssue(null);
      setIsIssueDetailMode(true);
      setIsListModalOpen(false);
      setOpenedEditFromListModal(false);

      setRestoreToast(
        hasActionResult && isQualityCat
          ? "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다."
          : editingIssue
          ? "✅ 항목이 성공적으로 수정되었습니다."
          : "✅ 새로운 항목이 등록되었습니다."
      );
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Save issue error:", err);
      alert("항목 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingIssue(false);
    }
  };

  // Restore & Cancel Restore
  const handleRestoreIssue = async (idOrItem, e) => {
    if (e) e.stopPropagation();
    const id = typeof idOrItem === "object" && idOrItem !== null ? idOrItem.id : idOrItem;
    const idStr = String(id || "");
    try {
      if (idStr.startsWith("ext_q_")) {
        const targetId = idStr.replace("ext_q_", "");
        const rawAlert = extrusionQualityAlerts.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveExtrusionQualityIssue(updatedObj);
          setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("hanul_q_")) {
        const targetId = idStr.replace("hanul_q_", "");
        const rawAlert = hanulQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveHanulQualityIssue(updatedObj);
          setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("ys_q_")) {
        const targetId = idStr.replace("ys_q_", "");
        const rawAlert = yuseongQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveYuseongQualityIssue(updatedObj);
          setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("mach_q_")) {
        const targetId = idStr.replace("mach_q_", "");
        const rawAlert = machiningQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveMachiningQualityIssue(updatedObj);
          setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }

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
    const isHard = Boolean(forceHardDelete || issue?.isDeleted || issue?.isClosedByAdmin);
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
          errorMsg: "관리대장 영구삭제는 최고관리자(권태형 대표이사, PIN 0090) 전용 기능입니다."
        }));
        return;
      }
    } else {
      // 🌟 첫 화면 [이 항목 삭제] 권한: 권태형(Admin, 0090), 이명재(11), 김동욱(11) 전용
      const isAuthorizedProfile =
        currentProfile?.role === "ADMIN" ||
        ["권태형", "이명재", "김동욱"].includes(currentProfile?.name);
      const isAuthorizedPin = inputPin === "0090" || inputPin === "11";

      if (!isAuthorizedProfile && !inputPin) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "관리자 확인 PIN 번호(권태형 대표이사 / 이명재 이사 / 김동욱 책임)를 입력해 주세요."
        }));
        return;
      }
      if (!isAuthorizedProfile && !isAuthorizedPin) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "PIN 번호가 일치하지 않습니다. 삭제 권한은 권태형 대표이사, 이명재 이사, 김동욱 책임에게만 있습니다."
        }));
        return;
      }
    }

    setDeleteModalData((prev) => ({ ...prev, isDeleting: true, errorMsg: "" }));

    try {
      const idStr = String(issue.id || "");
      const deleter =
        (currentProfile && ["권태형", "이명재", "김동욱"].includes(currentProfile.name))
          ? currentProfile.name
          : inputPin === "0090" || currentProfile?.role === "ADMIN"
          ? "권태형"
          : issue.plant === "한림공장"
          ? "김동욱"
          : "이명재";

      if (idStr.startsWith("ext_q_")) {
        const targetId = issue.rawId || idStr.replace("ext_q_", "");
        if (isHardDelete) {
          await deleteExtrusionQualityIssue(targetId);
          setExtrusionQualityAlerts((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || extrusionQualityAlerts.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveExtrusionQualityIssue(updatedObj);
          setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("hanul_q_")) {
        const targetId = issue.rawId || idStr.replace("hanul_q_", "");
        if (isHardDelete) {
          await deleteHanulQualityIssue(targetId);
          setHanulQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || hanulQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveHanulQualityIssue(updatedObj);
          setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("ys_q_")) {
        const targetId = issue.rawId || idStr.replace("ys_q_", "");
        if (isHardDelete) {
          await deleteYuseongQualityIssue(targetId);
          setYuseongQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || yuseongQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveYuseongQualityIssue(updatedObj);
          setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("mach_q_")) {
        const targetId = issue.rawId || idStr.replace("mach_q_", "");
        if (isHardDelete) {
          await deleteMachiningQualityIssue(targetId);
          setMachiningQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || machiningQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveMachiningQualityIssue(updatedObj);
          setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else {
        if (isHardDelete) {
          await hardDeleteUrgentIssue(issue.id);
          setUrgentIssues((prev) => prev.filter((i) => i.id !== issue.id));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 데이터베이스에서 영구 삭제되었습니다.`);
        } else {
          await deleteUrgentIssue(issue.id, deleter);
          setUrgentIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, isDeleted: true, deletedBy: deleter } : i)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
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
    if (e && e.stopPropagation) e.stopPropagation();
    const defaultAuthor =
      issue.actionAuthor ||
      issue.author ||
      currentProfile?.name ||
      "현장담당자";

    setActionModalData({
      isOpen: true,
      issue,
      actionResult: issue.actionResult || "",
      actionAuthor: defaultAuthor,
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

  const handleSaveActionResult = async (extraData = null, e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (extraData && extraData.preventDefault) {
      e = extraData;
      extraData = null;
    }
    if (isSavingIssue) return;
    if (!actionModalData.issue) return;

    const issue = actionModalData.issue;
    const isMeetingAction = issue.category === "회의일정" || String(issue.category || "").includes("회의");
    const rawResult = (extraData?.actionResult !== undefined ? extraData.actionResult : (actionModalData.actionResult || "")).trim();
    const actionImagesList = extraData?.actionImages || actionModalData.actionImages || [];

    // 원문 수정 필드 (수정등록 버튼에서 전달된 경우)
    const editedTitle = (extraData?.title || "").trim();
    const editedContent = (extraData?.content || "").trim();

    // 내용 또는 사진, 또는 원문 수정 제목/내용 중 최소 1개는 있어야 저장 가능
    if (!rawResult && actionImagesList.length === 0 && !editedTitle && !editedContent) {
      alert(isMeetingAction ? "회의 결과 내용을 입력해 주세요." : "조치결과 내용 또는 조치 후 사진을 등록해 주세요.");
      return;
    }

    const hasAction = Boolean(rawResult || actionImagesList.length > 0);
    const actionResultText = rawResult || (actionImagesList.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : "");
    const effectiveAuthor = (extraData?.actionAuthor && extraData.actionAuthor.trim())
      || (actionModalData.actionAuthor && actionModalData.actionAuthor.trim())
      || (issue.actionAuthor && issue.actionAuthor.trim())
      || (issue.author && issue.author.trim())
      || (currentProfile?.name && currentProfile.name.trim())
      || "현장담당자";

    setIsSavingIssue(true);
    try {
      const idStr = String(issue.id || issue._docId || "");
      const nowStr = new Date().toISOString();
      const finalTitle = editedTitle || issue.title || issue.content || "";
      const finalContent = editedContent !== "" ? editedContent : (issue.content || "");

      if (idStr.startsWith("ext_q_")) {
        const rawAlert = issue.raw || extrusionQualityAlerts.find((a) => `ext_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("ext_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          details: finalContent,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveExtrusionQualityIssue(updatedObj);
        setExtrusionQualityAlerts((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("hanul_q_")) {
        const rawAlert = issue.raw || hanulQualityIssues.find((a) => `hanul_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("hanul_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveHanulQualityIssue(updatedObj);
        setHanulQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("ys_q_")) {
        const rawAlert = issue.raw || yuseongQualityIssues.find((a) => `ys_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("ys_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          description: finalContent,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveYuseongQualityIssue(updatedObj);
        setYuseongQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("mach_q_")) {
        const rawAlert = issue.raw || machiningQualityIssues.find((a) => `mach_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("mach_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveMachiningQualityIssue(updatedObj);
        setMachiningQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else {
        const targetBase = {
          ...issue,
          title: finalTitle,
          content: finalContent,
          expireDate: extraData?.expireDate || issue.expireDate,
          meetingTime: extraData?.meetingTime || issue.meetingTime,
          meetingLocation: extraData?.meetingLocation || issue.meetingLocation
        };

        let updated;
        if (hasAction) {
          updated = await updateUrgentIssueActionResult(
            issue.id,
            actionResultText,
            effectiveAuthor,
            actionImagesList,
            targetBase
          );
        } else {
          updated = await saveUrgentIssue({
            ...targetBase,
            updatedAt: nowStr
          }, { isNew: false, skipTelegram: true });
        }

        if (updated && !Array.isArray(updated)) {
          setUrgentIssues((prev) => {
            const hasMatch = prev.some((it) => (
              String(it.id) === String(issue.id) ||
              (it._docId && String(it._docId) === String(issue.id)) ||
              (it.customId && String(it.customId) === String(issue.id))
            ));
            return hasMatch
              ? prev.map((it) => (
                  String(it.id) === String(issue.id) ||
                  (it._docId && String(it._docId) === String(issue.id)) ||
                  (it.customId && String(it.customId) === String(issue.id))
                    ? updated
                    : it
                ))
              : [updated, ...prev];
          });
          if (selectedListItem && (String(selectedListItem.id) === String(issue.id) || selectedListItem._docId === issue.id)) {
            setSelectedListItem(updated);
          }
          if (editingIssue && (String(editingIssue.id) === String(issue.id) || editingIssue._docId === issue.id)) {
            setEditingIssue(updated);
          }
        }
      }

      handleCloseActionModal();
      const toastMsg = hasAction
        ? (isMeetingAction ? "✅ 회의 결과가 성공적으로 저장되었습니다." : "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다.")
        : `✅ [${finalTitle}] 항목이 성공적으로 수정·재등록되었습니다.`;
      setRestoreToast(toastMsg);
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Save action error:", err);
      alert("저장 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingIssue(false);
    }
  };

  // 🌟 [제1안] 원문 내용 수정 및 재등록 처리
  const handleSaveIssueEdit = async (editedData) => {
    return handleSaveActionResult(editedData);
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
    const authorName = (actionOpinionForm.author && actionOpinionForm.author.trim())
      || (editingIssue?.actionAuthor && editingIssue.actionAuthor.trim())
      || (editingIssue?.author && editingIssue.author.trim())
      || (currentProfile?.name && currentProfile.name.trim())
      || "현장담당자";
    const authorObj = allWorkers.find((w) => w.name === authorName);
    const targetDate = actionOpinionForm.actionDate || todayDateStr;
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    if (editingIssue?.id) {
      try {
        const idStr = String(editingIssue.id);
        const newReplyObj = {
          id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content || "파일이 첨부되었습니다.",
          files: opinionFiles,
          createdAt: nowStr
        };
        const nextReplies = [...(editingIssue.replies || []), newReplyObj];
        const nextActionImages = Array.from(new Set([...(editingIssue.actionImages || []), ...opinionFiles]));
        const nextActionResult = content || editingIssue.actionResult || "조치 사진 첨부 완료";

        if (idStr.startsWith("ext_q_") || idStr.startsWith("hanul_q_") || idStr.startsWith("ys_q_") || idStr.startsWith("mach_q_")) {
          const { raw: _ignoreRaw, ...restEditing } = editingIssue;
          const baseRaw = editingIssue.raw || {};
          if (idStr.startsWith("ext_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("ext_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveExtrusionQualityIssue(updatedObj);
            setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("hanul_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("hanul_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveHanulQualityIssue(updatedObj);
            setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("ys_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("ys_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveYuseongQualityIssue(updatedObj);
            setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("mach_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("mach_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveMachiningQualityIssue(updatedObj);
            setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          }

          sendQualityActionTelegram({ ...editingIssue, category: "부적합경보" }, {
            actionAuthor: authorName,
            actionContent: nextActionResult,
            images: nextActionImages
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });

          setNewIssueForm((prev) => ({
            ...prev,
            replies: nextReplies,
            isResolved: true,
            actionResult: nextActionResult,
            actionAuthor: authorName,
            actionImages: nextActionImages
          }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
          setRestoreToast("✅ 부적합경보 조치결과가 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
          return;
        }

        const updated = await addIssueReply(editingIssue.id, {
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content || "파일이 첨부되었습니다.",
          files: opinionFiles
        }, editingIssue);
        if (updated) {
          setUrgentIssues((prev) => {
            const hasMatch = prev.some((it) => String(it.id) === String(editingIssue.id) || (it._docId && String(it._docId) === String(editingIssue.id)));
            return hasMatch
              ? prev.map((it) => (String(it.id) === String(editingIssue.id) || (it._docId && String(it._docId) === String(editingIssue.id)) ? updated : it))
              : [updated, ...prev];
          });
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({
            ...prev,
            replies: updated.replies || [],
            isResolved: updated.isResolved,
            actionResult: updated.actionResult,
            actionAuthor: updated.actionAuthor || prev.actionAuthor,
            actionImages: updated.actionImages || prev.actionImages
          }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
          setRestoreToast(isQualityAlert ? "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다." : "✅ 의견이 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
        }
      } catch (err) {
        console.error("Add opinion error:", err);
        alert(isQualityAlert ? "조치결과 등록 중 오류가 발생했습니다." : "의견 등록 중 오류가 발생했습니다.");
      }
    } else {

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
        filesToProcess.map((f) => compressImage(f, 800, 800, 0.65))
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
        filesToProcess.map((f) => compressImage(f, 800, 800, 0.65))
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



  const handleToggleResolvedStatus = async () => {
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
  };


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


  return {
    // States & Setters
    urgentIssues,
    setUrgentIssues,
    extrusionQualityAlerts,
    setExtrusionQualityAlerts,
    hanulQualityIssues,
    setHanulQualityIssues,
    yuseongQualityIssues,
    setYuseongQualityIssues,
    machiningQualityIssues,
    setMachiningQualityIssues,
    isIssueModalOpen,
    setIsIssueModalOpen,
    editingIssue,
    setEditingIssue,
    isListModalOpen,
    setIsListModalOpen,
    openedEditFromListModal,
    setOpenedEditFromListModal,
    selectedListItem,
    setSelectedListItem,
    openActionMenuId,
    setOpenActionMenuId,
    restoreToast,
    setRestoreToast,
    isIssueExpanded,
    setIsIssueExpanded,
    openIssueCategoryFilter,
    setOpenIssueCategoryFilter,
    ledgerCategoryTab,
    setLedgerCategoryTab,
    selectedScheduleDate,
    setSelectedScheduleDate,
    issueModalPage,
    setIssueModalPage,
    isIssueDetailMode,
    setIsIssueDetailMode,
    newIssueForm,
    setNewIssueForm,
    actionModalData,
    setActionModalData,
    deleteModalData,
    setDeleteModalData,
    replyForm,
    setReplyForm,
    isSubmittingReply,
    setIsSubmittingReply,
    actionOpinionForm,
    setActionOpinionForm,
    previewImageModal,
    setPreviewImageModal,
    isProcessingIssueImages,
    setIsProcessingIssueImages,
    isProcessingActionImages,
    setIsProcessingActionImages,
    telegramConfig,
    setTelegramConfig,
    isTelegramModalOpen,
    setIsTelegramModalOpen,
    telegramAdminPinModal,
    setTelegramAdminPinModal,
    testingTelegram,
    sendingClosingBriefing,
    closingBriefingToast,
    telegramTestResult,
    telegramSavedToast,
    isSavingIssue,

    // Memos
    externalQualityAlerts,
    allQualityAlerts,
    activeIssues,
    qualityAlertCount,
    meetingIssuesCount,
    qualityIssueCount,
    noticeIssuesCount,
    displayedActiveIssues,
    allMeetings,
    allQualityIssues,
    allNotices,
    closedQualityAlertCount,
    closedMeetingCount,
    closedQualityIssueCount,
    closedNoticeCount,
    totalClosedCount,
    filteredIssues,
    openIssueScheduleDays,

    // Functions
    isFirstScreenIssue,
    handleSwitchCategory,
    handleOpenNewIssue,
    handleOpenEditIssue,
    handleCloseIssueModal,
    handleOpenDeleteModal,
    handleConfirmDelete,
    handleOpenActionModal,
    handleCloseActionModal,
    handleSaveActionResult,
    handleSaveIssueEdit,
    handleExecuteMeetingResult,
    handleExecuteEditContent,
    handleExecuteRestore,
    handleExecuteCancelRestore,
    handleCancelRestore,
    handleSaveNewIssue,
    handleModalAddOpinion,
    handleModalDeleteOpinion,
    handleModalAddReply,
    handleModalDeleteReply,
    handleIssueFiles,
    handleOpinionFiles,
    handleActionImageFiles,
    handleNewIssueActionImageFiles,
    handleRemoveIssueImage,
    handleRemoveActionImage,
    handleRemoveNewIssueActionImage,
    handleRemoveOpinionFile,
    handleToggleResolvedStatus,
    handleVerifyTelegramAdmin,
    handleSaveTelegramConfig,
    handleTestTelegram,
    handleSendDailyClosingBriefing,
  };

};

export default useAuthModalIssues;
