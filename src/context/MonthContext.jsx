import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const MonthContext = createContext();
const FIRESTORE_DOC_PATH = ["system_store", "monthly_master"];
const LOCAL_STORAGE_KEY = "admin_multi_month_store_v4_firestore";

// Helper: Safe localStorage setter with quota error recovery and cache cleanup
export function safeSaveLocalStorage(key, value) {
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`localStorage quota warning for ${key}, cleaning up legacy cache:`, e.message);
    try {
      // Clean obsolete large keys
      const obsoleteKeys = [
        "admin_multi_month_store_v3",
        "admin_multi_month_store_v2",
        "admin_multi_month_store_v1",
        "admin_pnl_transactions_v3",
        "admin_pnl_transactions_v2",
        "operator_upload_history_v1"
      ];
      obsoleteKeys.forEach((k) => {
        try { localStorage.removeItem(k); } catch (err) {}
      });

      // If value is a monthly store, strip heavy item/transaction raw arrays
      let cleanVal = value;
      if (typeof value === "object" && value !== null) {
        cleanVal = {};
        for (const ym of Object.keys(value)) {
          const m = value[ym] || {};
          const { items, transactions, ...rest } = m;
          cleanVal[ym] = rest;
        }
      }
      const serialized = typeof cleanVal === "string" ? cleanVal : JSON.stringify(cleanVal);
      localStorage.setItem(key, serialized);
    } catch (retryErr) {
      console.warn(`localStorage full, skipping local write for ${key} (cloud Firestore active):`, retryErr.message);
    }
  }
}

// Helper: Deep sanitize object to guarantee Firestore compatibility (removes DOM File, functions, undefined, heavy raw dumps)
function sanitizeForFirestore(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj === undefined ? null : obj;
  }
  if (typeof File !== "undefined" && obj instanceof File) {
    return null;
  }
  if (typeof Blob !== "undefined" && obj instanceof Blob) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((item) => item !== undefined);
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    if (key === "file" || key === "items" || key === "transactions") continue;
    const val = obj[key];
    if (val !== undefined && typeof val !== "function") {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

// Dynamic current year-month based on live login date (e.g. "2026-09" for September 2026)
export const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Helper: Get Year-Month offset (e.g. offset = 1 returns next month "2026-10")
export const getOffsetYearMonth = (offset = 1) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const CURRENT_DEFAULT_MONTH = getCurrentYearMonth();

// Generate list of months starting from current login month (당월) going back
export const generateDefaultMonthList = () => {
  const currentYM = getCurrentYearMonth(); // 당월 (예: 2026-09)
  const [currentYear, currentMonth] = currentYM.split("-").map(Number);
  const months = [];

  const targetYear = 2026;
  for (let m = currentMonth; m >= 1; m--) {
    months.push(`${currentYear}-${String(m).padStart(2, "0")}`);
  }
  if (currentYear > targetYear) {
    for (let y = currentYear - 1; y >= targetYear; y--) {
      for (let m = 12; m >= 1; m--) {
        months.push(`${y}-${String(m).padStart(2, "0")}`);
      }
    }
  }

  const base2026 = ["2026-08", "2026-07", "2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01"];
  return Array.from(new Set([...months, ...base2026])).sort().reverse();
};

export const DEFAULT_MONTH_LIST = generateDefaultMonthList();

export const createEmptyMonthlyData = (yearMonth) => ({
  yearMonth,
  salesSummary: { totalSales: 0, salesTarget: 0, achievementRate: 0, totalQty: 0, itemCount: 0, vehicleGroupCount: 0 },
  purchaseSummary: { totalPurchase: 0, purchaseTarget: 0, ledgerBenchmark: 0, totalExpenses: 0 },
  expenseSummary: { totalExpense: 0 },
  pnlSummary: { grossProfit: 0, operatingProfit: 0, netProfit: 0, profitMargin: 0 },
  vehicleSales: [],
  materialPurchases: [],
  purchaseExpenses: [],
  jajaeGroups: [],
  closingLedger: {
    beginningBalance: 0,
    salesAmount: 0,
    collectedAmount: 0,
    endingBalance: 0,
    entries: []
  },
  productionSummary: {
    totalProductionMh: 0,
    extrusionTotalMinutes: 0,
    downtimeMinutes: 0
  },
  qualitySummary: {
    totalInspected: 0,
    totalDefects: 0,
    defectRate: 0
  }
});

export const MonthProvider = ({ children }) => {
  const currentYearMonth = getCurrentYearMonth();

  // Load persistent monthly data from localStorage or fallback to default multi-month master data
  const [allMonthlyData, setAllMonthlyData] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...initialMultiMonthData, ...parsed };
        ["2026-09", "2026-08", "2026-07"].forEach((ym) => {
          if ((!merged[ym] || merged[ym]?.salesSummary?.totalSales === 0) && initialMultiMonthData[ym]?.salesSummary?.totalSales > 0) {
            merged[ym] = initialMultiMonthData[ym];
          }
        });
        return merged;
      } catch (e) {
        console.error("Error reading saved monthly store:", e);
      }
    }
    return initialMultiMonthData;
  });

  // Always default to the live current month based on actual login date (당월)
  const defaultMonths = useMemo(() => generateDefaultMonthList(), []);
  const dataMonths = useMemo(() => Object.keys(allMonthlyData), [allMonthlyData]);
  const availableMonths = useMemo(() => {
    return Array.from(new Set([...defaultMonths, ...dataMonths])).sort().reverse();
  }, [defaultMonths, dataMonths]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_selected_month_v4");
      if (saved && typeof saved === "string" && saved.includes("-")) {
        return saved;
      }
    } catch (e) {}
    return getCurrentYearMonth();
  });

  const resetToCurrentMonth = () => {
    const liveCurrentMonth = getCurrentYearMonth();
    setSelectedMonth(liveCurrentMonth);
    safeSaveLocalStorage("admin_selected_month_v4", liveCurrentMonth);
  };

  const isCurrentMonth = (ym) => ym === currentYearMonth;

  // Real-time Cloud Sync with Firestore
  useEffect(() => {
    try {
      const docRef = doc(db, ...FIRESTORE_DOC_PATH);

      // 1. Initial direct fetch from Cloud Firestore
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData && remoteData.store) {
            setAllMonthlyData((prev) => {
              const merged = { ...prev, ...remoteData.store };
              ["2026-09", "2026-08", "2026-07"].forEach((ym) => {
                if ((!merged[ym] || merged[ym]?.salesSummary?.totalSales === 0) && initialMultiMonthData[ym]?.salesSummary?.totalSales > 0) {
                  merged[ym] = initialMultiMonthData[ym];
                }
              });
              safeSaveLocalStorage(LOCAL_STORAGE_KEY, merged);
              return merged;
            });
          }
        }
      }).catch((e) => console.warn("Firestore direct get warning:", e.message));

      // 2. Real-time live listener
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            if (remoteData && remoteData.store) {
              setAllMonthlyData((prev) => {
                const merged = { ...prev, ...remoteData.store };
                ["2026-09", "2026-08", "2026-07"].forEach((ym) => {
                  if ((!merged[ym] || merged[ym]?.salesSummary?.totalSales === 0) && initialMultiMonthData[ym]?.salesSummary?.totalSales > 0) {
                    merged[ym] = initialMultiMonthData[ym];
                  }
                });
                safeSaveLocalStorage(LOCAL_STORAGE_KEY, merged);
                return merged;
              });
            }
          }
        },
        (error) => {
          console.warn("Firestore monthly data sync warning (using local):", error.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn("MonthContext Firestore subscribe error:", e);
    }
  }, []);

  // Current active month's data package (with fallback to structured empty month if not yet uploaded)
  const currentMonthData = useMemo(() => {
    const safeMonth = selectedMonth || getCurrentYearMonth();
    const raw = (allMonthlyData && allMonthlyData[safeMonth]) || null;
    const empty = createEmptyMonthlyData(safeMonth);
    if (!raw) return empty;
    return {
      ...empty,
      ...raw,
      salesSummary: { ...empty.salesSummary, ...(raw.salesSummary || {}) },
      purchaseSummary: { ...empty.purchaseSummary, ...(raw.purchaseSummary || {}) },
      expenseSummary: { ...empty.expenseSummary, ...(raw.expenseSummary || {}) },
      pnlSummary: { ...empty.pnlSummary, ...(raw.pnlSummary || {}) },
      vehicleSales: Array.isArray(raw.vehicleSales) ? raw.vehicleSales : [],
      materialPurchases: Array.isArray(raw.materialPurchases) ? raw.materialPurchases : [],
      purchaseExpenses: Array.isArray(raw.purchaseExpenses) ? raw.purchaseExpenses : [],
      jajaeGroups: Array.isArray(raw.jajaeGroups) ? raw.jajaeGroups : [],
      closingLedger: { ...empty.closingLedger, ...(raw.closingLedger || {}) },
      productionSummary: { ...empty.productionSummary, ...(raw.productionSummary || {}) },
      qualitySummary: { ...empty.qualitySummary, ...(raw.qualitySummary || {}) }
    };
  }, [allMonthlyData, selectedMonth]);

  // Change active month
  const changeMonth = (yearMonth) => {
    const val = yearMonth || getCurrentYearMonth();
    setSelectedMonth(val);
    safeSaveLocalStorage("admin_selected_month_v4", val);
  };

  // Add / Update Monthly Data from Workbook Upload
  const uploadMonthlyData = async (yearMonth, monthPackage, fileMeta = {}) => {
    const cleanPackage = sanitizeForFirestore(monthPackage);

    const latestFileRecord = {
      fileName: fileMeta.fileName || cleanPackage.fileName || "최신_업로드_데이터.xlsx",
      uploadedAt: new Date().toISOString(),
      uploadedAtFormatted: new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      uploadedBy: fileMeta.uploadedBy || "작업자",
      fileSize: fileMeta.fileSize || "1.2 MB",
      isLatest: true
    };

    const existing = allMonthlyData[yearMonth] || {};
    const finalSales = cleanPackage.totalSales > 0 ? cleanPackage.totalSales : (existing.totalSales || 0);
    const finalExpenses = cleanPackage.totalExpenses > 0 ? cleanPackage.totalExpenses : (existing.totalExpenses || 0);
    const finalSalesSummary = (cleanPackage.salesSummary && cleanPackage.salesSummary.totalSales > 0)
      ? cleanPackage.salesSummary
      : (existing.salesSummary || cleanPackage.salesSummary);
    const finalVehicleSales = (cleanPackage.vehicleSales && cleanPackage.vehicleSales.length > 0)
      ? cleanPackage.vehicleSales
      : (existing.vehicleSales || []);
    const finalJajaeSummary = (cleanPackage.jajaeSummary && cleanPackage.jajaeSummary.totalAmount > 0)
      ? cleanPackage.jajaeSummary
      : (existing.jajaeSummary || cleanPackage.jajaeSummary);
    const finalJajaeGroups = (cleanPackage.jajaeGroups && cleanPackage.jajaeGroups.length > 0)
      ? cleanPackage.jajaeGroups
      : (existing.jajaeGroups || []);
    const finalPurchaseSummary = (cleanPackage.purchaseSummary && (cleanPackage.purchaseSummary.ledgerBenchmark > 0 || cleanPackage.purchaseSummary.totalExpenses > 0))
      ? cleanPackage.purchaseSummary
      : {
          yearMonth,
          ledgerBenchmark: finalExpenses,
          totalExpenses: finalExpenses,
          totalPurchase: finalExpenses
        };

    const finalGrossProfit = cleanPackage.grossProfit !== undefined ? cleanPackage.grossProfit : (finalSales - finalExpenses);
    const finalCostRatio = finalSales > 0 ? Number(((finalExpenses / finalSales) * 100).toFixed(2)) : 80.93;
    const finalProfitRatio = finalSales > 0 ? Number((((finalSales - finalExpenses) / finalSales) * 100).toFixed(2)) : 19.07;
    const finalSalesBreakdown = (cleanPackage.salesBreakdown && cleanPackage.salesBreakdown.length > 0)
      ? cleanPackage.salesBreakdown
      : (existing.salesBreakdown || []);
    const finalPurchaseBreakdown = (cleanPackage.purchaseBreakdown && cleanPackage.purchaseBreakdown.length > 0)
      ? cleanPackage.purchaseBreakdown
      : (existing.purchaseBreakdown || []);

    // Strip redundant transaction arrays from monthly summary store
    const { items, transactions, ...lightweightPackage } = cleanPackage;

    const updated = {
      ...allMonthlyData,
      [yearMonth]: {
        ...existing,
        ...lightweightPackage,
        totalSales: finalSales,
        totalExpenses: finalExpenses,
        grossProfit: finalGrossProfit,
        costRatio: finalCostRatio,
        profitRatio: finalProfitRatio,
        salesBreakdown: finalSalesBreakdown,
        purchaseBreakdown: finalPurchaseBreakdown,
        salesSummary: finalSalesSummary,
        vehicleSales: finalVehicleSales,
        jajaeSummary: finalJajaeSummary,
        jajaeGroups: finalJajaeGroups,
        purchaseSummary: finalPurchaseSummary,
        yearMonth,
        latestFile: latestFileRecord,
        lastUpdated: new Date().toISOString()
      }
    };

    setAllMonthlyData(updated);
    setSelectedMonth(yearMonth);
    safeSaveLocalStorage(LOCAL_STORAGE_KEY, updated);
    safeSaveLocalStorage("admin_selected_month_v4", yearMonth);

    // Sync to Firestore Cloud Database
    try {
      const docRef = doc(db, ...FIRESTORE_DOC_PATH);
      const sanitizedStore = sanitizeForFirestore(updated);
      await setDoc(docRef, {
        store: sanitizedStore,
        lastUpdatedYearMonth: yearMonth,
        latestFile: latestFileRecord,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`[${yearMonth}] Latest uploaded file (${latestFileRecord.fileName}) successfully synced to Firestore cloud.`);
    } catch (e) {
      console.error("Firestore monthly store upload error:", e);
    }

    return true;
  };

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        currentYearMonth,
        isCurrentMonth,
        availableMonths,
        currentMonthData,
        allMonthlyData,
        changeMonth,
        setSelectedMonth: changeMonth,
        resetToCurrentMonth,
        uploadMonthlyData
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

export const useMonth = () => useContext(MonthContext);

