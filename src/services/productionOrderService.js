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
 */
export const subscribeProductionOrders = (division, callback) => {
  let isSubscribed = true;

  // 1. Initial fire with local cache
  if (callback && typeof callback === "function") {
    callback(getLocalProductionOrders(division));
  }

  // 2. Window event listener for multi-tab / cross-component sync
  const handleLocalUpdate = (e) => {
    if (!isSubscribed) return;
    if (callback && typeof callback === "function") {
      if (e.detail?.all) {
        callback(division ? e.detail.all[division] || {} : e.detail.all);
      } else {
        callback(getLocalProductionOrders(division));
      }
    }
  };
  window.addEventListener("production_orders_updated", handleLocalUpdate);

  // 3. Firestore snapshot listener
  let unsubFirestore = () => {};
  if (db) {
    try {
      unsubFirestore = onSnapshot(
        doc(db, "app_settings", PRODUCTION_ORDERS_STORAGE_KEY),
        (snap) => {
          if (!isSubscribed) return;
          if (snap.exists()) {
            const data = snap.data();
            try {
              if (typeof localStorage !== "undefined") {
                localStorage.setItem(PRODUCTION_ORDERS_STORAGE_KEY, JSON.stringify(data));
              }
            } catch (err) {}
            if (callback && typeof callback === "function") {
              callback(division ? data[division] || {} : data);
            }
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

  // 4. Return complete cleanup function to guarantee ZERO memory leaks
  return () => {
    isSubscribed = false;
    window.removeEventListener("production_orders_updated", handleLocalUpdate);
    if (typeof unsubFirestore === "function") {
      unsubFirestore();
    }
  };
};
