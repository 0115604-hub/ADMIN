import { db } from "../src/firebase.js";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

async function inspectAttendanceDetails() {
  const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"));
  if (ledgerSnap.exists()) {
    const data = ledgerSnap.data();
    const matrix = data.attendanceMatrix || [];
    const hanulWorkers = matrix.filter((w) => (w.company || "").includes("한울"));
    
    console.log("=== [한울 근로자 26명 전원 20일 근태 상세 코드] ===");
    hanulWorkers.forEach((w, i) => {
      console.log(`${i + 1}. ${w.name} (${w.position || "사원"}): 20일 코드="${w.daily?.[20] || w.daily?.["20"]}" (19일: "${w.daily?.[19]}", 21일: "${w.daily?.[21]}")`);
    });
  }
}

inspectAttendanceDetails().catch(console.error);
