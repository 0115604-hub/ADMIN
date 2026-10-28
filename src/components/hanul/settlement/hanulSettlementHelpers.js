/**
 * Helper to renumber expense categories sequentially (1. ..., 2. ..., 3. ...)
 */
export const renumberExpenses = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item, idx) => {
    const newNum = idx + 1;
    const rawCat = item.category || "";
    // Strip existing leading number e.g. "1. ", "12. ", "4) "
    const cleanName = rawCat.replace(/^\d+\s*[\.\)]\s*/, "").trim();
    return {
      ...item,
      category: `${newNum}. ${cleanName || "공통비/공제 항목"}`
    };
  });
};

/**
 * Get current year-month in KST (e.g. "2026-09")
 */
export const getCurrentYearMonthKST = () => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/**
 * Get previous year-month (전월) based on baseMonth or current KST date (e.g. "2026-08")
 */
export const getPreviousYearMonth = (baseMonth) => {
  const target = baseMonth || getCurrentYearMonthKST();
  const [y, m] = target.split("-").map(Number);
  if (!y || !m) return "2026-08";
  const prevDate = new Date(y, m - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
  return `${prevY}-${prevM}`;
};

/**
 * Generate month dropdown options starting from previous month (전월부터) without parentheses
 */
export const getHanulSettlementMonthOptions = () => {
  const currYM = getCurrentYearMonthKST();
  const [currY, currM] = currYM.split("-").map(Number);

  const options = [];
  // 당월부터 과거 12개월 목록 생성
  for (let i = 0; i <= 12; i++) {
    const d = new Date(currY, currM - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const ym = `${y}-${m}`;
    options.push({
      ym,
      label: `${y}년 ${m}월`
    });
  }

  return options;
};
