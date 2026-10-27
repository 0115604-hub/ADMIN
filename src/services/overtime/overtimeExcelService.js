/**
 * Overtime Matrix Excel 6-Sheet Export & Batch Import Engine
 */
import * as XLSX from "xlsx";
import {
  cleanCompanyName,
  normalizeDept
} from "./overtimeConstants.js";
import {
  calculateDailySummary,
  calculateCompanySummary,
  calculateDeptSummary,
  calculateWorkerDailyHours,
  calculateWorkerMonthlyTotals
} from "./overtimeCalculations.js";
import { ensureAllCompaniesPresent } from "./overtimeMatrixSync.js";
import {
  getLocalSmartOvertimeData,
  saveSmartOvertimeData
} from "./overtimeSyncService.js";

export const exportSmartOvertimeToExcel = (data) => {
  const currentData = ensureAllCompaniesPresent(data || getLocalSmartOvertimeData());
  const year = currentData.year || 2026;
  const month = currentData.month || 10;
  const daysInMonth = new Date(year, month, 0).getDate();
  const sampleDay = Math.min(8, daysInMonth);
  const wb = XLSX.utils.book_new();

  // Sheet 0: 일자별_근태정리본
  const s0Rows = [
    [`${year}년 ${month}월 일자별 근태 및 잔업 일일 종합 정리본 (5개사 통합)`],
    ["※ [B4] 셀에서 날짜를 선택하면 5개사 전사 일일 실적 요약표 및 전 작업자 상세 근태/잔업 내역이 실시간 자동 정리되어 표시됩니다."],
    ["📅 조회 대상 일자", null, "👥 당일 출근총원", "🟢 정시(0H)", "🟡 19시(+2H)", "🟠 21시(+4H)", "🔴 22시(+5H)", "🌙 특근/야간", "⚡ 당일 잔업합계(H)", null, "⏱ 당일 총투입공수"]
  ];
  const daySummary = calculateDailySummary(currentData.attendanceMatrix, sampleDay);
  s0Rows.push([`${month}월 ${sampleDay}일`, null, daySummary.totalAttended, daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.specialNightCount, daySummary.dayOtHours, null, daySummary.dayTotalHours]);
  s0Rows.push([]);
  s0Rows.push(["🏢 5개사별 당일 근태 및 투입공수 요약"]);
  s0Rows.push(["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "직급", "근태/잔업", "잔업시간(H)", "총근무시간(H)", "비고"]);

  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[sampleDay] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s0Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "사원", val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws0 = XLSX.utils.aoa_to_sheet(s0Rows);
  XLSX.utils.book_append_sheet(wb, ws0, "📋 일자별_근태정리본");

  // Sheet 1: 일일근태_간편입력
  const s1Rows = [
    [`${year}년 ${month}월 일일 근태 및 잔업 스마트 간편 등록 대장 (5개사 통합)`],
    ["💡 [사용안내] ① [A4] 일자 및 [C4] 업체를 선택하세요. ② [F열]에서 [🟢(정시) / 19 / 21 / 22 / 야간 / 특근] 드롭다운을 선택하면 잔업 및 총 근무시간이 실시간 자동 계산됩니다."],
    ["📅 작성 대상 일자", null, "🏢 관리 대상 업체", "🟢 정시근무", "🟡 19시 (+2H)", "🟠 21시 (+4H)", "🔴 22시 (+5H)", "⚡ 당일 잔업합계", "⏱ 당일 총근무공수"],
    [`${month}월 ${sampleDay}일`, null, "전체(5개사)", daySummary.regularCount, daySummary.ot19Count, daySummary.ot21Count, daySummary.ot22Count, daySummary.dayOtHours, daySummary.dayTotalHours],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "작업자 성명", "⭐ 잔업/근태 선택 (🟢/19/21/22)", "잔업시간 (H)", "총 근무시간 (H)", "비고 (조출/특이사항)"]
  ];
  currentData.attendanceMatrix.forEach((w, idx) => {
    const val = w.daily ? w.daily[sampleDay] : "";
    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
    s1Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, val || "-", weekdayOt + weekendOt, workHours, ""]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "📝 일일근태_간편입력");

  // Sheet 2: 월간_종합_현황판
  const daysHeader = [];
  for (let d = 1; d <= daysInMonth; d++) {
    daysHeader.push(`${month}월 ${d}일`);
  }
  const s2Rows = [
    [`${year}년 ${month}월 5개사 통합 근태 및 잔업 스마트 종합관리대장 (오륙 / 유성 / 조영 / 한울 / 부림텍)`],
    [`※ [A4] 셀에서 일자(${month}월 1일~${month}월 ${daysInMonth}일)를 선택하면 5개사 전체 및 업체별 당일 실적이 실시간 자동 집계됩니다. (🟢=정시, 19=+2H, 21=+4H, 22=+5H)`],
    ["📅 조회 대상 일자", null, "👥 5개사 전사 총원", null, "🟢 정시근무(0H)", null, null, "🟡 19시(+2H)", null, null, "🟠 21시(+4H)", null, null, "🔴 22시(+5H)", null, null, "🌙 야간/특근", null, null, `⚡ ${month}월 평일잔업 누적`, null, null, null, `🎯 ${month}월 주말특근 누적`, null, null, null, `⏱ ${month}월 전사 총 누적 투입공수`],
    [`${month}월 ${sampleDay}일`, null, currentData.attendanceMatrix.length, null, daySummary.regularCount, null, null, daySummary.ot19Count, null, null, daySummary.ot21Count, null, null, daySummary.ot22Count, null, null, daySummary.specialNightCount, null, null, 1680, null, null, null, 440, null, null, null, 25200],
    ["No.", "소속 업체", "소속 부서", "차종/라인", "성명", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`), "출근일수", "평일잔업(H)", "주말특근(H)", "야간(일)", "총공수(H)"],
    [null, null, null, null, null, ...daysHeader]
  ];

  currentData.attendanceMatrix.forEach((w, idx) => {
    const totals = calculateWorkerMonthlyTotals(w, daysInMonth);
    const row = [
      idx + 1,
      w.company,
      normalizeDept(w.dept),
      w.line,
      w.name
    ];
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(w.daily ? w.daily[d] || "" : "");
    }
    row.push(totals.workDays, totals.weekdayOtHours, totals.weekendOtHours, totals.nightDays, totals.totalHours);
    s2Rows.push(row);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, `📊 ${month}월_종합_현황판`);

  // Sheet 3: 업체별_통합_결산요약
  const s3Rows = [
    [`${year}년 ${month}월 5개사 업체별 근태 및 잔업 투입공수 통합 결산표`],
    [],
    ["구분 (업체명)", "관리 인원수", "누적 출근일수", "평일잔업 누계(H)", "주말특근 누계(H)", "야간근무 누계(일)", "총 투입공수(H)", "공수 비중(%)"]
  ];
  const compSummary = calculateCompanySummary(currentData.attendanceMatrix);
  compSummary.forEach((c) => {
    s3Rows.push([c.company, c.workerCount, c.totalWorkDays, c.weekdayOtHours, c.weekendOtHours, c.nightDays, c.totalHours, c.ratio / 100]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
  XLSX.utils.book_append_sheet(wb, ws3, "🏢 업체별_통합_결산요약");

  // Sheet 4: 부서별_투입공수_분석
  const s4Rows = [
    [`${year}년 ${month}월 5개사 부서별 인원 및 투입공수 현황 분석표`],
    [],
    ["소속 업체", "소속 부서", "배속 인원수", "당일 출근인원", "정시근무 인원", "잔업자 수", "당일 잔업시간(H)", "당일 총투입공수(H)"]
  ];
  const deptSummary = calculateDeptSummary(currentData.attendanceMatrix, sampleDay);
  deptSummary.forEach((d) => {
    s4Rows.push([d.company, d.dept, d.workerCount, d.attendedCount, d.regularCount, d.otCount, d.otHours, d.totalHours]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
  XLSX.utils.book_append_sheet(wb, ws4, "📈 부서별_투입공수_분석");

  // Sheet 5: 마스터_인원관리대장
  const s5Rows = [
    [`${year}년 ${month}월 5개사 전사 마스터 인원 관리 대장`],
    [],
    ["No.", "소속 업체", "소속 부서", "차종 / 라인", "성명", "직급", "고용 형태", "재직 상태", "비고"]
  ];
  currentData.masterWorkers.forEach((w, idx) => {
    s5Rows.push([idx + 1, w.company, normalizeDept(w.dept), w.line, w.name, w.position || "사원", w.employmentType || "정규직", w.status || "재직", w.note || ""]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
  XLSX.utils.book_append_sheet(wb, ws5, "👥 마스터_인원관리대장");

  // Download Excel File
  const filename = `${year}년${String(month).padStart(2, "0")}월_5개사_잔업스마트통합관리대장_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};

// Excel Import Handler
export const importSmartOvertimeFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const matrixSheetName = workbook.SheetNames.find((s) => s.includes("현황판") || s.includes("종합")) || workbook.SheetNames[0];
        const ws = workbook.Sheets[matrixSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerRowIndex = jsonRows.findIndex((row) => row && (row.includes("소속 업체") || row.includes("성명") || row.includes("이름")));
        if (headerRowIndex === -1) headerRowIndex = 4;

        const importedMatrix = [];
        const importedWorkers = [];

        for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
          const r = jsonRows[i];
          if (!r || r.length < 5) continue;
          const no = Number(r[0]) || i;
          const company = String(r[1] || "").trim();
          const dept = normalizeDept(r[2] || "생산팀");
          const line = String(r[3] || "").trim();
          const name = String(r[4] || "").trim();
          if (!name) continue;

          const daily = {};
          for (let d = 1; d <= 30; d++) {
            const val = r[4 + d];
            daily[d] = val !== undefined && val !== null ? String(val).trim() : "";
          }

          importedMatrix.push({
            no,
            company: company || "(주)오륙",
            dept,
            line: line || "1라인",
            name,
            daily
          });

          importedWorkers.push({
            no,
            company: company || "(주)오륙",
            dept,
            line: line || "1라인",
            name,
            position: "사원",
            employmentType: "정규직",
            status: "재직",
            note: ""
          });
        }

        if (importedMatrix.length > 0) {
          // Assign per-company sequential number (1..N per company)
          const compCounters = {};
          importedMatrix.forEach((w) => {
            const c = cleanCompanyName(w.company);
            compCounters[c] = (compCounters[c] || 0) + 1;
            w.no = compCounters[c];
          });
          const compCounters2 = {};
          importedWorkers.forEach((w) => {
            const c = cleanCompanyName(w.company);
            compCounters2[c] = (compCounters2[c] || 0) + 1;
            w.no = compCounters2[c];
          });

          const updatedLedger = {
            year: 2026,
            month: 9,
            masterWorkers: importedWorkers,
            attendanceMatrix: importedMatrix
          };
          await saveSmartOvertimeData(updatedLedger);
          resolve(updatedLedger);
        } else {
          reject(new Error("유효한 근태 데이터 행을 찾을 수 없습니다."));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

