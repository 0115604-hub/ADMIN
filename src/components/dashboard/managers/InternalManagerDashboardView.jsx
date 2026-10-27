import React, { useState, useEffect, useMemo } from "react";
import { Cpu, ShieldAlert } from "lucide-react";
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
import { TestBadgeBlockStudio } from "./TestBadgeBlockStudio";
import {
  PANEL_KEYS,
  STUDIO_MANAGERS,
  getPanelsForUser,
  MANAGER_PANEL_CONFIG,
  DEFAULT_INTERNAL_MANAGER_PANELS
} from "../../../config/dashboardPanelConfig";
import {
  saveManagerCustomLayout,
  resetManagerCustomLayout,
  subscribeManagerLayouts
} from "../../../services/dashboardLayoutService";

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
  handleOpenWorkLogModal,
  setIsHanulQualityIssueModalOpen,
  activeHanulQualityCount = 0,
  activeMachiningQualityCount = 0,
  activeExtrusionQualityCount = 0
}) => {
  // 🌟 TEST 뱃지 판별
  const isTest = Boolean(
    currentProfile?.id === "hal_test" ||
    currentProfile?.name === "TEST" ||
    currentProfile?.id === "test"
  );

  // 🛠️ TEST 뱃지 전용: 현재 커스터마이징 & 시뮬레이션 중인 관리자 상태
  const [selectedStudioManagerId, setSelectedStudioManagerId] = useState("sam_cy"); // 초기값: 품질책임 이창엽
  const [studioPanels, setStudioPanels] = useState(() => {
    const targetMgr = STUDIO_MANAGERS.find((m) => m.id === "sam_cy");
    return getPanelsForUser(targetMgr);
  });
  const [isSavingStudio, setIsSavingStudio] = useState(false);
  const [layoutVersionTick, setLayoutVersionTick] = useState(0);

  // Firestore 실시간 레이아웃 변경 구독
  useEffect(() => {
    const unsub = subscribeManagerLayouts(() => {
      setLayoutVersionTick((v) => v + 1);
    });
    const handleLayoutEvent = (e) => {
      setLayoutVersionTick((v) => v + 1);
      if (isTest && e.detail?.managerKey === selectedStudioManagerId && Array.isArray(e.detail?.panels)) {
        setStudioPanels(e.detail.panels);
      }
    };
    window.addEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
    return () => {
      unsub();
      window.removeEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
    };
  }, [isTest, selectedStudioManagerId]);

  // 관리자 선택 변경 핸들러
  const handleSelectStudioManager = (mgrId) => {
    setSelectedStudioManagerId(mgrId);
    const targetMgr = STUDIO_MANAGERS.find((m) => m.id === mgrId);
    setStudioPanels(getPanelsForUser(targetMgr));
  };

  // 커스텀 레이아웃 저장 핸들러
  const handleSaveStudioLayout = async () => {
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    setIsSavingStudio(true);
    try {
      await saveManagerCustomLayout(selectedStudioManagerId, studioPanels, "TEST");
      // 이름 키로도 동시 매핑 보장
      if (currentMgr?.name) {
        await saveManagerCustomLayout(currentMgr.name, studioPanels, "TEST");
      }
      alert(
        `🎉 [${currentMgr?.plant} • ${currentMgr?.name} ${currentMgr?.title || ""}] 대시보드 블록 설정이 저장되었습니다!\n\n해당 관리자가 로그인 시 저장된 블록 구성과 순서로 즉시 표시됩니다.`
      );
    } catch (e) {
      alert("설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingStudio(false);
    }
  };

  // 커스텀 레이아웃 기본값 복원 핸들러
  const handleResetStudioLayout = async () => {
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    if (
      !window.confirm(
        `[${currentMgr?.name || selectedStudioManagerId}] 관리자의 대시보드 블록 구성을 공장 초기 기본값으로 복원하시겠습니까?`
      )
    ) {
      return;
    }

    await resetManagerCustomLayout(selectedStudioManagerId);
    if (currentMgr?.name) {
      await resetManagerCustomLayout(currentMgr.name);
    }
    const defaultPanels =
      MANAGER_PANEL_CONFIG[selectedStudioManagerId] ||
      MANAGER_PANEL_CONFIG[currentMgr?.name] ||
      DEFAULT_INTERNAL_MANAGER_PANELS;
    setStudioPanels(defaultPanels);
    alert(`🔄 [${currentMgr?.name}] 관리자 대시보드가 기본값으로 복원되었습니다.`);
  };

  // 🌟 실제 아래 화면 렌더링에 적용할 가상 프로필 (TEST 모드일 때는 선택된 관리자 시점, 일반 모드일 때는 로그인한 관리자)
  const activeProfile = useMemo(() => {
    if (!isTest) return currentProfile;
    const found = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    if (!found) return currentProfile;
    return {
      ...currentProfile,
      id: found.id,
      name: found.name,
      title: found.title,
      plant: found.plant,
      assignedProcess: found.process,
      role: found.id.startsWith("admin") ? "ADMIN" : "OPERATOR"
    };
  }, [isTest, selectedStudioManagerId, currentProfile]);

  // 🌟 실제 아래 화면 렌더링에 적용할 활성 패널 블록 목록 (순서 보장)
  const activePanelKeys = useMemo(() => {
    if (isTest) return studioPanels;
    return getPanelsForUser(currentProfile);
  }, [isTest, studioPanels, currentProfile, layoutVersionTick]);

  // 🧩 개별 패널 블록 렌더러 (14대 표준 대시보드 블록)
  const renderDashboardBlock = (blockKey) => {
    switch (blockKey) {
      // 1. 📌 사내 공통일정 바
      case PANEL_KEYS.COMMON_SCHEDULE:
        return (
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
        );

      // 2. 🌟 관리자 일정/연차 및 캘린더 센터
      case PANEL_KEYS.CALENDAR_SCHEDULE:
        return (
          <WorkerScheduleCalendarSection
            workerPlant={activeProfile.plant || workerPlant}
            workerFullName={
              activeProfile.name
                ? `${activeProfile.name} ${activeProfile.title || ""}`.trim()
                : workerFullName
            }
            onNavigateTab={onNavigateTab}
            pendingCount={pendingCount}
            holdCount={holdCount}
            officialTitle={activeProfile.title || officialTitle}
            isAdmin={isAdmin || activeProfile.role === "ADMIN"}
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
            currentProfile={activeProfile}
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
        );

      // 3. 🚨 부적합경보 등록 한줄 바
      case PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR:
        if (!setIsHanulQualityIssueModalOpen) return null;
        return (
          <div
            onClick={() => setIsHanulQualityIssueModalOpen(true)}
            className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/90 text-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 border-2 border-indigo-500/50 shadow-md shadow-slate-950/40 flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 max-w-full animate-fadeIn cursor-pointer group"
            title="부적합경보 및 품질이슈 등록/관리"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-black text-xs sm:text-sm text-white tracking-tight group-hover:text-rose-300 transition-colors">
                  {activeProfile.plant === "한림공장"
                    ? "조영 부적합경보 등록"
                    : activeProfile.assignedProcess?.includes("압출")
                    ? "압출동 부적합경보 등록"
                    : "오륙 부적합경보 등록"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHanulQualityIssueModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-pulse"
                title="부적합경보 및 품질이슈 등록/관리"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>🚨 부적합경보 입력</span>
                {(activeMachiningQualityCount + activeExtrusionQualityCount + activeHanulQualityCount) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                    {activeProfile.plant === "한림공장"
                      ? activeHanulQualityCount
                      : activeProfile.assignedProcess?.includes("압출")
                      ? activeExtrusionQualityCount
                      : activeMachiningQualityCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        );

      // 4. 🚨 중대재해 안전판
      case PANEL_KEYS.SEVERE_DISASTER:
        return SevereDisasterBar ? <SevereDisasterBar /> : null;

      // 5. 💰 매입매출현황 요약
      case PANEL_KEYS.SALES_PURCHASE:
        return (
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
        );

      // 6. 👥 근태현황 및 5개사 관리
      case PANEL_KEYS.ATTENDANCE:
        return (
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
        );

      // 7. 🔬 중요ITEM 일일품질 요약
      case PANEL_KEYS.QUALITY_SUMMARY:
        return (
          <QualityStatusSection
            selectedMonth={selectedMonth}
            onNavigateTab={onNavigateTab}
            liveQualityCurrentMonthly={liveQualityCurrentMonthly}
            liveQualityPrevMonthly={liveQualityPrevMonthly}
            handleOpenQualityPopup={handleOpenQualityPopup}
          />
        );

      // 8. 🛡️ 4M 변동점 및 이상통합 관제 패널
      case PANEL_KEYS.ABNORMALITY_4M:
        return (
          <UnifiedAbnormalityControlPanel
            workLogs={workLogs}
            currentProfile={activeProfile}
            onNavigateTab={onNavigateTab}
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
        );

      // 9. 🏭 압출동 주간 비가동내역 요약
      case PANEL_KEYS.EXTRUSION_DOWNTIME:
        return (
          <ExtrusionDowntimeSection
            onNavigateTab={onNavigateTab}
            extrusionSummaryList={extrusionSummaryList}
          />
        );

      // 10. ⚙️ 가공동 실시간 작업일보 (HR, JA, NX5a)
      case PANEL_KEYS.MACHINING_WORK_REPORT:
        return (
          <MachiningWorkReportTable
            onOpenReportModal={(proj, proc, rep) => {
              if (onNavigateTab) {
                onNavigateTab("machining");
              }
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
            onOpenReportModal={(report) => {
              if (onNavigateTab) {
                onNavigateTab("extrusion");
              }
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

      default:
        return null;
    }
  };

  return (
    <>
      {/* 🛠️ [TEST 뱃지 전용] 최상단 관리자 대시보드 블록 조립 & 커스터마이저 스튜디오 */}
      {isTest && (
        <TestBadgeBlockStudio
          selectedManagerId={selectedStudioManagerId}
          onSelectManager={handleSelectStudioManager}
          activePanels={studioPanels}
          onChangePanels={setStudioPanels}
          onSaveLayout={handleSaveStudioLayout}
          onResetLayout={handleResetStudioLayout}
          isSaving={isSavingStudio}
        />
      )}

      {/* 🌟 압출동 현장작업자 전용 상단 배너 (작업자 모드) */}
      {(currentProfile?.building === "압출동" ||
        currentProfile?.id?.startsWith("ext_") ||
        currentProfile?.name === "공영국") &&
        currentProfile?.name !== "설유철" &&
        currentProfile?.id !== "sam_yc" && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  🏭 삼랑진공장 압출동 작업자 모드 ({currentProfile.name}
                  {currentProfile.title ? ` ${currentProfile.title}` : ""})
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

      {/* 🌟 블록 배열 순서대로 동적 렌더링 (설정된 블록 순서 100% 반영) */}
      {activePanelKeys.map((blockKey) => (
        <React.Fragment key={blockKey}>
          {renderDashboardBlock(blockKey)}
        </React.Fragment>
      ))}
    </>
  );
};

export default InternalManagerDashboardView;
