// ============================================================================
// 🚨 긴급 품질/오픈이슈/회의/공지 총괄 서비스 파사드 (Urgent Issue Service Facade)
// ============================================================================

import { INITIAL_URGENT_ISSUES } from "./urgentIssue/urgentIssueConstants.js";
import {
  isMeetingExpired,
  isLegacyDismissedQualityAlert,
  isIssueClosed,
  sanitizeUrgentIssueItem,
  isHanulManagedIssue,
  sortIssuesByLatest,
  sortIssuesByCustomPriority,
  isIssueUpdated
} from "./urgentIssue/urgentIssueStatusHelpers.js";
import {
  getLocalUrgentIssues,
  saveLocalUrgentIssues,
  subscribeUrgentIssues
} from "./urgentIssue/urgentIssueStorage.js";
import { saveUrgentIssue } from "./urgentIssue/urgentIssueSaveService.js";
import {
  addIssueReply,
  deleteIssueReply
} from "./urgentIssue/urgentIssueReplyService.js";
import {
  deleteUrgentIssue as deleteUrgentIssueImpl,
  hardDeleteUrgentIssue as hardDeleteUrgentIssueImpl,
  cancelRestoreUrgentIssue as cancelRestoreUrgentIssueImpl,
  restoreUrgentIssue as restoreUrgentIssueImpl,
  updateUrgentIssueActionResult as updateUrgentIssueActionResultImpl,
  toggleIssueResolved as toggleIssueResolvedImpl
} from "./urgentIssue/urgentIssueLifecycleService.js";

export const deleteUrgentIssue = (id, deleterName = "") =>
  deleteUrgentIssueImpl(id, deleterName);

export const hardDeleteUrgentIssue = (id, deleterName = "") =>
  hardDeleteUrgentIssueImpl(id, deleterName);

export const cancelRestoreUrgentIssue = (id, cancellerName = "복구 취소 (사용자)") =>
  cancelRestoreUrgentIssueImpl(id, cancellerName);

export const restoreUrgentIssue = (id) =>
  restoreUrgentIssueImpl(id);

export const updateUrgentIssueActionResult = (id, actionResult, actionAuthor = "", actionImages = [], fallbackIssue = null) =>
  updateUrgentIssueActionResultImpl(id, actionResult, actionAuthor, actionImages, fallbackIssue);

export const toggleIssueResolved = (id) =>
  toggleIssueResolvedImpl(id);

// Re-export all functions and constants for 100% backward compatibility
export {
  INITIAL_URGENT_ISSUES,
  isMeetingExpired,
  isLegacyDismissedQualityAlert,
  isIssueClosed,
  sanitizeUrgentIssueItem,
  isHanulManagedIssue,
  sortIssuesByLatest,
  sortIssuesByCustomPriority,
  isIssueUpdated,
  getLocalUrgentIssues,
  saveLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  addIssueReply,
  deleteIssueReply
};

export default {
  INITIAL_URGENT_ISSUES,
  isMeetingExpired,
  isLegacyDismissedQualityAlert,
  isIssueClosed,
  sanitizeUrgentIssueItem,
  isHanulManagedIssue,
  sortIssuesByLatest,
  sortIssuesByCustomPriority,
  isIssueUpdated,
  getLocalUrgentIssues,
  saveLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  addIssueReply,
  deleteIssueReply,
  deleteUrgentIssue,
  hardDeleteUrgentIssue,
  cancelRestoreUrgentIssue,
  restoreUrgentIssue,
  updateUrgentIssueActionResult,
  toggleIssueResolved
};
