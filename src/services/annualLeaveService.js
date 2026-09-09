import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";
import { getKSTDateString } from "../utils/dateUtils.js";

const COLLECTION_NAME = "annual_leaves";
const LOCAL_STORAGE_KEY = "oryuk_annual_leaves_v1";

// Initial sample data for demonstration
export const INITIAL_ANNUAL_LEAVES = [
  {
    id: "leave_demo_1",
    userId: "sam_yc",
    userName: "설유철",
    plant: "삼랑진공장",
    title: "책임",
    startDate: "2026-09-01",
    endDate: "2026-09-01",
    leaveType: "연차",
    daysCount: 1,
    reason: "개인 사유 (정기 연차)",
    createdAt: "2026-08-30 09:30"
  },
  {
    id: "leave_demo_2",
    userId: "hal_cy",
    userName: "우창용",
    plant: "한림공장",
    title: "선임",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    leaveType: "연차",
    daysCount: 1,
    reason: "가족 행사",
    createdAt: "2026-08-31 11:20"
  }
];

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
          // Initialize cloud with local/initial data if cloud collection is empty
          const local = getLocalAnnualLeaves();
          local.forEach(async (leave) => {
            try {
              await setDoc(doc(db, COLLECTION_NAME, String(leave.id)), sanitizeLeave(leave));
            } catch (err) {
              console.warn("Init cloud leave doc error:", err);
            }
          });
          callback(local);
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

// Delete an annual leave record
export const deleteAnnualLeave = async (id) => {
  const leaveId = String(id);
  const current = getLocalAnnualLeaves();
  const filteredLocal = current.filter((l) => String(l.id) !== leaveId);
  saveLocalAnnualLeaves(filteredLocal);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, leaveId));
    console.log("Annual leave deleted from Firestore cloud:", leaveId);
  } catch (e) {
    console.error("Firestore delete annual leave error:", e);
  }

  return filteredLocal;
};

// Complete or Dismiss an annual leave record (keeps history in calendar)
export const completeOrDismissAnnualLeave = async (id) => {
  const leaveId = String(id);
  const current = getLocalAnnualLeaves();
  const updatedLocal = current.map((l) => {
    if (String(l.id) === leaveId) {
      return {
        ...l,
        isCompleted: true,
        isDismissed: true,
        completedAt: new Date().toISOString()
      };
    }
    return l;
  });
  saveLocalAnnualLeaves(updatedLocal);

  try {
    const target = updatedLocal.find((l) => String(l.id) === leaveId);
    if (target) {
      await setDoc(doc(db, COLLECTION_NAME, leaveId), target, { merge: true });
    }
  } catch (e) {
    console.error("Firestore dismiss/complete annual leave error:", e);
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

    // Helper to get compact label for badges
    const getCompactType = (typeName) => {
      const t = String(typeName || "");
      if (t.includes("삼랑진")) return "삼랑진";
      if (t.includes("한림")) return "한림";
      if (t.includes("오전반차") || t === "반차(오전)") return "오전";
      if (t.includes("오후반차") || t === "반차(오후)") return "오후";
      if (t.includes("특근")) return "특근";
      if (t.includes("출장") || t.includes("교육")) return "출장";
      if (t.includes("외출")) return "외출";
      if (t.includes("RNA") || t.includes("회의")) return "회의";
      if (t.includes("할일")) return "할일";
      if (t.includes("업체방문")) return "방문";
      if (t.includes("연차")) return "연차";
      return t || "일정";
    };

    // 1. Check for active leave TODAY (startDate <= todayStr <= endDate)
    const activeTodayLeave = validLeaves.find((l) => {
      const start = normalizeDateStr(l.startDate || l.date || "");
      const end = normalizeDateStr(l.endDate || start) || start;
      return Boolean(start && end && start <= todayStr && todayStr <= end);
    });

    if (activeTodayLeave) {
      const meta = getLeaveTypeMeta(activeTodayLeave.leaveType);
      const compactType = getCompactType(meta.type);
      return {
        status: "ACTIVE",
        isToday: true,
        type: meta.type,
        emoji: meta.emoji,
        displayBadge: `오늘·${compactType}`,
        mobileBadge: `오늘·${compactType}`,
        label: `${meta.emoji} [오늘] ${meta.activeLabel || meta.type}`,
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
      const compactType = getCompactType(meta.type);
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
        displayBadge: `${shortMonthDay}·${compactType}`,
        mobileBadge: `${shortMonthDay}·${compactType}`,
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
