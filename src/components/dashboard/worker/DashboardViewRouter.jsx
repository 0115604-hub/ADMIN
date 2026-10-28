import React, { Suspense, lazy } from "react";
import { SevereDisasterBar } from "../../SevereDisasterBar";
import { SectionErrorBoundary } from "../../ErrorBoundary";
import { ADMIN_USERS, PLANTS } from "../../../context/AuthContext";
import { isWorkLogApproved } from "../../../services/workLogService";
import { formatKSTDate } from "../../../utils/dateUtils";
import { pushModalHistory } from "../../../utils/modalHistory";
import { LOGS_PER_PAGE } from "./workerDashboardConstants";

// Lazy-loaded role views to reduce initial bundle by ~800kB
const FieldWorkerDashboardView = lazy(() => import("../FieldWorkerDashboardView").then(m => ({ default: m.FieldWorkerDashboardView || m.default })));
const ExtrusionWorkerDashboardView = lazy(() => import("../../extrusion/ExtrusionWorkerDashboardView").then(m => ({ default: m.ExtrusionWorkerDashboardView || m.default })));
const HanulWorkerDashboardView = lazy(() => import("../../hanul/HanulWorkerDashboardView").then(m => ({ default: m.HanulWorkerDashboardView || m.default })));
const MachiningWorkerDashboardView = lazy(() => import("../../machining/MachiningWorkerDashboardView").then(m => ({ default: m.MachiningWorkerDashboardView || m.default })));
const YuseongWorkerDashboardView = lazy(() => import("../../yuseong/YuseongWorkerDashboardView").then(m => ({ default: m.YuseongWorkerDashboardView || m.default })));
const HanulManagerDashboardView = lazy(() => import("../managers/HanulManagerDashboardView").then(m => ({ default: m.HanulManagerDashboardView || m.default })));
const PartnerManagerDashboardView = lazy(() => import("../managers/PartnerManagerDashboardView").then(m => ({ default: m.PartnerManagerDashboardView || m.default })));
const InternalManagerDashboardView = lazy(() => import("../managers/InternalManagerDashboardView").then(m => ({ default: m.InternalManagerDashboardView || m.default })));
const AdminDashboardView = lazy(() => import("../managers/AdminDashboardView").then(m => ({ default: m.AdminDashboardView || m.default })));

const DashboardViewFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] w-full py-12 animate-fadeIn">
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-indigo-950 opacity-60"></div>
      <div className="absolute inset-0 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
    </div>
    <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
      화면을 불러오는 중입니다...
    </span>
  </div>
);

export function DashboardViewRouter({ state }) {
  const {
    currentProfile,
    isAdmin,
    isManagerRole,
    workerPlant,
    isHallim,
    workerFullName,
    officialTitle,
    isJaeyul,
    isExtrusionWorker,
    isHanulManager,
    isHanul,
    isPartnerProfile,
    assignedProcess,
    isMyeongjae,
    isDongwook,
    isGeneralManager,
    workerPosition,
    isManagerOrAdmin,
    isExtrusionWorkerOnly,
    isExtrusionOperatorWorker,
    isHanulOperatorWorker,
    isMachiningOperatorWorker,
    isYuseongOperatorWorker,
    selectedMonth,
    currentMonthData,
    formatAmount,
    todayFormattedLabel,
    todayDateStr,
    monthTitle,
    activeHanulQualityCount,
    activeMachiningQualityCount,
    activeExtrusionQualityCount,
    activeYuseongQualityCount,
    handleOpenHanulReport,
    handleOpenHanulSettlementModal,
    handleOpenYuseongReport,
    setIsHanulQualityIssueModalOpen,
    liveQualityPrevMonthly,
    liveQualityCurrentMonthly,
    handleOpenQualityPopup,
    extrusionSummaryList,
    filteredCompanyOverviewStats,
    filteredUnwrittenCompanies,
    pendingCount,
    holdCount,
    canApproveLog,
    setSelectedOvertimeReportForModal,
    filteredPendingApprovalCards,
    formatKoreanWorkDate,
    accessLogs,
    handleOpenWorkerLogs,
    formatRelativeAccessTime,
    totalSales,
    totalPurchases,
    purchaseRatio,
    setIsWorkLogsSummaryModalOpen,
    workerSchedule,
    commonSchedule,
    workLogCrud,
    onNavigateTab
  } = state;

  const renderDashboardContent = () => {
    // 1. Operator worker early returns
    if (isExtrusionOperatorWorker) {
      return <ExtrusionWorkerDashboardView onNavigateTab={onNavigateTab} />;
    }

    if (isHanulOperatorWorker) {
      return <HanulWorkerDashboardView onNavigateTab={onNavigateTab} />;
    }

    if (isMachiningOperatorWorker) {
      return <MachiningWorkerDashboardView onNavigateTab={onNavigateTab} />;
    }

    if (isYuseongOperatorWorker) {
      return <YuseongWorkerDashboardView onNavigateTab={onNavigateTab} />;
    }

  // 2. Field worker dashboard view
  if (!isManagerOrAdmin) {
    return (
      <FieldWorkerDashboardView
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        workerPosition={workerPosition}
        assignedProcess={assignedProcess}
        todayFormattedLabel={todayFormattedLabel}
        handleOpenWorkLogModal={workLogCrud.handleOpenWorkLogModal}
        isExtrusionWorkerOnly={isExtrusionWorkerOnly}
        onNavigateTab={onNavigateTab}
        todayLog={workLogCrud.todayLog}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenLogDetail={workLogCrud.handleOpenLogDetail}
        handleOpenEditModal={workLogCrud.handleOpenEditModal}
        workerLogsList={workLogCrud.workerLogsList}
        workerLogScope={workLogCrud.workerLogScope}
        setWorkerLogScope={workLogCrud.setWorkerLogScope}
        workerLogApprovalFilter={workLogCrud.workerLogApprovalFilter}
        setWorkerLogApprovalFilter={workLogCrud.setWorkerLogApprovalFilter}
        currentProfile={currentProfile}
        handleDeleteLog={workLogCrud.handleDeleteLog}
      />
    );
  }

  // 3. Manager dashboard views
  if (isHanulManager) {
    return (
      <HanulManagerDashboardView
        isAdmin={isAdmin}
        hasNewScheduleMessage={commonSchedule.hasNewScheduleMessage}
        allActiveCommonSchedules={commonSchedule.allActiveCommonSchedules}
        setSelectedCommonScheduleForComments={commonSchedule.setSelectedCommonScheduleForComments}
        todayDateStr={todayDateStr}
        isGeneralManager={isGeneralManager}
        handleDeleteCommonSchedule={commonSchedule.handleDeleteCommonSchedule}
        setCommonScheduleModalOpen={commonSchedule.setCommonScheduleModalOpen}
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingCount}
        holdCount={holdCount}
        officialTitle={officialTitle}
        isManagerRole={isManagerRole}
        scheduleLeaveType={workerSchedule.scheduleLeaveType}
        setScheduleLeaveType={workerSchedule.setScheduleLeaveType}
        scheduleSelectedDate={workerSchedule.scheduleSelectedDate}
        setScheduleSelectedDate={workerSchedule.setScheduleSelectedDate}
        scheduleReasonInput={workerSchedule.scheduleReasonInput}
        setScheduleReasonInput={workerSchedule.setScheduleReasonInput}
        handleRegisterSchedule={workerSchedule.handleRegisterSchedule}
        scheduleSaving={workerSchedule.scheduleSaving}
        scheduleCameraInputRef={workerSchedule.scheduleCameraInputRef}
        scheduleFileInputRef={workerSchedule.scheduleFileInputRef}
        handleScheduleFiles={workerSchedule.handleScheduleFiles}
        scheduleAttachedFiles={workerSchedule.scheduleAttachedFiles}
        isProcessingScheduleFiles={workerSchedule.isProcessingScheduleFiles}
        handleRemoveScheduleFile={workerSchedule.handleRemoveScheduleFile}
        setPreviewImageModal={workLogCrud.setPreviewImageModal}
        shareDropdownRef={workerSchedule.shareDropdownRef}
        isShareDropdownOpen={workerSchedule.isShareDropdownOpen}
        setIsShareDropdownOpen={workerSchedule.setIsShareDropdownOpen}
        sharedWorkers={workerSchedule.sharedWorkers}
        setSharedWorkers={workerSchedule.setSharedWorkers}
        toggleSharedWorker={workerSchedule.toggleSharedWorker}
        togglePlantSharedWorkers={workerSchedule.togglePlantSharedWorkers}
        currentProfile={currentProfile}
        ADMIN_USERS={ADMIN_USERS}
        PLANTS={PLANTS}
        myActiveLeaves={workerSchedule.myActiveLeaves}
        formatKSTDate={formatKSTDate}
        setScheduleDetailModal={workerSchedule.setScheduleDetailModal}
        handleRequestDismissOrDelete={workerSchedule.handleRequestDismissOrDelete}
        showMiniCalendar={workerSchedule.showMiniCalendar}
        setShowMiniCalendar={workerSchedule.setShowMiniCalendar}
        scheduleWeekAnchor={workerSchedule.scheduleWeekAnchor}
        handlePrevWeek={workerSchedule.handlePrevWeek}
        handleResetToToday={workerSchedule.handleResetToToday}
        handleNextWeek={workerSchedule.handleNextWeek}
        myWeeklyCalendarDays={workerSchedule.myWeeklyCalendarDays}
        isHanul={isHanul}
        handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
        activeHanulQualityCount={activeHanulQualityCount}
        handleOpenHanulReport={handleOpenHanulReport}
        SevereDisasterBar={SevereDisasterBar}
        todayFormattedLabel={todayFormattedLabel}
        filteredUnwrittenCompanies={filteredUnwrittenCompanies}
        filteredCompanyOverviewStats={filteredCompanyOverviewStats}
        pushModalHistory={pushModalHistory}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        formatKoreanWorkDate={formatKoreanWorkDate}
        selectedMonth={selectedMonth}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
        extrusionSummaryList={extrusionSummaryList}
        isMyeongjae={isMyeongjae}
        isDongwook={isDongwook}
        pendingSamrangjinCount={workLogCrud.pendingSamrangjinCount}
        pendingHallimCount={workLogCrud.pendingHallimCount}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        filterPlant={workLogCrud.filterPlant}
        setFilterPlant={workLogCrud.setFilterPlant}
        workLogs={workLogCrud.workLogs}
        paginatedLogs={workLogCrud.paginatedLogs}
        handleOpenLogDetail={workLogCrud.handleOpenLogDetail}
        canApproveLog={canApproveLog}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={workLogCrud.handleOpenEditModal}
        handleDeleteLog={workLogCrud.handleDeleteLog}
        filteredLogs={workLogCrud.filteredLogs}
        currentLogPage={workLogCrud.currentLogPage}
        setCurrentLogPage={workLogCrud.setCurrentLogPage}
        LOGS_PER_PAGE={LOGS_PER_PAGE}
        totalLogPages={workLogCrud.totalLogPages}
        handleOpenWorkLogModal={workLogCrud.handleOpenWorkLogModal}
        activeMachiningQualityCount={activeMachiningQualityCount}
      />
    );
  }

  if (isPartnerProfile) {
    return (
      <PartnerManagerDashboardView
        isAdmin={isAdmin}
        hasNewScheduleMessage={commonSchedule.hasNewScheduleMessage}
        allActiveCommonSchedules={commonSchedule.allActiveCommonSchedules}
        setSelectedCommonScheduleForComments={commonSchedule.setSelectedCommonScheduleForComments}
        todayDateStr={todayDateStr}
        isGeneralManager={isGeneralManager}
        handleDeleteCommonSchedule={commonSchedule.handleDeleteCommonSchedule}
        setCommonScheduleModalOpen={commonSchedule.setCommonScheduleModalOpen}
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingCount}
        holdCount={holdCount}
        officialTitle={officialTitle}
        isManagerRole={isManagerRole}
        scheduleLeaveType={workerSchedule.scheduleLeaveType}
        setScheduleLeaveType={workerSchedule.setScheduleLeaveType}
        scheduleSelectedDate={workerSchedule.scheduleSelectedDate}
        setScheduleSelectedDate={workerSchedule.setScheduleSelectedDate}
        scheduleReasonInput={workerSchedule.scheduleReasonInput}
        setScheduleReasonInput={workerSchedule.setScheduleReasonInput}
        handleRegisterSchedule={workerSchedule.handleRegisterSchedule}
        scheduleSaving={workerSchedule.scheduleSaving}
        scheduleCameraInputRef={workerSchedule.scheduleCameraInputRef}
        scheduleFileInputRef={workerSchedule.scheduleFileInputRef}
        handleScheduleFiles={workerSchedule.handleScheduleFiles}
        scheduleAttachedFiles={workerSchedule.scheduleAttachedFiles}
        isProcessingScheduleFiles={workerSchedule.isProcessingScheduleFiles}
        handleRemoveScheduleFile={workerSchedule.handleRemoveScheduleFile}
        setPreviewImageModal={workLogCrud.setPreviewImageModal}
        shareDropdownRef={workerSchedule.shareDropdownRef}
        isShareDropdownOpen={workerSchedule.isShareDropdownOpen}
        setIsShareDropdownOpen={workerSchedule.setIsShareDropdownOpen}
        sharedWorkers={workerSchedule.sharedWorkers}
        setSharedWorkers={workerSchedule.setSharedWorkers}
        toggleSharedWorker={workerSchedule.toggleSharedWorker}
        togglePlantSharedWorkers={workerSchedule.togglePlantSharedWorkers}
        currentProfile={currentProfile}
        ADMIN_USERS={ADMIN_USERS}
        PLANTS={PLANTS}
        myActiveLeaves={workerSchedule.myActiveLeaves}
        formatKSTDate={formatKSTDate}
        setScheduleDetailModal={workerSchedule.setScheduleDetailModal}
        handleRequestDismissOrDelete={workerSchedule.handleRequestDismissOrDelete}
        showMiniCalendar={workerSchedule.showMiniCalendar}
        setShowMiniCalendar={workerSchedule.setShowMiniCalendar}
        scheduleWeekAnchor={workerSchedule.scheduleWeekAnchor}
        handlePrevWeek={workerSchedule.handlePrevWeek}
        handleResetToToday={workerSchedule.handleResetToToday}
        handleNextWeek={workerSchedule.handleNextWeek}
        myWeeklyCalendarDays={workerSchedule.myWeeklyCalendarDays}
        SevereDisasterBar={SevereDisasterBar}
        handleOpenYuseongReport={handleOpenYuseongReport}
        activeYuseongQualityCount={activeYuseongQualityCount}
        todayFormattedLabel={todayFormattedLabel}
        filteredUnwrittenCompanies={filteredUnwrittenCompanies}
        filteredCompanyOverviewStats={filteredCompanyOverviewStats}
        pushModalHistory={pushModalHistory}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        formatKoreanWorkDate={formatKoreanWorkDate}
        selectedMonth={selectedMonth}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
        extrusionSummaryList={extrusionSummaryList}
        isMyeongjae={isMyeongjae}
        isDongwook={isDongwook}
        pendingSamrangjinCount={workLogCrud.pendingSamrangjinCount}
        pendingHallimCount={workLogCrud.pendingHallimCount}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        filterPlant={workLogCrud.filterPlant}
        setFilterPlant={workLogCrud.setFilterPlant}
        workLogs={workLogCrud.workLogs}
        paginatedLogs={workLogCrud.paginatedLogs}
        handleOpenLogDetail={workLogCrud.handleOpenLogDetail}
        canApproveLog={canApproveLog}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={workLogCrud.handleOpenEditModal}
        handleDeleteLog={workLogCrud.handleDeleteLog}
        filteredLogs={workLogCrud.filteredLogs}
        currentLogPage={workLogCrud.currentLogPage}
        setCurrentLogPage={workLogCrud.setCurrentLogPage}
        LOGS_PER_PAGE={LOGS_PER_PAGE}
        totalLogPages={workLogCrud.totalLogPages}
        handleOpenWorkLogModal={workLogCrud.handleOpenWorkLogModal}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
        activeHanulQualityCount={activeHanulQualityCount}
        activeMachiningQualityCount={activeMachiningQualityCount}
      />
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboardView
        isAdmin={isAdmin}
        hasNewScheduleMessage={commonSchedule.hasNewScheduleMessage}
        allActiveCommonSchedules={commonSchedule.allActiveCommonSchedules}
        setSelectedCommonScheduleForComments={commonSchedule.setSelectedCommonScheduleForComments}
        todayDateStr={todayDateStr}
        isGeneralManager={isGeneralManager}
        handleDeleteCommonSchedule={commonSchedule.handleDeleteCommonSchedule}
        setCommonScheduleModalOpen={commonSchedule.setCommonScheduleModalOpen}
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingCount}
        holdCount={holdCount}
        officialTitle={officialTitle}
        isManagerRole={isManagerRole}
        scheduleLeaveType={workerSchedule.scheduleLeaveType}
        setScheduleLeaveType={workerSchedule.setScheduleLeaveType}
        scheduleSelectedDate={workerSchedule.scheduleSelectedDate}
        setScheduleSelectedDate={workerSchedule.setScheduleSelectedDate}
        scheduleReasonInput={workerSchedule.scheduleReasonInput}
        setScheduleReasonInput={workerSchedule.setScheduleReasonInput}
        handleRegisterSchedule={workerSchedule.handleRegisterSchedule}
        scheduleSaving={workerSchedule.scheduleSaving}
        scheduleCameraInputRef={workerSchedule.scheduleCameraInputRef}
        scheduleFileInputRef={workerSchedule.scheduleFileInputRef}
        handleScheduleFiles={workerSchedule.handleScheduleFiles}
        scheduleAttachedFiles={workerSchedule.scheduleAttachedFiles}
        isProcessingScheduleFiles={workerSchedule.isProcessingScheduleFiles}
        handleRemoveScheduleFile={workerSchedule.handleRemoveScheduleFile}
        setPreviewImageModal={workLogCrud.setPreviewImageModal}
        shareDropdownRef={workerSchedule.shareDropdownRef}
        isShareDropdownOpen={workerSchedule.isShareDropdownOpen}
        setIsShareDropdownOpen={workerSchedule.setIsShareDropdownOpen}
        sharedWorkers={workerSchedule.sharedWorkers}
        setSharedWorkers={workerSchedule.setSharedWorkers}
        toggleSharedWorker={workerSchedule.toggleSharedWorker}
        togglePlantSharedWorkers={workerSchedule.togglePlantSharedWorkers}
        currentProfile={currentProfile}
        ADMIN_USERS={ADMIN_USERS}
        PLANTS={PLANTS}
        myActiveLeaves={workerSchedule.myActiveLeaves}
        formatKSTDate={formatKSTDate}
        setScheduleDetailModal={workerSchedule.setScheduleDetailModal}
        handleRequestDismissOrDelete={workerSchedule.handleRequestDismissOrDelete}
        showMiniCalendar={workerSchedule.showMiniCalendar}
        setShowMiniCalendar={workerSchedule.setShowMiniCalendar}
        scheduleWeekAnchor={workerSchedule.scheduleWeekAnchor}
        handlePrevWeek={workerSchedule.handlePrevWeek}
        handleResetToToday={workerSchedule.handleResetToToday}
        handleNextWeek={workerSchedule.handleNextWeek}
        myWeeklyCalendarDays={workerSchedule.myWeeklyCalendarDays}
        isHanul={isHanul}
        handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
        activeHanulQualityCount={activeHanulQualityCount}
        handleOpenHanulReport={handleOpenHanulReport}
        SevereDisasterBar={SevereDisasterBar}
        monthTitle={monthTitle}
        currentMonthData={currentMonthData}
        todayFormattedLabel={todayFormattedLabel}
        formatAmount={formatAmount}
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        purchaseRatio={purchaseRatio}
        filteredUnwrittenCompanies={filteredUnwrittenCompanies}
        filteredCompanyOverviewStats={filteredCompanyOverviewStats}
        filteredPendingApprovalCards={filteredPendingApprovalCards}
        pushModalHistory={pushModalHistory}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        formatKoreanWorkDate={formatKoreanWorkDate}
        selectedMonth={selectedMonth}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
        extrusionSummaryList={extrusionSummaryList}
        isMyeongjae={isMyeongjae}
        isDongwook={isDongwook}
        pendingSamrangjinCount={workLogCrud.pendingSamrangjinCount}
        pendingHallimCount={workLogCrud.pendingHallimCount}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        filterPlant={workLogCrud.filterPlant}
        setFilterPlant={workLogCrud.setFilterPlant}
        workLogs={workLogCrud.workLogs}
        paginatedLogs={workLogCrud.paginatedLogs}
        handleOpenLogDetail={workLogCrud.handleOpenLogDetail}
        canApproveLog={canApproveLog}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={workLogCrud.handleOpenEditModal}
        handleDeleteLog={workLogCrud.handleDeleteLog}
        filteredLogs={workLogCrud.filteredLogs}
        currentLogPage={workLogCrud.currentLogPage}
        setCurrentLogPage={workLogCrud.setCurrentLogPage}
        LOGS_PER_PAGE={LOGS_PER_PAGE}
        totalLogPages={workLogCrud.totalLogPages}
        handleOpenWorkLogModal={workLogCrud.handleOpenWorkLogModal}
        accessLogs={accessLogs}
        handleOpenWorkerLogs={handleOpenWorkerLogs}
        formatRelativeAccessTime={formatRelativeAccessTime}
      />
    );
  }

  // Internal Manager Dashboard View (관리자 프로필별 고유 key 지정으로 전환 시 완벽한 상태 초기화 및 맞춤 패널 렌더링 보장)
  return (
    <InternalManagerDashboardView
      key={currentProfile?.id || currentProfile?.name || "internal_manager"}
      currentProfile={currentProfile}
      onNavigateTab={onNavigateTab}
      isAdmin={isAdmin}
      hasNewScheduleMessage={commonSchedule.hasNewScheduleMessage}
      allActiveCommonSchedules={commonSchedule.allActiveCommonSchedules}
      setSelectedCommonScheduleForComments={commonSchedule.setSelectedCommonScheduleForComments}
      todayDateStr={todayDateStr}
      isGeneralManager={isGeneralManager}
      handleDeleteCommonSchedule={commonSchedule.handleDeleteCommonSchedule}
      setCommonScheduleModalOpen={commonSchedule.setCommonScheduleModalOpen}
      workerPlant={workerPlant}
      workerFullName={workerFullName}
      pendingCount={pendingCount}
      holdCount={holdCount}
      officialTitle={officialTitle}
      isManagerRole={isManagerRole}
      scheduleLeaveType={workerSchedule.scheduleLeaveType}
      setScheduleLeaveType={workerSchedule.setScheduleLeaveType}
      scheduleSelectedDate={workerSchedule.scheduleSelectedDate}
      setScheduleSelectedDate={workerSchedule.setScheduleSelectedDate}
      scheduleReasonInput={workerSchedule.scheduleReasonInput}
      setScheduleReasonInput={workerSchedule.setScheduleReasonInput}
      handleRegisterSchedule={workerSchedule.handleRegisterSchedule}
      scheduleSaving={workerSchedule.scheduleSaving}
      scheduleCameraInputRef={workerSchedule.scheduleCameraInputRef}
      scheduleFileInputRef={workerSchedule.scheduleFileInputRef}
      handleScheduleFiles={workerSchedule.handleScheduleFiles}
      scheduleAttachedFiles={workerSchedule.scheduleAttachedFiles}
      isProcessingScheduleFiles={workerSchedule.isProcessingScheduleFiles}
      handleRemoveScheduleFile={workerSchedule.handleRemoveScheduleFile}
      setPreviewImageModal={workLogCrud.setPreviewImageModal}
      shareDropdownRef={workerSchedule.shareDropdownRef}
      isShareDropdownOpen={workerSchedule.isShareDropdownOpen}
      setIsShareDropdownOpen={workerSchedule.setIsShareDropdownOpen}
      sharedWorkers={workerSchedule.sharedWorkers}
      setSharedWorkers={workerSchedule.setSharedWorkers}
      toggleSharedWorker={workerSchedule.toggleSharedWorker}
      togglePlantSharedWorkers={workerSchedule.togglePlantSharedWorkers}
      ADMIN_USERS={ADMIN_USERS}
      PLANTS={PLANTS}
      myActiveLeaves={workerSchedule.myActiveLeaves}
      formatKSTDate={formatKSTDate}
      setScheduleDetailModal={workerSchedule.setScheduleDetailModal}
      handleRequestDismissOrDelete={workerSchedule.handleRequestDismissOrDelete}
      showMiniCalendar={workerSchedule.showMiniCalendar}
      setShowMiniCalendar={workerSchedule.setShowMiniCalendar}
      scheduleWeekAnchor={workerSchedule.scheduleWeekAnchor}
      handlePrevWeek={workerSchedule.handlePrevWeek}
      handleResetToToday={workerSchedule.handleResetToToday}
      handleNextWeek={workerSchedule.handleNextWeek}
      myWeeklyCalendarDays={workerSchedule.myWeeklyCalendarDays}
      SevereDisasterBar={SevereDisasterBar}
      monthTitle={monthTitle}
      currentMonthData={currentMonthData}
      todayFormattedLabel={todayFormattedLabel}
      formatAmount={formatAmount}
      totalSales={totalSales}
      totalPurchases={totalPurchases}
      purchaseRatio={purchaseRatio}
      filteredUnwrittenCompanies={filteredUnwrittenCompanies}
      filteredCompanyOverviewStats={filteredCompanyOverviewStats}
      filteredPendingApprovalCards={filteredPendingApprovalCards}
      pushModalHistory={pushModalHistory}
      setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
      formatKoreanWorkDate={formatKoreanWorkDate}
      selectedMonth={selectedMonth}
      liveQualityCurrentMonthly={liveQualityCurrentMonthly}
      liveQualityPrevMonthly={liveQualityPrevMonthly}
      handleOpenQualityPopup={handleOpenQualityPopup}
      isExtrusionWorker={isExtrusionWorker}
      isMyeongjae={isMyeongjae}
      isJaeyul={isJaeyul}
      isHallim={isHallim}
      extrusionSummaryList={extrusionSummaryList}
      isDongwook={isDongwook}
      pendingSamrangjinCount={workLogCrud.pendingSamrangjinCount}
      pendingHallimCount={workLogCrud.pendingHallimCount}
      setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
      filterPlant={workLogCrud.filterPlant}
      setFilterPlant={workLogCrud.setFilterPlant}
      workLogs={workLogCrud.workLogs}
      paginatedLogs={workLogCrud.paginatedLogs}
      handleOpenLogDetail={workLogCrud.handleOpenLogDetail}
      canApproveLog={canApproveLog}
      isWorkLogApproved={isWorkLogApproved}
      handleOpenEditModal={workLogCrud.handleOpenEditModal}
      handleDeleteLog={workLogCrud.handleDeleteLog}
      filteredLogs={workLogCrud.filteredLogs}
      currentLogPage={workLogCrud.currentLogPage}
      setCurrentLogPage={workLogCrud.setCurrentLogPage}
      LOGS_PER_PAGE={LOGS_PER_PAGE}
      totalLogPages={workLogCrud.totalLogPages}
      handleOpenWorkLogModal={workLogCrud.handleOpenWorkLogModal}
      setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
      activeHanulQualityCount={activeHanulQualityCount}
      activeMachiningQualityCount={activeMachiningQualityCount}
      activeExtrusionQualityCount={activeExtrusionQualityCount}
    />
  );
  };

  return (
    <SectionErrorBoundary title="현황 대시보드">
      <Suspense fallback={<DashboardViewFallback />}>
        {renderDashboardContent()}
      </Suspense>
    </SectionErrorBoundary>
  );
}
