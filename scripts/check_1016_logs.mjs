import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function check1016Logs() {
  const snap = await getDocs(collection(db, "work_logs"));
  console.log("Work logs for 2026-10-16:");
  snap.forEach(d => {
    const data = d.data();
    if (data.date === "2026-10-16" || data.createdAt?.includes("10. 16")) {
      console.log(`- ID: ${d.id}, writer: ${data.writer}, plant: ${data.plant}, dept: ${data.department}, date: ${data.date}`);
    }
  });
}
check1016Logs().then(() => process.exit(0));
