import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function checkLedgerMetadata() {
  const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"));
  if (ledgerSnap.exists()) {
    const data = ledgerSnap.data();
    console.log("updatedAt:", data.updatedAt);
    console.log("lastModifiedBy:", data.lastModifiedBy || data.updatedBy || "미상");
    console.log("auditLog length:", data.auditLogs?.length || 0);
    if (data.auditLogs && data.auditLogs.length > 0) {
      console.log("Recent audit logs:");
      data.auditLogs.slice(-5).forEach((log) => console.log(" -", JSON.stringify(log)));
    }
  }
}

checkLedgerMetadata().catch(console.error);
