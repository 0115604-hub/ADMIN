import React from "react";
import { Sparkles, Wrench, X } from "lucide-react";

export const YuseongModalHeader = ({
  project,
  processId,
  currentStep,
  setCurrentStep,
  onClose
}) => {
  return (
    <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm sm:text-base leading-tight">
              (주)유성 가공/협력업체 작업일보
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-2xs">
              {currentStep === "tpm" ? "4단계: TPM 설비일상점검" : `5단계: ${project} ${processId} 일보`}
            </span>
          </div>
          <p className="text-[11px] text-indigo-200 font-medium">
            {currentStep === "tpm"
              ? "작업일보 작성 전 5대 설비 35개 항목 일상점검을 먼저 완료해 주십시오."
              : `${project} 3대 아이템 (${processId}) 실시간 생산 실적 및 치수/불량 등록`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentStep(currentStep === "tpm" ? "report" : "tpm")}
          className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{currentStep === "tpm" ? "일보 바로가기" : "TPM 점검표"}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
