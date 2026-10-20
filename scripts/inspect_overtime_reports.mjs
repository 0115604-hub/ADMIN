import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function inspectOvertimeReports() {
  const snap = await getDocs(collection(db, "overtime_reports"));
  console.log(`=== [Firestore overtime_reports 총 문서 수: ${snap.size}개] ===\n`);

  const reports = [];
  snap.forEach((d) => {
    const data = d.data();
    reports.push({ id: d.id, ...data });
  });

  // Sort by date / id
  reports.sort((a, b) => (b.workDate || b.date || b.id || "").localeCompare(a.workDate || a.date || a.id || ""));

  console.log("최근 등록된 보고서 목록 (최대 30개):");
  reports.slice(0, 30).forEach((r) => {
    const isWeekend = (dateStr) => {
      if (!dateStr) return false;
      const day = new Date(dateStr).getDay();
      return day === 0 || day === 6;
    };
    const dateStr = r.workDate || r.date || "";
    const dayOfWeek = dateStr ? ["일", "월", "화", "수", "목", "금", "토"][new Date(dateStr).getDay()] : "";
    console.log(`• [${r.id}] 회사: ${r.company || r.plant || "미상"}, 일자: ${dateStr}(${dayOfWeek}), 상태: ${r.status || "미상"}, 인원: ${r.attendedWorkers || r.totalWorkers || 0}명, 휴일여부: ${isWeekend(dateStr) ? "주말/휴일" : "평일"}`);
  });

  // Specifically check Hanul reports
  const hanulReports = reports.filter((r) => (r.company || "").includes("한울") || (r.id || "").includes("한울") || (r.plant || "").includes("한울"));
  console.log(`\n=== [한울(Hanul) 보고서 목록: 총 ${hanulReports.length}개] ===`);
  hanulReports.forEach((r) => {
    const dateStr = r.workDate || r.date || "";
    const dayOfWeek = dateStr ? ["일", "월", "화", "수", "목", "금", "토"][new Date(dateStr).getDay()] : "";
    console.log(`• [${r.id}] 일자: ${dateStr}(${dayOfWeek}), 잔업시간: ${r.totalOvertimeHours || 0}H, 상태: ${r.status}, 휴일: ${["일", "토"].includes(dayOfWeek) ? "주말" : "평일"}`);
  });
}

inspectOvertimeReports().catch(console.error);
