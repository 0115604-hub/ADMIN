import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * 🌟 E. 불량 세부 내역 매트릭스 (터치 증감 버튼 & 검사 3대 불량 분류)
 */
export const HanulReportDefectMatrix = ({
  processId,
  totals,
  currentDefectKeys = [],
  defects = {},
  handleDefectChange,
  handleDefectInput
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
      <div className="flex items-center justify-between border-b border-rose-200/80 dark:border-rose-900/80 pb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="font-black text-xs sm:text-sm text-rose-950 dark:text-rose-200">
            {processId === "검사"
              ? "4. 검사 3대 불량 세부 집계 (압출소재 / 조인트 / 후가공)"
              : "4. 불량 유형별 세부 집계"}
          </span>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black">
          불량 소계: {totals.defectSum} EA
        </span>
      </div>

      {processId === "검사" ? (
        /* 검사 3대 불량 분류 (압출소재, 조인트, 후가공) 그룹핑 뷰 */
        <div className="space-y-3.5">
          {[
            {
              title: "1. 압출소재 불량",
              prefix: "압출_",
              icon: "🧱",
              badgeColor:
                "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
            },
            {
              title: "2. 조인트 불량",
              prefix: "조인트_",
              icon: "⚙️",
              badgeColor:
                "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
            },
            {
              title: "3. 후가공 불량",
              prefix: "후가공_",
              icon: "✂️",
              badgeColor:
                "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }
          ].map((grp) => {
            const grpKeys = currentDefectKeys.filter((k) => k.startsWith(grp.prefix));
            if (grpKeys.length === 0) return null;
            const grpTotal = grpKeys.reduce(
              (acc, k) => acc + (Number(defects[k]) || 0),
              0
            );

            return (
              <div
                key={grp.prefix}
                className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  <span className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{grp.icon}</span>
                    <span>{grp.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${grp.badgeColor}`}
                    >
                      {grpKeys.length}개 항목
                    </span>
                  </span>
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      grpTotal > 0
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-black"
                        : "text-slate-400"
                    }`}
                  >
                    소계: {grpTotal.toLocaleString()} EA
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {grpKeys.map((k) => {
                    const count = Number(defects[k]) || 0;
                    const displayName = k.replace(grp.prefix, "");
                    return (
                      <div
                        key={k}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
                          count > 0
                            ? "bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-100 shadow-xs"
                            : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-xs font-bold truncate" title={displayName}>
                          {displayName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDefectChange(k, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-200 flex items-center justify-center font-black active:scale-95 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => handleDefectInput(k, e.target.value)}
                            className="w-10 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleDefectChange(k, 1)}
                            className="w-6 h-6 rounded-lg bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center font-black active:scale-95 cursor-pointer shadow-2xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 기존 일반 공정 불량 그리드 */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {currentDefectKeys.map((k) => {
            const count = Number(defects[k]) || 0;
            return (
              <div
                key={k}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
                  count > 0
                    ? "bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-100 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="text-xs font-bold truncate">{k}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDefectChange(k, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-200 flex items-center justify-center font-black active:scale-95 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) => handleDefectInput(k, e.target.value)}
                    className="w-10 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleDefectChange(k, 1)}
                    className="w-6 h-6 rounded-lg bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center font-black active:scale-95 cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HanulReportDefectMatrix;
