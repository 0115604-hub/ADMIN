/**
 * Lightweight Extrusion Sanitizer Utilities (Zero XLSX dependency)
 * Extracted from extrusionFileParser to avoid loading heavy XLSX bundles during startup/maintenance.
 */

export const getWeekSortKey = (weekName = "") => {
  if (!weekName) return 999999;
  const match = weekName.match(/(\d+)\s*주/);
  if (match) return parseInt(match[1], 10);
  const numMatch = weekName.match(/\d+/);
  return numMatch ? parseInt(numMatch[0], 10) : 999999;
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
      noStr.includes("계") ||
      noStr.includes("TOTAL") ||
      noStr.includes("SUM") ||
      taskStr.includes("합계") ||
      taskStr.includes("총 합계") ||
      taskStr.includes("비가동 합계") ||
      taskStr.includes("비가동합계") ||
      taskStr.includes("작업시간") ||
      taskStr.includes("실 가동") ||
      taskStr.includes("실가동") ||
      taskStr.includes("가동률") ||
      taskStr.includes("시간당") ||
      taskStr.includes("시간 당") ||
      dateStr.includes("합계") ||
      dayStr.includes("합계") ||
      noteStr.includes("비가동 합계");

    if (isSumOrFooter) return false;

    // 2. Filter out pure formula strings
    if (typeof r.totalHours === "string" && r.totalHours.startsWith("=")) return false;
    if (typeof r.downtimeHours === "string" && r.downtimeHours.startsWith("=")) return false;

    // 3. Must have meaningful row contents
    const hasValues = Object.entries(r).some(([k, val]) => {
      if (k === "_rowIdx" || k === "no") return false;
      const s = String(val ?? "").trim();
      return s !== "" && s !== "-" && s !== "0";
    });

    return hasValues;
  });
};
