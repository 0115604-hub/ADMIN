import React, { Suspense, lazy } from "react";
import { Save, X } from "lucide-react";

const SqLevelUpView = lazy(() =>
  import("../../sq/SqLevelUpView").then((m) => ({ default: m.SqLevelUpView || m.default }))
);

/**
 * SqLiveMonitoringModal
 * Displays full-screen modal of the SQ Live 추진판 현황표.
 */
export const SqLiveMonitoringModal = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-[1700px] max-h-[96vh] flex flex-col overflow-hidden animate-scaleIn">
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
              🎯 SQ 진행상황 현황표
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("trigger-sq-reregister"));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="관리자 및 완료예정일자 변경사항 재등록"
            >
              <Save className="w-3.5 h-3.5" />
              <span>변경사항등록</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-100 dark:bg-slate-950">
          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">SQ 레벨업 추진판 로딩 중...</p>
                </div>
              </div>
            }
          >
            <SqLevelUpView />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default SqLiveMonitoringModal;
