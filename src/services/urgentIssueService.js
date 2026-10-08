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
  sendQualityOpinionTelegram,
  sendQualityActionTelegram,
  sendQualityDeleteTelegram,
  sendMeetingReplyTelegram,
  sendOpenIssueAlertTelegram,
  sendOpenIssueReplyTelegram,
  sendMeetingNoticeAlertTelegram,
  sendMeetingNoticeReplyTelegram
} from "./telegramService";
import { getKSTTimeInfo, getKSTDateString } from "../utils/dateUtils";

const COLLECTION_NAME = "urgent_issues";
const LOCAL_STORAGE_KEY = "oryuk_urgent_issues_v2";

const todayDateStrFallback = () => getKSTDateString();

/**
 * 회의일정이 지정 일시 경과했는지 판별 (일정 경과 시 첫화면 및 활성목록에서 제외되어 [종결삭제관리]로 이동)
 * @param {Object} item - { category, startDate, date, expireDate, targetDate, meetingDate, meetingTime, isManuallyRestored }
 * @param {number} graceHours - 경과 기준 시간 (기본 0시간)
 * @returns {boolean}
 */
export const isMeetingExpired = (item, graceHours = 0) => {
  if (!item || typeof item !== "object") return false;
  const cat = String(item.category || "").trim();
  if (cat !== "회의일정" && !cat.includes("회의") && cat !== "meeting") return false;

  // Extract date string from all possible date fields
  let rawDate =
    item.meetingDate ||
    item.expireDate ||
    item.startDate ||
    item.targetDate ||
    item.date ||
    (item.createdAt ? String(item.createdAt).slice(0, 10) : "") ||
    "";

  if (!rawDate) return false;

  const kstInfo = getKSTTimeInfo();
  const todayStr = kstInfo.dateStr; // YYYY-MM-DD

  // Normalize date format
  const cleanStr = String(rawDate).replace(/[.\/]/g, "-").trim();
  const dateMatch = cleanStr.match(/(\d{4})[-년\s]*(\d{1,2})[-월\s]*(\d{1,2})/);

  let y, mon, d;
  if (dateMatch) {
    y = parseInt(dateMatch[1], 10);
    mon = parseInt(dateMatch[2], 10);
    d = parseInt(dateMatch[3], 10);
  } else {
    const mmddMatch = cleanStr.match(/(\d{1,2})[-월\s]*(\d{1,2})/);
    if (mmddMatch) {
      y = new Date().getFullYear();
      mon = parseInt(mmddMatch[1], 10);
      d = parseInt(mmddMatch[2], 10);
    } else {
      return false;
    }
  }

  const formattedItemDate = `${y}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // 1. If meeting date is strictly before today (과거 일자), it is 100% expired
  if (formattedItemDate < todayStr) {
    return true;
  }

  // 2. If meeting date is today, check whether the meeting time (+ graceHours) has passed
  const mTime = String(item.meetingTime || item.time || "14:00").trim();
  let h = 14;
  let min = 0;
  const timeMatch = mTime.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
  if (timeMatch) {
    h = parseInt(timeMatch[1], 10);
    if (timeMatch[2]) min = parseInt(timeMatch[2], 10);
    if (mTime.includes("오후") && h < 12) h += 12;
    if (mTime.includes("오전") && h === 12) h = 0;
  }

  const meetingStartTime = new Date(y, mon - 1, d, h, min, 0).getTime();
  const expireTimeMs = meetingStartTime + (graceHours * 60 * 60 * 1000);

  const [currY, currM, currD] = todayStr.split("-").map(Number);
  const nowKst = new Date(currY, currM - 1, currD, kstInfo.hour, kstInfo.minute, kstInfo.second || 0).getTime();

  return nowKst >= expireTimeMs;
};

// Initial urgent issue samples (Empty by default to prevent zombie deleted items)
export const INITIAL_URGENT_ISSUES = [];

// Helper: Sanitize legacy author names (e.g. 방상국 -> 권태형 / 설유철)
export const sanitizeUrgentIssueItem = (item) => {
  if (!item) return item;
  let updated = { ...item };
  if (updated.author === "방상국") {
    updated.author = "권태형";
    updated.authorTitle = "대표이사";
  }
  if (updated.actionAuthor === "방상국") {
    updated.actionAuthor = "설유철";
  }
  if (Array.isArray(updated.replies)) {
    updated.replies = updated.replies.map((r) => {
      if (r.author === "방상국") {
        return { ...r, author: "설유철", authorTitle: "책임" };
      }
      return r;
    });
  }
  return updated;
};

// Helper: Read local storage (종결삭제관리 조회를 위해 isDeleted 항목도 함께 보존)
export const getLocalUrgentIssues = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeUrgentIssueItem);
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return [];
  }
};

// Helper: Save local storage (종결삭제관리 조회를 위해 isDeleted 항목도 함께 저장)
export const saveLocalUrgentIssues = (issues) => {
  try {
    const valid = Array.isArray(issues) ? issues : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
  } catch (e) {
    console.warn("Local storage write error for urgent issues, attempting trim:", e);
    try {
      const valid = Array.isArray(issues) ? issues : [];
      const trimmed = valid.map((item, idx) => {
        if (idx > 15 && Array.isArray(item.images) && item.images.length > 0) {
          return {
            ...item,
            images: item.images.map((img) => (typeof img === "object" ? { ...img, dataUrl: "" } : img))
          };
        }
        return item;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (innerErr) {
      console.error("Local storage urgent issues error after trim:", innerErr);
    }
  }
};

// Helper: Sort strictly by latest registration/creation time (최신순 내림차순)
export const sortIssuesByLatest = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return [...list].sort((a, b) => {
    // 1. 생성/등록/수정 일시 내림차순 (최신순)
    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    // 2. id 기준 최신순 내림차순
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Helper: Category Priority and Smart Sorting (카테고리별 내부 최신순 정렬)
// 1위: 품질경보 (최신 등록일시 내림차순)
// 2위: 회의일정 (최신 등록/일시 내림차순)
// 3위: 오픈이슈/품질이슈 (최신 등록/목표일 내림차순)
// 4위: 공지사항/사내공지/공유사항 (최신 등록/공지일 내림차순)
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

    // 2. 카테고리별 내부 정렬: 모두 최신순 (최근 등록일시/생성일시/목표일시 내림차순)
    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Real-time Cloud Synchronization (종결/삭제된 항목도 실시간 동기화하여 '종결삭제관리'에서 확인 및 복구 가능)
export const subscribeUrgentIssues = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (!data) return;
          const isDel = Boolean(data.isDeleted === true || data.deleted === true || data.isDeleted === "true" || data.deleted === "true");
          const item = { ...data, id: d.id, _docId: d.id, customId: data.id, isDeleted: isDel };
          list.push(sanitizeUrgentIssueItem(item));
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
export const saveUrgentIssue = async (issueData, options = {}) => {
  const current = getLocalUrgentIssues();
  const id = issueData.id || issueData._docId || issueData.customId || `issue_${Date.now()}`;
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
    _docId: id,
    category: issueData.category || "오픈이슈",
    plant: issueData.plant || "삼랑진공장",
    author: issueData.author || "",
    authorTitle: issueData.authorTitle || "",
    title: issueData.title || "",
    content: issueData.content || "",
    startDate: issueData.startDate || issueData.expireDate || todayDateStrFallback(),
    expireDate: issueData.expireDate || issueData.targetDate || todayDateStrFallback(),
    targetDate: issueData.targetDate || issueData.expireDate || todayDateStrFallback(),
    meetingTime: issueData.meetingTime || "",
    images: Array.isArray(issueData.images) ? issueData.images : [],
    actionImages: Array.isArray(issueData.actionImages) ? issueData.actionImages : [],
    actionResult: issueData.actionResult || "",
    actionAuthor: issueData.actionAuthor || "",
    actionAt: issueData.actionAt || "",
    replies: Array.isArray(issueData.replies) ? issueData.replies : [],
    isResolved: issueData.isResolved !== undefined ? Boolean(issueData.isResolved) : Boolean(issueData.actionResult && issueData.actionResult.trim()),
    isDeleted: Boolean(issueData.isDeleted === true),
    isManuallyRestored: issueData.isManuallyRestored !== undefined ? Boolean(issueData.isManuallyRestored) : false,
    deletedAt: issueData.deletedAt || "",
    deletedBy: issueData.deletedBy || "",
    createdAt: issueData.createdAt || nowStr
  };

  // Strip any undefined keys so Firestore setDoc does not throw
  Object.keys(fullItem).forEach((key) => {
    if (fullItem[key] === undefined) {
      delete fullItem[key];
    }
  });

  const existingIdx = current.findIndex(
    (i) => i.id === id || (i._docId && i._docId === id) || (i.customId && i.customId === id)
  );
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

  // 🔒 텔레그램 발송 가드: skipTelegram인 경우 완전 생략
  const skipTelegram = Boolean(options.skipTelegram);
  // 신규 등록(CREATE)은 options.isNew === true 이거나 기존 목록에 없는 신규 항목인 경우 발송
  const isTrulyNew = !skipTelegram && (
    options.isNew === true ||
    existingIdx < 0
  );

  if (!fullItem.isDeleted && !skipTelegram) {
    if (isTrulyNew) {
      // 1. 신규 등록 즉시 알림 (오직 신규 생성 시에만 발송)
      if (fullItem.category === "품질경보") {
        sendQualityAlertTelegram(fullItem).catch((err) => {
          console.warn("Telegram alert error:", err);
        });
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        sendOpenIssueAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram open issue alert error:", err);
        });
      } else if (fullItem.category === "회의일정" || fullItem.category === "공지사항" || fullItem.category === "사내공지" || fullItem.category === "공유사항") {
        sendMeetingNoticeAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram meeting/notice alert error:", err);
        });
      }
    } else if (existingIdx >= 0 && !options.isNew) {
      // 2. 기존 항목 수정 / 상태 변경 / 조치완료 시 알림
      const prevItem = current[existingIdx];
      const isNewlyResolved = !prevItem?.isResolved && fullItem.isResolved;
      const progressChanged = prevItem?.progress !== undefined && fullItem.progress !== undefined && prevItem.progress !== fullItem.progress;
      const actionResultAdded = !prevItem?.actionResult && Boolean(fullItem.actionResult?.trim());

      if (fullItem.category === "품질경보") {
        const actionResultChanged = Boolean(fullItem.actionResult?.trim()) && fullItem.actionResult !== prevItem?.actionResult;
        if (isNewlyResolved || actionResultAdded || actionResultChanged) {
          const actionImgs = (Array.isArray(fullItem.actionImages) && fullItem.actionImages.length > 0)
            ? fullItem.actionImages
            : (fullItem.replies?.[fullItem.replies.length - 1]?.files || []);

          sendQualityActionTelegram(fullItem, {
            actionAuthor: fullItem.actionAuthor || fullItem.author,
            actionContent: fullItem.actionResult,
            images: actionImgs
          }).catch((err) => {
            console.warn("Telegram quality action error:", err);
          });
        }
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        if (isNewlyResolved) {
          sendOpenIssueAlertTelegram(fullItem, "RESOLVE").catch((err) => {
            console.warn("Telegram open issue resolve alert error:", err);
          });
        } else if (progressChanged || actionResultAdded) {
          sendOpenIssueAlertTelegram(fullItem, "UPDATE").catch((err) => {
            console.warn("Telegram open issue update alert error:", err);
          });
        }
      }
    }
  }

  return fullItem;
};

// Add a Reply / Attendance Response (회신란 / 조치결과 등록)
export const addIssueReply = async (issueId, replyData) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => i.id === issueId || (i._docId && i._docId === issueId) || (i.customId && i.customId === issueId)
  );

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || d.data()?.id === issueId) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in addIssueReply fallback:", e);
    }
  }

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
    content: replyData.content ? replyData.content.trim() : (replyData.files?.length > 0 ? "파일이 첨부되었습니다." : "조치 완료"),
    files: replyData.files || replyData.images || [],
    createdAt: nowStr
  };

  const updatedReplies = [...(target.replies || []), newReply];
  const isQuality = target.category === "품질경보";

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: newReply.content,
          actionAuthor: newReply.author,
          actionImages: newReply.files || [],
          actionAt: newReply.actionDate || nowStr,
          isResolved: true,
          isDeleted: false,
          isManuallyRestored: true
        }
      : {})
  };

  const saved = await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });

  // 개별 의견/회신 전용 텔레그램 알림 발송
  try {
    if (target.category === "품질경보") {
      sendQualityOpinionTelegram(target, newReply).catch(() => {});
    } else if (target.category === "오픈이슈" || target.category === "open_issue" || target.category === "품질이슈") {
      sendOpenIssueReplyTelegram(target, newReply).catch(() => {});
    } else if (target.category === "회의일정" || target.category === "공지사항" || target.category === "사내공지" || target.category === "공유사항") {
      sendMeetingNoticeReplyTelegram(target, newReply).catch(() => {});
    }
  } catch (err) {
    console.warn("Telegram reply alert error:", err);
  }

  return saved;
};

// Delete a Reply
export const deleteIssueReply = async (issueId, replyId) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => i.id === issueId || (i._docId && i._docId === issueId) || (i.customId && i.customId === issueId)
  );

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || d.data()?.id === issueId) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in deleteIssueReply fallback:", e);
    }
  }

  if (!target) return null;

  const currentReplies = Array.isArray(target.replies) ? [...target.replies] : [];
  // 🔒 정확히 대상 1개만 식별하여 삭제 (중복 등록된 동일 내용 의견도 1개만 안전하게 삭제)
  const targetIdx = currentReplies.findIndex(
    (r, idx) => r.id === replyId || String(idx) === String(replyId) || (r.id && String(r.id) === String(replyId))
  );

  let updatedReplies;
  if (targetIdx >= 0) {
    currentReplies.splice(targetIdx, 1);
    updatedReplies = currentReplies;
  } else {
    updatedReplies = currentReplies.filter((r) => r.id !== replyId);
  }

  const isQuality = target.category === "품질경보";
  const lastReply = updatedReplies[updatedReplies.length - 1];

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: lastReply ? lastReply.content : "",
          actionAuthor: lastReply ? lastReply.author : "",
          actionImages: lastReply?.files || [],
          actionAt: lastReply ? lastReply.actionDate || lastReply.createdAt : "",
          isResolved: Boolean(lastReply)
        }
      : {})
  };

  // 🔒 skipTelegram: true 및 isNew: false를 명시하여 의견 삭제 시 신규등록 텔레그램 발송 원천 차단
  return await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });
};

// In-flight deletion lock to prevent duplicate Telegram messages and race conditions
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

    // 1. Update in local storage (종결삭제관리에 보존)
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

    // 3. 6번 정책에 따라 품질경보 종결/삭제 텔레그램 알림은 비활성화됨
    return sorted;
  } catch (err) {
    console.error("deleteUrgentIssue error:", err);
    return getLocalUrgentIssues();
  }
};

// Hard Delete (영구 삭제 - DB에서 완전히 제거)
export const hardDeleteUrgentIssue = async (id, deleterName = "") => {
  activeDeletes.delete(id);
  const strId = String(id || "");
  if (!strId) return getLocalUrgentIssues();

  try {
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

  // If restoring an item whose date was in the past, update expireDate/targetDate to today
  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const isPast =
    (target.expireDate && target.expireDate < todayStr) ||
    (target.targetDate && target.targetDate < todayStr);

  const newExpireDate = isPast ? todayStr : (target.expireDate || target.targetDate || todayStr);

  // If meeting was in the past or expired today, bump meetingTime to future time so it does not immediately expire
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
    isResolved: Boolean(trimmed),
    isDeleted: false,
    isManuallyRestored: true
  };

  const saved = await saveUrgentIssue(updatedTarget, { isNew: false, skipTelegram: true });

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