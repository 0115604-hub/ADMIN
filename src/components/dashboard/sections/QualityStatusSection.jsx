import React from "react";
import { ArrowRight } from "lucide-react";
import { PANEL_THEMES } from "../../../config/panelThemeConfig";

export const QualityStatusSection = ({
  selectedMonth,
  onNavigateTab,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,
  customSettings = null
}) => {
  const items = liveQualityCurrentMonthly?.items || liveQualityPrevMonthly?.items || [];
  const themeObj = PANEL_THEMES[customSettings?.theme || "indigo"];
  const title = customSettings?.customTitle || "중요ITEM 품질현황";
  const radius = customSettings?.borderRadius || "rounded-2xl sm:rounded-3xl";
  const border = customSettings?.borderStyle ? `${customSettings.borderStyle} ${themeObj.borderClass}` : "border border-slate-200/80 dark:border-slate-800";

  return (
    <div className={`bg-white dark:bg-slate-900 ${radius} p-3.5 sm:p-5 ${border} shadow-sm space-y-3.5 min-w-0 max-w-full overflow-hidden`}>
      {/* Header with Quality Detail Link */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
            {title}
          </h2>
          <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            {selectedMonth?.slice(5, 7) || "9"}월 실적
          </span>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("daily_quality")}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span>품질 상세</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
      </div>

      {/* 4 Core Item Quick Chips (Click to Open Detail Popup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((it) => {
          const isGood = it.defectRate <= 0.70;

          return (
            <div
              key={it.id}
              onClick={() => handleOpenQualityPopup && handleOpenQualityPopup(it)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpenQualityPopup && handleOpenQualityPopup(it)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                isGood
                  ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400"
                  : "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
              } hover:scale-[1.02] active:scale-98 shadow-xs space-y-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {it.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                    isGood
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 animate-pulse"
                  }`}
                >
                  {isGood ? "목표달성" : "관리주의"}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span
                  className={`text-lg sm:text-xl font-black font-mono leading-none ${
                    isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {it.defectRate}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {it.inspectQty?.toLocaleString()}EA / {it.defectQty}불량
                </span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span className="truncate">손실: ₩{it.lossAmount?.toLocaleString()}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <span>팝업</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
