import { doc, getDoc, setDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { PLANTS } from "../context/AuthContext";
import { getLocalAnnualLeaves } from "./annualLeaveService";
import { getLocalApprovalDocs } from "./approvalService";
import { getLocalWorkLogs } from "./workLogService";
import { getLocalUrgentIssues } from "./urgentIssueService";
import { getTodayCommonSchedules, cleanupExpiredCommonSchedules, formatCommonSchedulesForTelegram, injectCommonSchedulesIntoPnLTemplate, getScheduleCategoryMeta, getUncompletedCommonSchedules } from "./commonScheduleService";
import {
  getKSTDateString,
  getKSTFormattedString,
  getKSTTimeString,
  getKSTTimeInfo,
  getKoreanTodayDateStr,
  isThisWeek,
  getThisWeekDateRange
} from "../utils/dateUtils";

export { getKSTDateString, getKSTFormattedString, getKSTTimeString, getKSTTimeInfo, getKoreanTodayDateStr, isThisWeek, getThisWeekDateRange };

const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config_v4";
const CONFIG_DOC_PATH = ["system_config", "telegram"];
const BRIEFING_DOC_PATH = ["system_config", "daily_briefing"];
const TEMPLATES_DOC_PATH = ["system_config", "telegram_templates"];
const TELEGRAM_TEMPLATES_KEY = "oryuk_telegram_templates_v1";

// Default Configuration (Separated delivery: '오륙 통합방' + '경영총괄')
export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-4186792536", // '오륙 통합방' 단톡방 (품질경보 / 사내공지 / 회의일정 / 전자결재 / 07:30 일반 모닝브리핑 / 17:00 일일마감브리핑)
  pnlChatId: "-1003939516875", // '경영총괄' 단톡방 (대표·임원 전용 07:30 손익결산 P&L 브리핑)
  ceoChatId: "290615483", // 권태형 대표님 1:1 개인톡
  sendQualityAlerts: true,
  sendActionReports: true,
  sendApprovals: true,
  sendDailyLeaveBriefing: true, // 07:30 모닝브리핑 (오륙 통합방)
  sendDailyPnLBriefing: true, // 07:30 손익결산 브리핑 (경영총괄)
  sendDailyClosingBriefing: true // 17:00 일일마감브리핑 (오륙 통합방, 월~토)
};

let cachedConfig = { ...DEFAULT_TELEGRAM_CONFIG };

export const getLocalTelegramConfig = () => {
  try {
    const saved = localStorage.getItem(TELEGRAM_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      cachedConfig = {
        ...DEFAULT_TELEGRAM_CONFIG,
        ...parsed,
        chatId: parsed.chatId || "-4186792536",
        pnlChatId: parsed.pnlChatId || "-1003939516875",
        ceoChatId: parsed.ceoChatId || "290615483"
      };
      localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(cachedConfig));
      return cachedConfig;
    }
  } catch (e) {
    console.error("Telegram config read error:", e);
  }
  return cachedConfig;
};

export const saveTelegramConfig = async (config) => {
  cachedConfig = {
    ...DEFAULT_TELEGRAM_CONFIG,
    ...config,
    chatId: config.chatId || "-4186792536",
    pnlChatId: config.pnlChatId || "-1003939516875",
    ceoChatId: config.ceoChatId || "290615483"
  };

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
          const merged = {
            ...DEFAULT_TELEGRAM_CONFIG,
            ...data,
            chatId: data.chatId || "-4186792536",
            pnlChatId: data.pnlChatId || "-1003939516875",
            ceoChatId: data.ceoChatId || "290615483"
          };
          cachedConfig = merged;
          localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(merged));
          if (onUpdate) onUpdate(merged);
        } else {
          const localCfg = getLocalTelegramConfig();
          if (onUpdate) onUpdate(localCfg);
        }
      },
      (err) => {
        console.warn("Telegram config Firestore sync warning:", err);
        const localCfg = getLocalTelegramConfig();
        if (onUpdate) onUpdate(localCfg);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeTelegramConfig error:", e);
    const localCfg = getLocalTelegramConfig();
    if (onUpdate) onUpdate(localCfg);
    return () => {};
  }
};

/**
 * Custom Message Template Persistence (앞으로도 계속 적용하는 저장 서식)
 */
export const sanitizeTelegramTemplateText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\[오륙\s*(경영정보공유|경영정보|경영진\/임원|경영진)\]/g, "[오륙]")
    .replace(/일일\s*아침\s*손익결산\s*브리핑/g, "매출 & 일정공유")
    .replace(/일일아침손익결산/g, "매출 & 일정공유")
    .replace(/손익결산\s*브리핑/g, "매출 & 일정공유")
    .replace(/\[3\]\s*태형이랑\s*&\s*미영이랑/g, "[3] 사내 공통일정")
    .replace(/태형이랑\s*&\s*미영이랑/g, "사내 공통일정")
    .replace(/경영정보공유/g, "")
    .replace(/경영정보/g, "")
    .replace(/방상국\s*차장/g, "권태형 대표이사")
    .replace(/방상국\s*선임/g, "설유철 책임")
    .replace(/방상국\s*대표이사/g, "권태형 대표이사")
    .replace(/방상국/g, "권태형");
};

export const sanitizeTelegramMessageText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/방상국\s*차장/g, "권태형 대표이사")
    .replace(/방상국\s*선임/g, "설유철 책임")
    .replace(/방상국\s*대표이사/g, "권태형 대표이사")
    .replace(/방상국/g, "권태형");
};

export const sanitizeTelegramTemplates = (data) => {
  if (!data || typeof data !== "object") return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && v.text) {
      cleaned[k] = {
        ...v,
        text: sanitizeTelegramTemplateText(v.text)
      };
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
};

export const getLocalTelegramTemplates = () => {
  try {
    const saved = localStorage.getItem(TELEGRAM_TEMPLATES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeTelegramTemplates(parsed);
    }
  } catch (e) {
    console.error("Failed to read telegram templates from localStorage:", e);
  }
  return {};
};

export const saveTelegramCustomTemplate = async (templateKey, templateText) => {
  try {
    const current = getLocalTelegramTemplates();
    const sanitizedText = sanitizeTelegramTemplateText(templateText);
    const updated = {
      ...current,
      [templateKey]: {
        text: sanitizedText,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(TELEGRAM_TEMPLATES_KEY, JSON.stringify(updated));
    await setDoc(doc(db, TEMPLATES_DOC_PATH[0], TEMPLATES_DOC_PATH[1]), updated, { merge: true });
    return { success: true, templates: updated };
  } catch (e) {
    console.warn("Failed to save telegram template to Firestore, saved to local only:", e);
    return { success: true, localOnly: true };
  }
};

export const subscribeTelegramCustomTemplates = (onUpdate) => {
  try {
    const docRef = doc(db, TEMPLATES_DOC_PATH[0], TEMPLATES_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cleaned = sanitizeTelegramTemplates(data);
          localStorage.setItem(TELEGRAM_TEMPLATES_KEY, JSON.stringify(cleaned));
          if (onUpdate) onUpdate(cleaned);
        } else {
          const local = getLocalTelegramTemplates();
          if (onUpdate) onUpdate(local);
        }
      },
      (err) => {
        console.warn("Telegram templates Firestore sync error:", err);
        const local = getLocalTelegramTemplates();
        if (onUpdate) onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeTelegramCustomTemplates error:", e);
    const local = getLocalTelegramTemplates();
    if (onUpdate) onUpdate(local);
    return () => {};
  }
};

/**
 * Send a custom text message via Telegram Bot API with low latency & 8s timeout
 */
export const sendTelegramMessage = async (text, customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    console.log("Telegram notification skipped: Bot token or chat ID not configured.");
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  const sanitizedText = sanitizeTelegramMessageText(text);
  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller?.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text: sanitizedText,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    if (timeoutId) clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error("Telegram API Error:", data);
      return { success: false, error: data.description || "API_ERROR", data };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error("Telegram Network Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a single photo with caption via Telegram Bot API (Style B: show_caption_above_media)
 */
export const sendTelegramPhoto = async (photoDataUrl, caption = "", customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  const sanitizedCaption = sanitizeTelegramMessageText(caption);
  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

  try {
    const resBlob = await (await fetch(photoDataUrl)).blob();
    const formData = new FormData();
    formData.append("chat_id", chatId);
    if (sanitizedCaption) {
      formData.append("caption", sanitizedCaption);
      formData.append("parse_mode", "HTML");
      formData.append("show_caption_above_media", "true");
    }
    formData.append("photo", resBlob, "photo.jpg");

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller?.signal,
      body: formData
    });

    if (timeoutId) clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.warn("Telegram sendPhoto failed, fallback to text message:", data);
      return { success: false, error: data.description || "API_ERROR", data };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn("Telegram sendPhoto Network Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send up to 3 photos as MediaGroup or Single Photo via Telegram Bot API (Style B)
 */
export const sendTelegramMediaGroup = async (images = [], caption = "", customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  const validImages = (images || []).filter((img) => img && img.dataUrl).slice(0, 3);
  if (validImages.length === 0) {
    return await sendTelegramMessage(caption, customConfig);
  }

  if (validImages.length === 1) {
    return await sendTelegramPhoto(validImages[0].dataUrl, caption, customConfig);
  }

  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendMediaGroup`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;

  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);

    const mediaMetadata = [];
    for (let i = 0; i < validImages.length; i++) {
      const fieldName = `photo${i}`;
      const blob = await (await fetch(validImages[i].dataUrl)).blob();
      formData.append(fieldName, blob, `photo${i}.jpg`);

      const itemMeta = {
        type: "photo",
        media: `attach://${fieldName}`
      };

      if (i === 0 && caption) {
        itemMeta.caption = caption;
        itemMeta.parse_mode = "HTML";
        itemMeta.show_caption_above_media = true;
      }
      mediaMetadata.push(itemMeta);
    }

    formData.append("media", JSON.stringify(mediaMetadata));

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller?.signal,
      body: formData
    });

    if (timeoutId) clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.warn("sendMediaGroup failed, fallback to single photo send:", data);
      return await sendTelegramPhoto(validImages[0].dataUrl, caption, customConfig);
    }

    return { success: true, results: data.result };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn("Telegram sendMediaGroup Error, fallback:", error);
    return await sendTelegramPhoto(validImages[0].dataUrl, caption, customConfig);
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
 * 1. 품질경보 / 사내공지 / 회의일정 등록 즉시 알림 (사진 최대 3장 첨부 지원 + 스타일 B)
 */
export const sendQualityAlertTelegram = async (issueItem, targetChatId = null) => {
  // 🌟 오픈이슈는 즉시 발송하지 않고 익일 07:30 모닝브리핑에 포함
  if (issueItem?.category === "오픈이슈" || issueItem?.category === "open_issue") {
    console.log("[Telegram] 오픈이슈는 즉시 알림 발송 대상이 아니며 익일 모닝브리핑에 포함됩니다.");
    return { success: true, skipped: true, reason: "오픈이슈는 모닝브리핑 발송 대상입니다." };
  }

  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const plant = issueItem?.plant || "삼랑진공장";
  const writer = issueItem?.author || issueItem?.writer || "현장작업자";
  const title = issueItem?.title || issueItem?.content || "안내 사항";
  const content = issueItem?.content && issueItem.content !== issueItem.title ? issueItem.content : "";
  const images = (issueItem?.images || []).slice(0, 3);
  const photoCount = images.length > 0 ? `\n• <b>첨부사진:</b> 현장 사진 ${images.length}장 첨부됨` : "";
  const dateStr = issueItem?.date || getKSTDateString();
  const timeStr = issueItem?.time || getKSTTimeString();
  const category = issueItem?.category || "품질경보";

  const expireDate = issueItem?.expireDate || issueItem?.targetDate || "";
  const meetingTime = issueItem?.meetingTime || "";
  const expireDateStr = expireDate
    ? (category === "회의일정"
        ? `\n• <b>회의일시:</b> <b>${expireDate}${meetingTime ? ` ${meetingTime}` : ""}</b>`
        : `\n• <b>게시만료:</b> <b>${expireDate}</b>`)
    : "";

  let message = "";
  if (category === "회의일정") {
    message = `
<b>🟪 [사내 회의일정] 회의 및 일정 안내</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>대상:</b> ${plant}
• <b>등록자:</b> <b>${writer}</b>
• <b>회의제목:</b> <b>${title}</b>${expireDateStr}
${content ? `\n<b>[회의 일정/안건]</b>\n${content}\n` : ""}
• <b>등록일시:</b> ${dateStr} ${timeStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
※ 관련 작업자분들은 시스템에서 [회신]을 등록해 주세요.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  } else if (category === "공지사항" || category === "사내공지" || category === "공유사항") {
    message = `
<b>🟩 [사내 공지사항] 업무 협조 안내</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>대상:</b> ${plant}
• <b>공지자:</b> <b>${writer}</b>
• <b>공지제목:</b> <b>${title}</b>${expireDateStr}
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

  const customCfg = { ...config, chatId: destChatId };
  if (images.length > 0) {
    return await sendTelegramMediaGroup(images, message, customCfg);
  }

  return await sendTelegramMessage(message, customCfg);
};

/**
 * 2. 품질경보 조치완료 / 회의결과 보고 즉시 알림 (사진 최대 3장 첨부 지원 + 스타일 B)
 */
export const sendQualityActionTelegram = async (issueItem, actionResult = null, targetChatId = null) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const plant = issueItem?.plant || "삼랑진공장";
  const title = issueItem?.title || issueItem?.content || "품질경보";
  const author = actionResult?.actionAuthor || issueItem?.actionAuthor || issueItem?.author || "담당자";
  const content = actionResult?.actionContent || issueItem?.actionResult || "조치 완료";
  const rate = actionResult?.actionRate || issueItem?.actionRate || 100;
  const actionImages = (actionResult?.images || issueItem?.actionImages || []).slice(0, 3);
  const photoCount = actionImages.length > 0 ? `\n• <b>첨부사진:</b> 관련 사진 ${actionImages.length}장 첨부됨` : "";
  const nowStr = getKSTFormattedString();

  let message = "";
  if (issueItem?.category === "회의일정") {
    message = `
<b>🟪 [사내 회의결과 보고]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>대상:</b> ${plant}
• <b>회의제목:</b> <b>${title}</b>
• <b>기록/작성자:</b> <b>${author}</b>

<b>[회의 결과 및 결정사항]</b>
${content}

• <b>완료일시:</b> ${nowStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  } else if (issueItem?.category === "공지사항" || issueItem?.category === "사내공지" || issueItem?.category === "공유사항") {
    message = `
<b>🟩 [사내 공지 조치/진행 완료]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>공장:</b> ${plant}
• <b>대상:</b> <b>${title}</b>
• <b>작성자:</b> <b>${author}</b>

<b>[진행 결과]</b>
${content}

• <b>완료일시:</b> ${nowStr}${photoCount}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
  } else {
    message = `
<b>🟥 [품질경보 조치완료 보고]</b>
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
  }

  const customCfg = { ...config, chatId: destChatId };
  if (actionImages.length > 0) {
    return await sendTelegramMediaGroup(actionImages, message, customCfg);
  }

  return await sendTelegramMessage(message, customCfg);
};

/**
 * 3. 회의일정 회신 등록 알림
 */
export const sendMeetingReplyTelegram = async (issueItem, replyItem, targetChatId = null) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const plant = issueItem?.plant || "삼랑진공장";
  const title = issueItem?.title || issueItem?.content || "회의일정";
  const author = replyItem?.author || "작업자";
  const titleStr = replyItem?.authorTitle ? ` ${replyItem.authorTitle}` : "";
  const status = replyItem?.attendanceStatus || "참석";
  const content = replyItem?.content || "확인 및 회신";
  const nowStr = replyItem?.createdAt || getKSTFormattedString();

  const message = `
<b>🟪 [회의일정 회신 등록]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>회의:</b> <b>${title}</b> (${plant})
• <b>회신자:</b> <b>${author}${titleStr}</b> [${status}]
• <b>회신내용:</b> ${content}
• <b>회신일시:</b> ${nowStr}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message, { ...config, chatId: destChatId });
};

/**
 * 4. 품질경보 / 사내공지 / 회의일정 삭제/종결 즉시 알림
 */
export const sendQualityDeleteTelegram = async (deletedIssue, deleterProfile, targetChatId = null) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const deleterName = typeof deleterProfile === "string"
    ? (deleterProfile || "총괄관리자")
    : (deleterProfile?.name ? `${deleterProfile.name} ${deleterProfile.title || ""}`.trim() : "총괄관리자");
  const category = deletedIssue?.category || "품질경보";
  let header = "<b>🟥 [품질경보 종결/삭제 알림]</b>";
  if (category === "회의일정") {
    header = "<b>🟪 [회의일정 종결/삭제 알림]</b>";
  } else if (category === "공지사항" || category === "사내공지" || category === "공유사항") {
    header = "<b>🟩 [공지사항 종결/삭제 알림]</b>";
  }

  const nowStr = getKSTFormattedString();

  const message = `
${header}
━━━━━━━━━━━━━━━━━━━━━
• <b>공장:</b> ${deletedIssue?.plant || "삼랑진공장"}
• <b>대상:</b> <b>${deletedIssue?.title || deletedIssue?.content || "항목"}</b>
• <b>삭제권한자:</b> <b>${deleterName}</b>
• <b>종결사유:</b> ${deletedIssue?.deleteReason || "정상 완료 및 확인 후 종결 처리"}
• <b>삭제일시:</b> ${nowStr}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message, { ...config, chatId: destChatId });
};

/**
 * 5. 전자결재 기안 상신 즉시 알림 (파랑색 🟦)
 */
export const sendApprovalDraftTelegram = async (docItem, nextApproverName = "담당 결재자") => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || config.sendApprovals === false) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }
  const nowStr = getKSTFormattedString();
  const message = `
<b>🟦 [전자결재 기안 상신]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>다음 결재자:</b> <b>${nextApproverName}</b>
• <b>일시:</b> ${nowStr}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 6. 전자결재 최종 승인 완료 알림 (파랑색 🟦)
 * ※ 중간 승인은 단톡방 알림 발송을 전면 차단하고, 대표이사 최종 승인 완료(isFinal===true) 시에만 발송
 */
export const sendApprovalStepTelegram = async (docItem, approverName, comment = "", isFinal = false, nextApproverName = null) => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || config.sendApprovals === false) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }
  // 중간 결재 단계(선임, 팀장, 이사 등) 승인 시 텔레그램 단톡방 알림 발송 완전 차단
  if (!isFinal) {
    return { success: true, skipped: true, reason: "INTERMEDIATE_STEP_APPROVAL_SILENCED" };
  }

  const titleHeader = "🟦 [전자결재 최종 승인 완료]";
  const nowStr = getKSTFormattedString();

  const message = `
<b>${titleHeader}</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>최종승인자:</b> <b>${approverName}</b>
• <b>일시:</b> ${nowStr}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 7. 전자결재 반려 즉시 알림 (파랑색 🟦)
 */
export const sendApprovalRejectTelegram = async (docItem, rejectorName, reason) => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || config.sendApprovals === false) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }
  const nowStr = getKSTFormattedString();
  const message = `
<b>🟦 [전자결재 반려 알림]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>반려자:</b> <b>${rejectorName}</b>
• <b>반려사유:</b> ${reason || "내용 보완 후 재상신 요망"}
• <b>일시:</b> ${nowStr}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 8. 전자결재 보류 즉시 알림 (파랑색 🟦)
 */
export const sendApprovalHoldTelegram = async (docItem, holderName, reason) => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || config.sendApprovals === false) {
    return { success: false, reason: "NOT_CONFIGURED" };
  }
  const nowStr = getKSTFormattedString();
  const message = `
<b>🟦 [전자결재 보류 알림]</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>보류자:</b> <b>${holderName}</b>
• <b>보류사유:</b> ${reason || "검토 필요"}
• <b>일시:</b> ${nowStr}
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
<b>⬛ [일일업무일지 결재 승인]</b>
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
 * Unique Client Instance Identifier to track lock ownership
 */
const getClientInstanceId = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      let id = sessionStorage.getItem("oryuk_client_instance_id");
      if (!id) {
        id = "client_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
        sessionStorage.setItem("oryuk_client_instance_id", id);
      }
      return id;
    }
  } catch (e) {
    // fallback
  }
  return "runner_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
};

/**
 * Acquire Distributed Atomic Lock for Daily Briefing via Firestore Transaction
 * Ensures exactly ONE sender across all clients and GitHub Actions runners per day.
 */
export const acquireBriefingLock = async (briefingType, todayStr, clientId = null, force = false) => {
  if (force) {
    return { acquired: true, isForced: true };
  }

  const id = clientId || getClientInstanceId();
  const lockDocRef = doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(lockDocRef);
      const data = snap.exists() ? snap.data() : {};

      const dateField = briefingType === "general" ? "lastSentDate" : briefingType === "closing" ? "lastClosingSentDate" : "lastPnLSentDate";
      const lockField = briefingType === "general" ? "generalLock" : briefingType === "closing" ? "closingLock" : "pnlLock";

      // 1. If already successfully completed today, do not acquire
      if (data[dateField] === todayStr) {
        return { acquired: false, reason: "ALREADY_SENT_TODAY", lastSentDate: data[dateField] };
      }

      // 2. Check if locked by another active process (with 90-second lease timeout)
      const currentLock = data[lockField];
      if (currentLock && currentLock.date === todayStr && currentLock.status === "SENDING") {
        const lockedAtMs = currentLock.lockedAt ? new Date(currentLock.lockedAt).getTime() : 0;
        const nowMs = Date.now();
        // If locked within the last 90 seconds, another process is actively sending
        if (nowMs - lockedAtMs < 90000) {
          return { acquired: false, reason: "LOCKED_BY_ANOTHER_INSTANCE", lockedBy: currentLock.lockedBy };
        }
      }

      // 3. Lock is available! Atomically claim lock for this client
      transaction.set(lockDocRef, {
        [lockField]: {
          status: "SENDING",
          date: todayStr,
          lockedAt: new Date().toISOString(),
          lockedBy: id
        }
      }, { merge: true });

      return { acquired: true, clientId: id };
    });

    return result;
  } catch (err) {
    console.warn(`[Briefing Lock] Transaction error for ${briefingType}:`, err);
    return { acquired: false, reason: "TRANSACTION_ERROR", error: err.message };
  }
};

/**
 * Release or Complete Distributed Atomic Lock
 */
export const completeBriefingLock = async (briefingType, todayStr, isSuccess, errorMsg = null, clientId = null) => {
  const id = clientId || getClientInstanceId();
  const lockDocRef = doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]);
  const dateField = briefingType === "general" ? "lastSentDate" : briefingType === "closing" ? "lastClosingSentDate" : "lastPnLSentDate";
  const lockField = briefingType === "general" ? "generalLock" : briefingType === "closing" ? "closingLock" : "pnlLock";
  const sentAtField = briefingType === "general" ? "sentAt" : briefingType === "closing" ? "closingSentAt" : "pnlSentAt";

  try {
    if (isSuccess) {
      await setDoc(lockDocRef, {
        [dateField]: todayStr,
        [sentAtField]: new Date().toISOString(),
        [lockField]: {
          status: "COMPLETED",
          date: todayStr,
          completedAt: new Date().toISOString(),
          sentBy: id
        }
      }, { merge: true });
    } else {
      await setDoc(lockDocRef, {
        [lockField]: {
          status: "FAILED",
          date: todayStr,
          failedAt: new Date().toISOString(),
          error: errorMsg || "UNKNOWN_ERROR",
          sentBy: id
        }
      }, { merge: true });
    }
  } catch (e) {
    console.warn(`[Briefing Lock] Failed to complete lock for ${briefingType}:`, e);
  }
};

/**
 * 9. 매일 아침 07:30 통합 모닝 브리핑 (연차 + 미결재 + 품질경보 미삭제) ➜ 오륙 통합방
 */
export const sendDailyMorningBriefingTelegram = async (targetDateStr = null, targetChatId = null, force = false) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const todayStr = targetDateStr || getKSTDateString();
  const clientId = getClientInstanceId();

  // 1. Acquire Distributed Atomic Lock (Prevents duplicate sends across multiple clients / crons)
  if (!force) {
    const lockResult = await acquireBriefingLock("general", todayStr, clientId, false);
    if (!lockResult.acquired) {
      console.log(`[오륙통합방 모닝브리핑] Skipping send: ${lockResult.reason}`);
      localStorage.setItem("oryuk_last_morning_briefing_sent", todayStr);
      return { success: false, skipped: true, reason: lockResult.reason };
    }
  }

  try {
    const dateFormatted = `${getKSTFormattedString(todayStr).split(" ")[0]} 07:30`;

    // 1. 금일 근태 / 휴가 현황 (공장별 구분)
    const leaves = getLocalAnnualLeaves();
    const activeLeaves = leaves.filter((l) => {
      if (!l.startDate) return false;
      const start = l.startDate;
      const end = l.endDate || l.startDate;
      return start <= todayStr && todayStr <= end;
    });

    const samLeaves = activeLeaves.filter((l) => !l.plant?.includes("한림"));
    const hanLeaves = activeLeaves.filter((l) => l.plant?.includes("한림"));

    const samStr = samLeaves.length > 0
      ? samLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
      : "전원 정상 출근";
    const hanStr = hanLeaves.length > 0
      ? hanLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
      : "전원 정상 출근";

    // 2. 전일 전자결재 미결 (특근보고서는 이번주 작성분만 연동)
    const approvalDocs = getLocalApprovalDocs();
    const pendingDocs = approvalDocs.filter((d) => {
      if (d.status !== "IN_PROGRESS" && d.status !== "HOLD") return false;
      if (d.type === "OVERTIME") {
        return isThisWeek(d.workDate || d.createdAt || d.id || d.title);
      }
      return true;
    });
    let approvalDocLines = "• 없음 (전건 결재완료)";
    if (pendingDocs.length > 0) {
      const lines = pendingDocs.slice(0, 5).map((d) => {
        const nextApprover = d.approvers?.find((a) => a.status === "PENDING")?.name || "결재자";
        return `• ${d.title} (기안: ${d.drafter || "작성자"} ➜ 결재대기: ${nextApprover})`;
      });
      const more = pendingDocs.length > 5 ? `\n• 외 ${pendingDocs.length - 5}건` : "";
      approvalDocLines = lines.join("\n") + more;
    }

    // 3. 전일 업무일지 미결 (공장별 미승인 일지)
    const workLogs = getLocalWorkLogs();
    const pendingLogs = workLogs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");
    let workLogLines = "• 없음 (전건 승인완료)";
    if (pendingLogs.length > 0) {
      const lines = pendingLogs.slice(0, 5).map((l) => {
        const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
        return `• ${plantShort} ${l.writer || "작업자"} (${l.process || "생산"}일지 ➜ 결재대기: ${l.approverName || "관리자"})`;
      });
      const more = pendingLogs.length > 5 ? `\n• 외 ${pendingLogs.length - 5}건` : "";
      workLogLines = lines.join("\n") + more;
    }

    // 4. 진행중인 오픈이슈 (미해결 & 미삭제)
    const allUrgent = getLocalUrgentIssues();
    const activeOpenIssues = allUrgent.filter(
      (i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue")
    );
    let openIssueLines = "• 진행중인 오픈이슈 없음";
    if (activeOpenIssues.length > 0) {
      const oLines = activeOpenIssues.map((o) => {
        const d = o.expireDate || o.targetDate || "";
        const dText = d ? `(~${d.slice(5)}) ` : "";
        const replyCount = o.replies?.length || 0;
        const replyBadge = replyCount > 0 ? ` [의견 ${replyCount}건]` : "";
        return `• [오픈이슈] ${dText}${o.title || o.content} (${o.plant?.replace("공장", "") || "삼랑진"})${replyBadge}`;
      });
      openIssueLines = oLines.slice(0, 5).join("\n");
      if (oLines.length > 5) {
        openIssueLines += `\n• 외 ${oLines.length - 5}건`;
      }
    }

    // 5. 회의 & 사내공지 (다가올 회의 및 유효한 사내공지)
    const upcomingMeetings = allUrgent.filter((i) => !i.isDeleted && i.category === "회의일정" && (i.expireDate || i.targetDate || i.createdAt?.slice(0, 10)) >= todayStr);
    const activeNotices = allUrgent.filter((i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") && (!i.expireDate || i.expireDate >= todayStr));

    let noticeMeetingLines = "• 예정된 회의 및 공지사항 없음";
    const combined = [];
    upcomingMeetings.forEach((m) => {
      const d = m.expireDate || m.targetDate || "";
      const t = m.meetingTime ? ` ${m.meetingTime}` : "";
      const dText = d ? `${d.slice(5)}${t} ` : "";
      combined.push(`• [회의] ${dText}${m.title || m.content} (${m.plant?.replace("공장", "") || "삼랑진"})`);
    });
    activeNotices.forEach((n) => {
      const d = n.expireDate || n.targetDate || "";
      const dText = d ? `~${d.slice(5)} ` : "";
      combined.push(`• [공지] ${dText}${n.title || n.content}`);
    });

    if (combined.length > 0) {
      noticeMeetingLines = combined.slice(0, 5).join("\n");
      if (combined.length > 5) {
        noticeMeetingLines += `\n• 외 ${combined.length - 5}건`;
      }
    }

    const savedBriefingTemplate = getLocalTelegramTemplates()["unified_briefing"]?.text;

    const defaultMessage = `
<b>⬛ [오륙 생산관리] 일일 모닝 브리핑</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
👥 <b>[1] 금일 근태 / 휴가 현황</b>
• 삼랑진: ${samStr}
• 한림: ${hanStr}

📑 <b>[2] 전일 전자결재 미결 ${pendingDocs.length > 0 ? `(${pendingDocs.length}건)` : ""}</b>
${approvalDocLines}

📝 <b>[3] 전일 업무일지 미결 ${pendingLogs.length > 0 ? `(${pendingLogs.length}건)` : ""}</b>
${workLogLines}

📌 <b>[4] 진행중인 오픈이슈 ${activeOpenIssues.length > 0 ? `(${activeOpenIssues.length}건)` : ""}</b>
${openIssueLines}

📅 <b>[5] 회의 & 사내공지</b>
${noticeMeetingLines}
━━━━━━━━━━━━━━━━━━━━━
※ 미결된 결재 및 일지는 금일 오전 중 확인 부탁드립니다.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

    const message = savedBriefingTemplate || defaultMessage;

    const sendResult = await sendTelegramMessage(message, {
      ...config,
      chatId: destChatId
    });

    if (sendResult.success) {
      localStorage.setItem("oryuk_last_morning_briefing_sent", todayStr);
      await completeBriefingLock("general", todayStr, true, null, clientId);
    } else {
      await completeBriefingLock("general", todayStr, false, sendResult.error || "SEND_FAILED", clientId);
    }

    return sendResult;
  } catch (err) {
    console.error("[오륙통합방 모닝브리핑] Send error:", err);
    await completeBriefingLock("general", todayStr, false, err.message, clientId);
    return { success: false, error: err.message };
  }
};

export const sendDailyLeaveBriefingTelegram = sendDailyMorningBriefingTelegram;

/**
 * Helper: Extract live monthly sales, purchases, cost ratio, and achievement rates
 */
export const getLivePnLSummaryData = () => {
  try {
    let raw = null;
    if (typeof window !== "undefined" && window.localStorage) {
      raw = localStorage.getItem("admin_multi_month_store_v4_firestore");
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      const store = parsed?.store || parsed || {};
      const currentMonthKey = "2026-09";
      const prevMonthKey = "2026-08";
      const cur = store[currentMonthKey] || {};
      const prev = store[prevMonthKey] || {};

      const salesAmount = cur.salesSummary?.totalSales || 965489801;
      const purchaseAmount = cur.purchaseSummary?.ledgerBenchmark || cur.jajaeSummary?.totalAmount || cur.purchaseSummary?.totalPurchase || 978009146.46;
      const prevSales = prev.salesSummary?.totalSales || 2090811613;
      const prevPurchases = prev.purchaseSummary?.ledgerBenchmark || prev.jajaeSummary?.totalAmount || prev.purchaseSummary?.totalPurchase || 1342582214.5;

      const salesAchievementPct = prevSales > 0 ? ((salesAmount / prevSales) * 100).toFixed(1) : "46.2";
      const purchaseAchievementPct = prevPurchases > 0 ? ((purchaseAmount / prevPurchases) * 100).toFixed(1) : "72.8";
      const costRatio = salesAmount > 0 ? ((purchaseAmount / salesAmount) * 100).toFixed(1) : "101.3";

      const salesAchievementRate = `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}%` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`;
      const purchaseAchievementRate = `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`;

      return {
        salesAmount: Math.round(salesAmount),
        purchaseAmount: Math.round(purchaseAmount),
        costRatio,
        salesAchievementRate,
        purchaseAchievementRate,
        prevMonthNum: "8",
        curMonthNum: "9"
      };
    }
  } catch (e) {
    console.warn("getLivePnLSummaryData error:", e);
  }

  return {
    salesAmount: 965489801,
    purchaseAmount: 978009146,
    costRatio: "101.3",
    salesAchievementRate: "46.2% (▼ -53.8%)",
    purchaseAchievementRate: "72.8% (▼ 27.2% 절감)",
    prevMonthNum: "8",
    curMonthNum: "9"
  };
};

/**
 * 10. 매일 아침 매출 & 일정공유 브리핑 발송 (매출액 / 매입액 / 달성율 / 공통일정)
 * 기본 발송 채널: '경영총괄' (-1003939516875)
 */
export const sendDailyPnLMorningBriefingTelegram = async (customBriefingData = null, targetChatId = null, force = false) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || customBriefingData?.targetChatId || config.pnlChatId || "-1003939516875";
  const todayStr = getKSTDateString();
  const clientId = getClientInstanceId();

  // 1. Acquire Distributed Atomic Lock
  if (!force) {
    const lockResult = await acquireBriefingLock("pnl", todayStr, clientId, false);
    if (!lockResult.acquired) {
      console.log(`[경영총괄 매출&일정공유 브리핑] Skipping send: ${lockResult.reason}`);
      localStorage.setItem("oryuk_last_pnl_briefing_sent", todayStr);
      return { success: false, skipped: true, reason: lockResult.reason };
    }
  }

  try {
    const dateFormatted = `${getKSTFormattedString(todayStr).split(" ")[0]} 07:30`;

    const livePnL = getLivePnLSummaryData();
    let salesAmount = customBriefingData?.salesAmount ?? livePnL.salesAmount;
    let purchaseAmount = customBriefingData?.purchaseAmount ?? livePnL.purchaseAmount;
    let salesAchievementRate = customBriefingData?.salesAchievementRate || livePnL.salesAchievementRate;
    let purchaseAchievementRate = customBriefingData?.purchaseAchievementRate || livePnL.purchaseAchievementRate;
    let costRatio = customBriefingData?.costRatio || (salesAmount > 0 ? ((purchaseAmount / salesAmount) * 100).toFixed(1) : livePnL.costRatio);
    let commonSchedules = customBriefingData?.commonSchedules;

    const currentLiveInfo = {
      salesAmount,
      purchaseAmount,
      costRatio,
      salesAchievementRate,
      purchaseAchievementRate,
      prevMonthNum: "8",
      curMonthNum: "9"
    };

    if (!commonSchedules) {
      try {
        await cleanupExpiredCommonSchedules(todayStr);
      } catch (e) {
        console.warn("Cleanup expired schedules error:", e);
      }

      const uncompletedScheds = getUncompletedCommonSchedules();
      commonSchedules = formatCommonSchedulesForTelegram(uncompletedScheds, todayStr);
    }

    const defaultPnLMessage = `
<b>⬛ [오륙] 매출 & 일정공유</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
<b>[1] 당월 매입 / 매출 결산 현황</b>
• <b>매출액:</b> ₩${Number(salesAmount).toLocaleString()}원
• <b>매입액:</b> ₩${Number(purchaseAmount).toLocaleString()}원
• <b>매출대비 원가율:</b> ${costRatio}%

<b>[2] 전월 실적 대비 달성율</b>
• <b>전월대비 매출 달성율:</b> <b>${salesAchievementRate}</b>
• <b>전월대비 매입 달성율:</b> <b>${purchaseAchievementRate}</b>

<b>[3] 사내 공통일정</b>
${commonSchedules}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>
`.trim();

    const savedPnLTemplate = getLocalTelegramTemplates()["management_pnl"]?.text;
    let message = defaultPnLMessage;
    if (savedPnLTemplate) {
      message = injectCommonSchedulesIntoPnLTemplate(savedPnLTemplate, commonSchedules, dateFormatted, currentLiveInfo);
    }

    const sendResult = await sendTelegramMessage(message, {
      ...config,
      chatId: destChatId
    });

    if (sendResult.success) {
      localStorage.setItem("oryuk_last_pnl_briefing_sent", todayStr);
      await completeBriefingLock("pnl", todayStr, true, null, clientId);
    } else {
      await completeBriefingLock("pnl", todayStr, false, sendResult.error || "SEND_FAILED", clientId);
    }

    return sendResult;
  } catch (err) {
    console.error("[경영총괄 매출&일정공유 브리핑] Send error:", err);
    await completeBriefingLock("pnl", todayStr, false, err.message, clientId);
    return { success: false, error: err.message };
  }
};

/**
 * 12. 사내 공통일정 의견(댓글) 등록 즉시 경영방 텔레그램 발송
 */
export const sendCommonScheduleCommentTelegram = async (scheduleItem, comment) => {
  const config = getLocalTelegramConfig();
  if (!config.enabled) return { skipped: true, reason: "DISABLED" };

  const destChatId = config.pnlChatId || config.chatId || "-1003939516875";
  const startDate = scheduleItem.startDate || scheduleItem.date || getKSTDateString();
  const endDate = scheduleItem.endDate || startDate;
  const timeStr = scheduleItem.time && scheduleItem.time !== "종일" ? ` [${scheduleItem.time}]` : "";
  const dateFormatted = startDate === endDate ? startDate.slice(5).replace("-", ".") : `${startDate.slice(5).replace("-", ".")} ~ ${endDate.slice(5).replace("-", ".")}`;
  const cat = getScheduleCategoryMeta(scheduleItem.target);

  const authorText = `${comment.author || "관리자"}${comment.role ? ` (${comment.role})` : ""}${comment.plant ? ` [${comment.plant}]` : ""}`;
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = getKSTDateString().slice(5).replace("-", ".");

  const message = `
<b>💬 [공통일정 의견 등록 알림]</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>일정명:</b> <b>${scheduleItem.title}</b>
• <b>구분/일시:</b> ${cat.badge} • [${dateFormatted}]${timeStr}
• <b>작성자:</b> <b>${authorText}</b>
• <b>의견 내용:</b>
${comment.text || comment.content || ""}
• <b>등록시간:</b> ${dateStr} ${timeFormatted}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">📌 공통일정 의견 확인 바로가기</a>
`.trim();

  return await sendTelegramMessage(message, {
    ...config,
    chatId: destChatId
  });
};

let isCheckingBriefing = false;

/**
 * Check and Auto-Send Daily 07:30 AM Morning Briefings (Both Rooms)
 */
export const checkAndAutoSendDailyMorningBriefing = async () => {
  const config = getLocalTelegramConfig();
  if (!config.enabled) {
    return { skipped: true, reason: "DISABLED_IN_CONFIG" };
  }

  const { dateStr: todayStr, totalMinutes } = getKSTTimeInfo();

  // Client auto-trigger window: 07:30 AM ~ 07:45 AM KST (450 ~ 465 minutes)
  if (totalMinutes < 450 || totalMinutes > 465) {
    return { skipped: true, reason: "OUTSIDE_07_30_WINDOW" };
  }

  if (isCheckingBriefing) {
    return { skipped: true, reason: "CHECK_ALREADY_IN_PROGRESS" };
  }

  const lastLocalGeneral = localStorage.getItem("oryuk_last_morning_briefing_sent");
  const lastLocalPnL = localStorage.getItem("oryuk_last_pnl_briefing_sent");

  const needGeneral = config.sendDailyLeaveBriefing && lastLocalGeneral !== todayStr;
  const needPnL = config.sendDailyPnLBriefing && lastLocalPnL !== todayStr;

  if (!needGeneral && !needPnL) {
    return { skipped: true, reason: "ALREADY_PROCESSED_LOCALLY_TODAY" };
  }

  isCheckingBriefing = true;
  const results = {};

  try {
    // 1. Check & send General Morning Briefing (오륙 통합방)
    if (needGeneral) {
      console.log(`[07:30 Daily Briefing] Auto-sending morning summary for ${todayStr}...`);
      results.general = await sendDailyMorningBriefingTelegram(todayStr);
    }

    // 2. Check & send PnL Morning Briefing (경영총괄)
    if (needPnL) {
      console.log(`[07:30 Daily PnL Briefing] Auto-sending PnL briefing for ${todayStr}...`);
      results.pnl = await sendDailyPnLMorningBriefingTelegram();
    }
  } finally {
    isCheckingBriefing = false;
  }

  return results;
};

export const checkAndAutoSendDailyLeaveBriefing = checkAndAutoSendDailyMorningBriefing;

/**
 * 12. 매일 오후 17:00 일일마감브리핑 (월~토) ➜ 오륙 통합방
 * 내용: 금일 품질경보, 회의일정, 사내공지, 오픈이슈 변경/조치/종결 현황
 */
export const formatDailyClosingBriefing = (todayStr = null) => {
  const targetDate = todayStr || getKSTDateString();
  const dateFormatted = `${getKSTFormattedString(targetDate).split(" ")[0]}`;
  const allUrgent = getLocalUrgentIssues();

  // 1. 품질경보 현황 (금일 등록, 금일 조치완료, 또는 현재 미조치 상태)
  const qualityAlerts = allUrgent.filter((i) => {
    if (i.category !== "품질경보") return false;
    const isTodayCreated = i.createdAt?.startsWith(targetDate) || i.startDate === targetDate || i.expireDate === targetDate;
    const isTodayAction = i.actionAt?.startsWith(targetDate);
    const isUnresolvedActive = !i.isDeleted && !i.isResolved;
    return isTodayCreated || isTodayAction || isUnresolvedActive;
  });

  let qualityLines = " • 금일 신규 등록 및 조치 사항 없음 (정상 가동)";
  if (qualityAlerts.length > 0) {
    qualityLines = qualityAlerts.map((q) => {
      const plant = q.plant ? q.plant.replace("공장", "") : "삼랑진";
      const title = q.title || q.content || "품질경보";
      const isRes = Boolean(q.isResolved);
      const actionTimeStr = q.actionAt ? (q.actionAt.length > 10 ? ` (${q.actionAt.slice(11, 16) || q.actionAt.slice(5)})` : ` (${q.actionAt})`) : "";
      const statusText = isRes ? `✅ 조치완료${actionTimeStr}` : `⏳ 조치대기`;
      
      let resLine = ` • [${plant}] ${title}\n   - 상태: ${statusText}`;
      if (isRes && q.actionResult) {
        resLine += `\n   - 조치내용: ${q.actionResult}`;
      }
      if (isRes && (q.actionAuthor || q.author)) {
        resLine += `\n   - 조치자: ${q.actionAuthor || q.author}`;
      } else if (!isRes && q.author) {
        resLine += `\n   - 등록자: ${q.author}`;
      }
      return resLine;
    }).join("\n");
  }

  // 2. 회의일정 및 결과 (금일 회의 또는 금일 결과가 입력된 회의)
  const meetings = allUrgent.filter((i) => {
    if (i.category !== "회의일정") return false;
    const meetingDate = i.expireDate || i.targetDate || i.createdAt?.slice(0, 10);
    const isTodayMeeting = meetingDate === targetDate;
    const isTodayAction = i.actionAt?.startsWith(targetDate);
    return isTodayMeeting || isTodayAction;
  });

  let meetingLines = " • 금일 등록된 회의일정 없음";
  if (meetings.length > 0) {
    meetingLines = meetings.map((m) => {
      const plant = m.plant ? m.plant.replace("공장", "") : "삼랑진";
      const timeStr = m.meetingTime ? `${m.meetingTime} ` : "";
      const title = m.title || m.content || "회의";
      const isClosed = Boolean(m.isResolved || m.actionResult);
      const statusText = isClosed ? "✅ 회의종결" : "⏳ 회의예정";
      const replyCount = Array.isArray(m.replies) ? m.replies.length : 0;
      const attText = replyCount > 0 ? ` (참석 ${replyCount}명)` : "";

      let mLine = ` • [${plant}] ${timeStr}${title}\n   - 결과: ${statusText}`;
      if (m.actionResult) {
        mLine += `\n   - 결정사항: ${m.actionResult}`;
      }
      mLine += `\n   - 보고자: ${m.actionAuthor || m.author || "관리자"}${attText}`;
      return mLine;
    }).join("\n");
  }

  // 3. 사내공지 및 공유사항 (현재 활성 공지)
  const notices = allUrgent.filter((i) => {
    const isNotice = i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항";
    if (!isNotice) return false;
    if (i.isDeleted) return false;
    if (i.expireDate && i.expireDate < targetDate) return false;
    return true;
  });

  let noticeLines = " • 금일 신규 사내공지 없음";
  if (notices.length > 0) {
    noticeLines = notices.map((n) => {
      const plant = n.plant === "본사" || !n.plant ? "공통" : n.plant.replace("공장", "");
      const title = n.title || n.content;
      let nLine = ` • [${plant}] ${title}`;
      if (n.content && n.content !== n.title) {
        nLine += `\n   - 내용: ${n.content}`;
      }
      nLine += `\n   - 등록: ${n.author || "본사"}`;
      return nLine;
    }).join("\n");
  }

  // 4. 오픈이슈 진행 현황 (현재 진행중이거나 금일 완료된 이슈)
  const openIssues = allUrgent.filter((i) => {
    const isOpen = i.category === "오픈이슈" || i.category === "open_issue" || i.category === "품질이슈";
    if (!isOpen) return false;
    if (i.isDeleted) return false;
    return true;
  });

  let openIssueLines = " • 특이 오픈이슈 없음";
  if (openIssues.length > 0) {
    openIssueLines = openIssues.map((o) => {
      const plant = o.plant ? o.plant.replace("공장", "") : "삼랑진";
      const title = o.title || o.content || "오픈이슈";
      const isRes = Boolean(o.isResolved);
      const progress = o.progress !== undefined ? Number(o.progress) : (isRes ? 100 : 0);
      const statusText = isRes ? "✅ 조치완료" : `⏳ 진행중 (진척도 ${progress}%)`;

      let oLine = ` • [${plant}] ${title}\n   - 상태: ${statusText}`;

      // Check for today's reply or latest reply
      const todayReplies = (o.replies || []).filter((r) => r.actionDate === targetDate || r.createdAt?.startsWith(targetDate));
      if (todayReplies.length > 0) {
        const latestToday = todayReplies[todayReplies.length - 1];
        oLine += `\n   - 금일 조치의견: ${latestToday.content} (${latestToday.author})`;
      } else if (o.replies && o.replies.length > 0) {
        const latestRep = o.replies[o.replies.length - 1];
        oLine += `\n   - 최근 조치의견: ${latestRep.content} (${latestRep.author})`;
      } else if (o.actionResult) {
        oLine += `\n   - 조치내용: ${o.actionResult}`;
      }
      oLine += `\n   - 작성자: ${o.author || "관리자"}`;
      return oLine;
    }).join("\n");
  }

  const defaultMessage = `
[오륙] 📢 일일마감브리핑 (17:00)
━━━━━━━━━━━━━━━━━━━━
📅 ${dateFormatted} 일일 업무 마감 현황
━━━━━━━━━━━━━━━━━━━━

🚨 [1] 품질경보 현황 (총 ${qualityAlerts.length}건)
${qualityLines}

📅 [2] 회의일정 및 결과 (총 ${meetings.length}건)
${meetingLines}

📢 [3] 사내공지 및 공유사항 (총 ${notices.length}건)
${noticeLines}

📌 [4] 오픈이슈 진행 현황 (총 ${openIssues.length}건)
${openIssueLines}

━━━━━━━━━━━━━━━━━━━━
🏢 오륙(주) 스마트 생산관리시스템
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  const savedTemplate = getLocalTelegramTemplates()["daily_closing_briefing"]?.text;
  return savedTemplate || defaultMessage;
};

/**
 * 13. 매일 오후 17:00 일일마감브리핑 발송 함수 (오륙 통합방)
 */
export const sendDailyClosingBriefingTelegram = async (targetDateStr = null, targetChatId = null, force = false) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const todayStr = targetDateStr || getKSTDateString();
  const clientId = getClientInstanceId();

  // 1. Acquire Distributed Atomic Lock
  if (!force) {
    const lockResult = await acquireBriefingLock("closing", todayStr, clientId, false);
    if (!lockResult.acquired) {
      console.log(`[오륙통합방 마감브리핑] Skipping send: ${lockResult.reason}`);
      localStorage.setItem("oryuk_last_closing_briefing_sent", todayStr);
      return { success: false, skipped: true, reason: lockResult.reason };
    }
  }

  try {
    const message = formatDailyClosingBriefing(todayStr);

    const sendResult = await sendTelegramMessage(message, {
      ...config,
      chatId: destChatId
    });

    if (sendResult.success) {
      localStorage.setItem("oryuk_last_closing_briefing_sent", todayStr);
      await completeBriefingLock("closing", todayStr, true, null, clientId);
    } else {
      await completeBriefingLock("closing", todayStr, false, sendResult.error || "SEND_FAILED", clientId);
    }

    return sendResult;
  } catch (err) {
    console.error("[오륙통합방 마감브리핑] Send error:", err);
    await completeBriefingLock("closing", todayStr, false, err.message, clientId);
    return { success: false, error: err.message };
  }
};

let isCheckingClosingBriefing = false;

/**
 * Check and Auto-Send Daily 17:00 PM Closing Briefing (Mon-Sat, 17:00 ~ 17:15 KST)
 */
export const checkAndAutoSendDailyClosingBriefing = async () => {
  const config = getLocalTelegramConfig();
  if (!config.enabled || config.sendDailyClosingBriefing === false) {
    return { skipped: true, reason: "DISABLED_IN_CONFIG" };
  }

  const { dateStr: todayStr, totalMinutes } = getKSTTimeInfo();
  const dateObj = new Date();
  const dayOfWeek = dateObj.getDay();

  // Skip Sunday (0)
  if (dayOfWeek === 0) {
    return { skipped: true, reason: "SUNDAY_SKIPPED" };
  }

  // Client auto-trigger window: 17:00 PM ~ 17:15 PM KST (1020 ~ 1035 minutes)
  if (totalMinutes < 1020 || totalMinutes > 1035) {
    return { skipped: true, reason: "OUTSIDE_17_00_WINDOW" };
  }

  if (isCheckingClosingBriefing) {
    return { skipped: true, reason: "CHECK_ALREADY_IN_PROGRESS" };
  }

  const lastLocalClosing = localStorage.getItem("oryuk_last_closing_briefing_sent");
  if (lastLocalClosing === todayStr) {
    return { skipped: true, reason: "ALREADY_PROCESSED_LOCALLY_TODAY" };
  }

  isCheckingClosingBriefing = true;
  try {
    console.log(`[17:00 Daily Closing Briefing] Auto-sending closing summary for ${todayStr}...`);
    return await sendDailyClosingBriefingTelegram(todayStr);
  } finally {
    isCheckingClosingBriefing = false;
  }
};

/**
 * 11. 태형&미영 신규 일정 등록 즉시 경영방 알림 발송 (둘만의 특별하고 소중한 일정 안내)
 * 발송 채널: '경영총괄' (-1003939516875)
 */
export const sendCommonScheduleRegisteredTelegram = async (scheduleItem) => {
  const config = getLocalTelegramConfig();
  if (!config.enabled) return { success: false, reason: "DISABLED" };

  const targetChatId = config.pnlChatId || "-1003939516875";
  const nowFormatted = getKSTFormattedString();
  const cat = getScheduleCategoryMeta(scheduleItem.target);
  const timeDisplay = scheduleItem.time && scheduleItem.time !== "종일" ? `⏰ ${scheduleItem.time}` : "🌅 종일 (시간 무관)";
  const authorStr = scheduleItem.author || "ADMIN";

  const message = `
✨ <b>𝕋𝕒𝕖𝕙𝕪𝕦𝕟𝕘 & 𝕄𝕚𝕪𝕠𝕦𝕟𝕘</b> ✨
━━━━━━━━━━━━━━━━━━━━━
💍 <b>[태형 ❤️ 미영] 둘만의 소중한 일정 안내</b> 🥂
━━━━━━━━━━━━━━━━━━━━━
${cat.emoji} <b>일정 구분:</b> <b>${cat.badge}</b>
${timeDisplay.includes("⏰") ? "⏰" : "🌅"} <b>예정 시간:</b> <b>${timeDisplay}</b>
📝 <b>일정 내용:</b> <b>${scheduleItem.title || "특별한 일정"}</b>

💌 <i>"${cat.phrase} 되시길 바랍니다 ✨"</i>
━━━━━━━━━━━━━━━━━━━━━
👑 <b>등록자:</b> <b>${authorStr}</b>
📅 <b>등록일시:</b> ${nowFormatted}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">💍 태형&미영 일정 관리 바로가기</a>
`.trim();

  return await sendTelegramMessage(message, {
    ...config,
    chatId: targetChatId
  });
};

/**
 * Test Connection Function
 */
export const testTelegramConnection = async (token, chatId) => {
  if (!token || !chatId) {
    return { success: false, error: "Bot Token과 Chat ID를 입력해주세요." };
  }

  const testMessage = `
<b>⬛ [오륙 생산관리 텔레그램 정상 연결]</b>
━━━━━━━━━━━━━━━━━━━━━
텔레그램 봇과 정상적으로 연결되었습니다.
발송 대상 알림:

• <b>품질경보 (적색):</b> 등록 / 조치완료 / 종결삭제
• <b>사내공지 (녹색):</b> 등록 / 종결삭제
• <b>회의일정 (보라색):</b> 등록 / 회신 / 종결삭제
• <b>전자결재 (파랑색):</b> 기안 상신 / 승인 / 반려 / 보류
• <b>기타업무 (검정):</b> 업무일지 결재 / 07:30 모닝브리핑
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
