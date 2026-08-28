import React from "react";
import {
  Sun,
  Moon,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  Calendar,
  ChevronDown
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";

export const Header = ({
  title,
  onOpenNewModal,
  onOpenExcelModal,
  onRefresh,
  isRefreshing
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currency, changeCurrency } = useCurrency();
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, availableMonths, changeMonth } = useMonth();

  const formatMonthLabel = (ym) => {
    const parts = ym.split("-");
    return `${parts[0]}년 ${parts[1]}월`;
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
          {title}
        </h2>

        {/* User Role Badge */}
        {currentProfile && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${currentProfile.badgeColor}`}>
            <span>{currentProfile.name}</span>
            <span>({isOperator ? "작업자" : "관리자"})</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Month Selector Dropdown */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 mr-1 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => changeMonth(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 pr-2 py-1 focus:outline-none cursor-pointer"
          >
            {availableMonths.map((ym) => (
              <option key={ym} value={ym} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                {formatMonthLabel(ym)} {ym === "2026-08" ? "(당월)" : ym === "2026-07" ? "(전월)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Switcher (Admin Only) */}
        {isAdmin && (
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => changeCurrency("KRW")}
              className={`px-2 py-1 rounded-lg transition-all ${
                currency === "KRW"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              ₩ KRW
            </button>
            <button
              onClick={() => changeCurrency("USD")}
              className={`px-2 py-1 rounded-lg transition-all ${
                currency === "USD"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              $ USD
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="데이터 새로고침"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>

        {/* Excel Upload Modal Button (Admin View) */}
        {isAdmin && (
          <button
            onClick={onOpenExcelModal}
            title="매입/손익 자료 엑셀 파일 일괄 업로드"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀 업로드</span>
          </button>
        )}

        {/* Add Transaction Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={onOpenNewModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>내역 등록</span>
          </button>
        )}

        {/* Logout / Switch User Button */}
        <button
          onClick={logout}
          title="로그아웃 / 사용자 전환"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
};
