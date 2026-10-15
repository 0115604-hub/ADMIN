import React from "react";
import { ArrowRight } from "lucide-react";

export const SalesPurchaseSummarySection = ({
  monthTitle,
  currentMonthData,
  todayFormattedLabel,
  onNavigateTab,
  formatAmount,
  totalSales,
  totalPurchases,
  purchaseRatio
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
            1. {monthTitle} 매입매출현황 요약
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0"
            title={
              currentMonthData?.latestFile?.fileName
                ? `등록 엑셀: ${currentMonthData.latestFile.fileName} (${currentMonthData.latestFile.uploadedBy || "조인주 선임"})`
                : "일일 누적 기준"
            }
          >
            {currentMonthData?.latestFile?.uploadedAtFormatted
              ? `${currentMonthData.latestFile.uploadedAtFormatted} 업로드 기준`
              : `${todayFormattedLabel} 기준 (누적)`}
          </span>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("vehicle_sales")}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span>매출 상세</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
      </div>

      {/* 3 Core KPI Cards (Clean numbers without annotations) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매출액</span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {formatAmount(totalSales)}
          </span>
        </div>

        <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액 (원가)</span>
          <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
            {formatAmount(totalPurchases)}
          </span>
        </div>

        <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비 매입원가율</span>
          <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
            {purchaseRatio}%
          </span>
        </div>
      </div>
    </div>
  );
};
