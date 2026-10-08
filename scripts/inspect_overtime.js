import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function inspectCollections() {
  console.log("=== Inspecting overtime_reports ===");
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  console.log(`Found ${repSnap.size} reports in overtime_reports:`);
  repSnap.forEach((d) => {
    const data = d.data();
    console.log(` - ID: ${d.id}, title: ${data.title}, workDate: ${data.workDate}, company: ${data.company}, itemsCount: ${data.items?.length || 0}`);
  });

  console.log("\n=== Inspecting smart_overtime_ledger ===");
  const ledgerSnap = await getDocs(collection(db, "smart_overtime_ledger"));
  console.log(`Found ${ledgerSnap.size} ledgers in smart_overtime_ledger:`);
  ledgerSnap.forEach((d) => {
    const data = d.data();
    console.log(` - ID: ${d.id}, year: ${data.year}, month: ${data.month}, matrixCount: ${data.attendanceMatrix?.length || 0}`);
  });

  console.log("\n=== Inspecting approval_documents_v1 ===");
  const apprSnap = await getDocs(collection(db, "approval_documents_v1"));
  console.log(`Found ${apprSnap.size} approval docs in approval_documents_v1:`);
  apprSnap.forEach((d) => {
    const data = d.data();
    if (data.type === "OVERTIME" || data.docType === "OVERTIME" || data.category?.includes("특근") || data.category?.includes("근태")) {
      console.log(` - ID: ${d.id}, title: ${data.title}, type: ${data.type}`);
    }
  });

  process.exit(0);
}

inspectCollections().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
