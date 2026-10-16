import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  User,
  Scissors
} from "lucide-react";
import {
  subscribeYuseongWorkReports,
  deleteYuseongWorkReport,
  exportYuseongReportToExcel,
  YUSEONG_PROJECTS
} from "../../services/yuseongWorkReportService";
import { getSampleInspectionStatus } from "../../utils/sampleInspectionUtils";

export const YuseongWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    const unsub = subscribeYuseongWorkReports((list) => {
      setReports(list || []);
    });
    return () => unsub();
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (projectFilter !== "all" && r.project !== projectFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, searchWorker, searchDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let jk1Gross = 0;
    let jk1Gen = 0;
    let ce1Gross = 0;
    let ce1Gen = 0;
    let dtGross = 0;
    let dtGen = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);

      if (r.project === "JK1") {
        jk1Gross += total;
        jk1Gen += g;
      } else if (r.project === "CE1") {
        ce1Gross += total;
        ce1Gen += g;
      } else if (r.project === "DT") {
        dtGross += total;
        dtGen += g;
      }
    });

    const jk1Yield = jk1Gross > 0 ? ((jk1Gen / jk1Gross) * 100).toFixed(1) : "100.0";
    const ce1Yield = ce1Gross > 0 ? ((ce1Gen / ce1Gross) * 100).toFixed(1) : "100.0";
    const dtYield = dtGross > 0 ? ((dtGen / dtGross) * 100).toFixed(1) : "100.0";

    return { totalCount, jk1Gross, jk1Yield, ce1Gross, ce1Yield, dtGross, dtYield };
  }, [filteredReports]);

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 유성 외주가공 작업일보를 영구 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteYuseongWorkReport(id);
    } catch (err) {
      console.error("Failed to delete yuseong report:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("다운로드할 유성 작업일보 데이터가 없습니다.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    exportYuseongReportToExcel(filteredReports, `유성_외주가공_작업일보_${today}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>(주)유성 외주가공 작업일보 실시간 관리 대장</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                총 {stats.totalCount}건
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              JK1 Part'g • CE1 Part'g • DT Hood 실시간 공정별 작업 실적 및 TPM 완료 내역
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="현재 목록 엑셀 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">엑셀 다운로드</span>
          </button>

          {onOpenReportModal && (
            <button
              type="button"
              onClick={() => onOpenReportModal("JK1")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>일보 신규작성</span>
            </button>
          )}
        </div>
      </div>

      {/* 3대 아이템별 핵심 실적 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <span>🚗 JK1 Part'g</span>
            </span>
            <div className="text-base font-black text-indigo-950 dark:text-indigo-100 mt-0.5">
              {stats.jk1Gross.toLocaleString()} EA
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold">양품률</span>
            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {stats.jk1Yield}%
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <span>🚙 CE1 Part'g</span>
            </span>
            <div className="text-base font-black text-blue-950 dark:text-blue-100 mt-0.5">
              {stats.ce1Gross.toLocaleString()} EA
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold">양품률</span>
            <div className="text-xs font-black text-blue-600 dark:text-blue-400">
              {stats.ce1Yield}%
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <span>⚡ DT Hood</span>
            </span>
            <div className="text-base font-black text-teal-950 dark:text-teal-100 mt-0.5">
              {stats.dtGross.toLocaleString()} EA
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold">양품률</span>
            <div className="text-xs font-black text-teal-600 dark:text-teal-400">
              {stats.dtYield}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: "all", label: "전체" },
            { id: "JK1", label: "JK1 Part'g" },
            { id: "CE1", label: "CE1 Part'g" },
            { id: "DT", label: "DT Hood" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProjectFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                projectFilter === item.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="작업자 검색..."
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-28 sm:w-36 focus:outline-indigo-500"
            />
          </div>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-indigo-500"
          />
          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate("")}
              className="text-[11px] text-slate-500 hover:text-rose-600 font-bold"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자 / 근무</th>
              <th className="py-2.5 px-3">작업자</th>
              <th className="py-2.5 px-3">아이템 / 공정</th>
              <th className="py-2.5 px-3 text-right">총생산(EA)</th>
              <th className="py-2.5 px-3 text-right">정품(EA)</th>
              <th className="py-2.5 px-3 text-right">불량(EA)</th>
              <th className="py-2.5 px-3 text-center">양품률</th>
              <th className="py-2.5 px-3 text-center">초·중·종물 검사</th>
              <th className="py-2.5 px-3 text-center">TPM 점검</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  등록된 유성 작업일보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => {
                const genuine = Number(rep.totals?.genuine ?? rep.genuineQty ?? 0) || 0;
                const bad = Number(rep.totals?.bad ?? rep.badQty ?? 0) || 0;
                const total = Number(rep.totals?.total ?? rep.totalQty ?? (genuine + bad)) || (genuine + bad);
                const yieldPct = total > 0 ? ((genuine / total) * 100).toFixed(1) : "100.0";
                const insp = getSampleInspectionStatus(rep);
                const isTpmOk = rep.tpmChecked || rep.tpmStatus === "OK";

                return (
                  <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <div>{rep.date}</div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          rep.shift === "야간"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {rep.shift || "주간"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {rep.worker || "유성"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-black text-indigo-600 dark:text-indigo-400">
                        {rep.project === "JK1"
                          ? "🚗 JK1 Part'g"
                          : rep.project === "CE1"
                          ? "🚙 CE1 Part'g"
                          : "⚡ DT Hood"}
                      </div>
                      <div className="text-[11px] text-slate-500">{rep.processId || rep.process || "소재준비"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {genuine.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {bad.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-700 dark:text-slate-300">
                      {yieldPct}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          insp.isComplete
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {insp.label || (insp.isComplete ? "검사완료" : "검사중")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isTpmOk
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {isTpmOk ? "TPM 완료" : "미점검"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(rep.id, e)}
                        disabled={isDeleting === rep.id}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="작업일보 삭제"
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
    </div>
  );
};

export default YuseongWorkReportTable;
