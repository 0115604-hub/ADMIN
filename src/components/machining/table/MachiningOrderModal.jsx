import React from "react";

export const MachiningOrderModal = ({
  orderModalProject,
  setOrderModalProject,
  orderModalInput,
  setOrderModalInput,
  handleSaveOrderModal
}) => {
  if (!orderModalProject) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white font-black text-sm">🎯</span>
            <h4 className="font-black text-sm text-white">
              [{orderModalProject} G/RUN] 생산오더 설정
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setOrderModalProject(null)}
            className="text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            당일 관리자 생산오더 수량 (EA)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={orderModalInput}
            onChange={(e) => setOrderModalInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-indigo-500/60 font-mono font-black text-white text-base text-right outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
          />
          <p className="text-[11px] text-slate-400">
            💡 입력하신 오더수량은 현장작업자의 당일 작업일보 [🎯 목표수량]에 즉시 자동 반영됩니다.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setOrderModalProject(null)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveOrderModal}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md cursor-pointer"
          >
            오더 저장 적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachiningOrderModal;
