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
  UploadCloud,
  ClipboardList,
  Calculator,
  PauseCircle,
  CheckSquare,
  Clock,
  Sparkles,
  Wrench,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const ADMIN_TABS = [
  { id: "dashboard", label: "현황", icon: BarChart3 },
  { id: "vehicle_sales", label: "차종별 매출 분석", icon: Car },
  { id: "material_purchases", label: "자재매입 품목군 분석", icon: Boxes },
  { id: "closing_ledger", label: "월간 결산 수치 입력", icon: Calculator },
  { id: "purchase_costs", label: "계정과목별 매입", icon: Layers },
  { id: "statement", label: "월간 손익계산서", icon: FileText },
  { id: "worker_dashboard", label: "일일업무일지 관리", icon: ClipboardList },
  { id: "operator_workspace", label: "엑셀 데이터 업데이트", icon: UploadCloud },
  { id: "settings", label: "설정 & 데이터 관리", icon: Settings }
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const isInjoo = currentProfile?.name === "조인주";

  // Operator navigation tabs - strictly 1 line, no badges/annotations
  const operatorTabs = [
    {
      id: "worker_dashboard",
      label: "일일생산정보현황",
      icon: ClipboardList,
      color: "blue",
      activeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      id: "extrusion_downtime",
      label: "압출동 주간 비가동내역",
      icon: Wrench,
      color: "amber",
      activeClass: "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/30",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      id: "daily_quality",
      label: "일일 품질현황",
      icon: ShieldCheck,
      color: "indigo",
      activeClass: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-500/30",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      id: "overtime_status",
      label: "특근현황",
      icon: Clock,
      color: "purple",
      activeClass: "bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    ...(isInjoo
      ? [
          {
            id: "operator_workspace",
            label: "엑셀 파일 업로드",
            icon: UploadCloud,
            color: "emerald",
            activeClass: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/30",
            iconColor: "text-emerald-600 dark:text-emerald-400"
          }
        ]
      : [])
  ];

  const navigationTabs = isOperator ? operatorTabs : ADMIN_TABS;

  const displayName = isOperator
    ? `${currentProfile?.name} ${currentProfile?.title || ""}`
    : "ADMIN";

  const displayPlant = isOperator
    ? currentProfile?.plant
    : "본사 총괄";

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-200">
      {/* Brand Logo & Profile Tag */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
            isOperator
              ? currentProfile?.plant === "한림공장"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-700 shadow-emerald-500/25"
                : "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/25"
              : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/25"
          }`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              (주)오륙 생산관리현황
            </h1>
            <p className={`text-[11px] font-bold truncate ${
              isOperator
                ? currentProfile?.plant === "한림공장"
                  ? "text-emerald-600"
                  : "text-amber-600"
                : "text-blue-600 dark:text-blue-400"
            }`}>
              {displayPlant}
            </p>
          </div>
        </div>

        {/* Navigation Menu (Single Line, No Annotations/Badges) */}
        <nav className="mt-6 sm:mt-8 space-y-1.5">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                  isActive
                    ? tab.activeClass || "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-sm ring-1 ring-blue-400/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-slate-800 shadow-sm"
                    : "bg-slate-100/70 dark:bg-slate-800/50"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isActive
                      ? tab.iconColor || "text-blue-600 dark:text-blue-400"
                      : "text-slate-400"
                  }`} />
                </div>
                <span className="font-black text-xs sm:text-sm whitespace-nowrap truncate">{tab.label}</span>
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
              isOperator
                ? currentProfile?.plant === "한림공장"
                  ? "bg-emerald-600"
                  : "bg-amber-500"
                : "bg-slate-800"
            }`}>
              {currentProfile?.avatar || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-bold">
                {displayPlant}
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
