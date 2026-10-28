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
import { PanelDesignCustomizerModal } from "./PanelDesignCustomizerModal";
import { BatchThemeCustomizerModal } from "./BatchThemeCustomizerModal";
import { AddPanelModal } from "./AddPanelModal";
import {
  Palette,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import {
  PANEL_KEYS,
  STUDIO_MANAGERS,
  ALL_DASHBOARD_BLOCKS,
  getPanelsForUser,
  MANAGER_PANEL_CONFIG,
  DEFAULT_INTERNAL_MANAGER_PANELS
} from "../../../config/dashboardPanelConfig";
import {
  saveManagerCustomLayout,
  resetManagerCustomLayout,
  subscribeManagerLayouts,
  getCustomSettingsForManager,
  savePanelCustomSetting,
  resetPanelCustomSetting,
  batchApplyThemeToManagerPanels
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

  // 🎨 패널별 커스텀 제목 & 디자인 설정 상태
  const [panelCustomSettings, setPanelCustomSettings] = useState(() => {
    const key = isTest ? "sam_cy" : (currentProfile?.id || currentProfile?.name);
    return getCustomSettingsForManager(key);
  });
  const [editingBlockKeyFromDashboard, setEditingBlockKeyFromDashboard] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertTargetIndex, setInsertTargetIndex] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isTopStudioVisible, setIsTopStudioVisible] = useState(true);

  // Firestore 실시간 레이아웃 및 디자인 변경 구독
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
    const handlePanelSettingsEvent = (e) => {
      const activeKey = isTest ? selectedStudioManagerId : (currentProfile?.id || currentProfile?.name);
      if (e.detail?.managerKey === activeKey || e.detail?.allUpdated) {
        setPanelCustomSettings({ ...getCustomSettingsForManager(activeKey) });
        setLayoutVersionTick((v) => v + 1);
      }
    };

    window.addEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
    window.addEventListener("oryuk_panel_settings_updated", handlePanelSettingsEvent);

    return () => {
      unsub();
      window.removeEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
      window.removeEventListener("oryuk_panel_settings_updated", handlePanelSettingsEvent);
    };
  }, [isTest, selectedStudioManagerId, currentProfile]);

  // 관리자 선택 변경 핸들러
  const handleSelectStudioManager = (mgrId) => {
    setSelectedStudioManagerId(mgrId);
    const targetMgr = STUDIO_MANAGERS.find((m) => m.id === mgrId);
    setStudioPanels(getPanelsForUser(targetMgr));
    setPanelCustomSettings(getCustomSettingsForManager(mgrId));
  };

  // 패널 제목 & 디자인 단건 저장 핸들러
  const handleSavePanelSetting = async (blockKey, setting) => {
    const targetKey = isTest ? selectedStudioManagerId : (currentProfile?.id || currentProfile?.name);
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await savePanelCustomSetting(targetKey, blockKey, setting, "TEST");
    if (currentMgr?.name && isTest) {
      await savePanelCustomSetting(currentMgr.name, blockKey, setting, "TEST");
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
  };

  // 패널 제목 & 디자인 초기화 핸들러
  const handleResetPanelSetting = async (blockKey) => {
    const targetKey = isTest ? selectedStudioManagerId : (currentProfile?.id || currentProfile?.name);
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await resetPanelCustomSetting(targetKey, blockKey);
    if (currentMgr?.name && isTest) {
      await resetPanelCustomSetting(currentMgr.name, blockKey);
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
  };

  // 전체 패널 디자인 일괄 통일 핸들러
  const handleBatchApplyTheme = async (designOptions) => {
    const targetKey = isTest ? selectedStudioManagerId : (currentProfile?.id || currentProfile?.name);
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await batchApplyThemeToManagerPanels(targetKey, studioPanels, designOptions, "TEST");
    if (currentMgr?.name && isTest) {
      await batchApplyThemeToManagerPanels(currentMgr.name, studioPanels, designOptions, "TEST");
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
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
        `🎉 [${currentMgr?.plant} • ${currentMgr?.name} ${currentMgr?.title || ""}] 대시보드 블록 및 디자인 설정이 저장되었습니다!\n\n해당 관리자가 로그인 시 저장된 블록 구성, 커스텀 제목, 테마로 즉시 표시됩니다.`
      );
    } catch (e) {
      alert("설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingStudio(false);
    }
  };

  // 🌟 대시보드 실시간 렌더링 화면에서 블록 순서 이동
  const handleMoveBlockOnDashboard = (index, direction) => {
    const nextPanels = [...studioPanels];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextPanels.length) return;
    const temp = nextPanels[index];
    nextPanels[index] = nextPanels[targetIdx];
    nextPanels[targetIdx] = temp;
    setStudioPanels(nextPanels);
  };

  // 🌟 대시보드 실시간 렌더링 화면에서 블록 삭제(제외)
  const handleRemoveBlockFromDashboard = (blockKey) => {
    const meta = ALL_DASHBOARD_BLOCKS.find((b) => b.key === blockKey);
    const label = panelCustomSettings[blockKey]?.customTitle || meta?.label || blockKey;
    if (window.confirm(`[${label}] 패널을 현재 화면에서 제외(삭제)하시겠습니까?`)) {
      const nextPanels = studioPanels.filter((k) => k !== blockKey);
      setStudioPanels(nextPanels);
    }
  };

  // 🌟 대시보드 실시간 렌더링 화면에서 블록 추가
  const handleAddBlockToDashboard = (blockKey, targetIndex = null) => {
    if (studioPanels.includes(blockKey)) return;
    const nextPanels = [...studioPanels];
    if (targetIndex !== null && targetIndex >= 0 && targetIndex <= nextPanels.length) {
      nextPanels.splice(targetIndex, 0, blockKey);
    } else {
      nextPanels.push(blockKey);
    }
    setStudioPanels(nextPanels);
  };

  // 🌟 패널 추가 모달 열기
  const handleOpenAddModal = (index = null) => {
    setInsertTargetIndex(index);
    setIsAddModalOpen(true);
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
            customSettings={panelCustomSettings[PANEL_KEYS.QUALITY_SUMMARY]}
          />
        );

      // 8. 🛡️ 4M 변동점 및 이상통합 관제 패널
      case PANEL_KEYS.ABNORMALITY_4M:
        return (
          <UnifiedAbnormalityControlPanel
            workLogs={workLogs}
            currentProfile={activeProfile}
            onNavigateTab={onNavigateTab}
            customSettings={panelCustomSettings[PANEL_KEYS.ABNORMALITY_4M]}
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
            customSettings={panelCustomSettings[PANEL_KEYS.WORK_LOGS]}
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
      {isTest && isTopStudioVisible && (
        <TestBadgeBlockStudio
          selectedManagerId={selectedStudioManagerId}
          onSelectManager={handleSelectStudioManager}
          activePanels={studioPanels}
          onChangePanels={setStudioPanels}
          onSaveLayout={handleSaveStudioLayout}
          onResetLayout={handleResetStudioLayout}
          panelCustomSettings={panelCustomSettings}
          onSavePanelSetting={handleSavePanelSetting}
          onResetPanelSetting={handleResetPanelSetting}
          onBatchApplyTheme={handleBatchApplyTheme}
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

      {/* 🌟 TEST 모드: 최상단 첫 번째 위치 패널 추가 버튼 */}
      {isTest && activePanelKeys.length > 0 && (
        <div className="py-1 flex items-center justify-center relative group/add">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-cyan-500/20 group-hover/add:border-cyan-500/50 transition"></div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddModal(0)}
            className="relative z-10 px-3 py-1 rounded-full bg-slate-900 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/40 text-[10.5px] font-bold shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>최상단에 새 패널/뱃지 추가</span>
          </button>
        </div>
      )}

      {/* 🌟 빈 화면 안내 (모든 패널 제외 시) */}
      {isTest && activePanelKeys.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border-2 border-dashed border-cyan-500/40 text-center space-y-3 animate-fadeIn">
          <p className="text-slate-300 font-bold text-sm">현재 화면에 배치된 패널 블록이 없습니다.</p>
          <p className="text-xs text-slate-500">원하는 패널을 추가하여 맞춤형 대시보드를 구성하세요.</p>
          <button
            type="button"
            onClick={() => handleOpenAddModal(0)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>첫 번째 패널 추가하기</span>
          </button>
        </div>
      )}

      {/* 🌟 블록 배열 순서대로 동적 렌더링 (실시간 렌더링 화면에서 직접 수정 가능) */}
      {activePanelKeys.map((blockKey, idx) => {
        const blockElement = renderDashboardBlock(blockKey);
        if (!blockElement) return null;
        const meta = ALL_DASHBOARD_BLOCKS.find((b) => b.key === blockKey) || {
          label: blockKey,
          badge: "패널"
        };
        const customTitle = panelCustomSettings[blockKey]?.customTitle ||
          panelCustomSettings[blockKey]?.customBottomTitle ||
          panelCustomSettings[blockKey]?.customTopTitle;

        return (
          <div key={blockKey} className="relative group/panel space-y-2">
            {/* 🛠️ [TEST 모드]: 각 패널 상단 직관적 실시간 컨트롤 바 */}
            {isTest && (
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-500/40 shadow-lg flex items-center justify-between gap-2 flex-wrap animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-cyan-600 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-black text-xs text-white truncate">
                    {customTitle || meta.label}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold shrink-0 border border-slate-700">
                    {meta.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleMoveBlockOnDashboard(idx, "up")}
                    disabled={idx === 0}
                    title="위로 이동"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBlockOnDashboard(idx, "down")}
                    disabled={idx === activePanelKeys.length - 1}
                    title="아래로 이동"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlockKeyFromDashboard(blockKey)}
                    title="제목 및 디자인 수정"
                    className="px-2 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>제목/디자인</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockFromDashboard(blockKey)}
                    title="이 패널 화면에서 삭제(제외)"
                    className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            )}

            {blockElement}

            {/* ➕ [TEST 모드]: 패널 사이 인서트 버튼 */}
            {isTest && (
              <div className="py-2.5 flex items-center justify-center relative my-1 group/add">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-cyan-500/25 group-hover/add:border-cyan-500/60 transition"></div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(idx + 1)}
                  className="relative z-10 px-3.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>여기에 새 패널/뱃지 추가</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 🚀 [TEST 모드 전용] 화면 하단 고정 플로팅 퀵 액션바 */}
      {isTest && (
        <div className="sticky bottom-4 z-40 max-w-fit mx-auto px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-cyan-500/60 shadow-2xl shadow-cyan-950/80 flex items-center gap-2 sm:gap-2.5 flex-wrap animate-fadeIn text-xs">
          {/* 시점 선택기 */}
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">관리자 뱃지:</span>
            <select
              value={selectedStudioManagerId}
              onChange={(e) => handleSelectStudioManager(e.target.value)}
              className="px-2 py-1 rounded-xl bg-slate-800 border border-cyan-500/40 text-cyan-300 font-black text-xs cursor-pointer outline-none hover:border-cyan-400"
            >
              {STUDIO_MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.name} {m.title} ({m.plant.replace("공장", "")})
                </option>
              ))}
            </select>
          </div>

          {/* 패널 추가 버튼 */}
          <button
            type="button"
            onClick={() => handleOpenAddModal(activePanelKeys.length)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-700 text-cyan-300 hover:text-white border border-slate-700 font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>패널 추가</span>
          </button>

          {/* 전체 통일 버튼 */}
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-700 text-teal-300 hover:text-white border border-slate-700 font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">디자인 통일</span>
          </button>

          {/* 상단 스튜디오 접기/펼치기 토글 */}
          <button
            type="button"
            onClick={() => setIsTopStudioVisible((v) => !v)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
            title={isTopStudioVisible ? "상단 스튜디오 접기" : "상단 스튜디오 펼치기"}
          >
            {isTopStudioVisible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isTopStudioVisible ? "스튜디오 접기" : "스튜디오 펼치기"}</span>
          </button>

          {/* 실시간 렌더링 화면 설정 저장 */}
          <button
            type="button"
            onClick={handleSaveStudioLayout}
            disabled={isSavingStudio}
            className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSavingStudio ? <span className="animate-spin">⏳</span> : <Save className="w-3.5 h-3.5" />}
            <span>이 화면 설정 저장</span>
          </button>
        </div>
      )}

      {/* ➕ [모달]: 패널 블록 추가 모달 */}
      {isAddModalOpen && (
        <AddPanelModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          activePanels={studioPanels}
          insertIndex={insertTargetIndex}
          onAddBlock={handleAddBlockToDashboard}
        />
      )}

      {/* 🎨 [모달]: 대시보드에서 직접 패널 클릭 시 열리는 제목 & 디자인 커스터마이저 모달 */}
      {editingBlockKeyFromDashboard && (
        <PanelDesignCustomizerModal
          isOpen={Boolean(editingBlockKeyFromDashboard)}
          onClose={() => setEditingBlockKeyFromDashboard(null)}
          blockKey={editingBlockKeyFromDashboard}
          currentManager={STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId) || STUDIO_MANAGERS[0]}
          initialSettings={panelCustomSettings[editingBlockKeyFromDashboard] || {}}
          onSave={handleSavePanelSetting}
          onReset={handleResetPanelSetting}
        />
      )}

      {/* 🌟 [모달]: 전체 패널 디자인 일괄 통일 모달 */}
      {isBatchModalOpen && (
        <BatchThemeCustomizerModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          activePanels={studioPanels}
          currentManager={STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId) || STUDIO_MANAGERS[0]}
          onApplyBatch={handleBatchApplyTheme}
        />
      )}
    </>
  );
};

export default InternalManagerDashboardView;
