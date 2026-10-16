import { db } from "../src/firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_INCIDENT_LOGS } from "../src/services/incidentLogService.js";

async function syncIncidentLogs() {
  console.log(`Syncing ${DEFAULT_INCIDENT_LOGS.length} incident logs to Firestore...`);
  const ref = doc(db, "system_management", "incident_logs");
  await setDoc(ref, {
    logs: DEFAULT_INCIDENT_LOGS,
    updatedAt: new Date().toISOString()
  });
  console.log("✅ Firestore system_management/incident_logs sync complete!");
}

syncIncidentLogs().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
