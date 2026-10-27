import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  sendQualityAlertTelegram,
  sendQualityActionTelegram,
  sendOpenIssueAlertTelegram,
  sendMeetingNoticeAlertTelegram
} from "../telegramService";
import { sanitizeForFirestore } from "../../utils/firestoreUtils";
import { COLLECTION_NAME, todayDateStrFallback } from "./urgentIssueConstants.js";
import { sortIssuesByCustomPriority } from "./urgentIssueStatusHelpers.js";
import { getLocalUrgentIssues, saveLocalUrgentIssues } from "./urgentIssueStorage.js";

// Add or update an urgent issue
export const saveUrgentIssue = async (issueData, options = {}) => {
  const current = getLocalUrgentIssues();
  const id = issueData.id || issueData._docId || issueData.customId || `issue_${Date.now()}`;
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const existingIdx = current.findIndex(
    (i) => String(i.id) === String(id) || (i._docId && String(i._docId) === String(id)) || (i.customId && String(i.customId) === String(id))
  );

  const fullItem = {
    ...issueData,
    id,
    _docId: id,
    category: issueData.category || "오픈이슈",
    plant: issueData.plant || "삼랑진공장",
    author: issueData.author || "",
    authorTitle: issueData.authorTitle || "",
    title: issueData.title || "",
    content: issueData.content || "",
    startDate: issueData.startDate || issueData.expireDate || todayDateStrFallback(),
    expireDate: issueData.expireDate || issueData.targetDate || todayDateStrFallback(),
    targetDate: issueData.targetDate || issueData.expireDate || todayDateStrFallback(),
    meetingTime: issueData.meetingTime || "",
    images: Array.isArray(issueData.images) ? issueData.images : [],
    actionImages: Array.isArray(issueData.actionImages) ? issueData.actionImages : [],
    actionResult: issueData.actionResult || "",
    actionAuthor: issueData.actionAuthor || "",
    actionAt: issueData.actionAt || "",
    replies: Array.isArray(issueData.replies) ? issueData.replies : [],
    isResolved: issueData.isResolved !== undefined ? Boolean(issueData.isResolved) : Boolean((issueData.actionResult && issueData.actionResult.trim()) || (Array.isArray(issueData.actionImages) && issueData.actionImages.length > 0)),
    isDeleted: Boolean(issueData.isDeleted === true),
    isClosedByAdmin: issueData.isClosedByAdmin !== undefined ? Boolean(issueData.isClosedByAdmin) : Boolean(issueData.isDeleted === true),
    isManuallyRestored: issueData.isManuallyRestored !== undefined ? Boolean(issueData.isManuallyRestored) : Boolean(existingIdx >= 0 && current[existingIdx]?.isManuallyRestored),
    deletedAt: issueData.deletedAt || "",
    deletedBy: issueData.deletedBy || "",
    createdAt: issueData.createdAt || nowStr,
    updatedAt: (!options.isNew || existingIdx >= 0) ? nowStr : (issueData.updatedAt || "")
  };

  // Strip any undefined keys so Firestore setDoc does not throw
  Object.keys(fullItem).forEach((key) => {
    if (fullItem[key] === undefined) {
      delete fullItem[key];
    }
  });

  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

  try {
    const payload = sanitizeForFirestore(fullItem);
    await setDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (e) {
    console.warn("Firestore save urgent issue fallback to local:", e);
  }

  // 🔒 텔레그램 발송 가드: skipTelegram인 경우 완전 생략
  const skipTelegram = Boolean(options.skipTelegram);
  // 신규 등록(CREATE)은 options.isNew === true 이거나 기존 목록에 없는 신규 항목인 경우 발송
  const isTrulyNew = !skipTelegram && (
    options.isNew === true ||
    existingIdx < 0
  );

  if (!fullItem.isDeleted && !skipTelegram) {
    if (isTrulyNew) {
      // 1. 신규 등록 즉시 알림 (오직 신규 생성 시에만 발송)
      if (fullItem.category === "품질경보" || fullItem.category === "부적합경보") {
        sendQualityAlertTelegram(fullItem).catch((err) => {
          console.warn("Telegram alert error:", err);
        });
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        sendOpenIssueAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram open issue alert error:", err);
        });
      } else if (fullItem.category === "회의일정" || fullItem.category === "공지사항" || fullItem.category === "사내공지" || fullItem.category === "공유사항") {
        sendMeetingNoticeAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram meeting/notice alert error:", err);
        });
      }
    } else if (existingIdx >= 0 && !options.isNew) {
      // 2. 기존 항목 수정 / 상태 변경 / 조치완료 시 알림
      const prevItem = current[existingIdx];
      const isNewlyResolved = !prevItem?.isResolved && fullItem.isResolved;
      const progressChanged = prevItem?.progress !== undefined && fullItem.progress !== undefined && prevItem.progress !== fullItem.progress;
      const actionResultAdded = !prevItem?.actionResult && Boolean(fullItem.actionResult?.trim());

      if (fullItem.category === "품질경보" || fullItem.category === "부적합경보") {
        const actionResultChanged = Boolean(fullItem.actionResult?.trim()) && fullItem.actionResult !== prevItem?.actionResult;
        if (isNewlyResolved || actionResultAdded || actionResultChanged) {
          const actionImgs = (Array.isArray(fullItem.actionImages) && fullItem.actionImages.length > 0)
            ? fullItem.actionImages
            : (fullItem.replies?.[fullItem.replies.length - 1]?.files || []);

          sendQualityActionTelegram(fullItem, {
            actionAuthor: fullItem.actionAuthor || fullItem.author,
            actionContent: fullItem.actionResult,
            images: actionImgs
          }).catch((err) => {
            console.warn("Telegram quality action error:", err);
          });
        }
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        if (isNewlyResolved) {
          sendOpenIssueAlertTelegram(fullItem, "RESOLVE").catch((err) => {
            console.warn("Telegram open issue resolve alert error:", err);
          });
        } else if (progressChanged || actionResultAdded) {
          sendOpenIssueAlertTelegram(fullItem, "UPDATE").catch((err) => {
            console.warn("Telegram open issue update alert error:", err);
          });
        }
      }
    }
  }

  return fullItem;
};
