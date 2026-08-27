import React, { useState, useMemo } from "react";
import { PieChart, DollarSign, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const INITIAL_BUDGETS = {
  "인건비": 12000000,
  "서버/인프라": 2500000,
  "마케팅/광고": 3000000,
  "사무실/운영비": 2000000,
  "소프트웨어 구독": 1000000,
  "외주용역비": 5000000,
  "기타비용": 1000000,
};

export const BudgetAnalysis = ({ transactions }) => {
  const { formatAmount } = useCurrency();
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem("admin_pnl_budgets");
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState("");

  // Aggregate current spending by category (for expenses)
  const categorySpending = useMemo(() => {
    const spending = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "기타비용";
        spending[cat] = (spending[cat] || 0) + (Number(t.amount) || 0);
      });
    return spending;
  }, [transactions]);

  const handleSaveBudget = (cat) => {
    const updated = {
      ...budgets,
      [cat]: Number(editBudgetAmount) || 0,
    };
    setBudgets(updated);
    localStorage.setItem("admin_pnl_budgets", JSON.stringify(updated));
    setEditingCategory(null);
  };

  const categories = Object.keys(budgets);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" />
            <span>월간 카테고리별 예산 및 지출 관리</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            카테고리별 설정된 예산 대비 현재 지출 집행률을 모니터링합니다.
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const budget = budgets[cat] || 0;
          const spent = categorySpending[cat] || 0;
          const percent = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
          const isOver = spent > budget && budget > 0;

          return (
            <div
              key={cat}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {cat}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    현재 지출: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatAmount(spent)}</span>
                  </p>
                </div>

                <div className="text-right">
                  {editingCategory === cat ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editBudgetAmount}
                        onChange={(e) => setEditBudgetAmount(e.target.value)}
                        placeholder="예산 입력"
                        className="w-28 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveBudget(cat)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg font-semibold"
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingCategory(cat);
                        setEditBudgetAmount(String(budget));
                      }}
                      title="클릭하여 예산 수정"
                      className="cursor-pointer group"
                    >
                      <span className="text-xs text-slate-400">설정 예산</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                        {formatAmount(budget)} ✏️
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isOver ? "text-rose-500 font-bold" : "text-slate-600 dark:text-slate-400"}>
                    {percent}% 집행 {isOver && "(예산 초과!)"}
                  </span>
                  <span className="text-slate-400">
                    잔여: {formatAmount(Math.max(budget - spent, 0))}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? "bg-rose-500"
                        : percent > 80
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
