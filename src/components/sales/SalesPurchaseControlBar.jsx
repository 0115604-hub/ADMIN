import {
  Layers,
  Car,
  Boxes,
  Search,
  FileSpreadsheet
} from 'lucide-react';

/**
 * SalesPurchaseControlBar
 * View mode switcher (all, sales, purchases), real-time search input, and interactive help banner.
 */
export const SalesPurchaseControlBar = ({
  activeViewMode,
  setActiveViewMode,
  searchTerm,
  setSearchTerm,
  salesCount,
  purchasesCount
}) => {
  return (
    <>
      {/* 컨트롤 바: 뷰 모드 탭 & 검색창 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* 모드 전환 탭 */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveViewMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              activeViewMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            종합 비교 (나란히)
          </button>
          <button
            onClick={() => setActiveViewMode('sales')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              activeViewMode === 'sales'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Car className="w-3 h-3 text-blue-500" />
            1. 매출 세분화 ({salesCount})
          </button>
          <button
            onClick={() => setActiveViewMode('purchases')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              activeViewMode === 'purchases'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3 h-3 text-rose-500" />
            2. 매입원가 세분화 ({purchasesCount})
          </button>
        </div>

        {/* 실시간 검색창 */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="차종, 거래처, 품목명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 안내 배너 */}
      <div className="px-3.5 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-bold">
        <span className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          항목(대분류)을 탭하면 세부 부품/자재 규격, 출하량, 단가 등 상세 내역이 팝업됩니다.
        </span>
        <span className="text-[10px] text-blue-500 hidden sm:inline font-normal">
          항목 클릭 시 세부 팝업
        </span>
      </div>
    </>
  );
};

export default SalesPurchaseControlBar;
