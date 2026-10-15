import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const AttendanceSummarySection = ({
  todayFormattedLabel,
  unwrittenCompanies = [],
  onNavigateTab,
  companyOverviewStats = [],
  pendingApprovalCards = [],
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
            <span>2. 근태현황 및 관리</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shrink-0">
            {todayFormattedLabel}
          </span>
          {/* ⭐ 미작성 업체 표기 배지 */}
          {unwrittenCompanies.length > 0 ? (
            <span
              className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0 flex items-center gap-1"
              title="당일 근태대장 미작성 협력사 목록입니다."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>미작성: {unwrittenCompanies.map((c) => c.shortName).join(", ")} (작성전)</span>
            </span>
          ) : (
            <span
              className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 flex items-center gap-1"
              title="5개 협력사 전원 작성 완료되었습니다."
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>5개사 전원 작성완료</span>
            </span>
          )}
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab("overtime_status")}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/80 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs font-black border border-cyan-400 dark:border-cyan-600 ring-2 ring-cyan-400/40 shadow-xs shadow-cyan-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-cyan-500"></span>
            </span>
            <span>근태 상세</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-600 dark:text-cyan-400" />
          </button>
        )}
      </div>

      {/* 5 Company + TOTAL Today Overview Cards - Simple & Slim 2-Metric Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {companyOverviewStats.map((comp) => (
          <div
            key={comp.name}
            onClick={() => onNavigateTab && onNavigateTab("overtime_status")}
            className={`p-2 sm:p-2.5 rounded-xl ${
              comp.isTotal
                ? "bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-300/90 dark:border-cyan-700/80 shadow-xs"
                : "bg-slate-50 dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800"
            } ${comp.borderHover} transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer group flex flex-col justify-between space-y-1.5 min-w-0`}
            title={comp.isTotal ? "클릭 시 전회사 근태/잔업 상세대장으로 이동" : "클릭 시 5개사 근태/잔업 대장 상세관리로 이동"}
          >
            {/* Header: Company Name & 작성상태 미니 배지 */}
            <div
              className={`flex items-center justify-between gap-1 pb-1 border-b ${
                comp.isTotal
                  ? "border-cyan-200/80 dark:border-cyan-800/80"
                  : "border-slate-200/70 dark:border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-2 h-2 rounded-full ${comp.dot} shrink-0`}></span>
                <span
                  className={`font-black text-xs sm:text-sm truncate transition-colors ${
                    comp.isTotal
                      ? "text-cyan-900 dark:text-cyan-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300"
                      : "text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300"
                  }`}
                >
                  {comp.name}
                </span>
              </div>
              {comp.isTotal ? (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                    unwrittenCompanies.length === 0
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                      : "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700"
                  }`}
                >
                  {unwrittenCompanies.length === 0 ? "전사 완료" : `${5 - unwrittenCompanies.length}/5 완료`}
                </span>
              ) : comp.isWritten ? (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black flex items-center gap-0.5 shrink-0 shadow-2xs"
                  title="작성완료"
                >
                  <span>✅</span>
                </span>
              ) : (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 flex items-center gap-0.5 ${comp.statusBadgeClass}`}
                >
                  <span>{comp.statusBadgeText}</span>
                </span>
              )}
            </div>

            {/* 2 Simple & Slim Metrics: 1. 전체 근로 대비 출근 인원 / 2. 잔업 투입 인원 */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. 출근 현황 */}
              <div
                className={`p-1.5 rounded-lg border text-center flex flex-col justify-center ${
                  comp.isTotal
                    ? "bg-white dark:bg-slate-900/90 border-cyan-200 dark:border-cyan-800"
                    : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/90"
                }`}
              >
                <div
                  className={`text-[9.5px] font-bold ${
                    comp.isTotal ? "text-cyan-700 dark:text-cyan-300" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  출근 현황
                </div>
                <div className="font-mono text-[9.5px] sm:text-[10.5px] leading-tight mt-0.5 flex flex-wrap items-center justify-center gap-1 font-bold">
                  <span className="text-slate-700 dark:text-slate-200 whitespace-nowrap">총원:{comp.workers}명</span>
                  <span
                    className={`whitespace-nowrap ${
                      comp.absent > 0
                        ? "text-rose-600 dark:text-rose-400 font-black animate-pulse"
                        : "text-slate-400 dark:text-slate-500 font-medium"
                    }`}
                  >
                    결근:{comp.absent}명
                  </span>
                </div>
              </div>

              {/* 2. 잔업 투입 인원 */}
              <div
                className={`p-1.5 rounded-lg border text-center flex flex-col justify-center ${
                  comp.isTotal
                    ? "bg-white dark:bg-slate-900/90 border-cyan-200 dark:border-cyan-800"
                    : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/90"
                }`}
              >
                <div
                  className={`text-[9.5px] font-bold ${
                    comp.isTotal ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  잔업 투입
                </div>
                <div className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                  {comp.otWorkers}
                  <span className="text-[9.5px] font-bold ml-0.5 text-slate-500">명</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ⭐ 공장별/문서별 미결재 특근보고서 뱃지 */}
      {pendingApprovalCards.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
          {pendingApprovalCards.map((report) => {
            const isHal = report.isHallim || report.plant === "한림공장";
            const plantBadgeBg = isHal
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-[#e59b2c] hover:bg-[#d4891b] text-white";
            const dateBorderBg = isHal
              ? "bg-slate-900/95 text-emerald-400 border border-emerald-500/70"
              : "bg-slate-900/95 text-[#f5a623] border border-[#a8651a]/80";

            const formattedDate =
              (formatKoreanWorkDate && formatKoreanWorkDate(report.workDate)) ||
              report.workDateFormatted ||
              report.workDate ||
              "";
            const statusText = report.statusLabel || "결재진행중";
            const isHold = statusText === "결재보류";
            const isApproved = statusText === "결재완료";
            const statusBadgeClass = isApproved
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-600/70"
              : isHold
              ? "bg-amber-950/90 text-amber-300 border-amber-600/70"
              : "bg-[#5c1322]/90 text-[#ff8097] border border-[#a8253d]/80";

            return (
              <div
                key={report.id}
                className="inline-flex items-center gap-1.5 p-1 px-1.5 rounded-lg bg-slate-900/80 dark:bg-slate-950/90 border border-slate-700/80 hover:border-amber-500/80 shadow-xs hover:shadow-md transition-all group"
              >
                {/* 1. 공장명 (회사명) & 날짜 뱃지 */}
                <button
                  type="button"
                  onClick={() => {
                    if (pushModalHistory) pushModalHistory("special_workers_modal");
                    if (setSelectedOvertimeReportForModal) setSelectedOvertimeReportForModal(report);
                  }}
                  className="inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                  title="클릭 시 특근 투입 근로자 명단 보기"
                >
                  <span className={`px-2.5 py-0.8 rounded text-[11px] sm:text-xs font-black shrink-0 shadow-2xs ${plantBadgeBg}`}>
                    {report.badgeLabel || `${report.plant} 특근`}
                  </span>
                  {formattedDate && (
                    <span className={`px-2.5 py-0.8 rounded text-[11px] sm:text-xs font-black shrink-0 font-mono tracking-tight ${dateBorderBg}`}>
                      {formattedDate}
                    </span>
                  )}
                </button>

                {/* 2. 결재 상태 뱃지 */}
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("electronic_approval");
                  }}
                  className={`px-2.5 py-0.8 rounded text-[10.5px] sm:text-xs font-black shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-all flex items-center gap-1 ${statusBadgeClass}`}
                  title="클릭 시 전자결재함으로 바로 이동"
                >
                  <span>{statusText}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
