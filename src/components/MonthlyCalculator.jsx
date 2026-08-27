import React, { useState, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const CATEGORIES = {
  revenue: ["제품 판매", "구독 서비스", "컨설팅/용역", "유지보수", "기타수익"],
  expense: ["인건비", "사무실/임대료", "서버/클라우드", "마케팅/광고", "소프트웨어/구독", "통신/공과금", "외주비", "기타비용"],
};

export const MonthlyCalculator = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const { formatAmount, currency } = useCurrency();

  // Current selected Year-Month (defaults to current YYYY-MM)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Quick Inline Add State
  const [quickType, setQuickType] = useState("revenue");
  const [quickCategory, setQuickCategory] = useState(CATEGORIES.revenue[0]);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDay, setQuickDay] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const currentYM = `${year}-${String(month).padStart(2, "0")}`;

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Filter transactions for this selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(currentYM));
  }, [transactions, currentYM]);

  // Previous month data for MoM comparison
  const prevYM = useMemo(() => {
    const d = new Date(year, month - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [year, month]);

  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(prevYM));
  }, [transactions, prevYM]);

  // Calculations for current month
  const currentStats = useMemo(() => {
    let revenue = 0;
    let expense = 0;
    const catBreakdown = { revenue: {}, expense: {} };

    monthlyTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const cat = t.category || "기타";
      if (t.type === "revenue") {
        revenue += amt;
        catBreakdown.revenue[cat] = (catBreakdown.revenue[cat] || 0) + amt;
      } else {
        expense += amt;
        catBreakdown.expense[cat] = (catBreakdown.expense[cat] || 0) + amt;
      }
    });

    const netProfit = revenue - expense;
    const marginPercent = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    return { revenue, expense, netProfit, marginPercent, catBreakdown };
  }, [monthlyTransactions]);

  // Calculations for prev month
  const prevStats = useMemo(() => {
    let revenue = 0;
    let expense = 0;
    prevMonthTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "revenue") revenue += amt;
      else expense += amt;
    });
    return { revenue, expense, netProfit: revenue - expense };
  }, [prevMonthTransactions]);

  // MoM growth
  const revenueGrowth = prevStats.revenue > 0
    ? (((currentStats.revenue - prevStats.revenue) / prevStats.revenue) * 100).toFixed(1)
    : null;

  const netGrowth = prevStats.netProfit !== 0
    ? (((currentStats.netProfit - prevStats.netProfit) / Math.abs(prevStats.netProfit)) * 100).toFixed(1)
    : null;

  // Handle Quick Add
  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickAmount) {
      alert("항목명과 금액을 입력해 주세요.");
      return;
    }

    const dayStr = String(Math.min(Math.max(quickDay, 1), 31)).padStart(2, "0");
    const dateStr = `${currentYM}-${dayStr}`;

    onAddTransaction({
      type: quickType,
      category: quickCategory,
      title: quickTitle.trim(),
      amount: Number(quickAmount),
      date: dateStr,
      client: quickType === "revenue" ? "매출고객" : "거래처/지출처",
      paymentMethod: "계좌이체",
      status: "완료",
      memo: `${year}년 ${month}월 간편등록`
    });

    setQuickTitle("");
    setQuickAmount("");
  };

  // Copy Recurring Expenses from Previous Month
  const handleCopyPrevExpenses = () => {
    const prevExpenses = prevMonthTransactions.filter((t) => t.type === "expense");
    if (prevExpenses.length === 0) {
      alert("이전 달에 등록된 지출 항목이 없습니다.");
      return;
    }

    if (
      window.confirm(
        `이전 달(${prevYM})의 지출 내역 ${prevExpenses.length}건을 이번 달(${currentYM})로 자동 복사하시겠습니까?`
      )
    ) {
      prevExpenses.forEach((item) => {
        const prevDay = item.date ? item.date.split("-")[2] : "01";
        onAddTransaction({
          ...item,
          id: undefined,
          date: `${currentYM}-${prevDay}`,
          memo: `[${prevYM} 이월 복사] ${item.memo || ""}`.trim()
        });
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Month Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[170px]">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {year}년 {month}월
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              월간 결산 & 손익 계산서
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleCurrentMonth}
            className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            이번 달 보기
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyPrevExpenses}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            title="지난 달 고정비/지출 내역을 이번 달로 원클릭 복사"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-500" />
            <span>지난달 고정비 복사</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>월간 리포트 인쇄</span>
          </button>
        </div>
      </div>

      {/* 4 Key Monthly Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 당월 총 매출 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">당월 총 수익 (Revenue)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            +{formatAmount(currentStats.revenue)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            전월: {formatAmount(prevStats.revenue)}{" "}
            {revenueGrowth && (
              <span className={`font-semibold ml-1 ${Number(revenueGrowth) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                ({Number(revenueGrowth) >= 0 ? "+" : ""}{revenueGrowth}%)
              </span>
            )}
          </p>
        </div>

        {/* 2. 당월 총 지출 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">당월 총 지출 (Expenses)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{formatAmount(currentStats.expense)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            전월: {formatAmount(prevStats.expense)}
          </p>
        </div>

        {/* 3. 당월 순손익 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">당월 순손익 (Net Profit)</span>
            <div className={`p-2 rounded-xl font-bold text-xs ${
              currentStats.netProfit >= 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            }`}>
              {currentStats.netProfit >= 0 ? "흑자" : "적자"}
            </div>
          </div>
          <h3 className={`text-2xl font-black mt-2 ${
            currentStats.netProfit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}>
            {currentStats.netProfit >= 0 ? "+" : ""}{formatAmount(currentStats.netProfit)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            전월 대비:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatAmount(currentStats.netProfit - prevStats.netProfit)}
            </span>
          </p>
        </div>

        {/* 4. 순이익률 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">순이익률 (Profit Margin)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {currentStats.marginPercent}%
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            총 등록 건수: <span className="font-semibold text-slate-700 dark:text-slate-300">{monthlyTransactions.length}건</span>
          </p>
        </div>
      </div>

      {/* Quick Fast-Add Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-200/80 dark:border-blue-800/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {month}월 손익 내역 1초 빠른 등록
          </h4>
          <span className="text-xs text-slate-400">(입력 즉시 당월 계산서에 자동 합산됩니다)</span>
        </div>

        <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Type */}
          <div className="sm:col-span-2">
            <select
              value={quickType}
              onChange={(e) => {
                const t = e.target.value;
                setQuickType(t);
                setQuickCategory(CATEGORIES[t][0]);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                quickType === "revenue"
                  ? "bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                  : "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300"
              }`}
            >
              <option value="revenue">➕ 수익 (입금)</option>
              <option value="expense">➖ 지출 (출금)</option>
            </select>
          </div>

          {/* Category */}
          <div className="sm:col-span-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {CATEGORIES[quickType].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="sm:col-span-3">
            <input
              type="text"
              required
              placeholder="항목명 (예: 8월 서버비, 컨설팅비)"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Amount */}
          <div className="sm:col-span-3">
            <input
              type="number"
              required
              min="0"
              placeholder="금액 (원화 기준)"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Day */}
          <div className="sm:col-span-1">
            <input
              type="number"
              min="1"
              max="31"
              value={quickDay}
              onChange={(e) => setQuickDay(Number(e.target.value))}
              title="발생 일자"
              className="w-full px-2 py-2 text-center rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              + 추가
            </button>
          </div>
        </form>
      </div>

      {/* Main Monthly Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Summary by Category (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revenue Categories */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>📈 수익 카테고리별 합계</span>
              <span className="text-blue-600 dark:text-blue-400 text-xs">
                {formatAmount(currentStats.revenue)}
              </span>
            </h4>
            <div className="space-y-2 text-xs">
              {Object.keys(currentStats.catBreakdown.revenue).length === 0 ? (
                <p className="text-slate-400 italic py-2">등록된 수익 항목이 없습니다.</p>
              ) : (
                Object.entries(currentStats.catBreakdown.revenue).map(([cat, amt]) => {
                  const pct = currentStats.revenue > 0 ? ((amt / currentStats.revenue) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                        <span>{cat}</span>
                        <span className="font-bold">{formatAmount(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>📉 지출 카테고리별 합계</span>
              <span className="text-rose-600 dark:text-rose-400 text-xs">
                {formatAmount(currentStats.expense)}
              </span>
            </h4>
            <div className="space-y-2 text-xs">
              {Object.keys(currentStats.catBreakdown.expense).length === 0 ? (
                <p className="text-slate-400 italic py-2">등록된 지출 항목이 없습니다.</p>
              ) : (
                Object.entries(currentStats.catBreakdown.expense).map(([cat, amt]) => {
                  const pct = currentStats.expense > 0 ? ((amt / currentStats.expense) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                        <span>{cat}</span>
                        <span className="font-bold">{formatAmount(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed List for Selected Month (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {month}월 등록 상세 내역 ({monthlyTransactions.length}건)
                </h4>
                <p className="text-xs text-slate-400">발생 일자별 정렬 내역</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto">
              {monthlyTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">{year}년 {month}월에 등록된 손익 데이터가 없습니다.</p>
                  <p className="text-[11px] text-slate-500">상단의 빠른 등록 바를 통해 항목을 추가해 보세요!</p>
                </div>
              ) : (
                monthlyTransactions
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((t) => {
                    const isRev = t.type === "revenue";
                    return (
                      <div key={t.id} className="py-3 flex items-center justify-between text-xs group">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 font-semibold w-6 text-center">
                            {t.date ? t.date.split("-")[2] : ""}일
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isRev
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                            }`}
                          >
                            {isRev ? "수익" : "지출"}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {t.title}
                            </p>
                            <p className="text-slate-400">
                              {t.category} • {t.client || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold text-sm ${
                              isRev
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isRev ? "+" : "-"} {formatAmount(t.amount)}
                          </span>

                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
