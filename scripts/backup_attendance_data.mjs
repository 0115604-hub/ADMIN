import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function runBackup() {
  console.log("📦 Starting complete attendance & overtime data backup...");
  const backupDir = path.resolve("scripts/backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    smart_overtime_ledger: {},
    overtime_reports: {},
    approval_docs: {}
  };

  // 1. smart_overtime_ledger
  console.log("Reading smart_overtime_ledger...");
  const ledgerSnap = await getDocs(collection(db, "smart_overtime_ledger"));
  ledgerSnap.forEach((doc) => {
    backupData.smart_overtime_ledger[doc.id] = doc.data();
  });
  console.log(`  -> Backed up ${Object.keys(backupData.smart_overtime_ledger).length} ledger documents.`);

  // 2. overtime_reports
  console.log("Reading overtime_reports...");
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  repSnap.forEach((doc) => {
    backupData.overtime_reports[doc.id] = doc.data();
  });
  console.log(`  -> Backed up ${Object.keys(backupData.overtime_reports).length} report documents.`);

  // 3. approval_docs (overtime only)
  console.log("Reading approval_docs...");
  const appSnap = await getDocs(collection(db, "approval_docs"));
  appSnap.forEach((doc) => {
    const data = doc.data();
    if (data.type === "overtime" || data.category === "근태" || data.title?.includes("근태") || data.title?.includes("특근")) {
      backupData.approval_docs[doc.id] = data;
    }
  });
  console.log(`  -> Backed up ${Object.keys(backupData.approval_docs).length} approval documents.`);

  const filePath = path.join(backupDir, `attendance_backup_${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`✅ Backup successfully saved to ${filePath}`);
}

runBackup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  });
