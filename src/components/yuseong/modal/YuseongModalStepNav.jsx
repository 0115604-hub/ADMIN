import React from "react";
import { Wrench, FileText } from "lucide-react";

export const YuseongModalStepNav = ({
  currentStep,
  setCurrentStep,
  handleProceedToReport,
  tpmSummary,
  project
}) => {
  return (
    <div className="px-4 sm:px-6 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 text-xs font-black">
        <button
          type="button"
          onClick={() => setCurrentStep("tpm")}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            currentStep === "tpm"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>4단계: TPM 설비일상점검 (선행)</span>
          {tpmSummary.ngCount > 0 ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          ) : (
            <span className="text-[10px] text-emerald-200 font-mono">OK</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleProceedToReport}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            currentStep === "report"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>5단계: {project} 공정별 작업일보</span>
        </button>
      </div>

      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
        {currentStep === "tpm" ? "35개 점검 항목" : "JK1 • CE1 • DT Hood 3대 아이템"}
      </div>
    </div>
  );
};
