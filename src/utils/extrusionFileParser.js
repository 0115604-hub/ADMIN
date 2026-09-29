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
 * Parses an Excel file (.xlsx, .xls) containing weekly downtime sheets
 * @param {File} file 
 * @returns {Promise<{ fileName: string, updatedAt: string, sheets: Record<string, any> }>}
 */
export const parseExtrusionExcelFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  const result = {
    fileName: file.name,
    updatedAt: new Date().toISOString(),
    sheets: {}
  };

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

      // Skip empty template placeholder rows
      if (!task && minVal === 0 && weightVal === 0 && !dateVal) continue;

      rows.push({
        id: `${sheetName}_row_${r}`,
        no: colNo !== -1 ? row[colNo] : rows.length + 1,
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

    result.sheets[sheetName] = {
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

  return result;
};
