import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
  Sparkles
} from "lucide-react";
import { MASTER_PURCHASE_CATEGORIES, MASTER_PURCHASE_SUMMARY, MASTER_PURCHASE_ITEMS } from "../data/masterPurchaseData";
import { useCurrency } from "../context/CurrencyContext";

export const PurchaseExpenseView = ({
  transactions = [],
  onEdit,
  onDelete,
  onOpenNewModal,
  onOpenExcelModal
}) => {
  const { formatAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Use passed transactions or fallback to master items
  const displayItems = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    return expenses.length > 0 ? expenses : MASTER_PURCHASE_ITEMS;
  }, [transactions]);

  // Filter items
  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      const matchesSearch =
        (item.client && item.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.memo && item.memo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [displayItems, searchTerm, selectedCategory]);

  const totalFilteredAmount = filteredItems.reduce((acc, cur) => acc + (cur.amount || 0), 0);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["일자", "계정과목", "매입업체명(거래처)", "품목(적요)", "공급가액(원)", "결제수단", "메모"];
    const rows = filteredItems.map((item) => [
      item.date || "2026-07-31",
      `"${item.category}"`,
      `"${(item.client || "").replace(/"/g, '""')}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.amount || 0,
      `"${item.paymentMethod || "세금계산서"}"`,
      `"${(item.memo || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `2026년07월_계정과목별_매입내역_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>12개 표준 계정과목 / 125개 매입처 집계</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              계정과목별 매입 · 제조원가 관리
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              원자재, 외주 임가공비, 부자재, 전력비, 물류비 등 실제 회사 지출 결산 명세표
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExcelModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>엑셀 일괄 업로드</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">총 매입·비용 합계</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(MASTER_PURCHASE_SUMMARY.totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">총 125건 매입 거래처 정산</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">1위: 원자재 매입</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              ₩1,848,089,555
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
              전체 비용의 60.34% 차지
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2위: 외주 임가공비</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              ₩966,480,256
            </p>
            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-1">
              전체 비용의 31.55% 차지
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3위~5위 제조경비</span>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              부자재(0.85억) + 전력비(0.80억)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">물류비 2,442만 원</p>
          </div>
        </div>
      </div>

      {/* 12 Category Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>12개 계정과목별 집계 및 점유율</span>
          </h3>
          <span className="text-xs text-slate-400">카드를 클릭하면 해당 계정과목만 필터링됩니다.</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MASTER_PURCHASE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <div
                key={cat.category}
                onClick={() => {
                  setSelectedCategory(isSelected ? "all" : cat.category);
                  setCurrentPage(1);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-rose-50 dark:bg-rose-950/50 border-rose-500 shadow-md ring-2 ring-rose-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {cat.category}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {cat.share}%
                  </span>
                </div>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
                  {formatAmount(cat.totalAmount)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{cat.count}건</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="매입업체명, 품목, 메모 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">전체 계정과목 (125건)</option>
            {MASTER_PURCHASE_CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count}건)
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>매입 등록</span>
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">계정과목</th>
                <th className="py-3 px-4 font-bold">매입업체명 (거래처)</th>
                <th className="py-3 px-4 font-bold">품목 / 적요</th>
                <th className="py-3 px-4 font-bold text-right">공급가액</th>
                <th className="py-3 px-4 font-bold text-center">결제수단</th>
                <th className="py-3 px-4 font-bold">메모</th>
                <th className="py-3 px-4 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    검색 조건에 일치하는 매입 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.client}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-700 dark:text-slate-300">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                      {formatAmount(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                      {item.paymentMethod || "세금계산서"}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">
                      {item.memo || "-"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            전체 <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong>건 중{" "}
            {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)}건 표시
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
