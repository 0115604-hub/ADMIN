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
  HelpCircle
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { parseHometaxExcel, CATEGORY_RULES, classifyTaxInvoiceItem } from "../services/taxInvoiceParser";
import detailedClosingMaster from "../data/detailedClosingLedgerData.json";
import * as XLSX from "xlsx";

const STORAGE_KEY = "monthly_4_entity_closing_ledger_v4_manual";

const ENTITY_SLOTS = [
  { id: "oryuk_corp", name: "(주)오륙", taxNo: "615-81-39247", badge: "법인 본사", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800" },
  { id: "joyoung_corp", name: "(주)조영산업", taxNo: "898-87-01289", badge: "법인", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-800" },
  { id: "oryuk_gongsa", name: "오륙공사", taxNo: "615-08-xxxxx", badge: "사업장", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800" },
  { id: "joyoung_ind", name: "조영산업", taxNo: "615-17-xxxxx", badge: "사업장", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800" }
];

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

export const ClosingLedgerView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();
  const fileInputRef = useRef(null);

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Persistent store keyed by month: { "2026-07": { uploadedEntities: {}, categories: [] }, "2026-08": ... }
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
        categories: detailedClosingMaster["2026-07"]?.categories || buildDefaultCategories()
      },
      "2026-08": {
        uploadedEntities: {},
        categories: buildDefaultCategories()
      }
    };
  });

  // Current Month's active state
  const currentMonthStore = closingStore[selectedMonth] || {
    uploadedEntities: {},
    categories: buildDefaultCategories()
  };

  const [uploadedEntities, setUploadedEntities] = useState(currentMonthStore.uploadedEntities || {});
  const [categories, setCategories] = useState(currentMonthStore.categories || buildDefaultCategories());
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
      categories: buildDefaultCategories()
    };
    setUploadedEntities(monthData.uploadedEntities || {});
    setCategories(monthData.categories || buildDefaultCategories());
    setSelectedCategoryDetailId(null);
  }, [selectedMonth, closingStore]);

  // Grand Totals Calculation
  const totalSupplyAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.supplyAmt) || 0), 0);
  }, 0);

  const totalTaxAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.taxAmt) || 0), 0);
  }, 0);

  const totalClosingAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))) || 0), 0);
  }, 0);

  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Active Category for Drilldown
  const activeCategory = categories.find((c) => c.id === selectedCategoryDetailId);

  // Helper: Persist and update state
  const persistMonthData = (newCategories, newUploadedEntities) => {
    setCategories(newCategories);
    setUploadedEntities(newUploadedEntities);

    const updatedStore = {
      ...closingStore,
      [selectedMonth]: {
        month: selectedMonth,
        uploadedEntities: newUploadedEntities,
        categories: newCategories
      }
    };
    setClosingStore(updatedStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
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

    // Determine Entity from Filename or Content
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

    // Detect Header Row & Columns
    let startRow = 6;
    let vendorCol = 6;
    let itemCol = 26;
    let supplyCol = 15;
    let taxCol = 16;
    let totalCol = 14;
    let dateCol = 0;
    let memoCol = 32;

    // Scan first 10 rows for headers if not standard
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

  // MULTI-FILE UPLOAD HANDLER (4~6 files Drag & Drop or Batch select)
  const handleBatchFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
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

      // Merge into updated entities metadata
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

      // Merge into 16 categories
      const newCategories = categories.map((cat) => {
        // Keep items from entities not touched in this batch
        const touchedEntityKeys = parsedResults.map((r) => r.entityKey);
        const keptItems = cat.items.filter((it) => !touchedEntityKeys.includes(it.entityKey));
        const addedItems = allNewItems.filter((it) => it.categoryId === cat.id);
        return {
          ...cat,
          items: [...keptItems, ...addedItems]
        };
      });

      persistMonthData(newCategories, newEntities);
      setSaveSuccessMessage(`${parsedResults.length}개 매입세금계산서 파일(총 ${allNewItems.length}건)이 16대 계정과목으로 자동 분류되어 매입DATA에 반영되었습니다!`);
      setTimeout(() => setSaveSuccessMessage(""), 6000);
    } catch (err) {
      alert("매입세금계산서 일괄 업로드 오류: " + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag and Drop handlers
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
      handleBatchFiles(e.dataTransfer.files);
    }
  };

  // Delete Single Uploaded File
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

  // Update Item Field in Active Category
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

  // Re-classify Item to Another Category
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

  // Delete Single Item
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

  // Add Manual Item to Category
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

  // Save to persistent storage explicitly
  const handleSave = () => {
    persistMonthData(categories, uploadedEntities);
    setSaveSuccessMessage(`${monthTitle} 매입DATA가 안전하게 저장되었습니다!`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  // Clear/Reset Current Month's Data
  const handleResetMonth = () => {
    if (!window.confirm(`${monthTitle}의 매입DATA를 모두 초기화하시겠습니까?`)) return;
    persistMonthData(buildDefaultCategories(), {});
    setSaveSuccessMessage(`${monthTitle} 매입DATA가 초기화되었습니다.`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  // Export to Excel File
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryRows = [
      [`${monthTitle} 매입DATA 결산 요약 보고서`],
      ["당월 총 매출액", totalSales, "총 결산 지출 합계", totalClosingAmount, "매출 대비 원가 비율", `${costRatio}%`, "예상 영업손익", netEstimatedProfit],
      [],
      ["NO", "대분류", "계정과목명", "항목수", "공급가액 (원)", "세액 (원)", "총 결산합계 (원)", "점유율", "주요 거래처 및 비고"]
    ];

    categories.forEach((cat, idx) => {
      const catSupply = cat.items.reduce((s, it) => s + (Number(it.supplyAmt) || 0), 0);
      const catTax = cat.items.reduce((s, it) => s + (Number(it.taxAmt) || 0), 0);
      const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
      const catShare = totalClosingAmount > 0 ? ((catTotal / totalClosingAmount) * 100).toFixed(2) : 0;
      const topVendors = cat.items.slice(0, 3).map((it) => it.vendor).filter(Boolean).join(", ");

      summaryRows.push([
        idx + 1,
        cat.group,
        cat.name,
        `${cat.items.length}건`,
        catSupply,
        catTax,
        catTotal,
        `${catShare}%`,
        topVendors ? `주요처: ${topVendors}` : ""
      ]);
    });

    summaryRows.push([
      "★ 합계",
      "전체",
      "전사 16대 계정과목 총 결산 지출 합계",
      `${categories.reduce((s, c) => s + c.items.length, 0)}건`,
      totalSupplyAmount,
      totalTaxAmount,
      totalClosingAmount,
      "100.0%",
      ""
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "📊 월간 결산 요약");

    // Itemized Detail Sheet
    const detailRows = [
      [`${monthTitle} 16대 계정과목별 세부 매입·지출 장부`],
      [],
      ["NO", "계정과목", "거래처명 / 지출처", "품목 및 세부내용", "공급가액 (원)", "세액 (원)", "합계금액 (원)", "비고 / 메모"]
    ];

    let rowNo = 1;
    categories.forEach((cat) => {
      detailRows.push([`▶ ${cat.name} (${cat.group})`, "", "", "", "", "", "", ""]);
      cat.items.forEach((it) => {
        detailRows.push([
          rowNo++,
          cat.name,
          it.vendor,
          it.item,
          it.supplyAmt,
          it.taxAmt,
          Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))),
          it.memo || ""
        ]);
      });
      const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
      detailRows.push([`★ ${cat.name} 소계`, "", "", "", "", "", catTotal, ""]);
      detailRows.push([]);
    });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetail, "📋 16대 계정과목 세부 장부");

    XLSX.writeFile(wb, `매입DATA_${monthTitle}.xlsx`);
  };

  // Filter categories for display
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
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {monthTitle}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              매입DATA 관리
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            홈택스 매입세금계산서 엑셀 파일을 일괄 드래그 업로드하면 16대 계정과목으로 자동 분류 및 집계됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
          <button
            onClick={handleResetMonth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀 다운로드</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>매입DATA 저장</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: 4~6 MULTI-FILE DRAG & DROP UPLOAD ZONE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>매입세금계산서 일괄 업로드 (4~6개 드래그 앤 드롭)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              오륙, 조영산업, 오륙공사, 조영 등 4~6개의 매입전자세금계산서 엑셀 파일을 한번에 드래그하여 업로드하세요.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all shrink-0"
          >
            <Files className="w-4 h-4" />
            <span>파일 다중 선택</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleBatchFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Drag and Drop Zone */}
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
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  4~6개의 매입세금계산서 엑셀 파일을 이곳에 드래그하여 올려놓으세요
                </p>
                <p className="text-xs text-slate-400">
                  (주)오륙, (주)조영산업, 오륙공사, 조영산업 홈택스 파일 동시 지원 (.xlsx, .xls)
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-xs">
                <Files className="w-3.5 h-3.5 text-blue-500" />
                <span>클릭하여 컴퓨터에서 파일 선택</span>
              </span>
            </>
          )}
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
      {/* SECTION 2: GRAND SUMMARY KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{monthTitle} 총 공급가액</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatAmount(totalSupplyAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">세액 제외 순수 매입원가</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총 부가가치세액</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
              {formatAmount(totalTaxAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">매입세액 공제 대상</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총 결산 지출 합계</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(totalClosingAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">공급가액 + 부가세 합계</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출 대비 원가 비율</span>
          <div className="mt-2">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {costRatio}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              총매출 {formatAmount(totalSales)} 기준
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: 16 ACCOUNTING CATEGORIES BREAKDOWN & MANAGEMENT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Controls: Group Selector & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Group Tabs */}
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

          {/* Search Box */}
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
            const catSupply = cat.items.reduce((s, it) => s + (Number(it.supplyAmt) || 0), 0);
            const catTax = cat.items.reduce((s, it) => s + (Number(it.taxAmt) || 0), 0);
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
    </div>
  );
};
