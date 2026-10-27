import React from "react";
import CommonDowntimeDefectPanel from "./common/CommonDowntimeDefectPanel";
import LegoWorkReportBuilder from "./lego/LegoWorkReportBuilder";
import HanulReportHeaderNav from "./hanul/HanulReportHeaderNav";
import HanulReportSubNav from "./hanul/HanulReportSubNav";
import HanulReportTpmPanel from "./hanul/HanulReportTpmPanel";
import HanulReportAssignedWorkerBanner from "./hanul/HanulReportAssignedWorkerBanner";
import HanulReportBasicInfo from "./hanul/HanulReportBasicInfo";
import HanulReportLotSpec from "./hanul/HanulReportLotSpec";
import HanulReportJointCondition from "./hanul/HanulReportJointCondition";
import HanulReportDefectMatrix from "./hanul/HanulReportDefectMatrix";
import HanulReportBladeMaintenance from "./hanul/HanulReportBladeMaintenance";
import HanulReportFooter from "./hanul/HanulReportFooter";
import { useHanulWorkReportState } from "./hanul/useHanulWorkReportState";

export const HanulWorkReportModal = ({
  isOpen,
  onClose,
  initialProject = "9BQC",
  initialProcess = "소재준비",
  initialWorker = "",
  editReport = null,
  companyMode = "HANUL"
}) => {
  const state = useHanulWorkReportState({
    isOpen,
    onClose,
    initialProject,
    initialProcess,
    initialWorker,
    editReport,
    companyMode
  });

  if (!isOpen) return null;

  return (
    <div
      ref={state.overlayRef}
      className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex justify-center items-start p-0 sm:p-4 overflow-y-auto overflow-x-auto mobile-pan-free animate-fadeIn"
    >
      <div
        ref={state.modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[94dvh] rounded-none sm:rounded-3xl border-0 sm:border-2 border-indigo-500/60 shadow-2xl flex flex-col m-0 sm:mt-3 sm:mb-6 sm:mx-auto text-left mobile-pan-free"
      >
        <HanulReportHeaderNav
          processId={state.processId}
          setProcessId={state.setProcessId}
          project={state.project}
          setProject={state.setProject}
          subProcess={state.subProcess}
          setSubProcess={state.setSubProcess}
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          isHanulTpmDone={state.isHanulTpmDone}
          currentLang={state.currentLang}
          setCurrentLang={state.setCurrentLang}
          workerLangInfo={state.workerLangInfo}
          onClose={onClose}
          handleExcelExport={state.handleExcelExport}
          templateAssignments={state.templateAssignments}
          activeAssignedTemplate={state.activeAssignedTemplate}
          forceLegacyMode={state.forceLegacyMode}
          setForceLegacyMode={state.setForceLegacyMode}
          jointType={state.jointType}
          setJointType={state.setJointType}
          inspectionType={state.inspectionType}
          setInspectionType={state.setInspectionType}
          handleSetAllTpmOk={state.handleSetAllTpmOk}
        />

        {/* 🌟 3. Scrollable Form Body */}
        <div
          ref={state.scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar p-2.5 sm:p-5 space-y-3 sm:space-y-4 mobile-pan-free"
        >
          {state.processId === "소재준비" && state.currentStep === "tpm" ? (
            <HanulReportTpmPanel
              currentLang={state.currentLang}
              tpmI18n={state.tpmI18n}
              date={state.date}
              customWorker={state.customWorker}
              worker={state.worker}
              tpmChecks={state.tpmChecks}
              tpmSummary={state.tpmSummary}
              tpmActionNote={state.tpmActionNote}
              setTpmActionNote={state.setTpmActionNote}
              handleSetMachineAllOk={state.handleSetMachineAllOk}
              handleToggleTpmCheck={state.handleToggleTpmCheck}
              handleSetAllTpmOk={state.handleSetAllTpmOk}
              handleProceedToReport={state.handleProceedToReport}
            />
          ) : state.isAssignedTemplateMode ? (
            <div className="space-y-4 animate-fadeIn">
              <HanulReportAssignedWorkerBanner
                currentLang={state.currentLang}
                effectiveWorkerName={state.effectiveWorkerName}
                date={state.date}
                setDate={state.setDate}
                shift={state.shift}
                activeAssignedTemplate={state.activeAssignedTemplate}
                existingWorkerReport={state.existingWorkerReport}
                processId={state.processId}
                setCurrentStep={state.setCurrentStep}
                tpmI18n={state.tpmI18n}
                worker={state.worker}
                setWorker={state.setWorker}
                setCustomWorker={state.setCustomWorker}
              />

              <LegoWorkReportBuilder
                key={`${state.activeSlotKey}_${
                  state.existingWorkerReport?.id || state.activeAssignedTemplate?.id || state.project
                }_${state.effectiveWorkerName}_${state.date}`}
                isEmbedded={true}
                isWorkerRecordingMode={true}
                initialTemplateData={state.activeAssignedTemplate}
                initialWorkerName={state.effectiveWorkerName}
                initialWorkDate={state.date}
                currentLang={state.currentLang}
                onSaveWorkReport={state.handleSaveLegoAssignedReport}
                onDeleteWorkReport={
                  state.existingWorkerReport?.id ||
                  editReport?.id ||
                  state.activeAssignedTemplate?.isExistingDraft
                    ? state.handleDeleteLegoAssignedReport
                    : null
                }
              />
            </div>
          ) : (
            <>
              <HanulReportSubNav
                processId={state.processId}
                subProcess={state.subProcess}
                setSubProcess={state.setSubProcess}
                jointType={state.jointType}
                setJointType={state.setJointType}
                inspectionType={state.inspectionType}
                setInspectionType={state.setInspectionType}
                currentLang={state.currentLang}
              />

              <HanulReportBasicInfo
                currentProcessObj={state.currentProcessObj}
                date={state.date}
                setDate={state.setDate}
                shift={state.shift}
                setShift={state.setShift}
                worker={state.worker}
                setWorker={state.setWorker}
                customWorker={state.customWorker}
                setCustomWorker={state.setCustomWorker}
                startTime={state.startTime}
                setStartTime={state.setStartTime}
                endTime={state.endTime}
                setEndTime={state.setEndTime}
                totals={state.totals}
                processId={state.processId}
                subProcess={state.subProcess}
                jointType={state.jointType}
                inspectionType={state.inspectionType}
                inspColumns={state.inspColumns}
                inspProduction={state.inspProduction}
                updateInspProd={state.updateInspProd}
                cuttingPart={state.cuttingPart}
                setCuttingPart={state.setCuttingPart}
                production={state.production}
                setProduction={state.setProduction}
              />

              <HanulReportLotSpec
                currentSpecs={state.currentSpecs}
                lotEntries={state.lotEntries}
                handleAddLot={state.handleAddLot}
                handleUpdateLotField={state.handleUpdateLotField}
                handleRemoveLot={state.handleRemoveLot}
                handleUpdateLotMeasurement={state.handleUpdateLotMeasurement}
                processId={state.processId}
              />

              <HanulReportJointCondition
                processId={state.processId}
                project={state.project}
                jointType={state.jointType}
                jointGradeName={state.jointGradeName}
                conditions={state.conditions}
                setConditions={state.setConditions}
                cleaningTimes={state.cleaningTimes}
              />

              <HanulReportDefectMatrix
                processId={state.processId}
                totals={state.totals}
                currentDefectKeys={state.currentDefectKeys}
                defects={state.defects}
                handleDefectChange={state.handleDefectChange}
                handleDefectInput={state.handleDefectInput}
              />

              {/* ⏱️ 비가동 및 부적합품 발생내역 (한울·부림텍 전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
              <CommonDowntimeDefectPanel
                title="비가동 및 부적합품 발생내역"
                plantLabel={companyMode === "BURIM" ? "부림텍" : "한울 · 부림텍"}
                unitLabel="부적합량(EA)"
                currentLang={state.currentLang}
                events={state.downtimeEvents}
                onChangeEvents={state.setDowntimeEvents}
                onSyncSummary={({ summaryText }) => {
                  if (summaryText) state.setMachineTrouble(summaryText);
                }}
              />

              <HanulReportBladeMaintenance
                project={state.project}
                processId={state.processId}
                subProcess={state.subProcess}
                isBladeOverdue={state.isBladeOverdue}
                totalCumulativeQty={state.totalCumulativeQty}
                BLADE_LIMIT={state.BLADE_LIMIT}
                bladeLifePercent={state.bladeLifePercent}
                isBladeTestMode={state.isBladeTestMode}
                setIsBladeTestMode={state.setIsBladeTestMode}
                bladeChangeTime={state.bladeChangeTime}
                setBladeChangeTime={state.setBladeChangeTime}
                handleRecordBladeChangeNow={state.handleRecordBladeChangeNow}
                bladeResetInfo={state.bladeResetInfo}
                handleClearBladeReset={state.handleClearBladeReset}
                machineTrouble={state.machineTrouble}
                setMachineTrouble={state.setMachineTrouble}
                notes={state.notes}
                setNotes={state.setNotes}
              />
            </>
          )}
        </div>

        <HanulReportFooter
          isAssignedTemplateMode={state.isAssignedTemplateMode}
          processId={state.processId}
          currentStep={state.currentStep}
          setCurrentStep={state.setCurrentStep}
          toastMessage={state.toastMessage}
          tpmSummary={state.tpmSummary}
          tpmI18n={state.tpmI18n}
          onClose={onClose}
          handleProceedToReport={state.handleProceedToReport}
          handleSave={state.handleSave}
          isSaving={state.isSaving}
          currentLang={state.currentLang}
        />
      </div>
    </div>
  );
};

export default HanulWorkReportModal;
