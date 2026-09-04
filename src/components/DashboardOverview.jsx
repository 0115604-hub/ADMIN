import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Car,
  Boxes,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  ClipboardList,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { getWorkLogs, subscribeWorkLogs } from "../services/workLogService";

export const DashboardOverview = ({
  onNavigateToVehicles,
  onNavigateToMaterials,
  onNavigateToPurchases,
  onNavigateToWorkLogs
}) => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  const [selectedPlantFilter, setSelectedPlantFilter] = useState("all"); // 'all' | '삼랑진공장' | '한림공장'
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());

  // Real-time Cloud Sync for Work Logs on Admin Dashboard
  useEffect(() => {
    const unsubscribe = subscribeWorkLogs((logs) => {
      setWorkLogs(logs);
    });
    return () => unsubscribe();
  }, []);

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

  // Calculate MoM dynamically
  const getPrevMonthKey = (ym) => {
    if (!ym) return null;
    const [yearStr, monthStr] = ym.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10);
    if (isNaN(y) || isNaN(m)) return null;
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  };

  const prevMonthKey = getPrevMonthKey(selectedMonth);
  const prevMonthData = prevMonthKey ? allMonthlyData[prevMonthKey] : null;
  const salesMoM = prevMonthData && prevMonthData.salesSummary?.totalSales ? totalSales - (prevMonthData.salesSummary?.totalSales || 0) : null;
  const purchaseMoM = prevMonthData && prevMonthData.purchaseSummary?.ledgerBenchmark ? ledgerPurchases - (prevMonthData.purchaseSummary?.ledgerBenchmark || 0) : null;

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const filteredLogs = workLogs.filter((log) => {
    if (selectedPlantFilter === "all") return true;
    return log.plant === selectedPlantFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{monthTitle} 실적 종합</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {monthTitle} 현황
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              매출 {formatAmount(totalSales)} • 매입 {formatAmount(ledgerPurchases)} • 손익 {formatAmount(netProfit)} (이익률 {profitMargin}%)
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
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">품목 & 차종 구조</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {salesSummary.vehicleGroupCount || 23}개 차종
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              자재 {jajaeGroups.length}대 품목군 점유
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Vehicle Ranking & Material Purchase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Shipment Vehicle Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {monthTitle} 주요 출하 차종 현황 (Top 6)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">총 {vehicleSales.length}개 차종별 매출 실적</p>
              </div>
              <button
                onClick={onNavigateToVehicles}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                전체 차종 보기 →
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

      {/* ========================================================================= */}
      {/* 3. ADMIN DEDICATED: WORKER DAILY WORK LOGS EXECUTIVE SUMMARY (작업자 업무일지 요약) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  공장별 작업자 일일업무일지 종합 요약
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  삼랑진공장 및 한림공장 라인별 실시간 생산 실적 & 이슈 현황 (총 {workLogs.length}명 기록)
                </p>
              </div>
            </div>
          </div>

          {/* Plant Segmented Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
              <button
                onClick={() => setSelectedPlantFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedPlantFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                전체 ({workLogs.length})
              </button>
              <button
                onClick={() => setSelectedPlantFilter("삼랑진공장")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedPlantFilter === "삼랑진공장"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-900"
                }`}
              >
                🏭 삼랑진공장 (6명)
              </button>
              <button
                onClick={() => setSelectedPlantFilter("한림공장")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedPlantFilter === "한림공장"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
                }`}
              >
                🏭 한림공장 (3명)
              </button>
            </div>

            {onNavigateToWorkLogs && (
              <button
                onClick={onNavigateToWorkLogs}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                <span>일지 상세조회</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Worker Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log) => {
            const isHallim = log.plant === "한림공장";
            const isClean = !log.issues || log.issues.includes("특이사항 없음") || log.issues.includes("정상");

            return (
              <div
                key={log.id}
                className="p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Card Top: Worker Profile & Plant */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center font-black text-xs shadow-sm ${
                      isHallim ? "bg-emerald-600" : "bg-amber-500"
                    }`}>
                      {log.writer ? log.writer[0] : "작"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {log.writer} {log.title || ""}
                        </h4>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isHallim
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                        }`}>
                          {log.plant}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {log.line}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {log.date}
                  </span>
                </div>

                {/* Card Content: Work Details */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">🛠️ 작업 실적:</strong>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {log.workContent}
                    </p>
                  </div>

                  {log.issues && (
                    <div className={`p-2 rounded-xl text-[11px] font-medium flex items-start gap-1.5 ${
                      isClean
                        ? "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                    }`}>
                      {isClean ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <span><strong>이슈:</strong> {log.issues}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Shift & Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{log.shift} 근무</span>
                  </span>
                  <span className="font-semibold">{log.createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
