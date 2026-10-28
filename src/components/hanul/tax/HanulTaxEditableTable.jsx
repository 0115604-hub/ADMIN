import React from "react";
import { Calculator, FileText, Lock } from "lucide-react";
import { FRT_INDICES } from "./hanulTaxConstants";

/**
 * HanulTaxEditableTable
 * 9BQC 8가지 항목 FRT / RR 일괄 단가입력 및 실시간 자동계산 표
 */
export default function HanulTaxEditableTable({
  salesItems,
  frtUnitPrice,
  rrUnitPrice,
  handleFrtPriceChange,
  handleRrPriceChange,
  handleOpenSummaryModal,
  totalSalesQty,
  totalSalesAmount,
  totalSalesTax,
  totalSalesGross,
  avgSalesUnitPrice
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Table Top Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>9BQC 8가지 항목 FRT / RR 일괄 단가입력 및 실시간 자동계산</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ⚡ FRT(3·4번 적용), RR(1·2·5·6·7·8번 적용) 단가를 입력하면 실시간 자동 계산됩니다.
            </p>
          </div>
        </div>

        {/* "정리본" 뱃지 / 버튼 (클릭 시 팝업 모달 오픈) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenSummaryModal}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-black text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title="8개 품목 단가 및 매출 정리본 팝업 보기"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>정리본</span>
          </button>
        </div>
      </div>

      {/* 단순화된 FRT & RR 2개 입력창 */}
      <div className="p-3 sm:p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* 1) FRT : [ 000 ] 원 */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 shadow-2xs">
            <span className="font-black text-blue-700 dark:text-blue-300 text-sm sm:text-base whitespace-nowrap pl-1">
              FRT :
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={frtUnitPrice > 0 ? frtUnitPrice.toLocaleString() : ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleFrtPriceChange(e.target.value)}
                placeholder="0"
                className="w-full pr-8 pl-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-black text-base text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm pointer-events-none">
                원
              </span>
            </div>
          </div>

          {/* 2) RR : [ 000 ] 원 */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border-2 border-purple-400 dark:border-purple-500 shadow-2xs">
            <span className="font-black text-purple-700 dark:text-purple-300 text-sm sm:text-base whitespace-nowrap pl-1">
              RR :
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={rrUnitPrice > 0 ? rrUnitPrice.toLocaleString() : ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleRrPriceChange(e.target.value)}
                placeholder="0"
                className="w-full pr-8 pl-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-black text-base text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm pointer-events-none">
                원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Items Read-Only Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/90 dark:bg-slate-800 text-[10.5px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-2.5 text-center w-10">No</th>
              <th className="py-2.5 px-2.5 font-bold text-slate-900 dark:text-white min-w-[170px]">
                품명 / 부품명
              </th>

              {/* 1) 수량 (고정 컬럼) */}
              <th className="py-2.5 px-2 text-right font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 min-w-[95px]">
                <div className="flex items-center justify-end gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  <span>수량 (EA, 고정)</span>
                </div>
              </th>

              {/* 2) 적용단가 */}
              <th className="py-2.5 px-2.5 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 min-w-[120px]">
                적용 단가 (₩)
              </th>

              {/* 3) 합계금액 */}
              <th className="py-2.5 px-2.5 text-right font-black text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 min-w-[130px]">
                공급가액 (단가×수량)
              </th>

              {/* 4) 매출 비중 (%) */}
              <th className="py-2.5 px-2 text-center font-bold text-blue-600 dark:text-blue-400 min-w-[75px]">
                비중 (%)
              </th>

              {/* 5) 부가세 10% */}
              <th className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400 min-w-[90px]">
                세액 (10%)
              </th>

              {/* 6) 총액 */}
              <th className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[110px]">
                총 합계액 (1.1)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
            {salesItems.map((item, idx) => {
              const isFrt = FRT_INDICES.includes(idx);
              const itemRatio =
                totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";

              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* No */}
                  <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Part Name with Group Badge */}
                  <td className="py-2 px-2.5 font-black text-slate-900 dark:text-white">
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
                      <span className="truncate">{item.partName}</span>
                    </div>
                  </td>

                  {/* 1) 수량 (고정 텍스트 뱃지) */}
                  <td className="py-2 px-2 text-right bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-end gap-1 font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                      <span>{(Number(item.qty) || 0).toLocaleString()}</span>
                      <span className="text-[9.5px] text-slate-400 font-normal">EA</span>
                    </div>
                  </td>

                  {/* 2) 적용 단가 */}
                  <td className="py-2 px-2.5 text-right bg-indigo-50/40 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-end gap-1 font-mono font-black text-xs">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          isFrt
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                            : "bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                        }`}
                      >
                        ₩ {(Number(item.unitPrice) || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* 3) 공급가액 (단가×수량) */}
                  <td className="py-2 px-2.5 text-right bg-slate-100/40 dark:bg-slate-800/30">
                    <span className="font-mono font-black text-slate-950 dark:text-white text-xs">
                      ₩ {(Number(item.amount) || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* 4) 매출 비중 (%) */}
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono ${
                        isFrt
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60"
                      }`}
                    >
                      {itemRatio}%
                    </span>
                  </td>

                  {/* 5) 부가세 (10%) */}
                  <td className="py-2 px-2 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    ₩ {(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                  </td>

                  {/* 6) 총액 (1.1) */}
                  <td className="py-2 px-2.5 text-right font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                    ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Total Row */}
          <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
            <tr>
              <td colSpan="2" className="py-2.5 px-2.5 text-center text-[11px] tracking-wider">
                8개 항목 합계 총계 (Total)
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-900 dark:text-slate-100 bg-slate-200/60 dark:bg-slate-800 text-xs">
                {totalSalesQty.toLocaleString()} <span className="text-[9.5px] font-normal text-slate-500">EA</span>
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-indigo-900 dark:text-indigo-200 bg-indigo-100/60 dark:bg-indigo-950/50 text-xs">
                평균 ₩{avgSalesUnitPrice.toLocaleString()}
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-700/80 text-xs sm:text-sm font-black">
                ₩ {totalSalesAmount.toLocaleString()}
              </td>
              <td className="py-2.5 px-2 text-center font-mono text-blue-700 dark:text-blue-300 text-[11px] font-black">
                100.0%
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                ₩ {totalSalesTax.toLocaleString()}
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black">
                ₩ {totalSalesGross.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
