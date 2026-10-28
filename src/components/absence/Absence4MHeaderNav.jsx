import React from "react";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  UserX,
  UserCheck,
  Calendar,
  Search
} from "lucide-react";
import {
  COMPANIES,
  cleanCompanyName
} from "../../services/overtimeSmartService.js";

/**
 * Absence4MHeaderNav
 * 4M 결근 관리 모달의 헤더, 일자 네비게이션, 검색창, 협력사별 탭 및 KPI 미니 대시보드
 */
export default function Absence4MHeaderNav({
  currentYear,
  currentMonth,
  modalDay,
  setModalDay,
  onClose,
  searchTerm,
  setSearchTerm,
  selectedCompanyTab,
  setSelectedCompanyTab,
  detectedAbsentWorkers,
  metrics
}) {
  return (
    <>
      {/* 🏆 모달 헤더 */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black">
                4M Man 변경점
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>결근 관리 및 대체인원 투입</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {currentYear}년 {currentMonth}월 {modalDay}일
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🎛️ 일자 네비게이션 & 실시간 검색 툴바 */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* 일자 네비게이션 */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setModalDay((prev) => (prev > 1 ? prev - 1 : 31))}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            title="이전 일자로 이동"
          >
            ◀
          </button>
          <select
            value={modalDay}
            onChange={(e) => setModalDay(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 font-bold font-mono cursor-pointer"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {currentMonth}월 {d}일
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setModalDay((prev) => (prev < 31 ? prev + 1 : 1))}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            title="다음 일자로 이동"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date().getDate();
              setModalDay(today);
            }}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 font-bold text-[11px] transition-all ml-0.5 cursor-pointer"
          >
            오늘
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="작업자/회사/공정 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white text-xs font-bold placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 🏢 회사별 탭 네비게이션 & 통계 요약 바 */}
      <div className="bg-slate-900/90 p-3 sm:p-4 border-b border-slate-800 space-y-3">
        {/* 회사 선택 필터 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {COMPANIES.map((comp) => {
            const compAbsentCount = detectedAbsentWorkers.filter(
              (w) => cleanCompanyName(w.company) === comp
            ).length;
            const isSelected = selectedCompanyTab === comp;
            return (
              <button
                key={comp}
                type="button"
                onClick={() => setSelectedCompanyTab(comp)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-rose-900/40 shadow-md ring-2 ring-rose-400/50"
                    : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/80"
                }`}
              >
                <span>{comp}</span>
                {compAbsentCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? "bg-white text-rose-700"
                        : "bg-rose-950 text-rose-300 border border-rose-700 animate-pulse"
                    }`}
                  >
                    {compAbsentCount}명 결근
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* KPI 미니 대시보드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span>당일 결근 인원</span>
            </span>
            <span className="font-mono font-black text-rose-400 text-sm">{metrics.totalAbsent}건</span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>대체 투입 완료</span>
            </span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {metrics.completedSubs}건
            </span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>초물 한도검사</span>
            </span>
            <span className="font-mono font-black text-cyan-400 text-sm">
              {metrics.firstPieceDone}건 완료
            </span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>4M 고위험 주의</span>
            </span>
            <span
              className={`font-mono font-black text-sm ${
                metrics.highRisks > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"
              }`}
            >
              {metrics.highRisks}건
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
