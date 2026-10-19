import { db } from "../src/firebase.js";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { INITIAL_SMART_OVERTIME_DATA } from "../src/data/masterOvertimeSmartData.js";

async function resetAttendance() {
  console.log("🔥 Starting permanent deletion and clean reset of 2026-10 Attendance & Overtime...");

  // 1. Reset smart_overtime_ledger/overtime_2026_10 with clean empty daily matrices
  console.log("Resetting smart_overtime_ledger for 2026-10...");
  const cleanAttendanceMatrix = INITIAL_SMART_OVERTIME_DATA.masterWorkers.map((w, idx) => ({
    no: idx + 1,
    company: w.company,
    dept: w.dept,
    line: w.line || "",
    name: w.name,
    position: w.position || "사원",
    daily: {}
  }));

  const cleanLedgerDoc = {
    year: 2026,
    month: 10,
    masterWorkers: INITIAL_SMART_OVERTIME_DATA.masterWorkers,
    attendanceMatrix: cleanAttendanceMatrix,
    companyApprovalStatus: {}, // Clean 1-step approval status
    updatedAt: new Date().toISOString(),
    resetAt: new Date().toISOString()
  };

  await setDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"), cleanLedgerDoc);
  console.log(`  ✅ smart_overtime_ledger/overtime_2026_10 reset with ${cleanAttendanceMatrix.length} clean workers.`);

  // 2. Permanently delete all 2026-10 reports from overtime_reports
  console.log("Deleting all 2026-10 documents from overtime_reports...");
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  let deletedRepCount = 0;
  for (const repDoc of repSnap.docs) {
    const data = repDoc.data();
    const wDate = String(data.workDate || data.workDateFormatted || data.title || "");
    if (wDate.includes("2026-10") || wDate.includes("10월") || repDoc.id.includes("2026_10") || repDoc.id.includes("2026-10")) {
      await deleteDoc(doc(db, "overtime_reports", repDoc.id));
      deletedRepCount++;
    }
  }
  console.log(`  ✅ Permanently deleted ${deletedRepCount} overtime_reports for 2026-10.`);

  // 3. Permanently delete any legacy overtime approval documents from approval_docs
  console.log("Checking approval_docs for legacy overtime documents...");
  const appSnap = await getDocs(collection(db, "approval_docs"));
  let deletedAppCount = 0;
  for (const appDoc of appSnap.docs) {
    const data = appDoc.data();
    if (data.type === "overtime" || data.category === "근태" || data.title?.includes("근태") || data.title?.includes("특근")) {
      await deleteDoc(doc(db, "approval_docs", appDoc.id));
      deletedAppCount++;
    }
  }
  console.log(`  ✅ Permanently deleted ${deletedAppCount} approval_docs for overtime.`);

  console.log("🎉 Complete permanent deletion and clean reset finished successfully!");
}

resetAttendance()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  });
