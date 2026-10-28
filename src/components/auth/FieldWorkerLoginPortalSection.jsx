import React from "react";
import { Factory, Cpu, Building2, Users } from "lucide-react";

/**
 * FieldWorkerLoginPortalSection
 * 생산 전용 로그인 빠른 입장 포털 패널
 * [압출동], [가공동], [유성], [(주)조영], [한울], [부림텍] 6개 사업장/부서 카드
 * 노출순서: 압출동 -> 가공동 -> 유성 -> 조영 -> 한울 -> 부림텍 (한울, 부림텍, 유성은 개인사업자이므로 (주) 삭제)
 * 모바일 최적화: touch-manipulation 및 넉넉한 터치 영역(min-h-[56px]) 적용
 */
export const FieldWorkerLoginPortalSection = ({
  onOpenExtrusionModal,
  onOpenMachiningModal,
  onOpenHanulModal,
  onOpenBulimtechModal,
  onOpenYuseongModal,
  onOpenJoyoungModal,
  extrusionWorkersCount = 11,
  machiningWorkersCount = 0,
  hanulWorkersCount = 0,
  bulimtechWorkersCount = 0,
  yuseongWorkersCount = 0,
  joyoungWorkersCount = 0,
  className = ""
}) => {
  const totalFieldWorkersCount =
    extrusionWorkersCount +
    machiningWorkersCount +
    hanulWorkersCount +
    bulimtechWorkersCount +
    yuseongWorkersCount +
    joyoungWorkersCount;

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 dark:bg-slate-800/60 border-2 border-dashed border-teal-500/40 dark:border-teal-600/40 space-y-2 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
          <div className="p-1 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">생산 전용 로그인</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
          총 {totalFieldWorkersCount}명
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {/* 1. 압출동 */}
        <button
          type="button"
          onClick={onOpenExtrusionModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="삼랑진공장 압출동 작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white">
              {extrusionWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            압출동
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-teal-700 dark:text-teal-300 font-semibold truncate">
            삼랑진공장
          </span>
        </button>

        {/* 2. 가공동 */}
        <button
          type="button"
          onClick={onOpenMachiningModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="삼랑진공장 가공동 작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-600 text-white">
              {machiningWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            가공동
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-amber-700 dark:text-amber-300 font-semibold truncate">
            삼랑진공장
          </span>
        </button>

        {/* 3. 유성 (개인사업자: (주) 삭제) */}
        <button
          type="button"
          onClick={onOpenYuseongModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 hover:from-blue-500/25 hover:to-indigo-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="삼랑진공장 가공/협력업체 유성 작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-600 text-white">
              {yuseongWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            유성
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-blue-700 dark:text-blue-300 font-semibold truncate">
            삼랑진공장
          </span>
        </button>

        {/* 4. (주)조영 */}
        <button
          type="button"
          onClick={onOpenJoyoungModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-green-500/15 hover:from-emerald-500/25 hover:to-green-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="한림공장 (주)조영 현장작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
              {joyoungWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            (주)조영
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold truncate">
            한림공장
          </span>
        </button>

        {/* 5. 한울 (개인사업자: (주) 삭제) */}
        <button
          type="button"
          onClick={onOpenHanulModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="한림공장 가공/협력업체 한울 작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-indigo-600 text-white">
              {hanulWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            한울
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold truncate">
            한림공장
          </span>
        </button>

        {/* 6. 부림텍 (개인사업자: (주) 삭제) */}
        <button
          type="button"
          onClick={onOpenBulimtechModal}
          className="p-2 sm:p-2.5 rounded-xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/15 to-cyan-500/15 hover:from-teal-500/25 hover:to-cyan-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[56px] sm:min-h-[52px] touch-manipulation select-none"
          title="한림공장 가공/협력업체 부림텍 작업자 전용 포털"
        >
          <div className="flex items-center justify-between gap-1">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white">
              {bulimtechWorkersCount}명
            </span>
          </div>
          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            부림텍
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-teal-700 dark:text-teal-300 font-semibold truncate">
            한림공장
          </span>
        </button>
      </div>
    </div>
  );
};

export default FieldWorkerLoginPortalSection;
