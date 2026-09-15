import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

/**
 * Clean and extract numeric integer amount from a cell
 */
export function cleanNumericAmount(val) {
  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.round(val);
  }
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, "").trim();
  if (str === "" || str === "-" || str === ".") return 0;
  const num = Number(str);
  return isNaN(num) || !isFinite(num) ? 0 : Math.round(num);
}

/**
 * Check if a cell string looks like a summary total or header row
 * (Used to avoid double-counting the total row or taking column headers as items)
 */
export function isSummaryOrHeaderRow(text) {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim();
  return (
    clean === "소계" ||
    clean === "합계" ||
    clean === "총계" ||
    clean === "총액" ||
    clean === "공통비 지출 총계" ||
    clean === "지출 총계" ||
    clean === "공제 총액" ||
    clean === "차인지급액" ||
    clean === "정산 차인지급액" ||
    clean === "매출합계" ||
    clean === "공급가액" ||
    clean === "TAX" ||
    clean === "TOTAL" ||
    clean.includes("지출 공제내역") ||
    clean.includes("지출공제내역") ||
    clean.startsWith("[") ||
    clean === "No" ||
    clean === "NO." ||
    clean === "순번" ||
    clean === "번호" ||
    clean === "순서" ||
    clean === "구분" ||
    clean === "품목" ||
    clean === "품명" ||
    clean === "품명 및 규격" ||
    clean === "지출/공제 항목" ||
    clean === "지출항목" ||
    clean === "항목" ||
    clean === "금액" ||
    clean === "비고" ||
    clean === "단가" ||
    clean === "수량"
  );
}

/**
 * Parses a 2D row array (single sheet or document table) for expense line items.
 * Extracts line items and calculates the total sum (합산금액).
 */
export function parseSheetRowsForExpenses(rows, sheetName = "", fileName = "") {
  if (!rows || rows.length === 0) {
    return { items: [], totalExpense: 0, sheetName, fileName, itemCount: 0 };
  }

  const cleanRows = rows.filter(
    (r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
  );

  if (cleanRows.length === 0) {
    return { items: [], totalExpense: 0, sheetName, fileName, itemCount: 0 };
  }

  const extractedItems = [];

  for (let rIdx = 0; rIdx < cleanRows.length; rIdx++) {
    const row = cleanRows[rIdx];
    const firstStr = String(row[0] || "").trim();
    const secondStr = String(row[1] || "").trim();

    // Skip header or summary rows
    if (isSummaryOrHeaderRow(firstStr) || isSummaryOrHeaderRow(secondStr)) {
      continue;
    }

    // Pattern 1: [No, CategoryName, Amount, Note] (e.g. [1, "1. 인건비", 91071530, "메모"])
    if (row.length >= 3) {
      const firstNum = cleanNumericAmount(row[0]);
      const secText = String(row[1] || "").trim();
      const thirdNum = cleanNumericAmount(row[2]);

      if (
        firstNum >= 1 &&
        firstNum <= 100 &&
        secText.length > 0 &&
        !isSummaryOrHeaderRow(secText) &&
        thirdNum > 0
      ) {
        // Exclude year constants
        if (thirdNum !== 2026 && thirdNum !== 2607 && thirdNum !== 2608 && thirdNum !== 2609) {
          const rawNote = row[3] !== undefined ? String(row[3]).trim() : "";
          const cleanName = secText.replace(/^\d+[\.\)\s]+/, "").trim();
          extractedItems.push({
            id: `item_${rIdx}_${Date.now()}`,
            rawCategory: secText,
            category: cleanName || secText,
            amount: thirdNum,
            note: rawNote
          });
          continue;
        }
      }
    }

    // Pattern 2: [CategoryName, Amount, Note] (e.g. ["식대(큰상웰빙푸드)", 2981200, "전자세금계산서"])
    if (row.length >= 2) {
      const catText = String(row[0] || "").trim();
      const amtNum = cleanNumericAmount(row[1]);

      if (
        catText.length > 0 &&
        !isSummaryOrHeaderRow(catText) &&
        isNaN(Number(catText)) &&
        amtNum > 0
      ) {
        if (amtNum !== 2026 && amtNum !== 2607 && amtNum !== 2608 && amtNum !== 2609) {
          const rawNote = row[2] !== undefined ? String(row[2]).trim() : "";
          const cleanName = catText.replace(/^\d+[\.\)\s]+/, "").trim();
          extractedItems.push({
            id: `item_${rIdx}_${Date.now()}`,
            rawCategory: catText,
            category: cleanName || catText,
            amount: amtNum,
            note: rawNote
          });
          continue;
        }
      }
    }

    // Pattern 3: Shifted columns - scan cells for (Text, Amount) pair
    let foundCat = "";
    let foundAmt = 0;
    let foundNote = "";

    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      const strVal = String(val || "").trim();
      if (!strVal) continue;

      if (isNaN(Number(strVal.replace(/,/g, ""))) && !isSummaryOrHeaderRow(strVal) && strVal.length >= 2) {
        if (!foundCat) {
          foundCat = strVal;
        } else if (!foundNote && isNaN(cleanNumericAmount(strVal))) {
          foundNote = strVal;
        }
      } else {
        const numVal = cleanNumericAmount(val);
        if (numVal > 0 && numVal !== 2026 && numVal !== 2607 && numVal !== 2608 && numVal !== 2609 && !foundAmt) {
          foundAmt = numVal;
        }
      }
    }

    if (foundCat && foundAmt > 0) {
      const cleanName = foundCat.replace(/^\d+[\.\)\s]+/, "").trim();
      extractedItems.push({
        id: `item_${rIdx}_${Date.now()}`,
        rawCategory: foundCat,
        category: cleanName || foundCat,
        amount: foundAmt,
        note: foundNote
      });
    }
  }

  // Calculate sum of all extracted expense items in this sheet
  const totalExpense = extractedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  return {
    items: extractedItems,
    totalExpense,
    sheetName,
    fileName,
    itemCount: extractedItems.length
  };
}

/**
 * Parses a single File (Excel, CSV, or PDF) and finds the sheet/table with the highest total expense sum.
 */
export async function parseHanulExpensesFromFile(file) {
  if (!file) return null;
  const fileName = file.name || "";
  const ext = fileName.split(".").pop().toLowerCase();

  // 1. Excel / CSV Files
  if (["xlsx", "xls", "csv"].includes(ext)) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetNames = workbook.SheetNames || [];

      let bestSheetResult = null;
      let maxTotalExpense = -1;

      for (const sName of sheetNames) {
        const ws = workbook.Sheets[sName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const res = parseSheetRowsForExpenses(rows, sName, fileName);

        if (res.totalExpense > maxTotalExpense && res.items.length > 0) {
          maxTotalExpense = res.totalExpense;
          bestSheetResult = res;
        }
      }

      if (bestSheetResult && bestSheetResult.items.length > 0) {
        return {
          success: true,
          fileName,
          sheetName: bestSheetResult.sheetName,
          fileType: "excel",
          totalExpense: bestSheetResult.totalExpense,
          items: bestSheetResult.items,
          itemCount: bestSheetResult.items.length
        };
      }
    } catch (err) {
      console.warn(`Excel parsing error on ${fileName}:`, err);
    }
  }

  // 2. PDF Files
  if (ext === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = Math.min(pdfDoc.numPages, 5);
      const extractedLines = [];

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const textItems = textContent.items || [];

        const linesMap = new Map();
        for (const it of textItems) {
          const y = Math.round(it.transform[5]);
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y).push({ x: it.transform[4], str: it.str });
        }

        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        for (const y of sortedY) {
          const rowItems = linesMap.get(y).sort((a, b) => a.x - b.x);
          const rowCells = rowItems.map((c) => c.str.trim()).filter(Boolean);
          if (rowCells.length > 0) {
            extractedLines.push(rowCells);
          }
        }
      }

      const res = parseSheetRowsForExpenses(extractedLines, "PDF", fileName);
      if (res && res.items.length > 0) {
        return {
          success: true,
          fileName,
          sheetName: "PDF 본문",
          fileType: "pdf",
          totalExpense: res.totalExpense,
          items: res.items,
          itemCount: res.items.length
        };
      }
    } catch (err) {
      console.warn(`PDF parsing error on ${fileName}:`, err);
    }
  }

  return null;
}

/**
 * 🌟 User Requirement: "무작위로 올리는 파일중 합산금액이 가장 큰 금액이 있는 파일이 맞습니다."
 * Analyzes all uploaded files and picks the one with the LARGEST total sum (합산금액이 가장 큰 파일).
 */
export async function parseHanulExpensesFromMultipleFiles(files = []) {
  if (!files || files.length === 0) return null;

  const results = [];

  for (const file of files) {
    const res = await parseHanulExpensesFromFile(file);
    if (res && res.success && res.items.length > 0 && res.totalExpense > 0) {
      results.push(res);
    }
  }

  if (results.length === 0) return null;

  // 🌟 Sort strictly by totalExpense descending: The file with the LARGEST combined sum is the Winner!
  results.sort((a, b) => {
    if (b.totalExpense !== a.totalExpense) {
      return b.totalExpense - a.totalExpense;
    }
    return (b.itemCount || 0) - (a.itemCount || 0);
  });

  return results[0];
}

/**
 * Populates the left-hand expense list using ONLY the extracted items from the winning largest-sum file.
 * Automatically formats items with clean sequential numbering (1. ..., 2. ...).
 */
export function mergeExtractedExpensesWithState(parsedResult, currentExpenses = []) {
  if (!parsedResult || !parsedResult.items || parsedResult.items.length === 0) {
    return { expenses: currentExpenses, totalExpense: 0, appliedCount: 0 };
  }

  const parsedItems = parsedResult.items;

  // Format with clean sequential numbering
  const finalExpenses = parsedItems
    .filter((it) => it && (it.category || it.rawCategory) && Number(it.amount) > 0)
    .map((item, idx) => {
      const raw = (item.rawCategory || item.category || `항목 ${idx + 1}`).trim();
      const cleanName = raw.replace(/^\d+\s*[\.\)]\s*/, "").trim();
      return {
        id: `exp_parsed_${idx + 1}_${Date.now()}`,
        category: `${idx + 1}. ${cleanName || "공통비/공제 항목"}`,
        amount: Number(item.amount) || 0,
        note: item.note || ""
      };
    });

  const resultList = finalExpenses.length > 0 ? finalExpenses : parsedItems.map((item, idx) => {
    const raw = (item.rawCategory || item.category || `항목 ${idx + 1}`).trim();
    const cleanName = raw.replace(/^\d+\s*[\.\)]\s*/, "").trim();
    return {
      id: `exp_parsed_${idx + 1}_${Date.now()}`,
      category: `${idx + 1}. ${cleanName || "공통비/공제 항목"}`,
      amount: Number(item.amount) || 0,
      note: item.note || ""
    };
  });

  const totalExpense = resultList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return {
    expenses: resultList,
    totalExpense,
    appliedCount: resultList.length,
    sourceFileName: parsedResult.fileName,
    sourceSheetName: parsedResult.sheetName
  };
}

