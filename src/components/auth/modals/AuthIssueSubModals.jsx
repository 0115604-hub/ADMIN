import React, { Suspense, lazy } from "react";
import { ImagePreviewModal } from "../../common/ImagePreviewModal";

const TelegramConfigModal = lazy(() =>
  import("../TelegramConfigModal").then((m) => ({ default: m.TelegramConfigModal || m.default }))
);
const IssueLedgerModal = lazy(() =>
  import("../../issues/IssueLedgerModal").then((m) => ({ default: m.IssueLedgerModal || m.default }))
);
const IssueEditModal = lazy(() =>
  import("../../issues/IssueEditModal").then((m) => ({ default: m.IssueEditModal || m.default }))
);
const IssueActionModal = lazy(() =>
  import("../../issues/IssueActionModal").then((m) => ({ default: m.IssueActionModal || m.default }))
);
const DeleteAuthModal = lazy(() =>
  import("../../issues/DeleteAuthModal").then((m) => ({ default: m.DeleteAuthModal || m.default }))
);

/**
 * AuthIssueSubModals
 * Lazy-loads and renders all issue-related dialogs on demand:
 * - IssueLedgerModal (대장 목록)
 * - IssueEditModal (상세 등록 및 수정)
 * - IssueActionModal (간편 조치 및 원문 수정)
 * - DeleteAuthModal (2단계 삭제 인증)
 * - TelegramConfigModal (텔레그램 설정 및 브리핑)
 * - ImagePreviewModal (고화질 사진 라이트박스)
 */
export const AuthIssueSubModals = ({
  // Issue Ledger Modal
  isListModalOpen,
  setIsListModalOpen,
  urgentIssues = [],
  isFirstScreenIssue,
  filteredIssues = [],
  restoreToast,
  setRestoreToast,
  ledgerCategoryTab,
  setLedgerCategoryTab,
  selectedScheduleDate,
  setSelectedScheduleDate,
  issueModalPage,
  setIssueModalPage,
  openIssueScheduleDays = [],
  allQualityAlerts = [],
  allMeetings = [],
  allQualityIssues = [],
  allNotices = [],
  closedQualityAlertCount = 0,
  closedMeetingCount = 0,
  closedQualityIssueCount = 0,
  closedNoticeCount = 0,
  totalClosedCount = 0,
  selectedListItem,
  setSelectedListItem,
  openActionMenuId,
  setOpenActionMenuId,
  handleOpenEditIssue,
  handleExecuteMeetingResult,
  handleExecuteEditContent,
  handleExecuteRestore,
  handleExecuteCancelRestore,
  handleOpenDeleteModal,
  handleOpenNewIssue,

  // Issue Edit Modal
  isIssueModalOpen,
  handleCloseIssueModal,
  editingIssue,
  isIssueDetailMode,
  setIsIssueDetailMode,
  newIssueForm,
  setNewIssueForm,
  allWorkers = [],
  todayDateStr,
  handleSwitchCategory,
  handleSaveNewIssue,
  handleOpenActionModal,
  handleCancelRestore,
  previewImageModal,
  setPreviewImageModal,
  isSavingIssue,
  actionOpinionForm,
  setActionOpinionForm,
  handleModalAddOpinion,
  handleModalDeleteOpinion,
  replyForm,
  setReplyForm,
  isSubmittingReply,
  handleModalAddReply,
  handleModalDeleteReply,
  isProcessingIssueImages,
  handleIssueFiles,
  handleRemoveIssueImage,
  handleOpinionFiles,
  handleRemoveOpinionFile,
  isProcessingActionImages,
  handleNewIssueActionImageFiles,
  handleRemoveNewIssueActionImage,
  handleToggleResolvedStatus,

  // Action Modal
  actionModalData,
  setActionModalData,
  handleCloseActionModal,
  handleSaveActionResult,
  handleSaveIssueEdit,
  handleActionImageFiles,
  handleRemoveActionImage,

  // Delete Modal
  deleteModalData,
  setDeleteModalData,
  handleConfirmDelete,

  // Telegram Modal
  telegramAdminPinModal,
  setTelegramAdminPinModal,
  handleVerifyTelegramAdmin,
  isTelegramModalOpen,
  setIsTelegramModalOpen,
  telegramConfig,
  setTelegramConfig,
  handleSaveTelegramConfig,
  testingTelegram,
  handleTestTelegram,
  sendingClosingBriefing,
  handleSendDailyClosingBriefing,
  closingBriefingToast,
  telegramSavedToast,
  telegramTestResult,
}) => {
  return (
    <>
      {/* 🌟 관리목록 대장 모달 */}
      {isListModalOpen && (
        <Suspense fallback={null}>
          <IssueLedgerModal
            isOpen={isListModalOpen}
            onClose={() => {
              setIsListModalOpen(false);
              setSelectedListItem(null);
            }}
            urgentIssues={isFirstScreenIssue ? urgentIssues.filter(isFirstScreenIssue) : urgentIssues}
            filteredIssues={filteredIssues}
            restoreToast={restoreToast}
            setRestoreToast={setRestoreToast}
            ledgerCategoryTab={ledgerCategoryTab}
            setLedgerCategoryTab={setLedgerCategoryTab}
            selectedScheduleDate={selectedScheduleDate}
            setSelectedScheduleDate={setSelectedScheduleDate}
            issueModalPage={issueModalPage}
            setIssueModalPage={setIssueModalPage}
            openIssueScheduleDays={openIssueScheduleDays}
            allQualityAlerts={allQualityAlerts}
            allMeetings={allMeetings}
            allQualityIssues={allQualityIssues}
            allNotices={allNotices}
            closedQualityAlertCount={closedQualityAlertCount}
            closedMeetingCount={closedMeetingCount}
            closedQualityIssueCount={closedQualityIssueCount}
            closedNoticeCount={closedNoticeCount}
            totalClosedCount={totalClosedCount}
            selectedListItem={selectedListItem}
            openActionMenuId={openActionMenuId}
            setOpenActionMenuId={setOpenActionMenuId}
            onOpenEditIssue={handleOpenEditIssue}
            onExecuteMeetingResult={handleExecuteMeetingResult}
            onExecuteEditContent={handleExecuteEditContent}
            onExecuteRestore={handleExecuteRestore}
            onExecuteCancelRestore={handleExecuteCancelRestore}
            onOpenDeleteModal={handleOpenDeleteModal}
            onOpenNewIssue={handleOpenNewIssue}
          />
        </Suspense>
      )}

      {/* 🌟 신규 등록 및 수정 상세 모달 */}
      {isIssueModalOpen && (
        <Suspense fallback={null}>
          <IssueEditModal
            isOpen={isIssueModalOpen}
            onClose={handleCloseIssueModal}
            editingIssue={editingIssue}
            isIssueDetailMode={isIssueDetailMode}
            setIsIssueDetailMode={setIsIssueDetailMode}
            newIssueForm={newIssueForm}
            setNewIssueForm={setNewIssueForm}
            allWorkers={allWorkers}
            todayDateStr={todayDateStr}
            onSwitchCategory={handleSwitchCategory}
            onSaveNewIssue={handleSaveNewIssue}
            onOpenActionModal={handleOpenActionModal}
            onCancelRestore={handleCancelRestore}
            onOpenDeleteModal={handleOpenDeleteModal}
            onPreviewImage={setPreviewImageModal}
            isSaving={isSavingIssue}
            actionOpinionForm={actionOpinionForm}
            setActionOpinionForm={setActionOpinionForm}
            onModalAddOpinion={handleModalAddOpinion}
            onModalDeleteOpinion={handleModalDeleteOpinion}
            replyForm={replyForm}
            setReplyForm={setReplyForm}
            isSubmittingReply={isSubmittingReply}
            onModalAddReply={handleModalAddReply}
            onModalDeleteReply={handleModalDeleteReply}
            isProcessingIssueImages={isProcessingIssueImages}
            onIssueFiles={handleIssueFiles}
            onIssueImageFiles={handleIssueFiles}
            onRemoveIssueImage={handleRemoveIssueImage}
            onOpinionFiles={handleOpinionFiles}
            onRemoveOpinionFile={handleRemoveOpinionFile}
            isProcessingActionImages={isProcessingActionImages}
            onNewIssueActionImageFiles={handleNewIssueActionImageFiles}
            onRemoveNewIssueActionImage={handleRemoveNewIssueActionImage}
            onToggleResolvedStatus={handleToggleResolvedStatus}
          />
        </Suspense>
      )}

      {/* 🌟 [제1안] 회의결과 / 조치결과 및 원문 수정등록 모달 */}
      {actionModalData?.isOpen && (
        <Suspense fallback={null}>
          <IssueActionModal
            actionModalData={actionModalData}
            setActionModalData={setActionModalData}
            onClose={handleCloseActionModal}
            onSaveActionResult={handleSaveActionResult}
            onSaveIssueEdit={handleSaveIssueEdit}
            onOpenLedger={() => {
              handleCloseActionModal();
              setIsListModalOpen(true);
            }}
            allWorkers={allWorkers}
            isProcessingActionImages={isProcessingActionImages}
            onActionImageFiles={handleActionImageFiles}
            onRemoveActionImage={handleRemoveActionImage}
            onPreviewImage={setPreviewImageModal}
            isSaving={isSavingIssue}
          />
        </Suspense>
      )}

      {/* 🌟 2단계 삭제 인증 모달 */}
      {deleteModalData?.isOpen && (
        <Suspense fallback={null}>
          <DeleteAuthModal
            deleteModalData={deleteModalData}
            setDeleteModalData={setDeleteModalData}
            onConfirmDelete={handleConfirmDelete}
          />
        </Suspense>
      )}

      {/* 🌟 텔레그램 연동 설정 모달 */}
      {Boolean(telegramAdminPinModal?.isOpen || isTelegramModalOpen) && (
        <Suspense fallback={null}>
          <TelegramConfigModal
            telegramAdminPinModal={telegramAdminPinModal}
            setTelegramAdminPinModal={setTelegramAdminPinModal}
            onVerifyTelegramAdmin={handleVerifyTelegramAdmin}
            isTelegramModalOpen={isTelegramModalOpen}
            setIsTelegramModalOpen={setIsTelegramModalOpen}
            telegramConfig={telegramConfig}
            setTelegramConfig={setTelegramConfig}
            onSaveTelegramConfig={handleSaveTelegramConfig}
            testingTelegram={testingTelegram}
            onTestTelegram={handleTestTelegram}
            sendingClosingBriefing={sendingClosingBriefing}
            onSendDailyClosingBriefing={handleSendDailyClosingBriefing}
            closingBriefingToast={closingBriefingToast}
            telegramSavedToast={telegramSavedToast}
            telegramTestResult={telegramTestResult}
          />
        </Suspense>
      )}

      {/* 🌟 고화질 사진 미리보기 Lightbox */}
      {Boolean(previewImageModal) && (
        <ImagePreviewModal
          previewImage={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}
    </>
  );
};

export default AuthIssueSubModals;
