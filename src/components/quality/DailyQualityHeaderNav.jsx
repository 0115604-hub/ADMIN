import React from "react";
import {
  ShieldCheck,
  BarChart2,
  Target,
  Calendar,
  PlusCircle,
  Download
} from "lucide-react";

/**
 * DailyQualityHeaderNav
 * Top header component for DailyQualityView:
 * - Sub-tab switcher: [품질실적 대시보드] vs [목표관리 설정 (차종별 관리선)]
 * - Title and target indicator
 * - Month selector dropdown
 * - Direct input button (품질실적 직접입력)
 * - Target settings button
 * - Excel export button
 */
export const DailyQualityHeaderNav = ({
  activeQualityTab,
  setActiveQualityTab,
  targetOverall,
  selectedMonth,
  changeMonth,
  availableMonths,
  getPreviousYearMonth,
  handleOpenDirectInputModal,
  handleExportExcel,
}) => {
  return (
    <>
      {/* 0. SUB TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveQualityTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeQualityTab === "dashboard"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>품질실적 대시보드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQualityTab("target_settings")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeQualityTab === "target_settings"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Target className="w-4 h-4 text-amber-300" />
            <span>목표관리 설정 (차종별 관리선)</span>
            <span className="hidden md:inline-block px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30">
              전월대비 5%/10% 감축
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>당월 종합 목표: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{targetOverall}% 이하</strong></span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px] text-slate-400">전월({getPreviousYearMonth(selectedMonth)}) 실적 연동</span>
        </div>
      </div>

      {/* 1. TOP HEADER & MONTH SELECTION / EXPORT */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                품질현황 및 불량률 분석
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                실시간 정합 대시보드
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>품질 관리 목표치: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">종합 {targetOverall}% 이하</strong> (차종별 맞춤 관리선 적용)</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>담당: <strong className="text-slate-700 dark:text-slate-300 font-bold">이창엽 책임</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400">데이터 기준: 4개 코어 차종 (JA, HR, NX4, NX4a)</span>
            </p>
          </div>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={selectedMonth}
              onChange={(e) => changeMonth && changeMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              {(availableMonths || ["2026-09", "2026-08", "2026-07"]).map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {m.replace("-", "년 ")}월
                </option>
              ))}
            </select>
          </div>

          {/* Direct Input Button */}
          <button
            onClick={() => handleOpenDirectInputModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>품질실적 직접입력</span>
          </button>

          {/* Target Settings Button */}
          <button
            onClick={() => setActiveQualityTab("target_settings")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer border ${
              activeQualityTab === "target_settings"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Target className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>목표관리선 설정</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={() => handleExportExcel()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 출력</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DailyQualityHeaderNav;
