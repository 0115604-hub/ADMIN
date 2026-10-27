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
      {/* 🌟 한울 전용: [전월 지출내역 등록] + [한울 부적합경보 등록] 한줄짜리 통합 패널 (9BQC/LQ2a 작성 뱃지 삭제) */}
      {(isHanul || isAdmin) && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-emerald-950/85 via-slate-900 to-indigo-950/85 text-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border-2 border-indigo-500/50 shadow-md shadow-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 min-w-0 max-w-full animate-fadeIn divide-y md:divide-y-0 md:divide-x divide-slate-700/60">
            {/* 좌측: 전월 지출내역 등록 */}
            <div
              onClick={handleOpenHanulSettlementModal}
              className="flex items-center justify-between gap-2 flex-1 min-w-0 w-full md:w-auto md:pr-3 cursor-pointer group"
              title="탭하여 공통비 및 지출내역 항목별 등록 팝업 열기"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-xs sm:text-sm text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    전월 지출내역 등록
                  </span>
                  <span className="hidden xl:inline text-[11px] text-emerald-300/80 font-medium truncate">
                    (공통비 및 지출 공제내역 항목별 등록 / 영수증 증빙 확인)
                  </span>
                </div>
              </div>

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

            {/* 우측: 한울 부적합경보 등록 (9BQC / LQ2a 작성 뱃지 삭제 완료) */}
            <div
              onClick={() => setIsHanulQualityIssueModalOpen(true)}
              className="flex items-center justify-between gap-2 flex-1 min-w-0 w-full md:w-auto md:pl-3 pt-2 md:pt-0 cursor-pointer group"
              title="한울 부적합경보 및 품질이슈 등록/관리"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-xs sm:text-sm text-white tracking-tight group-hover:text-rose-300 transition-colors">
                    한울 부적합경보 등록
                  </span>
                  <span className="hidden xl:inline text-[11px] text-purple-300 font-medium truncate">
                    (9BQC G/RUN & LQ2a Hood Side 부적합경보 및 가공/협력업체 실시간 관리)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHanulQualityIssueModalOpen(true);
                  }}
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
              </div>
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
