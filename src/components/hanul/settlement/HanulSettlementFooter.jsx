import React from "react";
import { CheckCircle2, Save } from "lucide-react";

/**
 * HanulSettlementFooter
 * 한울 정산/지출공제 모달의 하단 액션 바 (저장 피드백 배너, 닫기 및 지출내역등록 버튼)
 */
export default function HanulSettlementFooter({
  isSavedToast,
  handleModalClose,
  handleSave
}) {
  return (
    <div className="px-3.5 py-2 sm:px-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {isSavedToast && (
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-300 animate-fadeIn flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>지출내역이 안전하게 등록되었습니다!</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleModalClose}
          className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
        >
          닫기
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>지출내역등록</span>
        </button>
      </div>
    </div>
  );
}
