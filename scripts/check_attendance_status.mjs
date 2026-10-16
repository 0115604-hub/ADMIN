import { db } from "../src/firebase.js";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { cleanCompanyName } from "../src/services/overtimeSmartService.js";

async function checkAttendance() {
  const COMPANIES = ["오륙", "조영", "한울", "유성", "부림텍"];
  const docId = "overtime_2026_10";
  const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", docId));
  
  if (!ledgerSnap.exists()) {
    console.log(`❌ smart_overtime_ledger/${docId} does not exist!`);
  } else {
    const data = ledgerSnap.data();
    const matrix = data.attendanceMatrix || [];
    console.log(`\n=== smart_overtime_ledger/${docId} ===`);
    console.log(`Total workers in matrix: ${matrix.length}`);

    // Check Day 16 (and Day 15) for each company
    for (const day of [15, 16]) {
      console.log(`\n--- Day ${day} (2026-10-${day}) Attendance in Matrix ---`);
      for (const comp of COMPANIES) {
        const workers = matrix.filter(w => cleanCompanyName(w.company) === comp);
        const filled = workers.filter(w => {
          const code = w.daily?.[day] || w.daily?.[String(day)];
          return code && code !== "-" && code !== "미입력";
        });
        const empty = workers.filter(w => {
          const code = w.daily?.[day] || w.daily?.[String(day)];
          return !code || code === "-" || code === "미입력";
        });
        console.log(`• ${comp} (총 ${workers.length}명): 입력완료 ${filled.length}명, 미입력/휴무 ${empty.length}명`);
        if (filled.length > 0 && filled.length <= 5) {
          console.log(`   입력된 예시: ${filled.map(w => `${w.name}(${w.daily?.[day] || w.daily?.[String(day)]})`).join(", ")}`);
        }
      }
    }
  }

  // Check overtime_reports for 2026-10-16
  console.log(`\n=== overtime_reports for 2026-10-16 and recent days ===`);
  const repSnap = await getDocs(collection(db, "overtime_reports"));
  console.log(`Total overtime_reports in Firestore: ${repSnap.size}`);
  const recentReports = [];
  repSnap.forEach(d => {
    const r = d.data();
    if (r.workDate && (r.workDate.includes("2026-10-16") || r.workDate.includes("2026-10-15") || r.workDate.includes("2026-10-17"))) {
      recentReports.push({ id: d.id, comp: r.company, plant: r.plant, workDate: r.workDate, workersCount: (r.workers || []).length, hours: r.totalHours });
    }
  });
  console.log(`Found ${recentReports.length} reports around 10-15 ~ 10-17:`);
  recentReports.forEach(r => console.log(JSON.stringify(r)));
}

checkAttendance().then(() => process.exit(0));
