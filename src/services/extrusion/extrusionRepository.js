import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase";
import { sanitizeForFirestore } from "../../utils/firestoreUtils";
import { COLLECTION_NAME, EXTRUSION_PROD_STORAGE_KEY } from "./extrusionProductionConstants";
import { sanitizeExtrusionReport } from "./extrusionSanitizer";
import {
  persistWorkReportWithSync,
  mergeReportsOnSnapshot
} from "../common/workReportSyncEngine";

// Local storage reader
export const getLocalExtrusionReports = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(EXTRUSION_PROD_STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out legacy dummy mock seed records
      const cleanList = parsed
        .filter((r) => r && !String(r.id || "").startsWith("epr_seed_"))
        .map((r, i) => sanitizeExtrusionReport(r, i));
      if (cleanList.length !== parsed.length && typeof window !== "undefined") {
        localStorage.setItem(EXTRUSION_PROD_STORAGE_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    }
    return [];
  } catch (e) {
    console.warn("Error reading extrusion reports from localStorage:", e);
    return [];
  }
};

// Local storage saver
export const saveLocalExtrusionReports = (reports) => {
  try {
    const sanitized = (reports || [])
      .filter((r) => r && !String(r.id || "").startsWith("epr_seed_"))
      .map((r, i) => sanitizeExtrusionReport(r, i));
    localStorage.setItem(EXTRUSION_PROD_STORAGE_KEY, JSON.stringify(sanitized));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("extrusion-production-updated", { detail: sanitized }));
    }
    return sanitized;
  } catch (e) {
    console.warn("Error saving extrusion reports to localStorage:", e);
    return reports;
  }
};

// Singleton Multiplexed Real-time Listener (Single-Flight Pattern)
let activeExtrusionUnsub = null;
let extrusionCache = null;
const extrusionSubscribers = new Set();
let extrusionCleanupTimer = null;

/**
 * Subscribe to real-time updates from Firestore with local fallback (Multi-Subscriber Shared)
 */
export const subscribeToExtrusionReports = (onDataCallback) => {
  if (typeof onDataCallback !== "function") return () => {};

  extrusionSubscribers.add(onDataCallback);

  // 1. Immediately serve cached data (zero-latency initial render)
  if (extrusionCache) {
    onDataCallback(extrusionCache);
  } else {
    extrusionCache = getLocalExtrusionReports();
    onDataCallback(extrusionCache);
  }

  // Cancel any pending teardown timer
  if (extrusionCleanupTimer) {
    clearTimeout(extrusionCleanupTimer);
    extrusionCleanupTimer = null;
  }

  // 2. Open single Firestore stream if not already active
  if (!activeExtrusionUnsub && db) {
    try {
      const q = collection(db, COLLECTION_NAME);
      activeExtrusionUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((docSnap) => {
              if (String(docSnap.id || "").startsWith("epr_seed_")) {
                deleteDoc(doc(db, COLLECTION_NAME, docSnap.id)).catch(() => {});
              } else {
                list.push({ id: docSnap.id, ...docSnap.data() });
              }
            });
            // Sort by date DESC, then createdAt DESC (single computation for all listeners)
            list.sort((a, b) => {
              if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
              return (b.createdAt || "").localeCompare(a.createdAt || "");
            });
            const sanitizedList = list.map((r, i) => sanitizeExtrusionReport(r, i));
            const currentLocal = getLocalExtrusionReports();
            const mergedList = mergeReportsOnSnapshot(sanitizedList, currentLocal);
            extrusionCache = mergedList;
            saveLocalExtrusionReports(mergedList);

            // Dispatch to all subscribers
            extrusionSubscribers.forEach((cb) => {
              try {
                cb(mergedList);
              } catch (err) {
                console.error("Extrusion subscriber callback error:", err);
              }
            });
          } else {
            const currentLocal = getLocalExtrusionReports();
            const mergedList = mergeReportsOnSnapshot([], currentLocal);
            extrusionCache = mergedList;
            extrusionSubscribers.forEach((cb) => cb(mergedList));
          }
        },
        (error) => {
          console.warn("Firestore extrusion reports subscription fallback:", error);
          const fallback = getLocalExtrusionReports();
          extrusionSubscribers.forEach((cb) => cb(fallback));
        }
      );
    } catch (e) {
      console.warn("Error establishing extrusion reports listener:", e);
    }
  }

  // Return unsubscribe for this specific subscriber
  return () => {
    extrusionSubscribers.delete(onDataCallback);
    // Debounced teardown after 5 seconds of zero subscribers
    if (extrusionSubscribers.size === 0 && activeExtrusionUnsub) {
      extrusionCleanupTimer = setTimeout(() => {
        if (extrusionSubscribers.size === 0 && activeExtrusionUnsub) {
          activeExtrusionUnsub();
          activeExtrusionUnsub = null;
        }
      }, 5000);
    }
  };
};

/**
 * Create or Update a work report with 100% offline resilience and incident logging
 */
export const saveExtrusionReport = async (reportData) => {
  const sanitized = sanitizeExtrusionReport(reportData);

  const result = await persistWorkReportWithSync({
    collectionName: COLLECTION_NAME,
    report: sanitized,
    getLocalReports: getLocalExtrusionReports,
    saveLocalReports: (list) => {
      saveLocalExtrusionReports(list);
      extrusionCache = list;
      extrusionSubscribers.forEach((cb) => {
        try { cb(list); } catch (e) {}
      });
    },
    sanitizeForDb: sanitizeForFirestore,
    incidentCategory: "압출비가동"
  });

  return result.report;
};

/**
 * Delete a report
 */
export const deleteExtrusionReport = async (reportId, forceAdmin = false) => {
  // 승인(결재) 완료된 압출 작업일보 임의삭제 차단
  const local = getLocalExtrusionReports();
  const target = local.find((r) => r.id === reportId);
  if (target && target.approvalStatus === "승인" && !forceAdmin) {
    throw new Error("이미 관리자 승인(결재)이 완료된 압출 작업일보는 삭제할 수 없습니다.");
  }

  // 1. Local delete
  const filtered = local.filter((r) => r.id !== reportId);
  saveLocalExtrusionReports(filtered);

  // 2. Cloud delete
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reportId));
  } catch (e) {
    console.warn("Firestore delete error:", e);
  }
  return true;
};

/**
 * Toggle approval status
 */
export const toggleExtrusionReportApproval = async (reportId, currentStatus, approverName = "이명재 이사") => {
  const local = getLocalExtrusionReports();
  const target = local.find((r) => r.id === reportId);
  if (!target) return null;

  const nextStatus = currentStatus === "승인" ? "대기" : "승인";
  const updated = {
    ...target,
    approvalStatus: nextStatus,
    approvedBy: nextStatus === "승인" ? approverName : "",
    approvedAt: nextStatus === "승인" ? new Date().toISOString() : "",
    updatedAt: new Date().toISOString()
  };

  return await saveExtrusionReport(updated);
};
