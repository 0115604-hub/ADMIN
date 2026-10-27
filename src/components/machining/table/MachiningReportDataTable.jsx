import React from "react";
import { Download, Trash2 } from "lucide-react";
import { exportMachiningReportToExcel } from "../../../services/machiningWorkReportService";

export const MachiningReportDataTable = ({
  filteredReports,
  onOpenReportModal,
  handleDelete,
  isDeleting
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
            <th className="py-2.5 px-3">일자</th>
            <th className="py-2.5 px-3">차종</th>
            <th className="py-2.5 px-3">공정</th>
            <th className="py-2.5 px-3">작업자</th>
            <th className="py-2.5 px-3 text-right">정품수량</th>
            <th className="py-2.5 px-3 text-right">불량</th>
            <th className="py-2.5 px-3 text-center">수율</th>
            <th className="py-2.5 px-3 text-center">작업일보양식</th>
            <th className="py-2.5 px-3 text-center">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredReports.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-slate-400 font-bold">
                등록된 가공동 작업일보가 없습니다. 상단의 [+ 일보] 버튼을 클릭해 등록해 주십시오.
              </td>
            </tr>
          ) : (
            filteredReports.map((r) => {
              const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
              const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
              const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
              const yieldRate = total > 0 ? ((g / total) * 100).toFixed(1) : "100.0";
              const isAssigned = Boolean(r.assignedTemplateId || r.assignedSlotKey);

              return (
                <tr
                  key={r.id}
                  onClick={() => onOpenReportModal && onOpenReportModal(r.project, r.processId, r)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {r.date}
                  </td>
                  <td className="py-2.5 px-3 font-black">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        r.project === "HR"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : r.project === "JA"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      }`}
                    >
                      {r.project === "NX4A" ? "NX5a" : r.project}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                    {r.processId || r.processName || "소재준비"}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">
                    {r.worker}
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
                    {isAssigned ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                        표준5대양식
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        기본양식
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => exportMachiningReportToExcel(r)}
                        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                        title="엑셀 다운로드"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(r.id, e)}
                        disabled={isDeleting === r.id}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="일보 영구 삭제"
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
  );
};

export default MachiningReportDataTable;
