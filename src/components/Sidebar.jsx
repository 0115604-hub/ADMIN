import React from "react";
import {
  LayoutDashboard,
  Car,
  Boxes,
  Layers,
  FileText,
  Settings,
  LogOut,
  Building2,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const NAVIGATION_TABS = [
  { id: "dashboard", label: "총괄 손익 대시보드", icon: LayoutDashboard, badge: "종합" },
  { id: "vehicle_sales", label: "차종별 매출 분석", icon: Car, badge: "23개 차종" },
  { id: "material_purchases", label: "자재매입 품목군 분석", icon: Boxes, badge: "9개 군" },
  { id: "purchase_costs", label: "계정과목별 매입", icon: Layers, badge: "12개 과목" },
  { id: "statement", label: "월간 손익계산서", icon: FileText, badge: "K-IFRS" },
  { id: "settings", label: "설정 & 데이터 관리", icon: Settings }
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-200">
      {/* Brand Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              매입·매출 손익 관리
            </h1>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              제조·임가공 ERP Pro
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 space-y-1.5">
          {NAVIGATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.displayName || "관리자"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email || "admin@company.com"}
            </p>
          </div>
          <button
            onClick={logout}
            title="로그아웃"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
