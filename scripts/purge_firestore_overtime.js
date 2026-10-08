import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { INITIAL_SMART_OVERTIME_DATA } from "../src/data/masterOvertimeSmartData.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: "profit-and-loss-7d09b.firebaseapp.com",
  projectId: "profit-and-loss-7d09b",
  storageBucket: "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: "751528745146",
  appId: "1:751528745146:web:c9bc019f965942b3eaca83",
  measurementId: "G-2XSENS7QCB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function purgeAllOvertime() {
  console.log("=== 1. Deleting all reports from overtime_reports ===");
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  let deletedRepCount = 0;
  for (const docSnap of repSnap.docs) {
    await deleteDoc(doc(db, "overtime_reports", docSnap.id));
    deletedRepCount++;
    console.log(`Deleted report doc: ${docSnap.id}`);
  }
  console.log(`Successfully deleted ${deletedRepCount} reports from overtime_reports.`);

  console.log("\n=== 2. Purging/Resetting smart_overtime_ledger ===");
  const ledgerSnap = await getDocs(collection(db, "smart_overtime_ledger"));
  for (const docSnap of ledgerSnap.docs) {
    await deleteDoc(doc(db, "smart_overtime_ledger", docSnap.id));
    console.log(`Deleted ledger doc: ${docSnap.id}`);
  }

  // Create clean empty ledger documents for 2026-10 and 2026-09
  const cleanWorkers = INITIAL_SMART_OVERTIME_DATA.masterWorkers.map((w, idx) => ({
    ...w,
    no: idx + 1
  }));
  const cleanMatrix = INITIAL_SMART_OVERTIME_DATA.masterWorkers.map((w, idx) => ({
    no: idx + 1,
    company: w.company,
    dept: w.dept,
    line: w.line,
    name: w.name,
    position: w.position || "작업원",
    daily: {}
  }));

  await setDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"), {
    year: 2026,
    month: 10,
    masterWorkers: cleanWorkers,
    attendanceMatrix: cleanMatrix,
    updatedAt: new Date().toISOString()
  });
  console.log("Created clean empty ledger for overtime_2026_10 with 143 workers.");

  await setDoc(doc(db, "smart_overtime_ledger", "overtime_2026_09"), {
    year: 2026,
    month: 9,
    masterWorkers: cleanWorkers,
    attendanceMatrix: cleanMatrix,
    updatedAt: new Date().toISOString()
  });
  console.log("Created clean empty ledger for overtime_2026_09 with 143 workers.");

  console.log("\n=== 3. Deleting overtime approval docs from approval_documents_v1 ===");
  const apprSnap = await getDocs(collection(db, "approval_documents_v1"));
  let deletedApprCount = 0;
  for (const docSnap of apprSnap.docs) {
    const data = docSnap.data();
    if (data.type === "OVERTIME" || data.docType === "OVERTIME" || docSnap.id.startsWith("appr_ot_") || data.category?.includes("특근") || data.category?.includes("근태")) {
      await deleteDoc(doc(db, "approval_documents_v1", docSnap.id));
      deletedApprCount++;
      console.log(`Deleted approval doc: ${docSnap.id}`);
    }
  }
  console.log(`Successfully deleted ${deletedApprCount} overtime approval docs.`);

  console.log("\n=== ALL OVERTIME DUMMY & EXISTING DATA PERMANENTLY PURGED! ===");
  process.exit(0);
}

purgeAllOvertime().catch((err) => {
  console.error("Purge Error:", err);
  process.exit(1);
});
