import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function checkJoyoung() {
  const snap = await getDocs(collection(db, "overtime_reports"));
  console.log("All Joyoung / Hallim reports in overtime_reports:");
  snap.forEach(d => {
    const r = d.data();
    if ((r.company && r.company.includes("조영")) || (r.plant && r.plant.includes("한림"))) {
      console.log(`- ID: ${d.id}, company: ${r.company}, date: ${r.workDate}, hours: ${r.totalHours}`);
    }
  });
}
checkJoyoung().then(() => process.exit(0));
