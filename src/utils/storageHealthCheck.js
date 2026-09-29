/**
 * Storage Health Check & Auto Repair Utility
 * 전사 로컬 스토리지 무결성 검증, 구버전 잔여물 청소 및 자동 복구
 */

export const runStorageHealthCheck = () => {
  try {
    // 1. Critical Keys to validate for valid JSON format
    const criticalKeys = [
      "factory_daily_work_logs_v17_pure_sync",
      "oryuk_urgent_issues_v2",
      "oryuk_approval_documents_v8_stable",
      "official_overtime_reports_store_v7_company_reports",
      "oryuk_telegram_config_v4",
      "oryuk_telegram_templates_v1",
      "oryuk_common_schedules_v1",
      "admin_user_profile"
    ];

    criticalKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          // Verify if it parses cleanly
          JSON.parse(raw);
        }
      } catch (err) {
        console.warn(`[StorageHealthCheck] Corrupted JSON detected in ${key}, resetting to safe default:`, err);
        if (key.includes("work_logs") || key.includes("issues") || key.includes("approval") || key.includes("reports") || key.includes("schedules")) {
          localStorage.setItem(key, JSON.stringify([]));
        } else if (key.includes("config") || key.includes("templates")) {
          localStorage.setItem(key, JSON.stringify({}));
        } else {
          localStorage.removeItem(key);
        }
      }
    });

    // 2. Safe cleanup of obsolete temporary/scratch keys that consume storage quota
    const obsoletePrefixes = [
      "oryuk_temp_cache_",
      "oryuk_scratch_",
      "factory_daily_work_logs_v10_",
      "factory_daily_work_logs_v11_"
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && obsoletePrefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }

    console.log("[StorageHealthCheck] Local storage health check completed successfully.");
  } catch (globalErr) {
    console.warn("[StorageHealthCheck] Non-fatal check error:", globalErr);
  }
};
