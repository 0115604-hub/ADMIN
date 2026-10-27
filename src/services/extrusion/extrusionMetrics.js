import { EXTRUSION_LINE_OPTIONS } from "./extrusionProductionConstants";

/**
 * Compute detailed summary metrics from reports list
 */
export const calculateExtrusionMetrics = (reports = []) => {
  let totalTarget = 0;
  let totalActual = 0;
  let totalGood = 0;
  let totalDefect = 0;
  let totalScrapKg = 0;
  let totalDowntimeMinutes = 0;

  const lineMap = {};
  EXTRUSION_LINE_OPTIONS.forEach((l) => {
    lineMap[l.id] = {
      id: l.id,
      name: l.name,
      shortName: l.shortName,
      color: l.color,
      target: 0,
      actual: 0,
      good: 0,
      defect: 0,
      scrapKg: 0,
      downtimeMinutes: 0,
      reportCount: 0
    };
  });

  const vehicleMap = {};
  const downtimeCategoryMap = {};

  reports.forEach((r) => {
    const t = Number(r.targetQty) || 0;
    const a = Number(r.actualQty) || 0;
    const g = Number(r.goodQty) || 0;
    const d = Number(r.defectQty) || 0;
    const s = Number(r.scrapKg) || 0;
    const dt = Number(r.downtimeMinutes) || 0;

    totalTarget += t;
    totalActual += a;
    totalGood += g;
    totalDefect += d;
    totalScrapKg += s;
    totalDowntimeMinutes += dt;

    // Line breakdown
    const lKey = r.lineId || "pcm1";
    if (!lineMap[lKey]) {
      lineMap[lKey] = {
        id: lKey,
        name: r.lineName || lKey,
        shortName: lKey,
        color: "teal",
        target: 0,
        actual: 0,
        good: 0,
        defect: 0,
        scrapKg: 0,
        downtimeMinutes: 0,
        reportCount: 0
      };
    }
    lineMap[lKey].target += t;
    lineMap[lKey].actual += a;
    lineMap[lKey].good += g;
    lineMap[lKey].defect += d;
    lineMap[lKey].scrapKg += s;
    lineMap[lKey].downtimeMinutes += dt;
    lineMap[lKey].reportCount += 1;

    // Vehicle breakdown (aggregate per item if available)
    if (Array.isArray(r.items) && r.items.length > 0) {
      r.items.forEach((it) => {
        const vKey = it.vehicle || "기타";
        const itTarget = Number(it.targetQty) || 0;
        const itActual = Number(it.actualQty) || 0;
        const itGood = Number(it.goodQty) || 0;
        const itDefect = Number(it.defectQty) || 0;
        const itScrap = Number(it.scrapKg) || 0;

        if (!vehicleMap[vKey]) {
          vehicleMap[vKey] = {
            vehicle: vKey,
            itemName: it.itemName || "-",
            target: 0,
            actual: 0,
            good: 0,
            defect: 0,
            scrapKg: 0,
            downtimeMinutes: 0,
            reportCount: 0
          };
        }
        vehicleMap[vKey].target += itTarget;
        vehicleMap[vKey].actual += itActual;
        vehicleMap[vKey].good += itGood;
        vehicleMap[vKey].defect += itDefect;
        vehicleMap[vKey].scrapKg += itScrap;
        vehicleMap[vKey].reportCount += 1;
      });
    } else {
      const vKey = r.vehicle || "기타";
      if (!vehicleMap[vKey]) {
        vehicleMap[vKey] = {
          vehicle: vKey,
          itemName: r.itemName || "-",
          target: 0,
          actual: 0,
          good: 0,
          defect: 0,
          scrapKg: 0,
          downtimeMinutes: 0,
          reportCount: 0
        };
      }
      vehicleMap[vKey].target += t;
      vehicleMap[vKey].actual += a;
      vehicleMap[vKey].good += g;
      vehicleMap[vKey].defect += d;
      vehicleMap[vKey].scrapKg += s;
      vehicleMap[vKey].downtimeMinutes += dt;
      vehicleMap[vKey].reportCount += 1;
    }

    // Downtime category breakdown
    const catKey = r.downtimeCategory || "기타";
    if (dt > 0) {
      if (!downtimeCategoryMap[catKey]) {
        downtimeCategoryMap[catKey] = {
          category: catKey,
          minutes: 0,
          occurrences: 0
        };
      }
      downtimeCategoryMap[catKey].minutes += dt;
      downtimeCategoryMap[catKey].occurrences += 1;
    }
  });

  const attainmentRate = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 100.0;
  const yieldRate = totalActual > 0 ? Number(((totalGood / totalActual) * 100).toFixed(1)) : 100.0;
  const defectRate = totalActual > 0 ? Number(((totalDefect / totalActual) * 100).toFixed(1)) : 0.0;
  const totalDowntimeHours = Number((totalDowntimeMinutes / 60).toFixed(1));

  // Compute rates for each line
  const lineStats = Object.values(lineMap).map((l) => ({
    ...l,
    attainmentRate: l.target > 0 ? Number(((l.actual / l.target) * 100).toFixed(1)) : 100.0,
    yieldRate: l.actual > 0 ? Number(((l.good / l.actual) * 100).toFixed(1)) : 100.0,
    defectRate: l.actual > 0 ? Number(((l.defect / l.actual) * 100).toFixed(1)) : 0.0,
    downtimeHours: Number((l.downtimeMinutes / 60).toFixed(1)),
    scrapKg: Number(l.scrapKg.toFixed(1))
  }));

  // Compute rates for each vehicle
  const vehicleStats = Object.values(vehicleMap).map((v) => ({
    ...v,
    attainmentRate: v.target > 0 ? Number(((v.actual / v.target) * 100).toFixed(1)) : 100.0,
    yieldRate: v.actual > 0 ? Number(((v.good / v.actual) * 100).toFixed(1)) : 100.0,
    defectRate: v.actual > 0 ? Number(((v.defect / v.actual) * 100).toFixed(1)) : 0.0,
    scrapKg: Number(v.scrapKg.toFixed(1))
  })).sort((a, b) => b.actual - a.actual);

  // Downtime categories sorted by minutes
  const downtimeCategoryStats = Object.values(downtimeCategoryMap)
    .map((c) => ({
      ...c,
      hours: Number((c.minutes / 60).toFixed(1)),
      percentage: totalDowntimeMinutes > 0 ? Number(((c.minutes / totalDowntimeMinutes) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalReports: reports.length,
    totalTarget,
    totalActual,
    totalGood,
    totalDefect,
    totalScrapKg: Number(totalScrapKg.toFixed(1)),
    totalDowntimeMinutes,
    totalDowntimeHours,
    attainmentRate,
    yieldRate,
    defectRate,
    lineStats,
    vehicleStats,
    downtimeCategoryStats
  };
};
