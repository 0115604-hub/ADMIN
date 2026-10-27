import React from "react";
import { useMachiningWorkReportTableState } from "./table/useMachiningWorkReportTableState";
import { MachiningTableHeader } from "./table/MachiningTableHeader";
import { MachiningItemKpiCards } from "./table/MachiningItemKpiCards";
import { MachiningIncidentSortingBar } from "./table/MachiningIncidentSortingBar";
import { MachiningTableFilterBar } from "./table/MachiningTableFilterBar";
import { MachiningReportDataTable } from "./table/MachiningReportDataTable";
import { MachiningTemplateAssignmentModal } from "./table/MachiningTemplateAssignmentModal";
import { MachiningOrderModal } from "./table/MachiningOrderModal";
import Step3CapaActionModal from "../quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

export const MachiningWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = "",
  hideCreateButtons = false
}) => {
  const state = useMachiningWorkReportTableState({
    onOpenReportModal,
    currentWorkerName
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {state.assignToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{state.assignToast}</span>
          <button
            type="button"
            onClick={() => state.setAssignToast("")}
            className="cursor-pointer text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 헤더 바 */}
      <MachiningTableHeader
        filteredReportsCount={state.filteredReports.length}
        handleOpenTemplateSetting={state.handleOpenTemplateSetting}
      />

      {/* 2단계 생산공정: 3대 아이템 선택 뱃지 바 & 오더 ↔ 실적 달성률 통합 카드 */}
      <MachiningItemKpiCards
        projectFilter={state.projectFilter}
        setProjectFilter={state.setProjectFilter}
        reportsCount={state.reports.length}
        stats={state.stats}
        hrOrder={state.hrOrder}
        jaOrder={state.jaOrder}
        nx5Order={state.nx5Order}
        hrAttainment={state.hrAttainment}
        jaAttainment={state.jaAttainment}
        nx5Attainment={state.nx5Attainment}
        handleOpenOrderEdit={state.handleOpenOrderEdit}
      />

      {/* 2단계 생산공정: 당일 가공동 비가동 · 부적합 1차 소팅 바 */}
      <MachiningIncidentSortingBar
        incidentStats={state.incidentStats}
        machiningIncidents={state.machiningIncidents}
        handleSortIncident={state.handleSortIncident}
      />

      {/* 필터 및 검색 바 */}
      <MachiningTableFilterBar
        projectFilter={state.projectFilter}
        setProjectFilter={state.setProjectFilter}
        processFilter={state.processFilter}
        setProcessFilter={state.setProcessFilter}
        searchDate={state.searchDate}
        setSearchDate={state.setSearchDate}
        searchWorker={state.searchWorker}
        setSearchWorker={state.setSearchWorker}
        hideCreateButtons={hideCreateButtons}
        currentWorkerName={currentWorkerName}
        onOpenReportModal={onOpenReportModal}
      />

      {/* 실시간 테이블 */}
      <MachiningReportDataTable
        filteredReports={state.filteredReports}
        onOpenReportModal={onOpenReportModal}
        handleDelete={state.handleDelete}
        isDeleting={state.isDeleting}
      />

      {/* 5대 공정 양식 설정 모달 */}
      {state.settingProject && (
        <MachiningTemplateAssignmentModal
          settingProject={state.settingProject}
          setSettingProject={state.setSettingProject}
          settingProcessId={state.settingProcessId}
          settingSubSlot={state.settingSubSlot}
          handleSwitchSettingProject={state.handleSwitchSettingProject}
          handleSwitchSettingProcess={state.handleSwitchSettingProcess}
          draftProcessSlots={state.draftProcessSlots}
          currentSlotTemplateId={state.currentSlotTemplateId}
          currentSlotTemplateObj={state.currentSlotTemplateObj}
          handleClearSlotTemplate={state.handleClearSlotTemplate}
          selectedCategoryFilter={state.selectedCategoryFilter}
          setSelectedCategoryFilter={state.setSelectedCategoryFilter}
          filteredCatalogTemplates={state.filteredCatalogTemplates}
          handleToggleTemplateSelect={state.handleToggleTemplateSelect}
          previewTemplate={state.previewTemplate}
          setPreviewTemplate={state.setPreviewTemplate}
          isSavingAssign={state.isSavingAssign}
          handleSaveProcessSlotAssignment={state.handleSaveProcessSlotAssignment}
        />
      )}

      {/* 2단계 관리자: 생산오더 간편 수정 모달 */}
      {state.orderModalProject && (
        <MachiningOrderModal
          orderModalProject={state.orderModalProject}
          setOrderModalProject={state.setOrderModalProject}
          orderModalInput={state.orderModalInput}
          setOrderModalInput={state.setOrderModalInput}
          handleSaveOrderModal={state.handleSaveOrderModal}
        />
      )}

      {/* ⭐ 4M 시정조치 수정&결재 및 전체취합대장 이관 모달 (이창엽 수정&결재 팝업과 100% 동일) */}
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
          handleSaveProgress={() => state.handleSaveAndTransferToUnifiedLedger(currentWorkerName)}
          handleSubmitToElectronicApproval={() => state.handleSaveAndTransferToUnifiedLedger(currentWorkerName)}
          isSubmittingCapa={state.isSubmittingCapa}
          setPreviewImage={state.setPreviewImage}
          modalTitle="4M 시정조치 수정&결재"
          submitButtonText="전체취합대장 이관 등록"
          saveButtonText="수정"
        />
      )}

      {/* 이미지 라이트박스 미리보기 모달 */}
      {state.previewImage && (
        <ImagePreviewModal
          previewImage={state.previewImage}
          onClose={() => state.setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default MachiningWorkReportTable;
