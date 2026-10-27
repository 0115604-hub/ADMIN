import React from "react";
import { Scissors, Plus, Trash2 } from "lucide-react";

// 치수 공차 실시간 판정 헬퍼 (초·중·종물 규격 내 여부)
export const isDimOk = (val, target, tol) => {
  if (val === undefined || val === null || val === "") return true;
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  return num >= target - tol && num <= target + tol;
};

/**
 * 🌟 C. 공정별 주요 규격 실측 및 LOT 관리 (동적 Multi-LOT 패널)
 */
export const HanulReportLotSpec = ({
  currentSpecs = [],
  lotEntries = [],
  handleAddLot,
  handleUpdateLotField,
  handleRemoveLot,
  handleUpdateLotMeasurement,
  processId
}) => {
  const effectiveSpecs =
    currentSpecs.length > 0
      ? currentSpecs
      : [
          { key: "mainDim", label: "주요 규격 치수 실측", spec: "도면 공차 준수" },
          { key: "appearance", label: "외관 및 밀착 상태", spec: "합격(양호)" }
        ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              3. 주요 규격 실측 및 LOT 관리
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-bold">
              초물 (06:50) • 중물 (11:50) • 종물 (18:50) 실측 및 LOT 번호 일체형 관리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            총 {lotEntries.length}개 LOT
          </span>
          <button
            type="button"
            onClick={handleAddLot}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>LOT 추가</span>
          </button>
        </div>
      </div>

      {/* Dynamic LOT Panels */}
      <div className="space-y-4">
        {lotEntries.map((entry, lotIdx) => {
          return (
            <div
              key={entry.id || `lot_${lotIdx}`}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs space-y-3"
            >
              {/* LOT Header Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-2xs">
                    LOT #{lotIdx + 1}
                  </span>

                  {/* Main Material LOT NO Input */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {processId === "소재준비"
                        ? "소재 LOT NO (압출):"
                        : processId === "조인트"
                        ? "압출소재 LOT NO:"
                        : processId === "검사"
                        ? "압출소재 LOT NO:"
                        : "소재/제품 LOT NO:"}
                    </label>
                    <input
                      type="text"
                      placeholder="예: 261016-1"
                      value={entry.lotNo || ""}
                      onChange={(e) => handleUpdateLotField(entry.id, "lotNo", e.target.value)}
                      className="w-28 sm:w-36 px-2 py-0.5 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs font-black text-indigo-950 dark:text-indigo-200 text-center focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Process-specific Sub LOT (원재료 / 부자재) */}
                  {processId === "조인트" && (
                    <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
                      <label className="text-xs font-black text-purple-900 dark:text-purple-200 whitespace-nowrap">
                        원재료 LOT NO:
                      </label>
                      <input
                        type="text"
                        placeholder="예: SJ-4004B-01"
                        value={entry.subLotNo || ""}
                        onChange={(e) => handleUpdateLotField(entry.id, "subLotNo", e.target.value)}
                        className="w-28 sm:w-36 px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-900 text-xs font-black text-purple-950 dark:text-purple-200 text-center focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {processId === "검사" && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
                        부자재 LOT (패드/DV):
                      </label>
                      <input
                        type="text"
                        placeholder="예: PAD-5T-01"
                        value={entry.subLotNo || ""}
                        onChange={(e) => handleUpdateLotField(entry.id, "subLotNo", e.target.value)}
                        className="w-28 sm:w-36 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xs font-black text-emerald-950 dark:text-emerald-200 text-center focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {processId === "본드로봇" && (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                      <label className="text-xs font-black text-amber-900 dark:text-amber-200 whitespace-nowrap">
                        본드 LOT NO:
                      </label>
                      <input
                        type="text"
                        placeholder="예: PRI-261016"
                        value={entry.subLotNo || ""}
                        onChange={(e) => handleUpdateLotField(entry.id, "subLotNo", e.target.value)}
                        className="w-28 sm:w-36 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs font-black text-amber-950 dark:text-amber-200 text-center focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* Delete LOT button */}
                {lotEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLot(entry.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer self-end md:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>이 LOT 삭제</span>
                  </button>
                )}
              </div>

              {/* Measurement Table for this LOT */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black">
                      <th className="p-2 rounded-l-lg">검사 부위 및 항목</th>
                      <th className="p-2 text-center">규격(Spec)</th>
                      <th className="p-2 text-center">초물 (06:50)</th>
                      <th className="p-2 text-center">중물 (11:50)</th>
                      <th className="p-2 text-center">종물 (18:50)</th>
                      <th className="p-2 text-center rounded-r-lg">판정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {effectiveSpecs.map((spec) => {
                      const cur = entry.measurements?.[spec.key] || {
                        start: "",
                        mid: "",
                        end: ""
                      };
                      const sOk = spec.target ? isDimOk(cur.start, spec.target, spec.tol) : true;
                      const mOk = spec.target ? isDimOk(cur.mid, spec.target, spec.tol) : true;
                      const eOk = spec.target ? isDimOk(cur.end, spec.target, spec.tol) : true;
                      const hasAnyVal = Boolean(cur.start || cur.mid || cur.end);
                      const rowOk = sOk && mOk && eOk;

                      return (
                        <tr key={spec.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {spec.label}
                          </td>
                          <td className="p-2 text-center font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {spec.spec}
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="실측"
                              value={cur.start || ""}
                              onChange={(e) =>
                                handleUpdateLotMeasurement(entry.id, spec.key, "start", e.target.value)
                              }
                              className={`w-20 px-2 py-1 rounded-lg border text-center font-bold text-xs transition ${
                                sOk
                                  ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  : "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400"
                              }`}
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="실측"
                              value={cur.mid || ""}
                              onChange={(e) =>
                                handleUpdateLotMeasurement(entry.id, spec.key, "mid", e.target.value)
                              }
                              className={`w-20 px-2 py-1 rounded-lg border text-center font-bold text-xs transition ${
                                mOk
                                  ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  : "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400"
                              }`}
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="실측"
                              value={cur.end || ""}
                              onChange={(e) =>
                                handleUpdateLotMeasurement(entry.id, spec.key, "end", e.target.value)
                              }
                              className={`w-20 px-2 py-1 rounded-lg border text-center font-bold text-xs transition ${
                                eOk
                                  ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  : "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400"
                              }`}
                            />
                          </td>
                          <td className="p-1.5 text-center whitespace-nowrap">
                            {hasAnyVal ? (
                              rowOk ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  OK
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  NG
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Bottom Wide Add LOT Button */}
        <button
          type="button"
          onClick={handleAddLot}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ 새로운 LOT 추가하기 (새 소재/원재료 LOT 및 치수 실측)</span>
        </button>
      </div>
    </div>
  );
};

export default HanulReportLotSpec;
