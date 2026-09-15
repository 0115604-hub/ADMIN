import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  getLocalHanulStore,
  saveLocalHanulStore,
  createDefaultHanulMonthData
} from "./hanulTaxInvoiceService";
import { DEFAULT_HANUL_ATTACHMENTS } from "../data/defaultHanulAttachments";

const STORAGE_KEY_SETTLEMENT = "oryuk_hanul_settlement_store_v1";
const FIRESTORE_PATH = ["system_store", "hanul_monthly_settlement_master"];
const FIRESTORE_PATH_TAX = ["system_store", "hanul_tax_invoice_master"];

// Standard 16 Expense Categories based on 2608/2607 Actual Data from Image
export const STANDARD_EXPENSE_CATEGORIES = [
  { id: "exp_1", code: 1, name: "1. 인건비", defaultNote: "세전 월급(등록,미등록),교통비,식비지원포함(근태파일참조)" },
  { id: "exp_2", code: 2, name: "2. 4대보험(사업주분)", defaultNote: "파일 참조" },
  { id: "exp_3", code: 3, name: "3. 삼성화재외국인보험", defaultNote: "e-9 (12명) 근태파일 참조" },
  { id: "exp_4", code: 4, name: "4. 비품", defaultNote: "파일참조" },
  { id: "exp_5", code: 5, name: "5. 식대(큰상웰빙푸드)", defaultNote: "전자세금계산서(有)" },
  { id: "exp_6", code: 6, name: "6. 자동차(한울)", defaultNote: "전자세금계산서(有)" },
  { id: "exp_7", code: 7, name: "7. 통근차량", defaultNote: "전자세금계산서(有)" },
  { id: "exp_8", code: 8, name: "8. 기장수수료", defaultNote: "전자세금계산서(有)" },
  { id: "exp_9", code: 9, name: "9. 인터넷통신비", defaultNote: "전자세금계산서(有)" },
  { id: "exp_10", code: 10, name: "10. 노무법인", defaultNote: "전자세금계산서(有)" },
  { id: "exp_11", code: 11, name: "11. 퇴직금", defaultNote: "" },
  { id: "exp_12", code: 12, name: "12. 비닐", defaultNote: "전자세금계산서(有)" },
  { id: "exp_13", code: 13, name: "13. 작업환경측정비", defaultNote: "전자세금계산서(有)" },
  { id: "exp_14", code: 14, name: "14. 부업장", defaultNote: "전자세금계산서(有)" },
  { id: "exp_15", code: 15, name: "15. 성실신고용역비", defaultNote: "" },
  { id: "exp_16", code: 16, name: "16. 개인결산조정료", defaultNote: "" }
];

// Standard 6 Products from 2607 Template
export const STANDARD_6_PRODUCTS = [
  { id: "prod_frt_lh", name: "9BQC FRT LH", defaultPrice: 1170, defaultQty: 21400 },
  { id: "prod_frt_rh", name: "9BQC FRT RH", defaultPrice: 1170, defaultQty: 21400 },
  { id: "prod_rr_pri_lh", name: "9BQC RR LH(PRI)", defaultPrice: 1530, defaultQty: 21480 },
  { id: "prod_rr_pri_rh", name: "9BQC RR RH(PRI)", defaultPrice: 1530, defaultQty: 21480 },
  { id: "prod_rr_tin_lh", name: "9BQC RR LH(TIN)", defaultPrice: 1610, defaultQty: 780 },
  { id: "prod_rr_tin_rh", name: "9BQC RR RH(TIN)", defaultPrice: 1610, defaultQty: 780 }
];

// Initial Store with 2607 Actual Data and 2608 default setup
export const getInitialSettlementStore = () => ({
  "2026-07": {
    yearMonth: "2026-07",
    sheetCode: "2607",
    settlementDate: "2026-07-31",
    status: "CONFIRMED",
    updatedAt: "2026-09-14 18:50",
    products: [
      { id: "p1", name: "9BQC FRT LH", unitPrice: 1170, qty: 21400, amount: 25038000, vat: 2503800, total: 27541800 },
      { id: "p2", name: "9BQC FRT RH", unitPrice: 1170, qty: 21400, amount: 25038000, vat: 2503800, total: 27541800 },
      { id: "p3", name: "9BQC RR LH(PRI)", unitPrice: 1530, qty: 21480, amount: 32864400, vat: 3286440, total: 36150840 },
      { id: "p4", name: "9BQC RR RH(PRI)", unitPrice: 1530, qty: 21480, amount: 32864400, vat: 3286440, total: 36150840 },
      { id: "p5", name: "9BQC RR LH(TIN)", unitPrice: 1610, qty: 780, amount: 1255800, vat: 125580, total: 1381380 },
      { id: "p6", name: "9BQC RR RH(TIN)", unitPrice: 1610, qty: 780, amount: 1255800, vat: 125580, total: 1381380 }
    ],
    expenses: [
      { id: "exp_1", category: "1. 인건비", amount: 91071530, note: "세전 월급(등록,미등록),교통비,식비지원포함(근태파일참조)" },
      { id: "exp_2", category: "2. 4대보험(사업주분)", amount: 6928900, note: "파일 참조" },
      { id: "exp_3", category: "3. 삼성화재외국인보험", amount: 2119600, note: "e-9 (12명) 근태파일 참조" },
      { id: "exp_4", category: "4. 비품", amount: 305730, note: "파일참조" },
      { id: "exp_5", category: "5. 식대(큰상웰빙푸드)", amount: 2981200, note: "전자세금계산서(有)" },
      { id: "exp_6", category: "6. 자동차(한울)", amount: 599500, note: "전자세금계산서(有)" },
      { id: "exp_7", category: "7. 통근차량", amount: 2348000, note: "전자세금계산서(有)" },
      { id: "exp_8", category: "8. 기장수수료", amount: 150000, note: "전자세금계산서(有)" },
      { id: "exp_9", category: "9. 인터넷통신비", amount: 73037, note: "전자세금계산서(有)" },
      { id: "exp_10", category: "10. 노무법인", amount: 200000, note: "전자세금계산서(有)" },
      { id: "exp_11", category: "11. 퇴직금", amount: 0, note: "" },
      { id: "exp_12", category: "12. 비닐", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_13", category: "13. 작업환경측정비", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_14", category: "14. 부업장", amount: 9145000, note: "전자세금계산서(有)" },
      { id: "exp_15", category: "15. 성실신고용역비", amount: 0, note: "" },
      { id: "exp_16", category: "16. 개인결산조정료", amount: 0, note: "" }
    ],
    totalQty: 87320,
    supplyAmount: 118316400,
    taxAmount: 11831640,
    totalWithTax: 130148040,
    totalExpense: 115922497,
    netSettlement: 14225543,
    attachments: []
  },
  "2026-08": {
    yearMonth: "2026-08",
    sheetCode: "2608",
    settlementDate: "2026-08-31",
    status: "CONFIRMED",
    updatedAt: "2026-09-16 08:30",
    products: [
      { id: "p1", name: "9BQC FRT LH", unitPrice: 1170, qty: 17800, amount: 20826000, vat: 2082600, total: 22908600 },
      { id: "p2", name: "9BQC FRT RH", unitPrice: 1170, qty: 17800, amount: 20826000, vat: 2082600, total: 22908600 },
      { id: "p3", name: "9BQC RR LH(PRI)", unitPrice: 1530, qty: 16560, amount: 25336800, vat: 2533680, total: 27870480 },
      { id: "p4", name: "9BQC RR RH(PRI)", unitPrice: 1530, qty: 16560, amount: 25336800, vat: 2533680, total: 27870480 },
      { id: "p5", name: "9BQC RR LH(TIN)", unitPrice: 1610, qty: 720, amount: 1159200, vat: 115920, total: 1275120 },
      { id: "p6", name: "9BQC RR RH(TIN)", unitPrice: 1610, qty: 780, amount: 1255800, vat: 125580, total: 1381380 }
    ],
    expenses: [
      { id: "exp_1", category: "1. 인건비", amount: 91071530, note: "세전 월급(등록,미등록),교통비,식비지원포함(근태파일참조)" },
      { id: "exp_2", category: "2. 4대보험(사업주분)", amount: 6928900, note: "파일 참조" },
      { id: "exp_3", category: "3. 삼성화재외국인보험", amount: 2119600, note: "e-9 (12명) 근태파일 참조" },
      { id: "exp_4", category: "4. 비품", amount: 305730, note: "파일참조" },
      { id: "exp_5", category: "5. 식대(큰상웰빙푸드)", amount: 2981200, note: "전자세금계산서(有)" },
      { id: "exp_6", category: "6. 자동차(한울)", amount: 599500, note: "전자세금계산서(有)" },
      { id: "exp_7", category: "7. 통근차량", amount: 2348000, note: "전자세금계산서(有)" },
      { id: "exp_8", category: "8. 기장수수료", amount: 150000, note: "전자세금계산서(有)" },
      { id: "exp_9", category: "9. 인터넷통신비", amount: 73037, note: "전자세금계산서(有)" },
      { id: "exp_10", category: "10. 노무법인", amount: 200000, note: "전자세금계산서(有)" },
      { id: "exp_11", category: "11. 퇴직금", amount: 0, note: "" },
      { id: "exp_12", category: "12. 비닐", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_13", category: "13. 작업환경측정비", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_14", category: "14. 부업장", amount: 9145000, note: "전자세금계산서(有)" },
      { id: "exp_15", category: "15. 성실신고용역비", amount: 0, note: "" },
      { id: "exp_16", category: "16. 개인결산조정료", amount: 0, note: "" }
    ],
    totalQty: 70220,
    supplyAmount: 94740600,
    taxAmount: 9474060,
    totalWithTax: 104214660,
    totalExpense: 115922497,
    netSettlement: -11707837,
    attachments: []
  },
  "2026-09": {
    yearMonth: "2026-09",
    sheetCode: "2609",
    settlementDate: "2026-09-30",
    status: "CONFIRMED",
    updatedAt: "2026-09-16 08:30",
    products: [
      { id: "p1", name: "9BQC FRT LH", unitPrice: 1170, qty: 4800, amount: 5616000, vat: 561600, total: 6177600 },
      { id: "p2", name: "9BQC FRT RH", unitPrice: 1170, qty: 4800, amount: 5616000, vat: 561600, total: 6177600 },
      { id: "p3", name: "9BQC RR LH(PRI)", unitPrice: 1530, qty: 3660, amount: 5599800, vat: 559980, total: 6159780 },
      { id: "p4", name: "9BQC RR RH(PRI)", unitPrice: 1530, qty: 3660, amount: 5599800, vat: 559980, total: 6159780 },
      { id: "p5", name: "9BQC RR LH(TIN)", unitPrice: 1610, qty: 120, amount: 193200, vat: 19320, total: 212520 },
      { id: "p6", name: "9BQC RR RH(TIN)", unitPrice: 1610, qty: 120, amount: 193200, vat: 19320, total: 212520 }
    ],
    expenses: [
      { id: "exp_1", category: "1. 인건비", amount: 91071530, note: "세전 월급(등록,미등록),교통비,식비지원포함(근태파일참조)" },
      { id: "exp_2", category: "2. 4대보험(사업주분)", amount: 6928900, note: "파일 참조" },
      { id: "exp_3", category: "3. 삼성화재외국인보험", amount: 2119600, note: "e-9 (12명) 근태파일 참조" },
      { id: "exp_4", category: "4. 비품", amount: 305730, note: "파일참조" },
      { id: "exp_5", category: "5. 식대(큰상웰빙푸드)", amount: 2981200, note: "전자세금계산서(有)" },
      { id: "exp_6", category: "6. 자동차(한울)", amount: 599500, note: "전자세금계산서(有)" },
      { id: "exp_7", category: "7. 통근차량", amount: 2348000, note: "전자세금계산서(有)" },
      { id: "exp_8", category: "8. 기장수수료", amount: 150000, note: "전자세금계산서(有)" },
      { id: "exp_9", category: "9. 인터넷통신비", amount: 73037, note: "전자세금계산서(有)" },
      { id: "exp_10", category: "10. 노무법인", amount: 200000, note: "전자세금계산서(有)" },
      { id: "exp_11", category: "11. 퇴직금", amount: 0, note: "" },
      { id: "exp_12", category: "12. 비닐", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_13", category: "13. 작업환경측정비", amount: 0, note: "전자세금계산서(有)" },
      { id: "exp_14", category: "14. 부업장", amount: 9145000, note: "전자세금계산서(有)" },
      { id: "exp_15", category: "15. 성실신고용역비", amount: 0, note: "" },
      { id: "exp_16", category: "16. 개인결산조정료", amount: 0, note: "" }
    ],
    totalQty: 17160,
    supplyAmount: 22818000,
    taxAmount: 2281800,
    totalWithTax: 25099800,
    totalExpense: 115922497,
    netSettlement: -90822697,
    attachments: []
  }
});

// Local Storage Load
export const getLocalSettlementStore = () => {
  const initial = getInitialSettlementStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        let shouldHeal = false;
        // Ensure 2026-07 has the 16 items if empty or outdated
        if (
          !parsed["2026-07"] ||
          !parsed["2026-07"].totalExpense ||
          parsed["2026-07"].totalExpense === 0 ||
          !parsed["2026-07"].expenses ||
          parsed["2026-07"].expenses.length < 16
        ) {
          parsed["2026-07"] = initial["2026-07"];
          shouldHeal = true;
        }
        // Ensure 2026-08 has the 16 items if empty, corrupted (> 500M) or 0
        if (
          !parsed["2026-08"] ||
          !parsed["2026-08"].totalExpense ||
          parsed["2026-08"].totalExpense === 0 ||
          parsed["2026-08"].totalExpense > 500000000 ||
          !parsed["2026-08"].expenses ||
          parsed["2026-08"].expenses.length < 16
        ) {
          parsed["2026-08"] = initial["2026-08"];
          shouldHeal = true;
        }
        // Ensure 2026-09 has the 16 items if corrupted (> 500M)
        if (
          !parsed["2026-09"] ||
          parsed["2026-09"].totalExpense > 500000000 ||
          !parsed["2026-09"].expenses ||
          parsed["2026-09"].expenses.length < 16
        ) {
          parsed["2026-09"] = initial["2026-09"];
          shouldHeal = true;
        }
        if (shouldHeal) {
          saveLocalSettlementStore(parsed);
        }
        return { ...initial, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to parse local settlement store:", e);
  }
  return initial;
};

// Local Storage Save & Event Dispatch (with safe quota handling)
export const saveLocalSettlementStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTLEMENT, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("hanul_settlement_updated", { detail: store }));
  } catch (e) {
    console.warn("Local storage quota warning, saving with optimized payload:", e);
    try {
      const sanitized = {};
      for (const k of Object.keys(store || {})) {
        const item = store[k];
        sanitized[k] = {
          ...item,
          attachments: (item.attachments || []).map(att => ({
            ...att,
            pages: (att.pages || []).map(p => ({ ...p, dataUrl: "" }))
          }))
        };
      }
      localStorage.setItem(STORAGE_KEY_SETTLEMENT, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent("hanul_settlement_updated", { detail: store }));
    } catch (e2) {
      console.error("Failed to save local settlement store:", e2);
    }
  }
};

// Get single month data
export const getHanulSettlementMonthData = (yearMonth = "2026-08") => {
  const store = getLocalSettlementStore();
  if (store[yearMonth]) return store[yearMonth];

  // If month doesn't exist, create a blank draft
  const ymCode = yearMonth.replace("-", "").slice(2);
  const newMonth = {
    yearMonth,
    sheetCode: ymCode,
    settlementDate: `${yearMonth}-28`,
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    products: STANDARD_6_PRODUCTS.map(p => ({
      id: p.id,
      name: p.name,
      unitPrice: p.defaultPrice,
      qty: 0,
      amount: 0,
      vat: 0,
      total: 0
    })),
    expenses: STANDARD_EXPENSE_CATEGORIES.map(c => ({
      id: c.id,
      category: c.name,
      amount: 0,
      note: c.defaultNote
    })),
    totalQty: 0,
    supplyAmount: 0,
    taxAmount: 0,
    totalWithTax: 0,
    totalExpense: 0,
    netSettlement: 0,
    attachments: []
  };

  store[yearMonth] = newMonth;
  saveLocalSettlementStore(store);
  return newMonth;
};

// Save Month Data (Local + Firestore + Cross-sync with Tax Invoice Store)
export const saveHanulSettlementMonthData = async (yearMonth, monthData) => {
  const store = getLocalSettlementStore();
  const updatedSettlement = {
    ...monthData,
    updatedAt: new Date().toLocaleString("ko-KR")
  };
  store[yearMonth] = updatedSettlement;
  saveLocalSettlementStore(store);

  // 🌟 Cross-sync: User requirement - Share Hanul Sales Amount & Deductions with Admin Hanul Tax Invoice View
  try {
    const taxStore = getLocalHanulStore();
    const currentTaxMonth = taxStore[yearMonth] || createDefaultHanulMonthData(yearMonth);
    const deductionTotal = Number(monthData.totalExpense) || 0;
    const salesAmt = deductionTotal > 0
      ? deductionTotal
      : (Number(monthData.supplyAmount) > 0
          ? Number(monthData.supplyAmount)
          : (Number(currentTaxMonth.prevMonthSales) || Number(currentTaxMonth.invoiceConfig?.invoiceAmount) || 0));

    taxStore[yearMonth] = {
      ...currentTaxMonth,
      prevMonthSales: salesAmt,
      settlementData: {
        yearMonth,
        expenses: monthData.expenses || [],
        totalExpense: Number(monthData.totalExpense) || 0,
        netSettlement: Number(monthData.netSettlement) || 0,
        status: monthData.status || "CONFIRMED",
        updatedAt: updatedSettlement.updatedAt
      },
      invoiceConfig: {
        ...(currentTaxMonth.invoiceConfig || {}),
        invoiceAmount: salesAmt,
        vatAmount: Math.round(salesAmt * 0.1),
        totalInvoiceAmount: Math.round(salesAmt * 1.1)
      },
      updatedAt: new Date().toISOString()
    };
    saveLocalHanulStore(taxStore);
  } catch (err) {
    console.warn("Cross-sync to tax invoice store error:", err);
  }

  // Firestore Sync - Settlement Master (Sanitize heavy attachments for ultra-fast sync)
  try {
    const rawMonthData = store[yearMonth] || {};
    const sanitizedMonthData = {
      ...rawMonthData,
      attachments: (rawMonthData.attachments || []).map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        uploadedAt: att.uploadedAt,
        summary: att.summary,
        pages: (att.pages || []).slice(0, 2).map(p => ({
          pageNumber: p.pageNumber,
          title: p.title,
          dataUrl: p.dataUrl && p.dataUrl.length < 50000 ? p.dataUrl : ""
        }))
      }))
    };
    const docRef = doc(db, ...FIRESTORE_PATH);
    await setDoc(docRef, { [yearMonth]: sanitizedMonthData }, { merge: true });
  } catch (e) {
    console.warn("Firestore sync warning (Settlement):", e);
  }

  // Firestore Sync - Tax Invoice Master
  try {
    const taxStore = getLocalHanulStore();
    const taxDocRef = doc(db, ...FIRESTORE_PATH_TAX);
    await setDoc(taxDocRef, { store: taxStore }, { merge: true });
  } catch (e) {
    console.warn("Firestore sync warning (Tax Invoice from Settlement):", e);
  }
};

// Real-time Subscription
export const subscribeHanulSettlementStore = (callback) => {
  callback(getLocalSettlementStore());

  const handleLocal = (e) => {
    callback(e.detail || getLocalSettlementStore());
  };
  window.addEventListener("hanul_settlement_updated", handleLocal);

  let unsubFirestore = () => {};
  try {
    const docRef = doc(db, ...FIRESTORE_PATH);
    unsubFirestore = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const fireData = snap.data();
        const currentLocal = getLocalSettlementStore();
        const merged = { ...currentLocal, ...fireData };
        saveLocalSettlementStore(merged);
        callback(merged);
      }
    }, (err) => console.warn("Firestore listener error (Settlement):", err));
  } catch (e) {
    console.warn("Firestore subscribe error (Settlement):", e);
  }

  return () => {
    window.removeEventListener("hanul_settlement_updated", handleLocal);
    unsubFirestore();
  };
};
