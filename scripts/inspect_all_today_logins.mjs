import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function inspectAllTodayLogins() {
  const snap = await getDocs(collection(db, "user_access_logs"));
  console.log("=== [오늘(2026-10-20) 시스템에 로그인/접속한 모든 계정 내역] ===");
  let count = 0;
  snap.forEach((d) => {
    const data = d.data();
    const logs = data.logs || [];
    const todayLogs = logs.filter((l) => (l.timestamp || "").includes("2026. 10. 20") || (l.timestamp || "").includes("10. 20"));
    if (todayLogs.length > 0) {
      count++;
      console.log(`\n계정: ${data.userName || d.id} (ID: ${d.id}, 회사/소속: ${data.company || data.plant || "미상"})`);
      todayLogs.forEach((tl) => {
        console.log(` - 시간: ${tl.timestamp} | ${tl.action || "접속"} | ${tl.device || "기기"}`);
      });
    }
  });
  console.log(`\n총 오늘 로그인한 계정 수: ${count}개`);
}

inspectAllTodayLogins().catch(console.error);
