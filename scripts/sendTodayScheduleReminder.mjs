import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: "profit-and-loss-7d09b.firebaseapp.com",
  projectId: "profit-and-loss-7d09b",
  storageBucket: "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: "751528745146",
  appId: "1:751528745146:web:c9bc019f965942b3eaca83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_CONFIG = {
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  pnlChatId: "-1003939516875"
};

function getKSTDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getKSTFormattedDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";
  const yyyy = getPart("year");
  const mm = getPart("month");
  const dd = getPart("day");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateObj = new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
  const dayName = days[dateObj.getDay()];
  return `${yyyy}년 ${mm}월 ${dd}일 (${dayName})`;
}

function getScheduleCategoryMeta(target) {
  switch (target) {
    case "맛집":
      return { badge: "맛집 탐방", emoji: "🍽️", phrase: "맛있는 음식과 함께하는 행복한 시간" };
    case "여행":
      return { badge: "여행 / 힐링", emoji: "✈️", phrase: "도심을 벗어나 둘만의 힐링 여행" };
    case "세미나":
      return { badge: "세미나", emoji: "💼", phrase: "새로운 비전과 도약을 위한 자리" };
    case "교육":
      return { badge: "교육 / 역량", emoji: "📚", phrase: "함께 배우고 성장하는 시간" };
    case "기타":
    default:
      return { badge: target || "공통 일정", emoji: "📌", phrase: "사내 공통 일정" };
  }
}

async function main() {
  console.log("=== Sending Today's Common Schedule Reminder to 경영방 ===");
  const todayStr = getKSTDateString();
  const dateFormatted = getKSTFormattedDate();

  const snap = await getDocs(collection(db, "company_common_schedules"));
  const todayScheds = [];

  snap.forEach(docSnap => {
    const s = docSnap.data();
    if (s.isCompleted) return;
    const startDate = s.startDate || s.date;
    const endDate = s.endDate || startDate;
    if (startDate && endDate && startDate <= todayStr && todayStr <= endDate) {
      todayScheds.push({ id: docSnap.id, ...s });
    }
  });

  console.log(`Found ${todayScheds.length} schedules for today (${todayStr}):`, todayScheds);

  if (todayScheds.length === 0) {
    console.log("No common schedules for today.");
    process.exit(0);
  }

  todayScheds.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const scheduleLines = todayScheds.map((s, idx) => {
    const cat = getScheduleCategoryMeta(s.target);
    const timeDisplay = s.time && s.time !== "종일" ? `⏰ ${s.time}` : "🌅 종일";
    const authorText = s.author ? ` (${s.author})` : "";
    return `• <b>${idx + 1}. [${cat.badge}] ${timeDisplay}</b> - <b>${s.title || "사내 공통일정"}</b>${authorText}`;
  }).join("\n");

  const message = `
✨ <b>𝕋𝕒𝕖𝕙𝕪𝕦𝕟𝕘 & 𝕄𝕚𝕪𝕠𝕦𝕟𝕘</b> ✨
━━━━━━━━━━━━━━━━━━━━━
🔔 <b>[당일 공통일정 리마인드 알림]</b> 🥂
━━━━━━━━━━━━━━━━━━━━━
📅 <b>기준일자:</b> <b>${dateFormatted}</b>

<b>[오늘 예정된 공통일정 안내 (${todayScheds.length}건)]</b>
${scheduleLines}

💌 <i>"오늘 예정된 소중한 일정과 함께 뜻깊고 행복한 하루 되시길 바랍니다 ✨"</i>
━━━━━━━━━━━━━━━━━━━━━
<a href="https://profit-and-loss-7d09b.web.app">📌 공통일정 확인 및 의견등록 바로가기</a>
`.trim();

  let botToken = DEFAULT_CONFIG.botToken;
  let pnlChatId = DEFAULT_CONFIG.pnlChatId;
  try {
    const cfgSnap = await getDoc(doc(db, "system_config", "telegram"));
    if (cfgSnap.exists()) {
      const c = cfgSnap.data();
      if (c.botToken) botToken = c.botToken;
      if (c.pnlChatId) pnlChatId = c.pnlChatId;
    }
  } catch (e) {}

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: pnlChatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  const resJson = await response.json();
  console.log("Telegram API Result:", JSON.stringify(resJson, null, 2));

  if (resJson.ok) {
    console.log("✅ Successfully sent reminder to 경영방!");
  } else {
    console.error("❌ Failed to send:", resJson.description);
  }
}

main().catch(err => {
  console.error("Error in main:", err);
  process.exit(1);
});
