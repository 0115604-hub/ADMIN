import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

export const COLLECTION_NAME = "daily_quality_records";
export const STORAGE_KEY = "factory_daily_quality_records_v4_exact";

export const QUALITY_CORE_ITEMS = [
  { id: "ja", name: "JA G-RUN", carModel: "JA", defaultUnitPrice: 3116, defaultDefectReason: "둔각 떨어짐, 수포, 스코치" },
  { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", defaultUnitPrice: 5747, defaultDefectReason: "스코치, 직_삽입불량, 사상불량" },
  { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", defaultUnitPrice: 5747, defaultDefectReason: "사상불량, 둔_삽입불량" },
  { id: "hr", name: "HR G-RUN", carModel: "HR", defaultUnitPrice: 2372, defaultDefectReason: "직각 떨어짐, 둔각 떨어짐, 스코치" }
];

export const INITIAL_QUALITY_RECORDS = [];

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
    uploader: String(rec.uploader || "이창엽 선임"),
    updatedAt: new Date().toISOString()
  };
};

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
 * Read local storage records
 */
export const getLocalQualityRecords = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map((r) => sanitizeQualityRecord(r))
        .filter((r) => r && r.id)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }
    return [];
  } catch (e) {
    console.error("getLocalQualityRecords error:", e);
    return [];
  }
};

/**
 * Save records locally and dispatch custom event
 */
export const saveLocalQualityRecords = (records) => {
  try {
    const map = new Map();
    (records || []).forEach((r) => {
      const sanitized = sanitizeQualityRecord(r);
      if (sanitized && sanitized.id) {
        map.set(sanitized.id, sanitized);
      }
    });
    const uniqueArray = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueArray));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quality-records-updated", { detail: uniqueArray }));
    }
    return uniqueArray;
  } catch (e) {
    console.error("saveLocalQualityRecords error:", e);
    return records || [];
  }
};

/**
 * Real-time Firestore Subscription with LocalStorage Fallback
 */
export const subscribeQualityRecords = (callback) => {
  const localInitial = getLocalQualityRecords();
  if (callback) callback(localInitial);

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const remoteRecords = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            remoteRecords.push({ id: d.id, ...d.data() });
          });
        }
        const finalArray = remoteRecords
          .map((r) => sanitizeQualityRecord(r))
          .filter((r) => r && r.id)
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        saveLocalQualityRecords(finalArray);
        if (callback) callback(finalArray);
      },
      (error) => {
        console.warn("Quality Firestore subscription warning, using local cache:", error);
        if (callback) callback(getLocalQualityRecords());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeQualityRecords error:", e);
    return () => {};
  }
};

/**
 * Save a batch of quality records (Deduplication guarantee & Firestore Chunking)
 */
export const saveQualityRecordsBatch = async (recordsToSave = []) => {
  if (!recordsToSave || recordsToSave.length === 0) return [];

  const localCurrent = getLocalQualityRecords();
  const map = new Map();
  localCurrent.forEach((r) => {
    if (r && r.id) map.set(r.id, r);
  });

  const sanitizedList = recordsToSave.map((r) => sanitizeQualityRecord(r)).filter((r) => r && r.id);
  sanitizedList.forEach((r) => {
    if (r && r.id) map.set(r.id, r);
  });

  const finalMerged = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  saveLocalQualityRecords(finalMerged);

  try {
    // Chunk Firestore batch writes into max 400 documents per commit
    const chunkSize = 400;
    for (let i = 0; i < sanitizedList.length; i += chunkSize) {
      const chunk = sanitizedList.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((rec) => {
        const docRef = doc(db, COLLECTION_NAME, rec.id);
        batch.set(docRef, rec, { merge: true });
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn("Firestore saveQualityRecordsBatch fallback to local storage:", e);
  }

  return finalMerged;
};

/**
 * Delete a single record
 */
export const deleteQualityRecord = async (recordId) => {
  const localCurrent = getLocalQualityRecords();
  const filtered = localCurrent.filter((r) => r.id !== recordId);
  saveLocalQualityRecords(filtered);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, recordId));
  } catch (e) {
    console.warn("Firestore deleteQualityRecord fallback to local:", e);
  }
  return filtered;
};

/**
 * Delete all quality records for a specific date
 */
export const deleteQualityRecordsByDate = async (dateStr) => {
  if (!dateStr) return [];
  const localCurrent = getLocalQualityRecords();
  const toDelete = localCurrent.filter((r) => r.date === dateStr);
  const remaining = localCurrent.filter((r) => r.date !== dateStr);
  saveLocalQualityRecords(remaining);

  try {
    const batch = writeBatch(db);
    toDelete.forEach((r) => {
      const docRef = doc(db, COLLECTION_NAME, r.id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (e) {
    console.warn("Firestore deleteQualityRecordsByDate fallback to local:", e);
  }
  return remaining;
};

/**
 * Compute Monthly Aggregation (No Duplicates, Dynamic Reason Breakdown & 4-Material Waste Scrap)
 */
export const getQualityMonthlyAggregation = (allRecords = [], yearMonth = "2026-09") => {
  const targetYM = yearMonth || "2026-09";
  const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));

  let totalInspectQty = 0;
  let totalDefectQty = 0;
  let totalLossAmount = 0;
  let totalScrapA = 0;
  let totalScrapB = 0;
  let totalScrapC = 0;
  let totalScrapD = 0;
  let totalScrapQty = 0;

  const itemMap = {
    ja: { id: "ja", name: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "둔각 떨어짐 (20건), 수포 (23건), 스코치 (6건)", dailyRecords: [] },
    nx4a: { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "스코치 (12건), 직_삽입불량 (4건), 둔_삽입불량 (4건)", dailyRecords: [] },
    nx4: { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "사상불량 (4건), 둔_삽입불량 (5건)", dailyRecords: [] },
    hr: { id: "hr", name: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "직각 떨어짐 (5건), 둔각 떨어짐 (5건), 스코치 (5건)", dailyRecords: [] }
  };

  // August baseline static dataset if full records not imported
  if (targetYM === "2026-08" && monthRecords.length <= 24) {
    itemMap.ja.inspectQty = 57596;
    itemMap.ja.defectQty = 732;
    itemMap.ja.lossAmount = 2281050;
    itemMap.ja.worstReason = "수포 (318건), 둔_어퍼떨어짐 (198건), 직_어퍼떨어짐 (112건)";

    itemMap.nx4a.inspectQty = 50400;
    itemMap.nx4a.defectQty = 302;
    itemMap.nx4a.lossAmount = 1735594;
    itemMap.nx4a.scrapA = 78;
    itemMap.nx4a.scrapB = 54;
    itemMap.nx4a.scrapC = 32;
    itemMap.nx4a.scrapD = 0;
    itemMap.nx4a.scrapTotal = 164;
    itemMap.nx4a.worstReason = "스코치 (148건), 직_찢어짐 (62건), 사상불량 (44건)";

    itemMap.nx4.inspectQty = 25880;
    itemMap.nx4.defectQty = 34;
    itemMap.nx4.lossAmount = 195398;
    itemMap.nx4.scrapA = 36;
    itemMap.nx4.scrapB = 22;
    itemMap.nx4.scrapC = 14;
    itemMap.nx4.scrapD = 0;
    itemMap.nx4.scrapTotal = 72;
    itemMap.nx4.worstReason = "사상불량 (18건), 둔_삽입불량 (9건), 기타 (7건)";

    itemMap.hr.inspectQty = 20858;
    itemMap.hr.defectQty = 270;
    itemMap.hr.lossAmount = 640380;
    itemMap.hr.worstReason = "직_어퍼떨어짐 (218건), 둔_어퍼떨어짐 (46건), 치수불량 (6건)";
  }

  // Accumulate daily records into itemMap
  monthRecords.forEach((r) => {
    const it = itemMap[r.itemId];
    if (it) {
      it.dailyRecords.push(r);
      if (targetYM !== "2026-08" || monthRecords.length > 24) {
        it.inspectQty += r.inspectQty;
        it.defectQty += r.defectQty;
        it.lossAmount += r.lossAmount;
        it.scrapA += (r.scrapA || 0);
        it.scrapB += (r.scrapB || 0);
        it.scrapC += (r.scrapC || 0);
        it.scrapD += (r.scrapD || 0);
        it.scrapTotal += (r.scrapTotal || ((r.scrapA || 0) + (r.scrapB || 0) + (r.scrapC || 0) + (r.scrapD || 0)));
      }
    }
  });

  const items = Object.values(itemMap).map((it) => {
    const rate = it.inspectQty > 0 ? Number(((it.defectQty / it.inspectQty) * 100).toFixed(2)) : 0;
    it.defectRate = rate;

    // Dynamic Monthly Worst Reason Calculation
    if (targetYM !== "2026-08" || monthRecords.length > 24) {
      if (it.defectQty === 0) {
        it.worstReason = "-";
      } else if (it.dailyRecords.length > 0) {
        const reasonTally = new Map();
        it.dailyRecords.forEach((dr) => {
          if (dr.defectQty > 0 && dr.worstReason && dr.worstReason !== "-") {
            // Split multiple reasons like "둔각 떨어짐 (7건), 수포 (5건)" or "수포, 스코치"
            const parts = dr.worstReason.split(/[,/·\n]/).map((p) => p.trim()).filter(Boolean);
            parts.forEach((p) => {
              const match = p.match(/^(.+?)\s*\(([0-9]+)\s*건?\)$/);
              if (match) {
                const name = match[1].trim();
                const cnt = parseInt(match[2], 10) || 1;
                reasonTally.set(name, (reasonTally.get(name) || 0) + cnt);
              } else {
                reasonTally.set(p, (reasonTally.get(p) || 0) + 1);
              }
            });
          }
        });

        if (reasonTally.size > 0) {
          const sortedReasons = Array.from(reasonTally.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, cnt]) => `${name} (${cnt}건)`);
          it.worstReason = sortedReasons.join(", ");
        }
      }
    }

    totalInspectQty += it.inspectQty;
    totalDefectQty += it.defectQty;
    totalLossAmount += it.lossAmount;
    totalScrapA += it.scrapA;
    totalScrapB += it.scrapB;
    totalScrapC += it.scrapC;
    totalScrapD += it.scrapD;
    totalScrapQty += it.scrapTotal;
    return it;
  });

  // Sort by defectRate descending
  items.sort((a, b) => (Number(b.defectRate) || 0) - (Number(a.defectRate) || 0));

  const overallDefectRate = totalInspectQty > 0 ? Number(((totalDefectQty / totalInspectQty) * 100).toFixed(2)) : 0;
  const maxDefectItem = items.reduce((max, cur) => (cur.defectRate > max.defectRate ? cur : max), items[0]);

  // Specific scrap summary for NX4 and NX4a (소재 A, B, C, D 4종 소재)
  const nx4Scrap = itemMap.nx4;
  const nx4aScrap = itemMap.nx4a;
  const core3MaterialsScrap = {
    scrapA: nx4Scrap.scrapA + nx4aScrap.scrapA,
    scrapB: nx4Scrap.scrapB + nx4aScrap.scrapB,
    scrapC: nx4Scrap.scrapC + nx4aScrap.scrapC,
    scrapD: nx4Scrap.scrapD + nx4aScrap.scrapD,
    scrapTotal: nx4Scrap.scrapTotal + nx4aScrap.scrapTotal,
    nx4: { scrapA: nx4Scrap.scrapA, scrapB: nx4Scrap.scrapB, scrapC: nx4Scrap.scrapC, scrapD: nx4Scrap.scrapD, scrapTotal: nx4Scrap.scrapTotal },
    nx4a: { scrapA: nx4aScrap.scrapA, scrapB: nx4aScrap.scrapB, scrapC: nx4aScrap.scrapC, scrapD: nx4aScrap.scrapD, scrapTotal: nx4aScrap.scrapTotal }
  };

  return {
    yearMonth: targetYM,
    totalInspectQty,
    totalDefectQty,
    overallDefectRate,
    totalDefectRate: overallDefectRate, // For backward compatibility
    totalLossAmount,
    totalScrapA,
    totalScrapB,
    totalScrapC,
    totalScrapD,
    totalScrapQty,
    core3MaterialsScrap,
    core4MaterialsScrap: core3MaterialsScrap,
    maxDefectItem,
    items,
    monthRecordsCount: monthRecords.length
  };
};

/**
 * Compute Daily Aggregation (Date by Date rows)
 */
export const getQualityDailyAggregation = (allRecords = [], yearMonth = "2026-09") => {
  const targetYM = yearMonth || "2026-09";
  const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));

  const dateMap = new Map();
  monthRecords.forEach((r) => {
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, {
        date: r.date,
        dayOfWeek: r.dayOfWeek || getDayOfWeek(r.date),
        totalInspectQty: 0,
        totalDefectQty: 0,
        totalLossAmount: 0,
        totalScrapA: 0,
        totalScrapB: 0,
        totalScrapC: 0,
        totalScrapD: 0,
        totalScrapQty: 0,
        items: {},
        records: []
      });
    }
    const dayData = dateMap.get(r.date);
    dayData.records.push(r);
    dayData.items[r.itemId] = r;
    dayData.totalInspectQty += r.inspectQty;
    dayData.totalDefectQty += r.defectQty;
    dayData.totalLossAmount += r.lossAmount;
    dayData.totalScrapA += (r.scrapA || 0);
    dayData.totalScrapB += (r.scrapB || 0);
    dayData.totalScrapC += (r.scrapC || 0);
    dayData.totalScrapD += (r.scrapD || 0);
    dayData.totalScrapQty += (r.scrapTotal || ((r.scrapA || 0) + (r.scrapB || 0) + (r.scrapC || 0) + (r.scrapD || 0)));
  });

  const dailyList = Array.from(dateMap.values()).map((d) => {
    d.defectRate = d.totalInspectQty > 0 ? Number(((d.totalDefectQty / d.totalInspectQty) * 100).toFixed(2)) : 0;
    return d;
  });

  dailyList.sort((a, b) => b.date.localeCompare(a.date));
  return dailyList;
};

/**
 * Helper to parse dates from Excel cells (Serial numbers, Date objects, or text)
 */
export const parseExcelDate = (val, fallbackYM = "2026-09") => {
  if (val === null || val === undefined || val === "") return null;
  const currentYear = fallbackYM.slice(0, 4) || "2026";

  // 1. JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. Excel Serial date number (e.g. 30000 ~ 70000)
  if (typeof val === "number" && val > 30000 && val < 70000) {
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date_info.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 3. Day of month as number 1..31
  if (typeof val === "number" && val >= 1 && val <= 31) {
    return `${fallbackYM}-${String(val).padStart(2, "0")}`;
  }

  // 4. String parsing
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;

    // Full Date: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, YYYY_MM_DD
    const m1 = s.match(/(\d{4})[-_./](\d{1,2})[-_./](\d{1,2})/);
    if (m1) {
      return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
    }

    // Korean full date: 2026년 9월 1일
    const mKorFull = s.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (mKorFull) {
      return `${mKorFull[1]}-${mKorFull[2].padStart(2, "0")}-${mKorFull[3].padStart(2, "0")}`;
    }

    // Korean month-day: 9월 1일, 09월 01일, 9월1일(화)
    const mKor = s.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (mKor) {
      return `${currentYear}-${mKor[1].padStart(2, "0")}-${mKor[2].padStart(2, "0")}`;
    }

    // Month-Day: 9/1, 09-01, 9.1, 9/1(화), 09.01 (월)
    const m2 = s.match(/(\d{1,2})[-_./](\d{1,2})/);
    if (m2) {
      const p1 = parseInt(m2[1], 10);
      const p2 = parseInt(m2[2], 10);
      if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
        return `${currentYear}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
      }
    }

    // Single day: 1일, 01일, 1
    const m3 = s.match(/^(\d{1,2})일?$/);
    if (m3) {
      const dayNum = parseInt(m3[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        return `${fallbackYM}-${String(dayNum).padStart(2, "0")}`;
      }
    }
  }

  return null;
};

/**
 * Robust Multi-file & Multi-sheet Quality Excel Parser
 */
export const parseQualityExcelFiles = async (files = []) => {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return { records: [], count: 0, yearMonth: "2026-09" };

  const parsedRecords = [];
  let detectedYearMonth = "2026-09";

  const unitPrices = {
    ja: 3116,
    nx4a: 5747,
    nx4: 5747,
    hr: 2372
  };
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  for (const file of fileList) {
    let buffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (e) {
      console.error("Failed to read file arrayBuffer:", file.name, e);
      continue;
    }

    let wb;
    try {
      wb = XLSX.read(buffer, { type: "array", cellDates: true });
    } catch (e) {
      console.error("Failed to parse XLSX workbook:", file.name, e);
      continue;
    }

    const sheetNames = wb.SheetNames || [];

    // Detect year-month from file name
    const nameMatch = file.name.match(/(\d{4})[-_.](\d{1,2})/) || file.name.match(/(\d{1,2})월/);
    if (nameMatch) {
      if (nameMatch[1] && nameMatch[2]) {
        detectedYearMonth = `${nameMatch[1]}-${nameMatch[2].padStart(2, "0")}`;
      } else if (nameMatch[1]) {
        detectedYearMonth = `2026-${nameMatch[1].padStart(2, "0")}`;
      }
    }

    const hasJeongri = sheetNames.some((s) => s.includes("정리"));

    for (const sName of sheetNames) {
      const cleanName = sName.trim().toUpperCase();
      if (hasJeongri && cleanName.includes("취합DATA")) {
        continue;
      }

      const ws = wb.Sheets[sName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!Array.isArray(rows) || rows.length < 2) continue;

      let sheetRecordsCount = 0;

      // =========================================================================
      // PATTERN 1: NX4 Matrix Sheet (Contains both NX4 and NX4a)
      // =========================================================================
      if (cleanName.includes("NX4") && (cleanName.includes("정리") || cleanName.includes("종합") || cleanName.includes("취합") || cleanName.includes("통합") || cleanName.includes("실적") || cleanName === "NX4")) {
        let dateCols = [];
        for (let r = 0; r < Math.min(40, rows.length); r++) {
          const row = rows[r] || [];
          const cols = [];
          for (let c = 1; c < row.length; c++) {
            const dStr = parseExcelDate(row[c], detectedYearMonth);
            if (dStr) cols.push({ col: c, dateStr: dStr });
          }
          if (cols.length >= 3) {
            dateCols = cols;
            break;
          }
        }

        if (dateCols.length > 0) {
          let nx4InspRows = [];
          let nx4DefRows = [];
          let nx4aInspRows = [];
          let nx4aDefRows = [];

          for (let r = 0; r < Math.min(50, rows.length); r++) {
            const row = rows[r] || [];
            const label = (String(row[0] || "") + " " + String(row[1] || "") + " " + String(row[2] || "") + " " + String(row[3] || "")).trim().toUpperCase();
            if (label.includes("NX4 FRT") || label.includes("NX4-FRT") || label.includes("NX4FRT") || (label.includes("NX4") && !label.includes("NX4A") && !label.includes("NX4-A") && !label.includes("NX4 A") && r < 42)) {
              if (r < 40 && (label.includes("검사") || label.includes("생산") || label.includes("투입") || r <= 36)) {
                nx4InspRows.push(r);
              } else if (label.includes("불량") || label.includes("부적합") || label.includes("폐기") || (r >= 38 && r <= 42)) {
                nx4DefRows.push(r);
              }
            } else if (label.includes("NX4A") || label.includes("NX4-A") || label.includes("NX4 A")) {
              if (r < 40 && (label.includes("검사") || label.includes("생산") || label.includes("투입") || r <= 38)) {
                nx4aInspRows.push(r);
              } else if (label.includes("불량") || label.includes("부적합") || label.includes("폐기") || (r >= 40 && r <= 44)) {
                nx4aDefRows.push(r);
              }
            }
          }

          if (nx4InspRows.length === 0) { nx4InspRows = [35, 36].filter(r => rows[r]); }
          if (nx4DefRows.length === 0) { nx4DefRows = [40, 41].filter(r => rows[r]); }
          if (nx4aInspRows.length === 0) { nx4aInspRows = [37, 38].filter(r => rows[r]); }
          if (nx4aDefRows.length === 0) { nx4aDefRows = [42, 43].filter(r => rows[r]); }

          dateCols.forEach((d) => {
            const nx4Insp = Math.round(nx4InspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4Def = Math.round(nx4DefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aInsp = Math.round(nx4aInspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aDef = Math.round(nx4aDefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const dt = new Date(d.dateStr);
            const dayOfWeek = dayNames[dt.getDay()] || "월";

            if (nx4Insp > 0 || nx4Def > 0) {
              parsedRecords.push({
                id: `qual_${d.dateStr}_nx4`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: "nx4",
                itemName: "NX4 G-RUN",
                carModel: "NX4",
                inspectQty: nx4Insp,
                defectQty: nx4Def,
                defectRate: nx4Insp > 0 ? Number(((nx4Def / nx4Insp) * 100).toFixed(2)) : 0,
                worstReason: "사상불량, 둔_삽입불량",
                lossAmount: Math.round(nx4Def * unitPrices.nx4),
                uploader: "이창엽 선임"
              });
              sheetRecordsCount++;
            }

            if (nx4aInsp > 0 || nx4aDef > 0) {
              parsedRecords.push({
                id: `qual_${d.dateStr}_nx4a`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: "nx4a",
                itemName: "NX4a G-RUN",
                carModel: "NX4a",
                inspectQty: nx4aInsp,
                defectQty: nx4aDef,
                defectRate: nx4aInsp > 0 ? Number(((nx4aDef / nx4aInsp) * 100).toFixed(2)) : 0,
                worstReason: "스코치, 직_삽입불량, 사상불량",
                lossAmount: Math.round(nx4aDef * unitPrices.nx4a),
                uploader: "이창엽 선임"
              });
              sheetRecordsCount++;
            }
          });

          if (sheetRecordsCount > 0) continue;
        }
      }

      // =========================================================================
      // PATTERN 2: Matrix Individual Model Sheet (JA, HR, NX4, NX4a)
      // =========================================================================
      let matrixItemId = null;
      let matrixItemName = "";
      let matrixCarModel = "";
      let matrixDefaultReason = "";

      if (cleanName.includes("JA")) {
        matrixItemId = "ja"; matrixItemName = "JA G-RUN"; matrixCarModel = "JA"; matrixDefaultReason = "둔각 떨어짐, 수포, 스코치";
      } else if (cleanName.includes("HR")) {
        matrixItemId = "hr"; matrixItemName = "HR G-RUN"; matrixCarModel = "HR"; matrixDefaultReason = "직각 떨어짐, 둔각 떨어짐, 스코치";
      } else if (cleanName.includes("NX4A") || cleanName.includes("NX4-A") || cleanName.includes("NX4 A")) {
        matrixItemId = "nx4a"; matrixItemName = "NX4a G-RUN"; matrixCarModel = "NX4a"; matrixDefaultReason = "스코치, 직_삽입불량, 사상불량";
      } else if (cleanName.includes("NX4")) {
        matrixItemId = "nx4"; matrixItemName = "NX4 G-RUN"; matrixCarModel = "NX4"; matrixDefaultReason = "사상불량, 둔_삽입불량";
      }

      if (matrixItemId) {
        let dateCols = [];
        for (let r = 0; r < Math.min(40, rows.length); r++) {
          const row = rows[r] || [];
          const cols = [];
          for (let c = 1; c < row.length; c++) {
            const dStr = parseExcelDate(row[c], detectedYearMonth);
            if (dStr) cols.push({ col: c, dateStr: dStr });
          }
          if (cols.length >= 3) {
            dateCols = cols;
            break;
          }
        }

        if (dateCols.length > 0) {
          let rowInsp = -1;
          let rowDef = -1;
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r] || [];
            const label = (String(row[0] || "") + " " + String(row[1] || "") + " " + String(row[2] || "") + " " + String(row[3] || "")).replace(/\s+/g, "").toUpperCase();
            if (label.includes("총검사") || label.includes("검사수량") || label.includes("검사합계") || label.includes("검사실적") || (r === 39 && label.includes("합계"))) {
              if (rowInsp === -1) rowInsp = r;
            }
            if (label.includes("총불량") || label.includes("불량수량") || label.includes("불량합계") || label.includes("불량실적") || (r === 44 && label.includes("합계"))) {
              if (rowDef === -1) rowDef = r;
            }
          }

          if (rowInsp === -1 && rows[39]) rowInsp = 39;
          if (rowDef === -1 && rows[44]) rowDef = 44;

          if (rowInsp !== -1 && rowDef !== -1) {
            dateCols.forEach((d) => {
              const insp = Math.round(Number(rows[rowInsp]?.[d.col]) || 0);
              const def = Math.round(Number(rows[rowDef]?.[d.col]) || 0);
              if (insp === 0 && def === 0) return;

              const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
              const loss = Math.round(def * unitPrices[matrixItemId]);
              const dt = new Date(d.dateStr);
              const dayOfWeek = dayNames[dt.getDay()] || "월";

              let reasons = [];
              if (def > 0) {
                for (let r = Math.max(rowDef + 1, 10); r < rows.length; r++) {
                  const row = rows[r];
                  if (!row) continue;
                  const dType = String(row[3] || row[2] || row[1] || "").trim();
                  const cnt = Math.round(Number(row[d.col]) || 0);
                  if (cnt > 0 && typeof dType === "string" && isNaN(Number(dType)) && !dType.includes("합계") && !dType.includes("불량") && !dType.includes("구분") && !dType.includes("TOTAL") && !dType.includes("불량율") && !dType.includes("%")) {
                    reasons.push(`${dType} (${cnt}건)`);
                  }
                }
              }
              const worstReason = def === 0 ? "-" : (reasons.length > 0 ? reasons.slice(0, 3).join(", ") : matrixDefaultReason);

              parsedRecords.push({
                id: `qual_${d.dateStr}_${matrixItemId}`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: matrixItemId,
                itemName: matrixItemName,
                carModel: matrixCarModel,
                inspectQty: insp,
                defectQty: def,
                defectRate: rate,
                worstReason,
                lossAmount: loss,
                uploader: "이창엽 선임"
              });
              sheetRecordsCount++;
            });

            if (sheetRecordsCount > 0) continue;
          }
        }
      }

      // =========================================================================
      // PATTERN 3: Tabular / List Sheet (Row-by-row records e.g. 일일품질검사실적, G-RUN 불량율 집계)
      // =========================================================================
      let colDate = -1;
      let colItem = -1;
      let colInsp = -1;
      let colDef = -1;
      let colReason = -1;
      let colScrapA = -1;
      let colScrapB = -1;
      let colScrapC = -1;
      let colScrapD = -1;
      let colScrapTotal = -1;
      let headerRowIndex = -1;

      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const h = String(row[c] || "").replace(/\s+/g, "").toUpperCase();
          if (h.includes("일자") || h.includes("날짜") || h.includes("DATE") || h.includes("검사일자") || h.includes("생산일자")) colDate = c;
          if (h.includes("차종") || h.includes("품명") || h.includes("품목") || h.includes("아이템") || h.includes("ITEM") || h.includes("모델")) colItem = c;
          if (h.includes("검사수량") || h.includes("검사수") || h.includes("생산수량") || h.includes("검사실적") || h.includes("투입수량") || h.includes("INSPECT")) colInsp = c;
          if (h.includes("불량수량") || h.includes("불량수") || h.includes("부적합수량") || h.includes("DEFECT")) colDef = c;
          if (h.includes("불량사유") || h.includes("불량유형") || h.includes("불량원인") || h.includes("현상") || h.includes("사유") || h.includes("WORST") || h.includes("특이사항")) colReason = c;
          if (h.includes("소재A") || h.includes("소재1") || h.includes("폐기A")) colScrapA = c;
          if (h.includes("소재B") || h.includes("소재2") || h.includes("폐기B")) colScrapB = c;
          if (h.includes("소재C") || h.includes("소재3") || h.includes("폐기C")) colScrapC = c;
          if (h.includes("소재D") || h.includes("소재4") || h.includes("폐기D")) colScrapD = c;
          if (h.includes("폐기수량") || h.includes("총폐기") || h.includes("폐기합계") || h.includes("SCRAP")) colScrapTotal = c;
        }
        if (colInsp >= 0 || colDef >= 0 || (colDate >= 0 && colItem >= 0)) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex >= 0) {
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          // Check if row is empty or summary footer
          const firstCells = (String(row[0] || "") + String(row[1] || "") + String(row[2] || "")).trim();
          if (firstCells.includes("합계") || firstCells.includes("TOTAL") || firstCells.includes("누계")) continue;

          // Parse Date
          let dateStr = null;
          if (colDate >= 0 && row[colDate]) {
            dateStr = parseExcelDate(row[colDate], detectedYearMonth);
          }
          if (!dateStr) {
            // Fallback from other columns
            for (let c = 0; c < Math.min(4, row.length); c++) {
              dateStr = parseExcelDate(row[c], detectedYearMonth);
              if (dateStr) break;
            }
          }
          if (!dateStr) continue;

          // Parse Item
          let rawItem = colItem >= 0 ? String(row[colItem] || "").toUpperCase() : cleanName;
          let targetItemId = "ja";
          if (rawItem.includes("NX4A") || rawItem.includes("NX4-A") || rawItem.includes("NX4 A")) targetItemId = "nx4a";
          else if (rawItem.includes("NX4")) targetItemId = "nx4";
          else if (rawItem.includes("HR")) targetItemId = "hr";
          else if (rawItem.includes("JA")) targetItemId = "ja";
          else {
            if (cleanName.includes("NX4A")) targetItemId = "nx4a";
            else if (cleanName.includes("NX4")) targetItemId = "nx4";
            else if (cleanName.includes("HR")) targetItemId = "hr";
            else if (cleanName.includes("JA")) targetItemId = "ja";
          }

          const coreDef = QUALITY_CORE_ITEMS.find((c) => c.id === targetItemId) || QUALITY_CORE_ITEMS[0];
          const insp = colInsp >= 0 ? Math.max(0, Math.round(Number(String(row[colInsp] || "").replace(/[^0-9.]/g, "")) || 0)) : 0;
          const def = colDef >= 0 ? Math.max(0, Math.round(Number(String(row[colDef] || "").replace(/[^0-9.]/g, "")) || 0)) : 0;
          if (insp === 0 && def === 0) continue;

          const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
          const loss = Math.round(def * (unitPrices[targetItemId] || coreDef.defaultUnitPrice));
          const dt = new Date(dateStr);
          const dayOfWeek = dayNames[dt.getDay()] || "월";

          const worstReason = colReason >= 0 && row[colReason] && String(row[colReason]).trim() !== "-" 
            ? String(row[colReason]).trim() 
            : (def === 0 ? "-" : coreDef.defaultDefectReason);

          const scrapA = colScrapA >= 0 ? Math.max(0, Math.round(Number(row[colScrapA]) || 0)) : 0;
          const scrapB = colScrapB >= 0 ? Math.max(0, Math.round(Number(row[colScrapB]) || 0)) : 0;
          const scrapC = colScrapC >= 0 ? Math.max(0, Math.round(Number(row[colScrapC]) || 0)) : 0;
          const scrapD = colScrapD >= 0 ? Math.max(0, Math.round(Number(row[colScrapD]) || 0)) : 0;
          const scrapTotal = colScrapTotal >= 0 
            ? Math.max(0, Math.round(Number(row[colScrapTotal]) || 0)) 
            : (scrapA + scrapB + scrapC + scrapD);

          parsedRecords.push({
            id: `qual_${dateStr}_${targetItemId}`,
            date: dateStr,
            yearMonth: dateStr.slice(0, 7),
            dayOfWeek,
            itemId: targetItemId,
            itemName: coreDef.name,
            carModel: coreDef.carModel,
            inspectQty: insp,
            defectQty: def,
            defectRate: rate,
            worstReason,
            lossAmount: loss,
            scrapA,
            scrapB,
            scrapC,
            scrapD,
            scrapTotal,
            uploader: "이창엽 선임"
          });
        }
      }
    }
  }

  // Deduplicate against internal list
  const map = new Map();
  parsedRecords.forEach((r) => {
    const s = sanitizeQualityRecord(r);
    if (s && s.id) {
      map.set(s.id, s);
    }
  });

  const uniqueParsed = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return {
    records: uniqueParsed,
    count: uniqueParsed.length,
    yearMonth: detectedYearMonth
  };
};

export const QUALITY_TARGETS_STORAGE_KEY = "factory_quality_target_settings_v1";
export const QUALITY_TARGETS_COLLECTION_NAME = "quality_target_settings";

/**
 * Calculate item-specific quality targets based on previous month's actual defect rate.
 * Rule:
 *  - If prev month actual < 1.00%: target = prevRate * 0.95 (5% lower / 5% reduction)
 *  - If prev month actual >= 1.00%: target = prevRate * 0.90 (10% lower / 10% reduction)
 *  - If prev month actual === 0: default base target (0.50%)
 */
export const calculateItemQualityTargets = (allRecords = [], targetYearMonth = "2026-09") => {
  const prevYM = getPreviousYearMonth(targetYearMonth);
  const prevMonthRecords = (allRecords || []).filter(
    (r) => r.yearMonth === prevYM || (r.date && r.date.startsWith(prevYM))
  );

  const prevItemMap = {};
  QUALITY_CORE_ITEMS.forEach((core) => {
    prevItemMap[core.id] = {
      id: core.id,
      name: core.name,
      carModel: core.carModel,
      inspectQty: 0,
      defectQty: 0
    };
  });

  let prevTotalInspect = 0;
  let prevTotalDefect = 0;

  prevMonthRecords.forEach((r) => {
    const key = r.itemId ? r.itemId.toLowerCase() : "";
    if (prevItemMap[key]) {
      prevItemMap[key].inspectQty += r.inspectQty || 0;
      prevItemMap[key].defectQty += r.defectQty || 0;
      prevTotalInspect += r.inspectQty || 0;
      prevTotalDefect += r.defectQty || 0;
    }
  });

  const calcTarget = (prevRate) => {
    if (prevRate === 0) {
      return {
        targetRate: 0.50,
        reductionPct: 0,
        ruleType: "zero_base",
        ruleDesc: "0% 실적 유지 기준 (기본 0.50% 목표)"
      };
    }
    if (prevRate < 1.0) {
      const target = Number((prevRate * 0.95).toFixed(2));
      return {
        targetRate: Math.max(0.01, target),
        reductionPct: 5,
        ruleType: "5_pct_reduction",
        ruleDesc: "전월 1.0% 미만 (5% 낮게 설정 / 5% 감축)"
      };
    }
    const target = Number((prevRate * 0.90).toFixed(2));
    return {
      targetRate: Math.max(0.01, target),
      reductionPct: 10,
      ruleType: "10_pct_reduction",
      ruleDesc: "전월 1.0% 이상 (10% 낮게 설정 / 10% 집중 감축)"
    };
  };

  const items = {};
  QUALITY_CORE_ITEMS.forEach((core) => {
    const p = prevItemMap[core.id];
    // Fallback if no records in prevMonth
    let fallbackPrevRate = 0.70;
    if (core.id === "ja") fallbackPrevRate = 0.86;
    if (core.id === "nx4a") fallbackPrevRate = 0.76;
    if (core.id === "nx4") fallbackPrevRate = 0.20;
    if (core.id === "hr") fallbackPrevRate = 0.56;

    const prevRate = p.inspectQty > 0 ? Number(((p.defectQty / p.inspectQty) * 100).toFixed(2)) : fallbackPrevRate;
    const targetCalc = calcTarget(prevRate);

    items[core.id] = {
      id: core.id,
      name: core.name,
      carModel: core.carModel,
      prevInspectQty: p.inspectQty,
      prevDefectQty: p.defectQty,
      prevRate,
      targetRate: targetCalc.targetRate,
      reductionPct: targetCalc.reductionPct,
      ruleType: targetCalc.ruleType,
      ruleDesc: targetCalc.ruleDesc
    };
  });

  const prevOverallRate = prevTotalInspect > 0 ? Number(((prevTotalDefect / prevTotalInspect) * 100).toFixed(2)) : 0.62;
  const overallCalc = calcTarget(prevOverallRate);

  return {
    yearMonth: targetYearMonth,
    prevYearMonth: prevYM,
    items,
    overall: {
      id: "overall",
      name: "종합 합계 (4대 차종)",
      carModel: "ALL",
      prevInspectQty: prevTotalInspect,
      prevDefectQty: prevTotalDefect,
      prevRate: prevOverallRate,
      targetRate: overallCalc.targetRate,
      reductionPct: overallCalc.reductionPct,
      ruleType: overallCalc.ruleType,
      ruleDesc: overallCalc.ruleDesc
    },
    updatedAt: new Date().toISOString()
  };
};

/**
 * Get Local Target Settings
 */
export const getLocalQualityTargets = (yearMonth = "2026-09", allRecords = []) => {
  try {
    const raw = localStorage.getItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.items) return parsed;
    }
  } catch (e) {
    console.error("getLocalQualityTargets error:", e);
  }
  return calculateItemQualityTargets(allRecords, yearMonth);
};

/**
 * Save Quality Targets (Local + Firestore)
 */
export const saveQualityTargets = async (yearMonth, targetData) => {
  try {
    const dataToSave = {
      ...targetData,
      yearMonth,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`, JSON.stringify(dataToSave));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quality-targets-updated", { detail: dataToSave }));
    }

    try {
      const docRef = doc(db, QUALITY_TARGETS_COLLECTION_NAME, `targets_${yearMonth}`);
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (fbErr) {
      console.warn("Firestore target save warning (fallback to local):", fbErr);
    }
    return dataToSave;
  } catch (err) {
    console.error("saveQualityTargets error:", err);
    throw err;
  }
};

/**
 * Subscribe to Quality Targets
 */
export const subscribeQualityTargets = (yearMonth = "2026-09", callback, allRecords = []) => {
  let unsubFirestore = null;
  const localData = getLocalQualityTargets(yearMonth, allRecords);
  callback(localData);

  try {
    const docRef = doc(db, QUALITY_TARGETS_COLLECTION_NAME, `targets_${yearMonth}`);
    unsubFirestore = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        localStorage.setItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`, JSON.stringify(data));
        callback(data);
      }
    }, (err) => {
      console.warn("Firestore targets listener fallback to local:", err);
    });
  } catch (e) {
    console.warn("Firestore targets subscribe error:", e);
  }

  const handleLocalUpdate = (e) => {
    if (e.detail && e.detail.yearMonth === yearMonth) {
      callback(e.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("quality-targets-updated", handleLocalUpdate);
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener("quality-targets-updated", handleLocalUpdate);
    }
  };
};

