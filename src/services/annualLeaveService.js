import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { getKSTDateString } from "../utils/dateUtils";

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
    createdAt: cleanData.createdAt || new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }),
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

// Helper: Calculate worker's current/upcoming annual leave status
// Exposure period: from registration date (createdAt) to completed or target event date (endDate/startDate)
export const getUserLeaveStatus = (userId, userName, allLeaves = [], options = { excludeTodo: true }) => {
  if (!allLeaves || !Array.isArray(allLeaves) || allLeaves.length === 0) return null;

  try {
    const todayStr = getKSTDateString();

    // Match leaves for this worker (by userId or userName)
    const userLeaves = allLeaves.filter((l) => {
      if (!l) return false;
      const matchUser = (userId && l.userId === userId) || (userName && l.userName === userName);
      if (!matchUser) return false;
      if (l.isCompleted || l.isDismissed) return false;

      // Filter out private '할일' if excludeTodo option is true
      if (options.excludeTodo) {
        const type = l.leaveType || "";
        if (type === "할일" || type.includes("할일")) return false;
      }
      return true;
    });

    if (userLeaves.length === 0) return null;

    // Filter valid leaves that should be exposed:
    // Registration date (createdAt or createdDate) <= todayStr <= (endDate or startDate)
    const validLeaves = userLeaves.filter((l) => {
      const regDate = l.createdAt ? l.createdAt.slice(0, 10) : (l.createdDate || l.startDate || "");
      const startDate = l.startDate || l.date || regDate;
      const targetEndDate = l.endDate || l.startDate || l.date || regDate;
      const effectiveStart = regDate && regDate <= startDate ? regDate : startDate;

      return Boolean(effectiveStart && targetEndDate && effectiveStart <= todayStr && todayStr <= targetEndDate);
    });

    if (validLeaves.length === 0) return null;

    // 1. Check for active leave today (startDate <= today <= endDate)
    const activeTodayLeave = validLeaves.find(
      (l) => Boolean(l && l.startDate && l.startDate <= todayStr && todayStr <= (l.endDate || l.startDate))
    );

    // Helper to get compact label for small mobile chips
    const getCompactType = (typeName) => {
      if (typeName === "RNA 회의" || typeName.includes("회의")) return "회의";
      if (typeName.includes("오전반차")) return "오전";
      if (typeName.includes("오후반차")) return "오후";
      if (typeName.includes("특근")) return "특근";
      if (typeName.includes("출장") || typeName.includes("교육")) return "출장";
      if (typeName.includes("업체방문")) return "방문";
      if (typeName.includes("외출")) return "외출";
      if (typeName.includes("할일")) return "할일";
      return typeName;
    };

    if (activeTodayLeave) {
      const meta = getLeaveTypeMeta(activeTodayLeave.leaveType);
      const compactType = getCompactType(meta.type);
      return {
        status: "ACTIVE",
        isToday: true,
        type: meta.type,
        emoji: meta.emoji,
        displayBadge: activeTodayLeave.startDate === todayStr ? `[오늘] ${meta.type}` : `${meta.type}`,
        mobileBadge: activeTodayLeave.startDate === todayStr ? `오늘·${compactType}` : `${compactType}`,
        label: `${meta.emoji} [오늘] ${meta.activeLabel || meta.type}`,
        fullLabel: `${activeTodayLeave.startDate} ${activeTodayLeave.leaveType}${activeTodayLeave.reason && activeTodayLeave.reason !== activeTodayLeave.leaveType ? ` (${activeTodayLeave.reason})` : ""}`,
        badgeColor: meta.activeBadge,
        leave: activeTodayLeave,
        allValidLeaves: validLeaves
      };
    }

    // 2. Otherwise, upcoming scheduled leave within exposure period (regDate <= todayStr < startDate)
    const upcomingLeaves = validLeaves
      .filter((l) => Boolean(l && l.startDate && l.startDate > todayStr))
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

    if (upcomingLeaves.length > 0) {
      const nextLeave = upcomingLeaves[0];
      const meta = getLeaveTypeMeta(nextLeave.leaveType);
      const compactType = getCompactType(meta.type);
      const dateParts = (nextLeave.startDate || "").split("-");
      const shortDate = dateParts.length === 3 ? `${dateParts[1]}.${dateParts[2]}` : nextLeave.startDate;
      const shortMonthDay = dateParts.length === 3 ? `${parseInt(dateParts[1], 10)}.${parseInt(dateParts[2], 10)}` : nextLeave.startDate;
      return {
        status: "SCHEDULED",
        isToday: false,
        type: meta.type,
        emoji: meta.emoji,
        shortDate,
        displayBadge: `${shortDate} ${meta.type}`,
        mobileBadge: `${shortMonthDay}·${compactType}`,
        label: `${meta.emoji} ${shortDate} ${meta.type}`,
        fullLabel: `${nextLeave.startDate} ${nextLeave.leaveType}${nextLeave.reason && nextLeave.reason !== nextLeave.leaveType ? ` (${nextLeave.reason})` : ""}`,
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
