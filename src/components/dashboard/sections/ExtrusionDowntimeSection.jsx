import React from "react";
import { Clock, ArrowRight } from "lucide-react";

export const ExtrusionDowntimeSection = ({
  onNavigateTab,
  extrusionSummaryList = []
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
            4. 압출동 주간 비가동내역 요약
          </h2>
          <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
            9월 당월 누적
          </span>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("extrusion_downtime")}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span>비가동 상세</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
      </div>

      {/* 4 Line Cards with Monthly Mini Graph & Current Month Downtime */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {extrusionSummaryList.map((ex) => {
          return (
            <div
              key={ex.line}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all space-y-1.5 min-w-0"
            >
              {/* Tile Top Header: Line Name & LOSS Rate Badge */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/70 dark:border-slate-700/70 gap-1">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {ex.line}
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                  LOSS {ex.lossRate}
                </span>
              </div>

              {/* Left (당월 누적시간) & Right (월별 비교 그래프) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 items-center">
                {/* Left Side: 당월 누적 합산 */}
                <div className="flex flex-col justify-center pr-1 sm:border-r border-slate-200/70 dark:border-slate-700/70 min-w-0">
                  <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">[{ex.currentMonth}] 당월 누적</span>
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                      {ex.currentMonthMin?.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">분</span>
                  </div>
                  <span className="text-[9px] sm:text-[9.5px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 truncate">
                    ({ex.currentMonthHours}) • 가동률 {ex.opRatio}%
                  </span>
                </div>

                {/* Right Side: 월별 가동율 & LOSS율 추이 (큰막대: 월가동율, 내부 작은막대: LOSS율) */}
                <div className="flex flex-col justify-center space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 pb-0.5">
                    <span>월별 추이 (7~9월)</span>
                    <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-xs bg-emerald-500"></span> 가동
                      <span className="inline-block w-1.5 h-1.5 rounded-xs bg-rose-500 ml-0.5"></span> LOSS
                    </span>
                  </div>

                  <div className="space-y-1">
                    {ex.monthlyTrend?.map((mItem) => {
                      const isNoData = mItem.opRate === "-";
                      const opPct = isNoData ? 0 : Math.min(100, Math.max(20, mItem.opNum));
                      const lossVisualPct = isNoData ? 0 : Math.min(65, Math.max(16, mItem.lossNum * 7));

                      return (
                        <div key={mItem.month} className="flex items-center gap-1.5 min-w-0">
                          {/* 월 라벨 */}
                          <span
                            className={`w-5 text-center py-0.2 rounded font-black text-[8px] shrink-0 leading-tight ${
                              mItem.isCurrent
                                ? "bg-amber-400 text-slate-900 shadow-xs"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {mItem.month?.replace("월", "")}월
                          </span>

                          {/* 시각적 바: 큰막대(월가동율) + 큰막대 안의 작은막대(LOSS율) */}
                          <div className="flex-1 min-w-[50px] bg-slate-200/80 dark:bg-slate-800 rounded-full h-2.5 relative overflow-hidden flex items-center p-0.2">
                            {isNoData ? (
                              <div className="h-full w-full flex items-center justify-center text-[7px] text-slate-400 font-bold">
                                -
                              </div>
                            ) : (
                              <div
                                className={`h-full rounded-full transition-all duration-500 relative flex items-center ${
                                  mItem.isCurrent
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 shadow-xs"
                                    : "bg-teal-600/80 dark:bg-teal-700/80"
                                }`}
                                style={{ width: `${opPct}%` }}
                                title={`${mItem.month} 가동: ${mItem.opRate} | LOSS: ${mItem.lossRate}`}
                              >
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 shadow-xs flex items-center justify-center shrink-0 border border-white/70"
                                  style={{ width: `${lossVisualPct}%` }}
                                  title={`${mItem.month} LOSS율: ${mItem.lossRate}`}
                                />
                              </div>
                            )}
                          </div>

                          {/* 우측 수치 라벨: 가동율 & LOSS율 */}
                          <div className="flex items-center gap-1 font-black text-[8px] shrink-0 leading-none">
                            <span className="text-emerald-700 dark:text-emerald-400">{mItem.opRate}</span>
                            <span className="text-rose-600 dark:text-rose-400">({mItem.lossRate})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
