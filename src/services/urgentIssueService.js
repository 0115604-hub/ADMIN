import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import {
  sendQualityAlertTelegram,
  sendQualityActionTelegram,
  sendQualityDeleteTelegram,
  sendMeetingReplyTelegram
} from "./telegramService";

const COLLECTION_NAME = "urgent_issues";
const LOCAL_STORAGE_KEY = "oryuk_urgent_issues_v2";

// Initial urgent issue samples (Categorized as "품질경보", "공지사항", "회의일정")
export const INITIAL_URGENT_ISSUES = [
  {
    id: "issue_init_1",
    plant: "삼랑진공장",
    author: "방상국",
    authorTitle: "선임",
    category: "품질경보",
    title: "압출 2호기 히터 온도 점검 요망",
    content: "압출 2호기 금형 히터 온도 센서 이상 경보 발생. 교대 작업 전 사전 예열 상태 및 온도 확인 필수",
    actionResult: "센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (가동 재개)",
    actionAuthor: "설유철",
    actionAt: "2026-09-03 09:20",
    isResolved: true,
    replies: [],
    createdAt: "2026-09-03 08:30"
  },
  {
    id: "issue_init_2",
    plant: "한림공장",
    author: "우창용",
    authorTitle: "선임",
    category: "공지사항",
    title: "CHANNEL 밴딩 라인 신규 원료 투입",
    content: "오후 출하 물량 대응을 위해 신규 원재료 로트 투입 완료. 초품 치수 검사 철저히 진행 요망",
    actionResult: "",
    actionAuthor: "",
    actionAt: "",
    isResolved: false,
    replies: [],
    createdAt: "2026-09-03 09:15"
  },
  {
    id: "issue_init_3",
    plant: "삼랑진공장",
    author: "전찬우",
    authorTitle: "선임",
    category: "회의일정",
    title: "9월 2주차 생산성 향상 및 품질 개선 주간 회의",
    content: "• 일시: 2026-09-08(화) 14:00\n• 장소: 삼랑진공장 2층 대회의실\n• 안건: 압출 라인 히터 개선 및 불량율 저감 대책 회의 (각 라인 선임 필참)",
    actionResult: "",
    actionAuthor: "",
    actionAt: "",
    isResolved: false,
    replies: [
      {
        id: "rep_init_1",
        author: "방상국",
        authorTitle: "선임",
        plant: "삼랑진공장",
        attendanceStatus: "참석",
        content: "확인했습니다. 2호기 데이터 정리하여 참석하겠습니다.",
        createdAt: "2026-09-07 10:00"
      },
      {
        id: "rep_init_2",
        author: "설유철",
        authorTitle: "선임",
        plant: "삼랑진공장",
        attendanceStatus: "참석",
        content: "참석 예정입니다.",
        createdAt: "2026-09-07 10:30"
      }
    ],
    createdAt: "2026-09-07 09:00"
  }
];

// Helper: Read local storage
export const getLocalUrgentIssues = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_URGENT_ISSUES));
      return INITIAL_URGENT_ISSUES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return INITIAL_URGENT_ISSUES;
  }
};

// Helper: Save local storage
export const saveLocalUrgentIssues = (issues) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(issues));
  } catch (e) {
    console.error("Local storage write error for urgent issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeUrgentIssues = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        // Sort by createdAt descending
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        saveLocalUrgentIssues(list);
        onUpdate(list);
      },
      (error) => {
        console.warn("Firestore urgent_issues sync warning (offline/rule):", error);
        onUpdate(getLocalUrgentIssues());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeUrgentIssues error:", e);
    onUpdate(getLocalUrgentIssues());
    return () => {};
  }
};

// Add or update an urgent issue
export const saveUrgentIssue = async (issueData) => {
  const current = getLocalUrgentIssues();
  const id = issueData.id || `issue_${Date.now()}`;
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const fullItem = {
    ...issueData,
    id,
    category: issueData.category || "품질경보",
    images: issueData.images || [],
    actionImages: issueData.actionImages || [],
    actionResult: issueData.actionResult || "",
    actionAuthor: issueData.actionAuthor || "",
    actionAt: issueData.actionAt || "",
    replies: issueData.replies || [],
    isResolved: issueData.isResolved !== undefined ? issueData.isResolved : (Boolean(issueData.actionResult && issueData.actionResult.trim())),
    isDeleted: issueData.isDeleted === true,
    deletedAt: issueData.deletedAt || "",
    deletedBy: issueData.deletedBy || "",
    createdAt: issueData.createdAt || nowStr
  };

  const existingIdx = current.findIndex((i) => i.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalUrgentIssues(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
  } catch (e) {
    console.warn("Firestore save urgent issue fallback to local:", e);
  }

  // Trigger real-time Telegram notification for new alert / issue
  if (existingIdx < 0 && !fullItem.isDeleted) {
    sendQualityAlertTelegram(fullItem).catch((err) => {
      console.warn("Telegram alert error:", err);
    });
  }

  return fullItem;
};

// Add a Reply / Attendance Response (회신란)
export const addIssueReply = async (issueId, replyData) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === issueId);
  if (!target) return null;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const newReply = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: replyData.author || "작업자",
    authorTitle: replyData.authorTitle || "선임",
    plant: replyData.plant || target.plant || "삼랑진공장",
    attendanceStatus: replyData.attendanceStatus || "참석",
    content: replyData.content ? replyData.content.trim() : "확인했습니다.",
    createdAt: nowStr
  };

  const updatedReplies = [...(target.replies || []), newReply];
  const updatedItem = {
    ...target,
    replies: updatedReplies
  };

  const saved = await saveUrgentIssue(updatedItem);

  // Trigger real-time Telegram notification for reply
  try {
    await sendMeetingReplyTelegram(target, newReply);
  } catch (err) {
    console.warn("Telegram meeting reply alert error:", err);
  }

  return saved;
};

// Delete a Reply
export const deleteIssueReply = async (issueId, replyId) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === issueId);
  if (!target) return null;

  const updatedReplies = (target.replies || []).filter((r) => r.id !== replyId);
  const updatedItem = {
    ...target,
    replies: updatedReplies
  };

  return await saveUrgentIssue(updatedItem);
};

// In-flight deletion lock to prevent duplicate Telegram messages and race conditions
const activeDeletes = new Set();

// Soft Delete an urgent issue (삭제 이력 보존)
export const deleteUrgentIssue = async (id, deleterName = "") => {
  if (activeDeletes.has(id)) {
    return getLocalUrgentIssues();
  }
  activeDeletes.add(id);

  try {
    const current = getLocalUrgentIssues();
    const target = current.find((i) => i.id === id);
    if (!target) return current;

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const deletedItem = {
      ...target,
      isDeleted: true,
      deletedAt: nowStr,
      deletedBy: deleterName || "관리자"
    };

    const updated = current.map((i) => (i.id === id ? deletedItem : i));
    saveLocalUrgentIssues(updated);

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), deletedItem);
    } catch (e) {
      console.warn("Firestore soft delete urgent issue fallback to local:", e);
    }

    // Trigger Telegram notification on delete (exactly once)
    try {
      await sendQualityDeleteTelegram(deletedItem, deleterName);
    } catch (err) {
      console.warn("Telegram delete alert error:", err);
    }

    return updated;
  } finally {
    setTimeout(() => {
      activeDeletes.delete(id);
    }, 3000);
  }
};

// Restore a soft-deleted urgent issue (삭제 취소 및 정상 복구)
export const restoreUrgentIssue = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const restoredItem = {
    ...target,
    isDeleted: false,
    deletedAt: "",
    deletedBy: ""
  };

  const updated = current.map((i) => (i.id === id ? restoredItem : i));
  saveLocalUrgentIssues(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), restoredItem);
  } catch (e) {
    console.warn("Firestore restore urgent issue fallback to local:", e);
  }

  return updated;
};

// Hard Delete (영구 삭제)
export const hardDeleteUrgentIssue = async (id) => {
  const current = getLocalUrgentIssues();
  const updated = current.filter((i) => i.id !== id);
  saveLocalUrgentIssues(updated);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore hard delete fallback to local:", e);
  }

  return updated;
};

// Update action result (조치결과 입력 및 조치완료 처리)
export const updateUrgentIssueActionResult = async (id, actionResult, actionAuthor = "", actionImages = []) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const trimmed = actionResult ? actionResult.trim() : "";
  const updatedTarget = {
    ...target,
    actionResult: trimmed,
    actionAuthor: actionAuthor || target.actionAuthor || "작업자",
    actionImages: actionImages && actionImages.length > 0 ? actionImages : (target.actionImages || []),
    actionAt: trimmed ? nowStr : "",
    isResolved: Boolean(trimmed)
  };

  const saved = await saveUrgentIssue(updatedTarget);

  // Trigger real-time Telegram notification for action completed
  if (trimmed) {
    sendQualityActionTelegram(updatedTarget, {
      actionAuthor: updatedTarget.actionAuthor,
      actionContent: trimmed,
      actionRate: 100,
      images: updatedTarget.actionImages
    }).catch((err) => {
      console.warn("Telegram action notification error:", err);
    });
  }

  return saved;
};

// Toggle issue resolution status
export const toggleIssueResolved = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const updatedTarget = { ...target, isResolved: !target.isResolved };
  return await saveUrgentIssue(updatedTarget);
};