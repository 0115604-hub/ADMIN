import React, { useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Download,
  ChevronRight,
  ArrowLeft,
  Sparkles
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

  // Unique suppliers
  const groupSuppliers = useMemo(() => {
    if (!activeGroup) return [];
    const set = new Set();
    activeGroup.items.forEach((i) => {
      if (i.supplier && i.supplier !== "-") set.add(i.supplier);
    });
    return Array.from(set);
  }, [activeGroup]);

  // Filtered detail items
  const filteredDetailItems = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.filter((item) => {
      const matchSearch =
        item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.usage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.memo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSupplier =
        supplierFilter === "all" || item.supplier === supplierFilter;

      return matchSearch && matchSupplier;
    });
  }, [activeGroup, searchTerm, supplierFilter]);

  const filteredDetailTotal = filteredDetailItems.reduce((acc, cur) => acc + cur.amount, 0);

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
      `"${i.partName.replace(/"/g, '""')}"`,
      `"${i.unit}"`,
      `"${i.usage}"`,
      `"${i.supplier}"`,
      i.unitPrice,
      i.qty,
      i.amount,
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
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. SUMMARY VIEW */}
      {!selectedGroup && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <span>{monthTitle} 자재매입 품목군 요약본</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                총 {jajaeGroups.length}개 품목군 • {jajaeSummary.itemCount}종 자재 • 총 매입액 {formatAmount(jajaeSummary.totalAmount)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀/CSV 다운로드</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jajaeGroups.map((g) => (
              <div
                key={g.groupName}
                onClick={() => setSelectedGroup(g.groupName)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {g.rank}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {g.groupName}
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {g.share}%
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatAmount(g.totalAmount)}
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(g.share * 2, 100)}%`, backgroundColor: g.color }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 truncate">
                    주요 공급처: <strong className="text-slate-600 dark:text-slate-300">{g.mainSuppliers}</strong>
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>세부 품목 {g.itemCount}종 명세 보기</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {monthTitle} 품목군별 집계표
              </h4>
              <span className="text-xs text-slate-400">총 {jajaeSummary.itemCount}종 / {formatAmount(jajaeSummary.totalAmount)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">순위</th>
                    <th className="py-3 px-4">대분류 품목군</th>
                    <th className="py-3 px-4">세부 품목수</th>
                    <th className="py-3 px-4">주요 공급사</th>
                    <th className="py-3 px-4 text-right">{monthParts[1]}월 매입금액</th>
                    <th className="py-3 px-4 text-right">점유 비중</th>
                    <th className="py-3 px-4 text-center">조회</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jajaeGroups.map((g) => (
                    <tr
                      key={g.groupName}
                      onClick={() => setSelectedGroup(g.groupName)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-500">{g.rank}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white text-sm">
                        {g.groupName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {g.itemCount} 종
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {g.mainSuppliers}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                        {formatAmount(g.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {g.share}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100">
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

      {/* 2. DETAILED DRILLDOWN */}
      {selectedGroup && activeGroup && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSearchTerm("");
                  setSupplierFilter("all");
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                title="요약본으로 돌아가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">품목군 세부조회:</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeGroup.groupName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  총 {activeGroup.itemCount}종 • 공급가액 {formatAmount(activeGroup.totalAmount)} (비중 {activeGroup.share}%)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="품명, 규격, 자재코드, 구매처 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {groupSuppliers.length > 0 && (
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">전체 구매처 ({groupSuppliers.length}개사)</option>
                  {groupSuppliers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                조회 품목: <strong className="text-slate-900 dark:text-white">{filteredDetailItems.length}</strong>개
              </span>
              <span>
                합계: <strong className="text-indigo-600 dark:text-indigo-400 text-sm font-black">{formatAmount(filteredDetailTotal)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">자재코드</th>
                    <th className="py-3 px-4">품명 및 규격</th>
                    <th className="py-3 px-4 text-center">단위</th>
                    <th className="py-3 px-4">차종 / 용도</th>
                    <th className="py-3 px-4">구매처 (공급사)</th>
                    <th className="py-3 px-4 text-right">구매 단가</th>
                    <th className="py-3 px-4 text-right">구매량</th>
                    <th className="py-3 px-4 text-right">공급가액 (원)</th>
                    <th className="py-3 px-4">메모 / 비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDetailItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        검색 조건에 일치하는 세부 자재가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredDetailItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {item.code || "-"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {item.partName}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                          {item.unit || "EA"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {item.usage || "-"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.supplier || "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {item.unitPrice > 0 ? `₩${item.unitPrice.toLocaleString()}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.qty > 0 ? item.qty.toLocaleString() : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap text-sm">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[150px]">
                          {item.memo || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
