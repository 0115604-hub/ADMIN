import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * SalesPurchaseKpiCards
 * Renders top 4 KPI cards: Total Sales, Total Purchases, Gross Profit, and Cost-to-Margin Ratio.
 */
export const SalesPurchaseKpiCards = ({
  monthTitle,
  totalSales,
  totalExpenses,
  grossProfit,
  costRatio,
  profitRatio
}) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {/* 카드 1: 당월 총매출액 */}
      <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {monthTitle} 총매출액
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
            14개 라인
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatAmount(totalSales)}
          </span>
          <span className="text-[10.5px] font-bold text-slate-400">100%</span>
        </div>
      </div>

      {/* 카드 2: 당월 총매입액 */}
      <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            당월 총매입액 (원가)
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
            원가율 {costRatio}%
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatAmount(Math.round(totalExpenses))}
          </span>
          <span className="text-[10.5px] font-bold text-rose-500">{costRatio}%</span>
        </div>
      </div>

      {/* 카드 3: 당월 매출총이익 */}
      <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            매출총이익 (매출-매입)
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
            +{profitRatio}%
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatAmount(Math.round(grossProfit))}
          </span>
          <span className="text-[10.5px] font-bold text-emerald-500">+{profitRatio}%</span>
        </div>
      </div>

      {/* 카드 4: 원가 / 마진 비율 게이지 */}
      <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            손익 건전성 비율
          </span>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {costRatio}% : {profitRatio}%
          </span>
        </div>
        <div className="mt-2 space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${costRatio}%` }} className="bg-rose-500 h-full" />
            <div style={{ width: `${profitRatio}%` }} className="bg-emerald-500 h-full" />
          </div>
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-rose-600 dark:text-rose-400">원가 {costRatio}%</span>
            <span className="text-emerald-600 dark:text-emerald-400">이익 {profitRatio}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPurchaseKpiCards;
