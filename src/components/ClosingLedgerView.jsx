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
import * as XLSX from "xlsx";

const STORAGE_KEY = "monthly_4_entity_closing_ledger_v5_integrated";

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

  // Upload Tab: 'tax_invoice' vs 'manual_ledger' (노무비 및 제세공과금 일괄업로드)
  const [uploadTab, setUploadTab] = useState("manual_ledger");

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
  const [searchTerm, setSearchTerm] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const miscTotal = useMemo(() => {
    const m = manualLedger.misc || {};
    return Object.values(m).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [manualLedger.misc]);

  const grandManualTotal = laborSubtotals.total + loanInterestTotal + cardsTotal + insuranceTotal + publicChargesTotal + miscTotal;

  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Active Category for Drilldown
  const activeCategory = categories.find((c) => c.id === selectedCategoryDetailId);

  // Helper: Persist and update state
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

  // MANUAL CLOSING LEDGER (노무비 및 제세공과금 통합관리대장) UPLOAD HANDLER
  const handleManualLedgerUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessing(true);

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
      setIsProcessing(false);
      if (manualFileInputRef.current) manualFileInputRef.current.value = "";
    }
  };

  // MULTI-FILE UPLOAD HANDLER
  const handleBatchFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    // If manual ledger file was passed or manual_ledger tab is active
    const firstFile = fileList[0];
    const fileName = (firstFile?.name || "").toLowerCase();
    if (uploadTab === "manual_ledger" || fileName.includes("통합관리대장") || (fileName.includes("노무비") && fileName.includes(".xls"))) {
      return handleManualLedgerUpload(fileList);
    }

    setIsProcessing(true);

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
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstFile = e.dataTransfer.files[0];
      const fileName = (firstFile?.name || "").toLowerCase();
      if (uploadTab === "manual_ledger" || fileName.includes("통합관리대장") || (fileName.includes("노무비") && fileName.includes(".xls"))) {
        handleManualLedgerUpload(e.dataTransfer.files);
      } else {
        handleBatchFiles(e.dataTransfer.files);
      }
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Upload Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit shadow-xs">
            <button
              onClick={() => setUploadTab("manual_ledger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                uploadTab === "manual_ledger"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>노무비 및 제세공과금 일괄업로드</span>
            </button>
            <button
              onClick={() => setUploadTab("tax_invoice")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                uploadTab === "tax_invoice"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>매입세금계산서 일괄업로드</span>
            </button>
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
              <span>통합관리대장 다운로드</span>
            </button>
            {uploadTab === "manual_ledger" ? (
              <button
                onClick={() => manualFileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all shrink-0"
              >
                <Files className="w-3.5 h-3.5" />
                <span>통합관리대장 파일 선택</span>
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all shrink-0"
              >
                <Files className="w-3.5 h-3.5" />
                <span>세금계산서 파일 선택</span>
              </button>
            )}
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

        {/* Tab 1: 노무비 및 제세공과금 일괄업로드 */}
        {uploadTab === "manual_ledger" && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => manualFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01]"
                : "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40"
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  통합관리대장 분석 및 노무비·제세공과금 과목별 자동 입력 중...
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    오륙_조영_매입DATA_통합관리대장 엑셀 파일을 이곳에 드래그하여 올려놓으세요
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    노무비(4개사 16개 항목), 대출이자, 신용카드, 보험공제, 제세공과금이 각 과목에 자동 입력됩니다.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs">
                  <Files className="w-3.5 h-3.5 text-emerald-600" />
                  <span>클릭하여 통합관리대장 파일 선택</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* Tab 2: 매입세금계산서 일괄업로드 */}
        {uploadTab === "tax_invoice" && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.01]"
                : "border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  세금계산서 파일 분석 및 16대 계정과목 자동 분류 중...
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    매입세금계산서 엑셀 파일을 이곳에 드래그하여 올려놓으세요
                  </p>
                  <p className="text-xs text-slate-400">
                    홈택스 매입전자세금계산서 파일 지원 (.xlsx, .xls)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-xs">
                  <Files className="w-3.5 h-3.5 text-blue-500" />
                  <span>클릭하여 컴퓨터에서 세금계산서 파일 선택</span>
                </span>
              </>
            )}
          </div>
        )}

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
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                <span>노무비 · 대출이자 · 카드 · 보험공제 · 공과금 · 잡비 수기 결산표</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                각 항목별 금액을 입력하시면 회사별 소계와 전사 총계가 실시간으로 자동 계산되어 저장됩니다.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200">
              수기 결산 총합계: {formatAmount(grandManualTotal)}
            </span>
          </div>

          {/* Full Integrated Master Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                <tr>
                  <th className="py-3 px-4 w-28">대분류</th>
                  <th className="py-3 px-4 w-36">회사 / 대상</th>
                  <th className="py-3 px-4">세부 항목명 / 계좌번호</th>
                  <th className="py-3 px-4 text-right w-44">금액 (원)</th>
                  <th className="py-3 px-4 text-right w-40">소계 / 비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* 1. 노무비 Section (4개사 x 4개 표준 항목 = 총 16줄) */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                  <td rowSpan={16} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <UserCheck className="w-4 h-4" />
                      <span>노무비</span>
                    </div>
                  </td>

                  {/* (주)오륙 */}
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 오륙</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">등록 (정규직 급여)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.oryuk_reg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "oryuk_reg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-blue-600 align-middle">
                    {formatAmount(laborSubtotals.oryuk)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">미등록 (일용직/기타)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.oryuk_unreg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "oryuk_unreg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">외국인 출국만기보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.oryuk_foreign || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "oryuk_foreign", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지출결의서</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.oryuk_expense || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "oryuk_expense", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>

                {/* 오륙공사 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">오륙공사</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.ogong_reg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "ogong_reg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-blue-600 align-middle">
                    {formatAmount(laborSubtotals.ogong)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">미등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.ogong_unreg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "ogong_unreg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">외국인 출국만기보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.ogong_foreign || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "ogong_foreign", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지출결의서</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.ogong_expense || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "ogong_expense", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>

                {/* 주 조영산업 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_corp_reg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_corp_reg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-blue-600 align-middle">
                    {formatAmount(laborSubtotals.joyoungCorp)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">미등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_corp_unreg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_corp_unreg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">외국인 출국만기보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_corp_foreign || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_corp_foreign", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지출결의서</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_corp_expense || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_corp_expense", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>

                {/* 조영산업 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_ind_reg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_ind_reg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-blue-600 align-middle">
                    {formatAmount(laborSubtotals.joyoungInd)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">미등록</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_ind_unreg || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_ind_unreg", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">외국인 출국만기보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_ind_foreign || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_ind_foreign", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지출결의서</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.labor?.joyoung_ind_expense || 0).toLocaleString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleManualLedgerChange("labor", "joyoung_ind_expense", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                    />
                  </td>
                </tr>

                {/* 노무비 합계 Row */}
                <tr className="bg-blue-50 dark:bg-blue-950/40 font-black text-blue-800 dark:text-blue-300 border-t-2 border-blue-200">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 노무비 총합계 (4개사 16개 항목 전체 합산)</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(laborSubtotals.total)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">전사 노무비 마감</td>
                </tr>

                {/* 2. 대출이자 Section */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t-4 border-slate-200 dark:border-slate-700">
                  <td rowSpan={24} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Landmark className="w-4 h-4" />
                      <span>대출이자</span>
                    </div>
                  </td>
                  <td rowSpan={12} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 오륙</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">9600</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.oryuk_9600 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "oryuk_9600", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={12} className="py-2 px-4 text-right font-mono font-extrabold text-amber-600 align-middle">
                    오륙 대출이자
                  </td>
                </tr>
                {["7501", "0701", "6002", "1302", "0109", "2400", "DGB생명이자", "마이너스 통장", "상승", "B2B 어음 할인이자", "화승 R&A 선급금 상계"].map((itemKey, idx) => {
                  const propKey = `oryuk_${idx === 9 ? "b2b" : idx === 10 ? "hwaseung" : itemKey.replace(/[^a-zA-Z0-9]/g, "")}`;
                  return (
                    <tr key={itemKey}>
                      <td className={`py-1.5 px-4 ${itemKey.includes("B2B") ? "bg-amber-100/70 font-black text-amber-900 dark:text-amber-300" : "text-slate-600 dark:text-slate-300"}`}>
                        {itemKey}
                      </td>
                      <td className="py-1 px-4 text-right">
                        <input
                          type="text"
                          value={Number(manualLedger.loanInterest?.[propKey] || 0).toLocaleString()}
                          onChange={(e) => handleManualLedgerChange("loanInterest", propKey, e.target.value)}
                          className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* 주 조영산업 대출이자 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={3} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">2,500,000,000 (25억)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.joyoung_corp_25억 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "joyoung_corp_25억", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={3} className="py-2 px-4 text-right font-mono font-extrabold text-amber-600 align-middle">
                    조영법인 이자
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">329,000,000 (3.29억)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.joyoung_corp_3억29 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "joyoung_corp_3억29", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">200,000,000 (2억)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.joyoung_corp_2억 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "joyoung_corp_2억", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 조영산업 대출이자 & 보험이자 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={8} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">500,000,000 (5억)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.joyoung_ind_5억 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "joyoung_ind_5억", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={8} className="py-2 px-4 text-right font-mono font-extrabold text-amber-600 align-middle">
                    조영사업장 이자
                  </td>
                </tr>
                {["200,000,000 (2억)", "100,000,000 (1억)", "삼성생명 이자", "KB생명 이자", "DGB 생명 이자", "노란우산공제"].map((itemKey, idx) => {
                  const propKey = `joyoung_ind_${idx === 0 ? "2억" : idx === 1 ? "1억" : idx === 2 ? "samsung" : idx === 3 ? "kb" : idx === 4 ? "dgb" : "noran"}`;
                  return (
                    <tr key={itemKey}>
                      <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">{itemKey}</td>
                      <td className="py-1 px-4 text-right">
                        <input
                          type="text"
                          value={Number(manualLedger.loanInterest?.[propKey] || 0).toLocaleString()}
                          onChange={(e) => handleManualLedgerChange("loanInterest", propKey, e.target.value)}
                          className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* 오륙공사 노란우산 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">오륙공사</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">노란우산공제</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.loanInterest?.ogong_noran || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("loanInterest", "ogong_noran", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-extrabold text-amber-600">공제부금</td>
                </tr>

                {/* 대출이자 합계 Row */}
                <tr className="bg-amber-50 dark:bg-amber-950/40 font-black text-amber-800 dark:text-amber-300 border-t-2 border-amber-200">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 대출이자 및 금융비용 총합계</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(loanInterestTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">금융비용 집계</td>
                </tr>

                {/* 3. 카드 Section */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t-4 border-slate-200 dark:border-slate-700">
                  <td rowSpan={8} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <CreditCard className="w-4 h-4" />
                      <span>카드</span>
                    </div>
                  </td>
                  {[
                    { entity: "오륙", name: "오륙 BC", key: "oryuk_bc" },
                    { entity: "조영", name: "조영 BC", key: "joyoung_bc" },
                    { entity: "오공", name: "오공 KB", key: "ogong_kb" },
                    { entity: "최미영", name: "최미영 KB", key: "choi_kb" },
                    { entity: "공통", name: "삼성", key: "samsung" },
                    { entity: "공통", name: "현대", key: "hyundai" },
                    { entity: "공통", name: "우리", key: "woori" },
                    { entity: "공통", name: "신한", key: "shinhan" }
                  ].map((card, idx) => (
                    <React.Fragment key={card.key}>
                      {idx > 0 && <tr key={card.key + "_row"}>
                        <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">{card.entity}</td>
                        <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">{card.name}</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="text"
                            value={Number(manualLedger.cards?.[card.key] || 0).toLocaleString()}
                            onChange={(e) => handleManualLedgerChange("cards", card.key, e.target.value)}
                            className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                          />
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-purple-600">결제대금</td>
                      </tr>}
                      {idx === 0 && (
                        <>
                          <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">{card.entity}</td>
                          <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">{card.name}</td>
                          <td className="py-1 px-4 text-right">
                            <input
                              type="text"
                              value={Number(manualLedger.cards?.[card.key] || 0).toLocaleString()}
                              onChange={(e) => handleManualLedgerChange("cards", card.key, e.target.value)}
                              className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-purple-600">결제대금</td>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>

                {/* 카드 결제 총합계 */}
                <tr className="bg-purple-50 dark:bg-purple-950/40 font-black text-purple-800 dark:text-purple-300 border-t-2 border-purple-200">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 신용카드 결제대금 총합계</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(cardsTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">카드대금 집계</td>
                </tr>

                {/* 4. 공제/보험 Section */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t-4 border-slate-200 dark:border-slate-700">
                  <td rowSpan={9} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>공제 / 보험</span>
                    </div>
                  </td>
                  <td rowSpan={2} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 오륙</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">교보단체보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.oryuk_kyobo || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "oryuk_kyobo", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={2} className="py-2 px-4 text-right font-mono font-extrabold text-emerald-600 align-middle">
                    오륙 보험료
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">DGB 생명</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.oryuk_dgb || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "oryuk_dgb", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td rowSpan={2} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 조영</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">교보단체보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.joyoung_corp_kyobo || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "joyoung_corp_kyobo", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={2} className="py-2 px-4 text-right font-mono font-extrabold text-emerald-600 align-middle">
                    조영법인 보험
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">하나생명</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.joyoung_corp_hana || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "joyoung_corp_hana", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td rowSpan={2} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">오륙공사</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">노란우산공제</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.ogong_noran || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "ogong_noran", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={2} className="py-2 px-4 text-right font-mono font-extrabold text-emerald-600 align-middle">
                    오공 공제/보험
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">교보단체보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.ogong_kyobo || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "ogong_kyobo", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td rowSpan={2} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">교보단체보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.joyoung_ind_kyobo || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "joyoung_ind_kyobo", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={2} className="py-2 px-4 text-right font-mono font-extrabold text-emerald-600 align-middle">
                    조영사업장 공제
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">노란우산공제</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.joyoung_ind_noran || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "joyoung_ind_noran", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">최미영</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">DGB 생명</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.insurance?.choi_dgb || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("insurance", "choi_dgb", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-emerald-600">개인보험</td>
                </tr>

                {/* 보험공제 총합계 */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-black text-emerald-800 dark:text-emerald-300 border-t-2 border-emerald-200">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 보험 및 공제 총합계</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(insuranceTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">보험공제 집계</td>
                </tr>

                {/* 5. 공과금 Section */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t-4 border-slate-200 dark:border-slate-700">
                  <td rowSpan={18} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <Coins className="w-4 h-4" />
                      <span>공과금</span>
                    </div>
                  </td>
                  <td rowSpan={5} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 오륙</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">사회보험 (4대보험)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.oryuk_social || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "oryuk_social", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={5} className="py-2 px-4 text-right font-mono font-extrabold text-rose-600 align-middle">
                    오륙 공과금
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">근로소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.oryuk_income || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "oryuk_income", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지방소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.oryuk_local || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "oryuk_local", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">법인세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.oryuk_corp || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "oryuk_corp", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">부가가치세 (분납분)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.oryuk_vat || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "oryuk_vat", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 주 조영산업 공과금 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">주 조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">사회보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_corp_social || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_corp_social", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-rose-600 align-middle">
                    조영법인 공과금
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">근로소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_corp_income || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_corp_income", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지방소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_corp_local || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_corp_local", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">부가가치세 (분납분)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_corp_vat || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_corp_vat", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 조영산업 공과금 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">조영산업</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">사회보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_ind_social || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_ind_social", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-rose-600 align-middle">
                    조영사업장 공과금
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">근로소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_ind_income || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_ind_income", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지방소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_ind_local || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_ind_local", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">부가가치세 (분납분)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.joyoung_ind_vat || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "joyoung_ind_vat", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 오륙공사 공과금 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">오륙공사</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">사회보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.ogong_social || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "ogong_social", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono font-extrabold text-rose-600 align-middle">
                    오공 공과금
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">근로소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.ogong_income || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "ogong_income", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">지방소득세</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.ogong_local || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "ogong_local", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">부가가치세 (분납분)</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.ogong_vat || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "ogong_vat", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 박순화 */}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">박순화</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">사회보험</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.publicCharges?.park_social || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("publicCharges", "park_social", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-rose-600">개인</td>
                </tr>

                {/* 공과금 합계 Row */}
                <tr className="bg-rose-50 dark:bg-rose-950/40 font-black text-rose-800 dark:text-rose-300 border-t-2 border-rose-200">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 공과금 계 (4개사 + 개인 합산)</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(publicChargesTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">공과금 총액</td>
                </tr>

                {/* 6. 수수료 / 알바비 / 기사식대 Section */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t-4 border-slate-200 dark:border-slate-700">
                  <td rowSpan={11} className="py-3 px-4 font-black text-slate-900 dark:text-white align-top border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Coins className="w-4 h-4" />
                      <span>수수료 / 잡비</span>
                    </div>
                  </td>
                  <td rowSpan={2} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">전자어음수수료</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">세동</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.ebill_sedong || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "ebill_sedong", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={2} className="py-2 px-4 text-right font-mono text-slate-600 align-middle">어음수수료</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">화승코퍼레이션</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.ebill_hwaseung || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "ebill_hwaseung", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">SMS수수료</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">우리은행</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.sms_woori || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "sms_woori", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-600">통지수수료</td>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">알바비</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">최영식</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.part_cys || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "part_cys", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono text-slate-600 align-middle">단기인건비</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">김현우</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.part_khw || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "part_khw", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">이남성</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.part_lns || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "part_lns", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">이석현</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.part_lsh || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "part_lsh", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td rowSpan={4} className="py-2 px-4 font-bold border-r border-slate-100 dark:border-slate-800">기사식대</td>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">용진운수</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.meal_yongjin || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "meal_yongjin", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                  <td rowSpan={4} className="py-2 px-4 text-right font-mono text-slate-600 align-middle">기사식대</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">한울</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.meal_hanul || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "meal_hanul", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">조영1</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.meal_joyoung1 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "meal_joyoung1", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-4 text-slate-600 dark:text-slate-300">조영2</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="text"
                      value={Number(manualLedger.misc?.meal_joyoung2 || 0).toLocaleString()}
                      onChange={(e) => handleManualLedgerChange("misc", "meal_joyoung2", e.target.value)}
                      className="w-36 text-right px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </td>
                </tr>

                {/* 잡비/수수료 총합계 */}
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-slate-200 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-4 text-center">★ 수수료 / 알바비 / 기사식대 총합계</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base">{formatAmount(miscTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-xs">잡비 총액</td>
                </tr>

                {/* GRAND TOTAL ROW */}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-900">
                  <td colSpan={3} className="py-3.5 px-4 text-center text-sm">★★ 전사 수기 결산 비세금계산서 총합계 ★★</td>
                  <td className="py-3.5 px-4 text-right font-mono text-lg text-amber-300">{formatAmount(grandManualTotal)}</td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-300">노무+이자+카드+보험+공과금+잡비</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
