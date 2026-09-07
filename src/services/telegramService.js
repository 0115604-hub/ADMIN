import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PLANTS } from "../context/AuthContext";
import { getLocalAnnualLeaves } from "./annualLeaveService";
import { getLocalApprovalDocs } from "./approvalService";
import { getLocalWorkLogs } from "./workLogService";
import { getLocalUrgentIssues } from "./urgentIssueService";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config";
const CONFIG_DOC_PATH = ["system_config", "telegram"];
const BRIEFING_DOC_PATH = ["system_config", "daily_briefing"];
const PNL_BRIEFING_DOC_PATH = ["system_config", "daily_pnl_briefing"];

// Default Configuration (Pre-configured with real bot & group chat)
export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-4186792536", // '오륙 통합방' (일반 현장 단톡방)
  pnlChatId: "-1003939516875", // '경영방' 단톡방
  sendQualityAlerts: true,
  sendActionReports: true,
  sendApprovals: true,
  sendDailyLeaveBriefing: true, // 07:30 일반 모닝브리핑
  sendDailyPnLBriefing: false // 경영정보공유/손익 브리핑 비활성화
};

let cachedConfig = { ...DEFAULT_TELEGRAM_CONFIG };

export const getLocalTelegramConfig = () => {
  try {
    const saved = localStorage.getItem(TELEGRAM_CONFIG_KEY);
    if (saved) {
      cachedConfig = { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(saved) };
      return cachedConfig;
    }
  } catch (e) {
    console.error("Telegram config read error:", e);
  }
  return cachedConfig;
};

export const saveTelegramConfig = async (config) => {
  cachedConfig = { ...DEFAULT_TELEGRAM_CONFIG, ...config };
  try {
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(cachedConfig));
  } catch (e) {
    console.error("Local storage save error for telegram:", e);
  }

  try {
    await setDoc(doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]), cachedConfig, { merge: true });
  } catch (e) {
    console.warn("Firestore save telegram config fallback to local:", e);
  }
  return cachedConfig;
};

export const subscribeTelegramConfig = (onUpdate) => {
  try {
    const docRef = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged = { ...DEFAULT_TELEGRAM_CONFIG, ...data };
          cachedConfig = merged;
          localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } else {
          onUpdate(getLocalTelegramConfig());
        }
      },
      (err) => {
        console.warn("Telegram config Firestore sync warning:", err);
        onUpdate(getLocalTelegramConfig());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeTelegramConfig error:", e);
    onUpdate(getLocalTelegramConfig());
    return () => {};
  }
};

/**
 * Send a custom text message via Telegram Bot API
 */
export const sendTelegramMessage = async (text, customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    console.log("Telegram notification skipped: Bot token or chat ID not configured.");
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error("Telegram API Error:", data);
      return { success: false, error: data.description || "API_ERROR", data };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    console.error("Telegram Network Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a photo with optional caption via Telegram Bot API
 */
export const sendTelegramPhoto = async (photoDataUrl, caption = "", customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;

  try {
    const resBlob = await (await fetch(photoDataUrl)).blob();
    const formData = new FormData();
    formData.append("chat_id", chatId);
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
      formData.append("show_caption_above_media", "true");
    }
    formData.append("photo", resBlob, "photo.jpg");

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.warn("Telegram sendPhoto failed, fallback to text message:", data);
      return { success: false, error: data.description || "API_ERROR", data };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    console.warn("Telegram sendPhoto Network Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Format currency amount into Korean denomination (억, 만원)
 */
export const formatKoreanCurrency = (amount) => {
  if (amount === 0 || !amount) return "0원";
  const abs = Math.abs(amount);
  const eok = Math.floor(abs / 100000000);
  const man = Math.round((abs % 100000000) / 10000);

  let result = "";
  if (eok > 0) {
    result += `${eok}억 `;
  }
  if (man > 0 || eok === 0) {
    result += `${man.toLocaleString("ko-KR")}만원`;
  }
  return amount < 0 ? `-${result.trim()}` : result.trim();
};

/**
 * 1. 품질경보 및 공지사항 등록 즉시 알림 (사진 첨부 지원)
 */
export const sendQualityAlertTelegram = async (issueItem) => {
  const plant = issueItem?.plant || "삼랑진공장";
  const writer = issueItem?.author || issueItem?.writer || "현장작업자";
  const title = issueItem?.title || issueItem?.content || "품질 이슈 발생";
  const content = issueItem?.content && issueItem.content !== issueItem.title ? issueItem.content : "";
  const photoCount = issueItem?.images?.length ? `\n• <b>첨부사진:</b> 현장 사진 ${issueItem.images.length}장 첨부됨` : "";
  const dateStr = issueItem?.date || new Date().toISOString().split("T")[0];
  const timeStr = issueItem?.time || new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const isNotice = issueItem?.category === "공지사항" || issueItem?.category === "공유사항";

  let message = "";
  if (isNotice) {
    message = `
<b>📢 [사내 공지사항] 업무 협조 안내</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>대상:</b> ${plant}
• <b>공지자:</b> <b>${writer}</b>
• <b>공지제목:</b> <b>${title}</b>
${content ? `\n<b>[공지 내용]</b>\n${content}\n` : ""}
• <b>등록일시:</b> ${dateStr} ${timeStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  } else {
    message = `
<b>🟥 [품질경보] 긴급 확인 및 점검 요망</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>공장:</b> ${plant}
• <b>작성자:</b> <b>${writer}</b>
• <b>불량제목:</b> <b>${title}</b>
${content ? `\n<b>[전달 내용]</b>\n${content}\n` : ""}
• <b>발령일시:</b> ${dateStr} ${timeStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  }

  // If photo attached, send photo directly
  if (issueItem?.images && issueItem.images.length > 0 && issueItem.images[0].dataUrl) {
    try {
      const photoRes = await sendTelegramPhoto(issueItem.images[0].dataUrl, message);
      if (photoRes.success) return photoRes;
    } catch (e) {
      console.warn("sendPhoto fallback to sendMessage:", e);
    }
  }

  return await sendTelegramMessage(message);
};

/**
 * 2. 품질경보 조치완료 즉시 알림 (사진 첨부 지원)
 */
export const sendQualityActionTelegram = async (issueItem, actionResult = null) => {
  const plant = issueItem?.plant || "삼랑진공장";
  const title = issueItem?.title || issueItem?.content || "품질경보";
  const author = actionResult?.actionAuthor || issueItem?.actionAuthor || issueItem?.author || "조치담당자";
  const content = actionResult?.actionContent || issueItem?.actionResult || "현장 조치 완료";
  const rate = actionResult?.actionRate || issueItem?.actionRate || 100;
  const actionImages = actionResult?.images || issueItem?.actionImages || [];
  const photoCount = actionImages.length ? `\n• <b>조치사진:</b> 조치 완료 사진 ${actionImages.length}장 첨부됨` : "";
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const message = `
<b>✅ [품질경보 조치완료 보고]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>공장:</b> ${plant}
• <b>대상:</b> <b>${title}</b>
• <b>조치자:</b> <b>${author}</b>

<b>[조치 내용]</b>
${content} (조치율 ${rate}%)

• <b>완료일시:</b> ${nowStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  if (actionImages.length > 0 && actionImages[0].dataUrl) {
    try {
      const photoRes = await sendTelegramPhoto(actionImages[0].dataUrl, message);
      if (photoRes.success) return photoRes;
    } catch (e) {
      console.warn("sendPhoto action fallback to sendMessage:", e);
    }
  }

  return await sendTelegramMessage(message);
};

/**
 * 3. 품질경보 삭제/종결 즉시 알림
 */
export const sendQualityDeleteTelegram = async (deletedIssue, deleterProfile) => {
  const deleterName = typeof deleterProfile === "string"
    ? (deleterProfile || "총괄관리자")
    : (deleterProfile?.name ? `${deleterProfile.name} ${deleterProfile.title || ""}`.trim() : "총괄관리자");
  const isNotice = deletedIssue?.category === "공지사항" || deletedIssue?.category === "공유사항";
  const header = isNotice ? "<b>🗑️ [공지사항 종결/삭제 알림]</b>" : "<b>🗑️ [품질경보 종결/삭제 알림]</b>";
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const message = `
${header}
━━━━━━━━━━━━━━━━━━━━━
• <b>공장:</b> ${deletedIssue?.plant || "삼랑진공장"}
• <b>대상:</b> <b>${deletedIssue?.title || deletedIssue?.content || "품질경보"}</b>
• <b>삭제권한자:</b> <b>${deleterName}</b>
• <b>종결사유:</b> ${deletedIssue?.deleteReason || "정상 생산 및 조치 확인 후 종결 처리"}
• <b>삭제일시:</b> ${nowStr}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 4. 전자결재 기안 상신 즉시 알림
 */
export const sendApprovalDraftTelegram = async (docItem, nextApproverName = "담당 결재자") => {
  const message = `
<b>[전자결재 기안 상신]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>다음 결재자:</b> <b>${nextApproverName}</b>
• <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 5. 전자결재 승인 즉시 알림
 */
export const sendApprovalStepTelegram = async (docItem, approverName, isFinal = false, nextApproverName = null) => {
  const titleHeader = isFinal ? "[전자결재 최종 승인 완료]" : "[전자결재 중간 승인 알림]";
  const nextLine = nextApproverName ? `• <b>다음 결재자:</b> ${nextApproverName}\n` : "";

  const message = `
<b>${titleHeader}</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>승인자:</b> <b>${approverName}</b>
${nextLine}• <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 6. 전자결재 반려 즉시 알림
 */
export const sendApprovalRejectTelegram = async (docItem, rejectorName, reason) => {
  const message = `
<b>[전자결재 반려 알림]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>반려자:</b> <b>${rejectorName}</b>
• <b>반려사유:</b> ${reason || "내용 보완 후 재상신 요망"}
• <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 7. 전자결재 보류 즉시 알림
 */
export const sendApprovalHoldTelegram = async (docItem, holderName, reason) => {
  const message = `
<b>[전자결재 보류 알림]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>보류자:</b> <b>${holderName}</b>
• <b>보류사유:</b> ${reason || "검토 필요"}
• <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 8. 일일업무일지 결재 즉시 알림
 */
export const sendWorkLogApprovedTelegram = async (logItem, approver) => {
  const message = `
<b>[일일업무일지 결재 승인]</b>
----------------------------------------
• <b>공장:</b> ${logItem.plant || "삼랑진공장"}
• <b>작성자:</b> ${logItem.writer} ${logItem.title || ""} (${logItem.process || "생산"})
• <b>결재자:</b> <b>${approver.name || "총괄관리자"} ${approver.title || ""}</b>
• <b>지시사항:</b> ${approver.comment || "확인 및 결재 승인"}
• <b>업무일자:</b> ${logItem.date || ""}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 9. 매일 아침 07:30 통합 모닝 브리핑 (연차 + 미결재 + 품질경보 미삭제) ➜ 오륙 통합방
 */
export const sendDailyMorningBriefingTelegram = async (targetDateStr = null) => {
  const todayStr = targetDateStr || new Date().toISOString().split("T")[0];
  const dateObj = new Date(todayStr + "T00:00:00");
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = daysOfWeek[dateObj.getDay()];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const dateFormatted = `${yyyy}.${mm}.${dd}(${dayName}) 07:30`;

  // 1. 연차 현황
  const leaves = getLocalAnnualLeaves();
  const activeLeaves = leaves.filter((l) => {
    if (!l.startDate) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= todayStr && todayStr <= end;
  });

  let leaveSummary = "없음 (전원 정상 출근)";
  if (activeLeaves.length > 0) {
    const list = activeLeaves.map((l) => {
      const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
      const typeShort = l.leaveType || "연차";
      return `${l.userName} ${l.title || "선임"}(${plantShort}/${typeShort})`;
    });
    leaveSummary = list.join(", ");
  }

  // 2. 미결재 현황 (전자결재 + 업무일지)
  const approvalDocs = getLocalApprovalDocs();
  const pendingDocs = approvalDocs.filter((d) => d.status === "IN_PROGRESS" || d.status === "HOLD");

  const workLogs = getLocalWorkLogs();
  const pendingLogs = workLogs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");

  let approvalSummary = "없음 (전건 결재완료)";
  const totalPending = pendingDocs.length + pendingLogs.length;
  if (totalPending > 0) {
    const docTitles = pendingDocs.map((d) => d.title).filter(Boolean);
    const logTitles = pendingLogs.map((l) => `${l.writer} 업무일지`).filter(Boolean);
    const previewList = [...docTitles, ...logTitles].slice(0, 3);
    const moreText = totalPending > 3 ? ` 외 ${totalPending - 3}건` : "";
    approvalSummary = `총 ${totalPending}건 (${previewList.join(", ")}${moreText})`;
  }

  // 3. 품질경보 미삭제 / 미조치 현황
  const urgentIssues = getLocalUrgentIssues();
  let urgentSummary = "없음 (전건 종결완료)";
  if (urgentIssues.length > 0) {
    const issueTitles = urgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = urgentIssues.length > 2 ? ` 외 ${urgentIssues.length - 2}건` : "";
    urgentSummary = `미조치 ${urgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }

  const message = `
<b>☀️ [오륙 생산관리] 일일 모닝 브리핑</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
<b>[1] 근태 / 휴가 현황</b>
• ${leaveSummary}

<b>[2] 미결재 현황</b>
• ${approvalSummary}

<b>[3] 품질경보 / 공지 현황</b>
• ${urgentSummary}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  const sendResult = await sendTelegramMessage(message);

  if (sendResult.success) {
    try {
      localStorage.setItem("oryuk_last_morning_briefing_sent", todayStr);
      await setDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]), {
        lastSentDate: todayStr,
        sentAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to record morning briefing date:", e);
    }
  }

  return sendResult;
};

// Backward-compatible alias
export const sendDailyLeaveBriefingTelegram = sendDailyMorningBriefingTelegram;

/**
 * 10. [경영정보공유/손익 브리핑 비활성화 처리 - 사용자 요청 반영]
 */
export const sendDailyPnLBriefingTelegram = async () => {
  console.log("PnL/경영정보공유 briefing is disabled by user settings.");
  return { success: false, reason: "DISABLED_BY_USER" };
};

/**
 * Check and Auto-Send Daily 07:30 AM Morning Briefing (General room)
 */
export const checkAndAutoSendDailyMorningBriefing = async () => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || !config.sendDailyLeaveBriefing) {
    return { skipped: true, reason: "DISABLED_IN_CONFIG" };
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const totalMinutes = currentHour * 60 + currentMinute;
  const todayStr = now.toISOString().split("T")[0];

  // Client auto-trigger window: 07:30 AM ~ 07:45 AM only
  // This prevents stale/delayed briefings from triggering hours later when a user opens the browser at noon
  if (totalMinutes < 450 || totalMinutes > 465) {
    return { skipped: true, reason: "OUTSIDE_07_30_WINDOW" };
  }

  // Check if already sent today locally
  const lastLocal = localStorage.getItem("oryuk_last_morning_briefing_sent");
  if (lastLocal === todayStr) {
    return { skipped: true, reason: "ALREADY_SENT_TODAY_LOCAL" };
  }

  try {
    const snap = await getDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]));
    if (snap.exists() && snap.data().lastSentDate === todayStr) {
      localStorage.setItem("oryuk_last_morning_briefing_sent", todayStr);
      return { skipped: true, reason: "ALREADY_SENT_TODAY_CLOUD" };
    }
  } catch (e) {
    console.warn("Morning briefing check cloud read error:", e);
  }

  console.log(`[07:30 Daily Briefing] Auto-sending morning summary for ${todayStr}...`);
  return await sendDailyMorningBriefingTelegram(todayStr);
};

export const checkAndAutoSendDailyLeaveBriefing = checkAndAutoSendDailyMorningBriefing;

/**
 * Check and Auto-Send Daily 07:00 AM P&L Executive Briefing (Disabled)
 */
export const checkAndAutoSendDailyPnLBriefing = async () => {
  return { skipped: true, reason: "DISABLED_BY_USER" };
};

/**
 * Test Connection Function
 */
export const testTelegramConnection = async (token, chatId) => {
  if (!token || !chatId) {
    return { success: false, error: "Bot Token과 Chat ID를 입력해주세요." };
  }

  const testMessage = `
<b>[텔레그램 연동 정상 연결]</b>
----------------------------------------
텔레그램 봇과 정상적으로 연결되었습니다.
발송 대상 알림:

• <b>품질경보:</b> 등록 / 조치 / 종결 실시간 알림
• <b>전자결재:</b> 기안 상신 / 승인 / 반려 / 보류
• <b>모닝브리핑:</b> 매일 07:30 (연차 + 미결재 + 품질경보)
• <b>손익브리핑:</b> 매일 07:00 (월간 손익 결산 리포트)
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
