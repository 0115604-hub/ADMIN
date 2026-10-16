/**
 * 연고무 입출고대장 서비스 (Soft Rubber In/Out Ledger Service)
 * - Firebase Cloud Firestore ('rubber_ledger') 실시간 동기화
 * - LocalStorage ('mfg_rubber_ledger_v1') 오프라인 자동 백업
 * - 바코드 자동 해독 (고객용 HKMC, 코퍼 Cooper Standard, 사내 LOT)
 * - 오디오 비프음 및 실시간 재고 산출
 */

import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_KEY = "mfg_rubber_ledger_v1";
const COLL_NAME = "rubber_ledger";

// 초기 샘플 데이터 (초기 상태용)
const DEFAULT_INITIAL_DATA = [
  {
    id: "RL-1728956000000-101",
    type: "IN",
    rawBarcode: "FFW26A14W60712$2+02",
    itemCode: "FFW",
    lotDate: "26A14",
    lotFormatted: "2026-10-14",
    shift: "주간(White)",
    lineNo: "압출라인",
    cavity: "02 (순번/캐비티)",
    qty: 120.5,
    unit: "kg",
    process: "원자재 1창고 (입고 보관)",
    workerName: "설유설 책임",
    notes: "초기 입고 검사 완료",
    date: new Date().toISOString().slice(0, 10),
    createdAt: `${new Date().toISOString().slice(0, 10)} 09:30:00`
  },
  {
    id: "RL-1728956100000-102",
    type: "IN",
    rawBarcode: "FFW26A14W60593$W301",
    itemCode: "FFW",
    lotDate: "26A14",
    lotFormatted: "2026-10-14",
    shift: "주간(White)",
    lineNo: "압출라인",
    cavity: "01 (순번/캐비티)",
    qty: 85.0,
    unit: "kg",
    process: "원자재 1창고 (입고 보관)",
    workerName: "설유설 책임",
    notes: "스폰지 연고무 입고",
    date: new Date().toISOString().slice(0, 10),
    createdAt: `${new Date().toISOString().slice(0, 10)} 10:15:00`
  },
  {
    id: "RL-1728956200000-103",
    type: "OUT",
    rawBarcode: "FFW26A14W60712$2+02",
    itemCode: "FFW",
    lotDate: "26A14",
    lotFormatted: "2026-10-14",
    shift: "주간(White)",
    lineNo: "6호기",
    cavity: "02 (순번/캐비티)",
    qty: 45.0,
    unit: "kg",
    process: "압출 6호기 (투입)",
    workerName: "설유설 책임",
    notes: "생산 긴급 투입",
    date: new Date().toISOString().slice(0, 10),
    createdAt: `${new Date().toISOString().slice(0, 10)} 11:00:00`
  }
];

// 로컬 저장소에서 데이터 읽기
export function getLocalRubberLedger() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read local rubber ledger:", e);
  }
  return DEFAULT_INITIAL_DATA;
}

// 로컬 저장소에 데이터 저장
export function saveLocalRubberLedger(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save local rubber ledger:", e);
  }
}

// 바코드 파싱 함수 (k5604.kr 정밀 해독 규칙 100% 동일)
export function parseRubberBarcode(raw) {
  raw = (raw || "").trim().toUpperCase();
  const res = {
    rawBarcode: raw,
    barcodeType: "일반 바코드",
    itemCode: "연고무",
    lotDate: "",
    lotFormatted: "",
    shift: "",
    lineNo: "",
    time: "",
    cavity: "",
    recognized: false
  };

  if (!raw) return res;

  // 1. 고객용 바코드 패턴 (예: FFW26A14W60593$W301, FFW26A14W60712$2+02, FFW26A14WS0712S2+04)
  const mCustomer = raw.match(/^([A-Z]+)(\d{2})([1-9A-C])(\d{2})([A-Z])([0-9A-Z])?(\d{4})[\$S](.+)$/);
  if (mCustomer) {
    const [_, item, yr, moCode, day, shift, line, time, tail] = mCustomer;
    let month = moCode === "A" ? 10 : moCode === "B" ? 11 : moCode === "C" ? 12 : parseInt(moCode, 10);
    const yearFull = 2000 + parseInt(yr, 10);
    const dateStr = `${yearFull}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;

    res.barcodeType = "고객용 바코드 (완성차/HKMC)";
    res.itemCode = item;
    res.lotDate = `${yr}${moCode}${day}`;
    res.lotFormatted = dateStr;
    res.shift = shift === "W" ? "주간(White)" : shift === "N" ? "야간(Night)" : shift;
    res.lineNo = line ? (/\d/.test(line) ? `${line}호기` : `${line}라인`) : "압출라인";
    res.time = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    res.cavity = tail ? `${tail} (순번/캐비티)` : "-";
    res.recognized = true;
    return res;
  }

  // 2. 코퍼용 바코드 패턴 (예: UF10161726A14084000A)
  // [품번: UF101617 등][년: 2자리][월: 1자리][일: 2자리][시간: 4자리][순번/리비전: 3~5자리]
  const mCooper = raw.match(/^([A-Z0-9]{6,10})(\d{2})([1-9A-C])(\d{2})(\d{4})([0-9A-Z]{3,5})$/);
  if (mCooper) {
    const [_, partNo, yr, moCode, day, time, seq] = mCooper;
    let month = moCode === "A" ? 10 : moCode === "B" ? 11 : moCode === "C" ? 12 : parseInt(moCode, 10);
    const yearFull = 2000 + parseInt(yr, 10);
    const dateStr = `${yearFull}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;

    res.barcodeType = "코퍼용 바코드 (Cooper Standard)";
    res.itemCode = `${partNo} (코퍼품번)`;
    res.lotDate = `${yr}${moCode}${day}`;
    res.lotFormatted = dateStr;
    res.shift = "코퍼 규격";
    res.lineNo = "코퍼 발주품";
    res.time = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    res.cavity = `${seq} (일련번호/REV)`;
    res.recognized = true;
    return res;
  }

  // 3. 일반 사내/원소재 LOT 바코드 (예: EPDM-20261014-01 등)
  const mGen = raw.match(/^([A-Z0-9\-_]+)/);
  if (mGen) {
    res.itemCode = "연고무/원소재";
    res.lotDate = raw;
    res.lotFormatted = new Date().toISOString().split("T")[0];
    res.lineNo = "기본라인";
    res.recognized = true;
  }
  return res;
}

// 오디오 비프음 재생 (스캔 확인음)
export function playBeepSound(type = "success") {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio Context not allowed before user gesture
  }
}

// 실시간 Firestore 구독 & 로컬 스토리지 동기화
export function subscribeRubberLedger(callback) {
  let isUnsubscribed = false;
  let localData = getLocalRubberLedger();
  callback(localData);

  try {
    if (!db) return () => {};
    const rubberCol = collection(db, COLL_NAME);

    const unsubscribe = onSnapshot(
      rubberCol,
      (snapshot) => {
        if (isUnsubscribed) return;
        const fbList = [];
        snapshot.forEach((docSnap) => {
          fbList.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (fbList.length > 0) {
          const map = new Map();
          fbList.forEach((item) => map.set(item.id, item));
          localData.forEach((localItem) => {
            if (!map.has(localItem.id)) map.set(localItem.id, localItem);
          });
          const merged = Array.from(map.values()).sort((a, b) =>
            (b.createdAt || "").localeCompare(a.createdAt || "")
          );
          saveLocalRubberLedger(merged);
          callback(merged);
        } else {
          callback(localData);
        }
      },
      (error) => {
        console.warn("Firestore rubber ledger onSnapshot error (using local cache):", error);
        callback(localData);
      }
    );

    return () => {
      isUnsubscribed = true;
      unsubscribe();
    };
  } catch (err) {
    console.warn("subscribeRubberLedger failed, fallback to local:", err);
    return () => {};
  }
}

// 신규 내역 추가 (Firestore & LocalStorage)
export async function addRubberLedgerEntry(entry) {
  const id = `RL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newEntry = {
    id,
    ...entry
  };

  // 1. LocalStorage 즉시 갱신
  const current = getLocalRubberLedger();
  const updated = [newEntry, ...current];
  saveLocalRubberLedger(updated);

  // 2. Firebase Firestore 비동기 전송
  try {
    if (db) {
      await setDoc(doc(db, COLL_NAME, id), newEntry);
    }
  } catch (err) {
    console.warn("Firebase setDoc rubber ledger error:", err);
  }

  return newEntry;
}

// 내역 삭제
export async function deleteRubberLedgerEntry(id) {
  // 1. LocalStorage 즉시 삭제
  const current = getLocalRubberLedger();
  const updated = current.filter((item) => item.id !== id);
  saveLocalRubberLedger(updated);

  // 2. Firebase Firestore 삭제
  try {
    if (db) {
      await deleteDoc(doc(db, COLL_NAME, id));
    }
  } catch (err) {
    console.warn("Firebase deleteDoc rubber ledger error:", err);
  }
}

// 통계 요약 계산 함수
export function calculateRubberStockSummary(entries = []) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let totalInQty = 0;
  let totalOutQty = 0;
  let todayInQty = 0;
  let todayOutQty = 0;
  let todayInCount = 0;
  let todayOutCount = 0;

  entries.forEach((item) => {
    const qty = Number(item.qty) || 0;
    const isToday = (item.date || item.createdAt || "").startsWith(todayStr);

    if (item.type === "IN") {
      totalInQty += qty;
      if (isToday) {
        todayInQty += qty;
        todayInCount++;
      }
    } else if (item.type === "OUT") {
      totalOutQty += qty;
      if (isToday) {
        todayOutQty += qty;
        todayOutCount++;
      }
    }
  });

  return {
    currentStock: Math.max(0, totalInQty - totalOutQty),
    totalInQty,
    totalOutQty,
    todayInQty,
    todayOutQty,
    todayInCount,
    todayOutCount,
    totalRecords: entries.length
  };
}
