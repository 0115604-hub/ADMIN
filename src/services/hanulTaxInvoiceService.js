import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import initialMultiMonthData from "../data/multiMonthMasterData.json";

const STORAGE_KEY = "oryuk_hanul_tax_invoice_store_v1";
const FIRESTORE_PATH = ["system_store", "hanul_tax_invoice_master"];

// Default 9BQC items extractor from multi-month master data
export const getDefault9BQCSales = (yearMonth = "2026-09") => {
  const monthData = initialMultiMonthData[yearMonth] || initialMultiMonthData["2026-09"] || initialMultiMonthData["2026-07"];
  const bqcGroup = monthData?.vehicleSales?.find(
    (v) => v.vehicleGroup === "9BQC" || v.vehicleGroup?.includes("9BQC")
  );

  if (bqcGroup && Array.isArray(bqcGroup.details) && bqcGroup.details.length > 0) {
    return bqcGroup.details.map((d, idx) => ({
      id: `9bqc_${yearMonth}_${idx + 1}`,
      vehicle: "9BQC",
      partName: d.partName || "9BQC 부품",
      partNumber: d.partNumber || "-",
      itemCode: d.itemCode || "-",
      process: d.process || "내수상품매출",
      qty: Number(d.qty) || 0,
      unitPrice: Number(d.unitPrice) || 0,
      amount: Number(d.amount) || (Number(d.qty) * Number(d.unitPrice)) || 0,
      taxAmount: Math.round(((Number(d.amount) || (Number(d.qty) * Number(d.unitPrice)) || 0) * 0.1)),
      totalAmount: Math.round(((Number(d.amount) || (Number(d.qty) * Number(d.unitPrice)) || 0) * 1.1)),
      memo: d.memo || ""
    }));
  }

  // Standard fallback 9BQC part list
  return [
    {
      id: `9bqc_${yearMonth}_1`,
      vehicle: "9BQC",
      partName: "9BQC RR LH(PRI)",
      partNumber: "42933958",
      itemCode: "G1102-2756-00",
      process: "내수상품매출",
      qty: 3660,
      unitPrice: 11028,
      amount: 40362480,
      taxAmount: 4036248,
      totalAmount: 44398728,
      memo: "한울 임가공"
    },
    {
      id: `9bqc_${yearMonth}_2`,
      vehicle: "9BQC",
      partName: "9BQC RR RH(PRI)",
      partNumber: "42933959",
      itemCode: "G1102-2757-00",
      process: "내수상품매출",
      qty: 3660,
      unitPrice: 11028,
      amount: 40362480,
      taxAmount: 4036248,
      totalAmount: 44398728,
      memo: "한울 임가공"
    },
    {
      id: `9bqc_${yearMonth}_3`,
      vehicle: "9BQC",
      partName: "9BQC FRT LH",
      partNumber: "42933952",
      itemCode: "G1102-2752-00",
      process: "내수상품매출",
      qty: 4800,
      unitPrice: 2858,
      amount: 13718400,
      taxAmount: 1371840,
      totalAmount: 15090240,
      memo: "한울 임가공"
    },
    {
      id: `9bqc_${yearMonth}_4`,
      vehicle: "9BQC",
      partName: "9BQC FRT RH",
      partNumber: "42933953",
      itemCode: "G1102-2753-00",
      process: "내수상품매출",
      qty: 4800,
      unitPrice: 2858,
      amount: 13718400,
      taxAmount: 1371840,
      totalAmount: 15090240,
      memo: "한울 임가공"
    },
    {
      id: `9bqc_${yearMonth}_5`,
      vehicle: "9BQC",
      partName: "9BQC RR LH(TNI)",
      partNumber: "42933956",
      itemCode: "G1102-2754-00",
      process: "내수상품매출",
      qty: 120,
      unitPrice: 10598,
      amount: 1271760,
      taxAmount: 127176,
      totalAmount: 1398936,
      memo: "한울 임가공"
    },
    {
      id: `9bqc_${yearMonth}_6`,
      vehicle: "9BQC",
      partName: "9BQC RR RH(TNI)",
      partNumber: "42933957",
      itemCode: "G1102-2755-00",
      process: "내수상품매출",
      qty: 120,
      unitPrice: 10598,
      amount: 1271760,
      taxAmount: 127176,
      totalAmount: 1398936,
      memo: "한울 임가공"
    }
  ];
};

// Default Hanul purchase / outsourcing settlement items
export const getDefaultHanulPurchases = (yearMonth = "2026-09") => {
  if (yearMonth === "2026-07") {
    return [
      {
        id: `p_hanul_${yearMonth}_1`,
        category: "임가공비",
        item: "9BQC FRT LH 외 가공비 정산",
        supplyAmt: 120886800,
        taxAmt: 12088680,
        totalAmt: 132975480,
        vendor: "한울",
        status: "정산완료",
        memo: "7월 매입 마감분"
      },
      {
        id: `p_hanul_${yearMonth}_2`,
        category: "공과금/전기세",
        item: "한림공장 전기요금 차감 정산",
        supplyAmt: 3706080,
        taxAmt: 370608,
        totalAmt: 4076688,
        vendor: "한울",
        status: "정산완료",
        memo: "전기세 공제분"
      }
    ];
  }

  if (yearMonth === "2026-08") {
    return [
      {
        id: `p_hanul_${yearMonth}_1`,
        category: "임가공비",
        item: "9BQC 가공비 정산 (8월)",
        supplyAmt: 98450000,
        taxAmt: 9845000,
        totalAmt: 108295000,
        vendor: "한울",
        status: "정산완료",
        memo: "8월 매입 마감분"
      },
      {
        id: `p_hanul_${yearMonth}_2`,
        category: "공과금/전기세",
        item: "한림공장 전기요금 차감 정산",
        supplyAmt: 3250000,
        taxAmt: 325000,
        totalAmt: 3575000,
        vendor: "한울",
        status: "정산완료",
        memo: "전기세 공제분"
      }
    ];
  }

  // 2026-09 (Current)
  return [
    {
      id: `p_hanul_${yearMonth}_1`,
      category: "임가공비",
      item: "9BQC 가공비 정산 (9월 진행분)",
      supplyAmt: 24500000,
      taxAmt: 2450000,
      totalAmt: 26950000,
      vendor: "한울",
      status: "진행중",
      memo: "9월 잠정 집계"
    },
    {
      id: `p_hanul_${yearMonth}_2`,
      category: "공과금/전기세",
      item: "한림공장 전기요금 차감 정산",
      supplyAmt: 1200000,
      taxAmt: 120000,
      totalAmt: 1320000,
      vendor: "한울",
      status: "진행중",
      memo: "전기세 공제분"
    }
  ];
};

// Default Month Structure
export const createDefaultHanulMonthData = (yearMonth = "2026-09") => {
  const salesItems = getDefault9BQCSales(yearMonth);
  const totalSalesSupply = salesItems.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const purchaseItems = getDefaultHanulPurchases(yearMonth);

  // Default Tax invoice issuance amount presets by month
  let defaultIssuedAmount = totalSalesSupply;
  if (yearMonth === "2026-07") defaultIssuedAmount = 132975480;
  if (yearMonth === "2026-08") defaultIssuedAmount = 108295000;
  if (yearMonth === "2026-09") defaultIssuedAmount = totalSalesSupply;

  const defaultVat = Math.round(defaultIssuedAmount * 0.1);

  return {
    yearMonth,
    // 세금계산서 발행금액 및 기본 정보
    invoiceConfig: {
      invoiceAmount: defaultIssuedAmount, // 공급가액
      vatAmount: defaultVat, // 세액
      totalInvoiceAmount: defaultIssuedAmount + defaultVat, // 합계금액
      issueDate: `${yearMonth}-${yearMonth === "2026-09" ? "10" : "31"}`,
      invoiceType: "전자세금계산서 (영세율/과세)",
      status: "발행완료", // "발행완료" | "발행대기" | "작성중"
      vendorName: "한울",
      vendorBizNo: "615-81-78901",
      buyerName: "(주)오륙",
      buyerBizNo: "615-81-12345",
      memo: `${yearMonth} 한울 9BQC 매입매출 세금계산서 발행 및 정산`
    },
    salesItems, // 9BQC 매출 (품명, 품번, 단가, 수량, 합계액)
    purchaseItems, // 매입 정산 내역
    updatedAt: new Date().toISOString()
  };
};

// Read local storage
export const getLocalHanulStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Local storage read error for Hanul Tax Invoice:", e);
    return {};
  }
};

// Save local storage
export const saveLocalHanulStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("Local storage write error for Hanul Tax Invoice:", e);
  }
};

// Get Month Data with automatic fallback
export const getHanulMonthData = (yearMonth = "2026-09") => {
  const store = getLocalHanulStore();
  if (store[yearMonth]) {
    return store[yearMonth];
  }
  const defaultData = createDefaultHanulMonthData(yearMonth);
  store[yearMonth] = defaultData;
  saveLocalHanulStore(store);
  return defaultData;
};

// Save Hanul Month Data to LocalStorage and Firestore
export const saveHanulMonthData = async (yearMonth, monthData) => {
  const store = getLocalHanulStore();
  const updated = {
    ...monthData,
    yearMonth,
    updatedAt: new Date().toISOString()
  };
  store[yearMonth] = updated;
  saveLocalHanulStore(store);

  try {
    const docRef = doc(db, ...FIRESTORE_PATH);
    await setDoc(docRef, { store }, { merge: true });
  } catch (e) {
    console.warn("Firestore saveHanulMonthData fallback to local:", e);
  }

  return updated;
};

// Subscribe to Firestore changes
export const subscribeHanulStore = (onUpdate) => {
  try {
    const docRef = doc(db, ...FIRESTORE_PATH);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.store) {
            const current = getLocalHanulStore();
            const merged = { ...current, ...data.store };
            saveLocalHanulStore(merged);
            onUpdate(merged);
          }
        }
      },
      (error) => {
        console.warn("Firestore Hanul Tax Invoice sync warning:", error);
      }
    );
  } catch (e) {
    console.warn("subscribeHanulStore error:", e);
    return () => {};
  }
};
