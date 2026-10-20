import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function checkApprovalStatus() {
  const snap = await getDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"));
  if (snap.exists()) {
    const data = snap.data();
    const appStatus = data.companyApprovalStatus || {};
    console.log("=== [smart_overtime_ledger companyApprovalStatus 현황] ===");
    const companies = ["오륙", "유성", "조영", "한울", "부림텍"];
    companies.forEach((comp) => {
      const key = `${comp}_20`;
      const val = appStatus[key];
      console.log(`- ${comp} 20일 상태 (${key}):`, val ? JSON.stringify(val) : "없음 (미상신)");
    });
    console.log("\n전체 존재하는 approval keys:");
    Object.keys(appStatus).sort().forEach((k) => {
      console.log(` • ${k}: ${JSON.stringify(appStatus[k])}`);
    });
  }
}

checkApprovalStatus().catch(console.error);
