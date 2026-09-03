import React, { useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Download,
  ChevronRight,
  ArrowLeft,
  Filter,
  Layers,
  Building2,
  DollarSign,
  Package,
  TrendingUp,
  Tag,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

export const MaterialPurchaseView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const jajaeGroups = currentMonthData?.jajaeGroups || [];
  const jajaeSummary = currentMonthData?.jajaeSummary || {
    totalAmount: 0,
    itemCount: 0,
    groupCount: 0
  };

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Active group
  const activeGroup = useMemo(() => {
    if (!selectedGroup) return null;
    return jajaeGroups.find((g) => g.groupName === selectedGroup) || null;
  }, [jajaeGroups, selectedGroup]);

  // Unique suppliers of active group with count and sum
  const groupSupplierStats = useMemo(() => {
    if (!activeGroup || !Array.isArray(activeGroup.items)) return [];
    const map = {};
    activeGroup.items.forEach((i) => {
      const s = (i.supplier && i.supplier !== "-") ? i.supplier : "자체/기타";
      if (!map[s]) {
        map[s] = { name: s, count: 0, totalAmount: 0 };
      }
      map[s].count++;
      map[s].totalAmount += (i.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [activeGroup]);

  // Filtered detail items
  const filteredDetailItems = useMemo(() => {
    if (!activeGroup || !Array.isArray(activeGroup.items)) return [];
    return activeGroup.items.filter((item) => {
      if (!item) return false;
      const matchSearch =
        (item.partName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.usage || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.memo || "").toLowerCase().includes(searchTerm.toLowerCase());

      const itemSupplier = (item.supplier && item.supplier !== "-") ? item.supplier : "자체/기타";
      const matchSupplier =
        supplierFilter === "all" || itemSupplier === supplierFilter;

      return matchSearch && matchSupplier;
    });
  }, [activeGroup, searchTerm, supplierFilter]);

  const filteredDetailTotal = useMemo(() => {
    return filteredDetailItems.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [filteredDetailItems]);

  const filteredDetailQty = useMemo(() => {
    return filteredDetailItems.reduce((acc, cur) => acc + (cur.qty || 0), 0);
  }, [filteredDetailItems]);

  // Export CSV
  const handleExportCSV = () => {
    const itemsToExport = activeGroup ? filteredDetailItems : jajaeGroups.flatMap((g) => g.items);
    const filename = activeGroup
      ? `${selectedMonth}_자재매입_${activeGroup.groupName}.csv`
      : `${selectedMonth}_자재매입_전체품목군.csv`;

    const headers = ["대분류 품목군", "자재코드", "품명 및 규격", "단위", "차종/용도", "구매처(공급사)", "단가(원)", "구매량", "공급가액(원)", "메모"];
    const rows = itemsToExport.map((i) => [
      `"${activeGroup ? activeGroup.groupName : i.mainCategory}"`,
      `"${i.code}"`,
      `"${(i.partName || "").replace(/"/g, '""')}"`,
      `"${i.unit || "EA"}"`,
      `"${i.usage || "-"}"`,
      `"${i.supplier || "-"}"`,
      i.unitPrice || 0,
      i.qty || 0,
      i.amount || 0,
      `"${(i.memo || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. SUMMARY VIEW (품목군 목록 요약) */}
      {/* ========================================================================= */}
      {!selectedGroup && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{monthTitle} 자재매입 품목군 분석 현황</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  총 <strong className="text-slate-700 dark:text-slate-200">{jajaeGroups.length}개</strong> 품목군 •{" "}
                  <strong className="text-slate-700 dark:text-slate-200">{jajaeSummary.itemCount}종</strong> 세부 자재 •{" "}
                  총 매입액 <strong className="text-indigo-600 dark:text-indigo-400">{formatAmount(jajaeSummary.totalAmount)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black shadow-xs transition-all shrink-0 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀(CSV) 다운로드</span>
              </button>
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {jajaeGroups.map((g) => (
              <div
                key={g.groupName}
                onClick={() => setSelectedGroup(g.groupName)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {g.rank}
                      </span>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {g.groupName}
                      </h4>
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                      {g.share}%
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatAmount(g.totalAmount)}
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(g.share * 2, 100)}%`, backgroundColor: g.color || "#4F46E5" }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 truncate">
                    주요 구매처: <strong className="text-slate-700 dark:text-slate-300">{g.mainSuppliers}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
                  <span>세부 품목 {g.itemCount}종 명세 보기</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Group Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mt-4">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                {monthTitle} 품목군별 종합 집계표
              </h4>
              <span className="text-xs text-slate-500 font-bold">
                총 {jajaeSummary.itemCount}종 / {formatAmount(jajaeSummary.totalAmount)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">순위</th>
                    <th className="py-2.5 px-4">대분류 품목군</th>
                    <th className="py-2.5 px-4 text-center">품목수</th>
                    <th className="py-2.5 px-4">주요 공급사</th>
                    <th className="py-2.5 px-4 text-right">매입금액</th>
                    <th className="py-2.5 px-4 text-right">비중</th>
                    <th className="py-2.5 px-3 text-center">조회</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {jajaeGroups.map((g) => (
                    <tr
                      key={g.groupName}
                      onClick={() => setSelectedGroup(g.groupName)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">{g.rank}</td>
                      <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                        {g.groupName}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                        {g.itemCount}종
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-[11px]">
                        {g.mainSuppliers}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white font-mono">
                        {formatAmount(g.totalAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {g.share}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-700 dark:text-indigo-300 font-black text-[11px] transition-all"
                        >
                          상세보기 →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ⭐ [요청반영] 간략하고 명료하게 재디자인된 세부창 (DETAILED DRILLDOWN) */}
      {/* ========================================================================= */}
      {selectedGroup && activeGroup && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Top Control Bar & Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroup(null);
                    setSearchTerm("");
                    setSupplierFilter("all");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← 요약본 전체보기</span>
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] bg-indigo-600 text-white shadow-xs">
                      {activeGroup.rank}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                      {activeGroup.groupName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      점유율 {activeGroup.share}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="품명, 규격, 자재코드 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0"
                  title="현재 품목 엑셀 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* 4 Crisp KPI Stat Tiles (간략하고 명료한 핵심 지표) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  품목군 전체 매입액
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatAmount(activeGroup.totalAmount)}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  총 자재 품목수
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {activeGroup.itemCount}종
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
                  조회 대상 건수
                </span>
                <p className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                  {filteredDetailItems.length}건
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                  조회 합계 금액
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {formatAmount(filteredDetailTotal)}
                </p>
              </div>
            </div>

            {/* One-touch Quick Supplier Filter Chips */}
            {groupSupplierStats.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-bold shrink-0 mr-1 text-[11px]">구매처:</span>
                <button
                  type="button"
                  onClick={() => setSupplierFilter("all")}
                  className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all shrink-0 ${
                    supplierFilter === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  전체 ({activeGroup.itemCount})
                </button>

                {groupSupplierStats.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSupplierFilter(s.name)}
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all shrink-0 ${
                      supplierFilter === s.name
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {s.name} ({s.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* Main Clean Detail Table (간략하고 명료한 5개 핵심 열 구조) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredDetailItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>일치하는 세부 자재 품목이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-3 w-32 whitespace-nowrap">자재코드</th>
                      <th className="py-3 px-4 min-w-[240px]">품명 및 규격</th>
                      <th className="py-3 px-3 w-36 whitespace-nowrap">구매처 (공급사)</th>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">차종 / 용도</th>
                      <th className="py-3 px-3 w-36 text-right whitespace-nowrap">구매량 • 단가</th>
                      <th className="py-3 px-4 w-40 text-right whitespace-nowrap">공급가액 (원)</th>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredDetailItems.map((item, idx) => {
                      const shareInGroup = activeGroup.totalAmount > 0
                        ? ((item.amount / activeGroup.totalAmount) * 100).toFixed(1)
                        : 0;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                        >
                          {/* 1. 번호 */}
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* 2. 자재코드 */}
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap text-[11.5px]">
                            {item.code || "-"}
                          </td>

                          {/* 3. 품명 및 규격 */}
                          <td className="py-2.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-xs">
                                {item.partName}
                              </span>
                              {item.mainCategory && (
                                <span className="text-[10.5px] text-slate-400 mt-0.5">
                                  {item.mainCategory}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. 구매처 (공급사) */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              {item.supplier || "-"}
                            </span>
                          </td>

                          {/* 5. 차종 / 용도 */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[11.5px] font-bold text-indigo-700 dark:text-indigo-300">
                              {item.usage || "-"}
                            </span>
                          </td>

                          {/* 6. 구매량 • 단가 (간략 2줄 결합) */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11.5px]">
                                {item.qty > 0 ? item.qty.toLocaleString() : "-"} {item.unit || "EA"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @ {item.unitPrice > 0 ? `₩${item.unitPrice.toLocaleString()}` : "-"}
                              </span>
                            </div>
                          </td>

                          {/* 7. 공급가액 & 비중 */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs sm:text-sm">
                                {formatAmount(item.amount)}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-indigo-500 h-full rounded-full"
                                    style={{ width: `${Math.min(shareInGroup * 2, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9.5px] font-bold text-slate-400">{shareInGroup}%</span>
                              </div>
                            </div>
                          </td>

                          {/* 8. 비고 */}
                          <td className="py-2.5 px-3 text-slate-400 text-[10.5px] truncate max-w-[130px]">
                            {item.memo ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-medium">
                                {item.memo}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Table Footer Total Row */}
                  <tfoot className="bg-slate-50 dark:bg-slate-800/90 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-xs">
                    <tr>
                      <td colSpan="5" className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        합계 ({filteredDetailItems.length}개 품목)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {filteredDetailQty > 0 ? `${filteredDetailQty.toLocaleString()} EA` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm font-mono">
                        {formatAmount(filteredDetailTotal)}
                      </td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPurchaseView;
