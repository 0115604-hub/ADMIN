import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Zap,
  Layers,
  Plus,
  Printer,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  FileSpreadsheet,
  Scissors,
  Wrench,
  Search,
  Sparkles,
  Eye,
  X,
  Save,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import {
  REPORT_MAJOR_CATEGORIES,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  saveWorkReportTemplate,
  deleteWorkReportTemplate,
  deleteAllWorkReportTemplates,
  cloneWorkReportTemplate,
  getLocalCustomLegoBlocks
} from "../services/workReportTemplateService";
import { deleteMachiningWorkReport } from "../services/machiningWorkReportService";
import LegoWorkReportBuilder, { LEGO_BLOCK_SWITCH_CATALOG } from "./lego/LegoWorkReportBuilder.jsx";

// Helper to resolve all catalog items (standard + custom blocks) for a template in exact assembled blockOrder
const getOrderedBlocksForTemplate = (tpl) => {
  const cfg = tpl?.legoConfig;
  if (!cfg) return [];
  const customMap = new Map();
  getLocalCustomLegoBlocks().forEach((cb) => {
    const k = cb.key || cb.id;
    if (k) customMap.set(k, cb);
  });
  if (Array.isArray(cfg.customBlocks)) {
    cfg.customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) customMap.set(k, cb);
    });
  }
  if (cfg.customBlockTables && typeof cfg.customBlockTables === "object") {
    Object.entries(cfg.customBlockTables).forEach(([k, tbl]) => {
      if (!customMap.has(k)) {
        customMap.set(k, {
          id: k,
          key: k,
          label: `커스텀 블록 (${k})`,
          title: `커스텀 블록`,
          columns: tbl?.columns || [],
          rows: tbl?.rows || []
        });
      }
    });
  }
  const customItems = Array.from(customMap.values()).map((cb, idx) => ({
    key: cb.key || cb.id,
    label: cb.label || cb.title || `사진분석 블록 ${idx + 1}`,
    badge: cb.badge || `사진 ${18 + idx}`,
    isCustom: true,
    customData: cb
  }));
  const allCatalog = [...LEGO_BLOCK_SWITCH_CATALOG, ...customItems];
  const savedOrder = Array.isArray(cfg.blockOrder) ? cfg.blockOrder : [];
  const seen = new Set();
  const ordered = [];
  savedOrder.forEach((key) => {
    const found = allCatalog.find((b) => b.key === key);
    if (found && !seen.has(key)) {
      seen.add(key);
      ordered.push(found);
    }
  });
  allCatalog.forEach((b) => {
    if (!seen.has(b.key)) {
      seen.add(b.key);
      ordered.push(b);
    }
  });
  return ordered;
};

export const WorkReportTemplateManagerView = () => {
  const [managerViewMode, setManagerViewMode] = useState("LEGO_BUILDER"); // 'LEGO_BUILDER' | 'CATALOG'
  const [templates, setTemplates] = useState(() => getLocalWorkReportTemplates());
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [legoInitialData, setLegoInitialData] = useState(null);

  useEffect(() => {
    const unsub = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) {
        setTemplates(list);
      }
    });
    const handleCustomTemplatesUpdate = (e) => {
      if (Array.isArray(e.detail)) {
        setTemplates(e.detail);
      } else {
        setTemplates(getLocalWorkReportTemplates());
      }
    };
    window.addEventListener("work-report-templates-updated", handleCustomTemplatesUpdate);
    return () => {
      unsub();
      window.removeEventListener("work-report-templates-updated", handleCustomTemplatesUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "ALL" || t.categoryId === selectedCategory;
      const matchSearch =
        !searchTerm ||
        (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.carModel && t.carModel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.partName && t.partName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.processName && t.processName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { ALL: templates.length };
    REPORT_MAJOR_CATEGORIES.forEach((c) => {
      counts[c.id] = templates.filter((t) => t.categoryId === c.id).length;
    });
    return counts;
  }, [templates]);

  // Open Editor for New Template
  const handleAddNew = () => {
    const targetCatId = selectedCategory === "ALL" ? "MATERIAL_PREP" : selectedCategory;
    const curCat = REPORT_MAJOR_CATEGORIES.find((c) => c.id === targetCatId);
    setEditingTemplate({
      id: "",
      categoryId: targetCatId,
      categoryName: curCat?.name || "소재준비일보",
      title: targetCatId === "MATERIAL_PREP" ? "소재준비작업일보" : `${curCat?.name.replace("일보", "") || "작업"}작업일보`,
      subTitle: "",
      formNo: "705-02(REV.4)",
      companyName: "(주)오륙",
      carModel: "신규차종",
      partName: "신규품명",
      processName: curCat?.name.replace("일보", "") || "소재준비",
      subProcess: "",
      divisionType: "SECTION_ABC",
      blocks: {
        timeAndQty: true,
        specAndLot: true,
        machineCondition: selectedCategory === "EXTRUSION" || selectedCategory === "JOINT",
        defectMatrix: true,
        maintenance: true
      },
      specs: [
        { id: `sp_${Date.now()}_1`, section: "A단면", name: "A단면", frtSpec: "800 ± 3mm", frtTarget: 800, frtTol: 3, rrSpec: "500 ± 3mm", rrTarget: 500, rrTol: 3 }
      ],
      defectCategories: [
        {
          name: "주요 불량 항목",
          items: ["외면 흠", "오염", "치수 미달", "가공 불량", "기타"]
        }
      ],
      maintenanceConfig: {
        hasBladeChange: selectedCategory === "MATERIAL_PREP",
        hasTroubleAction: true,
        bladeWarningLimit: 50000
      }
    });
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Template
  const handleEdit = (tpl) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setIsEditorOpen(true);
  };

  // Clone Template
  const handleClone = async (tpl) => {
    const newCar = prompt(`[${tpl.carModel}] 양식을 복제합니다.\n새로운 차종명을 입력하세요:`, `${tpl.carModel}_신규`);
    if (!newCar) return;
    try {
      const cloned = await cloneWorkReportTemplate(tpl.id, newCar);
      showToast(`✅ [${newCar}] 양식이 성공적으로 복제 생성되었습니다!`);
      handleEdit(cloned);
    } catch (e) {
      alert("복제 중 오류가 발생했습니다: " + e.message);
    }
  };

  // Delete Template
  const handleDelete = async (tpl) => {
    if (!confirm(`정말 [${tpl.title} - ${tpl.carModel}] 양식을 삭제하시겠습니까?`)) return;
    try {
      await deleteWorkReportTemplate(tpl.id);
      try {
        await deleteMachiningWorkReport(tpl.id);
      } catch (mErr) {}
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      showToast("🗑️ 양식이 삭제되었습니다.");
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  // Delete All Templates
  const handleDeleteAll = async () => {
    if (!confirm("정말 5대 공정 양식 보관함에 있는 모든 양식을 일괄 삭제하시겠습니까?")) return;
    try {
      await deleteAllWorkReportTemplates();
      setTemplates([]);
      showToast("🗑️ 보관함의 모든 양식이 일괄 삭제되었습니다.");
    } catch (e) {
      alert("일괄 삭제 실패: " + e.message);
    }
  };

  // Save Template from Editor (수정등록)
  const handleSaveEditor = async (tplData) => {
    try {
      await saveWorkReportTemplate(tplData);
      setIsEditorOpen(false);
      setEditingTemplate(null);
      setTemplates(getLocalWorkReportTemplates());
      showToast(`✅ [${tplData.carModel || tplData.title || "양식"}] 템플릿이 성공적으로 수정 등록되었습니다!`);
    } catch (e) {
      alert("수정등록 실패: " + e.message);
    }
  };

  // ⚡ 템플릿 적용 (일보 작성 모드로 전환 및 데이터 전달)
  const handleApplyEditor = async (tplData) => {
    try {
      await saveWorkReportTemplate(tplData);
      setIsEditorOpen(false);
      setEditingTemplate(null);
      setLegoInitialData({
        ...tplData,
        appliedAt: Date.now(),
        fromCatalog: true
      });
      setManagerViewMode("LEGO_BUILDER");
      showToast(`⚡ [${tplData.carModel || tplData.title || "양식"}] 템플릿이 성공적으로 적용되었습니다! 즉시 작성이 가능합니다.`);
    } catch (e) {
      alert("템플릿 적용 실패: " + e.message);
    }
  };

  const handleApplyTemplateToBuilder = (tpl) => {
    setLegoInitialData({
      ...tpl,
      appliedAt: Date.now(),
      fromCatalog: true
    });
    setManagerViewMode("LEGO_BUILDER");
    showToast(`⚡ [${tpl.title || tpl.carModel}] 템플릿이 성공적으로 적용되었습니다! 즉시 작성이 가능합니다.`);
  };

  // Open Template in Lego Block Builder for modular editing
  const handleOpenInLegoBuilder = (tpl) => {
    setLegoInitialData(tpl);
    setManagerViewMode("LEGO_BUILDER");
    showToast(`🧩 [${tpl.carModel} - ${tpl.partName}] 양식을 레고 블록 편집기로 불러왔습니다.`);
  };

  // Callback when saved from Lego Builder
  const handleSaveFromLegoBuilder = (savedTpl) => {
    const localList = getLocalWorkReportTemplates();
    if (savedTpl && savedTpl.id && !localList.some((t) => t.id === savedTpl.id)) {
      setTemplates([savedTpl, ...localList]);
    } else {
      setTemplates(localList);
    }
    setSelectedCategory("ALL");
    showToast(`✅ [${savedTpl?.title || "양식"}] 5대 공정 양식 보관함에 등록되었습니다!`);
  };

  return (
    <div className="space-y-3 animate-fadeIn p-1 sm:p-2 text-left">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* 🧭 Top Mode Switcher (컴팩트 고시인성 탭) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 dark:bg-slate-950 rounded-xl border border-slate-700/80 w-fit flex-wrap shadow-xs">
        <button
          type="button"
          onClick={() => setManagerViewMode("LEGO_BUILDER")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            managerViewMode === "LEGO_BUILDER"
              ? "bg-cyan-500 text-slate-950 shadow-xs font-black ring-1 ring-cyan-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>🧩 레고 블록 조합기</span>
        </button>
        <button
          type="button"
          onClick={() => setManagerViewMode("CATALOG")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            managerViewMode === "CATALOG"
              ? "bg-white text-slate-950 shadow-xs font-black"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
          <span>📋 5대 공정 양식 보관함</span>
          {/* 🌟 보관함 뱃지 */}
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 flex items-center gap-0.5">
            <Database className="w-2.5 h-2.5 text-slate-950" />
            <span>{templates.length}</span>
          </span>
        </button>
      </div>

      {managerViewMode === "LEGO_BUILDER" ? (
        <LegoWorkReportBuilder
          initialTemplateData={legoInitialData}
          onSaveToTemplateManager={handleSaveFromLegoBuilder}
          onNavigateToCatalog={() => setManagerViewMode("CATALOG")}
        />
      ) : (
        <>
          {/* ======================================================== */}
          {/* Header Banner (컴팩트 카탈로그 헤더) */}
          {/* ======================================================== */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Layers className="w-4 h-4" />
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white whitespace-nowrap">
                  작업일보 양식 보관함 (5대 공정)
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 whitespace-nowrap">
                  표준 규격
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-1 shadow-xs whitespace-nowrap">
                  <Database className="w-3 h-3 fill-cyan-200 text-white" />
                  <span>DB 공식 보관 ({templates.length}종)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {templates.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>전체 양식 일괄 삭제</span>
                </button>
              )}
              <button
                onClick={handleAddNew}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 새 작업일보 양식 만들기</span>
              </button>
            </div>
          </div>

      {/* ======================================================== */}
      {/* All + 5 Major Categories Switcher Tabs */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-sm ${
            selectedCategory === "ALL"
              ? "bg-white dark:bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 scale-[1.02]"
              : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl">🗂️</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
              총 {templates.length}개 전체
            </span>
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              전체 양식 보기
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              DB에 저장된 모든 작업일보 한눈에 보기
            </p>
          </div>
        </button>

        {REPORT_MAJOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? "ALL" : cat.id)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-sm ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 flex items-center gap-0.5">
                    <Database className="w-2.5 h-2.5" />
                    <span>DB보관함</span>
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    {count}개 양식
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={cat.desc}>
                  {cat.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* Search & Filters Toolbar */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="차종, 품명, 공정명, 양식명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          총 <strong className="text-indigo-600 dark:text-indigo-400">{filteredTemplates.length}</strong>개의 템플릿
        </span>
      </div>

      {/* ======================================================== */}
      {/* Template Cards Grid */}
      {/* ======================================================== */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="text-3xl">📭</div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            해당 분류에 등록된 작업일보 양식이 없습니다.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 cursor-pointer"
          >
            + 첫 번째 양식 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => {
            const specCount = (tpl.legoConfig?.specsCutting || tpl.specs || []).length;
            const defectCount = (tpl.defectCategories || []).reduce((acc, c) => acc + (c.items || []).length, 0);
            const orderedBlocks = getOrderedBlocksForTemplate(tpl);
            const activeOrderedBlocks = orderedBlocks.filter((b) => Boolean(tpl.legoConfig?.activeBlocks?.[b.key]));

            return (
              <div
                key={tpl.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: 차종 → 품명 → 공정명 순서 표시 */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-2xs">
                          {tpl.carModel}
                        </span>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {tpl.partName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40">
                          {tpl.processName || tpl.legoConfig?.processName || "소재준비"}
                        </span>
                        {/* 🌟 보관함 뱃지 & 데이터베이스 뱃지 */}
                        <span className="px-2.5 py-0.8 rounded-full text-[11px] font-black bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 text-white flex items-center gap-1.5 shadow-sm border border-cyan-300/40">
                          <Database className="w-3.5 h-3.5 fill-cyan-100 text-white" />
                          <span>DB 보관함 공식등록</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold mt-1">
                        {tpl.title || "소재준비작업일보"}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {tpl.formNo || "705-02"}
                    </span>
                  </div>

                  {/* Active Lego Blocks Indicator (조립된 전체 블록 순서대로 누락 없이 표시) */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      장착된 레고 블록 ({activeOrderedBlocks.length > 0 ? `${activeOrderedBlocks.length}개 블록 조립됨` : "표준 블록"}):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeOrderedBlocks.length > 0 ? (
                        activeOrderedBlocks.map((b, bIdx) => (
                          <span
                            key={b.key}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              b.isCustom
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                            }`}
                          >
                            {bIdx + 1}. {b.label}
                          </span>
                        ))
                      ) : (
                        <>
                          {tpl.blocks?.timeAndQty && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              ⏱️ 시간/생산량
                            </span>
                          )}
                          {tpl.blocks?.specAndLot && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              📐 치수실측({specCount}개)
                            </span>
                          )}
                          {tpl.blocks?.machineCondition && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🌡️ 성형/설비조건
                            </span>
                          )}
                          {tpl.blocks?.defectMatrix && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              ⚠️ 불량집계({defectCount}개)
                            </span>
                          )}
                          {tpl.blocks?.maintenance && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🔧 설비보전/칼날
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Specs Quick Peek */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 block">
                      기본정보 (차종 · 품명 · 공정명) 및 스펙 요약:
                    </span>
                    <div className="flex items-center justify-between text-[10.5px] font-black text-slate-700 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                      <span>차종: {tpl.carModel || "-"}</span>
                      <span>품명: {tpl.partName || "-"}</span>
                      <span>공정명: {tpl.processName || tpl.legoConfig?.processName || "소재준비"}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
                      {(tpl.legoConfig?.specsCutting || tpl.specs || []).slice(0, 3).map((s, idx) => (
                        <div key={s.id || idx} className="flex items-center justify-between">
                          <span>단면 {s.section || s.name}</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{s.spec1 || s.frtSpec || s.spec || "-"}</span>
                        </div>
                      ))}
                      {(tpl.legoConfig?.specsCutting || tpl.specs || []).length > 3 && (
                        <span className="text-[10px] text-slate-400 block text-right font-bold">
                          + 외 {(tpl.legoConfig?.specsCutting || tpl.specs || []).length - 3}개 항목
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons: 전체보기 뱃지 (탭 시 템플릿 열람/수정 및 수정등록/적용 지원) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleEdit(tpl)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer"
                    title="양식 템플릿 전체를 확인하고 수정 및 일보에 적용합니다."
                  >
                    <Eye className="w-4 h-4 text-indigo-200" />
                    <span>전체보기</span>
                  </button>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleOpenInLegoBuilder(tpl)}
                      className="p-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="레고 블록 양식 조합기에서 블록 선택 & 앱내 편집"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="hidden sm:inline">블록수정</span>
                    </button>
                    <button
                      onClick={() => {
                        setPreviewTemplate(tpl);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="A4 실물 양식 보기 / 인쇄"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="hidden sm:inline">A4양식</span>
                    </button>
                    <button
                      onClick={() => handleClone(tpl)}
                      className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="새 차종으로 1초 복제"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">복제</span>
                    </button>
                    <button
                      onClick={() => handleDelete(tpl)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Lego Block Template Editor (전체보기 / 수정등록 / 템플릿적용) */}
      {/* ======================================================== */}
      {isEditorOpen && editingTemplate && (
        <LegoTemplateEditorModal
          template={editingTemplate}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveEditor}
          onApply={handleApplyEditor}
        />
      )}

      {/* ======================================================== */}
      {/* Modal: A4 Print Preview Modal */}
      {/* ======================================================== */}
      {isPreviewOpen && previewTemplate && (
        <A4PrintPreviewModal
          template={previewTemplate}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Standard A4 Sheet & Assembled Lego Block Renderer
// - 상단 제목 한 줄 통일 (소재준비작업일보)
// - 기본 정보 헤더: 차종 -> 품명 -> 공정명 -> 작업자 -> 근무시간 순서
// - 레고 블록 조합기에서 조립한 모든 블록(표준 18종 + 사진분석 커스텀 블록 + 비가동/부적합 패널)을
//   설계한 blockOrder 순서 그대로 누락 없이 100% 렌더링
// ============================================================================
export const MaterialPrepStandardA4Sheet = ({ template, showBlockBadges = false }) => {
  const cfg = template?.legoConfig || null;
  const orderedBlocks = useMemo(() => getOrderedBlocksForTemplate(template), [template]);
  const hasLegoBlocks = Boolean(cfg && cfg.activeBlocks && Object.keys(cfg.activeBlocks).length > 0);

  const rawTitle = cfg?.title || template?.title || "소재준비작업일보";
  const unifiedTitle =
    rawTitle === "소재 준비 작업 일보" || rawTitle === "소재 준비 작업 일보 (G/RUN)"
      ? "소재준비작업일보"
      : rawTitle;

  const carModelVal = cfg?.carModel || template?.carModel || "9BQC";
  const partNameVal = cfg?.partName || template?.partName || "G/RUN";
  const processNameVal = cfg?.processName || template?.processName || "소재준비";
  const workerNameVal = cfg?.workerName || template?.workerName || "";
  const workDateVal = cfg?.workDate || "";
  const workTimeRange =
    cfg?.startTime || cfg?.finishTime ? `${cfg?.startTime || "08:00"} ~ ${cfg?.finishTime || "17:00"}` : "";

  const specs =
    Array.isArray(cfg?.specsCutting) && cfg.specsCutting.length > 0
      ? cfg.specsCutting.map((s) => ({
          id: s.id,
          section: s.section,
          name: s.section,
          frtSpec: s.spec1,
          spec: s.spec1,
          startVal: s.start1,
          halfVal: s.half1,
          finishVal: s.finish1,
          lotStart: s.lotStart ?? s.lotNo,
          lotHalf: s.lotHalf ?? s.lotNo,
          lotFinish: s.lotFinish ?? s.lotNo
        }))
      : template?.specs || [];

  const defectCategories = template?.defectCategories || [];
  const extrusionItems = defectCategories[0]?.items || [
    "스코치(Scortch)",
    "외면 흠(Scratch)",
    "오염(Contamination)",
    "길이 미달(Length Bad)",
    "와이어 노출"
  ];
  const processItems = defectCategories[1]?.items || [
    "길이 (Length Bad)",
    "단컷팅(Step Cutt,g)",
    "기타 ( Etc )"
  ];

  // Basic Info Header Table (차종 -> 품명 -> 공정명 -> 작업자 -> 근무시간 순서)
  const renderBasicInfoHeader = (badgeText = "[블록 8] 작업 기본 정보 헤더") => (
    <div className="relative" key="basicInfo">
      {showBlockBadges && (
        <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
          {badgeText}
        </span>
      )}
      <table className="w-full border-collapse border border-black text-xs font-bold">
        <tbody>
          <tr>
            <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">차종(Car model)</td>
            <td className="border border-black w-[15%] p-1 text-center font-black">{carModelVal}</td>
            <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">품 명(Part name)</td>
            <td className="border border-black w-[15%] p-1 text-center font-black">{partNameVal}</td>
            <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">공정명(Process)</td>
            <td className="border border-black w-[15%] p-1 text-center font-black text-indigo-900">{processNameVal}</td>
            <td className="border border-black bg-[#fef9c3] w-[10%] p-1 text-center font-bold">작업자(Worker)</td>
            <td className="border border-black w-[12%] p-1 text-center font-black">{workerNameVal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Render an individual assembled Lego Block by key
  const renderAssembledBlock = (blockItem, orderIdx) => {
    const key = blockItem.key;
    const badgeLabel = `[조립 ${orderIdx + 1}] ${blockItem.label}`;

    if (key === "basicInfo") {
      return renderBasicInfoHeader(badgeLabel);
    }

    if (key === "workTimeOutput") {
      const rows = Array.isArray(cfg?.workTimeOutput) ? cfg.workTimeOutput : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th rowSpan={2} className="border-r border-black p-1 w-[20%]">구 분(Division)</th>
                <th colSpan={3} className="border-r border-black p-1">A단면 실적</th>
                <th colSpan={3} className="p-1">B단면 실적</th>
              </tr>
              <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
                <th className="border-r border-black p-1">시작시간</th>
                <th className="border-r border-black p-1">종료시간</th>
                <th className="border-r border-black p-1">생산수량</th>
                <th className="border-r border-black p-1">시작시간</th>
                <th className="border-r border-black p-1">종료시간</th>
                <th className="p-1">생산수량</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rIdx) => (
                <tr key={r.id || rIdx} className="border-b border-black">
                  <td className="border-r border-black bg-[#fef9c3]/40 p-1 font-black">{r.division}</td>
                  <td className="border-r border-black p-1 font-mono">{r.startA || ""}</td>
                  <td className="border-r border-black p-1 font-mono">{r.finishA || ""}</td>
                  <td className="border-r border-black p-1 font-mono font-black text-indigo-900">{r.qtyA ?? ""}</td>
                  <td className="border-r border-black p-1 font-mono">{r.startB || ""}</td>
                  <td className="border-r border-black p-1 font-mono">{r.finishB || ""}</td>
                  <td className="p-1 font-mono font-black text-indigo-900">{r.qtyB ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "specsCutting") {
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={3} className="border-r border-black p-1 w-[28%]">구 분(Division)</th>
                <th className="border-r border-black p-1 w-[24%]">초물(Start)</th>
                <th className="border-r border-black p-1 w-[24%]">중물(Half)</th>
                <th className="p-1 w-[24%]">종물(Finish)</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, sIdx) => {
                const isFirst = sIdx === 0;
                const totalSpecs = specs.length;
                return (
                  <React.Fragment key={spec.id || sIdx}>
                    <tr className="border-b border-black">
                      {isFirst && (
                        <td
                          rowSpan={totalSpecs * 3}
                          className="border-r border-black bg-[#fef9c3] p-1 font-bold w-[10%] text-center align-middle"
                        >
                          <div className="leading-snug">
                            정치 절단<br />길이(Spec<br />cutting)
                          </div>
                        </td>
                      )}
                      <td rowSpan={3} className="border-r border-black p-1 w-[9%] text-center font-bold">
                        {spec.section || spec.name || `Section ${sIdx + 1}`}
                      </td>
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold w-[9%]">
                        규격(Spec)
                      </td>
                      <td colSpan={3} className="p-0.5 text-center font-black text-indigo-900 bg-slate-50/50">
                        {spec.frtSpec || spec.spec || "-"}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                        초/중/종
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                        {spec.startVal || spec.start1 || ""}
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                        {spec.halfVal || spec.half1 || ""}
                      </td>
                      <td className="p-0.5 h-6 text-center font-mono">
                        {spec.finishVal || spec.finish1 || ""}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                        LOT NO.
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotStart || spec.lotNo || ""}
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotHalf || spec.lotNo || ""}
                      </td>
                      <td className="p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotFinish || spec.lotNo || ""}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "stepCuttingFrt" || key === "stepCuttingRr") {
      const list = key === "stepCuttingFrt" ? cfg?.stepCuttingFrt || [] : cfg?.stepCuttingRr || [];
      const titleText = key === "stepCuttingFrt" ? "단컷팅 - FRT 구간 치수" : "단컷팅 - RR 구간 치수";
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <div className="border border-black">
            <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px]">
              ■ {titleText}
            </div>
            <table className="w-full border-collapse text-xs text-center font-bold">
              <thead>
                <tr className="bg-slate-50 border-b border-black text-[11px]">
                  <th className="border-r border-black p-1 w-1/4">구분</th>
                  {list.map((c, idx) => (
                    <th key={c.id || idx} className="border-r last:border-r-0 border-black p-1">
                      {c.section}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 bg-[#fef9c3]/50 font-bold">SPEC</td>
                  {list.map((c, idx) => (
                    <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-black text-indigo-900">
                      {c.spec}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">초물(Start)</td>
                  {list.map((c, idx) => (
                    <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                      {c.startVal || ""}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold">중물(Half)</td>
                  {list.map((c, idx) => (
                    <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                      {c.halfVal || ""}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border-r border-black p-1 font-bold">종물(Finish)</td>
                  {list.map((c, idx) => (
                    <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                      {c.finishVal || ""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (key === "subMaterialLot") {
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs font-bold">
            <tbody>
              <tr>
                <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[25%] text-center font-black">
                  부자재 LOT NO. (패드 5T)
                </td>
                <td className="p-1.5 font-mono font-bold text-left px-3">
                  {cfg?.subMaterialLot || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "defectMaterialMatrix") {
      const rows = Array.isArray(cfg?.defectMaterialMatrix) ? cfg.defectMaterialMatrix : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th rowSpan={2} colSpan={2} className="border-r border-black p-1 w-[22%]">구 분(Division)</th>
                <th colSpan={4} className="border-r border-black p-1">FRT</th>
                <th colSpan={4} className="p-1">RR</th>
              </tr>
              <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
                <th className="border-r border-black p-0.5">LH A</th>
                <th className="border-r border-black p-0.5">RH A</th>
                <th className="border-r border-black p-0.5">LH B</th>
                <th className="border-r border-black p-0.5">RH B</th>
                <th className="border-r border-black p-0.5">LH A</th>
                <th className="border-r border-black p-0.5">RH A</th>
                <th className="border-r border-black p-0.5">LH B</th>
                <th className="p-0.5">RH B</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black">
                  {idx === 0 && (
                    <td rowSpan={Math.min(4, rows.length)} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-16">
                      압출소재<br />불량
                    </td>
                  )}
                  {idx === 4 && (
                    <td rowSpan={Math.max(1, rows.length - 4)} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-16">
                      공정간<br />불량
                    </td>
                  )}
                  <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.frtLhA ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.frtRhA ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.frtLhB ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.frtRhB ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.rrLhA ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.rrRhA ?? ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.rrLhB ?? ""}</td>
                  <td className="p-0.5 font-mono">{row.rrRhB ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "defectSectionAbc") {
      const rows = Array.isArray(cfg?.defectSectionAbc) ? cfg.defectSectionAbc : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1 w-1/2">불량소재구분 (Section A / B / C)</th>
                <th className="border-r border-black p-1">Section A</th>
                <th className="border-r border-black p-1">Section B</th>
                <th className="p-1">Section C</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black">
                  <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
                  <td className="border-r border-black p-1 font-mono">{row.secA ?? 0}</td>
                  <td className="border-r border-black p-1 font-mono">{row.secB ?? 0}</td>
                  <td className="p-1 font-mono">{row.secC ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "timeAndOutput") {
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1">구 분</th>
                <th className="border-r border-black p-1">작업자</th>
                <th className="border-r border-black p-1">작업시간</th>
                <th className="border-r border-black p-1">정품수량</th>
                <th className="border-r border-black p-1">불량수량</th>
                <th className="p-1">재조인트</th>
              </tr>
            </thead>
            <tbody>
              {["FRT LH", "FRT RH", "RR LH", "RR RH"].map((div) => (
                <tr key={div} className="border-b border-black">
                  <td className="border-r border-black p-1 bg-slate-50 font-black">{div}</td>
                  <td className="border-r border-black p-1">{workerNameVal || "-"}</td>
                  <td className="border-r border-black p-1 font-mono">{workTimeRange || "08:00 ~ 17:00"}</td>
                  <td className="border-r border-black p-1 font-mono font-black">350</td>
                  <td className="border-r border-black p-1 font-mono">1</td>
                  <td className="p-1 font-mono">1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "jointMaterial") {
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs font-bold">
            <tbody>
              <tr>
                <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[20%] text-center font-black">조인트 재료명</td>
                <td className="border-r border-black p-1.5 w-[30%] text-center font-black text-indigo-900">
                  {cfg?.jointMaterial?.gradeName || "-"}
                </td>
                <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[20%] text-center font-black">재료 LOT NO.</td>
                <td className="p-1.5 w-[30%] text-center font-mono">
                  {cfg?.jointMaterial?.lotNo || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "injectionTemp") {
      const temps = Array.isArray(cfg?.injectionTemps) ? cfg.injectionTemps : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th colSpan={2} className="border-r border-black p-1 w-1/4">사출온도 구분</th>
                <th className="border-r border-black p-1">노즐(Nozzle)</th>
                <th className="border-r border-black p-1">실린더 1(N2)</th>
                <th className="border-r border-black p-1">실린더 2(H3)</th>
                <th className="p-1">실린더 3(H4)</th>
              </tr>
            </thead>
            <tbody>
              {temps.map((t, idx) => (
                <tr key={t.id || idx} className="border-b border-black">
                  {idx === 0 && (
                    <td rowSpan={3} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-14">Sett'g</td>
                  )}
                  {idx === 3 && (
                    <td rowSpan={3} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-14">Actual</td>
                  )}
                  <td className="border-r border-black p-1 font-bold">{t.machine}</td>
                  <td className="border-r border-black p-1 font-mono">{t.nozzle}</td>
                  <td className="border-r border-black p-1 font-mono">{t.cyl1}</td>
                  <td className="border-r border-black p-1 font-mono">{t.cyl2}</td>
                  <td className="p-1 font-mono">{t.cyl3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "injectionCondition") {
      const conds = Array.isArray(cfg?.injectionConditions) ? cfg.injectionConditions : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1 w-1/4">사출조건 항목</th>
                <th className="border-r border-black p-1 w-1/4">SPEC</th>
                <th className="border-r border-black p-1">초물(Start)</th>
                <th className="border-r border-black p-1">중물(Half)</th>
                <th className="p-1">종물(Finish)</th>
              </tr>
            </thead>
            <tbody>
              {conds.map((c, idx) => (
                <tr key={c.id || idx} className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold bg-slate-50">{c.name}</td>
                  <td className="border-r border-black p-1 font-black text-indigo-900">{c.spec}</td>
                  <td className="border-r border-black p-1 font-mono">{c.startVal}</td>
                  <td className="border-r border-black p-1 font-mono">{c.halfVal}</td>
                  <td className="p-1 font-mono">{c.finishVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "jointDefectMatrix") {
      const rows = Array.isArray(cfg?.jointDefects) ? cfg.jointDefects : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th rowSpan={2} className="border-r border-black p-1 w-[22%]">공정불량 구분</th>
                <th colSpan={5} className="border-r border-black p-1">폐기불량 (FRT A/B/C · RR A/B)</th>
                <th colSpan={2} className="border-r border-black p-1">재조인트 (FRT/RR)</th>
                <th colSpan={2} className="p-1">공정간불량 (FRT/RR)</th>
              </tr>
              <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
                <th className="border-r border-black p-0.5">F-A</th>
                <th className="border-r border-black p-0.5">F-B</th>
                <th className="border-r border-black p-0.5">F-C</th>
                <th className="border-r border-black p-0.5">R-A</th>
                <th className="border-r border-black p-0.5">R-B</th>
                <th className="border-r border-black p-0.5">FRT</th>
                <th className="border-r border-black p-0.5">RR</th>
                <th className="border-r border-black p-0.5">FRT</th>
                <th className="p-0.5">RR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border-r border-black p-1 text-left px-2 font-bold">{r.name}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.frtA || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.frtB || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.frtC || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.rrA || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.rrB || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.reworkFrt || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.reworkRr || ""}</td>
                  <td className="border-r border-black p-0.5 font-mono">{r.processFrt || ""}</td>
                  <td className="p-0.5 font-mono">{r.processRr || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "drawingSpecCheck") {
      const rows = Array.isArray(cfg?.drawingSpecs) ? cfg.drawingSpecs : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1 w-1/4">도면 치수 항목</th>
                <th className="border-r border-black p-1 w-1/4">규 격(Spec)</th>
                <th className="border-r border-black p-1">초물(Start)</th>
                <th className="border-r border-black p-1">중물(Half)</th>
                <th className="p-1">종물(Finish)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ds, idx) => (
                <tr key={ds.id || idx} className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold bg-slate-50">{ds.section}</td>
                  <td className="border-r border-black p-1 font-black text-indigo-900">{ds.spec}</td>
                  <td className="border-r border-black p-1 font-mono">{ds.startVal || ""}</td>
                  <td className="border-r border-black p-1 font-mono">{ds.halfVal || ""}</td>
                  <td className="p-1 font-mono">{ds.finishVal || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "rightAngleMatrix") {
      const machines = Array.isArray(cfg?.machines) ? cfg.machines : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1 w-1/4">완제품 직각검사 호기</th>
                {machines.map((m, idx) => (
                  <th key={m.id || idx} className="border-r last:border-r-0 border-black p-1">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 bg-slate-50 font-bold">검사수량</td>
                {machines.map((m, idx) => (
                  <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">{m.inspectQty}</td>
                ))}
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 bg-slate-50 font-bold">정품수량</td>
                {machines.map((m, idx) => (
                  <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono font-black text-indigo-900">{m.goodQty}</td>
                ))}
              </tr>
              <tr>
                <td className="border-r border-black p-1 bg-slate-50 font-bold">불량(리워크/폐기)</td>
                {machines.map((m, idx) => (
                  <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                    {m.reworkQty || 0} / {m.scrapQty || 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "frtRightAngleDefects") {
      const rows = Array.isArray(cfg?.frtRightAngleDefects) ? cfg.frtRightAngleDefects : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
                <th className="border-r border-black p-1 w-1/2">FRT 직각검사 불량 항목</th>
                <th className="border-r border-black p-1">FRT LH</th>
                <th className="border-r border-black p-1">FRT RH</th>
                <th className="p-1">합 계</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black">
                  <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
                  <td className="border-r border-black p-1 font-mono">{row.frtLh || 0}</td>
                  <td className="border-r border-black p-1 font-mono">{row.frtRh || 0}</td>
                  <td className="p-1 font-mono font-black">{(Number(row.frtLh) || 0) + (Number(row.frtRh) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "remarks") {
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs font-bold">
            <tbody>
              <tr>
                <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[22%] font-black">
                  특기사항 및 조치사항
                </td>
                <td className="p-2 text-left font-bold">
                  {cfg?.remarks || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "downtimeDefectPanel") {
      const events = Array.isArray(cfg?.downtimeEvents) ? cfg.downtimeEvents : [];
      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <div className="border border-black">
            <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px] flex items-center justify-between">
              <span>■ 비가동 및 부적합품 발생내역 (조치전·후 사진 포함)</span>
              <span className="text-[10px] font-bold">총 {events.length}건</span>
            </div>
            <table className="w-full border-collapse text-xs text-center font-bold">
              <thead>
                <tr className="bg-slate-50 border-b border-black text-[10.5px]">
                  <th className="border-r border-black p-1 w-[14%]">구분</th>
                  <th className="border-r border-black p-1 w-[22%]">유형/원인</th>
                  <th className="border-r border-black p-1 w-[16%]">시간(분)</th>
                  <th className="border-r border-black p-1 w-[14%]">수량</th>
                  <th className="p-1">조치내용 및 사진</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2 text-slate-500 text-[11px]">
                      등록된 비가동/부적합 내역 없음 (실제 작업 시 조치전·후 사진 등록)
                    </td>
                  </tr>
                ) : (
                  events.map((ev, idx) => (
                    <tr key={ev.id || idx} className="border-b last:border-b-0 border-black">
                      <td className="border-r border-black p-1 font-black">
                        {ev.category === "DEFECT" ? "부적합품" : "비가동"}
                      </td>
                      <td className="border-r border-black p-1">{ev.type || "-"}</td>
                      <td className="border-r border-black p-1 font-mono">
                        {ev.startTime || ""}{ev.endTime ? `~${ev.endTime}` : ""} {ev.minutes ? `(${ev.minutes}분)` : ""}
                      </td>
                      <td className="border-r border-black p-1 font-mono">{ev.defectQty || 0}</td>
                      <td className="p-1 text-left px-2">
                        <div>{ev.actionNote || ev.reason || "-"}</div>
                        {(ev.beforePhotoUrl || ev.afterPhotoUrl) && (
                          <div className="flex items-center gap-2 mt-1">
                            {ev.beforePhotoUrl && (
                              <img src={ev.beforePhotoUrl} alt="조치전" className="h-10 w-14 object-cover border border-black" />
                            )}
                            {ev.afterPhotoUrl && (
                              <img src={ev.afterPhotoUrl} alt="조치후" className="h-10 w-14 object-cover border border-black" />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Custom Photo-Analyzed Block (custom_*)
    if (blockItem.isCustom) {
      const cb = blockItem.customData || {};
      const tbl = cfg?.customBlockTables?.[key];
      const cols =
        Array.isArray(tbl?.columns) && tbl.columns.length > 0
          ? tbl.columns
          : Array.isArray(cb.columns) && cb.columns.length > 0
          ? cb.columns
          : ["항목 1", "항목 2", "항목 3"];
      const rows =
        Array.isArray(tbl?.rows) && tbl.rows.length > 0
          ? tbl.rows
          : Array.isArray(cb.rows) && cb.rows.length > 0
          ? cb.rows
          : [["", "", ""]];

      return (
        <div key={key} className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              {badgeLabel}
            </span>
          )}
          <div className="border border-black">
            <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px]">
              ■ {cb.title || cb.label || blockItem.label}
            </div>
            <table className="w-full border-collapse text-xs text-center font-bold">
              <thead>
                <tr className="bg-slate-50 border-b border-black text-[11px]">
                  {cols.map((colName, cIdx) => (
                    <th key={cIdx} className="border-r last:border-r-0 border-black p-1">
                      {colName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((rowArr, rIdx) => {
                  const cells = Array.isArray(rowArr) ? rowArr : Array.isArray(rowArr?.cells) ? rowArr.cells : [];
                  return (
                    <tr key={rIdx} className="border-b last:border-b-0 border-black">
                      {cols.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={`border-r last:border-r-0 border-black p-1 ${
                            cIdx === 0 ? "bg-slate-50 font-black" : "font-mono"
                          }`}
                        >
                          {cells[cIdx] ?? ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-white text-black p-4 sm:p-6 border-2 border-black font-sans text-xs space-y-2.5 select-text">
      {/* Title & Approval Box (상단 제목 한 줄 통일: 소재준비작업일보) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-center pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-black inline-block tracking-wider border-b-[3px] border-double border-black pb-0.5">
            {unifiedTitle}
          </h1>
        </div>
        <table className="border-collapse border border-black text-[11px] w-40 text-center font-bold shrink-0">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black py-0.5 w-1/3">작 성</th>
              <th className="border-r border-black py-0.5 w-1/3">검 토</th>
              <th className="py-0.5 w-1/3">승 인</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10 text-slate-400">
              <td className="border-r border-black align-bottom pb-1 text-black font-black">{workerNameVal || "(인)"}</td>
              <td className="border-r border-black align-bottom pb-1">(인)</td>
              <td className="align-bottom pb-1">(인)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Work Date Meta Row (공정명 중복 줄 제거 -> 기본정보 헤더의 차종·품명·공정명 순으로 일원화) */}
      <div className="flex items-center justify-between text-xs font-bold text-black pt-0.5">
        <span className="text-[11px] text-slate-700">※Record Time : Start / Half / Finish</span>
        <div className="text-[11px]">
          작업일자(Date) : {workDateVal || "20    년    월    일"}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CASE A: 레고 블록 조합기에서 조립·설계한 블록이 있는 경우 (100% 순서/구현 일치) */}
      {/* ==================================================================== */}
      {hasLegoBlocks ? (
        <div className="space-y-2.5">
          {!cfg?.activeBlocks?.basicInfo && renderBasicInfoHeader()}
          {orderedBlocks
            .filter((b) => Boolean(cfg?.activeBlocks?.[b.key]))
            .map((b, idx) => renderAssembledBlock(b, idx))}
        </div>
      ) : (
        /* ==================================================================== */
        /* CASE B: 레거시 양식 호환 렌더링 */
        /* ==================================================================== */
        <div className="space-y-2.5">
          {renderBasicInfoHeader()}

          {template?.blocks?.timeAndQty && (
            <div className="relative">
              {showBlockBadges && (
                <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                  [블록 1] 작업시간 & 생산량
                </span>
              )}
              <table className="w-full border-collapse border border-black text-xs text-center font-bold">
                <thead>
                  <tr className="bg-[#fef9c3] border-b border-black">
                    <th colSpan={2} className="border-r border-black p-1 w-1/3">구 분(Division)</th>
                    <th className="border-r border-black p-1 w-1/3">FRT</th>
                    <th className="p-1 w-1/3">RR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black bg-[#fef9c3] p-1 w-1/6 font-bold">작업시간(time)</td>
                    <td className="border-r border-black p-1 w-1/6 font-bold">시작(S)~종료(F)</td>
                    <td className="border-r border-black p-1">~</td>
                    <td className="p-1"></td>
                  </tr>
                  <tr className="border-b border-black">
                    <td rowSpan={3} className="border-r border-black bg-[#fef9c3] p-1 font-bold">
                      생산량 (Q,ty)
                    </td>
                    <td className="border-r border-black p-1 font-bold">
                      <div className="flex justify-between px-2 text-[11px]">
                        <span>(계획/실적)</span>
                        <span>A</span>
                      </div>
                    </td>
                    <td className="border-r border-black p-1">/</td>
                    <td className="p-1">/</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold">
                      <div className="flex justify-between px-2 text-[11px]">
                        <span>(Plan/Output)</span>
                        <span>B</span>
                      </div>
                    </td>
                    <td className="border-r border-black p-1">/</td>
                    <td className="p-1">/</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold">
                      <div className="flex justify-end px-2 text-[11px]">
                        <span>C</span>
                      </div>
                    </td>
                    <td className="border-r border-black p-1">/</td>
                    <td className="p-1 relative overflow-hidden h-6">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
                      </svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {template?.blocks?.specAndLot && (
            <div className="relative">
              {showBlockBadges && (
                <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                  [블록 2] 정치 절단 길이 & LOT NO.
                </span>
              )}
              <table className="w-full border-collapse border border-black text-xs text-center font-bold">
                <thead>
                  <tr className="bg-[#fef9c3] border-b border-black">
                    <th colSpan={3} className="border-r border-black p-1 w-[28%]">구 분(Division)</th>
                    <th className="border-r border-black p-1 w-[24%]">초물(Start)</th>
                    <th className="border-r border-black p-1 w-[24%]">중물(Half)</th>
                    <th className="p-1 w-[24%]">종물(Finish)</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((spec, sIdx) => {
                    const isFirst = sIdx === 0;
                    const totalSpecs = specs.length;
                    return (
                      <React.Fragment key={spec.id || sIdx}>
                        <tr className="border-b border-black">
                          {isFirst && (
                            <td
                              rowSpan={totalSpecs * 3}
                              className="border-r border-black bg-[#fef9c3] p-1 font-bold w-[10%] text-center align-middle"
                            >
                              <div className="leading-snug">
                                정치 절단<br />길이(Spec<br />cutting)
                              </div>
                            </td>
                          )}
                          <td rowSpan={3} className="border-r border-black p-1 w-[9%] text-center font-bold">
                            {spec.section || spec.name || `Section ${sIdx + 1}`}
                          </td>
                          <td className="border-r border-black p-0.5 text-center text-[11px] font-bold w-[9%]">
                            규격(Spec)
                          </td>
                          <td colSpan={3} className="p-0.5 text-center font-black text-indigo-900 bg-slate-50/50">
                            {spec.frtSpec || spec.spec || "-"}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                            초/중/종
                          </td>
                          <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                            {spec.startVal || spec.start1 || ""}
                          </td>
                          <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                            {spec.halfVal || spec.half1 || ""}
                          </td>
                          <td className="p-0.5 h-6 text-center font-mono">
                            {spec.finishVal || spec.finish1 || ""}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                            LOT NO.
                          </td>
                          <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                            {spec.lotStart || spec.lotNo || ""}
                          </td>
                          <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                            {spec.lotHalf || spec.lotNo || ""}
                          </td>
                          <td className="p-0.5 h-6 text-center font-mono text-[10.5px]">
                            {spec.lotFinish || spec.lotNo || ""}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {template?.blocks?.defectMatrix && (
            <div className="relative">
              {showBlockBadges && (
                <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                  [블록 3] 불량소재 구분 매트릭스
                </span>
              )}
              <table className="w-full border-collapse border border-black text-xs text-center font-bold">
                <thead>
                  <tr className="bg-[#fef9c3] border-b border-black">
                    <th colSpan={2} className="border-r border-black p-1 w-[25%]">불량소재구분</th>
                    <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                    <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                    <th className="border-r border-black p-1 w-[12.5%]">Section "C"</th>
                    <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                    <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                    <th className="p-1 w-[12.5%]">Section "C"</th>
                  </tr>
                </thead>
                <tbody>
                  {extrusionItems.map((item, idx) => (
                    <tr key={`ext_${idx}`} className="border-b border-black">
                      {idx === 0 && (
                        <td
                          rowSpan={extrusionItems.length}
                          className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                        >
                          <div className="leading-snug">
                            압출소재<br />불량<br />(Extrusion<br />Badness)
                          </div>
                        </td>
                      )}
                      <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                        {item}
                      </td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="p-0.5 h-4"></td>
                    </tr>
                  ))}
                  {processItems.map((item, idx) => (
                    <tr key={`proc_${idx}`} className="border-b border-black">
                      {idx === 0 && (
                        <td
                          rowSpan={processItems.length}
                          className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                        >
                          <div className="leading-snug">
                            공정간<br />불량(Process<br />Badness)
                          </div>
                        </td>
                      )}
                      <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                        {item}
                      </td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="border-r border-black p-0.5 h-4"></td>
                      <td className="p-0.5 h-4"></td>
                    </tr>
                  ))}
                  <tr className="border-b border-black font-black bg-slate-50">
                    <td colSpan={2} className="border-r border-black p-1 text-center">
                      불량 합계(Bad Sum)
                    </td>
                    <td className="border-r border-black p-1 h-5"></td>
                    <td className="border-r border-black p-1 h-5"></td>
                    <td className="border-r border-black p-1 h-5"></td>
                    <td className="border-r border-black p-1 h-5"></td>
                    <td className="border-r border-black p-1 h-5"></td>
                    <td className="p-1 h-5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {template?.blocks?.maintenance && (
            <div className="relative">
              {showBlockBadges && (
                <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                  [블록 4] 칼날교체 & 설비이상 조치
                </span>
              )}
              <table className="w-full border-collapse border border-black text-xs font-bold">
                <tbody>
                  <tr>
                    <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                      칼날교체 시간
                    </td>
                    <td className="border-r border-black p-2 w-[25%] h-12"></td>
                    <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                      설비 이상 조치사항
                    </td>
                    <td className="p-2 w-[25%] h-12"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-black text-black">
        <span>{cfg?.formNo || template?.formNo || "705-02(REV.4)"}</span>
        <span className="font-black text-sm">{cfg?.companyName || template?.companyName || "(주)오륙"}</span>
        <span>A4(210×297)</span>
      </div>
    </div>
  );
};

// ============================================================================
// Lego Template Editor Modal (Lego Blocks + Real-time live A4 Sheet)
// ============================================================================
export const LegoTemplateEditorModal = ({ template, onClose, onSave, onApply }) => {
  const [formData, setFormData] = useState(template);
  const hasLegoConfig = Boolean(formData?.legoConfig?.activeBlocks);
  const orderedBlocks = useMemo(() => getOrderedBlocksForTemplate(formData), [formData]);

  const updateField = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            [field]: val
          }
        : prev.legoConfig
    }));
  };

  const toggleBlock = (blockKey) => {
    setFormData((prev) => {
      if (prev.legoConfig?.activeBlocks) {
        const nextActive = {
          ...prev.legoConfig.activeBlocks,
          [blockKey]: !prev.legoConfig.activeBlocks[blockKey]
        };
        return {
          ...prev,
          legoConfig: {
            ...prev.legoConfig,
            activeBlocks: nextActive
          }
        };
      }
      return {
        ...prev,
        blocks: {
          ...prev.blocks,
          [blockKey]: !prev.blocks?.[blockKey]
        }
      };
    });
  };

  const handleAddSpec = () => {
    const nextIdx = (formData.specs || []).length + 1;
    const letter = String.fromCharCode(64 + nextIdx);
    const newSpec = {
      id: `sp_${Date.now()}_${nextIdx}`,
      section: letter,
      name: `Section "${letter}"`,
      frtSpec: "600 ± 5mm",
      frtTarget: 600,
      frtTol: 5,
      rrSpec: "600 ± 5mm",
      rrTarget: 600,
      rrTol: 5
    };
    setFormData((prev) => ({
      ...prev,
      specs: [...(prev.specs || []), newSpec],
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: [
              ...(prev.legoConfig.specsCutting || []),
              {
                id: newSpec.id,
                section: letter,
                spec1: "600 ± 5mm",
                start1: "",
                half1: "",
                finish1: "",
                lotStart: "",
                lotHalf: "",
                lotFinish: ""
              }
            ]
          }
        : prev.legoConfig
    }));
  };

  const handleRemoveSpec = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).filter((s) => s.id !== idToRemove),
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: (prev.legoConfig.specsCutting || []).filter((s) => s.id !== idToRemove)
          }
        : prev.legoConfig
    }));
  };

  const handleUpdateSpec = (id, key, val) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).map((s) => (s.id === id ? { ...s, [key]: val } : s)),
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: (prev.legoConfig.specsCutting || []).map((s) =>
              s.id === id && key === "frtSpec" ? { ...s, spec1: val } : s
            )
          }
        : prev.legoConfig
    }));
  };

  const handleAddDefect = (groupIndex = 0) => {
    const defaultPrompt = groupIndex === 0 ? "압출소재 불량 항목명 (예: 크랙, 흑점 등):" : "공정간 불량 항목명 (예: 치수불량 등):";
    const name = prompt(defaultPrompt);
    if (!name || !name.trim()) return;
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[groupIndex]) {
        cats[groupIndex] = { name: groupIndex === 0 ? "압출소재 불량 (Extrusion Badness)" : "공정간 불량(Process Badness)", items: [] };
      }
      cats[groupIndex] = { ...cats[groupIndex], items: [...(cats[groupIndex].items || []), name.trim()] };
      return { ...prev, defectCategories: cats };
    });
  };

  const handleRemoveDefect = (catIdx, itemIdx) => {
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[catIdx]) return prev;
      const items = [...cats[catIdx].items];
      items.splice(itemIdx, 1);
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, defectCategories: cats };
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[94vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                작업일보 템플릿 전체보기 및 양식 편집
              </h3>
              <p className="text-xs text-indigo-200">
                {formData.carModel} • {formData.partName} • {formData.processName || "소재준비"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(formData)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>수정등록</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2-Columns (Left: Builder / Right: Live A4 Sheet) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* LEFT: Builder Controls */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto">
            {/* Step 1: Base Meta (한 줄 제목 통일 + 차종 -> 품명 -> 공정명 순서) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                1. 기본 정보 설정 (차종 · 품명 · 공정명 순)
              </span>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">일보 제목 (한 줄 통일)</label>
                <input
                  type="text"
                  value={formData.title || "소재준비작업일보"}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">1. 차종명</label>
                  <input
                    type="text"
                    value={formData.carModel || ""}
                    onChange={(e) => updateField("carModel", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">2. 품명</label>
                  <input
                    type="text"
                    value={formData.partName || ""}
                    onChange={(e) => updateField("partName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">3. 공정명</label>
                  <input
                    type="text"
                    value={formData.processName || ""}
                    onChange={(e) => updateField("processName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">양식 번호</label>
                <input
                  type="text"
                  value={formData.formNo || "705-02(REV.4)"}
                  onChange={(e) => updateField("formNo", e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* Step 2: Lego Block Toggles (조립된 전체 레고 블록 스위치) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                  2. 조립 레고 블록 ON/OFF 스위치
                </span>
                <span className="text-[10px] font-bold text-slate-400">실시간 우측 서식 연동</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {hasLegoConfig
                  ? orderedBlocks.map((b, idx) => {
                      const isChecked = Boolean(formData.legoConfig?.activeBlocks?.[b.key]);
                      return (
                        <label
                          key={b.key}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                            isChecked
                              ? "bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-65"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {idx + 1}. {b.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBlock(b.key)}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  : [
                      { key: "timeAndQty", label: "⏱️ [블록 1] 작업시간 & 생산량 블록" },
                      { key: "specAndLot", label: "📐 [블록 2] 정치 절단 길이 & LOT NO." },
                      { key: "defectMatrix", label: "⚠️ [블록 3] 불량소재구분 매트릭스" },
                      { key: "maintenance", label: "🔧 [블록 4] 칼날교체 & 설비이상 조치" }
                    ].map((b) => (
                      <label
                        key={b.key}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formData.blocks?.[b.key])}
                          onChange={() => toggleBlock(b.key)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </label>
                    ))}
              </div>
            </div>

            {/* Step 3: Spec Items Editor */}
            {(formData.blocks?.specAndLot || formData.legoConfig?.activeBlocks?.specsCutting) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                      3. 정치 절단 치수 규격(Spec) 설정
                    </span>
                    <span className="text-[10px] text-slate-400">단면별 기준 규격</span>
                  </div>
                  <button
                    onClick={handleAddSpec}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-black cursor-pointer hover:bg-indigo-500"
                  >
                    + 단면 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(formData.specs || []).map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs">
                          {s.section || s.name || `Section ${idx + 1}`} 단면
                        </span>
                        <button
                          onClick={() => handleRemoveSpec(s.id)}
                          className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="삭제"
                        >
                          × 단면 제거
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">FRT 규격</label>
                          <input
                            type="text"
                            value={s.frtSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "frtSpec", e.target.value)}
                            placeholder="예: 881 ± 3mm"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-indigo-600 dark:text-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">RR 규격</label>
                          <input
                            type="text"
                            value={s.rrSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "rrSpec", e.target.value)}
                            placeholder="예: 488 ± 3mm"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-purple-600 dark:text-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live A4 Sheet Preview (조립된 전체 블록 100% 반영) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start overflow-y-auto">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                실시간 1:1 조립 블록 & 표준 A4 서식 미리보기
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                설계 블록 100% 동기화
              </span>
            </div>

            <MaterialPrepStandardA4Sheet template={formData} showBlockBadges={true} />
          </div>
        </div>

        {/* Modal Footer: [닫기] / [수정등록] / [템플릿 적용] */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            닫기
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. 수정등록 뱃지 */}
            <button
              type="button"
              onClick={() => onSave(formData)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="수정한 템플릿 내용을 양식보관함에 저장 및 갱신합니다."
            >
              <Save className="w-4 h-4" />
              <span>수정등록</span>
            </button>

            {/* 2. 템플릿 적용 뱃지 */}
            <button
              type="button"
              onClick={() => onApply && onApply(formData)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="이 양식을 작업일보 작성기에 즉시 적용하여 일보 작성을 시작합니다."
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>템플릿 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// A4 Print Preview Modal (Standard sheet ready for A4 printing)
// ============================================================================
const A4PrintPreviewModal = ({ template, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white text-black w-full max-w-4xl max-h-[94vh] rounded-3xl p-5 sm:p-8 overflow-y-auto space-y-4 shadow-2xl text-left">
        <div className="flex items-center justify-between border-b pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white"><Printer className="w-5 h-5" /></span>
            <span className="font-black text-base">A4 표준 실물 서식 인쇄 미리보기</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>A4 인쇄 / PDF 저장</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container (설계한 모든 블록을 100% 반영하여 출력) */}
        <MaterialPrepStandardA4Sheet template={template} showBlockBadges={false} />
      </div>
    </div>
  );
};
