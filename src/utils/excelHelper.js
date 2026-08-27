import * as XLSX from "xlsx";

// Template Headers & Sample Data for Purchasing / Expenses
export const EXCEL_TEMPLATE_DATA = [
  {
    "일자 (YYYY-MM-DD)": "2026-08-01",
    "구분 (지출/수익)": "지출",
    "카테고리": "매입비/원자재",
    "항목명 (적요)": "8월 원자재 1차 매입",
    "금액 (숫자만 입력)": 3500000,
    "거래처/공급처": "(주)한국공급",
    "결제수단": "세금계산서",
    "메모": "발주번호 #PO-20260801"
  },
  {
    "일자 (YYYY-MM-DD)": "2026-08-05",
    "구분 (지출/수익)": "지출",
    "카테고리": "외주용역비",
    "항목명 (적요)": "포장 및 가공 외주비용",
    "금액 (숫자만 입력)": 1200000,
    "거래처/공급처": "글로벌팩",
    "결제수단": "계좌이체",
    "메모": "납품 완료 건"
  },
  {
    "일자 (YYYY-MM-DD)": "2026-08-10",
    "구분 (지출/수익)": "지출",
    "카테고리": "물류/운송비",
    "항목명 (적요)": "화물 택배 및 퀵 배송료",
    "금액 (숫자만 입력)": 280000,
    "거래처/공급처": "대한로지스",
    "결제수단": "법인카드",
    "메모": "8월 상반기 정산분"
  }
];

// Download sample Excel template
export const downloadExcelTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE_DATA);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "매입_손익_등록양식");

  // Adjust column widths
  worksheet["!cols"] = [
    { wch: 18 }, // 일자
    { wch: 15 }, // 구분
    { wch: 18 }, // 카테고리
    { wch: 25 }, // 항목명
    { wch: 18 }, // 금액
    { wch: 20 }, // 거래처
    { wch: 15 }, // 결제수단
    { wch: 25 }, // 메모
  ];

  XLSX.writeFile(workbook, "손익_매입내역_업로드양식.xlsx");
};

// Parse uploaded Excel / CSV file
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("엑셀 파일에 데이터가 없습니다.");
        }

        const formatted = rawJson.map((row, idx) => {
          // Normalize keys (flexible header matching)
          const findValue = (possibleKeys) => {
            for (const key of Object.keys(row)) {
              for (const p of possibleKeys) {
                if (key.includes(p)) return row[key];
              }
            }
            return "";
          };

          const rawType = String(findValue(["구분", "type", "수익", "지출", "매입", "매출"])).trim();
          const isRevenue = rawType.includes("수익") || rawType.includes("매출") || rawType.toLowerCase() === "revenue";
          const type = isRevenue ? "revenue" : "expense";

          let rawDate = String(findValue(["일자", "날짜", "date"])).trim();
          // Fix Excel serial date numbers if any
          if (!isNaN(rawDate) && Number(rawDate) > 30000) {
            const excelDate = new Date(Math.round((Number(rawDate) - 25569) * 86400 * 1000));
            rawDate = excelDate.toISOString().split("T")[0];
          } else if (rawDate.includes("/")) {
            rawDate = rawDate.replace(/\//g, "-");
          } else if (!rawDate || rawDate.length < 8) {
            rawDate = new Date().toISOString().split("T")[0];
          }

          const rawAmount = String(findValue(["금액", "amount", "단가", "합계", "공급가액", "가격"])).replace(/[^0-9.-]/g, "");
          const amount = Math.abs(Number(rawAmount)) || 0;

          const title = String(findValue(["항목", "적요", "품명", "title", "내용", "설명"]) || `매입 항목 #${idx + 1}`).trim();
          const category = String(findValue(["카테고리", "분류", "category"]) || (type === "expense" ? "매입비/원자재" : "제품 판매")).trim();
          const client = String(findValue(["거래처", "공급처", "고객", "client", "상호"]) || "").trim();
          const paymentMethod = String(findValue(["결제", "지급", "수단", "payment"]) || "계좌이체").trim();
          const memo = String(findValue(["메모", "비고", "memo", "note"]) || "엑셀 일괄 업로드").trim();

          return {
            type,
            category,
            title,
            amount,
            date: rawDate,
            client,
            paymentMethod,
            status: "완료",
            memo
          };
        }).filter((item) => item.amount > 0);

        resolve(formatted);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
