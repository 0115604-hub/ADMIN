import React from "react";
import HanulSettlementModal from "./HanulSettlementModal";
import HanulExpenseSummaryModal from "./HanulExpenseSummaryModal";
import { useHanulTaxInvoiceState } from "./hanul/tax/useHanulTaxInvoiceState";
import HanulTaxHeaderNav from "./hanul/tax/HanulTaxHeaderNav";
import HanulTaxBaselineTable from "./hanul/tax/HanulTaxBaselineTable";
import HanulTaxMonthlySalesBanner from "./hanul/tax/HanulTaxMonthlySalesBanner";
import HanulTaxEditableTable from "./hanul/tax/HanulTaxEditableTable";
import HanulTaxSummaryModal from "./hanul/tax/HanulTaxSummaryModal";

/**
 * HanulTaxInvoiceView
 * 한울 세금계산서 및 9BQC 8가지 항목 매출단가 관리 뷰 파사드 컴포넌트
 */
export const HanulTaxInvoiceView = () => {
  const {
    availableMonths,
    activeMonth,
    monthTitle,
    activeMonthNum,
    handleSelectMonth,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    handleOpenSummaryModal,
    isExpenseSummaryModalOpen,
    setIsExpenseSummaryModalOpen,
    isAdminSettlementModalOpen,
    setIsAdminSettlementModalOpen,
    isSaved,
    handleExportCSV,
    handleResetDefaults,
    baselineSalesItems,
    baselineTotalQty,
    baselineTotalAmount,
    baselineTotalTax,
    baselineTotalGross,
    baselineAvgUnitPrice,
    salesItems,
    totalSalesQty,
    totalSalesAmount,
    totalSalesTax,
    totalSalesGross,
    avgSalesUnitPrice,
    prevMonthSales,
    settlementData,
    handlePrevMonthSalesChange,
    frtUnitPrice,
    rrUnitPrice,
    handleFrtPriceChange,
    handleRrPriceChange
  } = useHanulTaxInvoiceState();

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-fadeIn pb-12">
      {/* 🗓️ 최상단: 월 선택(드롭다운 전용) & 액션 바 */}
      <HanulTaxHeaderNav
        monthTitle={monthTitle}
        activeMonth={activeMonth}
        handleSelectMonth={handleSelectMonth}
        availableMonths={availableMonths}
        setIsAdminSettlementModalOpen={setIsAdminSettlementModalOpen}
        handleExportCSV={handleExportCSV}
        handleResetDefaults={handleResetDefaults}
        isSaved={isSaved}
      />

      {/* 🌟 1. [제일 위] 8가지 항목 기준 요약 패널 (기준원형 보존) */}
      <HanulTaxBaselineTable
        monthTitle={monthTitle}
        baselineSalesItems={baselineSalesItems}
        baselineTotalQty={baselineTotalQty}
        baselineTotalAmount={baselineTotalAmount}
        baselineTotalTax={baselineTotalTax}
        baselineTotalGross={baselineTotalGross}
        baselineAvgUnitPrice={baselineAvgUnitPrice}
      />

      {/* 🌟 2. [한울 {N}월 매출금액] 깔끔한 한줄짜리 금액 입력 패널 + 실시간 정산/지출공제 연동 */}
      <HanulTaxMonthlySalesBanner
        activeMonthNum={activeMonthNum}
        prevMonthSales={prevMonthSales}
        handlePrevMonthSalesChange={handlePrevMonthSalesChange}
        settlementData={settlementData}
        setIsExpenseSummaryModalOpen={setIsExpenseSummaryModalOpen}
      />

      {/* 🌟 3. [단가재수정 및 실시간 자동계산 패널] 단순화된 FRT & RR 입력 박스 */}
      <HanulTaxEditableTable
        salesItems={salesItems}
        frtUnitPrice={frtUnitPrice}
        rrUnitPrice={rrUnitPrice}
        handleFrtPriceChange={handleFrtPriceChange}
        handleRrPriceChange={handleRrPriceChange}
        handleOpenSummaryModal={handleOpenSummaryModal}
        totalSalesQty={totalSalesQty}
        totalSalesAmount={totalSalesAmount}
        totalSalesTax={totalSalesTax}
        totalSalesGross={totalSalesGross}
        avgSalesUnitPrice={avgSalesUnitPrice}
      />

      {/* 🌟 4. [정리본 팝업 모달] 부품명, 수량, 적용단가, 공급가액, 총합계액 전용 표 */}
      <HanulTaxSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        monthTitle={monthTitle}
        frtUnitPrice={frtUnitPrice}
        rrUnitPrice={rrUnitPrice}
        salesItems={salesItems}
        totalSalesQty={totalSalesQty}
        totalSalesAmount={totalSalesAmount}
        totalSalesGross={totalSalesGross}
        avgSalesUnitPrice={avgSalesUnitPrice}
      />

      {/* 🌟 한울 공제내역 간단 요약 모달 */}
      <HanulExpenseSummaryModal
        isOpen={isExpenseSummaryModalOpen}
        onClose={() => setIsExpenseSummaryModalOpen(false)}
        month={activeMonth}
        onOpenFullModal={() => setIsAdminSettlementModalOpen(true)}
      />

      {/* 🌟 Admin용 한울 정산/지출공제 팝업 모달 */}
      <HanulSettlementModal
        isOpen={isAdminSettlementModalOpen}
        onClose={() => setIsAdminSettlementModalOpen(false)}
        initialMonth={activeMonth}
      />
    </div>
  );
};

export default HanulTaxInvoiceView;
