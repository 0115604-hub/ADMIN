import React from "react";
import {
  BasicInfoBlock,
  WorkTimeOutputBlock,
  SpecsCuttingBlock,
  StepCuttingBlocks
} from "./LegoMaterialPrepBlocks.jsx";
import {
  DefectMaterialMatrixBlock,
  DefectSectionAbcBlock
} from "./LegoDefectMaterialBlocks.jsx";
import {
  TimeAndOutputBlock,
  JointMaterialBlock,
  InjectionTempConditionBlocks,
  JointDefectMatrixBlock
} from "./LegoJointProcessBlocks.jsx";
import {
  DrawingSpecCheckBlock,
  RightAngleMatrixBlock,
  FrtRightAngleDefectsBlock,
  SubMaterialAndRemarksBlocks,
  CommonInspectionLifecycleBlocks
} from "./LegoInspectionBlocks.jsx";
import { LegoCustomPhotoBlocks } from "./LegoCustomPhotoBlocks.jsx";

export const LegoWorkReportBlocksBody = ({
  currentReport,
  setCurrentReport,
  isWorkerRecordingMode,
  handleUpdateField,
  handleUpdateSpecValue,
  handleDeleteCuttingSpecRow,
  handleAddCuttingSpecRow,
  handleAddStepCuttingRow,
  handleAddDefectSectionAbcRow,
  handleAddJointDefectRow,
  handleAddDrawingSpecRow,
  handleAddMachineRow,
  handleAddFrtRightAngleDefectRow,
  combinedSwitchCatalog,
  draggedCustomCol,
  setDraggedCustomCol,
  dragOverCustomCol,
  setDragOverCustomCol,
  showToast,
  t,
  currentLang,
  renderBlockWrapper
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Material Prep Blocks */}
      <BasicInfoBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateField={handleUpdateField}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <WorkTimeOutputBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <SpecsCuttingBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        handleDeleteCuttingSpecRow={handleDeleteCuttingSpecRow}
        handleAddCuttingSpecRow={handleAddCuttingSpecRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <StepCuttingBlocks
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        handleAddStepCuttingRow={handleAddStepCuttingRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />

      {/* Defect Material Blocks */}
      <DefectMaterialMatrixBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateField={handleUpdateField}
        handleUpdateSpecValue={handleUpdateSpecValue}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <DefectSectionAbcBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        handleAddDefectSectionAbcRow={handleAddDefectSectionAbcRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />

      {/* Joint Process Blocks */}
      <TimeAndOutputBlock
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <JointMaterialBlock
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <InjectionTempConditionBlocks
        currentReport={currentReport}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <JointDefectMatrixBlock
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleAddJointDefectRow={handleAddJointDefectRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />

      {/* Inspection & Common Lifecycle Blocks */}
      <DrawingSpecCheckBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        handleAddDrawingSpecRow={handleAddDrawingSpecRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <RightAngleMatrixBlock
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleAddMachineRow={handleAddMachineRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <FrtRightAngleDefectsBlock
        currentReport={currentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        handleUpdateSpecValue={handleUpdateSpecValue}
        handleAddFrtRightAngleDefectRow={handleAddFrtRightAngleDefectRow}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <SubMaterialAndRemarksBlocks
        currentReport={currentReport}
        handleUpdateField={handleUpdateField}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />
      <CommonInspectionLifecycleBlocks
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        currentLang={currentLang}
        t={t}
        renderBlockWrapper={renderBlockWrapper}
      />

      {/* Custom Photo-Analyzed Blocks */}
      <LegoCustomPhotoBlocks
        combinedSwitchCatalog={combinedSwitchCatalog}
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        isWorkerRecordingMode={isWorkerRecordingMode}
        draggedCustomCol={draggedCustomCol}
        setDraggedCustomCol={setDraggedCustomCol}
        dragOverCustomCol={dragOverCustomCol}
        setDragOverCustomCol={setDragOverCustomCol}
        showToast={showToast}
        renderBlockWrapper={renderBlockWrapper}
      />
    </div>
  );
};

export default LegoWorkReportBlocksBody;
