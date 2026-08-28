import React from "react";
import {
  BarChart3,
  Car,
  Boxes,
  Layers,
  FileText,
  Settings,
  LogOut,
  Building2,
  UploadCloud
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const ADMIN_TABS = [
  { id: "dashboard", label: "현황", icon: BarChart3, badge: "종합" },
  { id: "vehicle_sales", label: "차종별 매출 분석", icon: Car, badge: "23개 차종" },
  { id: "material_purchases", label: "자재매입 품목군 분석", icon: Boxes, badge: "9개 군" },
  { id: "purchase_costs", label: "계정과목별 매입", icon: Layers, badge: "12개 과목" },
  { id: "statement", label: "월간 손익계산서", icon: FileText, badge: "K-IFRS" },
  { id: "operator_workspace", label: "엑셀 데이터 업데이트", icon: UploadCloud, badge: "업로드" },
  { id: "settings", label: "설정 & 데이터 관리", icon: Settings }
];

export const OPERATOR_TABS = [
  { id: "operator_workspace", label: "엑셀 일일 업데이트 업로드", icon: UploadCloud, badge: "작업자 전용" }
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();

  const navigationTabs = isOperator ? OPERATOR_TABS : ADMIN_TABS;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-200">
      {/* Brand Logo & Profile Tag */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            isOperator
              ? "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/25"
              : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/25"
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              매입·매출 관리
            </h1>
            <p className={`text-[11px] font-bold ${isOperator ? "text-amber-600" : "text-blue-600 dark:text-blue-400"}`}>
              {isOperator ? "작업자 전용 시스템" : "제조·임가공 ERP Pro"}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 space-y-1.5">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? isOperator
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shadow-sm ring-1 ring-amber-400/30"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-sm ring-1 ring-blue-400/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${
                    isActive
                      ? isOperator
                        ? "text-amber-600"
                        : "text-blue-600 dark:text-blue-400"
                      : "text-slate-400"
                  }`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive
                      ? isOperator
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
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
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
              isOperator ? "bg-amber-500" : "bg-blue-600"
            }`}>
              {currentProfile?.avatar || "관"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentProfile?.name || "사용자"}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-semibold">
                {currentProfile?.roleLabel || "사용자"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="사용자 전환 / 로그아웃"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
