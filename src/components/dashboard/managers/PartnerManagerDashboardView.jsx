import React from "react";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  AttendanceSummarySection
} from "../sections";

export const PartnerManagerDashboardView = ({
  // Common Schedule Props
  isAdmin,
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

  // Disaster Bar
  SevereDisasterBar,

  // Attendance Props (Partner Filtered)
  todayFormattedLabel,
  filteredUnwrittenCompanies = [],
  filteredCompanyOverviewStats = [],
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate
}) => {
  return (
    <>
      {/* 📌 사내 및 협력사 공통일정 */}
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

      {/* 🌟 협력사 대표 일정/연차 및 캘린더 센터 */}
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

      {/* 🚨 중대재해 안전판 */}
      {SevereDisasterBar && <SevereDisasterBar />}

      {/* 🌟 협력사 소속 인원 근태현황 및 관리 (해당 협력사 단독 표출) */}
      <AttendanceSummarySection
        todayFormattedLabel={todayFormattedLabel}
        unwrittenCompanies={filteredUnwrittenCompanies}
        onNavigateTab={onNavigateTab}
        companyOverviewStats={filteredCompanyOverviewStats}
        pendingApprovalCards={[]}
        pushModalHistory={pushModalHistory}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        formatKoreanWorkDate={formatKoreanWorkDate}
      />
    </>
  );
};

export default PartnerManagerDashboardView;
