import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.js";
import { QUALITY_CORE_ITEMS, getPreviousYearMonth } from "./qualityConstants.js";

export const QUALITY_TARGETS_STORAGE_KEY = "factory_quality_target_settings_v1";
export const QUALITY_TARGETS_COLLECTION_NAME = "quality_target_settings";

/**
 * Calculate item-specific quality targets based on previous month's actual defect rate.
 * Rule:
 *  - If prev month actual < 1.00%: target = prevRate * 0.95 (5% lower / 5% reduction)
 *  - If prev month actual >= 1.00%: target = prevRate * 0.90 (10% lower / 10% reduction)
 *  - If prev month actual === 0: default base target (0.50%)
 */
export const calculateItemQualityTargets = (allRecords = [], targetYearMonth = "2026-09") => {
  const prevYM = getPreviousYearMonth(targetYearMonth);
  const prevMonthRecords = (allRecords || []).filter(
    (r) => r.yearMonth === prevYM || (r.date && r.date.startsWith(prevYM))
  );

  const prevItemMap = {};
  QUALITY_CORE_ITEMS.forEach((core) => {
    prevItemMap[core.id] = {
      id: core.id,
      name: core.name,
      carModel: core.carModel,
      inspectQty: 0,
      defectQty: 0
    };
  });

  let prevTotalInspect = 0;
  let prevTotalDefect = 0;

  prevMonthRecords.forEach((r) => {
    const key = r.itemId ? r.itemId.toLowerCase() : "";
    if (prevItemMap[key]) {
      prevItemMap[key].inspectQty += r.inspectQty || 0;
      prevItemMap[key].defectQty += r.defectQty || 0;
      prevTotalInspect += r.inspectQty || 0;
      prevTotalDefect += r.defectQty || 0;
    }
  });

  const calcTarget = (prevRate) => {
    if (prevRate === 0) {
      return {
        targetRate: 0.50,
        reductionPct: 0,
        ruleType: "zero_base",
        ruleDesc: "0% 실적 유지 기준 (기본 0.50% 목표)"
      };
    }
    if (prevRate < 1.0) {
      const target = Number((prevRate * 0.95).toFixed(2));
      return {
        targetRate: Math.max(0.01, target),
        reductionPct: 5,
        ruleType: "5_pct_reduction",
        ruleDesc: "전월 1.0% 미만 (5% 낮게 설정 / 5% 감축)"
      };
    }
    const target = Number((prevRate * 0.90).toFixed(2));
    return {
      targetRate: Math.max(0.01, target),
      reductionPct: 10,
      ruleType: "10_pct_reduction",
      ruleDesc: "전월 1.0% 이상 (10% 낮게 설정 / 10% 집중 감축)"
    };
  };

  const items = {};
  QUALITY_CORE_ITEMS.forEach((core) => {
    const p = prevItemMap[core.id];
    // Fallback if no records in prevMonth
    let fallbackPrevRate = 0.70;
    if (core.id === "ja") fallbackPrevRate = 0.86;
    if (core.id === "nx4a") fallbackPrevRate = 0.76;
    if (core.id === "nx4") fallbackPrevRate = 0.20;
    if (core.id === "hr") fallbackPrevRate = 0.56;

    const prevRate = p.inspectQty > 0 ? Number(((p.defectQty / p.inspectQty) * 100).toFixed(2)) : fallbackPrevRate;
    const targetCalc = calcTarget(prevRate);

    items[core.id] = {
      id: core.id,
      name: core.name,
      carModel: core.carModel,
      prevInspectQty: p.inspectQty,
      prevDefectQty: p.defectQty,
      prevRate,
      targetRate: targetCalc.targetRate,
      reductionPct: targetCalc.reductionPct,
      ruleType: targetCalc.ruleType,
      ruleDesc: targetCalc.ruleDesc
    };
  });

  const prevOverallRate = prevTotalInspect > 0 ? Number(((prevTotalDefect / prevTotalInspect) * 100).toFixed(2)) : 0.62;
  const overallCalc = calcTarget(prevOverallRate);

  return {
    yearMonth: targetYearMonth,
    prevYearMonth: prevYM,
    items,
    overall: {
      id: "overall",
      name: "종합 합계 (4대 차종)",
      carModel: "ALL",
      prevInspectQty: prevTotalInspect,
      prevDefectQty: prevTotalDefect,
      prevRate: prevOverallRate,
      targetRate: overallCalc.targetRate,
      reductionPct: overallCalc.reductionPct,
      ruleType: overallCalc.ruleType,
      ruleDesc: overallCalc.ruleDesc
    },
    updatedAt: new Date().toISOString()
  };
};

/**
 * Get Local Target Settings
 */
export const getLocalQualityTargets = (yearMonth = "2026-09", allRecords = []) => {
  try {
    const raw = localStorage.getItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.items) return parsed;
    }
  } catch (e) {
    console.error("getLocalQualityTargets error:", e);
  }
  return calculateItemQualityTargets(allRecords, yearMonth);
};

/**
 * Save Quality Targets (Local + Firestore)
 */
export const saveQualityTargets = async (yearMonth, targetData) => {
  try {
    const dataToSave = {
      ...targetData,
      yearMonth,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`, JSON.stringify(dataToSave));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quality-targets-updated", { detail: dataToSave }));
    }

    try {
      const docRef = doc(db, QUALITY_TARGETS_COLLECTION_NAME, `targets_${yearMonth}`);
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (fbErr) {
      console.warn("Firestore target save warning (fallback to local):", fbErr);
    }
    return dataToSave;
  } catch (err) {
    console.error("saveQualityTargets error:", err);
    throw err;
  }
};

/**
 * Subscribe to Quality Targets
 */
export const subscribeQualityTargets = (yearMonth = "2026-09", callback, allRecords = []) => {
  let unsubFirestore = null;
  const localData = getLocalQualityTargets(yearMonth, allRecords);
  callback(localData);

  try {
    const docRef = doc(db, QUALITY_TARGETS_COLLECTION_NAME, `targets_${yearMonth}`);
    unsubFirestore = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        localStorage.setItem(`${QUALITY_TARGETS_STORAGE_KEY}_${yearMonth}`, JSON.stringify(data));
        callback(data);
      }
    }, (err) => {
      console.warn("Firestore targets listener fallback to local:", err);
    });
  } catch (e) {
    console.warn("Firestore targets subscribe error:", e);
  }

  const handleLocalUpdate = (e) => {
    if (e.detail && e.detail.yearMonth === yearMonth) {
      callback(e.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("quality-targets-updated", handleLocalUpdate);
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener("quality-targets-updated", handleLocalUpdate);
    }
  };
};
