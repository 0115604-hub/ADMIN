// Script to fix 10/13 attendance data for (주)오륙 in Firestore
// 1. 김현희: 퇴사자 처리 (attendanceMatrix에서 제외, masterWorkers에서 status: '퇴사')
// 2. 버나드: 10/13 '야간' (8H, 0 OT, 20:00~05:00)
// 3. 돈돈: 10/13 '19' (10H, 2 OT, 08:00~19:00)
// 4. 오륙 10/13 총원 52명, 출근 52명 (결근 0명, 전원 정상 출근)

import { db } from "../src/firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

async function fixAttendance() {
  console.log("🚀 [오륙 10/13 근태 데이터 정상화 작업 시작]");

  // 1. smart_overtime_ledger/overtime_2026_10 업데이트
  const ledgerRef = doc(db, "smart_overtime_ledger", "overtime_2026_10");
  const ledgerSnap = await getDoc(ledgerRef);
  if (!ledgerSnap.exists()) {
    console.error("❌ smart_overtime_ledger/overtime_2026_10 문서를 찾을 수 없습니다.");
    process.exit(1);
  }

  const ledgerData = ledgerSnap.data();
  let matrix = ledgerData.attendanceMatrix || [];
  let master = ledgerData.masterWorkers || [];

  // 김현희 퇴사 처리
  console.log(`기존 matrix 인원수: ${matrix.length}`);
  matrix = matrix.filter((w) => w.name.trim() !== "김현희");
  console.log(`김현희 제외 후 matrix 인원수: ${matrix.length}`);

  // 버나드 & 돈돈 10/13 근태 정상화
  let bernardFound = false;
  let dondonFound = false;

  matrix = matrix.map((w) => {
    const name = w.name.trim();
    if (name === "버나드") {
      bernardFound = true;
      const daily = { ...(w.daily || {}) };
      daily["13"] = "야간";
      daily[13] = "야간";
      console.log("✅ 버나드 10/13 근태 -> '야간' 설정 완료");
      return { ...w, daily };
    }
    if (name === "돈돈") {
      dondonFound = true;
      const daily = { ...(w.daily || {}) };
      daily["13"] = "19";
      daily[13] = "19";
      console.log("✅ 돈돈 10/13 근태 -> '19' 설정 완료");
      return { ...w, daily };
    }
    return w;
  });

  if (!bernardFound) console.warn("⚠️ 버나드를 matrix에서 찾지 못했습니다.");
  if (!dondonFound) console.warn("⚠️ 돈돈을 matrix에서 찾지 못했습니다.");

  // masterWorkers에서 김현희 status를 퇴사로 설정
  master = master.map((w) => {
    if (w.name.trim() === "김현희") {
      console.log("✅ masterWorkers 김현희 status -> '퇴사' 설정 완료");
      return { ...w, status: "퇴사", note: "퇴사자" };
    }
    return w;
  });

  await updateDoc(ledgerRef, {
    attendanceMatrix: matrix,
    masterWorkers: master,
    updatedAt: new Date().toISOString()
  });
  console.log("✅ smart_overtime_ledger/overtime_2026_10 저장 완료!");

  // 2. overtime_reports/report_오륙_2026_10_13 업데이트
  const repRef13 = doc(db, "overtime_reports", "report_오륙_2026_10_13");
  const repSnap13 = await getDoc(repRef13);
  if (repSnap13.exists()) {
    const repData13 = repSnap13.data();
    let items13 = (repData13.items || []).filter((it) => it.workerName?.trim() !== "김현희");

    items13 = items13.map((it) => {
      const name = it.workerName?.trim();
      if (name === "버나드") {
        return {
          ...it,
          attendanceCode: "야간",
          startTime: "20:00",
          endTime: "05:00",
          hours: 8,
          otHours: 0,
          workContent: "오륙 가공관리팀 작업 수행",
          workDetails: "오륙 가공관리팀 NX4a 생산 및 납품 대응"
        };
      }
      if (name === "돈돈") {
        return {
          ...it,
          attendanceCode: "19",
          startTime: "08:00",
          endTime: "19:00",
          hours: 10,
          otHours: 2,
          workContent: "오륙 가공관리팀 작업 수행",
          workDetails: "오륙 가공관리팀 NX4 생산 및 납품 대응"
        };
      }
      return it;
    });

    const totalWorkers13 = items13.length;
    const attendedWorkers13 = items13.filter((it) => it.attendanceCode !== "결근" && it.hours > 0).length;
    const totalHours13 = items13.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
    const otHours13 = items13.reduce((sum, it) => sum + (Number(it.otHours) || 0), 0);
    const cost13 = totalHours13 * 15000;

    await updateDoc(repRef13, {
      items: items13,
      totalWorkers: totalWorkers13,
      attendedWorkers: attendedWorkers13,
      totalHours: totalHours13,
      otHours: otHours13,
      cost: cost13,
      reasons: [
        "1. 2026년 10월 13일(화) 오륙 생산 라인 가동 및 근태보고서 현황",
        "2. 삼랑진공장 소속 오륙 관리자 결재 승인",
        `3. 총 ${attendedWorkers13}명 출근/투입 (총 투입공수: ${totalHours13} M/H, 예상 노무비: ₩${cost13.toLocaleString()})`
      ],
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ report_오륙_2026_10_13 정상화 완료 (총원: ${totalWorkers13}, 출근: ${attendedWorkers13}, 결근: 0명, 공수: ${totalHours13}H, 잔업: ${otHours13}H)`);
  }

  // 3. overtime_reports/report_오륙_2026_10_12 에서도 퇴사자 김현희 제외 처리
  const repRef12 = doc(db, "overtime_reports", "report_오륙_2026_10_12");
  const repSnap12 = await getDoc(repRef12);
  if (repSnap12.exists()) {
    const repData12 = repSnap12.data();
    let items12 = (repData12.items || []).filter((it) => it.workerName?.trim() !== "김현희");
    const totalWorkers12 = items12.length;
    const attendedWorkers12 = items12.filter((it) => it.attendanceCode !== "결근" && it.hours > 0).length;
    const totalHours12 = items12.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
    const otHours12 = items12.reduce((sum, it) => sum + (Number(it.otHours) || 0), 0);
    const cost12 = totalHours12 * 15000;

    await updateDoc(repRef12, {
      items: items12,
      totalWorkers: totalWorkers12,
      attendedWorkers: attendedWorkers12,
      totalHours: totalHours12,
      otHours: otHours12,
      cost: cost12,
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ report_오륙_2026_10_12 퇴사자 정리 완료 (총원: ${totalWorkers12}, 출근: ${attendedWorkers12})`);
  }

  console.log("🎉 [오륙 10/13 근태 정상화 및 퇴사자 정리 모든 작업 완료]");
  process.exit(0);
}

fixAttendance().catch((err) => {
  console.error("❌ 치명적 에러:", err);
  process.exit(1);
});
