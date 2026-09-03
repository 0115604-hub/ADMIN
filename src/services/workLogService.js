// Shared Work Log Service with Cloud Firestore Real-time Multi-Device Synchronization
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

export const INITIAL_WORK_LOGS = [];

const COLLECTION_NAME = "work_logs";
const LOCAL_STORAGE_KEY = "factory_daily_work_logs_v9_cleared";

// Deep clean object for Firestore
function sanitizeLog(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined && typeof val !== "function") {
      if (typeof val === "object" && val !== null) {
        try {
          result[key] = JSON.stringify(val);
        } catch {
          result[key] = "";
        }
      } else {
        result[key] = String(val === null ? "" : val);
      }
    }
  }
  return result;
}

// Get local cache
export const getLocalWorkLogs = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
};

const saveLocalWorkLogs = (logs) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

const OLD_SAMPLE_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

// Purge any old sample data from Firestore
let isPurged = false;
export const purgeSampleLogsIfNeeded = async () => {
  if (isPurged) return;
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (!snap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((docSnap) => {
        if (OLD_SAMPLE_IDS.includes(docSnap.id) || Number(docSnap.id) <= 11) {
          batch.delete(docSnap.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        console.log(`Purged ${count} old sample work logs from Firestore.`);
      }
    }
    isPurged = true;
  } catch (e) {
    console.warn("Purge sample logs error:", e);
  }
};

// Initial sync - No sample seeding (starts clean)
export const seedInitialLogsIfNeeded = async () => {
  await purgeSampleLogsIfNeeded();
};

// Subscribe to real-time work logs from Firestore
export const subscribeWorkLogs = (onUpdate) => {
  purgeSampleLogsIfNeeded();

  // 1. Immediate local cache (excluding sample ids)
  const localLogs = getLocalWorkLogs().filter((l) => !OLD_SAMPLE_IDS.includes(String(l.id)));
  onUpdate(localLogs);

  // 2. Immediate direct fetch from Cloud Firestore
  getDocs(collection(db, COLLECTION_NAME)).then((snap) => {
    if (!snap.empty) {
      const remoteLogs = [];
      snap.forEach((docSnap) => {
        if (!OLD_SAMPLE_IDS.includes(docSnap.id) && Number(docSnap.id) > 11) {
          remoteLogs.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      remoteLogs.sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return String(b.id || "").localeCompare(String(a.id || ""));
      });
      saveLocalWorkLogs(remoteLogs);
      onUpdate(remoteLogs);
    } else {
      saveLocalWorkLogs([]);
      onUpdate([]);
    }
  }).catch((e) => console.warn("Direct getDocs warning:", e.message));

  // 3. Real-time live listener
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteLogs = [];
        snapshot.forEach((docSnap) => {
          if (!OLD_SAMPLE_IDS.includes(docSnap.id) && Number(docSnap.id) > 11) {
            remoteLogs.push({ id: docSnap.id, ...docSnap.data() });
          }
        });

        // Sort by id / createdAt descending
        remoteLogs.sort((a, b) => {
          const dateA = a.date || "";
          const dateB = b.date || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return String(b.id || "").localeCompare(String(a.id || ""));
        });

        saveLocalWorkLogs(remoteLogs);
        onUpdate(remoteLogs);
      },
      (error) => {
        console.warn("Real-time Firestore listener error, using local data:", error.message);
        onUpdate(getLocalWorkLogs());
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn("Subscribe error:", e);
    return () => {};
  }
};

// Synchronous getter (returns local cache for initial state)
export const getWorkLogs = () => {
  return getLocalWorkLogs();
};

// Save a work log (Cloud Firestore + Local Cache)
export const saveWorkLog = async (newLog) => {
  const logId = String(newLog.id || Date.now());
  const cleanData = sanitizeLog(newLog);
  const logData = {
    ...cleanData,
    id: logId,
    updatedAt: new Date().toISOString(),
    createdAt: cleanData.createdAt || new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  // 1. Update local cache immediately
  const current = getLocalWorkLogs();
  const updatedLocal = [logData, ...current.filter((l) => String(l.id) !== logId)];
  saveLocalWorkLogs(updatedLocal);

  // 2. Sync to Firestore cloud
  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), logData);
    console.log("Work log successfully synced to Firestore cloud:", logId);
  } catch (e) {
    console.error("Firestore cloud sync error:", e);
  }

  return updatedLocal;
};

// Delete a work log (Cloud Firestore + Local Cache)
export const deleteWorkLog = async (id) => {
  const logId = String(id);

  // 1. Update local cache immediately
  const current = getLocalWorkLogs();
  const filteredLocal = current.filter((l) => String(l.id) !== logId);
  saveLocalWorkLogs(filteredLocal);

  // 2. Delete from Firestore cloud
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, logId));
    console.log("Work log deleted from Firestore cloud:", logId);
  } catch (e) {
    console.error("Firestore cloud delete error:", e);
  }

  return filteredLocal;
};

// Approve a work log (by plant general manager or admin)
export const approveWorkLog = async (id, approver = {}) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) return current;

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const approvalData = {
    approvalStatus: "결재완료",
    approverName: approver.name || "총괄관리자",
    approverTitle: approver.title || "이사",
    approverPlant: approver.plant || target.plant,
    approvedAt: nowFormatted,
    approvalComment: approver.comment || "확인 및 전자결재 승인 완료"
  };

  const updatedLog = {
    ...target,
    ...approvalData,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.map((l) => (String(l.id) === logId ? updatedLog : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log approved & synced to Firestore:", logId);
  } catch (e) {
    console.error("Firestore approve sync error:", e);
  }

  return updatedLocal;
};

// Batch approve multiple work logs for a plant
export const batchApproveWorkLogs = async (logIds, approver = {}) => {
  if (!Array.isArray(logIds) || logIds.length === 0) return getLocalWorkLogs();

  const current = getLocalWorkLogs();
  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const approvalData = {
    approvalStatus: "결재완료",
    approverName: approver.name || "총괄관리자",
    approverTitle: approver.title || "이사",
    approverPlant: approver.plant || "",
    approvedAt: nowFormatted,
    approvalComment: approver.comment || "일괄 확인 및 전자결재 승인 완료"
  };

  const targetIds = logIds.map(String);
  const updatedLocal = current.map((l) => {
    if (targetIds.includes(String(l.id))) {
      return { ...l, ...approvalData, updatedAt: new Date().toISOString() };
    }
    return l;
  });

  saveLocalWorkLogs(updatedLocal);

  try {
    const batch = writeBatch(db);
    targetIds.forEach((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.set(docRef, sanitizeLog({ ...approvalData, updatedAt: new Date().toISOString() }), { merge: true });
    });
    await batch.commit();
    console.log("Batch work logs approved in Firestore:", targetIds.length);
  } catch (e) {
    console.error("Firestore batch approve error:", e);
  }

  return updatedLocal;
};

// Reject / Return a work log for revision
export const rejectWorkLog = async (id, approver = {}, reason = "보완 후 재상신 요망") => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) return current;

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const rejectionData = {
    approvalStatus: "반려",
    approverName: approver.name || "총괄관리자",
    approverTitle: approver.title || "이사",
    approverPlant: approver.plant || target.plant,
    approvedAt: nowFormatted,
    approvalComment: reason
  };

  const updatedLog = {
    ...target,
    ...rejectionData,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.map((l) => (String(l.id) === logId ? updatedLog : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log rejected in Firestore:", logId);
  } catch (e) {
    console.error("Firestore reject sync error:", e);
  }

  return updatedLocal;
};
