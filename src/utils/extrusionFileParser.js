import * as XLSX from "xlsx";

/**
 * Detects line key from dropped file name or target lineKey
 * @param {string} fileName 
 * @param {string} [fallbackLineKey] 
 * @returns {string} "pcm1" | "pcm3" | "pvc" | "tpe"
 */
export const detectExtrusionLineKey = (fileName, fallbackLineKey = "pcm1") => {
  if (!fileName) return fallbackLineKey;
  const lower = fileName.toLowerCase().replace(/[\s_\-#]/g, "");

  if (lower.includes("pcm1") || lower.includes("1호") || lower.includes("pcm#1")) return "pcm1";
  if (lower.includes("pcm3") || lower.includes("3호") || lower.includes("pcm#3")) return "pcm3";
  if (lower.includes("pvc") || lower.includes("피브이씨")) return "pvc";
  if (lower.includes("tpe") || lower.includes("티피이")) return "tpe";

  return fallbackLineKey;
};

/**
 * Helper to sort week keys chronologically and sequentially (1주 -> 2주 -> 3주 -> 4주 -> 5주)
 */
export const getWeekSortKey = (weekStr = "") => {
  if (!weekStr || typeof weekStr !== "string") return 999999;
  const str = weekStr.trim();

  // Pattern 1: "9월1주", "9월 1주", "9월1주차", "09월 01주"
  const mwMatch = str.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*주/i);
  if (mwMatch) {
    const month = parseInt(mwMatch[1], 10);
    const week = parseInt(mwMatch[2], 10);
    return month * 1000 + week * 10;
  }

  // Pattern 2: "9월" only
  const mOnlyMatch = str.match(/(\d{1,2})\s*월/i);
  if (mOnlyMatch) {
    const month = parseInt(mOnlyMatch[1], 10);
    return month * 1000 + 500;
  }

  // Pattern 3: "1주", "2주", "3주차", "W1", "W01"
  const wOnlyMatch = str.match(/(\d{1,2})\s*(?:주|w|week)/i);
  if (wOnlyMatch) {
    const week = parseInt(wOnlyMatch[1], 10);
    return 100000 + week * 10;
  }

  // Pattern 4: Numeric extract
  const numMatch = str.match(/\d+/);
  if (numMatch) {
    return 200000 + parseInt(numMatch[0], 10);
  }

  return 999999;
};

export const sortExtrusionWeeks = (weekKeys = []) => {
  if (!Array.isArray(weekKeys)) return [];
  return [...weekKeys].sort((a, b) => {
    const keyA = getWeekSortKey(a);
    const keyB = getWeekSortKey(b);
    if (keyA !== keyB) return keyA - keyB;
    return a.localeCompare(b, "ko", { numeric: true });
  });
};

/**
 * Robust filter to eliminate any meaningless summary/total/empty rows
 */
export const sanitizeExtrusionRows = (rawRows = []) => {
  if (!Array.isArray(rawRows)) return [];
  return rawRows.filter((r) => {
    if (!r || typeof r !== "object") return false;

    const noStr = String(r.no || "").trim();
    const taskStr = String(r.task || "").trim();
    const dateStr = String(r.date || "").trim();
    const dayStr = String(r.day || "").trim();
    const noteStr = String(r.note || "").trim();

    // 1. Filter out summary / total / calculation lines
    const isSumOrFooter =
      noStr.includes("합계") ||
      noStr.includes("총계") ||
      noStr.includes("소계") ||
      noStr.includes("집계") ||
      noStr.includes("TOTAL") ||
      noStr.includes("SUM") ||
      taskStr.includes("합계") ||
      taskStr.includes("총 합계") ||
      taskStr.includes("실적 총") ||
      noteStr.includes("실시간 동적") ||
      noteStr.includes("가동률 및 비가동 합산");

    if (isSumOrFooter) return false;

    // 2. Filter out phantom rows that have no task description AND no date
    const isPhantomEmpty =
      (!taskStr || taskStr === "-") &&
      (!dateStr || dateStr === "-") &&
      (!dayStr || dayStr === "-");

    if (isPhantomEmpty) return false;

    return true;
  });
};

/**
 * Parses an Excel file (.xlsx, .xls) containing weekly downtime sheets
 * @param {File} file 
 * @returns {Promise<{ fileName: string, updatedAt: string, sheets: Record<string, any> }>}
 */
export const parseExtrusionExcelFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  const rawSheets = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!data || data.length < 5) continue;

    // Search for header row
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const rowStr = (data[i] || []).map((c) => String(c)).join(" ");
      if (
        rowStr.includes("No") &&
        (rowStr.includes("작업내용") || rowStr.includes("비가동") || rowStr.includes("일자") || rowStr.includes("구분"))
      ) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) continue;

    const headers = (data[headerRowIdx] || []).map((h) => String(h).trim());
    const colNo = headers.findIndex((h) => h.includes("No") || h.includes("순번"));
    const colDate = headers.findIndex((h) => h.includes("일자"));
    const colDay = headers.findIndex((h) => h.includes("요일"));
    const colShift = headers.findIndex((h) => h.includes("근무조"));
    const colCat = headers.findIndex((h) => h.includes("구분"));
    const colTask = headers.findIndex((h) => h.includes("작업내용") || h.includes("품명"));
    const colMin = headers.findIndex((h) => h.includes("비가동") || h.includes("시간(분)"));
    const colWeight = headers.findIndex((h) => h.includes("중량") || h.includes("kg"));
    const colPlan = headers.findIndex((h) => h.includes("계획정지"));
    const colNote = headers.findIndex((h) => h.includes("LOSS") || h.includes("비고"));
    const colAction = headers.findIndex((h) => h.includes("조치사항") || h.includes("결과"));

    const rows = [];
    let totalDowntime = 0;
    let planStop = 0;
    let totalScrapKg = 0;

    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      const rawNo = colNo !== -1 ? String(row[colNo] || "").trim() : "";
      const task = colTask !== -1 ? String(row[colTask] || "").trim() : "";
      const minVal = colMin !== -1 ? Number(row[colMin]) || 0 : 0;
      const weightVal = colWeight !== -1 ? Number(row[colWeight]) || 0 : 0;
      const dateVal = colDate !== -1 ? String(row[colDate] || "").trim() : "";
      const dayVal = colDay !== -1 ? String(row[colDay] || "").trim() : "";
      const shiftVal = colShift !== -1 ? String(row[colShift] || "").trim() : "주간";
      const catVal = colCat !== -1 ? String(row[colCat] || "").trim() : "정상생산";
      const planVal = colPlan !== -1 ? String(row[colPlan] || "").trim().toUpperCase() : "N";
      const noteVal = colNote !== -1 ? String(row[colNote] || "").trim() : "";
      const actionVal = colAction !== -1 ? String(row[colAction] || "").trim() : "";

      // 1. Skip summary / total / footer rows at the bottom of the worksheet
      const isTotalRow =
        rawNo.includes("합계") ||
        rawNo.includes("총계") ||
        rawNo.includes("소계") ||
        rawNo.includes("집계") ||
        rawNo.includes("TOTAL") ||
        rawNo.includes("SUM") ||
        row.some((c) => typeof c === "string" && (c.includes("합계") || c.includes("총 합계") || c.includes("주간 실적 총") || c.includes("소계")));

      if (isTotalRow) continue;

      // 2. Skip empty rows without task description AND without valid date
      if (!task && !dateVal && !dayVal) continue;

      // 3. Skip template placeholder rows where date is empty and minutes is 0
      if (!task && minVal === 0 && weightVal === 0) continue;

      rows.push({
        id: `${sheetName}_row_${r}`,
        no: Number(rawNo) || rows.length + 1,
        date: dateVal,
        day: dayVal,
        shift: shiftVal,
        category: catVal,
        task: task,
        minutes: minVal,
        weight: weightVal,
        plan: planVal,
        note: noteVal,
        action: actionVal
      });

      totalDowntime += minVal;
      totalScrapKg += weightVal;
      if (planVal === "Y") planStop += minVal;
    }

    const totalRunMinutes = 7200; // 5일 24시간 가동 기준 7,200분
    const netDowntime = Math.max(0, totalDowntime - planStop);
    const netRunTime = Math.max(0, totalRunMinutes - planStop);
    const opRate =
      totalRunMinutes > 0
        ? `${(((totalRunMinutes - totalDowntime) / totalRunMinutes) * 100).toFixed(1)}%`
        : "100.0%";
    const netOpRate =
      netRunTime > 0
        ? `${(((netRunTime - netDowntime) / netRunTime) * 100).toFixed(1)}%`
        : "100.0%";

    rawSheets[sheetName] = {
      sheetName,
      totalRunMinutes,
      totalDowntime,
      totalDowntimeHours: (totalDowntime / 60).toFixed(1),
      planStop,
      netDowntime,
      totalScrapKg: Number(totalScrapKg.toFixed(1)),
      opRate,
      netOpRate,
      rowsCount: rows.length,
      rows
    };
  }

  // Sort sheets sequentially from week 1 (1주 -> 2주 -> 3주 ...)
  const sortedWeekKeys = sortExtrusionWeeks(Object.keys(rawSheets));
  const sortedSheets = {};
  sortedWeekKeys.forEach((k) => {
    sortedSheets[k] = rawSheets[k];
  });

  return {
    fileName: file.name,
    updatedAt: new Date().toISOString(),
    sheets: sortedSheets
  };
};
