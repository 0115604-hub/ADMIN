import { getDayOfWeek } from "./qualityConstants.js";

/**
 * Compute Monthly Aggregation (No Duplicates, Dynamic Reason Breakdown & 4-Material Waste Scrap)
 */
export const getQualityMonthlyAggregation = (allRecords = [], yearMonth = "2026-09") => {
  const targetYM = yearMonth || "2026-09";
  const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));

  let totalInspectQty = 0;
  let totalDefectQty = 0;
  let totalLossAmount = 0;
  let totalScrapA = 0;
  let totalScrapB = 0;
  let totalScrapC = 0;
  let totalScrapD = 0;
  let totalScrapQty = 0;

  const itemMap = {
    ja: { id: "ja", name: "JA G-RUN", carModel: "JA", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "둔각 떨어짐 (20건), 수포 (23건), 스코치 (6건)", dailyRecords: [] },
    nx4a: { id: "nx4a", name: "NX4a G-RUN", carModel: "NX4a", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "스코치 (12건), 직_삽입불량 (4건), 둔_삽입불량 (4건)", dailyRecords: [] },
    nx4: { id: "nx4", name: "NX4 G-RUN", carModel: "NX4", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "사상불량 (4건), 둔_삽입불량 (5건)", dailyRecords: [] },
    hr: { id: "hr", name: "HR G-RUN", carModel: "HR", inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0, worstReason: "직각 떨어짐 (5건), 둔각 떨어짐 (5건), 스코치 (5건)", dailyRecords: [] }
  };

  // August baseline static dataset if full records not imported
  if (targetYM === "2026-08" && monthRecords.length <= 24) {
    itemMap.ja.inspectQty = 57596;
    itemMap.ja.defectQty = 732;
    itemMap.ja.lossAmount = 2281050;
    itemMap.ja.worstReason = "수포 (318건), 둔_어퍼떨어짐 (198건), 직_어퍼떨어짐 (112건)";

    itemMap.nx4a.inspectQty = 50400;
    itemMap.nx4a.defectQty = 302;
    itemMap.nx4a.lossAmount = 1735594;
    itemMap.nx4a.scrapA = 78;
    itemMap.nx4a.scrapB = 54;
    itemMap.nx4a.scrapC = 32;
    itemMap.nx4a.scrapD = 0;
    itemMap.nx4a.scrapTotal = 164;
    itemMap.nx4a.worstReason = "스코치 (148건), 직_찢어짐 (62건), 사상불량 (44건)";

    itemMap.nx4.inspectQty = 25880;
    itemMap.nx4.defectQty = 34;
    itemMap.nx4.lossAmount = 195398;
    itemMap.nx4.scrapA = 36;
    itemMap.nx4.scrapB = 22;
    itemMap.nx4.scrapC = 14;
    itemMap.nx4.scrapD = 0;
    itemMap.nx4.scrapTotal = 72;
    itemMap.nx4.worstReason = "사상불량 (18건), 둔_삽입불량 (9건), 기타 (7건)";

    itemMap.hr.inspectQty = 20858;
    itemMap.hr.defectQty = 270;
    itemMap.hr.lossAmount = 640380;
    itemMap.hr.worstReason = "직_어퍼떨어짐 (218건), 둔_어퍼떨어짐 (46건), 치수불량 (6건)";
  }

  // Accumulate daily records into itemMap
  monthRecords.forEach((r) => {
    const it = itemMap[r.itemId];
    if (it) {
      it.dailyRecords.push(r);
      if (targetYM !== "2026-08" || monthRecords.length > 24) {
        it.inspectQty += r.inspectQty;
        it.defectQty += r.defectQty;
        it.lossAmount += r.lossAmount;
        it.scrapA += (r.scrapA || 0);
        it.scrapB += (r.scrapB || 0);
        it.scrapC += (r.scrapC || 0);
        it.scrapD += (r.scrapD || 0);
        it.scrapTotal += (r.scrapTotal || ((r.scrapA || 0) + (r.scrapB || 0) + (r.scrapC || 0) + (r.scrapD || 0)));
      }
    }
  });

  const items = Object.values(itemMap).map((it) => {
    const rate = it.inspectQty > 0 ? Number(((it.defectQty / it.inspectQty) * 100).toFixed(2)) : 0;
    it.defectRate = rate;

    // Dynamic Monthly Worst Reason Calculation
    if (targetYM !== "2026-08" || monthRecords.length > 24) {
      if (it.defectQty === 0) {
        it.worstReason = "-";
      } else if (it.dailyRecords.length > 0) {
        const reasonTally = new Map();
        it.dailyRecords.forEach((dr) => {
          if (dr.defectQty > 0 && dr.worstReason && dr.worstReason !== "-") {
            // Split multiple reasons like "둔각 떨어짐 (7건), 수포 (5건)" or "수포, 스코치"
            const parts = dr.worstReason.split(/[,/·\n]/).map((p) => p.trim()).filter(Boolean);
            parts.forEach((p) => {
              const match = p.match(/^(.+?)\s*\(([0-9]+)\s*건?\)$/);
              if (match) {
                const name = match[1].trim();
                const cnt = parseInt(match[2], 10) || 1;
                reasonTally.set(name, (reasonTally.get(name) || 0) + cnt);
              } else {
                reasonTally.set(p, (reasonTally.get(p) || 0) + 1);
              }
            });
          }
        });

        if (reasonTally.size > 0) {
          const sortedReasons = Array.from(reasonTally.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, cnt]) => `${name} (${cnt}건)`);
          it.worstReason = sortedReasons.join(", ");
        }
      }
    }

    totalInspectQty += it.inspectQty;
    totalDefectQty += it.defectQty;
    totalLossAmount += it.lossAmount;
    totalScrapA += it.scrapA;
    totalScrapB += it.scrapB;
    totalScrapC += it.scrapC;
    totalScrapD += it.scrapD;
    totalScrapQty += it.scrapTotal;
    return it;
  });

  // Sort by defectRate descending
  items.sort((a, b) => (Number(b.defectRate) || 0) - (Number(a.defectRate) || 0));

  const overallDefectRate = totalInspectQty > 0 ? Number(((totalDefectQty / totalInspectQty) * 100).toFixed(2)) : 0;
  const maxDefectItem = items.reduce((max, cur) => (cur.defectRate > max.defectRate ? cur : max), items[0]);

  // Specific scrap summary for NX4 and NX4a (소재 A, B, C, D 4종 소재)
  const nx4Scrap = itemMap.nx4;
  const nx4aScrap = itemMap.nx4a;
  const core3MaterialsScrap = {
    scrapA: nx4Scrap.scrapA + nx4aScrap.scrapA,
    scrapB: nx4Scrap.scrapB + nx4aScrap.scrapB,
    scrapC: nx4Scrap.scrapC + nx4aScrap.scrapC,
    scrapD: nx4Scrap.scrapD + nx4aScrap.scrapD,
    scrapTotal: nx4Scrap.scrapTotal + nx4aScrap.scrapTotal,
    nx4: { scrapA: nx4Scrap.scrapA, scrapB: nx4Scrap.scrapB, scrapC: nx4Scrap.scrapC, scrapD: nx4Scrap.scrapD, scrapTotal: nx4Scrap.scrapTotal },
    nx4a: { scrapA: nx4aScrap.scrapA, scrapB: nx4aScrap.scrapB, scrapC: nx4aScrap.scrapC, scrapD: nx4aScrap.scrapD, scrapTotal: nx4aScrap.scrapTotal }
  };

  return {
    yearMonth: targetYM,
    totalInspectQty,
    totalDefectQty,
    overallDefectRate,
    totalDefectRate: overallDefectRate, // For backward compatibility
    totalLossAmount,
    totalScrapA,
    totalScrapB,
    totalScrapC,
    totalScrapD,
    totalScrapQty,
    core3MaterialsScrap,
    core4MaterialsScrap: core3MaterialsScrap,
    maxDefectItem,
    items,
    monthRecordsCount: monthRecords.length
  };
};

/**
 * Compute Daily Aggregation (Date by Date rows)
 */
export const getQualityDailyAggregation = (allRecords = [], yearMonth = "2026-09") => {
  const targetYM = yearMonth || "2026-09";
  const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));

  const dateMap = new Map();
  monthRecords.forEach((r) => {
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, {
        date: r.date,
        dayOfWeek: r.dayOfWeek || getDayOfWeek(r.date),
        totalInspectQty: 0,
        totalDefectQty: 0,
        totalLossAmount: 0,
        totalScrapA: 0,
        totalScrapB: 0,
        totalScrapC: 0,
        totalScrapD: 0,
        totalScrapQty: 0,
        items: {},
        records: []
      });
    }
    const dayData = dateMap.get(r.date);
    dayData.records.push(r);
    dayData.items[r.itemId] = r;
    dayData.totalInspectQty += r.inspectQty;
    dayData.totalDefectQty += r.defectQty;
    dayData.totalLossAmount += r.lossAmount;
    dayData.totalScrapA += (r.scrapA || 0);
    dayData.totalScrapB += (r.scrapB || 0);
    dayData.totalScrapC += (r.scrapC || 0);
    dayData.totalScrapD += (r.scrapD || 0);
    dayData.totalScrapQty += (r.scrapTotal || ((r.scrapA || 0) + (r.scrapB || 0) + (r.scrapC || 0) + (r.scrapD || 0)));
  });

  const dailyList = Array.from(dateMap.values()).map((d) => {
    d.defectRate = d.totalInspectQty > 0 ? Number(((d.totalDefectQty / d.totalInspectQty) * 100).toFixed(2)) : 0;
    return d;
  });

  dailyList.sort((a, b) => b.date.localeCompare(a.date));
  return dailyList;
};
