import React from "react";
import {
  LogOut,
  Calendar,
  Building2,
  UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";

export const Header = ({ title }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, availableMonths, changeMonth } = useMonth();

  const formatMonthShort = (ym) => {
    const parts = ym.split("-");
    return `${parts[0]}년 ${parts[1]}월`;
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Left: View Title & Profile Badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {title === "월간경영현황" || title === "총괄 손익 대시보드" ? "현황" : title}
        </h2>

        {currentProfile && (
          <span className={`hidden sm:inline-flex items-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${currentProfile.badgeColor}`}>
            {currentProfile.name} ({isOperator ? "작업자" : "관리자"})
          </span>
        )}
      </div>

      {/* Center / Right: Clean Segmented Month Switcher & Logout */}
      <div className="flex items-center gap-3">
        {/* Sleek Apple/Notion-style Segmented Month Control */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
          {availableMonths.map((ym) => {
            const isSelected = selectedMonth === ym;
            const isLatest = ym === availableMonths[0];
            return (
              <button
                key={ym}
                onClick={() => changeMonth(ym)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>{formatMonthShort(ym)}</span>
                {isLatest && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    당월
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="로그아웃"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
};
