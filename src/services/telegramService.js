import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PLANTS } from "../context/AuthContext";
import { getLocalAnnualLeaves } from "./annualLeaveService";

const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config";
const CONFIG_DOC_PATH = ["system_config", "telegram"];
const BRIEFING_DOC_PATH = ["system_config", "daily_briefing"];

// Default Configuration (Pre-configured with real bot & group chat)
export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-5417404489", // '테스트' group chat ID
  sendQualityAlerts: true,
  sendActionReports: true,
  sendApprovals: true,
  sendDailyLeaveBriefing: true
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
 * 1. 품질경보 / 공지사항 즉시 알림
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
 * 2. 품질경보 조치완료 즉시 알림
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
 * 3. 전자결재 관련 즉시 알림 (기안 상신 / 결재 승인 / 보류 / 반려)
 */
export const sendApprovalDraftTelegram = async (docItem) => {
  const message = `
<b>📑 [(주)오륙 전자결재 기안 상신]</b>

🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"} (${docItem.department || "생산부"})
📅 <b>상신일시:</b> ${docItem.createdAt || new Date().toLocaleString("ko-KR")}

📌 <b>문서번호:</b> <code>${docItem.docNumber || docItem.id}</code>
📝 <b>결재제목:</b> <b>${docItem.title}</b>
📋 <b>기안내용 요약:</b>
${docItem.content ? (docItem.content.length > 150 ? docItem.content.slice(0, 150) + "..." : docItem.content) : "-"}

👉 <b>결재 대기자:</b> ${docItem.steps ? (docItem.steps.find((s) => s.status === "PENDING")?.name || "책임/임원") : "결재권자"}
🔗 <b>전자결재 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

export const sendApprovalStepTelegram = async (docItem, approverName, comment = "승인 완료", isFinal = false) => {
  const statusEmoji = isFinal ? "👑" : "✍️";
  const statusTitle = isFinal ? "전자결재 최종 승인 완료" : "전자결재 중간 승인";

  const message = `
<b>${statusEmoji} [(주)오륙 ${statusTitle}]</b>

🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>

✅ <b>결재자:</b> ${approverName} (${isFinal ? "최종 결재" : "승인"})
💬 <b>지시/코멘트:</b> ${comment || "확인 및 승인"}
📅 <b>결재일시:</b> ${new Date().toLocaleString("ko-KR")}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

export const sendApprovalRejectTelegram = async (docItem, rejectorName, reason) => {
  const message = `
<b>❌ [(주)오륙 전자결재 반려 알림]</b>

🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>

🚫 <b>반려자:</b> ${rejectorName}
⚠️ <b>반려 사유:</b>
${reason || "내용 보완 후 재상신 요망"}
📅 <b>반려일시:</b> ${new Date().toLocaleString("ko-KR")}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

export const sendApprovalHoldTelegram = async (docItem, holderName, reason) => {
  const message = `
<b>⏸️ [(주)오륙 전자결재 보류 알림]</b>

🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>

⏳ <b>보류자:</b> ${holderName}
💬 <b>보류 사유:</b> ${reason || "검토 필요"}
📅 <b>보류일시:</b> ${new Date().toLocaleString("ko-KR")}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

export const sendWorkLogApprovedTelegram = async (logItem, approver) => {
  const message = `
<b>✍️ [(주)오륙 일일업무일지 결재 승인]</b>

🏭 <b>공장:</b> ${logItem.plant || "삼랑진공장"}
👤 <b>작성자:</b> ${logItem.writer} ${logItem.title || ""} (${logItem.process || "생산"})
📅 <b>업무일자:</b> ${logItem.date || ""}

👑 <b>결재자:</b> ${approver.name || "총괄관리자"} ${approver.title || ""}
💬 <b>지시사항:</b> ${approver.comment || "확인 및 전자결재 승인 완료"}

🔗 <b>생산관리시스템 바로가기:</b>
https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 4. 매일 오전 7시 작업자 연차/근태 현황 브리핑
 */
export const sendDailyLeaveBriefingTelegram = async (targetDateStr = null) => {
  const todayStr = targetDateStr || new Date().toISOString().split("T")[0];
  const dateObj = new Date(todayStr + "T00:00:00");
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = daysOfWeek[dateObj.getDay()];
  const displayDate = `${dateObj.getFullYear()}년 ${String(dateObj.getMonth() + 1).padStart(2, "0")}월 ${String(dateObj.getDate()).padStart(2, "0")}일 (${dayName})`;

  const leaves = getLocalAnnualLeaves();

  // Find leaves active today (startDate <= today <= endDate)
  const activeLeaves = leaves.filter((l) => {
    if (!l.startDate) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= todayStr && todayStr <= end;
  });

  let message = `<b>🌅 [(주)오륙 MES] ${displayDate} 일일 근태 및 연차 현황</b>\n\n`;

  let totalWorkers = 0;
  let totalOnLeave = 0;

  PLANTS.forEach((plant) => {
    const plantWorkers = plant.workers;
    totalWorkers += plantWorkers.length;

    const plantLeaves = activeLeaves.filter((l) => {
      return l.plant === plant.name || plantWorkers.some((w) => w.name === l.userName || w.id === l.userId);
    });

    const onLeaveNames = new Set(plantLeaves.map((l) => l.userName));
    const workingWorkers = plantWorkers.filter((w) => !onLeaveNames.has(w.name));

    totalOnLeave += plantLeaves.length;

    message += `🏭 <b>${plant.name}</b> (총 ${plantWorkers.length}명 중 출근 ${workingWorkers.length}명)\n`;

    if (plantLeaves.length > 0) {
      message += `🌴 <b>연차/휴무: ${plantLeaves.length}명</b>\n`;
      plantLeaves.forEach((l) => {
        message += `   • <b>${l.userName} ${l.title || "선임"}:</b> ${l.leaveType || "연차"} ${l.reason ? `(${l.reason})` : ""}\n`;
      });
    } else {
      message += `🌴 <b>연차/휴무: 0명</b> (전원 정상 출근)\n`;
    }

    message += `• <b>출근자:</b> ${workingWorkers.map((w) => `${w.name} ${w.title}`).join(", ")}\n\n`;
  });

  message += `📊 <b>[총괄 요약]</b> 총 ${totalWorkers}명 중 <b>출근 ${totalWorkers - totalOnLeave}명</b> / <b>연차 ${totalOnLeave}명</b>\n`;
  message += `🔗 <b>생산관리시스템:</b> https://profit-and-loss-7d09b.web.app`;

  const sendResult = await sendTelegramMessage(message.trim());

  // Record briefing date in Firestore & LocalStorage
  if (sendResult.success) {
    try {
      localStorage.setItem("oryuk_last_daily_leave_sent", todayStr);
      await setDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]), {
        lastSentDate: todayStr,
        sentAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to record briefing date:", e);
    }
  }

  return sendResult;
};

/**
 * Check and Auto-Send Daily 7:00 AM Briefing
 */
export const checkAndAutoSendDailyLeaveBriefing = async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  // Only auto-trigger after 7:00 AM (07:00+)
  if (currentHour < 7) {
    return { skipped: true, reason: "BEFORE_07_AM" };
  }

  // Check if already sent today
  const lastLocal = localStorage.getItem("oryuk_last_daily_leave_sent");
  if (lastLocal === todayStr) {
    return { skipped: true, reason: "ALREADY_SENT_TODAY_LOCAL" };
  }

  try {
    const snap = await getDoc(doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]));
    if (snap.exists() && snap.data().lastSentDate === todayStr) {
      localStorage.setItem("oryuk_last_daily_leave_sent", todayStr);
      return { skipped: true, reason: "ALREADY_SENT_TODAY_CLOUD" };
    }
  } catch (e) {
    console.warn("Briefing check cloud read error:", e);
  }

  console.log(`⏰ [07:00 Daily Briefing] Auto-sending morning leave briefing for ${todayStr}...`);
  return await sendDailyLeaveBriefingTelegram(todayStr);
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
앞으로 <b>품질경보 🚨</b>, <b>전자결재 📑</b>, <b>매일 아침 7시 연차현황 🌅</b> 알림이 본 채팅방으로 실시간 전송됩니다.

🔗 <b>생산관리시스템:</b> https://profit-and-loss-7d09b.web.app
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
