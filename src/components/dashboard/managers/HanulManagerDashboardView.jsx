import React from "react";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  HanulAndSevereDisasterSection,
  AttendanceSummarySection
} from "../sections";

export const HanulManagerDashboardView = ({
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

  // Hanul Specific Props
  isHanul = true,
  handleOpenHanulSettlementModal,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount = 0,
  handleOpenHanulReport,
  SevereDisasterBar,

  // Attendance Props (Hanul Filtered)
  todayFormattedLabel,
  filteredUnwrittenCompanies = [],
  filteredCompanyOverviewStats = [],
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate
}) => {
  return (
    <>
      {/* 📌 한울 및 사내 공통일정 */}
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

      {/* 🌟 한울 관리자 일정/연차 및 캘린더 센터 */}
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

      {/* 🌟 한울 외주가공 전용: 전월 지출내역 등록 + 한울품질경보 + 9BQC/LQ2a 작업일보 실시간 관리 대장 + 중대재해 안전판 */}
      <HanulAndSevereDisasterSection
        isHanul={isHanul}
        isAdmin={false}
        handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
        activeHanulQualityCount={activeHanulQualityCount}
        handleOpenHanulReport={handleOpenHanulReport}
        currentProfile={currentProfile}
        SevereDisasterBar={SevereDisasterBar}
      />

      {/* 🌟 한울 소속 인원 근태현황 및 관리 (한울 단독 집중 표출) */}
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

export default HanulManagerDashboardView;
