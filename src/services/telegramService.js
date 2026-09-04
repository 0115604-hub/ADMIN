import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config";
const CONFIG_DOC_PATH = ["system_config", "telegram"];

// Default Configuration
export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "", // Will be filled with user's bot token
  chatId: "",   // Target chat or group chat ID
  sendQualityAlerts: true,
  sendActionReports: true
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
  const chatId = config.chatId.trim();
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log("✅ Telegram message sent successfully:", data);
      return { success: true, data };
    } else {
      console.warn("⚠️ Telegram API returned error:", data);
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error("❌ Telegram network error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Quality Alert / Notice Notification
 */
export const sendQualityAlertTelegram = async (issue) => {
  const isNotice = issue.category === "공지사항" || issue.category === "공유사항";
  const headerEmoji = isNotice ? "📢" : "🚨";
  const headerTitle = isNotice ? "공지사항 등록" : "품질경보 발생";

  const message = `
<b>${headerEmoji} [(주)오륙 ${headerTitle} 알림]</b>

🏭 <b>공장:</b> ${issue.plant || "삼랑진공장"}
👤 <b>작성자:</b> ${issue.author} ${issue.authorTitle || "선임"}
📅 <b>일시:</b> ${issue.createdAt || new Date().toLocaleString("ko-KR")}

📌 <b>구분:</b> ${issue.category || (isNotice ? "공지사항" : "품질경보")}
📌 <b>제목:</b> ${issue.title || "-"}
📝 <b>전달내용:</b>
${issue.content || issue.title}
${issue.actionResult ? `\n🛠️ <b>조치결과:</b>\n${issue.actionResult} (${issue.actionAuthor || "조치자"})` : ""}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * Send Quality Action Completed Notification
 */
export const sendQualityActionTelegram = async (issue) => {
  const message = `
<b>✅ [(주)오륙 품질경보 조치완료 보고]</b>

🏭 <b>공장:</b> ${issue.plant || "삼랑진공장"}
👤 <b>조치자:</b> ${issue.actionAuthor || "작업자"}
📅 <b>조치일시:</b> ${issue.actionAt || new Date().toLocaleString("ko-KR")}

📌 <b>대상 이슈:</b> ${issue.title || issue.content}
🛠️ <b>조치결과 상세:</b>
${issue.actionResult}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * Test Connection Function
 */
export const testTelegramConnection = async (token, chatId) => {
  if (!token || !chatId) {
    return { success: false, error: "Bot Token과 Chat ID를 입력해주세요." };
  }

  const testMessage = `
<b>🔔 [(주)오륙 MES] 텔레그램 알림 연동 테스트 성공</b>

✅ 텔레그램 봇과 정상적으로 연결되었습니다.
앞으로 <b>품질경보 🚨</b> 및 <b>조치완료 ✅</b> 알림이 본 채팅방으로 실시간 전송됩니다.

🔗 <b>생산관리시스템:</b> https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
