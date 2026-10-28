import CANONICAL_QUALITY_RECORDS from "../../data/canonicalQualityRecords.js";

export const COLLECTION_NAME = "daily_quality_records";
export const STORAGE_KEY = "factory_daily_quality_records_v4_exact";

export const QUALITY_CORE_ITEMS = [
  { id: "ja", name: "JA G-RUN", carModel: "JA", defaultUnitPrice: 3116, defaultDefectReason: "둔각 떨어짐, 수포, 스코치" },
  { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", defaultUnitPrice: 5747, defaultDefectReason: "스코치, 직_삽입불량, 사상불량" },
  { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", defaultUnitPrice: 5747, defaultDefectReason: "사상불량, 둔_삽입불량" },
  { id: "hr", name: "HR G-RUN", carModel: "HR", defaultUnitPrice: 2372, defaultDefectReason: "직각 떨어짐, 둔각 떨어짐, 스코치" }
];

export const INITIAL_QUALITY_RECORDS = CANONICAL_QUALITY_RECORDS;

export const getDayOfWeek = (dateStr) => {
  try {
    const d = new Date(dateStr);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return dayNames[d.getDay()] || "월";
  } catch {
    return "월";
  }
};

/**
 * Get Previous Year-Month (e.g. "2026-09" -> "2026-08")
 */
export const getPreviousYearMonth = (yearMonth = "2026-09") => {
  try {
    const [y, m] = (yearMonth || "2026-09").split("-").map(Number);
    if (m === 1) {
      return `${y - 1}-12`;
    }
    return `${y}-${String(m - 1).padStart(2, "0")}`;
  } catch {
    return "2026-08";
  }
};

/**
 * Generate a strict composite key: qual_YYYY-MM-DD_itemId
 * This ensures that duplicate uploads overwrite existing entries cleanly.
 */
export const generateQualityRecordId = (date, itemId) => {
  const cleanDate = String(date || "2026-09-01").trim();
  const cleanItemId = String(itemId || "ja").toLowerCase().trim();
  return `qual_${cleanDate}_${cleanItemId}`;
};

/**
 * Sanitize a single quality record
 */
export const sanitizeQualityRecord = (rec) => {
  if (!rec || typeof rec !== "object") return null;
  const date = String(rec.date || "2026-09-01").trim();
  const yearMonth = rec.yearMonth || (date.length >= 7 ? date.slice(0, 7) : "2026-09");
  const itemId = String(rec.itemId || "ja").toLowerCase().trim();
  const id = rec.id || generateQualityRecordId(date, itemId);
  const inspectQty = Math.max(0, Math.round(Number(rec.inspectQty) || 0));
  const defectQty = Math.max(0, Math.round(Number(rec.defectQty) || 0));
  const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
  
  const coreDef = QUALITY_CORE_ITEMS.find((c) => c.id === itemId) || QUALITY_CORE_ITEMS[0];
  const unitPrice = Number(rec.unitPrice) || coreDef.defaultUnitPrice || 3116;
  const lossAmount = rec.lossAmount !== undefined ? Math.round(Number(rec.lossAmount) || 0) : Math.round(defectQty * unitPrice);

  const dayOfWeek = rec.dayOfWeek || getDayOfWeek(date);

  // 4 Material Waste / Scrap Quantities (소재 A, B, C, D)
  const scrapA = Math.max(0, Math.round(Number(rec.scrapA) || 0));
  const scrapB = Math.max(0, Math.round(Number(rec.scrapB) || 0));
  const scrapC = Math.max(0, Math.round(Number(rec.scrapC) || 0));
  const scrapD = Math.max(0, Math.round(Number(rec.scrapD) || 0));
  const scrapTotal = rec.scrapTotal !== undefined 
    ? Math.max(0, Math.round(Number(rec.scrapTotal) || 0)) 
    : (scrapA + scrapB + scrapC + scrapD);

  // If defectQty is 0, worstReason is "-"
  let worstReason = "-";
  if (defectQty > 0) {
    worstReason = String(rec.worstReason && rec.worstReason !== "-" ? rec.worstReason : coreDef.defaultDefectReason);
  }

  return {
    id,
    date,
    yearMonth,
    dayOfWeek,
    itemId,
    itemName: rec.itemName || coreDef.name,
    carModel: rec.carModel || coreDef.carModel,
    inspectQty,
    defectQty,
    defectRate,
    worstReason,
    lossAmount,
    scrapA,
    scrapB,
    scrapC,
    scrapD,
    scrapTotal,
    uploader: String(rec.uploader || "이창엽 책임"),
    updatedAt: new Date().toISOString()
  };
};
