import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const KPICard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  colorScheme = "blue",
  subtitle
}) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${colorStyles[colorScheme] || colorStyles.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
              isPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          {subtitle || "전월 대비"}
        </span>
      </div>
    </div>
  );
};
