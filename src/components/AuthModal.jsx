import React, { useState, useEffect, useMemo } from "react";
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
  Flame,
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
  LayoutList
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import { getKSTDateString } from "../utils/dateUtils";
import {
  getLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  deleteUrgentIssue,
  restoreUrgentIssue,
  updateUrgentIssueActionResult,
  addIssueReply,
  deleteIssueReply
} from "../services/urgentIssueService";
import { OryukLogo } from "./OryukLogo";
import { TelegramLogo } from "./TelegramLogo";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection
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
  const { loginWithProfile } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());

  // Urgent Issues State
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null); // Currently editing issue item (수정 모드)
  const [isListModalOpen, setIsListModalOpen] = useState(false); // List Modal Open State
  const [selectedListItem, setSelectedListItem] = useState(null); // Selected Item for Details & Restore
  const [restoreToast, setRestoreToast] = useState("");
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);
  const [issueViewMode, setIssueViewMode] = useState("auto"); // "auto" (>=2 is summary) | "summary" | "detailed"
  const [isDeletedListExpanded, setIsDeletedListExpanded] = useState(true); // Deleted registry toggle
  const [detailIssueModal, setDetailIssueModal] = useState(null); // Fallback / Action modal ref
  const [issueModalPage, setIssueModalPage] = useState(1);
  const [issueFilterTab, setIssueFilterTab] = useState("all"); // "all" | "unresolved" | "closed"
  const ISSUES_PER_PAGE = 5;

  // New Issue Form State (사진 첨부 지원)
  const [newIssueForm, setNewIssueForm] = useState({
    category: "품질경보",
    plant: "삼랑진공장",
    author: "방상국",
    authorTitle: "선임",
    title: "",
    content: "",
    images: [],
    actionResult: "",
    actionAuthor: "",
    actionImages: []
  });

  // Action Result Input Modal State (조치결과 전용 모달 + 조치사진 지원)
  const [actionModalData, setActionModalData] = useState({
    isOpen: false,
    issue: null,
    actionResult: "",
    actionAuthor: "설유철",
    actionImages: []
  });

  // Reply Form State for Meeting Schedule & Issue Comments (회신란)
  const [replyForm, setReplyForm] = useState({
    author: "방상국",
    attendanceStatus: "참석",
    content: ""
  });
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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

  // Filter categorized issues: 미결(Unresolved), 종결(Closed/Resolved), 전체(All)
  const unresolvedIssues = useMemo(() => {
    return urgentIssues.filter((i) => !i.isDeleted && !i.isResolved);
  }, [urgentIssues]);

  const closedIssues = useMemo(() => {
    return urgentIssues.filter((i) => !i.isDeleted && i.isResolved);
  }, [urgentIssues]);

  const deletedIssues = useMemo(() => {
    return urgentIssues.filter((i) => i.isDeleted);
  }, [urgentIssues]);

  const activeIssues = useMemo(() => {
    return urgentIssues.filter((i) => !i.isDeleted);
  }, [urgentIssues]);

  const qualityIssuesCount = useMemo(() => {
    return activeIssues.filter(
      (i) =>
        i.category === "품질경보" ||
        (!i.category?.includes("공지") &&
          !i.category?.includes("공유") &&
          i.category !== "회의일정")
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

  const meetingIssuesCount = useMemo(() => {
    return activeIssues.filter((i) => i.category === "회의일정").length;
  }, [activeIssues]);

  const isIssueSummaryMode = useMemo(() => {
    if (issueViewMode === "summary") return true;
    if (issueViewMode === "detailed") return false;
    return activeIssues.length >= 2;
  }, [issueViewMode, activeIssues.length]);

  const unresolvedActiveIssues = unresolvedIssues;

  const filteredIssues = useMemo(() => {
    if (issueFilterTab === "unresolved") return unresolvedIssues;
    if (issueFilterTab === "closed") return closedIssues;
    return urgentIssues.filter((i) => !i.isDeleted);
  }, [urgentIssues, issueFilterTab, unresolvedIssues, closedIssues]);

  const todayDateStr = useMemo(() => getKSTDateString(), []);

  // Count workers with active schedule registration for each plant (excluding '할일')
  const samrangjinLeaveCount = useMemo(() => {
    if (!PLANTS[0]?.workers || !annualLeaves) return 0;
    return PLANTS[0].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const hanlimLeaveCount = useMemo(() => {
    if (!PLANTS[1]?.workers || !annualLeaves) return 0;
    return PLANTS[1].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
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
      loginWithProfile(selectedUser.id, pin);
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

  // Open Edit Urgent Issue Modal (기존 품질경보/공지/회의 내용 수정)
  const handleOpenEditIssue = (issue, e) => {
    if (e) e.stopPropagation();
    setEditingIssue(issue);
    setNewIssueForm({
      id: issue.id,
      category: issue.category || "품질경보",
      plant: issue.plant || "삼랑진공장",
      author: issue.author || "방상국",
      authorTitle: issue.authorTitle || "선임",
      title: issue.title || "",
      content: issue.content || "",
      images: issue.images ? [...issue.images] : [],
      actionResult: issue.actionResult || "",
      actionAuthor: issue.actionAuthor || "",
      actionImages: issue.actionImages ? [...issue.actionImages] : []
    });
    setIsIssueModalOpen(true);
  };

  // Submit New or Edited Urgent Issue (품질경보: 기존색상 / 공유사항: 녹색 + 사진 첨부)
  const handleSaveNewIssue = async (e) => {
    e.preventDefault();
    if (!newIssueForm.title.trim()) {
      alert("이슈 제목을 입력해 주세요.");
      return;
    }
    if (!newIssueForm.content.trim()) {
      alert("상세 전달 내용을 입력해 주세요.");
      return;
    }

    const hasAction = Boolean(newIssueForm.actionResult && newIssueForm.actionResult.trim());
    await saveUrgentIssue({
      ...newIssueForm,
      id: editingIssue ? editingIssue.id : undefined,
      category: newIssueForm.category || "품질경보",
      images: newIssueForm.images || [],
      actionImages: newIssueForm.actionImages || [],
      actionAuthor: hasAction ? (newIssueForm.actionAuthor || newIssueForm.author) : (editingIssue?.actionAuthor || ""),
      actionAt: hasAction ? (editingIssue?.actionAt || new Date().toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\. /g, "-").replace(/\./g, "")) : (editingIssue?.actionAt || ""),
      isResolved: editingIssue ? editingIssue.isResolved : hasAction,
      createdAt: editingIssue ? editingIssue.createdAt : undefined,
      replies: editingIssue ? (editingIssue.replies || []) : []
    });

    setNewIssueForm({
      category: "품질경보",
      plant: "삼랑진공장",
      author: "방상국",
      authorTitle: "선임",
      title: "",
      content: "",
      images: [],
      actionResult: "",
      actionAuthor: "",
      actionImages: []
    });
    setEditingIssue(null);
    setIsIssueModalOpen(false);
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
      actionAuthor: issue.actionAuthor || "설유철",
      actionImages: issue.actionImages || []
    });
  };

  // Save Action Result (누구나 작성 및 수정 가능 + 사진 첨부)
  const handleSaveActionResult = async (e) => {
    e.preventDefault();
    if (!actionModalData.issue) return;
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
    }

    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "설유철",
      actionImages: []
    });
  };

  // Add Reply to Meeting Schedule or Issue (회신란)
  const handleAddReply = async (issueId, e) => {
    if (e) e.preventDefault();
    if (!issueId) return;
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
    setDeleteModalData({
      isOpen: true,
      issue,
      pinInput: "",
      errorMsg: ""
    });
  };

  // Confirm Delete with Authority Verification (이명재 / 김동욱 전용)
  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (deleteModalData.isDeleting) return;

    const issue = deleteModalData.issue;
    if (!issue) return;

    const plant = issue.plant;
    const inputPin = deleteModalData.pinInput.trim();

    // Authority Rules:
    // 이명재 이사 (PIN: 11) or 김동욱 책임 (PIN: 11) or ADMIN (PIN: 0090)
    let isAuthorized = (inputPin === "11" || inputPin === "0090");
    let expectedManager = "이명재 이사";

    if (inputPin === "11") {
      if (plant === "한림공장") {
        expectedManager = "김동욱 책임";
      } else {
        expectedManager = "이명재 이사";
      }
    } else if (inputPin === "0090") {
      expectedManager = "총괄관리자(Admin)";
    }

    if (!isAuthorized) {
      setDeleteModalData((prev) => ({
        ...prev,
        errorMsg: "삭제 권한이 없습니다. (이명재 이사 또는 김동욱 책임의 확인 PIN 번호가 일치하지 않습니다.)"
      }));
      return;
    }

    setDeleteModalData((prev) => ({ ...prev, isDeleting: true, errorMsg: "" }));

    try {
      const updated = await deleteUrgentIssue(issue.id, expectedManager);
      setUrgentIssues(updated);
      if (selectedListItem && selectedListItem.id === issue.id) {
        const delItem = updated.find((i) => i.id === issue.id);
        setSelectedListItem(delItem || null);
      }
      if (detailIssueModal && detailIssueModal.id === issue.id) {
        setDetailIssueModal(null);
      }
      setDeleteModalData({
        isOpen: false,
        issue: null,
        pinInput: "",
        errorMsg: "",
        isDeleting: false
      });
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteModalData((prev) => ({
        ...prev,
        isDeleting: false,
        errorMsg: "삭제 중 오류가 발생했습니다. 다시 시도해 주세요."
      }));
    }
  };

  // Restore Soft-Deleted Issue (삭제 취소 및 첫화면 품질경보 복구)
  const handleRestoreIssue = async (issueId, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await restoreUrgentIssue(issueId);
      setUrgentIssues(updated);
      const restored = updated.find((i) => i.id === issueId);
      if (restored) {
        setSelectedListItem(restored);
        setDetailIssueModal(restored);
      }
      setRestoreToast("✅ 해당 항목이 첫화면 품질경보로 정상 복구되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Restore error:", err);
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  // All workers list for author dropdown
  const allWorkers = useMemo(() => {
    const list = [];
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
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3.5 sm:p-6 sm:px-7">
          {/* Header Brand with Bright OryukLogo */}
          <div className="text-center mb-3 sm:mb-4 flex flex-col items-center">
            {/* Bright, Elevated Logo Container */}
            <div className="relative mb-1.5 sm:mb-2">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl sm:rounded-3xl blur-md opacity-40 animate-pulse"></div>
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-1.5 sm:p-2 shadow-xl border-2 border-white/80 dark:border-slate-700 flex items-center justify-center">
                <OryukLogo className="w-7 h-7 sm:w-10 sm:h-10 drop-shadow-md" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[10.5px] sm:text-xs font-black mb-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ORYUK SMART MES PORTAL</span>
            </div>

            <h2 className="text-base sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-blue-600 dark:text-blue-400">
                (주)오륙
              </span>
              <span>생산관리 통합시스템</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
              작업자 또는 관리자를 선택하여 안전하게 접속해 주세요.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 📢 ⭐ [요청사항 반영] 품질경보 • 공지사항 • 회의일정 대형 고시인성 패널 */}
          {/* ========================================================================= */}
          <div className="mb-3.5 sm:mb-5 rounded-2xl border-2 border-rose-300/80 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/30 shadow-md overflow-hidden transition-all min-w-0">
            {/* Panel Top Bar: Clean Single Line Title & Actions */}
            <div className="p-2 sm:p-3 flex items-center justify-between gap-2 border-b-2 border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-r from-rose-100/70 via-purple-50/50 to-emerald-50/50 dark:from-rose-950/60 dark:via-purple-950/40 dark:to-emerald-950/40">
              {/* Left: Clean Single-Line Title */}
              <div
                onClick={() => {
                  setIsListModalOpen(true);
                  setSelectedListItem(null);
                  setIssueFilterTab("all");
                  setIssueModalPage(1);
                }}
                className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                title="탭하여 품질경보·공지 관리대장 전체 팝업 열기"
              >
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-sm shrink-0">
                  <Megaphone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <h3 className="font-black text-xs sm:text-base md:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                  품질경보 • 공지사항 • 회의일정
                </h3>
              </div>

              {/* Right: [대장] [등록] & Fold/Unfold */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(true);
                    setSelectedListItem(null);
                    setIssueFilterTab("all");
                    setIssueModalPage(1);
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="품질경보·공지 관리대장 전체 리스트 보기"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>대장</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingIssue(null);
                    setNewIssueForm({
                      category: "품질경보",
                      plant: "삼랑진공장",
                      author: "방상국",
                      authorTitle: "선임",
                      title: "",
                      content: "",
                      images: [],
                      actionResult: "",
                      actionAuthor: "",
                      actionImages: []
                    });
                    setIsIssueModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-black bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  title="신규 품질경보, 사내공지, 회의일정 등록"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
                  <span>등록</span>
                </button>

                {/* Fold/Unfold Button */}
                {activeIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsIssueExpanded((prev) => !prev)}
                    className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title={isIssueExpanded ? "패널 접기" : "패널 펼치기"}
                  >
                    {isIssueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Panel Body: 2건 이상 시 드래그/스크롤 없이 모든 건수를 요약해서 한눈에 표시 */}
            {isIssueExpanded && activeIssues.length > 0 && (
              <div className="p-2 sm:p-3 space-y-2">
                {isIssueSummaryMode ? (
                  /* ========================================================================= */
                  /* 🌟 [요약 모드] 2건 이상일 때 스크롤/드래그 없이 모든 건수 한눈에 요약 표시 */
                  /* ========================================================================= */
                  <div className="space-y-1.5 sm:space-y-2">
                    {activeIssues.map((item, idx) => {
                      const isMeeting = item.category === "회의일정";
                      const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
                      const replyCount = item.replies?.length || 0;
                      const hasImages = (item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEditIssue(item)}
                          className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs cursor-pointer hover:shadow-md hover:border-rose-400 dark:hover:border-rose-700 active:scale-[0.99] group ${
                            item.isResolved
                              ? "bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                              : isMeeting
                              ? "bg-purple-50/50 dark:bg-purple-950/25 border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-400/20"
                              : isNotice
                              ? "bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/20"
                              : "bg-rose-50/50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-400/20"
                          }`}
                          title="탭하여 품질경보/공지 내용 수정 및 전체 사진 보기"
                        >
                          {/* Left: Badges, Title & Content Summary */}
                          <div className="flex items-start md:items-center gap-2 min-w-0 flex-1">
                            {/* Badges */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              {isMeeting ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-600 text-white shrink-0 shadow-2xs">
                                  🗓️ 회의
                                </span>
                              ) : isNotice ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shrink-0 shadow-2xs">
                                  📢 공지
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white shrink-0 shadow-2xs">
                                  🚨 경보
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-black shrink-0 ${
                                item.plant === "한림공장"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                  : item.plant === "삼랑진공장"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200"
                              }`}>
                                {item.plant}
                              </span>
                            </div>

                            {/* Title & Content Summary */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <h4 className={`text-xs sm:text-sm md:text-base font-black truncate group-hover:underline ${
                                  isMeeting
                                    ? "text-purple-800 dark:text-purple-300"
                                    : !isNotice
                                    ? "text-rose-700 dark:text-rose-300"
                                    : "text-slate-900 dark:text-white"
                                }`}>
                                  {item.title || item.content}
                                </h4>
                                {item.title && item.content && (
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate hidden lg:inline">
                                    - {item.content}
                                  </span>
                                )}
                              </div>

                              {/* Sub Row: Author, Date & Action Result Summary */}
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                                <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                  {item.author} ({item.createdAt})
                                </span>
                                {item.actionResult ? (
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate max-w-xs sm:max-w-md">
                                    • └ {isMeeting ? "회의결과" : "조치결과"}: {item.actionResult} ({item.actionAuthor || "작업자"})
                                  </span>
                                ) : (
                                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                    • ⚠️ {isMeeting ? "결과 대기중" : "조치 대기중"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Badges & One-touch Action Buttons */}
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 self-end md:self-auto flex-wrap sm:flex-nowrap">
                            {hasImages && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-0.5 border border-rose-200 dark:border-rose-900 shrink-0">
                                <Camera className="w-3 h-3" />
                                <span>사진</span>
                              </span>
                            )}
                            {replyCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-0.5 border border-purple-200 dark:border-purple-900 shrink-0">
                                <MessageCircle className="w-3 h-3" />
                                <span>회신 {replyCount}</span>
                              </span>
                            )}
                            {item.isResolved ? (
                              <span className="px-2 py-0.8 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                                조치완료
                              </span>
                            ) : (
                              <span className="px-2 py-0.8 rounded-md text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse shrink-0">
                                조치대기
                              </span>
                            )}

                            {/* Action Button: 조치결과 입력/수정 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenActionModal(item, e);
                              }}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer shadow-2xs ${
                                isMeeting
                                  ? item.actionResult
                                    ? "bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                                  : item.actionResult
                                  ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                  : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                              }`}
                              title={isMeeting ? "회의결과 입력/수정" : "조치결과 입력/수정"}
                            >
                              {isMeeting ? (item.actionResult ? "✏️ 결과" : "✍️ 결과") : (item.actionResult ? "✏️ 조치" : "✍️ 조치")}
                            </button>

                            {/* Edit Button: 기존 내용 전체 수정 */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditIssue(item, e)}
                              className="px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5 shadow-2xs cursor-pointer shrink-0"
                              title="기존 품질경보/공지 내용 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(item, e);
                              }}
                              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer shrink-0"
                              title={`${item.plant} 삭제 (권한자: 이명재 이사, 김동욱 책임)`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ========================================================================= */
                  /* 🌟 [상세 모드] 1건일 때 또는 상세 전환 시 크고 시원한 카드 표시 */
                  /* ========================================================================= */
                  <div className="space-y-2 sm:space-y-3">
                    {activeIssues.map((item) => {
                      const isMeeting = item.category === "회의일정";
                      const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
                      const replyCount = item.replies?.length || 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEditIssue(item)}
                          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-center gap-2 sm:gap-2.5 shadow-sm cursor-pointer hover:shadow-md hover:border-rose-400 dark:hover:border-rose-700 active:scale-[0.99] group ${
                            item.isResolved
                              ? "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                              : isMeeting
                              ? "bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-800/90 ring-2 ring-purple-400/20"
                              : isNotice
                              ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/90 ring-2 ring-emerald-400/20"
                              : "bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/90 ring-2 ring-rose-400/20"
                          }`}
                          title="탭하여 품질경보/공지 내용 수정하기"
                        >
                          {/* 1번째 줄: [품질경보/사내공지/회의일정] [공장] (작성자 시간) + [회신건수] [수정] [조치상태] [삭제] */}
                          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                              {isMeeting ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black bg-purple-600 text-white shrink-0 shadow-xs tracking-wide">
                                  🗓️ 회의일정
                                </span>
                              ) : isNotice ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black bg-emerald-600 text-white shrink-0 shadow-xs tracking-wide">
                                  📢 사내공지
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black bg-rose-600 text-white shrink-0 shadow-xs tracking-wide">
                                  🚨 품질경보
                                </span>
                              )}
                              <span className={`px-2 py-0.8 rounded-lg text-xs sm:text-sm font-black shrink-0 ${
                                item.plant === "한림공장"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                  : item.plant === "삼랑진공장"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200"
                              }`}>
                                {item.plant}
                              </span>
                              <span className="text-xs sm:text-sm text-slate-400 shrink-0 font-bold">
                                {item.author} • {item.createdAt}
                              </span>
                            </div>

                            {/* Right: Reply count, Edit badge, Status & Delete */}
                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                              {replyCount > 0 && (
                                <span className="px-2 py-0.8 rounded-lg text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-0.5">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>회신 {replyCount}</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditIssue(item, e)}
                                className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="기존 품질경보/공지 내용 수정"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>내용수정</span>
                              </button>
                              {item.isResolved ? (
                                <span className="px-2.5 py-0.8 rounded-lg text-xs sm:text-sm font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                                  조치완료
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.8 rounded-lg text-xs sm:text-sm font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse shadow-2xs">
                                  조치대기
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteModal(item, e);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                title={`${item.plant} 삭제 (권한자: 이명재 이사, 김동욱 책임)`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 2번째 줄: 텍스트 크기를 키워서 꽉 차게 전달내용/제목/본문 표시 */}
                          <div className="py-1 min-w-0">
                            {item.title ? (
                              <div>
                                <h4 className={`text-sm sm:text-base md:text-lg font-black leading-snug break-words group-hover:underline ${
                                  isMeeting
                                    ? "text-purple-700 dark:text-purple-300"
                                    : !isNotice
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-slate-900 dark:text-white"
                                }`}>
                                  {item.title}
                                </h4>
                                <p className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed break-words mt-1">
                                  {item.content}
                                </p>
                              </div>
                            ) : (
                              <p className={`text-sm sm:text-base md:text-lg font-black leading-snug break-words group-hover:underline ${
                                isMeeting
                                  ? "text-purple-700 dark:text-purple-300"
                                  : !isNotice
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-900 dark:text-white"
                              }`}>
                                {item.content}
                              </p>
                            )}
                          </div>

                          {/* 3번째 줄: └ 조치/회의결과: [내용] (작성자 시간) + [조치/결과입력] (크고 시원하게 배치) */}
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start sm:items-center gap-1.5 min-w-0 flex-1">
                              <span className="text-slate-400 font-black shrink-0 text-xs sm:text-sm">└</span>
                              {isMeeting ? (
                                item.actionResult ? (
                                  <div className="min-w-0 break-words text-xs sm:text-sm md:text-base">
                                    <span className="font-black text-purple-600 dark:text-purple-400 mr-1.5">
                                      회의결과:
                                    </span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                      {item.actionResult}
                                    </span>
                                    <span className="text-[11px] sm:text-xs text-purple-600 dark:text-purple-400 ml-1.5 font-bold">
                                      ({item.actionAuthor || "작업자"} • {item.actionAt})
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-bold">
                                    <span className="font-black mr-1">회의결과:</span>
                                    <span className="text-slate-400 italic">아직 등록된 회의결과가 없습니다.</span>
                                  </div>
                                )
                              ) : item.actionResult ? (
                                <div className="min-w-0 break-words text-xs sm:text-sm md:text-base">
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 mr-1.5">
                                    조치결과:
                                  </span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                    {item.actionResult}
                                  </span>
                                  <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                                    ({item.actionAuthor || "작업자"} • {item.actionAt})
                                  </span>
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold">
                                  <span className="font-black mr-1">조치결과:</span>
                                  <span className="text-slate-400 italic">아직 등록된 조치결과가 없습니다.</span>
                                </div>
                              )}
                            </div>

                            {/* Right: Action Input / Edit Button */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenActionModal(item, e);
                                }}
                                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-black transition-all shrink-0 active:scale-95 cursor-pointer shadow-xs ${
                                  isMeeting
                                    ? item.actionResult
                                      ? "bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                                    : item.actionResult
                                    ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
                                }`}
                              >
                                {isMeeting ? (item.actionResult ? "✏️ 결과수정" : "✍️ 결과입력") : (item.actionResult ? "✏️ 수정" : "✍️ 조치입력")}
                              </button>
                            </div>
                          </div>

                          {/* 4번째 줄: 첨부 사진 썸네일 (현장 사진 & 조치 사진 - 크기 확대) */}
                          {((item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0)) && (
                            <div className="flex items-center gap-3 pt-2 pl-2 flex-wrap border-t border-slate-100 dark:border-slate-800/80">
                              {/* 현장 첨부 사진 */}
                              {item.images && item.images.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>현장사진({item.images.length}장):</span>
                                  </span>
                                  {item.images.map((img, idx) => (
                                    <button
                                      key={img.id || idx}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImageModal({ url: img.dataUrl, name: img.name || `품질경보사진_${idx + 1}` });
                                      }}
                                      className="group/img relative rounded-xl overflow-hidden border-2 border-rose-300 dark:border-rose-900/60 hover:border-rose-500 transition-all shadow-xs cursor-pointer"
                                      title="클릭하여 원본 사진 크게 보기"
                                    >
                                      <img
                                        src={img.dataUrl}
                                        alt={img.name || "품질경보 사진"}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover group-hover/img:scale-110 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* 조치 완료 첨부 사진 */}
                              {item.actionImages && item.actionImages.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>조치사진({item.actionImages.length}장):</span>
                                  </span>
                                  {item.actionImages.map((img, idx) => (
                                    <button
                                      key={img.id || idx}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImageModal({ url: img.dataUrl, name: img.name || `조치사진_${idx + 1}` });
                                      }}
                                      className="group/img relative rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-900/60 hover:border-emerald-500 transition-all shadow-xs cursor-pointer"
                                      title="클릭하여 원본 사진 크게 보기"
                                    >
                                      <img
                                        src={img.dataUrl}
                                        alt={img.name || "조치 사진"}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover group-hover:scale-110 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 🗑️ ⭐ [요청사항 반영] 권한자 삭제 종결 이력 관리대장 (아래쪽 리스트 대장) */}
          {/* ========================================================================= */}
          {deletedIssues.length > 0 && (
            <div className="mb-3.5 sm:mb-5 rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 shadow-sm overflow-hidden transition-all min-w-0">
              {/* Deleted Registry Header Bar */}
              <div
                onClick={() => setIsDeletedListExpanded((prev) => !prev)}
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-800 transition-colors select-none"
                title="탭하여 삭제 종결 대장 펼치기/접기"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-slate-600 dark:bg-slate-700 text-white shadow-xs shrink-0">
                    <History className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-200">
                      🗑️ 삭제 종결 관리대장 (권한자 삭제 내역)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-black bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400/40">
                      총 {deletedIssues.length}건
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500 dark:text-slate-400">
                    {isDeletedListExpanded ? "대장 접기" : "대장 펼쳐보기"}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-300/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {isDeletedListExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Deleted List Body */}
              {isDeletedListExpanded && (
                <div className="p-2 sm:p-3 space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                  {deletedIssues.map((item) => {
                    const isMeeting = item.category === "회의일정";
                    const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
                    const totalImgCount = (item.images?.length || 0) + (item.actionImages?.length || 0);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenEditIssue(item)}
                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 hover:border-slate-400 dark:hover:border-slate-700 transition-all space-y-2 cursor-pointer group shadow-2xs"
                        title="탭하여 삭제된 내용 확인 및 수정/복구"
                      >
                        {/* Top row: Badges, Deletion info, Action Buttons */}
                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-600 text-white shrink-0">
                              🗑️ 삭제종결
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white shrink-0 ${
                              isMeeting ? "bg-purple-600" : isNotice ? "bg-emerald-600" : "bg-rose-600"
                            }`}>
                              {isMeeting ? "회의일정" : isNotice ? "사내공지" : "품질경보"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.plant}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold">
                              작성: {item.author} ({item.createdAt})
                            </span>
                            {item.deletedAt && (
                              <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                                삭제: {item.deletedBy || "권한자"} ({item.deletedAt})
                              </span>
                            )}
                          </div>

                          {/* Right: [내용 수정] & [복구] buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditIssue(item, e)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="삭제된 항목 내용 수정 및 복구"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleRestoreIssue(item.id, e)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              title="이 항목을 첫화면 품질경보로 복구"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>첫화면 복구</span>
                            </button>
                          </div>
                        </div>

                        {/* Content row (Strikethrough / muted styling) */}
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {item.title && (
                            <h5 className="font-bold text-slate-700 dark:text-slate-200 leading-snug line-through opacity-85">
                              {item.title}
                            </h5>
                          )}
                          <p className="text-[11.5px] leading-relaxed line-through opacity-75 mt-0.5 break-words">
                            {item.content}
                          </p>
                        </div>

                        {/* Action result if any */}
                        {item.actionResult && (
                          <div className="text-[11px] p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                            <span className="font-bold">조치결과:</span>
                            <span>{item.actionResult}</span>
                            {item.actionAuthor && <span className="text-[10px]">({item.actionAuthor} • {item.actionAt})</span>}
                          </div>
                        )}

                        {/* Photo count / thumbnails */}
                        {totalImgCount > 0 && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Camera className="w-3 h-3 text-slate-400" />
                              <span>첨부 사진 ({totalImgCount}장)</span>
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.images?.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.dataUrl}
                                  alt="사진"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImageModal({ url: img.dataUrl, name: img.name || `삭제항목사진_${idx + 1}` });
                                  }}
                                  className="w-7 h-7 rounded object-cover border border-slate-300 dark:border-slate-700 opacity-75 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                                  title="클릭하여 원본 보기"
                                />
                              ))}
                              {item.actionImages?.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.dataUrl}
                                  alt="조치사진"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImageModal({ url: img.dataUrl, name: img.name || `삭제조치사진_${idx + 1}` });
                                  }}
                                  className="w-7 h-7 rounded object-cover border border-emerald-400/50 opacity-75 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                                  title="클릭하여 원본 보기"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                        className={`px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all flex items-center justify-between gap-0.5 sm:gap-1 group cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 overflow-hidden ${
                          isMyeongjae
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black border border-amber-400 shadow-xs"
                            : leaveStatus?.isToday
                            ? "bg-rose-50/95 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/60 hover:border-rose-500 text-rose-950 dark:text-rose-100 shadow-xs"
                            : hasLeave
                            ? "bg-blue-50/95 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/50 hover:border-blue-500 text-blue-950 dark:text-blue-100 shadow-xs"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 text-purple-900 dark:text-purple-200"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                          <span className={`text-[10.5px] sm:text-xs font-black truncate min-w-0 flex-1 ${
                            isMyeongjae ? "text-slate-950 font-black" : "text-slate-900 dark:text-white"
                          }`}>
                            {worker.name}
                          </span>
                        </div>

                        <span className={`text-[7px] sm:text-[9.5px] font-bold shrink-0 px-1 py-0.2 rounded whitespace-nowrap tracking-tighter sm:tracking-normal ${
                          isMyeongjae
                            ? "text-slate-950 bg-amber-400/80 font-black"
                            : leaveStatus?.isToday
                            ? "text-white bg-rose-600 font-black shadow-2xs"
                            : hasLeave
                            ? "text-white bg-blue-600 font-black shadow-2xs"
                            : isPartner
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-slate-400 dark:text-slate-400"
                        }`}>
                          {hasLeave ? (
                            <>
                              <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                              <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                            </>
                          ) : isPartner ? (
                            "협력"
                          ) : (
                            worker.title || "선임"
                          )}
                        </span>
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

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                        className={`px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all flex items-center justify-between gap-0.5 sm:gap-1 group cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 overflow-hidden ${
                          isDongwook
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black border border-emerald-400 shadow-xs"
                            : leaveStatus?.isToday
                            ? "bg-rose-50/95 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/60 hover:border-rose-500 text-rose-950 dark:text-rose-100 shadow-xs"
                            : hasLeave
                            ? "bg-blue-50/95 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/50 hover:border-blue-500 text-blue-950 dark:text-blue-100 shadow-xs"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 text-purple-900 dark:text-purple-200"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                          <span className={`text-[10.5px] sm:text-xs font-black truncate min-w-0 flex-1 ${
                            isDongwook ? "text-white font-black" : "text-slate-900 dark:text-white"
                          }`}>
                            {worker.name}
                          </span>
                        </div>

                        <span className={`text-[7px] sm:text-[9.5px] font-bold shrink-0 px-1 py-0.2 rounded whitespace-nowrap tracking-tighter sm:tracking-normal ${
                          isDongwook
                            ? "text-white bg-emerald-700/80 font-black"
                            : leaveStatus?.isToday
                            ? "text-white bg-rose-600 font-black shadow-2xs"
                            : hasLeave
                            ? "text-white bg-blue-600 font-black shadow-2xs"
                            : isPartner
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-slate-400 dark:text-slate-400"
                        }`}>
                          {hasLeave ? (
                            <>
                              <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                              <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                            </>
                          ) : isPartner ? (
                            "협력"
                          ) : (
                            worker.title || "선임"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. BOTTOM ACTIONS: ADMIN */}
              {/* ========================================================================= */}
              <div className="pt-1.5 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                {ADMIN_USERS.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleUserClick(admin)}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-black transition-all shadow-2xs group active:scale-95 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{admin.displayName || admin.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PIN Input Form View */
            /* ========================================================================= */
            <form onSubmit={handlePinSubmit} className="space-y-4 animate-fadeIn">
              {/* Hero Spotlight Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-blue-950/30 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md ${
                    selectedUser.role === "ADMIN"
                      ? "bg-slate-800 ring-2 ring-indigo-500/40"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                      : "bg-amber-500 ring-2 ring-amber-400/40"
                  }`}>
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {selectedUser.role === "ADMIN" ? "최고 관리자 모드" : `${selectedUser.plant} • ${selectedUser.title || "작업자"}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>변경</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호 입력"
                      : "비밀번호(PIN) 입력"}
                  </span>
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder={
                    selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호"
                      : "비밀번호 입력"
                  }
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-black text-center tracking-widest focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>시스템 접속</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 0. 품질경보 • 공지사항 • 회의일정 관리대장 (리스트 목록 조회 & 복구 모달) */}
      {/* ========================================================================= */}
      {isListModalOpen && (() => {
        const totalIssuePages = Math.max(1, Math.ceil(filteredIssues.length / ISSUES_PER_PAGE));
        const validIssuePage = Math.min(Math.max(1, issueModalPage), totalIssuePages);
        const paginatedIssues = filteredIssues.slice(
          (validIssuePage - 1) * ISSUES_PER_PAGE,
          validIssuePage * ISSUES_PER_PAGE
        );

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn"
            onClick={() => {
              setIsListModalOpen(false);
              setSelectedListItem(null);
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp text-xs max-h-[94vh] flex flex-col"
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
                        품질경보 • 공지사항 • 회의일정 관리대장
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

              {/* 2. Filter Tabs: [전체] [⏳ 진행중] [✓ 종결대장] [신규등록] */}
              <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex-wrap">
                  {/* 1. [전체] */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueFilterTab("all");
                      setIssueModalPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                      issueFilterTab === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>전체</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {urgentIssues.length}
                    </span>
                  </button>

                  {/* 2. [진행중] */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueFilterTab("unresolved");
                      setIssueModalPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                      issueFilterTab === "unresolved"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>⏳ 진행중</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                      {unresolvedIssues.length}
                    </span>
                  </button>

                  {/* 3. [종결대장] */}
                  <button
                    type="button"
                    onClick={() => {
                      setIssueFilterTab("closed");
                      setIssueModalPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                      issueFilterTab === "closed"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>✓ 종결대장</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200">
                      {closedIssues.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 신규 등록</span>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[64vh]">
                {/* 🌟 3. Selected Item Preview & Restore Box (선택 시에만 나타나는 상단 복구 카드) */}
                {selectedListItem && (() => {
                  const item = urgentIssues.find((it) => it.id === selectedListItem.id) || selectedListItem;
                  const isItemDeleted = Boolean(item.isDeleted);
                  const isItemResolved = Boolean(item.isResolved);
                  const isItemMeeting = item.category === "회의일정";
                  const isItemNotice = item.category === "공지사항" || item.category === "공유사항";

                  return (
                    <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50/80 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-slate-900/70 border-2 border-blue-400/80 dark:border-blue-600 shadow-md space-y-2.5 animate-fadeIn">
                      {/* Selected Item Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                            isItemDeleted
                              ? "bg-slate-700"
                              : isItemMeeting
                              ? "bg-purple-600"
                              : isItemNotice
                              ? "bg-emerald-600"
                              : "bg-rose-600"
                          }`}>
                            {isItemDeleted ? "🗑️ 삭제됨" : isItemMeeting ? "📅 회의일정" : isItemNotice ? "📢 사내공지" : "🚨 품질경보"}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {item.plant}
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                            작성자: <strong>{item.author} {item.authorTitle || ""}</strong> ({item.createdAt})
                          </span>
                          {isItemDeleted && item.deletedAt && (
                            <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
                              • 삭제: {item.deletedBy || "관리자"} ({item.deletedAt})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedListItem(null)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="선택 해제"
                        >
                          선택 닫기 ✕
                        </button>
                      </div>

                      {/* Selected Item Content */}
                      <div className="space-y-1 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60">
                        {item.title && (
                          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                            {item.title}
                          </h4>
                        )}
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </div>
                        {item.actionResult && (
                          <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11.5px]">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">조치/결과: </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{item.actionResult}</span>
                            {item.actionAuthor && (
                              <span className="text-[10px] text-slate-400 ml-1">({item.actionAuthor} • {item.actionAt})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Photos Thumbnails if any */}
                      {((item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {item.images?.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.dataUrl}
                              alt="첨부사진"
                              onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `사진_${idx + 1}` })}
                              className="w-8 h-8 rounded-lg object-cover border border-rose-300 dark:border-rose-900 cursor-pointer hover:scale-105 transition-transform"
                              title="클릭하여 원본 보기"
                            />
                          ))}
                          {item.actionImages?.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.dataUrl}
                              alt="조치사진"
                              onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `조치사진_${idx + 1}` })}
                              className="w-8 h-8 rounded-lg object-cover border border-emerald-300 dark:border-emerald-900 cursor-pointer hover:scale-105 transition-transform"
                              title="클릭하여 원본 보기"
                            />
                          ))}
                        </div>
                      )}

                      {/* 🌟 복구 기능 버튼 (Restore Action Button) */}
                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              handleOpenEditIssue(item, e);
                              setIsListModalOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="이 항목 내용 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>내용 수정</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleRestoreIssue(item.id, e)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="이 항목을 첫화면 품질경보로 복구"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>이 항목 첫화면으로 복구</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 🌟 4. Clean List Table / Cards (리스트 목록 조회) */}
                <div className="space-y-1.5">
                  {paginatedIssues.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-lg">📭</div>
                      <p>
                        {issueFilterTab === "unresolved"
                          ? "현재 미결(조치대기) 상태인 항목이 없습니다. (모두 조치/종결됨)"
                          : issueFilterTab === "closed"
                          ? "종결(조치완료 또는 삭제)된 내역이 없습니다."
                          : "등록된 품질경보 및 공지사항이 없습니다."}
                      </p>
                    </div>
                  ) : (
                    paginatedIssues.map((it, idx) => {
                      const isCurrent = selectedListItem?.id === it.id;
                      const isItMeeting = it.category === "회의일정";
                      const isItNotice = it.category === "공지사항" || it.category === "공유사항";
                      const isItDeleted = Boolean(it.isDeleted);
                      const isItResolved = Boolean(it.isResolved);
                      const isItUnresolved = !isItDeleted && !isItResolved;
                      const itemNum = (validIssuePage - 1) * ISSUES_PER_PAGE + idx + 1;
                      const totalImgCount = (it.images?.length || 0) + (it.actionImages?.length || 0);

                      return (
                        <div
                          key={it.id || idx}
                          onClick={() => setSelectedListItem(it)}
                          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isCurrent
                              ? "bg-blue-50/95 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.005]"
                              : isItDeleted
                              ? "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 opacity-80"
                              : isItUnresolved
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/50"
                              : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/40"
                          }`}
                          title="클릭하여 상세 조회 및 복구"
                        >
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

                            {/* Category Badge */}
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black text-white shrink-0 shadow-2xs ${
                              isItDeleted
                                ? "bg-slate-600"
                                : isItMeeting
                                ? "bg-purple-600"
                                : isItNotice
                                ? "bg-emerald-600"
                                : "bg-rose-600"
                            }`}>
                              {isItDeleted ? "삭제" : isItMeeting ? "회의" : isItNotice ? "공지" : "경보"}
                            </span>

                            {/* Factory Badge */}
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 ${
                              it.plant === "한림공장"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : it.plant === "삼랑진공장"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            }`}>
                              {it.plant?.replace("공장", "") || "공장"}
                            </span>

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
                              {isItDeleted && it.deletedBy ? `삭제: ${it.deletedBy}` : `${it.author} • ${it.createdAt?.slice(5) || ""}`}
                            </span>
                          </div>

                          {/* Status & Action Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Status Badge */}
                            {isItDeleted ? (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                🗑️ 삭제종결
                              </span>
                            ) : isItResolved ? (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                ✓ 조치완료
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                                ⏳ 조치대기
                              </span>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                handleOpenEditIssue(it, e);
                                setIsListModalOpen(false);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10.5px] font-black shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 border border-amber-300 dark:border-amber-700"
                              title="내용 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>

                            {/* 🌟 Restore Button right on list row */}
                            <button
                              type="button"
                              onClick={(e) => handleRestoreIssue(it.id, e)}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-black shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                              title="첫화면 품질경보로 복구"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>복구</span>
                            </button>
                          </div>
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
      })()}

      {/* ========================================================================= */}
      {/* 🌟 1. 품질이슈 및 공유사항 등록 팝업 모달 (작업자 등록 창) */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white shadow-xs ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-600"
                    : newIssueForm.category === "공지사항"
                    ? "bg-emerald-600"
                    : "bg-rose-500"
                }`}>
                  {editingIssue ? <Edit3 className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {editingIssue
                      ? (newIssueForm.category === "회의일정"
                          ? "📅 회의일정 내용 수정"
                          : newIssueForm.category === "공지사항"
                          ? "📢 사내공지 내용 수정"
                          : "🚨 품질경보 내용 수정")
                      : (newIssueForm.category === "회의일정"
                          ? "사내 회의일정 등록"
                          : newIssueForm.category === "공지사항"
                          ? "사내 공지사항 등록"
                          : "품질경보 긴급 등록")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {editingIssue
                      ? "기존 등록 내용을 수정합니다. 저장 시 즉시 실시간으로 반영됩니다."
                      : "전작업자 작성 가능 • 등록 즉시 텔레그램 및 로그인 화면에 전파됩니다."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsIssueModalOpen(false);
                  setEditingIssue(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewIssue} className="space-y-3 sm:space-y-4 text-xs">
              {/* 구분 & 공장 */}
              <div className="space-y-3">
                {/* 3단 이슈 구분 선택: 품질경보(적색) / 사내공지(녹색) / 회의일정(보라색) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    구분 (3대 분류)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 1. 품질경보 (적색) */}
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

                    {/* 2. 사내공지 (녹색) */}
                    <button
                      type="button"
                      onClick={() => setNewIssueForm({ ...newIssueForm, category: "공지사항" })}
                      className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                        newIssueForm.category === "공지사항"
                          ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>📢 사내공지</span>
                    </button>

                    {/* 3. 회의일정 (보라색) */}
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
                  </div>
                </div>

                {/* 대상 공장 & 작성자 (전작업자 선택 가능) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      대상 공장
                    </label>
                    <select
                      value={newIssueForm.plant}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, plant: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="삼랑진공장">삼랑진공장</option>
                      <option value="한림공장">한림공장</option>
                      <option value="전사 공통">전사 공통</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      작성자 (전작업자)
                    </label>
                    <select
                      value={newIssueForm.author}
                      onChange={(e) => {
                        const found = allWorkers.find((w) => w.name === e.target.value);
                        setNewIssueForm({
                          ...newIssueForm,
                          author: e.target.value,
                          authorTitle: found?.title || "선임"
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      {allWorkers.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.plantName} • {w.name} {w.title || ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 제목 */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white"
                />
              </div>

              {/* 전달 내용 / 회의 일정 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {newIssueForm.category === "회의일정" ? "📅 회의 일정 및 안건 내용" : "📢 전달 내용"}
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder={
                    newIssueForm.category === "회의일정"
                      ? "• 일시: 2026-09-08(화) 14:00\n• 장소: 삼랑진공장 2층 대회의실\n• 안건: 압출 라인 히터 개선 및 불량율 저감 대책 회의 (각 라인 선임 필참)"
                      : "구체적인 상황 및 작업자 전달 사항을 입력해 주세요."
                  }
                  value={newIssueForm.content}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white"
                ></textarea>
                {newIssueForm.category === "회의일정" && (
                  <p className="text-[10.5px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                    * 회의일정은 전작업자가 등록할 수 있으며, 회의 결과 및 결정 사항을 간편하게 기록할 수 있습니다.
                  </p>
                )}
              </div>

              {/* 📷 현장 사진 첨부 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Camera className={`w-3.5 h-3.5 ${
                      newIssueForm.category === "회의일정"
                        ? "text-purple-500"
                        : newIssueForm.category === "공지사항"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`} />
                    <span>첨부 사진 (선택, 최대 3장)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {newIssueForm.images?.length || 0}/3장
                  </span>
                </div>

                {/* Dual Buttons: 1. 📸 즉시 카메라 촬영 (우선 순위: capture="environment") / 2. 📁 앨범·파일 선택 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: 📸 즉시 카메라 촬영 (모바일에서 탭 즉시 카메라 실행) */}
                  <div>
                    <input
                      type="file"
                      id="new-issue-camera-input"
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
                    <label
                      htmlFor="new-issue-camera-input"
                      className={`w-full py-2.5 px-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ${
                        (newIssueForm.images?.length || 0) >= 3
                          ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                          : newIssueForm.category === "회의일정"
                          ? "border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-200 ring-1 ring-purple-500/30 font-black"
                          : newIssueForm.category === "공지사항"
                          ? "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30 font-black"
                          : "border-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 ring-1 ring-rose-500/30 font-black"
                      }`}
                    >
                      <Camera className={`w-4 h-4 shrink-0 ${
                        newIssueForm.category === "회의일정"
                          ? "text-purple-600 dark:text-purple-400"
                          : newIssueForm.category === "공지사항"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`} />
                      <span className="text-xs font-black truncate">
                        {isProcessingIssueImages
                          ? "압축 처리 중..."
                          : (newIssueForm.images?.length || 0) >= 3
                          ? "최대 3장 완료"
                          : "📸 사진 즉시 촬영"}
                      </span>
                    </label>
                  </div>

                  {/* Option 2: 📁 앨범 / 파일 선택 (보조) */}
                  <div>
                    <input
                      type="file"
                      id="new-issue-gallery-input"
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
                    <label
                      htmlFor="new-issue-gallery-input"
                      className={`w-full py-2.5 px-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                        (newIssueForm.images?.length || 0) >= 3
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

              {/* 조치 결과 (선택 - 회의일정이 아닐 때 주로 활용) */}
              {newIssueForm.category !== "회의일정" && (
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ✓ 조치 결과 (선택 입력)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="이미 조치가 완료되었거나 조치 내용이 있는 경우 입력해 주세요 (미입력 시 조치대기 상태로 등록됩니다)."
                    value={newIssueForm.actionResult}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, actionResult: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white"
                  ></textarea>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsIssueModalOpen(false);
                    setEditingIssue(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                    newIssueForm.category === "회의일정"
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                      : newIssueForm.category === "공지사항"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
                      : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25"
                  }`}
                >
                  {editingIssue ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>
                    {editingIssue
                      ? "수정사항 저장 완료"
                      : newIssueForm.category === "회의일정"
                      ? "회의일정 등록"
                      : newIssueForm.category === "공지사항"
                      ? "사내공지 등록"
                      : "품질경보 등록"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🌟 2. 조치결과 / 회의결과 입력·수정 전용 팝업 모달 */}
      {/* ========================================================================= */}
      {actionModalData.isOpen && actionModalData.issue && (() => {
        const isMeetingAction = actionModalData.issue.category === "회의일정";
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp">
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
                  onClick={() => setActionModalData({ isOpen: false, issue: null, actionResult: "", actionAuthor: "설유철", actionImages: [] })}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
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
                      : actionModalData.issue.category === "공지사항"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {actionModalData.issue.plant} • {actionModalData.issue.category || "품질경보"}
                  </span>
                  <strong className="text-slate-900 dark:text-white font-black truncate">
                    {actionModalData.issue.title}
                  </strong>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  📢 {actionModalData.issue.content}
                </p>
              </div>

              <form onSubmit={handleSaveActionResult} className="space-y-3 sm:space-y-4 text-xs">
                {/* 조치자 / 작성자 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {isMeetingAction ? "작성자 / 보고자" : "조치자"}
                  </label>
                  <select
                    value={actionModalData.actionAuthor}
                    onChange={(e) => setActionModalData({ ...actionModalData, actionAuthor: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {allWorkers.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.plantName} • {w.name} {w.title || ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 결과 상세 내용 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {isMeetingAction ? "✓ 회의 결과 및 결정 사항" : "✓ 조치결과 상세 내용"}
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
                    onClick={() => setActionModalData({ isOpen: false, issue: null, actionResult: "", actionAuthor: "설유철" })}
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
      })()}

      {/* ========================================================================= */}
      {/* 🌟 3. 공장 품질경보 및 공지사항 삭제 전용 권한 확인 모달 (이명재 / 김동욱 권한 검증) */}
      {/* ========================================================================= */}
      {deleteModalData.isOpen && deleteModalData.issue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp">
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
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs">
                  총괄관리자 확인 PIN (2자리)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력"
                  value={deleteModalData.pinInput}
                  onChange={(e) => setDeleteModalData({ ...deleteModalData, pinInput: e.target.value, errorMsg: "" })}
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-600 shadow-xs"
                />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 4. 텔레그램 연동 관리자(Admin) 권한 인증 모달 */}
      {/* ========================================================================= */}
      {telegramAdminPinModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 5. 텔레그램 봇 실시간 알림 설정 모달 */}
      {/* ========================================================================= */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp">
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
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  실시간 알림 사용 상태
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramConfig.enabled}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {telegramConfig.enabled ? "켜짐(ON)" : "꺼짐(OFF)"}
                  </span>
                </label>
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
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">모닝브리핑/품질경보</span>
                </label>
                <input
                  type="text"
                  placeholder="예: -4186792536 또는 -100..."
                  value={telegramConfig.chatId || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
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
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={handleTestTelegram}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="오륙 통합방으로 테스트 발송"
                  >
                    <TelegramLogo className="w-3.5 h-3.5" />
                    <span>{testingTelegram ? "발송 중..." : "연결 테스트 발송"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 Lightbox / High-Res Image Preview Modal */}
      {/* ========================================================================= */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
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
        </div>
      )}
    </div>
  );
};
