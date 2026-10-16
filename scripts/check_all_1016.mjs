import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function checkAll1016() {
  const snap = await getDocs(collection(db, "overtime_reports"));
  console.log("All reports with 2026-10-16:");
  snap.forEach(d => {
    const r = d.data();
    if (r.workDate === "2026-10-16" || d.id.includes("2026_10_16") || d.id.includes("20261016")) {
      console.log(`- ID: ${d.id}, company: ${r.company}, plant: ${r.plant}, title: ${r.title}, author: ${r.author}`);
    }
  });
}
checkAll1016().then(() => process.exit(0));
