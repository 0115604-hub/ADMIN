import React, { useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Download,
  ChevronRight,
  ArrowLeft,
  Layers,
  Sparkles,
  Building2,
  TrendingDown,
  Filter,
  CheckCircle2
} from "lucide-react";
import { MASTER_JAJAE_GROUPS, MASTER_JAJAE_SUMMARY } from "../data/masterJajaeData";
import { useCurrency } from "../context/CurrencyContext";

export const MaterialPurchaseView = () => {
  const { formatAmount } = useCurrency();
  const [selectedGroup, setSelectedGroup] = useState(null); // null = 요약본, string = 선택된 품목군
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  // Current active group object
  const activeGroup = useMemo(() => {
    if (!selectedGroup) return null;
    return MASTER_JAJAE_GROUPS.find((g) => g.groupName === selectedGroup) || null;
  }, [selectedGroup]);

  // Unique suppliers in active group
  const groupSuppliers = useMemo(() => {
    if (!activeGroup) return [];
    const set = new Set();
    activeGroup.items.forEach((i) => {
      if (i.supplier && i.supplier !== "-") set.add(i.supplier);
    });
    return Array.from(set);
  }, [activeGroup]);

  // Filtered detailed items
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

  // Export to CSV
  const handleExportCSV = () => {
    const itemsToExport = activeGroup ? filteredDetailItems : MASTER_JAJAE_GROUPS.flatMap((g) => g.items);
    const filename = activeGroup
      ? `자재매입_${activeGroup.groupName}_${new Date().toISOString().split("T")[0]}.csv`
      : `자재매입_전체품목군_${new Date().toISOString().split("T")[0]}.csv`;

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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>`자재매입` 시트 마스터 기준 (총 142종 / 18.19억)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>자재매입 품목군별 분석</span>
              {activeGroup && (
                <span className="text-base font-bold px-3 py-1 rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {activeGroup.groupName}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              {activeGroup
                ? `${activeGroup.groupName}의 세부 자재 품목(${activeGroup.itemCount}종)별 단가, 구매량, 금액 상세 내역입니다.`
                : "품목군별 요약본입니다. 원하는 품목군을 클릭하시면 142개 세부 부품/원자재 내역이 열립니다."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeGroup && (
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSearchTerm("");
                  setSupplierFilter("all");
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>요약본 전체보기</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{activeGroup ? "현재 품목군 CSV 저장" : "전체 자재 CSV 다운로드"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">총 자재매입액</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatAmount(MASTER_JAJAE_SUMMARY.totalAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">9개 품목군 / 142개 자재</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">1위 품목군 (TPE)</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              ₩867,712,243
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
              전체의 47.70% (33종)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2위 품목군 (EPDM)</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              ₩533,929,310
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              전체의 29.35% (16종)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3위 (9BQC 전용자재)</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              ₩214,828,924
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              D/V BAR, 아마쉘 패드 등 10종
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUMMARY VIEW (요약본: 품목군 미선택 시) */}
      {/* ========================================================================= */}
      {!selectedGroup && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-500" />
              <span>9대 자재 품목군 요약본 (클릭하여 세부내역 조회)</span>
            </h3>
            <span className="text-xs text-slate-400">품목군 카드를 클릭하면 세부 부품 명세가 열립니다.</span>
          </div>

          {/* 9 Product Groups Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MASTER_JAJAE_GROUPS.map((g) => (
              <div
                key={g.groupName}
                onClick={() => setSelectedGroup(g.groupName)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
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

                  {/* Amount & Progress */}
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

                  {/* Suppliers Info */}
                  <p className="text-xs text-slate-400 mt-3 truncate">
                    주요 공급처: <strong className="text-slate-600 dark:text-slate-300">{g.mainSuppliers}</strong>
                  </p>
                </div>

                {/* Card Footer Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>세부 품목 {g.itemCount}종 명세 보기</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Master Summary Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                품목군별 집계 대사표
              </h4>
              <span className="text-xs text-slate-400">총 142종 / ₩1,819,295,168</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">순위</th>
                    <th className="py-3 px-4">대분류 품목군</th>
                    <th className="py-3 px-4">세부 품목수</th>
                    <th className="py-3 px-4">주요 공급사</th>
                    <th className="py-3 px-4 text-right">7월 매입금액</th>
                    <th className="py-3 px-4 text-right">점유 비중</th>
                    <th className="py-3 px-4 text-center">조회</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MASTER_JAJAE_GROUPS.map((g) => (
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

      {/* ========================================================================= */}
      {/* 2. DETAILED DRILLDOWN VIEW (세부내역: 품목군 선택 시) */}
      {/* ========================================================================= */}
      {selectedGroup && activeGroup && (
        <div className="space-y-4 animate-fadeIn">
          {/* Back Navigation Bar */}
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

            {/* Search and Supplier Filters */}
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

          {/* Detailed Items Table */}
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
                    <th className="py-3 px-4 text-right">7월 구매량</th>
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
