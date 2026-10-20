import React from "react";
import { Cpu } from "lucide-react";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  SalesPurchaseSummarySection,
  AttendanceSummarySection,
  QualityStatusSection,
  ExtrusionDowntimeSection,
  DailyWorkLogTableSection
} from "../sections";
import { UnifiedAbnormalityControlPanel } from "../UnifiedAbnormalityControlPanel";
import { isPanelVisible, PANEL_KEYS } from "../../../config/dashboardPanelConfig";

const WorkReportTemplateManagerView = React.lazy(() =>
  import("../../WorkReportTemplateManagerView").then((m) => ({
    default: m.WorkReportTemplateManagerView || m.default
  }))
);

export const InternalManagerDashboardView = ({
  // Extrusion Operator Banner Props
  currentProfile,
  onNavigateTab,

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

  // 1. Sales & Purchase Props
  monthTitle,
  currentMonthData,
  todayFormattedLabel,
  formatAmount,
  totalSales,
  totalPurchases,
  purchaseRatio,

  // 2. Attendance Props
  filteredUnwrittenCompanies = [],
  filteredCompanyOverviewStats = [],
  filteredPendingApprovalCards = [],
  pushModalHistory,
  setSelectedOvertimeReportForModal,
  formatKoreanWorkDate,

  // 3. Quality Props
  selectedMonth,
  liveQualityCurrentMonthly,
  liveQualityPrevMonthly,
  handleOpenQualityPopup,

  // 4. Extrusion Downtime Props
  isExtrusionWorker,
  isMyeongjae,
  isJaeyul,
  isHallim,
  extrusionSummaryList,

  // 5. Daily Work Log Props
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
  return (
    <>
      {/* 🌟 압출동 작업자 전용 상단 배너 */}
      {(currentProfile?.building === "압출동" || currentProfile?.id?.startsWith("ext_") || currentProfile?.name === "공영국") && currentProfile?.name !== "설유철" && currentProfile?.id !== "sam_yc" && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                🏭 삼랑진공장 압출동 작업자 모드 ({currentProfile.name}{currentProfile.title ? ` ${currentProfile.title}` : ""})
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                압출 생산관리 탭에서 실시간 작업일보 작성 및 생산실적/비가동 분석을 확인하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem("factory_extrusion_active_subtab", "production");
              } catch (e) {}
              if (onNavigateTab) onNavigateTab("extrusion_downtime");
            }}
            className="px-4 py-2 rounded-xl bg-white text-teal-800 font-black text-xs sm:text-sm hover:bg-teal-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer text-center"
          >
            🏭 압출 생산관리 및 작업일보 바로가기 ➡️
          </button>
        </div>
      )}

      {/* 📌 사내 공통일정 */}
      {isPanelVisible(PANEL_KEYS.COMMON_SCHEDULE, currentProfile) && (
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
      )}

      {/* 🌟 관리자 일정/연차 및 캘린더 센터 */}
      {isPanelVisible(PANEL_KEYS.CALENDAR_SCHEDULE, currentProfile) && (
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
      )}

      {/* 🚨 중대재해 안전판 (이창엽 책임 대시보드에서는 비노출/삭제) */}
      {isPanelVisible(PANEL_KEYS.SEVERE_DISASTER, currentProfile) && SevereDisasterBar && (
        <SevereDisasterBar />
      )}

      {/* 1. 매입매출현황 요약 */}
      {isPanelVisible(PANEL_KEYS.SALES_PURCHASE, currentProfile) && (
        <SalesPurchaseSummarySection
          monthTitle={monthTitle}
          currentMonthData={currentMonthData}
          todayFormattedLabel={todayFormattedLabel}
          onNavigateTab={onNavigateTab}
          formatAmount={formatAmount}
          totalSales={totalSales}
          totalPurchases={totalPurchases}
          purchaseRatio={purchaseRatio}
        />
      )}

      {/* 2. 근태현황 및 관리 (이창엽 책임 대시보드에서는 비노출/삭제) */}
      {isPanelVisible(PANEL_KEYS.ATTENDANCE, currentProfile) && (
        <AttendanceSummarySection
          todayFormattedLabel={todayFormattedLabel}
          unwrittenCompanies={filteredUnwrittenCompanies}
          onNavigateTab={onNavigateTab}
          companyOverviewStats={filteredCompanyOverviewStats}
          pendingApprovalCards={filteredPendingApprovalCards}
          pushModalHistory={pushModalHistory}
          setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
          formatKoreanWorkDate={formatKoreanWorkDate}
        />
      )}

      {/* 3. 금형별 일일품질 요약 (중요ITEM 품질현황) */}
      {isPanelVisible(PANEL_KEYS.QUALITY_SUMMARY, currentProfile) && (
        <QualityStatusSection
          selectedMonth={selectedMonth}
          onNavigateTab={onNavigateTab}
          liveQualityCurrentMonthly={liveQualityCurrentMonthly}
          liveQualityPrevMonthly={liveQualityPrevMonthly}
          handleOpenQualityPopup={handleOpenQualityPopup}
        />
      )}

      {/* 🛡️ 4M 변동점 및 이상통합 관제 패널 (중요ITEM 품질현황 바로 아래 배치) */}
      {isPanelVisible(PANEL_KEYS.ABNORMALITY_4M, currentProfile) && (
        <UnifiedAbnormalityControlPanel
          workLogs={workLogs}
          currentProfile={currentProfile}
          onOpenWorkLogDetail={handleOpenLogDetail}
          onOpenExtrusionReport={() => {
            try {
              localStorage.setItem("factory_extrusion_active_subtab", "production");
            } catch (e) {}
            if (onNavigateTab) onNavigateTab("extrusion_downtime");
          }}
          onOpenIssueModal={() => {
            if (onNavigateTab) onNavigateTab("quality_control");
          }}
        />
      )}

      {/* 4. 압출동 주간 비가동내역 요약 (이창엽 책임 대시보드에서는 비노출/삭제) */}
      {isPanelVisible(PANEL_KEYS.EXTRUSION_DOWNTIME, currentProfile) && (isExtrusionWorker || isMyeongjae || isJaeyul || isAdmin || !isHallim) && (
        <ExtrusionDowntimeSection
          onNavigateTab={onNavigateTab}
          extrusionSummaryList={extrusionSummaryList}
        />
      )}

      {/* 5. 일일업무일지 현황 (이명재, 김동욱 결재 배너 연동) */}
      {isPanelVisible(PANEL_KEYS.WORK_LOGS, currentProfile) && (
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
      )}

      {/* 📑 일보 양식 관리 패널 (TEST 관리자 맞춤 전담 이관) */}
      {isPanelVisible(PANEL_KEYS.WORK_REPORT_TEMPLATES, currentProfile) && (
        <React.Suspense
          fallback={
            <div className="p-8 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              일보 양식 관리 시스템을 불러오는 중입니다...
            </div>
          }
        >
          <WorkReportTemplateManagerView />
        </React.Suspense>
      )}
    </>
  );
};

export default InternalManagerDashboardView;
