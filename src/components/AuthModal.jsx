import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  KeyRound,
  ChevronRight,
  Shield,
  Factory,
  ArrowRight,
  QrCode,
  X,
  Sparkles,
  Crown,
  Lock,
  ArrowLeft,
  Smartphone,
  Cpu,
  AlertTriangle,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  Check,
  Pin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Radio,
  Megaphone,
  Clock,
  Send,
  Camera,
  Image as ImageIcon,
  Download,
  ZoomIn,
  Eye,
  FileText,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ListOrdered,
  RotateCcw,
  Filter,
  Calendar,
  MessageSquare,
  MessageCircle,
  Users,
  Save,
  Edit3,
  LayoutList,
  History,
  Pause,
  Play
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  COMPANIES,
  COMPANY_THEMES,
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData
} from "../services/overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData";
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
  sortIssuesByCustomPriority
} from "../services/urgentIssueService";
import { OryukLogo } from "./OryukLogo";
import { TelegramLogo } from "./TelegramLogo";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  setTelegramEnabled,
  toggleTelegramEnabled,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyClosingBriefingTelegram
} from "../services/telegramService";

// Client-side instant image compression
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (dataUrl.length * (3 / 4) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
    };
  });
};

export const AuthModal = () => {
  const { currentProfile, loginWithProfile } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());

  // Urgent Issues State
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null); // Currently editing issue item (수정 모드)
  const [isListModalOpen, setIsListModalOpen] = useState(false); // List Modal Open State
  const [openedEditFromListModal, setOpenedEditFromListModal] = useState(false); // Track if edit form was opened from list modal
  const [selectedListItem, setSelectedListItem] = useState(null); // Selected Item for Details & Restore
  const [openActionMenuId, setOpenActionMenuId] = useState(null); // Row-specific action menu toggle (회의결과입력, 내용수정 등)
  const [restoreToast, setRestoreToast] = useState("");
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);
  const [issueViewMode, setIssueViewMode] = useState("auto"); // "auto" (>=2 is summary) | "summary" | "detailed"
  const [detailIssueModal, setDetailIssueModal] = useState(null); // Fallback / Action modal ref
  const [issueFilterTab, setIssueFilterTab] = useState("all"); // "all" | "unresolved" | "closed" | "deleted"
  const [openIssueCategoryFilter, setOpenIssueCategoryFilter] = useState("all"); // "all" | "quality" | "notice" | "meeting"
  const [ledgerCategoryTab, setLedgerCategoryTab] = useState("all"); // "all" | "open_issue" | "notice" | "meeting"
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(""); // "" or "YYYY-MM-DD" for schedule calendar filter
  const ISSUES_PER_PAGE = 5;
  const [issueModalPage, setIssueModalPage] = useState(1);
  const [isIssueDetailMode, setIsIssueDetailMode] = useState(true); // 🌟 Detail mode (정리된 내용) vs Edit mode toggle

  // New Issue Form State (사진 첨부 및 사내공지/회의일정 만료일자 및 회의시간, 조치결과, 조치사진, 상태 지원)
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

  // Action Result Input Modal State (조치결과 전용 모달 + 조치사진 지원)
  const [actionModalData, setActionModalData] = useState({
    isOpen: false,
    issue: null,
    actionResult: "",
    actionAuthor: "",
    actionImages: []
  });

  // Reply Form State for Meeting Schedule & Issue Comments (회신란)
  const [replyForm, setReplyForm] = useState({
    author: "",
    attendanceStatus: "참석",
    content: ""
  });
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Action Opinion Form State for Open Issue (오픈이슈 조치등록날짜 + 의견 실시간 추가란)
  const [actionOpinionForm, setActionOpinionForm] = useState({
    actionDate: "",
    author: "",
    content: ""
  });

  // Lightbox & Image Processing State
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, name }
  const [isProcessingIssueImages, setIsProcessingIssueImages] = useState(false);
  const [isProcessingActionImages, setIsProcessingActionImages] = useState(false);

  // Telegram Config & Admin Access State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramAdminPinModal, setTelegramAdminPinModal] = useState({
    isOpen: false,
    pinInput: "",
    errorMsg: ""
  });
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingTelegramPnL, setTestingTelegramPnL] = useState(false);
  const [sendingClosingBriefing, setSendingClosingBriefing] = useState(false);
  const [closingBriefingToast, setClosingBriefingToast] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [telegramSavedToast, setTelegramSavedToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  const handleOpenTelegram = () => {
    setTelegramAdminPinModal({
      isOpen: true,
      pinInput: "",
      errorMsg: ""
    });
  };

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
        errorMsg: "관리자(Admin) 전용 기능입니다. PIN 번호(0090)가 일치하지 않습니다."
      }));
    }
  };

  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    await saveTelegramConfig(telegramConfig);
    setTelegramSavedToast(true);
    setTimeout(() => setTelegramSavedToast(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      alert("Bot Token과 Chat ID를 모두 입력해주세요.");
      return;
    }
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await testTelegramConnection(telegramConfig.botToken, telegramConfig.chatId);
      setTelegramTestResult(res);
      if (res.success) {
        await saveTelegramConfig(telegramConfig);
      }
    } catch (err) {
      setTelegramTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSendDailyClosingBriefing = async () => {
    setSendingClosingBriefing(true);
    try {
      const res = await sendDailyClosingBriefingTelegram(null, null, true);
      if (res.success) {
        setClosingBriefingToast(true);
        setTimeout(() => setClosingBriefingToast(false), 3000);
      } else {
        alert("마감브리핑 전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingClosingBriefing(false);
    }
  };

  // Real-time Cloud Synchronization for Annual Leaves
  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  // Real-time Cloud Synchronization for Urgent Issues
  useEffect(() => {
    const unsub = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues);
    });
    return () => unsub();
  }, []);

  // Real-time Cloud Synchronization for Smart Overtime & Attendance Data (5개사 근태)
  useEffect(() => {
    const unsub = subscribeSmartOvertimeData((data) => {
      if (data) setSmartOvertimeData(data);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const todayDateStr = useMemo(() => getKSTDateString(), []);

  // 🕒 실시간 KST 현재 시:분 (HH:mm) 추적 (회의 시작시간 경과 즉시 첫화면 패널 자동 삭제 및 대장 보존)
  const [currentKstTimeStr, setCurrentKstTimeStr] = useState(() => {
    const info = getKSTTimeInfo();
    return `${String(info.hour).padStart(2, "0")}:${String(info.minute).padStart(2, "0")}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const info = getKSTTimeInfo();
      const timeStr = `${String(info.hour).padStart(2, "0")}:${String(info.minute).padStart(2, "0")}`;
      setCurrentKstTimeStr(timeStr);
    };
    const timer = setInterval(updateTime, 10000); // 10초마다 실시간 체크
    return () => clearInterval(timer);
  }, []);

  // Helper: "9:30" -> "09:30" 시간 정규화
  const normalizeMeetingTime = (timeStr) => {
    if (!timeStr) return "";
    const cleaned = String(timeStr).trim();
    const parts = cleaned.split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      return `${h}:${m}`;
    }
    return cleaned;
  };

  // ⭐ Helper: 사내공지 / 회의일정 지정 날짜 및 회의 시작시간 경과 여부 확인 (경과 시 접속화면 자동 숨김/삭제, 대장에만 보존)
  const isItemExpired = (item) => {
    if (!item) return false;

    // ⭐ 사용자가 직접 복구한 항목은 당일 첫 화면에서 자동 만료/삭제되지 않도록 영구 유지
    if (item.isManuallyRestored) return false;

    // 1. 회의일정: 시작 날짜 및 시작시간(meetingTime) 경과 시 첫화면 패널에서 삭제(대장 보존)
    const isMeeting = item.category === "회의일정" || (item.category && item.category.includes("회의"));
    if (isMeeting) {
      const mDate = item.expireDate || item.targetDate || "";
      if (!mDate) return false;
      if (mDate < todayDateStr) return true;
      if (mDate === todayDateStr) {
        const mTime = normalizeMeetingTime(item.meetingTime);
        if (mTime) {
          return currentKstTimeStr >= mTime;
        }
        return false;
      }
      return false;
    }

    // 2. 사내공지 / 공지사항 / 공유사항: 만료일자(자정) 경과 시 삭제(대장 보존)
    const isNotice =
      item.category === "공지사항" ||
      item.category === "사내공지" ||
      item.category === "공유사항";
    if (isNotice) {
      const exp = item.expireDate || item.targetDate;
      if (exp && exp < todayDateStr) {
        return true;
      }
    }
    return false;
  };

  // ⭐ 사내공지 및 회의일정 지정 날짜 / 회의 시작시간 경과 시 자동으로 접속화면 및 DB에서 소프트 삭제 정리 (대장 보존)
  useEffect(() => {
    if (!urgentIssues || urgentIssues.length === 0) return;
    const expiredList = urgentIssues.filter((i) => !i.isDeleted && !i.isManuallyRestored && isItemExpired(i));
    if (expiredList.length > 0) {
      expiredList.forEach((item) => {
        const reason = (item.category === "회의일정" || item.category?.includes("회의"))
          ? `시스템 (회의 시작시간 ${item.meetingTime || ""} 경과 자동 정리)`
          : "시스템 (공지 만료일자 경과 자동 정리)";
        deleteUrgentIssue(item.id, reason).catch(() => {});
      });
    }
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  // Filter categorized issues: 미결(Unresolved), 종결(Closed/Resolved), 전체(All) (우선순위: 품질경보(등록순) -> 회의일정(다가오는날짜순) -> 공지사항(다가오는날짜순))
  const unresolvedIssues = useMemo(() => {
    return sortIssuesByCustomPriority(
      urgentIssues.filter((i) => !i.isDeleted && !i.isResolved && !isItemExpired(i))
    );
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  const closedIssues = useMemo(() => {
    return sortIssuesByCustomPriority(
      urgentIssues.filter((i) => !i.isDeleted && i.isResolved && !isItemExpired(i))
    );
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  const deletedIssues = useMemo(() => {
    return urgentIssues.filter((i) => i.isDeleted);
  }, [urgentIssues]);

  // ⭐ [요청사항 반영] 첫 화면 노출: 품질경보 / 회의일정 / 사내공지 / 오픈이슈 중 미종결(!i.isResolved) 건만 노출
  const activeIssues = useMemo(() => {
    return sortIssuesByCustomPriority(
      urgentIssues.filter((i) => !i.isDeleted && !i.isResolved && !isItemExpired(i))
    );
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  // ⭐ [요청사항 반영] 첫 화면 배지 숫자: 미종결 개수 집계
  const qualityAlertCount = useMemo(() => {
    return activeIssues.filter((i) => i.category === "품질경보").length;
  }, [activeIssues]);

  const meetingIssuesCount = useMemo(() => {
    return activeIssues.filter(
      (i) => i.category === "회의일정" || i.category?.includes("회의")
    ).length;
  }, [activeIssues]);

  const noticeIssuesCount = useMemo(() => {
    return activeIssues.filter(
      (i) =>
        i.category === "공지사항" ||
        i.category === "사내공지" ||
        i.category === "공유사항"
    ).length;
  }, [activeIssues]);

  const qualityIssueCount = useMemo(() => {
    return activeIssues.filter(
      (i) =>
        i.category === "품질이슈" ||
        i.category === "오픈이슈" ||
        (i.category !== "품질경보" &&
          !i.category?.includes("공지") &&
          !i.category?.includes("공유") &&
          !i.category?.includes("회의"))
    ).length;
  }, [activeIssues]);

  // ⭐ 첫 화면 카테고리 필터링 적용된 노출 목록 (전체 • 품질경보 • 회의일정 • 사내공지 • 오픈이슈)
  const displayedActiveIssues = useMemo(() => {
    if (openIssueCategoryFilter === "all") return activeIssues;
    if (openIssueCategoryFilter === "quality_alert" || openIssueCategoryFilter === "qualityAlert") {
      return activeIssues.filter((i) => i.category === "품질경보");
    }
    if (openIssueCategoryFilter === "meeting") {
      return activeIssues.filter((i) => i.category === "회의일정");
    }
    if (openIssueCategoryFilter === "notice") {
      return activeIssues.filter(
        (i) =>
          i.category === "공지사항" ||
          i.category === "사내공지" ||
          i.category === "공유사항"
      );
    }
    if (
      openIssueCategoryFilter === "quality_issue" ||
      openIssueCategoryFilter === "quality" ||
      openIssueCategoryFilter === "open_issue"
    ) {
      return activeIssues.filter(
        (i) =>
          i.category === "품질이슈" ||
          i.category === "오픈이슈" ||
          (i.category !== "품질경보" &&
            !i.category?.includes("공지") &&
            !i.category?.includes("공유") &&
            i.category !== "회의일정")
      );
    }
    return activeIssues;
  }, [activeIssues, openIssueCategoryFilter]);

  const samrangjinActiveCount = useMemo(() => {
    return activeIssues.filter((i) => i.plant === "삼랑진공장").length;
  }, [activeIssues]);

  const hanlimActiveCount = useMemo(() => {
    return activeIssues.filter((i) => i.plant === "한림공장").length;
  }, [activeIssues]);

  const urgentUnresolvedCount = useMemo(() => {
    return activeIssues.filter((i) => !i.isResolved).length;
  }, [activeIssues]);

  const resolvedActiveCount = useMemo(() => {
    return activeIssues.filter((i) => i.isResolved).length;
  }, [activeIssues]);

  const isIssueSummaryMode = useMemo(() => {
    if (issueViewMode === "summary") return true;
    if (issueViewMode === "detailed") return false;
    return activeIssues.length >= 2;
  }, [issueViewMode, activeIssues.length]);

  const unresolvedActiveIssues = unresolvedIssues;

  // Category-specific collections across all active records
  const allQualityAlerts = useMemo(() => {
    return urgentIssues.filter((i) => !i.isDeleted && i.category === "품질경보");
  }, [urgentIssues]);

  const allQualityIssues = useMemo(() => {
    return urgentIssues.filter(
      (i) =>
        !i.isDeleted &&
        (i.category === "품질이슈" ||
          i.category === "오픈이슈" ||
          (i.category !== "품질경보" &&
            !i.category?.includes("공지") &&
            !i.category?.includes("공유") &&
            i.category !== "회의일정"))
    );
  }, [urgentIssues]);

  const allOpenIssues = allQualityIssues;

  const allNotices = useMemo(() => {
    return urgentIssues.filter(
      (i) =>
        !i.isDeleted &&
        (i.category === "공지사항" ||
          i.category === "사내공지" ||
          i.category === "공유사항")
    );
  }, [urgentIssues]);

  const allMeetings = useMemo(() => {
    return urgentIssues.filter((i) => !i.isDeleted && i.category === "회의일정");
  }, [urgentIssues]);

  // 📅 오픈이슈 전용 7일간 일정표 (Schedule Calendar) 계산
  const openIssueScheduleDays = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    // -2일 전부터 +4일 후까지 7일간 생성
    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === todayDateStr;

      const matchedIssues = allOpenIssues.filter((it) => {
        const itemDate = it.expireDate || it.targetDate || it.createdAt?.slice(0, 10);
        return itemDate === dateStr;
      });

      const unres = matchedIssues.filter((it) => !it.isResolved && !it.isDeleted).length;
      const res = matchedIssues.filter((it) => it.isResolved && !it.isDeleted).length;

      days.push({
        dateStr,
        dayName,
        label: `${mm}-${dd}(${dayName})`,
        isToday,
        items: matchedIssues,
        unresolvedCount: unres,
        resolvedCount: res,
        totalCount: matchedIssues.length
      });
    }
    return days;
  }, [allOpenIssues, todayDateStr]);

  // 📅 오픈이슈 등록 모달용 14일 인터랙티브 타임라인 캘린더 생성기 (의견갯수 및 의견등록표시 포함)
  const getOpenIssueFormCalendarDays = (startDateStr, targetDateStr, replies = []) => {
    const days = [];
    const start = startDateStr ? new Date(startDateStr) : new Date();
    
    // 기준일: startDate에서 -1일 전부터 14일간 표시
    const base = new Date(start);
    base.setDate(base.getDate() - 1);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === todayDateStr;
      const isStart = dateStr === startDateStr;
      const isTarget = dateStr === targetDateStr;
      const isInRange = (startDateStr && targetDateStr)
        ? (dateStr >= startDateStr && dateStr <= targetDateStr)
        : false;

      // 해당 일자에 등록된 의견/조치 필터링
      const matchedReplies = (replies || []).filter((r) => {
        const rDate = r.actionDate || r.createdAt?.slice(0, 10);
        return rDate === dateStr;
      });
      const opinionCount = matchedReplies.length;
      const hasOpinions = opinionCount > 0;

      days.push({
        dateStr,
        dayName,
        monthDay: `${Number(mm)}/${Number(dd)}`,
        isToday,
        isStart,
        isTarget,
        isInRange,
        dayIndex: d.getDay(),
        opinionCount,
        hasOpinions,
        replies: matchedReplies
      });
    }
    return days;
  };

  const calcDaysBetween = (d1, d2) => {
    if (!d1 || !d2) return 1;
    const t1 = new Date(d1).getTime();
    const t2 = new Date(d2).getTime();
    const diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const calcDDay = (targetDateStr) => {
    if (!targetDateStr) return { label: "-", color: "text-slate-500" };
    const target = new Date(targetDateStr);
    const today = new Date(todayDateStr);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: "D-Day (오늘 마감)", color: "text-rose-600 font-black animate-pulse" };
    if (diff > 0) return { label: `D-${diff}일 남음`, color: "text-blue-600 font-black" };
    return { label: `D+${Math.abs(diff)}일 경과`, color: "text-slate-500 font-bold" };
  };

  const filteredIssues = useMemo(() => {
    let base = urgentIssues.filter((i) => !i.isDeleted);

    // 대장 모달 카테고리 탭 필터링
    if (ledgerCategoryTab === "quality_alert") {
      base = allQualityAlerts;
    } else if (ledgerCategoryTab === "meeting") {
      base = allMeetings;
    } else if (ledgerCategoryTab === "notice") {
      base = allNotices;
    } else if (ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue") {
      base = allQualityIssues;
      if (selectedScheduleDate) {
        base = base.filter((i) => {
          const itemDate = i.expireDate || i.targetDate || i.createdAt?.slice(0, 10);
          return itemDate === selectedScheduleDate;
        });
      }
    }

    return sortIssuesByCustomPriority(base);
  }, [urgentIssues, ledgerCategoryTab, selectedScheduleDate, allOpenIssues, allNotices, allMeetings, allQualityAlerts, allQualityIssues]);

  // Count workers with active schedule registration for each plant (excluding '할일')
  const samrangjinLeaveCount = useMemo(() => {
    if (!PLANTS[0]?.workers || !annualLeaves) return 0;
    return PLANTS[0].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const hanlimLeaveCount = useMemo(() => {
    if (!PLANTS[1]?.workers || !annualLeaves) return 0;
    return PLANTS[1].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  // 👑 변동사항이 있는 관리자 (본사 대표이사/전무, 공장 총괄관리자 및 책임/선임급 관리자) 실시간 추적
  const managerLeaves = useMemo(() => {
    if (!annualLeaves || annualLeaves.length === 0) return [];

    const candidateManagers = [
      ...ADMIN_USERS,
      ...PLANTS[0].workers.filter(
        (w) => w.title === "이사" || w.title === "책임" || w.title === "선임" || w.assignedProcess?.includes("관리") || w.assignedProcess?.includes("총괄") || w.name === "이명재"
      ),
      ...PLANTS[1].workers.filter(
        (w) => w.title === "이사" || w.title === "책임" || w.title === "선임" || w.assignedProcess?.includes("관리") || w.assignedProcess?.includes("총괄") || w.name === "김동욱"
      )
    ];

    const uniqueManagers = [];
    const seen = new Set();
    candidateManagers.forEach((m) => {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        uniqueManagers.push(m);
      }
    });

    return uniqueManagers
      .map((m) => {
        const leaveStatus = getUserLeaveStatus(m.id, m.name, annualLeaves, { excludeTodo: true });
        if (!leaveStatus) return null;
        return {
          ...m,
          leaveStatus
        };
      })
      .filter(Boolean);
  }, [annualLeaves]);

  // 🏢 5개사별 당일 근태 현황 (결근 및 조퇴 실시간 집계)
  const companyAttendanceStats = useMemo(() => {
    const companies = COMPANIES || ["(주)오륙", "(주)조영산업", "한울", "부림텍", "유성"];
    
    const todayDayNum = parseInt(todayDateStr.split("-")[2], 10) || new Date().getDate();
    const masterWorkers = smartOvertimeData?.masterWorkers || INITIAL_SMART_OVERTIME_DATA?.masterWorkers || [];
    const matrix = smartOvertimeData?.attendanceMatrix || INITIAL_SMART_OVERTIME_DATA?.attendanceMatrix || [];

    // Helper: 작업자 이름 또는 소속 공장 기반으로 5개사 매핑
    const findCompanyForWorker = (name, plant) => {
      const trimmed = String(name || "").trim();
      const found = masterWorkers.find((w) => w.name?.trim() === trimmed);
      if (found?.company) return found.company;
      if (plant === "삼랑진공장") return "(주)오륙";
      if (plant === "한림공장") return "(주)조영산업";
      return "(주)오륙";
    };

    const statsMap = {};
    companies.forEach((comp) => {
      statsMap[comp] = {
        company: comp,
        absentList: [],
        earlyLeaveList: []
      };
    });

    // 1. 연차/근태 데이터 (annualLeaves)에서 오늘 일자 결근/조퇴 건 집계
    if (Array.isArray(annualLeaves)) {
      annualLeaves.forEach((leave) => {
        if (!leave || leave.isCompleted || leave.isDismissed) return;
        const start = leave.startDate || leave.date || "";
        const end = leave.endDate || start;
        if (!start || !end || start > todayDateStr || todayDateStr > end) return;

        const type = String(leave.leaveType || "");
        const reason = String(leave.reason || "");
        const userName = leave.userName?.trim();
        if (!userName) return;

        const comp = findCompanyForWorker(userName, leave.plant);
        if (!statsMap[comp]) return;

        if (type.includes("결근") || reason.includes("결근")) {
          if (!statsMap[comp].absentList.some((x) => x.name === userName)) {
            statsMap[comp].absentList.push({ name: userName, reason: reason || "결근" });
          }
        } else if (type.includes("조퇴") || reason.includes("조퇴")) {
          if (!statsMap[comp].earlyLeaveList.some((x) => x.name === userName)) {
            statsMap[comp].earlyLeaveList.push({ name: userName, reason: reason || "조퇴" });
          }
        }
      });
    }

    // 2. 잔업/근태 매트릭스 (smartOvertimeData.attendanceMatrix)에서 당일 근태 코드 집계
    if (Array.isArray(matrix)) {
      matrix.forEach((w) => {
        const comp = w.company || "(주)오륙";
        if (!statsMap[comp]) return;
        const val = String(w.daily?.[todayDayNum] || "").trim();
        const userName = w.name?.trim();
        if (!userName) return;

        if (val === "결근" || val.includes("결근")) {
          if (!statsMap[comp].absentList.some((x) => x.name === userName)) {
            statsMap[comp].absentList.push({ name: userName, reason: "결근" });
          }
        } else if (val === "조퇴" || val.includes("조퇴")) {
          if (!statsMap[comp].earlyLeaveList.some((x) => x.name === userName)) {
            statsMap[comp].earlyLeaveList.push({ name: userName, reason: "조퇴" });
          }
        }
      });
    }

    return companies.map((comp) => ({
      company: comp,
      absentCount: statsMap[comp].absentList.length,
      absentList: statsMap[comp].absentList,
      earlyLeaveCount: statsMap[comp].earlyLeaveList.length,
      earlyLeaveList: statsMap[comp].earlyLeaveList
    }));
  }, [annualLeaves, smartOvertimeData, todayDateStr]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setRememberMe(false);
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("작업자를 먼저 선택해 주세요.");
      return;
    }
    if (!pin) {
      setErrorMsg("비밀번호(PIN)를 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      loginWithProfile(selectedUser.id, pin, rememberMe);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Upload for New Quality Alert Form (최대 3장)
  const handleIssueImageFiles = async (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;
    setIsProcessingIssueImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setNewIssueForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 3)
      }));
    } catch (err) {
      console.error("Issue image upload error:", err);
    } finally {
      setIsProcessingIssueImages(false);
    }
  };

  const handleRemoveIssueImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  // Handle Image Upload for Action Result Modal (최대 3장)
  const handleActionImageFiles = async (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;
    setIsProcessingActionImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setActionModalData((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...processed].slice(0, 3)
      }));
    } catch (err) {
      console.error("Action image upload error:", err);
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveActionImage = (idx) => {
    setActionModalData((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Open Edit Urgent Issue Modal (기존 품질경보/공지/회의/오픈이슈 상세 조회 및 조치/수정)
  const handleOpenEditIssue = (issue, e, directEditMode = false, fromList = false) => {
    if (e) e.stopPropagation();
    if (fromList) {
      setOpenedEditFromListModal(true);
      setIsListModalOpen(false);
    }
    const defaultAuthor = issue.author === "방상국" ? "" : (issue.author || currentProfile?.name || "권태형");
    const defaultTitle = issue.author === "방상국" ? "" : (issue.authorTitle || "대표이사");
    setEditingIssue(issue);
    setNewIssueForm({
      id: issue.id,
      category: issue.category || "오픈이슈",
      plant: issue.plant || "삼랑진공장",
      author: defaultAuthor,
      authorTitle: defaultTitle,
      startDate: issue.startDate || issue.createdDate || todayDateStr,
      expireDate: issue.expireDate || issue.targetDate || todayDateStr,
      meetingTime: issue.meetingTime || "14:00",
      progress: issue.progress !== undefined ? Number(issue.progress) : (issue.isResolved ? 100 : 0),
      title: issue.title || issue.content || "",
      content: issue.content || issue.title || "",
      images: issue.images ? [...issue.images] : [],
      actionResult: issue.actionResult || "",
      actionAuthor: issue.actionAuthor === "방상국" ? "" : (issue.actionAuthor || ""),
      actionImages: issue.actionImages ? [...issue.actionImages] : [],
      isResolved: issue.isResolved || false,
      replies: issue.replies ? [...issue.replies] : []
    });
    setActionOpinionForm({
      actionDate: todayDateStr,
      author: currentProfile?.name || "",
      content: ""
    });
    setIsIssueDetailMode(!directEditMode); // 🌟 directEditMode = true면 바로 수정폼으로 진입
    setIsIssueModalOpen(true);
  };

  // Close Issue Modal with clean overlay stacking
  const handleCloseIssueModal = () => {
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    if (openedEditFromListModal) {
      setIsListModalOpen(true);
      setOpenedEditFromListModal(false);
    }
  };

  // Action Images upload for Unified Issue Modal
  const handleNewIssueActionImageFiles = async (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;
    setIsProcessingActionImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setNewIssueForm((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...processed].slice(0, 3)
      }));
    } catch (err) {
      console.error("New issue action image error:", err);
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveNewIssueActionImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Submit New or Edited Urgent Issue
  const handleSaveNewIssue = async (e) => {
    if (e) e.preventDefault();

    const authorName = newIssueForm.author?.trim() || editingIssue?.author || currentProfile?.name || "권태형";
    const authorObj = allWorkers.find((w) => w.name === authorName);
    const authorTitle = newIssueForm.authorTitle || authorObj?.title || editingIssue?.authorTitle || "선임";

    const rawTitle = newIssueForm.title?.trim() || "";
    const rawContent = newIssueForm.content?.trim() || "";
    if (!rawTitle && !rawContent) {
      alert("제목 또는 상세 전달 내용을 입력해 주세요.");
      return;
    }
    const finalTitle = rawTitle || rawContent;
    const finalContent = rawContent || rawTitle;

    const isNoticeOrMeeting =
      newIssueForm.category === "공지사항" ||
      newIssueForm.category === "사내공지" ||
      newIssueForm.category === "공유사항" ||
      newIssueForm.category === "회의일정";
    const effectiveExpireDate = isNoticeOrMeeting
      ? newIssueForm.expireDate || todayDateStr
      : newIssueForm.expireDate || "";
    const effectiveMeetingTime =
      newIssueForm.category === "회의일정"
        ? newIssueForm.meetingTime || "14:00"
        : "";

    const hasAction = Boolean(newIssueForm.actionResult && newIssueForm.actionResult.trim());
    const nowTimeStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const finalIsResolved = newIssueForm.isResolved !== undefined
      ? newIssueForm.isResolved
      : (hasAction ? true : Boolean(editingIssue?.isResolved));

    if (hasAction && (!newIssueForm.actionAuthor || !newIssueForm.actionAuthor.trim())) {
      newIssueForm.actionAuthor = authorName;
    }

    const isManuallyRestored = Boolean(
      editingIssue?.isManuallyRestored ||
      effectiveExpireDate >= todayDateStr ||
      (editingIssue?.isDeleted && effectiveExpireDate >= todayDateStr)
    );

    const shouldReactivate = editingIssue ? (effectiveExpireDate >= todayDateStr || isManuallyRestored) : true;
    const finalIsDeleted = shouldReactivate ? false : Boolean(editingIssue?.isDeleted);

    const saved = await saveUrgentIssue({
      ...newIssueForm,
      id: editingIssue ? editingIssue.id : undefined,
      category: newIssueForm.category || "오픈이슈",
      author: authorName,
      authorTitle: authorTitle,
      title: finalTitle,
      content: finalContent,
      startDate: newIssueForm.startDate || todayDateStr,
      expireDate: effectiveExpireDate,
      targetDate: effectiveExpireDate,
      meetingTime: effectiveMeetingTime,
      progress: newIssueForm.category === "오픈이슈"
        ? (newIssueForm.progress !== undefined ? Number(newIssueForm.progress) : (finalIsResolved ? 100 : 0))
        : (newIssueForm.progress || 0),
      images: newIssueForm.images || [],
      actionImages: newIssueForm.actionImages || [],
      actionResult: newIssueForm.actionResult || "",
      actionAuthor: hasAction ? (newIssueForm.actionAuthor || authorName) : (editingIssue?.actionAuthor || ""),
      actionAt: hasAction ? (editingIssue?.actionAt || nowTimeStr) : (editingIssue?.actionAt || ""),
      isResolved: finalIsResolved,
      isDeleted: finalIsDeleted,
      isManuallyRestored: isManuallyRestored,
      createdAt: editingIssue ? editingIssue.createdAt : undefined,
      replies: newIssueForm.replies || (editingIssue ? (editingIssue.replies || []) : [])
    });

    if (saved) {
      setUrgentIssues((prev) => {
        const idx = prev.findIndex((it) => it.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return sortIssuesByCustomPriority(next);
        }
        return sortIssuesByCustomPriority([saved, ...prev]);
      });
      setSelectedListItem(saved);
      setDetailIssueModal(saved);
    }

    setNewIssueForm({
      category: "오픈이슈",
      plant: "삼랑진공장",
      author: "",
      authorTitle: "",
      startDate: todayDateStr,
      expireDate: todayDateStr,
      meetingTime: "14:00",
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
    setActionOpinionForm({
      actionDate: "",
      author: "",
      content: ""
    });
    setEditingIssue(null);
    setIsIssueModalOpen(false);
    if (openedEditFromListModal) {
      setIsListModalOpen(true);
      setOpenedEditFromListModal(false);
    }

    setRestoreToast("✅ 수정 내용이 성공적으로 저장되었습니다.");
    setTimeout(() => setRestoreToast(""), 3500);
  };

  // Add Reply from within Modal (회의일정/공지사항/품질경보)
  const handleModalAddReply = async (e) => {
    if (e) e.preventDefault();
    if (!editingIssue?.id) return;
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
      const updated = await addIssueReply(editingIssue.id, {
        author: replyForm.author,
        authorTitle: authorObj?.title || "선임",
        plant: authorObj?.plantName || "삼랑진공장",
        attendanceStatus: replyForm.attendanceStatus,
        content: replyForm.content.trim()
      });
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
        setEditingIssue(updated);
        setNewIssueForm((prev) => ({
          ...prev,
          replies: updated.replies || []
        }));
        setReplyForm((prev) => ({ ...prev, content: "" }));
      }
    } catch (err) {
      console.error("Add reply error:", err);
      alert("회신 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleModalDeleteReply = async (replyId, e) => {
    if (e) e.stopPropagation();
    if (!confirm("해당 회신을 삭제하시겠습니까?")) return;
    if (!editingIssue?.id) return;
    try {
      const updated = await deleteIssueReply(editingIssue.id, replyId);
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
        setEditingIssue(updated);
        setNewIssueForm((prev) => ({
          ...prev,
          replies: updated.replies || []
        }));
      }
    } catch (err) {
      console.error("Delete reply error:", err);
    }
  };

  // 💬 🌟 오픈이슈 전용 조치등록날짜 + 의견 실시간 추가 핸들러
  const handleModalAddOpinion = async (e) => {
    if (e) e.preventDefault();
    if (!actionOpinionForm.author || !actionOpinionForm.author.trim()) {
      alert("작성자를 직접 선택해 주세요.");
      return;
    }
    if (!actionOpinionForm.content.trim()) {
      alert("조치 의견 또는 진행 내용을 입력해 주세요.");
      return;
    }
    const targetDate = actionOpinionForm.actionDate || todayDateStr;
    const authorName = actionOpinionForm.author;
    const authorObj = allWorkers.find((w) => w.name === authorName);
    const content = actionOpinionForm.content.trim();

    if (editingIssue?.id) {
      try {
        const updated = await addIssueReply(editingIssue.id, {
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content
        });
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({
            ...prev,
            replies: updated.replies || []
          }));
          setActionOpinionForm((prev) => ({ ...prev, content: "" }));
        }
      } catch (err) {
        console.error("Add opinion error:", err);
        alert("의견 등록 중 오류가 발생했습니다.");
      }
    } else {
      const nowStr = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const newOp = {
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        author: authorName,
        authorTitle: authorObj?.title || "선임",
        plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
        attendanceStatus: "확인",
        actionDate: targetDate,
        content: content,
        createdAt: nowStr
      };

      setNewIssueForm((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), newOp]
      }));
      setActionOpinionForm((prev) => ({ ...prev, content: "" }));
    }
  };

  const handleModalDeleteOpinion = async (opId, e) => {
    if (e) e.stopPropagation();
    if (!confirm("해당 의견을 삭제하시겠습니까?")) return;
    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, opId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({
            ...prev,
            replies: updated.replies || []
          }));
        }
      } catch (err) {
        console.error("Delete opinion error:", err);
      }
    } else {
      setNewIssueForm((prev) => ({
        ...prev,
        replies: (prev.replies || []).filter((r) => r.id !== opId)
      }));
    }
  };

  // Delete Issue Authorization Modal State (삼랑진공장: 이명재 / 한림공장: 김동욱 권한 부여)
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    issue: null,
    pinInput: "",
    errorMsg: ""
  });

  // Open Action Result Modal
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

  // Save Action Result (누구나 작성 및 수정 가능 + 사진 첨부)
  const handleSaveActionResult = async (e) => {
    e.preventDefault();
    if (!actionModalData.issue) return;
    if (!actionModalData.actionAuthor || !actionModalData.actionAuthor.trim()) {
      alert("조치자(또는 작성자)를 직접 선택해 주세요.");
      return;
    }
    if (!actionModalData.actionResult.trim()) {
      alert("조치결과 내용을 입력해 주세요.");
      return;
    }

    const updated = await updateUrgentIssueActionResult(
      actionModalData.issue.id,
      actionModalData.actionResult,
      actionModalData.actionAuthor,
      actionModalData.actionImages || []
    );

    if (updated) {
      setUrgentIssues((prev) =>
        prev.map((it) => (it.id === actionModalData.issue.id ? updated : it))
      );
      if (selectedListItem && selectedListItem.id === actionModalData.issue.id) {
        setSelectedListItem(updated);
      }
      if (editingIssue && editingIssue.id === actionModalData.issue.id) {
        setEditingIssue(updated);
      }
    }

    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "",
      actionImages: []
    });

    setRestoreToast("✅ 회의/조치 결과가 성공적으로 저장되었습니다.");
    setTimeout(() => setRestoreToast(""), 3500);
  };

  // Close Action Modal with clean overlay stacking
  const handleCloseActionModal = () => {
    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "",
      actionImages: []
    });
  };

  // ⭐ 4대 리스트 대장 항목 전용 액션 즉시 실행 핸들러 (이벤트 버블링 완전 차단 및 상위 레이어 모달 스택 오픈)
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
    handleOpenEditIssue(item, e, true, true);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await handleRestoreIssue(item.id, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteCancelRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await handleCancelRestore(item, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  // Add Reply to Meeting Schedule or Issue (회신란)
  const handleAddReply = async (issueId, e) => {
    if (e) e.preventDefault();
    if (!issueId) return;
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
      const updated = await addIssueReply(issueId, {
        author: replyForm.author,
        authorTitle: authorObj?.title || "선임",
        plant: authorObj?.plantName || "삼랑진공장",
        attendanceStatus: replyForm.attendanceStatus,
        content: replyForm.content.trim()
      });
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === issueId ? updated : it)));
        setDetailIssueModal(updated);
        setReplyForm((prev) => ({ ...prev, content: "" }));
      }
    } catch (err) {
      console.error("Add reply error:", err);
      alert("회신 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete Reply (회신 삭제)
  const handleDeleteReply = async (issueId, replyId, e) => {
    if (e) e.stopPropagation();
    if (!confirm("해당 회신을 삭제하시겠습니까?")) return;
    try {
      const updated = await deleteIssueReply(issueId, replyId);
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === issueId ? updated : it)));
        setDetailIssueModal(updated);
      }
    } catch (err) {
      console.error("Delete reply error:", err);
    }
  };

  // Open Delete Authority Modal (삭제 권한: 이명재 이사, 김동욱 책임)
  const handleOpenDeleteModal = (issue, e) => {
    if (e) e.stopPropagation();
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    setDeleteModalData({
      isOpen: true,
      issue,
      pinInput: "",
      errorMsg: ""
    });
  };

  // Confirm Delete with Authority Verification (이명재 / 김동욱 / 관리자 전용)
  const handleConfirmDelete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (deleteModalData.isDeleting) return;

    const issue = deleteModalData.issue;
    if (!issue) {
      setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "", isDeleting: false });
      return;
    }

    const plant = issue.plant;
    const inputPin = String(deleteModalData.pinInput || "").trim();

    // Authority Rules:
    // 공장 총괄관리자/작업자: "11", 본사 최고관리자: "0090", 또는 모든 1자리 이상 입력 지원
    const isAuthorized = inputPin.length >= 1 || Boolean(currentProfile);

    if (!isAuthorized) {
      setDeleteModalData((prev) => ({
        ...prev,
        errorMsg: "확인 PIN(11 또는 0090)을 입력해 주세요."
      }));
      return;
    }

    let expectedManager = "총괄관리자";
    if (inputPin === "11") {
      expectedManager = plant === "한림공장" ? "김동욱 책임" : "이명재 이사";
    } else if (inputPin === "0090" || currentProfile?.role === "ADMIN") {
      expectedManager = "총괄관리자(Admin)";
    } else {
      expectedManager = currentProfile?.name || (plant === "한림공장" ? "김동욱 책임" : "이명재 이사");
    }

    const issueId = String(issue.id || "");
    const docId = String(issue._docId || issue.id || "");
    const customId = String(issue.customId || "");

    // 1. Optimistic instant removal from React state
    setUrgentIssues((prev) =>
      prev.filter(
        (it) =>
          String(it.id) !== issueId &&
          String(it.id) !== docId &&
          String(it._docId) !== issueId &&
          String(it._docId) !== docId &&
          (!customId || (String(it.customId) !== customId && String(it.id) !== customId))
      )
    );

    // 2. Close all related modal states immediately
    setSelectedListItem(null);
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    setDetailIssueModal(null);
    setOpenActionMenuId(null);
    setDeleteModalData({
      isOpen: false,
      issue: null,
      pinInput: "",
      errorMsg: "",
      isDeleting: false
    });
    setRestoreToast("🗑️ 항목이 정상적으로 삭제되었습니다.");
    setTimeout(() => setRestoreToast(""), 3500);

    // 3. Complete Firestore and LocalStorage deletion
    try {
      const updated = await deleteUrgentIssue(issueId, expectedManager);
      if (Array.isArray(updated)) {
        setUrgentIssues(
          updated.filter(
            (it) =>
              String(it.id) !== issueId &&
              String(it.id) !== docId &&
              String(it._docId) !== issueId &&
              String(it._docId) !== docId
          )
        );
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Restore Soft-Deleted Issue (삭제 취소 및 첫화면 복구)
  const handleRestoreIssue = async (issueId, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await restoreUrgentIssue(issueId);
      if (Array.isArray(updated)) {
        setUrgentIssues(updated);
        const restored = updated.find((i) => i.id === issueId);
        if (restored) {
          setSelectedListItem(restored);
          setDetailIssueModal(restored);
        }
      }
      setIssueFilterTab("all");
      setIsIssueExpanded(true);
      setRestoreToast("✅ 해당 항목이 첫화면으로 정상 복구되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Restore error:", err);
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  // Cancel Restore (복구 취소 - 첫화면에서 내리고 관리목록으로 이동)
  const handleCancelRestore = async (issue, e) => {
    if (e) e.stopPropagation();
    if (!issue?.id) return;
    if (!confirm("해당 항목의 복구를 취소하고 첫 화면에서 내리시겠습니까?\n(관리목록/대장에는 보관되며 언제든 다시 복구할 수 있습니다.)")) {
      return;
    }

    try {
      const updated = await cancelRestoreUrgentIssue(issue.id, "복구 취소 (사용자)");
      if (Array.isArray(updated)) {
        setUrgentIssues(updated);
        const delItem = updated.find((i) => i.id === issue.id);
        if (delItem) {
          setSelectedListItem(delItem);
        }
      }
      setIsIssueModalOpen(false);
      setEditingIssue(null);
      if (openedEditFromListModal) {
        setIsListModalOpen(true);
        setOpenedEditFromListModal(false);
      }
      setRestoreToast("↩️ 첫화면 복구가 취소되어 관리목록으로 이동되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Cancel restore error:", err);
      alert("복구 취소 처리 중 오류가 발생했습니다.");
    }
  };

  // All workers list for author dropdown (👑 본사 권태형 대표이사, 최미영 전무 포함)
  const allWorkers = useMemo(() => {
    const list = [];
    // 👑 1. 본사 최고 관리자 (권태형 대표이사, 최미영 전무)
    ADMIN_USERS.forEach((a) => {
      list.push({ ...a, plantName: "본사" });
    });
    // 🏢 2. 삼랑진공장, 한림공장 작업자
    PLANTS.forEach((p) => {
      p.workers.forEach((w) => {
        list.push({ ...w, plantName: p.name });
      });
    });
    return list;
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-xl animate-fadeIn p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start min-h-screen max-w-full">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card with Glassmorphism */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3.5 sm:p-6 sm:px-7">
          {/* Header Brand with Bright OryukLogo (Click to Enter Admin Mode) */}
          <div className="text-center mb-3 sm:mb-4 flex flex-col items-center">
            {/* Bright, Elevated Logo Container - Clickable for Admin Access */}
            <div
              onClick={() => handleUserClick(ADMIN_USERS[0])}
              className="relative mb-2 cursor-pointer group active:scale-95 transition-transform"
              title="오륙 로고를 클릭하여 관리자(Admin) 모드로 진입합니다"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-80 transition-opacity animate-pulse"></div>
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-1.5 sm:p-2 shadow-xl border-2 border-white/80 dark:border-slate-700 flex items-center justify-center group-hover:border-blue-400 group-hover:shadow-blue-500/25 transition-all">
                <OryukLogo className="w-7 h-7 sm:w-10 sm:h-10 drop-shadow-md group-hover:scale-105 transition-transform" />
              </div>
            </div>

            <h2 className="text-base sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-blue-600 dark:text-blue-400">
                (주)오륙
              </span>
              <span>생산관리 통합시스템</span>
            </h2>
          </div>

          {/* ========================================================================= */}
          {/* 📢 ⭐ 실시간 공지 & 오픈이슈 실시간 라이브 보드 */}
          {/* ========================================================================= */}
          <div className="mb-3.5 sm:mb-5 rounded-2xl border-2 border-rose-300/80 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20 shadow-md overflow-hidden transition-all min-w-0">
            {/* Panel Top Bar: Metrics & Actions */}
            <div className="p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between gap-2 border-b-2 border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-r from-rose-100/80 via-purple-50/60 to-emerald-50/60 dark:from-rose-950/70 dark:via-purple-950/50 dark:to-emerald-950/50">
              {/* Left: Title & Icon */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-2xs shrink-0">
                  <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h3 className="font-black text-xs sm:text-sm md:text-base text-slate-900 dark:text-white tracking-tight truncate">
                  실시간 공지 & 오픈이슈 현황
                </h3>
              </div>

              {/* Right: [목록] [등록] (60% 사이즈) & Fold/Unfold */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(true);
                    setSelectedListItem(null);
                    setIssueFilterTab("all");
                    setIssueModalPage(1);
                  }}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10.5px] sm:text-xs font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center gap-0.5 sm:gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
                  title="오픈이슈 목록 전체 보기"
                >
                  <ListOrdered className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                  <span>목록</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetCategory =
                      openIssueCategoryFilter === "meeting"
                        ? "회의일정"
                        : openIssueCategoryFilter === "notice"
                        ? "공지사항"
                        : openIssueCategoryFilter === "quality_alert"
                        ? "품질경보"
                        : "오픈이슈";

                    setEditingIssue(null);
                    setIsIssueDetailMode(false); // 🌟 신규 등록 폼 모드로 열기
                    setNewIssueForm({
                      category: targetCategory,
                      plant: "삼랑진공장",
                      author: "", // 🌟 직접 선택하도록 초기화
                      authorTitle: "",
                      startDate: todayDateStr,
                      expireDate: todayDateStr,
                      meetingTime: "14:00",
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
                    setActionOpinionForm({
                      actionDate: todayDateStr,
                      author: "",
                      content: ""
                    });
                    setIsIssueModalOpen(true);
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-md"
                  title="신규 오픈이슈/공지/회의/품질경보 등록"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>등록</span>
                </button>

                {/* Fold/Unfold Button */}
                {activeIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsIssueExpanded((prev) => !prev)}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title={isIssueExpanded ? "패널 접기" : "패널 펼치기"}
                  >
                    {isIssueExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (전체 뱃지 삭제, 4개 카테고리 미결 개수만 노출) */}
            {isIssueExpanded && activeIssues.length > 0 && (
              <div className="px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-rose-100 dark:border-rose-900/30 text-[11px] scrollbar-none">
                {/* 1) 품질경보 */}
                <button
                  type="button"
                  onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "quality_alert" ? "all" : "quality_alert"))}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    openIssueCategoryFilter === "quality_alert"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🚨 품질경보 ({qualityAlertCount})</span>
                </button>

                {/* 2) 회의일정 */}
                <button
                  type="button"
                  onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "meeting" ? "all" : "meeting"))}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    openIssueCategoryFilter === "meeting"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📅 회의일정 ({meetingIssuesCount})</span>
                </button>

                {/* 3) 사내공지 */}
                <button
                  type="button"
                  onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "notice" ? "all" : "notice"))}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    openIssueCategoryFilter === "notice"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📢 사내공지 ({noticeIssuesCount})</span>
                </button>

                {/* 4) 오픈이슈 */}
                <button
                  type="button"
                  onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "open_issue" || prev === "quality_issue" || prev === "quality" ? "all" : "open_issue"))}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    openIssueCategoryFilter === "open_issue" || openIssueCategoryFilter === "quality_issue" || openIssueCategoryFilter === "quality"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📌 오픈이슈 ({qualityIssueCount})</span>
                </button>
              </div>
            )}

            {/* Empty State when no active issues */}
            {activeIssues.length === 0 && (
              <div className="p-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
                ✨ 현재 미결된 오픈이슈 및 공지사항이 없습니다. (상단 [목록] 버튼으로 전체 이력 조회 가능)
              </div>
            )}

            {/* Issue Cards List */}
            {isIssueExpanded && displayedActiveIssues.length > 0 && (
              <div className="p-2 sm:p-3 space-y-2">
                {displayedActiveIssues.map((item) => {
                  const isMeeting = item.category === "회의일정";
                  const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
                  const isOpenIssue = item.category === "오픈이슈" || item.category === "품질이슈";
                  const isQualityAlert = item.category === "품질경보";
                  const imgCount = (item.images?.length || 0) + (item.actionImages?.length || 0);
                  const repliesCount = item.replies?.length || 0;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        const catTab =
                          isQualityAlert
                            ? "quality_alert"
                            : isMeeting
                            ? "meeting"
                            : isNotice
                            ? "notice"
                            : "open_issue";
                        setLedgerCategoryTab(catTab);
                        setSelectedListItem(null);
                        setIssueModalPage(1);
                        setIsListModalOpen(true);
                      }}
                      className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col gap-2 shadow-2xs cursor-pointer hover:shadow-md hover:border-blue-400 dark:hover:border-blue-700 active:scale-[0.99] group ${
                        item.isResolved
                          ? "bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                          : isQualityAlert
                          ? "bg-rose-50/50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-400/20"
                          : isMeeting
                          ? "bg-purple-50/50 dark:bg-purple-950/25 border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-400/20"
                          : isNotice
                          ? "bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/20"
                          : "bg-blue-50/50 dark:bg-blue-950/25 border-blue-300 dark:border-blue-900/80 ring-1 ring-blue-400/20"
                      }`}
                      title="탭하여 목록(대장)으로 이동"
                    >
                      {/* 1단: 상태 배지 + 공장 + 일시 + 사진 + 의견수 + 조치버튼 + 삭제버튼 (품질경보와 100% 동일 텍스트 크기) */}
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60 flex-wrap">
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {isQualityAlert ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white shrink-0 shadow-2xs">
                              🚨 품질경보
                            </span>
                          ) : isMeeting ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-600 text-white shrink-0 shadow-2xs">
                              📅 회의일정
                            </span>
                          ) : isNotice ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shrink-0 shadow-2xs">
                              📢 사내공지
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0 shadow-2xs flex items-center gap-1">
                              <Pin className="w-3 h-3 text-cyan-300" />
                              <span>📌 오픈이슈</span>
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-black shrink-0 ${
                            item.plant === "한림공장"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                              : item.plant === "삼랑진공장"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                              : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                          }`}>
                            {item.plant}
                          </span>
                          {item.expireDate && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold shrink-0 font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {isQualityAlert
                                ? `🚨 등록일: ${item.expireDate.slice(5)}`
                                : isMeeting
                                ? `📅 회의: ${item.expireDate.slice(5)}${item.meetingTime ? ` ${item.meetingTime}` : ""}`
                                : isNotice
                                ? `📅 만료: ~${item.expireDate.slice(5)}`
                                : `📅 목표: ${item.expireDate.slice(5)}`}
                            </span>
                          )}
                          {item.author && (
                            <span className="text-[10.5px] text-slate-400 hidden sm:inline font-medium">
                              등록: {item.author} {item.authorTitle || ""}
                            </span>
                          )}
                        </div>

                        {/* 우측 조치 버튼 & 사진 수 & 의견 수 & 삭제 버튼 */}
                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          {isOpenIssue && repliesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>의견 {repliesCount}건</span>
                            </span>
                          )}
                          {!isMeeting && imgCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-rose-500" />
                              <span>{imgCount}</span>
                            </span>
                          )}
                          {!isMeeting && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenActionModal(item, e);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                                item.isResolved
                                  ? "bg-emerald-600 text-white"
                                  : isQualityAlert
                                  ? "bg-rose-600 text-white hover:bg-rose-500 group-hover:shadow-md"
                                  : isOpenIssue
                                  ? "bg-blue-600 text-white hover:bg-blue-500 group-hover:shadow-md"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500 group-hover:shadow-md"
                              }`}
                              title="조치 결과 입력"
                            >
                              <span>
                                {item.isResolved ? "조치완료 ✓" : "조치입력 ➜"}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteModal(item, e);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                            title="이 항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2단: 전체 너비 제목 및 내용 (품질경보와 100% 동일한 텍스트 크기 text-xs sm:text-sm md:text-base) */}
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm md:text-base font-black leading-snug break-words group-hover:underline ${
                          isQualityAlert
                            ? "text-rose-700 dark:text-rose-300"
                            : isMeeting
                            ? "text-purple-800 dark:text-purple-300"
                            : isNotice
                            ? "text-slate-900 dark:text-white"
                            : "text-blue-800 dark:text-blue-300"
                        }`}>
                          {item.title || item.content}
                        </h4>
                        {item.title && item.content && (
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                            {item.content}
                          </p>
                        )}
                      </div>

                      {/* 3단: 조치 결과 (품질경보/사내공지/오픈이슈 노출) */}
                      {!isMeeting && item.actionResult && (
                        <div className="text-[11px] sm:text-xs pt-0.5 break-words">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            └ 조치결과: {item.actionResult}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedUser ? (
            <div className="space-y-2.5 sm:space-y-3">
              {/* ========================================================================= */}
              {/* 1. FACTORY 1: 삼랑진공장 (이명재 그라데이션 강조) */}
              {/* ========================================================================= */}
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">삼랑진공장</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                      samrangjinLeaveCount > 0
                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      <Calendar className="w-2.5 h-2.5" />
                      <span>일정등록 {samrangjinLeaveCount}명</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {PLANTS[0].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
                  {PLANTS[0].workers.map((worker) => {
                    const isMyeongjae = worker.name === "이명재" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
                    const hasLeave = Boolean(leaveStatus);
                    const isLeaveToday = Boolean(leaveStatus?.isToday);

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                        className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                          isMyeongjae
                            ? `border-amber-400 bg-amber-700 shadow-md ${
                                isLeaveToday ? "ring-2 ring-rose-500 animate-pulse" : ""
                              }`
                            : isLeaveToday
                            ? "border-rose-500 bg-slate-900 ring-2 ring-rose-400/80 animate-pulse text-white shadow-xs"
                            : hasLeave
                            ? "border-blue-400 dark:border-blue-500 bg-slate-900 text-white shadow-2xs"
                            : isPartner
                            ? "border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        }`}
                      >
                        {/* 좌측: 이름 구역 (39%) */}
                        <div className={`w-[39%] sm:w-[38%] flex items-center justify-center px-0.5 sm:px-1 text-center shrink-0 ${
                          isMyeongjae
                            ? "bg-amber-800"
                            : isLeaveToday
                            ? "bg-rose-950/90"
                            : hasLeave
                            ? "bg-blue-950/90"
                            : isPartner
                            ? "bg-purple-50 dark:bg-purple-950/50"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}>
                          <span className={`font-black whitespace-nowrap leading-none ${
                            hasLeave
                              ? "text-[10px] sm:text-[12.5px] tracking-tighter"
                              : "text-xs sm:text-[13px] tracking-tight"
                          } ${
                            isMyeongjae
                              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                              : isLeaveToday || hasLeave
                              ? "text-white font-black"
                              : "text-slate-950 dark:text-white font-black"
                          }`}>
                            {worker.name}
                          </span>
                        </div>

                        {/* 우측: 상태 구역 (61% - 여백 없이 맞닿는 분할 플레이트) */}
                        <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                          isMyeongjae
                            ? hasLeave
                              ? "bg-rose-600 text-white border-l-2 border-amber-400"
                              : "bg-amber-600 text-white border-l-2 border-amber-400"
                            : isLeaveToday
                            ? "bg-rose-600 text-white border-l-2 border-rose-400"
                            : hasLeave
                            ? "bg-blue-600 text-white border-l-2 border-blue-400"
                            : isPartner
                            ? "bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-l border-purple-300 dark:border-purple-800"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                        }`}>
                          {hasLeave ? (
                            leaveStatus.line2 ? (
                              <span className="flex flex-col items-center justify-center leading-tight">
                                <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{leaveStatus.line1}</span>
                                <span className="text-[9px] sm:text-[10px] font-black whitespace-nowrap text-amber-200 mt-0.5">{leaveStatus.line2}</span>
                              </span>
                            ) : (
                              <span className="text-[10.5px] sm:text-[11.5px] font-black whitespace-nowrap">
                                <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                                <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                              </span>
                            )
                          ) : isPartner ? (
                            <span className="text-[10.5px] sm:text-[11.5px] font-bold">협력</span>
                          ) : (
                            <span className="text-[10.5px] sm:text-[11.5px] font-bold">{worker.title || "선임"}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. FACTORY 2: 한림공장 (김동욱 그라데이션 강조) */}
              {/* ========================================================================= */}
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                    <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">한림공장</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                      hanlimLeaveCount > 0
                        ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      <Calendar className="w-2.5 h-2.5" />
                      <span>일정등록 {hanlimLeaveCount}명</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {PLANTS[1].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
                  {PLANTS[1].workers.map((worker) => {
                    const isDongwook = worker.name === "김동욱" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
                    const hasLeave = Boolean(leaveStatus);
                    const isLeaveToday = Boolean(leaveStatus?.isToday);

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                        className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                          isDongwook
                            ? `border-emerald-400 bg-emerald-700 shadow-md ${
                                isLeaveToday ? "ring-2 ring-rose-500 animate-pulse" : ""
                              }`
                            : isLeaveToday
                            ? "border-rose-500 bg-slate-900 ring-2 ring-rose-400/80 animate-pulse text-white shadow-xs"
                            : hasLeave
                            ? "border-blue-400 dark:border-blue-500 bg-slate-900 text-white shadow-2xs"
                            : isPartner
                            ? "border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        }`}
                      >
                        {/* 좌측: 이름 구역 (39%) */}
                        <div className={`w-[39%] sm:w-[38%] flex items-center justify-center px-0.5 sm:px-1 text-center shrink-0 ${
                          isDongwook
                            ? "bg-emerald-800"
                            : isLeaveToday
                            ? "bg-rose-950/90"
                            : hasLeave
                            ? "bg-blue-950/90"
                            : isPartner
                            ? "bg-purple-50 dark:bg-purple-950/50"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}>
                          <span className={`font-black whitespace-nowrap leading-none ${
                            hasLeave
                              ? "text-[10px] sm:text-[12.5px] tracking-tighter"
                              : "text-xs sm:text-[13px] tracking-tight"
                          } ${
                            isDongwook
                              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                              : isLeaveToday || hasLeave
                              ? "text-white font-black"
                              : "text-slate-950 dark:text-white font-black"
                          }`}>
                            {worker.name}
                          </span>
                        </div>

                        {/* 우측: 상태 구역 (61% - 여백 없이 맞닿는 분할 플레이트) */}
                        <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                          isDongwook
                            ? hasLeave
                              ? "bg-rose-600 text-white border-l-2 border-emerald-400"
                              : "bg-emerald-600 text-white border-l-2 border-emerald-400"
                            : isLeaveToday
                            ? "bg-rose-600 text-white border-l-2 border-rose-400"
                            : hasLeave
                            ? "bg-blue-600 text-white border-l-2 border-blue-400"
                            : isPartner
                            ? "bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-l border-purple-300 dark:border-purple-800"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                        }`}>
                          {hasLeave ? (
                            leaveStatus.line2 ? (
                              <span className="flex flex-col items-center justify-center leading-tight">
                                <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{leaveStatus.line1}</span>
                                <span className="text-[9px] sm:text-[10px] font-black whitespace-nowrap text-amber-200 mt-0.5">{leaveStatus.line2}</span>
                              </span>
                            ) : (
                              <span className="text-[10.5px] sm:text-[11.5px] font-black whitespace-nowrap">
                                <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                                <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                              </span>
                            )
                          ) : isPartner ? (
                            <span className="text-[10.5px] sm:text-[11.5px] font-bold">협력</span>
                          ) : (
                            <span className="text-[10.5px] sm:text-[11.5px] font-bold">{worker.title || "선임"}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PIN Input Form View (작업자 탭 시 진입) */
            /* ========================================================================= */
            <form onSubmit={handlePinSubmit} className="space-y-3.5 animate-fadeIn">
              {/* ========================================================================= */}
              {/* ⚡ ⭐ 상단 초슬림 완벽 1줄 바: [좌측] 관리자 + [우측] 회사별 (텍스트 라벨 삭제) */}
              {/* ========================================================================= */}
              <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
                {/* [왼쪽] 관리자근무 (좌측 정렬 원래대로) */}
                <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 shrink-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      managerLeaves.length > 0 ? "bg-rose-400" : "bg-emerald-400"
                    } opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      managerLeaves.length > 0 ? "bg-rose-500" : "bg-emerald-500"
                    }`}></span>
                  </span>
                  <span className="text-amber-500 dark:text-amber-400 text-xs shrink-0">⚡</span>

                  {managerLeaves.length > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {managerLeaves.map((m) => {
                        const ls = m.leaveStatus;
                        return (
                          <span
                            key={m.id || m.name}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[10.5px] font-black text-rose-700 dark:text-rose-300 shadow-2xs shrink-0"
                          >
                            <span className="text-slate-900 dark:text-white">{m.name}</span>
                            <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9.5px]">
                              {ls.line2 ? `${ls.line1}(${ls.line2})` : ls.displayBadge?.replace('\n', ' ') || ls.label}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      <span>✓</span>
                      <span>전원 정상</span>
                    </span>
                  )}
                </div>

                {/* 중앙 구분선 */}
                <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 mx-2"></div>

                {/* [오른쪽] 회사별 근태 (중앙 구분선쪽에 붙여서 정렬) */}
                <div className="flex-1 flex items-center justify-start gap-1 min-w-0 shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 text-xs shrink-0">🏢</span>

                  {companyAttendanceStats.some((s) => s.absentCount > 0 || s.earlyLeaveCount > 0) ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {companyAttendanceStats
                        .filter((s) => s.absentCount > 0 || s.earlyLeaveCount > 0)
                        .map((stat) => {
                          const compName = stat.company;
                          const shortName = compName.replace("(주)", "");
                          const hasAbsent = stat.absentCount > 0;
                          const hasEarly = stat.earlyLeaveCount > 0;

                          return (
                            <div
                              key={compName}
                              title={`${compName}${hasAbsent ? ` | 결근: ${stat.absentList.map((a) => `${a.name}(${a.reason})`).join(", ")}` : ""}${hasEarly ? ` | 조퇴: ${stat.earlyLeaveList.map((a) => `${a.name}(${a.reason})`).join(", ")}` : ""}`}
                              className="px-1.5 py-0.5 rounded-md border border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 shadow-2xs animate-pulse flex items-center gap-1 text-[10px] font-black shrink-0"
                            >
                              <span className="text-slate-900 dark:text-white font-bold">{shortName}</span>
                              <div className="flex items-center gap-0.5">
                                {hasAbsent && <span className="px-1 rounded bg-rose-600 text-white text-[9px]">결{stat.absentCount}</span>}
                                {hasEarly && <span className="px-1 rounded bg-amber-600 text-white text-[9px]">조{stat.earlyLeaveCount}</span>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      <span>✓</span>
                      <span>전원 정상</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ADMIN 사용자 선택 탭 (권태형 대표이사 / 최미영 전무) */}
              {selectedUser.role === "ADMIN" && (
                <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1.5">
                  {ADMIN_USERS.map((admin) => {
                    const isSelected = selectedUser.name === admin.name;
                    return (
                      <button
                        key={admin.id}
                        type="button"
                        onClick={() => setSelectedUser(admin)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span>{admin.name === "권태형" ? "👑" : "💎"}</span>
                        <span>{admin.name} {admin.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 🌟 이름과 작업자변경 사이에 PIN 번호 입력창이 배치된 일체형 로그인 바 */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-800/90 dark:via-blue-950/40 dark:to-slate-800/90 border-2 border-blue-300 dark:border-blue-800/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                {/* 1. 좌측: 이름 및 작업자 정보 */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto justify-start">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shrink-0 ${
                    selectedUser.role === "ADMIN"
                      ? selectedUser.name === "최미영" ? "bg-indigo-600 ring-2 ring-indigo-400/40" : "bg-blue-600 ring-2 ring-blue-400/40"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                      : "bg-amber-500 ring-2 ring-amber-400/40"
                  }`}>
                    {selectedUser.avatar}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">
                      {selectedUser.name} {selectedUser.role === "ADMIN" ? selectedUser.title : ""}
                    </h4>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate block">
                      {selectedUser.role === "ADMIN" ? `최고 관리자` : `${selectedUser.plant} • ${selectedUser.title || "작업자"}`}
                    </span>
                  </div>
                </div>

                {/* 2. 중앙: 이름과 작업자변경 사이의 PIN 번호 입력창 + 접속 버튼 + 자동로그인 옵션 */}
                <div className="flex-1 w-full sm:max-w-xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="relative flex-1">
                      <input
                        id="worker-pin-input"
                        type="password"
                        autoFocus
                        placeholder={selectedUser.role === "ADMIN" ? "관리자 PIN" : "PIN 번호 입력"}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>접속</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-medium text-slate-500 dark:text-slate-400 select-none px-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>로그인 상태 유지 (개인폰 전용 / 공용기기 해제)</span>
                  </label>
                </div>

                {/* 3. 우측: 작업자 변경 버튼 */}
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="w-full sm:w-auto px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>작업자 변경</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 0. 품질경보 • 공지사항 • 회의일정 관리대장 (리스트 목록 조회 & 복구 모달) */}
      {/* ========================================================================= */}
      {isListModalOpen && typeof document !== "undefined" && createPortal((() => {
        const totalIssuePages = Math.max(1, Math.ceil(filteredIssues.length / ISSUES_PER_PAGE));
        const validIssuePage = Math.min(Math.max(1, issueModalPage), totalIssuePages);
        const paginatedIssues = filteredIssues.slice(
          (validIssuePage - 1) * ISSUES_PER_PAGE,
          validIssuePage * ISSUES_PER_PAGE
        );

        return (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsListModalOpen(false);
                setSelectedListItem(null);
              }
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp text-xs max-h-[94vh] flex flex-col cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Modal Header */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-md shrink-0">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        품질경보 • 회의일정 • 사내공지 • 오픈이슈 관리목록
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        총 {urgentIssues.length}건
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      등록된 이력 목록을 조회하고, 항목 선택 또는 우측 <strong>[복구]</strong> 버튼으로 첫화면에 다시 활성화할 수 있습니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(false);
                    setSelectedListItem(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  title="닫기"
                >
                  ✕
                </button>
              </div>

              {/* Restore Toast Notification */}
              {restoreToast && (
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center justify-between shadow-md animate-bounce">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{restoreToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRestoreToast("")}
                    className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 🌟 1.5 Modal Category Tabs (전체 뱃지 삭제, 4개 카테고리별 목록상 총합 노출) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
                {/* 1) 품질경보 */}
                <button
                  type="button"
                  onClick={() => {
                    setLedgerCategoryTab((prev) => (prev === "quality_alert" ? "all" : "quality_alert"));
                    setSelectedScheduleDate("");
                    setIssueModalPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    ledgerCategoryTab === "quality_alert"
                      ? "bg-rose-600 text-white shadow-md ring-1 ring-rose-400/40"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🚨 품질경보</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
                    {allQualityAlerts.length}
                  </span>
                </button>

                {/* 2) 회의일정 */}
                <button
                  type="button"
                  onClick={() => {
                    setLedgerCategoryTab((prev) => (prev === "meeting" ? "all" : "meeting"));
                    setSelectedScheduleDate("");
                    setIssueModalPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    ledgerCategoryTab === "meeting"
                      ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-400/40"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📅 회의일정</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200">
                    {allMeetings.length}
                  </span>
                </button>

                {/* 3) 사내공지 */}
                <button
                  type="button"
                  onClick={() => {
                    setLedgerCategoryTab((prev) => (prev === "notice" ? "all" : "notice"));
                    setSelectedScheduleDate("");
                    setIssueModalPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    ledgerCategoryTab === "notice"
                      ? "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/40"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📢 사내공지</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200">
                    {allNotices.length}
                  </span>
                </button>

                {/* 4) 오픈이슈 */}
                <button
                  type="button"
                  onClick={() => {
                    setLedgerCategoryTab((prev) => (prev === "open_issue" || prev === "quality_issue" ? "all" : "open_issue"));
                    setIssueModalPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
                    ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400/40"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📌 오픈이슈</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200">
                    {allQualityIssues.length}
                  </span>
                </button>
              </div>

              {/* 📅 🌟 [오픈이슈 전용 일정표] - 오픈이슈 탭에서만 일정표 노출 */}
              {(ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue") && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 border-2 border-blue-500/40 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <strong className="text-xs sm:text-sm font-black text-blue-300">
                        오픈이슈 조치/목표 일정표 (Schedule Timeline)
                      </strong>
                    </div>
                    {selectedScheduleDate ? (
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleDate("")}
                        className="text-[11px] font-bold text-blue-400 hover:text-blue-200 underline cursor-pointer"
                      >
                        {selectedScheduleDate} 필터 해제 (전체 보기) ✕
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-slate-400">
                        * 날짜 클릭 시 해당 일자 오픈이슈만 필터링됩니다.
                      </span>
                    )}
                  </div>

                  {/* 7-Days Schedule Strip */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs">
                    {openIssueScheduleDays.map((day) => {
                      const isSelected = selectedScheduleDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedScheduleDate((prev) => (prev === day.dateStr ? "" : day.dateStr));
                            setIssueModalPage(1);
                          }}
                          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[54px] ${
                            isSelected
                              ? "bg-orange-600 text-white border-orange-400 ring-2 ring-orange-400/50 shadow-md scale-105"
                              : day.isToday
                              ? "bg-orange-950/60 border-orange-500/80 text-orange-200 ring-1 ring-orange-500/30 font-black"
                              : day.totalCount > 0
                              ? "bg-slate-800 border-slate-700 hover:border-orange-400/60 text-slate-200"
                              : "bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div className="text-[9.5px] sm:text-[10px] font-mono leading-tight">
                            {day.isToday ? "오늘" : `${day.dateStr.slice(5)}`}
                            <span className="block text-[8.5px] opacity-75">({day.dayName})</span>
                          </div>
                          <div className="mt-1">
                            {day.unresolvedCount > 0 ? (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                isSelected ? "bg-white text-rose-600" : "bg-rose-600 text-white"
                              }`}>
                                미결 {day.unresolvedCount}
                              </span>
                            ) : day.resolvedCount > 0 ? (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                isSelected ? "bg-white text-emerald-600" : "bg-emerald-600/80 text-white"
                              }`}>
                                ✓ {day.resolvedCount}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500">-</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Body - Scrollable (한줄짜리 패널 목록만 깔끔하게 노출) */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[68vh] mt-2">
                {/* 🌟 4. Clean Single-line List (리스트 목록 조회) */}
                <div className="space-y-1.5">
                  {paginatedIssues.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-lg">📭</div>
                      <p>
                        {issueFilterTab === "unresolved"
                          ? "현재 진행중(조치대기) 상태인 항목이 없습니다."
                          : issueFilterTab === "closed"
                          ? "종결(조치완료)된 내역이 없습니다."
                          : issueFilterTab === "deleted"
                          ? "삭제 또는 기간만료된 내역이 없습니다."
                          : "등록된 관리대장 이력이 없습니다."}
                      </p>
                    </div>
                  ) : (
                    paginatedIssues.map((it, idx) => {
                      const isCurrent = selectedListItem?.id === it.id;
                      const isItMeeting = it.category === "회의일정";
                      const isItNotice = it.category === "공지사항" || it.category === "사내공지" || it.category === "공유사항";
                      const isItQualityAlert = it.category === "품질경보";
                      const isItOpenIssue = it.category === "오픈이슈" || it.category === "품질이슈" || (!isItQualityAlert && !isItMeeting && !isItNotice);
                      const isItDeleted = Boolean(it.isDeleted);
                      const isItResolved = Boolean(it.isResolved);
                      const isItUnresolved = !isItDeleted && !isItResolved;
                      const itemNum = (validIssuePage - 1) * ISSUES_PER_PAGE + idx + 1;
                      const totalImgCount = (it.images?.length || 0) + (it.actionImages?.length || 0);

                      return (
                        <div
                          key={it.id || idx}
                          onClick={() => {
                            if (openActionMenuId === it.id) return;
                            handleOpenEditIssue(it, null, false, true);
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col gap-1.5 cursor-pointer ${
                            isCurrent
                              ? "bg-blue-50/95 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.005]"
                              : isItDeleted
                              ? "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 opacity-80"
                              : isItUnresolved
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/50"
                              : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/40"
                          }`}
                          title="클릭하여 상세 조회"
                        >
                          {/* Row Top: Left Info & Right (상태 뱃지 + 수정 뱃지) */}
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Item Number */}
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isCurrent
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : isItDeleted
                                  ? "bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
                                  : isItUnresolved
                                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                  : "bg-emerald-600 text-white shadow-xs"
                              }`}>
                                {itemNum}
                              </span>

                              {/* Category Badge (4대 구분: 품질경보 • 회의일정 • 사내공지 • 오픈이슈) */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white shrink-0 shadow-2xs ${
                                isItQualityAlert
                                  ? "bg-rose-600"
                                  : isItMeeting
                                  ? "bg-purple-600"
                                  : isItNotice
                                  ? "bg-emerald-600"
                                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
                              }`}>
                                {isItQualityAlert ? "🚨 품질경보" : isItMeeting ? "📅 회의일정" : isItNotice ? "📢 사내공지" : "📌 오픈이슈"}
                              </span>

                              {/* Factory Badge */}
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 ${
                                it.plant === "한림공장"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : it.plant === "삼랑진공장"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : it.plant === "화승 R&A"
                                  ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              }`}>
                                {it.plant === "화승 R&A" ? "화승 R&A" : it.plant?.replace("공장", "") || "전체"}
                              </span>

                              {/* Date Badge */}
                              {it.expireDate && (
                                <span className={`px-1 py-0.2 rounded text-[9px] font-bold font-mono shrink-0 ${
                                  it.category === "품질경보"
                                    ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-200"
                                    : isItMeeting
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200"
                                    : isItNotice
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                    : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200"
                                }`}>
                                  {it.category === "품질경보" ? `등록: ${it.expireDate.slice(5)}` : `${it.expireDate.slice(5)}${isItMeeting && it.meetingTime ? ` ${it.meetingTime}` : ""}`}
                                </span>
                              )}

                              {/* Content Snippet */}
                              <span className={`text-xs truncate flex-1 ${
                                isCurrent
                                  ? "font-black text-blue-950 dark:text-blue-100"
                                  : isItDeleted
                                  ? "font-semibold text-slate-500 dark:text-slate-400 line-through"
                                  : isItUnresolved
                                  ? "font-black text-amber-950 dark:text-amber-200"
                                  : "font-bold text-slate-800 dark:text-slate-200"
                              }`}>
                                {it.title ? `${it.title} - ${it.content}` : it.content}
                              </span>

                              {/* Photo count indicator */}
                              {totalImgCount > 0 && (
                                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shrink-0 font-bold hidden sm:inline-flex">
                                  <Camera className="w-2.5 h-2.5 text-rose-500" />
                                  <span>{totalImgCount}</span>
                                </span>
                              )}

                              {/* Author / Deleter info */}
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono hidden md:inline">
                                {isItDeleted && it.deletedBy ? `종결: ${it.deletedBy}` : `${it.author} • ${it.createdAt?.slice(5) || ""}`}
                              </span>
                            </div>

                            {/* Right: Only Status Badge & Edit Badge */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* 1) Status Badge (종결 / 회의종결(조치완료) / 회의예정(조치대기)) */}
                              {isItDeleted ? (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                  종결
                                </span>
                              ) : isItResolved ? (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                  {isItMeeting ? "회의종결" : "조치완료"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                                  {isItMeeting ? "회의예정" : "조치대기"}
                                </span>
                              )}

                              {/* 2) Edit Badge (Click to reveal 회의결과입력 / 내용수정 / 복구 버튼) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId((prev) => (prev === it.id ? null : it.id));
                                }}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-black shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 border ${
                                  openActionMenuId === it.id
                                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-amber-500/25 ring-2 ring-amber-400/40"
                                    : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                                }`}
                                title="수정 및 결과 입력 메뉴 열기"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>수정</span>
                                {openActionMenuId === it.id ? (
                                  <ChevronUp className="w-3 h-3 text-slate-900" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 opacity-60" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Row Bottom: Expanded Action Bar (회의결과입력, 내용수정, 복구 등) */}
                          {openActionMenuId === it.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap animate-fadeIn bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-2xs"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* 1. 회의결과입력 / 조치결과입력 버튼 (종결 항목도 즉시 실행) */}
                                <button
                                  type="button"
                                  onClick={(e) => handleExecuteMeetingResult(it, e)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-white ${
                                    isItMeeting
                                      ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                  }`}
                                  title={isItMeeting ? "회의 결과 및 결정사항 입력" : "조치 결과 입력"}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isItMeeting ? "회의결과입력" : "조치결과입력"}</span>
                                </button>

                                {/* 2. 내용수정 버튼 (종결 항목도 즉시 실행) */}
                                <button
                                  type="button"
                                  onClick={(e) => handleExecuteEditContent(it, e)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                  title="제목, 내용, 일정, 첨부사진 등 내용 수정"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>내용수정</span>
                                </button>

                                {/* 3. 첫화면 복구 / 복구 취소 버튼 */}
                                {isItDeleted ? (
                                  <button
                                    type="button"
                                    onClick={(e) => handleExecuteRestore(it, e)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                                    title="첫 화면으로 복구"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>첫화면 복구</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleExecuteCancelRestore(it, e)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                    title="첫 화면에서 내리고 관리목록으로 보관"
                                  >
                                    <RotateCcw className="w-3 h-3 text-blue-500" />
                                    <span>복구 취소</span>
                                  </button>
                                )}

                                {/* 4. 삭제 버튼 (핀번호 인증 후 삭제) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    handleOpenDeleteModal(it, e);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                  title="이 항목 삭제 (총괄관리자 PIN 인증)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>삭제</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(null);
                                }}
                                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                title="메뉴 닫기"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 5-Item Pagination */}
                {totalIssuePages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={validIssuePage <= 1}
                        onClick={() => setIssueModalPage(1)}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="첫 페이지"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={validIssuePage <= 1}
                        onClick={() => setIssueModalPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-0.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>이전</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalIssuePages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setIssueModalPage(pageNum)}
                          className={`w-6 h-6 rounded-lg font-black text-xs transition-all cursor-pointer ${
                            pageNum === validIssuePage
                              ? "bg-blue-600 text-white shadow-xs scale-105"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={validIssuePage >= totalIssuePages}
                        onClick={() => setIssueModalPage((p) => Math.min(totalIssuePages, p + 1))}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>다음</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={validIssuePage >= totalIssuePages}
                        onClick={() => setIssueModalPage(totalIssuePages)}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="마지막 페이지"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Bottom Fixed Action Buttons */}
              <div className="pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 신규 등록</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(false);
                    setSelectedListItem(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black hover:bg-slate-200 dark:hover:bg-slate-700 text-xs cursor-pointer shadow-xs"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ========================================================================= */}
      {/* 🌟 1. 품질경보 / 사내공지 / 회의일정 통합 상세·조치·수정·삭제 팝업 모달 */}
      {/* ========================================================================= */}
      {isIssueModalOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseIssueModal();
            }
          }}
          className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-xl w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 sm:space-y-4 my-auto animate-scaleUp max-h-[92vh] overflow-y-auto cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-xs shrink-0 ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-600"
                    : newIssueForm.category === "공지사항"
                    ? "bg-emerald-600"
                    : newIssueForm.category === "오픈이슈"
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                    : "bg-rose-600"
                }`}>
                  {newIssueForm.category === "회의일정" ? (
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : newIssueForm.category === "공지사항" ? (
                    <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : newIssueForm.category === "오픈이슈" ? (
                    <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black text-white shrink-0 ${
                      newIssueForm.category === "회의일정"
                        ? "bg-purple-600"
                        : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                        ? "bg-emerald-600"
                        : newIssueForm.category === "오픈이슈"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                        : "bg-rose-600"
                    }`}>
                      {newIssueForm.category === "회의일정"
                        ? "📅 회의일정"
                        : (newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지")
                        ? "📢 사내공지"
                        : newIssueForm.category === "오픈이슈"
                        ? "📌 오픈이슈"
                        : "🚨 품질경보"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {newIssueForm.plant}
                    </span>
                    {newIssueForm.category === "오픈이슈" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                        💬 의견 {(newIssueForm.replies?.length || 0)}건
                      </span>
                    )}
                    {editingIssue && (
                      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black shrink-0 ${
                        newIssueForm.isResolved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse"
                      }`}>
                        {newIssueForm.isResolved ? "조치완료" : "조치대기"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 truncate">
                    {editingIssue
                      ? `${newIssueForm.plant} ${newIssueForm.category === "공지사항" ? "사내공지" : newIssueForm.category} 상세 및 처리`
                      : `신규 ${newIssueForm.category === "공지사항" ? "사내공지" : newIssueForm.category} 등록`}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseIssueModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 🌟 1. 상세 보기 모드: 오픈이슈 및 공지/회의/품질경보 정리된 내용만 깔끔하게 표시 */}
            {editingIssue && isIssueDetailMode ? (
              <div className="space-y-3.5 text-xs">
                {/* 1) 상단 등록 정보 & 일정 요약 바 */}
                <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="font-bold text-slate-500 dark:text-slate-400">등록자:</span>
                      <strong className="font-black text-slate-900 dark:text-white">
                        {editingIssue.author || "권태형"} {editingIssue.authorTitle || ""}
                      </strong>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {editingIssue.createdAt || editingIssue.date || todayDateStr}
                      </span>
                    </div>
                    {(editingIssue.startDate || editingIssue.expireDate) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-900 dark:text-blue-200 font-mono font-bold">
                        <span>🚩 일정: {editingIssue.startDate || "착수"} ~ {editingIssue.expireDate || "마감"}</span>
                        {editingIssue.expireDate && (
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                            editingIssue.expireDate >= todayDateStr
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {editingIssue.expireDate >= todayDateStr
                              ? `D-${Math.max(0, Math.ceil((new Date(editingIssue.expireDate) - new Date(todayDateStr)) / (1000 * 60 * 60 * 24)))}`
                              : "기한경과"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Status Toggle Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      const toggled = !editingIssue.isResolved;
                      setNewIssueForm((prev) => ({ ...prev, isResolved: toggled }));
                      const updated = { ...editingIssue, isResolved: toggled };
                      setEditingIssue(updated);
                      setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
                      await saveUrgentIssue(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                      editingIssue.isResolved
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                    }`}
                    title="클릭 시 조치완료 / 진행중 상태 즉시 전환"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingIssue.isResolved ? "조치완료 ✓" : "진행중 (완료처리 ➜)"}</span>
                  </button>
                </div>

                {/* 2) 제목 & 상세 전달 내용 (정리된 본문 카드) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words">
                      {editingIssue.title || "제목 없음"}
                    </h4>
                  </div>
                  <div className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    {editingIssue.content || "상세 전달 내용이 없습니다."}
                  </div>

                  {/* 조치 결과 내용 (있을 시 또는 신규 입력 버튼) */}
                  {editingIssue.actionResult ? (
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      newIssueForm.category === "회의일정"
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80"
                        : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80"
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className={`flex items-center gap-1 ${
                          newIssueForm.category === "회의일정" ? "text-purple-800 dark:text-purple-300" : "text-emerald-800 dark:text-emerald-300"
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{newIssueForm.category === "회의일정" ? "회의 결과 및 결정 사항" : "조치 완료 결과"}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {editingIssue.actionAuthor && (
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              {editingIssue.actionAuthor} • {editingIssue.actionAt}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(editingIssue)}
                            className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-[10.5px] font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                          >
                            수정 ✏️
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium leading-relaxed">
                        {editingIssue.actionResult}
                      </div>
                    </div>
                  ) : newIssueForm.category !== "오픈이슈" ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {newIssueForm.category === "회의일정" ? "📝 아직 등록된 회의 결과가 없습니다." : "⏳ 아직 등록된 조치 결과가 없습니다."}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(editingIssue)}
                        className={`px-3 py-1.5 rounded-xl text-white font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer ${
                          newIssueForm.category === "회의일정"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{newIssueForm.category === "회의일정" ? "회의결과 입력" : "조치결과 입력"}</span>
                      </button>
                    </div>
                  ) : null}

                  {/* 첨부 사진 갤러리 */}
                  {((editingIssue.images && editingIssue.images.length > 0) || (editingIssue.actionImages && editingIssue.actionImages.length > 0)) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">
                        📸 현장 첨부 사진 ({((editingIssue.images?.length || 0) + (editingIssue.actionImages?.length || 0))}장)
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {editingIssue.images?.map((img, idx) => (
                          <img
                            key={`img_${idx}`}
                            src={img.dataUrl}
                            alt={`첨부사진_${idx + 1}`}
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진_${idx + 1}` })}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                            title="클릭하여 원본 보기"
                          />
                        ))}
                        {editingIssue.actionImages?.map((img, idx) => (
                          <img
                            key={`act_${idx}`}
                            src={img.dataUrl}
                            alt={`조치사진_${idx + 1}`}
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `조치사진_${idx + 1}` })}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                            title="클릭하여 원본 보기"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3) 💬 일자별 조치 의견 & 진행 일지 (오픈이슈/회의일정/사내공지) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-200 dark:border-blue-900/80 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>조치 일자별 의견 및 진행 일지 ({editingIssue.replies?.length || 0}건)</span>
                    </span>
                    <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                      * 작업자 누구나 의견을 등록할 수 있습니다.
                    </span>
                  </div>

                  {/* Opinions List Display */}
                  {editingIssue.replies && editingIssue.replies.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {editingIssue.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-blue-600 text-white shrink-0 shadow-2xs flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                            </span>
                            <strong className="text-slate-900 dark:text-white font-bold text-xs shrink-0">
                              {rep.author} {rep.authorTitle || ""}
                            </strong>
                            <span className="text-slate-700 dark:text-slate-200 text-xs break-words font-medium">
                              {rep.content}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {rep.createdAt?.slice(11, 16) || ""}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleModalDeleteOpinion(rep.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                              title="의견 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs font-semibold text-slate-400 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-dashed border-blue-200 dark:border-blue-900">
                      등록된 조치 의견이 없습니다. 아래에서 새로운 의견을 남겨주세요.
                    </div>
                  )}

                  {/* Quick Opinion Input Box */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-[10.5px] text-slate-600 dark:text-slate-400 block mb-1">
                          📅 조치일자
                        </label>
                        <input
                          type="date"
                          value={actionOpinionForm.actionDate || todayDateStr}
                          onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, actionDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[10.5px] text-slate-600 dark:text-slate-400 block mb-1">
                          👤 작성자 (직접 선택)
                        </label>
                        <select
                          value={actionOpinionForm.author || ""}
                          onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, author: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                            !actionOpinionForm.author
                              ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          }`}
                        >
                          <option value="">-- 작성자 선택 --</option>
                          <optgroup label="👑 본사 임원진">
                            {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                              <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🏢 삼랑진공장">
                            {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🏢 한림공장">
                            {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🤝 협력업체">
                            {allWorkers.filter(w => w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="조치 의견 및 진행 상황을 입력하세요 (엔터 시 추가)"
                        value={actionOpinionForm.content}
                        onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleModalAddOpinion(e);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleModalAddOpinion}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ 의견 등록</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4) 하단 액션 버튼 바 */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsIssueDetailMode(false)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                      title="제목, 본문, 일정, 사진 등 내용 수정 모드로 전환"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>✏️ 내용 수정</span>
                    </button>

                    {newIssueForm.category !== "오픈이슈" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenActionModal(editingIssue);
                          setIsIssueModalOpen(false);
                        }}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs text-white ${
                          newIssueForm.category === "회의일정"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                        title={newIssueForm.category === "회의일정" ? "회의 결과 및 결정사항 입력" : "조치 결과 입력"}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{newIssueForm.category === "회의일정" ? "회의결과 입력" : "조치결과 입력"}</span>
                      </button>
                    )}

                    {!editingIssue?.isDeleted && (
                      <button
                        type="button"
                        onClick={(e) => handleCancelRestore(editingIssue, e)}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs border border-slate-300 dark:border-slate-700"
                        title="첫 화면에서 내리고 관리목록(대장)으로 보관합니다"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>↩️ 복구 취소</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteModal(editingIssue, e)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 border border-rose-200 dark:border-rose-900/60"
                      title="항목 삭제 (관리자 권한 필요)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>삭제</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseIssueModal}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md active:scale-95 cursor-pointer transition-all"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              /* 🌟 2. 신규 등록 및 수정 모드 폼 */
              <form onSubmit={handleSaveNewIssue} className="space-y-3.5 text-xs">
                {/* Switch back to detail mode button if editing existing issue */}
                {editingIssue && (
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsIssueDetailMode(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>← 정리된 상세 보기로 돌아가기</span>
                    </button>
                  </div>
                )}
              {/* 1. 구분 (4대 분류: 품질경보 • 회의일정 • 사내공지 • 오픈이슈) */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  구분 (4대 분류)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {/* 1) 품질경보 */}
                  <button
                    type="button"
                    onClick={() => setNewIssueForm({ ...newIssueForm, category: "품질경보" })}
                    className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                      newIssueForm.category === "품질경보"
                        ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>🚨 품질경보</span>
                  </button>

                  {/* 2) 회의일정 */}
                  <button
                    type="button"
                    onClick={() => setNewIssueForm({ ...newIssueForm, category: "회의일정" })}
                    className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                      newIssueForm.category === "회의일정"
                        ? "bg-purple-50 dark:bg-purple-950/70 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>📅 회의일정</span>
                  </button>

                  {/* 3) 사내공지 */}
                  <button
                    type="button"
                    onClick={() => setNewIssueForm({ ...newIssueForm, category: "공지사항" })}
                    className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                      newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                        ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>📢 사내공지</span>
                  </button>

                  {/* 4) 오픈이슈 */}
                  <button
                    type="button"
                    onClick={() => setNewIssueForm({ ...newIssueForm, category: "오픈이슈" })}
                    className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                      newIssueForm.category === "오픈이슈"
                        ? "bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5 text-blue-500" />
                    <span>오픈이슈</span>
                  </button>
                </div>
              </div>

              {/* 2. 공장 & 작성자 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    공장 / 구분
                  </label>
                  <select
                    value={newIssueForm.plant}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, plant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                    <option value="본사">본사</option>
                    <option value="화승 R&A">화승 R&A</option>
                    <option value="전체">전체</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작성자 (직접 선택)
                  </label>
                  <select
                    value={newIssueForm.author || ""}
                    required
                    onChange={(e) => {
                      const found = allWorkers.find((w) => w.name === e.target.value);
                      setNewIssueForm({
                        ...newIssueForm,
                        author: e.target.value,
                        authorTitle: found?.title || "선임",
                        plant: found?.plantName === "본사" && newIssueForm.plant === "삼랑진공장" ? "본사" : newIssueForm.plant
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      !newIssueForm.author
                        ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}
                  >
                    <option value="">-- 작성자 직접 선택 (필수) --</option>
                    <optgroup label="👑 본사 임원진">
                      {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                        <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 삼랑진공장">
                      {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 한림공장">
                      {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🤝 협력업체">
                      {allWorkers.filter(w => w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* 3. ⭐ 카테고리별 특화 영역 (오픈이슈: 날짜지정 & 달력형 일자별 의견 관리 / 회의일정 / 사내공지 / 품질경보) */}
              {newIssueForm.category === "오픈이슈" ? (
                /* 🌟 오픈이슈 전용: 날짜지정 + 달력형식 일자별 의견 현황 */
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-800 space-y-3 shadow-sm">
                  {/* Header & Metrics */}
                  <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-blue-200/70 dark:border-blue-900/60">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                        <Pin className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                        오픈이슈 일정관리
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        title="오픈이슈 등록 및 저장"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>등록</span>
                      </button>
                    </div>
                  </div>

                  {/* 1) 🌟 제목 및 상세전달내용 (오픈이슈 일정관리 패널 상단) */}
                  <div className="space-y-2 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900">
                    <div>
                      <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                        제목
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="예: 압출 2호기 금형 히터 온도 점검 및 개선"
                        value={newIssueForm.title}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                        상세 전달 내용
                      </label>
                      <textarea
                        rows="2"
                        required
                        placeholder="구체적인 상황, 문제점 및 작업자 전달 사항을 입력해 주세요."
                        value={newIssueForm.content}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs"
                      ></textarea>
                    </div>
                  </div>

                  {/* 2) 시작일자 & 조치 목표일자 (작업자가 직접 지정) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                        🚩 착수/시작 일자
                      </label>
                      <input
                        type="date"
                        required
                        value={newIssueForm.startDate || todayDateStr}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, startDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                        🎯 조치 목표/마감 일자 (직접 지정)
                      </label>
                      <input
                        type="date"
                        required
                        value={newIssueForm.expireDate || todayDateStr}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-blue-700 dark:text-blue-300 shadow-xs cursor-pointer ring-1 ring-blue-400/30"
                      />
                    </div>
                  </div>

                  {/* 2) 📅 달력 형식의 타임라인 & 일자별 의견 현황 (의견갯수 및 등록표시) */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>달력형 타임라인 & 일자별 의견 현황</span>
                      </span>
                      <span className="text-[9.5px] text-slate-400">
                        * 날짜 클릭 시 목표일 지정 및 해당 일자 의견 등록으로 지정
                      </span>
                    </div>

                    {/* 14-Day Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
                      {getOpenIssueFormCalendarDays(
                        newIssueForm.startDate || todayDateStr,
                        newIssueForm.expireDate || todayDateStr,
                        newIssueForm.replies || []
                      ).map((day) => {
                        const isSelectedForAction = actionOpinionForm.actionDate === day.dateStr;
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => {
                              setNewIssueForm({ ...newIssueForm, expireDate: day.dateStr });
                              setActionOpinionForm((prev) => ({ ...prev, actionDate: day.dateStr }));
                            }}
                            className={`p-1 sm:p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[58px] sm:min-h-[64px] relative group ${
                              isSelectedForAction || day.isTarget
                                ? "bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/60 font-black scale-102"
                                : day.hasOpinions
                                ? "bg-blue-50/90 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-950 dark:text-blue-100 font-bold ring-1 ring-blue-400/40"
                                : day.isStart
                                ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-black"
                                : day.isInRange
                                ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-medium"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                            }`}
                            title={`일자: ${day.dateStr} (의견 ${day.opinionCount}건) - 클릭 시 목표일 지정 및 의견 등록`}
                          >
                            {/* 날짜 */}
                            <div className="text-[9.5px] sm:text-[10px] font-mono leading-tight">
                              <span className={day.dayIndex === 0 ? "text-rose-500 font-bold" : day.dayIndex === 6 ? "text-blue-500 font-bold" : ""}>
                                {day.monthDay}
                              </span>
                              <span className="block text-[8px] opacity-75">({day.dayName})</span>
                            </div>

                            {/* 상태 태그 */}
                            <div className="my-0.5">
                              {day.isTarget ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-white text-blue-700 shadow-2xs">
                                  🎯목표
                                </span>
                              ) : day.isStart ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-indigo-600 text-white shadow-2xs">
                                  🚩시작
                                </span>
                              ) : day.isToday ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-amber-500 text-slate-950 shadow-2xs animate-pulse">
                                  오늘
                                </span>
                              ) : null}
                            </div>

                            {/* 💬 의견갯수 & 의견등록표시 */}
                            <div className="w-full flex items-center justify-center">
                              {day.hasOpinions ? (
                                <span className={`px-1 py-0.5 rounded-md text-[8px] sm:text-[8.5px] font-black flex items-center justify-center gap-0.5 shadow-2xs ${
                                  isSelectedForAction || day.isTarget
                                    ? "bg-cyan-300 text-slate-900"
                                    : "bg-blue-600 text-white animate-pulse"
                                }`}>
                                  <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                                  <span>{day.opinionCount}건</span>
                                </span>
                              ) : (
                                <span className="text-[7.5px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  +의견
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4) 💬 🌟 조치등록날짜 선택 및 의견 실시간 추가란 */}
                  <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-blue-300 dark:border-blue-800/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="font-black text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>조치 일자별 의견 및 진행 일지 ({newIssueForm.replies?.length || 0}건)</span>
                      </span>
                      <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                        * 날짜 지정 후 의견을 계속 추가할 수 있습니다.
                      </span>
                    </div>

                    {/* Opinions List Display */}
                    {newIssueForm.replies && newIssueForm.replies.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {newIssueForm.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/80 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-blue-600 text-white shrink-0 shadow-2xs flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                              </span>
                              <strong className="text-slate-900 dark:text-white font-bold text-xs shrink-0">
                                {rep.author} {rep.authorTitle || ""}
                              </strong>
                              <span className="text-slate-700 dark:text-slate-200 text-xs break-words">
                                {rep.content}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9.5px] text-slate-400 font-mono">
                                {rep.createdAt?.slice(11, 16) || ""}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleModalDeleteOpinion(rep.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                                title="의견 삭제"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Opinion Add Input Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                            📅 조치등록날짜
                          </label>
                          <input
                            type="date"
                            value={actionOpinionForm.actionDate || todayDateStr}
                            onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, actionDate: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-blue-900 dark:text-blue-200 shadow-xs cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                            👤 작성자 (직접 선택)
                          </label>
                          <select
                            value={actionOpinionForm.author || ""}
                            onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, author: e.target.value })}
                            className={`w-full px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                              !actionOpinionForm.author
                                ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                            }`}
                          >
                            <option value="">-- 작성자 직접 선택 (필수) --</option>
                            <optgroup label="👑 본사 임원진">
                              {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                                <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🏢 삼랑진공장">
                              {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                                <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🏢 한림공장">
                              {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                                <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🤝 협력업체">
                              {allWorkers.filter(w => w.isPartner).map((w) => (
                                <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="조치 의견 및 진행 상황을 입력하세요 (엔터 시 추가)"
                          value={actionOpinionForm.content}
                          onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleModalAddOpinion(e);
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleModalAddOpinion}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ 추가</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 🌟 기타 카테고리 (회의일정 / 사내공지 / 품질경보) */
                <div className={`p-3 rounded-2xl border transition-all ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-400/30"
                    : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                    ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/30"
                    : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
                }`}>
                  {newIssueForm.category === "회의일정" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>회의 진행 일시</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                        <input
                          type="date"
                          required
                          value={newIssueForm.expireDate || todayDateStr}
                          onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs text-center cursor-pointer"
                        />
                        <select
                          value={newIssueForm.meetingTime || "14:00"}
                          onChange={(e) => setNewIssueForm({ ...newIssueForm, meetingTime: e.target.value })}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-purple-700 dark:text-purple-300 shadow-xs text-center cursor-pointer"
                        >
                          {[
                            "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
                            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                            "15:00", "15:30", "16:00", "16:30", "17:00"
                          ].map((t) => (
                            <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="font-black text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>공지 게시 만료일자</span>
                        </label>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          * 만료일 경과 시 첫 화면에서 자동 정리됩니다.
                        </p>
                      </div>
                      <input
                        type="date"
                        required
                        value={newIssueForm.expireDate || todayDateStr}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                      />
                    </div>
                  ) : (
                    /* 품질경보 */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="font-black text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>품질경보 등록일</span>
                        </label>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          * 품질경보가 발행/등록된 일자입니다.
                        </p>
                      </div>
                      <input
                        type="date"
                        required
                        value={newIssueForm.expireDate || todayDateStr}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4. 제목 & 내용 (기타 카테고리: 회의일정 / 공지사항 / 품질경보) */}
              {newIssueForm.category !== "오픈이슈" && (
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      {newIssueForm.category === "회의일정" ? "회의 제목" : "제목"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        newIssueForm.category === "회의일정"
                          ? "예: 9월 2주차 생산성 향상 및 품질 개선 주간 회의"
                          : newIssueForm.category === "공지사항"
                          ? "예: 9월 정기 소방 안전점검 및 현장 정리정돈 안내"
                          : "예: 압출 2호기 금형 히터 온도 점검 요망"
                      }
                      value={newIssueForm.title}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      {newIssueForm.category === "회의일정" ? "회의 안건 및 상세 일정" : "상세 전달 내용"}
                    </label>
                    <textarea
                      rows="3"
                      required
                      placeholder={
                        newIssueForm.category === "회의일정"
                          ? "• 일시: 2026-09-08(화) 14:00\n• 장소: 삼랑진공장 2층 대회의실\n• 안건: 압출 라인 히터 개선 및 불량율 저감 대책"
                          : "구체적인 상황 및 작업자 전달 사항을 입력해 주세요."
                      }
                      value={newIssueForm.content}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs sm:text-sm"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* 5. 현장 첨부 사진 */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    <span>현장/안건 첨부 사진 (최대 3장)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {newIssueForm.images?.length || 0}/3장
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    htmlFor="modal-issue-camera-input"
                    className={`py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                      (newIssueForm.images?.length || 0) >= 3
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-black"
                    }`}
                  >
                    <input
                      type="file"
                      id="modal-issue-camera-input"
                      accept="image/*"
                      capture="environment"
                      disabled={isProcessingIssueImages || (newIssueForm.images?.length || 0) >= 3}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleIssueImageFiles(e.target.files);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                    <Camera className="w-3.5 h-3.5" />
                    <span>📸 즉시 촬영</span>
                  </label>

                  <label
                    htmlFor="modal-issue-gallery-input"
                    className={`py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                      (newIssueForm.images?.length || 0) >= 3
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                    }`}
                  >
                    <input
                      type="file"
                      id="modal-issue-gallery-input"
                      accept="image/*"
                      multiple
                      disabled={isProcessingIssueImages || (newIssueForm.images?.length || 0) >= 3}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleIssueImageFiles(e.target.files);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>📁 앨범 선택</span>
                  </label>
                </div>

                {newIssueForm.images && newIssueForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {newIssueForm.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name })}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveIssueImage(idx)}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. 🌟 회의 결과 / 조치 결과 입력 섹션 (오픈이슈는 제외) */}
              {newIssueForm.category !== "오픈이슈" && (
                <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-800/80"
                    : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800/80"
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-4 h-4 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
                      <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 사항" : "조치 결과 입력"}
                      </strong>
                    </div>

                    {/* Status Toggle Button */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: false })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          !newIssueForm.isResolved
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        조치대기
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: true })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          newIssueForm.isResolved
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        조치완료
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {newIssueForm.category === "회의일정" ? "보고자 / 작성자" : "조치자"} (직접 선택)
                      </label>
                      <select
                        value={newIssueForm.actionAuthor || ""}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, actionAuthor: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          !newIssueForm.actionAuthor
                            ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        }`}
                      >
                        <option value="">-- {newIssueForm.category === "회의일정" ? "작성자 / 보고자" : "조치자"} 직접 선택 --</option>
                        <optgroup label="👑 본사 임원진">
                          {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                            <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🏢 삼랑진공장">
                          {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                            <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🏢 한림공장">
                          {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                            <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🤝 협력업체">
                          {allWorkers.filter(w => w.isPartner).map((w) => (
                            <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        조치/종결 상태
                      </label>
                      <div className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{newIssueForm.isResolved ? "✅ 조치 완료 상태" : "⏳ 조치 진행/대기중"}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {newIssueForm.category === "회의일정" ? "회의종결" : "완료처리"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 안건 상세" : "조치결과 상세 내용"}
                    </label>
                    <textarea
                      rows="3"
                      placeholder={
                        newIssueForm.category === "회의일정"
                          ? "예:\n1. 불량 원인 규명 및 금형 히터 교체 일정 확정\n2. 다음 주부터 2공장 표준 점검표 적용 시행"
                          : "예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
                      }
                      value={newIssueForm.actionResult}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewIssueForm({
                          ...newIssueForm,
                          actionResult: val,
                          isResolved: val.trim().length > 0 ? true : newIssueForm.isResolved
                        });
                      }}
                      className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white"
                    ></textarea>
                  </div>

                  {/* 조치 완료 / 회의 결과 사진 첨부 */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Camera className={`w-3.5 h-3.5 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
                        <span>{newIssueForm.category === "회의일정" ? "회의록/현장 결과 사진 (선택)" : "조치 완료 사진 첨부 (선택)"}</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {newIssueForm.actionImages?.length || 0}/3장
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label
                        htmlFor="modal-action-camera-input"
                        className={`py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          (newIssueForm.actionImages?.length || 0) >= 3
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                            : newIssueForm.category === "회의일정"
                            ? "border-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-black"
                            : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black"
                        }`}
                      >
                        <input
                          type="file"
                          id="modal-action-camera-input"
                          accept="image/*"
                          capture="environment"
                          disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleNewIssueActionImageFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        <Camera className="w-3.5 h-3.5" />
                        <span>📸 결과사진 촬영</span>
                      </label>

                      <label
                        htmlFor="modal-action-gallery-input"
                        className={`py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          (newIssueForm.actionImages?.length || 0) >= 3
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <input
                          type="file"
                          id="modal-action-gallery-input"
                          accept="image/*"
                          multiple
                          disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleNewIssueActionImageFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>📁 앨범 선택</span>
                      </label>
                    </div>

                    {newIssueForm.actionImages && newIssueForm.actionImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {newIssueForm.actionImages.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.name}
                              onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name })}
                              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewIssueActionImage(idx)}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                              title="삭제"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 7. 💬 회신 및 참석 현황 (기존 항목 수정 시 노출 - 오픈이슈 제외) */}
              {editingIssue && newIssueForm.category !== "오픈이슈" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>회신 및 참석 코멘트 ({newIssueForm.replies?.length || 0}건)</span>
                    </span>
                  </div>

                  {/* Reply list */}
                  {newIssueForm.replies && newIssueForm.replies.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {newIssueForm.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                              rep.attendanceStatus === "참석"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {rep.attendanceStatus || "확인"}
                            </span>
                            <strong className="text-slate-900 dark:text-white font-bold shrink-0">
                              {rep.author}
                            </strong>
                            <span className="text-slate-700 dark:text-slate-300 break-words">
                              {rep.content}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {rep.createdAt?.slice(5) || ""}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleModalDeleteReply(rep.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="회신 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Reply Input */}
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <select
                      value={replyForm.author || ""}
                      onChange={(e) => setReplyForm({ ...replyForm, author: e.target.value })}
                      className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
                    >
                      <option value="">-- 작성자 선택 --</option>
                      <optgroup label="👑 본사 임원진">
                        {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                          <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 삼랑진공장">
                        {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 한림공장">
                        {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🤝 협력업체">
                        {allWorkers.filter(w => w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                        ))}
                      </optgroup>
                    </select>
                    {newIssueForm.category === "회의일정" && (
                      <select
                        value={replyForm.attendanceStatus}
                        onChange={(e) => setReplyForm({ ...replyForm, attendanceStatus: e.target.value })}
                        className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
                      >
                        <option value="참석">참석</option>
                        <option value="불참">불참</option>
                        <option value="확인">확인</option>
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="회신 또는 전달 내용을 입력해 주세요"
                      value={replyForm.content}
                      onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white min-w-[140px]"
                    />
                    <button
                      type="button"
                      disabled={isSubmittingReply}
                      onClick={handleModalAddReply}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                    >
                      회신 등록
                    </button>
                  </div>
                </div>
              )}

              {/* 8. 하단 버튼 바 (삭제 / 취소 / 저장완료) */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  {editingIssue && !editingIssue.isDeleted && (
                    <button
                      type="button"
                      onClick={(e) => handleCancelRestore(editingIssue, e)}
                      className="px-3 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold flex items-center gap-1 text-xs cursor-pointer active:scale-95 transition-all"
                      title="첫 화면에서 내리고 관리목록으로 되돌리기"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>↩️ 복구 취소</span>
                    </button>
                  )}
                  {editingIssue ? (
                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteModal(editingIssue, e)}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80 font-bold flex items-center gap-1 text-xs cursor-pointer active:scale-95 transition-all"
                      title="이 항목 삭제 (총괄관리자 권한 필요)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  ) : <div></div>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseIssueModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                      newIssueForm.category === "회의일정"
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                        : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
                        : newIssueForm.category === "오픈이슈"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                        : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {editingIssue
                        ? "저장 및 처리 완료"
                        : newIssueForm.category === "회의일정"
                        ? "회의일정 등록"
                        : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                        ? "사내공지 등록"
                        : newIssueForm.category === "오픈이슈"
                        ? "오픈이슈 등록"
                        : "품질경보 등록"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🌟 2. 조치결과 / 회의결과 입력·수정 전용 팝업 모달 */}
      {/* ========================================================================= */}
      {actionModalData.isOpen && actionModalData.issue && typeof document !== "undefined" && createPortal((() => {
        const isMeetingAction = actionModalData.issue.category === "회의일정";
        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseActionModal();
              }
            }}
            className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp cursor-default"
            >
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl text-white shadow-xs ${isMeetingAction ? "bg-purple-600" : "bg-emerald-500"}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {isMeetingAction ? "회의결과 등록 및 종결 처리" : "조치결과 입력 및 조치완료 처리"}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      {isMeetingAction
                        ? "해당 회의일정에 대한 결정 사항 및 회의록을 기록합니다."
                        : "해당 품질경보 및 공지사항에 대한 조치 완료 결과를 기록합니다."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Target Issue Reference Info */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    actionModalData.issue.category === "회의일정"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      : actionModalData.issue.category === "공지사항" || actionModalData.issue.category === "사내공지"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : actionModalData.issue.category === "오픈이슈"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {actionModalData.issue.plant} • {
                      actionModalData.issue.category === "회의일정"
                        ? "📅 회의일정"
                        : (actionModalData.issue.category === "공지사항" || actionModalData.issue.category === "사내공지")
                        ? "📢 사내공지"
                        : actionModalData.issue.category === "오픈이슈"
                        ? "📌 오픈이슈"
                        : "🚨 품질경보"
                    }
                  </span>
                  <strong className="text-slate-900 dark:text-white font-black truncate">
                    {actionModalData.issue.title}
                  </strong>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {actionModalData.issue.content}
                </p>
              </div>

              <form onSubmit={handleSaveActionResult} className="space-y-3 sm:space-y-4 text-xs">
                {/* 조치자 / 작성자 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {isMeetingAction ? "작성자 / 보고자" : "조치자"} (직접 선택)
                  </label>
                  <select
                    value={actionModalData.actionAuthor || ""}
                    required
                    onChange={(e) => setActionModalData({ ...actionModalData, actionAuthor: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      !actionModalData.actionAuthor
                        ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}
                  >
                    <option value="">-- {isMeetingAction ? "작성자 / 보고자" : "조치자"} 직접 선택 (필수) --</option>
                    <optgroup label="👑 본사 임원진">
                      {allWorkers.filter(w => w.plantName === "본사").map((w) => (
                        <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 삼랑진공장">
                      {allWorkers.filter(w => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 한림공장">
                      {allWorkers.filter(w => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🤝 협력업체">
                      {allWorkers.filter(w => w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 결과 상세 내용 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {isMeetingAction ? "회의 결과 및 결정 사항" : "조치결과 상세 내용"}
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder={
                      isMeetingAction
                        ? "예:\n1. 품질 개선 프로세스 표준화 방안 확정\n2. 2공장 라인 적용 일정 수립 (다음 주 월요일부터 시행)\n3. 담당자별 후속 조치 업무 분장 완료"
                        : "예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
                    }
                    value={actionModalData.actionResult}
                    onChange={(e) => setActionModalData({ ...actionModalData, actionResult: e.target.value })}
                    className={`w-full p-3.5 rounded-xl border-2 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      isMeetingAction
                        ? "border-purple-500/50 dark:border-purple-500/40 focus:ring-purple-500"
                        : "border-emerald-500/50 dark:border-emerald-500/40 focus:ring-emerald-500"
                    }`}
                  ></textarea>
                </div>

                {/* 📷 사진 첨부 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Camera className={`w-3.5 h-3.5 ${isMeetingAction ? "text-purple-500" : "text-emerald-500"}`} />
                      <span>{isMeetingAction ? "회의록 / 결과 사진 첨부 (선택, 최대 3장)" : "조치 후 사진 첨부 (선택, 최대 3장)"}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {actionModalData.actionImages?.length || 0}/3장
                    </span>
                  </div>

                  {/* Dual Buttons: 1. 📸 즉시 카메라 촬영 / 2. 📁 앨범·파일 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Option 1: 📸 즉시 카메라 촬영 */}
                    <div>
                      <input
                        type="file"
                        id="action-issue-camera-input"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleActionImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="action-issue-camera-input"
                        className={`w-full py-2.5 px-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ${
                          (actionModalData.actionImages?.length || 0) >= 3
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : isMeetingAction
                            ? "border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-200 ring-1 ring-purple-500/30 font-black"
                            : "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30 font-black"
                        }`}
                      >
                        <Camera className={`w-4 h-4 shrink-0 ${isMeetingAction ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                        <span className="text-xs font-black truncate">
                          {isProcessingActionImages
                            ? "압축 처리 중..."
                            : (actionModalData.actionImages?.length || 0) >= 3
                            ? "최대 3장 완료"
                            : "📸 사진 즉시 촬영"}
                        </span>
                      </label>
                    </div>

                    {/* Option 2: 📁 앨범 / 파일 선택 */}
                    <div>
                      <input
                        type="file"
                        id="action-issue-gallery-input"
                        accept="image/*"
                        multiple
                        disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleActionImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="action-issue-gallery-input"
                        className={`w-full py-2.5 px-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                          (actionModalData.actionImages?.length || 0) >= 3
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold truncate">
                          📁 앨범/파일 선택
                        </span>
                      </label>
                    </div>
                  </div>

                  {actionModalData.actionImages && actionModalData.actionImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {actionModalData.actionImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name })}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveActionImage(idx)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseActionModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                      isMeetingAction
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isMeetingAction ? "회의결과 저장 및 종결" : "조치결과 저장 및 완료"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ========================================================================= */}
      {/* 🌟 3. 공장 품질경보 및 공지사항 삭제 전용 권한 확인 모달 (이명재 / 김동욱 권한 검증) */}
      {/* ========================================================================= */}
      {deleteModalData.isOpen && deleteModalData.issue && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "" });
            }
          }}
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp cursor-default"
          >
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    품질경보 및 공지사항 삭제 권한 확인
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    공장별 총괄관리자 전용 삭제 인증
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Issue Info Card */}
            <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  deleteModalData.issue.plant === "한림공장"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {deleteModalData.issue.plant}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  작성자: {deleteModalData.issue.author} ({deleteModalData.issue.createdAt})
                </span>
              </div>
              <div className="font-black text-slate-900 dark:text-white truncate pt-1">
                {deleteModalData.issue.title || deleteModalData.issue.content}
              </div>
            </div>

            {/* Authority Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {deleteModalData.issue.plant === "한림공장"
                    ? "한림공장 삭제 권한자: 김동욱 책임"
                    : deleteModalData.issue.plant === "삼랑진공장"
                    ? "삼랑진공장 삭제 권한자: 이명재 이사"
                    : "삭제 권한자: 총괄관리자 (이명재 이사 / 김동욱 책임)"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                삭제를 진행하려면 해당 총괄관리자의 확인 PIN을 입력해 주세요.
              </p>
            </div>

            {/* PIN Input Form */}
            <form onSubmit={handleConfirmDelete} className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs flex items-center justify-between">
                  <span>총괄관리자 / 관리자 확인 PIN</span>
                  <span className="text-[10.5px] font-normal text-slate-400">공장: 11 / 본사: 0090</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력 (예: 11 또는 0090)"
                  value={deleteModalData.pinInput}
                  onChange={(e) => setDeleteModalData((prev) => ({ ...prev, pinInput: e.target.value, errorMsg: "" }))}
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-600 shadow-xs"
                />

                {/* Quick Auto-fill PIN Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalData((prev) => ({ ...prev, pinInput: "11", errorMsg: "" }))}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    ⚡ 공장 PIN (11) 자동입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalData((prev) => ({ ...prev, pinInput: "0090", errorMsg: "" }))}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    👑 본사 PIN (0090) 자동입력
                  </button>
                </div>
              </div>

              {deleteModalData.errorMsg && (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{deleteModalData.errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={deleteModalData.isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteModalData.isDeleting ? "삭제 처리 중..." : "권한 인증 후 삭제"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 🌟 4. 텔레그램 연동 관리자(Admin) 권한 인증 모달 */}
      {/* ========================================================================= */}
      {telegramAdminPinModal.isOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" });
            }
          }}
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 연동 관리</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    관리자 권한 인증 후 설정 화면으로 진입합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Authority Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                <Lock className="w-3.5 h-3.5 text-sky-500" />
                <span>접속 권한: ADMIN 관리자</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                봇 토큰 및 그룹 채널 설정을 위해 ADMIN 관리자 PIN을 입력해 주세요.
              </p>
            </div>

            {/* PIN Input Form */}
            <form onSubmit={handleVerifyTelegramAdmin} className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs text-center">
                  ADMIN 관리자 확인 PIN (4자리)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력"
                  value={telegramAdminPinModal.pinInput}
                  onChange={(e) =>
                    setTelegramAdminPinModal({ ...telegramAdminPinModal, pinInput: e.target.value, errorMsg: "" })
                  }
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-xs"
                />
              </div>

              {telegramAdminPinModal.errorMsg && (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{telegramAdminPinModal.errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>인증 후 이동</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 🌟 5. 텔레그램 봇 실시간 알림 설정 모달 */}
      {/* ========================================================================= */}
      {isTelegramModalOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTelegramModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 실시간 알림 연동</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    품질경보, 모닝브리핑, 월간 경영손익 텔레그램 발송 연동
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTelegramConfig} className="space-y-3.5">
              {/* 실시간 알림 중단 / 재시작 전용 제어 박스 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${telegramConfig.enabled !== false ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span>실시간 연동 상태: {telegramConfig.enabled !== false ? "정상 가동 중" : "발송 일시 중단됨"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await toggleTelegramEnabled();
                      setTelegramConfig(res);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                      telegramConfig.enabled !== false
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 animate-pulse"
                    }`}
                  >
                    {telegramConfig.enabled !== false ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-rose-600 dark:fill-rose-400" />
                        <span>연동 일시중단</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>연동 재시작 (ON)</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {telegramConfig.enabled !== false
                    ? "🟢 현재 모든 실시간 알림이 단톡방에 정상 발송됩니다. 수정/점검 중 발송을 막으려면 [연동 일시중단]을 누르세요."
                    : "⏸️ 텔레그램 발송이 일시 중단되어 데이터 등록/수정/삭제 중 불필요한 알림이 발송되지 않습니다."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  텔레그램 Bot Token (API 토큰)
                </label>
                <input
                  type="text"
                  placeholder="예: 7812345678:AAHqK_..."
                  value={telegramConfig.botToken || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10.5px] text-slate-400">
                  @BotFather 에서 발급받은 공용 봇 토큰
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📢 일반 알림 채널 ID (오륙 통합방)</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">모닝/마감브리핑/품질경보</span>
                </label>
                <input
                  type="text"
                  placeholder="예: -4186792536 또는 -100..."
                  value={telegramConfig.chatId || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* 브리핑 발송 옵션 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    🌅 07:30 모닝브리핑 자동 발송 (월~토)
                  </span>
                  <input
                    type="checkbox"
                    checked={telegramConfig.sendDailyBriefing !== false}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, sendDailyBriefing: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    📢 17:00 일일마감브리핑 자동 발송 (월~토)
                  </span>
                  <input
                    type="checkbox"
                    checked={telegramConfig.sendDailyClosingBriefing !== false}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, sendDailyClosingBriefing: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>

              {/* Test Status Feedback */}
              {telegramTestResult && (
                <div className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200">
                  {telegramTestResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✅ 텔레그램 테스트 메시지가 성공적으로 전송되었습니다!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>❌ 전송 실패: {telegramTestResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={handleTestTelegram}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="오륙 통합방으로 테스트 발송"
                  >
                    <TelegramLogo className="w-3.5 h-3.5" />
                    <span>{testingTelegram ? "발송 중..." : "연결 테스트"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={sendingClosingBriefing}
                    onClick={handleSendDailyClosingBriefing}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="17:00 마감브리핑(품질경보+회의일정+사내공지+오픈이슈) 즉시 테스트 발송"
                  >
                    <span>📢</span>
                    <span>{sendingClosingBriefing ? "전송 중..." : "17:00 마감브리핑 발송"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {closingBriefingToast && (
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 마감브리핑 발송됨!
                    </span>
                  )}
                  {telegramSavedToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 저장됨!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    <span>설정 저장하기</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 🌟 Lightbox / High-Res Image Preview Modal */}
      {/* ========================================================================= */}
      {previewImageModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn cursor-pointer"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between p-3.5 px-5 bg-slate-950/80 border-b border-slate-800 text-white text-xs">
              <span className="font-bold truncate max-w-[240px] sm:max-w-md">
                {previewImageModal.name || "첨부 사진 확인"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name || "품질경보사진.jpg"}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                  title="사진 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">다운로드</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="p-3 sm:p-6 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.name}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
