import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

/**
 * Clean and extract numeric integer amount from a cell
 */
export function cleanNumericAmount(val) {
  if (val === null || val === undefined) return 0;
  let num = 0;
  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return 0;
    num = Math.round(val);
  } else {
    const str = String(val).replace(/[^0-9.-]/g, "").trim();
    if (str === "" || str === "-" || str === ".") return 0;
    num = Number(str);
    if (isNaN(num) || !isFinite(num)) return 0;
    num = Math.round(num);
  }
  // 🌟 Sanity Guard: Exclude business numbers, insurance numbers, account numbers (e.g. >= 11 digits or > 500,000,000)
  if (num > 500000000 || String(Math.abs(num)).length >= 11) return 0;
  return num;
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
    clean === "수량" ||
    /^(사업장|사용자|사업자|관리번호|납부자|납부번호|주민등록|계좌번호|통장|전화|팩스|TEL|FAX|고지번호|전자납부|발행일자|납부기한|사업장관리번호|납부자번호)/i.test(clean)
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

  // 3. Image Files (PNG, JPG, JPEG, WEBP, BMP, TIF, TIFF) - OCR Analysis
  if (["png", "jpg", "jpeg", "webp", "bmp", "tif", "tiff"].includes(ext)) {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["kor", "eng"]);
      const ret = await worker.recognize(file);
      await worker.terminate();

      const ocrText = ret?.data?.text || "";
      if (ocrText && ocrText.trim()) {
        const res = parseOCRTextToExpenseItems(ocrText, fileName);
        if (res && res.items.length > 0) {
          return res;
        }
      }
    } catch (err) {
      console.warn(`Image OCR parsing error on ${fileName}:`, err);
    }
  }

  return null;
}

/**
 * Helper to clean OCR numeric amounts (handles commas, periods used as thousands separators, etc.)
 */
function cleanOCRAmount(str) {
  if (!str) return 0;
  let clean = String(str).trim();
  // Handle dot as thousands separator: e.g. 6928.900 -> 6928900, 150.000 -> 150000
  clean = clean.replace(/(\d+)\.(\d{3})\b/g, "$1$2");
  clean = clean.replace(/[^0-9]/g, "");
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Robust parser that converts raw OCR text from an image into structured expense items
 */
export function parseOCRTextToExpenseItems(text, fileName = "image.png") {
  if (!text || typeof text !== "string") return null;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];

    // Filter out obvious metadata lines
    if (
      /(사업자번호|등록번호|전화|TEL|FAX|작성일자|발행일자|통장입금)/i.test(rawLine) &&
      !/(인건비|보험|식대|차량|급여|소계|합계|비품|부업장)/.test(rawLine)
    ) {
      continue;
    }

    // Check if summary line
    const isSummary = /^(합계|소계|총계|총액|지출총계|공제총액|총합계|TOTAL|Total)/i.test(rawLine);
    if (isSummary) continue;

    // Filter out pure table header lines
    if (
      /^(No|NO|순번|번호|구분|항목|품목|품명|금액|단가|수량|비고)/i.test(rawLine) &&
      !rawLine.match(/\b\d{4,}\b/)
    ) {
      continue;
    }

    // Mask business numbers (xxx-xx-xxxxx), phone numbers (xxx-xxx-xxxx), dates (xxxx-xx-xx)
    let sanitizedLine = rawLine
      .replace(/\b\d{3}-\d{2}-\d{5}\b/g, "")
      .replace(/\b\d{2,4}-\d{3,4}-\d{4}\b/g, "")
      .replace(/\b20\d{2}[-./]\d{1,2}[-./]\d{1,2}\b/g, "");

    // Match numeric candidates (comma or dot separated numbers or 4+ digits)
    const numMatches = sanitizedLine.match(/\b\d+(?:[,\.]\d{3})+\b|\b\d{4,12}\b/g);

    // Find valid expense amount (exclude years 2024~2027, 2607~2609)
    let amount = 0;
    if (numMatches && numMatches.length > 0) {
      const validAmounts = numMatches
        .map(cleanOCRAmount)
        .filter(
          (amt) =>
            amt >= 1000 &&
            amt !== 2024 &&
            amt !== 2025 &&
            amt !== 2026 &&
            amt !== 2027 &&
            amt !== 2607 &&
            amt !== 2608 &&
            amt !== 2609
        );
      if (validAmounts.length > 0) {
        amount = Math.max(...validAmounts);
      }
    }

    // Remove numeric strings from line to extract category and note
    let textPart = sanitizedLine;
    if (numMatches) {
      for (const nStr of numMatches) {
        textPart = textPart.replace(nStr, " ");
      }
    }
    // Clean symbols, currency marks, parentheses
    textPart = textPart.replace(/[¥\\₩wW|\[\]\(\)\{\}\-~?]/g, " ").replace(/\s+/g, " ").trim();

    // Check if line starts with an item number like "1.", "2.", "10"
    const leadMatch = textPart.match(/^(\d{1,2})\s*[\.,\s]?\s*(.+)/);
    let category = "";
    let note = "";

    if (leadMatch) {
      const rest = leadMatch[2].trim();
      const tokens = rest.split(" ").filter(Boolean);
      category = tokens[0] || "";
      note = tokens.slice(1).join(" ");
    } else {
      const tokens = textPart.split(" ").filter(Boolean);
      category = tokens[0] || "";
      note = tokens.slice(1).join(" ");
    }

    if (category.length >= 2 && !/^(합계|소계|총액|총계|총합계|순번|번호|항목)/.test(category)) {
      // Standardize known Hanul categories for clean presentation
      if (category.includes("노루법인") || category.includes("노무")) category = "노무법인";
      else if (category.includes("자동차")) category = "자동차(한울)";
      else if (category.includes("통근")) category = "통근차량";
      else if (category.includes("기장")) category = "기장수수료";
      else if (category.includes("인터넷")) category = "인터넷통신비";
      else if (category.includes("성실신고")) category = "성실신고용역비";
      else if (category.includes("개인결산")) category = "개인결산조정료";
      else if (category.includes("비품")) category = "비품";
      else if (category.includes("식대")) category = "식대(큰상웰빙푸드)";
      else if (category.includes("인건비")) category = "인건비";
      else if (category.includes("4대보험")) category = "4대보험(사업주분)";
      else if (category.includes("외국인보험") || category.includes("삼성화재")) category = "삼성화재외국인보험";
      else if (category.includes("비닐")) category = "비닐";
      else if (category.includes("작업환경")) category = "작업환경측정비";
      else if (category.includes("부업장")) category = "부업장";
      else if (category.includes("퇴직금")) category = "퇴직금";

      items.push({
        id: `ocr_item_${idx}_${Date.now()}`,
        rawCategory: category,
        category: category,
        amount: amount,
        note: note
      });
    }
  }

  const totalExpense = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  return {
    success: items.length > 0,
    fileName,
    sheetName: "사진(OCR) 자동분석",
    fileType: "image",
    totalExpense,
    items,
    itemCount: items.length
  };
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

