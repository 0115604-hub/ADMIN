import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PLANTS } from "../context/AuthContext";
import { getLocalAnnualLeaves } from "./annualLeaveService";
import { getLocalApprovalDocs } from "./approvalService";
import { getLocalWorkLogs } from "./workLogService";
import { getLocalUrgentIssues } from "./urgentIssueService";
import { getTodayCommonSchedules, cleanupExpiredCommonSchedules } from "./commonScheduleService";
import {
  getKSTDateString,
  getKSTFormattedString,
  getKSTTimeString,
  getKSTTimeInfo,
  getKoreanTodayDateStr
} from "../utils/dateUtils";

export { getKSTDateString, getKSTFormattedString, getKSTTimeString, getKSTTimeInfo, getKoreanTodayDateStr };

const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config_v4";
const CONFIG_DOC_PATH = ["system_config", "telegram"];
const BRIEFING_DOC_PATH = ["system_config", "daily_briefing"];
const TEMPLATES_DOC_PATH = ["system_config", "telegram_templates"];
const TELEGRAM_TEMPLATES_KEY = "oryuk_telegram_templates_v1";

// Default Configuration (Separated delivery: '오륙 통합방' + '경영총괄')
export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-4186792536", // '오륙 통합방' 단톡방 (품질경보 / 사내공지 / 회의일정 / 전자결재 / 07:30 일반 모닝브리핑)
  pnlChatId: "-1003939516875", // '경영총괄' 단톡방 (대표·임원 전용 07:30 손익결산 P&L 브리핑)
  ceoChatId: "290615483", // 권태형 대표님 1:1 개인톡
  sendQualityAlerts: true,
  sendActionReports: true,
  sendApprovals: true,
  sendDailyLeaveBriefing: true, // 07:30 모닝브리핑 (오륙 통합방)
  sendDailyPnLBriefing: true // 07:30 손익결산 브리핑 (경영총괄)
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
    .replace(/경영정보공유/g, "")
    .replace(/경영정보/g, "");
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
        text: text,
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

  const token = config.botToken.trim();
  const chatId = String(config.chatId).trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

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

  let message = "";
  if (category === "회의일정") {
    message = `
<b>🟪 [사내 회의일정] 회의 및 일정 안내</b>
━━━━━━━━━━━━━━━━━━━━━
• <b>대상:</b> ${plant}
• <b>등록자:</b> <b>${writer}</b>
• <b>회의제목:</b> <b>${title}</b>
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
 * 6. 전자결재 승인 즉시 알림 (파랑색 🟦)
 */
export const sendApprovalStepTelegram = async (docItem, approverName, comment = "", isFinal = false, nextApproverName = null) => {
  const titleHeader = isFinal ? "🟦 [전자결재 최종 승인 완료]" : "🟦 [전자결재 중간 승인 알림]";
  const nextLine = nextApproverName ? `• <b>다음 결재자:</b> ${nextApproverName}\n` : "";
  const nowStr = getKSTFormattedString();

  const message = `
<b>${titleHeader}</b>
----------------------------------------
• <b>공장:</b> ${docItem.plant || "삼랑진공장"}
• <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
• <b>결재제목:</b> <b>${docItem.title}</b>
• <b>승인자:</b> <b>${approverName}</b>
${nextLine}• <b>일시:</b> ${nowStr}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 7. 전자결재 반려 즉시 알림 (파랑색 🟦)
 */
export const sendApprovalRejectTelegram = async (docItem, rejectorName, reason) => {
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
 * 9. 매일 아침 07:30 통합 모닝 브리핑 (연차 + 미결재 + 품질경보 미삭제) ➜ 오륙 통합방
 */
export const sendDailyMorningBriefingTelegram = async (targetDateStr = null, targetChatId = null) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || config.chatId || "-4186792536";
  const todayStr = targetDateStr || getKSTDateString();
  const dateFormatted = `${getKSTFormattedString(todayStr).split(" ")[0]} 07:30`;

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

  // 3. 품질경보 미삭제 / 미조치 현황 (삭제 및 조치완료 항목 제외)
  const activeUrgentIssues = getLocalUrgentIssues().filter((i) => !i.isDeleted && !i.isResolved);
  let urgentSummary = "없음 (전건 종결완료)";
  if (activeUrgentIssues.length > 0) {
    const issueTitles = activeUrgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = activeUrgentIssues.length > 2 ? ` 외 ${activeUrgentIssues.length - 2}건` : "";
    urgentSummary = `미조치 ${activeUrgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }

  const savedBriefingTemplate = getLocalTelegramTemplates()["unified_briefing"]?.text;

  const defaultMessage = `
<b>⬛ [오륙 생산관리] 일일 모닝 브리핑</b>
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

  const message = savedBriefingTemplate || defaultMessage;

  const sendResult = await sendTelegramMessage(message, {
    ...config,
    chatId: destChatId
  });

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

export const sendDailyLeaveBriefingTelegram = sendDailyMorningBriefingTelegram;

/**
 * 10. 매일 아침 손익결산 브리핑 발송 (매출액 / 매입액 / 달성율 / 공통일정)
 * 기본 발송 채널: '경영총괄' (-1003939516875)
 */
export const sendDailyPnLMorningBriefingTelegram = async (customBriefingData = null, targetChatId = null) => {
  const config = getLocalTelegramConfig();
  const destChatId = targetChatId || customBriefingData?.targetChatId || config.pnlChatId || "-1003939516875";
  const todayStr = getKSTDateString();

  const savedPnLTemplate = getLocalTelegramTemplates()["management_pnl"]?.text;
  if (!customBriefingData && savedPnLTemplate) {
    const sendRes = await sendTelegramMessage(savedPnLTemplate, {
      ...config,
      chatId: destChatId
    });
    if (sendRes.success) {
      try {
        localStorage.setItem("oryuk_last_pnl_briefing_sent", todayStr);
        await setDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]), {
          lastPnLSentDate: todayStr,
          pnlSentAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to record pnl briefing timestamp:", e);
      }
    }
    return sendRes;
  }

  const dateFormatted = `${getKSTFormattedString(todayStr).split(" ")[0]} 07:30`;

  let salesAmount = customBriefingData?.salesAmount ?? 1756104735;
  let purchaseAmount = customBriefingData?.purchaseAmount ?? 1248400885;
  let salesAchievementRate = customBriefingData?.salesAchievementRate || "102.4%";
  let purchaseAchievementRate = customBriefingData?.purchaseAchievementRate || "98.7%";
  let commonSchedules = customBriefingData?.commonSchedules;

  if (!commonSchedules) {
    try {
      await cleanupExpiredCommonSchedules(todayStr);
    } catch (e) {
      console.warn("Cleanup expired schedules error:", e);
    }

    const todayScheds = getTodayCommonSchedules(todayStr);
    if (todayScheds.length > 0) {
      todayScheds.sort((a, b) => {
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        return (a.time || "").localeCompare(b.time || "");
      });
      commonSchedules = todayScheds.map((s) => {
        const startDate = s.startDate || s.date;
        const endDate = s.endDate || startDate;
        const targetStr = s.target ? `[${s.target}] ` : "";
        const timeStr = s.time && s.time !== "종일" ? `[${s.time}] ` : "";
        if (startDate !== endDate) {
          return `• [${startDate.slice(5)}~${endDate.slice(5)}] ${targetStr}${timeStr}${s.title}`;
        } else if (startDate === todayStr) {
          return `• [오늘] ${targetStr}${timeStr}${s.title}`;
        } else {
          return `• [${startDate.slice(5)}] ${targetStr}${timeStr}${s.title}`;
        }
      }).join("\n");
    } else {
      commonSchedules = "• 등록된 태형&미영 일정이 없습니다.";
    }
  }

  const costRatio = salesAmount > 0 ? ((purchaseAmount / salesAmount) * 100).toFixed(1) : "71.1";
  const isMgmtRoom = destChatId === "-1003939516875" || destChatId === "290615483";

  const message = `
<b>⬛ [오륙] 일일 아침 손익결산 브리핑</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
<b>[1] 당월 매입 / 매출 결산 현황</b>
• <b>매출액:</b> ₩${Number(salesAmount).toLocaleString()}원
• <b>매입액:</b> ₩${Number(purchaseAmount).toLocaleString()}원
• <b>매출대비 원가율:</b> ${costRatio}%

<b>[2] 전월 실적 대비 달성율</b>
• <b>전월대비 매출 달성율:</b> <b>${salesAchievementRate}</b>
• <b>전월대비 매입 달성율:</b> <b>${purchaseAchievementRate}</b>

<b>[3] 태형이랑 & 미영이랑</b>
${commonSchedules}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>
`.trim();

  const sendResult = await sendTelegramMessage(message, {
    ...config,
    chatId: destChatId
  });

  if (sendResult.success) {
    try {
      localStorage.setItem("oryuk_last_pnl_briefing_sent", todayStr);
      await setDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]), {
        lastPnLSentDate: todayStr,
        pnlSentAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to record pnl briefing timestamp:", e);
    }
  }

  return sendResult;
};

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

  let cloudBriefingData = null;
  try {
    const snap = await getDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]));
    if (snap.exists()) {
      cloudBriefingData = snap.data();
    }
  } catch (e) {
    console.warn("Morning briefing check cloud read error:", e);
  }

  const results = {};

  // 1. Check & send General Morning Briefing (오륙 통합방)
  if (config.sendDailyLeaveBriefing) {
    const lastLocal = localStorage.getItem("oryuk_last_morning_briefing_sent");
    const cloudSent = cloudBriefingData?.lastSentDate === todayStr;

    if (lastLocal === todayStr || cloudSent) {
      if (cloudSent && lastLocal !== todayStr) {
        localStorage.setItem("oryuk_last_morning_briefing_sent", todayStr);
      }
      results.general = { skipped: true, reason: "ALREADY_SENT_TODAY" };
    } else {
      console.log(`[07:30 Daily Briefing] Auto-sending morning summary for ${todayStr}...`);
      results.general = await sendDailyMorningBriefingTelegram(todayStr);
    }
  }

  // 2. Check & send PnL Morning Briefing (경영총괄)
  if (config.sendDailyPnLBriefing) {
    const lastPnLLocal = localStorage.getItem("oryuk_last_pnl_briefing_sent");
    const cloudPnLSent = cloudBriefingData?.lastPnLSentDate === todayStr;

    if (lastPnLLocal === todayStr || cloudPnLSent) {
      if (cloudPnLSent && lastPnLLocal !== todayStr) {
        localStorage.setItem("oryuk_last_pnl_briefing_sent", todayStr);
      }
      results.pnl = { skipped: true, reason: "ALREADY_SENT_TODAY" };
    } else {
      console.log(`[07:30 Daily PnL Briefing] Auto-sending PnL briefing for ${todayStr}...`);
      results.pnl = await sendDailyPnLMorningBriefingTelegram();
    }
  }

  return results;
};

export const checkAndAutoSendDailyLeaveBriefing = checkAndAutoSendDailyMorningBriefing;

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
