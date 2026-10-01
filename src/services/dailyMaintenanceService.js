/**
 * Daily Maintenance & HealthCheck Service
 * 매일 새벽 자동 헬스체크, 데이터 무결성 정제, 일일 스냅샷 백업 및 오류 모니터링 모듈
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  limit,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { sanitizeExtrusionRows, sortExtrusionWeeks } from "../utils/extrusionFileParser";

const MAINTENANCE_STATUS_KEY = "oryuk_daily_maintenance_status_v1";
const MAINTENANCE_LAST_DATE_KEY = "oryuk_daily_maintenance_last_date_v1";
const ERROR_LOGS_KEY = "oryuk_system_error_logs_v1";
const DAILY_BACKUP_STORAGE_KEY = "oryuk_daily_backup_latest_v1";

/**
 * Get current date string in KST (YYYY-MM-DD)
 */
export const getTodayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Get current timestamp formatted string (YYYY-MM-DD HH:mm:ss)
 */
export const getCurrentTimestampStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

/**
 * Get last maintenance execution status
 */
export const getDailyMaintenanceStatus = () => {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STATUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {}
  return {
    lastRunDate: null,
    lastRunTime: null,
    status: "IDLE",
    summary: "아직 점검이 실행되지 않았습니다.",
    details: {}
  };
};

/**
 * Record system error log (Ring buffer max 50 entries)
 */
export const logSystemError = (category, errorObj, extraInfo = {}) => {
  try {
    const errorMsg = errorObj?.message || String(errorObj || "알 수 없는 오류");
    const newEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: getCurrentTimestampStr(),
      category: String(category || "SYSTEM"),
      message: errorMsg,
      extra: extraInfo
    };

    let list = [];
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    if (raw) {
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch (e) {}
    }

    list.unshift(newEntry);
    // Keep last 50 error entries
    const trimmed = list.slice(0, 50);
    localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Error logging failed:", e);
  }
};

/**
 * Get recent system error logs
 */
export const getSystemErrorLogs = () => {
  try {
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

/**
 * 1. Sanitize Extrusion Downtime Master Data
 */
const sanitizeExtrusionMaster = async () => {
  let cleanedCount = 0;
  const storageKey = "factory_extrusion_downtime_user_uploaded_v5";
  let linesData = {};

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      linesData = JSON.parse(raw) || {};
    }
  } catch (e) {}

  if (!linesData || typeof linesData !== "object") linesData = {};

  const next = {};
  let modified = false;

  Object.keys(linesData).forEach((lineKey) => {
    const lineObj = linesData[lineKey];
    if (!lineObj || typeof lineObj !== "object") return;

    if (lineObj.sheets && typeof lineObj.sheets === "object") {
      const sortedKeys = sortExtrusionWeeks(Object.keys(lineObj.sheets));
      const cleanedSheets = {};

      sortedKeys.forEach((wKey) => {
        const sh = lineObj.sheets[wKey];
        if (!sh) return;
        const cleanRows = sanitizeExtrusionRows(sh.rows);
        if (cleanRows.length !== (sh.rows?.length || 0)) {
          modified = true;
          cleanedCount += (sh.rows?.length || 0) - cleanRows.length;
        }

        let totalDowntime = 0;
        let planStop = 0;
        let totalScrapKg = 0;
        cleanRows.forEach((r) => {
          const min = Number(r.minutes || 0);
          const wt = Number(r.weight || 0);
          totalDowntime += min;
          totalScrapKg += wt;
          if (r.plan === "Y" || r.plan === "y") planStop += min;
        });

        cleanedSheets[wKey] = {
          ...sh,
          rows: cleanRows,
          rowsCount: cleanRows.length,
          totalDowntime,
          totalDowntimeHours: (totalDowntime / 60).toFixed(1),
          planStop,
          netDowntime: Math.max(0, totalDowntime - planStop),
          totalScrapKg: Number(totalScrapKg.toFixed(1))
        };
      });

      next[lineKey] = {
        ...lineObj,
        sheets: cleanedSheets
      };
    } else {
      next[lineKey] = lineObj;
    }
  });

  if (modified) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      await setDoc(doc(db, "extrusion_lines_data", "master_v5"), sanitizeForFirestore(next), { merge: true });
    } catch (e) {
      console.warn("Extrusion sanitize save error:", e);
    }
  }

  return { lineCount: Object.keys(next).length, removedPhantomRows: cleanedCount };
};

/**
 * 2. Sanitize Electronic Approval Documents
 */
const sanitizeApprovalDocuments = async () => {
  const storageKey = "oryuk_approval_documents_v9_master";
  let docs = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      docs = JSON.parse(raw) || [];
      if (!Array.isArray(docs)) docs = [];
    }
  } catch (e) {}

  let removedInvalid = 0;
  const validDocs = docs.filter((d) => {
    if (!d || typeof d !== "object") {
      removedInvalid++;
      return false;
    }
    if (!d.id || !d.title) {
      removedInvalid++;
      return false;
    }
    return true;
  });

  // Deduplicate by ID
  const seen = new Set();
  const dedupedDocs = [];
  validDocs.forEach((d) => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      dedupedDocs.push(d);
    } else {
      removedInvalid++;
    }
  });

  if (removedInvalid > 0 || dedupedDocs.length !== docs.length) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dedupedDocs));
    } catch (e) {}
  }

  return { totalApprovals: dedupedDocs.length, removedInvalid };
};

/**
 * 3. Sanitize Daily Work Logs
 */
const sanitizeDailyWorkLogs = async () => {
  const storageKey = "factory_daily_work_logs_v17_pure_sync";
  let logs = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      logs = JSON.parse(raw) || [];
      if (!Array.isArray(logs)) logs = [];
    }
  } catch (e) {}

  let removedCount = 0;
  const validLogs = logs.filter((l) => {
    if (!l || typeof l !== "object") {
      removedCount++;
      return false;
    }
    if (!l.id || !l.date) {
      removedCount++;
      return false;
    }
    return true;
  });

  const seen = new Set();
  const dedupedLogs = [];
  validLogs.forEach((l) => {
    if (!seen.has(l.id)) {
      seen.add(l.id);
      dedupedLogs.push(l);
    } else {
      removedCount++;
    }
  });

  if (removedCount > 0 || dedupedLogs.length !== logs.length) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dedupedLogs));
    } catch (e) {}
  }

  return { totalWorkLogs: dedupedLogs.length, removedCount };
};

/**
 * 4. Create Daily Snapshot Backup in Firestore & Local Storage
 */
const createDailySnapshot = async (todayStr) => {
  try {
    // Collect snapshot of main collections
    const extrusionRaw = localStorage.getItem("factory_extrusion_downtime_user_uploaded_v5");
    const approvalsRaw = localStorage.getItem("oryuk_approval_documents_v9_master");
    const workLogsRaw = localStorage.getItem("factory_daily_work_logs_v17_pure_sync");
    const overtimeRaw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
    const qualityRaw = localStorage.getItem("factory_daily_quality_records_v4_exact");
    const issuesRaw = localStorage.getItem("oryuk_urgent_issues_v2");

    const snapshot = {
      backupDate: todayStr,
      createdAt: getCurrentTimestampStr(),
      timestamp: Date.now(),
      version: "v5",
      counts: {
        approvals: approvalsRaw ? (JSON.parse(approvalsRaw) || []).length : 0,
        workLogs: workLogsRaw ? (JSON.parse(workLogsRaw) || []).length : 0,
        overtimeReports: overtimeRaw ? (JSON.parse(overtimeRaw) || []).length : 0,
        qualityRecords: qualityRaw ? (JSON.parse(qualityRaw) || []).length : 0,
        urgentIssues: issuesRaw ? (JSON.parse(issuesRaw) || []).length : 0
      },
      data: {
        extrusion: extrusionRaw ? JSON.parse(extrusionRaw) : {},
        approvals: approvalsRaw ? JSON.parse(approvalsRaw) : [],
        workLogs: workLogsRaw ? JSON.parse(workLogsRaw) : [],
        overtimeReports: overtimeRaw ? JSON.parse(overtimeRaw) : [],
        qualityRecords: qualityRaw ? JSON.parse(qualityRaw) : [],
        urgentIssues: issuesRaw ? JSON.parse(issuesRaw) : []
      }
    };

    // Save latest snapshot to LocalStorage
    try {
      localStorage.setItem(DAILY_BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn("Local backup save warning (storage full?):", e);
    }

    // Save snapshot document to Firestore: system_daily_backups/backup_YYYYMMDD
    const docId = `backup_${todayStr.replace(/-/g, "")}`;
    await setDoc(doc(db, "system_daily_backups", docId), sanitizeForFirestore(snapshot), { merge: true });

    return { success: true, docId, counts: snapshot.counts };
  } catch (err) {
    console.error("Daily snapshot backup error:", err);
    logSystemError("BACKUP", err);
    return { success: false, error: err.message };
  }
};

/**
 * Execute Full Daily Maintenance Routine
 * @param {{ isManual?: boolean }} options
 */
export const runDailyMaintenance = async ({ isManual = false } = {}) => {
  const todayStr = getTodayDateStr();
  const startTime = Date.now();
  console.log(`[DailyMaintenance] Starting maintenance routine (isManual: ${isManual}, date: ${todayStr})...`);

  try {
    // 1. Sanitize Collections
    const extrusionResult = await sanitizeExtrusionMaster();
    const approvalResult = await sanitizeApprovalDocuments();
    const workLogResult = await sanitizeDailyWorkLogs();

    // 2. Create Daily Snapshot Backup
    const backupResult = await createDailySnapshot(todayStr);

    const elapsedMs = Date.now() - startTime;
    const statusPayload = {
      lastRunDate: todayStr,
      lastRunTime: getCurrentTimestampStr(),
      isManual,
      status: "SUCCESS",
      elapsedMs,
      summary: `정상 완료 (${elapsedMs}ms 소요)`,
      details: {
        extrusion: extrusionResult,
        approvals: approvalResult,
        workLogs: workLogResult,
        backup: backupResult
      }
    };

    localStorage.setItem(MAINTENANCE_STATUS_KEY, JSON.stringify(statusPayload));
    localStorage.setItem(MAINTENANCE_LAST_DATE_KEY, todayStr);

    // Dispatch global event for UI components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("daily-maintenance-completed", { detail: statusPayload }));
    }

    console.log("[DailyMaintenance] Completed successfully:", statusPayload);
    return statusPayload;
  } catch (err) {
    console.error("[DailyMaintenance] Routine error:", err);
    logSystemError("MAINTENANCE", err);

    const errorPayload = {
      lastRunDate: todayStr,
      lastRunTime: getCurrentTimestampStr(),
      isManual,
      status: "ERROR",
      summary: `오류 발생: ${err.message}`,
      error: err.message
    };
    try {
      localStorage.setItem(MAINTENANCE_STATUS_KEY, JSON.stringify(errorPayload));
    } catch (e) {}
    return errorPayload;
  }
};

/**
 * Initialize Daily Maintenance Scheduler in Background
 * Runs once per day upon first morning load or at early dawn window (00:00 ~ 05:59)
 */
let schedulerTimer = null;

export const initDailyMaintenanceScheduler = () => {
  if (typeof window === "undefined") return;

  const checkAndRun = () => {
    try {
      const todayStr = getTodayDateStr();
      const lastRunDate = localStorage.getItem(MAINTENANCE_LAST_DATE_KEY);

      // If not yet run today, execute maintenance silently in background
      if (lastRunDate !== todayStr) {
        // Non-blocking slight delay so app startup renders instantly
        setTimeout(() => {
          runDailyMaintenance({ isManual: false }).catch((err) => {
            console.warn("Background daily maintenance caught error:", err);
          });
        }, 3000);
      }
    } catch (e) {
      console.warn("Scheduler check error:", e);
    }
  };

  // Run initial check upon app startup
  checkAndRun();

  // Periodic interval check every 15 minutes (for apps kept open overnight)
  if (!schedulerTimer) {
    schedulerTimer = setInterval(checkAndRun, 15 * 60 * 1000);
  }

  return () => {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  };
};
