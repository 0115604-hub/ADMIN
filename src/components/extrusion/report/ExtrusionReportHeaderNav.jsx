import React from "react";
import {
  Zap,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
  Check,
  FileSpreadsheet
} from "lucide-react";
import { getWorkLogText } from "../../../services/workLogI18nService";

/**
 * 🌟 Extrusion Modal Header & Step Progression Tabs
 */
export const ExtrusionReportHeaderNav = ({
  isEditing,
  isTpmCompleted,
  currentStep,
  setCurrentStep,
  onClose,
  handleSetAllTpmOk,
  handleDownloadCheckSheet
}) => {
  return (
    <>
      {/* Header */}
      <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <Zap className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isEditing
                  ? getWorkLogText("work_log_title") + " (수정)"
                  : getWorkLogText("extrusion_shop") + " " + getWorkLogText("work_log_title")}
              </h3>
              {isTpmCompleted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs shrink-0 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  TPM 완료
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-200/80 font-medium">
              {currentStep === "tpm"
                ? `[1단계] ${getWorkLogText("step_1_tpm")}`
                : `[2단계] ${getWorkLogText("step_2_production")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Step Progression Tabs Header */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep("tpm")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
              currentStep === "tpm"
                ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1단계: TPM 설비 자주보전 점검</span>
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setCurrentStep("report")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
              currentStep === "report"
                ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>2단계: 작업일보 및 체크시트 작성</span>
          </button>
        </div>

        {currentStep === "tpm" ? (
          <button
            type="button"
            onClick={handleSetAllTpmOk}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>⚡ 전체 양호(○) 일괄 체크</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDownloadCheckSheet}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs transition active:scale-95 cursor-pointer border border-teal-500/40 flex items-center gap-1 shadow-2xs shrink-0"
            title="작성 중인 데이터로 A4 3시트 엑셀 다운로드"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
            <span>A4 엑셀 출력</span>
          </button>
        )}
      </div>
    </>
  );
};

export default ExtrusionReportHeaderNav;
