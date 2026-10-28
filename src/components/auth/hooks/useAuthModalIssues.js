import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  sortIssuesByCustomPriority,
  sortIssuesByLatest,
  isMeetingExpired,
  isIssueClosed
} from "../../../services/urgentIssueService";
import { saveExtrusionQualityIssue } from "../../../services/extrusionQualityIssueService";
import { saveHanulQualityIssue } from "../../../services/hanulQualityIssueService";
import { saveYuseongQualityIssue } from "../../../services/yuseongQualityIssueService";
import { saveMachiningQualityIssue } from "../../../services/machiningQualityIssueService";
import { sendQualityActionTelegram } from "../../../services/telegramService";
import { useModalHistory } from "../../../utils/modalHistory";

import {
  isCatQualityAlert,
  isCatMeeting,
  isCatNotice,
  isCatOpenIssue,
  isFirstScreenIssue,
  createEmptyCategoryDraft
} from "./authIssueConstants";
import { useExternalQualityAlerts } from "./useExternalQualityAlerts";
import { useIssueLifecycle } from "./useIssueLifecycle";
import { useIssueActions } from "./useIssueActions";
import { useIssueTelegram } from "./useIssueTelegram";

/**
 * useAuthModalIssues
 * Main Facade Hook for AuthModal issues & notices:
 * Composes Lego submodules (External Alerts, Lifecycle/Delete, Actions/Opinions/Replies/Images, Telegram)
 * into a single unified, 100% backward-compatible interface.
 */
export const useAuthModalIssues = ({ todayDateStr, currentKstTimeStr, allWorkers = [] }) => {
  const { currentProfile } = useAuth();

  // 1. External Quality Alerts Hook (Extrusion, Hanul, Yuseong, Machining)
  const {
    extrusionQualityAlerts,
    setExtrusionQualityAlerts,
    hanulQualityIssues,
    setHanulQualityIssues,
    yuseongQualityIssues,
    setYuseongQualityIssues,
    machiningQualityIssues,
    setMachiningQualityIssues,
    externalQualityAlerts
  } = useExternalQualityAlerts({ todayDateStr });

  // 2. Urgent Issues Primary State & Realtime Subscription
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  useEffect(() => {
    const unsub = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues);
    });
    return () => unsub();
  }, []);

  // UI Modal & Filter States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [openedEditFromListModal, setOpenedEditFromListModal] = useState(false);
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);
  const [openIssueCategoryFilter, setOpenIssueCategoryFilter] = useState("all");
  const [ledgerCategoryTab, setLedgerCategoryTab] = useState("all");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [issueModalPage, setIssueModalPage] = useState(1);
  const [isIssueDetailMode, setIsIssueDetailMode] = useState(true);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

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

  const [categoryDrafts, setCategoryDrafts] = useState({
    "품질경보": createEmptyCategoryDraft("품질경보", "삼랑진공장", "", "", todayDateStr),
    "회의일정": createEmptyCategoryDraft("회의일정", "삼랑진공장", "", "", todayDateStr),
    "공지사항": createEmptyCategoryDraft("공지사항", "삼랑진공장", "", "", todayDateStr),
    "오픈이슈": createEmptyCategoryDraft("오픈이슈", "삼랑진공장", "", "", todayDateStr)
  });

  // 3. Issue Lifecycle Submodule (Delete PIN validation, Restore, Cancel Restore)
  const {
    deleteModalData,
    setDeleteModalData,
    restoreToast,
    setRestoreToast,
    handleOpenDeleteModal,
    handleConfirmDelete,
    handleRestoreIssue,
    handleCancelRestore,
    handleExecuteRestore,
    handleExecuteCancelRestore
  } = useIssueLifecycle({
    currentProfile,
    extrusionQualityAlerts,
    setExtrusionQualityAlerts,
    hanulQualityIssues,
    setHanulQualityIssues,
    yuseongQualityIssues,
    setYuseongQualityIssues,
    machiningQualityIssues,
    setMachiningQualityIssues,
    urgentIssues,
    setUrgentIssues,
    editingIssue,
    setEditingIssue,
    setIsIssueModalOpen,
    setOpenActionMenuId
  });

  // Modal Open / Edit Handler
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

  // 4. Issue Actions Submodule (Action result, Opinions, Replies, Image uploads & compression)
  const {
    actionModalData,
    setActionModalData,
    replyForm,
    setReplyForm,
    isSubmittingReply,
    setIsSubmittingReply,
    actionOpinionForm,
    setActionOpinionForm,
    isProcessingIssueImages,
    setIsProcessingIssueImages,
    isProcessingActionImages,
    setIsProcessingActionImages,
    handleOpenActionModal,
    handleCloseActionModal,
    handleSaveActionResult,
    handleSaveIssueEdit,
    handleExecuteMeetingResult,
    handleExecuteEditContent,
    handleModalAddOpinion,
    handleModalDeleteOpinion,
    handleModalAddReply,
    handleModalDeleteReply,
    handleIssueFiles,
    handleOpinionFiles,
    handleRemoveOpinionFile,
    handleActionImageFiles,
    handleNewIssueActionImageFiles,
    handleRemoveIssueImage,
    handleRemoveActionImage,
    handleRemoveNewIssueActionImage
  } = useIssueActions({
    currentProfile,
    todayDateStr,
    allWorkers,
    isSavingIssue,
    setIsSavingIssue,
    setRestoreToast,
    editingIssue,
    setEditingIssue,
    newIssueForm,
    setNewIssueForm,
    setUrgentIssues,
    extrusionQualityAlerts,
    setExtrusionQualityAlerts,
    hanulQualityIssues,
    setHanulQualityIssues,
    yuseongQualityIssues,
    setYuseongQualityIssues,
    machiningQualityIssues,
    setMachiningQualityIssues,
    selectedListItem,
    setSelectedListItem,
    setOpenActionMenuId,
    handleOpenEditIssue
  });

  // 5. Telegram Integration Submodule
  const {
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
    handleVerifyTelegramAdmin,
    handleSaveTelegramConfig,
    handleTestTelegram,
    handleSendDailyClosingBriefing
  } = useIssueTelegram();

  // Category switching inside Modal
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
        newIssueForm.authorTitle || "",
        todayDateStr
      );
      setNewIssueForm(freshDraft);
    }
  };

  const handleOpenNewIssue = (targetCategory = "오픈이슈") => {
    const cat = targetCategory === "사내공지" ? "공지사항" : targetCategory;
    const defaultAuthor = currentProfile?.name || "";
    const defaultTitle = currentProfile?.title || "선임";

    const freshDrafts = {
      "품질경보": createEmptyCategoryDraft("품질경보", "삼랑진공장", defaultAuthor, defaultTitle, todayDateStr),
      "회의일정": createEmptyCategoryDraft("회의일정", "삼랑진공장", defaultAuthor, defaultTitle, todayDateStr),
      "공지사항": createEmptyCategoryDraft("공지사항", "삼랑진공장", defaultAuthor, defaultTitle, todayDateStr),
      "오픈이슈": createEmptyCategoryDraft("오픈이슈", "삼랑진공장", defaultAuthor, defaultTitle, todayDateStr)
    };
    setCategoryDrafts(freshDrafts);
    setNewIssueForm(freshDrafts[cat] || freshDrafts["오픈이슈"]);
    setEditingIssue(null);
    setIsIssueDetailMode(false);
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

    // 1. 5개 공정 통합 부적합경보 (삭제 전까지 지속 노출)
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
      if (isCatQualityAlert(item.category)) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentKstTimeStr triggers re-check for expired meetings every minute
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

  // Modal History Back Button Handlers
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
    handleSendDailyClosingBriefing
  };
};

export default useAuthModalIssues;
