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
  pnlChatId: "-1003939516875", // '경영총괄'
  sendDailyLeaveBriefing: true,
  sendDailyPnLBriefing: true
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

      const dateField = briefingType === "general" ? "lastSentDate" : "lastPnLSentDate";
      const lockField = briefingType === "general" ? "generalLock" : "pnlLock";

      // 1. If already completed today, skip
      if (data[dateField] === todayStr) {
        return { acquired: false, reason: "ALREADY_SENT_TODAY", lastSentDate: data[dateField] };
      }

      // 2. Check if actively locked by another instance in the last 90s
      const currentLock = data[lockField];
      if (currentLock && currentLock.date === todayStr && currentLock.status === "SENDING") {
        const lockedAtMs = currentLock.lockedAt ? new Date(currentLock.lockedAt).getTime() : 0;
        const nowMs = Date.now();
        if (nowMs - lockedAtMs < 90000) {
          return { acquired: false, reason: "LOCKED_BY_ANOTHER_INSTANCE", lockedBy: currentLock.lockedBy };
        }
      }

      // 3. Claim lock atomically
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
  const dateField = briefingType === "general" ? "lastSentDate" : "lastPnLSentDate";
  const lockField = briefingType === "general" ? "generalLock" : "pnlLock";
  const sentAtField = briefingType === "general" ? "sentAt" : "pnlSentAt";

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

async function sendTelegramMessage(token, chatId, text) {
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
    return { ok: response.ok && data.ok, data };
  } catch (err) {
    console.error("Telegram API send error:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Align exact execution to 07:30:00 KST
 * If the runner starts before 07:30 (e.g. 07:25 ~ 07:29:59), wait until 07:30:00 KST.
 */
async function alignToExact0730() {
  const info = getKSTTimeInfo();
  const targetSeconds = 7 * 3600 + 30 * 60; // 07:30:00 KST (27000 seconds)

  if (info.totalSeconds < targetSeconds) {
    const diffMs = (targetSeconds - info.totalSeconds) * 1000;
    if (diffMs <= 360000) { // If within 6 minutes, wait
      console.log(`[Runner Pre-Warm] Current KST ${info.hour}:${info.minute}:${info.second}. Waiting ${Math.round(diffMs / 1000)}s until 07:30:00 KST...`);
      await sleep(diffMs);
      console.log("[Runner Trigger] 07:30:00 KST reached! Dispatching immediately...");
    }
  }
}

export async function runAllBriefings(force = false) {
  console.log("=== Starting Scheduled Briefings Dispatcher ===");
  await alignToExact0730();

  const config = await getConfig();
  if (!config.enabled) {
    console.log("Telegram integration is disabled in config.");
    return;
  }

  const todayStr = getKSTDateString();
  const dateFormatted = `${getKSTFormattedString().split(" ")[0]} 07:30`;
  const customTemplates = await getCustomTemplates();

  // -------------------------------------------------------------
  // 1. 07:30 통합 모닝 브리핑 (오륙 통합방: -4186792536)
  // -------------------------------------------------------------
  if (config.sendDailyLeaveBriefing) {
    const lockRes = await acquireBriefingLock("general", todayStr, force);
    if (!lockRes.acquired) {
      console.log(`[오륙통합방 모닝브리핑] Skipping send: ${lockRes.reason}`);
    } else {
      console.log(`[오륙통합방 모닝브리핑] Lock acquired. Generating briefing for ${todayStr}...`);

      try {
        // 1-1. 연차 현황
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

        let leaveSummary = "없음 (전원 정상 출근)";
        if (activeLeaves.length > 0) {
          const list = activeLeaves.map((l) => {
            const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
            const typeShort = l.leaveType || "연차";
            return `${l.userName} ${l.title || "선임"}(${plantShort}/${typeShort})`;
          });
          leaveSummary = list.join(", ");
        }

        // 1-2. 미결재 현황
        let pendingDocs = [];
        try {
          const snap = await getDocs(collection(db, "approval_documents"));
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.status === "IN_PROGRESS" || d.status === "HOLD") {
              pendingDocs.push(d);
            }
          });
        } catch (e) {
          console.warn("Error fetching approvals:", e.message);
        }

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

        let approvalSummary = "없음 (전건 결재완료)";
        const totalPending = pendingDocs.length + pendingLogs.length;
        if (totalPending > 0) {
          const docTitles = pendingDocs.map((d) => d.title).filter(Boolean);
          const logTitles = pendingLogs.map((l) => `${l.writer} 업무일지`).filter(Boolean);
          const previewList = [...docTitles, ...logTitles].slice(0, 3);
          const moreText = totalPending > 3 ? ` 외 ${totalPending - 3}건` : "";
          approvalSummary = `총 ${totalPending}건 (${previewList.join(", ")}${moreText})`;
        }

        // 1-3. 품질경보 미조치 현황
        let urgentIssues = [];
        try {
          const snap = await getDocs(collection(db, "urgent_issues"));
          snap.forEach((docSnap) => {
            const i = docSnap.data();
            if (!i.isDeleted && !i.isResolved) {
              urgentIssues.push(i);
            }
          });
        } catch (e) {
          console.warn("Error fetching urgent issues:", e.message);
        }

        let urgentSummary = "없음 (전건 종결완료)";
        if (urgentIssues.length > 0) {
          const issueTitles = urgentIssues.map((i) => i.title || i.content).filter(Boolean);
          const previewList = issueTitles.slice(0, 2);
          const moreText = urgentIssues.length > 2 ? ` 외 ${activeUrgentIssues?.length ? activeUrgentIssues.length - 2 : urgentIssues.length - 2}건` : "";
          urgentSummary = `미조치 ${urgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
        }

        const savedUnifiedTemplate = customTemplates["unified_briefing"]?.text;
        const defaultGeneralMessage = `
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

        const generalMessage = savedUnifiedTemplate || defaultGeneralMessage;
        const res = await sendTelegramMessage(config.botToken, config.chatId || "-4186792536", generalMessage);
        console.log("[오륙통합방 모닝브리핑] Send Result:", res);

        if (res.ok) {
          await completeBriefingLock("general", todayStr, true);
        } else {
          await completeBriefingLock("general", todayStr, false, res.error || "TELEGRAM_SEND_FAILED");
        }
      } catch (err) {
        console.error("[오륙통합방 모닝브리핑] Error occurred:", err.message);
        await completeBriefingLock("general", todayStr, false, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. 07:30 손익결산 브리핑 (경영총괄: -1003939516875)
  // -------------------------------------------------------------
  if (config.sendDailyPnLBriefing) {
    const lockRes = await acquireBriefingLock("pnl", todayStr, force);
    if (!lockRes.acquired) {
      console.log(`[경영총괄 손익브리핑] Skipping send: ${lockRes.reason}`);
    } else {
      console.log(`[경영총괄 손익브리핑] Lock acquired. Generating PnL briefing for ${todayStr}...`);

      try {
        // 2-1. 태형&미영 일정 조회 (등록일부터 종료일까지 노출, 지난 일정 자동 삭제)
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

            // 일정이 지났으면 DB에서 자동 삭제
            if (endDate && endDate < todayStr) {
              try {
                await deleteDoc(doc(db, "company_common_schedules", docSnap.id));
              } catch (delErr) {
                console.warn(`Failed to auto-delete expired schedule ${docSnap.id}:`, delErr.message);
              }
              continue;
            }

            // 등록일(또는 시작일)부터 종료일까지 노출
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
                default: return { emoji: "💍", badge: target || "특별한 일정" };
              }
            };

            commonSchedules = todayScheds.map((s) => {
              const startDate = s.startDate || s.date;
              const endDate = s.endDate || startDate;
              const cat = getCategoryMeta(s.target);
              const timeStr = s.time && s.time !== "종일" ? ` [⏰ ${s.time}]` : "";
              const sFormatted = startDate.slice(5).replace("-", ".");
              const eFormatted = endDate.slice(5).replace("-", ".");
              if (startDate !== endDate) {
                return `• ${cat.emoji} [${sFormatted}~${eFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})`;
              } else if (startDate === todayStr) {
                return `• ${cat.emoji} [오늘]${timeStr} <b>${s.title}</b> (${cat.badge})`;
              } else {
                return `• ${cat.emoji} [${sFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})`;
              }
            }).join("\n");
          }
        } catch (e) {
          console.warn("Error fetching common schedules:", e.message);
        }

        if (!commonSchedules) {
          commonSchedules = "• 등록된 태형&미영 일정이 없습니다. ✨";
        }

        const savedPnLTemplate = customTemplates["management_pnl"]?.text;
        const defaultPnLMessage = `
<b>⬛ [오륙] 일일 아침 손익결산 브리핑</b>
<b>${dateFormatted} 기준</b>
━━━━━━━━━━━━━━━━━━━━━
<b>[1] 당월 매입 / 매출 결산 현황</b>
• <b>매출액:</b> ₩1,756,104,735원
• <b>매입액:</b> ₩1,248,400,885원
• <b>매출대비 원가율:</b> 71.1%

<b>[2] 전월 실적 대비 달성율</b>
• <b>전월대비 매출 달성율:</b> <b>102.4%</b>
• <b>전월대비 매입 달성율:</b> <b>98.7%</b>

<b>[3] 태형이랑 & 미영이랑</b>
${commonSchedules}
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>
`.trim();

        let pnlMessage = defaultPnLMessage;
        if (savedPnLTemplate) {
          let text = savedPnLTemplate;
          if (dateFormatted) {
            text = text.replace(/<b>\d{4}\.\d{2}\.\d{2}[^<]*?기준<\/b>/, `<b>${dateFormatted} 기준</b>`);
          }
          if (text.includes("{commonSchedules}")) {
            pnlMessage = text.replace(/\{commonSchedules\}/g, commonSchedules);
          } else if (text.includes("${commonSchedules}")) {
            pnlMessage = text.replace(/\$\{commonSchedules\}/g, commonSchedules);
          } else {
            const section3Regex = /(<b>\[3\][^<]*?<\/b>|\[3\][^\n]*\n)([\s\S]*?)(?=(━━━━━━━━━━━━━━━━━━━━━|<a\s+href|$))/i;
            if (section3Regex.test(text)) {
              pnlMessage = text.replace(section3Regex, `$1\n${commonSchedules}\n`);
            } else {
              pnlMessage = `${text}\n\n<b>[3] 태형이랑 & 미영이랑</b>\n${commonSchedules}`;
            }
          }
        }
        const res = await sendTelegramMessage(config.botToken, config.pnlChatId || "-1003939516875", pnlMessage);
        console.log("[경영총괄 손익브리핑] Send Result:", res);

        if (res.ok) {
          await completeBriefingLock("pnl", todayStr, true);
        } else {
          await completeBriefingLock("pnl", todayStr, false, res.error || "TELEGRAM_SEND_FAILED");
        }
      } catch (err) {
        console.error("[경영총괄 손익브리핑] Error occurred:", err.message);
        await completeBriefingLock("pnl", todayStr, false, err.message);
      }
    }
  }

  console.log("=== Scheduled Briefings Dispatch Finished ===");
}

// CLI Runner
const isForce = process.argv.includes("--force");
await runAllBriefings(isForce);
process.exit(0);
