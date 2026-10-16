import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function inspectJoyoung15() {
  const snap = await getDoc(doc(db, "overtime_reports", "report_조영_2026_10_15"));
  if (snap.exists()) {
    console.log("report_조영_2026_10_15:", JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("report_조영_2026_10_15 does not exist");
  }
}
inspectJoyoung15().then(() => process.exit(0));
