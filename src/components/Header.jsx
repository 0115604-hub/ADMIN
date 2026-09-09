import React, { useState, useEffect } from "react";
import {
  LogOut,
  Calendar,
  ArrowLeft,
  Menu,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { OryukLogo } from "./OryukLogo";
import { TelegramLogo } from "./TelegramLogo";

const ZOOM_STEPS = [0.85, 0.90, 1.0, 1.10, 1.25, 1.40];

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

  // Screen Zoom State (Persisted in localStorage)
  const [zoomIndex, setZoomIndex] = useState(() => {
    try {
      const saved = localStorage.getItem("oryuk_screen_zoom_idx");
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < ZOOM_STEPS.length) return idx;
      }
    } catch (e) {}
    return 2; // Default 1.0 (100%)
  });

  const currentZoom = ZOOM_STEPS[zoomIndex];

  // Apply zoom to document body/documentElement
  useEffect(() => {
    try {
      document.documentElement.style.zoom = `${currentZoom}`;
      document.body.style.zoom = `${currentZoom}`;
      localStorage.setItem("oryuk_screen_zoom_idx", String(zoomIndex));
    } catch (e) {
      console.error("Failed to apply zoom:", e);
    }
  }, [zoomIndex, currentZoom]);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleZoomReset = () => {
    setZoomIndex(2); // 1.0 (100%)
  };

  const formatMonthShort = (ym) => {
    const parts = ym.split("-");
    return `${parts[0]}년 ${parts[1]}월`;
  };

  const showBackButton = isOperator && activeTab && activeTab !== "worker_dashboard";

  return (
    <header className="h-14 sm:h-15 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 shadow-2xs max-w-full min-w-0">
      {/* Left: View Title / Mobile Menu Button / Operator Back Button */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-1">
        {/* Admin Mobile Hamburger Menu Button */}
        {isAdmin && onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 md:hidden transition-colors shrink-0"
            title="메뉴 열기"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Operator Back Button */}
        {showBackButton && onBackToSummary ? (
          <button
            onClick={onBackToSummary}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm ring-1 ring-blue-500/20 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">← 요약본 전체보기</span>
            <span className="sm:hidden">← 뒤로</span>
          </button>
        ) : isOperator ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 truncate">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs p-1 shrink-0">
              <OryukLogo className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
              <span className="sm:hidden">(주)오륙</span>
              <span className="hidden sm:inline">(주)오륙 생산관리현황</span>
            </h2>
          </div>
        ) : (
          /* Admin Title Header */
          <div className="flex items-center gap-2 min-w-0 truncate">
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {title === "월간경영현황" || title === "총괄 손익 대시보드" ? "현황" : title}
            </h2>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              실시간 동기화
            </span>
          </div>
        )}

        {showBackButton && (
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight hidden md:inline ml-2 truncate">
            | {title}
          </h2>
        )}
      </div>

      {/* Center / Right: Action Buttons, Month Switcher & Logout */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* ⭐ [요청반영] Admin Top: 등록 탭 및 오른쪽 텔레그램 연동 탭 */}
        {isAdmin && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onOpenNewModal && (
              <button
                onClick={onOpenNewModal}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="신규 손익 내역 등록"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-extrabold hidden sm:inline">등록</span>
              </button>
            )}

            {setActiveTab && (
              <button
                onClick={() => setActiveTab("telegram")}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border shrink-0 ${
                  activeTab === "telegram"
                    ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/30"
                    : "bg-white hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                }`}
                title="텔레그램 실시간 알림 및 연동 설정"
              >
                <TelegramLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="font-extrabold hidden sm:inline">텔레그램 연동</span>
              </button>
            )}
          </div>
        )}

        {/* ⭐ [요청반영] 화면 확대/축소 원터치 컨트롤러 (Pinch-to-zoom 제스처 및 원터치 배율 조절) */}
        <div className="flex items-center rounded-xl sm:rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 p-0.5 sm:p-1 border border-slate-200/90 dark:border-slate-700 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
            title="화면 축소 (작게 보기)"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all tracking-tight cursor-pointer select-none"
            title="클릭 시 100% 기본 배율로 초기화"
          >
            {Math.round(currentZoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
            title="화면 확대 (크게 보기)"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500/40 dark:border-blue-500/50 shadow-2xs hover:border-blue-600 transition-all shrink-0">
          <div className="p-0.5 sm:p-1 rounded-md sm:rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => changeMonth(e.target.value)}
            className="bg-transparent text-[11px] sm:text-sm font-black text-slate-900 dark:text-white cursor-pointer focus:outline-none pr-0.5 sm:pr-1 max-w-[80px] sm:max-w-none"
          >
            {availableMonths.map((ym) => (
              <option key={ym} value={ym} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
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

        {/* Logout Button (High-Visibility Rose Badge on Mobile & PC) */}
        <button
          onClick={logout}
          title="사용자 전환 / 로그아웃"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900/90 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 text-[11px] sm:text-xs font-black transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-black">로그아웃</span>
        </button>
      </div>
    </header>
  );
};
