import React, { useState, useMemo } from "react";
import {
  Car,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Sparkles
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

export const VehicleSalesView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData, allMonthlyData, availableMonths } = useMonth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("all");
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const vehicleSales = currentMonthData?.vehicleSales || [];
  const salesSummary = currentMonthData?.salesSummary || {
    totalSales: 0,
    totalQty: 0,
    itemCount: 0,
    vehicleGroupCount: 0
  };

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Find previous month data for MoM (+- %) comparison
  const currentIndex = availableMonths.indexOf(selectedMonth);
  const prevMonthKey = currentIndex >= 0 && currentIndex + 1 < availableMonths.length ? availableMonths[currentIndex + 1] : null;
  const prevMonthData = prevMonthKey ? allMonthlyData[prevMonthKey] : null;
  const prevMonthParts = prevMonthKey ? prevMonthKey.split("-") : [];
  const prevMonthTitle = prevMonthKey ? `${prevMonthParts[0]}년 ${prevMonthParts[1]}월` : "전월";

  // Total MoM calculation
  const totalSales = salesSummary.totalSales || 0;
  const prevTotalSales = prevMonthData?.salesSummary?.totalSales || 0;
  const totalSalesDiff = totalSales - prevTotalSales;
  const totalSalesMoMRate = prevTotalSales > 0 ? (((totalSales - prevTotalSales) / prevTotalSales) * 100).toFixed(1) : null;

  // Total Qty MoM calculation
  const totalQty = salesSummary.totalQty || 0;
  const prevTotalQty = prevMonthData?.salesSummary?.totalQty || 0;
  const totalQtyDiff = totalQty - prevTotalQty;
  const totalQtyMoMRate = prevTotalQty > 0 ? (((totalQty - prevTotalQty) / prevTotalQty) * 100).toFixed(1) : null;

  // Filter Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicleSales.filter((v) => {
      const matchSearch =
        v.vehicleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.details.some(
          (d) =>
            d.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchProcess =
        selectedProcess === "all" ||
        v.category.includes(selectedProcess) ||
        v.details.some((d) => d.process.includes(selectedProcess));

      return matchSearch && matchProcess;
    });
  }, [vehicleSales, searchTerm, selectedProcess]);

  const totalFilteredAmount = filteredVehicles.reduce((acc, cur) => acc + cur.totalAmount, 0);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 맨 상단: 총매출액 및 전월대비 매출증감액 (가독성 극대화 2분할 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 당월 총매출액 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {monthTitle} 총 매출액
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              차종 {vehicleSales.length}개군
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                {formatAmount(totalSales)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>전월 ({prevMonthTitle}) 실적:</span>
              <strong className="text-slate-600 dark:text-slate-300 font-mono">{formatAmount(prevTotalSales)}</strong>
            </p>
          </div>
        </div>

        {/* 2. 전월대비 매출 증감액 & 증감률 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                totalSalesDiff >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"
              }`}>
                {totalSalesDiff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                전월 대비 매출 증감액
              </span>
            </div>

            {totalSalesMoMRate !== null && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                Number(totalSalesMoMRate) >= 0
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
              }`}>
                {Number(totalSalesMoMRate) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Number(totalSalesMoMRate) >= 0 ? `+${totalSalesMoMRate}%` : `${totalSalesMoMRate}%`}</span>
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                totalSalesDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}>
                {totalSalesDiff >= 0 ? `+${formatAmount(totalSalesDiff)}` : `-${formatAmount(Math.abs(totalSalesDiff))}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>증감 상태:</span>
              <strong className={totalSalesDiff >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                {totalSalesDiff >= 0
                  ? `전월대비 ${formatAmount(totalSalesDiff)} 매출 신장 (+${totalSalesMoMRate}%)`
                  : `전월대비 ${formatAmount(Math.abs(totalSalesDiff))} 매출 감소 (${totalSalesMoMRate}%)`}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="차종명, 부품명(P/NAME), 품번, 아이템코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
          <span>
            조회 차종: <strong className="text-slate-900 dark:text-white">{filteredVehicles.length}</strong>개
          </span>
          <span>•</span>
          <span>
            선택 합계: <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatAmount(totalFilteredAmount)}</strong>
          </span>
        </div>
      </div>

      {/* Vehicle Groups Accordion Table */}
      <div className="space-y-3">
        {filteredVehicles.map((v) => {
          const isExpanded = expandedVehicle === v.vehicleGroup;

          // Find this vehicle in previous month
          const prevVehicle = prevMonthData?.vehicleSales?.find((pv) => pv.vehicleGroup === v.vehicleGroup);
          const prevAmt = prevVehicle?.totalAmount || 0;
          const vDiffAmt = v.totalAmount - prevAmt;
          const vMoMRate = prevAmt > 0 ? (((v.totalAmount - prevAmt) / prevAmt) * 100).toFixed(1) : (v.totalAmount > 0 ? "+100.0" : "0.0");

          return (
            <div
              key={v.vehicleGroup}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
            >
              {/* Vehicle Row Header */}
              <div
                onClick={() => setExpandedVehicle(isExpanded ? "" : v.vehicleGroup)}
                className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-colors ${
                  isExpanded ? "bg-slate-50/80 dark:bg-slate-800/50" : "hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    v.rank === 1
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      : v.rank === 2
                      ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                      : v.rank === 3
                      ? "bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {v.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {v.vehicleGroup}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                        {v.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      세부 품목 {v.itemCount}종 • 출하수량 {v.totalQty.toLocaleString()}개
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  {/* Share Progress Bar */}
                  <div className="hidden md:flex flex-col items-end gap-1 w-28">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      비중 {v.share}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(v.share * 2.5, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Amount & MoM Rate (+- %) */}
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatAmount(v.totalAmount)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 md:hidden">{v.share}% • </span>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black ${
                        Number(vMoMRate) > 0
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : Number(vMoMRate) < 0
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>
                        전월비 {Number(vMoMRate) > 0 ? `+${vMoMRate}%` : `${vMoMRate}%`}
                      </span>
                    </div>
                  </div>

                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sub-items Detailed Table (Drilldown) */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">아이템코드</th>
                        <th className="py-2.5 px-4 font-semibold">고객품번</th>
                        <th className="py-2.5 px-4 font-semibold">품명 (P/NAME)</th>
                        <th className="py-2.5 px-4 font-semibold text-center">공정구분</th>
                        <th className="py-2.5 px-4 font-semibold text-right">단가</th>
                        <th className="py-2.5 px-4 font-semibold text-right">출하수량</th>
                        <th className="py-2.5 px-4 font-semibold text-right">매출금액</th>
                        <th className="py-2.5 px-4 font-semibold text-right">비중</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {v.details.map((d, idx) => {
                        const itemShare = totalSales > 0 ? ((d.amount / totalSales) * 100).toFixed(2) : "0.00";
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {d.itemCode}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                              {d.partNumber}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                              {d.partName}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {d.process}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                              ₩{Number(d.unitPrice).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {Number(d.qty).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">
                              ₩{Number(d.amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                              {itemShare}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
