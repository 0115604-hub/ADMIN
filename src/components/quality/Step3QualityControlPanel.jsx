import React from "react";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { useStep3QualityState } from "./step3/useStep3QualityState";
import { Step3QualityHeader } from "./step3/Step3QualityHeader";
import { Step3IncomingTransferredSection } from "./step3/Step3IncomingTransferredSection";
import { Step3Official4MLedgerSection } from "./step3/Step3Official4MLedgerSection";
import { Step3CapaActionModal } from "./step3/Step3CapaActionModal";
import { PANEL_THEMES } from "../../config/panelThemeConfig";

/**
 * 🛡️ 3단계 품질관리자 변동점 재검토 · 4M 대장 등재 및 시정조치(CAPA) 패널
 * 
 * 담당: 이창엽 책임 (품질보증)
 * 1. 2단계 생산관리자가 이관한 변동점 항목을 심층 재검토
 * 2. [사내관리로 재분류] vs [공식 4M 대장 등재] 구분 판정
 * 3. 시정/예방대책(CAPA) 수립 및 4단계 결재 상신
 * 4. 전후사진 각 5장 첨부 (총 10장)
 * 5. 4M 변동점 공식 결재라인: 이창엽 책임(상신) ➔ 이명재 이사(검토) ➔ 권태형 대표이사(최종승인)
 */
export default function Step3QualityControlPanel({
  currentProfile = null,
  onOpenIssueModal = null,
  onNavigateTab = null,
  customTitle = null,
  customBadge = null,
  hideBadge = false,
  hideSubtitle = true,
  theme = "indigo",
  borderRadius = "rounded-2xl",
  borderStyle = "border-2",
  isInlineEditing = false,
  customSettings = null,
  onUpdateDraft = null
}) {
  const state = useStep3QualityState({
    currentProfile,
    onNavigateTab
  });

  const themeObj = PANEL_THEMES[theme] || PANEL_THEMES.indigo;

  return (
    <div className={`bg-white dark:bg-slate-900 ${borderRadius} ${borderStyle} ${themeObj.borderClass} shadow-xl p-2.5 sm:p-3 space-y-2.5 text-left transition-all`}>
      {/* 1. Header Bar with Step 3 Identity */}
      <Step3QualityHeader
        managerName={state.managerName}
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        stats={state.stats}
        customTitle={customTitle}
        customBadge={customBadge}
        hideBadge={hideBadge}
        hideSubtitle={hideSubtitle}
        themeObj={themeObj}
        isInlineEditing={isInlineEditing}
        customSettings={customSettings}
        onUpdateDraft={onUpdateDraft}
      />

      {/* 2. SECTION 1: 2단계 관리자 이관 건 재검토 및 4M 대장 등재 (접수함) */}
      {(state.activeTab === "ALL" || state.activeTab === "INCOMING") && (
        <Step3IncomingTransferredSection
          incomingTransferredItems={state.incomingTransferredItems}
          incomingSelections={state.incomingSelections}
          setIncomingSelections={state.setIncomingSelections}
          stats={state.stats}
          handleReclassifyToInternal={state.handleReclassifyToInternal}
          handleConfirmToFourMLedger={state.handleConfirmToFourMLedger}
          setPreviewImage={state.setPreviewImage}
          isInlineEditing={isInlineEditing}
          customSettings={customSettings}
          onUpdateDraft={onUpdateDraft}
        />
      )}

      {/* 3. SECTION 2: 공식 4M 변동점 관리대장 & 시정조치(CAPA) 실행 현황 */}
      <Step3Official4MLedgerSection
        official4MItems={state.official4MItems}
        selectedFourMFilter={state.selectedFourMFilter}
        setSelectedFourMFilter={state.setSelectedFourMFilter}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        approvalDocs={state.approvalDocs}
        approvalDocsMap={state.approvalDocsMap}
        checkIsCeoApproved={state.checkIsCeoApproved}
        handleOpenCapaModal={state.handleOpenCapaModal}
        customTitle={customTitle}
        themeObj={themeObj}
        isInlineEditing={isInlineEditing}
        customSettings={customSettings}
        onUpdateDraft={onUpdateDraft}
      />

      {/* 4. 팝업창: 4M 변동점 및 이상내용 + 조치결과 + 전후사진 각 5장 + 전자결재 상신 모달 */}
      {state.capaModalItem && (
        <Step3CapaActionModal
          capaModalItem={state.capaModalItem}
          setCapaModalItem={state.setCapaModalItem}
          capaForm={state.capaForm}
          setCapaForm={state.setCapaForm}
          modalApproverInfo={state.modalApproverInfo}
          checkIsCeoApproved={state.checkIsCeoApproved}
          handleAddBeforePhotos={state.handleAddBeforePhotos}
          handleSetBeforePhotoSlot={state.handleSetBeforePhotoSlot}
          handleRemoveBeforePhoto={state.handleRemoveBeforePhoto}
          handleAddAfterPhotos={state.handleAddAfterPhotos}
          handleSetAfterPhotoSlot={state.handleSetAfterPhotoSlot}
          handleRemoveAfterPhoto={state.handleRemoveAfterPhoto}
          handleSaveProgress={state.handleSaveProgress}
          handleSubmitToElectronicApproval={state.handleSubmitToElectronicApproval}
          isSubmittingCapa={state.isSubmittingCapa}
          setPreviewImage={state.setPreviewImage}
        />
      )}

      {/* Image Preview Modal */}
      {state.previewImage && (
        <ImagePreviewModal
          previewImage={state.previewImage}
          onClose={() => state.setPreviewImage(null)}
        />
      )}
    </div>
  );
}
