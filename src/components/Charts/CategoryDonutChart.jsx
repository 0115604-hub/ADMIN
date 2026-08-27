import React, { useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLOR_PALETTE = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#64748b", // slate
];

export const CategoryDonutChart = ({ transactions }) => {
  const [filterType, setFilterType] = useState("expense");
  const { isDarkMode } = useTheme();
  const { formatAmount } = useCurrency();

  // Aggregate by category
  const filtered = transactions.filter((t) => t.type === filterType);
  const categoryTotals = {};
  let totalAmount = 0;

  filtered.forEach((item) => {
    const cat = item.category || "기타";
    const amt = Number(item.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalAmount += amt;
  });

  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  const data = {
    labels: categories.length > 0 ? categories : ["데이터 없음"],
    datasets: [
      {
        data: values.length > 0 ? values : [1],
        backgroundColor: values.length > 0 ? COLOR_PALETTE.slice(0, categories.length) : ["#94a3b8"],
        borderWidth: 2,
        borderColor: isDarkMode ? "#0f172a" : "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDarkMode ? "#94a3b8" : "#475569",
          font: { family: "Pretendard", size: 11 },
          usePointStyle: true,
          boxWidth: 6,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        titleColor: isDarkMode ? "#f8fafc" : "#0f172a",
        bodyColor: isDarkMode ? "#cbd5e1" : "#334155",
        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            if (values.length === 0) return " 데이터 없음";
            const val = context.raw;
            const percentage = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${formatAmount(val)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            카테고리별 비중
          </h4>
          <p className="text-xs text-slate-400">지출 및 수익 항목 분포</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType("expense")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === "expense"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            지출
          </button>
          <button
            onClick={() => setFilterType("revenue")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === "revenue"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            수익
          </button>
        </div>
      </div>

      <div className="h-64 relative flex items-center justify-center">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
          <span className="text-[11px] font-medium text-slate-400">총 합계</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {formatAmount(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
