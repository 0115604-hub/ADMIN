import React, { useState, useMemo } from "react";
import {
  Car,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

export const VehicleSalesView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("all");
  const [expandedVehicle, setExpandedVehicle] = useState("9BQC");

  const vehicleSales = currentMonthData?.vehicleSales || [];
  const salesSummary = currentMonthData?.salesSummary || {
    totalSales: 0,
    totalQty: 0,
    itemCount: 0,
    vehicleGroupCount: 0
  };

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

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

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["순위", "차종/프로젝트", "구분", "아이템코드", "고객품번", "품명(P/NAME)", "판매단가", `${monthParts[1]}월출하수량`, "매출금액(원)", "비중(%)"];
    const rows = [];

    vehicleSales.forEach((v) => {
      v.details.forEach((d) => {
        rows.push([
          v.rank,
          `"${v.vehicleGroup}"`,
          `"${d.process}"`,
          `"${d.itemCode}"`,
          `"${d.partNumber}"`,
          `"${d.partName.replace(/"/g, '""')}"`,
          d.unitPrice,
          d.qty,
          d.amount,
          `${((d.amount / (salesSummary.totalSales || 1)) * 100).toFixed(2)}%`
        ]);
      });
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedMonth}_차종별_품목별_매출실적.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{monthTitle} 실적 마스터 기준</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {monthTitle} 차종별 · 품목별 매출 실적
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              총 {vehicleSales.length}개 차종 패밀리 및 {salesSummary.itemCount}개 세부 납품 부품의 단가, 출하수량, 매출액 집계
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 / CSV 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{monthTitle} 총 매출액</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatAmount(salesSummary.totalSales)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{salesSummary.itemCount}개 부품 출하</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">총 출하 수량</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {salesSummary.totalQty.toLocaleString()} <span className="text-sm font-normal text-slate-400">개</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{vehicleSales.length}개 차종군</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">매출 1위 차종</span>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
              {vehicleSales[0]?.vehicleGroup || "-"}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatAmount(vehicleSales[0]?.totalAmount || 0)} <span className="text-[11px] font-normal text-slate-400">({vehicleSales[0]?.share || 0}%)</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">매출 2위 차종</span>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
              {vehicleSales[1]?.vehicleGroup || "-"}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              {formatAmount(vehicleSales[1]?.totalAmount || 0)} <span className="text-[11px] font-normal text-slate-400">({vehicleSales[1]?.share || 0}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
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

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatAmount(v.totalAmount)}
                    </p>
                    <p className="text-[11px] text-slate-400 md:hidden">{v.share}%</p>
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
                        <th className="py-2.5 px-4 font-semibold">공정/구분</th>
                        <th className="py-2.5 px-4 font-semibold text-right">판매단가</th>
                        <th className="py-2.5 px-4 font-semibold text-right">출하수량</th>
                        <th className="py-2.5 px-4 font-semibold text-right">매출금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {v.details.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                        >
                          <td className="py-2.5 px-4 text-slate-500 font-mono">{item.itemCode || "-"}</td>
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {item.partNumber || "-"}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            {item.partName}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.process}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400">
                            {item.unitPrice > 0 ? `₩${item.unitPrice.toLocaleString()}` : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                            {item.qty.toLocaleString()} 개
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-blue-600 dark:text-blue-400">
                            {formatAmount(item.amount)}
                          </td>
                        </tr>
                      ))}
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
