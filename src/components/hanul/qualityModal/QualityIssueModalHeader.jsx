import React from "react";
import { ShieldAlert, X } from "lucide-react";

export const QualityIssueModalHeader = ({
  companyLabel,
  headerBadgeLabel,
  stats,
  onClose
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4.5 border-b border-purple-500/40 shadow-sm flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              {companyLabel} 부적합경보 등록
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-2xs">
              {headerBadgeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Quick KPI Badges */}
        <div className="hidden md:flex items-center gap-1.5">
          <div className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/60 text-center">
            <span className="text-[9.5px] font-bold text-rose-300 block">🚨 진행중</span>
            <span className="font-mono font-black text-rose-400 text-xs">{stats.active}건</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-center">
            <span className="text-[9.5px] font-bold text-emerald-300 block">✅ 조치완료</span>
            <span className="font-mono font-black text-emerald-400 text-xs">{stats.resolved}건</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="닫기 (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
