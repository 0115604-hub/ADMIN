import React from "react";
import {
  Clock,
  FileSpreadsheet,
  FileText,
  Building2,
  UserPlus,
  UserMinus
} from "lucide-react";

export const OvertimeTopSection = ({
  currentMonthNum,
  selectedDay,
  activeTab,
  setActiveTab,
  setDetailSubTab,
  selectedMonth,
  setMatrixViewMonth,
  legacyReports = [],
  unwrittenCompanies = [],
  smartData = {},
  COMPANIES = [],
  cleanCompanyName,
  selectedCompanyFilter,
  handleSelectCompanyAttendanceTable,
  dailySummary = {},
  isWeekendDay,
  handleOpenManageWorkers,
  setQuickNewWorkerName,
  setQuickNewWorkerLine,
  handleOpenAbsence4M
}) => {
  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-700 shadow-xl text-white space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>근태현황 및 관리</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40">
                {currentMonthNum}월 {selectedDay}일 기준
              </span>
            </h1>
          </div>
        </div>

        {/* 🧭 탭 네비게이션: [📊 상세] | [📑 특근보고서 관리] */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
          {/* 1. 상세 */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === "detail" || activeTab === "monthly_matrix" || activeTab === "daily_summary" || activeTab === "worker_management") {
                setActiveTab("daily_input");
              } else {
                setActiveTab("detail");
                setDetailSubTab("monthly_matrix");
                setMatrixViewMonth(selectedMonth || "2026-10");
              }
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "detail" || activeTab === "monthly_matrix" || activeTab === "daily_summary" || activeTab === "worker_management"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>상세</span>
          </button>

          {/* 2. 특근보고서 관리 (5개사 개별 상신) */}
          <button
            type="button"
            onClick={() => setActiveTab("legacy_reports")}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "legacy_reports"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>특근보고서 관리</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === "legacy_reports"
                ? "bg-purple-100 text-purple-900"
                : "bg-purple-950 text-purple-300 border border-purple-800"
            }`}>
              {legacyReports.length}건
            </span>
          </button>
        </div>
      </div>

      {/* ⭐ TOP 5 COMPANY SUMMARY CARDS (오륙, 유성, 조영, 한울, 부림텍) */}
      <div className="pt-1">
        <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5개 협력사별 근태 현황 ({currentMonthNum}월 {selectedDay}일 기준)</span>
            </h3>
            {unwrittenCompanies.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 flex items-center gap-1"
                title="당일 근태대장 미작성 협력사 목록입니다."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <span>미작성: {unwrittenCompanies.map((c) => c.shortName).join(", ")} (작성전)</span>
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            전체 총원: <strong className="text-white font-mono">{smartData.attendanceMatrix?.length || 0}명</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {COMPANIES.map((compName) => {
            const cleanComp = cleanCompanyName(compName);
            const isSelectedCompany = activeTab === "daily_input" && cleanCompanyName(selectedCompanyFilter) === cleanComp;
            const breakdown = dailySummary.companyBreakdown?.[cleanComp] || dailySummary.companyBreakdown?.[compName] || {
              total: 0,
              attended: 0,
              regular: 0,
              ot19: 0,
              ot21: 0,
              ot22: 0,
              specialNight: 0,
              absent: 0,
              leave: 0,
              otWorkers: 0,
              otHours: 0,
              totalHours: 0
            };
            const dotColor = cleanComp === "오륙" ? "bg-blue-400" :
              cleanComp === "유성" ? "bg-cyan-400" :
              cleanComp === "조영" ? "bg-purple-400" :
              cleanComp === "한울" ? "bg-emerald-400" : "bg-amber-400";

            const otWorkersCount = breakdown.otWorkers || 0;
            const absentCount = breakdown.absent || 0;

            return (
              <div
                key={compName}
                onClick={() => handleSelectCompanyAttendanceTable(compName)}
                className={`rounded-2xl p-3 border transition-all duration-200 shadow-md flex flex-col justify-between cursor-pointer group active:scale-98 space-y-2 ${
                  isSelectedCompany
                    ? "bg-slate-900 border-2 border-cyan-400 ring-2 ring-cyan-400/25 shadow-cyan-950/50"
                    : "bg-slate-950/90 hover:bg-slate-900 border-slate-700/80 hover:border-cyan-400"
                }`}
                title={`탭하면 [${compName}] 근태 선택 테이블로 즉시 전환됩니다`}
              >
                {/* 상단: 회사명 및 작성상태 미니 배지 */}
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80">
                  <span className={`font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors truncate ${
                    isSelectedCompany ? "text-cyan-300" : "text-white group-hover:text-cyan-300"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    {compName}
                  </span>
                  {(() => {
                    const isUnwritten = unwrittenCompanies.some((c) => cleanCompanyName(c.name) === cleanComp || c.shortName === compName || c.name === compName);
                    const isWritten = !isUnwritten;
                    if (isWritten) {
                      return (
                        <span
                          className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-black flex items-center gap-1 shrink-0 shadow-2xs"
                          title="당일 근태 등록 완료 (작성후)"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          <span>작성후</span>
                        </span>
                      );
                    }
                    return (
                      <span
                        className="text-[9.5px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold flex items-center gap-1 shrink-0 shadow-2xs"
                        title="당일 근태 미작성 (작성전)"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                        <span>작성전</span>
                      </span>
                    );
                  })()}
                </div>

                {/* 🎯 포인트 작은 패널: 출근현황 (평일) / 특근현황 (주말/휴무일) */}
                {isWeekendDay(selectedDay) ? (
                  <div className="bg-slate-900/90 py-1.5 px-2.5 rounded-xl border border-slate-800 flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <span>🌴 특근현황</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs font-black">
                      <span className="text-cyan-400">특근:{breakdown.attended}명</span>
                      <span className="text-slate-400">
                        미출근:{Math.max(0, breakdown.total - breakdown.attended)}명
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`py-1.5 px-2.5 rounded-xl border flex items-center justify-between shadow-xs ${
                    absentCount > 0
                      ? "bg-slate-900/95 border-rose-600/70"
                      : "bg-slate-900/90 border-slate-800"
                  }`}>
                    <span className="text-[11px] font-bold text-slate-300">출근현황</span>
                    <div className="flex items-center gap-2 font-mono text-xs font-black">
                      <span className="text-white">총원:{breakdown.total}명</span>
                      <span className={absentCount > 0 ? "text-rose-400 font-black animate-pulse" : "text-slate-400"}>
                        결근:{absentCount}명
                      </span>
                    </div>
                  </div>
                )}

                {/* ⏱️ 당일 잔업/특근 투입 */}
                <div className="bg-slate-900/70 py-1.5 px-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isWeekendDay(selectedDay) ? "당일 특근투입" : "당일 잔업투입"}</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono font-black text-xs">
                    <span className="text-amber-400 font-bold">
                      {isWeekendDay(selectedDay) ? `${breakdown.attended}명` : `${otWorkersCount}명`}
                    </span>
                    {isWeekendDay(selectedDay) ? (
                      breakdown.totalHours > 0 && (
                        <span className="text-[10px] text-purple-400 font-normal">({breakdown.totalHours}H)</span>
                      )
                    ) : (
                      breakdown.otHours > 0 && (
                        <span className="text-[10px] text-amber-500/90 font-normal">(+{breakdown.otHours}H)</span>
                      )
                    )}
                  </div>
                </div>

                {/* 🔘 하단 액션 버튼: [인원관리] & [결근관리] */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenManageWorkers(compName);
                      setQuickNewWorkerName("");
                      setQuickNewWorkerLine("압출");
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500 font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="근로자 추가 및 삭제 관리"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>인원관리</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAbsence4M(compName);
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      absentCount > 0
                        ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-600/80 hover:border-rose-400 ring-1 ring-rose-500/50"
                        : "bg-slate-800/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border-slate-700/80 hover:border-rose-500"
                    }`}
                    title="결근 관리 및 대체인원 투입 (변동점 MAN 연동)"
                  >
                    <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                    <span>결근관리</span>
                    {absentCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                        {absentCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
