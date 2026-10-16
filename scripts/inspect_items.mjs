import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function inspectItems() {
  const ids = [
    "report_오륙_2026_10_16",
    "report_한울_2026_10_16",
    "report_부림텍_2026_10_16"
  ];
  for (const id of ids) {
    const snap = await getDoc(doc(db, "overtime_reports", id));
    if (snap.exists()) {
      const d = snap.data();
      console.log(`\n=================== ${id} ===================`);
      const items = d.items || d.workers || [];
      console.log(`items length: ${items.length}`);
      if (items.length > 0) {
        console.log(`First 3 items:`);
        items.slice(0, 3).forEach(it => {
          console.log(`- name: ${it.workerName || it.name}, code: ${it.attendanceCode || it.code}, hours: ${it.hours}, ot: ${it.otHours}`);
        });
      }
    }
  }
}
inspectItems().then(() => process.exit(0));
