import React from "react";
import { useTelegramViewState } from "./telegram/useTelegramViewState";
import { TelegramAccessRestricted } from "./telegram/TelegramAccessRestricted";
import { TelegramViewHeader } from "./telegram/TelegramViewHeader";
import { TelegramUnifiedRoomTab } from "./telegram/TelegramUnifiedRoomTab";
import { TelegramManagementRoomTab } from "./telegram/TelegramManagementRoomTab";
import { TelegramConfigCard } from "./telegram/TelegramConfigCard";

export const TelegramView = () => {
  const state = useTelegramViewState();

  if (!state.isAdmin) {
    return <TelegramAccessRestricted />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* 🚀 발송관리 통합 헤더 & [오륙통합방] vs [경영총괄] 2대 탭 */}
      <TelegramViewHeader
        activeMainTab={state.activeMainTab}
        setActiveMainTab={state.setActiveMainTab}
        telegramConfig={state.telegramConfig}
        setTelegramConfig={state.setTelegramConfig}
      />

      {/* 📢 TAB 1: 오륙통합방 (현장/품질/공지/결재/07:30 일반 모닝브리핑) */}
      {state.activeMainTab === "unified" && (
        <TelegramUnifiedRoomTab
          isUnifiedTemplateCustom={state.isUnifiedTemplateCustom}
          todayDateStr={state.todayDateStr}
          dayName={state.dayName}
          unifiedMsgType={state.unifiedMsgType}
          setUnifiedMsgType={state.setUnifiedMsgType}
          qualityStage={state.qualityStage}
          setQualityStage={state.setQualityStage}
          noticeMeetingType={state.noticeMeetingType}
          setNoticeMeetingType={state.setNoticeMeetingType}
          editableUnifiedText={state.editableUnifiedText}
          setEditableUnifiedText={state.setEditableUnifiedText}
          unifiedViewMode={state.unifiedViewMode}
          setUnifiedViewMode={state.setUnifiedViewMode}
          loadingLiveBriefing={state.loadingLiveBriefing}
          handleRefreshLiveBriefing={state.handleRefreshLiveBriefing}
          handleResetUnifiedTemplate={state.handleResetUnifiedTemplate}
          handleCopyText={state.handleCopyText}
          copyToast={state.copyToast}
          templateSavedToast={state.templateSavedToast}
          templateResetToast={state.templateResetToast}
          unifiedToast={state.unifiedToast}
          handleSaveUnifiedTemplate={state.handleSaveUnifiedTemplate}
          sendingUnified={state.sendingUnified}
          handleSendUnifiedMessage={state.handleSendUnifiedMessage}
        />
      )}

      {/* 👑 TAB 2: 경영총괄 (대표·전무 경영방 아침 매출 & 일정공유 브리핑) */}
      {state.activeMainTab === "management" && (
        <TelegramManagementRoomTab
          isManagementTemplateCustom={state.isManagementTemplateCustom}
          selectedPnLChannel={state.selectedPnLChannel}
          setSelectedPnLChannel={state.setSelectedPnLChannel}
          managementMsgType={state.managementMsgType}
          setManagementMsgType={state.setManagementMsgType}
          todayCommonSchedules={state.todayCommonSchedules}
          editableManagementText={state.editableManagementText}
          setEditableManagementText={state.setEditableManagementText}
          managementViewMode={state.managementViewMode}
          setManagementViewMode={state.setManagementViewMode}
          handleResetManagementTemplate={state.handleResetManagementTemplate}
          handleCopyText={state.handleCopyText}
          copyToast={state.copyToast}
          templateSavedToast={state.templateSavedToast}
          templateResetToast={state.templateResetToast}
          dailyPnLToast={state.dailyPnLToast}
          handleSaveManagementTemplate={state.handleSaveManagementTemplate}
          sendingDailyPnL={state.sendingDailyPnL}
          handleSendManagementMessage={state.handleSendManagementMessage}
        />
      )}

      {/* ⚙️ 텔레그램 Bot API 및 채널 ID 시스템 설정 */}
      <TelegramConfigCard
        activeMainTab={state.activeMainTab}
        telegramConfig={state.telegramConfig}
        setTelegramConfig={state.setTelegramConfig}
        testingTelegram={state.testingTelegram}
        testResult={state.testResult}
        savedConfigToast={state.savedConfigToast}
        handleSaveTelegramConfig={state.handleSaveTelegramConfig}
        handleTestTelegram={state.handleTestTelegram}
      />
    </div>
  );
};

export default TelegramView;
