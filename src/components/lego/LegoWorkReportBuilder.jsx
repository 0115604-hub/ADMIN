import { Sparkles } from "lucide-react";
import { deleteMachiningWorkReport } from "../../services/machiningWorkReportService";
import LegoBlockEditorModal from "./LegoBlockEditorModal.jsx";
import LegoBlockCollectionModal from "./LegoBlockCollectionModal.jsx";
import {
  deleteWorkReportTemplate,
  REPORT_MAJOR_CATEGORIES,
  saveCustomLegoBlock
} from "../../services/workReportTemplateService";

// 🧱 Re-export Preset Templates & Master Metadata from legoPresetData.js
import {
  LEGO_IMAGE_REFERENCES,
  PRESET_REPORTS,
  LEGO_BLOCK_SWITCH_CATALOG,
  DEFAULT_BLOCK_ORDER
} from "./legoPresetData.js";

export {
  LEGO_IMAGE_REFERENCES,
  PRESET_REPORTS,
  LEGO_BLOCK_SWITCH_CATALOG,
  DEFAULT_BLOCK_ORDER
};

// 🧱 Lego Modular Subcomponents
import { LegoTopHeroToolbar } from "./LegoTopHeroToolbar.jsx";
import { LegoBlockSwitcherSidebar } from "./LegoBlockSwitcherSidebar.jsx";
import { ReportTitleHeader } from "./LegoMaterialPrepBlocks.jsx";
import { LegoBottomActionBar } from "./LegoBottomActionBar.jsx";
import { LegoSaveCatalogModal } from "./LegoSaveCatalogModal.jsx";
import { LegoWorkReportBlocksBody } from "./LegoWorkReportBlocksBody.jsx";
import { useLegoWorkReportBuilderState } from "./useLegoWorkReportBuilderState.jsx";

export const LegoWorkReportBuilder = ({
  initialPresetId = "REPORT_CUTTING",
  initialWorkerName = "",
  initialWorkDate = "",
  initialTemplateData = null,
  onSaveWorkReport,
  onSaveToTemplateManager,
  onNavigateToCatalog,
  onDeleteWorkReport = null,
  isEmbedded = false,
  isWorkerRecordingMode = false,
  currentLang: propLang = null
}) => {
  const state = useLegoWorkReportBuilderState({
    initialPresetId,
    initialWorkerName,
    initialWorkDate,
    initialTemplateData,
    onSaveWorkReport,
    onSaveToTemplateManager,
    isWorkerRecordingMode,
    currentLang: propLang
  });

  return (
    <div className={`space-y-4 max-w-[1700px] mx-auto text-left ${isEmbedded ? "pb-6" : "pb-16"}`}>
      {/* Toast Notification */}
      {state.toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-xs sm:text-sm font-black">{state.toastMsg}</span>
        </div>
      )}

      {/* Top Hero Toolbar */}
      <LegoTopHeroToolbar
        isWorkerRecordingMode={isWorkerRecordingMode}
        currentReport={state.currentReport}
        setShowPhotoRefModal={state.setShowPhotoRefModal}
        setPhotoModalTab={state.setPhotoModalTab}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        handlePrint={state.handlePrint}
        onNavigateToCatalog={onNavigateToCatalog}
        handleOpenSaveCatalogModal={state.handleOpenSaveCatalogModal}
        onDeleteWorkReport={onDeleteWorkReport}
        savedTemplates={state.savedTemplates}
        deleteWorkReportTemplate={deleteWorkReportTemplate}
        deleteMachiningWorkReport={deleteMachiningWorkReport}
        setCurrentReport={state.setCurrentReport}
        setAppliedTemplateBanner={state.setAppliedTemplateBanner}
        showToast={state.showToast}
        handleSaveOfficialWorkReport={state.handleSaveOfficialWorkReport}
        isSubmitting={state.isSubmitting}
        handleUpdateField={state.handleUpdateField}
        appliedTemplateBanner={state.appliedTemplateBanner}
        PRESET_REPORTS={PRESET_REPORTS}
        handleLoadPreset={state.handleLoadPreset}
      />

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar */}
        <LegoBlockSwitcherSidebar
          isWorkerRecordingMode={isWorkerRecordingMode}
          combinedSwitchCatalog={state.combinedSwitchCatalog}
          setPhotoModalTab={state.setPhotoModalTab}
          setShowPhotoRefModal={state.setShowPhotoRefModal}
          handleResetBlockOrder={state.handleResetBlockOrder}
          orderedBlockItems={state.orderedBlockItems}
          currentReport={state.currentReport}
          setCurrentReport={state.setCurrentReport}
          selectedBlockKey={state.selectedBlockKey}
          draggedBlockIdx={state.draggedBlockIdx}
          setDraggedBlockIdx={state.setDraggedBlockIdx}
          dragOverBlockIdx={state.dragOverBlockIdx}
          setDragOverBlockIdx={state.setDragOverBlockIdx}
          handleBlockDrop={state.handleBlockDrop}
          handleSelectBlock={state.handleSelectBlock}
          handleToggleBlock={state.handleToggleBlock}
          handleMoveBlockOrder={state.handleMoveBlockOrder}
          handleOpenBlockEditor={state.handleOpenBlockEditor}
          handleUpdateField={state.handleUpdateField}
        />

        {/* Right Main Form */}
        <div className={`${isWorkerRecordingMode ? "lg:col-span-12" : "lg:col-span-8"} space-y-4`}>
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            {/* Header: Title & 3-Step Approval */}
            <ReportTitleHeader
              currentReport={state.currentReport}
              isWorkerRecordingMode={isWorkerRecordingMode}
              handleUpdateField={state.handleUpdateField}
              t={state.t}
            />

            {/* Ordered Blocks Container */}
            <LegoWorkReportBlocksBody
              currentReport={state.currentReport}
              setCurrentReport={state.setCurrentReport}
              isWorkerRecordingMode={isWorkerRecordingMode}
              handleUpdateField={state.handleUpdateField}
              handleUpdateSpecValue={state.handleUpdateSpecValue}
              handleDeleteCuttingSpecRow={state.handleDeleteCuttingSpecRow}
              handleAddCuttingSpecRow={state.handleAddCuttingSpecRow}
              handleAddStepCuttingRow={state.handleAddStepCuttingRow}
              handleAddDefectSectionAbcRow={state.handleAddDefectSectionAbcRow}
              handleAddJointDefectRow={state.handleAddJointDefectRow}
              handleAddDrawingSpecRow={state.handleAddDrawingSpecRow}
              handleAddMachineRow={state.handleAddMachineRow}
              handleAddFrtRightAngleDefectRow={state.handleAddFrtRightAngleDefectRow}
              combinedSwitchCatalog={state.combinedSwitchCatalog}
              draggedCustomCol={state.draggedCustomCol}
              setDraggedCustomCol={state.setDraggedCustomCol}
              dragOverCustomCol={state.dragOverCustomCol}
              setDragOverCustomCol={state.setDragOverCustomCol}
              showToast={state.showToast}
              t={state.t}
              currentLang={state.currentLang}
              renderBlockWrapper={state.renderBlockWrapper}
            />

            {/* Bottom Register Action Bar */}
            <LegoBottomActionBar
              isWorkerRecordingMode={isWorkerRecordingMode}
              currentReport={state.currentReport}
              onDeleteWorkReport={onDeleteWorkReport}
              savedTemplates={state.savedTemplates}
              deleteWorkReportTemplate={deleteWorkReportTemplate}
              deleteMachiningWorkReport={deleteMachiningWorkReport}
              setCurrentReport={state.setCurrentReport}
              setAppliedTemplateBanner={state.setAppliedTemplateBanner}
              showToast={state.showToast}
              handleSaveOfficialWorkReport={state.handleSaveOfficialWorkReport}
              isSubmitting={state.isSubmitting}
              PRESET_REPORTS={PRESET_REPORTS}
              t={state.t}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <LegoBlockCollectionModal
        isOpen={state.showPhotoRefModal}
        onClose={() => state.setShowPhotoRefModal(false)}
        references={LEGO_IMAGE_REFERENCES}
        customBlocks={state.customBlocks}
        activeTab={state.photoModalTab}
        setActiveTab={state.setPhotoModalTab}
        onSaveCustomBlock={saveCustomLegoBlock}
        onShowToast={state.showToast}
      />

      <LegoBlockEditorModal
        isOpen={state.isBlockEditorOpen}
        onClose={() => state.setIsBlockEditorOpen(false)}
        blockKey={state.editingBlockKey}
        currentReport={state.currentReport}
        onUpdateReport={state.setCurrentReport}
        onShowToast={state.showToast}
      />

      <LegoSaveCatalogModal
        isOpen={state.isSaveCatalogModalOpen}
        onClose={() => state.setIsSaveCatalogModalOpen(false)}
        catalogMeta={state.catalogMeta}
        setCatalogMeta={state.setCatalogMeta}
        REPORT_MAJOR_CATEGORIES={REPORT_MAJOR_CATEGORIES}
        handleConfirmSaveCatalog={state.handleConfirmSaveCatalog}
      />
    </div>
  );
};

export default LegoWorkReportBuilder;
