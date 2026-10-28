import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_PANEL_SETTING } from "../config/panelThemeConfig";

const LOCAL_STORAGE_KEY_LAYOUTS = "oryuk_manager_custom_layouts";
const LOCAL_STORAGE_KEY_SETTINGS = "oryuk_panel_custom_settings";
const LOCAL_STORAGE_KEY_VERSION = "oryuk_manager_layout_version";
const CURRENT_LAYOUT_VERSION = "20261029_v15_role_tailored";
const SETTINGS_DOC_PATH = ["system_settings", "manager_dashboard_layouts"];

// Memory cache for synchronous lookups
let inMemoryLayouts = {};
let inMemoryPanelSettings = {};

// Initialize from localStorage immediately with version control
try {
  const savedVersion = localStorage.getItem(LOCAL_STORAGE_KEY_VERSION);
  if (savedVersion !== CURRENT_LAYOUT_VERSION) {
    // 구버전 캐시 무효화 (각 관리자별 전담 공정 최상단 맞춤 레이아웃 적용)
    localStorage.removeItem(LOCAL_STORAGE_KEY_LAYOUTS);
    localStorage.setItem(LOCAL_STORAGE_KEY_VERSION, CURRENT_LAYOUT_VERSION);
    inMemoryLayouts = {};
  } else {
    const cachedLayouts = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS);
    if (cachedLayouts) {
      inMemoryLayouts = JSON.parse(cachedLayouts) || {};
    }
  }
} catch (e) {
  console.warn("Failed to load local manager dashboard layouts:", e);
}

try {
  const cachedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
  if (cachedSettings) {
    inMemoryPanelSettings = JSON.parse(cachedSettings) || {};
  }
} catch (e) {
  console.warn("Failed to load local panel custom settings:", e);
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
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(nextLayouts));
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
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(nextLayouts));
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

/* ========================================================================= */
/* 🎨 패널 제목 및 디자인 커스텀 설정 API                                    */
/* ========================================================================= */

/**
 * 특정 관리자의 모든 패널 커스텀 설정 조회
 * @param {string} managerKey (예: 'sam_cy', '이창엽', 'TEST')
 * @returns {Record<string, any>} [blockKey]: setting
 */
export const getCustomSettingsForManager = (managerKey) => {
  if (!managerKey) return {};
  const settings = inMemoryPanelSettings[managerKey];
  if (settings && typeof settings === "object") {
    return settings;
  }
  return {};
};

/**
 * 특정 패널의 커스텀 설정 단건 조회
 */
export const getPanelCustomSetting = (managerKey, panelKey) => {
  if (!managerKey || !panelKey) return DEFAULT_PANEL_SETTING;
  const managerSettings = getCustomSettingsForManager(managerKey);
  return {
    ...DEFAULT_PANEL_SETTING,
    ...(managerSettings[panelKey] || {})
  };
};

/**
 * 특정 관리자의 특정 패널 커스텀 설정 저장
 */
export const savePanelCustomSetting = async (managerKey, panelKey, setting, updatedBy = "TEST") => {
  if (!managerKey || !panelKey) return;

  const currentManagerSettings = inMemoryPanelSettings[managerKey] || {};
  const nextManagerSettings = {
    ...currentManagerSettings,
    [panelKey]: {
      ...(currentManagerSettings[panelKey] || {}),
      ...setting,
      updatedAt: new Date().toISOString()
    }
  };

  const nextAllSettings = {
    ...inMemoryPanelSettings,
    [managerKey]: nextManagerSettings
  };
  inMemoryPanelSettings = nextAllSettings;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(nextAllSettings));
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent("oryuk_panel_settings_updated", {
      detail: { managerKey, panelKey, setting, updatedBy }
    })
  );

  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        panelSettings: nextAllSettings,
        updatedAt: new Date().toISOString(),
        updatedBy
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Firestore panel settings save error:", err);
  }
};

/**
 * 특정 관리자의 활성 패널 전체에 테마/디자인 일괄 적용
 */
export const batchApplyThemeToManagerPanels = async (managerKey, panelKeys, designOptions, updatedBy = "TEST") => {
  if (!managerKey || !Array.isArray(panelKeys)) return;

  const currentManagerSettings = inMemoryPanelSettings[managerKey] || {};
  const updatedSettings = { ...currentManagerSettings };

  panelKeys.forEach((key) => {
    updatedSettings[key] = {
      ...(updatedSettings[key] || {}),
      ...designOptions,
      updatedAt: new Date().toISOString()
    };
  });

  const nextAllSettings = {
    ...inMemoryPanelSettings,
    [managerKey]: updatedSettings
  };
  inMemoryPanelSettings = nextAllSettings;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(nextAllSettings));
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent("oryuk_panel_settings_updated", {
      detail: { managerKey, allUpdated: true, updatedBy }
    })
  );

  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        panelSettings: nextAllSettings,
        updatedAt: new Date().toISOString(),
        updatedBy
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Firestore batch theme save error:", err);
  }
};

/**
 * 특정 패널 설정 초기화
 */
export const resetPanelCustomSetting = async (managerKey, panelKey = null) => {
  if (!managerKey) return;

  const nextAllSettings = { ...inMemoryPanelSettings };
  if (panelKey) {
    if (nextAllSettings[managerKey]) {
      delete nextAllSettings[managerKey][panelKey];
    }
  } else {
    delete nextAllSettings[managerKey];
  }
  inMemoryPanelSettings = nextAllSettings;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(nextAllSettings));
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent("oryuk_panel_settings_updated", {
      detail: { managerKey, panelKey, isReset: true }
    })
  );

  try {
    const docRef = doc(db, SETTINGS_DOC_PATH[0], SETTINGS_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        panelSettings: nextAllSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: "RESET"
      },
      { merge: true }
    );
  } catch (err) {}
};

/**
 * Firestore 실시간 레이아웃 & 패널 설정 구독
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
          let hasUpdates = false;

          if (data && data.layouts && typeof data.layouts === "object") {
            inMemoryLayouts = data.layouts;
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(data.layouts));
            } catch (e) {}
            hasUpdates = true;
          }

          if (data && data.panelSettings && typeof data.panelSettings === "object") {
            inMemoryPanelSettings = data.panelSettings;
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(data.panelSettings));
            } catch (e) {}
            hasUpdates = true;
          }

          if (hasUpdates && typeof callback === "function") {
            callback({ layouts: inMemoryLayouts, panelSettings: inMemoryPanelSettings });
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
