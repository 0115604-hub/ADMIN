import React, { useState, useEffect } from "react";
import {
  Calculator,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  TrendingUp,
  Building2,
  DollarSign,
  Layers,
  Factory,
  Zap,
  Truck,
  Users,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import detailedClosingMaster from "../data/detailedClosingLedgerData.json";

const STORAGE_KEY = "itemized_closing_ledger_data_v2";

const GROUPS = [
  { id: "all", label: "전체 16개 과목" },
  { id: "제조 직접 원가", label: "🏭 제조 직접 원가 (4)" },
  { id: "인건비 & 공과금", label: "👥 인건비 & 공과금 (3)" },
  { id: "공장 유틸리티 & 설비", label: "⚡ 유틸리티 & 설비 (5)" },
  { id: "물류 & 운영 경비", label: "🚚 물류 & 운영경비 (4)" }
];

export const ClosingLedgerView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();

  // Store containing month-keyed itemized categories
  const [closingStore, setClosingStore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return detailedClosingMaster;
  });

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Get active month's categories
  const activeMonthData = closingStore[selectedMonth] || detailedClosingMaster["2026-07"];
  const [categories, setCategories] = useState(activeMonthData.categories || []);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Sync state when month or closingStore changes
  useEffect(() => {
    const monthData = closingStore[selectedMonth] || detailedClosingMaster[selectedMonth] || detailedClosingMaster["2026-07"];
    setCategories(monthData.categories || []);
    setSaveSuccess(false);
  }, [selectedMonth, closingStore]);

  // Total calculation across all 16 categories
  const totalSupplyAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.supplyAmt) || 0), 0);
  }, 0);

  const totalTaxAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.taxAmt) || 0), 0);
  }, 0);

  const totalClosingAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))) || 0), 0);
  }, 0);

  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Toggle Collapse
  const toggleCollapse = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Update item field
  const handleItemChange = (catId, itemId, field, value) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;

        const updatedItems = cat.items.map((item) => {
          if (item.id !== itemId) return item;

          if (field === "supplyAmt") {
            const supply = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
            // Auto calculate tax 10% if tax was 0 or linked
            const tax = item.taxAmt > 0 ? Math.round(supply * 0.1) : 0;
            return {
              ...item,
              supplyAmt: supply,
              taxAmt: tax,
              totalAmt: supply + tax
            };
          } else if (field === "taxAmt") {
            const tax = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
            return {
              ...item,
              taxAmt: tax,
              totalAmt: Number(item.supplyAmt || 0) + tax
            };
          } else {
            return {
              ...item,
              [field]: value
            };
          }
        });

        return {
          ...cat,
          items: updatedItems
        };
      })
    );
  };

  // Add new item under category
  const handleAddItem = (catId) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;
        const newItem = {
          id: Date.now(),
          vendor: "",
          item: "",
          supplyAmt: 0,
          taxAmt: 0,
          totalAmt: 0,
          memo: ""
        };
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      })
    );

    // Expand category if collapsed
    if (collapsedCategories[catId]) {
      toggleCollapse(catId);
    }
  };

  // Delete item under category
  const handleDeleteItem = (catId, itemId) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.filter((it) => it.id !== itemId)
        };
      })
    );
  };

  // Save to persistent storage
  const handleSave = () => {
    const updatedStore = {
      ...closingStore,
      [selectedMonth]: {
        month: selectedMonth,
        categories: categories
      }
    };
    setClosingStore(updatedStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to original Excel ledger
  const handleReset = () => {
    if (!window.confirm(`${monthTitle} 세부 결산 데이터를 원본 엑셀 장부 기준으로 복원하시겠습니까?`)) return;
    const defaultData = detailedClosingMaster[selectedMonth] || detailedClosingMaster["2026-07"];
    setCategories(defaultData.categories || []);
    const updatedStore = {
      ...closingStore,
      [selectedMonth]: defaultData
    };
    setClosingStore(updatedStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
  };

  // Filter categories by selected group & search term
  const filteredCategories = categories.filter((cat) => {
    const matchGroup = selectedGroup === "all" || cat.group === selectedGroup;
    if (!matchGroup) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const matchCatName = cat.name.toLowerCase().includes(term);
    const matchItems = cat.items.some(
      (it) =>
        it.vendor.toLowerCase().includes(term) ||
        it.item.toLowerCase().includes(term) ||
        (it.memo && it.memo.toLowerCase().includes(term))
    );
    return matchCatName || matchItems;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>{monthTitle} 16대 계정과목 세부 결산 관리</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {monthTitle} 결산 세부 계정과목 입력 & 관리
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              엑셀 결산 시트와 동일하게 각 계정과목별 거래처명, 품목, 공급가액, 세액, 메모를 항목별로 직접 입력·추가·수정합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>엑셀 원본 복원</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>세부 결산 저장</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{monthTitle} 세부 항목별 결산 수치가 안전하게 저장되었습니다!</span>
        </div>
      )}

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Closing Cost */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{monthTitle} 총 결산 지출(매입)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(totalClosingAmount)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              공급가: {formatAmount(totalSupplyAmount)} + 세액: {formatAmount(totalTaxAmount)}
            </p>
          </div>
        </div>

        {/* Cost Ratio to Sales */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">매출 대비 결산 원가 비율</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {costRatio}%
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {monthTitle} 총 매출 {formatAmount(totalSales)} 기준
            </p>
          </div>
        </div>

        {/* Estimated Net Operating Profit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">결산 반영 예상 손익</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${netEstimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
              {netEstimatedProfit >= 0 ? "+" : ""}{formatAmount(netEstimatedProfit)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              매출액 - 결산 합계 차액
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Group Filter Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 w-full md:w-auto">
          {GROUPS.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroup(grp.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedGroup === grp.id
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="거래처명, 품목, 메모 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 16 Category Itemized Tables */}
      <div className="space-y-6">
        {filteredCategories.map((cat) => {
          const isCollapsed = !!collapsedCategories[cat.id];
          const catSupplyTotal = cat.items.reduce((s, it) => s + (Number(it.supplyAmt) || 0), 0);
          const catTaxTotal = cat.items.reduce((s, it) => s + (Number(it.taxAmt) || 0), 0);
          const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
          const catShare = totalClosingAmount > 0 ? ((catTotal / totalClosingAmount) * 100).toFixed(2) : 0;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              {/* Category Header Bar */}
              <div
                onClick={() => toggleCollapse(cat.id)}
                className="p-5 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors border-b border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-xs font-bold text-slate-400">({cat.group})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      세부 항목 {cat.items.length}건 • 점유율 <strong className="text-blue-600 dark:text-blue-400">{catShare}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">합계금액</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatAmount(catTotal)}
                    </span>
                  </div>

                  <div className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Itemized Table (Expandable) */}
              {!isCollapsed && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 font-black">
                          <th className="py-2.5 px-3 w-12 text-center">NO</th>
                          <th className="py-2.5 px-3 w-48">거래처명 / 업체명</th>
                          <th className="py-2.5 px-3 w-56">품목 및 세부내용</th>
                          <th className="py-2.5 px-3 w-36 text-right">공급가액 (원)</th>
                          <th className="py-2.5 px-3 w-28 text-right">세액 (원)</th>
                          <th className="py-2.5 px-3 w-36 text-right">합계금액 (원)</th>
                          <th className="py-2.5 px-3 w-32">비고 / 메모</th>
                          <th className="py-2.5 px-3 w-12 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cat.items.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              등록된 세부 항목이 없습니다. [➕ 항목 추가] 버튼을 눌러 새 항목을 등록해 보세요!
                            </td>
                          </tr>
                        ) : (
                          cat.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="거래처명 입력..."
                                  value={item.vendor || ""}
                                  onChange={(e) => handleItemChange(cat.id, item.id, "vendor", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="품목/규격/적요..."
                                  value={item.item || ""}
                                  onChange={(e) => handleItemChange(cat.id, item.id, "item", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={Number(item.supplyAmt || 0).toLocaleString()}
                                  onChange={(e) => handleItemChange(cat.id, item.id, "supplyAmt", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={Number(item.taxAmt || 0).toLocaleString()}
                                  onChange={(e) => handleItemChange(cat.id, item.id, "taxAmt", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                {formatAmount(Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))))}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="메모..."
                                  value={item.memo || ""}
                                  onChange={(e) => handleItemChange(cat.id, item.id, "memo", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteItem(cat.id, item.id)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                  title="항목 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {/* Subtotal Row */}
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                          <td colSpan={3} className="py-3 px-4 text-center">
                            {cat.name} 소계 ({cat.items.length}개 항목)
                          </td>
                          <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400">
                            {formatAmount(catSupplyTotal)}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {formatAmount(catTaxTotal)}
                          </td>
                          <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 text-sm">
                            {formatAmount(catTotal)}
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-right text-slate-400 text-[11px]">
                            전체 대비 {catShare}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Add Row Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => handleAddItem(cat.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>[{cat.name}] 세부 항목 추가</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      수치 변경 시 상단 총액과 원가율이 실시간 자동 연동됩니다.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5" />
          <span>{monthTitle} 세부 결산 저장</span>
        </button>
      </div>
    </div>
  );
};
