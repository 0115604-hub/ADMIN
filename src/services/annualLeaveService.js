import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";
import { getKSTDateString } from "../utils/dateUtils.js";

const COLLECTION_NAME = "annual_leaves";
const LOCAL_STORAGE_KEY = "oryuk_annual_leaves_v1";

// Initial sample data for demonstration (Empty by default)
export const INITIAL_ANNUAL_LEAVES = [];

// Helper: Read local storage
export const getLocalAnnualLeaves = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ANNUAL_LEAVES));
      return INITIAL_ANNUAL_LEAVES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Local storage read error for annual leaves:", e);
    return INITIAL_ANNUAL_LEAVES;
  }
};

// Helper: Save local storage
export const saveLocalAnnualLeaves = (leaves) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leaves));
  } catch (e) {
    console.error("Local storage save error for annual leaves:", e);
  }
};

// Clean object helper
const sanitizeLeave = (leave) => {
  const clean = {};
  Object.keys(leave).forEach((key) => {
    if (leave[key] !== undefined && leave[key] !== null) {
      clean[key] = leave[key];
    }
  });
  return clean;
};

// Real-time Cloud Subscription
export const subscribeAnnualLeaves = (callback) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudLeaves = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          cloudLeaves.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
          saveLocalAnnualLeaves(cloudLeaves);
          callback(cloudLeaves);
        } else {
          // If Firestore collection is empty, update local cache to empty array
          saveLocalAnnualLeaves([]);
          callback([]);
        }
      },
      (error) => {
        console.warn("Firestore annual leaves subscription fallback to local cache:", error);
        callback(getLocalAnnualLeaves());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Subscribe error for annual leaves:", e);
    return () => {};
  }
};

// Synchronous getter
export const getAnnualLeaves = () => {
  return getLocalAnnualLeaves();
};

// Save an annual leave record (Cloud + Local)
export const saveAnnualLeave = async (newLeave) => {
  const leaveId = String(newLeave.id || `leave_${Date.now()}`);
  const cleanData = sanitizeLeave(newLeave);

  // Calculate days count
  let daysCount = 1;
  if (cleanData.leaveType && cleanData.leaveType.indexOf("반차") !== -1) {
    daysCount = 0.5;
  } else if (cleanData.startDate && cleanData.endDate) {
    const start = new Date(cleanData.startDate);
    const end = new Date(cleanData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    daysCount = diffDays > 0 ? diffDays : 1;
  }

  const leaveData = {
    ...cleanData,
    id: leaveId,
    daysCount,
    endDate: cleanData.endDate || cleanData.startDate,
    createdAt: cleanData.createdAt || new Date().toISOString(),
    createdDate: cleanData.createdDate || getKSTDateString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Update local cache immediately
  const current = getLocalAnnualLeaves();
  const updatedLocal = [leaveData, ...current.filter((l) => String(l.id) !== leaveId)];
  updatedLocal.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  saveLocalAnnualLeaves(updatedLocal);

  // 2. Sync to Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, leaveId), leaveData);
    console.log("Annual leave synced to Firestore cloud:", leaveId);
  } catch (e) {
    console.error("Firestore annual leave sync error:", e);
  }

  return updatedLocal;
};

// Delete an annual leave record (Cascades to all shared recipient copies across Firestore and local cache)
export const deleteAnnualLeave = async (id, cascadeAll = true) => {
  const leaveId = String(id);
  const current = getLocalAnnualLeaves();
  const targetItem = current.find((l) => String(l.id) === leaveId);
  const isRecipient = Boolean(targetItem?.isSharedRecipient && !targetItem?.isSharedOrigin);
  const rootOriginId = targetItem?.originLeaveId ? String(targetItem.originLeaveId) : leaveId;
  const authorName = targetItem?.userName || targetItem?.sharedBy || "";
  const authorId = targetItem?.userId || targetItem?.sharedById || "";
  const targetDate = targetItem?.startDate || targetItem?.date || "";
  const targetType = targetItem?.leaveType || "";

  // 1. Collect all matching local IDs
  const idsToDelete = new Set();
  idsToDelete.add(leaveId);

  if (cascadeAll && !isRecipient) {
    if (rootOriginId) idsToDelete.add(rootOriginId);
    current.forEach((l) => {
      if (!l) return;
      const lId = String(l.id);
      const lOrigId = l.originLeaveId ? String(l.originLeaveId) : null;
      if (
        lId === leaveId ||
        lId === rootOriginId ||
        lOrigId === leaveId ||
        lOrigId === rootOriginId ||
        (authorName && targetDate && targetType && (l.sharedBy === authorName || l.userName === authorName) && (l.startDate === targetDate || l.date === targetDate) && l.leaveType === targetType) ||
        (authorId && targetDate && targetType && (l.sharedById === authorId || l.userId === authorId) && (l.startDate === targetDate || l.date === targetDate) && l.leaveType === targetType)
      ) {
        idsToDelete.add(lId);
      }
    });
  }

  // 2. Direct Query to Firestore to find and collect ALL matching cloud docs (even if not yet in local cache)
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const dId = d.id;
      const dOrigId = data.originLeaveId ? String(data.originLeaveId) : null;
      const dSharedBy = data.sharedBy || "";
      const dSharedById = data.sharedById || "";
      const dUserName = data.userName || "";
      const dUserId = data.userId || "";
      const dDate = data.startDate || data.date || "";
      const dType = data.leaveType || "";

      const isDirectMatch = dId === leaveId || (cascadeAll && !isRecipient && rootOriginId && dId === rootOriginId);
      const isOriginMatch = cascadeAll && !isRecipient && (dOrigId === leaveId || (rootOriginId && dOrigId === rootOriginId));
      const isAuthorScheduleMatch = cascadeAll && !isRecipient && targetDate && targetType && (
        ((authorName && (dSharedBy === authorName || dUserName === authorName)) || (authorId && (dSharedById === authorId || dUserId === authorId))) &&
        dDate === targetDate &&
        dType === targetType
      );

      if (isDirectMatch || isOriginMatch || isAuthorScheduleMatch) {
        idsToDelete.add(dId);
      }
    });
  } catch (err) {
    console.error("Error querying Firestore for cascade delete:", err);
  }

  // 3. Immediately update local storage
  const filteredLocal = current.filter((l) => !idsToDelete.has(String(l.id)));
  saveLocalAnnualLeaves(filteredLocal);

  // 4. Batch delete all matched documents from Firestore Cloud
  try {
    const deletePromises = Array.from(idsToDelete).map((dId) =>
      deleteDoc(doc(db, COLLECTION_NAME, dId))
    );
    await Promise.allSettled(deletePromises);
    console.log("Annual leaves cascade deleted successfully from Firestore:", Array.from(idsToDelete));
  } catch (e) {
    console.error("Firestore delete annual leave error:", e);
  }

  return filteredLocal;
};

// Complete or Dismiss an annual leave record (Only marks THIS specific record as complete)
export const completeOrDismissAnnualLeave = async (id) => {
  const leaveId = String(id);
  const nowIso = new Date().toISOString();
  const current = getLocalAnnualLeaves();

  const updatedLocal = current.map((l) => {
    if (String(l.id) === leaveId) {
      return {
        ...l,
        isCompleted: true,
        isDismissed: true,
        completedAt: nowIso,
        updatedAt: nowIso
      };
    }
    return l;
  });
  saveLocalAnnualLeaves(updatedLocal);

  try {
    const targetDoc = updatedLocal.find((l) => String(l.id) === leaveId);
    if (targetDoc) {
      await setDoc(doc(db, COLLECTION_NAME, leaveId), sanitizeLeave(targetDoc), { merge: true });
      console.log("Annual leave marked complete in Firestore cloud:", leaveId);
    }
  } catch (e) {
    console.error("Firestore dismiss/complete annual leave error:", e);
  }

  return updatedLocal;
};

// Reactivate a completed/dismissed annual leave record
export const reactivateAnnualLeave = async (id) => {
  const leaveId = String(id);
  const nowIso = new Date().toISOString();
  const current = getLocalAnnualLeaves();

  const updatedLocal = current.map((l) => {
    if (String(l.id) === leaveId) {
      return {
        ...l,
        isCompleted: false,
        isDismissed: false,
        completedAt: null,
        isConfirmedBySender: false,
        updatedAt: nowIso
      };
    }
    return l;
  });
  saveLocalAnnualLeaves(updatedLocal);

  try {
    const targetDoc = updatedLocal.find((l) => String(l.id) === leaveId);
    if (targetDoc) {
      await setDoc(doc(db, COLLECTION_NAME, leaveId), sanitizeLeave(targetDoc), { merge: true });
      console.log("Annual leave reactivated in Firestore cloud:", leaveId);
    }
  } catch (e) {
    console.error("Firestore reactivate annual leave error:", e);
  }

  return updatedLocal;
};

// 💬 받은 작업자: 답장(회신) 전송 및 내 일정 마무리 완료 이력 저장
export const replyToSharedLeave = async (recipientLeaveId, replyText, recipientProfile) => {
  const recId = String(recipientLeaveId);
  const nowIso = new Date().toISOString();
  const rName = recipientProfile?.name || "작업자";
  const rId = recipientProfile?.id || "";
  const rPlant = recipientProfile?.plant || "";
  const rTitle = recipientProfile?.title || "선임";

  const current = getLocalAnnualLeaves();
  let originId = null;

  // 1. Recipient doc is marked as replied & completed in local array
  const updatedLocal = current.map((l) => {
    if (String(l.id) === recId) {
      originId = l.originLeaveId || null;
      return {
        ...l,
        replyStatus: "REPLIED",
        replyText: replyText.trim(),
        replyAt: nowIso,
        replyAuthor: rName,
        isCompleted: true,
        isDismissed: true,
        completedAt: nowIso,
        updatedAt: nowIso
      };
    }
    return l;
  });

  // 2. If originLeaveId exists, update origin leave doc in local array
  let targetOrigin = null;
  if (originId) {
    for (let i = 0; i < updatedLocal.length; i++) {
      if (String(updatedLocal[i].id) === String(originId)) {
        const origin = updatedLocal[i];
        const prevDetails = Array.isArray(origin.sharedWithDetails) ? [...origin.sharedWithDetails] : [];
        const matchIdx = prevDetails.findIndex((d) => d.name === rName || (rId && d.id === rId));

        if (matchIdx >= 0) {
          prevDetails[matchIdx] = {
            ...prevDetails[matchIdx],
            status: "REPLIED",
            replyText: replyText.trim(),
            replyAt: nowIso
          };
        } else {
          prevDetails.push({
            id: rId,
            name: rName,
            plant: rPlant,
            title: rTitle,
            status: "REPLIED",
            replyText: replyText.trim(),
            replyAt: nowIso
          });
        }

        const prevReplies = Array.isArray(origin.replies) ? [...origin.replies] : [];
        prevReplies.push({
          id: `reply_${Date.now()}`,
          author: rName,
          authorId: rId,
          plant: rPlant,
          title: rTitle,
          text: replyText.trim(),
          createdAt: nowIso
        });

        updatedLocal[i] = {
          ...origin,
          sharedWithDetails: prevDetails,
          replies: prevReplies,
          hasNewReply: true,
          updatedAt: nowIso
        };
        targetOrigin = updatedLocal[i];
        break;
      }
    }
  }

  saveLocalAnnualLeaves(updatedLocal);

  // 3. Update recipient doc and origin doc in Firestore
  try {
    const recDoc = updatedLocal.find((l) => String(l.id) === recId);
    if (recDoc) {
      await setDoc(doc(db, COLLECTION_NAME, recId), sanitizeLeave(recDoc), { merge: true });
    }

    if (originId) {
      if (targetOrigin) {
        await setDoc(doc(db, COLLECTION_NAME, String(originId)), sanitizeLeave(targetOrigin), { merge: true });
      } else {
        const originRef = doc(db, COLLECTION_NAME, String(originId));
        const snap = await getDoc(originRef);
        if (snap.exists()) {
          const originData = snap.data();
          const prevDetails = Array.isArray(originData.sharedWithDetails) ? [...originData.sharedWithDetails] : [];
          const matchIdx = prevDetails.findIndex((d) => d.name === rName || (rId && d.id === rId));
          if (matchIdx >= 0) {
            prevDetails[matchIdx] = {
              ...prevDetails[matchIdx],
              status: "REPLIED",
              replyText: replyText.trim(),
              replyAt: nowIso
            };
          } else {
            prevDetails.push({
              id: rId,
              name: rName,
              plant: rPlant,
              title: rTitle,
              status: "REPLIED",
              replyText: replyText.trim(),
              replyAt: nowIso
            });
          }
          const prevReplies = Array.isArray(originData.replies) ? [...originData.replies] : [];
          prevReplies.push({
            id: `reply_${Date.now()}`,
            author: rName,
            authorId: rId,
            plant: rPlant,
            title: rTitle,
            text: replyText.trim(),
            createdAt: nowIso
          });
          await setDoc(originRef, sanitizeLeave({
            ...originData,
            sharedWithDetails: prevDetails,
            replies: prevReplies,
            hasNewReply: true,
            updatedAt: nowIso
          }), { merge: true });
        }
      }
    }
  } catch (err) {
    console.error("Firestore sync error in replyToSharedLeave:", err);
  }

  return updatedLocal;
};

// ✓ 보낸 작업자: 회신(답변) 확인 완료 및 최종 마무리 처리 (보낸이 및 공유받은 작업자 기록 보존 또는 완전 삭제)
export const confirmSharedLeaveReplies = async (originLeaveId, senderProfile, actionType = "complete") => {
  const origId = String(originLeaveId);
  if (actionType === "delete") {
    return await deleteAnnualLeave(origId, true);
  }
  const nowIso = new Date().toISOString();
  const sName = senderProfile?.name || "보낸작업자";

  const current = getLocalAnnualLeaves();

  const updatedLocal = current.map((l) => {
    // Only sender origin doc is marked completed & confirmed
    if (String(l.id) === origId) {
      return {
        ...l,
        isConfirmedBySender: true,
        confirmedAt: nowIso,
        confirmedBy: sName,
        isCompleted: true,
        isDismissed: true,
        completedAt: nowIso,
        updatedAt: nowIso
      };
    }
    return l;
  });

  saveLocalAnnualLeaves(updatedLocal);

  try {
    const originDoc = updatedLocal.find((l) => String(l.id) === origId);
    if (originDoc) {
      await setDoc(doc(db, COLLECTION_NAME, origId), sanitizeLeave(originDoc), { merge: true });
    }
  } catch (err) {
    console.error("Firestore sync error in confirmSharedLeaveReplies:", err);
  }

  return updatedLocal;
};

// Supported Leave Types Meta Helper
export const getLeaveTypeMeta = (typeStr = "") => {
  const type = typeStr || "연차(하루)";
  if (type.includes("오전반차") || type === "반차(오전)") {
    return {
      type: "오전반차",
      emoji: "🌤️",
      activeLabel: "오전반차",
      scheduledLabelPrefix: "오전반차",
      activeBadge: "bg-amber-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-amber-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("오후반차") || type === "반차(오후)") {
    return {
      type: "오후반차",
      emoji: "⛅",
      activeLabel: "오후반차",
      scheduledLabelPrefix: "오후반차",
      activeBadge: "bg-orange-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-orange-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("할일")) {
    return {
      type: "할일",
      emoji: "📝",
      activeLabel: "할일",
      scheduledLabelPrefix: "할일",
      activeBadge: "bg-sky-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-sky-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("삼랑진")) {
    return {
      type: "삼랑진공장",
      emoji: "🏭",
      activeLabel: "삼랑진공장",
      scheduledLabelPrefix: "삼랑진",
      activeBadge: "bg-amber-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-amber-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("한림")) {
    return {
      type: "한림공장",
      emoji: "🏭",
      activeLabel: "한림공장",
      scheduledLabelPrefix: "한림",
      activeBadge: "bg-emerald-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-emerald-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("업체방문")) {
    return {
      type: "업체방문",
      emoji: "🏢",
      activeLabel: "업체방문",
      scheduledLabelPrefix: "업체방문",
      activeBadge: "bg-indigo-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-indigo-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("RNA 회의") || type.includes("RNA") || type.includes("회의")) {
    return {
      type: "RNA 회의",
      emoji: "👔",
      activeLabel: "회의중",
      scheduledLabelPrefix: "회의",
      activeBadge: "bg-purple-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-purple-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("외출")) {
    return {
      type: "외출",
      emoji: "🚶",
      activeLabel: "외출중",
      scheduledLabelPrefix: "외출",
      activeBadge: "bg-teal-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-teal-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("특근")) {
    return {
      type: "특근",
      emoji: "⚡",
      activeLabel: "특근근무중",
      scheduledLabelPrefix: "특근",
      activeBadge: "bg-emerald-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-emerald-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("출장") || type.includes("교육")) {
    return {
      type: "출장/교육",
      emoji: "🚄",
      activeLabel: "출장중",
      scheduledLabelPrefix: "출장",
      activeBadge: "bg-cyan-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-cyan-500 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("결근")) {
    return {
      type: "결근",
      emoji: "❌",
      activeLabel: "결근",
      scheduledLabelPrefix: "결근",
      activeBadge: "bg-rose-700 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-rose-600 text-white font-black shadow-2xs"
    };
  }
  if (type.includes("조퇴")) {
    return {
      type: "조퇴",
      emoji: "🏃",
      activeLabel: "조퇴",
      scheduledLabelPrefix: "조퇴",
      activeBadge: "bg-amber-600 text-white font-black animate-pulse shadow-xs",
      scheduledBadge: "bg-amber-500 text-white font-black shadow-2xs"
    };
  }
  // Default: 연차(하루) / 연차(전일) / 연차
  return {
    type: "연차",
    emoji: "🌴",
    activeLabel: "연차사용중",
    scheduledLabelPrefix: "연차",
    activeBadge: "bg-rose-600 text-white font-black animate-pulse shadow-xs",
    scheduledBadge: "bg-rose-500 text-white font-black shadow-2xs"
  };
};

// Helper to normalize date string to 'YYYY-MM-DD'
const normalizeDateStr = (raw) => {
  if (!raw) return "";
  const str = String(raw).trim();
  if (str.includes("T")) {
    return str.slice(0, 10);
  }
  const cleaned = str.replace(/\./g, "-").replace(/\//g, "-").replace(/\s+/g, "");
  const parts = cleaned.split("-").filter(Boolean);
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, "0");
    const d = parts[2].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str.slice(0, 10);
};

// Helper: Calculate worker's current/upcoming annual leave status
export const getUserLeaveStatus = (userId, userName, allLeaves = [], options = { excludeTodo: true }) => {
  if (!allLeaves || !Array.isArray(allLeaves) || allLeaves.length === 0) return null;

  try {
    const todayStr = getKSTDateString();

    const uId = userId ? String(userId).trim() : "";
    const uName = userName ? String(userName).trim() : "";

    // Match leaves for this worker (by userId or userName)
    const userLeaves = allLeaves.filter((l) => {
      if (!l) return false;
      if (l.isCompleted || l.isDismissed) return false;

      // 💡 공유받은 작업자는 내용만 공유받은 것이며, 본인의 근태/휴가 상태가 아니므로 근태 상태 계산에서 제외
      if (l.isSharedRecipient || l.sharedBy) return false;

      // Filter out private '할일' if excludeTodo option is true
      if (options.excludeTodo) {
        const type = String(l.leaveType || "");
        if (type === "할일" || type.includes("할일")) return false;
      }

      const lUserId = l.userId ? String(l.userId).trim() : "";
      const lUserName = l.userName ? String(l.userName).trim() : "";

      const matchId = Boolean(uId && (lUserId === uId || lUserId === `user_${uName}`));
      const matchName = Boolean(
        uName && (lUserName === uName || lUserName.startsWith(uName) || uName.startsWith(lUserName))
      );

      return matchId || matchName;
    });

    if (userLeaves.length === 0) return null;

    // Filter valid leaves that have not ended in the past (endDate >= todayStr)
    const validLeaves = userLeaves.filter((l) => {
      const rawStart = l.startDate || l.date || "";
      const rawEnd = l.endDate || rawStart;
      const start = normalizeDateStr(rawStart);
      const end = normalizeDateStr(rawEnd) || start;

      // Ignore past events (end date < todayStr)
      if (!end || end < todayStr) {
        return false;
      }
      return true;
    });

    if (validLeaves.length === 0) return null;

    // Helper to get compact label and 2-line breakdown for badges
    const getCompactBadgeInfo = (typeName, reason, name) => {
      const t = String(typeName || "").trim();
      const r = String(reason || "").trim();

      // Top line is strictly one of the standard schedule types from the menu:
      let line1 = "";
      let line2 = "";

      if (t.includes("한림") || r.includes("한림")) {
        line1 = "한림공장";
        if (r.includes("클립") || t.includes("클립") || r.includes("MC") || r.includes("M/C")) {
          line2 = "클립MC";
        } else if (r && r !== t && !r.includes("한림")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        } else if (name === "이명재") {
          line2 = "클립MC";
        }
      } else if (t.includes("삼랑진") || r.includes("삼랑진")) {
        line1 = "삼랑진공장";
        if (r && r !== t && !r.includes("삼랑진")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("오전반차") || t === "반차(오전)") {
        line1 = "오전반차";
        if (r && r !== t && !r.includes("오전")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("오후반차") || t === "반차(오후)") {
        line1 = "오후반차";
        if (r && r !== t && !r.includes("오후")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("특근")) {
        line1 = "특근(휴일)";
        if (r && r !== t && !r.includes("특근")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("출장") || t.includes("교육")) {
        line1 = "출장/교육";
        if (r && r !== t && !r.includes("출장") && !r.includes("교육")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("외출")) {
        line1 = "외출";
        if (r && r !== t && !r.includes("외출")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("RNA") || t.includes("회의")) {
        line1 = "RNA 회의";
        if (r && r !== t && !r.includes("회의") && !r.includes("RNA")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("할일")) {
        line1 = "할일";
        if (r && r !== t && !r.includes("할일")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("업체방문")) {
        line1 = "업체방문";
        if (r && r !== t && !r.includes("방문")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else if (t.includes("연차")) {
        line1 = "연차(하루)";
        if (r && r !== t && !r.includes("연차") && !r.includes("개인 사유") && !r.includes("개인사유")) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      } else {
        line1 = t || "일정";
        if (r && r !== t) {
          line2 = r.length > 6 ? r.slice(0, 6) : r;
        }
      }

      if (!line2 && r && r !== t) {
        if (r.includes("클립")) {
          line2 = "클립MC";
        }
      }

      return {
        line1,
        line2,
        displayBadge: line2 ? `${line1}\n${line2}` : line1,
        compactType: line1
      };
    };

    // 1. Check for active leave TODAY (startDate <= todayStr <= endDate)
    const activeTodayLeave = validLeaves.find((l) => {
      const start = normalizeDateStr(l.startDate || l.date || "");
      const end = normalizeDateStr(l.endDate || start) || start;
      return Boolean(start && end && start <= todayStr && todayStr <= end);
    });

    if (activeTodayLeave) {
      const meta = getLeaveTypeMeta(activeTodayLeave.leaveType);
      const badgeInfo = getCompactBadgeInfo(meta.type, activeTodayLeave.reason, userName);
      return {
        status: "ACTIVE",
        isToday: true,
        type: meta.type,
        emoji: meta.emoji,
        line1: badgeInfo.line1,
        line2: badgeInfo.line2,
        displayBadge: badgeInfo.displayBadge,
        mobileBadge: badgeInfo.displayBadge,
        label: `${meta.emoji} ${meta.activeLabel || meta.type}`,
        fullLabel: `${activeTodayLeave.startDate} ${activeTodayLeave.leaveType}${
          activeTodayLeave.reason && activeTodayLeave.reason !== activeTodayLeave.leaveType
            ? ` (${activeTodayLeave.reason})`
            : ""
        }`,
        badgeColor: meta.activeBadge,
        leave: activeTodayLeave,
        allValidLeaves: validLeaves
      };
    }

    // 2. Otherwise, find the EARLIEST upcoming scheduled leave in the FUTURE (startDate > todayStr)
    const upcomingLeaves = validLeaves
      .filter((l) => {
        const start = normalizeDateStr(l.startDate || l.date || "");
        return Boolean(start && start > todayStr);
      })
      .sort((a, b) => {
        const aStart = normalizeDateStr(a.startDate || a.date || "");
        const bStart = normalizeDateStr(b.startDate || b.date || "");
        return aStart.localeCompare(bStart);
      });

    if (upcomingLeaves.length > 0) {
      const nextLeave = upcomingLeaves[0];
      const meta = getLeaveTypeMeta(nextLeave.leaveType);
      const badgeInfo = getCompactBadgeInfo(meta.type, nextLeave.reason, userName);
      const startNorm = normalizeDateStr(nextLeave.startDate || nextLeave.date || "");
      const dateParts = startNorm.split("-");
      const shortMonthDay =
        dateParts.length === 3
          ? `${parseInt(dateParts[1], 10)}.${parseInt(dateParts[2], 10)}`
          : startNorm.slice(5);

      return {
        status: "SCHEDULED",
        isToday: false,
        type: meta.type,
        emoji: meta.emoji,
        shortDate: shortMonthDay,
        line1: badgeInfo.line2 ? badgeInfo.line1 : `${shortMonthDay}·${badgeInfo.line1}`,
        line2: badgeInfo.line2 || "",
        displayBadge: `${shortMonthDay}·${badgeInfo.displayBadge}`,
        mobileBadge: `${shortMonthDay}·${badgeInfo.displayBadge}`,
        label: `${meta.emoji} ${shortMonthDay} ${meta.type}`,
        fullLabel: `${nextLeave.startDate} ${nextLeave.leaveType}${
          nextLeave.reason && nextLeave.reason !== nextLeave.leaveType ? ` (${nextLeave.reason})` : ""
        }`,
        badgeColor: meta.scheduledBadge,
        leave: nextLeave,
        allValidLeaves: validLeaves
      };
    }

    return null;
  } catch (err) {
    console.error("getUserLeaveStatus error:", err);
    return null;
  }
};
