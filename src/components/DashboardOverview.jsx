import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Boxes,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Building2,
  BarChart3
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

export const DashboardOverview = ({
  onNavigateToVehicles,
  onNavigateToMaterials,
  onNavigateToPurchases,
  onNavigateToStatement
}) => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  const salesSummary = currentMonthData?.salesSummary || {
    totalSales: 0,
    totalQty: 0,
    itemCount: 0,
    vehicleGroupCount: 0
  };

  const purchaseSummary = currentMonthData?.purchaseSummary || {
    ledgerBenchmark: 0,
    totalExpenses: 0
  };

  const vehicleSales = currentMonthData?.vehicleSales || [];
  const jajaeGroups = currentMonthData?.jajaeGroups || [];

  const totalSales = salesSummary.totalSales || 0;
  const ledgerPurchases = purchaseSummary.ledgerBenchmark || 0;
  const netProfit = totalSales - ledgerPurchases;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

  // Calculate MoM (compared to previous month in data)
  const prevMonthKey = selectedMonth === "2026-08" ? "2026-07" : null;
  const prevMonthData = prevMonthKey ? allMonthlyData[prevMonthKey] : null;
  const salesMoM = prevMonthData ? totalSales - (prevMonthData.salesSummary?.totalSales || 0) : null;
  const purchaseMoM = prevMonthData ? ledgerPurchases - (prevMonthData.purchaseSummary?.ledgerBenchmark || 0) : null;

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{monthTitle} 월간경영현황 종합 분석</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {monthTitle} 월간경영현황
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              `매입-매출 정리본` 실적 마스터 기준 매출 {formatAmount(totalSales)} vs 매입 {formatAmount(ledgerPurchases)} 종합 손익 대사
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToVehicles}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Car className="w-4 h-4" />
              <span>차종별 매출 ({vehicleSales.length}개)</span>
            </button>
            <button
              onClick={onNavigateToMaterials}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>자재매입 ({jajaeGroups.length}개군)</span>
            </button>
            <button
              onClick={onNavigateToPurchases}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>계정과목별 매입</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{monthTitle} 총 매출액</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {formatAmount(totalSales)}
            </p>
            {salesMoM !== null && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>전월比 {salesMoM >= 0 ? "+" : ""}{formatAmount(salesMoM)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{monthTitle} 총 매입액</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(ledgerPurchases)}
            </p>
            {purchaseMoM !== null && (
              <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>전월比 {purchaseMoM >= 0 ? "+" : ""}{formatAmount(purchaseMoM)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{monthTitle} 영업손익</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-2xl sm:text-3xl font-black ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
              {netProfit >= 0 ? "+" : ""}{formatAmount(netProfit)}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              이익률 <strong className="text-emerald-600 dark:text-emerald-400">{profitMargin}%</strong>
            </p>
          </div>
        </div>

        {/* Production Items */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">출하 차종 및 부품</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {vehicleSales.length}개 차종 <span className="text-base font-normal text-slate-400">/ {salesSummary.itemCount}종</span>
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              총 {salesSummary.totalQty.toLocaleString()}개 부품 출하
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Vehicle Sales & Top Expense Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Vehicles */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {monthTitle} 차종별 매출 순위 Top 6
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">총 {vehicleSales.length}개 차종 중 상위 실적</p>
              </div>
              <button
                onClick={onNavigateToVehicles}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                전체보기 →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {vehicleSales.slice(0, 6).map((v) => (
                <div key={v.vehicleGroup} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        {v.rank}
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {v.vehicleGroup}
                      </span>
                      <span className="text-[10px] text-slate-400">({v.category})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(v.totalAmount)}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 w-12 text-right">
                        {v.share}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(v.share * 2.8, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{monthTitle} 마스터 정리본 기준</span>
            <span className="font-bold text-slate-900 dark:text-white">합계 {formatAmount(totalSales)}</span>
          </div>
        </div>

        {/* Right: Top Material Purchase Groups */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {monthTitle} 자재 품목군별 매입 구조
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">총 {jajaeGroups.length}대 품목군 점유율</p>
              </div>
              <button
                onClick={onNavigateToMaterials}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                9대 품목군 전체 →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {jajaeGroups.slice(0, 6).map((c) => (
                <div key={c.groupName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {c.groupName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {c.mainSuppliers.split(",")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(c.totalAmount)}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                        {c.share}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(c.share * 1.8, 100)}%`, backgroundColor: c.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>자재매입 시트 기준</span>
            <span className="font-bold text-slate-900 dark:text-white">합계 {formatAmount(ledgerPurchases)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
