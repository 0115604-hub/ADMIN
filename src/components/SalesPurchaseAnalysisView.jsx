import { useState } from 'react';
import { useMonth } from '../context/MonthContext';
import {
  DEFAULT_2026_09_SALES_BREAKDOWN,
  DEFAULT_2026_09_PURCHASE_BREAKDOWN
} from '../data/salesPurchaseBreakdownData';

import { useSalesPurchaseFilters } from './sales/hooks/useSalesPurchaseFilters';
import { SalesPurchaseKpiCards } from './sales/SalesPurchaseKpiCards';
import { SalesPurchaseControlBar } from './sales/SalesPurchaseControlBar';
import { SalesBreakdownTable } from './sales/SalesBreakdownTable';
import { PurchaseBreakdownTable } from './sales/PurchaseBreakdownTable';
import { DetailBreakdownModal } from './sales/DetailBreakdownModal';

export {
  DEFAULT_2026_09_SALES_BREAKDOWN,
  DEFAULT_2026_09_PURCHASE_BREAKDOWN
};

/**
 * SalesPurchaseAnalysisView (Facade Container)
 * Main analytics dashboard for sales breakdown, purchase costs, and profitability analysis.
 */
export const SalesPurchaseAnalysisView = () => {
  const { selectedMonth, currentMonthData } = useMonth();
  const [selectedDetail, setSelectedDetail] = useState(null); // { type: 'sales' | 'purchase', data: item }

  const safeSelectedMonth = selectedMonth || '2026-09';
  const monthParts = safeSelectedMonth.split('-');
  const monthTitle = `${monthParts[0] || '2026'}년 ${monthParts[1] || '09'}월`;

  // Dynamic or fallback dataset
  const rawSales = currentMonthData?.salesBreakdown || DEFAULT_2026_09_SALES_BREAKDOWN;
  const rawPurchases = currentMonthData?.purchaseBreakdown || DEFAULT_2026_09_PURCHASE_BREAKDOWN;

  // Master KPI Figures
  const totalSales = currentMonthData?.totalSales || 1796457145;
  const totalExpenses = currentMonthData?.totalExpenses || 1453941153.46;
  const grossProfit = totalSales - totalExpenses;
  const costRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(2) : '80.93';
  const profitRatio = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : '19.07';

  // Filters & Subtotals Hook
  const {
    searchTerm,
    setSearchTerm,
    activeViewMode,
    setActiveViewMode,
    filteredSales,
    filteredPurchases,
    salesSubtotal,
    purchaseSubtotal
  } = useSalesPurchaseFilters(rawSales, rawPurchases);

  return (
    <div className="space-y-3.5 animate-fadeIn pb-10 text-slate-800 dark:text-slate-200">
      {/* 1. 상단 미니멀 4대 KPI 요약 카드 */}
      <SalesPurchaseKpiCards
        monthTitle={monthTitle}
        totalSales={totalSales}
        totalExpenses={totalExpenses}
        grossProfit={grossProfit}
        costRatio={costRatio}
        profitRatio={profitRatio}
      />

      {/* 2. 미니멀 컨트롤 바: 뷰 모드 탭 & 검색창 */}
      <SalesPurchaseControlBar
        activeViewMode={activeViewMode}
        setActiveViewMode={setActiveViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        salesCount={filteredSales.length}
        purchasesCount={filteredPurchases.length}
      />

      {/* 3. 메인 미니멀 테이블 패널: 대시보드 1번 & 2번 */}
      <div className={`grid gap-3.5 ${activeViewMode === 'all' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 대시보드 1번: 차종별 / 제품군별 매출 세분화 */}
        {(activeViewMode === 'all' || activeViewMode === 'sales') && (
          <SalesBreakdownTable
            filteredSales={filteredSales}
            salesSubtotal={salesSubtotal}
            onSelectDetail={(item) => setSelectedDetail(item)}
          />
        )}

        {/* 대시보드 2번: 거래처별 / 품목군별 매입원가 세분화 */}
        {(activeViewMode === 'all' || activeViewMode === 'purchases') && (
          <PurchaseBreakdownTable
            filteredPurchases={filteredPurchases}
            purchaseSubtotal={purchaseSubtotal}
            onSelectDetail={(item) => setSelectedDetail(item)}
          />
        )}
      </div>

      {/* 4. 세부내용 대화형 팝업 모달 */}
      <DetailBreakdownModal
        isOpen={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        selectedData={selectedDetail?.data}
        type={selectedDetail?.type}
      />
    </div>
  );
};

export const VehicleSalesView = SalesPurchaseAnalysisView;
export default SalesPurchaseAnalysisView;
