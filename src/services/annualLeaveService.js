import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

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

// Helper: Calculate worker's current/upcoming annual leave status
export const getUserLeaveStatus = (userId, userName, allLeaves = []) => {
  if (!allLeaves || !Array.isArray(allLeaves) || allLeaves.length === 0) return null;

  try {
    // Format today's date YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // Match leaves for this worker (by userId or userName)
    const userLeaves = allLeaves.filter(
      (l) => Boolean(l && ((userId && l.userId === userId) || (userName && l.userName === userName)))
    );

    if (userLeaves.length === 0) return null;

    // 1. Check for active leave today (startDate <= today <= endDate)
    const activeLeave = userLeaves.find(
      (l) => Boolean(l && l.startDate && l.startDate <= todayStr && todayStr <= (l.endDate || l.startDate))
    );

    if (activeLeave) {
      return {
        status: "ACTIVE",
        type: activeLeave.leaveType || "연차",
        label: "연차사용중",
        leave: activeLeave,
        badgeColor: "bg-rose-500 text-white font-black animate-pulse shadow-sm ring-1 ring-rose-400"
      };
    }

    // 2. Check for upcoming scheduled leaves (startDate > todayStr)
    const futureLeaves = userLeaves
      .filter((l) => Boolean(l && l.startDate && l.startDate > todayStr))
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

    if (futureLeaves.length > 0) {
      const nextLeave = futureLeaves[0];
      const dateParts = (nextLeave.startDate || "").split("-");
      const formattedShort = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : nextLeave.startDate;
      return {
        status: "SCHEDULED",
        type: nextLeave.leaveType || "연차",
        label: `연차예정 (${formattedShort})`,
        leave: nextLeave,
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
      };
    }

    return null;
  } catch (err) {
    console.error("getUserLeaveStatus error:", err);
    return null;
  }
};
