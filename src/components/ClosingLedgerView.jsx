import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Building2,
  Layers,
  TrendingUp,
  DollarSign,
  Search,
  ChevronRight,
  ArrowLeft,
  Zap,
  Filter,
  X,
  FileText,
  Files,
  ArrowUpRight,
  Check,
  HelpCircle,
  Table,
  Calculator,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Landmark,
  Coins
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { parseHometaxExcel, CATEGORY_RULES, classifyTaxInvoiceItem } from "../services/taxInvoiceParser";
import { parseManualClosingExcel } from "../services/manualLedgerParser";
import detailedClosingMaster from "../data/detailedClosingLedgerData.json";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

const STORAGE_KEY = "monthly_4_entity_closing_ledger_v5_integrated";
const FIRESTORE_CLOSING_PATH = ["system_store", "monthly_closing_master"];

const GROUPS = [
  { id: "all", label: "전체 16개 과목" },
  { id: "제조 직접 원가", label: "🏭 제조 직접 원가 (4)" },
  { id: "인건비 & 공과금", label: "👥 인건비 & 공과금 (3)" },
  { id: "공장 유틸리티 & 설비", label: "⚡ 유틸리티 & 설비 (5)" },
  { id: "물류 & 운영 경비", label: "🚚 물류 & 운영경비 (4)" }
];

// Build empty 16 categories default structure
const buildDefaultCategories = () => {
  return Object.values(CATEGORY_RULES).map((cat) => ({
    id: cat.id,
    name: cat.name,
    group: cat.group,
    items: []
  }));
};

// Default empty manual ledger structure matching user's exact table
const buildDefaultManualLedger = () => ({
  // 1. 노무비 (4개사 x 4개 표준 항목)
  labor: {
    oryuk_reg: 0,
    oryuk_unreg: 0,
    oryuk_foreign: 0,
    oryuk_expense: 0,
    ogong_reg: 0,
    ogong_unreg: 0,
    ogong_foreign: 0,
    ogong_expense: 0,
    joyoung_corp_reg: 0,
    joyoung_corp_unreg: 0,
    joyoung_corp_foreign: 0,
    joyoung_corp_expense: 0,
    joyoung_ind_reg: 0,
    joyoung_ind_unreg: 0,
    joyoung_ind_foreign: 0,
    joyoung_ind_expense: 0
  },
  // 2. 대출이자
  loanInterest: {
    oryuk_9600: 0,
    oryuk_7501: 0,
    oryuk_0701: 0,
    oryuk_6002: 0,
    oryuk_1302: 0,
    oryuk_0109: 0,
    oryuk_2400: 0,
    oryuk_dgb: 0,
    oryuk_minus: 0,
    oryuk_sangseung: 0,
    oryuk_b2b: 0,
    oryuk_hwaseung: 0,
    joyoung_corp_25억: 0,
    joyoung_corp_3억29: 0,
    joyoung_corp_2억: 0,
    joyoung_ind_5억: 0,
    joyoung_ind_2억: 0,
    joyoung_ind_1억: 0,
    joyoung_ind_samsung: 0,
    joyoung_ind_kb: 0,
    joyoung_ind_dgb: 0,
    joyoung_ind_noran: 0,
    ogong_noran: 0
  },
  // 3. 카드
  cards: {
    oryuk_bc: 0,
    joyoung_bc: 0,
    ogong_kb: 0,
    choi_kb: 0,
    samsung: 0,
    hyundai: 0,
    woori: 0,
    shinhan: 0
  },
  // 4. 공제/보험
  insurance: {
    oryuk_kyobo: 0,
    oryuk_dgb: 0,
    joyoung_corp_kyobo: 0,
    joyoung_corp_hana: 0,
    ogong_noran: 0,
    ogong_kyobo: 0,
    joyoung_ind_kyobo: 0,
    joyoung_ind_noran: 0,
    choi_dgb: 0
  },
  // 5. 공과금
  publicCharges: {
    oryuk_social: 0,
    oryuk_income: 0,
    oryuk_local: 0,
    oryuk_corp: 0,
    oryuk_vat: 0,
    joyoung_corp_social: 0,
    joyoung_corp_income: 0,
    joyoung_corp_local: 0,
    joyoung_corp_vat: 0,
    joyoung_ind_social: 0,
    joyoung_ind_income: 0,
    joyoung_ind_local: 0,
    joyoung_ind_vat: 0,
    ogong_social: 0,
    ogong_income: 0,
    ogong_local: 0,
    ogong_vat: 0,
    park_social: 0
  },
  // 6. 기타잡비 / 수수료 / 알바비 / 기사식대
  misc: {
    ebill_sedong: 0,
    ebill_hwaseung: 0,
    sms_woori: 0,
    part_cys: 0,
    part_khw: 0,
    part_lns: 0,
    part_lsh: 0,
    meal_yongjin: 0,
    meal_hanul: 0,
    meal_joyoung1: 0,
    meal_joyoung2: 0
  }
});

export const ClosingLedgerView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();
  const fileInputRef = useRef(null);
  const manualFileInputRef = useRef(null);

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Persistent store keyed by month
  const [closingStore, setClosingStore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      "2026-07": {
        uploadedEntities: {},
        categories: detailedClosingMaster["2026-07"]?.categories || buildDefaultCategories(),
        manualLedger: buildDefaultManualLedger()
      },
      "2026-08": {
        uploadedEntities: {},
        categories: buildDefaultCategories(),
        manualLedger: buildDefaultManualLedger()
      }
    };
  });

  // Active view tab: 'categories' (세금계산서 16개 과목) vs 'manual_ledger' (노무비/이자/공과금 수기 결산표)
  const [viewMode, setViewMode] = useState("categories");

  // Current Month's active state
  const currentMonthStore = closingStore[selectedMonth] || {
    uploadedEntities: {},
    categories: buildDefaultCategories(),
    manualLedger: buildDefaultManualLedger()
  };

  const [uploadedEntities, setUploadedEntities] = useState(currentMonthStore.uploadedEntities || {});
  const [categories, setCategories] = useState(currentMonthStore.categories || buildDefaultCategories());
  const [manualLedger, setManualLedger] = useState(currentMonthStore.manualLedger || buildDefaultManualLedger());
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedCategoryDetailId, setSelectedCategoryDetailId] = useState(null);
  const [manualSectionFilter, setManualSectionFilter] = useState("all"); // 'all' | 'labor' | 'loan' | 'card' | 'insurance' | 'tax' | 'misc'
  const [searchTerm, setSearchTerm] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [isDraggingManual, setIsDraggingManual] = useState(false);
  const [isDraggingTax, setIsDraggingTax] = useState(false);
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [isProcessingTax, setIsProcessingTax] = useState(false);

  // Sync state strictly when selectedMonth changes
  useEffect(() => {
    const monthData = closingStore[selectedMonth] || {
      uploadedEntities: {},
      categories: buildDefaultCategories(),
      manualLedger: buildDefaultManualLedger()
    };
    setUploadedEntities(monthData.uploadedEntities || {});
    setCategories(monthData.categories || buildDefaultCategories());
    setManualLedger(monthData.manualLedger || buildDefaultManualLedger());
    setSelectedCategoryDetailId(null);
  }, [selectedMonth, closingStore]);

  // Real-time Firestore Cloud Sync for Closing Ledger
  useEffect(() => {
    try {
      const docRef = doc(db, ...FIRESTORE_CLOSING_PATH);
      getDoc(docRef).then((snap) => {
        if (snap.exists() && snap.data()?.store) {
          const remoteStore = snap.data().store;
          setClosingStore((prev) => {
            const merged = { ...prev, ...remoteStore };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }).catch((e) => console.warn("Firestore closing get warning:", e.message));

      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.store) {
          const remoteStore = docSnap.data().store;
          setClosingStore((prev) => {
            const merged = { ...prev, ...remoteStore };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore closing subscription warning:", e);
    }
  }, []);

  // Grand Totals Calculation for Categories
  const totalSupplyAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.supplyAmt) || 0), 0);
  }, 0);

  const totalTaxAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.taxAmt) || 0), 0);
  }, 0);

  const totalClosingAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))) || 0), 0);
  }, 0);

  // Manual Ledger Subtotals Calculation
  const laborSubtotals = useMemo(() => {
    const l = manualLedger.labor || {};
    const oryuk = (Number(l.oryuk_reg) || 0) + (Number(l.oryuk_unreg) || 0) + (Number(l.oryuk_foreign) || 0) + (Number(l.oryuk_expense) || 0);
    const ogong = (Number(l.ogong_reg) || 0) + (Number(l.ogong_unreg) || 0) + (Number(l.ogong_foreign) || 0) + (Number(l.ogong_expense) || 0);
    const joyoungCorp = (Number(l.joyoung_corp_reg) || 0) + (Number(l.joyoung_corp_unreg) || 0) + (Number(l.joyoung_corp_foreign) || 0) + (Number(l.joyoung_corp_expense) || 0);
    const joyoungInd = (Number(l.joyoung_ind_reg) || 0) + (Number(l.joyoung_ind_unreg) || 0) + (Number(l.joyoung_ind_foreign) || 0) + (Number(l.joyoung_ind_expense) || 0);
    return { oryuk, ogong, joyoungCorp, joyoungInd, total: oryuk + ogong + joyoungCorp + joyoungInd };
  }, [manualLedger.labor]);

  const loanInterestTotal = useMemo(() => {
    const li = manualLedger.loanInterest || {};
    return Object.values(li).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [manualLedger.loanInterest]);

  const cardsTotal = useMemo(() => {
    const c = manualLedger.cards || {};
    return Object.values(c).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [manualLedger.cards]);

  const insuranceTotal = useMemo(() => {
    const ins = manualLedger.insurance || {};
    return Object.values(ins).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [manualLedger.insurance]);

  const publicChargesTotal = useMemo(() => {
    const pc = manualLedger.publicCharges || {};
    return Object.values(pc).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [manualLedger.publicCharges]);

  // Normalized Misc Items List (Supports full inline editing, adding, and deleting)
  const miscItemsList = useMemo(() => {
    if (Array.isArray(manualLedger.miscItems) && manualLedger.miscItems.length > 0) {
      return manualLedger.miscItems;
    }
    const m = manualLedger.misc || {};
    return [
      { id: "ebill_sedong", category: "전자어음수수료", name: "세동", amount: Number(m.ebill_sedong) || 0, memo: "어음수수료" },
      { id: "ebill_hwaseung", category: "전자어음수수료", name: "화승코퍼레이션", amount: Number(m.ebill_hwaseung) || 0, memo: "어음수수료" },
      { id: "sms_woori", category: "SMS수수료", name: "우리은행", amount: Number(m.sms_woori) || 0, memo: "통지수수료" },
      { id: "part_cys", category: "알바비", name: "최영식", amount: Number(m.part_cys) || 0, memo: "단기인건비" },
      { id: "part_khw", category: "알바비", name: "김현우", amount: Number(m.part_khw) || 0, memo: "단기인건비" },
      { id: "part_lns", category: "알바비", name: "이남성", amount: Number(m.part_lns) || 0, memo: "단기인건비" },
      { id: "part_lsh", category: "알바비", name: "이석현", amount: Number(m.part_lsh) || 0, memo: "단기인건비" },
      { id: "meal_yongjin", category: "기사식대", name: "용진운수", amount: Number(m.meal_yongjin) || 0, memo: "기사식대" },
      { id: "meal_hanul", category: "기사식대", name: "한울", amount: Number(m.meal_hanul) || 0, memo: "기사식대" },
      { id: "meal_joyoung1", category: "기사식대", name: "조영1", amount: Number(m.meal_joyoung1) || 0, memo: "기사식대" },
      { id: "meal_joyoung2", category: "기사식대", name: "조영2", amount: Number(m.meal_joyoung2) || 0, memo: "기사식대" }
    ];
  }, [manualLedger.misc, manualLedger.miscItems]);

  const miscTotal = useMemo(() => {
    return miscItemsList.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [miscItemsList]);

  const grandManualTotal = laborSubtotals.total + loanInterestTotal + cardsTotal + insuranceTotal + publicChargesTotal + miscTotal;

  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Active Category for Drilldown
  const activeCategory = categories.find((c) => c.id === selectedCategoryDetailId);

  // Helper: Persist and update state (with Firestore Cloud Sync so manual edits take top priority)
  const persistMonthData = (newCategories, newUploadedEntities, newManualLedger = manualLedger) => {
    setCategories(newCategories);
    setUploadedEntities(newUploadedEntities);
    setManualLedger(newManualLedger);

    const updatedStore = {
      ...closingStore,
      [selectedMonth]: {
        month: selectedMonth,
        uploadedEntities: newUploadedEntities,
        categories: newCategories,
        manualLedger: newManualLedger
      }
    };
    setClosingStore(updatedStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));

    try {
      const docRef = doc(db, ...FIRESTORE_CLOSING_PATH);
      setDoc(docRef, { store: updatedStore, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Firestore closing master sync warning:", e);
    }
  };

  // Helper: Update manual ledger field
  const handleManualLedgerChange = (section, key, value) => {
    const num = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    const updated = {
      ...manualLedger,
      [section]: {
        ...manualLedger[section],
        [key]: num
      }
    };
    persistMonthData(categories, uploadedEntities, updated);
  };

  // Helper: Modify Misc items directly (category, name, amount, memo)
  const handleMiscItemChange = (itemId, field, value) => {
    const updatedList = miscItemsList.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: field === "amount" ? (Number(String(value).replace(/[^0-9.-]+/g, "")) || 0) : value
        };
      }
      return item;
    });

    const updatedManual = {
      ...manualLedger,
      miscItems: updatedList,
      misc: {
        ...(manualLedger.misc || {}),
        [itemId]: field === "amount" ? (Number(String(value).replace(/[^0-9.-]+/g, "")) || 0) : manualLedger.misc?.[itemId]
      }
    };
    persistMonthData(categories, uploadedEntities, updatedManual);
  };

  const handleAddMiscItem = () => {
    const newItem = {
      id: "misc_" + Date.now(),
      category: "기타잡비",
      name: "새 항목",
      amount: 0,
      memo: "직접입력"
    };
    const updatedList = [...miscItemsList, newItem];
    const updatedManual = {
      ...manualLedger,
      miscItems: updatedList
    };
    persistMonthData(categories, uploadedEntities, updatedManual);
  };

  const handleDeleteMiscItem = (itemId) => {
    const updatedList = miscItemsList.filter((item) => item.id !== itemId);
    const updatedManual = {
      ...manualLedger,
      miscItems: updatedList
    };
    persistMonthData(categories, uploadedEntities, updatedManual);
  };

  // Helper: Parse single tax invoice file buffer
  const parseTaxInvoiceFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rawRows || rawRows.length < 5) {
      throw new Error(`[${file.name}] 유효한 세금계산서 파일 내용이 없습니다.`);
    }

    const fileName = file.name || "";
    let detectedEntityKey = "entity_" + Math.random().toString(36).substring(2, 7);
    let detectedEntityName = fileName.replace(/\.[^/.]+$/, "");

    if (fileName.includes("오륙") && !fileName.includes("공사")) {
      detectedEntityKey = "oryuk_corp";
      detectedEntityName = "(주)오륙";
    } else if (fileName.includes("조영산업") && fileName.includes("주")) {
      detectedEntityKey = "joyoung_corp";
      detectedEntityName = "(주)조영산업";
    } else if (fileName.includes("오륙공사")) {
      detectedEntityKey = "oryuk_gongsa";
      detectedEntityName = "오륙공사";
    } else if (fileName.includes("조영산업")) {
      detectedEntityKey = "joyoung_ind";
      detectedEntityName = "조영산업";
    } else if (fileName.includes("화승")) {
      detectedEntityKey = "hwaseung";
      detectedEntityName = "화승알앤에이/소재";
    }

    let startRow = 6;
    let vendorCol = 6;
    let itemCol = 26;
    let supplyCol = 15;
    let taxCol = 16;
    let totalCol = 14;
    let dateCol = 0;
    let memoCol = 32;

    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const rowStr = JSON.stringify(rawRows[i] || []);
      if (rowStr.includes("공급자") || rowStr.includes("상호") || rowStr.includes("거래처")) {
        startRow = i + 1;
        rawRows[i].forEach((colVal, colIdx) => {
          const str = String(colVal || "");
          if (str.includes("상호") || str.includes("공급자") || str.includes("거래처")) vendorCol = colIdx;
          if (str.includes("품목") || str.includes("품명") || str.includes("품목명")) itemCol = colIdx;
          if (str.includes("공급가액") || str.includes("공급가")) supplyCol = colIdx;
          if (str.includes("세액") || str.includes("부가세")) taxCol = colIdx;
          if (str.includes("합계금액") || str.includes("합계")) totalCol = colIdx;
          if (str.includes("작성일자") || str.includes("발행일") || str.includes("일자")) dateCol = colIdx;
          if (str.includes("비고") || str.includes("메모")) memoCol = colIdx;
        });
        break;
      }
    }

    const items = [];
    let totalSupply = 0;
    let totalTax = 0;
    let totalAmount = 0;

    for (let r = startRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || (!row[vendorCol] && !row[supplyCol])) continue;

      const vendor = String(row[vendorCol] || "").trim();
      if (!vendor || vendor.includes("합계") || vendor.includes("총계")) continue;

      const item = String(row[itemCol] || row[11] || "물품대").trim();
      const supplyAmt = Number(String(row[supplyCol] || 0).replace(/,/g, "")) || 0;
      const taxAmt = Number(String(row[taxCol] || 0).replace(/,/g, "")) || Math.round(supplyAmt * 0.1);
      const rowTotal = Number(String(row[totalCol] || 0).replace(/,/g, "")) || (supplyAmt + taxAmt);
      const writeDate = String(row[dateCol] || "").trim();
      const memo = String(row[memoCol] || "").trim();

      const categoryId = classifyTaxInvoiceItem(vendor, item);

      totalSupply += supplyAmt;
      totalTax += taxAmt;
      totalAmount += rowTotal;

      items.push({
        id: `${detectedEntityKey}_${r}_${Date.now()}_${Math.random()}`,
        entityKey: detectedEntityKey,
        sourceEntity: detectedEntityName,
        fileName: file.name,
        writeDate,
        vendor,
        item,
        supplyAmt,
        taxAmt,
        totalAmt: rowTotal,
        memo: memo || `${detectedEntityName} | ${writeDate}`,
        categoryId
      });
    }

    return {
      entityKey: detectedEntityKey,
      entityName: detectedEntityName,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
      itemCount: items.length,
      totalSupply,
      totalTax,
      totalAmount,
      items,
      uploadedAt: new Date().toLocaleTimeString()
    };
  };

  // 1. MANUAL CLOSING LEDGER (노무비 및 제세공과금 통합관리대장) UPLOAD HANDLER
  const handleManualLedgerUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessingManual(true);

    try {
      const buffer = await file.arrayBuffer();
      const { manualLedger: parsedManual, extractedCount } = parseManualClosingExcel(buffer);

      if (extractedCount === 0) {
        throw new Error("유효한 노무비 또는 수기 결산 항목을 찾을 수 없습니다. 통합관리대장 엑셀 파일(.xlsx)을 확인해주세요.");
      }

      // Merge parsed numbers into current manualLedger
      const updatedManualLedger = {
        labor: { ...manualLedger.labor, ...parsedManual.labor },
        loanInterest: { ...manualLedger.loanInterest, ...parsedManual.loanInterest },
        cards: { ...manualLedger.cards, ...parsedManual.cards },
        insurance: { ...manualLedger.insurance, ...parsedManual.insurance },
        publicCharges: { ...manualLedger.publicCharges, ...parsedManual.publicCharges },
        misc: { ...manualLedger.misc, ...parsedManual.misc }
      };

      persistMonthData(categories, uploadedEntities, updatedManualLedger);
      setViewMode("manual_ledger");
      setSaveSuccessMessage(`✓ [노무비 및 제세공과금 일괄업로드 완료] [${file.name}] 파일에서 총 ${extractedCount}개 항목(노무비 16개 과목, 대출이자, 카드, 공과금)이 각 과목에 자동 반영되었습니다!`);
      setTimeout(() => setSaveSuccessMessage(""), 7000);
    } catch (err) {
      alert("노무비 및 제세공과금 일괄 업로드 오류: " + err.message);
    } finally {
      setIsProcessingManual(false);
      if (manualFileInputRef.current) manualFileInputRef.current.value = "";
    }
  };

  // 2. MULTI-FILE TAX INVOICE UPLOAD HANDLER
  const handleBatchFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    // If manual ledger file was accidentally dropped here
    const firstFile = fileList[0];
    const fileName = (firstFile?.name || "").toLowerCase();
    if (fileName.includes("통합관리대장") || (fileName.includes("노무비") && fileName.includes(".xls"))) {
      return handleManualLedgerUpload(fileList);
    }

    setIsProcessingTax(true);

    try {
      const parsedResults = [];
      for (const file of fileList) {
        try {
          const res = await parseTaxInvoiceFile(file);
          parsedResults.push(res);
        } catch (err) {
          console.warn("File parse warning:", err.message);
        }
      }

      if (parsedResults.length === 0) {
        throw new Error("유효하게 파싱된 세금계산서 파일이 없습니다.");
      }

      const newEntities = { ...uploadedEntities };
      let allNewItems = [];

      parsedResults.forEach((res) => {
        newEntities[res.entityKey] = {
          fileName: res.fileName,
          fileSize: res.fileSize,
          entityLabel: res.entityName,
          itemCount: res.itemCount,
          totalSupply: res.totalSupply,
          totalTax: res.totalTax,
          totalAmount: res.totalAmount,
          uploadedAt: res.uploadedAt
        };
        allNewItems = [...allNewItems, ...res.items];
      });

      const newCategories = categories.map((cat) => {
        const touchedEntityKeys = parsedResults.map((r) => r.entityKey);
        const keptItems = cat.items.filter((it) => !touchedEntityKeys.includes(it.entityKey));
        const addedItems = allNewItems.filter((it) => it.categoryId === cat.id);
        return {
          ...cat,
          items: [...keptItems, ...addedItems]
        };
      });

      persistMonthData(newCategories, newEntities);
      setSaveSuccessMessage(`${parsedResults.length}개 세금계산서 파일(총 ${allNewItems.length}건)이 16대 계정과목으로 자동 분류되어 반영되었습니다!`);
      setTimeout(() => setSaveSuccessMessage(""), 6000);
    } catch (err) {
      alert("매입세금계산서 일괄 업로드 오류: " + err.message);
    } finally {
      setIsProcessingTax(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag & Drop Handlers for Manual Ledger Box
  const handleManualDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingManual(true);
  };

  const handleManualDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingManual(false);
  };

  const handleManualDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingManual(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleManualLedgerUpload(e.dataTransfer.files);
    }
  };

  // Drag & Drop Handlers for Tax Invoice Box
  const handleTaxDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTax(true);
  };

  const handleTaxDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTax(false);
  };

  const handleTaxDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTax(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBatchFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteUploadedFile = (entityKey, entityLabel) => {
    if (!window.confirm(`[${entityLabel}]의 업로드된 세금계산서 데이터를 삭제하시겠습니까?`)) return;

    const newEntities = { ...uploadedEntities };
    delete newEntities[entityKey];

    const newCategories = categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => it.entityKey !== entityKey)
    }));

    persistMonthData(newCategories, newEntities);
    setSaveSuccessMessage(`[${entityLabel}] 세금계산서 데이터가 삭제되었습니다.`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  const handleItemChange = (catId, itemId, field, value) => {
    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;

      const updatedItems = cat.items.map((item) => {
        if (item.id !== itemId) return item;

        if (field === "supplyAmt") {
          const supply = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
          const tax = item.taxAmt > 0 ? Math.round(supply * 0.1) : 0;
          return {
            ...item,
            supplyAmt: supply,
            taxAmt: tax,
            totalAmt: supply + tax
          };
        } else if (field === "taxAmt") {
          const tax = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
          return {
            ...item,
            taxAmt: tax,
            totalAmt: Number(item.supplyAmt || 0) + tax
          };
        } else {
          return {
            ...item,
            [field]: value
          };
        }
      });

      return {
        ...cat,
        items: updatedItems
      };
    });

    persistMonthData(newCategories, uploadedEntities);
  };

  const handleMoveItemCategory = (currentCatId, itemId, targetCatId) => {
    if (currentCatId === targetCatId) return;

    let movedItem = null;
    const newCategories = categories.map((cat) => {
      if (cat.id === currentCatId) {
        const remaining = cat.items.filter((it) => {
          if (it.id === itemId) {
            movedItem = { ...it, categoryId: targetCatId };
            return false;
          }
          return true;
        });
        return { ...cat, items: remaining };
      }
      return cat;
    });

    if (movedItem) {
      const finalCategories = newCategories.map((cat) => {
        if (cat.id === targetCatId) {
          return { ...cat, items: [...cat.items, movedItem] };
        }
        return cat;
      });
      persistMonthData(finalCategories, uploadedEntities);
    }
  };

  const handleDeleteItem = (catId, itemId) => {
    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.filter((it) => it.id !== itemId)
      };
    });
    persistMonthData(newCategories, uploadedEntities);
  };

  const handleAddManualItem = (catId) => {
    const newItem = {
      id: `manual_${Date.now()}`,
      entityKey: "manual",
      sourceEntity: "수기입력",
      writeDate: new Date().toISOString().split("T")[0],
      vendor: "신규 거래처",
      item: "품목명 입력",
      supplyAmt: 0,
      taxAmt: 0,
      totalAmt: 0,
      memo: "수기등록",
      categoryId: catId
    };

    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return { ...cat, items: [...cat.items, newItem] };
    });

    persistMonthData(newCategories, uploadedEntities);
  };

  const handleSave = () => {
    persistMonthData(categories, uploadedEntities, manualLedger);
    setSaveSuccessMessage(`${monthTitle} 매입DATA 및 수기 결산 장부가 안전하게 저장되었습니다!`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  const handleResetMonth = () => {
    if (!window.confirm(`${monthTitle}의 매입DATA 및 수기 장부를 모두 초기화하시겠습니까?`)) return;
    persistMonthData(buildDefaultCategories(), {}, buildDefaultManualLedger());
    setSaveSuccessMessage(`${monthTitle} 매입DATA가 초기화되었습니다.`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  // Direct download link
  const handleExportExcel = () => {
    const link = document.createElement("a");
    link.href = "/오륙_조영_매입DATA_통합관리대장_2026년08월.xlsx";
    link.download = `오륙_조영_매입DATA_통합관리대장_${monthTitle}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCategories = categories.filter((cat) => {
    const matchGroup = selectedGroup === "all" || cat.group === selectedGroup;
    if (!matchGroup) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const matchCatName = cat.name.toLowerCase().includes(term);
    const matchItems = cat.items.some(
      (it) =>
        (it.vendor && it.vendor.toLowerCase().includes(term)) ||
        (it.item && it.item.toLowerCase().includes(term)) ||
        (it.memo && it.memo.toLowerCase().includes(term))
    );
    return matchCatName || matchItems;
  });

  const uploadedFilesList = Object.entries(uploadedEntities);

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: 매입DATA 업로드 ZONE (세금계산서 vs 노무비/제세공과금 일괄업로드) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 1: 매입DATA 2대 일괄업로드 드래그 존 (노무비/제세공과금 & 세금계산서) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Section Header & Global Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>매입DATA 엑셀 일괄 업로드 관리</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              통합관리대장 또는 홈택스 세금계산서 엑셀 파일을 각각의 드래그 영역에 올려놓으세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleResetMonth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
              title="현재 월 데이터 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>통합관리대장 양식 다운로드</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>저장</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleBatchFiles(e.target.files)}
              className="hidden"
            />
            <input
              ref={manualFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleManualLedgerUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* 2대 Drag & Drop 영역 (좌측: 노무비 및 제세공과금 / 우측: 매입세금계산서) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 드래그 영역 1: 노무비 및 제세공과금 일괄업로드 */}
          <div
            onDragOver={handleManualDragOver}
            onDragLeave={handleManualDragLeave}
            onDrop={handleManualDrop}
            onClick={() => manualFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[220px] ${
              isDraggingManual
                ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 scale-[1.01] shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                : "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 hover:border-emerald-400"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300">
                통합관리대장 엑셀
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                4개사 노무비 · 공과금 자동반영
              </span>
            </div>

            {isProcessingManual ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  통합관리대장 분석 및 노무비·공과금 자동 입력 중...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 my-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    노무비 및 제세공과금 일괄업로드
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                    오륙_조영_매입DATA_통합관리대장 엑셀 파일을 이곳에 드래그하여 올려놓으세요
                  </p>
                </div>
              </div>
            )}

            <div className="w-full pt-1 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-50 transition-colors">
                <Files className="w-3.5 h-3.5 text-emerald-600" />
                <span>통합관리대장 파일 선택</span>
              </span>
            </div>
          </div>

          {/* 드래그 영역 2: 매입세금계산서 일괄업로드 */}
          <div
            onDragOver={handleTaxDragOver}
            onDragLeave={handleTaxDragLeave}
            onDrop={handleTaxDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[220px] ${
              isDraggingTax
                ? "border-blue-500 bg-blue-50/90 dark:bg-blue-950/50 scale-[1.01] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                : "border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300">
                홈택스 전자세금계산서
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                16대 계정과목 자동분류
              </span>
            </div>

            {isProcessingTax ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  세금계산서 파일 분석 및 16대 계정과목 자동 분류 중...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 my-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    매입세금계산서 일괄업로드
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                    홈택스 매입전자세금계산서 엑셀 다중 파일을 이곳에 드래그하여 올려놓으세요
                  </p>
                </div>
              </div>
            )}

            <div className="w-full pt-1 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition-colors">
                <Files className="w-3.5 h-3.5 text-blue-500" />
                <span>세금계산서 파일 선택</span>
              </span>
            </div>
          </div>
        </div>

        {/* Uploaded Files Status Grid */}
        {uploadedFilesList.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
              <span>현재 업로드된 세금계산서 파일 ({uploadedFilesList.length}개)</span>
              <span>총 {categories.reduce((s, c) => s + c.items.length, 0)}건 파싱 완료</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {uploadedFilesList.map(([key, fileInfo]) => (
                <div
                  key={key}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {fileInfo.entityLabel || fileInfo.fileName}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {fileInfo.itemCount}건 • {formatAmount(fileInfo.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUploadedFile(key, fileInfo.entityLabel || fileInfo.fileName)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                    title="파일 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: VIEW SWITCHER TABS & SUMMARY KPIs */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Main Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 p-1 w-fit shadow-inner">
          <button
            onClick={() => setViewMode("categories")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              viewMode === "categories"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>16대 계정과목 매입 결산</span>
          </button>
          <button
            onClick={() => setViewMode("manual_ledger")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              viewMode === "manual_ledger"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>노무비 · 이자 · 공과금 수기 결산표</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">
            {viewMode === "categories" ? "세금계산서 총합계" : "수기 장부 총합계"}
          </span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">
            {formatAmount(viewMode === "categories" ? totalClosingAmount : grandManualTotal)}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3-A: VIEW MODE 1 - 16 ACCOUNTING CATEGORIES */}
      {/* ========================================================================= */}
      {viewMode === "categories" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Controls: Group Selector & Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {GROUPS.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedGroup === grp.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="계정과목, 거래처, 품목 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 16 Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => {
              const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
              const share = totalClosingAmount > 0 ? ((catTotal / totalClosingAmount) * 100).toFixed(1) : "0.0";
              const isSelected = selectedCategoryDetailId === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryDetailId(isSelected ? null : cat.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cat.group}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {cat.items.length}건
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                      {cat.name}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">합계금액</span>
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {formatAmount(catTotal)}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {share}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Category Drilldown Table */}
          {activeCategory && (
            <div className="mt-8 border border-blue-200 dark:border-blue-800/60 rounded-3xl bg-blue-50/20 dark:bg-blue-950/20 p-6 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-blue-200/60 dark:border-blue-800/40">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-8 bg-blue-600 rounded-full"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">
                        {activeCategory.name} 세부 내역 장부
                      </h3>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        총 {activeCategory.items.length}건
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      금액 수정, 거래처명 변경, 과목 재배정 및 행 추가/삭제가 가능합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddManualItem(activeCategory.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 항목 추가</span>
                  </button>
                  <button
                    onClick={() => setSelectedCategoryDetailId(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drilldown Table */}
              <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-12 text-center">NO</th>
                      <th className="py-2.5 px-3 font-semibold">출처/회사</th>
                      <th className="py-2.5 px-3 font-semibold">거래처명</th>
                      <th className="py-2.5 px-3 font-semibold">품목/내용</th>
                      <th className="py-2.5 px-3 font-semibold text-right">공급가액</th>
                      <th className="py-2.5 px-3 font-semibold text-right">세액</th>
                      <th className="py-2.5 px-3 font-semibold text-right">합계금액</th>
                      <th className="py-2.5 px-3 font-semibold">과목 재배정</th>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeCategory.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.sourceEntity || "세금계산서"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.vendor || ""}
                            onChange={(e) => handleItemChange(activeCategory.id, item.id, "vendor", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-0.5 font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.item || ""}
                            onChange={(e) => handleItemChange(activeCategory.id, item.id, "item", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="text"
                            value={Number(item.supplyAmt || 0).toLocaleString()}
                            onChange={(e) => handleItemChange(activeCategory.id, item.id, "supplyAmt", e.target.value)}
                            className="w-28 bg-transparent text-right border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-0.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="text"
                            value={Number(item.taxAmt || 0).toLocaleString()}
                            onChange={(e) => handleItemChange(activeCategory.id, item.id, "taxAmt", e.target.value)}
                            className="w-24 bg-transparent text-right border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-0.5 font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                          ₩{Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={activeCategory.id}
                            onChange={(e) => handleMoveItemCategory(activeCategory.id, item.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold py-1 px-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleDeleteItem(activeCategory.id, item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3-B: VIEW MODE 2 - USER'S EXACT MANUAL LEDGER TABLE */}
      {/* ========================================================================= */}
      {viewMode === "manual_ledger" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Header & Subtotal Overview */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>노무비 · 대출이자 · 제세공과금 수기 결산표</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                  수정 시 즉시 자동 저장 & 우선 반영
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                파일 업로드 시 자동 입력되며, 표에서 직접 금액이나 항목을 수정하면 실시간으로 최우선 반영 및 클라우드 저장됩니다.
              </p>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0 shadow-sm">
              <span className="text-xs text-slate-400 font-bold">수기 결산 총합계:</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {formatAmount(grandManualTotal)}
              </span>
            </div>
          </div>

          {/* Top 6 KPI Cards Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: "labor", label: "👥 1. 노무비", count: "4개사 16항목", amount: laborSubtotals.total, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40" },
              { id: "loan", label: "🏛️ 2. 대출이자", count: "23개 계좌/항목", amount: loanInterestTotal, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40" },
              { id: "card", label: "💳 3. 신용카드", count: "8개 카드사", amount: cardsTotal, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-900/40" },
              { id: "insurance", label: "🛡️ 4. 보험/공제", count: "9개 보험/공제", amount: insuranceTotal, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40" },
              { id: "tax", label: "🧾 5. 제세공과금", count: "4개사+개인 18항목", amount: publicChargesTotal, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/40" },
              { id: "misc", label: "📦 6. 수수료/잡비", count: `${miscItemsList.length}개 항목`, amount: miscTotal, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700" }
            ].map((kpi) => (
              <div
                key={kpi.id}
                onClick={() => setManualSectionFilter(manualSectionFilter === kpi.id ? "all" : kpi.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${kpi.bg} ${
                  manualSectionFilter === kpi.id ? "ring-2 ring-blue-500 scale-[1.02] shadow-sm" : "hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                  <span>{kpi.label}</span>
                </div>
                <p className={`text-sm sm:text-base font-black font-mono mt-1 ${kpi.color}`}>
                  {formatAmount(kpi.amount)}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{kpi.count}</span>
              </div>
            ))}
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-extrabold text-slate-400 mr-1">과목 선택:</span>
            {[
              { id: "all", label: "전체 보기" },
              { id: "labor", label: "노무비 (4개사)" },
              { id: "loan", label: "대출이자" },
              { id: "card", label: "신용카드" },
              { id: "insurance", label: "보험/공제" },
              { id: "tax", label: "제세공과금" },
              { id: "misc", label: "수수료/잡비 (수정·추가)" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setManualSectionFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  manualSectionFilter === tab.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* 1. 노무비 SECTION (4개사 16개 표준 과목) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "labor") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    1. 노무비 결산 (4개사 x 4개 표준 항목)
                  </h4>
                </div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                  노무비 합계: {formatAmount(laborSubtotals.total)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "oryuk", title: "(주)오륙", subtotal: laborSubtotals.oryuk, items: [
                    { id: "oryuk_reg", label: "등록 (정규직 급여)", desc: "4대보험 가입 인원 급여" },
                    { id: "oryuk_unreg", label: "미등록 (일용직/기타)", desc: "일용직 / 미등록 노무비" },
                    { id: "oryuk_foreign", label: "외국인 출국만기보험", desc: "외국인 근로자 전용 보험" },
                    { id: "oryuk_expense", label: "지출결의서", desc: "노무비 관련 지출결의서" }
                  ]},
                  { key: "ogong", title: "오륙공사", subtotal: laborSubtotals.ogong, items: [
                    { id: "ogong_reg", label: "등록", desc: "4대보험 가입 인원 급여" },
                    { id: "ogong_unreg", label: "미등록", desc: "일용직 / 미등록 노무비" },
                    { id: "ogong_foreign", label: "외국인 출국만기보험", desc: "외국인 근로자 전용 보험" },
                    { id: "ogong_expense", label: "지출결의서", desc: "노무비 관련 지출결의서" }
                  ]},
                  { key: "joyoungCorp", title: "(주)조영산업", subtotal: laborSubtotals.joyoungCorp, items: [
                    { id: "joyoung_corp_reg", label: "등록", desc: "4대보험 가입 인원 급여" },
                    { id: "joyoung_corp_unreg", label: "미등록", desc: "일용직 / 미등록 노무비" },
                    { id: "joyoung_corp_foreign", label: "외국인 출국만기보험", desc: "외국인 근로자 전용 보험" },
                    { id: "joyoung_corp_expense", label: "지출결의서", desc: "노무비 관련 지출결의서" }
                  ]},
                  { key: "joyoungInd", title: "조영산업", subtotal: laborSubtotals.joyoungInd, items: [
                    { id: "joyoung_ind_reg", label: "등록", desc: "4대보험 가입 인원 급여" },
                    { id: "joyoung_ind_unreg", label: "미등록", desc: "일용직 / 미등록 노무비" },
                    { id: "joyoung_ind_foreign", label: "외국인 출국만기보험", desc: "외국인 근로자 전용 보험" },
                    { id: "joyoung_ind_expense", label: "지출결의서", desc: "노무비 관련 지출결의서" }
                  ]}
                ].map((comp) => (
                  <div key={comp.key} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {comp.title}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 mr-1.5">소계:</span>
                        <strong className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                          {formatAmount(comp.subtotal)}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {comp.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{it.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{it.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] text-slate-400 font-mono">₩</span>
                            <input
                              type="text"
                              value={Number(manualLedger.labor?.[it.id] || 0).toLocaleString()}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleManualLedgerChange("labor", it.id, e.target.value)}
                              className="w-32 text-right px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 shadow-2xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. 대출이자 SECTION (23종 금융이자) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "loan") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-amber-500 rounded-full"></span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    2. 대출이자 및 금융비용 (23종 계좌 / 할인료)
                  </h4>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                  대출이자 합계: {formatAmount(loanInterestTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    group: "주 오륙 (12종)",
                    items: [
                      { id: "oryuk_9600", name: "9600" },
                      { id: "oryuk_7501", name: "7501" },
                      { id: "oryuk_0701", name: "0701" },
                      { id: "oryuk_6002", name: "6002" },
                      { id: "oryuk_1302", name: "1302" },
                      { id: "oryuk_0109", name: "0109" },
                      { id: "oryuk_2400", name: "2400" },
                      { id: "oryuk_dgb", name: "DGB생명이자" },
                      { id: "oryuk_minus", name: "마이너스 통장" },
                      { id: "oryuk_sangseung", name: "상승" },
                      { id: "oryuk_b2b", name: "B2B 어음 할인이자" },
                      { id: "oryuk_hwaseung", name: "화승 R&A 선급금 상계" }
                    ]
                  },
                  {
                    group: "주 조영산업 (3종)",
                    items: [
                      { id: "joyoung_corp_25억", name: "2,500,000,000 (25억)" },
                      { id: "joyoung_corp_3억29", name: "329,000,000 (3.29억)" },
                      { id: "joyoung_corp_2억", name: "200,000,000 (2억)" }
                    ]
                  },
                  {
                    group: "조영산업 & 오륙공사 (8종)",
                    items: [
                      { id: "joyoung_ind_5억", name: "조영 500,000,000 (5억)" },
                      { id: "joyoung_ind_2억", name: "조영 200,000,000 (2억)" },
                      { id: "joyoung_ind_1억", name: "조영 100,000,000 (1억)" },
                      { id: "joyoung_ind_samsung", name: "조영 삼성생명 이자" },
                      { id: "joyoung_ind_kb", name: "조영 KB생명 이자" },
                      { id: "joyoung_ind_dgb", name: "조영 DGB생명 이자" },
                      { id: "joyoung_ind_noran", name: "조영 노란우산공제" },
                      { id: "ogong_noran", name: "오륙공사 노란우산공제" }
                    ]
                  }
                ].map((card, gIdx) => (
                  <div key={gIdx} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="font-extrabold text-xs text-amber-700 dark:text-amber-300 pb-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span>{card.group}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{card.items.length}개</span>
                    </div>
                    <div className="space-y-1.5">
                      {card.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-medium truncate min-w-0">{it.name}</span>
                          <input
                            type="text"
                            value={Number(manualLedger.loanInterest?.[it.id] || 0).toLocaleString()}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleManualLedgerChange("loanInterest", it.id, e.target.value)}
                            className="w-28 text-right px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. 신용카드 SECTION (8종) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "card") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-purple-600 rounded-full"></span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    3. 신용카드 결제대금 (8개사)
                  </h4>
                </div>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                  카드 합계: {formatAmount(cardsTotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "oryuk_bc", name: "오륙 BC", entity: "오륙" },
                  { key: "joyoung_bc", name: "조영 BC", entity: "조영" },
                  { key: "ogong_kb", name: "오공 KB", entity: "오공" },
                  { key: "choi_kb", name: "최미영 KB", entity: "최미영" },
                  { key: "samsung", name: "삼성카드", entity: "공통" },
                  { key: "hyundai", name: "현대카드", entity: "공통" },
                  { key: "woori", name: "우리카드", entity: "공통" },
                  { key: "shinhan", name: "신한카드", entity: "공통" }
                ].map((card) => (
                  <div key={card.key} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">{card.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">{card.entity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-mono">₩</span>
                      <input
                        type="text"
                        value={Number(manualLedger.cards?.[card.key] || 0).toLocaleString()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleManualLedgerChange("cards", card.key, e.target.value)}
                        className="w-full text-right px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. 보험 및 공제 SECTION (9종) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "insurance") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-600 rounded-full"></span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    4. 보험 및 공제 (9종)
                  </h4>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  보험공제 합계: {formatAmount(insuranceTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { entity: "(주)오륙", items: [
                    { id: "oryuk_kyobo", name: "교보단체보험" },
                    { id: "oryuk_dgb", name: "DGB 생명" }
                  ]},
                  { entity: "(주)조영산업", items: [
                    { id: "joyoung_corp_kyobo", name: "교보단체보험" },
                    { id: "joyoung_corp_hana", name: "하나생명" }
                  ]},
                  { entity: "오륙공사 & 조영 & 최미영", items: [
                    { id: "ogong_noran", name: "오공 노란우산공제" },
                    { id: "ogong_kyobo", name: "오공 교보단체보험" },
                    { id: "joyoung_ind_kyobo", name: "조영 교보단체보험" },
                    { id: "joyoung_ind_noran", name: "조영 노란우산공제" },
                    { id: "choi_dgb", name: "최미영 DGB 생명" }
                  ]}
                ].map((grp, idx) => (
                  <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 pb-1 border-b border-slate-200 dark:border-slate-700">
                      {grp.entity}
                    </div>
                    <div className="space-y-1.5">
                      {grp.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{it.name}</span>
                          <input
                            type="text"
                            value={Number(manualLedger.insurance?.[it.id] || 0).toLocaleString()}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleManualLedgerChange("insurance", it.id, e.target.value)}
                            className="w-28 text-right px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. 제세공과금 SECTION (4대보험 / 소득세 / 지방세 / 법인세 / 부가세) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "tax") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-rose-600 rounded-full"></span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    5. 제세공과금 (4대보험 · 소득세 · 주민세 · 법인세 · 부가세)
                  </h4>
                </div>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                  공과금 합계: {formatAmount(publicChargesTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    entity: "(주)오륙",
                    items: [
                      { id: "oryuk_social", name: "사회보험 (4대보험)" },
                      { id: "oryuk_income", name: "근로소득세" },
                      { id: "oryuk_local", name: "지방소득세" },
                      { id: "oryuk_corp", name: "법인세" },
                      { id: "oryuk_vat", name: "부가가치세 (분납)" }
                    ]
                  },
                  {
                    entity: "(주)조영산업",
                    items: [
                      { id: "joyoung_corp_social", name: "사회보험 (4대보험)" },
                      { id: "joyoung_corp_income", name: "근로소득세" },
                      { id: "joyoung_corp_local", name: "지방소득세" },
                      { id: "joyoung_corp_vat", name: "부가가치세 (분납)" }
                    ]
                  },
                  {
                    entity: "조영산업",
                    items: [
                      { id: "joyoung_ind_social", name: "사회보험 (4대보험)" },
                      { id: "joyoung_ind_income", name: "근로소득세" },
                      { id: "joyoung_ind_local", name: "지방소득세" },
                      { id: "joyoung_ind_vat", name: "부가가치세 (분납)" }
                    ]
                  },
                  {
                    entity: "오륙공사 & 개인",
                    items: [
                      { id: "ogong_social", name: "오공 사회보험" },
                      { id: "ogong_income", name: "오공 근로소득세" },
                      { id: "ogong_local", name: "오공 지방소득세" },
                      { id: "ogong_vat", name: "오공 부가가치세" },
                      { id: "park_social", name: "박순화(개인) 사회보험" }
                    ]
                  }
                ].map((grp, idx) => (
                  <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="font-extrabold text-xs text-rose-700 dark:text-rose-300 pb-1 border-b border-slate-200 dark:border-slate-700">
                      {grp.entity}
                    </div>
                    <div className="space-y-1.5">
                      {grp.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{it.name}</span>
                          <input
                            type="text"
                            value={Number(manualLedger.publicCharges?.[it.id] || 0).toLocaleString()}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleManualLedgerChange("publicCharges", it.id, e.target.value)}
                            className="w-28 text-right px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. 수수료 / 알바비 / 기사식대 / 기타잡비 (수정 & 추가/삭제 지원!) */}
          {/* ========================================================================= */}
          {(manualSectionFilter === "all" || manualSectionFilter === "misc") && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-slate-700 dark:bg-slate-400 rounded-full"></span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>6. 수수료 · 알바비 · 기사식대 · 기타잡비</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {miscItemsList.length}건
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      분류명, 대상자/거래처명, 금액, 비고를 직접 수정하고 새 항목을 추가/삭제할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                    합계: {formatAmount(miscTotal)}
                  </span>
                  <button
                    onClick={handleAddMiscItem}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:bg-slate-800 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 항목 추가</span>
                  </button>
                </div>
              </div>

              {/* Editable Misc Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">NO</th>
                      <th className="py-2.5 px-3 w-36">구분 / 분류</th>
                      <th className="py-2.5 px-3 w-48">세부내용 / 거래처 · 대상자</th>
                      <th className="py-2.5 px-3 text-right w-40">결산 지출금액 (원)</th>
                      <th className="py-2.5 px-3">비고 및 용도</th>
                      <th className="py-2.5 px-3 w-12 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {miscItemsList.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.category || ""}
                            onChange={(e) => handleMiscItemChange(item.id, "category", e.target.value)}
                            placeholder="분류 (예: 알바비)"
                            className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.name || ""}
                            onChange={(e) => handleMiscItemChange(item.id, "name", e.target.value)}
                            placeholder="대상자/거래처명"
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="text"
                            value={Number(item.amount || 0).toLocaleString()}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleMiscItemChange(item.id, "amount", e.target.value)}
                            className="w-full text-right px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.memo || ""}
                            onChange={(e) => handleMiscItemChange(item.id, "memo", e.target.value)}
                            placeholder="비고"
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleDeleteMiscItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Total Banner */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              ★★ 전사 수기 결산 비세금계산서 총합계 (노무비 + 대출이자 + 카드 + 보험 + 공과금 + 잡비)
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatAmount(grandManualTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
