import React, { useMemo } from "react";
import { ShieldAlert, Plus, FileSpreadsheet, Camera } from "lucide-react";

export const BurimtechCustomSection = ({
  handleOpenWorkLogModal,
  handleOpenLogDetail,
  onNavigateTab,
  workLogs = [],
  currentProfile,
  isWorkLogApproved,
  pushModalHistory,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount = 0
}) => {
  // Filter logs for Burimtech
  const burimLogs = useMemo(() => {
    return (workLogs || []).filter((l) => {
      if (!l) return false;
      const comp = String(l.company || "").trim();
      const writer = String(l.writer || "").trim();
      const proc = String(l.assignedProcess || l.process || "").trim();
      return (
        comp.includes("부림") ||
        writer.includes("부림") ||
        writer === "최현영" ||
        writer === "김동훈" ||
        proc.includes("부림") ||
        (l.plant === "한림공장" && proc.includes("외주가공"))
      );
    });
  }, [workLogs]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = burimLogs.length;
    const approved = burimLogs.filter((l) => isWorkLogApproved && isWorkLogApproved(l)).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [burimLogs, isWorkLogApproved]);

  return (
    <div className="space-y-3">
      {/* 🌟 부림텍 전용 외주가공 부적합경보 & 작업일보 배너 */}
      <div
        onClick={() => {
          if (setIsHanulQualityIssueModalOpen) setIsHanulQualityIssueModalOpen(true);
        }}
        className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-teal-500/60 shadow-md shadow-teal-950/40 flex items-center justify-between gap-2 min-w-0 max-w-full animate-fadeIn cursor-pointer"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-black text-xs sm:text-sm text-white tracking-tight">
              부림텍 부적합경보 등록
            </span>
            <span className="hidden sm:inline text-[11px] text-teal-300 font-semibold truncate">
              (한림공장 (주)부림텍 외주가공 실시간 작업일보 및 부적합경보 관리)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {/* 🚨 부적합경보 입력 버튼 */}
          <button
            type="button"
            onClick={() => {
              if (setIsHanulQualityIssueModalOpen) {
                setIsHanulQualityIssueModalOpen(true);
              } else if (onNavigateTab) {
                onNavigateTab("quality_control");
              }
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-pulse"
            title="부림텍 부적합경보 및 품질이슈 등록/관리"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 부적합경보 입력</span>
            {activeHanulQualityCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                {activeHanulQualityCount}
              </span>
            )}
          </button>

          {/* ✍️ 부림텍 작업일보 작성 버튼 */}
          {handleOpenWorkLogModal && (
            <button
              type="button"
              onClick={() => handleOpenWorkLogModal()}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>✍️ 부림텍 일보 작성</span>
            </button>
          )}
        </div>
      </div>

      {/* 부림텍 외주가공 실시간 작업일보 대장 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>(주)부림텍 외주가공 작업일보 실시간 관리 대장</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-bold">
                  총 {stats.total}건
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                한림공장 부림텍 외주가공 일일 작업 내역 및 실시간 결재 승인 현황
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              승인완료 {stats.approved}건
            </span>
            {stats.pending > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                결재대기 {stats.pending}건
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">일자</th>
                <th className="py-2.5 px-3">작성자</th>
                <th className="py-2.5 px-3">공정 / 품목</th>
                <th className="py-2.5 px-3">주요 작업 내용</th>
                <th className="py-2.5 px-3 text-center">사진</th>
                <th className="py-2.5 px-3 text-center">결재상태</th>
                <th className="py-2.5 px-3 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {burimLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    등록된 부림텍 외주가공 작업일보가 없습니다.
                  </td>
                </tr>
              ) : (
                burimLogs.slice(0, 10).map((log) => {
                  const approved = isWorkLogApproved ? isWorkLogApproved(log) : Boolean(log.approved);
                  const hasPhotos = Array.isArray(log.images) && log.images.length > 0;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleOpenLogDetail && handleOpenLogDetail(log)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {log.workDate || log.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-700 dark:text-teal-300">
                        {log.writer || "부림텍"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {log.assignedProcess || log.process || "외주가공"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {log.workContent || log.description || log.content || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {hasPhotos ? (
                          <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{log.images.length}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            approved
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {approved ? "승인완료" : "결재대기"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (handleOpenLogDetail) handleOpenLogDetail(log);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all"
                        >
                          조회
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
    </div>
  );
};

export default BurimtechCustomSection;
