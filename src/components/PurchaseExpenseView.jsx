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
  Sparkles,
  Inbox,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

const CATEGORY_COLORS = {
  "원자재": "#EF4444",
  "임가공비": "#F97316",
  "부자재": "#EAB308",
  "포장 부자재": "#84CC16",
  "전력비": "#06B6D4",
  "물류비": "#3B82F6",
  "지급수수료": "#8B5CF6",
  "산업폐기물처리비": "#EC4899",
  "복리후생비": "#10B981",
  "소모품비": "#6366F1",
  "수선비": "#14B8A6",
  "기타잡비": "#64748B"
};

export const PurchaseExpenseView = ({
  transactions = [],
  onEdit,
  onDelete,
  onOpenNewModal,
  onOpenExcelModal,
  onClearAll
}) => {
  const { formatAmount } = useCurrency();
  const { selectedMonth } = useMonth();

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter expenses strictly by selectedMonth
  const displayItems = useMemo(() => {
    return transactions.filter(
      (t) => t.type === "expense" && (!t.date || t.date.startsWith(selectedMonth))
    );
  }, [transactions, selectedMonth]);

  // Compute dynamic category summary from displayItems of selectedMonth
  const dynamicCategories = useMemo(() => {
    const map = {};
    let total = 0;

    displayItems.forEach((it) => {
      const cat = it.category || "기타잡비";
      const amt = Number(it.amount) || 0;
      total += amt;
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          count: 0,
          totalAmount: 0,
          suppliers: new Set()
        };
      }
      map[cat].count++;
      map[cat].totalAmount += amt;
      if (it.client) map[cat].suppliers.add(it.client);
    });

    return Object.values(map)
      .map((c) => ({
        ...c,
        share: total > 0 ? ((c.totalAmount / total) * 100).toFixed(1) : 0,
        color: CATEGORY_COLORS[c.category] || "#3B82F6",
        mainSuppliers: Array.from(c.suppliers).slice(0, 3).join(", ")
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [displayItems]);

  // Filter items by category & search term
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

  const totalFilteredAmount = filteredItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  const totalExpenseSum = displayItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleClearAllConfirm = () => {
    if (window.confirm(`${monthTitle}의 등록된 매입 데이터를 모두 삭제하시겠습니까?`)) {
      if (onClearAll) onClearAll();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{monthTitle} 월별 매입 원장</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {monthTitle} 계정과목별 매입·지출 원장
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {monthTitle}에 발생한 실제 매입 및 지출 전표 내역을 계정과목별로 조회, 등록, 수정 및 관리합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {displayItems.length > 0 && (
              <button
                onClick={handleClearAllConfirm}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>{monthTitle} 내역 초기화</span>
              </button>
            )}
            <button
              onClick={onOpenExcelModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>엑셀 일괄 업로드</span>
            </button>
            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>새 매입 내역 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">{monthTitle} 총 매입·지출 합계</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatAmount(totalExpenseSum)}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            등록된 전표 {displayItems.length}건 합산
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">{monthTitle} 활성 계정과목 수</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {dynamicCategories.length}개 과목
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            매입 데이터 등록 과목 수
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">현재 필터 금액</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatAmount(totalFilteredAmount)}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            조회된 항목 {filteredItems.length}건
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="거래처명, 품목, 메모 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              전체 ({displayItems.length})
            </button>
            {dynamicCategories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => {
                  setSelectedCategory(cat.category);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat.category
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-black">
                <th className="py-3 px-3">일자</th>
                <th className="py-3 px-3">계정과목</th>
                <th className="py-3 px-3">거래처명</th>
                <th className="py-3 px-3">품목 / 적요</th>
                <th className="py-3 px-3 text-right">금액 (원)</th>
                <th className="py-3 px-3">메모 / 비고</th>
                <th className="py-3 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-bold">{monthTitle}에 등록된 매입·지출 데이터가 없습니다.</p>
                    <p className="text-[11px] text-slate-400">
                      상단의 [새 매입 내역 추가] 또는 [엑셀 일괄 업로드]를 통해 {monthTitle} 데이터를 등록하세요.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-500">
                      {item.date || "-"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {item.category || "미분류"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                      {item.client || item.title || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {item.title || item.item || "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                      {formatAmount(Number(item.amount) || 0)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {item.memo || "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="삭제"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              총 {filteredItems.length}건 중 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)}건 표시
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black px-3 py-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
