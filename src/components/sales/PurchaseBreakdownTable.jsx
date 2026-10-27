import { Boxes, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * PurchaseBreakdownTable
 * Table displaying supplier & raw material purchase ranking, amounts, and percentage shares.
 */
export const PurchaseBreakdownTable = ({
  filteredPurchases,
  purchaseSubtotal,
  onSelectDetail
}) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
      {/* 헤더 */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-xs font-black text-slate-900 dark:text-white">
            2. 거래처별 / 품목군별 매입원가 세분화
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold text-slate-400">합계</span>
          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
            {formatAmount(Math.round(purchaseSubtotal))}
          </span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 px-3 w-10 text-center">순위</th>
              <th className="py-2 px-2.5">매입 구분 (탭하여 상세)</th>
              <th className="py-2 px-2.5">주요 거래처 / 항목</th>
              <th className="py-2 px-2.5 text-right">매입금액 (원)</th>
              <th className="py-2 px-3 w-24 text-right">비중 (%)</th>
              <th className="py-2 px-2 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
            {filteredPurchases.map((item, idx) => {
              const badgeClass =
                item.badge === '원자재'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : item.badge === '부자재'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : item.badge === '케미칼'
                  ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                  : item.badge === '포장재'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : item.badge === '직매입'
                  ? 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectDetail({ type: 'purchase', data: item })}
                  className="hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors group cursor-pointer"
                  title="탭하여 세부 자재 규격/단가/구매량 상세 팝업 열기"
                >
                  <td className="py-2 px-3 text-center font-bold text-slate-400 group-hover:text-rose-600 text-[11px]">
                    {item.rank}
                  </td>
                  <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black mr-1 ${badgeClass}`}>
                      {item.badge}
                    </span>
                    <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors underline decoration-rose-300/50 underline-offset-2">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[160px]">
                    {item.supplier}
                  </td>
                  <td className="py-2 px-2.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatAmount(Math.round(item.amount))}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(item.share * 1.5, 100)}%` }}
                          className="h-full bg-rose-500 rounded-full"
                        />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-9 text-right text-[11px]">
                        {item.share.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-300 group-hover:text-rose-500 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 푸터 */}
      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-black text-xs">
        <span className="text-slate-600 dark:text-slate-300 text-[11px]">
          매입 총합계 (원/부/기타/직매입)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-rose-600 dark:text-rose-400 font-black">
            {formatAmount(Math.round(purchaseSubtotal))}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold">
            100%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseBreakdownTable;
