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

// Initial Seed Records (Structured per date and item with deterministic IDs)
export const INITIAL_QUALITY_RECORDS = [
  // ==========================================
  // 2026-08 실적 (기준 실적 유지)
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
  // 2026-09 실적 (이창엽 선임 업로드 엑셀 원본 100% 정합 데이터)
  // ==========================================
  // 2026-09-01 (화) - 일자별 불량률 0.46% (검사 4,611 / 불량 21 / 손실 ₩83,864 / 소재폐기 7EA)
  { id: "qual_2026-09-01_ja", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1451, defectQty: 14, defectRate: 0.96, worstReason: "둔각 떨어짐 (7건), 수포 (5건), 스코치 (1건)", lossAmount: 43624, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_nx4a", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 4, defectRate: 0.33, worstReason: "스코치 (3건), 사상불량 (1건)", lossAmount: 22988, scrapA: 2, scrapB: 1, scrapC: 1, scrapD: 0, scrapTotal: 4, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_nx4", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1440, defectQty: 3, defectRate: 0.21, worstReason: "사상불량 (2건), 둔_삽입불량 (1건)", lossAmount: 17241, scrapA: 1, scrapB: 1, scrapC: 1, scrapD: 0, scrapTotal: 3, uploader: "이창엽 선임" },
  { id: "qual_2026-09-01_hr", date: "2026-09-01", yearMonth: "2026-09", dayOfWeek: "화", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 520, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-02 (수) - 일자별 불량률 0.66% (검사 4,707 / 불량 31 / 손실 ₩104,942 / 소재폐기 7EA)
  { id: "qual_2026-09-02_ja", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1268, defectQty: 15, defectRate: 1.18, worstReason: "둔각 떨어짐 (6건), 수포 (5건), 사상불량 (2건)", lossAmount: 46740, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_nx4a", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 5, defectRate: 0.42, worstReason: "스코치 (3건), 직_삽입불량 (2건)", lossAmount: 28735, scrapA: 3, scrapB: 2, scrapC: 1, scrapD: 0, scrapTotal: 6, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_nx4", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1440, defectQty: 1, defectRate: 0.07, worstReason: "사상불량 (1건)", lossAmount: 5747, scrapA: 1, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 1, uploader: "이창엽 선임" },
  { id: "qual_2026-09-02_hr", date: "2026-09-02", yearMonth: "2026-09", dayOfWeek: "수", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 799, defectQty: 10, defectRate: 1.25, worstReason: "직각 떨어짐 (5건), 둔각 떨어짐 (5건)", lossAmount: 23720, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-03 (목) - 일자별 불량률 0.50% (검사 4,799 / 불량 24 / 손실 ₩101,094 / 소재폐기 11EA)
  { id: "qual_2026-09-03_ja", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1209, defectQty: 14, defectRate: 1.16, worstReason: "수포 (9건), 둔각 떨어짐 (3건), 사상불량 (2건)", lossAmount: 43624, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_nx4a", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 7, defectRate: 0.58, worstReason: "직_삽입불량 (4건), 둔_삽입불량 (2건), 스코치 (1건)", lossAmount: 40229, scrapA: 4, scrapB: 2, scrapC: 2, scrapD: 0, scrapTotal: 8, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_nx4", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1680, defectQty: 3, defectRate: 0.18, worstReason: "사상불량 (2건), 둔_삽입불량 (1건)", lossAmount: 17241, scrapA: 2, scrapB: 1, scrapC: 0, scrapD: 0, scrapTotal: 3, uploader: "이창엽 선임" },
  { id: "qual_2026-09-03_hr", date: "2026-09-03", yearMonth: "2026-09", dayOfWeek: "목", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 710, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-04 (금) - 일자별 불량률 0.40% (검사 5,000 / 불량 20 / 손실 ₩61,231 / 소재폐기 1EA)
  { id: "qual_2026-09-04_ja", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1265, defectQty: 14, defectRate: 1.11, worstReason: "스코치 (5건), 수포 (4건), 둔각 떨어짐 (4건)", lossAmount: 43624, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_nx4a", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1440, defectQty: 1, defectRate: 0.07, worstReason: "둔_삽입불량 (1건)", lossAmount: 5747, scrapA: 1, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 1, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_nx4", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1680, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-04_hr", date: "2026-09-04", yearMonth: "2026-09", dayOfWeek: "금", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 615, defectQty: 5, defectRate: 0.81, worstReason: "스코치 (5건)", lossAmount: 11860, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-05 (토) - 일자별 불량률 0.28% (검사 2,880 / 불량 8 / 손실 ₩45,976 / 소재폐기 8EA)
  { id: "qual_2026-09-05_ja", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_nx4a", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 6, defectRate: 0.50, worstReason: "스코치 (4건), 둔각 떨어짐 (2건)", lossAmount: 34482, scrapA: 3, scrapB: 2, scrapC: 1, scrapD: 0, scrapTotal: 6, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_nx4", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1680, defectQty: 2, defectRate: 0.12, worstReason: "사상불량 (2건)", lossAmount: 11494, scrapA: 1, scrapB: 1, scrapC: 0, scrapD: 0, scrapTotal: 2, uploader: "이창엽 선임" },
  { id: "qual_2026-09-05_hr", date: "2026-09-05", yearMonth: "2026-09", dayOfWeek: "토", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-06 (일) - 휴무
  { id: "qual_2026-09-06_ja", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_nx4a", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_nx4", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-06_hr", date: "2026-09-06", yearMonth: "2026-09", dayOfWeek: "일", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-07 (월) - 미가동 / 휴무
  { id: "qual_2026-09-07_ja", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_nx4a", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_nx4", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-07_hr", date: "2026-09-07", yearMonth: "2026-09", dayOfWeek: "월", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0.00, worstReason: "-", lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },

  // 2026-09-08 (화) - 일자별 불량률 0.47% (검사 4,625 / 불량 22 / 손실 ₩87,023 / 소재폐기 10EA)
  { id: "qual_2026-09-08_ja", date: "2026-09-08", yearMonth: "2026-09", dayOfWeek: "화", itemId: "ja", itemName: "JA G-RUN", carModel: "JA", inspectQty: 1320, defectQty: 6, defectRate: 0.45, worstReason: "수포 (4건), 둔각 떨어짐 (2건)", lossAmount: 18696, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" },
  { id: "qual_2026-09-08_nx4a", date: "2026-09-08", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4a", itemName: "NX4a G-RUN", carModel: "NX4a", inspectQty: 1200, defectQty: 5, defectRate: 0.42, worstReason: "스코치 (3건), 사상불량 (2건)", lossAmount: 28735, scrapA: 3, scrapB: 2, scrapC: 1, scrapD: 0, scrapTotal: 6, uploader: "이창엽 선임" },
  { id: "qual_2026-09-08_nx4", date: "2026-09-08", yearMonth: "2026-09", dayOfWeek: "화", itemId: "nx4", itemName: "NX4 G-RUN", carModel: "NX4", inspectQty: 1480, defectQty: 4, defectRate: 0.27, worstReason: "사상불량 (3건), 둔_삽입불량 (1건)", lossAmount: 22988, scrapA: 2, scrapB: 1, scrapC: 1, scrapD: 0, scrapTotal: 4, uploader: "이창엽 선임" },
  { id: "qual_2026-09-08_hr", date: "2026-09-08", yearMonth: "2026-09", dayOfWeek: "화", itemId: "hr", itemName: "HR G-RUN", carModel: "HR", inspectQty: 625, defectQty: 7, defectRate: 1.12, worstReason: "직각 떨어짐 (4건), 둔각 떨어짐 (3건)", lossAmount: 16604, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, uploader: "이창엽 선임" }
];

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
  const date = String(rec.date || "2026-09-01").trim();
  const yearMonth = date.slice(0, 7);
  const itemId = String(rec.itemId || "ja").toLowerCase().trim();
  const id = rec.id || generateQualityRecordId(date, itemId);
  const inspectQty = Math.max(0, Math.round(Number(rec.inspectQty) || 0));
  const defectQty = Math.max(0, Math.round(Number(rec.defectQty) || 0));
  const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
  
  const coreDef = QUALITY_CORE_ITEMS.find((c) => c.id === itemId) || QUALITY_CORE_ITEMS[0];
  const unitPrice = rec.unitPrice || coreDef.defaultUnitPrice;
  const lossAmount = rec.lossAmount !== undefined ? Math.round(Number(rec.lossAmount)) : Math.round(defectQty * unitPrice);

  const dayOfWeek = rec.dayOfWeek || getDayOfWeek(date);

  // 4 Material Waste / Scrap Quantities (소재 A, B, C, D)
  const scrapA = Math.max(0, Math.round(Number(rec.scrapA) || 0));
  const scrapB = Math.max(0, Math.round(Number(rec.scrapB) || 0));
  const scrapC = Math.max(0, Math.round(Number(rec.scrapC) || 0));
  const scrapD = Math.max(0, Math.round(Number(rec.scrapD) || 0));
  const scrapTotal = rec.scrapTotal !== undefined 
    ? Math.max(0, Math.round(Number(rec.scrapTotal))) 
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
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUALITY_RECORDS));
      return INITIAL_QUALITY_RECORDS;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
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

          const mergedMap = new Map();
          localInitial.forEach((l) => mergedMap.set(l.id, l));
          remoteRecords.forEach((r) => mergedMap.set(r.id, sanitizeQualityRecord(r)));

          const finalArray = Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));
          saveLocalQualityRecords(finalArray);
          if (callback) callback(finalArray);
        } else {
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
 * Helper to parse dates from Excel cells (Serial numbers or text)
 */
export const parseExcelDate = (val, fallbackYM = "2026-09") => {
  if (typeof val === "number" && val > 45000 && val < 50000) {
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, "0");
    const day = String(date_info.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof val === "string") {
    const s = val.trim();
    const m1 = s.match(/(\d{4})[-_./](\d{1,2})[-_./](\d{1,2})/);
    if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
    const m2 = s.match(/(\d{1,2})[-_./](\d{1,2})/);
    if (m2) return `${fallbackYM.slice(0, 4)}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
    const m3 = s.match(/^(\d{1,2})일?$/);
    if (m3) return `${fallbackYM}-${m3[1].padStart(2, "0")}`;
  }
  if (typeof val === "number" && val >= 1 && val <= 31) {
    return `${fallbackYM}-${String(val).padStart(2, "0")}`;
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
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheetNames = wb.SheetNames;

    const nameMatch = file.name.match(/(\d{4})[-_.](\d{1,2})/) || file.name.match(/(\d{1,2})월/);
    if (nameMatch) {
      if (nameMatch[1] && nameMatch[2]) {
        detectedYearMonth = `${nameMatch[1]}-${nameMatch[2].padStart(2, "0")}`;
      } else if (nameMatch[1]) {
        detectedYearMonth = `2026-${nameMatch[1].padStart(2, "0")}`;
      }
    }

    const hasJeongri = sheetNames.some((s) => s.includes("정리"));

    sheetNames.forEach((sName) => {
      const cleanName = sName.trim().toUpperCase();
      if (hasJeongri && cleanName.includes("취합DATA")) {
        return;
      }

      const ws = wb.Sheets[sName];
      if (!ws) return;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (rows.length < 5) return;

      // 1. NX4 정리 Sheet: Splits NX4 and NX4a
      if (cleanName === "NX4 정리" || cleanName.includes("NX4_정리") || cleanName.includes("NX4정리")) {
        let dateCols = [];
        for (let r = 0; r < Math.min(36, rows.length); r++) {
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

          for (let r = 0; r < Math.min(45, rows.length); r++) {
            const row = rows[r] || [];
            const label = (String(row[1] || "") + " " + String(row[2] || "")).trim().toUpperCase();
            if (label.includes("NX4 FRT") || label.includes("NX4-FRT")) {
              if (r < 40) nx4InspRows.push(r);
              else nx4DefRows.push(r);
            } else if (label.includes("NX4A") || label.includes("NX4-A") || label.includes("NX4 A")) {
              if (r < 40) nx4aInspRows.push(r);
              else nx4aDefRows.push(r);
            }
          }

          if (nx4InspRows.length === 0) { nx4InspRows = [35, 36]; nx4DefRows = [40, 41]; }
          if (nx4aInspRows.length === 0) { nx4aInspRows = [37, 38]; nx4aDefRows = [42, 43]; }

          dateCols.forEach((d) => {
            const nx4Insp = Math.round(nx4InspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4Def = Math.round(nx4DefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aInsp = Math.round(nx4aInspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aDef = Math.round(nx4aDefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const dt = new Date(d.dateStr);
            const dayOfWeek = dayNames[dt.getDay()] || "월";

            if (nx4Insp > 0 || nx4Def > 0) {
              const k = `qual_${d.dateStr}_nx4`;
              parsedRecords.push({
                id: k,
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
            }

            if (nx4aInsp > 0 || nx4aDef > 0) {
              const k = `qual_${d.dateStr}_nx4a`;
              parsedRecords.push({
                id: k,
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
            }
          });
          return;
        }
      }

      // 2. Individual Model Sheets (JA, HR, NX4, NX4a)
      let itemId = null;
      let itemName = "";
      let carModel = "";
      let defaultReason = "";

      if (cleanName.includes("JA") && (cleanName.includes("통합") || cleanName.includes("취합") || cleanName.includes("종합") || cleanName.includes("정리"))) {
        itemId = "ja"; itemName = "JA G-RUN"; carModel = "JA"; defaultReason = "둔각 떨어짐, 수포, 스코치";
      } else if (cleanName.includes("HR") && (cleanName.includes("통합") || cleanName.includes("취합") || cleanName.includes("종합") || cleanName.includes("정리"))) {
        itemId = "hr"; itemName = "HR G-RUN"; carModel = "HR"; defaultReason = "직각 떨어짐, 둔각 떨어짐, 스코치";
      } else if (cleanName.includes("NX4A") || cleanName.includes("NX4-A") || cleanName.includes("NX4 A")) {
        itemId = "nx4a"; itemName = "NX4a G-RUN"; carModel = "NX4a"; defaultReason = "스코치, 직_삽입불량, 사상불량";
      } else if (cleanName.includes("NX4") && (cleanName.includes("종합") || cleanName.includes("통합"))) {
        itemId = "nx4"; itemName = "NX4 G-RUN"; carModel = "NX4"; defaultReason = "사상불량, 둔_삽입불량";
      }

      if (!itemId) return;

      let dateCols = [];
      for (let r = 0; r < Math.min(36, rows.length); r++) {
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

      if (dateCols.length === 0) return;

      let rowInsp = -1;
      let rowDef = -1;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r] || [];
        const label = (String(row[0] || "") + " " + String(row[1] || "") + " " + String(row[2] || "") + " " + String(row[3] || "")).replace(/\s+/g, "").toUpperCase();
        if (label.includes("총검사수") || label.includes("검사수량") || label.includes("검사합계") || (r === 39 && label.includes("합계"))) {
          if (rowInsp === -1) rowInsp = r;
        }
        if (label.includes("총불량수") || label.includes("불량수량") || label.includes("불량합계") || (r === 44 && label.includes("합계"))) {
          if (rowDef === -1) rowDef = r;
        }
      }

      if (rowInsp === -1 && rows[39]) rowInsp = 39;
      if (rowDef === -1 && rows[44]) rowDef = 44;
      if (rowInsp === -1 || rowDef === -1) return;

      dateCols.forEach((d) => {
        const insp = Math.round(Number(rows[rowInsp]?.[d.col]) || 0);
        const def = Math.round(Number(rows[rowDef]?.[d.col]) || 0);
        if (insp === 0 && def === 0) return;

        const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
        const loss = Math.round(def * unitPrices[itemId]);
        const dt = new Date(d.dateStr);
        const dayOfWeek = dayNames[dt.getDay()] || "월";

        // Defect reasons
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
        const worstReason = def === 0 ? "-" : (reasons.length > 0 ? reasons.slice(0, 3).join(", ") : defaultReason);

        const key = `qual_${d.dateStr}_${itemId}`;
        parsedRecords.push({
          id: key,
          date: d.dateStr,
          yearMonth: d.dateStr.slice(0, 7),
          dayOfWeek,
          itemId,
          itemName,
          carModel,
          inspectQty: insp,
          defectQty: def,
          defectRate: rate,
          worstReason,
          lossAmount: loss,
          uploader: "이창엽 선임"
        });
      });
    });
  }

  // Deduplicate against internal list
  const map = new Map();
  parsedRecords.forEach((r) => {
    const s = sanitizeQualityRecord(r);
    map.set(s.id, s);
  });

  const uniqueParsed = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
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

