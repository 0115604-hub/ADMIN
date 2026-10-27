import React from "react";
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react";

export const OvertimeDeleteWorkerModal = ({
  workerToDelete,
  onClose,
  isDeletingWorker,
  handleConfirmDeleteWorker
}) => {
  if (!workerToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
            <Trash2 className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h3 className="text-lg font-black text-white">근로자 인원 영구 삭제</h3>
            <p className="text-xs text-rose-300 font-bold">마스터 명단 및 인사카드 대장 영구 삭제</p>
          </div>
        </div>

        <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">소속 업체</span>
              <strong className="text-white text-sm font-black">{workerToDelete.company}</strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">성명 / 직급</span>
              <strong className="text-cyan-300 text-sm font-black">
                {workerToDelete.name} ({workerToDelete.position})
              </strong>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">소속 부서</span>
              <span className="text-slate-200 font-bold">{workerToDelete.dept}</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">차종 / 라인</span>
              <span className="text-slate-200 font-bold">{workerToDelete.line}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-300">
            <p className="text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>진행 확인: 이 작업은 단순 근태 취소가 아닌 <strong>인원 영구 삭제</strong>입니다.</span>
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              삭제 시 해당 작업자의 <strong>마스터 인원 명단, 제조현장 인사카드, 모든 월별 근태 대장 기록</strong>이 클라우드와 로컬에서 완전히 삭제됩니다. 계속 진행하시겠습니까?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={isDeletingWorker}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isDeletingWorker}
            onClick={handleConfirmDeleteWorker}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
          >
            {isDeletingWorker ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>인원 삭제 중...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>인원 영구 삭제</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
