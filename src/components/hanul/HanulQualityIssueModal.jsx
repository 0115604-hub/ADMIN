import React from "react";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import WorkReportNonconformanceLedgerPanel from "../common/WorkReportNonconformanceLedgerPanel";
import { useHanulQualityIssueModalState } from "./qualityModal/useHanulQualityIssueModalState";
import { QualityIssueModalHeader } from "./qualityModal/QualityIssueModalHeader";
import { QualityIssueRegistrationForm } from "./qualityModal/QualityIssueRegistrationForm";
import { QualityIssueSiteOnlyTable } from "./qualityModal/QualityIssueSiteOnlyTable";
import { QualityIssueDetailModal } from "./qualityModal/QualityIssueDetailModal";

export const HanulQualityIssueModal = ({ isOpen, onClose }) => {
  const state = useHanulQualityIssueModalState({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-indigo-500/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden cursor-default animate-scaleUp text-slate-900 dark:text-white"
      >
        {/* 1. Modal Header Banner */}
        <QualityIssueModalHeader
          companyLabel={state.companyLabel}
          headerBadgeLabel={state.headerBadgeLabel}
          stats={state.stats}
          onClose={onClose}
        />

        {/* Scrollable Body */}
        <div
          ref={state.modalBodyRef}
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar"
        >
          {/* Mobile KPI Summary */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">
                🚨 진행중
              </span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                {state.stats.active}건
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                ✅ 조치완료
              </span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {state.stats.resolved}건
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                전체
              </span>
              <span className="font-mono font-black text-slate-700 dark:text-slate-200 text-sm">
                {state.stats.total}건
              </span>
            </div>
          </div>

          {/* 2. Top Section: Quality Issue Registration Panel */}
          <QualityIssueRegistrationForm
            companyLabel={state.companyLabel}
            currentProfile={state.currentProfile}
            editingIssueId={state.editingIssueId}
            setEditingIssueId={state.setEditingIssueId}
            todayStr={state.todayStr}
            defaultLineName={state.defaultLineName}
            form={state.form}
            setForm={state.setForm}
            handleSubmit={state.handleSubmit}
            processOptions={state.processOptions}
            defectOptions={state.defectOptions}
            causeFileInputRef={state.causeFileInputRef}
            actionFileInputRef={state.actionFileInputRef}
            isProcessingCauseImages={state.isProcessingCauseImages}
            isProcessingActionImages={state.isProcessingActionImages}
            handleCauseImageFiles={state.handleCauseImageFiles}
            handleRemoveCauseImage={state.handleRemoveCauseImage}
            handleActionImageFiles={state.handleActionImageFiles}
            handleRemoveActionImage={state.handleRemoveActionImage}
            setPreviewImage={state.setPreviewImage}
            isProcessing={state.isProcessing}
            handleRegisterWithMode={state.handleRegisterWithMode}
          />

          {/* 3. Bottom Section: 1-Line Table View */}
          <QualityIssueSiteOnlyTable
            companyLabel={state.companyLabel}
            filteredIssues={state.filteredIssues}
            searchQuery={state.searchQuery}
            setSearchQuery={state.setSearchQuery}
            selectedStatusFilter={state.selectedStatusFilter}
            setSelectedStatusFilter={state.setSelectedStatusFilter}
            selectedLineFilter={state.selectedLineFilter}
            setSelectedLineFilter={state.setSelectedLineFilter}
            processOptions={state.processOptions}
            setDetailModalIssue={state.setDetailModalIssue}
            setPreviewImage={state.setPreviewImage}
            handleResolve={state.handleResolve}
            handleEdit={state.handleEdit}
            handleDelete={state.handleDelete}
          />

          {/* 3-2. 작업일보내 부적합발생패널 */}
          <WorkReportNonconformanceLedgerPanel
            filterCompany={state.companyLabel}
            currentProfile={state.currentProfile}
            titlePrefix={state.companyLabel}
          />
        </div>
      </div>

      {/* 4. Detail Modal */}
      <QualityIssueDetailModal
        detailModalIssue={state.detailModalIssue}
        setDetailModalIssue={state.setDetailModalIssue}
        setPreviewImage={state.setPreviewImage}
        handleResolve={state.handleResolve}
        handleEdit={state.handleEdit}
      />

      {/* Image Lightbox Preview Modal */}
      {state.previewImage && (
        <ImagePreviewModal
          previewImage={state.previewImage}
          onClose={() => state.setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default HanulQualityIssueModal;
