import React from "react";
import {
  WORKER_PRESETS,
  EXTRUSION_STANDARD_SPECS
} from "../../services/extrusionProductionService";
import ExtrusionReportHeaderNav from "./report/ExtrusionReportHeaderNav";
import ExtrusionReportTpmPanel from "./report/ExtrusionReportTpmPanel";
import ExtrusionReportBasicInfo from "./report/ExtrusionReportBasicInfo";
import ExtrusionReportItemProduction from "./report/ExtrusionReportItemProduction";
import ExtrusionReportMachineConditions from "./report/ExtrusionReportMachineConditions";
import ExtrusionReportNotesAndDowntime from "./report/ExtrusionReportNotesAndDowntime";
import ExtrusionReportFooter from "./report/ExtrusionReportFooter";
import ExtrusionReportPhotoModal from "./report/ExtrusionReportPhotoModal";
import { useExtrusionWorkReportState } from "./report/useExtrusionWorkReportState";

export const ExtrusionWorkReportModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing = false,
  existingReports = []
}) => {
  const {
    currentStep,
    setCurrentStep,
    fileInputRef,
    isCapturingPhoto,
    selectedPhotoPreview,
    setSelectedPhotoPreview,
    tpmChecks,
    formData,
    setFormData,
    errors,
    isTPELine,
    isPVCLine,
    activeLineItems,
    isTpmCompleted,
    currentWorkers,
    handleToggleWorker,
    handleTpmStatusChange,
    handleTpmNoteChange,
    handleSetAllTpmOk,
    handleProceedToReport,
    handlePhotoCapture,
    handleRemovePhoto,
    handleLineSelect,
    handleAddItem,
    handleRemoveItem,
    handleItemFieldChange,
    handleItemRawMaterialChange,
    handleNestedFieldChange,
    handleWaterZone110Change,
    handleWaterZone70Change,
    handleBatchWaterZones,
    handleTpeTempChange,
    handlePvcTempChange,
    handlePvcDryerZoneChange,
    handleDownloadCheckSheet,
    handleSubmit,
    isSubmitting
  } = useExtrusionWorkReportState({
    isOpen,
    onClose,
    onSave,
    initialData,
    isEditing,
    existingReports
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header & Step Progression Tabs */}
        <ExtrusionReportHeaderNav
          isEditing={isEditing}
          isTpmCompleted={isTpmCompleted}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onClose}
          handleSetAllTpmOk={handleSetAllTpmOk}
          handleDownloadCheckSheet={handleDownloadCheckSheet}
        />

        {/* Scrollable Form Body */}
        {currentStep === "tpm" ? (
          /* STEP 1: TPM 점검일지 화면 */
          <ExtrusionReportTpmPanel
            tpmChecks={tpmChecks}
            handleTpmStatusChange={handleTpmStatusChange}
            handleTpmNoteChange={handleTpmNoteChange}
            fileInputRef={fileInputRef}
            handlePhotoCapture={handlePhotoCapture}
            isCapturingPhoto={isCapturingPhoto}
            formData={formData}
            setFormData={setFormData}
            setSelectedPhotoPreview={setSelectedPhotoPreview}
            handleRemovePhoto={handleRemovePhoto}
          />
        ) : (
          /* STEP 2: 압출 작업일보 및 체크시트 화면 */
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn"
          >
            {/* Section 1: 기본 정보 */}
            <ExtrusionReportBasicInfo
              formData={formData}
              setFormData={setFormData}
              handleLineSelect={handleLineSelect}
              currentWorkers={currentWorkers}
              handleToggleWorker={handleToggleWorker}
              errors={errors}
              WORKER_PRESETS={WORKER_PRESETS}
            />

            {/* Section 2: 품목별 생산 실적 및 투입원료 LOT */}
            <ExtrusionReportItemProduction
              formData={formData}
              errors={errors}
              activeLineItems={activeLineItems}
              handleRemoveItem={handleRemoveItem}
              handleItemFieldChange={handleItemFieldChange}
              handleItemRawMaterialChange={handleItemRawMaterialChange}
              handleAddItem={handleAddItem}
            />

            {/* Section 3: 압출기 속도 & 온도 작업조건 */}
            <ExtrusionReportMachineConditions
              formData={formData}
              isTPELine={isTPELine}
              isPVCLine={isPVCLine}
              handleNestedFieldChange={handleNestedFieldChange}
              handleBatchWaterZones={handleBatchWaterZones}
              handleWaterZone110Change={handleWaterZone110Change}
              handleWaterZone70Change={handleWaterZone70Change}
              handleTpeZoneChange={handleTpeTempChange}
              handlePvcZoneChange={handlePvcTempChange}
              handlePvcDryingZoneChange={handlePvcDryerZoneChange}
              setFormData={setFormData}
              EXTRUSION_STANDARD_SPECS={EXTRUSION_STANDARD_SPECS}
            />

            {/* Section 4 & 5: 비가동/부적합 및 특이사항 */}
            <ExtrusionReportNotesAndDowntime
              formData={formData}
              setFormData={setFormData}
              dtEvents={formData?.downtimeEvents}
              defaultWasteWeight={
                formData.items?.reduce((sum, it) => sum + (Number(it?.scrapKg) || 0), 0) || ""
              }
            />
          </form>
        )}

        {/* Footer Actions */}
        <ExtrusionReportFooter
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onClose}
          handleProceedToReport={handleProceedToReport}
          handleSubmit={handleSubmit}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Enlarged Photo Preview Modal */}
      <ExtrusionReportPhotoModal
        photoUrl={selectedPhotoPreview}
        onClose={() => setSelectedPhotoPreview(null)}
      />
    </div>
  );
};

export default ExtrusionWorkReportModal;
