import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const MonthContext = createContext();
const FIRESTORE_DOC_PATH = ["system_store", "monthly_master"];
const LOCAL_STORAGE_KEY = "admin_multi_month_store_v4_firestore";

export const MonthProvider = ({ children }) => {
  // Load persistent monthly data from localStorage or fallback to default multi-month master data
  const [allMonthlyData, setAllMonthlyData] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialMultiMonthData, ...parsed };
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
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            if (remoteData && remoteData.store) {
              setAllMonthlyData((prev) => {
                const merged = { ...prev, ...remoteData.store };
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

  // Add / Update Monthly Data from Workbook Upload (Syncs to Cloud + Local)
  const uploadMonthlyData = async (yearMonth, monthPackage) => {
    const updated = {
      ...allMonthlyData,
      [yearMonth]: {
        ...allMonthlyData[yearMonth],
        ...monthPackage,
        yearMonth
      }
    };

    setAllMonthlyData(updated);
    setSelectedMonth(yearMonth);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("admin_selected_month_v4", yearMonth);

    // Sync to Firestore Cloud Database so all mobile devices & PCs update immediately
    try {
      const docRef = doc(db, ...FIRESTORE_DOC_PATH);
      await setDoc(docRef, {
        store: updated,
        lastUpdatedYearMonth: yearMonth,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Monthly store successfully synced to Firestore cloud!");
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
