import * as XLSX from "xlsx";

// Known business account categories in Korean manufacturing / corporate accounting
const KNOWN_CATEGORIES = [
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
  "이자비용",
  "대출이자",
  "차량유지비",
  "통신비",
  "수도광열비",
  "외주비",
  "매출",
  "제품매출",
  "서비스매출",
];

// Smart Universal Excel Parser
export const parseExcelFile = (file, defaultYearMonth = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to 2D array (preserving row and column structures)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!rows || rows.length === 0) {
          throw new Error("엑셀 시트에 데이터가 존재하지 않습니다.");
        }

        // 1. Detect target Year-Month from Sheet Name, File Name, or Content
        let detectedYM = defaultYearMonth;
        const textToSearchYM = `${file.name} ${firstSheetName} ${JSON.stringify(rows.slice(0, 10))}`;
        const ymMatch = textToSearchYM.match(/(20\d{2})[._\-\s년]?\s*(0[1-9]|1[0-2]|[1-9])월?/);
        if (ymMatch) {
          const y = ymMatch[1];
          const m = String(ymMatch[2]).padStart(2, "0");
          detectedYM = `${y}-${m}`;
        } else if (!detectedYM) {
          const now = new Date();
          detectedYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }

        // 2. Find Header Row index
        let headerRowIdx = -1;
        let colMap = {
          no: -1,
          category: -1,
          type: -1,
          client: -1,
          title: -1,
          supplyPrice: -1,
          tax: -1,
          totalPrice: -1,
          memo: -1
        };

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r].map((c) => String(c).trim());
          const hasSupplier = row.some((c) => /업체|거래처|공급처|상호|고객|매입처/i.test(c));
          const hasAmount = row.some((c) => /공급가|합계|금액|단가|가격/i.test(c));

          if (hasSupplier || hasAmount) {
            headerRowIdx = r;
            row.forEach((colName, cIdx) => {
              const cn = colName.replace(/\s+/g, "").toLowerCase();
              if (/^no|^번호|^순번/i.test(cn)) colMap.no = cIdx;
              else if (/계정과목|카테고리|분류|계정/i.test(cn)) colMap.category = cIdx;
              else if (/^구분/i.test(cn)) colMap.type = cIdx;
              else if (/매입업체|거래처|공급처|상호|업체명|고객사/i.test(cn)) colMap.client = cIdx;
              else if (/품목|항목|적요|품명|내용|설명/i.test(cn)) colMap.title = cIdx;
              else if (/공급가액|공급가/i.test(cn)) colMap.supplyPrice = cIdx;
              else if (/세액|부가세/i.test(cn)) colMap.tax = cIdx;
              else if (/합계|총액|결제금액/i.test(cn)) colMap.totalPrice = cIdx;
              else if (/메모|비고|적요사항/i.test(cn)) colMap.memo = cIdx;
            });
            break;
          }
        }

        // If no header found, use positional heuristics based on user's table:
        // [0: NO, 1: 계정과목, 2: 구분, 3: 매입업체명, 4: 품목, 5: 공급가, 6: 세액, 7: 합계, 8: 메모]
        if (headerRowIdx === -1) {
          headerRowIdx = 0;
          colMap = {
            no: 0,
            category: 1,
            type: 2,
            client: 3,
            title: 4,
            supplyPrice: 5,
            tax: 6,
            totalPrice: 7,
            memo: 8
          };
        }

        // 3. Process data rows with Category Forward-fill and Subtotal filtering
        let currentCategory = "기타매입";
        const transactions = [];
        let autoId = 1;

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          // Helper to get text
          const getVal = (idx) => (idx >= 0 && idx < row.length ? String(row[idx] || "").trim() : "");

          const rawCategory = getVal(colMap.category);
          const rawSubCategory = getVal(colMap.type);
          const rawClient = getVal(colMap.client);
          const rawTitle = getVal(colMap.title);
          const rawSupplyPrice = getVal(colMap.supplyPrice).replace(/,/g, "");
          const rawTotalPrice = getVal(colMap.totalPrice).replace(/,/g, "");
          const rawMemo = getVal(colMap.memo);

          // Check if category changed in this row
          if (rawCategory) {
            const foundKnown = KNOWN_CATEGORIES.find((kc) => rawCategory.includes(kc));
            currentCategory = foundKnown || rawCategory.replace(/계$/, "").trim();
          }

          // Check if this row is a Subtotal / Summary line (소계, 합계, 계)
          const allTextInRow = row.join(" ");
          const isSummaryRow =
            /합계|소계|총계|\s계$/i.test(rawClient) ||
            /합계|소계|총계|\s계$/i.test(rawTitle) ||
            /합계|소계|총계|\s계$/i.test(rawCategory) && !rawClient;

          if (isSummaryRow) {
            continue; // Skip summary rows to prevent double-counting!
          }

          // Parse amount (prefer supply price, fallback to total price)
          let amount = Number(rawSupplyPrice);
          if (isNaN(amount) || amount === 0) {
            amount = Number(rawTotalPrice);
          }

          // If no supplier and no valid amount, skip
          if (!rawClient || isNaN(amount) || amount <= 0) {
            continue;
          }

          // Determine transaction type
          const isRevenue =
            currentCategory.includes("매출") ||
            currentCategory.includes("수익") ||
            rawSubCategory.includes("매출") ||
            rawSubCategory.includes("수익");
          const type = isRevenue ? "revenue" : "expense";

          // Extract date from item title or default to last day of target month
          let dateStr = `${detectedYM}-28`;
          const titleDateMatch = (rawTitle + " " + rawMemo).match(/\[?(20\d{2})[-./]?(0[1-9]|1[0-2]|[1-9])[-./]?(0[1-9]|[12]\d|3[01])?\]?/);
          if (titleDateMatch) {
            const y = titleDateMatch[1];
            const m = String(titleDateMatch[2]).padStart(2, "0");
            const d = titleDateMatch[3] ? String(titleDateMatch[3]).padStart(2, "0") : "28";
            dateStr = `${y}-${m}-${d}`;
          }

          const itemTitle = rawTitle || `${currentCategory} 매입`;
          const memoParts = [rawSubCategory ? `[${rawSubCategory}]` : "", rawMemo].filter(Boolean).join(" ");

          transactions.push({
            id: `auto_${Date.now()}_${autoId++}`,
            type,
            category: currentCategory,
            title: itemTitle,
            amount: Math.round(amount),
            date: dateStr,
            client: rawClient,
            paymentMethod: "세금계산서",
            status: "완료",
            memo: memoParts || `${detectedYM} 매입 자료`
          });
        }

        if (transactions.length === 0) {
          throw new Error("유효한 매입/지출 내역을 찾을 수 없습니다. 파일 양식을 확인해 주세요.");
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

// Download standard sample template
export const downloadExcelTemplate = () => {
  const sampleData = [
    {
      "계정과목": "원자재",
      "구분": "",
      "매입업체명": "주식회사 해동무역",
      "품목": "cmb",
      "공급가액": 332015090,
      "세액": 33201509,
      "합계": 365216599,
      "메모": "발주분"
    },
    {
      "계정과목": "부자재",
      "구분": "",
      "매입업체명": "(주)화승네트웍스",
      "품목": "46MM WIRE CARRIER 외",
      "공급가액": 57529400,
      "세액": 5752940,
      "합계": 63282340,
      "메모": "월간 정산"
    },
    {
      "계정과목": "임가공비",
      "구분": "",
      "매입업체명": "(주)조영산업",
      "품목": "7월 임가공비외",
      "공급가액": 502462457,
      "세액": 50246245,
      "합계": 552708702,
      "메모": "임가공 마감"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "매입명세표");
  XLSX.writeFile(workbook, "기존양식_매입명세표_템플릿.xlsx");
};
