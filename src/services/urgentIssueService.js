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

// Initial urgent issue samples (Empty by default to prevent zombie deleted items)
export const INITIAL_URGENT_ISSUES = [];

// Helper: Read local storage
export const getLocalUrgentIssues = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return [];
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

// Helper: Category Priority and Smart Sorting
// 1위: 품질경보 (최신 등록일시 내림차순)
// 2위: 회의일정 (다가오는 날짜 오름차순 + 시간 오름차순 + 최신등록 내림차순)
// 3위: 오픈이슈/품질이슈 (최신 등록/목표일 내림차순)
// 4위: 공지사항/사내공지/공유사항 (다가오는 만료/공지일 오름차순 + 최신등록 내림차순)
export const sortIssuesByCustomPriority = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [];

  const getCategoryPriority = (item) => {
    const cat = item?.category || "";
    if (cat === "품질경보") return 1;
    if (cat === "회의일정") return 2;
    if (cat === "오픈이슈" || cat === "품질이슈") return 3;
    return 4; // 공지사항, 사내공지, 공유사항
  };

  return [...list].sort((a, b) => {
    const prioA = getCategoryPriority(a);
    const prioB = getCategoryPriority(b);

    // 1. 카테고리 우선순위: 품질경보(1) -> 회의일정(2) -> 오픈이슈(3) -> 공지사항(4)
    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // 2. 카테고리별 내부 정렬
    // [1위: 품질경보] -> 등록순 (최신 등록일시/생성순 내림차순)
    if (prioA === 1) {
      const timeA = a.createdAt || "";
      const timeB = b.createdAt || "";
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }
      return String(b.id || "").localeCompare(String(a.id || ""));
    }

    // [2위: 회의일정] -> 다가오는 날짜순 (오름차순) + 시간순 + 최신등록순
    if (prioA === 2) {
      const dateA = a.expireDate || a.targetDate || "9999-99-99";
      const dateB = b.expireDate || b.targetDate || "9999-99-99";
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const timeA = a.meetingTime || "99:99";
      const timeB = b.meetingTime || "99:99";
      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    }

    // [3위: 오픈이슈] -> 최신 등록일 / 목표일 내림차순
    if (prioA === 3) {
      const timeA = a.createdAt || a.expireDate || "";
      const timeB = b.createdAt || b.expireDate || "";
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }
      return String(b.id || "").localeCompare(String(a.id || ""));
    }

    // [4위: 공지사항] -> 다가오는 날짜순 (오름차순: 만료/목표일 가까운 순) + 최신등록순
    if (prioA === 4) {
      const dateA = a.expireDate || a.targetDate || "9999-99-99";
      const dateB = b.expireDate || b.targetDate || "9999-99-99";
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    }

    return 0;
  });
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
          const item = { id: d.id, ...d.data() };
          list.push(item);
        });
        const sorted = sortIssuesByCustomPriority(list);
        saveLocalUrgentIssues(sorted);
        onUpdate(sorted);
      },
      (error) => {
        console.warn("Firestore urgent_issues sync warning (offline/rule):", error);
        onUpdate(sortIssuesByCustomPriority(getLocalUrgentIssues()));
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeUrgentIssues error:", e);
    onUpdate(sortIssuesByCustomPriority(getLocalUrgentIssues()));
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
    expireDate: issueData.expireDate || issueData.targetDate || "",
    targetDate: issueData.targetDate || issueData.expireDate || "",
    meetingTime: issueData.meetingTime || "",
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

  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

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
    attendanceStatus: replyData.attendanceStatus || "확인",
    actionDate: replyData.actionDate || replyData.date || nowStr.slice(0, 10),
    content: replyData.content ? replyData.content.trim() : "확인했습니다.",
    createdAt: nowStr
  };

  const updatedReplies = [...(target.replies || []), newReply];
  const updatedItem = {
    ...target,
    replies: updatedReplies
  };

  const saved = await saveUrgentIssue(updatedItem);
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

// Delete an urgent issue (Soft Delete: remains in registry/대장 with isDeleted: true)
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

    // Soft delete: Mark isDeleted: true so it is preserved in 대장
    const deletedItem = {
      ...target,
      isDeleted: true,
      deletedAt: nowStr,
      deletedBy: deleterName || "관리자"
    };

    const updated = current.map((i) => (i.id === id ? deletedItem : i));
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    // Save soft-deleted record to Firestore
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), deletedItem);
    } catch (e) {
      console.warn("Firestore soft delete fallback to local:", e);
    }

    return sorted;
  } finally {
    setTimeout(() => {
      activeDeletes.delete(id);
    }, 3000);
  }
};

// Hard Delete (영구 삭제 - 동일 동작)
export const hardDeleteUrgentIssue = async (id, deleterName = "") => {
  return deleteUrgentIssue(id, deleterName);
};

// Restore an issue (복구 지원)
export const restoreUrgentIssue = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  // If restoring an item whose date was in the past, update expireDate/targetDate to today
  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const isPast =
    (target.expireDate && target.expireDate < todayStr) ||
    (target.targetDate && target.targetDate < todayStr);

  const restoredItem = {
    ...target,
    isDeleted: false,
    isResolved: false,
    expireDate: isPast ? todayStr : (target.expireDate || ""),
    targetDate: isPast ? todayStr : (target.targetDate || ""),
    deletedAt: "",
    deletedBy: ""
  };

  const updated = current.map((i) => (i.id === id ? restoredItem : i));
  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), restoredItem);
  } catch (e) {
    console.warn("Firestore restore fallback to local:", e);
  }

  return sorted;
};

// Update action result (조치결과 입력 및 조치완료 처리 - 품질경보만 텔레그램 발송)
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

  // Trigger real-time Telegram notification ONLY for 품질경보 조치완료 (사내공지/회의일정은 등록시만 발송)
  if (trimmed && updatedTarget.category === "품질경보") {
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