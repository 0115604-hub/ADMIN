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

// 초기 기본 데이터는 완전히 빈 배열로 유지 (더미 데이터 배제)
const DEFAULT_INITIAL_DATA = [];

/**
 * 더미 데이터 및 유효하지 않은 항목 판별 함수
 */
export function isDummyRubberEntry(item) {
  if (!item || typeof item !== "object") return true;
  const id = String(item.id || "");
  const raw = String(item.rawBarcode || "");
  const notes = String(item.notes || "");

  // 1. 레거시 시드 ID 또는 더미 식별자
  if (
    id.startsWith("RL-1728956") || // 초기 개발 시드 더미 ID
    id.includes("dummy") ||
    id.includes("mock") ||
    id.includes("seed") ||
    item.isDummy === true
  ) {
    return true;
  }

  // 2. 초기 샘플 데이터로 등록되었던 특정 바코드 & 비고 매칭
  if (
    (raw === "FFW26A14W60712$2+02" && (notes.includes("초기 입고 검사") || notes.includes("생산 긴급 투입"))) ||
    (raw === "FFW26A14W60593$W301" && notes.includes("스폰지 연고무 입고"))
  ) {
    return true;
  }

  return false;
}

/**
 * 기존에 잘못 파싱되어 저장되었던 데이터(예: 구분자가 +++이어서 기본라인으로 들어간 경우)를 자동 보정
 */
export function repairRubberEntry(item) {
  if (!item || !item.rawBarcode) return item;
  if (
    item.lineNo === "기본라인" ||
    item.lotDate === item.rawBarcode ||
    item.cavity === "-" ||
    item.cavity === "" ||
    !item.lotDate
  ) {
    const parsed = parseRubberBarcode(item.rawBarcode);
    if (parsed.recognized && parsed.lotDate && parsed.lotDate !== item.rawBarcode) {
      return {
        ...item,
        itemCode: parsed.itemCode || item.itemCode,
        lotDate: parsed.lotDate,
        lotFormatted: parsed.lotFormatted || item.lotFormatted,
        lineNo: parsed.lineNo || item.lineNo,
        cavity: parsed.cavity || item.cavity
      };
    }
  }
  return item;
}

// 로컬 저장소에서 데이터 읽기 (더미 데이터 자동 필터링 및 레거시 데이터 자동 보정)
export function getLocalRubberLedger() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleanList = parsed
          .filter((item) => item && !isDummyRubberEntry(item))
          .map((item) => repairRubberEntry(item));
        if (cleanList.length !== parsed.length && typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
        }
        return cleanList;
      }
    }
  } catch (e) {
    console.warn("Failed to read local rubber ledger:", e);
  }
  return DEFAULT_INITIAL_DATA;
}

// 로컬 저장소에 데이터 저장 (더미 데이터 유입 차단)
export function saveLocalRubberLedger(list) {
  try {
    if (typeof window !== "undefined") {
      const cleanList = Array.isArray(list)
        ? list.filter((item) => item && !isDummyRubberEntry(item))
        : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }
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

  // 1. 고객용 바코드 패턴 (예: FFW26A14W60593$W301, FFW26A14W60712$2+02, FFW26A16W60052+++01, FFW26A14WS0712S2+04)
  // 구분자: $, S, +, +++, -, _, / 등 유연하게 지원
  const mCustomer = raw.match(/^([A-Z]+)(\d{2})([1-9A-C])(\d{2})([A-Z])([0-9A-Z])?(\d{4})([\$S\+\-_/]+)(.*)$/);
  if (mCustomer) {
    const [_, item, yr, moCode, day, shift, line, time, sep, rawTail] = mCustomer;
    let month = moCode === "A" ? 10 : moCode === "B" ? 11 : moCode === "C" ? 12 : parseInt(moCode, 10);
    const yrNum = parseInt(yr, 10);
    const yearFull = isNaN(yrNum) ? new Date().getFullYear() : 2000 + yrNum;
    const dateStr = `${yearFull}-${String(month || 1).padStart(2, "0")}-${String(day || 1).padStart(2, "0")}`;
    const cleanTail = (rawTail || "").replace(/^[\+\-_/]+/, "") || rawTail || sep;

    res.barcodeType = "고객용 바코드 (완성차/HKMC)";
    res.itemCode = item;
    res.lotDate = `${yr}${moCode}${day}`;
    res.lotFormatted = dateStr;
    res.shift = shift === "W" ? "주간(White)" : shift === "N" ? "야간(Night)" : shift;
    res.lineNo = line ? (/\d/.test(line) ? `${line}호기` : `${line}라인`) : "압출라인";
    res.time = time && time.length >= 4 ? `${time.substring(0, 2)}:${time.substring(2, 4)}` : "";
    res.cavity = cleanTail ? `${cleanTail} (순번/캐비티)` : "-";
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

// 실시간 Firestore 구독 & 로컬 스토리지 동기화 (더미 배제 및 Firestore 우선 동기화)
export function subscribeRubberLedger(callback) {
  let isUnsubscribed = false;

  // 1. 로컬 캐시 초기 데이터 전달 (더미 제거 상태)
  const localData = getLocalRubberLedger();
  callback(localData);

  try {
    if (!db) return () => {};
    const rubberCol = collection(db, COLL_NAME);

    const unsubscribe = onSnapshot(
      rubberCol,
      (snapshot) => {
        if (isUnsubscribed) return;

        const cleanFbList = [];
        const repairPromises = [];

        snapshot.forEach((docSnap) => {
          const rawItem = { id: docSnap.id, ...docSnap.data() };

          if (isDummyRubberEntry(rawItem)) {
            // Firestore에 남아있는 더미/시드 문서는 영구 삭제
            deleteDoc(doc(db, COLL_NAME, docSnap.id)).catch(() => {});
          } else {
            const repaired = repairRubberEntry(rawItem);
            if (
              repaired.lotDate !== rawItem.lotDate ||
              repaired.lineNo !== rawItem.lineNo ||
              repaired.cavity !== rawItem.cavity
            ) {
              repairPromises.push(setDoc(doc(db, COLL_NAME, rawItem.id), repaired, { merge: true }));
            }
            cleanFbList.push(repaired);
          }
        });

        if (repairPromises.length > 0) {
          Promise.all(repairPromises).catch(() => {});
        }

        // 최신 등록 순 정렬
        const sorted = cleanFbList.sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        );

        saveLocalRubberLedger(sorted);
        callback(sorted);
      },
      (error) => {
        console.warn("Firestore rubber ledger onSnapshot error (using local cache):", error);
        callback(getLocalRubberLedger());
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

/**
 * 기존 더미/샘플 데이터 완전 영구 삭제 (LocalStorage & Firestore)
 */
export async function purgeDummyRubberData() {
  // 1. LocalStorage 클린업
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item) => item && !isDummyRubberEntry(item));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  // 2. Firestore 더미 데이터 조회 후 영구 삭제
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLL_NAME));
      snap.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        if (isDummyRubberEntry(item)) {
          deleteDoc(doc(db, COLL_NAME, docSnap.id)).catch(() => {});
        }
      });
    } catch (e) {
      console.warn("purgeDummyRubberData error:", e);
    }
  }
}

/**
 * 대장 전체 내역 초기화 (테스트 데이터 및 전체 삭제용)
 */
export async function clearAllRubberLedger() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLL_NAME));
      const deletePromises = [];
      snap.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, COLL_NAME, docSnap.id)));
      });
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn("clearAllRubberLedger error:", e);
    }
  }
}

// 통계 요약 계산 함수 (더미 데이터 배제 및 정확한 재고 산출)
export function calculateRubberStockSummary(entries = []) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let totalInQty = 0;
  let totalOutQty = 0;
  let todayInQty = 0;
  let todayOutQty = 0;
  let todayInCount = 0;
  let todayOutCount = 0;

  if (Array.isArray(entries)) {
    entries.forEach((item) => {
      if (!item || isDummyRubberEntry(item)) return;
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
  }

  const currentStock = totalInQty - totalOutQty;

  const validEntries = Array.isArray(entries)
    ? entries.filter((e) => e && !isDummyRubberEntry(e))
    : [];

  return {
    currentStock,
    totalInQty,
    totalOutQty,
    todayInQty,
    todayOutQty,
    todayInCount,
    todayOutCount,
    totalRecords: validEntries.length
  };
}

// 모듈 로드 시 자동 1회 더미 데이터 정화
if (typeof window !== "undefined") {
  purgeDummyRubberData().catch(() => {});
}
