import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function inspectReports() {
  const ids = [
    "report_오륙_2026_10_16",
    "report_유성_2026_10_16",
    "report_한울_2026_10_16",
    "report_부림텍_2026_10_16",
    "report_조영_2026_10_16"
  ];
  for (const id of ids) {
    const snap = await getDoc(doc(db, "overtime_reports", id));
    if (snap.exists()) {
      const d = snap.data();
      console.log(`\n=== ${id} ===`);
      console.log(`company: ${d.company}, plant: ${d.plant}, workDate: ${d.workDate}, totalHours: ${d.totalHours}`);
      console.log(`workers array length: ${(d.workers || []).length}`);
      if (d.workers && d.workers.length > 0) {
        console.log(`sample worker: ${JSON.stringify(d.workers[0])}`);
      }
      console.log(`dailyAttendance: ${d.dailyAttendance ? Object.keys(d.dailyAttendance).length : 'none'}`);
    } else {
      console.log(`\n=== ${id} DOES NOT EXIST ===`);
    }
  }
}

inspectReports().then(() => process.exit(0));
