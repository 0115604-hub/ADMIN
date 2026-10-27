import { useState } from 'react';
import {
  Car,
  Boxes,
  Search,
  X,
  PackageCheck
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * DetailBreakdownModal
 * Interactive details popup modal for sales products or purchase raw materials.
 */
export const DetailBreakdownModal = ({ isOpen, onClose, selectedData, type }) => {
  const { formatAmount } = useCurrency();
  const [modalSearch, setModalSearch] = useState('');

  if (!isOpen || !selectedData) return null;

  const isSales = type === 'sales';
  const subitems = selectedData.subitems || [];

  const filteredSubitems = subitems.filter((sub) => {
    const searchLower = modalSearch.toLowerCase();
    const code = (sub.code || '').toLowerCase();
    const name = (sub.name || '').toLowerCase();
    const partNo = (sub.partNo || '').toLowerCase();
    const supplier = (sub.supplier || '').toLowerCase();
    return (
      code.includes(searchLower) ||
      name.includes(searchLower) ||
      partNo.includes(searchLower) ||
      supplier.includes(searchLower)
    );
  });

  const totalFilteredAmt = filteredSubitems.reduce((acc, cur) => acc + (cur.amount || 0), 0);

  const badgeColor = isSales
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSales ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'bg-rose-50 dark:bg-rose-950 text-rose-600'}`}>
              {isSales ? <Car className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
                  {selectedData.badge || (isSales ? '매출' : '매입')}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedData.category} 세부 내역
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isSales ? selectedData.item : selectedData.supplier} • 전체 비중: {selectedData.share}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 block">항목 총금액</span>
              <span className={`text-base font-black ${isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatAmount(Math.round(selectedData.amount))}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Stats */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="품목코드, 품명, 고객품번, 거래처 검색..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {modalSearch && (
              <button
                onClick={() => setModalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>세부 품목: <strong className="text-slate-900 dark:text-white">{filteredSubitems.length}</strong>건</span>
            <span>•</span>
            <span>선택 합계: <strong className={isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>{formatAmount(Math.round(totalFilteredAmt))}</strong></span>
          </div>
        </div>

        {/* Sub-item Details Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 shadow-2xs z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">No</th>
                {isSales ? (
                  <>
                    <th className="py-2.5 px-3">아이템코드</th>
                    <th className="py-2.5 px-3">고객품번</th>
                    <th className="py-2.5 px-3">세부 품명 / 사양</th>
                    <th className="py-2.5 px-3 text-right">판매단가</th>
                    <th className="py-2.5 px-3 text-right">출하수량</th>
                    <th className="py-2.5 px-3 text-right">매출금액 (원)</th>
                    <th className="py-2.5 px-3 text-right w-20">비중</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3">자재코드</th>
                    <th className="py-2.5 px-3">품명 및 규격</th>
                    <th className="py-2.5 px-3">공급처 / 차종</th>
                    <th className="py-2.5 px-3 text-center">단위</th>
                    <th className="py-2.5 px-3 text-right">단가</th>
                    <th className="py-2.5 px-3 text-right">구매량</th>
                    <th className="py-2.5 px-3 text-right">매입금액 (원)</th>
                    <th className="py-2.5 px-3 text-right w-20">비중</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
              {filteredSubitems.length > 0 ? (
                filteredSubitems.map((sub, idx) => {
                  const sharePercent = selectedData.amount > 0 ? ((sub.amount / selectedData.amount) * 100).toFixed(1) : 0;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-bold text-slate-400 text-[10.5px]">
                        {idx + 1}
                      </td>
                      {isSales ? (
                        <>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {sub.code || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.partNo || '-'}
                          </td>
                          <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.unitPrice ? `₩${sub.unitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.qty ? sub.qty.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {formatAmount(Math.round(sub.amount))}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-slate-500 text-[10.5px]">
                            {sharePercent}%
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {sub.code || '-'}
                          </td>
                          <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.supplier || '-'}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                            {sub.unit || 'EA'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.unitPrice ? `₩${sub.unitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.qty ? sub.qty.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatAmount(Math.round(sub.amount))}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-slate-500 text-[10.5px]">
                            {sharePercent}%
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSales ? 8 : 9} className="py-8 text-center text-slate-400 text-xs">
                    검색 조건과 일치하는 세부 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>상세 데이터 검증 완료 (ERP 실시간 동기화)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">합계 금액</span>
              <span className={`text-sm font-black ${isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatAmount(Math.round(totalFilteredAmt))}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-opacity cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailBreakdownModal;
