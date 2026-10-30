import { db } from "../firebase.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

const COLLECTION_NAME = "lux_inspection_reports";
const CONFIG_DOC_KEY = "lux_inspection_config_v1";
const STORAGE_KEY = "oryuk_lux_inspection_reports_v1";
const CONFIG_STORAGE_KEY = "oryuk_lux_inspection_config_v1";

// 🌟 표준 1~16번 측정 위치 기본 프리셋
export const DEFAULT_LUX_LOCATION_ITEMS = [
  { id: 1, name: "PCM #1 라인 인취기 작업대", specLux: 300, note: "정밀작업대" },
  { id: 2, name: "PCM #1 라인 다이스 압출구", specLux: 300, note: "압출상태 확인" },
  { id: 3, name: "PCM #3 라인 인취기 작업대", specLux: 300, note: "정밀작업대" },
  { id: 4, name: "PCM #3 라인 후단 검사대", specLux: 300, note: "외관검사 구역" },
  { id: 5, name: "PVC 라인 원료 투입구", specLux: 150, note: "투입부 조명" },
  { id: 6, name: "PVC 라인 인취기 및 커팅부", specLux: 300, note: "절단 및 검사" },
  { id: 7, name: "TPE 라인 성형 및 권취대", specLux: 300, note: "권취부" },
  { id: 8, name: "가공동 HR 1호 프레스 작업대", specLux: 300, note: "타발 및 조립" },
  { id: 9, name: "가공동 HR 2호 프레스 작업대", specLux: 300, note: "타발 및 조립" },
  { id: 10, name: "가공동 JA G-RUN 조립대", specLux: 300, note: "수작업 정밀조립" },
  { id: 11, name: "가공동 NX4 부품 검사대", specLux: 300, note: "전수검사 구역" },
  { id: 12, name: "원재료 입고 보관장", specLux: 150, note: "자재 적재대" },
  { id: 13, name: "완제품 포장 및 출하장", specLux: 150, note: "포장 구역" },
  { id: 14, name: "금형 보관대 및 사상대", specLux: 300, note: "금형 정밀점검" },
  { id: 15, name: "압출동 메인 복도 및 통로", specLux: 75, note: "보행 안전통로" },
  { id: 16, name: "가공동 메인 복도 및 통로", specLux: 75, note: "지게차 주행로" }
];

// 🌟 조도 관리 전담자 및 위치 설정 가져오기 (영구 보존)
export const getLuxInspectionConfig = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    }
  } catch (e) {}
  return {
    assignedInspector: "설유철 책임", // 전담 작업자 기본값
    cycle: "MONTHLY_ONCE", // 월 1회 측정
    measuringDevice: "디지털 조도계 LX-1010B (#LX-02)",
    locationItems: DEFAULT_LUX_LOCATION_ITEMS
  };
};

export const saveLuxInspectionConfig = async (config) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent("oryuk_lux_config_updated", { detail: config }));
    }
    if (db) {
      await setDoc(doc(db, "app_settings", CONFIG_DOC_KEY), config, { merge: true }).catch(() => {});
    }
  } catch (e) {
    console.error("Failed to save lux config:", e);
  }
};

// 🌟 조도측정일보 로컬 스토리지 읽기
export const getLocalLuxReports = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const setLocalLuxReports = (list) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
      window.dispatchEvent(new CustomEvent("oryuk_lux_reports_updated", { detail: list }));
    }
  } catch (e) {}
};

// 🌟 실시간 조도측정일보 목록 구독
export const subscribeLuxReports = (callback) => {
  callback(getLocalLuxReports());
  if (!db) return () => {};

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("measureDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setLocalLuxReports(list);
        callback(list);
      },
      (err) => {
        console.warn("[LuxInspectionService] Firestore subscribe warning:", err);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
};

// 🌟 신규 또는 수정 조도측정일보 저장
export const saveLuxReport = async (reportData) => {
  const currentList = getLocalLuxReports();
  const id = reportData.id || `lux_${reportData.measureDate || new Date().toISOString().slice(0, 10)}_${Date.now()}`;
  
  // 전체 판정 자동 연산
  const items = (reportData.items || []).map((it) => {
    const measured = Number(it.measuredLux || 0);
    const spec = Number(it.specLux || 300);
    const isPass = measured >= spec;
    return {
      ...it,
      measuredLux: measured,
      specLux: spec,
      judgment: isPass ? "적합" : "부적합"
    };
  });

  const failCount = items.filter((it) => it.judgment === "부적합").length;
  const overallResult = failCount === 0 ? "적합" : "부적합";

  const newRecord = {
    ...reportData,
    id,
    items,
    overallResult,
    failCount,
    updatedAt: new Date().toISOString(),
    createdAt: reportData.createdAt || new Date().toISOString()
  };

  const existIdx = currentList.findIndex((r) => r.id === id);
  let nextList;
  if (existIdx >= 0) {
    nextList = [...currentList];
    nextList[existIdx] = newRecord;
  } else {
    nextList = [newRecord, ...currentList];
  }

  setLocalLuxReports(nextList);

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newRecord, { merge: true });
    } catch (e) {
      console.warn("[LuxInspectionService] Firestore save error:", e);
    }
  }

  return newRecord;
};

// 🌟 조도측정일보 삭제
export const deleteLuxReport = async (id) => {
  if (!id) return;
  const currentList = getLocalLuxReports();
  const nextList = currentList.filter((r) => r.id !== id);
  setLocalLuxReports(nextList);

  if (db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {}
  }
};
