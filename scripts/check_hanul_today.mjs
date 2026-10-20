import { db } from "../src/firebase.js";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

async function verifyHanulToday() {
  console.log("=== [한울 오늘(2026-10-20) 접속 및 근태등록 종합 검증 시작] ===\n");

  const targetDateStr = "2026-10-20";
  const targetDay = 20;

  // 1. smart_overtime_ledger 조회 (2026년 10월 원장)
  console.log("1. 스마트 근태 원장(smart_overtime_ledger/overtime_2026_10) 확인 중...");
  const ledgerRef = doc(db, "smart_overtime_ledger", "overtime_2026_10");
  const ledgerSnap = await getDoc(ledgerRef);

  let hanulWorkers = [];
  if (ledgerSnap.exists()) {
    const data = ledgerSnap.data();
    const matrix = data.attendanceMatrix || [];
    hanulWorkers = matrix.filter((w) => (w.company || "").includes("한울"));
    console.log(`- 한울 등록 근로자 수: 총 ${hanulWorkers.length}명`);

    let enteredCount = 0;
    let missingCount = 0;
    const workerStatusList = [];

    hanulWorkers.forEach((w) => {
      const code = w.daily?.[targetDay] || w.daily?.[String(targetDay)] || "";
      const strCode = String(code).trim();
      const hasCode = strCode && strCode !== "-" && strCode !== "미입력" && strCode !== "undefined";
      if (hasCode) {
        enteredCount++;
        workerStatusList.push({ name: w.name, code: strCode, status: "등록완료" });
      } else {
        missingCount++;
        workerStatusList.push({ name: w.name, code: strCode || "(미입력)", status: "미등록" });
      }
    });

    console.log(`- 오늘(20일) 한울 근태 등록 현황: 등록 ${enteredCount}명 / 미등록 ${missingCount}명`);
    console.log("  [근로자별 상세 현황]:");
    workerStatusList.slice(0, 10).forEach((ws) => {
      console.log(`    • ${ws.name}: ${ws.code} (${ws.status})`);
    });
    if (workerStatusList.length > 10) {
      console.log(`    ... 외 ${workerStatusList.length - 10}명`);
    }
  } else {
    console.log("❌ overtime_2026_10 문서가 존재하지 않습니다.");
  }

  // 2. overtime_reports 일일 마감 보고서 확인
  console.log("\n2. 일일 근태 마감 보고서(overtime_reports) 확인 중...");
  const reportId = "report_한울_2026_10_20";
  const reportSnap = await getDoc(doc(db, "overtime_reports", reportId));
  if (reportSnap.exists()) {
    const rep = reportSnap.data();
    console.log(`✅ [마감 보고서 존재] ${reportId}`);
    console.log(`   - 제출자: ${rep.submittedBy || rep.workerName || "미상"}`);
    console.log(`   - 제출일시: ${rep.submittedAt || rep.updatedAt || "미상"}`);
    console.log(`   - 인원현황: 재직 ${rep.totalWorkers || 0}명, 출근 ${rep.attendedWorkers || 0}명, 결근 ${rep.absentWorkers || 0}명`);
    console.log(`   - 상태: ${rep.status || "완료"}`);
  } else {
    console.log(`⚠️ [마감 보고서 없음] ${reportId} 문서가 아직 생성되지 않았습니다.`);
  }

  // 3. user_access_logs 접속 기록 확인
  console.log("\n3. 한울 사용자 시스템 접속 기록(user_access_logs) 확인 중...");
  const accessSnap = await getDocs(collection(db, "user_access_logs"));
  const hanulLogins = [];

  accessSnap.forEach((d) => {
    const logData = d.data();
    const userId = d.id;
    const userName = logData.userName || "";
    const isHanulUser = (userName && hanulWorkers.some((hw) => hw.name === userName)) ||
                        (logData.company && logData.company.includes("한울")) ||
                        (logData.plant && logData.plant.includes("한울")) ||
                        userId.toLowerCase().includes("hanul");

    if (isHanulUser) {
      const logs = logData.logs || [];
      const todayLogs = logs.filter((l) => {
        const timeStr = l.timestamp || "";
        return timeStr.includes("2026. 10. 20") || timeStr.includes("2026-10-20") || timeStr.includes("10. 20");
      });
      hanulLogins.push({
        userId,
        userName,
        totalLogs: logs.length,
        todayLogs,
        latestLog: logs[0]
      });
    }
  });

  if (hanulLogins.length > 0) {
    console.log(`- 한울 관련 계정 접속 기록 발견: 총 ${hanulLogins.length}개 계정`);
    hanulLogins.forEach((hl) => {
      console.log(`  • 계정: ${hl.userName} (${hl.userId})`);
      if (hl.todayLogs.length > 0) {
        console.log(`    ✅ 오늘 접속 기록 ${hl.todayLogs.length}건:`);
        hl.todayLogs.forEach((tl) => {
          console.log(`       - 시간: ${tl.timestamp}, 액션: ${tl.action || "접속"}, 기기: ${tl.device || "PC"}`);
        });
      } else {
        console.log(`    ⏳ 오늘(20일) 접속 기록 없음 (최근 접속: ${hl.latestLog?.timestamp || "기록 없음"})`);
      }
    });
  } else {
    console.log("- user_access_logs에 한울 특정 계정의 별도 기록이 없거나 전체 로그를 검색합니다.");
  }

  // 4. 최근 전체 접속 로그 중 오늘 한울 관련 키워드 확인
  console.log("\n4. 전체 최근 접속 로그 2026-10-20 타임스탬프 분석 중...");
  let allTodayAccessCount = 0;
  accessSnap.forEach((d) => {
    const logData = d.data();
    const logs = logData.logs || [];
    logs.forEach((l) => {
      const timeStr = l.timestamp || "";
      if (timeStr.includes("2026. 10. 20") || timeStr.includes("2026-10-20") || timeStr.includes("10. 20")) {
        allTodayAccessCount++;
        if ((l.action || "").includes("한울") || (l.location || "").includes("한울") || (logData.userName || "").includes("한울")) {
          console.log(`  ⭐ 한울 관련 액션 발견: [${logData.userName}] ${l.timestamp} - ${l.action} (${l.device})`);
        }
      }
    });
  });
  console.log(`- 오늘(20일) 시스템 전체 접속 기록 수: ${allTodayAccessCount}건`);

  // 5. work_logs 또는 한울 관련 일보 확인
  console.log("\n5. 오늘(2026-10-20) 한울 작업일보(work_logs) 작성 여부 확인 중...");
  try {
    const workLogsSnap = await getDocs(collection(db, "work_logs"));
    const hanulWorkLogs = [];
    workLogsSnap.forEach((d) => {
      const wld = d.data();
      if ((wld.date === targetDateStr || (wld.createdAt || "").includes(targetDateStr)) &&
          ((wld.company || "").includes("한울") || (wld.plant || "").includes("한울") || (wld.companyName || "").includes("한울"))) {
        hanulWorkLogs.push({ id: d.id, ...wld });
      }
    });
    console.log(`- 오늘 한울 작업일보 등록 건수: ${hanulWorkLogs.length}건`);
    hanulWorkLogs.forEach((hwl) => {
      console.log(`  • 일보 ID: ${hwl.id}, 작성자: ${hwl.workerFullName || hwl.workerName}, 품명: ${hwl.partName || hwl.item}`);
    });
  } catch (e) {
    console.log("work_logs 조회 건너뜀:", e.message);
  }

  console.log("\n=== [검증 종료] ===");
}

verifyHanulToday().catch(console.error);
