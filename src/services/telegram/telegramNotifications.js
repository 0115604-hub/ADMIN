import { getLocalTelegramConfig, isDuplicateMessage } from "./telegramConfig";
import {
  sendTelegramMessage,
  sendTelegramMediaGroup,
  dispatchToTelegramRooms
} from "./telegramSender";
import {
  getKSTDateString,
  getKSTTimeString,
  formatYYYYMMDDWithWeekday
} from "../../utils/dateUtils";

/**
 * 1. 품질경보 등록 즉시 알림 (오륙 통합방 단 1회 발송)
 */
export const sendQualityAlertTelegram = async (issueItem, targetChatId = null) => {
  if (issueItem?.category !== "품질경보" && issueItem?.category !== "부적합경보") {
    return { success: true, skipped: true, reason: "NOT_QUALITY_ALERT" };
  }

  // 1회 발송 원칙 중복 차단 가드 (60초 이내 동일 품질경보 중복 발송 방지)
  const alertFingerprint = `quality_alert_${issueItem?.id || ""}_${issueItem?.title || ""}_${issueItem?.createdAt || ""}`;
  if (isDuplicateMessage(alertFingerprint, 60000)) {
    console.log(`[Telegram] 품질/부적합경보 1회 발송 원칙 적용: 중복 발송 차단 (${alertFingerprint})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const plant = issueItem?.plant || "삼랑진공장";
  const writer = issueItem?.author || issueItem?.writer || "현장작업자";
  const title = issueItem?.title || issueItem?.content || "부적합경보";
  const content = issueItem?.content && issueItem.content !== issueItem.title ? issueItem.content : "";
  const images = (issueItem?.images || []).slice(0, 3);
  const photoCount = images.length > 0 ? `\n• <b>첨부사진:</b> 현장 사진 ${images.length}장 첨부됨` : "";
  const dateStr = issueItem?.date || getKSTDateString();
  const timeStr = issueItem?.time || getKSTTimeString();

  const message = `
🚨 <b>[부적합경보 등록] 긴급 확인 및 점검 요망</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>구분:</b> 🚨 부적합경보 신규 등록
• <b>공장:</b> ${plant}
• <b>작성자:</b> <b>${writer}</b>
• <b>불량제목:</b> <b>${title}</b>
${content ? `\n<b>[발생 내용]</b>\n${content}\n` : ""}
• <b>발령일시:</b> ${dateStr} ${timeStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  if (targetChatId) {
    const cfg = { ...getLocalTelegramConfig(), chatId: targetChatId };
    return images.length > 0 ? await sendTelegramMediaGroup(images, message, cfg) : await sendTelegramMessage(message, cfg);
  }
  return await dispatchToTelegramRooms(message, images);
};

/**
 * 2. 품질/부적합경보 조치완료(조치결과) 등록 즉시 알림 (오륙 통합방 단 1회 발송)
 */
export const sendQualityOpinionTelegram = async (issueItem, opinionItem, targetChatId = null) => {
  if (issueItem?.category !== "품질경보" && issueItem?.category !== "부적합경보") {
    return { success: true, skipped: true, reason: "NOT_QUALITY_OPINION" };
  }

  // 1회 발송 원칙 중복 차단 가드 (60초 이내 동일 조치완료 중복 발송 방지)
  const actionFingerprint = `quality_action_${issueItem?.id || ""}_${opinionItem?.id || opinionItem?.createdAt || opinionItem?.content || ""}`;
  if (isDuplicateMessage(actionFingerprint, 60000)) {
    console.log(`[Telegram] 품질/부적합경보 조치완료 1회 발송 원칙 적용: 중복 발송 차단 (${actionFingerprint})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const plant = opinionItem?.plant || issueItem?.plant || "삼랑진공장";
  const writer = opinionItem?.author || opinionItem?.writer || "담당자";
  const writerTitle = opinionItem?.authorTitle ? ` ${opinionItem.authorTitle}` : "";
  const title = issueItem?.title || issueItem?.content || "부적합경보";
  const content = opinionItem?.content || opinionItem?.text || opinionItem?.actionResult || "조치 완료";
  const dateStr = opinionItem?.actionDate || opinionItem?.createdAt?.slice(0, 10) || getKSTDateString();
  const timeStr = opinionItem?.createdAt && opinionItem.createdAt.length > 10 ? opinionItem.createdAt.slice(11, 16) : getKSTTimeString();

  const rawFiles = opinionItem?.files || opinionItem?.images || [];
  const images = rawFiles
    .map((f) => {
      if (typeof f === "string" && (f.startsWith("data:") || f.startsWith("http"))) {
        return { dataUrl: f };
      }
      if (f && f.dataUrl) return f;
      if (f && f.url) return { dataUrl: f.url };
      return null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const photoCount = images.length > 0 ? `\n• <b>첨부사진:</b> 조치 관련 사진 ${images.length}장 첨부됨` : "";

  const message = `
🟢 <b>[부적합경보 조치결과] 조치완료 안내</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>구분:</b> 🟢 부적합경보 조치완료
• <b>공장:</b> ${plant}
• <b>불량제목:</b> <b>${title}</b>
${issueItem?.content && issueItem.content !== title ? `• <b>발생내용:</b> ${issueItem.content}\n` : ""}• <b>조치자:</b> <b>${writer}${writerTitle}</b>

<b>[조치결과 내용]</b>
${content}

• <b>조치일시:</b> ${dateStr} ${timeStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  if (targetChatId) {
    const cfg = { ...getLocalTelegramConfig(), chatId: targetChatId };
    return images.length > 0 ? await sendTelegramMediaGroup(images, message, cfg) : await sendTelegramMessage(message, cfg);
  }
  return await dispatchToTelegramRooms(message, images);
};

/**
 * 2-1. 부적합경보 조치완료 보고 즉시 알림
 */
export const sendQualityActionTelegram = async (issueItem, actionResult = null, targetChatId = null) => {
  if (issueItem?.category !== "품질경보" && issueItem?.category !== "부적합경보") {
    return { success: true, skipped: true, reason: "NOT_QUALITY_ALERT" };
  }
  return await sendQualityOpinionTelegram(issueItem, {
    author: actionResult?.actionAuthor || issueItem?.actionAuthor || "담당자",
    content: actionResult?.actionContent || issueItem?.actionResult || "조치 완료",
    files: actionResult?.images || issueItem?.actionImages || []
  }, targetChatId);
};

/**
 * 2-2. 오픈이슈 등록 / 진행상태 변경 즉시 알림 (오륙 통합방 단 1회 발송)
 */
export const sendOpenIssueAlertTelegram = async (issueItem, actionType = "CREATE", targetChatId = null) => {
  // 1회 발송 원칙 중복 차단 가드 (60초 이내 동일 오픈이슈 상태변경 중복 발송 방지)
  const openFingerprint = `open_issue_${issueItem?.id || ""}_${actionType}_${issueItem?.progress || ""}`;
  if (isDuplicateMessage(openFingerprint, 60000)) {
    console.log(`[Telegram] 오픈이슈 1회 발송 원칙 적용: 중복 발송 차단 (${openFingerprint})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const plant = issueItem?.plant || "삼랑진공장";
  const writer = issueItem?.author || issueItem?.writer || "담당자";
  const writerTitle = issueItem?.authorTitle ? ` ${issueItem.authorTitle}` : "";
  const title = issueItem?.title || issueItem?.content || "오픈이슈";
  const targetDate = issueItem?.expireDate || issueItem?.targetDate || "";
  const targetDateStr = targetDate ? formatYYYYMMDDWithWeekday(targetDate) : "미정";
  const content = issueItem?.content && issueItem.content !== issueItem.title ? issueItem.content : "";
  const dateStr = getKSTDateString();
  const timeStr = getKSTTimeString();

  const isResolve = actionType === "RESOLVE" || issueItem.isResolved;
  const headerTitle = isResolve
    ? "✅ [오픈이슈 해결/종결 완료]"
    : actionType === "UPDATE"
    ? "📌 [오픈이슈 진행상태 변경]"
    : "🚨 [오픈이슈 신규등록]";

  const progressStr = issueItem.progress !== undefined ? `\n• <b>진척도:</b> ${issueItem.progress}%` : "";

  const message = `
<b>${headerTitle}</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>사업장:</b> ${plant}
• <b>이슈제목:</b> <b>${title}</b>
• <b>목표일자:</b> ${targetDateStr}
• <b>담당자:</b> <b>${writer}${writerTitle}</b>${progressStr}
${content ? `\n<b>[상세 내용]</b>\n${content}\n` : ""}
• <b>등록일시:</b> ${dateStr} ${timeStr}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  if (targetChatId) {
    const cfg = { ...getLocalTelegramConfig(), chatId: targetChatId };
    return await sendTelegramMessage(message, cfg);
  }
  return await dispatchToTelegramRooms(message);
};

/**
 * 2-3. 오픈이슈 의견(댓글) 등록 알림 (발송 중지 정책 적용)
 */
export const sendOpenIssueReplyTelegram = async () => {
  console.log("[Telegram 8번 발송중지] 오픈이슈 의견(댓글) 등록 알림은 발송 중지 정책에 따라 비활성화되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 2-4. 회의일정 소집 및 사내공지 등록 즉시 알림 (오륙 통합방 단 1회 발송)
 */
export const sendMeetingNoticeAlertTelegram = async (item, actionType = "CREATE", targetChatId = null) => {
  // 1회 발송 원칙 중복 차단 가드 (60초 이내 동일 회의/공지 등록 중복 발송 방지)
  const noticeFingerprint = `meeting_notice_${item?.id || ""}_${actionType}`;
  if (isDuplicateMessage(noticeFingerprint, 60000)) {
    console.log(`[Telegram] 회의/공지 1회 발송 원칙 적용: 중복 발송 차단 (${noticeFingerprint})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const isMeeting = item.category === "회의일정";
  const plant = item?.plant || "삼랑진공장";
  const writer = item?.author || item?.writer || "주관자";
  const writerTitle = item?.authorTitle ? ` ${item.authorTitle}` : "";
  const title = item?.title || item?.content || (isMeeting ? "회의일정" : "사내공지");
  const content = item?.content && item.content !== item.title ? item.content : "";
  const dateStr = getKSTDateString();
  const timeStr = getKSTTimeString();

  let message = "";
  if (isMeeting) {
    const mDate = item?.expireDate || item?.targetDate || item?.date || "";
    const mTime = item?.meetingTime ? ` ${item.meetingTime}` : "";
    const meetingDateTimeStr = mDate ? `${formatYYYYMMDDWithWeekday(mDate)}${mTime}` : "일정 미정";

    message = `
<b>📢 [회의일정 소집 안내]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>회의일시:</b> <b>${meetingDateTimeStr}</b>
• <b>회의제목:</b> <b>${title}</b>
• <b>사업장/주관:</b> ${plant} / <b>${writer}${writerTitle}</b>
${content ? `\n<b>[회의 안건]</b>\n${content}\n` : ""}
• <b>소집일시:</b> ${dateStr} ${timeStr}
━━━━━━━━━━━━━━━━━━━━━
※ 관련 의견이나 참석 여부는 시스템에서 [의견]을 등록해 주세요.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  } else {
    const expireDate = item?.expireDate || item?.targetDate || "";
    const expireStr = expireDate ? `~${formatYYYYMMDDWithWeekday(expireDate)}` : "";

    message = `
<b>📢 [사내공지 및 공유사항 등록]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>공지제목:</b> <b>${title}</b>
• <b>작성자:</b> <b>${writer}${writerTitle}</b> (${plant})
${expireStr ? `• <b>공지기한:</b> ${expireStr}\n` : ""}
${content ? `\n<b>[공지 내용]</b>\n${content}\n` : ""}
• <b>등록일시:</b> ${dateStr} ${timeStr}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  }

  if (targetChatId) {
    const cfg = { ...getLocalTelegramConfig(), chatId: targetChatId };
    return await sendTelegramMessage(message, cfg);
  }
  return await dispatchToTelegramRooms(message);
};

/**
 * 2-5. 회의/공지 의견 및 회신 알림 (발송 중지 정책 적용)
 */
export const sendMeetingNoticeReplyTelegram = async () => {
  console.log("[Telegram 10번 발송중지] 회의/공지 의견 및 회신 알림은 발송 중지 정책에 따라 비활성화되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

export const sendMeetingReplyTelegram = sendMeetingNoticeReplyTelegram;

/**
 * 4. 품질경보/이슈 종결 및 삭제 알림 (발송 중지 정책 적용)
 */
export const sendQualityDeleteTelegram = async () => {
  console.log("[Telegram 6번 발송중지] 품질경보/이슈 종결 및 삭제 알림은 발송 중지 정책에 따라 비활성화되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 5. 전자결재 기안 상신 즉시 알림 (오륙통합방 정책에 따라 발송 제외)
 */
export const sendApprovalDraftTelegram = async () => {
  console.log("[Telegram] 전자결재 기안 상신 알림은 오륙통합방 정책에 따라 발송 제외되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 6. 전자결재 승인 알림 (오륙통합방 정책에 따라 발송 제외)
 */
export const sendApprovalStepTelegram = async () => {
  console.log("[Telegram] 전자결재 승인 알림은 오륙통합방 정책에 따라 발송 제외되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 7. 전자결재 반려 즉시 알림 (오륙통합방 정책에 따라 발송 제외)
 */
export const sendApprovalRejectTelegram = async () => {
  console.log("[Telegram] 전자결재 반려 알림은 오륙통합방 정책에 따라 발송 제외되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 8. 전자결재 보류 즉시 알림 (오륙통합방 정책에 따라 발송 제외)
 */
export const sendApprovalHoldTelegram = async () => {
  console.log("[Telegram] 전자결재 보류 알림은 오륙통합방 정책에 따라 발송 제외되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};

/**
 * 8-1. 일일업무일지 결재 즉시 알림 (오륙통합방 정책에 따라 발송 제외)
 */
export const sendWorkLogApprovedTelegram = async () => {
  console.log("[Telegram] 일일업무일지 결재 알림은 오륙통합방 정책에 따라 발송 제외되었습니다.");
  return { success: true, skipped: true, reason: "CANCELLED_BY_POLICY" };
};
