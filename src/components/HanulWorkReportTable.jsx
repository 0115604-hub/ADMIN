import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  User,
  ArrowRight,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import {
  subscribeHanulWorkReports,
  deleteHanulWorkReport,
  exportHanulReportToExcel,
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_WORKERS_MASTER,
  isExcludedFromWorkReport
} from "../services/hanulWorkReportService";

export const HanulWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setReports(list || []);
    });
    return () => unsub();
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 🔒 관리자(김동훈, 황수현 등)는 작업일보 작성이 없으므로 실적 집계 및 현황 목록에서 제외
      if (isExcludedFromWorkReport(r.worker)) return false;
      if (projectFilter !== "all" && r.project !== projectFilter) return false;
      if (processFilter !== "all" && r.processId !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let bqcGenuine = 0;
    let bqcBad = 0;
    let lq2Genuine = 0;
    let lq2Bad = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine) || 0;
      const b = Number(r.totals?.bad) || 0;
      if (r.project === "9BQC") {
        bqcGenuine += g;
        bqcBad += b;
      } else {
        lq2Genuine += g;
        lq2Bad += b;
      }
    });

    const bqcGross = bqcGenuine + bqcBad;
    const bqcYield = bqcGross > 0 ? ((bqcGenuine / bqcGross) * 100).toFixed(1) : "100.0";

    const lq2Gross = lq2Genuine + lq2Bad;
    const lq2Yield = lq2Gross > 0 ? ((lq2Genuine / lq2Gross) * 100).toFixed(1) : "100.0";

    return { totalCount, bqcGenuine, bqcBad, bqcYield, lq2Genuine, lq2Bad, lq2Yield };
  }, [filteredReports]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("정말로 이 작업일보를 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteHanulWorkReport(id);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {/* Header & New Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>한울 외주가공 작업일보 현황</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                {filteredReports.length}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              9BQC G/RUN 및 LQ2a Hood Side 세부 공정 실시간 보고서 관리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("9BQC")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 9BQC 일보 작성</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("LQ2A")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ LQ2a 일보 작성</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">
            등록 일보 건수
          </span>
          <span className="text-lg font-black text-indigo-950 dark:text-indigo-100">
            {stats.totalCount} <span className="text-xs font-normal">건</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
              9BQC 정품 / 양품률
            </span>
            <span className="text-[10px] font-black text-emerald-600">
              {stats.bqcYield}%
            </span>
          </div>
          <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">
            {stats.bqcGenuine.toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
              LQ2a 정품 / 양품률
            </span>
            <span className="text-[10px] font-black text-purple-600">
              {stats.lq2Yield}%
            </span>
          </div>
          <span className="text-lg font-black text-purple-950 dark:text-purple-100">
            {stats.lq2Genuine.toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">
            총 불량 수량
          </span>
          <span className="text-lg font-black text-rose-950 dark:text-rose-100">
            {(stats.bqcBad + stats.lq2Bad).toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Project Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setProjectFilter("all"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              projectFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            전체 차종
          </button>
          <button
            type="button"
            onClick={() => { setProjectFilter("9BQC"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              projectFilter === "9BQC" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            <span>🚗 9BQC</span>
          </button>
          <button
            type="button"
            onClick={() => { setProjectFilter("LQ2A"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              projectFilter === "LQ2A" ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            <span>⚡ LQ2a</span>
          </button>
        </div>

        {/* Process Filter */}
        <select
          value={processFilter}
          onChange={(e) => setProcessFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
        >
          <option value="all">전체 공정</option>
          <option value="소재준비">소재준비 (정치절단/단컷팅)</option>
          <option value="조인트">조인트</option>
          <option value="본드로봇">본드로봇</option>
          <option value="검사">검사</option>
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold"
        />
        {searchDate && (
          <button
            type="button"
            onClick={() => setSearchDate("")}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            초기화
          </button>
        )}

        {/* Worker search */}
        <input
          type="text"
          placeholder="작업자 검색..."
          value={searchWorker}
          onChange={(e) => setSearchWorker(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold placeholder:text-slate-400"
        />
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black">
              <th className="p-3">작업일자</th>
              <th className="p-3">차종 / 부품</th>
              <th className="p-3">공정명</th>
              <th className="p-3">작업자</th>
              <th className="p-3 text-center">근무</th>
              <th className="p-3 text-right">정품 (EA)</th>
              <th className="p-3 text-right">불량 (EA)</th>
              <th className="p-3 text-right">리워크</th>
              <th className="p-3 text-center">양품률</th>
              <th className="p-3 text-center">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">
                  등록된 외주가공 작업일보가 없습니다. 상단의 [+ 일보 작성] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => {
                const isBQC = rep.project === "9BQC";
                const gCount = Number(rep.totals?.genuine) || 0;
                const bCount = Number(rep.totals?.bad) || 0;
                const rCount = Number(rep.totals?.rework) || 0;
                const yieldR = rep.totals?.yieldRate || "100.0";

                return (
                  <tr
                    key={rep.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(rep.project, rep.processId, rep)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {rep.date}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[11px] ${
                        isBQC
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      }`}>
                        {isBQC ? "🚗" : "⚡"} {rep.projectName || rep.project}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{rep.processName || rep.processId}</span>
                        {rep.subProcess && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {rep.subProcess === "정치절단" ? "✂️ 정치절단" : "📐 단컷팅"}
                          </span>
                        )}
                        {rep.jointType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {rep.jointType === "FRT" ? "🚗 FRT"
                              : rep.jointType === "FIXED_LH" ? "📐 FIXED LH"
                              : rep.jointType === "FIXED_RH" ? "📐 FIXED RH"
                              : "⚡ RR"}
                          </span>
                        )}
                        {rep.inspectionType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {rep.inspectionType === "LENGTH" ? "📏 길이검사"
                              : rep.inspectionType === "SQUARE" ? "📐 직각검사"
                              : rep.inspectionType === "FINAL_PAIR" ? "🏁 최종(LH/RH)"
                              : rep.inspectionType === "FINAL_LH" ? "🏁 최종(LH)"
                              : rep.inspectionType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {rep.worker}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        rep.shift === "야간"
                          ? "bg-slate-800 text-slate-200"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                      }`}>
                        {rep.shift || "주간"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {gCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {bCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {rCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-black whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded ${
                        Number(yieldR) >= 98
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40"
                          : "text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40"
                      }`}>
                        {yieldR}%
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportHanulReportToExcel(rep);
                          }}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="엑셀 다운로드"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportModal && onOpenReportModal(rep.project, rep.processId, rep);
                          }}
                          className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(rep.id, e)}
                          disabled={isDeleting === rep.id}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
