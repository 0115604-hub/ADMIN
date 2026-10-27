import React from "react";
import { Trash2, Save } from "lucide-react";

export const LegoBottomActionBar = ({
  isWorkerRecordingMode = false,
  currentReport = {},
  onDeleteWorkReport,
  savedTemplates = [],
  deleteWorkReportTemplate,
  deleteMachiningWorkReport,
  setCurrentReport,
  setAppliedTemplateBanner,
  showToast,
  handleSaveOfficialWorkReport,
  isSubmitting = false,
  PRESET_REPORTS = [],
  t = (s) => s
}) => {
  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
      <span className="text-xs text-slate-500 font-bold">
        💡 {t("작성된 모든 치수 및 수량은 데이터베이스에 안전하게 영구 저장됩니다.")}
      </span>
      <div className="flex items-center gap-2">
        {(onDeleteWorkReport || (currentReport.id && savedTemplates.some((t) => t.id === currentReport.id))) && (
          <button
            type="button"
            onClick={async () => {
              const repTitle = currentReport.title || currentReport.partName || "작업일보";
              if (!window.confirm(`정말로 이 등록된 작업일보 [${repTitle}] 항목을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
              try {
                if (onDeleteWorkReport) {
                  await onDeleteWorkReport();
                } else if (currentReport.id) {
                  await deleteWorkReportTemplate?.(currentReport.id);
                  try { await deleteMachiningWorkReport?.(currentReport.id); } catch (err) {}
                  setCurrentReport?.(PRESET_REPORTS[0]);
                  setAppliedTemplateBanner?.(null);
                  showToast?.(`🗑️ [${repTitle}] 작업일보가 영구 삭제되었습니다.`);
                }
              } catch (err) {
                alert("삭제 중 오류가 발생했습니다: " + err.message);
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5"
            title={t("등록된 작업일보 영구 삭제")}
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>{t("일보 삭제")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveOfficialWorkReport}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>
            {isSubmitting
              ? t("데이터베이스 저장 중...")
              : isWorkerRecordingMode
              ? `💾 ${t("작업일보 기록 저장 (DB 등록)")}`
              : `✅ ${t("작업일보 공식 등록 (DB 저장)")}`}
          </span>
        </button>
      </div>
    </div>
  );
};
export default LegoBottomActionBar;
