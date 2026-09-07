import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read multiMonthMasterData
const masterDataPath = path.resolve(__dirname, "../src/data/multiMonthMasterData.json");
let initialMultiMonthData = {};
try {
  initialMultiMonthData = JSON.parse(fs.readFileSync(masterDataPath, "utf-8"));
} catch (e) {
  console.warn("Failed to load multiMonthMasterData:", e.message);
}

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

const DEFAULT_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-4186792536", // '오륙 통합방'
  pnlChatId: "-1003939516875", // '경영방' 단톡방
  sendDailyLeaveBriefing: true,
  sendDailyPnLBriefing: true
};

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

async function sendTelegramMessage(token, chatId, text) {
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
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
}

function formatKoreanCurrency(amount) {
  if (amount === 0 || !amount) return "0원";
  const abs = Math.abs(amount);
  const eok = Math.floor(abs / 100000000);
  const man = Math.round((abs % 100000000) / 10000);

  let result = "";
  if (eok > 0) result += `${eok}억 `;
  if (man > 0 || eok === 0) result += `${man.toLocaleString("ko-KR")}만원`;
  return amount < 0 ? `-${result.trim()}` : result.trim();
}

export async function runMorningBriefing(force = false) {
  console.log("--- Starting Morning Briefing (07:30) Check ---");
  const config = await getConfig();
  if (!config.enabled || !config.sendDailyLeaveBriefing) {
    console.log("Morning briefing disabled in config.");
    return;
  }

  // Get current date in KST (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60; // in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstDate = new Date(utc + (kstOffset * 60000));

  const yyyy = kstDate.getFullYear();
  const mm = String(kstDate.getMonth() + 1).padStart(2, "0");
  const dd = String(kstDate.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = daysOfWeek[kstDate.getDay()];
  const dateFormatted = `${yyyy}.${mm}.${dd}(${dayName}) 07:30`;

  // Check if already sent today in Firestore
  if (!force) {
    try {
      const snap = await getDoc(doc(db, "system_config", "daily_briefing"));
      if (snap.exists() && snap.data().lastSentDate === todayStr) {
        console.log(`Morning briefing already sent today (${todayStr}). Skipping.`);
        return;
      }
    } catch (e) {
      console.warn("Could not check lastSentDate:", e.message);
    }
  }

  // 1. 연차 현황
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

  // 2. 미결재 현황
  let pendingDocs = [];
  try {
    const snap = await getDocs(collection(db, "approval_docs"));
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

  // 3. 품질경보 미조치 현황
  let urgentIssues = [];
  try {
    const snap = await getDocs(collection(db, "urgent_issues"));
    snap.forEach((docSnap) => {
      const i = docSnap.data();
      urgentIssues.push(i);
    });
  } catch (e) {
    console.warn("Error fetching urgent issues:", e.message);
  }

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

  const res = await sendTelegramMessage(config.botToken, config.chatId, message);
  console.log("Morning briefing send result:", res);

  if (res.ok) {
    try {
      await setDoc(doc(db, "system_config", "daily_briefing"), {
        lastSentDate: todayStr,
        sentAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Saved lastSentDate=${todayStr} in Firestore.`);
    } catch (e) {
      console.warn("Failed to update daily_briefing timestamp:", e.message);
    }
  }
}

export async function runPnLBriefing() {
  console.log("P&L / 경영정보공유 briefing is disabled by user settings. Skipping send.");
  return;
}

// CLI Runner
const action = process.argv[2];
if (action === "morning") {
  await runMorningBriefing(process.argv.includes("--force"));
  process.exit(0);
} else if (action === "pnl") {
  await runPnLBriefing(process.argv.includes("--force"));
  process.exit(0);
} else if (action === "all") {
  await runPnLBriefing(process.argv.includes("--force"));
  await runMorningBriefing(process.argv.includes("--force"));
  process.exit(0);
} else {
  console.log("Usage: node scripts/sendTelegramBriefing.mjs [morning|pnl|all] [--force]");
  process.exit(1);
}
