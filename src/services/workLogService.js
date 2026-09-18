// Pure Shared Work Log Service with Cloud Firestore Real-time Multi-Device Synchronization
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

// Clean initial state (Zero dummy data)
export const INITIAL_WORK_LOGS = [];

const COLLECTION_NAME = "work_logs";
const LOCAL_STORAGE_KEY = "factory_daily_work_logs_v16_pure_firestore_realtime";

// Known legacy / sample / seed IDs to purge permanently
export const OLD_SAMPLE_IDS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
  "seed_hal_cy_0917", "seed_hal_sm_0917", "seed_hal_cy_0916", "seed_hal_sm_0916",
  "seed_sam_yc_0917", "seed_sam_ks_0917", "seed_sam_cy_0917", "seed_sam_jy_0917",
  "seed_sam_in_0917", "seed_sam_dg_0917", "seed_sam_ij_0917", "seed_sam_sg_0917"
];

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

export const parseLogFields = (log) => {
  if (!log || typeof log !== "object") return log;
  const parsed = { ...log };
  if (typeof parsed.images === "string") {
    try {
      parsed.images = JSON.parse(parsed.images);
    } catch {
      parsed.images = [];
    }
  }
  if (!Array.isArray(parsed.images)) {
    parsed.images = parsed.images ? [parsed.images] : [];
  }
  if (typeof parsed.lineFileMatches === "string") {
    try {
      parsed.lineFileMatches = JSON.parse(parsed.lineFileMatches);
    } catch {
      parsed.lineFileMatches = [];
    }
  }
  if (typeof parsed.maintenanceItems === "string") {
    try {
      parsed.maintenanceItems = JSON.parse(parsed.maintenanceItems);
    } catch {
      parsed.maintenanceItems = [];
    }
  }
  return parsed;
};

// Ensure log has correct authoritative approval status (Respects individual status strictly)
export const normalizeWorkLogApproval = (log) => {
  if (!log || typeof log !== "object") return log;
  const parsed = parseLogFields(log);

  // Default approval status to pending if not present
  if (!parsed.approvalStatus) {
    parsed.approvalStatus = "결재대기";
  }

  // If approved, ensure approver metadata is present
  if (parsed.approvalStatus === "결재완료" || parsed.approvalStatus === "APPROVED") {
    parsed.approvalStatus = "결재완료";
    if (!parsed.approverName) {
      parsed.approverName = parsed.plant === "삼랑진공장" ? "이명재" : "김동욱";
    }
    if (!parsed.approverTitle) {
      parsed.approverTitle = parsed.plant === "삼랑진공장" ? "이사" : "책임";
    }
    if (!parsed.approverPlant) {
      parsed.approverPlant = parsed.plant || (parsed.approverName === "이명재" ? "삼랑진공장" : "한림공장");
    }
  }

  return parsed;
};

// Check if a log is a legacy sample/dummy log
function isSampleLog(log) {
  if (!log) return true;
  const idStr = String(log.id || "");
  if (OLD_SAMPLE_IDS.includes(idStr)) return true;
  if (idStr.startsWith("seed_") || idStr.startsWith("sample_")) return true;
  return false;
}

// Get local cache
export const getLocalWorkLogs = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((l) => !isSampleLog(l))
      .map(normalizeWorkLogApproval);
  } catch (e) {
    return [];
  }
};

const saveLocalWorkLogs = (logs) => {
  try {
    const filtered = Array.isArray(logs)
      ? logs.filter((l) => !isSampleLog(l)).map(normalizeWorkLogApproval)
      : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

// Purge any old dummy/seed logs from Firestore cloud and local storage
let isPurged = false;
export const purgeSampleLogsIfNeeded = async () => {
  if (isPurged) return;
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (!snap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((docSnap) => {
        const id = docSnap.id;
        if (OLD_SAMPLE_IDS.includes(id) || id.startsWith("seed_") || id.startsWith("sample_")) {
          batch.delete(docSnap.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        console.log(`Purged ${count} old dummy work logs from Firestore.`);
      }
    }
    isPurged = true;
  } catch (e) {
    console.warn("Purge sample logs error:", e);
  }
};

export const seedInitialLogsToFirestore = async () => {
  // No-op (zero dummy injection)
};

export const seedInitialLogsIfNeeded = async () => {
  await purgeSampleLogsIfNeeded();
};

// Subscribe to real-time work logs from Cloud Firestore
export const subscribeWorkLogs = (onUpdate) => {
  purgeSampleLogsIfNeeded();

  // 1. Immediate local cache
  const localLogs = getLocalWorkLogs();
  onUpdate(localLogs);

  // 2. Direct fetch from Cloud Firestore
  getDocs(collection(db, COLLECTION_NAME)).then((snap) => {
    const remoteLogs = [];
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const id = docSnap.id;
        if (!isSampleLog({ id })) {
          const log = normalizeWorkLogApproval({ id: docSnap.id, ...docSnap.data() });
          remoteLogs.push(log);
        }
      });
    }

    remoteLogs.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return String(b.id || "").localeCompare(String(a.id || ""));
    });

    saveLocalWorkLogs(remoteLogs);
    onUpdate(remoteLogs);
  }).catch((e) => {
    console.warn("Direct getDocs warning:", e.message);
    onUpdate(getLocalWorkLogs());
  });

  // 3. Real-time live listener
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteLogs = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const id = docSnap.id;
            if (!isSampleLog({ id })) {
              const log = normalizeWorkLogApproval({ id: docSnap.id, ...docSnap.data() });
              remoteLogs.push(log);
            }
          });
        }

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

// Check if a work log has already been approved
export const isWorkLogApproved = (log) => {
  if (!log) return false;
  return (
    log.approvalStatus === "결재완료" ||
    log.approvalStatus === "APPROVED" ||
    log.status === "APPROVED"
  );
};

// Save a work log (Cloud Firestore + Local Cache)
export const saveWorkLog = async (newLog) => {
  const logId = String(newLog.id || Date.now());
  const current = getLocalWorkLogs();
  const existingLog = current.find((l) => String(l.id) === logId);

  // Guard: If already approved and this is an edit attempt, reject
  if (existingLog && isWorkLogApproved(existingLog) && !newLog._isApprovalAction) {
    console.warn("Cannot edit an already approved work log:", logId);
    throw new Error("결재가 완료된 업무일지는 수정할 수 없습니다.");
  }

  const logToSave = {
    approvalStatus: newLog.approvalStatus || "결재대기",
    ...newLog,
    id: logId,
    updatedAt: new Date().toISOString(),
    createdAt: newLog.createdAt || new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  const cleanData = sanitizeLog(logToSave);
  const parsedClean = parseLogFields(cleanData);

  // 1. Update local cache immediately
  const updatedLocal = [parsedClean, ...current.filter((l) => String(l.id) !== logId)];
  saveLocalWorkLogs(updatedLocal);

  // 2. Sync to Firestore cloud
  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), cleanData);
    console.log("Work log successfully synced to Firestore cloud:", logId);
  } catch (e) {
    console.error("Firestore cloud sync error:", e);
  }

  return updatedLocal;
};

// Update an existing work log before approval
export const updateWorkLog = async (id, updatedFields = {}) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) throw new Error("수정할 업무일지를 찾을 수 없습니다.");

  if (isWorkLogApproved(target)) {
    throw new Error("결재가 완료된 업무일지는 수정할 수 없습니다.");
  }

  const merged = {
    ...target,
    ...updatedFields,
    id: logId,
    updatedAt: new Date().toISOString()
  };

  const cleanData = sanitizeLog(merged);
  const parsedClean = parseLogFields(cleanData);
  const updatedLocal = current.map((l) => (String(l.id) === logId ? parsedClean : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), cleanData, { merge: true });
    console.log("Work log updated & synced to Firestore:", logId);
  } catch (e) {
    console.error("Firestore update sync error:", e);
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

// Approve an individual work log (Strict item-by-item approval)
export const approveWorkLog = async (id, approver = {}, fallbackLog = null) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId) || fallbackLog || {};

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const plantName = approver.plant || target.plant || "한림공장";
  const defaultApproverName = plantName === "한림공장" ? "김동욱" : "이명재";
  const defaultApproverTitle = plantName === "한림공장" ? "책임" : "이사";

  const approvalData = {
    approvalStatus: "결재완료",
    approverName: approver.name || defaultApproverName,
    approverTitle: approver.title || defaultApproverTitle,
    approverPlant: plantName,
    approvedAt: nowFormatted,
    approvalComment: approver.comment || (plantName === "한림공장" ? "한림공장 총괄관리자 김동욱 책임 전자결재 승인 완료" : "삼랑진공장 총괄관리자 이명재 이사 전자결재 승인 완료")
  };

  const updatedLog = {
    ...target,
    ...approvalData,
    id: logId,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.some((l) => String(l.id) === logId)
    ? current.map((l) => (String(l.id) === logId ? updatedLog : l))
    : [updatedLog, ...current];

  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log approved & synced to Firestore:", logId);
  } catch (e) {
    console.error("Firestore approve sync error:", e);
  }

  return updatedLocal;
};

// Batch approve multiple work logs
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

  const targetIds = logIds.map(String);
  const updatedLocal = current.map((l) => {
    if (targetIds.includes(String(l.id))) {
      const plantName = approver.plant || l.plant || "한림공장";
      const defaultApproverName = approver.name || (plantName === "한림공장" ? "김동욱" : "이명재");
      const defaultApproverTitle = approver.title || (plantName === "한림공장" ? "책임" : "이사");
      const approvalData = {
        approvalStatus: "결재완료",
        approverName: defaultApproverName,
        approverTitle: defaultApproverTitle,
        approverPlant: plantName,
        approvedAt: nowFormatted,
        approvalComment: approver.comment || `${plantName} 일괄 확인 및 전자결재 승인 완료`
      };
      return { ...l, ...approvalData, updatedAt: new Date().toISOString() };
    }
    return l;
  });

  saveLocalWorkLogs(updatedLocal);

  try {
    const batch = writeBatch(db);
    targetIds.forEach((id) => {
      const log = updatedLocal.find((l) => String(l.id) === id);
      if (log) {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.set(docRef, sanitizeLog(log), { merge: true });
      }
    });
    await batch.commit();
    console.log("Batch work logs approved in Firestore:", targetIds.length);
  } catch (e) {
    console.error("Firestore batch approve error:", e);
  }

  return updatedLocal;
};

// Reject / Return a work log for revision
export const rejectWorkLog = async (id, approver = {}, reason = "보완 후 재상신 요망", fallbackLog = null) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId) || fallbackLog || {};

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const plantName = approver.plant || target.plant || "한림공장";
  const defaultApproverName = plantName === "한림공장" ? "김동욱" : "이명재";
  const defaultApproverTitle = plantName === "한림공장" ? "책임" : "이사";

  const rejectionData = {
    approvalStatus: "반려",
    approverName: approver.name || defaultApproverName,
    approverTitle: approver.title || defaultApproverTitle,
    approverPlant: plantName,
    approvedAt: nowFormatted,
    approvalComment: reason
  };

  const updatedLog = {
    ...target,
    ...rejectionData,
    id: logId,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.some((l) => String(l.id) === logId)
    ? current.map((l) => (String(l.id) === logId ? updatedLog : l))
    : [updatedLog, ...current];

  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log rejected in Firestore:", logId);
  } catch (e) {
    console.error("Firestore reject sync error:", e);
  }

  return updatedLocal;
};

