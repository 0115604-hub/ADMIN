import React from "react";
import { useYuseongWorkReportState } from "./modal/useYuseongWorkReportState";
import { YuseongModalHeader } from "./modal/YuseongModalHeader";
import { YuseongModalStepNav } from "./modal/YuseongModalStepNav";
import { YuseongTpmPanel } from "./modal/YuseongTpmPanel";
import { YuseongLegoReportSection } from "./modal/YuseongLegoReportSection";
import { YuseongStandardReportForm } from "./modal/YuseongStandardReportForm";
import { YuseongModalFooter } from "./modal/YuseongModalFooter";

export const YuseongWorkReportModal = ({
  isOpen,
  onClose,
  initialProject = "JK1",
  initialWorker = "이성기",
  editReport = null
}) => {
  const state = useYuseongWorkReportState({
    isOpen,
    onClose,
    initialProject,
    initialWorker,
    editReport
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Modal Header */}
        <YuseongModalHeader
          project={state.project}
          processId={state.processId}
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          onClose={onClose}
        />

        {/* Step Indicator Tabs */}
        <YuseongModalStepNav
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          handleProceedToReport={state.handleProceedToReport}
          tpmSummary={state.tpmSummary}
          project={state.project}
        />

        {/* Modal Body */}
        <div ref={state.scrollContainerRef} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {state.currentStep === "tpm" ? (
            /* 🛠️ 4단계: TPM 설비일상점검 화면 */
            <YuseongTpmPanel
              tpmChecks={state.tpmChecks}
              tpmSummary={state.tpmSummary}
              tpmActionNote={state.tpmActionNote}
              setTpmActionNote={state.setTpmActionNote}
              handleToggleTpmCheck={state.handleToggleTpmCheck}
              handleSetAllTpmOk={state.handleSetAllTpmOk}
              handleProceedToReport={state.handleProceedToReport}
            />
          ) : state.isLegoMode && state.assignedTemplate ? (
            /* 🌟 5대 공정 지정 레고블럭 양식 기록 화면 */
            <YuseongLegoReportSection
              assignedTemplate={state.assignedTemplate}
              project={state.project}
              processId={state.processId}
              customWorker={state.customWorker}
              worker={state.worker}
              date={state.date}
              activeAssignedTemplate={state.activeAssignedTemplate}
              setIsLegoMode={state.setIsLegoMode}
              handleSaveLegoReport={state.handleSaveLegoReport}
              handleDeleteLegoReport={state.handleDeleteLegoReport}
              editReport={editReport}
            />
          ) : (
            /* 🌟 5단계: 유성 3대 아이템 공정별 작업일보 작성 화면 (JK1, CE1, DT Hood) */
            <YuseongStandardReportForm
              assignedTemplate={state.assignedTemplate}
              setIsLegoMode={state.setIsLegoMode}
              project={state.project}
              setProject={state.setProject}
              processId={state.processId}
              setProcessId={state.setProcessId}
              subProcess={state.subProcess}
              setSubProcess={state.setSubProcess}
              date={state.date}
              setDate={state.setDate}
              shift={state.shift}
              setShift={state.setShift}
              worker={state.worker}
              customWorker={state.customWorker}
              setCustomWorker={state.setCustomWorker}
              startTime={state.startTime}
              setStartTime={state.setStartTime}
              endTime={state.endTime}
              setEndTime={state.setEndTime}
              machineNo={state.machineNo}
              setMachineNo={state.setMachineNo}
              dollyNo={state.dollyNo}
              setDollyNo={state.setDollyNo}
              materialLot={state.materialLot}
              setMaterialLot={state.setMaterialLot}
              bladeChangeTime={state.bladeChangeTime}
              setBladeChangeTime={state.setBladeChangeTime}
              currentSpecs={state.currentSpecs}
              dimensions={state.dimensions}
              handleDimChange={state.handleDimChange}
              production={state.production}
              setProduction={state.setProduction}
              totalGross={state.totalGross}
              yieldPct={state.yieldPct}
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

        {/* Footer */}
        <YuseongModalFooter
          onClose={onClose}
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          handleProceedToReport={state.handleProceedToReport}
          handleSave={state.handleSave}
          isSaving={state.isSaving}
          saveSuccess={state.saveSuccess}
        />
      </div>
    </div>
  );
};

export default YuseongWorkReportModal;
