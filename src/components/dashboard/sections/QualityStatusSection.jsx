import React from "react";
import { Microscope, ArrowRight, X, Plus } from "lucide-react";
import { PANEL_THEMES, cleanTitleWithoutEmoji } from "../../../config/panelThemeConfig";

export const QualityStatusSection = ({
  selectedMonth,
  onNavigateTab,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,
  customSettings = null,
  isInlineEditing = false,
  onUpdateDraft = null
}) => {
  const items = liveQualityCurrentMonthly?.items || liveQualityPrevMonthly?.items || [];
  const themeObj = PANEL_THEMES[customSettings?.theme || "indigo"];
  const rawTitle = customSettings?.customTitle !== undefined ? customSettings.customTitle : "중요ITEM 품질현황";
  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "중요ITEM 품질현황";
  const radius = customSettings?.borderRadius || "rounded-2xl";
  const border = customSettings?.borderStyle ? `${customSettings.borderStyle} ${themeObj.borderClass}` : "border border-slate-200/80 dark:border-slate-800";
  const defaultBadgeText = `${selectedMonth?.slice(5, 7) || "9"}월 실적`;

  return (
    <div className={`bg-white dark:bg-slate-900 ${radius} p-2.5 sm:p-3 ${border} shadow-sm space-y-2 min-w-0 max-w-full overflow-hidden`}>
      {/* Header with Quality Detail Link */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
          {isInlineEditing ? (
            <div className="flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="text"
                value={titleValue}
                onChange={(e) => onUpdateDraft?.({ customTitle: cleanTitleWithoutEmoji(e.target.value) })}
                placeholder="제목..."
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-cyan-400 text-slate-900 dark:text-white font-black text-xs sm:text-sm outline-none min-w-[150px]"
              />
            </div>
          ) : (
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{titleValue}</span>
            </h2>
          )}

          {isInlineEditing ? (
            <div className="inline-flex items-center gap-1">
              {customSettings?.hideBadge !== true ? (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.2 sm:px-2 rounded-full text-[9.5px] sm:text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <input
                    type="text"
                    value={customSettings?.customBadge !== undefined ? customSettings.customBadge : defaultBadgeText}
                    onChange={(e) => onUpdateDraft?.({ customBadge: e.target.value })}
                    className="bg-transparent text-inherit font-black text-[9.5px] sm:text-[10px] outline-none w-20 border-b border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateDraft?.({ hideBadge: true })}
                    className="p-0.5 hover:bg-black/10 rounded-full"
                    title="뱃지 삭제"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateDraft?.({ hideBadge: false, customBadge: defaultBadgeText })}
                  className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold border border-dashed border-emerald-500 text-emerald-500 flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>+ 뱃지 복원</span>
                </button>
              )}
            </div>
          ) : (
            customSettings?.hideBadge !== true && (
              <span className="px-1.5 py-0.2 sm:px-2 rounded-full text-[9.5px] sm:text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {customSettings?.customBadge || defaultBadgeText}
              </span>
            )
          )}
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("daily_quality")}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[11px] sm:text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {items.map((it) => {
          const isGood = it.defectRate <= 0.70;

          return (
            <div
              key={it.id}
              onClick={() => handleOpenQualityPopup && handleOpenQualityPopup(it)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpenQualityPopup && handleOpenQualityPopup(it)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                isGood
                  ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400"
                  : "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
              } hover:scale-[1.01] active:scale-98 shadow-xs space-y-1`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white truncate">
                  {it.name}
                </span>
                <span
                  className={`px-1 py-0.2 rounded text-[9px] font-black shrink-0 ${
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
                  className={`text-base sm:text-lg font-black font-mono leading-none ${
                    isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {it.defectRate}%
                </span>
                <span className="text-[9.5px] text-slate-400 font-bold">
                  {it.inspectQty?.toLocaleString()}EA / {it.defectQty}불량
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
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
