import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { sanitizeForFirestore } from "../utils/firestoreUtils.js";

export const PRODUCTION_ORDERS_STORAGE_KEY = "daily_production_orders_v1";

export const DEFAULT_PRODUCTION_ORDERS = {
  machining: {
    HR: 800,
    JA: 1200,
    NX5A: 1500
  },
  extrusion: {
    pcm1: 2500,
    pcm3: 3000,
    pvc: 2000,
    tpe: 1800,
    ALL: 9300
  },
  hanul: {
    "9BQC": 350
  },
  burim: {
    "BURIM_DEFAULT": 400
  },
  yuseong: {
    "YUSEONG_DEFAULT": 500
  }
};

/**
 * Read production orders from localStorage with fallback defaults
 */
export const getLocalProductionOrders = (division = "") => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(PRODUCTION_ORDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (division && parsed[division]) {
            return { ...(DEFAULT_PRODUCTION_ORDERS[division] || {}), ...parsed[division] };
          }
          return {
            machining: { ...DEFAULT_PRODUCTION_ORDERS.machining, ...(parsed.machining || {}) },
            extrusion: { ...DEFAULT_PRODUCTION_ORDERS.extrusion, ...(parsed.extrusion || {}) },
            hanul: { ...DEFAULT_PRODUCTION_ORDERS.hanul, ...(parsed.hanul || {}) },
            burim: { ...DEFAULT_PRODUCTION_ORDERS.burim, ...(parsed.burim || {}) },
            yuseong: { ...DEFAULT_PRODUCTION_ORDERS.yuseong, ...(parsed.yuseong || {}) }
          };
        }
      }
    }
  } catch (e) {
    console.warn("Error reading local production orders:", e);
  }

  if (division && DEFAULT_PRODUCTION_ORDERS[division]) {
    return { ...DEFAULT_PRODUCTION_ORDERS[division] };
  }
  return { ...DEFAULT_PRODUCTION_ORDERS };
};

/**
 * Save updated production order quantity
 */
export const saveProductionOrder = async (division, itemKey, qty, managerName = "") => {
  if (!division || !itemKey) return;
  const numQty = Math.max(0, parseInt(qty, 10) || 0);

  const currentAll = getLocalProductionOrders();
  const nextDivisionOrders = {
    ...(currentAll[division] || DEFAULT_PRODUCTION_ORDERS[division] || {}),
    [itemKey]: numQty
  };

  const nextState = {
    ...currentAll,
    [division]: nextDivisionOrders,
    lastUpdatedBy: managerName || "관리자",
    lastUpdatedAt: new Date().toISOString()
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PRODUCTION_ORDERS_STORAGE_KEY, JSON.stringify(nextState));
      window.dispatchEvent(
        new CustomEvent("production_orders_updated", {
          detail: { division, itemKey, qty: numQty, all: nextState }
        })
      );
    }
  } catch (e) {
    console.warn("LocalStorage write error for production orders:", e);
  }

  if (db) {
    try {
      await setDoc(
        doc(db, "app_settings", PRODUCTION_ORDERS_STORAGE_KEY),
        sanitizeForFirestore(nextState),
        { merge: true }
      );
    } catch (e) {
      console.warn("Firestore save error for production orders:", e);
    }
  }

  return nextDivisionOrders;
};

/**
 * Subscribe to real-time production orders (Memory leak safe with clean unsubscribe)
 * ⚡ 성능 최적화: 싱글톤 멀티플렉싱(Single-Flight) 리스너 & 인메모리 캐시 공유
 */
let activeOrdersUnsub = null;
const orderSubscribers = new Set(); // { division, callback }
let cachedOrdersData = null;
let ordersTeardownTimer = null;
let globalWindowHandlerAttached = false;

const notifyOrderSubscribers = (allData) => {
  cachedOrdersData = allData;
  orderSubscribers.forEach((sub) => {
    try {
      sub.callback(sub.division ? allData[sub.division] || {} : allData);
    } catch (e) {
      console.error("order subscriber error:", e);
    }
  });
};

const handleGlobalOrdersUpdate = (e) => {
  const allData = e.detail?.all || getLocalProductionOrders();
  notifyOrderSubscribers(allData);
};

export const subscribeProductionOrders = (division, callback) => {
  if (typeof callback !== "function") return () => {};

  // 1. Initial fire with cache (UI 지연 제로)
  if (cachedOrdersData) {
    callback(division ? cachedOrdersData[division] || {} : cachedOrdersData);
  } else {
    const local = getLocalProductionOrders(division);
    callback(local);
  }

  const subEntry = { division, callback };
  orderSubscribers.add(subEntry);

  if (!globalWindowHandlerAttached && typeof window !== "undefined") {
    window.addEventListener("production_orders_updated", handleGlobalOrdersUpdate);
    globalWindowHandlerAttached = true;
  }

  if (ordersTeardownTimer) {
    clearTimeout(ordersTeardownTimer);
    ordersTeardownTimer = null;
  }

  // 2. 단 하나의 공유 Firestore 리스너만 가동
  if (!activeOrdersUnsub && db) {
    try {
      activeOrdersUnsub = onSnapshot(
        doc(db, "app_settings", PRODUCTION_ORDERS_STORAGE_KEY),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            try {
              if (typeof localStorage !== "undefined") {
                localStorage.setItem(PRODUCTION_ORDERS_STORAGE_KEY, JSON.stringify(data));
              }
            } catch (err) {}
            notifyOrderSubscribers(data);
          }
        },
        (error) => {
          console.warn("Firestore production orders listen error:", error);
        }
      );
    } catch (e) {
      console.warn("Firestore attach error for production orders:", e);
    }
  }

  // 3. 디바운스된 리스너 해제 (중복 해제/재연결 깜빡임 방지)
  return () => {
    orderSubscribers.delete(subEntry);
    if (orderSubscribers.size === 0) {
      ordersTeardownTimer = setTimeout(() => {
        if (orderSubscribers.size === 0) {
          if (typeof activeOrdersUnsub === "function") {
            activeOrdersUnsub();
            activeOrdersUnsub = null;
          }
          if (globalWindowHandlerAttached && typeof window !== "undefined") {
            window.removeEventListener("production_orders_updated", handleGlobalOrdersUpdate);
            globalWindowHandlerAttached = false;
          }
        }
      }, 5000);
    }
  };
};
