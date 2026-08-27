import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const MonthlyTrendChart = ({ transactions }) => {
  const { isDarkMode } = useTheme();
  const { currency, exchangeRate, formatAmount } = useCurrency();

  // Aggregate monthly data for last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getMonth() + 1}월`;
    months.push({ key, label, revenue: 0, expense: 0 });
  }

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const txMonth = tx.date.substring(0, 7);
    const m = months.find((item) => item.key === txMonth);
    if (m) {
      if (tx.type === "revenue") {
        m.revenue += Number(tx.amount) || 0;
      } else {
        m.expense += Number(tx.amount) || 0;
      }
    }
  });

  const divider = currency === "USD" ? exchangeRate : 1;

  const data = {
    labels: months.map((m) => m.label),
    datasets: [
      {
        type: "bar",
        label: "매출 (Revenue)",
        data: months.map((m) => Math.round(m.revenue / divider)),
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        borderRadius: 8,
        barPercentage: 0.6,
      },
      {
        type: "bar",
        label: "지출 (Expense)",
        data: months.map((m) => Math.round(m.expense / divider)),
        backgroundColor: "rgba(244, 63, 94, 0.8)",
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkMode ? "#94a3b8" : "#475569",
          font: { family: "Pretendard", size: 12, weight: 600 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        titleColor: isDarkMode ? "#f8fafc" : "#0f172a",
        bodyColor: isDarkMode ? "#cbd5e1" : "#334155",
        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const rawVal = context.raw * divider;
            return ` ${context.dataset.label}: ${formatAmount(rawVal)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? "#64748b" : "#94a3b8",
          font: { family: "Pretendard", size: 12 },
        },
      },
      y: {
        grid: {
          color: isDarkMode ? "rgba(51, 65, 85, 0.4)" : "rgba(226, 232, 240, 0.8)",
        },
        ticks: {
          color: isDarkMode ? "#64748b" : "#94a3b8",
          font: { family: "Pretendard", size: 11 },
          callback: (value) => {
            if (currency === "USD") return `$${value.toLocaleString()}`;
            if (value >= 10000000) return `${value / 10000000}천만`;
            if (value >= 10000) return `${value / 10000}만`;
            return value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            월별 손익 추이 (Revenue vs Expenses)
          </h4>
          <p className="text-xs text-slate-400">최근 6개월간 매출 및 비용 비교</p>
        </div>
      </div>
      <div className="h-72 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
