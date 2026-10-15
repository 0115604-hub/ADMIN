import { useState, useEffect, useMemo } from "react";
import {
  getLocalCommonSchedules,
  saveCommonSchedule,
  deleteCommonSchedule,
  toggleCompleteCommonSchedule,
  subscribeCommonSchedules,
  subscribeCommonScheduleArchive,
  isScheduleExpired,
  addCommonScheduleComment,
  deleteCommonScheduleComment,
  cleanupExpiredCommonSchedules,
  isScheduleAdminRestricted,
  isUserAdminOrHeadquarter
} from "../../services/commonScheduleService";
import {
  sendCommonScheduleRegisteredTelegram,
  sendCommonScheduleCommentTelegram
} from "../../services/telegramService";
import { getKSTDateString, formatKSTDate } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";

/**
 * Custom hook for managing company-wide common schedules and real-time comments.
 */
export function useCommonSchedule({
  currentProfile,
  isAdmin,
  todayDateStr,
  setToastMessage,
  setLogSavedToast
}) {
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [commonScheduleFilterTab, setCommonScheduleFilterTab] = useState("all"); // 'all', 'active', 'archive'
  const [commonScheduleForm, setCommonScheduleForm] = useState({
    date: getKSTDateString(),
    time: "09:30",
    target: "세미나",
    title: ""
  });
  const [commonScheduleSaving, setCommonScheduleSaving] = useState(false);
  const [commonScheduleModalOpen, setCommonScheduleModalOpen] = useState(false);
  useModalHistory(
    commonScheduleModalOpen,
    () => setCommonScheduleModalOpen(false),
    "workerDashboardCommonScheduleModal"
  );
  const [commonScheduleArchive, setCommonScheduleArchive] = useState([]);
  const [selectedCommonScheduleForComments, setSelectedCommonScheduleForComments] = useState(null);
  const [commonScheduleCommentInput, setCommonScheduleCommentInput] = useState("");
  const [commonScheduleCommentSubmitting, setCommonScheduleCommentSubmitting] = useState(false);

  useEffect(() => {
    cleanupExpiredCommonSchedules();
    const unsubSched = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    const unsubArch = subscribeCommonScheduleArchive((archs) => {
      setCommonScheduleArchive(archs);
    });

    // 30초 주기로 시간 경과 일정 실시간 자동 삭제 및 대장 이관
    const timer = setInterval(() => {
      cleanupExpiredCommonSchedules();
    }, 30000);

    return () => {
      unsubSched();
      unsubArch();
      clearInterval(timer);
    };
  }, []);

  // 🔒 본사 ADMIN 작성 일정 일반 관리자/작업자 노출 방지 필터 헬퍼
  const isScheduleVisibleToUser = (schedule, profile) => {
    if (!schedule) return false;
    if (isUserAdminOrHeadquarter(profile)) return true;

    // 🔒 [철칙] ADMIN에서 작성된 내용은 타 일반 관리자/작업자에게 절대 공유/노출 금지
    if (isScheduleAdminRestricted(schedule)) return false;

    // 공장별 타겟 분리
    const userPlant = String(profile?.plant || "").trim();
    const target = String(schedule.target || "").trim();
    if (userPlant === "삼랑진공장" && target.includes("한림")) return false;
    if (userPlant === "한림공장" && target.includes("삼랑진")) return false;

    return true;
  };

  const allActiveCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    const now = Date.now();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    return commonSchedules
      .filter((s) => !s.isCompleted && (s.endDate || s.startDate || s.date) >= todayDateStr && isScheduleVisibleToUser(s, currentProfile))
      .map((s) => {
        const comments = Array.isArray(s.comments) ? s.comments : [];
        const isRecentItem = s.createdAt && (now - new Date(s.createdAt).getTime()) < TWO_DAYS_MS;
        const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;
        const isRecentComment = latestComment && latestComment.createdAt && (now - new Date(latestComment.createdAt).getTime()) < TWO_DAYS_MS;
        const hasNewMessage = Boolean(isRecentItem || isRecentComment || comments.length > 0);

        return {
          ...s,
          hasNewMessage,
          isRecent: isRecentItem
        };
      })
      .sort((a, b) => {
        if (a.hasNewMessage && !b.hasNewMessage) return -1;
        if (!a.hasNewMessage && b.hasNewMessage) return 1;
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, todayDateStr, currentProfile]);

  const hasNewScheduleMessage = useMemo(() => {
    return (allActiveCommonSchedules || []).some((item) => item.hasNewMessage);
  }, [allActiveCommonSchedules]);

  const uncompletedCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules
      .filter((s) => !s.isCompleted && isScheduleVisibleToUser(s, currentProfile))
      .sort((a, b) => {
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, currentProfile]);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => {
      if (s.isCompleted || !isScheduleVisibleToUser(s, currentProfile)) return false;
      const regDate = s.createdAt ? formatKSTDate(s.createdAt) : (s.startDate || s.date);
      const startDate = s.startDate || s.date;
      const endDate = s.endDate || startDate;
      const effectiveStart = regDate <= startDate ? regDate : startDate;
      return Boolean(effectiveStart && endDate && effectiveStart <= todayDateStr && todayDateStr <= endDate);
    });
  }, [commonSchedules, todayDateStr, currentProfile]);

  const scheduleCounts = useMemo(() => {
    const active = (commonSchedules || []).filter((s) => !isScheduleExpired(s) && !s.isCompleted && isScheduleVisibleToUser(s, currentProfile)).length;
    const archive = (commonScheduleArchive || []).filter((s) => isScheduleVisibleToUser(s, currentProfile)).length;
    return { all: active + archive, active, archive };
  }, [commonSchedules, commonScheduleArchive, currentProfile]);

  const modalFilteredSchedules = useMemo(() => {
    if (commonScheduleFilterTab === "archive") {
      return [...(commonScheduleArchive || [])]
        .filter((s) => isScheduleVisibleToUser(s, currentProfile))
        .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
    }
    // Default: active non-expired schedules
    return (commonSchedules || [])
      .filter((s) => !isScheduleExpired(s) && !s.isCompleted && isScheduleVisibleToUser(s, currentProfile))
      .sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, commonScheduleArchive, commonScheduleFilterTab, currentProfile]);

  const handleToggleCompleteCommonSchedule = async (id, currentCompleted) => {
    const nextCompleted = !currentCompleted;
    await toggleCompleteCommonSchedule(id, nextCompleted);
    setToastMessage(nextCompleted ? "일정이 완료 처리되었습니다." : "일정이 진행중으로 복원되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 2500);
  };

  const handleRegisterCommonSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!commonScheduleForm.title?.trim()) {
      alert("일정 내용을 입력해 주세요.");
      return;
    }
    setCommonScheduleSaving(true);
    try {
      const todayStr = getKSTDateString();
      const schedDate = commonScheduleForm.date || todayStr;
      const newSchedule = {
        ...commonScheduleForm,
        date: schedDate,
        startDate: schedDate,
        endDate: schedDate,
        createdAt: new Date().toISOString(),
        author: currentProfile?.name || "ADMIN"
      };
      const updated = await saveCommonSchedule(newSchedule);
      if (updated && Array.isArray(updated)) {
        setCommonSchedules(updated);
      }

      // 🚀 경영방으로 신규 일정 등록 알림 즉시 발송
      try {
        await sendCommonScheduleRegisteredTelegram(newSchedule);
      } catch (telErr) {
        console.warn("Telegram notification send error:", telErr);
      }

      setToastMessage("일정이 성공적으로 등록되었습니다!");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2500);

      setCommonScheduleForm({
        date: todayStr,
        time: "09:30",
        target: "세미나",
        title: ""
      });

      // 닫기 후 의견 팝업 열기
      setCommonScheduleModalOpen(false);
      setSelectedCommonScheduleForComments(newSchedule);
    } catch (err) {
      alert("일정 등록 중 오류 발생: " + err.message);
    } finally {
      setCommonScheduleSaving(false);
    }
  };

  const handleDeleteCommonSchedule = async (id) => {
    const item = (commonSchedules || []).find((s) => s.id === id);
    if (!isAdmin && item && item.author !== currentProfile?.name && item.userName !== currentProfile?.name) {
      alert("사내 공통일정은 관리자 또는 본인이 등록한 일정만 삭제할 수 있습니다.");
      return;
    }
    const title = item?.title ? `"${item.title}" ` : "";
    if (!window.confirm(`${title}일정을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
    await deleteCommonSchedule(id);
    setToastMessage("일정이 삭제되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  useEffect(() => {
    if (selectedCommonScheduleForComments && Array.isArray(commonSchedules)) {
      const latest = commonSchedules.find((s) => s.id === selectedCommonScheduleForComments.id);
      if (latest) {
        setSelectedCommonScheduleForComments(latest);
      }
    }
  }, [commonSchedules, selectedCommonScheduleForComments]);

  const handleAddCommonScheduleComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCommonScheduleForComments || !commonScheduleCommentInput.trim()) return;

    setCommonScheduleCommentSubmitting(true);
    try {
      const commentData = {
        author: currentProfile?.name || "관리자",
        role: currentProfile?.role || currentProfile?.title || "선임",
        plant: currentProfile?.plant || "",
        text: commonScheduleCommentInput.trim()
      };
      const res = await addCommonScheduleComment(selectedCommonScheduleForComments.id, commentData);
      if (res.updatedList) {
        setCommonSchedules(res.updatedList);
      }
      if (res.updatedItem) {
        setSelectedCommonScheduleForComments(res.updatedItem);
        // 즉시 텔레그램 발송 (경영방으로 새 의견 알림)
        try {
          await sendCommonScheduleCommentTelegram(res.updatedItem, res.newComment);
        } catch (tgErr) {
          console.warn("Telegram comment alert error:", tgErr);
        }
      }
      setCommonScheduleCommentInput("");
      setToastMessage("의견이 등록되었으며 경영방으로 전송되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("의견 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setCommonScheduleCommentSubmitting(false);
    }
  };

  const handleDeleteCommonScheduleComment = async (commentId) => {
    if (!selectedCommonScheduleForComments) return;
    if (!window.confirm("이 의견을 삭제하시겠습니까?")) return;
    try {
      const res = await deleteCommonScheduleComment(selectedCommonScheduleForComments.id, commentId);
      if (res.updatedList) {
        setCommonSchedules(res.updatedList);
      }
      if (res.updatedItem) {
        setSelectedCommonScheduleForComments(res.updatedItem);
      }
      setToastMessage("의견이 삭제되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  return {
    commonSchedules,
    setCommonSchedules,
    commonScheduleFilterTab,
    setCommonScheduleFilterTab,
    commonScheduleForm,
    setCommonScheduleForm,
    commonScheduleSaving,
    commonScheduleModalOpen,
    setCommonScheduleModalOpen,
    commonScheduleArchive,
    selectedCommonScheduleForComments,
    setSelectedCommonScheduleForComments,
    commonScheduleCommentInput,
    setCommonScheduleCommentInput,
    commonScheduleCommentSubmitting,
    isScheduleVisibleToUser,
    allActiveCommonSchedules,
    hasNewScheduleMessage,
    uncompletedCommonSchedules,
    todayCommonSchedules,
    scheduleCounts,
    modalFilteredSchedules,
    handleToggleCompleteCommonSchedule,
    handleRegisterCommonSchedule,
    handleDeleteCommonSchedule,
    handleAddCommonScheduleComment,
    handleDeleteCommonScheduleComment
  };
}
