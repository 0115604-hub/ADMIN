import React from "react";
import { createPortal } from "react-dom";
import HanulDocumentImageViewer from "./HanulDocumentImageViewer";
import {
  renumberExpenses,
  getCurrentYearMonthKST,
  getPreviousYearMonth,
  getHanulSettlementMonthOptions
} from "./hanul/settlement/hanulSettlementHelpers";
import { useHanulSettlementModalState } from "./hanul/settlement/useHanulSettlementModalState";
import HanulSettlementHeaderNav from "./hanul/settlement/HanulSettlementHeaderNav";
import HanulSettlementExpenseList from "./hanul/settlement/HanulSettlementExpenseList";
import HanulSettlementFooter from "./hanul/settlement/HanulSettlementFooter";

// Re-export helper functions for backward compatibility
export {
  renumberExpenses,
  getCurrentYearMonthKST,
  getPreviousYearMonth,
  getHanulSettlementMonthOptions
};

/**
 * HanulSettlementModal
 * 한울 지출내역 등록 및 증빙 뷰어 모달 파사드 컴포넌트
 */
export const HanulSettlementModal = ({ isOpen, onClose, initialMonth }) => {
  const {
    formatAmount,
    selectedMonth,
    status,
    viewMode,
    setViewMode,
    isViewerModalOpen,
    setIsViewerModalOpen,
    activeViewerAttId,
    setActiveViewerAttId,
    activeViewerPageIndex,
    setActiveViewerPageIndex,
    isConverting,
    uploadProgress,
    conversionError,
    setConversionError,
    fileInputRef,
    monthDropdownOptions,
    attachments,
    showOnlyWithAmount,
    setShowOnlyWithAmount,
    focusedExpenseId,
    setFocusedExpenseId,
    calculatedTotals,
    visibleExpenses,
    expenses,
    autoParsedBanner,
    setAutoParsedBanner,
    isSavedToast,
    handleExpenseChange,
    handleInputBlur,
    handleAddExpenseItem,
    handleDeleteExpenseItem,
    handleFileUpload,
    handleDeleteAttachment,
    handleOpenViewer,
    handleMonthChange,
    handleSave,
    handleModalClose,
    handleResetExpenses,
    handleExportExcel
  } = useHanulSettlementModalState({ isOpen, onClose, initialMonth });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        className={`relative w-full ${
          viewMode === "split" ? "max-w-[96vw] xl:max-w-7xl" : "max-w-5xl"
        } bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500/50 flex flex-col max-h-[95vh] h-[92vh] overflow-hidden transition-all duration-200`}
      >
        {/* Top Header & Navigation & KPIs */}
        <HanulSettlementHeaderNav
          status={status}
          handleModalClose={handleModalClose}
          selectedMonth={selectedMonth}
          handleMonthChange={handleMonthChange}
          monthDropdownOptions={monthDropdownOptions}
          viewMode={viewMode}
          setViewMode={setViewMode}
          attachments={attachments}
          handleOpenViewer={handleOpenViewer}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          isConverting={isConverting}
          handleExportExcel={handleExportExcel}
          handleResetExpenses={handleResetExpenses}
          uploadProgress={uploadProgress}
          conversionError={conversionError}
          setConversionError={setConversionError}
          activeViewerAttId={activeViewerAttId}
          setActiveViewerAttId={setActiveViewerAttId}
          setActiveViewerPageIndex={setActiveViewerPageIndex}
          handleDeleteAttachment={handleDeleteAttachment}
          visibleExpenses={visibleExpenses}
          expenses={expenses}
          showOnlyWithAmount={showOnlyWithAmount}
          setShowOnlyWithAmount={setShowOnlyWithAmount}
          calculatedTotals={calculatedTotals}
          formatAmount={formatAmount}
        />

        {/* Modal Main Content Area: Left = Input Items Panel / Right = Document Image Viewer Panel */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Expense Input Grid */}
          <HanulSettlementExpenseList
            viewMode={viewMode}
            autoParsedBanner={autoParsedBanner}
            setAutoParsedBanner={setAutoParsedBanner}
            visibleExpenses={visibleExpenses}
            expenses={expenses}
            handleAddExpenseItem={handleAddExpenseItem}
            setShowOnlyWithAmount={setShowOnlyWithAmount}
            setFocusedExpenseId={setFocusedExpenseId}
            handleInputBlur={handleInputBlur}
            handleExpenseChange={handleExpenseChange}
            handleDeleteExpenseItem={handleDeleteExpenseItem}
          />

          {/* Right Panel: Converted Document Image Viewer Panel */}
          {viewMode === "split" && (
            <div className="w-full md:w-[50%] lg:w-[52%] p-2 sm:p-2.5 flex flex-col min-h-[360px] md:min-h-0 bg-slate-950">
              <HanulDocumentImageViewer
                attachments={attachments}
                activeAttachmentId={activeViewerAttId}
                initialPageIndex={activeViewerPageIndex}
                isEmbedded={true}
                onDeleteAttachment={handleDeleteAttachment}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <HanulSettlementFooter
          isSavedToast={isSavedToast}
          handleModalClose={handleModalClose}
          handleSave={handleSave}
        />
      </div>

      {/* Standalone Fullscreen Converted Document Image Viewer Lightbox */}
      <HanulDocumentImageViewer
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        attachments={attachments}
        activeAttachmentId={activeViewerAttId}
        initialPageIndex={activeViewerPageIndex}
        onDeleteAttachment={handleDeleteAttachment}
      />
    </div>,
    document.body
  );
};

export default HanulSettlementModal;
