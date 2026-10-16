import { db } from "../src/firebase.js";
import { doc, getDoc } from "firebase/firestore";

async function check() {
  const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", "overtime_2026_10"));
  const matrix = ledgerSnap.data().attendanceMatrix;

  for (const comp of ["오륙", "한울", "부림텍"]) {
    const repSnap = await getDoc(doc(db, "overtime_reports", `report_${comp}_2026_10_16`));
    const rep = repSnap.data();
    const compWorkers = matrix.filter(w => w.company.includes(comp));
    const matrixNames = compWorkers.map(w => w.name.trim());
    const repNames = (rep.items || []).map(it => (it.workerName || it.name).trim());
    console.log(`=== ${comp} ===`);
    console.log("Matrix count:", matrixNames.length, "Rep count:", repNames.length);
    const missingInRep = matrixNames.filter(n => !repNames.includes(n));
    const missingInMatrix = repNames.filter(n => !matrixNames.includes(n));
    if (missingInRep.length > 0) console.log("Missing in Rep:", missingInRep);
    if (missingInMatrix.length > 0) console.log("Missing in Matrix:", missingInMatrix);
  }
}
check().then(() => process.exit(0));
