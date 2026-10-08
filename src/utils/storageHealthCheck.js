/**
 * Storage Health Check & Auto Repair Utility
 * 전사 로컬 스토리지 무결성 검증, 구버전 잔여물 청소 및 자동 복구
 */

export const runStorageHealthCheck = () => {
  try {
    // 1. Critical Keys to validate for valid JSON format
    const criticalKeys = [
      { key: "factory_daily_work_logs_v17_pure_sync", type: "array" },
      { key: "oryuk_urgent_issues_v2", type: "array" },
      { key: "oryuk_approval_documents_v9_master", type: "array" },
      { key: "official_overtime_reports_store_v7_company_reports", type: "array" },
      { key: "oryuk_smart_overtime_data_v2_sept", type: "array" },
      { key: "oryuk_smart_overtime_data_2026_09", type: "array" },
      { key: "oryuk_smart_overtime_data_2026_10", type: "array" },
      { key: "oryuk_common_schedules_v1", type: "array" },
      { key: "factory_daily_quality_records_v4_exact", type: "array" },
      { key: "oryuk_telegram_config_v4", type: "object" },
      { key: "oryuk_telegram_templates_v1", type: "object" },
      { key: "admin_user_profile", type: "object" },
      { key: "factory_extrusion_custom_bom_v1", type: "object" },
      { key: "oryuk_4m_absence_logs_v1", type: "object" },
      { key: "operator_upload_history_clean_v2", type: "array" }
    ];

    criticalKeys.forEach(({ key, type }) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null && raw !== undefined) {
          const parsed = JSON.parse(raw);
          // If expected type is array but parsed is not array, repair to array
          if (type === "array" && !Array.isArray(parsed)) {
            console.warn(`[StorageHealthCheck] Expected array in ${key}, but got ${typeof parsed}. Resetting.`);
            localStorage.setItem(key, JSON.stringify([]));
          } else if (type === "object" && (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))) {
            console.warn(`[StorageHealthCheck] Expected object in ${key}, but got ${typeof parsed}. Resetting.`);
            localStorage.setItem(key, JSON.stringify({}));
          }
        }
      } catch (err) {
        console.warn(`[StorageHealthCheck] Corrupted JSON detected in ${key}, resetting to safe default:`, err);
        if (type === "array") {
          localStorage.setItem(key, JSON.stringify([]));
        } else if (type === "object") {
          localStorage.setItem(key, JSON.stringify({}));
        } else {
          localStorage.removeItem(key);
        }
      }
    });

    // 2. Safe cleanup of obsolete temporary/scratch/legacy keys that consume storage quota
    const obsoletePrefixes = [
      "oryuk_temp_cache_",
      "oryuk_scratch_",
      "factory_daily_work_logs_v10_",
      "factory_daily_work_logs_v11_",
      "factory_daily_work_logs_v12_",
      "factory_daily_work_logs_v13_",
      "factory_daily_work_logs_v14_",
      "factory_daily_work_logs_v15_",
      "factory_daily_work_logs_v16_"
    ];

    const exactObsoleteKeys = [
      "factory_extrusion_downtime_parsed_v2",
      "factory_extrusion_downtime_user_uploaded_v3",
      "factory_extrusion_downtime_user_uploaded_v4",
      "factory_extrusion_downtime_4lines_v24_real_purged",
      "factory_extrusion_downtime_4lines_v23_pcm1qq_verified",
      "factory_extrusion_downtime_logs_clean_v1",
      "factory_extrusion_selected_line",
      "factory_extrusion_selected_week",
      "admin_multi_month_store_v4_firestore",
      "admin_transactions",
      "admin_pnl_transactions_full_v2",
      "operator_upload_history",
      "oryuk_screen_zoom_idx",
      "oryuk_smart_overtime_data_store_v10_company_separated"
    ];

    // Remove exact obsolete keys
    exactObsoleteKeys.forEach((k) => {
      try {
        if (localStorage.getItem(k) !== null) {
          localStorage.removeItem(k);
        }
      } catch (e) {}
    });

    // Remove obsolete prefix keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && obsoletePrefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }

    console.log("[StorageHealthCheck] Local storage health check & cleanup completed successfully.");
  } catch (globalErr) {
    console.warn("[StorageHealthCheck] Non-fatal check error:", globalErr);
  }
};
