import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PLANTS } from "../context/AuthContext";
import { getLocalAnnualLeaves } from "./annualLeaveService";
import { getLocalApprovalDocs } from "./approvalService";
import { getLocalWorkLogs } from "./workLogService";
import { getLocalUrgentIssues } from "./urgentIssueService";

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
 * 1. 🚨 품질경보 / 📢 공지사항 즉시 알림
 */
export const sendQualityAlertTelegram = async (issue) => {
  const isNotice = issue.category === "공지사항" || issue.category === "공유사항";
  const headerEmoji = isNotice ? "📢" : "🚨";
  const headerTitle = isNotice ? "공지사항 등록" : "품질경보 발생";

  const message = `
<b>${headerEmoji} [${headerTitle}]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${issue.plant || "삼랑진공장"}
👤 <b>작성자:</b> ${issue.author} ${issue.authorTitle || "선임"}
📅 <b>일시:</b> ${issue.createdAt || new Date().toLocaleString("ko-KR")}
📌 <b>제목:</b> <b>${issue.title || "-"}</b>

📝 <b>전달내용:</b>
${issue.content || issue.title}
${issue.actionResult ? `\n🛠️ <b>조치결과:</b>\n${issue.actionResult} (${issue.actionAuthor || "조치자"})` : ""}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 2. ✅ 품질경보 조치완료 즉시 알림
 */
export const sendQualityActionTelegram = async (issue) => {
  const message = `
<b>✅ [품질경보 조치완료 보고]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${issue.plant || "삼랑진공장"}
👤 <b>조치자:</b> ${issue.actionAuthor || "작업자"}
📅 <b>일시:</b> ${issue.actionAt || new Date().toLocaleString("ko-KR")}
📌 <b>대상:</b> ${issue.title || issue.content}

🛠️ <b>조치결과 상세:</b>
${issue.actionResult}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 3. 🗑️ 품질경보 삭제/해제 즉시 알림
 */
export const sendQualityDeleteTelegram = async (issue, deleterName = "") => {
  const isNotice = issue.category === "공지사항" || issue.category === "공유사항";
  const itemType = isNotice ? "공지사항" : "품질경보";

  const message = `
<b>🗑️ [${itemType} 삭제/종결 알림]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${issue.plant || "삼랑진공장"}
👤 <b>삭제권한자:</b> ${deleterName || "총괄관리자"}
📅 <b>삭제일시:</b> ${new Date().toLocaleString("ko-KR")}
📌 <b>삭제대상:</b> ${issue.title || issue.content}

ℹ️ 해당 ${itemType} 항목이 시스템에서 삭제/종결 처리되었습니다.
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 4. 📑 전자결재 기안 상신 즉시 알림
 */
export const sendApprovalDraftTelegram = async (docItem) => {
  const nextApprover = docItem.steps?.find((s) => s.status === "PENDING")?.name || "책임/임원";

  const message = `
<b>📑 [전자결재 기안 상신]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"} (${docItem.department || "생산부"})
📝 <b>결재제목:</b> <b>${docItem.title}</b>
👉 <b>결재대기:</b> <b>${nextApprover}</b>
📅 <b>일시:</b> ${docItem.createdAt || new Date().toLocaleString("ko-KR")}

📋 <b>내용요약:</b>
${docItem.content ? (docItem.content.length > 120 ? docItem.content.slice(0, 120) + "..." : docItem.content) : "-"}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 5. 👑 전자결재 승인 즉시 알림
 */
export const sendApprovalStepTelegram = async (docItem, approverName, comment = "승인 완료", isFinal = false) => {
  const statusEmoji = isFinal ? "👑" : "✍️";
  const statusTitle = isFinal ? "전자결재 최종 승인 완료" : "전자결재 승인 완료";

  const message = `
<b>${statusEmoji} [${statusTitle}]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>
✅ <b>결재자:</b> <b>${approverName}</b> (${isFinal ? "최종 결재" : "중간 승인"})
💬 <b>코멘트:</b> ${comment || "확인 및 승인"}
📅 <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 6. ❌ 전자결재 반려 즉시 알림
 */
export const sendApprovalRejectTelegram = async (docItem, rejectorName, reason) => {
  const message = `
<b>❌ [전자결재 반려 알림]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>
🚫 <b>반려자:</b> <b>${rejectorName}</b>
⚠️ <b>반려사유:</b>
${reason || "내용 보완 후 재상신 요망"}
📅 <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 7. ⏸️ 전자결재 보류 즉시 알림
 */
export const sendApprovalHoldTelegram = async (docItem, holderName, reason) => {
  const message = `
<b>⏸️ [전자결재 보류 알림]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${docItem.plant || "삼랑진공장"}
👤 <b>기안자:</b> ${docItem.drafter} ${docItem.drafterTitle || "선임"}
📝 <b>결재제목:</b> <b>${docItem.title}</b>
⏳ <b>보류자:</b> <b>${holderName}</b>
💬 <b>보류사유:</b> ${reason || "검토 필요"}
📅 <b>일시:</b> ${new Date().toLocaleString("ko-KR")}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 8. ✍️ 일일업무일지 결재 즉시 알림
 */
export const sendWorkLogApprovedTelegram = async (logItem, approver) => {
  const message = `
<b>✍️ [일일업무일지 결재 승인]</b>
━━━━━━━━━━━━━━━━━━━━
🏭 <b>공장:</b> ${logItem.plant || "삼랑진공장"}
👤 <b>작성자:</b> ${logItem.writer} ${logItem.title || ""} (${logItem.process || "생산"})
👑 <b>결재자:</b> <b>${approver.name || "총괄관리자"} ${approver.title || ""}</b>
💬 <b>지시사항:</b> ${approver.comment || "확인 및 결재 승인"}
📅 <b>업무일자:</b> ${logItem.date || ""}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(message);
};

/**
 * 9. 🌅 매일 아침 07:30 통합 모닝 브리핑 (연차 + 미결재 + 품질경보 미삭제)
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

  let approvalSummary = "없음 (전건 결재완료 ✓)";
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
  let urgentSummary = "없음 (전건 종결완료 ✓)";
  if (urgentIssues.length > 0) {
    const issueTitles = urgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = urgentIssues.length > 2 ? ` 외 ${urgentIssues.length - 2}건` : "";
    urgentSummary = `총 ${urgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }

  const message = `
<b>🌅 [오륙MES 일일 모닝 브리핑]</b>
📅 <b>${dateFormatted}</b>
━━━━━━━━━━━━━━━━━━━━
🌴 <b>금일 연차자:</b> ${leaveSummary}
📑 <b>전일 미결재:</b> ${approvalSummary}
🚨 <b>품질경보 미삭제:</b> ${urgentSummary}
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  const sendResult = await sendTelegramMessage(message);

  // Record briefing date in Firestore & LocalStorage
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
 * Check and Auto-Send Daily 07:30 AM Morning Briefing
 */
export const checkAndAutoSendDailyMorningBriefing = async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().split("T")[0];

  // Only auto-trigger at 07:30 AM or later (07:30+)
  if (currentHour < 7 || (currentHour === 7 && currentMinute < 30)) {
    return { skipped: true, reason: "BEFORE_07_30_AM" };
  }

  // Check if already sent today
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

  console.log(`⏰ [07:30 Daily Briefing] Auto-sending morning summary for ${todayStr}...`);
  return await sendDailyMorningBriefingTelegram(todayStr);
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
<b>🔔 [텔레그램 연동 정상 연결]</b>
━━━━━━━━━━━━━━━━━━━━
✅ 텔레그램 봇과 정상적으로 연결되었습니다.
앞으로 아래 알림이 본 채팅방으로 실시간 전송됩니다:

• 🚨 <b>품질경보:</b> 작성 즉시 / 조치 즉시 / 삭제 즉시
• 📑 <b>전자결재:</b> 기안 상신 / 승인 / 반려 / 보류
• 🌅 <b>모닝브리핑:</b> 매일 07:30 (연차 + 미결재 + 품질경보 미삭제)
━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

  return await sendTelegramMessage(testMessage, {
    enabled: true,
    botToken: token,
    chatId: chatId
  });
};
