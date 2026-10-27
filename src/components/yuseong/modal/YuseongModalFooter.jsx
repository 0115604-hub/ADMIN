import React from "react";
import { ArrowRight, Wrench, Check, Save } from "lucide-react";

export const YuseongModalFooter = ({
  onClose,
  currentStep,
  setCurrentStep,
  handleProceedToReport,
  handleSave,
  isSaving,
  saveSuccess
}) => {
  return (
    <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
        <span>(주)유성 가공/협력업체 실시간 동기화</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          닫기
        </button>

        {currentStep === "tpm" ? (
          <button
            type="button"
            onClick={handleProceedToReport}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <span>TPM 점검 완료 ➔ 작업일보 작성 계속</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCurrentStep("tpm")}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-300 dark:border-indigo-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>TPM 점검표</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>저장 완료!</span>
                </>
              ) : isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>작업일보 등록 저장</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
