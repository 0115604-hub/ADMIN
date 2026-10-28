import React from "react";
import { OryukLogo } from "../OryukLogo";

/**
 * AuthModalHeaderNav
 * Displays (주)오륙 brand header with clickable logo to select admin.
 * (Top company badges removed per user instruction)
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
    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800/80">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
        <div
          onClick={onAdminClick}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group active:scale-98 transition-transform min-w-0"
          title="관리자(대표이사) 로그인"
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
    </div>
  );
};

export default AuthModalHeaderNav;
