import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Keywords dictionary for matching 16 standard categories with specificity ranking
const CATEGORY_MATCH_RULES = [
  {
    id: "exp_1",
    code: 1,
    standardName: "1. 인건비",
    keywords: ["인건비", "급여", "노무비", "월급", "임금", "세전", "교통비", "기본급", "상여"],
    defaultNote: "세전 월급(등록,미등록),교통비,식비지원포함(근태파일참조)"
  },
  {
    id: "exp_2",
    code: 2,
    standardName: "2. 4대보험(사업주분)",
    keywords: ["4대보험", "국민연금", "건강보험", "고용보험", "산재보험", "사회보험", "사업주분"],
    defaultNote: "파일 참조"
  },
  {
    id: "exp_3",
    code: 3,
    standardName: "3. 삼성화재외국인보험",
    keywords: ["삼성화재", "외국인보험", "삼성화재외국인보험", "외국인전용보험", "외국인전용", "출국만기", "상해보험"],
    defaultNote: "e-9 (12명) 근태파일 참조"
  },
  {
    id: "exp_4",
    code: 4,
    standardName: "4. 비품",
    keywords: ["비품", "소모품", "사무용품", "잡자재", "비품대"],
    defaultNote: "파일참조"
  },
  {
    id: "exp_5",
    code: 5,
    standardName: "5. 식대(큰상웰빙푸드)",
    keywords: ["식대(큰상웰빙푸드)", "큰상웰빙푸드", "식대", "식비", "큰상", "웰빙푸드", "급식", "중식", "석식", "기사식대"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_6",
    code: 6,
    standardName: "6. 자동차(한울)",
    keywords: ["자동차(한울)", "자동차", "차량(한울)", "차량유지비", "유류비", "주유비", "차량수리"],
    excludeKeywords: ["통근", "셔틀", "버스"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_7",
    code: 7,
    standardName: "7. 통근차량",
    keywords: ["통근차량", "통근버스", "통근", "셔틀버스", "셔틀", "통근비"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_8",
    code: 8,
    standardName: "8. 기장수수료",
    keywords: ["기장수수료", "세무기장", "기장료", "기장", "세무사수수료", "세무대리"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_9",
    code: 9,
    standardName: "9. 인터넷통신비",
    keywords: ["인터넷통신비", "통신비", "인터넷", "통신료", "전화요금", "KT", "SKT", "LGU+"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_10",
    code: 10,
    standardName: "10. 노무법인",
    keywords: ["노무법인", "노무자문", "노무사", "노무컨설팅", "노무비용"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_11",
    code: 11,
    standardName: "11. 퇴직금",
    keywords: ["퇴직금", "퇴직급여", "퇴직연금", "퇴직추계"],
    defaultNote: ""
  },
  {
    id: "exp_12",
    code: 12,
    standardName: "12. 비닐",
    keywords: ["비닐", "포장비닐", "비닐봉투", "포장재", "스트레치필름", "랩"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_13",
    code: 13,
    standardName: "13. 작업환경측정비",
    keywords: ["작업환경측정비", "작업환경측정", "작업환경", "환경측정", "측정비"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_14",
    code: 14,
    standardName: "14. 부업장",
    keywords: ["부업장", "부업", "외주가공", "임가공비", "외주비", "조립부업"],
    defaultNote: "전자세금계산서(有)"
  },
  {
    id: "exp_15",
    code: 15,
    standardName: "15. 성실신고용역비",
    keywords: ["성실신고용역비", "성실신고", "성실신고용역", "성실신고확인", "성실신고비용"],
    defaultNote: ""
  },
  {
    id: "exp_16",
    code: 16,
    standardName: "16. 개인결산조정료",
    keywords: ["개인결산조정료", "개인결산", "결산조정", "조정료", "결산수수료", "세무조정료"],
    defaultNote: ""
  }
];

// Clean and extract numeric amount from cell
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

// Check if a string looks like a total/header row to skip
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
    clean.includes("지출 공제내역") ||
    clean.includes("지출공제내역") ||
    clean.startsWith("[") ||
    clean === "No" ||
    clean === "순번" ||
    clean === "번호" ||
    clean === "지출/공제 항목" ||
    clean === "지출항목" ||
    clean === "항목"
  );
}

// Match category name against standard rules with high precision
export function matchStandardCategory(rawCategoryText) {
  if (!rawCategoryText || typeof rawCategoryText !== "string") return null;
  const trimmed = rawCategoryText.trim();
  if (isSummaryOrHeaderRow(trimmed)) return null;

  // 1. Direct number code match (e.g. "1. 인건비", "7. 통근차량")
  const leadingNumMatch = trimmed.match(/^(\d+)[\.\)\s]/);
  if (leadingNumMatch) {
    const code = Number(leadingNumMatch[1]);
    const matchedRule = CATEGORY_MATCH_RULES.find((r) => r.code === code);
    if (matchedRule) {
      // Validate that it doesn't contradict the text completely
      const clean = trimmed.replace(/^\d+[\.\)\s]+/, "").trim();
      const pureStandard = matchedRule.standardName.replace(/^\d+\.\s*/, "").split("(")[0].trim();
      if (clean === "" || clean.includes(pureStandard) || matchedRule.keywords.some((kw) => clean.includes(kw))) {
        return matchedRule;
      }
    }
  }

  const clean = trimmed.replace(/^\d+[\.\)\s]+/, "").trim();

  // 2. Exact standard name match
  for (const rule of CATEGORY_MATCH_RULES) {
    const pureFull = rule.standardName.replace(/^\d+\.\s*/, "").trim();
    const pureShort = pureFull.split("(")[0].trim();
    if (clean === pureFull || clean === pureShort) {
      return rule;
    }
  }

  // 3. Keyword matching (prioritizing longer keywords first)
  let bestMatch = null;
  let maxMatchedLen = -1;

  for (const rule of CATEGORY_MATCH_RULES) {
    // Check exclusion rules first
    if (rule.excludeKeywords && rule.excludeKeywords.some((ex) => clean.includes(ex) || trimmed.includes(ex))) {
      continue;
    }

    for (const kw of rule.keywords) {
      if (clean.includes(kw) || trimmed.includes(kw)) {
        if (kw.length > maxMatchedLen) {
          maxMatchedLen = kw.length;
          bestMatch = rule;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Parses an Excel / CSV 2D row array for expense items.
 * Returns { items: Array, totalExpense: Number, score: Number }
 */
export function parseSheetRowsForExpenses(rows, sheetName = "") {
  if (!rows || rows.length === 0) return { items: [], totalExpense: 0, score: 0 };

  const cleanRows = rows.filter(
    (r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
  );

  if (cleanRows.length === 0) return { items: [], totalExpense: 0, score: 0 };

  const extractedItems = [];
  let foundCategoryCount = 0;
  let hasExpenseHeaderSection = false;

  // Scan for section headers e.g. "공통비", "지출내역", "공제"
  for (let rIdx = 0; rIdx < cleanRows.length; rIdx++) {
    const row = cleanRows[rIdx];
    const rowStr = row.map((c) => String(c || "")).join(" ");
    if (
      rowStr.includes("공통비") ||
      rowStr.includes("지출") ||
      rowStr.includes("공제내역") ||
      rowStr.includes("차감")
    ) {
      hasExpenseHeaderSection = true;
    }

    // Try to detect column positions for (Category, Amount, Note)
    let catIdx = -1;
    let amtIdx = -1;
    let noteIdx = -1;

    // Check cells in this row
    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const cellVal = row[cIdx];
      const cellStr = String(cellVal || "").trim();

      // Check if cell is a category name or matches standard categories
      const matchedCat = matchStandardCategory(cellStr);
      if (matchedCat && !isSummaryOrHeaderRow(cellStr)) {
        catIdx = cIdx;
        // Search adjacent cells for amount
        for (let targetCol = 0; targetCol < row.length; targetCol++) {
          if (targetCol === catIdx) continue;
          const targetVal = row[targetCol];
          const amt = cleanNumericAmount(targetVal);
          // An expense amount is usually positive, non-year (e.g. not 2026), not simple index 1..20
          if (amt > 0 && targetCol !== 0 && targetCol !== catIdx) {
            // Pick the best column for amount (not a year, not row number)
            if (amt !== 2026 && amt !== 2607 && amt !== 2608 && amt !== 2609) {
              amtIdx = targetCol;
              break;
            }
          }
        }

        // Search for note
        for (let targetCol = 0; targetCol < row.length; targetCol++) {
          if (targetCol === catIdx || targetCol === amtIdx) continue;
          const targetVal = String(row[targetCol] || "").trim();
          if (
            targetVal &&
            !isSummaryOrHeaderRow(targetVal) &&
            isNaN(cleanNumericAmount(targetVal)) &&
            targetVal.length > 1
          ) {
            noteIdx = targetCol;
          }
        }

        if (catIdx !== -1) {
          const rawAmount = amtIdx !== -1 ? cleanNumericAmount(row[amtIdx]) : 0;
          const rawNote = noteIdx !== -1 ? String(row[noteIdx] || "").trim() : "";

          extractedItems.push({
            id: `parsed_${Date.now()}_${rIdx}`,
            rawCategory: cellStr,
            matchedRule: matchedCat,
            category: matchedCat ? matchedCat.standardName : cellStr,
            amount: rawAmount,
            note: rawNote || (matchedCat ? matchedCat.defaultNote : "")
          });
          foundCategoryCount++;
          break; // proceed to next row
        }
      }
    }

    // Pattern 2: Explicit [No, Category, Amount, Note] layout even if category didn't match keyword
    if (catIdx === -1 && row.length >= 3) {
      const firstCellNum = cleanNumericAmount(row[0]);
      const secCellStr = String(row[1] || "").trim();
      const thirdCellNum = cleanNumericAmount(row[2]);

      // e.g. Row 1: [1, "인건비", 91071530, "메모"] or [1, "기타항목", 50000]
      if (
        firstCellNum >= 1 &&
        firstCellNum <= 50 &&
        secCellStr !== "" &&
        !isSummaryOrHeaderRow(secCellStr) &&
        !secCellStr.includes("FRT") &&
        !secCellStr.includes("RR") &&
        thirdCellNum >= 0
      ) {
        const matched = matchStandardCategory(secCellStr);
        const rawNote = row[3] !== undefined ? String(row[3]).trim() : "";

        extractedItems.push({
          id: `parsed_${Date.now()}_${rIdx}`,
          rawCategory: secCellStr,
          matchedRule: matched,
          category: matched ? matched.standardName : `${firstCellNum}. ${secCellStr}`,
          amount: thirdCellNum,
          note: rawNote || (matched ? matched.defaultNote : "")
        });
        if (matched) foundCategoryCount++;
      }
    }
  }

  // Deduplicate by standard category rule if multiple matches occurred
  const uniqueMap = new Map();
  const customItems = [];

  for (const item of extractedItems) {
    if (item.matchedRule) {
      const key = item.matchedRule.id;
      if (!uniqueMap.has(key) || (item.amount > 0 && uniqueMap.get(key).amount === 0)) {
        uniqueMap.set(key, item);
      }
    } else {
      customItems.push(item);
    }
  }

  const finalItems = [...uniqueMap.values(), ...customItems];
  const totalExpense = finalItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  // 🌟 User Requirement: Prioritize the breakdown file containing 10~20 expense items
  const itemCount = finalItems.length;
  let score = foundCategoryCount * 25;

  if (itemCount >= 8 && itemCount <= 25) {
    score += 250;
    if (itemCount >= 10 && itemCount <= 20) {
      score += 200; // Strong bonus for exactly 10~20 items!
    }
  } else if (itemCount > 0 && itemCount < 8) {
    score += itemCount * 10;
  }

  const cleanSheetName = (sheetName || "").toLowerCase();
  if (cleanSheetName.includes("지출") || cleanSheetName.includes("공제") || cleanSheetName.includes("공통비")) score += 120;
  if (cleanSheetName.includes("260") || cleanSheetName.includes("정산") || cleanSheetName.includes("명세") || cleanSheetName.includes("마스터")) score += 80;
  if (hasExpenseHeaderSection) score += 100;
  if (totalExpense > 0) score += 50;

  return {
    items: finalItems,
    totalExpense,
    foundCategoryCount,
    itemCount,
    score
  };
}

/**
 * Parses a single File (Excel, CSV, or PDF) for Hanul expense data.
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
      let highestScore = -1;
      let bestSheetName = "";

      for (const sName of sheetNames) {
        const ws = workbook.Sheets[sName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const res = parseSheetRowsForExpenses(rows, sName);

        if (res.score > highestScore && res.items.length > 0) {
          highestScore = res.score;
          bestSheetResult = res;
          bestSheetName = sName;
        }
      }

      if (bestSheetResult && bestSheetResult.items.length > 0) {
        return {
          success: true,
          fileName,
          sheetName: bestSheetName,
          fileType: "excel",
          score: highestScore,
          items: bestSheetResult.items,
          totalExpense: bestSheetResult.totalExpense,
          matchedCount: bestSheetResult.foundCategoryCount,
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
      const numPages = pdfDoc.numPages;
      const extractedLines = [];

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const textItems = textContent.items || [];

        // Group text items roughly by Y position to reconstruct table lines
        const linesMap = new Map();
        for (const it of textItems) {
          const y = Math.round(it.transform[5]);
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y).push({ x: it.transform[4], str: it.str });
        }

        // Sort lines top to bottom (descending Y in PDF coordinates)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        for (const y of sortedY) {
          const rowItems = linesMap.get(y).sort((a, b) => a.x - b.x);
          const rowCells = rowItems.map((c) => c.str.trim()).filter(Boolean);
          if (rowCells.length > 0) {
            extractedLines.push(rowCells);
          }
        }
      }

      const res = parseSheetRowsForExpenses(extractedLines, fileName);
      if (res && res.items.length > 0) {
        return {
          success: true,
          fileName,
          sheetName: "PDF 본문",
          fileType: "pdf",
          score: res.score,
          items: res.items,
          totalExpense: res.totalExpense,
          matchedCount: res.foundCategoryCount,
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
 * Analyzes multiple uploaded files and identifies the one containing the expense breakdown table (10~20 items).
 * Returns the best parsing result or null.
 */
export async function parseHanulExpensesFromMultipleFiles(files = []) {
  if (!files || files.length === 0) return null;

  const results = [];

  for (const file of files) {
    const res = await parseHanulExpensesFromFile(file);
    if (res && res.success && res.items.length > 0) {
      results.push(res);
    }
  }

  if (results.length === 0) return null;

  // Sort: prioritize files with 10~20 items, highest score, and highest valid expense total
  results.sort((a, b) => {
    // 1. Highest score
    if (b.score !== a.score) return b.score - a.score;
    // 2. Sweet spot (10~20 items)
    const aInSweetSpot = a.itemCount >= 10 && a.itemCount <= 20 ? 1 : 0;
    const bInSweetSpot = b.itemCount >= 10 && b.itemCount <= 20 ? 1 : 0;
    if (bInSweetSpot !== aInSweetSpot) return bInSweetSpot - aInSweetSpot;
    // 3. Matched categories count
    if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
    // 4. Total expense
    return b.totalExpense - a.totalExpense;
  });

  return results[0];
}

/**
 * 🌟 User Requirement: "그 파일의 내용만 왼쪽항목에 정리되면 됩니다."
 * Populates the left-hand expense list using ONLY the extracted items from the 10~20 item breakdown file.
 */
export function mergeExtractedExpensesWithState(parsedResult, currentExpenses = []) {
  if (!parsedResult || !parsedResult.items || parsedResult.items.length === 0) {
    return { expenses: currentExpenses, totalExpense: 0, appliedCount: 0 };
  }

  const parsedItems = parsedResult.items;

  // Format ONLY the items from the extracted 10~20 item breakdown file with sequential numbering
  const finalExpenses = parsedItems
    .filter((it) => it && (it.category || it.rawCategory) && (Number(it.amount) > 0 || String(it.note || "").trim() !== ""))
    .map((item, idx) => {
      const raw = (item.rawCategory || item.category || `항목 ${idx + 1}`).trim();
      const cleanName = raw.replace(/^\d+\s*[\.\)]\s*/, "").trim();
      return {
        id: `exp_parsed_${idx + 1}_${Date.now()}`,
        category: `${idx + 1}. ${cleanName || "공통비/공제 항목"}`,
        amount: Number(item.amount) || 0,
        note: item.note || (item.matchedRule ? item.matchedRule.defaultNote : "")
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
