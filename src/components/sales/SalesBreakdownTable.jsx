import { Car, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * SalesBreakdownTable
 * Table displaying product line & vehicle sales ranking, amounts, and percentage shares.
 */
export const SalesBreakdownTable = ({
  filteredSales,
  salesSubtotal,
  onSelectDetail
}) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
      {/* 헤더 */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-black text-slate-900 dark:text-white">
            1. 차종별 / 제품군별 매출 세분화
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold text-slate-400">합계</span>
          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
            {formatAmount(salesSubtotal)}
          </span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 px-3 w-10 text-center">순위</th>
              <th className="py-2 px-2.5">대분류 (탭하여 상세)</th>
              <th className="py-2 px-2.5">세부 차종 / 라인 품목</th>
              <th className="py-2 px-2.5 text-right">매출금액 (원)</th>
              <th className="py-2 px-3 w-24 text-right">비중 (%)</th>
              <th className="py-2 px-2 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
            {filteredSales.map((item, idx) => {
              const badgeClass =
                item.badge === 'PCM'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : item.badge === '수출'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : item.badge === '내수'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectDetail({ type: 'sales', data: item })}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors group cursor-pointer"
                  title="탭하여 세부 품목별 단가/수량/금액 상세 팝업 열기"
                >
                  <td className="py-2 px-3 text-center font-bold text-slate-400 group-hover:text-blue-600 text-[11px]">
                    {item.rank}
                  </td>
                  <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black mr-1 ${badgeClass}`}>
                      {item.badge}
                    </span>
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors underline decoration-blue-300/50 underline-offset-2">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[160px]">
                    {item.item}
                  </td>
                  <td className="py-2 px-2.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatAmount(item.amount)}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(item.share * 2.5, 100)}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-9 text-right text-[11px]">
                        {item.share.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-300 group-hover:text-blue-500 transition-colors">
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
          매출 총합계 (14개 라인)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-black">
            {formatAmount(salesSubtotal)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
            100%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesBreakdownTable;
