import * as XLSXModule from "xlsx";

const XLSX = XLSXModule.default || XLSXModule;

const KNOWN_EXPENSE_CATEGORIES = [
  "원자재",
  "부자재",
  "포장부자재",
  "포장",
  "임가공비",
  "물류비",
  "운송비",
  "지급수수료",
  "임대료",
  "수선비/설비",
  "수선비",
  "설비공사",
  "산폐비",
  "폐기물",
  "전력비",
  "전기요금",
  "복리후생비",
  "식대",
  "소모품/공구",
  "소모품",
  "공구",
  "노무비",
  "인건비",
  "급여",
  "공과금",
  "세금과공과",
  "금융비용",
  "대출이자",
  "이자비용",
  "차량유지비",
  "통신비"
];

export const parseExcelFile = (file, defaultYearMonth = "2026-07") => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;

        if (!sheetNames || sheetNames.length === 0) {
          throw new Error("엑셀 시트가 존재하지 않습니다.");
        }

        const transactions = [];
        let autoId = 1;

        // Auto-detect Target Year-Month if not provided
        let targetYM = defaultYearMonth;
        const textToSearchYM = `${file.name} ${sheetNames.join(" ")}`;
        const ymMatch = textToSearchYM.match(/(20\d{2})[._\-\s년]?\s*(0[1-9]|1[0-2]|[1-9])월?/);
        if (ymMatch) {
          const y = ymMatch[1];
          const m = String(ymMatch[2]).padStart(2, "0");
          targetYM = `${y}-${m}`;
        }

        // =========================================================================
        // STRATEGY 1: Multi-Sheet Company Workbook (e.g. 2026-07월매입매출현황)
        // =========================================================================
        const hasSalesSheet = sheetNames.some((s) => s.includes("매출세금계산서") || s.includes("매출"));
        const hasPurchasingSheets = sheetNames.some((s) => s.includes("매입") || s.includes("자재"));

        if (hasSalesSheet) {
          // 1-1. Parse Sales Tax Invoices (매출세금계산서)
          const salesSheetName = sheetNames.find((s) => s.includes("매출세금계산서")) || sheetNames.find((s) => s.includes("매출"));
          if (salesSheetName) {
            const ws = workbook.Sheets[salesSheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            let headerFound = false;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              const allText = row.join(" ");
              if (allText.includes("업체명") && (allText.includes("공급가") || allText.includes("합계"))) {
                headerFound = true;
                continue;
              }
              if (!headerFound) continue;

              if (allText.includes("소계") || allText.includes("합계") || allText.includes("총계")) continue;

              const subCat = String(row[1] || "").trim();
              const rawDate = row[2];
              const client = String(row[3] || "").trim();
              const title = String(row[4] || "").trim();
              const supplyPrice = Number(String(row[5] || "").replace(/,/g, ""));
              const memo = String(row[9] || "").trim();

              if (client && !isNaN(supplyPrice) && supplyPrice > 0) {
                let dateStr = `${targetYM}-31`;
                if (typeof rawDate === "number" && rawDate > 30000) {
                  const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                  dateStr = d.toISOString().split("T")[0];
                }

                transactions.push({
                  id: `sales_${Date.now()}_${autoId++}`,
                  type: "revenue",
                  category: subCat ? `매출 (${subCat})` : "제품 매출",
                  title: title || `${client} 매출 세금계산서 발행`,
                  amount: Math.round(supplyPrice),
                  date: dateStr,
                  client: client,
                  paymentMethod: "세금계산서",
                  status: "완료",
                  memo: memo ? `[매출] ${memo}` : `${targetYM} 매출 세금계산서 발행`
                });
              }
            }
          }
        }

        // =========================================================================
        // STRATEGY 2: Multi-Month Column Ledger (e.g. 2026.07 매입매출 내역서 '결산' 시트)
        // =========================================================================
        const settlementSheetName = sheetNames.find((s) => s.includes("결산") || s.includes("정리본") || s.includes("현황"));
        if (settlementSheetName) {
          const ws = workbook.Sheets[settlementSheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

          // Check if there are side-by-side month blocks (e.g., Row 0 or Row 3 having multiple "NO" columns)
          for (let r = 0; r < Math.min(rows.length, 5); r++) {
            const row = rows[r];
            // Find all indices where 'NO' or '매입업체명' starts a block
            const blockColStarts = [];
            row.forEach((cell, idx) => {
              if (String(cell).trim().toUpperCase() === "NO" || String(cell).includes("매입업체명")) {
                blockColStarts.push(idx <= 1 ? 0 : idx - 1);
              }
            });

            if (blockColStarts.length > 0) {
              // Extract the target or latest month block (default to rightmost block)
              const startCol = blockColStarts[blockColStarts.length - 1];
              let currentCategory = "원자재";

              for (let dataR = r + 1; dataR < rows.length; dataR++) {
                const dRow = rows[dataR];
                if (!dRow) continue;

                const cNo = String(dRow[startCol + 1] || "").trim();
                const cCat = String(dRow[startCol + 2] || "").trim();
                const cSub = String(dRow[startCol + 3] || "").trim();
                const client = String(dRow[startCol + 4] || "").trim();
                const title = String(dRow[startCol + 5] || "").trim();
                const supplyStr = String(dRow[startCol + 6] || "").replace(/,/g, "").trim();
                const totalStr = String(dRow[startCol + 8] || "").replace(/,/g, "").trim();
                const memo = String(dRow[startCol + 9] || "").trim();

                if (cCat) {
                  const found = KNOWN_EXPENSE_CATEGORIES.find((k) => cCat.includes(k));
                  if (found) currentCategory = found;
                }

                // Skip summary rows
                const rowSliceText = dRow.slice(startCol, startCol + 10).join(" ");
                if (rowSliceText.includes("소계") || rowSliceText.includes("합계") || rowSliceText.includes(" 계") || !client) {
                  continue;
                }

                let amount = Number(supplyStr);
                if (isNaN(amount) || amount === 0) {
                  amount = Number(totalStr);
                }

                if (client && !isNaN(amount) && amount > 0) {
                  transactions.push({
                    id: `exp_${Date.now()}_${autoId++}`,
                    type: "expense",
                    category: currentCategory,
                    title: title || `${currentCategory} 매입`,
                    amount: Math.round(amount),
                    date: `${targetYM}-31`,
                    client: client,
                    paymentMethod: "세금계산서",
                    status: "완료",
                    memo: [cSub ? `[${cSub}]` : "", memo].filter(Boolean).join(" ") || `${targetYM} 매입 정산`
                  });
                }
              }
              break;
            }
          }
        }

        // =========================================================================
        // STRATEGY 3: Standard Single Sheet Fallback
        // =========================================================================
        if (transactions.length === 0) {
          const firstSheet = workbook.Sheets[sheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

          let currentCategory = "원자재";
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            const allText = row.join(" ");
            if (allText.includes("소계") || allText.includes("합계") || allText.includes(" 계")) continue;

            const client = String(row[3] || row[2] || "").trim();
            const title = String(row[4] || row[3] || "").trim();
            const rawAmount = String(row[5] || row[6] || row[4] || "").replace(/,/g, "");
            const amount = Number(rawAmount);

            if (client && !isNaN(amount) && amount > 0) {
              transactions.push({
                id: `auto_${Date.now()}_${autoId++}`,
                type: "expense",
                category: currentCategory,
                title: title || `${currentCategory} 매입`,
                amount: Math.round(amount),
                date: `${targetYM}-28`,
                client: client,
                paymentMethod: "세금계산서",
                status: "완료",
                memo: `${targetYM} 엑셀 업로드`
              });
            }
          }
        }

        if (transactions.length === 0) {
          throw new Error("엑셀 파일에서 유효한 매출 또는 매입 데이터를 찾을 수 없습니다.");
        }

        resolve(transactions);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
