import React from "react";
import {
  PANEL_KEYS,
  STUDIO_MANAGERS
} from "../../../config/dashboardPanelConfig";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  SalesPurchaseSummarySection,
  AttendanceSummarySection,
  QualityStatusSection,
  ExtrusionDowntimeSection,
  DailyWorkLogTableSection,
  LegoWorkReportBuilderBar,
  TelegramLiveLoungePanel
} from "../sections";
import { UnifiedAbnormalityControlPanel } from "../UnifiedAbnormalityControlPanel";
import { MachiningWorkReportTable } from "../../machining/MachiningWorkReportTable";
import { SeolExtrusionWorkReportTable } from "../../extrusion/SeolExtrusionWorkReportTable";
import { IncomingInspectionPanel } from "../../inspection/IncomingInspectionPanel";
import { LuxInspectionPanel } from "../../inspection/LuxInspectionPanel";

/**
 * ManagerDashboardBlockRenderer
 * 16개 표준 대시보드 블록(공통일정, 캘린더, 근태, 품질, 작업일보 등)에 대한 단일 스위치 렌더러
 */
export const ManagerDashboardBlockRenderer = ({
  blockKey,
  activeProfile,
  panelCustomSettings,
  inlineEditingBlockKey,
  handleUpdateInlineDraft,
  // Props for Individual Panels
  onNavigateTab,
  isAdmin,
  hasNewScheduleMessage,
  allActiveCommonSchedules,
  setSelectedCommonScheduleForComments,
  todayDateStr,
  isGeneralManager,
  handleDeleteCommonSchedule,
  setCommonScheduleModalOpen,
  pendingCount,
  holdCount,
  scheduleLeaveType,
  setScheduleLeaveType,
  scheduleSelectedDate,
  setScheduleSelectedDate,
  scheduleReasonInput,
  setScheduleReasonInput,
  handleRegisterSchedule,
  scheduleSaving,
  scheduleCameraInputRef,
  scheduleFileInputRef,
  handleScheduleFiles,
  scheduleAttachedFiles,
  isProcessingScheduleFiles,
  handleRemoveScheduleFile,
  setPreviewImageModal,
  shareDropdownRef,
  isShareDropdownOpen,
  setIsShareDropdownOpen,
  sharedWorkers,
  setSharedWorkers,
  toggleSharedWorker,
  togglePlantSharedWorkers,
  ADMIN_USERS,
  PLANTS,
  myActiveLeaves,
  formatKSTDate,
  setScheduleDetailModal,
  handleRequestDismissOrDelete,
  showMiniCalendar,
  setShowMiniCalendar,
  scheduleWeekAnchor,
  handlePrevWeek,
  handleResetToToday,
  handleNextWeek,
  myWeeklyCalendarDays,
  monthTitle,
  currentMonthData,
  todayFormattedLabel,
  formatAmount,
  totalSales,
  totalPurchases,
  purchaseRatio,
  filteredUnwrittenCompanies,
  filteredCompanyOverviewStats,
  filteredPendingApprovalCards,
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate,
  selectedMonth,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,
  extrusionSummaryList,
  isMyeongjae,
  isDongwook,
  pendingSamrangjinCount,
  pendingHallimCount,
  setIsWorkLogsSummaryModalOpen,
  filterPlant,
  setFilterPlant,
  workLogs,
  paginatedLogs,
  handleOpenLogDetail,
  canApproveLog,
  isWorkLogApproved,
  handleOpenEditModal,
  handleDeleteLog,
  filteredLogs,
  currentLogPage,
  setCurrentLogPage,
  LOGS_PER_PAGE,
  totalLogPages,
  handleOpenWorkLogModal,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount,
  activeMachiningQualityCount,
  activeExtrusionQualityCount
}) => {
  const isThisBlockEditing = inlineEditingBlockKey === blockKey;
  const currentBlockSettings = panelCustomSettings[blockKey] || null;

  switch (blockKey) {
    // 1. 📢 사내 공통일정
    case PANEL_KEYS.COMMON_SCHEDULE:
      return (
        <CommonScheduleBar
          hasNewScheduleMessage={hasNewScheduleMessage}
          allActiveCommonSchedules={allActiveCommonSchedules}
          setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
          todayDateStr={todayDateStr}
          isGeneralManager={isGeneralManager}
          isAdmin={isAdmin}
          handleDeleteCommonSchedule={handleDeleteCommonSchedule}
          setCommonScheduleModalOpen={setCommonScheduleModalOpen}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 2. 📅 관리자 캘린더 센터
    case PANEL_KEYS.CALENDAR_SCHEDULE:
    case "calendar_schedule":
    case "calendar_center":
      return (
        <WorkerScheduleCalendarSection
          workerPlant={activeProfile.plant || "삼랑진공장"}
          workerFullName={activeProfile.name || "관리자"}
          pendingCount={pendingCount}
          holdCount={holdCount}
          officialTitle={activeProfile.title || "책임"}
          isManagerRole={true}
          isAdmin={isAdmin || activeProfile.role === "ADMIN"}
          scheduleLeaveType={scheduleLeaveType}
          setScheduleLeaveType={setScheduleLeaveType}
          scheduleSelectedDate={scheduleSelectedDate}
          setScheduleSelectedDate={setScheduleSelectedDate}
          scheduleReasonInput={scheduleReasonInput}
          setScheduleReasonInput={setScheduleReasonInput}
          handleRegisterSchedule={handleRegisterSchedule}
          scheduleSaving={scheduleSaving}
          scheduleCameraInputRef={scheduleCameraInputRef}
          scheduleFileInputRef={scheduleFileInputRef}
          handleScheduleFiles={handleScheduleFiles}
          scheduleAttachedFiles={scheduleAttachedFiles}
          isProcessingScheduleFiles={isProcessingScheduleFiles}
          handleRemoveScheduleFile={handleRemoveScheduleFile}
          setPreviewImageModal={setPreviewImageModal}
          shareDropdownRef={shareDropdownRef}
          isShareDropdownOpen={isShareDropdownOpen}
          setIsShareDropdownOpen={setIsShareDropdownOpen}
          sharedWorkers={sharedWorkers}
          setSharedWorkers={setSharedWorkers}
          toggleSharedWorker={toggleSharedWorker}
          togglePlantSharedWorkers={togglePlantSharedWorkers}
          ADMIN_USERS={ADMIN_USERS}
          PLANTS={PLANTS}
          myActiveLeaves={myActiveLeaves}
          formatKSTDate={formatKSTDate}
          setScheduleDetailModal={setScheduleDetailModal}
          handleRequestDismissOrDelete={handleRequestDismissOrDelete}
          showMiniCalendar={showMiniCalendar}
          setShowMiniCalendar={setShowMiniCalendar}
          scheduleWeekAnchor={scheduleWeekAnchor}
          handlePrevWeek={handlePrevWeek}
          handleResetToToday={handleResetToToday}
          handleNextWeek={handleNextWeek}
          myWeeklyCalendarDays={myWeeklyCalendarDays}
          onNavigateTab={onNavigateTab}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 🚨 부적합경보 등록 바 (품질이슈 긴급 등록 바)
    case PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR:
    case "quality_defect_alert_bar":
      if (!setIsHanulQualityIssueModalOpen) return null;
      return (
        <div
          onClick={() => setIsHanulQualityIssueModalOpen(true)}
          className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/90 text-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-500/50 shadow-md shadow-slate-950/40 flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 max-w-full animate-fadeIn cursor-pointer group hover:border-indigo-400 transition-all"
          title="부적합경보 및 품질이슈 등록/관리"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 group-hover:scale-105 transition-transform">
              🚨
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-tight text-white group-hover:text-indigo-200 transition-colors truncate">
                  {currentBlockSettings?.customTitle || "부적합경보 및 라인 긴급조치 등록"}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-700/60 shrink-0">
                  긴급품질
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                오륙/조영/압출 부적합 발생 시 즉각 등록하여 전사 공유 및 결재 라인에 전송합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-xs shadow-md shrink-0 group-hover:from-rose-500 group-hover:to-red-500 transition-all"
          >
            + 경보 등록
          </button>
        </div>
      );

    // 🛡️ 4M 변동점 & 이상통합 관제 패널 (4M 정식등록대장)
    case PANEL_KEYS.ABNORMALITY_4M:
    case PANEL_KEYS.ABNORMALITY_CONTROL:
    case "abnormality_4m":
    case "abnormality_control":
      return (
        <UnifiedAbnormalityControlPanel
          currentProfile={activeProfile}
          onNavigateTab={onNavigateTab}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 🔬 중요ITEM 일일품질 요약 / 품질 현황 요약
    case PANEL_KEYS.QUALITY_SUMMARY:
    case PANEL_KEYS.QUALITY_STATUS:
    case "quality_summary":
    case "quality_status":
      return (
        <QualityStatusSection
          selectedMonth={selectedMonth}
          liveQualityCurrentMonthly={liveQualityCurrentMonthly}
          liveQualityPrevMonthly={liveQualityPrevMonthly}
          handleOpenQualityPopup={handleOpenQualityPopup}
          onNavigateTab={onNavigateTab}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
          onOpenIssueActionModal={() => {
            if (onNavigateTab) onNavigateTab("extrusion_downtime");
          }}
          onOpenIssueModal={() => {
            if (onNavigateTab) onNavigateTab("quality_control");
          }}
        />
      );

    // 6. 💰 매출/매입 요약 현황
    case PANEL_KEYS.SALES_PURCHASE:
    case "sales_purchase":
      return (
        <SalesPurchaseSummarySection
          monthTitle={monthTitle}
          currentMonthData={currentMonthData}
          todayFormattedLabel={todayFormattedLabel}
          formatAmount={formatAmount}
          totalSales={totalSales}
          totalPurchases={totalPurchases}
          purchaseRatio={purchaseRatio}
          onNavigateTab={onNavigateTab}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 7. ⏱️ 5개사 통합 특근 및 출결 현황
    case PANEL_KEYS.ATTENDANCE:
    case PANEL_KEYS.ATTENDANCE_SUMMARY:
    case "attendance":
    case "attendance_summary":
      return (
        <AttendanceSummarySection
          filteredUnwrittenCompanies={filteredUnwrittenCompanies}
          filteredCompanyOverviewStats={filteredCompanyOverviewStats}
          filteredPendingApprovalCards={filteredPendingApprovalCards}
          pushModalHistory={pushModalHistory}
          setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
          onNavigateTab={onNavigateTab}
          formatKoreanWorkDate={formatKoreanWorkDate}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 9. 🏭 압출동 주간 비가동내역 요약
    case PANEL_KEYS.EXTRUSION_DOWNTIME:
      return (
        <ExtrusionDowntimeSection
          onNavigateTab={onNavigateTab}
          extrusionSummaryList={extrusionSummaryList}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 10. ⚙️ 가공동 실시간 작업일보
    case PANEL_KEYS.MACHINING_WORK_REPORT:
      return (
        <MachiningWorkReportTable
          onOpenReportModal={() => {
            if (onNavigateTab) onNavigateTab("machining");
          }}
          currentWorkerName={activeProfile.name || ""}
          hideCreateButtons={Boolean(
            activeProfile.name === "윤경수" ||
              activeProfile.id === "sam_ks" ||
              activeProfile.name === "양인나" ||
              activeProfile.id === "sam_in"
          )}
        />
      );

    // 11. 🏭 압출동 실시간 작업일보
    case PANEL_KEYS.SEOL_EXTRUSION_REPORT:
      return (
        <SeolExtrusionWorkReportTable
          onOpenReportModal={() => {
            if (onNavigateTab) onNavigateTab("extrusion");
          }}
          currentWorkerName={activeProfile.name || "설유철"}
        />
      );

    // 12. 📋 일일업무일지 현황
    case PANEL_KEYS.WORK_LOGS:
      return (
        <DailyWorkLogTableSection
          isMyeongjae={activeProfile.name === "이명재" || isMyeongjae}
          isDongwook={activeProfile.name === "김동욱" || isDongwook}
          isAdmin={isAdmin || activeProfile.role === "ADMIN"}
          pendingSamrangjinCount={pendingSamrangjinCount}
          pendingHallimCount={pendingHallimCount}
          setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
          filterPlant={filterPlant}
          setFilterPlant={setFilterPlant}
          workLogs={workLogs}
          pushModalHistory={pushModalHistory}
          paginatedLogs={paginatedLogs}
          handleOpenLogDetail={handleOpenLogDetail}
          canApproveLog={canApproveLog}
          isWorkLogApproved={isWorkLogApproved}
          handleOpenEditModal={handleOpenEditModal}
          handleDeleteLog={handleDeleteLog}
          currentProfile={activeProfile}
          filteredLogs={filteredLogs}
          currentLogPage={currentLogPage}
          setCurrentLogPage={setCurrentLogPage}
          LOGS_PER_PAGE={LOGS_PER_PAGE}
          totalLogPages={totalLogPages}
          handleOpenWorkLogModal={handleOpenWorkLogModal}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 13. ✈️ 텔레그램 실시간 소통 라운지
    case PANEL_KEYS.TELEGRAM_LIVE_LOUNGE:
      return <TelegramLiveLoungePanel currentProfile={activeProfile} />;

    // 14. 🧩 레고블록 작업일보 빌더
    case PANEL_KEYS.WORK_REPORT_TEMPLATES:
      return (
        <LegoWorkReportBuilderBar
          onNavigateTab={onNavigateTab}
          currentProfile={activeProfile}
        />
      );

    // 15. 🔬 원·부자재 수입검사 입고관리 대장
    case PANEL_KEYS.INCOMING_INSPECTION:
      return (
        <IncomingInspectionPanel
          currentProfile={activeProfile}
          onNavigateTab={onNavigateTab}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    // 16. 💡 조도측정일보
    case PANEL_KEYS.LUX_INSPECTION:
      return (
        <LuxInspectionPanel
          currentProfile={activeProfile}
          customSettings={currentBlockSettings}
          isInlineEditing={isThisBlockEditing}
          onUpdateDraft={handleUpdateInlineDraft}
        />
      );

    default:
      return null;
  }
};
