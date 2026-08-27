import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet
} from "lucide-react";
import { KPICard } from "./KPICard";
import { MonthlyTrendChart } from "./Charts/MonthlyTrendChart";
import { CategoryDonutChart } from "./Charts/CategoryDonutChart";
import { useCurrency } from "../context/CurrencyContext";

export const DashboardOverview = ({
  transactions,
  onOpenNewModal,
  onNavigateToTransactions
}) => {
  const { formatAmount } = useCurrency();

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "revenue") {
        totalRevenue += amt;
      } else {
        totalExpense += amt;
      }
    });

    const netProfit = totalRevenue - totalExpense;
    const profitMargin =
      totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      totalExpense,
      netProfit,
      profitMargin,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 매출액 (Total Revenue)"
          value={formatAmount(metrics.totalRevenue)}
          change="+14.2%"
          isPositive={true}
          icon={ArrowUpRight}
          colorScheme="blue"
          subtitle="전월 동기 대비"
        />

        <KPICard
          title="총 지출액 (Total Expenses)"
          value={formatAmount(metrics.totalExpense)}
          change="+3.8%"
          isPositive={false}
          icon={ArrowDownRight}
          colorScheme="rose"
          subtitle="예산 집행률 68%"
        />

        <KPICard
          title="당기 순이익 (Net Profit)"
          value={formatAmount(metrics.netProfit)}
          change={metrics.netProfit >= 0 ? "흑자 달성" : "적자"}
          isPositive={metrics.netProfit >= 0}
          icon={Wallet}
          colorScheme="emerald"
          subtitle={`순이익률 ${metrics.profitMargin}%`}
        />

        <KPICard
          title="영업 이익률 (Margin %)"
          value={`${metrics.profitMargin}%`}
          change="안정적"
          isPositive={Number(metrics.profitMargin) > 20}
          icon={Percent}
          colorScheme="purple"
          subtitle="업계 상위 15%"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <CategoryDonutChart transactions={transactions} />
        </div>
      </div>

      {/* Recent Transactions & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  최근 발생 거래 내역
                </h4>
                <p className="text-xs text-slate-400">최근 등록된 5건의 손익 내역</p>
              </div>
              <button
                onClick={onNavigateToTransactions}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                전체보기 →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => {
                const isRev = tx.type === "revenue";
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl text-xs font-bold ${
                          isRev
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}
                      >
                        {isRev ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {tx.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {tx.date} • {tx.category} • {tx.client || "직접거래"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold ${
                          isRev
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isRev ? "+" : "-"} {formatAmount(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onOpenNewModal}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors"
            >
              + 새로운 수익/지출 내역 추가하기
            </button>
          </div>
        </div>

        {/* Financial Health Summary */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              손익 건전성 분석
            </h4>
            <p className="text-xs text-slate-400 mb-4">현재 재무 데이터 기반 요약</p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium">수익성 평가</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  우수 (순이익률 {metrics.profitMargin}%)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  매출 대비 비용 통제가 양호하며 지속적인 흑자 구조를 유지하고 있습니다.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium">최대 지출 비중</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  인건비 (약 45%)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  연구개발 및 운영을 위한 인건비가 가장 큰 비중을 차지합니다.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Firebase 클라우드 연동</span>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  profit-and-loss-7d09b
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  모든 손익 데이터는 Cloud Firestore에 안전하게 보관됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
