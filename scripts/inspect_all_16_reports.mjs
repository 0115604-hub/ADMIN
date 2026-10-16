import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function inspectAll16Reports() {
  const ids = [
    "report_오륙_2026_10_16",
    "report_유성_2026_10_16",
    "report_한울_2026_10_16",
    "report_부림텍_2026_10_16"
  ];
  for (const id of ids) {
    const snap = await getDoc(doc(db, "overtime_reports", id));
    if (snap.exists()) {
      const data = snap.data();
      console.log(`\n=================== ${id} ===================`);
      console.log(`Keys:`, Object.keys(data));
      console.log(`Author: ${data.author}, title: ${data.title}, date: ${data.workDate}, plant: ${data.plant}, totalHours: ${data.totalHours}`);
      console.log(`workers:`, Array.isArray(data.workers) ? data.workers.length : typeof data.workers);
      console.log(`reasons:`, data.reasons);
      console.log(`company:`, data.company);
    }
  }
}
inspectAll16Reports().then(() => process.exit(0));
