import React from "react";
import {
  CheckCircle2,
  X,
  Users,
  FileSignature
} from "lucide-react";
import { formatKoreanWorkDate } from "../../../services/overtimeService";

export default function OvertimeReportDetailModal({
  selectedOvertimeReportForModal,
  setSelectedOvertimeReportForModal,
  getReportWorkersList,
  onNavigateTab
}) {
  if (!selectedOvertimeReportForModal) return null;

        const rep = selectedOvertimeReportForModal;
        const workers = getReportWorkersList(rep);
        const formattedDate = formatKoreanWorkDate(rep.workDate) || rep.workDateFormatted || rep.workDate || "";
        const statusText = rep.statusLabel || "결재진행중";
        const isApproved = statusText === "결재완료";
        const isHold = statusText === "결재보류";
        const statusBadgeClass = isApproved
          ? "bg-emerald-950 text-emerald-300 border-emerald-700"
          : isHold
          ? "bg-amber-950 text-amber-300 border-amber-700"
          : "bg-rose-950 text-rose-300 border-rose-700";

        return (
          <div
            onClick={() => setSelectedOvertimeReportForModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-2xl w-full border-2 border-amber-500/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default animate-in zoom-in-95 duration-150"
            >
              {/* Modal Header */}
              <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2 flex-wrap">
                      <span>{rep.badgeLabel || `${rep.plant} 특근보고서`}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                        특근 {workers.length}명
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-400 font-medium">
                      <span>📅 {formattedDate}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded border font-bold text-[10px] ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                      <span>•</span>
                      <span>작성자: <strong className="text-slate-200">{rep.author}</strong> {rep.authorTitle || "선임"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOvertimeReportForModal(null);
                        onNavigateTab("electronic_approval");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>⚡ 전자결재 이동 및 승인</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOvertimeReportForModal(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Workers List Table */}
              <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>당일 특근 투입 근로자 명단</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    총 {workers.length}명 배속
                  </span>
                </div>

                {workers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold bg-slate-950/50 rounded-xl border border-slate-800">
                    등록된 특근 근로자 세부 내역이 없습니다.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3 text-center w-12 text-slate-500 font-mono">No</th>
                          <th className="py-2 px-3 w-28">성명</th>
                          <th className="py-2 px-3 w-24">소속 부서</th>
                          <th className="py-2 px-3 w-28">공정 / 라인</th>
                          <th className="py-2 px-3 text-center w-24">특근시간</th>
                          <th className="py-2 px-3">작업 내용</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                        {workers.map((w, idx) => (
                          <tr key={`${w.name}_${idx}`} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                              {w.no || idx + 1}
                            </td>
                            <td className="py-2 px-3 font-black text-white text-xs">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700/60 font-bold">
                                {w.name}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-purple-300 font-bold text-[11px]">
                              {w.dept}
                            </td>
                            <td className="py-2 px-3 text-slate-300 font-medium text-[11px]">
                              {w.line}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                                {w.hours || "8H"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[200px]">
                              {w.workContent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOvertimeReportForModal(null);
                      onNavigateTab("electronic_approval");
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>⚡ 전자결재함으로 이동하여 결재 진행</span>
                  </button>
                ) : <div />}
                <button
                  type="button"
                  onClick={() => setSelectedOvertimeReportForModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
}
