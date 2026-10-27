import { createPortal } from "react-dom";
import { useModalHistory } from "../../utils/modalHistory";
import IssueModalHeader from "./editModal/IssueModalHeader";
import IssueDetailView from "./editModal/IssueDetailView";
import IssueCategoryPlantSelector from "./editModal/IssueCategoryPlantSelector";
import OpenIssueFields from "./editModal/OpenIssueFields";
import MeetingScheduleFields from "./editModal/MeetingScheduleFields";
import GeneralIssueFields from "./editModal/GeneralIssueFields";
import IssueActionResultSection from "./editModal/IssueActionResultSection";
import IssueRepliesSection from "./editModal/IssueRepliesSection";
import IssueFormFooter from "./editModal/IssueFormFooter";

export const getIssueOpinionCount = (item) => {
  if (!item) return 0;
  const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
  if (item.category === "품질경보" || item.category === "부적합경보" || item.category === "오픈이슈" || item.category === "품질이슈") {
    return replyCount;
  }
  const hasAction = typeof item.actionResult === "string" && item.actionResult.trim().length > 0;
  return replyCount + (hasAction ? 1 : 0);
};

export const IssueEditModal = ({
  isOpen,
  onClose,
  editingIssue,
  isIssueDetailMode,
  setIsIssueDetailMode,
  newIssueForm,
  setNewIssueForm,
  allWorkers,
  todayDateStr,
  onSwitchCategory,
  onSaveNewIssue,
  onOpenActionModal,
  onPreviewImage,
  actionOpinionForm,
  setActionOpinionForm,
  onModalAddOpinion,
  onModalDeleteOpinion,
  replyForm,
  setReplyForm,
  isSubmittingReply,
  onModalAddReply,
  onModalDeleteReply,
  isProcessingIssueImages,
  onIssueFiles,
  onIssueImageFiles,
  onRemoveIssueImage,
  onOpinionFiles,
  onRemoveOpinionFile,
  isProcessingActionImages,
  onNewIssueActionImageFiles,
  onRemoveNewIssueActionImage,
  onToggleResolvedStatus
}) => {
  useModalHistory(isOpen, onClose, "issueEditModal");

  if (!isOpen || typeof document === "undefined") return null;

  const opinionCount = getIssueOpinionCount(editingIssue || newIssueForm);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-3.5 shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <IssueModalHeader
          newIssueForm={newIssueForm}
          editingIssue={editingIssue}
          opinionCount={opinionCount}
          onClose={onClose}
        />

        {editingIssue && isIssueDetailMode ? (
          <IssueDetailView
            editingIssue={editingIssue}
            newIssueForm={newIssueForm}
            allWorkers={allWorkers}
            todayDateStr={todayDateStr}
            setIsIssueDetailMode={setIsIssueDetailMode}
            onToggleResolvedStatus={onToggleResolvedStatus}
            onOpenActionModal={onOpenActionModal}
            onPreviewImage={onPreviewImage}
            actionOpinionForm={actionOpinionForm}
            setActionOpinionForm={setActionOpinionForm}
            onOpinionFiles={onOpinionFiles}
            onRemoveOpinionFile={onRemoveOpinionFile}
            onModalAddOpinion={onModalAddOpinion}
            onModalDeleteOpinion={onModalDeleteOpinion}
            onClose={onClose}
            opinionCount={opinionCount}
          />
        ) : (
          <form onSubmit={onSaveNewIssue} className="space-y-3.5 text-xs">
            {editingIssue && (
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueDetailMode(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>← 정리된 상세 보기로 돌아가기</span>
                </button>
              </div>
            )}

            <IssueCategoryPlantSelector
              newIssueForm={newIssueForm}
              setNewIssueForm={setNewIssueForm}
              onSwitchCategory={onSwitchCategory}
              allWorkers={allWorkers}
            />

            {newIssueForm.category === "오픈이슈" ? (
              <OpenIssueFields
                newIssueForm={newIssueForm}
                setNewIssueForm={setNewIssueForm}
                editingIssue={editingIssue}
                isProcessingIssueImages={isProcessingIssueImages}
                onIssueFiles={onIssueFiles}
                onIssueImageFiles={onIssueImageFiles}
                onRemoveIssueImage={onRemoveIssueImage}
                onPreviewImage={onPreviewImage}
                todayDateStr={todayDateStr}
                actionOpinionForm={actionOpinionForm}
                setActionOpinionForm={setActionOpinionForm}
                allWorkers={allWorkers}
                onModalAddOpinion={onModalAddOpinion}
                onModalDeleteOpinion={onModalDeleteOpinion}
                onOpinionFiles={onOpinionFiles}
                onRemoveOpinionFile={onRemoveOpinionFile}
              />
            ) : newIssueForm.category === "회의일정" ? (
              <MeetingScheduleFields
                newIssueForm={newIssueForm}
                setNewIssueForm={setNewIssueForm}
                todayDateStr={todayDateStr}
                allWorkers={allWorkers}
                isProcessingIssueImages={isProcessingIssueImages}
                onIssueFiles={onIssueFiles}
                onIssueImageFiles={onIssueImageFiles}
                onRemoveIssueImage={onRemoveIssueImage}
                onPreviewImage={onPreviewImage}
              />
            ) : (
              <GeneralIssueFields
                newIssueForm={newIssueForm}
                setNewIssueForm={setNewIssueForm}
                todayDateStr={todayDateStr}
                isProcessingIssueImages={isProcessingIssueImages}
                onIssueFiles={onIssueFiles}
                onIssueImageFiles={onIssueImageFiles}
                onRemoveIssueImage={onRemoveIssueImage}
                onPreviewImage={onPreviewImage}
              />
            )}

            {newIssueForm.category !== "오픈이슈" && (
              <IssueActionResultSection
                newIssueForm={newIssueForm}
                setNewIssueForm={setNewIssueForm}
                allWorkers={allWorkers}
                isProcessingActionImages={isProcessingActionImages}
                onNewIssueActionImageFiles={onNewIssueActionImageFiles}
                onRemoveNewIssueActionImage={onRemoveNewIssueActionImage}
                onPreviewImage={onPreviewImage}
              />
            )}

            <IssueRepliesSection
              editingIssue={editingIssue}
              newIssueForm={newIssueForm}
              allWorkers={allWorkers}
              replyForm={replyForm}
              setReplyForm={setReplyForm}
              isSubmittingReply={isSubmittingReply}
              onModalAddReply={onModalAddReply}
              onModalDeleteReply={onModalDeleteReply}
            />

            <IssueFormFooter
              onClose={onClose}
              editingIssue={editingIssue}
              newIssueForm={newIssueForm}
            />
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default IssueEditModal;
