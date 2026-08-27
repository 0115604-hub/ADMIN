import React from "react";
import {
  Sun,
  Moon,
  Plus,
  RefreshCw,
  Sparkles,
  DollarSign
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";

export const Header = ({
  title,
  onOpenNewModal,
  onRefresh,
  onSeedData,
  isRefreshing
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currency, changeCurrency } = useCurrency();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => changeCurrency("KRW")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currency === "KRW"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            ₩ KRW
          </button>
          <button
            onClick={() => changeCurrency("USD")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currency === "USD"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            $ USD
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="데이터 새로고침"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>

        {/* Seed Sample Data Button */}
        <button
          onClick={onSeedData}
          title="테스트용 샘플 데이터 생성"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>샘플 데이터 추가</span>
        </button>

        {/* Add Transaction Button */}
        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>내역 등록</span>
        </button>
      </div>
    </header>
  );
};
