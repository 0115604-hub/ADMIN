import React from "react";
import { ShieldAlert, Plus, ArrowRight } from "lucide-react";
import { YuseongWorkReportTable } from "../../yuseong/YuseongWorkReportTable";

export const YuseongCustomSection = ({
  handleOpenYuseongReport,
  onNavigateTab,
  activeYuseongQualityCount = 0,
  currentProfile
}) => {
  return (
    <div className="space-y-3">
      {/* 🌟 유성 전용 외주가공 부적합경보 등록 & 3대 아이템 작업일보 (JK1 / CE1 / DT) 실시간 관리 */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-blue-500/60 shadow-md shadow-blue-950/40 flex items-center justify-between gap-2 min-w-0 max-w-full animate-fadeIn">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-black text-xs sm:text-sm text-white tracking-tight">
              유성 부적합경보 등록
            </span>
            <span className="hidden sm:inline text-[11px] text-blue-300 font-semibold truncate">
              (JK1 Part'g, CE1 Part'g, DT Hood 부적합경보 및 외주가공 실시간 관리)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* 🚨 부적합경보 입력 뱃지 */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab("quality_control");
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-pulse"
            title="유성 부적합경보 및 품질이슈 등록/관리"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 부적합경보</span>
            {activeYuseongQualityCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                {activeYuseongQualityCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenYuseongReport && handleOpenYuseongReport("JK1")}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>🚗 JK1 일보 작성</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenYuseongReport && handleOpenYuseongReport("CE1")}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>🚙 CE1 일보 작성</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenYuseongReport && handleOpenYuseongReport("DT")}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>⚡ DT Hood 일보 작성</span>
          </button>
        </div>
      </div>

      {/* Yuseong Work Reports Live Table */}
      <YuseongWorkReportTable
        onOpenReportModal={(proj, editData) => handleOpenYuseongReport && handleOpenYuseongReport(proj, editData)}
        currentWorkerName={currentProfile?.name || ""}
      />
    </div>
  );
};

export default YuseongCustomSection;
