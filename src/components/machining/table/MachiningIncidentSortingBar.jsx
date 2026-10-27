import React from "react";

export const MachiningIncidentSortingBar = ({
  incidentStats,
  machiningIncidents = [],
  handleSortIncident,
  title = "당일 가공동 비가동 · 부적합 1차 분류",
  emptyText = "🟢 오늘 접수된 일보에 비가동 및 부적합 내역이 없습니다. (정상 가동 중)"
}) => {
  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <span>⏱️ {title}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10.5px]">
            전체 {incidentStats.total}건
          </span>
          {incidentStats.unsorted > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10.5px] animate-pulse">
              ⏳ 분류 {incidentStats.unsorted}건
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400 font-bold text-[10.5px]">
              🟢 분류완료
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10.5px]">
            사내관리 {incidentStats.internal}건
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10.5px]">
            품질이관 {incidentStats.quality}건
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          ※ 관리자 검토 후 원클릭 분류 ➡️ 품질 변동점 대장 자동 이관
        </span>
      </div>

      {machiningIncidents.length === 0 ? (
        <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {machiningIncidents.map((inc) => {
            const isUnsorted = !inc.registrationType || inc.registrationType === "UNREGISTERED";
            const isInternal = inc.registrationType === "INTERNAL";
            const isQuality = inc.registrationType === "CHANGE_POINT";

            return (
              <div
                key={inc.id}
                className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                  isUnsorted
                    ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs"
                    : isQuality
                    ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                    : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60"
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUnsorted && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                        분류
                      </span>
                    )}
                    {isQuality && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                        🚨 품질이관됨
                      </span>
                    )}
                    {isInternal && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">
                        🟢 사내종결
                      </span>
                    )}
                    <span className="font-mono text-slate-500 text-[11px]">
                      {inc.date} {inc.time}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {inc.project || ""} {inc.processId || inc.processName || inc.line || ""} ({inc.worker || "작업자"})
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10.5px]">
                      {inc.defectType}
                    </span>
                    {(inc.minutes > 0 || inc.downtimeMinutes > 0) && (
                      <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {inc.minutes || inc.downtimeMinutes}분
                      </span>
                    )}
                    {inc.scrapKg > 0 && (
                      <span className="text-amber-700 dark:text-amber-300 font-mono text-[11px]">
                        {inc.scrapKg}EA
                      </span>
                    )}
                    {(inc.beforePhoto || inc.afterPhoto) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        📷사진첨부
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11.5px] truncate">
                    {inc.content} {inc.actionResult ? `(조치: ${inc.actionResult})` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {isUnsorted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSortIncident(inc, "INTERNAL")}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        🟢 사내관리
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortIncident(inc, "CHANGE_POINT")}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        🚨 품질 변동점 이관 ➡️
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1">
                      {isQuality && (
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "CHANGE_POINT")}
                          className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="시정조치 및 조치결과 수정"
                        >
                          <span>✏️ 조치수정</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSortIncident(inc, "UNREGISTERED")}
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10.5px] font-bold cursor-pointer"
                        title="분류 취소 및 재설정"
                      >
                        ↩️ 재분류
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MachiningIncidentSortingBar;
