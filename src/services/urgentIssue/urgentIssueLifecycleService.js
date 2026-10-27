import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "../../firebase";
import { sendQualityActionTelegram } from "../telegramService";
import { unregisterFromFourMLedger } from "../fourMChangePointService";
import {
  COLLECTION_NAME,
  HARD_DELETED_KEY
} from "./urgentIssueConstants.js";
import {
  sanitizeUrgentIssueItem,
  sortIssuesByCustomPriority
} from "./urgentIssueStatusHelpers.js";
import {
  getLocalUrgentIssues,
  saveLocalUrgentIssues
} from "./urgentIssueStorage.js";
import { saveUrgentIssue } from "./urgentIssueSaveService.js";

// In-flight deletion lock
const activeDeletes = new Set();

// Delete an urgent issue (소프트 삭제 - 첫화면/카테고리에서는 내리고 '종결삭제관리'로 보존 및 이동)
export const deleteUrgentIssue = async (id, deleterName = "") => {
  const strId = String(id || "");
  if (!strId) return getLocalUrgentIssues();

  try {
    const current = getLocalUrgentIssues();
    let target = current.find(
      (i) =>
        String(i.id) === strId ||
        String(i._docId) === strId ||
        String(i.customId) === strId
    );

    if (!target) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        snap.forEach((d) => {
          const data = d.data() || {};
          if (
            d.id === strId ||
            String(data.id) === strId ||
            String(data.customId) === strId ||
            String(data._docId) === strId
          ) {
            target = sanitizeUrgentIssueItem({ ...data, id: d.id, _docId: d.id });
          }
        });
      } catch (e) {
        console.warn("Firestore soft delete fetch fallback:", e);
      }
    }

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const archivedItem = {
      ...(target || { id: strId }),
      id: target?.id || strId,
      isDeleted: true,
      isManuallyRestored: false,
      deletedAt: nowStr,
      deletedBy: deleterName || "관리자"
    };

    // 1. Update in local storage
    const exists = current.some((i) => String(i.id) === strId || String(i._docId) === strId);
    const updated = exists
      ? current.map((i) => (String(i.id) === strId || String(i._docId) === strId ? archivedItem : i))
      : [archivedItem, ...current];
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    // 2. Update in Firestore with setDoc
    try {
      await setDoc(doc(db, COLLECTION_NAME, target?.id || strId), archivedItem);
    } catch (e) {
      console.warn("Firestore soft delete error fallback to local:", e);
    }

    return sorted;
  } catch (err) {
    console.error("deleteUrgentIssue error:", err);
    return getLocalUrgentIssues();
  }
};

// Hard Delete (영구 삭제 - DB에서 완전히 제거)
export const hardDeleteUrgentIssue = async (id, _deleterName = "") => {
  activeDeletes.delete(id);
  const strId = String(id || "");
  if (!strId) return getLocalUrgentIssues();

  try {
    try {
      const hardDeletedIds = JSON.parse(localStorage.getItem(HARD_DELETED_KEY) || "[]");
      if (!hardDeletedIds.includes(strId)) {
        hardDeletedIds.push(strId);
        localStorage.setItem(HARD_DELETED_KEY, JSON.stringify(hardDeletedIds));
      }
    } catch {}

    const current = getLocalUrgentIssues();
    const updated = current.filter(
      (i) =>
        String(i.id) !== strId &&
        String(i._docId) !== strId &&
        String(i.customId) !== strId
    );
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, strId));
    } catch (e) {
      console.warn("Direct doc deleteDoc fallback:", e);
    }

    // 영구삭제 시 4M 관리대장에서도 영구 제거
    try {
      await unregisterFromFourMLedger(strId);
    } catch (e) {
      console.warn("unregisterFromFourMLedger on hard delete warning:", e);
    }

    return sorted;
  } catch (err) {
    console.error("hardDeleteUrgentIssue error:", err);
    return getLocalUrgentIssues().filter((i) => String(i.id) !== strId);
  }
};

// Cancel Restore / Soft Archive (복구 취소 - 첫화면에서 내리고 관리대장에 보존)
export const cancelRestoreUrgentIssue = async (id, cancellerName = "복구 취소 (사용자)") => {
  try {
    const current = getLocalUrgentIssues();
    let target = current.find((i) => i.id === id);
    if (!target) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        snap.forEach((d) => {
          if (d.id === id) {
            target = sanitizeUrgentIssueItem({ id: d.id, ...d.data() });
          }
        });
      } catch (e) {
        console.warn("Firestore cancel restore fetch fallback:", e);
      }
    }
    if (!target) return current;

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const archivedItem = {
      ...target,
      isDeleted: true,
      isManuallyRestored: false,
      deletedAt: nowStr,
      deletedBy: cancellerName || "관리자"
    };

    const exists = current.some((i) => i.id === id);
    const updated = exists
      ? current.map((i) => (i.id === id ? archivedItem : i))
      : [archivedItem, ...current];
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), archivedItem);
    } catch (e) {
      console.warn("Firestore cancel restore fallback to local:", e);
    }

    return sorted;
  } catch (err) {
    console.error("cancelRestoreUrgentIssue error:", err);
    return getLocalUrgentIssues();
  }
};

// Restore an issue (복구 지원)
export const restoreUrgentIssue = async (id) => {
  activeDeletes.delete(id);
  const current = getLocalUrgentIssues();
  let target = current.find((i) => i.id === id);
  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === id) {
          target = sanitizeUrgentIssueItem({ id: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore restore fetch fallback:", e);
    }
  }
  if (!target) return current;

  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const isPast =
    (target.expireDate && target.expireDate < todayStr) ||
    (target.targetDate && target.targetDate < todayStr);

  const newExpireDate = isPast ? todayStr : (target.expireDate || target.targetDate || todayStr);

  let newMeetingTime = target.meetingTime || "18:00";
  if (target.category === "회의일정" || target.category?.includes("회의")) {
    const kstNow = new Date();
    const utc = kstNow.getTime() + (kstNow.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    const curH = kstDate.getHours();
    const curM = kstDate.getMinutes();
    const curTimeStr = `${String(curH).padStart(2, "0")}:${String(curM).padStart(2, "0")}`;
    if (!newMeetingTime || (newExpireDate <= todayStr && newMeetingTime <= curTimeStr)) {
      const nextH = Math.min(23, curH + 2);
      newMeetingTime = `${String(nextH).padStart(2, "0")}:00`;
    }
  }

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const restoredItem = {
    ...target,
    id,
    isDeleted: false,
    isResolved: false,
    isManuallyRestored: true,
    restoredAt: nowStr,
    expireDate: newExpireDate,
    targetDate: newExpireDate,
    meetingTime: newMeetingTime,
    deletedAt: "",
    deletedBy: ""
  };

  const existingIdx = current.findIndex((i) => i.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = restoredItem;
  } else {
    updated = [restoredItem, ...current];
  }

  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), restoredItem);
  } catch (e) {
    console.warn("Firestore restore fallback to local:", e);
  }

  return restoredItem;
};

// Update action result (조치결과 입력 및 조치완료 처리 - 품질경보만 텔레그램 발송)
export const updateUrgentIssueActionResult = async (id, actionResult, actionAuthor = "", actionImages = [], fallbackIssue = null) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => String(i.id) === String(id) || (i._docId && String(i._docId) === String(id)) || (i.customId && String(i.customId) === String(id))
  );

  if (!target && fallbackIssue) {
    target = fallbackIssue;
  }

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === id || String(d.data()?.id) === String(id)) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in updateUrgentIssueActionResult fallback:", e);
    }
  }

  if (!target) {
    console.warn("Target issue not found for updateUrgentIssueActionResult:", id);
    return null;
  }

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const trimmed = actionResult ? actionResult.trim() : "";
  const effectiveImages = actionImages && actionImages.length > 0 ? actionImages : (target.actionImages || []);
  const hasActionData = Boolean(trimmed || effectiveImages.length > 0);
  const finalActionResult = trimmed || (effectiveImages.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : "");
  const effectiveAuthor = actionAuthor || target.actionAuthor || target.author || "현장담당자";

  const existingReplies = Array.isArray(target.replies) ? [...target.replies] : [];
  if (hasActionData) {
    const lastRep = existingReplies[existingReplies.length - 1];
    if (!lastRep || lastRep.content !== finalActionResult) {
      existingReplies.push({
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        author: effectiveAuthor,
        authorTitle: target.authorTitle || "책임",
        plant: target.plant || "삼랑진공장",
        attendanceStatus: "확인",
        actionDate: nowStr.slice(0, 10),
        content: finalActionResult,
        files: effectiveImages,
        createdAt: nowStr
      });
    }
  }

  const updatedTarget = {
    ...target,
    ...(fallbackIssue ? {
      title: fallbackIssue.title || target.title,
      content: fallbackIssue.content !== undefined ? fallbackIssue.content : target.content,
      expireDate: fallbackIssue.expireDate || target.expireDate,
      meetingTime: fallbackIssue.meetingTime || target.meetingTime,
      meetingLocation: fallbackIssue.meetingLocation || target.meetingLocation
    } : {}),
    id: target.id || id,
    actionResult: finalActionResult,
    actionAuthor: effectiveAuthor,
    actionImages: effectiveImages,
    actionAt: hasActionData ? nowStr : "",
    replies: existingReplies,
    isResolved: hasActionData,
    status: hasActionData ? "RESOLVED" : (target.status || "ACTIVE"),
    isDeleted: target.isDeleted === true ? true : false,
    isClosedByAdmin: target.isDeleted === true ? true : false,
    isManuallyRestored: target.isDeleted === true ? Boolean(target.isManuallyRestored) : true
  };

  const saved = await saveUrgentIssue(updatedTarget, { isNew: false, skipTelegram: true });

  if (hasActionData && (updatedTarget.category === "품질경보" || updatedTarget.category === "부적합경보" || String(updatedTarget.category || "").includes("경보"))) {
    sendQualityActionTelegram(updatedTarget, {
      actionAuthor: updatedTarget.actionAuthor,
      actionContent: finalActionResult,
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
