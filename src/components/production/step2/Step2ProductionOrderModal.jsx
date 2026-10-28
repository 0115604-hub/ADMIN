import React from "react";

/**
 * 🌟 2단계 관리자: 생산오더 간편 수정 모달
 */
export default function Step2ProductionOrderModal({
  isOpen,
  onClose,
  orderModalKey,
  orderModalDivision,
  orderModalInput,
  setOrderModalInput,
  onSaveOrder
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 shadow-2xl p-5 w-full max-w-sm space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
          <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>🎯</span>
            <span>[{orderModalKey}] 당일 생산오더 설정</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
            당일 관리자 생산오더 수량 ({orderModalDivision === "extrusion" ? "M" : "EA"})
          </label>
          <input
            type="number"
            value={orderModalInput}
            onChange={(e) => setOrderModalInput(e.target.value)}
            placeholder="수량 입력"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            💡 입력하신 오더수량은 현장 작업자의 1단계 작업일보 [🎯 목표수량]에 즉시 자동 반영됩니다.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSaveOrder}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer"
          >
            오더 저장 적용
          </button>
        </div>
      </div>
    </div>
  );
}
