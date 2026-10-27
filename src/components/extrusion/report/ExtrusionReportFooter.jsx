import React from "react";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";

/**
 * ExtrusionReportFooter
 * Bottom action bar with cancel, step navigation, and submit/save buttons.
 */
const ExtrusionReportFooter = ({
  currentStep,
  setCurrentStep,
  onClose,
  handleProceedToReport,
  handleSubmit,
  isEditing,
}) => {
  return (
    <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
      {currentStep === "tpm" ? (
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleProceedToReport}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>TPM 점검 완료 ➔ 작업일보 작성 진행</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setCurrentStep("tpm")}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>TPM 점검표 다시보기</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? "작업일보 수정 저장" : "실시간 작업일보 등록"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExtrusionReportFooter;
