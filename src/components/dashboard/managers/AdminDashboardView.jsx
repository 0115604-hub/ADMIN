import React from "react";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  QualityStatusSection,
  DailyWorkLogTableSection,
  AdminAccessAndIncidentSection
} from "../sections";
import { UnifiedAbnormalityControlPanel } from "../UnifiedAbnormalityControlPanel";

export const AdminDashboardView = ({
  // Common Schedule Props
  isAdmin = true,
  hasNewScheduleMessage,
  allActiveCommonSchedules,
  setSelectedCommonScheduleForComments,
  todayDateStr,
  isGeneralManager,
  handleDeleteCommonSchedule,
  setCommonScheduleModalOpen,

  // Calendar & Schedule Props
  workerPlant,
  workerFullName,
  onNavigateTab,
  pendingCount,
  holdCount,
  officialTitle,
  isManagerRole,
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
  currentProfile,
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

  // Attendance & Common Date Props
  todayFormattedLabel,

  // 2. Attendance Props
  unwrittenCompanies = [],
  companyOverviewStats = [],
  pendingApprovalCards = [],
  filteredUnwrittenCompanies,
  filteredCompanyOverviewStats,
  filteredPendingApprovalCards,
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate,

  // 3. Quality Props
  selectedMonth,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,

  // 4. Extrusion Downtime Props
  extrusionSummaryList,

  // 5. Daily Work Log Props
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

  // 6 & 7. Admin Logs & Incident
  accessLogs,
  handleOpenWorkerLogs,
  formatRelativeAccessTime
}) => {
  return (
    <>
      {/* 📌 사내 공통일정 */}
      <CommonScheduleBar
        isAdmin={isAdmin}
        hasNewScheduleMessage={hasNewScheduleMessage}
        allActiveCommonSchedules={allActiveCommonSchedules}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
        todayDateStr={todayDateStr}
        isGeneralManager={isGeneralManager}
        handleDeleteCommonSchedule={handleDeleteCommonSchedule}
        setCommonScheduleModalOpen={setCommonScheduleModalOpen}
      />

      {/* 🌟 관리자 일정/연차 및 캘린더 센터 */}
      <WorkerScheduleCalendarSection
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingCount}
        holdCount={holdCount}
        officialTitle={officialTitle}
        isAdmin={isAdmin}
        isManagerRole={isManagerRole}
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
        currentProfile={currentProfile}
        ADMIN_USERS={ADMIN_USERS}
        PLANTS={PLANTS}
        myActiveLeaves={myActiveLeaves}
        todayDateStr={todayDateStr}
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
      />

      {/* 3. 금형별 일일품질 요약 */}
      <QualityStatusSection
        selectedMonth={selectedMonth}
        onNavigateTab={onNavigateTab}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
      />

      {/* 🛡️ 4M 변동점 및 이상통합 관제 패널 (4단계 경영진 최종승인 및 결재 관제 연동) */}
      <UnifiedAbnormalityControlPanel
        workLogs={workLogs}
        currentProfile={currentProfile}
        onNavigateTab={onNavigateTab}
      />

      {/* 5. 일일업무일지 현황 (전사 승인 및 관리) */}
      <DailyWorkLogTableSection
        isMyeongjae={isMyeongjae}
        isDongwook={isDongwook}
        isAdmin={isAdmin}
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
        currentProfile={currentProfile}
        filteredLogs={filteredLogs}
        currentLogPage={currentLogPage}
        setCurrentLogPage={setCurrentLogPage}
        LOGS_PER_PAGE={LOGS_PER_PAGE}
        totalLogPages={totalLogPages}
        handleOpenWorkLogModal={handleOpenWorkLogModal}
      />

      {/* 6. 실시간 접속기록 현황 & 7. 시스템 오류 및 조치 이력 관리 */}
      <AdminAccessAndIncidentSection
        isAdmin={isAdmin}
        PLANTS={PLANTS}
        accessLogs={accessLogs}
        handleOpenWorkerLogs={handleOpenWorkerLogs}
        formatRelativeAccessTime={formatRelativeAccessTime}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
};

export default AdminDashboardView;
