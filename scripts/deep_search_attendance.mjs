import { db } from "../src/firebase.js";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

async function deepSearchAttendance() {
  console.log("=== 1. Checking all smart_overtime_ledger docs ===");
  const ledgerSnap = await getDocs(collection(db, "smart_overtime_ledger"));
  ledgerSnap.forEach(d => {
    const data = d.data();
    console.log(`- Doc: ${d.id}, updatedAt: ${data.updatedAt}, workers: ${(data.attendanceMatrix || []).length}`);
  });

  console.log("\n=== 2. Checking all overtime_reports with 2026-10 ===");
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  const repList = [];
  repSnap.forEach(d => {
    const data = d.data();
    repList.push({ id: d.id, comp: data.company, date: data.workDate, workers: (data.workers || []).length, hours: data.totalHours, updatedAt: data.updatedAt });
  });
  repList.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  repList.slice(0, 20).forEach(r => console.log(JSON.stringify(r)));

  console.log("\n=== 3. Checking other attendance-related collections ===");
  const collectionsToCheck = [
    "daily_attendance", "attendance", "work_logs", "company_attendance", "overtime_records", "attendance_records"
  ];
  for (const c of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection '${c}': ${snap.size} documents`);
      snap.forEach(d => console.log(`   [${c}/${d.id}]`, JSON.stringify(d.data()).slice(0, 100)));
    } catch(e) {
      console.log(`Collection '${c}': error or does not exist`);
    }
  }
}

deepSearchAttendance().then(() => process.exit(0));
