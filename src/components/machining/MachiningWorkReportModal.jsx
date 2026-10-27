import React from "react";
import { useMachiningWorkReportState } from "./modal/useMachiningWorkReportState";
import { MachiningModalHeader } from "./modal/MachiningModalHeader";
import { MachiningModalFooter } from "./modal/MachiningModalFooter";
import { MachiningTpmCheckSection } from "./modal/MachiningTpmCheckSection";
import { MachiningLegoReportSection } from "./modal/MachiningLegoReportSection";
import { MachiningStandardReportForm } from "./modal/MachiningStandardReportForm";

export const MachiningWorkReportModal = ({
  isOpen,
  onClose,
  initialProject = "JA",
  initialProcess = "소재준비",
  initialWorker = "",
  editReport = null
}) => {
  const state = useMachiningWorkReportState({
    isOpen,
    onClose,
    initialProject,
    initialProcess,
    initialWorker,
    editReport
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500/50 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-left animate-scaleUp"
      >
        {/* Header */}
        <MachiningModalHeader
          project={state.project}
          processId={state.processId}
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          handleExportExcel={state.handleExportExcel}
          onClose={onClose}
        />

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200">
          {state.currentStep === "tpm" ? (
            <MachiningTpmCheckSection
              project={state.project}
              tpmChecks={state.tpmChecks}
              tpmActionNote={state.tpmActionNote}
              setTpmActionNote={state.setTpmActionNote}
              tpmSummary={state.tpmSummary}
              handleSetAllTpmOk={state.handleSetAllTpmOk}
              handleToggleTpmCheck={state.handleToggleTpmCheck}
              handleProceedToReport={state.handleProceedToReport}
            />
          ) : (
            <div className="space-y-4">
              <MachiningLegoReportSection
                project={state.project}
                processId={state.processId}
                effectiveWorkerName={state.effectiveWorkerName}
                date={state.date}
                activeAssignedTemplate={state.activeAssignedTemplate}
                isLegoMode={state.isLegoMode}
                setIsLegoMode={state.setIsLegoMode}
                handleSaveLegoReport={state.handleSaveLegoReport}
                handleDeleteLegoReport={state.handleDeleteLegoReport}
              />

              {!state.isLegoMode && (
                <MachiningStandardReportForm
                  project={state.project}
                  setProject={state.setProject}
                  processId={state.processId}
                  setProcessId={state.setProcessId}
                  subProcess={state.subProcess}
                  setSubProcess={state.setSubProcess}
                  jointType={state.jointType}
                  setJointType={state.setJointType}
                  inspectionType={state.inspectionType}
                  setInspectionType={state.setInspectionType}
                  date={state.date}
                  setDate={state.setDate}
                  shift={state.shift}
                  setShift={state.setShift}
                  worker={state.worker}
                  setWorker={state.setWorker}
                  customWorker={state.customWorker}
                  setCustomWorker={state.setCustomWorker}
                  machineNo={state.machineNo}
                  setMachineNo={state.setMachineNo}
                  dollyNo={state.dollyNo}
                  setDollyNo={state.setDollyNo}
                  materialLot={state.materialLot}
                  setMaterialLot={state.setMaterialLot}
                  jointLot={state.jointLot}
                  setJointLot={state.setJointLot}
                  bladeChangeTime={state.bladeChangeTime}
                  setBladeChangeTime={state.setBladeChangeTime}
                  currentSpecs={state.currentSpecs}
                  dimensions={state.dimensions}
                  handleDimChange={state.handleDimChange}
                  totalGross={state.totalGross}
                  yieldPct={state.yieldPct}
                  production={state.production}
                  setProduction={state.setProduction}
                  inspProduction={state.inspProduction}
                  setInspProduction={state.setInspProduction}
                  currentDefectKeys={state.currentDefectKeys}
                  defects={state.defects}
                  handleDefectChange={state.handleDefectChange}
                  tpmSummary={state.tpmSummary}
                  setCurrentStep={state.setCurrentStep}
                  downtimeEvents={state.downtimeEvents}
                  setDowntimeEvents={state.setDowntimeEvents}
                  downtimeMinutes={state.downtimeMinutes}
                  setDowntimeMinutes={state.setDowntimeMinutes}
                  machineTrouble={state.machineTrouble}
                  setMachineTrouble={state.setMachineTrouble}
                  notes={state.notes}
                  setNotes={state.setNotes}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <MachiningModalFooter
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          onClose={onClose}
          handleProceedToReport={state.handleProceedToReport}
          isSaving={state.isSaving}
          saveSuccess={state.saveSuccess}
          handleSave={state.handleSave}
        />
      </div>
    </div>
  );
};

export default MachiningWorkReportModal;
