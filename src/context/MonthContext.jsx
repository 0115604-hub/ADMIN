import React, { createContext, useContext, useState, useEffect } from "react";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const MonthContext = createContext();

export const MonthProvider = ({ children }) => {
  // Load persistent monthly data from localStorage or fallback to default multi-month master data
  const [allMonthlyData, setAllMonthlyData] = useState(() => {
    const saved = localStorage.getItem("admin_multi_month_store");
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

  // Default to the latest month available (e.g. "2026-08")
  const availableMonths = Object.keys(allMonthlyData).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const savedMonth = localStorage.getItem("admin_selected_month");
    if (savedMonth && allMonthlyData[savedMonth]) return savedMonth;
    return availableMonths[0] || "2026-08";
  });

  // Current active month's data package
  const currentMonthData = allMonthlyData[selectedMonth] || allMonthlyData[availableMonths[0]] || null;

  // Change active month
  const changeMonth = (yearMonth) => {
    if (allMonthlyData[yearMonth]) {
      setSelectedMonth(yearMonth);
      localStorage.setItem("admin_selected_month", yearMonth);
    }
  };

  // Add / Update Monthly Data from Workbook Upload
  const uploadMonthlyData = (yearMonth, monthPackage) => {
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
    localStorage.setItem("admin_multi_month_store", JSON.stringify(updated));
    localStorage.setItem("admin_selected_month", yearMonth);
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
