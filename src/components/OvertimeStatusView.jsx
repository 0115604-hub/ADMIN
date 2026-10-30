import React from "react";
import { Sparkles } from "lucide-react";
import {
  getDayOfWeekKorean,
  getDayOfWeekFullKorean,
  getReportDateSortKey,
  formatShortMonthDay,
  renderPlantBadge,
  renderCompanyBadge,
  getFullCompanyPlantLabel,
  getCleanReportSummary,
  getCleanReportTitle,
  getCleanReportReason,
  getLiveApprovalForReport
} from "./overtime/overtimeHelpers.jsx";

export {
  getDayOfWeekKorean,
  getDayOfWeekFullKorean,
  getReportDateSortKey,
  formatShortMonthDay,
  renderPlantBadge,
  renderCompanyBadge,
  getFullCompanyPlantLabel,
  getCleanReportSummary,
  getCleanReportTitle,
  getCleanReportReason,
  getLiveApprovalForReport
};

import { OvertimeTopSection } from "./overtime/OvertimeTopSection.jsx";
import { OvertimeDailyInputTab } from "./overtime/OvertimeDailyInputTab.jsx";
import { OvertimeDetailTabRouter } from "./overtime/OvertimeDetailTabRouter.jsx";
import { OvertimeReportsTab } from "./overtime/OvertimeReportsTab.jsx";
import { OvertimeModals } from "./overtime/OvertimeModals.jsx";
import { useOvertimeStatusState } from "./overtime/useOvertimeStatusState";
import {
  COMPANIES,
  cleanCompanyName,
  calculateWorkerDailyHours,
  getKoreanHolidayInfo
} from "../services/overtimeSmartService.js";
import {
  getPlantForCompany,
  isWeekendByDate
} from "../services/overtimeService";

export const OvertimeStatusView = ({ onNavigateTab }) => {
  const state = useOvertimeStatusState();

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {state.showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-cyan-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-black tracking-wide">{state.toastMessage}</span>
        </div>
      )}

      {/* 🧭 Top Section: Toolbar & 5 Company Summary Cards */}
      <OvertimeTopSection
        currentMonthNum={state.currentMonthNum}
        selectedDay={state.selectedDay}
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        setDetailSubTab={state.setDetailSubTab}
        selectedMonth={state.selectedMonth}
        setMatrixViewMonth={state.setMatrixViewMonth}
        legacyReports={state.legacyReports}
        unwrittenCompanies={state.unwrittenCompanies}
        smartData={state.smartData}
        COMPANIES={COMPANIES}
        cleanCompanyName={cleanCompanyName}
        selectedCompanyFilter={state.selectedCompanyFilter}
        handleSelectCompanyAttendanceTable={state.handleSelectCompanyAttendanceTable}
        dailySummary={state.dailySummary}
        isWeekendDay={state.isWeekendDay}
        handleOpenManageWorkers={state.handleOpenManageWorkers}
        setQuickNewWorkerName={state.setQuickNewWorkerName}
        setQuickNewWorkerLine={state.setQuickNewWorkerLine}
        handleOpenAbsence4M={state.handleOpenAbsence4M}
      />

      {/* 📝 TAB 1: 근태/잔업/특근 일일 등록 */}
      {state.activeTab === "daily_input" && (
        <OvertimeDailyInputTab
          selectedDay={state.selectedDay}
          setSelectedDay={state.setSelectedDay}
          daysInMonth={state.daysInMonth}
          getKoreanHolidayInfo={getKoreanHolidayInfo}
          currentYear={state.currentYear}
          currentMonthNum={state.currentMonthNum}
          getDayFullLabel={state.getDayFullLabel}
          getDayLabel={state.getDayLabel}
          selectedCompanyFilter={state.selectedCompanyFilter}
          setSelectedCompanyFilter={state.setSelectedCompanyFilter}
          cleanCompanyName={cleanCompanyName}
          smartData={state.smartData}
          isWeekendDay={state.isWeekendDay}
          handleUnlockCompanyDayAttendance={state.handleUnlockCompanyDayAttendance}
          handleApproveCompanyDayAttendance={state.handleApproveCompanyDayAttendance}
          handleSubmitCompanyDayAttendance={state.handleSubmitCompanyDayAttendance}
          isSaving={state.isSaving}
          currentProfile={state.currentProfile}
          isAdmin={state.isAdmin}
          filteredAttendanceWorkers={state.filteredAttendanceWorkers}
          handleSetAllFilteredWorkersSameAsPrevDay={state.handleSetAllFilteredWorkersSameAsPrevDay}
          handleSetAllFilteredWorkersRegular={state.handleSetAllFilteredWorkersRegular}
          calculateWorkerDailyHours={calculateWorkerDailyHours}
          handleOpenPersonnelCard={state.handleOpenPersonnelCard}
          handleUpdateWorkerDayAttendance={state.handleUpdateWorkerDayAttendance}
          handleCustomOtHours={state.handleCustomOtHours}
        />
      )}

      {/* 📊 TAB 2: 상세 (월간 종합현황 대장 / 일자별 종합 집계 / 인원관리 & 인사카드) */}
      <OvertimeDetailTabRouter
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        detailSubTab={state.detailSubTab}
        setDetailSubTab={state.setDetailSubTab}
        setMatrixViewMonth={state.setMatrixViewMonth}
        selectedMonth={state.selectedMonth}
        prevYearMonth={state.prevYearMonth}
        matrixMonthNum={state.matrixMonthNum}
        matrixViewMonth={state.matrixViewMonth}
        workerMgmtStats={state.workerMgmtStats}
        currentMonthNum={state.currentMonthNum}
        selectedDay={state.selectedDay}
        setSelectedDay={state.setSelectedDay}
        daysInMonth={state.daysInMonth}
        currentYear={state.currentYear}
        getDayFullLabel={state.getDayFullLabel}
        dailySummary={state.dailySummary}
        handleSelectCompanyAttendanceTable={state.handleSelectCompanyAttendanceTable}
        prevMonthNum={state.prevMonthNum}
        prevYear={state.prevYear}
        smartData={state.smartData}
        prevMonthData={state.prevMonthData}
        matrixCustomMonthData={state.matrixCustomMonthData}
        lastSelectedPastMonth={state.lastSelectedPastMonth}
        setLastSelectedPastMonth={state.setLastSelectedPastMonth}
        personnelCardsMap={state.personnelCardsMap}
        matrixCompanyFilter={state.matrixCompanyFilter}
        setMatrixCompanyFilter={state.setMatrixCompanyFilter}
        matrixDaysInMonth={state.matrixDaysInMonth}
        matrixYear={state.matrixYear}
        pastMonthDropdownRef={state.pastMonthDropdownRef}
        isPastMonthDropdownOpen={state.isPastMonthDropdownOpen}
        setIsPastMonthDropdownOpen={state.setIsPastMonthDropdownOpen}
        triggerToast={state.triggerToast}
        handleExportExcel={state.handleExportExcel}
        getMatrixDayLabel={state.getMatrixDayLabel}
        handleOpenPersonnelCard={state.handleOpenPersonnelCard}
        isMatrixWeekendDay={state.isMatrixWeekendDay}
        setIsDayUnlockedForEdit={state.setIsDayUnlockedForEdit}
        showAddWorkerDrawer={state.showAddWorkerDrawer}
        setShowAddWorkerDrawer={state.setShowAddWorkerDrawer}
        handleQuickAddCompanyWorker={state.handleQuickAddCompanyWorker}
        quickNewWorkerCompany={state.quickNewWorkerCompany}
        setQuickNewWorkerCompany={state.setQuickNewWorkerCompany}
        setWorkerMgmtCompanyFilter={state.setWorkerMgmtCompanyFilter}
        quickNewWorkerName={state.quickNewWorkerName}
        setQuickNewWorkerName={state.setQuickNewWorkerName}
        quickNewWorkerDept={state.quickNewWorkerDept}
        setQuickNewWorkerDept={state.setQuickNewWorkerDept}
        quickNewWorkerLine={state.quickNewWorkerLine}
        setQuickNewWorkerLine={state.setQuickNewWorkerLine}
        quickNewWorkerPos={state.quickNewWorkerPos}
        setQuickNewWorkerPos={state.setQuickNewWorkerPos}
        workerMgmtCompanyFilter={state.workerMgmtCompanyFilter}
        workerMgmtSkillFilter={state.workerMgmtSkillFilter}
        setWorkerMgmtSkillFilter={state.setWorkerMgmtSkillFilter}
        workerMgmtMultiSkillOnly={state.workerMgmtMultiSkillOnly}
        setWorkerMgmtMultiSkillOnly={state.setWorkerMgmtMultiSkillOnly}
        workerMgmtSearch={state.workerMgmtSearch}
        setWorkerMgmtSearch={state.setWorkerMgmtSearch}
        workerMgmtList={state.workerMgmtList}
        handleOpenDeleteWorkerModal={state.handleOpenDeleteWorkerModal}
      />

      {/* 📑 TAB 3: 특근보고서 관리 */}
      {state.activeTab === "legacy_reports" && (
        <OvertimeReportsTab
          legacyReports={state.legacyReports}
          isWeekendByDate={isWeekendByDate}
          reportListFilter={state.reportListFilter}
          setReportListFilter={state.setReportListFilter}
          cleanCompanyName={cleanCompanyName}
          reportListSearch={state.reportListSearch}
          setReportListSearch={state.setReportListSearch}
          getReportDateSortKey={getReportDateSortKey}
          dateSortOrder={state.dateSortOrder}
          setDateSortOrder={state.setDateSortOrder}
          COMPANIES={COMPANIES}
          setActiveTab={state.setActiveTab}
          formatShortMonthDay={formatShortMonthDay}
          getPlantForCompany={getPlantForCompany}
          renderPlantBadge={renderPlantBadge}
          renderCompanyBadge={renderCompanyBadge}
          handleOpenLegacyReport={state.handleOpenLegacyReport}
          handleEditReport={state.handleEditReport}
          handleDeleteReport={state.handleDeleteReport}
        />
      )}

      {/* 📑 MODALS: 특근보고서 상세 / 인사카드 / 4M / 인원삭제 */}
      <OvertimeModals
        isLegacyModalOpen={state.isLegacyModalOpen}
        setIsLegacyModalOpen={state.setIsLegacyModalOpen}
        selectedLegacyReport={state.selectedLegacyReport}
        setSelectedLegacyReport={state.setSelectedLegacyReport}
        approvalDocs={state.approvalDocs}
        handleDeleteReport={state.handleDeleteReport}
        currentProfile={state.currentProfile}
        isAdmin={state.isAdmin}
        triggerToast={state.triggerToast}
        handleEditReport={state.handleEditReport}
        isPersonnelModalOpen={state.isPersonnelModalOpen}
        setIsPersonnelModalOpen={state.setIsPersonnelModalOpen}
        selectedPersonnelWorker={state.selectedPersonnelWorker}
        setSelectedPersonnelWorker={state.setSelectedPersonnelWorker}
        selectedPersonnelWorkerIndex={state.selectedPersonnelWorkerIndex}
        handleSavePersonnelCard={state.handleSavePersonnelCard}
        handleOpenDeleteWorkerModal={state.handleOpenDeleteWorkerModal}
        isAbsence4MModalOpen={state.isAbsence4MModalOpen}
        setIsAbsence4MModalOpen={state.setIsAbsence4MModalOpen}
        absence4MCompany={state.absence4MCompany}
        selectedDay={state.selectedDay}
        currentYear={state.currentYear}
        currentMonthNum={state.currentMonthNum}
        effectiveMatrix={state.effectiveMatrix}
        smartData={state.smartData}
        workerToDelete={state.workerToDelete}
        setWorkerToDelete={state.setWorkerToDelete}
        isDeletingWorker={state.isDeletingWorker}
        handleConfirmDeleteWorker={state.handleConfirmDeleteWorker}
      />
    </div>
  );
};

export default OvertimeStatusView;
