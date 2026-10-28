import { getCurrentYearMonth } from "../../../context/MonthContext";
import { getDefault9BQCSales } from "../../../services/hanulTaxInvoiceService";

// FRT & RR 대상 품목 인덱스 정의
// FRT 대상: 3번(idx 2: FRT LH), 4번(idx 3: FRT RH)
export const FRT_INDICES = [2, 3];

// RR 대상: 1번(idx 0: RR LH PRI), 2번(idx 1: RR RH PRI), 5번(idx 4: RR LH TNI), 6번(idx 5: RR RH TNI), 7번(idx 6: Glass run RR), 8번(idx 7: Glass run FR)
export const RR_INDICES = [0, 1, 4, 5, 6, 7];

// Helper: 전월(Previous Month) 구하기
export const getPreviousYearMonth = (baseMonth) => {
  const ym = baseMonth || getCurrentYearMonth() || "2026-09";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  const prevY = d.getFullYear();
  const prevM = String(d.getMonth() + 1).padStart(2, "0");
  return `${prevY}-${prevM}`;
};

// Helper to ensure all 8 items exist
export const ensure8Items = (rawMonthData, month) => {
  const defaults = getDefault9BQCSales(month);
  const existing = rawMonthData?.salesItems || [];

  const mergedSales = defaults.map((defItem) => {
    const match = existing.find(
      (e) => e.partName === defItem.partName || (e.partNumber && e.partNumber === defItem.partNumber)
    );
    if (match) {
      const q = match.qty !== undefined && !isNaN(Number(match.qty)) ? Number(match.qty) : defItem.qty;
      const p = match.unitPrice !== undefined && !isNaN(Number(match.unitPrice)) ? Number(match.unitPrice) : defItem.unitPrice;
      const amt = Number(match.amount) || q * p;
      return {
        ...defItem,
        ...match,
        qty: q,
        unitPrice: p,
        amount: amt,
        taxAmount: Math.round(amt * 0.1),
        totalAmount: Math.round(amt * 1.1)
      };
    }
    return defItem;
  });

  return {
    ...rawMonthData,
    salesItems: mergedSales
  };
};
