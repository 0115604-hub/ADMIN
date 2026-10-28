import React from "react";
import { Filter, Calendar, Search, Download, Plus, Trash2 } from "lucide-react";
import { MachiningIncidentSortingBar } from "../../machining/table/MachiningIncidentSortingBar";

/**
 * YuseongReportListView
 * 종합 통계 카드, 당일 비가동/부적합 소팅 바, 검색/필터 툴바 및 실시간 테이블 목록 뷰
 */
export default function YuseongReportListView({
  stats,
  incidentStats,
  yuseongIncidents,
  handleSortIncident,
  projectFilter,
  setProjectFilter,
  searchDate,
  setSearchDate,
  searchWorker,
  setSearchWorker,
  handleExportExcel,
  onOpenReportModal,
  filteredReports,
  isDeleting,
  handleDelete
}) {
  return (
    <>
      {/* 종합 통계 카드 3종 (JK1, CE1, DT HOOD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* JK1 */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <span>🚗</span> <span>JK1 Part'g (PARTING)</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              수율 {stats.jk1Yield}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.jk1Gen.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              총 {stats.jk1Gross.toLocaleString()} EA
            </span>
          </div>
        </div>

        {/* CE1 */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border border-blue-200/80 dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <span>🚙</span> <span>CE1 Part'g (PARTING)</span>
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              수율 {stats.ce1Yield}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.ce1Gen.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              총 {stats.ce1Gross.toLocaleString()} EA
            </span>
          </div>
        </div>

        {/* DT HOOD */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <span>⚡</span> <span>DT Hood (HOOD W/STRIP)</span>
            </span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
              수율 {stats.dtYield}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.dtGen.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              총 {stats.dtGross.toLocaleString()} EA
            </span>
          </div>
        </div>
      </div>

      {/* 2단계 생산공정: 당일 유성 비가동 · 부적합 1차 소팅 바 */}
      <MachiningIncidentSortingBar
        incidentStats={incidentStats}
        machiningIncidents={yuseongIncidents}
        handleSortIncident={handleSortIncident}
        title="당일 유성(삼랑진) 비가동 · 부적합 1차 소팅"
        emptyText="🟢 오늘 접수된 유성 일보에 비가동 및 부적합 내역이 없습니다. (정상 가동 중)"
      />

      {/* Filter and Actions Bar */}
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
              <option value="JK1">🚗 JK1 Part'g</option>
              <option value="CE1">🚙 CE1 Part'g</option>
              <option value="DT">⚡ DT Hood</option>
            </select>
          </div>

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

        {/* 엑셀 다운로드 및 일보 작성 버튼들 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("JK1")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ JK1 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("CE1")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ CE1 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("DT")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ DT HOOD 일보</span>
          </button>
        </div>
      </div>

      {/* 실시간 테이블 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">차종/아이템</th>
              <th className="py-2.5 px-3">작업자</th>
              <th className="py-2.5 px-3 text-right">총수량</th>
              <th className="py-2.5 px-3 text-right">정품수량</th>
              <th className="py-2.5 px-3 text-right">불량수량</th>
              <th className="py-2.5 px-3 text-center">수율</th>
              <th className="py-2.5 px-3 text-center">TPM점검</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400 font-bold">
                  등록된 유성 가공/협력업체 작업일보가 없습니다. 상단의 [+ 일보] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => {
                const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
                const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
                const total = Number(r.totals?.total ?? r.totalQty ?? g + b) || g + b;
                const yieldRate = total > 0 ? ((g / total) * 100).toFixed(1) : "100.0";
                const isTpmDone = Boolean(r.tpmCompleted || r.tpmChecks);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(r.project, r)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 font-black">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          r.project === "JK1"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                            : r.project === "CE1"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                        }`}
                      >
                        {r.project === "DT" ? "DT HOOD" : r.project}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">
                      {r.worker}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {total.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {g.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      {b.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          parseFloat(yieldRate) >= 98
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {yieldRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isTpmDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          TPM완료
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          미점검
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(r.id, e)}
                        disabled={isDeleting === r.id}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="일보 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
