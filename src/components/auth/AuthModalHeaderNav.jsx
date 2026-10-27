import React from "react";
import { OryukLogo } from "../OryukLogo";
import { Cpu, Factory, Building2 } from "lucide-react";

/**
 * AuthModalHeaderNav
 * Displays (주)오륙 brand header with clickable logo to select admin,
 * and quick-entry badge buttons for the 6 plant/company worker portals:
 * [압출동], [가공동], [한울], [부림텍], [유성], [조영].
 */
export const AuthModalHeaderNav = ({
  onAdminClick,
  onOpenExtrusionModal,
  onOpenMachiningModal,
  onOpenHanulModal,
  onOpenBulimtechModal,
  onOpenYuseongModal,
  onOpenJoyoungModal,
  machiningWorkersCount = 0,
  hanulWorkersCount = 0,
  bulimtechWorkersCount = 0,
  yuseongWorkersCount = 0,
  joyoungWorkersCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800/80">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
        <div
          onClick={onAdminClick}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group active:scale-98 transition-transform min-w-0"
        >
          <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 p-1 sm:p-1.5 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-400 group-hover:shadow-blue-500/20 transition-all">
            <OryukLogo className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-xs group-hover:scale-105 transition-transform" />
          </div>
          <div className="min-w-0 text-left">
            <h2 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="text-blue-600 dark:text-blue-400 font-black">
                (주)오륙
              </span>
              <span className="truncate">생산관리 통합시스템</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right: Badges: [압출동] & [가공동] & [한울] & [부림텍] & [유성] & [조영] */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={onOpenExtrusionModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-teal-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-teal-400/30"
          title="삼랑진공장 압출동 작업자 전용 포털 (공영국 외 10명)"
        >
          <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 animate-pulse" />
          <span>압출동</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-800/80 text-teal-100 hidden sm:inline">
            11명
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenMachiningModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-amber-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-amber-400/30"
          title={`삼랑진공장 가공동 작업자 전용 포털 (${machiningWorkersCount}명)`}
        >
          <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 animate-pulse" />
          <span>가공동</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-900/80 text-amber-100 hidden sm:inline">
            {machiningWorkersCount}명
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenHanulModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-indigo-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-indigo-400/30"
          title={`한림공장 가공/협력업체 (주)한울 작업자 전용 포털 (${hanulWorkersCount}명)`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200 animate-pulse" />
          <span>한울</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-900/80 text-indigo-100 hidden sm:inline">
            {hanulWorkersCount}명
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBulimtechModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-teal-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-teal-400/30"
          title={`한림공장 가공/협력업체 (주)부림텍 작업자 전용 포털 (${bulimtechWorkersCount}명)`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 animate-pulse" />
          <span>부림텍</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-900/80 text-teal-100 hidden sm:inline">
            {bulimtechWorkersCount}명
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenYuseongModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-blue-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-blue-400/30"
          title={`가공/협력업체 (주)유성 작업자 전용 포털 (${yuseongWorkersCount}명)`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 animate-pulse" />
          <span>유성</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-900/80 text-blue-100 hidden sm:inline">
            {yuseongWorkersCount}명
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenJoyoungModal}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg border border-emerald-400/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-emerald-400/30"
          title={`한림공장 (주)조영 현장작업자 전용 포털 (${joyoungWorkersCount}명)`}
        >
          <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 animate-pulse" />
          <span>조영</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-900/80 text-emerald-100 hidden sm:inline">
            {joyoungWorkersCount}명
          </span>
        </button>
      </div>
    </div>
  );
};

export default AuthModalHeaderNav;
