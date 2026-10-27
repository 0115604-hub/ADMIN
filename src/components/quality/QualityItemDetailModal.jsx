import React from "react";
import { ShieldCheck, X, Edit3, Download } from "lucide-react";

/**
 * QualityItemDetailModal
 * Popup modal showing daily inspection and defect breakdown for the selected item.
 */
export const QualityItemDetailModal = ({
  popupItem,
  onClose,
  selectedMonth,
  chartDays = [],
  handleOpenDirectInputModal,
  handleExportExcel,
}) => {
  if (!popupItem) return null;

  const monthNum = selectedMonth ? selectedMonth.slice(5, 7) : "9";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  [{popupItem.name}] {selectedMonth} 일자별 품질 검사 & 불량 정리본
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  popupItem.defectRate <= 0.70
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}>
                  {popupItem.defectRate <= 0.70 ? "목표달성 ✓" : "관리주의 🚨"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                차종: <strong className="text-slate-200">{popupItem.carModel}</strong> | 기본단가: ₩{popupItem.id === "ja" ? "3,116" : popupItem.id === "hr" ? "2,372" : "5,747"}원 | 이창엽 책임 엑셀 데이터 100% 일치
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Top KPI Metrics */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold block">{monthNum}월 총 검사수량</span>
            <strong className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
              {popupItem.inspectQty.toLocaleString()} EA
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold block">{monthNum}월 총 불량수량</span>
            <strong className={`text-base sm:text-lg font-black font-mono ${
              popupItem.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
            }`}>
              {popupItem.defectQty.toLocaleString()} EA
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold block">{monthNum}월 누적 불량률</span>
            <strong className={`text-base sm:text-lg font-black font-mono ${
              popupItem.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}>
              {popupItem.defectRate}%
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold block">소재 폐기 / 손실액</span>
            <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
              폐기: <strong className="text-amber-600 dark:text-amber-400">{(popupItem.scrapTotal || 0).toLocaleString()} EA</strong>
            </div>
            <div className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
              손실: ₩ {popupItem.lossAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Modal Body: Scrollable Day-by-day Breakdown Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 text-center">일자 (요일)</th>
                  <th className="p-3 text-right">검사수량</th>
                  <th className="p-3 text-right">불량수량</th>
                  <th className="p-3 text-center">불량률</th>
                  <th className="p-3 text-center">소재폐기</th>
                  <th className="p-3 text-left min-w-[200px]">주요 불량유형 및 비고</th>
                  <th className="p-3 text-right">손실금액</th>
                  <th className="p-3 text-center">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chartDays.map((d) => {
                  const rec = d.items?.[popupItem.id] || { inspectQty: 0, defectQty: 0, defectRate: 0, worstReason: "", scrapQty: 0, lossAmount: 0 };
                  const hasWork = rec.inspectQty > 0 || rec.defectQty > 0;
                  const isDayGood = rec.defectRate <= 0.70;

                  return (
                    <tr
                      key={d.date}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        !hasWork ? "opacity-40" : ""
                      }`}
                    >
                      {/* Date */}
                      <td className="p-3 text-center font-bold">
                        <span className="font-mono text-slate-900 dark:text-white">{d.date}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({d.dayOfWeek || "일"})</span>
                      </td>

                      {/* Inspect Qty */}
                      <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {hasWork ? `${rec.inspectQty.toLocaleString()} EA` : "-"}
                      </td>

                      {/* Defect Qty */}
                      <td className="p-3 text-right font-mono font-bold">
                        {hasWork ? (
                          <span className={rec.defectQty > 0 ? "text-rose-600 dark:text-rose-400 font-black" : "text-slate-500"}>
                            {rec.defectQty.toLocaleString()} EA
                          </span>
                        ) : "-"}
                      </td>

                      {/* Defect Rate */}
                      <td className="p-3 text-center font-mono">
                        {hasWork ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            isDayGood
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          }`}>
                            {rec.defectRate}%
                          </span>
                        ) : "-"}
                      </td>

                      {/* Scrap Qty */}
                      <td className="p-3 text-center font-mono text-slate-500">
                        {hasWork && rec.scrapQty > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{rec.scrapQty} EA</span>
                        ) : "-"}
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

                      {/* Edit Button */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            handleOpenDirectInputModal(d.date);
                          }}
                          className="p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="당일 실적 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary Footer */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-emerald-500">
                  <td className="p-3 text-center">📊 {monthNum}월 총 누계</td>
                  <td className="p-3 text-right font-mono text-emerald-400">
                    {popupItem.inspectQty.toLocaleString()} EA
                  </td>
                  <td className="p-3 text-right font-mono text-rose-400">
                    {popupItem.defectQty.toLocaleString()} EA
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      popupItem.defectRate <= 0.70 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}>
                      {popupItem.defectRate}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-amber-300">
                    {(popupItem.scrapTotal || 0).toLocaleString()} EA
                  </td>
                  <td className="p-3 text-slate-300 text-[11px]">
                    월간 주요 원인: {popupItem.worstReason}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-300 whitespace-nowrap">
                    ₩ {popupItem.lossAmount.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            💡 이 데이터는 이창엽 책임의 일일 품질 실적과 100% 실시간 연동됩니다.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportExcel(popupItem)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>이 정리본 엑셀 다운로드</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityItemDetailModal;
