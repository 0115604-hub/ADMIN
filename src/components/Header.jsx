import React, { useState } from "react";
import {
  LogOut,
  Calendar,
  Building2,
  UserCheck,
  ArrowLeft,
  QrCode,
  X
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";

export const Header = ({ title, activeTab, onBackToSummary }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, availableMonths, changeMonth } = useMonth();
  const [showQrModal, setShowQrModal] = useState(false);

  const formatMonthShort = (ym) => {
    const parts = ym.split("-");
    return `${parts[0]}년 ${parts[1]}월`;
  };

  const matchedWorker = PLANTS.flatMap((p) => p.workers).find(
    (w) => w.name === currentProfile?.name || w.id === currentProfile?.id
  );
  const officialTitle = currentProfile?.title || matchedWorker?.title || "";
  const workerPlant = currentProfile?.plant || matchedWorker?.plant || "삼랑진공장";
  const userBadgeText = isOperator
    ? `${workerPlant} • ${currentProfile?.name} ${officialTitle}`.trim()
    : "ADMIN";

  const showBackButton = activeTab && activeTab !== "worker_dashboard" && activeTab !== "dashboard";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 shadow-sm">
      {/* Left: Brand Logo / Back Button & View Title */}
      <div className="flex items-center gap-3">
        {showBackButton && onBackToSummary ? (
          <button
            onClick={onBackToSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm ring-1 ring-blue-500/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>← 요약본 전체보기</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md ${
              workerPlant === "한림공장"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-700 shadow-emerald-500/20"
                : "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/20"
            }`}>
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              (주)오륙 생산관리현황
            </h2>
          </div>
        )}

        {showBackButton && (
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight hidden md:inline ml-2">
            | {title}
          </h2>
        )}

        {currentProfile && (
          <span className={`hidden sm:inline-flex items-center text-xs font-black px-3 py-1 rounded-full shadow-sm ${
            isOperator
              ? workerPlant === "한림공장"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          }`}>
            {userBadgeText}
          </span>
        )}
      </div>

      {/* Center / Right: Clean Segmented Month Switcher & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sleek Segmented Month Control */}
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

        {/* QR Code Button */}
        <button
          onClick={() => setShowQrModal(true)}
          title="모바일 접속 QR코드"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-xs font-black transition-all shadow-sm active:scale-95"
        >
          <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">모바일 QR</span>
        </button>

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

      {/* QR Code Popup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative animate-scaleUp">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              모바일 간편 접속 QR코드
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              스마트폰 카메라로 QR코드를 비추면<br />
              <strong className="text-blue-600 dark:text-blue-400 font-bold">(주)오륙 생산관리현황</strong>에 즉시 접속됩니다.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md inline-block mb-4">
              <img
                src="/oryuk_app_qr.png"
                alt="(주)오륙 생산관리현황 모바일 접속 QR코드"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all select-all mb-4">
              https://profit-and-loss-7d09b.web.app
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
