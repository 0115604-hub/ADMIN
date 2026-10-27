/**
 * Attendance Matrix Synchronization & Reconciliation with Work Reports
 */
import {
  COMPANIES,
  cleanCompanyName,
  cleanWorkerNameOnly,
  normalizeDept,
  isWeekendByDate
} from "./overtimeConstants.js";
import { INITIAL_SMART_OVERTIME_DATA } from "../../data/masterOvertimeSmartData.js";

export const buildMatrixFromReports = (masterWorkers, reports, targetYear = null, targetMonth = null) => {
  const workers = Array.isArray(masterWorkers) && masterWorkers.length > 0 
    ? masterWorkers 
    : (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []);

  // 1. Initialize base matrix with clean daily records (prevent unrecorded/future dates from leaking dirty state)
  const matrix = workers.map((w, idx) => {
    return {
      no: idx + 1,
      company: cleanCompanyName(w.company),
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: (w.name || "").trim(),
      position: w.position || "사원",
      daily: { ...(w.daily || {}) }
    };
  });

  if (!Array.isArray(reports) || reports.length === 0) {
    return matrix;
  }

  // Helper to normalize company name
  const matchCompany = (comp1, comp2) => {
    if (!comp1 || !comp2) return false;
    const c1 = cleanCompanyName(comp1);
    const c2 = cleanCompanyName(comp2);
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  // 2. Iterate through reports
  reports.forEach((report) => {
    if (!report) return;
    // Skip synthesized reports (they are composite views of child reports)
    if (report.isSynthesized) return;

    let repDateStr = report.workDate || "";
    if (!repDateStr) {
      const match2 = String(report.workDateFormatted || report.title || "").match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        const y = match2[1] || "2026";
        const m = String(parseInt(match2[2], 10)).padStart(2, "0");
        const d = String(parseInt(match2[3], 10)).padStart(2, "0");
        repDateStr = `${y}-${m}-${d}`;
      }
    }
    const p = String(repDateStr).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!p) return;
    const repYear = parseInt(p[1], 10);
    const repMonth = parseInt(p[2], 10);
    const day = parseInt(p[3], 10);
    if (isNaN(day) || day < 1 || day > 31) return;
    if (targetYear && repYear !== Number(targetYear)) return;
    if (targetMonth && repMonth !== Number(targetMonth)) return;

    const isWeekend = isWeekendByDate(day, repYear, repMonth);

    // Identify target companies for this report
    const rawComp = String(report.company || "").trim();
    const isAllGroup = !rawComp || rawComp === "전체" || rawComp === "5개사 통합" || rawComp === "전사" || rawComp === "통합" || rawComp === "ALL";
    let targetCompanies = [];
    if (!isAllGroup) {
      targetCompanies = [cleanCompanyName(report.company)];
    } else if (report.plant === "삼랑진공장") {
      targetCompanies = ["오륙", "유성"];
    } else if (report.plant === "한림공장") {
      targetCompanies = ["조영", "한울", "부림텍"];
    } else if (Array.isArray(report.companies) && report.companies.length > 0) {
      targetCompanies = report.companies.map(cleanCompanyName);
    } else {
      targetCompanies = COMPANIES.map(cleanCompanyName);
    }

    // Apply items from the report
    let hasAppliedAnyItem = false;
    if (Array.isArray(report.items) && report.items.length > 0) {
      report.items.forEach((it) => {
        if (!it) return;
        // Case A: item has individual workerName or name
        const wName = String(it.workerName || it.name || it.worker || it.empName || it.userName || "").trim();
        if (wName) {
          const cleanItName = cleanWorkerNameOnly(wName);
          const itComp = cleanCompanyName(it.company || it.factory || "");
          const targetW = matrix.find((w) => {
            const cleanW = cleanWorkerNameOnly(w.name);
            const sameName = (w.name || "").trim() === wName || (cleanItName && cleanW === cleanItName);
            if (!sameName) return false;
            const wComp = cleanCompanyName(w.company);
            if (itComp && itComp !== "전체" && itComp !== "5개사 통합") {
              return matchCompany(itComp, wComp);
            }
            return targetCompanies.some(tc => matchCompany(tc, wComp));
          });

          if (targetW) {
            hasAppliedAnyItem = true;
            let rawCode = it.attendanceCode || it.code || it.attendance || it.status || it.category || "";
            const codeStr = String(rawCode || "").trim();
            const contentStr = `${it.workContent || ""} ${it.workDetails || ""} ${it.note || ""}`;
            // 🔒 100% Strict Preservation: Honor the exact attendance code registered by worker/manager
            let code = codeStr;
            if (!code) {
              if (contentStr.includes("결근")) code = "결근";
              else if (contentStr.includes("병결")) code = "병결";
              else if (contentStr.includes("사결")) code = "사결";
              else if (contentStr.includes("공결")) code = "공결";
              else if (contentStr.includes("연차")) code = "연차";
              else if (contentStr.includes("휴가")) code = "휴가";
              else if (contentStr.includes("반차")) code = "반차";
              else if (contentStr.includes("야간")) code = "야간";
              else if (it.hours >= 13 || it.endTime === "22:00") code = "22";
              else if (it.hours >= 12 || it.endTime === "21:00") code = "21";
              else if (it.hours >= 10 || it.endTime === "19:00") code = "19";
              else if (it.hours > 0) code = isWeekend ? "특근" : "🟢";
              else code = isWeekend ? "-" : "결근";
            }

            targetW.daily[day] = code;
            targetW.daily[String(day)] = code;
          }
        }
        // Case B: item has category group with names string
        else if (it.names) {
          const namesList = String(it.names).split(",").map((s) => s.trim()).filter(Boolean);
          namesList.forEach((n) => {
            const cleanN = cleanWorkerNameOnly(n);
            const targetW = matrix.find((w) => {
              const cleanW = cleanWorkerNameOnly(w.name);
              const sameName = (w.name || "").trim() === n || (cleanN && cleanW === cleanN);
              if (!sameName) return false;
              if (it.company) return matchCompany(it.company, w.company);
              return targetCompanies.some(tc => matchCompany(tc, w.company));
            });

            if (targetW) {
              hasAppliedAnyItem = true;
              let rawCode = it.attendanceCode || it.code || it.attendance || it.status || "";
              let code = String(rawCode || "").trim();
              if (!code) {
                if (it.hours >= 13) code = "22";
                else if (it.hours >= 12) code = "21";
                else if (it.hours >= 10) code = "19";
                else code = isWeekend ? "특근" : "🟢";
              }
              targetW.daily[day] = code;
              targetW.daily[String(day)] = code;
            }
          });
        }
      });
    }

    // 🔒 Case C eliminated: Never auto-fill non-participating workers with "🟢"
  });

  return matrix;
};

/**
 * ⭐ [강력한 상호 자동 치유 엔진] 보고서(overtime_reports)와 대장(attendanceMatrix) 간 불일치 실시간 영구 해소
 * - 대장 셀이 미작성(비어있거나 미입력, 또는 출근코드 누락) 상태인데 해당 날짜에 승인/등록된 일일 보고서가 존재할 경우,
 *   보고서의 실제 작업자별 근태 코드(19, 21, 22, 야간, 정시 등)를 대장 매트릭스로 즉시 주입(Hydration).
 * - 반대로 대장에 이미 등록된 수기 수정본은 최우선 보존(Authoritative Preserve).
 */
export const reconcileMatrixWithReports = (baseMatrix, reports, targetYear = null, targetMonth = null) => {
  if (!Array.isArray(baseMatrix) || baseMatrix.length === 0) {
    return { matrix: [], hasHealed: false };
  }
  if (!Array.isArray(reports) || reports.length === 0) {
    return { matrix: baseMatrix, hasHealed: false };
  }

  let hasHealed = false;
  const matchCompany = (comp1, comp2) => {
    if (!comp1 || !comp2) return false;
    const c1 = cleanCompanyName(comp1);
    const c2 = cleanCompanyName(comp2);
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  const matrix = baseMatrix.map((w) => ({
    ...w,
    daily: { ...(w.daily || {}) }
  }));

  reports.forEach((rep) => {
    if (!rep || rep.isSynthesized) return;

    let repDateStr = rep.workDate || "";
    if (!repDateStr) {
      const match2 = String(rep.workDateFormatted || rep.title || "").match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        const y = match2[1] || "2026";
        const m = String(parseInt(match2[2], 10)).padStart(2, "0");
        const d = String(parseInt(match2[3], 10)).padStart(2, "0");
        repDateStr = `${y}-${m}-${d}`;
      }
    }
    const p = String(repDateStr).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!p) return;
    const repYear = parseInt(p[1], 10);
    const repMonth = parseInt(p[2], 10);
    const day = parseInt(p[3], 10);
    if (isNaN(day) || day < 1 || day > 31) return;

    if (targetYear && repYear !== Number(targetYear)) return;
    if (targetMonth && repMonth !== Number(targetMonth)) return;

    const isWeekend = isWeekendByDate(day, repYear, repMonth);

    // Identify target companies for this report
    const rawComp = String(rep.company || "").trim();
    const isAllGroup = !rawComp || rawComp === "전체" || rawComp === "5개사 통합" || rawComp === "전사" || rawComp === "통합" || rawComp === "ALL";
    let targetCompanies = [];
    if (!isAllGroup) {
      targetCompanies = [cleanCompanyName(rep.company)];
    } else if (rep.plant === "삼랑진공장") {
      targetCompanies = ["오륙", "유성"];
    } else if (rep.plant === "한림공장") {
      targetCompanies = ["조영", "한울", "부림텍"];
    } else if (Array.isArray(rep.companies) && rep.companies.length > 0) {
      targetCompanies = rep.companies.map(cleanCompanyName);
    } else {
      targetCompanies = COMPANIES.map(cleanCompanyName);
    }

    if (Array.isArray(rep.items) && rep.items.length > 0) {
      rep.items.forEach((it) => {
        if (!it) return;
        const wName = String(it.workerName || it.name || it.worker || it.empName || it.userName || "").trim();
        if (!wName) return;
        const cleanItName = cleanWorkerNameOnly(wName);
        const itComp = cleanCompanyName(it.company || it.factory || "");

        const targetW = matrix.find((w) => {
          const cleanW = cleanWorkerNameOnly(w.name);
          const sameName = (w.name || "").trim() === wName || (cleanItName && cleanW === cleanItName);
          if (!sameName) return false;
          const wComp = cleanCompanyName(w.company);
          if (itComp && itComp !== "전체" && itComp !== "5개사 통합") {
            return matchCompany(itComp, wComp);
          }
          return targetCompanies.some((tc) => matchCompany(tc, wComp));
        });

        if (targetW) {
          const curVal = targetW.daily ? (targetW.daily[day] !== undefined ? targetW.daily[day] : targetW.daily[String(day)]) : undefined;
          const curStr = String(curVal ?? "").trim();
          const isCurEmpty = !curStr || curStr === "" || curStr === "미입력" || curStr === "undefined" || curStr === "null";

          let rawCode = it.attendanceCode || it.code || it.attendance || it.status || "";
          let code = String(rawCode || "").trim();
          if (!code) {
            const contentStr = `${it.workContent || ""} ${it.workDetails || ""} ${it.note || ""}`;
            if (contentStr.includes("결근")) code = "결근";
            else if (contentStr.includes("병결")) code = "병결";
            else if (contentStr.includes("사결")) code = "사결";
            else if (contentStr.includes("공결")) code = "공결";
            else if (contentStr.includes("연차")) code = "연차";
            else if (contentStr.includes("휴가")) code = "휴가";
            else if (contentStr.includes("반차")) code = "반차";
            else if (contentStr.includes("야간")) code = "야간";
            else if (it.hours >= 13 || it.endTime === "22:00") code = "22";
            else if (it.hours >= 12 || it.endTime === "21:00") code = "21";
            else if (it.hours >= 10 || it.endTime === "19:00") code = "19";
            else if (it.hours > 0) code = isWeekend ? "특근" : "🟢";
            else code = isWeekend ? "-" : "결근";
          }

          // 🔒 Strict Preservation: ONLY hydrate if the matrix cell is truly empty/unwritten.
          // Never overwrite an explicit entry (like '-', '결근', '연차', '반차', '정시', '19', '21', etc.)
          if (isCurEmpty) {
            if (!targetW.daily) targetW.daily = {};
            targetW.daily[day] = code;
            targetW.daily[String(day)] = code;
            hasHealed = true;
          }
        }
      });
    }
  });

  return { matrix, hasHealed };
};

export const ensureAllCompaniesPresent = (data) => {
  if (!data || !Array.isArray(data.attendanceMatrix) || data.attendanceMatrix.length === 0) {
    return INITIAL_SMART_OVERTIME_DATA;
  }

  const matrix = data.attendanceMatrix.map((w) => {
    const rawName = (w.name || "").trim();
    const comp = cleanCompanyName(w.company);
    return {
      ...w,
      company: comp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: rawName,
      position: w.position || "사원",
      daily: { ...(w.daily || {}) }
    };
  });

  const master = matrix.map((w) => ({
    company: w.company,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: w.name,
    position: w.position || "사원",
    employmentType: w.employmentType || "정규직",
    status: w.status || "재직",
    note: w.note || ""
  }));

  const compCounters = {};
  const reindexedMatrix = matrix.map((w) => {
    const comp = cleanCompanyName(w.company);
    compCounters[comp] = (compCounters[comp] || 0) + 1;
    return {
      ...w,
      company: comp,
      companyNo: compCounters[comp],
      no: compCounters[comp]
    };
  });

  const compMasterCounters = {};
  const reindexedMaster = master.map((w) => {
    const comp = cleanCompanyName(w.company);
    compMasterCounters[comp] = (compMasterCounters[comp] || 0) + 1;
    return {
      ...w,
      company: comp,
      companyNo: compMasterCounters[comp],
      no: compMasterCounters[comp]
    };
  });

  return {
    ...data,
    attendanceMatrix: reindexedMatrix,
    masterWorkers: reindexedMaster
  };
};
