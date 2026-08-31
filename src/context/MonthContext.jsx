import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const MonthContext = createContext();
const FIRESTORE_DOC_PATH = ["system_store", "monthly_master"];
const LOCAL_STORAGE_KEY = "admin_multi_month_store_v4_firestore";

// Helper: Deep sanitize object to guarantee Firestore compatibility (removes DOM File, functions, undefined)
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
    if (key === "file") continue;
    const val = obj[key];
    if (val !== undefined && typeof val !== "function") {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

export const MonthProvider = ({ children }) => {
  // Load persistent monthly data from localStorage or fallback to default multi-month master data
  const [allMonthlyData, setAllMonthlyData] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...initialMultiMonthData, ...parsed };
        if (merged["2026-08"]?.salesSummary?.totalSales === 0 && initialMultiMonthData["2026-08"]?.salesSummary?.totalSales > 0) {
          merged["2026-08"] = initialMultiMonthData["2026-08"];
        }
        return merged;
      } catch (e) {
        console.error("Error reading saved monthly store:", e);
      }
    }
    return initialMultiMonthData;
  });

  // Default to the latest month available (e.g. "2026-08" or "2026-07")
  const availableMonths = Object.keys(allMonthlyData).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const savedMonth = localStorage.getItem("admin_selected_month_v4");
    if (savedMonth && allMonthlyData[savedMonth]) return savedMonth;
    return availableMonths.includes("2026-08") ? "2026-08" : (availableMonths[0] || "2026-07");
  });

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
              if (merged["2026-08"]?.salesSummary?.totalSales === 0 && initialMultiMonthData["2026-08"]?.salesSummary?.totalSales > 0) {
                merged["2026-08"] = initialMultiMonthData["2026-08"];
              }
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
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
                if (merged["2026-08"]?.salesSummary?.totalSales === 0 && initialMultiMonthData["2026-08"]?.salesSummary?.totalSales > 0) {
                  merged["2026-08"] = initialMultiMonthData["2026-08"];
                }
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
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

  // Current active month's data package
  const currentMonthData = allMonthlyData[selectedMonth] || allMonthlyData[availableMonths[0]] || null;

  // Change active month
  const changeMonth = (yearMonth) => {
    if (allMonthlyData[yearMonth]) {
      setSelectedMonth(yearMonth);
      localStorage.setItem("admin_selected_month_v4", yearMonth);
    }
  };

  // Add / Update Monthly Data from Workbook Upload (Strictly uses the latest uploaded file and replaces old file data)
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

    // Cleanly overwrite the month with the newest file's data (replacing previous file)
    const updated = {
      ...allMonthlyData,
      [yearMonth]: {
        ...cleanPackage,
        yearMonth,
        latestFile: latestFileRecord,
        lastUpdated: new Date().toISOString()
      }
    };

    setAllMonthlyData(updated);
    setSelectedMonth(yearMonth);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("admin_selected_month_v4", yearMonth);

    // Sync to Firestore Cloud Database so all mobile devices & PCs update immediately to the latest file
    try {
      const docRef = doc(db, ...FIRESTORE_DOC_PATH);
      const sanitizedStore = sanitizeForFirestore(updated);
      await setDoc(docRef, {
        store: sanitizedStore,
        lastUpdatedYearMonth: yearMonth,
        latestFile: latestFileRecord,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`[${yearMonth}] Latest uploaded file (${latestFileRecord.fileName}) successfully synced to Firestore cloud. Previous file replaced.`);
    } catch (e) {
      console.error("Firestore monthly store upload error:", e);
    }

    return true;
  };

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        availableMonths,
        currentMonthData,
        allMonthlyData,
        changeMonth,
        uploadMonthlyData
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

export const useMonth = () => useContext(MonthContext);
