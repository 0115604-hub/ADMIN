import React, { useMemo } from "react";
import { ShieldAlert, Plus } from "lucide-react";
import { BurimtechWorkReportTable } from "../../burimtech/BurimtechWorkReportTable";

export const BurimtechCustomSection = ({
  handleOpenWorkLogModal,
  handleOpenLogDetail,
  onNavigateTab,
  workLogs = [],
  currentProfile,
  isWorkLogApproved,
  pushModalHistory,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount = 0
}) => {
  return (
    <div className="space-y-3">
      {/* 🌟 부림텍 전용 외주가공 부적합경보 & 작업일보 배너 */}
      <div
        onClick={() => {
          if (setIsHanulQualityIssueModalOpen) setIsHanulQualityIssueModalOpen(true);
        }}
        className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-teal-500/60 shadow-md shadow-teal-950/40 flex items-center justify-between gap-2 min-w-0 max-w-full animate-fadeIn cursor-pointer"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-black text-xs sm:text-sm text-white tracking-tight">
              부림텍 부적합경보 등록
            </span>
            <span className="hidden sm:inline text-[11px] text-teal-300 font-semibold truncate">
              (한림공장 (주)부림텍 외주가공 실시간 작업일보 및 부적합경보 관리)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {/* 🚨 부적합경보 입력 버튼 */}
          <button
            type="button"
            onClick={() => {
              if (setIsHanulQualityIssueModalOpen) {
                setIsHanulQualityIssueModalOpen(true);
              } else if (onNavigateTab) {
                onNavigateTab("quality_control");
              }
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-pulse"
            title="부림텍 부적합경보 및 품질이슈 등록/관리"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 부적합경보 입력</span>
            {activeHanulQualityCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                {activeHanulQualityCount}
              </span>
            )}
          </button>

          {/* 📝 부림텍 작업일보 작성 버튼 */}
          {handleOpenWorkLogModal && (
            <button
              type="button"
              onClick={() => handleOpenWorkLogModal()}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>📝 부림텍 일보 작성</span>
            </button>
          )}
        </div>
      </div>

      {/* 부림텍 외주가공 실시간 작업일보 현황 패널 (한울과 동일한 스타일) */}
      <BurimtechWorkReportTable
        handleOpenWorkLogModal={handleOpenWorkLogModal}
        handleOpenLogDetail={handleOpenLogDetail}
        onNavigateTab={onNavigateTab}
        workLogs={workLogs}
        currentProfile={currentProfile}
        isWorkLogApproved={isWorkLogApproved}
      />
    </div>
  );
};

export default BurimtechCustomSection;
