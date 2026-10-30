import { useMemo } from "react";
import { getKSTDateString } from "../../../utils/dateUtils";

/**
 * useWorkerDashboardMetrics
 * - 오늘 날짜 포맷 (한국어 요일)
 * - 손익 및 전월대비 매출/매입 달성률 계산
 */
export function useWorkerDashboardMetrics({ selectedMonth, currentMonthData, allMonthlyData }) {
  const todayDateStr = useMemo(() => getKSTDateString(), []);

  // 오늘 날짜 포맷 (예: 9월 14일 (월))
  const todayFormattedLabel = useMemo(() => {
    const todayStr = getKSTDateString();
    const parts = todayStr.split("-");
    if (parts.length === 3) {
      const dateObj = new Date(`${todayStr}T00:00:00+09:00`);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[dateObj.getDay()] || "";
      return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일 (${dayName})`;
    }
    return todayStr;
  }, []);

  // Safe selected month & PnL metrics
  const safeSelectedMonth = selectedMonth || "2026-09";
  const monthParts = safeSelectedMonth.split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "09"}월`;

  const totalSales =
    currentMonthData?.salesSummary?.totalSales || currentMonthData?.totalSales || 0;
  const totalPurchases =
    currentMonthData?.purchaseSummary?.ledgerBenchmark ||
    currentMonthData?.purchaseSummary?.totalExpenses ||
    currentMonthData?.jajaeSummary?.totalAmount ||
    currentMonthData?.totalExpenses ||
    0;
  const purchaseRatio =
    totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "0.0";

  const prevMonthKey = useMemo(() => {
    if (!safeSelectedMonth) return "2026-08";
    const [y, m] = safeSelectedMonth.split("-").map(Number);
    const prevD = new Date(y || 2026, (m || 9) - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [safeSelectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales =
    prevMonthData?.salesSummary?.totalSales || prevMonthData?.totalSales || 0;
  const prevPurchases =
    prevMonthData?.purchaseSummary?.ledgerBenchmark ||
    prevMonthData?.purchaseSummary?.totalExpenses ||
    prevMonthData?.jajaeSummary?.totalAmount ||
    prevMonthData?.totalExpenses ||
    0;

  const salesAchievementPct =
    prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "100.0";
  const purchaseAchievementPct =
    prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "100.0";

  return {
    todayDateStr,
    todayFormattedLabel,
    safeSelectedMonth,
    monthTitle,
    totalSales,
    totalPurchases,
    purchaseRatio,
    salesAchievementPct,
    purchaseAchievementPct
  };
}
