import React from "react";
import {
  Calendar,
  BarChart2,
  X,
  Download
} from "lucide-react";

export default function QualityStatusPopupModal({
  qualityPopupItem,
  setQualityPopupItem,
  liveQualityDaily,
  handleExportQualityItemExcel,
  selectedMonth
}) {
  if (!qualityPopupItem) return null;

  return (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQualityPopupItem(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between gap-3 border-b border-slate-700 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                    [{qualityPopupItem.name}] {selectedMonth || "2026-09"} 일자별 품질 검사 & 불량 정리본
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${
                      qualityPopupItem.defectRate <= 0.70
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {qualityPopupItem.defectRate <= 0.70 ? "목표달성" : "관리주의"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 truncate">
                  차종: <strong className="text-slate-100">{qualityPopupItem.carModel}</strong> | 기본단가: ₩
                  {qualityPopupItem.id === "ja"
                    ? "28,500"
                    : qualityPopupItem.id === "nx4a"
                    ? "32,000"
                    : qualityPopupItem.id === "nx4"
                    ? "31,500"
                    : "29,000"}{" "}
                  | 품질목표: 0.70% 이하
                </p>
              </div>

              <button
                type="button"
                onClick={() => setQualityPopupItem(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="팝업 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">총 검사수량</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                  {qualityPopupItem.inspectQty.toLocaleString()} EA
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">총 불량수량</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono ${
                    qualityPopupItem.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {qualityPopupItem.defectQty.toLocaleString()} EA
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">누적 불량률</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono ${
                    qualityPopupItem.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {qualityPopupItem.defectRate}%
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">품질 손실금액</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  ₩ {qualityPopupItem.lossAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable Day-by-day Breakdown Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>일자별 일일 검사 및 불량 원인 내역 (일일 불량 정리본)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold">
                  {selectedMonth || "2026-09"} 전체 일자
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-center">검사일자</th>
                      <th className="p-3 text-right">검사수량(EA)</th>
                      <th className="p-3 text-right">불량수량(EA)</th>
                      <th className="p-3 text-center">일일 불량률(%)</th>
                      <th className="p-3 text-left">주요 불량 사유 및 건수 (WORST)</th>
                      <th className="p-3 text-right">품질 손실액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {liveQualityDaily.map((d) => {
                      const rec = d.items?.[qualityPopupItem.id] || {
                        inspectQty: 0,
                        defectQty: 0,
                        defectRate: 0,
                        lossAmount: 0,
                        worstReason: "-"
                      };
                      const isGood = rec.defectRate <= 0.70;
                      const hasWork = rec.inspectQty > 0 || rec.defectQty > 0;

                      return (
                        <tr
                          key={d.date}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            hasWork ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-900/30 text-slate-400"
                          }`}
                        >
                          {/* Date */}
                          <td className="p-3 text-center whitespace-nowrap font-black text-slate-900 dark:text-white">
                            {d.date} ({d.dayOfWeek})
                          </td>

                          {/* Inspect Qty */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {hasWork ? `${rec.inspectQty.toLocaleString()} EA` : "-"}
                          </td>

                          {/* Defect Qty */}
                          <td className="p-3 text-right font-mono font-bold">
                            {hasWork ? (
                              <span className={rec.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}>
                                {rec.defectQty.toLocaleString()} EA
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Daily Defect Rate */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {hasWork ? (
                              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black ${
                                isGood
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {rec.defectRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Defect Reasons */}
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                            {hasWork ? (
                              <span className="font-semibold">{rec.worstReason || "-"}</span>
                            ) : (
                              <span className="text-slate-400 italic">미가동 / 휴무</span>
                            )}
                          </td>

                          {/* Loss Amount */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {hasWork && rec.lossAmount > 0 ? `₩ ${rec.lossAmount.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Footer */}
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-emerald-500">
                      <td className="p-3 text-center">9월 총 누계</td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {qualityPopupItem.inspectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        {qualityPopupItem.defectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          qualityPopupItem.defectRate <= 0.70 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                          {qualityPopupItem.defectRate}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        월간 주요 원인: {qualityPopupItem.worstReason}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-300 whitespace-nowrap">
                        ₩ {qualityPopupItem.lossAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                💡 이 데이터는 이창엽 책임이 업로드한 원본 엑셀 파일과 100% 동일합니다.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleExportQualityItemExcel(qualityPopupItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>이 정리본 엑셀 다운로드</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualityPopupItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer"
                >
                  닫기
                </button>
            </div>
          </div>
        </div>
      </div>
  );
}


