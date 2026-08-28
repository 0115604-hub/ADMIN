import React from "react";
import {
  Sun,
  Moon,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  Calendar,
  ChevronDown,
  Sparkles
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
    <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 shadow-sm">
      {/* Left: View Title & User Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate tracking-tight">
          {title}
        </h2>

        {currentProfile && (
          <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm ${currentProfile.badgeColor}`}>
            <span>{currentProfile.name}</span>
            <span>({isOperator ? "작업자" : "관리자"})</span>
          </span>
        )}
      </div>

      {/* Center / Right: High-Visibility Month Selector & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* ========================================================================= */}
        {/* HIGH-VISIBILITY MONTH SELECTOR (시인성 대폭 개선된 월 선택창) */}
        {/* ========================================================================= */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/30 border border-blue-400/40 ring-2 ring-blue-500/20 active:scale-95 transition-all">
            <Calendar className="w-4 h-4 text-blue-200 animate-pulse shrink-0" />
            <span className="text-[11px] text-blue-200 font-bold hidden sm:inline">조회 기준월:</span>
            
            <select
              value={selectedMonth}
              onChange={(e) => changeMonth(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm font-black focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              {availableMonths.map((ym) => (
                <option
                  key={ym}
                  value={ym}
                  className="bg-slate-900 text-white font-bold py-2"
                >
                  {formatMonthLabel(ym)} {ym === "2026-08" ? " (8월 당월 실적)" : ym === "2026-07" ? " (7월 전월 실적)" : ""}
                </option>
              ))}
            </select>

            <ChevronDown className="w-4 h-4 text-blue-200 pointer-events-none -ml-3 shrink-0" />
          </div>
        </div>

        {/* Currency Switcher (Admin Only) */}
        {isAdmin && (
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => changeCurrency("KRW")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currency === "KRW"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              ₩ 원화
            </button>
            <button
              onClick={() => changeCurrency("USD")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currency === "USD"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              $ 달러
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          className="p-2 sm:p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="데이터 새로고침"
          className="p-2 sm:p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
        </button>

        {/* Excel Upload Modal Button (Admin View) */}
        {isAdmin && (
          <button
            onClick={onOpenExcelModal}
            title="매입/손익 자료 엑셀 파일 일괄 업로드"
            className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>엑셀 업로드</span>
          </button>
        )}

        {/* Add Transaction Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={onOpenNewModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>내역 등록</span>
          </button>
        )}

        {/* Logout / Switch User Button */}
        <button
          onClick={logout}
          title="로그아웃 / 사용자 전환"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
};
