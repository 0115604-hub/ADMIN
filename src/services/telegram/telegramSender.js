import {
  getLocalTelegramConfig,
  normalizeOryukChatId,
  isDuplicateMessage,
  sanitizeTelegramMessageText
} from "./telegramConfig";

/**
 * Send a custom text message via Telegram Bot API with low latency & 20s timeout
 */
export const sendTelegramMessage = async (text, customConfig = null, retryCount = 0) => {
  const config = customConfig || getLocalTelegramConfig();
  if (config.enabled === false) {
    console.log("[Telegram] 연동이 일시 중단 상태이므로 발송을 건너뜁니다.");
    return { success: false, skipped: true, reason: "PAUSED" };
  }
  if (!config.botToken || !config.chatId) {
    console.log("Telegram notification skipped: Bot token or chat ID not configured.");
    return { success: false, skipped: true, reason: "NOT_CONFIGURED" };
  }

  let sanitizedText = sanitizeTelegramMessageText(text);
  if (sanitizedText && sanitizedText.length > 3900) {
    console.warn(`[Telegram Guard] Client message length (${sanitizedText.length}) exceeds 3900 chars. Truncating...`);
    sanitizedText = sanitizedText.slice(0, 3900) + "\n\n... <i>(내용이 길어 일부 생략됨 - 시스템에서 전체 확인 가능)</i>";
  }
  const token = config.botToken.trim();
  const chatId = normalizeOryukChatId(config.chatId);

  // 1회 발송 원칙: 동일 수신처 & 완전 동일 본문 4초 이내 중복 클릭/연타만 차단
  const msgFingerprint = `msg_${chatId}_${sanitizedText.trim()}`;
  if (isDuplicateMessage(msgFingerprint, 4000)) {
    console.log(`[Telegram] 동일 메시지 4초 이내 연타 방지 차단 (${chatId})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 20000) : null;

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
    if (response.ok && data.ok) {
      return { success: true, messageId: data.result?.message_id };
    }

    // Fallback: If Telegram failed due to HTML parse error, strip HTML and retry as plain text
    console.warn("Telegram HTML parse failed, retrying with plain text fallback. Error:", data);
    const plainText = sanitizedText
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "");

    const fallbackRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: plainText,
        disable_web_page_preview: true
      })
    });

    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.ok) {
      return { success: true, messageId: fallbackData.result?.message_id, fallback: true };
    }

    console.error("Telegram API Error after fallback:", fallbackData);
    return { success: false, error: fallbackData.description || data.description || "API_ERROR", data: fallbackData };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn(`Telegram Network Error (attempt ${retryCount + 1}):`, error);

    // 1 automatic retry on transient network glitch
    if (retryCount < 1) {
      console.log("[Telegram] 1초 후 재전송을 시도합니다...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await sendTelegramMessage(text, customConfig, retryCount + 1);
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send a single photo with caption via Telegram Bot API (Style B: show_caption_above_media)
 */
export const sendTelegramPhoto = async (photoDataUrl, caption = "", customConfig = null, retryCount = 0) => {
  const config = customConfig || getLocalTelegramConfig();
  if (config.enabled === false) {
    return { success: false, skipped: true, reason: "PAUSED" };
  }
  if (!config.botToken || !config.chatId) {
    return { success: false, skipped: true, reason: "NOT_CONFIGURED" };
  }

  const sanitizedCaption = sanitizeTelegramMessageText(caption);
  const token = config.botToken.trim();
  const chatId = normalizeOryukChatId(config.chatId);

  // 1회 발송 원칙: 동일 사진/캡션 4초 이내 연타 차단
  const photoFingerprint = `photo_${chatId}_${sanitizedCaption.trim()}_${photoDataUrl.slice(0, 100)}`;
  if (isDuplicateMessage(photoFingerprint, 4000)) {
    console.log(`[Telegram] 동일 사진 4초 이내 연타 방지 차단 (${chatId})`);
    return { success: true, skipped: true, reason: "DUPLICATE_GUARD_ACTIVATED" };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 20000) : null;

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
    if (response.ok && data.ok) {
      return { success: true, messageId: data.result?.message_id };
    }

    // Fallback: retry without parse_mode
    console.warn("Telegram sendPhoto with HTML failed, retrying without parse_mode:", data);
    const plainCaption = sanitizedCaption
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "");

    const fallbackFormData = new FormData();
    fallbackFormData.append("chat_id", chatId);
    if (plainCaption) {
      fallbackFormData.append("caption", plainCaption);
    }
    fallbackFormData.append("photo", resBlob, "photo.jpg");

    const fallbackRes = await fetch(endpoint, {
      method: "POST",
      body: fallbackFormData
    });
    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.ok) {
      return { success: true, messageId: fallbackData.result?.message_id, fallback: true };
    }

    return await sendTelegramMessage(sanitizedCaption, customConfig);
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn(`Telegram sendPhoto Network Error (attempt ${retryCount + 1}):`, error);
    if (retryCount < 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await sendTelegramPhoto(photoDataUrl, caption, customConfig, retryCount + 1);
    }
    return await sendTelegramMessage(sanitizedCaption, customConfig);
  }
};

/**
 * Send up to 3 photos as MediaGroup or Single Photo via Telegram Bot API (Style B)
 */
export const sendTelegramMediaGroup = async (images = [], caption = "", customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (config.enabled === false) {
    return { success: false, skipped: true, reason: "PAUSED" };
  }
  if (!config.botToken || !config.chatId) {
    return { success: false, skipped: true, reason: "NOT_CONFIGURED" };
  }

  const validImages = (images || []).filter((img) => img && img.dataUrl).slice(0, 3);
  if (validImages.length === 0) {
    return await sendTelegramMessage(caption, customConfig);
  }

  if (validImages.length === 1) {
    return await sendTelegramPhoto(validImages[0].dataUrl, caption, customConfig);
  }

  const token = config.botToken.trim();
  const chatId = normalizeOryukChatId(config.chatId);
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
    if (response.ok && data.ok) {
      return { success: true, results: data.result };
    }

    console.warn("sendMediaGroup failed, fallback to single photo send:", data);
    return await sendTelegramPhoto(validImages[0].dataUrl, caption, customConfig);
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
 * Helper to dispatch factory alerts strictly to primary chat room (오륙 통합방 단 1회 발송 원칙)
 */
export const dispatchToTelegramRooms = async (message, images = [], customConfig = null) => {
  const config = customConfig || getLocalTelegramConfig();
  if (config.enabled === false) {
    return { success: false, skipped: true, reason: "PAUSED" };
  }

  // 1회 발송 원칙: 오륙 통합방 단톡방으로만 단 1회 발송
  const targetChatId = normalizeOryukChatId(config.chatId);
  const cfg = { ...config, chatId: targetChatId };

  if (images && images.length > 0) {
    return await sendTelegramMediaGroup(images, message, cfg);
  }
  return await sendTelegramMessage(message, cfg);
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
오륙통합방 발송 대상 알림 (5가지):

• <b>1. 부적합경보:</b> 신규 등록 즉시 알림
• <b>2. 품질의견:</b> 조치 의견 등록 즉시 알림
• <b>3. 품질삭제:</b> 종결 및 삭제 즉시 알림
• <b>4. 모닝브리핑:</b> 매일 07:40 통합 브리핑
• <b>5. 마감브리핑:</b> 매일 17:30 일일마감 브리핑 (월~토)
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
