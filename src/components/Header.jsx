import React, { useState } from "react";
import {
  LogOut,
  Calendar,
  Building2,
  UserCheck,
  ArrowLeft,
  QrCode,
  X,
  Menu,
  Plus
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { OryukLogo } from "./OryukLogo";
import { TelegramLogo } from "./TelegramLogo";

export const Header = ({
  title,
  activeTab,
  setActiveTab,
  onBackToSummary,
  onOpenMobileMenu,
  onOpenNewModal,
  onOpenExcelModal
}) => {
  const { isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, availableMonths, changeMonth, currentYearMonth, isCurrentMonth } = useMonth();

  const formatMonthShort = (ym) => {
    const parts = ym.split("-");
    return `${parts[0]}년 ${parts[1]}월`;
  };

  const showBackButton = isOperator && activeTab && activeTab !== "worker_dashboard";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 shadow-sm">
      {/* Left: View Title / Mobile Menu Button / Operator Back Button */}
      <div className="flex items-center gap-3">
        {/* Admin Mobile Hamburger Menu Button */}
        {isAdmin && onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 md:hidden transition-colors"
            title="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Operator Back Button */}
        {showBackButton && onBackToSummary ? (
          <button
            onClick={onBackToSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm ring-1 ring-blue-500/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>← 요약본 전체보기</span>
          </button>
        ) : isOperator ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-1">
              <OryukLogo className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              (주)오륙 생산관리현황
            </h2>
          </div>
        ) : (
          /* Admin Title Header */
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {title === "월간경영현황" || title === "총괄 손익 대시보드" ? "현황" : title}
            </h2>
          </div>
        )}

        {showBackButton && (
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight hidden md:inline ml-2">
            | {title}
          </h2>
        )}
      </div>

      {/* Center / Right: Action Buttons, Month Switcher & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ⭐ [요청반영] Admin Top: 등록 탭 및 오른쪽 텔레그램 연동 탭 */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenNewModal && (
              <button
                onClick={onOpenNewModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="신규 손익 내역 등록"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-extrabold">등록</span>
              </button>
            )}

            {setActiveTab && (
              <button
                onClick={() => setActiveTab("telegram")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                  activeTab === "telegram"
                    ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/30"
                    : "bg-white hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                }`}
                title="텔레그램 실시간 알림 연동 관리"
              >
                <TelegramLogo className="w-4 h-4" />
                <span className="font-extrabold">telegram</span>
              </button>
            )}
          </div>
        )}

        {/* Month Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500/40 dark:border-blue-500/50 shadow-sm hover:border-blue-600 transition-all">
          <div className="p-1 rounded-lg bg-blue-600 text-white shadow-xs">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => changeMonth(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-black text-slate-900 dark:text-white cursor-pointer focus:outline-none pr-1"
          >
            {availableMonths.map((ym) => (
              <option key={ym} value={ym} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                {formatMonthShort(ym)} {isCurrentMonth(ym) ? "(당월)" : ""}
              </option>
            ))}
          </select>
          {isCurrentMonth(selectedMonth) && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs">
              당월
            </span>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="사용자 전환 / 로그아웃"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
};
