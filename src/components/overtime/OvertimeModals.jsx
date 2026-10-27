import React from "react";
import PersonnelCardModal from "../PersonnelCardModal.jsx";
import Absence4MModal from "../Absence4MModal.jsx";
import { OvertimeReportDetailModal } from "./OvertimeReportDetailModal.jsx";
import { OvertimeDeleteWorkerModal } from "./OvertimeDeleteWorkerModal.jsx";
import { KWON_SIGNATURE_BLACK } from "../../assets/kwonSignature";
import { cleanCompanyName } from "../../services/overtimeSmartService.js";
import { getPlantForCompany } from "../../services/overtimeService";
import { approveDocumentStep, checkApprovalPermission } from "../../services/approvalService";
import { getLiveApprovalForReport } from "./overtimeHelpers.jsx";

export const OvertimeModals = ({
  isLegacyModalOpen,
  setIsLegacyModalOpen,
  selectedLegacyReport,
  setSelectedLegacyReport,
  approvalDocs,
  handleDeleteReport,
  currentProfile,
  isAdmin,
  triggerToast,
  handleEditReport,
  isPersonnelModalOpen,
  setIsPersonnelModalOpen,
  selectedPersonnelWorker,
  setSelectedPersonnelWorker,
  selectedPersonnelWorkerIndex,
  handleSavePersonnelCard,
  handleOpenDeleteWorkerModal,
  isAbsence4MModalOpen,
  setIsAbsence4MModalOpen,
  absence4MCompany,
  selectedDay,
  currentYear,
  currentMonthNum,
  effectiveMatrix,
  smartData,
  workerToDelete,
  setWorkerToDelete,
  isDeletingWorker,
  handleConfirmDeleteWorker
}) => {
  return (
    <>
      {/* 📑 MODAL: 특근보고서 상세 및 결재 */}
      <OvertimeReportDetailModal
        isOpen={isLegacyModalOpen}
        onClose={() => {
          setIsLegacyModalOpen(false);
          setSelectedLegacyReport(null);
        }}
        selectedLegacyReport={selectedLegacyReport}
        approvalDocs={approvalDocs}
        cleanCompanyName={cleanCompanyName}
        getPlantForCompany={getPlantForCompany}
        getLiveApprovalForReport={getLiveApprovalForReport}
        KWON_SIGNATURE_BLACK={KWON_SIGNATURE_BLACK}
        handleDeleteReport={handleDeleteReport}
        checkApprovalPermission={checkApprovalPermission}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        approveDocumentStep={approveDocumentStep}
        triggerToast={triggerToast}
        handleEditReport={handleEditReport}
      />

      {/* 🪪 MODAL: 제조현장 인사카드 작성 및 관리 */}
      {isPersonnelModalOpen && selectedPersonnelWorker && (
        <PersonnelCardModal
          isOpen={isPersonnelModalOpen}
          onClose={() => {
            setIsPersonnelModalOpen(false);
            setSelectedPersonnelWorker(null);
          }}
          worker={selectedPersonnelWorker}
          workerIndex={selectedPersonnelWorkerIndex}
          onSave={handleSavePersonnelCard}
          onDelete={handleOpenDeleteWorkerModal}
        />
      )}

      {/* 👥 MODAL: 4M 결근 관리 및 변동점 MAN 연동 */}
      {isAbsence4MModalOpen && (
        <Absence4MModal
          isOpen={isAbsence4MModalOpen}
          onClose={() => setIsAbsence4MModalOpen(false)}
          initialCompany={absence4MCompany}
          selectedDay={selectedDay}
          currentYear={currentYear}
          currentMonth={currentMonthNum}
          attendanceMatrix={effectiveMatrix || smartData.attendanceMatrix || []}
          onSaveSyncWithReports={() => {}}
        />
      )}

      {/* 🗑️ MODAL: 인원 영구 삭제 확인 */}
      <OvertimeDeleteWorkerModal
        workerToDelete={workerToDelete}
        onClose={() => setWorkerToDelete(null)}
        isDeletingWorker={isDeletingWorker}
        handleConfirmDeleteWorker={handleConfirmDeleteWorker}
      />
    </>
  );
};
