import React from "react";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  YuseongCustomSection,
  BurimtechCustomSection,
  AttendanceSummarySection,
  QualityStatusSection,
  ExtrusionDowntimeSection,
  DailyWorkLogTableSection
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

  // 🌟 Partner Custom Props: Yuseong
  handleOpenYuseongReport,
  activeYuseongQualityCount = 0,

  // 🌟 Attendance Props (Full 5-company stats + partner priority)
  todayFormattedLabel,
  filteredUnwrittenCompanies = [],
  filteredCompanyOverviewStats = [],
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate,

  // 🌟 공통사항 2: 금형별 일일품질 요약 Props
  selectedMonth,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,

  // 🌟 공통사항 3: 압출동 주간 비가동내역 Props
  extrusionSummaryList,

  // 🌟 공통사항 4: 일일업무일지 현황 Props
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
  handleOpenWorkLogModal
}) => {
  // 협력사 판별 (유성 / 부림텍)
  const isYuseong = Boolean(
    currentProfile?.company === "유성" ||
    currentProfile?.name === "유성" ||
    currentProfile?.id === "sam_ys" ||
    String(currentProfile?.id || "").startsWith("sam_ys")
  );

  const isBurimtech = Boolean(
    currentProfile?.company?.includes("부림") ||
    currentProfile?.name === "부림텍" ||
    currentProfile?.portalType === "bulimtech" ||
    currentProfile?.id === "hal_br" ||
    String(currentProfile?.id || "").startsWith("hal_br")
  );

  return (
    <>
      {/* 📌 사내 및 협력사 공통일정 바 */}
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

      {/* 🌟 [커스텀 1] (주)유성 외주가공 전용: 부적합경보 + JK1/CE1/DT 작업일보 작성 및 대장 */}
      {isYuseong && (
        <YuseongCustomSection
          handleOpenYuseongReport={handleOpenYuseongReport}
          onNavigateTab={onNavigateTab}
          activeYuseongQualityCount={activeYuseongQualityCount}
          currentProfile={currentProfile}
        />
      )}

      {/* 🌟 [커스텀 2] (주)부림텍 외주가공 전용: 부적합경보 + 부림텍 작업일보 작성 및 대장 */}
      {isBurimtech && (
        <BurimtechCustomSection
          handleOpenWorkLogModal={handleOpenWorkLogModal}
          handleOpenLogDetail={handleOpenLogDetail}
          onNavigateTab={onNavigateTab}
          workLogs={workLogs}
          currentProfile={currentProfile}
          isWorkLogApproved={isWorkLogApproved}
          pushModalHistory={pushModalHistory}
        />
      )}

      {/* 🌟 [공통사항 1] 근태현황 및 관리 (전사 5개사 TOTAL 및 공통 근태) */}
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

      {/* 🌟 [공통사항 2] 금형별 일일품질 요약 */}
      <QualityStatusSection
        selectedMonth={selectedMonth}
        onNavigateTab={onNavigateTab}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
      />

      {/* 🌟 [공통사항 3] 압출동 주간 비가동내역 요약 */}
      <ExtrusionDowntimeSection
        onNavigateTab={onNavigateTab}
        extrusionSummaryList={extrusionSummaryList}
      />

      {/* 🌟 [공통사항 4] 일일업무일지 현황 (전사 승인 및 관리) */}
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
    </>
  );
};

export default PartnerManagerDashboardView;
