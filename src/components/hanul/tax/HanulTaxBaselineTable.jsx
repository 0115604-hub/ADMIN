import React from "react";
import { FRT_INDICES } from "./hanulTaxConstants";

/**
 * HanulTaxBaselineTable
 * 9BQC 8가지 항목 기준 단가/수량/매출 요약 패널 (기준원형 보존)
 */
export default function HanulTaxBaselineTable({
  monthTitle,
  baselineSalesItems,
  baselineTotalQty,
  baselineTotalAmount,
  baselineTotalTax,
  baselineTotalGross,
  baselineAvgUnitPrice
}) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden space-y-2.5">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-2.5">
        {/* Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-xs sm:text-sm font-black text-blue-100 flex items-center gap-1.5">
              <span>📊 {monthTitle} 9BQC 8가지 항목 기준 매출단가 요약 (기준원형 보존)</span>
            </h3>
          </div>
          <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2.5">
            <span>
              총 매출수량: <strong className="text-white font-mono">{baselineTotalQty.toLocaleString()} EA</strong>
            </span>
            <span>•</span>
            <span>
              평균단가: <strong className="text-white font-mono">₩{baselineAvgUnitPrice.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* 8-Row Baseline Summary Table */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-white/10 text-[10.5px] font-black uppercase text-blue-200 border-b border-white/10">
                <tr>
                  <th className="py-2 px-2.5 text-center w-9">No</th>
                  <th className="py-2 px-2.5 font-bold text-white min-w-[170px]">품명 / 부품명</th>
                  <th className="py-2 px-2 text-right font-black text-blue-300 min-w-[85px]">수량 (EA)</th>
                  <th className="py-2 px-2 text-right font-black text-indigo-300 min-w-[95px]">기준단가 (₩)</th>
                  <th className="py-2 px-2.5 text-right font-black text-white min-w-[115px]">공급가액 (합계금액)</th>
                  <th className="py-2 px-2 text-center font-bold text-blue-300 min-w-[70px]">비중 (%)</th>
                  <th className="py-2 px-2 text-right font-mono text-amber-200/90 min-w-[85px]">세액 (10%)</th>
                  <th className="py-2 px-2.5 text-right font-black text-emerald-300 min-w-[105px]">총 합계액 (1.1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-xs">
                {baselineSalesItems.map((item, idx) => {
                  const isFrt = FRT_INDICES.includes(idx);
                  const itemRatio =
                    baselineTotalAmount > 0 ? ((item.amount / baselineTotalAmount) * 100).toFixed(1) : "0.0";

                  return (
                    <tr key={item.id || idx} className="hover:bg-white/10 transition-colors">
                      <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5 font-black text-white">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                              isFrt
                                ? "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                                : "bg-purple-500/30 text-purple-200 border border-purple-400/40"
                            }`}
                          >
                            {isFrt ? "FRT" : "RR"}
                          </span>
                          <span className="truncate">{item.partName}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-blue-200">
                        {(Number(item.qty) || 0).toLocaleString()}{" "}
                        <span className="text-[9.5px] text-white/50 font-normal">EA</span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-indigo-200">
                        ₩{(Number(item.unitPrice) || 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-white">
                        ₩{(Number(item.amount) || 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-blue-200">
                          {itemRatio}%
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-amber-300/90 text-[11px]">
                        ₩{(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-300">
                        ₩{(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Row */}
              <tfoot className="bg-white/15 font-black text-white border-t border-white/20 text-xs">
                <tr>
                  <td colSpan="2" className="py-2 px-2.5 text-center tracking-wider text-[11px]">
                    8개 항목 합계 총계 (Total)
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-blue-200 font-black">
                    {baselineTotalQty.toLocaleString()} EA
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-indigo-200 text-[11px]">
                    평균 ₩{baselineAvgUnitPrice.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-white text-xs sm:text-sm font-black">
                    ₩ {baselineTotalAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-blue-200 font-black text-[11px]">
                    100.0%
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-amber-300 text-[11px]">
                    ₩ {baselineTotalTax.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-emerald-300 text-xs sm:text-sm font-black">
                    ₩ {baselineTotalGross.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
