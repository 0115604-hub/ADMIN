import React from "react";

export const MachiningItemKpiCards = ({
  projectFilter,
  setProjectFilter,
  reportsCount,
  stats,
  hrOrder,
  jaOrder,
  nx5Order,
  hrAttainment,
  jaAttainment,
  nx5Attainment,
  handleOpenOrderEdit
}) => {
  return (
    <div className="space-y-2.5">
      {/* 3대 아이템 선택 뱃지 바 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
            <span>🏷️</span> <span>담당 아이템 선택:</span>
          </span>
          <button
            type="button"
            onClick={() => setProjectFilter(projectFilter === "HR" ? "all" : "HR")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              projectFilter === "HR"
                ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-300 scale-105"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span>🚚</span> <span>HR G/RUN</span>
            {projectFilter === "HR" && (
              <span className="bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded-full text-[9px]">
                선택됨
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setProjectFilter(projectFilter === "JA" ? "all" : "JA")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              projectFilter === "JA"
                ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            <span>🚗</span> <span>JA G/RUN</span>
            {projectFilter === "JA" && (
              <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">
                선택됨
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setProjectFilter(projectFilter === "NX5A" ? "all" : "NX5A")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              projectFilter === "NX5A"
                ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-300 scale-105"
                : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 hover:bg-teal-100"
            }`}
          >
            <span>⚡</span> <span>NX5a PTR</span>
            {projectFilter === "NX5A" && (
              <span className="bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded-full text-[9px]">
                선택됨
              </span>
            )}
          </button>
        </div>

        {projectFilter !== "all" && (
          <button
            type="button"
            onClick={() => setProjectFilter("all")}
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>✕ 필터 해제 (전체 보기)</span>
          </button>
        )}
      </div>

      {/* 3대 차종 오더 ↔ 실적 달성률 통합 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* HR */}
        <div
          onClick={() => setProjectFilter(projectFilter === "HR" ? "all" : "HR")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
            projectFilter === "HR"
              ? "bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-4 ring-amber-400 shadow-xl scale-[1.02]"
              : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/80 dark:border-amber-900/40 hover:shadow-md hover:border-amber-400"
          }`}
          title="클릭 시 HR 아이템의 생산실적 및 비가동 내역만 전용 필터링됩니다"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <span>🚚</span>
              <span>HR G/RUN (포터)</span>
              {projectFilter === "HR" && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black">
                  선택됨
                </span>
              )}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                Number(hrAttainment) >= 100
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"
              }`}
            >
              달성률 {hrAttainment}%
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenOrderEdit("HR", hrOrder);
                }}
                className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-amber-200/50"
                title="클릭하여 HR 오늘 생산오더를 수정합니다"
              >
                <span>{hrOrder.toLocaleString()} EA</span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {stats.hrGen.toLocaleString()} EA
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Number(hrAttainment) >= 100
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-amber-500 to-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, Number(hrAttainment)))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>불량: {(stats.hrGross - stats.hrGen).toLocaleString()} EA (수율 {stats.hrYield}%)</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">총 {stats.hrGross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* JA */}
        <div
          onClick={() => setProjectFilter(projectFilter === "JA" ? "all" : "JA")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
            projectFilter === "JA"
              ? "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-4 ring-indigo-400 shadow-xl scale-[1.02]"
              : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border-indigo-200/80 dark:border-indigo-900/40 hover:shadow-md hover:border-indigo-400"
          }`}
          title="클릭 시 JA 아이템의 생산실적 및 비가동 내역만 전용 필터링됩니다"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <span>🚗</span>
              <span>JA G/RUN (모닝/레이)</span>
              {projectFilter === "JA" && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black">
                  선택됨
                </span>
              )}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                Number(jaAttainment) >= 100
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"
              }`}
            >
              달성률 {jaAttainment}%
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenOrderEdit("JA", jaOrder);
                }}
                className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-indigo-200/50"
                title="클릭하여 JA 오늘 생산오더를 수정합니다"
              >
                <span>{jaOrder.toLocaleString()} EA</span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {stats.jaGen.toLocaleString()} EA
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Number(jaAttainment) >= 100
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-indigo-500 to-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, Number(jaAttainment)))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>불량: {(stats.jaGross - stats.jaGen).toLocaleString()} EA (수율 {stats.jaYield}%)</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">총 {stats.jaGross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* NX5a */}
        <div
          onClick={() => setProjectFilter(projectFilter === "NX5A" ? "all" : "NX5A")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
            projectFilter === "NX5A"
              ? "bg-teal-100/90 dark:bg-teal-950/80 border-teal-500 ring-4 ring-teal-400 shadow-xl scale-[1.02]"
              : "bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border-teal-200/80 dark:border-teal-900/40 hover:shadow-md hover:border-teal-400"
          }`}
          title="클릭 시 NX5a 아이템의 생산실적 및 비가동 내역만 전용 필터링됩니다"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
              <span>⚡</span>
              <span>NX5a PTR (투싼 PE)</span>
              {projectFilter === "NX5A" && (
                <span className="px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black">
                  선택됨
                </span>
              )}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                Number(nx5Attainment) >= 95
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400"
              }`}
            >
              달성률 {nx5Attainment}%
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenOrderEdit("NX5A", nx5Order);
                }}
                className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-teal-200/50"
                title="클릭하여 NX5a 오늘 생산오더를 수정합니다"
              >
                <span>{nx5Order.toLocaleString()} EA</span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {stats.nx5Gen.toLocaleString()} EA
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Number(nx5Attainment) >= 95
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                  : "bg-gradient-to-r from-amber-500 to-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, Number(nx5Attainment)))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>불량: {(stats.nx5Gross - stats.nx5Gen).toLocaleString()} EA (수율 {stats.nx5Yield}%)</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">총 {stats.nx5Gross.toLocaleString()} EA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachiningItemKpiCards;
