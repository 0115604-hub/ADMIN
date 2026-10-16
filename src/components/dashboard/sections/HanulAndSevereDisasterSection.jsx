import React from "react";
import {
  Receipt,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { HanulWorkReportTable } from "../../HanulWorkReportTable";

export const HanulAndSevereDisasterSection = ({
  isHanul,
  isAdmin,
  handleOpenHanulSettlementModal,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount = 0,
  handleOpenHanulReport,
  currentProfile,
  SevereDisasterBar
}) => {
  return (
    <>
      {/* 🌟 한울 전용 전월 지출내역 등록 (한울 로그인 시에만 표시, admin은 표시 안 함) */}
      {isHanul && !isAdmin && (
        <div
          onClick={handleOpenHanulSettlementModal}
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-emerald-500/60 shadow-md shadow-emerald-950/40 flex items-center justify-between gap-2 min-w-0 max-w-full animate-fadeIn cursor-pointer hover:border-emerald-400 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-black text-xs sm:text-sm text-white tracking-tight">
                전월 지출내역 등록
              </span>
              <span className="hidden sm:inline text-[11px] text-emerald-300/80 font-semibold truncate">
                (공통비 및 지출 공제내역 항목별 등록 / 영수증 증빙 확인)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenHanulSettlementModal();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black ring-2 ring-emerald-300/60 shadow-sm shadow-emerald-500/30 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="탭하여 공통비 및 지출내역 항목별 등록 팝업 열기"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
              </span>
              <span>입력상세</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950 font-black" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 한울 전용 외주가공 품질경보 등록 & 작업일보 (9BQC / LQ2a) 실시간 관리 */}
      {(isHanul || isAdmin) && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-500/60 shadow-md shadow-indigo-950/40 flex items-center justify-between gap-2 min-w-0 max-w-full animate-fadeIn">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-white tracking-tight">
                  한울 부적합경보 등록
                </span>
                <span className="hidden sm:inline text-[11px] text-purple-300 font-semibold truncate">
                  (9BQC G/RUN & LQ2a Hood Side 부적합경보 및 외주가공 실시간 관리)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* 🚨 부적합경보 입력 뱃지 */}
              <button
                type="button"
                onClick={() => setIsHanulQualityIssueModalOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-pulse"
                title="한울 부적합경보 및 품질이슈 등록/관리"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>🚨 부적합경보 입력</span>
                {activeHanulQualityCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                    {activeHanulQualityCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenHanulReport("9BQC")}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>🚗 9BQC 일보 작성</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenHanulReport("LQ2A")}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>⚡ LQ2a 일보 작성</span>
              </button>
            </div>
          </div>

          {/* Hanul Work Reports Live Table */}
          <HanulWorkReportTable
            onOpenReportModal={(proj, proc, rep) => handleOpenHanulReport(proj, proc, rep)}
            currentWorkerName={currentProfile?.name || ""}
          />
        </div>
      )}

      {/* 🚨 [두번째 배치] 중대재해공유판 */}
      {SevereDisasterBar && <SevereDisasterBar />}
    </>
  );
};
