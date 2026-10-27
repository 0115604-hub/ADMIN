import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const LOCAL_STORAGE_KEY = "oryuk_manager_custom_layouts";
const SETTINGS_DOC_PATH = ["system_settings", "manager_dashboard_layouts"];

// Memory cache for synchronous lookups
let inMemoryLayouts = {};

// Initialize from localStorage immediately
try {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    inMemoryLayouts = JSON.parse(cached) || {};
  }
} catch (e) {
  console.warn("Failed to load local manager dashboard layouts:", e);
}

/**
 * 특정 관리자의 커스텀 레이아웃 조회 (Firestore/로컬 캐시)
 * @param {string} managerKey 관리자 ID 또는 이름 (예: 'sam_cy', '이창엽')
 * @returns {string[] | null} 패널 키 목록 배열 또는 null(기본값 사용)
 */
export const getCustomLayoutForManager = (managerKey) => {
  if (!managerKey) return null;
  if (inMemoryLayouts && inMemoryLayouts[managerKey] && Array.isArray(inMemoryLayouts[managerKey])) {
    return inMemoryLayouts[managerKey];
  }
  return null;
};

/**
 * 전체 커스텀 레이아웃 딕셔너리 반환
 */
export const getAllCustomLayouts = () => {
  return { ...inMemoryLayouts };
};

/**
 * 특정 관리자의 대시보드 블록 레이아웃 저장
 * @param {string} managerKey 관리자 ID 또는 이름
 * @param {string[]} panels 패널 키 목록 배열
 * @param {string} updatedBy 변경자 (예: 'TEST')
 */
export const saveManagerCustomLayout = async (managerKey, panels, updatedBy = "TEST") => {
  if (!managerKey || !Array.isArray(panels)) return;

  const nextLayouts = {
    ...inMemoryLayouts,
    [managerKey]: panels
  };
  inMemoryLayouts = nextLayouts;

  // 1. LocalStorage 즉시 동기화
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextLayouts));
  } catch (e) {
    console.warn("Failed to save local manager layout:", e);
  }

  // 2. Window 이벤트 전송 (동일 탭/화면 실시간 반영)
  window.dispatchEvent(
    new CustomEvent("oryuk_dashboard_layout_updated", {
      detail: { managerKey, panels, updatedBy }
    })
  );

  // 3. Firestore 원격 동기화
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        layouts: nextLayouts,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Firestore manager dashboard layout save error:", err);
  }
};

/**
 * 특정 관리자의 커스텀 레이아웃 초기화 (기본값으로 복원)
 * @param {string} managerKey 관리자 ID 또는 이름
 */
export const resetManagerCustomLayout = async (managerKey) => {
  if (!managerKey) return;

  const nextLayouts = { ...inMemoryLayouts };
  delete nextLayouts[managerKey];
  inMemoryLayouts = nextLayouts;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextLayouts));
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent("oryuk_dashboard_layout_updated", {
      detail: { managerKey, panels: null, isReset: true }
    })
  );

  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        layouts: nextLayouts,
        updatedAt: new Date().toISOString(),
        updatedBy: "RESET"
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Firestore reset error:", err);
  }
};

/**
 * 전체 관리자 커스텀 레이아웃 일괄 초기화
 */
export const resetAllManagerCustomLayouts = async () => {
  inMemoryLayouts = {};
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent("oryuk_dashboard_layout_updated", {
      detail: { allReset: true }
    })
  );

  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        layouts: {},
        updatedAt: new Date().toISOString(),
        updatedBy: "ALL_RESET"
      },
      { merge: true }
    );
  } catch (err) {}
};

/**
 * Firestore 실시간 레이아웃 변경 구독
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export const subscribeManagerLayouts = (callback) => {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.layouts && typeof data.layouts === "object") {
            inMemoryLayouts = data.layouts;
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.layouts));
            } catch (e) {}
            if (typeof callback === "function") {
              callback(data.layouts);
            }
          }
        }
      },
      (err) => {
        console.warn("Manager layouts snapshot error (offline fallback used):", err);
      }
    );
  } catch (e) {
    console.warn("Failed to subscribe manager layouts:", e);
    return () => {};
  }
};
