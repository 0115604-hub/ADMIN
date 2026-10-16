import { db } from "../src/firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { cleanCompanyName, calculateWorkerDailyHours } from "../src/services/overtimeSmartService.js";

async function syncAllAttendance1016() {
  console.log("=== 10/16 5개사 근태 및 보고서 전수 동기화 시작 ===");

  // 1. Fetch smart_overtime_ledger
  const ledgerRef = doc(db, "smart_overtime_ledger", "overtime_2026_10");
  const ledgerSnap = await getDoc(ledgerRef);
  if (!ledgerSnap.exists()) {
    console.error("❌ smart_overtime_ledger/overtime_2026_10 문서가 존재하지 않습니다.");
    process.exit(1);
  }
  const ledgerData = ledgerSnap.data();
  const matrix = [...(ledgerData.attendanceMatrix || [])];

  // 2. Fetch existing reports for 10/16
  const repOryukSnap = await getDoc(doc(db, "overtime_reports", "report_오륙_2026_10_16"));
  const repHanulSnap = await getDoc(doc(db, "overtime_reports", "report_한울_2026_10_16"));
  const repBurimSnap = await getDoc(doc(db, "overtime_reports", "report_부림텍_2026_10_16"));
  const repYuseongSnap = await getDoc(doc(db, "overtime_reports", "report_유성_2026_10_16"));
  const repJoyoung15Snap = await getDoc(doc(db, "overtime_reports", "report_조영_2026_10_15"));

  // --- A. 오륙 처리 ---
  console.log("\n[1/5] 오륙 동기화 중...");
  let oryukItems = repOryukSnap.data()?.items || [];
  // 소스 / 김현희 보정
  oryukItems = oryukItems.map(it => {
    if (it.workerName === "김현희") {
      return {
        ...it,
        workerName: "소스",
        id: "rep_item_16_32_소스",
        attendanceCode: "🟢",
        hours: 8,
        otHours: 0
      };
    }
    return it;
  });
  // Update report_오륙_2026_10_16
  await updateDoc(doc(db, "overtime_reports", "report_오륙_2026_10_16"), {
    items: oryukItems,
    totalWorkers: oryukItems.length,
    attendedWorkers: oryukItems.filter(it => it.hours > 0).length,
    updatedAt: new Date().toISOString()
  });
  // Reflect to matrix
  oryukItems.forEach(it => {
    const w = matrix.find(mw => mw.name.trim() === it.workerName.trim() && cleanCompanyName(mw.company) === "오륙");
    if (w) {
      if (!w.daily) w.daily = {};
      w.daily[16] = it.attendanceCode || "🟢";
      w.daily["16"] = it.attendanceCode || "🟢";
    }
  });

  // --- B. 한울 처리 ---
  console.log("[2/5] 한울 동기화 중...");
  const hanulItems = repHanulSnap.data()?.items || [];
  hanulItems.forEach(it => {
    const w = matrix.find(mw => mw.name.trim() === (it.workerName || it.name).trim() && cleanCompanyName(mw.company) === "한울");
    if (w) {
      if (!w.daily) w.daily = {};
      w.daily[16] = it.attendanceCode || "🟢";
      w.daily["16"] = it.attendanceCode || "🟢";
    }
  });

  // --- C. 부림텍 처리 ---
  console.log("[3/5] 부림텍 동기화 중...");
  const burimItems = repBurimSnap.data()?.items || [];
  burimItems.forEach(it => {
    const w = matrix.find(mw => mw.name.trim() === (it.workerName || it.name).trim() && cleanCompanyName(mw.company) === "부림텍");
    if (w) {
      if (!w.daily) w.daily = {};
      w.daily[16] = it.attendanceCode || "🟢";
      w.daily["16"] = it.attendanceCode || "🟢";
    }
  });

  // --- D. 유성 처리 (검증 및 보존) ---
  console.log("[4/5] 유성 검증 중...");
  const yuseongItems = repYuseongSnap.data()?.items || [];
  yuseongItems.forEach(it => {
    const w = matrix.find(mw => mw.name.trim() === (it.workerName || it.name).trim() && cleanCompanyName(mw.company) === "유성");
    if (w) {
      if (!w.daily) w.daily = {};
      w.daily[16] = it.attendanceCode || "🟢";
      w.daily["16"] = it.attendanceCode || "🟢";
    }
  });

  // --- E. 조영 처리 (10/16 보고서 신규 등록 및 매트릭스 반영) ---
  console.log("[5/5] 조영 10/16 등록 및 동기화 중...");
  const joyoung15 = repJoyoung15Snap.data();
  const joyoungItems16 = joyoung15.items.map((it, idx) => ({
    ...it,
    id: `rep_item_16_${idx + 1}_${it.workerName}`,
    workDate: "2026-10-16"
  }));

  const repJoyoung16Doc = {
    id: "report_조영_2026_10_16",
    plant: "한림공장",
    company: "조영",
    companies: ["조영"],
    title: "10월 16일(금) 한림공장 조영 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-10-16",
    workDateFormatted: "2026년 10월 16일 금요일",
    author: "오상민 선임",
    authorTitle: "선임",
    updatedAt: new Date().toISOString(),
    status: "APPROVED",
    approval: [
      { role: "담당", name: "오상민 선임", title: "선임", status: "APPROVED", date: "2026-10-16", comment: "작성자 전결" },
      { role: "책임", name: "김동욱", title: "책임", status: "APPROVED", date: "2026-10-16", comment: "전결" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-10-16", comment: "전결" },
      { role: "대표", name: "권태형", title: "대표", status: "APPROVED", date: "2026-10-16", comment: "전결" }
    ],
    totalWorkers: joyoungItems16.length,
    attendedWorkers: joyoungItems16.filter(it => it.hours > 0).length,
    totalHours: joyoungItems16.reduce((sum, it) => sum + (it.hours || 0), 0),
    otHours: joyoungItems16.reduce((sum, it) => sum + (it.otHours || 0), 0),
    cost: joyoungItems16.reduce((sum, it) => sum + (it.hours || 0), 0) * 15000,
    items: joyoungItems16,
    reasons: [
      "1. 2026년 10월 16일(금) 조영 생산 라인 가동 및 근태보고서 현황",
      "2. 한림공장 소속 조영 관리자 결재 승인",
      `3. 총 ${joyoungItems16.length}명 출근/투입 (총 투입공수: ${joyoungItems16.reduce((sum, it) => sum + (it.hours || 0), 0)} M/H, 예상 노무비: ₩${(joyoungItems16.reduce((sum, it) => sum + (it.hours || 0), 0) * 15000).toLocaleString()})`
    ]
  };

  await setDoc(doc(db, "overtime_reports", "report_조영_2026_10_16"), repJoyoung16Doc);
  console.log("✅ report_조영_2026_10_16 Firestore 저장 완료!");

  joyoungItems16.forEach(it => {
    const w = matrix.find(mw => mw.name.trim() === it.workerName.trim() && cleanCompanyName(mw.company) === "조영");
    if (w) {
      if (!w.daily) w.daily = {};
      w.daily[16] = it.attendanceCode || "🟢";
      w.daily["16"] = it.attendanceCode || "🟢";
    }
  });

  // 3. Save updated smart_overtime_ledger
  console.log("\n[6/6] smart_overtime_ledger/overtime_2026_10 매트릭스 업데이트 저장 중...");
  await updateDoc(ledgerRef, {
    attendanceMatrix: matrix,
    updatedAt: new Date().toISOString()
  });
  console.log("🎉 smart_overtime_ledger 전사 5개사 Day 16 매트릭스 동기화 완료!");
}

syncAllAttendance1016().then(() => process.exit(0)).catch(err => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
