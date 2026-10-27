import React from "react";
import { Factory, Wrench, FileSpreadsheet, X } from "lucide-react";

export const MachiningModalHeader = ({
  project,
  processId,
  currentStep,
  setCurrentStep,
  handleExportExcel,
  onClose
}) => {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-xs shrink-0">
          <Factory className="w-6 h-6 text-amber-100" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-black text-base sm:text-lg tracking-tight">
              (주)오륙 삼랑진공장 가공동 작업일보
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-amber-800 shadow-xs font-mono">
              {project} G/RUN
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-900/60 text-amber-100">
              {currentStep === "tpm" ? "4단계: TPM 설비일상점검" : `5단계: ${processId} 일보`}
            </span>
          </div>
          <p className="text-xs text-amber-100/90 font-medium mt-0.5">
            {currentStep === "tpm"
              ? "작업일보 진입 전 6대 가공 설비 일상점검 (○ 양호 / × 이상) 필수 진행"
              : "JA • NX4 • NX4a • HR G/RUN 4대 차종 라인 표준 공정 실적 관리"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {currentStep === "report" && (
          <button
            type="button"
            onClick={() => setCurrentStep("tpm")}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
            title="TPM 설비일상점검표 다시보기"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TPM 점검표</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
          title="엑셀 다운로드"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">엑셀</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-amber-100 hover:text-white hover:bg-white/20 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MachiningModalHeader;
