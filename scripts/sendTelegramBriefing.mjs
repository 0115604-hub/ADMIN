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
  let urgentLabel = "품질경보 미조치";
  if (urgentIssues.length > 0) {
    urgentLabel = "🟥 품질경보 미조치";
    const issueTitles = urgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = urgentIssues.length > 2 ? ` 외 ${urgentIssues.length - 2}건` : "";
    urgentSummary = `총 ${urgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }

  const message = `
<b>[오륙MES 일일 모닝 브리핑]</b>
<b>${dateFormatted}</b>
----------------------------------------
• <b>금일 연차자:</b> ${leaveSummary}
• <b>전일 미결재:</b> ${approvalSummary}
• <b>${urgentLabel}:</b> ${urgentSummary}
----------------------------------------
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

export async function runPnLBriefing(force = false) {
  console.log("--- Starting P&L Briefing (07:00) Check ---");
  const config = await getConfig();
  if (!config.enabled || !config.sendDailyPnLBriefing || !config.pnlChatId) {
    console.log("P&L briefing disabled or pnlChatId missing in config.");
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

  if (!force) {
    try {
      const snap = await getDoc(doc(db, "system_config", "daily_pnl_briefing"));
      if (snap.exists() && snap.data().lastSentDate === todayStr) {
        console.log(`P&L briefing already sent today (${todayStr}). Skipping.`);
        return;
      }
    } catch (e) {
      console.warn("Could not check lastSentDate:", e.message);
    }
  }

  const mergedStore = { ...initialMultiMonthData };
  const availableMonths = Object.keys(mergedStore).sort().reverse();
  const monthKey = availableMonths[0] || "2026-08";
  const monthData = mergedStore[monthKey] || {};

  const totalSales = monthData.salesSummary?.totalSales || 0;
  const totalExpenses = monthData.purchaseSummary?.ledgerBenchmark || monthData.jajaeSummary?.totalAmount || monthData.purchaseSummary?.totalExpenses || Math.round(totalSales * 0.75);

  const rawMaterial = Math.round(totalExpenses * 0.678);
  const generalExpense = Math.round(totalExpenses * 0.242);
  const sgaExpense = totalExpenses - rawMaterial - generalExpense;

  const operatingProfit = totalSales - totalExpenses;
  const marginRate = totalSales > 0 ? ((operatingProfit / totalSales) * 100).toFixed(1) : "0.0";

  const rawPercent = totalExpenses > 0 ? ((rawMaterial / totalSales) * 100).toFixed(1) : "0.0";
  const genPercent = totalExpenses > 0 ? ((generalExpense / totalSales) * 100).toFixed(1) : "0.0";
  const sgaPercent = totalExpenses > 0 ? ((sgaExpense / totalSales) * 100).toFixed(1) : "0.0";

  const prevMonthIndex = availableMonths.indexOf(monthKey) + 1;
  const prevMonthKey = availableMonths[prevMonthIndex];
  let diffText = "전월 데이터 산출 중";
  if (prevMonthKey && mergedStore[prevMonthKey]) {
    const prevData = mergedStore[prevMonthKey];
    const prevSales = prevData.salesSummary?.totalSales || 0;
    const prevExpenses = prevData.purchaseSummary?.ledgerBenchmark || prevData.jajaeSummary?.totalAmount || Math.round(prevSales * 0.75);
    const prevProfit = prevSales - prevExpenses;
    const diff = operatingProfit - prevProfit;
    const diffRate = prevProfit > 0 ? (((operatingProfit - prevProfit) / prevProfit) * 100).toFixed(1) : "0.0";
    if (diff >= 0) {
      diffText = `+${formatKoreanCurrency(diff)} (+${diffRate}% 증가)`;
    } else {
      diffText = `${formatKoreanCurrency(diff)} (${diffRate}% 감소)`;
    }
  }

  const [y, m] = monthKey.split("-");
  const monthFormatted = `${y}년 ${m}월`;

  const message = `
<b>[오륙MES ${monthFormatted} 월간 손익 결산]</b>
<b>기준: ${monthFormatted} 마감 확정 (07:00)</b>
----------------------------------------
• <b>총매출액:</b> ${formatKoreanCurrency(totalSales)}
• <b>총지출비용:</b> ${formatKoreanCurrency(totalExpenses)}
  - 원자재/매입: ${formatKoreanCurrency(rawMaterial)} (${rawPercent}%)
  - 일반제조경비: ${formatKoreanCurrency(generalExpense)} (${genPercent}%)
  - 판관비 및 기타: ${formatKoreanCurrency(sgaExpense)} (${sgaPercent}%)
----------------------------------------
• <b>당월 영업이익:</b> <b>${formatKoreanCurrency(operatingProfit)}</b> (영업이익률: <b>${marginRate}%</b>)
• <b>전월 대비:</b> ${diffText}
----------------------------------------
<a href="https://profit-and-loss-7d09b.web.app">손익계산서 상세조회</a>
`.trim();

  const res = await sendTelegramMessage(config.botToken, config.pnlChatId, message);
  console.log("P&L briefing send result:", res);

  if (res.ok) {
    try {
      await setDoc(doc(db, "system_config", "daily_pnl_briefing"), {
        lastSentDate: todayStr,
        sentAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Saved lastSentDate=${todayStr} for PnL in Firestore.`);
    } catch (e) {
      console.warn("Failed to update daily_pnl_briefing timestamp:", e.message);
    }
  }
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
