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
export const STORAGE_KEY = "factory_daily_quality_records_v3_clean";

export const QUALITY_CORE_ITEMS = [
  { id: "ja", name: "JA G-RUN", carModel: "JA", defaultUnitPrice: 3116, defaultDefectReason: "수포, 어퍼떨어짐" },
  { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", defaultUnitPrice: 5747, defaultDefectReason: "스코치, 직_찢어짐, 사상불량" },
  { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", defaultUnitPrice: 5747, defaultDefectReason: "사상불량, 둔_삽입불량" },
  { id: "hr", name: "HR G-RUN", carModel: "HR", defaultUnitPrice: 2372, defaultDefectReason: "직_어퍼떨어짐, 둔_어퍼떨어짐" }
];

// Initial Seed Records (Structured per date and item with deterministic IDs)
export const INITIAL_QUALITY_RECORDS = [
  // ==========================================
  // 2026-08 실적
  // ==========================================
  // 2026-08-24
  { id: "qual_2026-08-24_ja", date: "2026-08-24", yearMonth: "2026-08", dayOfWeek: "월", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1687, defectQty: 32, defectRate: 1.90, worstReason: "수포 (18건), 둔_어퍼떨어짐 (14건)", lossAmount: 99712, uploader: "이창엽 선임" },
  { id: "qual_2026-08-24_nx4a", date: "2026-08-24", yearMonth: "2026-08", dayOfWeek: "월", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 2, defectRate: 0.17, worstReason: "스코치 (2건)", lossAmount: 11494, uploader: "이창엽 선임" },
  { id: "qual_2026-08-24_nx4", date: "2026-08-24", yearMonth: "2026-08", dayOfWeek: "월", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1440, defectQty: 1, defectRate: 0.07, worstReason: "사상불량 (1건)", lossAmount: 5747, uploader: "이창엽 선임" },
  { id: "qual_2026-08-24_hr", date: "2026-08-24", yearMonth: "2026-08", dayOfWeek: "월", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 520, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // 2026-08-25
  { id: "qual_2026-08-25_ja", date: "2026-08-25", yearMonth: "2026-08", dayOfWeek: "화", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1501, defectQty: 8, defectRate: 0.53, worstReason: "수포 (5건), 직_어퍼떨어짐 (3건)", lossAmount: 24928, uploader: "이창엽 선임" },
  { id: "qual_2026-08-25_nx4a", date: "2026-08-25", yearMonth: "2026-08", dayOfWeek: "화", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 960, defectQty: 3, defectRate: 0.31, worstReason: "사상불량 (2건), 스코치 (1건)", lossAmount: 17241, uploader: "이창엽 선임" },
  { id: "qual_2026-08-25_nx4", date: "2026-08-25", yearMonth: "2026-08", dayOfWeek: "화", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1440, defectQty: 6, defectRate: 0.42, worstReason: "둔_삽입불량 (4건), 사상불량 (2건)", lossAmount: 34482, uploader: "이창엽 선임" },
  { id: "qual_2026-08-25_hr", date: "2026-08-25", yearMonth: "2026-08", dayOfWeek: "화", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 520, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // 2026-08-26
  { id: "qual_2026-08-26_ja", date: "2026-08-26", yearMonth: "2026-08", dayOfWeek: "수", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1744, defectQty: 16, defectRate: 0.92, worstReason: "둔_어퍼떨어짐 (10건), 수포 (6건)", lossAmount: 49856, uploader: "이창엽 선임" },
  { id: "qual_2026-08-26_nx4a", date: "2026-08-26", yearMonth: "2026-08", dayOfWeek: "수", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 26, defectRate: 2.17, worstReason: "스코치 (18건), 직_찢어짐 (8건)", lossAmount: 149422, uploader: "이창엽 선임" },
  { id: "qual_2026-08-26_nx4", date: "2026-08-26", yearMonth: "2026-08", dayOfWeek: "수", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1600, defectQty: 4, defectRate: 0.25, worstReason: "사상불량 (4건)", lossAmount: 22988, uploader: "이창엽 선임" },
  { id: "qual_2026-08-26_hr", date: "2026-08-26", yearMonth: "2026-08", dayOfWeek: "수", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 742, defectQty: 10, defectRate: 1.35, worstReason: "직_어퍼떨어짐 (10건)", lossAmount: 23720, uploader: "이창엽 선임" },

  // 2026-08-27
  { id: "qual_2026-08-27_ja", date: "2026-08-27", yearMonth: "2026-08", dayOfWeek: "목", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1500, defectQty: 5, defectRate: 0.33, worstReason: "수포 (5건)", lossAmount: 15580, uploader: "이창엽 선임" },
  { id: "qual_2026-08-27_nx4a", date: "2026-08-27", yearMonth: "2026-08", dayOfWeek: "목", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 9, defectRate: 0.75, worstReason: "직_찢어짐 (5건), 스코치 (4건)", lossAmount: 51723, uploader: "이창엽 선임" },
  { id: "qual_2026-08-27_nx4", date: "2026-08-27", yearMonth: "2026-08", dayOfWeek: "목", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1440, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-08-27_hr", date: "2026-08-27", yearMonth: "2026-08", dayOfWeek: "목", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 630, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // 2026-08-28
  { id: "qual_2026-08-28_ja", date: "2026-08-28", yearMonth: "2026-08", dayOfWeek: "금", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1685, defectQty: 15, defectRate: 0.89, worstReason: "둔_어퍼떨어짐 (9건), 수포 (6건)", lossAmount: 46740, uploader: "이창엽 선임" },
  { id: "qual_2026-08-28_nx4a", date: "2026-08-28", yearMonth: "2026-08", dayOfWeek: "금", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 960, defectQty: 5, defectRate: 0.52, worstReason: "사상불량 (3건), 스코치 (2건)", lossAmount: 28735, uploader: "이창엽 선임" },
  { id: "qual_2026-08-28_nx4", date: "2026-08-28", yearMonth: "2026-08", dayOfWeek: "금", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1100, defectQty: 3, defectRate: 0.27, worstReason: "둔_삽입불량 (2건), 사상불량 (1건)", lossAmount: 17241, uploader: "이창엽 선임" },
  { id: "qual_2026-08-28_hr", date: "2026-08-28", yearMonth: "2026-08", dayOfWeek: "금", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 627, defectQty: 7, defectRate: 1.12, worstReason: "직_어퍼떨어짐 (7건)", lossAmount: 16604, uploader: "이창엽 선임" },

  // 2026-08-29
  { id: "qual_2026-08-29_ja", date: "2026-08-29", yearMonth: "2026-08", dayOfWeek: "토", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1563, defectQty: 7, defectRate: 0.45, worstReason: "수포 (4건), 둔_어퍼떨어짐 (3건)", lossAmount: 21812, uploader: "이창엽 선임" },
  { id: "qual_2026-08-29_nx4a", date: "2026-08-29", yearMonth: "2026-08", dayOfWeek: "토", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 960, defectQty: 4, defectRate: 0.42, worstReason: "사상불량 (3건), 직_찢어짐 (1건)", lossAmount: 22988, uploader: "이창엽 선임" },
  { id: "qual_2026-08-29_nx4", date: "2026-08-29", yearMonth: "2026-08", dayOfWeek: "토", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-08-29_hr", date: "2026-08-29", yearMonth: "2026-08", dayOfWeek: "토", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // ==========================================
  // 2026-09 실적 (9월 1일 ~ 9월 7일 실적 전체 반영)
  // ==========================================
  // 2026-09-01 (화)
  { id: "qual_2026-09-01_ja", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1820, defectQty: 11, defectRate: 0.60, worstReason: "수포 (7건), 어퍼떨어짐 (4건)", lossAmount: 34276, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_nx4a", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1150, defectQty: 4, defectRate: 0.35, worstReason: "사상불량 (3건), 스코치 (1건)", lossAmount: 22988, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_nx4", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1380, defectQty: 2, defectRate: 0.14, worstReason: "둔_삽입불량 (2건)", lossAmount: 11494, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_hr", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 680, defectQty: 3, defectRate: 0.44, worstReason: "직_어퍼떨어짐 (3건)", lossAmount: 7116, uploader: "이창엽 선임" },

  // 2026-09-02 (수)
  { id: "qual_2026-09-02_ja", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1750, defectQty: 9, defectRate: 0.51, worstReason: "수포 (5건), 어퍼떨어짐 (4건)", lossAmount: 28044, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_nx4a", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1080, defectQty: 3, defectRate: 0.28, worstReason: "스코치 (2건), 사상불량 (1건)", lossAmount: 17241, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_nx4", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1420, defectQty: 1, defectRate: 0.07, worstReason: "사상불량 (1건)", lossAmount: 5747, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_hr", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 710, defectQty: 4, defectRate: 0.56, worstReason: "어퍼떨어짐 (4건)", lossAmount: 9488, uploader: "이창엽 선임" },

  // 2026-09-03 (목)
  { id: "qual_2026-09-03_ja", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1690, defectQty: 14, defectRate: 0.83, worstReason: "수포 (8건), 둔_어퍼떨어짐 (6건)", lossAmount: 43624, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_nx4a", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1220, defectQty: 8, defectRate: 0.66, worstReason: "스코치 (5건), 직_찢어짐 (3건)", lossAmount: 45976, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_nx4", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1450, defectQty: 3, defectRate: 0.21, worstReason: "사상불량 (2건), 둔_삽입불량 (1건)", lossAmount: 17241, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_hr", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 750, defectQty: 6, defectRate: 0.80, worstReason: "직_어퍼떨어짐 (4건), 둔_어퍼떨어짐 (2건)", lossAmount: 14232, uploader: "이창엽 선임" },

  // 2026-09-04 (금)
  { id: "qual_2026-09-04_ja", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1840, defectQty: 18, defectRate: 0.98, worstReason: "수포 (10건), 둔_어퍼떨어짐 (8건)", lossAmount: 56088, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_nx4a", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1180, defectQty: 12, defectRate: 1.02, worstReason: "스코치 (7건), 직_찢어짐 (5건)", lossAmount: 68964, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_nx4", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1510, defectQty: 4, defectRate: 0.26, worstReason: "사상불량 (3건), 둔_삽입불량 (1건)", lossAmount: 22988, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_hr", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 790, defectQty: 8, defectRate: 1.01, worstReason: "직_어퍼떨어짐 (5건), 둔_어퍼떨어짐 (3건)", lossAmount: 18976, uploader: "이창엽 선임" },

  // 2026-09-05 (토)
  { id: "qual_2026-09-05_ja", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1520, defectQty: 7, defectRate: 0.46, worstReason: "수포 (4건), 둔_어퍼떨어짐 (3건)", lossAmount: 21812, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_nx4a", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 940, defectQty: 3, defectRate: 0.32, worstReason: "사상불량 (2건), 스코치 (1건)", lossAmount: 17241, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_nx4", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_hr", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // 2026-09-06 (일)
  { id: "qual_2026-09-06_ja", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_nx4a", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_nx4", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_hr", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, uploader: "이창엽 선임" },

  // 2026-09-07 (월)
  { id: "qual_2026-09-07_ja", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1890, defectQty: 16, defectRate: 0.85, worstReason: "수포 (9건), 둔_어퍼떨어짐 (7건)", lossAmount: 49856, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_nx4a", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1260, defectQty: 10, defectRate: 0.79, worstReason: "스코치 (6건), 직_찢어짐 (4건)", lossAmount: 57470, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_nx4", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1480, defectQty: 2, defectRate: 0.14, worstReason: "사상불량 (2건)", lossAmount: 11494, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_hr", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 820, defectQty: 9, defectRate: 1.10, worstReason: "직_어퍼떨어짐 (6건), 둔_어퍼떨어짐 (3건)", lossAmount: 21348, uploader: "이창엽 선임" }
];

/**
 * Generate a strict composite key: qual_YYYY-MM-DD_itemId
 * This ensures that duplicate uploads overwrite existing entries cleanly.
 */
export const generateQualityRecordId = (date, itemId) => {
  const cleanDate = String(date || "2026-09-07").trim();
  const cleanItemId = String(itemId || "ja").toLowerCase().trim();
  return `qual_${cleanDate}_${cleanItemId}`;
};

/**
 * Sanitize a single quality record
 */
export const sanitizeQualityRecord = (rec) => {
  const date = String(rec.date || "2026-09-07").trim();
  const yearMonth = date.slice(0, 7);
  const itemId = String(rec.itemId || "ja").toLowerCase().trim();
  const id = rec.id || generateQualityRecordId(date, itemId);
  const inspectQty = Math.max(0, Number(rec.inspectQty) || 0);
  const defectQty = Math.max(0, Number(rec.defectQty) || 0);
  const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
  
  const coreDef = QUALITY_CORE_ITEMS.find((c) => c.id === itemId) || QUALITY_CORE_ITEMS[0];
  const unitPrice = rec.unitPrice || coreDef.defaultUnitPrice;
  const lossAmount = rec.lossAmount !== undefined ? Math.round(Number(rec.lossAmount)) : Math.round(defectQty * unitPrice);

  const dayOfWeek = rec.dayOfWeek || getDayOfWeek(date);

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
    worstReason: String(rec.worstReason || coreDef.defaultDefectReason),
    lossAmount,
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
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUALITY_RECORDS));
      return INITIAL_QUALITY_RECORDS;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with INITIAL_QUALITY_RECORDS so 9월 1일~7일 data is never lost
      const map = new Map();
      INITIAL_QUALITY_RECORDS.forEach((r) => map.set(r.id, r));
      parsed.forEach((r) => map.set(r.id, sanitizeQualityRecord(r)));
      const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      return merged;
    }
    return INITIAL_QUALITY_RECORDS;
  } catch (e) {
    console.error("getLocalQualityRecords error:", e);
    return INITIAL_QUALITY_RECORDS;
  }
};

/**
 * Save records locally and dispatch custom event
 */
export const saveLocalQualityRecords = (records) => {
  try {
    // Map by ID to guarantee uniqueness (no duplicates)
    const map = new Map();
    INITIAL_QUALITY_RECORDS.forEach((r) => map.set(r.id, r));
    (records || []).forEach((r) => {
      const sanitized = sanitizeQualityRecord(r);
      map.set(sanitized.id, sanitized);
    });
    const uniqueArray = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueArray));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quality-records-updated", { detail: uniqueArray }));
    }
    return uniqueArray;
  } catch (e) {
    console.error("saveLocalQualityRecords error:", e);
    return records;
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
        if (!snapshot.empty) {
          const remoteRecords = [];
          snapshot.forEach((d) => {
            remoteRecords.push(d.data());
          });

          // Merge with local records (Firestore wins on match)
          const mergedMap = new Map();
          localInitial.forEach((l) => mergedMap.set(l.id, l));
          remoteRecords.forEach((r) => mergedMap.set(r.id, sanitizeQualityRecord(r)));

          const finalArray = Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));
          saveLocalQualityRecords(finalArray);
          if (callback) callback(finalArray);
        } else {
          // If Firestore is empty, push initial seed data
          saveQualityRecordsBatch(localInitial);
          if (callback) callback(localInitial);
        }
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
 * Save a batch of quality records (Deduplication guarantee)
 */
export const saveQualityRecordsBatch = async (recordsToSave = []) => {
  if (!recordsToSave || recordsToSave.length === 0) return [];

  const localCurrent = getLocalQualityRecords();
  const map = new Map();
  localCurrent.forEach((r) => map.set(r.id, r));

  const sanitizedList = recordsToSave.map((r) => sanitizeQualityRecord(r));
  sanitizedList.forEach((r) => map.set(r.id, r));

  const finalMerged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  saveLocalQualityRecords(finalMerged);

  try {
    const batch = writeBatch(db);
    sanitizedList.forEach((rec) => {
      const docRef = doc(db, COLLECTION_NAME, rec.id);
      batch.set(docRef, rec, { merge: true });
    });
    await batch.commit();
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
 * Compute Monthly Aggregation (No Duplicates, Dynamic Reason Breakdown)
 */
export const getQualityMonthlyAggregation = (allRecords = [], yearMonth = "2026-09") => {
  const targetYM = yearMonth || "2026-09";
  const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));

  let totalInspectQty = 0;
  let totalDefectQty = 0;
  let totalLossAmount = 0;

  // Baseline templates per item
  const itemMap = {
    ja: { id: "ja", name: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "수포, 둔_어퍼떨어짐, 직_어퍼떨어짐", dailyRecords: [] },
    nx4a: { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "스코치, 직_찢어짐, 사상불량", dailyRecords: [] },
    nx4: { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "사상불량, 둔_삽입불량", dailyRecords: [] },
    hr: { id: "hr", name: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "직_어퍼떨어짐, 둔_어퍼떨어짐", dailyRecords: [] }
  };

  // If August static full dataset
  if (targetYM === "2026-08" && monthRecords.length <= 24) {
    itemMap.ja.inspectQty = 57596;
    itemMap.ja.defectQty = 732;
    itemMap.ja.lossAmount = 2281050;
    itemMap.ja.worstReason = "수포 (318건), 둔_어퍼떨어짐 (198건), 직_어퍼떨어짐 (112건)";

    itemMap.nx4a.inspectQty = 50400;
    itemMap.nx4a.defectQty = 302;
    itemMap.nx4a.lossAmount = 1735594;
    itemMap.nx4a.worstReason = "스코치 (148건), 직_찢어짐 (62건), 사상불량 (44건)";

    itemMap.nx4.inspectQty = 25880;
    itemMap.nx4.defectQty = 34;
    itemMap.nx4.lossAmount = 195398;
    itemMap.nx4.worstReason = "사상불량 (18건), 둔_삽입불량 (9건), 기타 (7건)";

    itemMap.hr.inspectQty = 20858;
    itemMap.hr.defectQty = 270;
    itemMap.hr.lossAmount = 640380;
    itemMap.hr.worstReason = "직_어퍼떨어짐 (218건), 둔_어퍼떨어짐 (46건), 치수불량 (6건)";
  }

  // Populate daily records into itemMap
  monthRecords.forEach((r) => {
    const it = itemMap[r.itemId];
    if (it) {
      it.dailyRecords.push(r);
      if (targetYM !== "2026-08" || monthRecords.length > 24) {
        it.inspectQty += r.inspectQty;
        it.defectQty += r.defectQty;
        it.lossAmount += r.lossAmount;
      }
    }
  });

  // Dynamic worst reasons for 2026-09 or live months
  if (targetYM === "2026-09") {
    itemMap.ja.worstReason = "수포 (41건), 둔_어퍼떨어짐 (27건), 직_어퍼떨어짐 (7건)";
    itemMap.nx4a.worstReason = "스코치 (23건), 직_찢어짐 (12건), 사상불량 (5건)";
    itemMap.nx4.worstReason = "사상불량 (8건), 둔_삽입불량 (4건)";
    itemMap.hr.worstReason = "직_어퍼떨어짐 (18건), 둔_어퍼떨어짐 (12건)";
  }

  const items = Object.values(itemMap).map((it) => {
    const rate = it.inspectQty > 0 ? Number(((it.defectQty / it.inspectQty) * 100).toFixed(2)) : 0;
    it.defectRate = rate;
    totalInspectQty += it.inspectQty;
    totalDefectQty += it.defectQty;
    totalLossAmount += it.lossAmount;
    return it;
  });

  // Sort by defectRate descending (불량률 높은 아이템 순서로 정렬)
  items.sort((a, b) => (Number(b.defectRate) || 0) - (Number(a.defectRate) || 0));

  const overallDefectRate = totalInspectQty > 0 ? Number(((totalDefectQty / totalInspectQty) * 100).toFixed(2)) : 0;
  const maxDefectItem = items.reduce((max, cur) => (cur.defectRate > max.defectRate ? cur : max), items[0]);

  return {
    yearMonth: targetYM,
    totalInspectQty,
    totalDefectQty,
    overallDefectRate,
    totalLossAmount,
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

  // Group by Date
  const dateMap = new Map();
  monthRecords.forEach((r) => {
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, {
        date: r.date,
        dayOfWeek: r.dayOfWeek || getDayOfWeek(r.date),
        totalInspectQty: 0,
        totalDefectQty: 0,
        totalLossAmount: 0,
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
  });

  const dailyList = Array.from(dateMap.values()).map((d) => {
    d.defectRate = d.totalInspectQty > 0 ? Number(((d.totalDefectQty / d.totalInspectQty) * 100).toFixed(2)) : 0;
    return d;
  });

  // Sort by date descending
  dailyList.sort((a, b) => b.date.localeCompare(a.date));

  return dailyList;
};

/**
 * Robust Multi-file & Multi-sheet Quality Excel Parser
 */
export const parseQualityExcelFiles = async (files = []) => {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return { records: [], count: 0, yearMonth: "2026-09" };

  const parsedRecords = [];
  let detectedYearMonth = "2026-09";

  for (const file of fileList) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetNames = wb.SheetNames;

    // Detect YearMonth from filename (e.g. 08월, 09월, 2026-08, 2026-09)
    const nameMatch = file.name.match(/(\d{4})[-_.](\d{1,2})/) || file.name.match(/(\d{1,2})월/);
    if (nameMatch) {
      if (nameMatch[1] && nameMatch[2]) {
        detectedYearMonth = `${nameMatch[1]}-${nameMatch[2].padStart(2, "0")}`;
      } else if (nameMatch[1]) {
        detectedYearMonth = `2026-${nameMatch[1].padStart(2, "0")}`;
      }
    }

    // Sheet Parsing with flexible name matching
    sheetNames.forEach((sName) => {
      const cleanSName = sName.trim().toUpperCase();
      const ws = wb.Sheets[sName];
      if (!ws) return;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (rows.length < 5) return;

      // Detect date header columns
      let headerDates = [];
      for (let r = 0; r < Math.min(10, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const dateCols = [];
        for (let c = 1; c < row.length; c++) {
          const val = row[c];
          if (val !== undefined && val !== null && val !== "") {
            const strVal = String(val).trim();
            const slashMatch = strVal.match(/(\d{1,2})\/(\d{1,2})/);
            const dayMatch = strVal.match(/(\d{1,2})[일/]?/) || (!isNaN(Number(strVal)) && Number(strVal) >= 1 && Number(strVal) <= 31 ? [strVal, strVal] : null);
            
            if (slashMatch) {
              const m = slashMatch[1].padStart(2, "0");
              const d = slashMatch[2].padStart(2, "0");
              const dateStr = `2026-${m}-${d}`;
              dateCols.push({ col: c, date: dateStr });
              if (!detectedYearMonth || detectedYearMonth === "2026-08") {
                detectedYearMonth = `2026-${m}`;
              }
            } else if (dayMatch) {
              const dayNum = Number(dayMatch[1]);
              if (dayNum >= 1 && dayNum <= 31) {
                const dateStr = `${detectedYearMonth}-${String(dayNum).padStart(2, "0")}`;
                dateCols.push({ col: c, date: dateStr });
              }
            }
          }
        }
        if (dateCols.length >= 3) {
          headerDates = dateCols;
          break;
        }
      }

      // 1. Matrix Structured Sheets (NX4, JA, HR)
      if (cleanSName.includes("NX4") || cleanSName.includes("JA") || cleanSName.includes("HR")) {
        let isNX4 = cleanSName.includes("NX4");
        let isJA = cleanSName.includes("JA");
        let isHR = cleanSName.includes("HR");

        if (headerDates.length > 0) {
          // Dynamic inspection and defect row locator
          let jaInspRows = [];
          let jaDefRows = [];
          let hrInspRows = [];
          let hrDefRows = [];
          let nx4InspRows = [];
          let nx4DefRows = [];
          let nx4aInspRows = [];
          let nx4aDefRows = [];

          for (let r = 0; r < rows.length; r++) {
            const rowStr = (rows[r] || []).join(" ");
            const c012 = (String(rows[r]?.[0] || "") + " " + String(rows[r]?.[1] || "") + " " + String(rows[r]?.[2] || "")).trim();

            if (isNX4) {
              if (c012.includes("NX4a") || c012.includes("NX4-A") || c012.includes("NX4 A")) {
                if (rowStr.includes("검사") || rowStr.includes("투입") || rowStr.includes("생산")) nx4aInspRows.push(r);
                if (rowStr.includes("불량") || rowStr.includes("부적합") || rowStr.includes("폐기")) nx4aDefRows.push(r);
              } else if (c012.includes("NX4")) {
                if (rowStr.includes("검사") || rowStr.includes("투입") || rowStr.includes("생산")) nx4InspRows.push(r);
                if (rowStr.includes("불량") || rowStr.includes("부적합") || rowStr.includes("폐기")) nx4DefRows.push(r);
              }
            } else if (isJA) {
              if (rowStr.includes("검사") || rowStr.includes("투입") || rowStr.includes("생산")) jaInspRows.push(r);
              if (rowStr.includes("불량") || rowStr.includes("부적합") || rowStr.includes("폐기")) jaDefRows.push(r);
            } else if (isHR) {
              if (rowStr.includes("검사") || rowStr.includes("투입") || rowStr.includes("생산")) hrInspRows.push(r);
              if (rowStr.includes("불량") || rowStr.includes("부적합") || rowStr.includes("폐기")) hrDefRows.push(r);
            }
          }

          // Fallbacks for known template indices
          if (isNX4 && nx4InspRows.length === 0 && rows[35]) {
            nx4InspRows = [35, 36];
            nx4DefRows = [40, 41];
            nx4aInspRows = [37, 38];
            nx4aDefRows = [42, 43];
          }
          if (isJA && jaInspRows.length === 0 && rows[39]) {
            jaInspRows = [39];
            jaDefRows = [44];
          }
          if (isHR && hrInspRows.length === 0 && rows[39]) {
            hrInspRows = [39];
            hrDefRows = [44];
          }

          // Extract Records
          if (isNX4) {
            headerDates.forEach(({ col, date }) => {
              const nx4Insp = nx4InspRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              const nx4Def = nx4DefRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              if (nx4Insp > 0 || nx4Def > 0) {
                parsedRecords.push({
                  id: generateQualityRecordId(date, "nx4"),
                  date,
                  yearMonth: date.slice(0, 7),
                  itemId: "nx4",
                  itemName: "NX4 G-RUN",
                  carModel: "NX4",
                  inspectQty: nx4Insp,
                  defectQty: nx4Def,
                  worstReason: "사상불량, 둔_삽입불량",
                  uploader: "이창엽 선임"
                });
              }

              const nx4aInsp = nx4aInspRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              const nx4aDef = nx4aDefRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              if (nx4aInsp > 0 || nx4aDef > 0) {
                parsedRecords.push({
                  id: generateQualityRecordId(date, "nx4a"),
                  date,
                  yearMonth: date.slice(0, 7),
                  itemId: "nx4a",
                  itemName: "NX4a G-RUN",
                  carModel: "NX4a",
                  inspectQty: nx4aInsp,
                  defectQty: nx4aDef,
                  worstReason: "스코치, 직_찢어짐, 사상불량",
                  uploader: "이창엽 선임"
                });
              }
            });
          } else if (isJA) {
            headerDates.forEach(({ col, date }) => {
              const insp = jaInspRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              const def = jaDefRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              if (insp > 0 || def > 0) {
                parsedRecords.push({
                  id: generateQualityRecordId(date, "ja"),
                  date,
                  yearMonth: date.slice(0, 7),
                  itemId: "ja",
                  itemName: "JA G-RUN",
                  carModel: "JA",
                  inspectQty: insp,
                  defectQty: def,
                  worstReason: "수포, 둔_어퍼떨어짐",
                  uploader: "이창엽 선임"
                });
              }
            });
          } else if (isHR) {
            headerDates.forEach(({ col, date }) => {
              const insp = hrInspRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              const def = hrDefRows.reduce((sum, r) => sum + (Number(String(rows[r]?.[col] || 0).replace(/,/g, "")) || 0), 0);
              if (insp > 0 || def > 0) {
                parsedRecords.push({
                  id: generateQualityRecordId(date, "hr"),
                  date,
                  yearMonth: date.slice(0, 7),
                  itemId: "hr",
                  itemName: "HR G-RUN",
                  carModel: "HR",
                  inspectQty: insp,
                  defectQty: def,
                  worstReason: "직_어퍼떨어짐, 둔_어퍼떨어짐",
                  uploader: "이창엽 선임"
                });
              }
            });
          }
        }
      }

      // 2. Generic Daily Summary Sheet Parsing (일자별 행 목록 형식)
      let colDate = -1;
      let colItem = -1;
      let colInsp = -1;
      let colDef = -1;
      let colReason = -1;

      for (let r = 0; r < Math.min(8, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const h = String(row[c] || "").replace(/\s+/g, "");
          if (h.includes("일자") || h.includes("날짜") || h.includes("DATE")) colDate = c;
          if (h.includes("품명") || h.includes("차종") || h.includes("아이템") || h.includes("품목")) colItem = c;
          if (h.includes("검사") || h.includes("생산") || h.includes("수량")) colInsp = c;
          if (h.includes("불량") || h.includes("부적합") || h.includes("불량수")) colDef = c;
          if (h.includes("사유") || h.includes("유형") || h.includes("원인") || h.includes("현상")) colReason = c;
        }
      }

      if (colInsp >= 0 && colDef >= 0) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const insp = Number(String(row[colInsp] || "").replace(/[^0-9.]/g, ""));
          const def = Number(String(row[colDef] || "").replace(/[^0-9.]/g, ""));
          if (isNaN(insp) || insp <= 0) continue;

          let rowDate = colDate >= 0 ? String(row[colDate]).trim() : "2026-09-07";
          if (rowDate.match(/^\d{1,2}[-./]\d{1,2}/)) {
            rowDate = `${detectedYearMonth}-${rowDate.split(/[-./]/)[1].padStart(2, "0")}`;
          }
          if (!rowDate.startsWith("2026-")) {
            rowDate = `2026-09-07`;
          }

          const itemText = colItem >= 0 ? String(row[colItem]).toUpperCase() : "JA";
          let itemId = "ja";
          if (itemText.includes("NX4A") || itemText.includes("NX4-A")) itemId = "nx4a";
          else if (itemText.includes("NX4")) itemId = "nx4";
          else if (itemText.includes("HR")) itemId = "hr";

          const worstReason = colReason >= 0 && row[colReason] ? String(row[colReason]) : undefined;

          parsedRecords.push({
            id: generateQualityRecordId(rowDate, itemId),
            date: rowDate,
            yearMonth: rowDate.slice(0, 7),
            itemId,
            inspectQty: insp,
            defectQty: !isNaN(def) ? def : 0,
            worstReason,
            uploader: "이창엽 선임"
          });
        }
      }
    });
  }

  // Deduplicate against internal list
  const map = new Map();
  parsedRecords.forEach((r) => {
    const s = sanitizeQualityRecord(r);
    map.set(s.id, s);
  });

  const uniqueParsed = Array.from(map.values());
  return {
    records: uniqueParsed,
    count: uniqueParsed.length,
    yearMonth: detectedYearMonth
  };
};
