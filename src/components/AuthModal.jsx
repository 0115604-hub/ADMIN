import React, { useState, useEffect, useMemo } from "react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
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
  deleteIssueReply
} from "../services/urgentIssueService";
import { OryukLogo } from "./OryukLogo";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyClosingBriefingTelegram
} from "../services/telegramService";
import { compressImage } from "../utils/imageCompressor";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";

// Modularized Components
import { WorkerLoginSection } from "./auth/WorkerLoginSection";
import { TelegramConfigModal } from "./auth/TelegramConfigModal";
import { RealtimeIssueBoard } from "./issues/RealtimeIssueBoard";
import { IssueLedgerModal } from "./issues/IssueLedgerModal";
import { IssueEditModal } from "./issues/IssueEditModal";
import { IssueActionModal } from "./issues/IssueActionModal";
import { DeleteAuthModal } from "./issues/DeleteAuthModal";
import { ImagePreviewModal } from "./common/ImagePreviewModal";

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

  // 🌟 Global Auto-close all modals on popstate (뒤로가기 시 팝업 닫기 및 선택 초기화)
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      setIsIssueModalOpen(false);
      setIsListModalOpen(false);
      setActionModalData((prev) => ({ ...prev, isOpen: false }));
      setDeleteModalData((prev) => ({ ...prev, isOpen: false }));
      setIsTelegramModalOpen(false);
      setTelegramAdminPinModal((prev) => ({ ...prev, isOpen: false }));
      setPreviewImageModal(null);
      setSelectedUser(null);
    });
    return () => unsub();
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

  // Expiration helper
  const isMeetingExpired = (item) => {
    if (!item) return false;
    if (item.category !== "회의일정") return false;
    if (item.isManuallyRestored) return false;
    const mDate = item.expireDate || item.targetDate || "";
    if (!mDate) return false;
    if (mDate < todayDateStr) return true;
    if (mDate === todayDateStr) {
      const mTime = item.meetingTime || "99:99";
      return currentKstTimeStr >= mTime;
    }
    return false;
  };

  // Active issues calculation
  const activeIssues = useMemo(() => {
    return urgentIssues.filter((item) => {
      if (item.isDeleted) return false;
      if (item.isManuallyRestored) return true;
      if (item.category === "회의일정") {
        return !isMeetingExpired(item);
      }
      if (item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항") {
        if (item.expireDate && item.expireDate < todayDateStr) return false;
      }
      return true;
    });
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  // Metric counts
  const qualityAlertCount = useMemo(() => activeIssues.filter((i) => i.category === "품질경보").length, [activeIssues]);
  const meetingIssuesCount = useMemo(() => activeIssues.filter((i) => i.category === "회의일정").length, [activeIssues]);
  const qualityIssueCount = useMemo(() => activeIssues.filter((i) => i.category === "오픈이슈" || i.category === "품질이슈").length, [activeIssues]);
  const noticeIssuesCount = useMemo(() => activeIssues.filter((i) => i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항").length, [activeIssues]);

  // Displayed issues on first screen
  const displayedActiveIssues = useMemo(() => {
    if (openIssueCategoryFilter === "quality_alert") {
      return activeIssues.filter((i) => i.category === "품질경보");
    }
    if (openIssueCategoryFilter === "meeting") {
      return activeIssues.filter((i) => i.category === "회의일정");
    }
    if (openIssueCategoryFilter === "open_issue" || openIssueCategoryFilter === "quality_issue" || openIssueCategoryFilter === "quality") {
      return activeIssues.filter((i) => i.category === "오픈이슈" || i.category === "품질이슈");
    }
    if (openIssueCategoryFilter === "notice") {
      return activeIssues.filter((i) => i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항");
    }
    return activeIssues;
  }, [activeIssues, openIssueCategoryFilter]);

  // Ledger categories
  const allQualityAlerts = useMemo(() => urgentIssues.filter((i) => !i.isDeleted && i.category === "품질경보"), [urgentIssues]);
  const allMeetings = useMemo(() => urgentIssues.filter((i) => !i.isDeleted && i.category === "회의일정"), [urgentIssues]);
  const allQualityIssues = useMemo(() => urgentIssues.filter((i) => !i.isDeleted && (i.category === "오픈이슈" || i.category === "품질이슈")), [urgentIssues]);
  const allNotices = useMemo(() => urgentIssues.filter((i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항")), [urgentIssues]);
  const allClosedDeletedIssues = useMemo(() => {
    return urgentIssues.filter((i) => {
      if (i.isDeleted) return true;
      if (i.isManuallyRestored) return false;
      if (i.category === "회의일정") return isMeetingExpired(i);
      if (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") {
        return Boolean(i.expireDate && i.expireDate < todayDateStr);
      }
      return false;
    });
  }, [urgentIssues, todayDateStr, currentKstTimeStr]);

  // Filtered issues for ledger modal
  const filteredIssues = useMemo(() => {
    let list = urgentIssues;
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
    return list;
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
      setErrorMsg(selectedUser.role === "ADMIN" ? "관리자 PIN 번호(0090)가 일치하지 않습니다." : "PIN 번호가 일치하지 않습니다. (공장 PIN: 11)");
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
    if (!newIssueForm.author || !newIssueForm.author.trim()) {
      alert("작성자를 직접 선택해 주세요.");
      return;
    }
    if (!newIssueForm.content.trim() && !newIssueForm.title.trim()) {
      alert("제목 또는 상세 전달 내용을 입력해 주세요.");
      return;
    }

    const itemToSave = {
      ...(editingIssue || {}),
      ...newIssueForm,
      id: editingIssue?.id || `issue_${Date.now()}`,
      createdAt: editingIssue?.createdAt || undefined,
      isDeleted: editingIssue ? Boolean(editingIssue.isDeleted) : false,
      deletedBy: editingIssue?.deletedBy || "",
      deletedAt: editingIssue?.deletedAt || "",
      isManuallyRestored: editingIssue?.isManuallyRestored !== undefined ? editingIssue.isManuallyRestored : false
    };

    const saved = await saveUrgentIssue(itemToSave);
    if (saved) {
      setUrgentIssues((prev) => {
        const idx = prev.findIndex((i) => i.id === saved.id);
        if (idx >= 0) {
          const up = [...prev];
          up[idx] = saved;
          return up;
        }
        return [saved, ...prev];
      });
    }

    handleCloseIssueModal();
    setRestoreToast(editingIssue ? "✅ 항목이 성공적으로 수정되었습니다." : "✅ 새로운 항목이 등록되었습니다.");
    setTimeout(() => setRestoreToast(""), 3500);
  };

  // Restore & Cancel Restore
  const handleRestoreIssue = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await restoreUrgentIssue(id);
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === id ? updated : it)));
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
      setUrgentIssues((prev) => prev.map((it) => (it.id === actionModalData.issue.id ? updated : it)));
      if (selectedListItem && selectedListItem.id === actionModalData.issue.id) setSelectedListItem(updated);
      if (editingIssue && editingIssue.id === actionModalData.issue.id) setEditingIssue(updated);
    }

    handleCloseActionModal();
    setRestoreToast("✅ 회의/조치 결과가 성공적으로 저장되었습니다.");
    setTimeout(() => setRestoreToast(""), 3500);
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

  // Opinions & Replies Handlers
  const handleModalAddOpinion = async (e) => {
    if (e) e.preventDefault();
    const content = actionOpinionForm.content.trim();
    const opinionFiles = actionOpinionForm.files || [];
    if (!content && opinionFiles.length === 0) {
      alert("조치 의견 내용 또는 첨부파일을 입력해 주세요.");
      return;
    }
    const authorName = actionOpinionForm.author || currentProfile?.name || allWorkers[0]?.name || "설유철";
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
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
        }
      } catch (err) {
        console.error("Add opinion error:", err);
        alert("의견 등록 중 오류가 발생했습니다.");
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

      setNewIssueForm((prev) => ({ ...prev, replies: [...(prev.replies || []), newOp] }));
      setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
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
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
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
          author: replyForm.author,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim()
        });
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setReplyForm((prev) => ({ ...prev, content: "" }));
        }
      } else {
        const nowStr = new Date().toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
        }).replace(/\. /g, "-").replace(/\./g, "");

        const newRep = {
          id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          author: replyForm.author,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim(),
          createdAt: nowStr
        };
        setNewIssueForm((prev) => ({ ...prev, replies: [...(prev.replies || []), newRep] }));
        setReplyForm((prev) => ({ ...prev, content: "" }));
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
    if (!confirm("해당 회신을 삭제하시겠습니까?")) return;
    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, repId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-xl animate-fadeIn p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start min-h-screen max-w-full">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3.5 sm:p-6 sm:px-7">
          {/* Header Brand with Clickable OryukLogo */}
          <div className="text-center mb-3 sm:mb-4 flex flex-col items-center">
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
              const isQualityAlert = item.category === "품질경보";
              const catTab = isQualityAlert ? "quality_alert" : isMeeting ? "meeting" : isNotice ? "notice" : "open_issue";
              setLedgerCategoryTab(catTab);
              setSelectedListItem(null);
              setIssueModalPage(1);
              setIsListModalOpen(true);
            }}
          />

          {/* 👤 2. 작업자 로그인 섹션 */}
          <WorkerLoginSection
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
            onUserClick={handleUserClick}
            onPinSubmit={handlePinSubmit}
          />
        </div>
      </div>

      {/* 🌟 관리목록 대장 모달 */}
      <IssueLedgerModal
        isOpen={isListModalOpen}
        onClose={() => {
          setIsListModalOpen(false);
          setSelectedListItem(null);
        }}
        urgentIssues={urgentIssues}
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

      {/* 🌟 신규 등록 및 수정 상세 모달 */}
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
          setNewIssueForm((prev) => ({ ...prev, isResolved: toggled }));
          const updated = { ...editingIssue, isResolved: toggled };
          setEditingIssue(updated);
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          await saveUrgentIssue(updated);
        }}
      />

      {/* 🌟 회의결과 / 조치결과 모달 */}
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

      {/* 🌟 2단계 삭제 인증 모달 */}
      <DeleteAuthModal
        deleteModalData={deleteModalData}
        setDeleteModalData={setDeleteModalData}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* 🌟 텔레그램 연동 설정 모달 */}
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

      {/* 🌟 고화질 사진 미리보기 Lightbox */}
      <ImagePreviewModal
        previewImage={previewImageModal}
        onClose={() => setPreviewImageModal(null)}
      />
    </div>
  );
};
