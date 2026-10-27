import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  sendQualityOpinionTelegram,
  sendOpenIssueReplyTelegram,
  sendMeetingNoticeReplyTelegram
} from "../telegramService";
import { COLLECTION_NAME } from "./urgentIssueConstants.js";
import { sanitizeUrgentIssueItem } from "./urgentIssueStatusHelpers.js";
import { getLocalUrgentIssues } from "./urgentIssueStorage.js";
import { saveUrgentIssue } from "./urgentIssueSaveService.js";

// Add a Reply / Attendance Response (회신란 / 조치결과 등록)
export const addIssueReply = async (issueId, replyData, fallbackIssue = null) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => String(i.id) === String(issueId) || (i._docId && String(i._docId) === String(issueId)) || (i.customId && String(i.customId) === String(issueId))
  );

  if (!target && fallbackIssue) {
    target = fallbackIssue;
  }

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || String(d.data()?.id) === String(issueId)) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in addIssueReply fallback:", e);
    }
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const newReply = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: replyData.author || "작업자",
    authorTitle: replyData.authorTitle || "선임",
    plant: replyData.plant || target.plant || "삼랑진공장",
    attendanceStatus: replyData.attendanceStatus || "확인",
    actionDate: replyData.actionDate || replyData.date || nowStr.slice(0, 10),
    content: replyData.content ? replyData.content.trim() : (replyData.files?.length > 0 ? "파일이 첨부되었습니다." : "조치 완료"),
    files: replyData.files || replyData.images || [],
    createdAt: nowStr
  };

  const updatedReplies = [...(target.replies || []), newReply];
  const isQuality = target.category === "품질경보" || target.category === "부적합경보" || String(target.category || "").includes("경보");

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: newReply.content,
          actionAuthor: newReply.author,
          actionImages: (newReply.files && newReply.files.length > 0) ? newReply.files : (target.actionImages || []),
          actionAt: newReply.actionDate || nowStr,
          status: "RESOLVED",
          isResolved: true,
          // 🔒 관리자가 이미 삭제/종결한 건은 삭제 상태(isDeleted: true)를 온전히 유지하여 첫화면 재공지 방지
          isDeleted: target.isDeleted === true ? true : false,
          isClosedByAdmin: target.isDeleted === true ? true : false,
          isManuallyRestored: target.isDeleted === true ? Boolean(target.isManuallyRestored) : true
        }
      : {})
  };

  const saved = await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });

  // 개별 의견/회신 전용 텔레그램 알림 발송
  try {
    if (target.category === "품질경보" || target.category === "부적합경보") {
      sendQualityOpinionTelegram(target, newReply).catch(() => {});
    } else if (target.category === "오픈이슈" || target.category === "open_issue" || target.category === "품질이슈") {
      sendOpenIssueReplyTelegram(target, newReply).catch(() => {});
    } else if (target.category === "회의일정" || target.category === "공지사항" || target.category === "사내공지" || target.category === "공유사항") {
      sendMeetingNoticeReplyTelegram(target, newReply).catch(() => {});
    }
  } catch (err) {
    console.warn("Telegram reply alert error:", err);
  }

  return saved;
};

// Delete a Reply
export const deleteIssueReply = async (issueId, replyId) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => i.id === issueId || (i._docId && i._docId === issueId) || (i.customId && i.customId === issueId)
  );

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || d.data()?.id === issueId) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in deleteIssueReply fallback:", e);
    }
  }

  if (!target) return null;

  const currentReplies = Array.isArray(target.replies) ? [...target.replies] : [];
  // 🔒 정확히 대상 1개만 식별하여 삭제
  const targetIdx = currentReplies.findIndex(
    (r, idx) => r.id === replyId || String(idx) === String(replyId) || (r.id && String(r.id) === String(replyId))
  );

  let updatedReplies;
  if (targetIdx >= 0) {
    currentReplies.splice(targetIdx, 1);
    updatedReplies = currentReplies;
  } else {
    updatedReplies = currentReplies.filter((r) => r.id !== replyId);
  }

  const isQuality = target.category === "품질경보" || target.category === "부적합경보";
  const lastReply = updatedReplies[updatedReplies.length - 1];

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: lastReply ? lastReply.content : "",
          actionAuthor: lastReply ? lastReply.author : "",
          actionImages: lastReply?.files || [],
          actionAt: lastReply ? lastReply.actionDate || lastReply.createdAt : "",
          isResolved: Boolean(lastReply)
        }
      : {})
  };

  return await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });
};
