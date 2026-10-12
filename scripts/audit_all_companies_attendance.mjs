// Unified All-Company Attendance Integrity Audit Engine (5개사 일괄 정합성 단일 검증 엔진)
import { db } from "../src/firebase.js";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { cleanCompanyName, calculateWorkerDailyHours } from "../src/services/overtimeSmartService.js";

const COMPANIES = ["오륙", "조영", "한울", "유성", "부림텍"];
const EXPECTED_HEADCOUNTS = {
  "오륙": 53,
  "조영": 44,
  "한울": 26,
  "유성": 14,
  "부림텍": 6
};

export async function runUnifiedAttendanceAudit(targetDay = 12, targetYear = 2026, targetMonth = 10, autoRepair = false) {
  const ym = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  const docId = `overtime_${targetYear}_${String(targetMonth).padStart(2, "0")}`;
  const ymd = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

  console.log(`\n========================================================================================`);
  console.log(`🔍 [전사 5개사 일괄 정합성 단일 검증 엔진] 기준일자: ${ymd} (Day ${targetDay})`);
  console.log(`========================================================================================\n`);

  // 1. Fetch smart_overtime_ledger
  const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", docId));
  if (!ledgerSnap.exists()) {
    console.error(`❌ [치명적 오류] 월간 스마트 원장(${docId})이 Firestore에 존재하지 않습니다.`);
    return { success: false, error: "LEDGER_NOT_FOUND" };
  }

  const ledgerData = ledgerSnap.data();
  const matrix = ledgerData.attendanceMatrix || [];
  const master = ledgerData.masterWorkers || [];

  let grandTotalExpected = 0;
  let grandTotalMatrix = 0;
  let grandTotalAttended = 0;
  let grandTotalHours = 0;
  let grandTotalOt = 0;
  let allCompaniesPass = true;

  const results = [];

  for (const comp of COMPANIES) {
    const expectedCount = EXPECTED_HEADCOUNTS[comp] || 0;
    grandTotalExpected += expectedCount;

    const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === comp);
    const workerCount = compWorkers.length;
    grandTotalMatrix += workerCount;

    let attendedCount = 0;
    let totalHours = 0;
    let otHours = 0;
    const absences = [];
    const missingDailyCodes = [];
    const breakdown = { "🟢": 0, "19": 0, "21": 0, "22": 0, "야간": 0, "특근": 0, "결근/병결/휴무": 0 };

    compWorkers.forEach((w) => {
      const code = w.daily?.[targetDay] || w.daily?.[String(targetDay)] || "";
      const strCode = String(code).trim();
      const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(code);

      if (!strCode || strCode === "-" || strCode === "미입력" || strCode === "undefined" || strCode === "null") {
        if (strCode === "-") {
          absences.push(`${w.name}(휴무)`);
          breakdown["결근/병결/휴무"]++;
        } else {
          missingDailyCodes.push(w.name);
        }
      } else if (["결근", "병결", "사결", "공결", "연차", "휴가", "병가", "휴무"].includes(strCode)) {
        absences.push(`${w.name}(${strCode})`);
        breakdown["결근/병결/휴무"]++;
      } else {
        attendedCount++;
        totalHours += workHours;
        const ot = weekdayOt + weekendOt;
        otHours += ot;

        if (strCode.includes("19")) breakdown["19"]++;
        else if (strCode.includes("21")) breakdown["21"]++;
        else if (strCode.includes("22")) breakdown["22"]++;
        else if (strCode.includes("야간")) breakdown["야간"]++;
        else if (strCode.includes("특근")) breakdown["특근"]++;
        else breakdown["🟢"]++;
      }
    });

    grandTotalAttended += attendedCount;
    grandTotalHours += totalHours;
    grandTotalOt += otHours;

    // Check overtime_reports document
    const repDocId = `report_${comp}_${targetYear}_${String(targetMonth).padStart(2, "0")}_${String(targetDay).padStart(2, "0")}`;
    const repSnap = await getDoc(doc(db, "overtime_reports", repDocId));
    const repExists = repSnap.exists();
    const repData = repExists ? repSnap.data() : null;

    const issues = [];

    // Rule A: Worker headcount match
    if (workerCount !== expectedCount) {
      issues.push(`원장 인원(${workerCount}명) != 기준 인원(${expectedCount}명)`);
    }

    // Rule B: Missing daily codes
    if (missingDailyCodes.length > 0) {
      issues.push(`미선택 근태 ${missingDailyCodes.length}명: ${missingDailyCodes.join(", ")}`);
    }

    // Rule C: Report document check
    if (!repExists) {
      issues.push(`보고서 문서(${repDocId}) 미생성`);
    } else {
      if (repData.totalWorkers !== expectedCount) {
        issues.push(`보고서 총원(${repData.totalWorkers}명) != 기준 인원(${expectedCount}명)`);
      }
      if (repData.attendedWorkers !== attendedCount) {
        issues.push(`보고서 출근(${repData.attendedWorkers}명) != 원장 출근(${attendedCount}명)`);
      }
      if (repData.totalHours !== totalHours) {
        issues.push(`보고서 공수(${repData.totalHours}H) != 원장 공수(${totalHours}H)`);
      }
      if (repData.otHours !== otHours) {
        issues.push(`보고서 잔업(${repData.otHours}H) != 원장 잔업(${otHours}H)`);
      }
      if (typeof repData.otHours !== "number") {
        issues.push(`보고서 otHours가 숫자형이 아님 (${typeof repData.otHours})`);
      }
      if (!Array.isArray(repData.items) || repData.items.length !== expectedCount) {
        issues.push(`보고서 items 인원(${repData.items?.length || 0}명) != 총원(${expectedCount}명)`);
      }
    }

    const isPassed = issues.length === 0;
    if (!isPassed) allCompaniesPass = false;

    results.push({
      company: comp,
      expectedCount,
      workerCount,
      attendedCount,
      totalHours,
      otHours,
      absences,
      breakdown,
      repExists,
      repData,
      isPassed,
      issues
    });

    const statusBadge = isPassed ? "✅ [통과 PASS]" : "❌ [오류 FAIL]";
    console.log(`[${comp}] ${statusBadge}`);
    console.log(`  • 총원: ${workerCount}/${expectedCount}명 | 출근: ${attendedCount}명 | 미출근: ${absences.length > 0 ? absences.join(", ") : "없음(전원출근)"}`);
    console.log(`  • 공수: ${totalHours} M/H (기본 ${totalHours - otHours}H + 잔업 ${otHours}H) | 노무비: ₩${(totalHours * 15000).toLocaleString()}`);
    console.log(`  • 분포: 정시(🟢) ${breakdown["🟢"]}명, 19시 ${breakdown["19"]}명, 21시 ${breakdown["21"]}명, 22시 ${breakdown["22"]}명, 야간 ${breakdown["야간"]}명`);
    if (repExists) {
      console.log(`  • 보고서: 등록완료 (${repDocId}) - items: ${repData.items?.length || 0}건, otHours: ${repData.otHours}H`);
    } else {
      console.log(`  • 보고서: ⚠️ 미등록`);
    }
    if (issues.length > 0) {
      console.log(`  ⚠️ 결함 내역:`);
      issues.forEach((iss) => console.log(`     - ${iss}`));
    }
    console.log(`----------------------------------------------------------------------------------------`);
  }

  console.log(`\n========================================================================================`);
  console.log(`📊 [전사 5개사 일괄 정합성 최종 총계]`);
  console.log(`  • 전사 기준 총원: ${grandTotalExpected}명 | 원장 총원: ${grandTotalMatrix}명 (${grandTotalMatrix === grandTotalExpected ? "일치" : "불일치"})`);
  console.log(`  • 전사 실제 출근: ${grandTotalAttended}명 / 미출근: ${grandTotalExpected - grandTotalAttended}명`);
  console.log(`  • 전사 총 투입공수: ${grandTotalHours} M/H (기본 ${grandTotalHours - grandTotalOt}H + 총 잔업 ${grandTotalOt}H)`);
  console.log(`  • 전사 총 산출노무비: ₩${(grandTotalHours * 15000).toLocaleString()}`);
  console.log(`  • 5개사 전수 적합성 판정: ${allCompaniesPass ? "🎉 전사 100% 정상 (ALL PASSED)" : "⚠️ 일부 결함 존재 (INSPECT REQUIRED)"}`);
  console.log(`========================================================================================\n`);

  return {
    success: allCompaniesPass,
    results,
    summary: {
      grandTotalExpected,
      grandTotalMatrix,
      grandTotalAttended,
      grandTotalHours,
      grandTotalOt,
      allCompaniesPass
    }
  };
}

// Direct CLI Execution
if (process.argv[1]?.includes("audit_all_companies_attendance")) {
  const day = parseInt(process.argv[2] || "12", 10);
  const year = parseInt(process.argv[3] || "2026", 10);
  const month = parseInt(process.argv[4] || "10", 10);

  runUnifiedAttendanceAudit(day, year, month)
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Audit fatal error:", err);
      process.exit(1);
    });
}
