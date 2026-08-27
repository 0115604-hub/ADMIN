import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

export const PnLStatement = ({ transactions }) => {
  const { formatAmount } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Filter transactions by period
  const filtered = useMemo(() => {
    if (selectedPeriod === "all") return transactions;
    const now = new Date();
    if (selectedPeriod === "this-month") {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return transactions.filter((t) => t.date && t.date.startsWith(ym));
    }
    if (selectedPeriod === "this-year") {
      const year = `${now.getFullYear()}`;
      return transactions.filter((t) => t.date && t.date.startsWith(year));
    }
    return transactions;
  }, [transactions, selectedPeriod]);

  // Breakdowns
  const stats = useMemo(() => {
    let grossRevenue = 0;
    const revenueByCat = {};

    let costOfGoods = 0; // Direct costs (서버/인프라, 외주용역비, 제품원가)
    const cogsByCat = {};

    let sgaExpense = 0; // SG&A (인건비, 마케팅, 사무실/운영비, 소프트웨어 구독 등)
    const sgaByCat = {};

    filtered.forEach((item) => {
      const amt = Number(item.amount) || 0;
      const cat = item.category || "기타";

      if (item.type === "revenue") {
        grossRevenue += amt;
        revenueByCat[cat] = (revenueByCat[cat] || 0) + amt;
      } else {
        if (["서버/인프라", "외주용역비", "제품원가"].includes(cat)) {
          costOfGoods += amt;
          cogsByCat[cat] = (cogsByCat[cat] || 0) + amt;
        } else {
          sgaExpense += amt;
          sgaByCat[cat] = (sgaByCat[cat] || 0) + amt;
        }
      }
    });

    const grossProfit = grossRevenue - costOfGoods;
    const operatingProfit = grossProfit - sgaExpense;
    const grossMarginPercent =
      grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : 0;
    const operatingMarginPercent =
      grossRevenue > 0 ? ((operatingProfit / grossRevenue) * 100).toFixed(1) : 0;

    return {
      grossRevenue,
      revenueByCat,
      costOfGoods,
      cogsByCat,
      grossProfit,
      grossMarginPercent,
      sgaExpense,
      sgaByCat,
      operatingProfit,
      operatingMarginPercent,
    };
  }, [filtered]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>표준 손익계산서 (Profit & Loss Statement)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            기업회계기준(K-IFRS/일반기업회계기준) 형식의 표준 손익 보고서
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriod("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === "all"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              전체 누적
            </button>
            <button
              onClick={() => setSelectedPeriod("this-year")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === "this-year"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              올해 (YTD)
            </button>
            <button
              onClick={() => setSelectedPeriod("this-month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === "this-month"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              이번 달 (MTD)
            </button>
          </div>

          <button
            onClick={handlePrint}
            title="손익계산서 인쇄 / PDF 출력"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 / PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            손 익 계 산 서
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            프로젝트: profit-and-loss-7d09b | 통화: {useCurrency().currency}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* I. 매출액 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold text-base text-slate-900 dark:text-white">
              <span>Ⅰ. 매출액 (Gross Revenue)</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatAmount(stats.grossRevenue)}
              </span>
            </div>
            <div className="pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {Object.entries(stats.revenueByCat).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span>- {cat}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatAmount(amt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* II. 매출원가 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">
              <span>Ⅱ. 매출원가 (Cost of Goods Sold)</span>
              <span className="text-rose-600 dark:text-rose-400">
                ({formatAmount(stats.costOfGoods)})
              </span>
            </div>
            <div className="pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {Object.entries(stats.cogsByCat).length === 0 ? (
                <div className="py-1 text-slate-400 italic">- 해당 내역 없음</div>
              ) : (
                Object.entries(stats.cogsByCat).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span>- {cat}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      ({formatAmount(amt)})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* III. 매출총이익 */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-bold text-sm text-slate-900 dark:text-white">
            <span className="flex items-center gap-2">
              <span>Ⅲ. 매출총이익 (Gross Profit)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                이익률 {stats.grossMarginPercent}%
              </span>
            </span>
            <span className={stats.grossProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}>
              {formatAmount(stats.grossProfit)}
            </span>
          </div>

          {/* IV. 판매비와 관리비 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">
              <span>Ⅳ. 판매비와 관리비 (SG&A Expenses)</span>
              <span className="text-rose-600 dark:text-rose-400">
                ({formatAmount(stats.sgaExpense)})
              </span>
            </div>
            <div className="pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {Object.entries(stats.sgaByCat).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span>- {cat}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ({formatAmount(amt)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* V. 영업이익 / 당기순이익 */}
          <div className="flex items-center justify-between py-4 px-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-2xl font-black text-lg text-slate-900 dark:text-white">
            <div>
              <span className="block text-base">Ⅴ. 영업이익 / 당기순이익 (Operating / Net Income)</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                영업이익률: {stats.operatingMarginPercent}%
              </span>
            </div>
            <span className={`text-xl ${stats.operatingProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}`}>
              {formatAmount(stats.operatingProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
