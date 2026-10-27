import React from "react";
import { Filter, Calendar, Search, Plus } from "lucide-react";

export const MachiningTableFilterBar = ({
  projectFilter,
  setProjectFilter,
  processFilter,
  setProcessFilter,
  searchDate,
  setSearchDate,
  searchWorker,
  setSearchWorker,
  hideCreateButtons,
  currentWorkerName,
  onOpenReportModal
}) => {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 차종 필터 */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">전체 차종</option>
            <option value="HR">🚚 HR G/RUN</option>
            <option value="JA">🚗 JA G/RUN</option>
            <option value="NX5A">⚡ NX5a G/RUN</option>
            <option value="NX4">🚙 NX4 G/RUN</option>
          </select>
        </div>

        {/* 공정 필터 */}
        <select
          value={processFilter}
          onChange={(e) => setProcessFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <option value="all">전체 공정</option>
          <option value="소재준비">소재준비</option>
          <option value="조인트">조인트</option>
          <option value="본드로봇">본드로봇</option>
          <option value="검사">검사</option>
        </select>

        {/* 날짜 필터 */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="text-xs bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 font-bold"
          />
          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate("")}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* 작업자 검색 */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="작업자명 검색"
            value={searchWorker}
            onChange={(e) => setSearchWorker(e.target.value)}
            className="text-xs bg-transparent border-0 outline-none w-24 sm:w-28 text-slate-700 dark:text-slate-200 font-bold"
          />
          {searchWorker && (
            <button
              type="button"
              onClick={() => setSearchWorker("")}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 신규 일보 작성 버튼들 */}
      {!hideCreateButtons && currentWorkerName !== "윤경수" && currentWorkerName !== "양인나" && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("HR", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ HR 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("JA", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ JA 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("NX5A", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ NX5a 일보</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MachiningTableFilterBar;
