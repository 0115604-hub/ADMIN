import React from "react";
import { ShieldCheck, Save, ArrowRight } from "lucide-react";
import { translateTerm } from "../../services/workLogI18nService";

/**
 * 🌟 4. Modal Footer: Save, Excel, and Close Actions
 */
export const HanulReportFooter = ({
  isAssignedTemplateMode,
  processId,
  currentStep,
  setCurrentStep,
  toastMessage,
  tpmSummary,
  tpmI18n,
  onClose,
  handleProceedToReport,
  handleSave,
  isSaving,
  currentLang
}) => {
  if (isAssignedTemplateMode && !(processId === "소재준비" && currentStep === "tpm")) {
    return null;
  }

  return (
    <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2">
        {toastMessage && (
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            {toastMessage}
          </span>
        )}
        {processId === "소재준비" && currentStep === "tpm" && (
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
            점검완료: {tpmSummary?.okCount || 0} / 42 양호
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {processId === "소재준비" && currentStep === "report" && (
          <button
            type="button"
            onClick={() => setCurrentStep("tpm")}
            className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{tpmI18n.backToTpm}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {tpmI18n.close}
        </button>

        {processId === "소재준비" && currentStep === "tpm" ? (
          <button
            type="button"
            onClick={handleProceedToReport}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <span>{tpmI18n.saveAndNext}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? translateTerm("저장 중...", currentLang) : tpmI18n.saveReport}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default HanulReportFooter;
