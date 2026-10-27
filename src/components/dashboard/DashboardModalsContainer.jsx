import React, { Suspense, lazy } from "react";
import WorkLogDetailModal from "./modals/WorkLogDetailModal";
import WorkLogEditModal from "./modals/WorkLogEditModal";
import WorkerLogListModal from "./modals/WorkerLogListModal";
import CreateWorkLogModal from "./modals/CreateWorkLogModal";
import CommonScheduleModal from "./modals/CommonScheduleModal";
import DailyPnLModal from "./modals/DailyPnLModal";
import ScheduleDetailModal from "./modals/ScheduleDetailModal";
import SharedReplyModal from "./modals/SharedReplyModal";
import SharedSenderConfirmModal from "./modals/SharedSenderConfirmModal";
import QualityStatusPopupModal from "./modals/QualityStatusPopupModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import CommonScheduleCommentsModal from "./modals/CommonScheduleCommentsModal";
import OvertimeReportDetailModal from "./modals/OvertimeReportDetailModal";
import { isExcludedFromWorkReport } from "../../services/hanulWorkReportService";

// Lazy-loaded modals
const HanulSettlementModal = lazy(() =>
  import("../HanulSettlementModal").then((m) => ({ default: m.HanulSettlementModal || m.default }))
);
const HanulWorkReportModal = lazy(() =>
  import("../HanulWorkReportModal").then((m) => ({ default: m.HanulWorkReportModal || m.default }))
);
const HanulQualityIssueModal = lazy(() =>
  import("../hanul/HanulQualityIssueModal").then((m) => ({ default: m.HanulQualityIssueModal || m.default }))
);
const RecentWorkLogsSummaryModal = lazy(() =>
  import("../RecentWorkLogsSummaryModal").then((m) => ({ default: m.RecentWorkLogsSummaryModal || m.default }))
);
const YuseongWorkReportModal = lazy(() =>
  import("../yuseong/YuseongWorkReportModal").then((m) => ({ default: m.YuseongWorkReportModal || m.default }))
);

export const DashboardModalsContainer = ({
  // 1. WorkLogDetailModal
  selectedLogDetail,
  setSelectedLogDetail,
  handleOpenLogDetail,
  isWorkLogApproved,
  handleOpenEditModal,
  setPreviewImageModal,
  canApproveLog,
  approvalCommentInput,
  setApprovalCommentInput,
  handleRejectLog,
  handleApproveLog,
  currentProfile,
  isAdmin,
  handleDeleteLog,

  // 2. WorkLogEditModal
  editingLog,
  setEditingLog,
  editFormData,
  setEditFormData,
  handleSaveEditedLog,
  editMaintenanceItems,
  handleAddEditMaintenanceItem,
  handleRemoveEditMaintenanceItem,
  handleUpdateEditMaintenanceItem,
  isEditProcessingImages,
  handleEditMaintenanceItemImageFiles,
  handleRemoveEditMaintenanceItemImage,
  handleEditLogImageFiles,
  handleRemoveEditLogImage,

  // 3. WorkerLogListModal
  selectedWorkerForLogs,
  setSelectedWorkerForLogs,
  accessLogs,


  // CreateWorkLogModal
  isModalOpen,
  setIsModalOpen,
  isInjoo,
  isJaeyul,
  isExtrusionWorker,
  isQualityWorker,
  isGeneralManager,
  logout,
  assignedProcess,
  formData,
  setFormData,
  handleSaveLog,
  isSavingLog,
  logSavedToast,
  formatAmount,
  workerFullName,
  workerPlant,
  officialTitle,
  workerDept,
  workerPosition,
  isProcessingImages,
  handleWorkLogImageFiles,
  handleRemoveWorkLogImage,
  previewImageModal,
  selectedMonth,
  currentYearMonth,
  availableMonths,
  DEFAULT_MONTH_LIST,
  parsedResult,
  setParsedResult,
  uploadSuccess,
  setUploadSuccess,
  fileInputRef,
  handleExcelFile,
  handleDrag,
  handleDrop,
  dragActive,
  parsing,
  uploading,
  successMessage,
  handleConfirmExcelUpload,
  maintenanceItems,
  handleAddMaintenanceItem,
  handleRemoveMaintenanceItem,
  handleUpdateMaintenanceItem,
  handleMaintenanceItemImageFiles,
  handleRemoveMaintenanceItemImage,
  qualityFiles,
  setQualityFiles,
  qualityUploadSuccess,
  setQualityUploadSuccess,
  qualityFileInputRef,
  handleQualityFiles,
  handleQualityDrag,
  handleQualityDrop,
  qualityDragActive,
  qualityParsing,
  qualityUploading,
  qualitySuccessMessage,
  handleConfirmQualityUpload,

  // CommonScheduleModal
  commonScheduleModalOpen,
  setCommonScheduleModalOpen,
  commonScheduleForm,
  setCommonScheduleForm,
  commonScheduleSaving,
  handleRegisterCommonSchedule,
  todayDateStr,
  TIME_OPTIONS_30MIN,
  scheduleCounts,
  commonScheduleFilterTab,
  setCommonScheduleFilterTab,
  modalFilteredSchedules,
  handleToggleCompleteCommonSchedule,
  handleDeleteCommonSchedule,
  setSelectedCommonScheduleForComments,

  // DailyPnLModal
  dailyPnLModalOpen,
  setDailyPnLModalOpen,
  selectedPnLChannel,
  setSelectedPnLChannel,
  sendingDailyPnL,
  handleSendDailyPnLTelegram,
  customPnLBriefing,
  setCustomPnLBriefing,
  totalSales,
  totalPurchases,
  salesAchievementPct,
  purchaseAchievementPct,
  prevMonthKey,
  uncompletedCommonSchedules,

  // ScheduleDetailModal
  scheduleDetailModal,
  setScheduleDetailModal,
  myWeeklyCalendarDays,
  annualLeaves,
  handleReactivateLeave,
  handleDeleteLeave,
  handleRequestDismissOrDelete,
  setScheduleSelectedDate,

  // SharedReplyModal
  sharedReplyModalItem,
  setSharedReplyModalItem,
  replySubmitting,
  replyTextInput,
  setReplyTextInput,
  handleSendSharedReply,

  // SharedSenderConfirmModal
  sharedSenderConfirmModalItem,
  setSharedSenderConfirmModalItem,
  confirmSubmitting,
  handleConfirmSenderDismiss,

  // QualityStatusPopupModal
  qualityPopupItem,
  setQualityPopupItem,
  liveQualityDaily,
  handleExportQualityItemExcel,

  // CommonScheduleCommentsModal
  selectedCommonScheduleForComments,
  commonScheduleCommentInput,
  setCommonScheduleCommentInput,
  commonScheduleCommentSubmitting,
  handleAddCommonScheduleComment,
  handleDeleteCommonScheduleComment,

  // OvertimeReportDetailModal
  selectedOvertimeReportForModal,
  setSelectedOvertimeReportForModal,
  getReportWorkersList,
  onNavigateTab,

  // Lazy Modals
  isWorkLogsSummaryModalOpen,
  setIsWorkLogsSummaryModalOpen,
  workLogs,
  handleBatchApproveLogs,
  isHanulSettlementModalOpen,
  setIsHanulSettlementModalOpen,
  getPreviousYearMonth,
  isHanulWorkReportModalOpen,
  setIsHanulWorkReportModalOpen,
  hanulReportProject,
  hanulReportProcess,
  hanulReportEditData,
  isHanulQualityIssueModalOpen,
  setIsHanulQualityIssueModalOpen,
  isYuseongWorkReportModalOpen,
  setIsYuseongWorkReportModalOpen,
  yuseongReportProject,
  yuseongReportEditData
}) => {
  return (
    <>
      {/* 1. 작업일보 상세내용 및 전자결재 모달 */}
      <WorkLogDetailModal
        selectedLogDetail={selectedLogDetail}
        setSelectedLogDetail={setSelectedLogDetail}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={handleOpenEditModal}
        setPreviewImageModal={setPreviewImageModal}
        canApproveLog={canApproveLog}
        approvalCommentInput={approvalCommentInput}
        setApprovalCommentInput={setApprovalCommentInput}
        handleRejectLog={handleRejectLog}
        handleApproveLog={handleApproveLog}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        handleDeleteLog={handleDeleteLog}
      />

      {/* 2. 일일업무일지 내용 수정 모달 */}
      <WorkLogEditModal
        editingLog={editingLog}
        setEditingLog={setEditingLog}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleSaveEditedLog={handleSaveEditedLog}
        editMaintenanceItems={editMaintenanceItems}
        handleAddEditMaintenanceItem={handleAddEditMaintenanceItem}
        handleRemoveEditMaintenanceItem={handleRemoveEditMaintenanceItem}
        handleUpdateEditMaintenanceItem={handleUpdateEditMaintenanceItem}
        isEditProcessingImages={isEditProcessingImages}
        handleEditMaintenanceItemImageFiles={handleEditMaintenanceItemImageFiles}
        setPreviewImageModal={setPreviewImageModal}
        handleRemoveEditMaintenanceItemImage={handleRemoveEditMaintenanceItemImage}
        handleEditLogImageFiles={handleEditLogImageFiles}
        handleRemoveEditLogImage={handleRemoveEditLogImage}
      />

      {/* 3. 작업자별 접속 기록 상세 조회 모달 */}
      <WorkerLogListModal
        selectedWorkerForLogs={selectedWorkerForLogs}
        setSelectedWorkerForLogs={setSelectedWorkerForLogs}
        accessLogs={accessLogs}
      />


      {/* Write Work Log & Upload Modal */}
      <CreateWorkLogModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isInjoo={isInjoo}
        isJaeyul={isJaeyul}
        isExtrusionWorker={isExtrusionWorker}
        isQualityWorker={isQualityWorker}
        isAdmin={isAdmin}
        isGeneralManager={isGeneralManager}
        logout={logout}
        assignedProcess={assignedProcess}
        formData={formData}
        setFormData={setFormData}
        handleSaveLog={handleSaveLog}
        isSavingLog={isSavingLog}
        logSavedToast={logSavedToast}
        formatAmount={formatAmount}
        currentProfile={currentProfile}
        workerFullName={workerFullName}
        workerPlant={workerPlant}
        officialTitle={officialTitle}
        workerDept={workerDept}
        workerPosition={workerPosition}
        isProcessingImages={isProcessingImages}
        handleWorkLogImageFiles={handleWorkLogImageFiles}
        handleRemoveWorkLogImage={handleRemoveWorkLogImage}
        previewImageModal={previewImageModal}
        setPreviewImageModal={setPreviewImageModal}
        selectedMonth={selectedMonth}
        currentYearMonth={currentYearMonth}
        availableMonths={availableMonths}
        DEFAULT_MONTH_LIST={DEFAULT_MONTH_LIST}
        parsedResult={parsedResult}
        setParsedResult={setParsedResult}
        uploadSuccess={uploadSuccess}
        setUploadSuccess={setUploadSuccess}
        fileInputRef={fileInputRef}
        handleExcelFile={handleExcelFile}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        dragActive={dragActive}
        parsing={parsing}
        uploading={uploading}
        successMessage={successMessage}
        handleConfirmExcelUpload={handleConfirmExcelUpload}
        maintenanceItems={maintenanceItems}
        handleAddMaintenanceItem={handleAddMaintenanceItem}
        handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
        handleUpdateMaintenanceItem={handleUpdateMaintenanceItem}
        handleMaintenanceItemImageFiles={handleMaintenanceItemImageFiles}
        handleRemoveMaintenanceItemImage={handleRemoveMaintenanceItemImage}
        qualityFiles={qualityFiles}
        setQualityFiles={setQualityFiles}
        qualityUploadSuccess={qualityUploadSuccess}
        setQualityUploadSuccess={setQualityUploadSuccess}
        qualityFileInputRef={qualityFileInputRef}
        handleQualityFiles={handleQualityFiles}
        handleQualityDrag={handleQualityDrag}
        handleQualityDrop={handleQualityDrop}
        qualityDragActive={qualityDragActive}
        qualityParsing={qualityParsing}
        qualityUploading={qualityUploading}
        qualitySuccessMessage={qualitySuccessMessage}
        handleConfirmQualityUpload={handleConfirmQualityUpload}
      />

      {/* 📌 태형&미영 일정 등록 및 완료 관리 모달 */}
      <CommonScheduleModal
        commonScheduleModalOpen={commonScheduleModalOpen}
        setCommonScheduleModalOpen={setCommonScheduleModalOpen}
        commonScheduleForm={commonScheduleForm}
        setCommonScheduleForm={setCommonScheduleForm}
        commonScheduleSaving={commonScheduleSaving}
        handleRegisterCommonSchedule={handleRegisterCommonSchedule}
        todayDateStr={todayDateStr}
        TIME_OPTIONS_30MIN={TIME_OPTIONS_30MIN}
        scheduleCounts={scheduleCounts}
        commonScheduleFilterTab={commonScheduleFilterTab}
        setCommonScheduleFilterTab={setCommonScheduleFilterTab}
        modalFilteredSchedules={modalFilteredSchedules}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        handleToggleCompleteCommonSchedule={handleToggleCompleteCommonSchedule}
        handleDeleteCommonSchedule={handleDeleteCommonSchedule}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
      />

      {/* 📱 매일 아침 손익결산 브리핑 예시화면 및 텔레그램 발송 모달 */}
      <DailyPnLModal
        dailyPnLModalOpen={dailyPnLModalOpen}
        setDailyPnLModalOpen={setDailyPnLModalOpen}
        selectedPnLChannel={selectedPnLChannel}
        setSelectedPnLChannel={setSelectedPnLChannel}
        sendingDailyPnL={sendingDailyPnL}
        handleSendDailyPnLTelegram={handleSendDailyPnLTelegram}
        customPnLBriefing={customPnLBriefing}
        setCustomPnLBriefing={setCustomPnLBriefing}
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        salesAchievementPct={salesAchievementPct}
        purchaseAchievementPct={purchaseAchievementPct}
        prevMonthKey={prevMonthKey}
        uncompletedCommonSchedules={uncompletedCommonSchedules}
        todayDateStr={todayDateStr}
      />

      {/* 5. 등록 일정 상세 & 회신 목록 팝업 모달 */}
      <ScheduleDetailModal
        scheduleDetailModal={scheduleDetailModal}
        setScheduleDetailModal={setScheduleDetailModal}
        currentProfile={currentProfile}
        workerFullName={workerFullName}
        workerPlant={workerPlant}
        officialTitle={officialTitle}
        myWeeklyCalendarDays={myWeeklyCalendarDays}
        annualLeaves={annualLeaves}
        todayDateStr={todayDateStr}
        handleReactivateLeave={handleReactivateLeave}
        handleDeleteLeave={handleDeleteLeave}
        handleRequestDismissOrDelete={handleRequestDismissOrDelete}
        setScheduleSelectedDate={setScheduleSelectedDate}
        setPreviewImageModal={setPreviewImageModal}
      />

      {/* 6. 받은 작업자: 공유 일정 답장(회신) 전송 모달 */}
      <SharedReplyModal
        sharedReplyModalItem={sharedReplyModalItem}
        setSharedReplyModalItem={setSharedReplyModalItem}
        replySubmitting={replySubmitting}
        replyTextInput={replyTextInput}
        setReplyTextInput={setReplyTextInput}
        handleSendSharedReply={handleSendSharedReply}
      />

      {/* 7. 보낸 작업자: 공유 대상자 회신 확인 및 최종 삭제/완료 모달 */}
      <SharedSenderConfirmModal
        sharedSenderConfirmModalItem={sharedSenderConfirmModalItem}
        setSharedSenderConfirmModalItem={setSharedSenderConfirmModalItem}
        confirmSubmitting={confirmSubmitting}
        handleConfirmSenderDismiss={handleConfirmSenderDismiss}
      />

      {/* 📊 4대 코어 품목별 일일 불량현황 & 일자별 상세 정리본 팝업 모달 */}
      <QualityStatusPopupModal
        qualityPopupItem={qualityPopupItem}
        setQualityPopupItem={setQualityPopupItem}
        liveQualityDaily={liveQualityDaily}
        handleExportQualityItemExcel={handleExportQualityItemExcel}
        selectedMonth={selectedMonth}
      />

      {/* 🌟 고화질 사진 미리보기 Lightbox */}
      {previewImageModal && (
        <ImagePreviewModal
          previewImage={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}

      {/* 💬 공통일정 상세 & 의견(코멘트) 작성 팝업 모달 */}
      <CommonScheduleCommentsModal
        selectedCommonScheduleForComments={selectedCommonScheduleForComments}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        isGeneralManager={isGeneralManager}
        commonScheduleCommentInput={commonScheduleCommentInput}
        setCommonScheduleCommentInput={setCommonScheduleCommentInput}
        commonScheduleCommentSubmitting={commonScheduleCommentSubmitting}
        handleAddCommonScheduleComment={handleAddCommonScheduleComment}
        handleDeleteCommonScheduleComment={handleDeleteCommonScheduleComment}
        handleToggleCompleteCommonSchedule={handleToggleCompleteCommonSchedule}
      />

      {/* ⭐ 팝업창: 특근 근로자 명단 보기 (Read-Only) */}
      <OvertimeReportDetailModal
        selectedOvertimeReportForModal={selectedOvertimeReportForModal}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        getReportWorkersList={getReportWorkersList}
        onNavigateTab={onNavigateTab}
      />

      {/* 🌟 최근일 기준 전작업자 일일 업무일지 종합 요약 팝업 모달 */}
      {isWorkLogsSummaryModalOpen && (
        <Suspense fallback={null}>
          <RecentWorkLogsSummaryModal
            isOpen={isWorkLogsSummaryModalOpen}
            onClose={() => setIsWorkLogsSummaryModalOpen(false)}
            workLogs={workLogs}
            onOpenIndividualLog={(log) => {
              setIsWorkLogsSummaryModalOpen(false);
              handleOpenLogDetail(log);
            }}
            onApproveLog={handleApproveLog}
            onBatchApproveLogs={handleBatchApproveLogs}
            canApproveLog={canApproveLog}
            currentProfile={currentProfile}
            isAdmin={isAdmin}
            onNavigateTab={onNavigateTab}
          />
        </Suspense>
      )}

      {/* 🌟 한울 전월 정산표 및 공통비/지출공제 등록 모달 */}
      {isHanulSettlementModalOpen && (
        <Suspense fallback={null}>
          <HanulSettlementModal
            isOpen={isHanulSettlementModalOpen}
            onClose={() => setIsHanulSettlementModalOpen(false)}
            initialMonth={getPreviousYearMonth(selectedMonth || "2026-09")}
          />
        </Suspense>
      )}

      {/* 🌟 한울 가공/협력업체 작업일보 작성/수정 모달 (9BQC / LQ2a) */}
      {isHanulWorkReportModalOpen && (
        <Suspense fallback={null}>
          <HanulWorkReportModal
            isOpen={isHanulWorkReportModalOpen}
            onClose={() => setIsHanulWorkReportModalOpen(false)}
            initialProject={hanulReportProject}
            initialProcess={hanulReportProcess}
            initialWorker={
              currentProfile?.name && !isExcludedFromWorkReport(currentProfile.name)
                ? currentProfile.name
                : "박종미"
            }
            editReport={hanulReportEditData}
          />
        </Suspense>
      )}

      {/* 🌟 한울 품질경보 등록/관리 모달 */}
      {isHanulQualityIssueModalOpen && (
        <Suspense fallback={null}>
          <HanulQualityIssueModal
            isOpen={isHanulQualityIssueModalOpen}
            onClose={() => setIsHanulQualityIssueModalOpen(false)}
          />
        </Suspense>
      )}

      {/* 🌟 유성 가공/협력업체 작업일보 작성/수정 모달 (JK1 / CE1 / DT) */}
      {isYuseongWorkReportModalOpen && (
        <Suspense fallback={null}>
          <YuseongWorkReportModal
            isOpen={isYuseongWorkReportModalOpen}
            onClose={() => setIsYuseongWorkReportModalOpen(false)}
            initialProject={yuseongReportProject || "JK1"}
            initialWorker={currentProfile?.name || "이성기"}
            editReport={yuseongReportEditData}
          />
        </Suspense>
      )}
    </>
  );
};
