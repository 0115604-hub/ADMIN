import * as XLSX from "xlsx";
import { QUALITY_CORE_ITEMS, sanitizeQualityRecord } from "./qualityConstants.js";

/**
 * Helper to parse dates from Excel cells (Serial numbers, Date objects, or text)
 */
export const parseExcelDate = (val, fallbackYM = "2026-09") => {
  if (val === null || val === undefined || val === "") return null;
  const currentYear = fallbackYM.slice(0, 4) || "2026";

  // 1. JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. Excel Serial date number (e.g. 30000 ~ 70000)
  if (typeof val === "number" && val > 30000 && val < 70000) {
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date_info.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 3. Day of month as number 1..31
  if (typeof val === "number" && val >= 1 && val <= 31) {
    return `${fallbackYM}-${String(val).padStart(2, "0")}`;
  }

  // 4. String parsing
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;

    // Full Date: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, YYYY_MM_DD
    const m1 = s.match(/(\d{4})[-_./](\d{1,2})[-_./](\d{1,2})/);
    if (m1) {
      return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
    }

    // Korean full date: 2026년 9월 1일
    const mKorFull = s.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (mKorFull) {
      return `${mKorFull[1]}-${mKorFull[2].padStart(2, "0")}-${mKorFull[3].padStart(2, "0")}`;
    }

    // Korean month-day: 9월 1일, 09월 01일, 9월1일(화)
    const mKor = s.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (mKor) {
      return `${currentYear}-${mKor[1].padStart(2, "0")}-${mKor[2].padStart(2, "0")}`;
    }

    // Month-Day: 9/1, 09-01, 9.1, 9/1(화), 09.01 (월)
    const m2 = s.match(/(\d{1,2})[-_./](\d{1,2})/);
    if (m2) {
      const p1 = parseInt(m2[1], 10);
      const p2 = parseInt(m2[2], 10);
      if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
        return `${currentYear}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
      }
    }

    // Single day: 1일, 01일, 1
    const m3 = s.match(/^(\d{1,2})일?$/);
    if (m3) {
      const dayNum = parseInt(m3[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        return `${fallbackYM}-${String(dayNum).padStart(2, "0")}`;
      }
    }
  }

  return null;
};

/**
 * Robust Multi-file & Multi-sheet Quality Excel Parser
 */
export const parseQualityExcelFiles = async (files = []) => {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return { records: [], count: 0, yearMonth: "2026-09" };

  const parsedRecords = [];
  let detectedYearMonth = "2026-09";

  const unitPrices = {
    ja: 3116,
    nx4a: 5747,
    nx4: 5747,
    hr: 2372
  };
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  for (const file of fileList) {
    let buffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (e) {
      console.error("Failed to read file arrayBuffer:", file.name, e);
      continue;
    }

    let wb;
    try {
      wb = XLSX.read(buffer, { type: "array", cellDates: true });
    } catch (e) {
      console.error("Failed to parse XLSX workbook:", file.name, e);
      continue;
    }

    const sheetNames = wb.SheetNames || [];

    // Detect year-month from file name
    const nameMatch = file.name.match(/(\d{4})[-_.](\d{1,2})/) || file.name.match(/(\d{1,2})월/);
    if (nameMatch) {
      if (nameMatch[1] && nameMatch[2]) {
        detectedYearMonth = `${nameMatch[1]}-${nameMatch[2].padStart(2, "0")}`;
      } else if (nameMatch[1]) {
        detectedYearMonth = `2026-${nameMatch[1].padStart(2, "0")}`;
      }
    }

    const hasJeongri = sheetNames.some((s) => s.includes("정리"));

    for (const sName of sheetNames) {
      const cleanName = sName.trim().toUpperCase();
      if (hasJeongri && cleanName.includes("취합DATA")) {
        continue;
      }

      const ws = wb.Sheets[sName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!Array.isArray(rows) || rows.length < 2) continue;

      let sheetRecordsCount = 0;

      // =========================================================================
      // PATTERN 1: NX4 Matrix Sheet (Contains both NX4 and NX4a)
      // =========================================================================
      if (cleanName.includes("NX4") && (cleanName.includes("정리") || cleanName.includes("종합") || cleanName.includes("취합") || cleanName.includes("통합") || cleanName.includes("실적") || cleanName === "NX4")) {
        let dateCols = [];
        for (let r = 0; r < Math.min(40, rows.length); r++) {
          const row = rows[r] || [];
          const cols = [];
          for (let c = 1; c < row.length; c++) {
            const dStr = parseExcelDate(row[c], detectedYearMonth);
            if (dStr) cols.push({ col: c, dateStr: dStr });
          }
          if (cols.length >= 3) {
            dateCols = cols;
            break;
          }
        }

        if (dateCols.length > 0) {
          let nx4InspRows = [];
          let nx4DefRows = [];
          let nx4aInspRows = [];
          let nx4aDefRows = [];

          for (let r = 0; r < Math.min(50, rows.length); r++) {
            const row = rows[r] || [];
            const label = (String(row[0] || "") + " " + String(row[1] || "") + " " + String(row[2] || "") + " " + String(row[3] || "")).trim().toUpperCase();
            if (label.includes("NX4 FRT") || label.includes("NX4-FRT") || label.includes("NX4FRT") || (label.includes("NX4") && !label.includes("NX4A") && !label.includes("NX4-A") && !label.includes("NX4 A") && r < 42)) {
              if (r < 40 && (label.includes("검사") || label.includes("생산") || label.includes("투입") || r <= 36)) {
                nx4InspRows.push(r);
              } else if (label.includes("불량") || label.includes("부적합") || label.includes("폐기") || (r >= 38 && r <= 42)) {
                nx4DefRows.push(r);
              }
            } else if (label.includes("NX4A") || label.includes("NX4-A") || label.includes("NX4 A")) {
              if (r < 40 && (label.includes("검사") || label.includes("생산") || label.includes("투입") || r <= 38)) {
                nx4aInspRows.push(r);
              } else if (label.includes("불량") || label.includes("부적합") || label.includes("폐기") || (r >= 40 && r <= 44)) {
                nx4aDefRows.push(r);
              }
            }
          }

          if (nx4InspRows.length === 0) { nx4InspRows = [35, 36].filter(r => rows[r]); }
          if (nx4DefRows.length === 0) { nx4DefRows = [40, 41].filter(r => rows[r]); }
          if (nx4aInspRows.length === 0) { nx4aInspRows = [37, 38].filter(r => rows[r]); }
          if (nx4aDefRows.length === 0) { nx4aDefRows = [42, 43].filter(r => rows[r]); }

          dateCols.forEach((d) => {
            const nx4Insp = Math.round(nx4InspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4Def = Math.round(nx4DefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aInsp = Math.round(nx4aInspRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const nx4aDef = Math.round(nx4aDefRows.reduce((s, r) => s + (Number(rows[r]?.[d.col]) || 0), 0));
            const dt = new Date(d.dateStr);
            const dayOfWeek = dayNames[dt.getDay()] || "월";

            if (nx4Insp > 0 || nx4Def > 0) {
              parsedRecords.push({
                id: `qual_${d.dateStr}_nx4`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: "nx4",
                itemName: "NX4 G-RUN",
                carModel: "NX4",
                inspectQty: nx4Insp,
                defectQty: nx4Def,
                defectRate: nx4Insp > 0 ? Number(((nx4Def / nx4Insp) * 100).toFixed(2)) : 0,
                worstReason: "사상불량, 둔_삽입불량",
                lossAmount: Math.round(nx4Def * unitPrices.nx4),
                uploader: "이창엽 책임"
              });
              sheetRecordsCount++;
            }

            if (nx4aInsp > 0 || nx4aDef > 0) {
              parsedRecords.push({
                id: `qual_${d.dateStr}_nx4a`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: "nx4a",
                itemName: "NX4a G-RUN",
                carModel: "NX4a",
                inspectQty: nx4aInsp,
                defectQty: nx4aDef,
                defectRate: nx4aInsp > 0 ? Number(((nx4aDef / nx4aInsp) * 100).toFixed(2)) : 0,
                worstReason: "스코치, 직_삽입불량, 사상불량",
                lossAmount: Math.round(nx4aDef * unitPrices.nx4a),
                uploader: "이창엽 책임"
              });
              sheetRecordsCount++;
            }
          });

          if (sheetRecordsCount > 0) continue;
        }
      }

      // =========================================================================
      // PATTERN 2: Matrix Individual Model Sheet (JA, HR, NX4, NX4a)
      // =========================================================================
      let matrixItemId = null;
      let matrixItemName = "";
      let matrixCarModel = "";
      let matrixDefaultReason = "";

      if (cleanName.includes("JA")) {
        matrixItemId = "ja"; matrixItemName = "JA G-RUN"; matrixCarModel = "JA"; matrixDefaultReason = "둔각 떨어짐, 수포, 스코치";
      } else if (cleanName.includes("HR")) {
        matrixItemId = "hr"; matrixItemName = "HR G-RUN"; matrixCarModel = "HR"; matrixDefaultReason = "직각 떨어짐, 둔각 떨어짐, 스코치";
      } else if (cleanName.includes("NX4A") || cleanName.includes("NX4-A") || cleanName.includes("NX4 A")) {
        matrixItemId = "nx4a"; matrixItemName = "NX4a G-RUN"; matrixCarModel = "NX4a"; matrixDefaultReason = "스코치, 직_삽입불량, 사상불량";
      } else if (cleanName.includes("NX4")) {
        matrixItemId = "nx4"; matrixItemName = "NX4 G-RUN"; matrixCarModel = "NX4"; matrixDefaultReason = "사상불량, 둔_삽입불량";
      }

      if (matrixItemId) {
        let dateCols = [];
        for (let r = 0; r < Math.min(40, rows.length); r++) {
          const row = rows[r] || [];
          const cols = [];
          for (let c = 1; c < row.length; c++) {
            const dStr = parseExcelDate(row[c], detectedYearMonth);
            if (dStr) cols.push({ col: c, dateStr: dStr });
          }
          if (cols.length >= 3) {
            dateCols = cols;
            break;
          }
        }

        if (dateCols.length > 0) {
          let rowInsp = -1;
          let rowDef = -1;
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r] || [];
            const label = (String(row[0] || "") + " " + String(row[1] || "") + " " + String(row[2] || "") + " " + String(row[3] || "")).replace(/\s+/g, "").toUpperCase();
            if (label.includes("총검사") || label.includes("검사수량") || label.includes("검사합계") || label.includes("검사실적") || (r === 39 && label.includes("합계"))) {
              if (rowInsp === -1) rowInsp = r;
            }
            if (label.includes("총불량") || label.includes("불량수량") || label.includes("불량합계") || label.includes("불량실적") || (r === 44 && label.includes("합계"))) {
              if (rowDef === -1) rowDef = r;
            }
          }

          if (rowInsp === -1 && rows[39]) rowInsp = 39;
          if (rowDef === -1 && rows[44]) rowDef = 44;

          if (rowInsp !== -1 && rowDef !== -1) {
            dateCols.forEach((d) => {
              const insp = Math.round(Number(rows[rowInsp]?.[d.col]) || 0);
              const def = Math.round(Number(rows[rowDef]?.[d.col]) || 0);
              if (insp === 0 && def === 0) return;

              const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
              const loss = Math.round(def * unitPrices[matrixItemId]);
              const dt = new Date(d.dateStr);
              const dayOfWeek = dayNames[dt.getDay()] || "월";

              let reasons = [];
              if (def > 0) {
                for (let r = Math.max(rowDef + 1, 10); r < rows.length; r++) {
                  const row = rows[r];
                  if (!row) continue;
                  const dType = String(row[3] || row[2] || row[1] || "").trim();
                  const cnt = Math.round(Number(row[d.col]) || 0);
                  if (cnt > 0 && typeof dType === "string" && isNaN(Number(dType)) && !dType.includes("합계") && !dType.includes("불량") && !dType.includes("구분") && !dType.includes("TOTAL") && !dType.includes("불량율") && !dType.includes("%")) {
                    reasons.push(`${dType} (${cnt}건)`);
                  }
                }
              }
              const worstReason = def === 0 ? "-" : (reasons.length > 0 ? reasons.slice(0, 3).join(", ") : matrixDefaultReason);

              parsedRecords.push({
                id: `qual_${d.dateStr}_${matrixItemId}`,
                date: d.dateStr,
                yearMonth: d.dateStr.slice(0, 7),
                dayOfWeek,
                itemId: matrixItemId,
                itemName: matrixItemName,
                carModel: matrixCarModel,
                inspectQty: insp,
                defectQty: def,
                defectRate: rate,
                worstReason,
                lossAmount: loss,
                uploader: "이창엽 책임"
              });
              sheetRecordsCount++;
            });

            if (sheetRecordsCount > 0) continue;
          }
        }
      }

      // =========================================================================
      // PATTERN 3: Tabular / List Sheet (Row-by-row records e.g. 일일품질검사실적, G-RUN 불량율 집계)
      // =========================================================================
      let colDate = -1;
      let colItem = -1;
      let colInsp = -1;
      let colDef = -1;
      let colReason = -1;
      let colScrapA = -1;
      let colScrapB = -1;
      let colScrapC = -1;
      let colScrapD = -1;
      let colScrapTotal = -1;
      let headerRowIndex = -1;

      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const h = String(row[c] || "").replace(/\s+/g, "").toUpperCase();
          if (h.includes("일자") || h.includes("날짜") || h.includes("DATE") || h.includes("검사일자") || h.includes("생산일자")) colDate = c;
          if (h.includes("차종") || h.includes("품명") || h.includes("품목") || h.includes("아이템") || h.includes("ITEM") || h.includes("모델")) colItem = c;
          if (h.includes("검사수량") || h.includes("검사수") || h.includes("생산수량") || h.includes("검사실적") || h.includes("투입수량") || h.includes("INSPECT")) colInsp = c;
          if (h.includes("불량수량") || h.includes("불량수") || h.includes("부적합수량") || h.includes("DEFECT")) colDef = c;
          if (h.includes("불량사유") || h.includes("불량유형") || h.includes("불량원인") || h.includes("현상") || h.includes("사유") || h.includes("WORST") || h.includes("특이사항")) colReason = c;
          if (h.includes("소재A") || h.includes("소재1") || h.includes("폐기A")) colScrapA = c;
          if (h.includes("소재B") || h.includes("소재2") || h.includes("폐기B")) colScrapB = c;
          if (h.includes("소재C") || h.includes("소재3") || h.includes("폐기C")) colScrapC = c;
          if (h.includes("소재D") || h.includes("소재4") || h.includes("폐기D")) colScrapD = c;
          if (h.includes("폐기수량") || h.includes("총폐기") || h.includes("폐기합계") || h.includes("SCRAP")) colScrapTotal = c;
        }
        if (colInsp >= 0 || colDef >= 0 || (colDate >= 0 && colItem >= 0)) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex >= 0) {
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          // Check if row is empty or summary footer
          const firstCells = (String(row[0] || "") + String(row[1] || "") + String(row[2] || "")).trim();
          if (firstCells.includes("합계") || firstCells.includes("TOTAL") || firstCells.includes("누계")) continue;

          // Parse Date
          let dateStr = null;
          if (colDate >= 0 && row[colDate]) {
            dateStr = parseExcelDate(row[colDate], detectedYearMonth);
          }
          if (!dateStr) {
            // Fallback from other columns
            for (let c = 0; c < Math.min(4, row.length); c++) {
              dateStr = parseExcelDate(row[c], detectedYearMonth);
              if (dateStr) break;
            }
          }
          if (!dateStr) continue;

          // Parse Item
          let rawItem = colItem >= 0 ? String(row[colItem] || "").toUpperCase() : cleanName;
          let targetItemId = "ja";
          if (rawItem.includes("NX4A") || rawItem.includes("NX4-A") || rawItem.includes("NX4 A")) targetItemId = "nx4a";
          else if (rawItem.includes("NX4")) targetItemId = "nx4";
          else if (rawItem.includes("HR")) targetItemId = "hr";
          else if (rawItem.includes("JA")) targetItemId = "ja";
          else {
            if (cleanName.includes("NX4A")) targetItemId = "nx4a";
            else if (cleanName.includes("NX4")) targetItemId = "nx4";
            else if (cleanName.includes("HR")) targetItemId = "hr";
            else if (cleanName.includes("JA")) targetItemId = "ja";
          }

          const coreDef = QUALITY_CORE_ITEMS.find((c) => c.id === targetItemId) || QUALITY_CORE_ITEMS[0];
          const insp = colInsp >= 0 ? Math.max(0, Math.round(Number(String(row[colInsp] || "").replace(/[^0-9.]/g, "")) || 0)) : 0;
          const def = colDef >= 0 ? Math.max(0, Math.round(Number(String(row[colDef] || "").replace(/[^0-9.]/g, "")) || 0)) : 0;
          if (insp === 0 && def === 0) continue;

          const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
          const loss = Math.round(def * (unitPrices[targetItemId] || coreDef.defaultUnitPrice));
          const dt = new Date(dateStr);
          const dayOfWeek = dayNames[dt.getDay()] || "월";

          const worstReason = colReason >= 0 && row[colReason] && String(row[colReason]).trim() !== "-" 
            ? String(row[colReason]).trim() 
            : (def === 0 ? "-" : coreDef.defaultDefectReason);

          const scrapA = colScrapA >= 0 ? Math.max(0, Math.round(Number(row[colScrapA]) || 0)) : 0;
          const scrapB = colScrapB >= 0 ? Math.max(0, Math.round(Number(row[colScrapB]) || 0)) : 0;
          const scrapC = colScrapC >= 0 ? Math.max(0, Math.round(Number(row[colScrapC]) || 0)) : 0;
          const scrapD = colScrapD >= 0 ? Math.max(0, Math.round(Number(row[colScrapD]) || 0)) : 0;
          const scrapTotal = colScrapTotal >= 0 
            ? Math.max(0, Math.round(Number(row[colScrapTotal]) || 0)) 
            : (scrapA + scrapB + scrapC + scrapD);

          parsedRecords.push({
            id: `qual_${dateStr}_${targetItemId}`,
            date: dateStr,
            yearMonth: dateStr.slice(0, 7),
            dayOfWeek,
            itemId: targetItemId,
            itemName: coreDef.name,
            carModel: coreDef.carModel,
            inspectQty: insp,
            defectQty: def,
            defectRate: rate,
            worstReason,
            lossAmount: loss,
            scrapA,
            scrapB,
            scrapC,
            scrapD,
            scrapTotal,
            uploader: "이창엽 책임"
          });
        }
      }
    }
  }

  // Deduplicate against internal list
  const map = new Map();
  parsedRecords.forEach((r) => {
    const s = sanitizeQualityRecord(r);
    if (s && s.id) {
      map.set(s.id, s);
    }
  });

  const uniqueParsed = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return {
    records: uniqueParsed,
    count: uniqueParsed.length,
    yearMonth: detectedYearMonth
  };
};
