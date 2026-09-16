import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: "profit-and-loss-7d09b.firebaseapp.com",
  projectId: "profit-and-loss-7d09b",
  storageBucket: "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: "751528745146",
  appId: "1:751528745146:web:c9bc019f965942b3eaca83",
  measurementId: "G-2XSENS7QCB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RUNNER_ID = "github_runner_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();

const DEFAULT_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-4186792536", // '오륙 통합방'
  pnlChatId: "-1003939516875", // '경영총괄 / 경영방'
  sendDailyLeaveBriefing: true,
  sendDailyPnLBriefing: true,
  sendDailyClosingBriefing: true
};

// KST Time & Date Utilities for Node.js
function getKSTDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getKSTFormattedString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";
  const yyyy = getPart("year");
  const mm = getPart("month");
  const dd = getPart("day");
  const hh = getPart("hour");
  const min = getPart("minute");

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateObj = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+09:00`);
  const dayName = days[dateObj.getDay()];

  return `${yyyy}.${mm}.${dd}(${dayName}) ${hh}:${min}`;
}

function formatMMDDWithWeekday(dateStr) {
  if (!dateStr) return "";
  try {
    const clean = String(dateStr).trim().replace(/\(.*?\)/g, "").trim();
    const parts = clean.split("-");
    let dateObj;
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts.length === 2) {
      const year = new Date().getFullYear();
      dateObj = new Date(year, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = weekdays[dateObj.getDay()];
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      return `${mm}-${dd}(${dayOfWeek})`;
    }
  } catch (e) {}
  return dateStr;
}

function formatYYYYMMDDWithWeekday(dateStr) {
  if (!dateStr) return "";
  try {
    const clean = String(dateStr).trim().replace(/\(.*?\)/g, "").trim();
    const parts = clean.split("-");
    let dateObj;
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = weekdays[dateObj.getDay()];
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      return `${yyyy}.${mm}.${dd}(${dayOfWeek})`;
    }
  } catch (e) {}
  return dateStr;
}

function getKSTTimeInfo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = parseInt(getPart("hour"), 10);
  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);
  const dateStr = `${year}-${month}-${day}`;
  const totalSeconds = hour * 3600 + minute * 60 + second;

  return { year, month, day, hour, minute, second, dateStr, totalSeconds };
}

function isThisWeek(dateInput, refDate = new Date()) {
  if (!dateInput) return false;
  try {
    const kstDateStr = getKSTDateString(refDate);
    const [yStr, mStr, dStr] = kstDateStr.split("-");
    const curYear = yStr;
    const curMonth = mStr;

    let targetStr = "";
    if (typeof dateInput === "number") {
      targetStr = `${curYear}-${curMonth}-${String(dateInput).padStart(2, "0")}`;
    } else if (typeof dateInput === "string") {
      const match = dateInput.match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
      if (match) {
        const y = match[1] || curYear;
        const m = match[2].padStart(2, "0");
        const d = match[3].padStart(2, "0");
        targetStr = `${y}-${m}-${d}`;
      } else {
        const monthDayMatch = dateInput.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (monthDayMatch) {
          const m = monthDayMatch[1].padStart(2, "0");
          const d = monthDayMatch[2].padStart(2, "0");
          targetStr = `${curYear}-${m}-${d}`;
        } else {
          const idDateMatch = dateInput.match(/(\d{4})(\d{2})(\d{2})/);
          if (idDateMatch) {
            targetStr = `${idDateMatch[1]}-${idDateMatch[2]}-${idDateMatch[3]}`;
          }
        }
      }
    } else if (dateInput instanceof Date) {
      targetStr = getKSTDateString(dateInput);
    }

    if (!targetStr) return false;
    const curr = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
    const dayOfWeek = curr.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const formatYMD = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return targetStr >= formatYMD(monday) && targetStr <= formatYMD(sunday);
  } catch (e) {
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getConfig() {
  try {
    const snap = await getDoc(doc(db, "system_config", "telegram"));
    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() };
    }
  } catch (e) {
    console.warn("Could not load config from Firestore, using default:", e.message);
  }
  return DEFAULT_CONFIG;
}

async function getCustomTemplates() {
  try {
    const snap = await getDoc(doc(db, "system_config", "telegram_templates"));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn("Could not load custom templates:", e.message);
  }
  return {};
}

/**
 * Distributed Atomic Lock Acquisition via Firestore Transaction
 */
async function acquireBriefingLock(briefingType, todayStr, force = false) {
  if (force) {
    return { acquired: true, isForced: true };
  }

  const lockDocRef = doc(db, "system_config", "daily_briefing");

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(lockDocRef);
      const data = snap.exists() ? snap.data() : {};

      const dateField = briefingType === "general" ? "lastSentDate" : briefingType === "closing" ? "lastClosingSentDate" : "lastPnLSentDate";
      const lockField = briefingType === "general" ? "generalLock" : briefingType === "closing" ? "closingLock" : "pnlLock";

      if (data[dateField] === todayStr) {
        return { acquired: false, reason: "ALREADY_SENT_TODAY", lastSentDate: data[dateField] };
      }

      const currentLock = data[lockField];
      if (currentLock && currentLock.date === todayStr && currentLock.status === "SENDING") {
        const lockedAtMs = currentLock.lockedAt ? new Date(currentLock.lockedAt).getTime() : 0;
        const nowMs = Date.now();
        if (nowMs - lockedAtMs < 90000) {
          return { acquired: false, reason: "LOCKED_BY_ANOTHER_INSTANCE", lockedBy: currentLock.lockedBy };
        }
      }

      transaction.set(lockDocRef, {
        [lockField]: {
          status: "SENDING",
          date: todayStr,
          lockedAt: new Date().toISOString(),
          lockedBy: RUNNER_ID
        }
      }, { merge: true });

      return { acquired: true, clientId: RUNNER_ID };
    });

    return result;
  } catch (err) {
    console.warn(`[Briefing Lock] Transaction error for ${briefingType}:`, err.message);
    return { acquired: false, reason: "TRANSACTION_ERROR", error: err.message };
  }
}

/**
 * Distributed Atomic Lock Completion
 */
async function completeBriefingLock(briefingType, todayStr, isSuccess, errorMsg = null) {
  const lockDocRef = doc(db, "system_config", "daily_briefing");
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
          sentBy: RUNNER_ID
        }
      }, { merge: true });
    } else {
      await setDoc(lockDocRef, {
        [lockField]: {
          status: "FAILED",
          date: todayStr,
          failedAt: new Date().toISOString(),
          error: errorMsg || "UNKNOWN_ERROR",
          sentBy: RUNNER_ID
        }
      }, { merge: true });
    }
  } catch (e) {
    console.warn(`[Briefing Lock] Failed to complete lock for ${briefingType}:`, e.message);
  }
}

function sanitizeTelegramText(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/방상국\s*차장/g, "권태형 대표이사")
    .replace(/방상국\s*선임/g, "설유철 책임")
    .replace(/방상국\s*대표이사/g, "권태형 대표이사")
    .replace(/방상국/g, "권태형");
}

async function sendTelegramMessage(token, chatId, text) {
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const sanitizedText = sanitizeTelegramText(text);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: sanitizedText,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    const data = await response.json();
    return { ok: response.ok && data.ok, data };
  } catch (err) {
    console.error("Telegram API send error:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Align exact execution to 07:30:00 KST or 17:30:00 KST
 */
async function alignToExactSchedule() {
  const info = getKSTTimeInfo();

  // 1. Morning window pre-warm (around 07:30 KST)
  const targetMorning = 7 * 3600 + 30 * 60; // 07:30:00 KST (27000 seconds)
  if (info.hour === 7 && info.totalSeconds < targetMorning) {
    const diffMs = (targetMorning - info.totalSeconds) * 1000;
    if (diffMs <= 360000) {
      console.log(`[Runner Pre-Warm 07:30] Current KST ${info.hour}:${info.minute}:${info.second}. Waiting ${Math.round(diffMs / 1000)}s until 07:30:00 KST...`);
      await sleep(diffMs);
      console.log("[Runner Trigger] 07:30:00 KST reached! Dispatching immediately...");
    }
  }

  // 2. Evening window pre-warm (around 17:30 KST)
  const targetClosing = 17 * 3600 + 30 * 60; // 17:30:00 KST (63000 seconds)
  if ((info.hour === 17 && info.totalSeconds < targetClosing) || (info.hour === 16 && info.totalSeconds < targetClosing)) {
    const diffMs = (targetClosing - info.totalSeconds) * 1000;
    if (diffMs <= 360000) {
      console.log(`[Runner Pre-Warm 17:30] Current KST ${info.hour}:${info.minute}:${info.second}. Waiting ${Math.round(diffMs / 1000)}s until 17:30:00 KST...`);
      await sleep(diffMs);
      console.log("[Runner Trigger] 17:30:00 KST reached! Dispatching immediately...");
    }
  }
}

export async function runAllBriefings(force = false) {
  console.log("=== Starting Scheduled Briefings Dispatcher (07:30 / 17:30) ===");
  await alignToExactSchedule();

  const config = await getConfig();
  if (!config.enabled) {
    console.log("Telegram integration is disabled in config.");
    return;
  }

  const todayStr = getKSTDateString();
  const dateFormatted = `${formatYYYYMMDDWithWeekday(todayStr)} 07:30`;
  const customTemplates = await getCustomTemplates();
  const timeInfo = getKSTTimeInfo();
  const curHour = timeInfo.hour;

  const isExplicitMorning = process.argv.includes("--morning");
  const isExplicitClosing = process.argv.includes("--closing");
  const isTimeForMorning = isExplicitMorning || (curHour >= 6 && curHour <= 10);
  const isTimeForClosing = isExplicitClosing || (curHour >= 16 && curHour <= 21);

  // Target Destination Chat IDs: Both 통합방 and 경영방
  const targetChatIds = [
    config.chatId || "-4186792536",
    config.pnlChatId || "-1003939516875"
  ].filter((id, idx, arr) => id && arr.indexOf(id) === idx);

  // -------------------------------------------------------------
  // 1. 07:30 통합 일일 모닝 브리핑 (통합방 & 경영방 동시 발송)
  // -------------------------------------------------------------
  if (config.sendDailyLeaveBriefing && (isTimeForMorning || force)) {
    const lockRes = await acquireBriefingLock("general", todayStr, force);
    if (!lockRes.acquired) {
      console.log(`[모닝브리핑] Skipping send: ${lockRes.reason}`);
    } else {
      console.log(`[모닝브리핑] Lock acquired. Generating briefing for ${todayStr}...`);

      try {
        // 1-1. 연차 현황 (삼랑진 / 한림 구분)
        let activeLeaves = [];
        try {
          const snap = await getDocs(collection(db, "annual_leaves"));
          snap.forEach((docSnap) => {
            const l = docSnap.data();
            if (!l.startDate) return;
            const start = l.startDate;
            const end = l.endDate || l.startDate;
            if (start <= todayStr && todayStr <= end) {
              activeLeaves.push(l);
            }
          });
        } catch (e) {
          console.warn("Error fetching annual leaves:", e.message);
        }

        const samLeaves = activeLeaves.filter((l) => !l.plant?.includes("한림"));
        const hanLeaves = activeLeaves.filter((l) => l.plant?.includes("한림"));

        const samStr = samLeaves.length > 0
          ? samLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
          : "전원 정상 출근";
        const hanStr = hanLeaves.length > 0
          ? hanLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
          : "전원 정상 출근";

        // 1-2. 미결재 현황
        let pendingDocs = [];
        try {
          const snap = await getDocs(collection(db, "approval_documents"));
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.status === "IN_PROGRESS" || d.status === "HOLD") {
              if (d.type === "OVERTIME") {
                if (!isThisWeek(d.workDate || d.createdAt || d.id || d.title, todayStr)) {
                  return;
                }
              }
              pendingDocs.push(d);
            }
          });
        } catch (e) {
          console.warn("Error fetching approvals:", e.message);
        }

        pendingDocs.sort((a, b) => {
          const dateA = a.workDate || a.date || a.createdAt || "";
          const dateB = b.workDate || b.date || b.createdAt || "";
          return dateA.localeCompare(dateB);
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

        // 1-3. 업무일지 미결
        let pendingLogs = [];
        try {
          const snap = await getDocs(collection(db, "work_logs"));
          snap.forEach((docSnap) => {
            const l = docSnap.data();
            if (l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려") {
              pendingLogs.push(l);
            }
          });
        } catch (e) {
          console.warn("Error fetching work logs:", e.message);
        }

        let workLogLines = "• 없음 (전건 승인완료)";
        if (pendingLogs.length > 0) {
          const lines = pendingLogs.slice(0, 5).map((l) => {
            const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
            return `• ${plantShort} ${l.writer || "작업자"} (${l.process || "생산"}일지 ➜ 결재대기: ${l.approverName || "관리자"})`;
          });
          const more = pendingLogs.length > 5 ? `\n• 외 ${pendingLogs.length - 5}건` : "";
          workLogLines = lines.join("\n") + more;
        }

        // 1-4. 진행중인 오픈이슈 (요일 및 의견 상세 포함)
        let allIssues = [];
        try {
          const snap = await getDocs(collection(db, "urgent_issues"));
          snap.forEach((docSnap) => {
            const i = docSnap.data();
            allIssues.push(i);
          });
        } catch (e) {
          console.warn("Error fetching urgent issues:", e.message);
        }

        const activeOpenIssues = allIssues.filter(
          (i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue")
        ).sort((a, b) => {
          const dateA = a.expireDate || a.targetDate || "9999-99-99";
          const dateB = b.expireDate || b.targetDate || "9999-99-99";
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return (a.createdAt || "").localeCompare(b.createdAt || "");
        });

        let openIssueLines = "• 진행중인 오픈이슈 없음";
        if (activeOpenIssues.length > 0) {
          const oLines = activeOpenIssues.map((o) => {
            const d = o.expireDate || o.targetDate || "";
            const dText = d ? `(~${formatMMDDWithWeekday(d)}) ` : "";
            const mainLine = `• [오픈이슈] ${dText}${o.title || o.content} (${o.plant?.replace("공장", "") || "삼랑진"})`;
            
            const replies = Array.isArray(o.replies) ? o.replies : [];
            if (replies.length > 0) {
              const replyLines = replies.map((rep) => {
                const authorText = rep.author ? `${rep.author}` : "작성자";
                const titleText = rep.authorTitle ? ` ${rep.authorTitle}` : "";
                const contentText = rep.content ? `${rep.content.trim()}` : "확인";
                const repDate = rep.actionDate || (rep.createdAt ? rep.createdAt.slice(0, 10) : "");
                const repDateStr = repDate ? ` (${formatMMDDWithWeekday(repDate)})` : "";
                return `  └ 💬 ${authorText}${titleText}: ${contentText}${repDateStr}`;
              }).join("\n");
              return `${mainLine}\n${replyLines}`;
            }
            return mainLine;
          });
          openIssueLines = oLines.slice(0, 5).join("\n");
          if (oLines.length > 5) {
            openIssueLines += `\n• 외 ${oLines.length - 5}건`;
          }
        }

        // 1-5. 회의 & 사내공지 (요일 및 의견 상세 포함)
        const upcomingMeetings = allIssues.filter((i) => !i.isDeleted && i.category === "회의일정" && (i.expireDate || i.targetDate || i.createdAt?.slice(0, 10)) >= todayStr);
        const activeNotices = allIssues.filter((i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") && (!i.expireDate || i.expireDate >= todayStr));

        let noticeMeetingLines = "• 예정된 회의 및 공지사항 없음";
        const combined = [];
        upcomingMeetings.forEach((m) => {
          const d = m.expireDate || m.targetDate || m.createdAt?.slice(0, 10) || "";
          const t = m.meetingTime ? ` ${m.meetingTime}` : "";
          const dText = d ? `${formatMMDDWithWeekday(d)}${t} ` : "";
          const mainLine = `• [회의] ${dText}${m.title || m.content} (${m.plant?.replace("공장", "") || "삼랑진"})`;
          
          const replies = Array.isArray(m.replies) ? m.replies : [];
          let itemText = mainLine;
          if (replies.length > 0) {
            const replyLines = replies.map((rep) => {
              const authorText = rep.author ? `${rep.author}` : "작성자";
              const titleText = rep.authorTitle ? ` ${rep.authorTitle}` : "";
              const contentText = rep.content ? `${rep.content.trim()}` : "확인";
              const repDate = rep.actionDate || (rep.createdAt ? rep.createdAt.slice(0, 10) : "");
              const repDateStr = repDate ? ` (${formatMMDDWithWeekday(repDate)})` : "";
              return `  └ 💬 ${authorText}${titleText}: ${contentText}${repDateStr}`;
            }).join("\n");
            itemText = `${mainLine}\n${replyLines}`;
          }

          combined.push({
            sortKey: `${d} ${m.meetingTime || "00:00"}`,
            text: itemText
          });
        });

        activeNotices.forEach((n) => {
          const d = n.expireDate || n.targetDate || "";
          const dText = d ? `~${formatMMDDWithWeekday(d)} ` : "";
          const mainLine = `• [공지] ${dText}${n.title || n.content}`;
          const replies = Array.isArray(n.replies) ? n.replies : [];
          let itemText = mainLine;
          if (replies.length > 0) {
            const replyLines = replies.map((rep) => {
              const authorText = rep.author ? `${rep.author}` : "작성자";
              const titleText = rep.authorTitle ? ` ${rep.authorTitle}` : "";
              const contentText = rep.content ? `${rep.content.trim()}` : "확인";
              const repDate = rep.actionDate || (rep.createdAt ? rep.createdAt.slice(0, 10) : "");
              const repDateStr = repDate ? ` (${formatMMDDWithWeekday(repDate)})` : "";
              return `  └ 💬 ${authorText}${titleText}: ${contentText}${repDateStr}`;
            }).join("\n");
            itemText = `${mainLine}\n${replyLines}`;
          }

          combined.push({
            sortKey: `${d || "9999-99-99"} 23:59`,
            text: itemText
          });
        });

        if (combined.length > 0) {
          combined.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
          noticeMeetingLines = combined.slice(0, 5).map((c) => c.text).join("\n");
          if (combined.length > 5) {
            noticeMeetingLines += `\n• 외 ${combined.length - 5}건`;
          }
        }

        const defaultGeneralMessage = `
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

🚨 <b>[4] 진행중인 오픈이슈 ${activeOpenIssues.length > 0 ? `(${activeOpenIssues.length}건)` : ""}</b>
${openIssueLines}

📢 <b>[5] 회의일정 & 사내공지 ${combined.length > 0 ? `(${combined.length}건)` : ""}</b>
${noticeMeetingLines}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

        // Send to ALL target chat rooms (통합방 & 경영방)
        for (const cid of targetChatIds) {
          const res = await sendTelegramMessage(config.botToken, cid, defaultGeneralMessage);
          console.log(`[모닝브리핑 발송 -> ${cid}] Send Result:`, res);
        }

        await completeBriefingLock("general", todayStr, true);
      } catch (err) {
        console.error("[모닝브리핑] Error occurred:", err.message);
        await completeBriefingLock("general", todayStr, false, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. 07:30 손익결산 브리핑 (경영총괄: -1003939516875)
  // -------------------------------------------------------------
  if (config.sendDailyPnLBriefing && (isTimeForMorning || force)) {
    const lockRes = await acquireBriefingLock("pnl", todayStr, force);
    if (!lockRes.acquired) {
      console.log(`[경영총괄 손익브리핑] Skipping send: ${lockRes.reason}`);
    } else {
      console.log(`[경영총괄 손익브리핑] Lock acquired. Generating PnL briefing for ${todayStr}...`);

      try {
        let totalSales = 965489801;
        let totalPurchases = 978009146;
        let prevSales = 2090811613;
        let prevPurchases = 1342582215;

        try {
          const mSnap = await getDoc(doc(db, "system_store", "monthly_master"));
          if (mSnap.exists()) {
            const masterData = mSnap.data();
            const store = masterData.store || {};
            const curMonth = store["2026-09"] || {};
            const prevMonth = store["2026-08"] || {};

            if (curMonth.salesSummary?.totalSales) totalSales = curMonth.salesSummary.totalSales;
            if (curMonth.purchaseSummary?.ledgerBenchmark || curMonth.jajaeSummary?.totalAmount || curMonth.purchaseSummary?.totalPurchase) {
              totalPurchases = curMonth.purchaseSummary?.ledgerBenchmark || curMonth.jajaeSummary?.totalAmount || curMonth.purchaseSummary?.totalPurchase;
            }
            if (prevMonth.salesSummary?.totalSales) prevSales = prevMonth.salesSummary.totalSales;
            if (prevMonth.purchaseSummary?.ledgerBenchmark || prevMonth.jajaeSummary?.totalAmount || prevMonth.purchaseSummary?.totalPurchase) {
              prevPurchases = prevMonth.purchaseSummary?.ledgerBenchmark || prevMonth.jajaeSummary?.totalAmount || prevMonth.purchaseSummary?.totalPurchase;
            }
          }
        } catch (mErr) {
          console.warn("Could not fetch live monthly_master data for PnL briefing:", mErr.message);
        }

        const costRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "101.3";
        const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "46.2";
        const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "72.8";

        const salesAchTxt = `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`;
        const purchAchTxt = `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`;

        let commonSchedules = "";
        try {
          const snap = await getDocs(collection(db, "company_common_schedules"));
          const todayScheds = [];
          for (const docSnap of snap.docs) {
            const s = docSnap.data();
            if (s.isCompleted) continue;
            const regDate = s.createdAt ? s.createdAt.slice(0, 10) : (s.startDate || s.date);
            const startDate = s.startDate || s.date;
            const endDate = s.endDate || startDate;
            const effectiveStart = regDate <= startDate ? regDate : startDate;

            if (endDate && endDate < todayStr) {
              try {
                await deleteDoc(doc(db, "company_common_schedules", docSnap.id));
              } catch (delErr) {}
              continue;
            }

            if (effectiveStart && endDate && effectiveStart <= todayStr && todayStr <= endDate) {
              todayScheds.push(s);
            }
          }

          if (todayScheds.length > 0) {
            todayScheds.sort((a, b) => {
              const aStart = a.startDate || a.date || "";
              const bStart = b.startDate || b.date || "";
              if (aStart !== bStart) return aStart.localeCompare(bStart);
              return (a.time || "").localeCompare(b.time || "");
            });
            const getCategoryMeta = (target) => {
              switch (target) {
                case "맛집": return { emoji: "🍷", badge: "맛집 탐방" };
                case "여행": return { emoji: "✈️", badge: "여행 / 힐링" };
                case "세미나": return { emoji: "🎓", badge: "세미나" };
                case "교육": return { emoji: "📚", badge: "교육 / 역량" };
                case "기타":
                default: return { emoji: "💍", badge: target || "공통 일정" };
              }
            };

            commonSchedules = todayScheds.map((s) => {
              const startDate = s.startDate || s.date;
              const endDate = s.endDate || startDate;
              const cat = getCategoryMeta(s.target);
              const timeStr = s.time && s.time !== "종일" ? ` [⏰ ${s.time}]` : "";
              const sFormatted = formatMMDDWithWeekday(startDate);
              const eFormatted = formatMMDDWithWeekday(endDate);
              const commentsCount = Array.isArray(s.comments) && s.comments.length > 0 ? ` (의견 ${s.comments.length}건)` : "";
              if (startDate !== endDate) {
                return `• ${cat.emoji} [${sFormatted}~${eFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
              } else if (startDate === todayStr) {
                return `• ${cat.emoji} [오늘]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
              } else {
                return `• ${cat.emoji} [${sFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
              }
            }).join("\n");
          }
        } catch (e) {
          console.warn("Error fetching common schedules:", e.message);
        }

        if (!commonSchedules) {
          commonSchedules = "• 등록된 사내 공통일정이 없습니다. ✨";
        }

        const pnlMessage = `
<b>⬛ [오륙] 매출 & 일정공유</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
<b>[1] 당월 매입 / 매출 결산 현황</b>
• <b>매출액:</b> ₩${Number(Math.round(totalSales)).toLocaleString()}원
• <b>매입액:</b> ₩${Number(Math.round(totalPurchases)).toLocaleString()}원
• <b>매출대비 원가율:</b> ${costRatio}%

<b>[2] 전월 실적 대비 달성율</b> (08월 실적 대비)
• <b>전월대비 매출 달성율:</b> <b>${salesAchTxt}</b>
• <b>전월대비 매입 달성율:</b> <b>${purchAchTxt}</b>

<b>[3] 사내 공통일정</b>
${commonSchedules}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>
`.trim();

        if (res.ok) {
          await completeBriefingLock("pnl", todayStr, true);
        } else {
          await completeBriefingLock("pnl", todayStr, false, res.error || "TELEGRAM_SEND_FAILED");
        }

        // ⭐ 2-1. 오늘 예정된 사내 공통일정 당일 리마인드 메시지 발송 (경영총괄 전용)
        try {
          const snapSched = await getDocs(collection(db, "company_common_schedules"));
          const todaySchedList = [];
          snapSched.forEach((docSnap) => {
            const s = docSnap.data();
            if (s.isCompleted) return;
            const startDate = s.startDate || s.date;
            const endDate = s.endDate || startDate;
            if (startDate && endDate && startDate <= todayStr && todayStr <= endDate) {
              todaySchedList.push({ id: docSnap.id, ...s });
            }
          });

          if (todaySchedList.length > 0) {
            todaySchedList.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
            const scheduleReminderLines = todaySchedList.map((s, idx) => {
              const target = s.target;
              let catBadge = "공통 일정";
              if (target === "맛집") catBadge = "맛집 탐방";
              else if (target === "여행") catBadge = "여행 / 힐링";
              else if (target === "세미나") catBadge = "세미나";
              else if (target === "교육") catBadge = "교육 / 역량";
              const timeDisplay = s.time && s.time !== "종일" ? `⏰ ${s.time}` : "🌅 종일";
              const authorText = s.author ? ` (${s.author})` : "";
              return `• <b>${idx + 1}. [${catBadge}] ${timeDisplay}</b> - <b>${s.title || "사내 공통일정"}</b>${authorText}`;
            }).join("\n");

            const scheduleReminderMsg = `
✨ <b>𝕋𝕒𝕖𝕙𝕪𝕦𝕟𝕘 & 𝕄𝕚𝕪𝕠𝕦𝕟𝕘</b> ✨
━━━━━━━━━━━━━━━━━━━━━
🔔 <b>[당일 공통일정 리마인드 알림]</b> 🥂
━━━━━━━━━━━━━━━━━━━━━
📅 <b>기준일자:</b> <b>${formatYYYYMMDDWithWeekday(todayStr)}</b>

<b>[오늘 예정된 공통일정 안내 (${todaySchedList.length}건)]</b>
${scheduleReminderLines}

💌 <i>"오늘 예정된 소중한 일정과 함께 뜻깊고 행복한 하루 되시길 바랍니다 ✨"</i>
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">📌 공통일정 확인 및 의견등록 바로가기</a>
`.trim();

            const schedRes = await sendTelegramMessage(config.botToken, config.pnlChatId || "-1003939516875", scheduleReminderMsg);
            console.log(`[경영총괄 당일 공통일정 리마인드] ${todaySchedList.length}건 발송 결과:`, schedRes);
          }
        } catch (schedErr) {
          console.warn("[경영총괄 당일 공통일정 리마인드 발송 오류]:", schedErr.message);
        }
      } catch (err) {
        console.error("[경영총괄 손익브리핑] Error occurred:", err.message);
        await completeBriefingLock("pnl", todayStr, false, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // 3. 17:30 일일마감브리핑 (월~토) (통합방 & 경영방 동시 발송)
  // -------------------------------------------------------------
  const dayOfWeek = new Date().getDay();
  if (config.sendDailyClosingBriefing && (isTimeForClosing || force) && (dayOfWeek >= 1 && dayOfWeek <= 6 || force)) {
    const lockRes = await acquireBriefingLock("closing", todayStr, force);
    if (!lockRes.acquired) {
      console.log(`[일일마감브리핑] Skipping send: ${lockRes.reason}`);
    } else {
      console.log(`[일일마감브리핑] Lock acquired. Generating closing briefing for ${todayStr}...`);

      try {
        let allIssues = [];
        try {
          const snap = await getDocs(collection(db, "urgent_issues"));
          snap.forEach((docSnap) => {
            allIssues.push(docSnap.data());
          });
        } catch (e) {
          console.warn("Error fetching issues for closing briefing:", e.message);
        }

        const activeAlerts = allIssues.filter((i) => !i.isDeleted && i.category === "품질경보");
        let alertLines = " • 금일 신규 등록 및 변동사항 없음 (정상 가동)";
        if (activeAlerts.length > 0) {
          alertLines = activeAlerts.slice(0, 4).map((a) => {
            const plantShort = a.plant?.replace("공장", "") || "삼랑진";
            const statusStr = a.isResolved ? "✅ 조치완료" : "⏳ 점검중";
            return ` • [${plantShort}] ${a.title || a.content}\n   - 조치: ${statusStr}`;
          }).join("\n");
        }

        const todayMeetings = allIssues.filter((i) => !i.isDeleted && i.category === "회의일정" && (i.expireDate === todayStr || i.targetDate === todayStr || i.createdAt?.slice(0, 10) === todayStr));
        let meetingLines = " • 금일 회의일정 및 변동사항 없음";
        if (todayMeetings.length > 0) {
          meetingLines = todayMeetings.slice(0, 4).map((m) => {
            const plantShort = m.plant?.replace("공장", "") || "삼랑진";
            const timeStr = m.meetingTime ? ` [${m.meetingTime}]` : "";
            const repliesCount = Array.isArray(m.replies) && m.replies.length > 0 ? ` (의견 ${m.replies.length}건)` : "";
            return ` • [${plantShort}]${timeStr} ${m.title || m.content}${repliesCount}`;
          }).join("\n");
        }

        const todayNotices = allIssues.filter((i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") && (i.createdAt?.slice(0, 10) === todayStr || i.date === todayStr));
        let noticeLines = " • 금일 신규 등록 및 변동 공지 없음";
        if (todayNotices.length > 0) {
          noticeLines = todayNotices.slice(0, 4).map((n) => {
            return ` • ${n.title || n.content}`;
          }).join("\n");
        }

        const activeOpenIssues = allIssues.filter((i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue"));
        let openIssueLines = " • 진행중인 오픈이슈 없음";
        if (activeOpenIssues.length > 0) {
          openIssueLines = activeOpenIssues.slice(0, 4).map((o) => {
            const plantShort = o.plant?.replace("공장", "") || "삼랑진";
            const d = o.expireDate || o.targetDate || "";
            const dText = d ? `(~${formatMMDDWithWeekday(d)}) ` : "";
            const replies = Array.isArray(o.replies) ? o.replies : [];
            const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
            const replySummary = lastReply ? `\n   - 최근 조치의견: ${lastReply.content} (${lastReply.author || "담당"})` : "";
            return ` • [${plantShort}] ${dText}${o.title || o.content}\n   - 상태: ⏳ 진행중 (진척도 ${o.progress || 0}%)${replySummary}\n   - 작성자: ${o.author || "담당"}`;
          }).join("\n");
        }

        const closingMessage = `
[오륙] 📢 <b>일일마감브리핑 (17:30)</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>${formatYYYYMMDDWithWeekday(todayStr)} 일일 업무 마감 현황</b>
━━━━━━━━━━━━━━━━━━━━

🚨 <b>[1] 품질경보 현황 (총 ${activeAlerts.length}건)</b>
${alertLines}

📅 <b>[2] 회의일정 및 결과 (총 ${todayMeetings.length}건)</b>
${meetingLines}

📢 <b>[3] 사내공지 및 공유사항 (총 ${todayNotices.length}건)</b>
${noticeLines}

📌 <b>[4] 오픈이슈 진행 현황 (총 ${activeOpenIssues.length}건)</b>
${openIssueLines}

━━━━━━━━━━━━━━━━━━━━
🏢 오륙(주) 스마트 생산관리시스템
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();

        // Send closing briefing to ALL target chat rooms (통합방 & 경영방)
        for (const cid of targetChatIds) {
          const res = await sendTelegramMessage(config.botToken, cid, closingMessage);
          console.log(`[일일마감브리핑 발송 -> ${cid}] Send Result:`, res);
        }

        await completeBriefingLock("closing", todayStr, true);
      } catch (err) {
        console.error("[일일마감브리핑] Error occurred:", err.message);
        await completeBriefingLock("closing", todayStr, false, err.message);
      }
    }
  }

  console.log("=== Scheduled Briefings Dispatch Finished ===");
}

const isDirectRun = process.argv[1]?.endsWith("sendTelegramBriefing.mjs") || process.argv[1]?.endsWith("sendTelegramBriefing.js");
if (isDirectRun) {
  const force = process.argv.includes("--force") || process.env.FORCE_SEND === "true";
  runAllBriefings(force).catch((e) => {
    console.error("Fatal error in scheduled briefing dispatcher:", e);
    process.exit(1);
  });
}
