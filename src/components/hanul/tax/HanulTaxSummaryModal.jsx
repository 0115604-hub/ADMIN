import React from "react";
import { FileText, X } from "lucide-react";
import { FRT_INDICES } from "./hanulTaxConstants";

/**
 * HanulTaxSummaryModal
 * 8개 품목 단가 및 매출 정리본 팝업 모달
 */
export default function HanulTaxSummaryModal({
  isOpen,
  onClose,
  monthTitle,
  frtUnitPrice,
  rrUnitPrice,
  salesItems,
  totalSalesQty,
  totalSalesAmount,
  totalSalesGross,
  avgSalesUnitPrice
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-indigo-200 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>📋 {monthTitle} 한울 9BQC 단가 정리본</span>
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                FRT(₩{frtUnitPrice.toLocaleString()}), RR(₩{rrUnitPrice.toLocaleString()}) 일괄 적용 기준 정산표
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 부품명, 수량, 적용단가, 공급가액, 총합계액 */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-750 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 font-bold">부품명</th>
                  <th className="py-2.5 px-3 text-right font-bold min-w-[90px]">수량</th>
                  <th className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400 min-w-[100px]">
                    적용단가
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold min-w-[120px]">공급가액</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 min-w-[125px]">
                    총합계액
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
                {salesItems.map((item, idx) => {
                  const isFrt = FRT_INDICES.includes(idx);
                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                              isFrt
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                            }`}
                          >
                            {isFrt ? "FRT" : "RR"}
                          </span>
                          <span>{item.partName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {(Number(item.qty) || 0).toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">EA</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-indigo-700 dark:text-indigo-300">
                        ₩ {(Number(item.unitPrice) || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        ₩ {(Number(item.amount) || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                <tr>
                  <td colSpan="2" className="py-3 px-3 text-center tracking-wider text-xs">
                    합계 (Total)
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black">
                    {totalSalesQty.toLocaleString()} EA
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-300 text-[11px]">
                    평균 ₩{avgSalesUnitPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-950 dark:text-white font-black text-xs sm:text-sm">
                    ₩ {totalSalesAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">
                    ₩ {totalSalesGross.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 총합계액은 공급가액 + 부가세(10%)가 포함된 금액입니다.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
