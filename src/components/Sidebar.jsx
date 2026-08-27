import React from "react";
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  PieChart,
  Settings,
  Flame,
  CheckCircle2,
  LogOut,
  UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const NAVIGATION_TABS = [
  { id: "dashboard", label: "대시보드 개요", icon: LayoutDashboard },
  { id: "transactions", label: "수익/지출 내역", icon: Receipt },
  { id: "statement", label: "손익계산서 (P&L)", icon: FileSpreadsheet },
  { id: "categories", label: "예산 & 카테고리", icon: PieChart },
  { id: "settings", label: "Firebase & 설정", icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser, isGuest, logout } = useAuth();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-200 z-30">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
            PROFIT & LOSS
          </h1>
          <p className="text-xs text-slate-400 font-medium">관리자 시스템 v1.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Firebase Status Card */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 mb-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Firebase 연동됨</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate font-mono">
          profit-and-loss-7d09b
        </p>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {currentUser?.displayName || currentUser?.email || (isGuest ? "게스트 관리자" : "관리자")}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {isGuest ? "데모 모드" : "인증됨"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="로그아웃"
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
