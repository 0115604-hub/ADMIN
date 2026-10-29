import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { autoReportRuntimeIncident } from "../errorSnapshotService";
import { getKSTDateString } from "../../utils/dateUtils";

const OFFLINE_QUEUE_KEY = "factory_work_report_offline_queue_v1";

/**
 * Get the current offline sync queue from LocalStorage
 */
export const getOfflineSyncQueue = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to read offline sync queue:", e);
    return [];
  }
};

/**
 * Save the offline sync queue to LocalStorage
 */
export const saveOfflineSyncQueue = (queue) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue || []));
  } catch (e) {
    console.error("Failed to save offline sync queue:", e);
  }
};

/**
 * Enqueue a failed report for background/online retry
 */
export const enqueueOfflineReport = ({ collectionName, id, payload, docType = "WORK_REPORT" }) => {
  const queue = getOfflineSyncQueue();
  const existingIdx = queue.findIndex((q) => q.id === id);
  const entry = {
    id,
    collectionName,
    payload,
    docType,
    queuedAt: new Date().toISOString(),
    retryCount: existingIdx >= 0 ? (queue[existingIdx].retryCount || 0) + 1 : 0
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = entry;
  } else {
    queue.push(entry);
  }
  saveOfflineSyncQueue(queue);
};

/**
 * Remove an item from the offline sync queue
 */
export const dequeueOfflineReport = (id) => {
  const queue = getOfflineSyncQueue();
  const filtered = queue.filter((q) => q.id !== id);
  saveOfflineSyncQueue(filtered);
};

/**
 * Flush all pending offline reports to Firestore
 */
export const flushOfflineSyncQueue = async () => {
  if (!db || typeof window === "undefined" || !navigator.onLine) return;
  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      const docRef = doc(db, item.collectionName, item.id);
      await setDoc(docRef, item.payload, { merge: true });
      console.log(`[SyncEngine] Successfully synced offline report ${item.id} to ${item.collectionName}`);
    } catch (err) {
      console.warn(`[SyncEngine] Retry failed for ${item.id}:`, err);
      remaining.push({
        ...item,
        retryCount: (item.retryCount || 0) + 1,
        lastError: err.message
      });
    }
  }
  saveOfflineSyncQueue(remaining);
};

// Auto-register online listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[SyncEngine] Network reconnected. Flushing offline queue...");
    flushOfflineSyncQueue().catch(() => {});
  });
}

/**
 * Merge remote Firestore snapshot with local pending reports.
 * GUARENTEES that local un-synced reports NEVER disappear when a remote snapshot arrives!
 */
export const mergeReportsOnSnapshot = (remoteList = [], localList = []) => {
  const map = new Map();

  // 1. Put all remote reports first
  (remoteList || []).forEach((r) => {
    if (r && r.id) {
      map.set(r.id, { ...r, syncStatus: "synced" });
    }
  });

  // 2. Overlay any local reports that are pending sync or newer
  (localList || []).forEach((local) => {
    if (!local || !local.id) return;
    const existing = map.get(local.id);
    if (!existing) {
      // Local report has not arrived on server yet: KEEP IT!
      map.set(local.id, local);
    } else if (local.syncStatus === "offline_pending" || local.syncStatus === "pending") {
      // Local version has pending uncommitted edits: PREFER LOCAL!
      map.set(local.id, local);
    } else {
      // Compare updatedAt timestamps if both exist
      const localUpdated = local.updatedAt || local.createdAt || "";
      const remoteUpdated = existing.updatedAt || existing.createdAt || "";
      if (localUpdated && remoteUpdated && localUpdated > remoteUpdated) {
        map.set(local.id, local);
      }
    }
  });

  const merged = Array.from(map.values());
  // Sort descending by date, then createdAt
  merged.sort((a, b) => {
    const da = String(a.date || a.workDate || "");
    const db_ = String(b.date || b.workDate || "");
    if (db_ !== da) return db_.localeCompare(da);
    const ta = String(a.createdAt || a.id || "");
    const tb = String(b.createdAt || b.id || "");
    return tb.localeCompare(ta);
  });

  return merged;
};

/**
 * High-reliability Work Report Persist Engine with:
 * 1. Immediate local cache write
 * 2. Real-time Firestore setDoc with merge
 * 3. Offline queue fallback on network glitch
 * 4. Automatic runtime incident reporting on error
 * 5. Explicit status returned to caller
 */
export const persistWorkReportWithSync = async ({
  collectionName,
  report,
  getLocalReports,
  saveLocalReports,
  sanitizeForDb = (x) => x,
  incidentCategory = "일일생산정보"
}) => {
  const id = String(report.id || `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const nowKST = getKSTDateString();
  const nowISO = new Date().toISOString();

  const reportWithMeta = {
    ...report,
    id,
    date: report.date || nowKST,
    updatedAt: nowISO,
    createdAt: report.createdAt || nowISO,
    syncStatus: "pending"
  };

  // 1. Immediately update Local Storage so UI updates instantly
  try {
    const local = getLocalReports() || [];
    const idx = local.findIndex((r) => r.id === id);
    let nextList;
    if (idx >= 0) {
      nextList = [...local];
      nextList[idx] = reportWithMeta;
    } else {
      nextList = [reportWithMeta, ...local];
    }
    saveLocalReports(nextList);
  } catch (localErr) {
    console.error(`[SyncEngine] LocalStorage save failed for ${collectionName}:`, localErr);
  }

  // 2. Persist to Firestore with full error capture
  let syncedToCloud = false;
  let syncErrorMessage = null;

  if (db && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const docRef = doc(db, collectionName, id);
      const payload = sanitizeForDb(reportWithMeta);
      await setDoc(docRef, payload, { merge: true });
      syncedToCloud = true;
      dequeueOfflineReport(id);

      // Update syncStatus to 'synced' in local storage
      try {
        const local = getLocalReports() || [];
        const idx = local.findIndex((r) => r.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], syncStatus: "synced" };
          saveLocalReports([...local]);
        }
      } catch (e) {}
    } catch (firestoreErr) {
      syncedToCloud = false;
      syncErrorMessage = firestoreErr.message || String(firestoreErr);
      console.warn(`[SyncEngine] Firestore save failed for ${collectionName}/${id}:`, firestoreErr);

      // 🚨 Record incident to database so admin/system catches it immediately
      autoReportRuntimeIncident({
        title: `[${collectionName}] 작업일보 클라우드 저장 실패`,
        error: firestoreErr,
        errorInfo: {
          componentStack: `Collection: ${collectionName}\nReportID: ${id}\nWorker: ${report.worker || report.author}\nDate: ${report.date}`
        }
      }).catch(() => {});

      // Enqueue to offline queue for automatic retry
      enqueueOfflineReport({
        collectionName,
        id,
        payload: sanitizeForDb(reportWithMeta),
        docType: collectionName
      });

      // Update syncStatus to 'offline_pending' in local storage
      try {
        const local = getLocalReports() || [];
        const idx = local.findIndex((r) => r.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], syncStatus: "offline_pending", syncError: syncErrorMessage };
          saveLocalReports([...local]);
        }
      } catch (e) {}
    }
  } else {
    // Device is offline or db uninitialized
    enqueueOfflineReport({
      collectionName,
      id,
      payload: sanitizeForDb(reportWithMeta),
      docType: collectionName
    });
    syncedToCloud = false;
    syncErrorMessage = "네트워크 오프라인";
  }

  return {
    success: true,
    report: reportWithMeta,
    synced: syncedToCloud,
    isOffline: !syncedToCloud,
    syncError: syncErrorMessage
  };
};
