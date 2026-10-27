import React, { useState, useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { saveMachiningWorkReport, deleteMachiningWorkReport } from "../../services/machiningWorkReportService";
import {
  translateTerm,
  getCurrentWorkLogLanguage,
  SUPPORTED_LANGUAGES,
  setWorkLogLanguage
} from "../../services/workLogI18nService";
import LegoBlockEditorModal from "./LegoBlockEditorModal.jsx";
import LegoBlockCollectionModal from "./LegoBlockCollectionModal.jsx";
import {
  saveWorkReportTemplate,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  deleteWorkReportTemplate,
  REPORT_MAJOR_CATEGORIES,
  getLocalCustomLegoBlocks,
  subscribeCustomLegoBlocks,
  saveCustomLegoBlock
} from "../../services/workReportTemplateService";

// 🧱 Re-export Preset Templates & Master Metadata from legoPresetData.js
import {
  LEGO_IMAGE_REFERENCES,
  PRESET_REPORTS,
  LEGO_BLOCK_SWITCH_CATALOG,
  DEFAULT_BLOCK_ORDER
} from "./legoPresetData.js";

export {
  LEGO_IMAGE_REFERENCES,
  PRESET_REPORTS,
  LEGO_BLOCK_SWITCH_CATALOG,
  DEFAULT_BLOCK_ORDER
};

// 🧱 Lego Modular Subcomponents
import { LegoBlockWrapper } from "./LegoBlockWrapper.jsx";
import { LegoTopHeroToolbar } from "./LegoTopHeroToolbar.jsx";
import { LegoBlockSwitcherSidebar } from "./LegoBlockSwitcherSidebar.jsx";
import {
  ReportTitleHeader,
  BasicInfoBlock,
  WorkTimeOutputBlock,
  SpecsCuttingBlock,
  StepCuttingBlocks
} from "./LegoMaterialPrepBlocks.jsx";
import {
  DefectMaterialMatrixBlock,
  DefectSectionAbcBlock
} from "./LegoDefectMaterialBlocks.jsx";
import {
  TimeAndOutputBlock,
  JointMaterialBlock,
  InjectionTempConditionBlocks,
  JointDefectMatrixBlock
} from "./LegoJointProcessBlocks.jsx";
import {
  DrawingSpecCheckBlock,
  RightAngleMatrixBlock,
  FrtRightAngleDefectsBlock,
  SubMaterialAndRemarksBlocks,
  CommonInspectionLifecycleBlocks
} from "./LegoInspectionBlocks.jsx";
import { LegoCustomPhotoBlocks } from "./LegoCustomPhotoBlocks.jsx";
import { LegoBottomActionBar } from "./LegoBottomActionBar.jsx";
import { LegoSaveCatalogModal } from "./LegoSaveCatalogModal.jsx";

export const LegoWorkReportBuilder = ({
  initialPresetId = "REPORT_CUTTING",
  initialWorkerName = "",
  initialWorkDate = "",
  initialTemplateData = null,
  onSaveWorkReport,
  onSaveToTemplateManager,
  onNavigateToCatalog,
  onDeleteWorkReport = null,
  isEmbedded = false,
  isWorkerRecordingMode = false,
  currentLang: propLang = null
}) => {
  // Current active report configuration
  const [currentReport, setCurrentReport] = useState(() => {
    // 🌟 작업자 기록 모드(isWorkerRecordingMode)이고 initialTemplateData가 제공된 경우:
    // 전역 브라우저 캐시("oruk_custom_lego_report_v2") 대신 전달된 작업자의 지정 템플릿/이전 작성 데이터를 최우선 로드하여
    // 다른 작업자의 이전 입력 내용과 섞이지 않도록 방지합니다.
    if (isWorkerRecordingMode && initialTemplateData?.legoConfig) {
      const cfg = JSON.parse(JSON.stringify(initialTemplateData.legoConfig));
      if (initialWorkerName) cfg.workerName = initialWorkerName;
      if (initialWorkDate) cfg.workDate = initialWorkDate;
      if (initialTemplateData.title) cfg.title = initialTemplateData.title;
      if (initialTemplateData.carModel) cfg.carModel = initialTemplateData.carModel;
      if (initialTemplateData.partName) cfg.partName = initialTemplateData.partName;
      if (initialTemplateData.processName) cfg.processName = initialTemplateData.processName;
      if (initialTemplateData.targetQty) cfg.targetQty = initialTemplateData.targetQty;
      if (initialTemplateData.orderQty) cfg.orderQty = initialTemplateData.orderQty;
      if (!cfg.targetQty) cfg.targetQty = cfg.orderQty || 350;
      if (!cfg.orderQty) cfg.orderQty = cfg.targetQty || 350;
      return cfg;
    }

    try {
      const saved = localStorage.getItem("oruk_custom_lego_report_v2");
      if (saved && !isWorkerRecordingMode) {
        const parsed = JSON.parse(saved);
        if (initialWorkerName) parsed.workerName = initialWorkerName;
        if (initialWorkDate) parsed.workDate = initialWorkDate;
        if (
          parsed.title === "소재 준비 작업 일보 (정치절단 & 단컷팅)" ||
          parsed.title === "소재 준비 작업 일보" ||
          parsed.title === "소재준비 작업일보"
        ) {
          parsed.title = "소재준비작업일보";
        }
        if (!parsed.processName) {
          parsed.processName = "소재준비";
        }
        parsed.activeBlocks = {
          bladeReplacementBlock: true,
          moldShotCountBlock: true,
          downtimeDefectPanel: true,
          ...(parsed.activeBlocks || {})
        };
        return parsed;
      }
    } catch {}
    const base = PRESET_REPORTS.find((p) => p.id === initialPresetId) || PRESET_REPORTS[0];
    const clone = JSON.parse(JSON.stringify(base));
    if (initialWorkerName) clone.workerName = initialWorkerName;
    if (initialWorkDate) clone.workDate = initialWorkDate;
    return clone;
  });

  const [viewMode, setViewMode] = useState("DIGITAL"); // 'DIGITAL' | 'PRINT_A4'
  const [showPhotoRefModal, setShowPhotoRefModal] = useState(false);
  const [photoModalTab, setPhotoModalTab] = useState("ALL"); // 'ALL' | 'UPLOAD'
  const [customBlocks, setCustomBlocks] = useState(() => getLocalCustomLegoBlocks());
  const [savedTemplates, setSavedTemplates] = useState(() => getLocalWorkReportTemplates());
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState("ALL");
  const [toastMsg, setToastMsg] = useState("");
  const [appliedTemplateBanner, setAppliedTemplateBanner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 Block Selection & In-App Inspector State
  const [selectedBlockKey, setSelectedBlockKey] = useState("specsCutting");
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlockKey, setEditingBlockKey] = useState("specsCutting");
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState(null);
  // Custom block table column drag-and-drop state
  const [draggedCustomCol, setDraggedCustomCol] = useState(null); // { bKey, colIdx }
  const [dragOverCustomCol, setDragOverCustomCol] = useState(null); // { bKey, colIdx }

  // Subscribe to custom uploaded/analyzed Lego blocks & DB saved templates
  useEffect(() => {
    const unsub = subscribeCustomLegoBlocks((list) => {
      if (Array.isArray(list)) {
        setCustomBlocks(list);
      }
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) {
        setSavedTemplates(list);
      }
    });
    const handleCustomEvent = (e) => {
      if (Array.isArray(e.detail)) {
        setCustomBlocks(e.detail);
      } else {
        setCustomBlocks(getLocalCustomLegoBlocks());
      }
    };
    const handleTemplatesEvent = (e) => {
      if (Array.isArray(e.detail)) {
        setSavedTemplates(e.detail);
      } else {
        setSavedTemplates(getLocalWorkReportTemplates());
      }
    };
    window.addEventListener("custom-lego-blocks-updated", handleCustomEvent);
    window.addEventListener("work-report-templates-updated", handleTemplatesEvent);
    return () => {
      unsub();
      unsubTemplates();
      window.removeEventListener("custom-lego-blocks-updated", handleCustomEvent);
      window.removeEventListener("work-report-templates-updated", handleTemplatesEvent);
    };
  }, []);

  // Auto-persist currentReport to localStorage whenever it changes so no assembled blocks are ever lost
  useEffect(() => {
    try {
      localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(currentReport));
    } catch (e) {
      console.warn("Auto-save currentReport quota warning:", e);
    }
  }, [currentReport]);

  // 🌐 현장 근로자 다국어(한국어, 영어, 베트남어, 태국어, 인도네시아어, 미얀마어 등) 실시간 번역
  const [currentLang, setCurrentLang] = useState(() => propLang || getCurrentWorkLogLanguage());

  useEffect(() => {
    if (propLang) {
      setCurrentLang(propLang);
    }
  }, [propLang]);

  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, []);

  const t = (term) => translateTerm(term, currentLang);

  // Combined catalog: standard blocks + saved custom photo-analyzed blocks
  const combinedSwitchCatalog = useMemo(() => {
    const mergedCustomMap = new Map();
    customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) mergedCustomMap.set(k, cb);
    });
    if (Array.isArray(currentReport.customBlocks)) {
      currentReport.customBlocks.forEach((cb) => {
        const k = cb.key || cb.id;
        if (k && !mergedCustomMap.has(k)) mergedCustomMap.set(k, cb);
      });
    }
    const allCustomList = Array.from(mergedCustomMap.values());
    const customSwitchItems = allCustomList.map((cb, idx) => ({
      key: cb.key || cb.id,
      label: cb.label || cb.title || `사진분석 블록 ${idx + 1}`,
      badge: cb.badge || `사진 ${18 + idx}`,
      isCustom: true,
      customData: cb
    }));
    return [...LEGO_BLOCK_SWITCH_CATALOG, ...customSwitchItems];
  }, [customBlocks, currentReport.customBlocks]);

  // Ordered block switches (persisted in currentReport.blockOrder)
  const orderedBlockItems = useMemo(() => {
    const savedOrder = Array.isArray(currentReport.blockOrder) ? currentReport.blockOrder : [];
    const seen = new Set();
    const list = [];
    savedOrder.forEach((key) => {
      const found = combinedSwitchCatalog.find((b) => b.key === key);
      if (found && !seen.has(key)) {
        seen.add(key);
        list.push(found);
      }
    });
    combinedSwitchCatalog.forEach((b) => {
      if (!seen.has(b.key)) {
        seen.add(b.key);
        list.push(b);
      }
    });
    return list;
  }, [currentReport.blockOrder, combinedSwitchCatalog]);

  const handleMoveBlockOrder = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= orderedBlockItems.length) return;
    const nextKeys = orderedBlockItems.map((b) => b.key);
    const [moved] = nextKeys.splice(fromIdx, 1);
    nextKeys.splice(toIdx, 0, moved);
    const movedLabel = orderedBlockItems[fromIdx]?.label || moved;
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: nextKeys
    }));
    showToast(`↕️ [${movedLabel}] 블록 순서가 ${toIdx + 1}번째로 변경되었습니다.`);
  };

  const handleBlockDrop = (dropIdx) => {
    if (draggedBlockIdx === null || draggedBlockIdx === dropIdx) {
      setDraggedBlockIdx(null);
      setDragOverBlockIdx(null);
      return;
    }
    const nextKeys = orderedBlockItems.map((b) => b.key);
    const movedLabel = orderedBlockItems[draggedBlockIdx]?.label || "";
    const [moved] = nextKeys.splice(draggedBlockIdx, 1);
    nextKeys.splice(dropIdx, 0, moved);
    setDraggedBlockIdx(null);
    setDragOverBlockIdx(null);
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: nextKeys
    }));
    showToast(`✨ 드래그 앤 드롭 완료! [${movedLabel}] → ${dropIdx + 1}번째 순서로 배치되었습니다.`);
  };

  const handleResetBlockOrder = () => {
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: [...DEFAULT_BLOCK_ORDER]
    }));
    showToast("🔄 17대 레고 블록 순서가 기본 순서로 초기화되었습니다.");
  };

  // 💾 Save to Catalog Modal State
  const [isSaveCatalogModalOpen, setIsSaveCatalogModalOpen] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState({
    title: "",
    categoryId: "MATERIAL_PREP",
    carModel: "",
    partName: "",
    processName: ""
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Hydrate from initialTemplateData if provided by Template Manager or Admin Assignment
  useEffect(() => {
    if (initialTemplateData) {
      if (initialTemplateData.legoConfig) {
        const cfg = JSON.parse(JSON.stringify(initialTemplateData.legoConfig));
        if (initialTemplateData.title) cfg.title = initialTemplateData.title;
        if (initialTemplateData.carModel) cfg.carModel = initialTemplateData.carModel;
        if (initialTemplateData.partName) cfg.partName = initialTemplateData.partName;
        if (initialTemplateData.processName) cfg.processName = initialTemplateData.processName;
        if (initialWorkerName) cfg.workerName = initialWorkerName;
        if (initialWorkDate) cfg.workDate = initialWorkDate;
        if (initialTemplateData.targetQty) cfg.targetQty = initialTemplateData.targetQty;
        if (initialTemplateData.orderQty) cfg.orderQty = initialTemplateData.orderQty;
        if (!cfg.targetQty) cfg.targetQty = cfg.orderQty || 350;
        if (!cfg.orderQty) cfg.orderQty = cfg.targetQty || 350;
        if (Array.isArray(cfg.customBlocks) && cfg.customBlocks.length > 0) {
          setCustomBlocks((prev) => {
            const map = new Map();
            prev.forEach((b) => map.set(b.key || b.id, b));
            cfg.customBlocks.forEach((b) => map.set(b.key || b.id, b));
            return Array.from(map.values());
          });
        }
        setCurrentReport(cfg);
      } else {
        setCurrentReport((prev) => {
          const clone = JSON.parse(JSON.stringify(prev));
          if (initialTemplateData.title) clone.title = initialTemplateData.title;
          if (initialTemplateData.subTitle) clone.subTitle = initialTemplateData.subTitle;
          if (initialTemplateData.carModel) clone.carModel = initialTemplateData.carModel;
          if (initialTemplateData.partName) clone.partName = initialTemplateData.partName;
          if (initialTemplateData.processName) clone.processName = initialTemplateData.processName;
          if (initialTemplateData.formNo) clone.formNo = initialTemplateData.formNo;
          if (initialTemplateData.companyName) clone.companyName = initialTemplateData.companyName;
          if (initialWorkerName) clone.workerName = initialWorkerName;
          if (initialWorkDate) clone.workDate = initialWorkDate;
          if (initialTemplateData.targetQty) clone.targetQty = initialTemplateData.targetQty;
          if (initialTemplateData.orderQty) clone.orderQty = initialTemplateData.orderQty;
          if (!clone.targetQty) clone.targetQty = clone.orderQty || 350;
          if (!clone.orderQty) clone.orderQty = clone.targetQty || 350;
          if (initialTemplateData.specs && initialTemplateData.specs.length > 0) {
            clone.specsCutting = initialTemplateData.specs.map((sp, idx) => ({
              id: sp.id || `c_${idx}`,
              section: sp.section || sp.name || String.fromCharCode(65 + idx),
              spec1: sp.frtSpec || sp.spec || "600 ± 5mm",
              start1: String(sp.frtTarget || 600),
              half1: String(sp.frtTarget || 600),
              finish1: String(sp.frtTarget || 600),
              lotStart: sp.lotStart || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotHalf: sp.lotHalf || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotFinish: sp.lotFinish || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotNo: `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`
            }));
          }
          return clone;
        });
      }
      setAppliedTemplateBanner(initialTemplateData);
      if (!isWorkerRecordingMode) {
        showToast(`⚡ [${initialTemplateData.title || initialTemplateData.carModel}] 템플릿이 작업일보에 적용되었습니다!`);
      }
    }
  }, [initialTemplateData, initialWorkerName, initialWorkDate, isWorkerRecordingMode]);

  // Load a Preset
  const handleLoadPreset = (presetId) => {
    const found = PRESET_REPORTS.find((p) => p.id === presetId);
    if (!found) return;
    if (confirm(`'${found.name}' 양식으로 전환하시겠습니까?\n현재 입력 중인 내용이 선택한 템플릿의 기본 규격으로 재설정됩니다.`)) {
      const clone = JSON.parse(JSON.stringify(found));
      if (currentReport.workerName) clone.workerName = currentReport.workerName;
      if (currentReport.workDate) clone.workDate = currentReport.workDate;
      setCurrentReport(clone);
      showToast(`⚡ '${found.name}' 양식이 적용되었습니다.`);
    }
  };

  // Toggle active block
  const handleToggleBlock = (blockKey) => {
    const normalizedKey = blockKey === "rightAngleHeader" ? "rightAngleMatrix" : blockKey;
    setCurrentReport((prev) => ({
      ...prev,
      activeBlocks: {
        ...prev.activeBlocks,
        [normalizedKey]: !prev.activeBlocks?.[normalizedKey]
      }
    }));
  };

  // Build complete snapshot of assembled Lego blocks so nothing is ever omitted on save
  const buildFullLegoConfig = (overrides = {}) => {
    const mergedCustomMap = new Map();
    customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) mergedCustomMap.set(k, cb);
    });
    if (Array.isArray(currentReport.customBlocks)) {
      currentReport.customBlocks.forEach((cb) => {
        const k = cb.key || cb.id;
        if (k && !mergedCustomMap.has(k)) mergedCustomMap.set(k, cb);
      });
    }
    const allCustomBlocks = Array.from(mergedCustomMap.values());
    const mergedCustomBlockTables = { ...(currentReport.customBlockTables || {}) };
    const enrichedCustomBlocks = allCustomBlocks.map((cb) => {
      const bKey = cb.key || cb.id;
      const tbl = mergedCustomBlockTables[bKey];
      const columns =
        Array.isArray(tbl?.columns) && tbl.columns.length > 0
          ? tbl.columns
          : Array.isArray(cb.columns) && cb.columns.length > 0
          ? cb.columns
          : ["항목 1", "항목 2", "항목 3"];
      const rows = Array.isArray(tbl?.rows)
        ? tbl.rows
        : Array.isArray(cb.rows)
        ? cb.rows
        : [["", "", ""]];
      mergedCustomBlockTables[bKey] = { columns, rows };
      return {
        ...cb,
        id: bKey,
        key: bKey,
        columns,
        rows
      };
    });

    return {
      ...currentReport,
      ...overrides,
      blockOrder: orderedBlockItems.map((b) => b.key),
      activeBlocks: { ...(currentReport.activeBlocks || {}) },
      customBlockTables: mergedCustomBlockTables,
      customBlocks: enrichedCustomBlocks,
      downtimeEvents: currentReport.downtimeEvents || []
    };
  };

  // Update Field helper
  const handleUpdateField = (key, value) => {
    setCurrentReport((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Select a block & smooth scroll into view
  const handleSelectBlock = (key) => {
    setSelectedBlockKey(key);
    if (!currentReport.activeBlocks?.[key]) {
      setCurrentReport((prev) => ({
        ...prev,
        activeBlocks: {
          ...prev.activeBlocks,
          [key]: true
        }
      }));
    }
    setTimeout(() => {
      const el = document.getElementById(`block_container_${key}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  };

  // Open In-App Block Editor Modal for specific block
  const handleOpenBlockEditor = (key) => {
    setSelectedBlockKey(key);
    setEditingBlockKey(key);
    setIsBlockEditorOpen(true);
  };

  // Open Save-to-Catalog Modal
  const handleOpenSaveCatalogModal = () => {
    setCatalogMeta({
      title: currentReport.title || "소재준비작업일보",
      categoryId: "MATERIAL_PREP",
      carModel: currentReport.carModel || "JA",
      partName: currentReport.partName || "G/RUN",
      processName: currentReport.processName || "소재준비"
    });
    setIsSaveCatalogModalOpen(true);
  };

  // Confirm Save to Template Catalog
  const handleConfirmSaveCatalog = async () => {
    try {
      const curCat = REPORT_MAJOR_CATEGORIES.find((c) => c.id === catalogMeta.categoryId) || REPORT_MAJOR_CATEGORIES[1];
      const fullLegoConfig = buildFullLegoConfig({
        title: catalogMeta.title || currentReport.title || "소재준비작업일보",
        carModel: catalogMeta.carModel || currentReport.carModel || "JA",
        partName: catalogMeta.partName || currentReport.partName || "G/RUN",
        processName: catalogMeta.processName || currentReport.processName || "소재준비"
      });
      const tplPayload = {
        id: `tpl_lego_${Date.now()}`,
        categoryId: catalogMeta.categoryId,
        categoryName: curCat.name,
        title: fullLegoConfig.title,
        subTitle: "",
        carModel: fullLegoConfig.carModel,
        partName: fullLegoConfig.partName,
        processName: fullLegoConfig.processName,
        subProcess: "",
        divisionType: "SECTION_ABC",
        formNo: currentReport.formNo || "705-02(REV.4)",
        companyName: currentReport.companyName || "(주)오륙",
        isLegoModular: true,
        isDatabaseBacked: true,
        legoConfig: fullLegoConfig,
        blocks: {
          timeAndQty: Boolean(fullLegoConfig.activeBlocks?.workTimeOutput || fullLegoConfig.activeBlocks?.timeAndOutput),
          specAndLot: Boolean(
            fullLegoConfig.activeBlocks?.specsCutting ||
              fullLegoConfig.activeBlocks?.stepCuttingFrt ||
              fullLegoConfig.activeBlocks?.stepCuttingRr ||
              fullLegoConfig.activeBlocks?.drawingSpecCheck ||
              fullLegoConfig.activeBlocks?.subMaterialLot
          ),
          machineCondition: Boolean(
            fullLegoConfig.activeBlocks?.injectionTemp ||
              fullLegoConfig.activeBlocks?.injectionCondition ||
              fullLegoConfig.activeBlocks?.jointMaterial
          ),
          defectMatrix: Boolean(
            fullLegoConfig.activeBlocks?.defectMaterialMatrix ||
              fullLegoConfig.activeBlocks?.defectSectionAbc ||
              fullLegoConfig.activeBlocks?.jointDefectMatrix ||
              fullLegoConfig.activeBlocks?.rightAngleMatrix ||
              fullLegoConfig.activeBlocks?.frtRightAngleDefects
          ),
          maintenance: Boolean(fullLegoConfig.activeBlocks?.remarks || fullLegoConfig.activeBlocks?.downtimeDefectPanel)
        },
        specs: (fullLegoConfig.specsCutting || []).map((s) => ({
          id: s.id,
          section: s.section,
          name: s.section,
          frtSpec: s.spec1,
          rrSpec: s.spec1,
          spec: s.spec1,
          startVal: s.start1,
          halfVal: s.half1,
          finishVal: s.finish1,
          lotStart: s.lotStart,
          lotHalf: s.lotHalf,
          lotFinish: s.lotFinish,
          lotNo: s.lotNo
        })),
        updatedAt: new Date().toISOString()
      };

      setCurrentReport(fullLegoConfig);
      await saveWorkReportTemplate(tplPayload);
      if (onSaveToTemplateManager) {
        onSaveToTemplateManager(tplPayload);
      }
      setIsSaveCatalogModalOpen(false);
      showToast(`🎉 [${tplPayload.title}] 양식이 5대 공정별 표준 보관함에 공식 저장되었습니다!`);
    } catch (err) {
      console.error("템플릿 저장 실패:", err);
      alert("템플릿 저장 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Reusable Interactive Block Wrapper with Selection, Ordering, and Action Toolbar
  // Reusable Interactive Block Wrapper
  const renderBlockWrapper = (blockKey, blockTitle, children, options = {}) => {
    if (!currentReport.activeBlocks?.[blockKey]) return null;
    const { canAddRow = false, onAddRow = null, customBadge = null } = options;
    return (
      <LegoBlockWrapper
        key={blockKey}
        blockKey={blockKey}
        blockTitle={blockTitle}
        isActive={Boolean(currentReport.activeBlocks?.[blockKey])}
        isWorkerRecordingMode={isWorkerRecordingMode}
        selectedBlockKey={selectedBlockKey}
        setSelectedBlockKey={setSelectedBlockKey}
        orderedBlockItems={orderedBlockItems}
        handleMoveBlockOrder={handleMoveBlockOrder}
        handleOpenBlockEditor={handleOpenBlockEditor}
        handleToggleBlock={handleToggleBlock}
        showToast={showToast}
        t={t}
        canAddRow={canAddRow}
        onAddRow={onAddRow}
        customBadge={customBadge}
      >
        {children}
      </LegoBlockWrapper>
    );
  };

  // 1. [행 추가 / 삭제 기능]
  // ===========================================================================
  // A. 정치절단 (Spec cutting) 행 추가/삭제
  const handleAddCuttingSpecRow = () => {
    const count = currentReport.specsCutting?.length || 0;
    const nextChar = String.fromCharCode(65 + count); // A, B, C, D, E...
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const newRow = {
      id: `c_${Date.now()}`,
      section: nextChar,
      spec1: "600 ± 5mm",
      start1: "",
      half1: "",
      finish1: "",
      lotStart: `${datePrefix}-${nextChar}01`,
      lotHalf: `${datePrefix}-${nextChar}01`,
      lotFinish: `${datePrefix}-${nextChar}01`,
      lotNo: `${datePrefix}-${nextChar}01`
    };
    setCurrentReport((prev) => ({
      ...prev,
      specsCutting: [...(prev.specsCutting || []), newRow]
    }));
    showToast(`➕ 정치절단 단면 [${nextChar}] 행이 추가되었습니다.`);
  };

  const handleDeleteCuttingSpecRow = (id) => {
    setCurrentReport((prev) => ({
      ...prev,
      specsCutting: (prev.specsCutting || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 정치절단 단면 행이 삭제되었습니다.");
  };

  // B. 단컷팅 (FRT / RR) 행 추가/삭제
  const handleAddStepCuttingRow = (type) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    const nextSection = String.fromCharCode(65 + (currentReport[listKey]?.length || 0));
    const newRow = {
      id: `sc_${type}_${Date.now()}`,
      section: nextSection,
      spec: type === "FRT" ? "49mm" : "40mm",
      startVal: "",
      halfVal: "",
      finishVal: ""
    };
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), newRow]
    }));
    showToast(`➕ 단컷팅 ${type} [${nextSection}] 치수 행이 추가되었습니다.`);
  };

  const handleDeleteStepCuttingRow = (type, id) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 단컷팅 치수 행이 삭제되었습니다.");
  };

  // C. 도면 치수 검사 행 추가/삭제
  const handleAddDrawingSpecRow = () => {
    const newRow = {
      id: `ds_${Date.now()}`,
      section: "신규 측정 포인트",
      spec: "500 ± 3 mm",
      startVal: "",
      halfVal: "",
      finishVal: ""
    };
    setCurrentReport((prev) => ({
      ...prev,
      drawingSpecs: [...(prev.drawingSpecs || []), newRow]
    }));
    showToast("➕ 중요 치수 검사 행이 추가되었습니다.");
  };

  const handleDeleteDrawingSpecRow = (id) => {
    setCurrentReport((prev) => ({
      ...prev,
      drawingSpecs: (prev.drawingSpecs || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 치수 검사 행이 삭제되었습니다.");
  };

  // D. 직각검사 호기 라인 추가/삭제
  const handleAddMachineRow = () => {
    const count = (currentReport.machines?.length || 0) + 1;
    const newMachine = {
      id: `m_${Date.now()}`,
      name: `호기 ${count}`,
      workTime: "08:00 ~ 17:00",
      inspectQty: 0,
      goodQty: 0,
      reworkQty: 0,
      scrapQty: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      machines: [...(prev.machines || []), newMachine]
    }));
    showToast(`➕ [${newMachine.name}] 호기 열이 추가되었습니다.`);
  };

  const handleDeleteMachineRow = (id) => {
    if ((currentReport.machines?.length || 0) <= 1) {
      alert("최소 1개 이상의 호기가 필요합니다.");
      return;
    }
    setCurrentReport((prev) => ({
      ...prev,
      machines: (prev.machines || []).filter((m) => m.id !== id)
    }));
    showToast("🗑️ 호기 열이 삭제되었습니다.");
  };

  // E. 공정불량(조인트) 항목 추가
  const handleAddJointDefectRow = () => {
    const defectName = prompt("추가할 공정불량 명칭을 입력하세요:", "원단 들뜸");
    if (!defectName) return;
    const newRow = {
      name: defectName,
      frtA: 0,
      frtB: 0,
      frtC: 0,
      rrA: 0,
      rrB: 0,
      reworkFrt: 0,
      reworkRr: 0,
      processFrt: 0,
      processRr: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      jointDefects: [...(prev.jointDefects || []), newRow]
    }));
    showToast(`➕ [${defectName}] 공정불량 항목이 추가되었습니다.`);
  };

  // F. 불량소재 Section A/B/C 항목 추가
  const handleAddDefectSectionAbcRow = () => {
    const defectName = prompt("추가할 불량소재구분 명칭을 입력하세요:", "이물 혼입");
    if (!defectName) return;
    const newRow = {
      id: `dsabc_${Date.now()}`,
      name: defectName,
      secA: 0,
      secB: 0,
      secC: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      defectSectionAbc: [...(prev.defectSectionAbc || []), newRow]
    }));
    showToast(`➕ [${defectName}] 불량소재 항목이 추가되었습니다.`);
  };

  // G. FRT 직각검사 불량 항목 추가
  const handleAddFrtRightAngleDefectRow = () => {
    const defectName = prompt("추가할 직각검사 불량 항목을 입력하세요:", "클립 누락");
    if (!defectName) return;
    const newRow = {
      id: `frt_d_${Date.now()}`,
      name: defectName,
      frtLh: 0,
      frtRh: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      frtRightAngleDefects: [...(prev.frtRightAngleDefects || []), newRow]
    }));
    showToast(`➕ [${defectName}] 직각검사 불량 항목이 추가되었습니다.`);
  };

  // ===========================================================================
  // 2. [치수 및 인라인 값 수정 헬퍼]
  // ===========================================================================
  const handleUpdateSpecValue = (listKey, rowId, field, newVal) => {
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map((row) => {
        if (row.id === rowId) {
          return { ...row, [field]: newVal };
        }
        return row;
      })
    }));
  };

  // ===========================================================================
  // 3. [공식 작업일보 등록 및 DB 영구 저장]
  // ===========================================================================
  const handleSaveOfficialWorkReport = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const fullLegoConfig = buildFullLegoConfig();
      const reportId =
        initialTemplateData?.reportDocId ||
        (initialTemplateData?.isExistingDraft ? initialTemplateData?.id : null) ||
        `lego_report_${fullLegoConfig.carModel || "JA"}_${Date.now()}`;

      // Compute total production metrics across active Lego blocks
      let totalGenuine = 0;
      let totalBad = 0;
      let totalRework = 0;

      if (Array.isArray(fullLegoConfig.workTimeOutput)) {
        fullLegoConfig.workTimeOutput.forEach((r) => {
          totalGenuine += Number(r.goodQty) || 0;
          totalBad += Number(r.defectQty) || 0;
          totalRework += Number(r.reworkQty) || 0;
        });
      }
      if (Array.isArray(fullLegoConfig.machines)) {
        fullLegoConfig.machines.forEach((m) => {
          totalGenuine += Number(m.goodQty) || 0;
          totalBad += Number(m.defectQty) || 0;
          totalRework += Number(m.reworkQty) || 0;
        });
      }

      let matrixBadSum = 0;
      if (Array.isArray(fullLegoConfig.defectMaterialMatrix)) {
        fullLegoConfig.defectMaterialMatrix.forEach((d) => {
          matrixBadSum +=
            (Number(d.extFrt) || 0) +
            (Number(d.extRr) || 0) +
            (Number(d.procFrt) || 0) +
            (Number(d.procRr) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.defectSectionAbc)) {
        fullLegoConfig.defectSectionAbc.forEach((d) => {
          matrixBadSum += (Number(d.secA) || 0) + (Number(d.secB) || 0) + (Number(d.secC) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.jointDefects)) {
        fullLegoConfig.jointDefects.forEach((d) => {
          matrixBadSum +=
            (Number(d.frtLh) || 0) +
            (Number(d.frtRh) || 0) +
            (Number(d.rrLh) || 0) +
            (Number(d.rrRh) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.frtRightAngleDefects)) {
        fullLegoConfig.frtRightAngleDefects.forEach((d) => {
          matrixBadSum += (Number(d.frtLh) || 0) + (Number(d.frtRh) || 0);
        });
      }

      const finalBad = Math.max(totalBad, matrixBadSum);
      const gross = totalGenuine + finalBad;
      const yieldRate = gross > 0 ? ((totalGenuine / gross) * 100).toFixed(1) : "100.0";
      const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

      const computedTotals = {
        genuine: totalGenuine,
        bad: finalBad,
        rework: totalRework,
        gross,
        yieldRate,
        defectRate
      };

      // Assemble unified report payload
      const reportPayload = {
        id: reportId,
        reportType: "LEGO_MODULAR_WORK_REPORT",
        title: fullLegoConfig.title || "소재준비작업일보",
        subTitle: "",
        formNo: fullLegoConfig.formNo || "705-02",
        companyName: fullLegoConfig.companyName || "(주)오륙",
        carModel: fullLegoConfig.carModel || "JA",
        project: fullLegoConfig.carModel || "JA",
        partName: fullLegoConfig.partName || "G/RUN",
        processName: fullLegoConfig.processName || "소재준비",
        targetQty: Number(fullLegoConfig.targetQty || fullLegoConfig.orderQty) || 350,
        orderQty: Number(fullLegoConfig.orderQty || fullLegoConfig.targetQty) || 350,
        workerName: fullLegoConfig.workerName || "작업자",
        worker: fullLegoConfig.workerName || "작업자",
        writer: fullLegoConfig.workerName || "작업자",
        workDate: fullLegoConfig.workDate || new Date().toISOString().slice(0, 10),
        date: fullLegoConfig.workDate || new Date().toISOString().slice(0, 10),
        shift: fullLegoConfig.shift || "주간",
        startTime: fullLegoConfig.startTime || "08:00",
        finishTime: fullLegoConfig.finishTime || "17:00",
        workTimeOutput: fullLegoConfig.workTimeOutput || [],
        specsCutting: fullLegoConfig.specsCutting || [],
        stepCuttingFrt: fullLegoConfig.stepCuttingFrt || [],
        stepCuttingRr: fullLegoConfig.stepCuttingRr || [],
        subMaterialLot: fullLegoConfig.subMaterialLot || "",
        defectMaterialMatrix: fullLegoConfig.defectMaterialMatrix || [],
        defectSectionAbc: fullLegoConfig.defectSectionAbc || [],
        jointMaterial: fullLegoConfig.jointMaterial || {},
        injectionTemps: fullLegoConfig.injectionTemps || [],
        injectionConditions: fullLegoConfig.injectionConditions || [],
        jointDefects: fullLegoConfig.jointDefects || [],
        drawingSpecs: fullLegoConfig.drawingSpecs || [],
        machines: fullLegoConfig.machines || [],
        extrusionDefects: fullLegoConfig.extrusionDefects || [],
        jointDefectsList: fullLegoConfig.jointDefectsList || [],
        postDefectsList: fullLegoConfig.postDefectsList || [],
        frtRightAngleDefects: fullLegoConfig.frtRightAngleDefects || [],
        customBlockTables: fullLegoConfig.customBlockTables || {},
        customBlocks: fullLegoConfig.customBlocks || [],
        downtimeEvents: fullLegoConfig.downtimeEvents || [],
        remarks: fullLegoConfig.remarks || "",
        activeBlocks: fullLegoConfig.activeBlocks,
        blockOrder: fullLegoConfig.blockOrder,
        totals: computedTotals,
        legoConfig: fullLegoConfig,
        assignedTemplateId: initialTemplateData?.id || initialTemplateData?.assignedTemplateId || null,
        assignedSlotKey: initialTemplateData?.assignedSlotKey || null,
        createdAt: initialTemplateData?.createdAt || now,
        updatedAt: now
      };

      // 1. Save to local storage draft (quota-safe)
      setCurrentReport(fullLegoConfig);
      try {
        localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(fullLegoConfig));
      } catch (storageErr) {
        console.warn("Draft localStorage quota warning:", storageErr);
      }

      // 2. 🌟 5대 공정 양식 보관함 등록 (작업자 기록 모드일 때는 템플릿 복제 없이 실적만 저장)
      const procText = `${fullLegoConfig.processName || ""} ${fullLegoConfig.title || ""}`;
      let matchedCatId = fullLegoConfig.category || "MATERIAL_PREP";
      if (procText.includes("압출")) {
        matchedCatId = "EXTRUSION";
      } else if (procText.includes("조인트") || procText.includes("사출")) {
        matchedCatId = "JOINT";
      } else if (procText.includes("후가공") || procText.includes("본드") || procText.includes("조립")) {
        matchedCatId = "POST_PROCESSING";
      } else if (procText.includes("검사") || procText.includes("직각") || procText.includes("치수")) {
        matchedCatId = "INSPECTION";
      } else if (procText.includes("절단") || procText.includes("컷팅") || procText.includes("소재")) {
        matchedCatId = "MATERIAL_PREP";
      }
      const matchedCatObj =
        REPORT_MAJOR_CATEGORIES.find((c) => c.id === matchedCatId) || REPORT_MAJOR_CATEGORIES[1];

      if (!isWorkerRecordingMode) {
        const savedTplPayload = await saveWorkReportTemplate({
          id: `tpl_lego_${fullLegoConfig.carModel || "JA"}_${Date.now()}`,
          categoryId: matchedCatObj.id,
          categoryName: matchedCatObj.name,
          title: fullLegoConfig.title || "소재준비작업일보",
          subTitle: "",
          carModel: fullLegoConfig.carModel || "JA",
          partName: fullLegoConfig.partName || "G/RUN",
          processName: fullLegoConfig.processName || "소재준비",
          formNo: fullLegoConfig.formNo || "705-02(REV.4)",
          companyName: fullLegoConfig.companyName || "(주)오륙",
          isLegoModular: true,
          isDatabaseBacked: true,
          legoConfig: fullLegoConfig,
          blocks: {
            timeAndQty: Boolean(fullLegoConfig.activeBlocks?.workTimeOutput || fullLegoConfig.activeBlocks?.timeAndOutput),
            specAndLot: Boolean(
              fullLegoConfig.activeBlocks?.specsCutting ||
                fullLegoConfig.activeBlocks?.stepCuttingFrt ||
                fullLegoConfig.activeBlocks?.stepCuttingRr ||
                fullLegoConfig.activeBlocks?.drawingSpecCheck ||
                fullLegoConfig.activeBlocks?.subMaterialLot
            ),
            machineCondition: Boolean(
              fullLegoConfig.activeBlocks?.injectionTemp ||
                fullLegoConfig.activeBlocks?.injectionCondition ||
                fullLegoConfig.activeBlocks?.jointMaterial
            ),
            defectMatrix: Boolean(
              fullLegoConfig.activeBlocks?.defectMaterialMatrix ||
                fullLegoConfig.activeBlocks?.defectSectionAbc ||
                fullLegoConfig.activeBlocks?.jointDefectMatrix ||
                fullLegoConfig.activeBlocks?.rightAngleMatrix ||
                fullLegoConfig.activeBlocks?.frtRightAngleDefects
            ),
            maintenance: Boolean(fullLegoConfig.activeBlocks?.remarks || fullLegoConfig.activeBlocks?.downtimeDefectPanel)
          },
          specs: (fullLegoConfig.specsCutting || []).map((s) => ({
            id: s.id,
            section: s.section,
            name: s.section,
            frtSpec: s.spec1,
            rrSpec: s.spec1,
            spec: s.spec1,
            startVal: s.start1,
            halfVal: s.half1,
            finishVal: s.finish1,
            lotStart: s.lotStart,
            lotHalf: s.lotHalf,
            lotFinish: s.lotFinish,
            lotNo: s.lotNo
          })),
          updatedAt: now
        });

        if (onSaveToTemplateManager) {
          onSaveToTemplateManager(savedTplPayload);
        }
      }

      // 3. Persist to official Machining Work Report Service (non-blocking error safe)
      try {
        await saveMachiningWorkReport(reportPayload);
      } catch (machiningErr) {
        console.warn("saveMachiningWorkReport warning:", machiningErr);
      }

      // 4. Dispatch system events for realtime sync across all dashboards
      window.dispatchEvent(new CustomEvent("machining-work-report-saved", { detail: reportPayload }));
      window.dispatchEvent(new CustomEvent("work-log-saved", { detail: reportPayload }));

      if (onSaveWorkReport) {
        await onSaveWorkReport(reportPayload);
      }

      if (isWorkerRecordingMode) {
        showToast(`✅ [${reportPayload.title}] 작업일보가 실시간 기록 저장되었습니다!`);
      } else {
        showToast(`🎉 [공식 등록 완료] 5대 공정 양식 보관함(${matchedCatObj.name}) 및 DB에 공식 저장되었습니다!`);
      }
    } catch (err) {
      console.error("작업일보 저장 오류:", err);
      alert("작업일보 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 max-w-[1700px] mx-auto text-left ${isEmbedded ? "pb-6" : "pb-16"}`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-xs sm:text-sm font-black">{toastMsg}</span>
        </div>
      )}

      {/* Top Hero Toolbar */}
      <LegoTopHeroToolbar
        isWorkerRecordingMode={isWorkerRecordingMode}
        currentReport={currentReport}
        setShowPhotoRefModal={setShowPhotoRefModal}
        setPhotoModalTab={setPhotoModalTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handlePrint={handlePrint}
        onNavigateToCatalog={onNavigateToCatalog}
        handleOpenSaveCatalogModal={handleOpenSaveCatalogModal}
        onDeleteWorkReport={onDeleteWorkReport}
        savedTemplates={savedTemplates}
        deleteWorkReportTemplate={deleteWorkReportTemplate}
        deleteMachiningWorkReport={deleteMachiningWorkReport}
        setCurrentReport={setCurrentReport}
        setAppliedTemplateBanner={setAppliedTemplateBanner}
        showToast={showToast}
        handleSaveOfficialWorkReport={handleSaveOfficialWorkReport}
        isSubmitting={isSubmitting}
        handleUpdateField={handleUpdateField}
        appliedTemplateBanner={appliedTemplateBanner}
        PRESET_REPORTS={PRESET_REPORTS}
        handleLoadPreset={handleLoadPreset}
      />

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar */}
        <LegoBlockSwitcherSidebar
          isWorkerRecordingMode={isWorkerRecordingMode}
          combinedSwitchCatalog={combinedSwitchCatalog}
          setPhotoModalTab={setPhotoModalTab}
          setShowPhotoRefModal={setShowPhotoRefModal}
          handleResetBlockOrder={handleResetBlockOrder}
          orderedBlockItems={orderedBlockItems}
          currentReport={currentReport}
          setCurrentReport={setCurrentReport}
          selectedBlockKey={selectedBlockKey}
          draggedBlockIdx={draggedBlockIdx}
          setDraggedBlockIdx={setDraggedBlockIdx}
          dragOverBlockIdx={dragOverBlockIdx}
          setDragOverBlockIdx={setDragOverBlockIdx}
          handleBlockDrop={handleBlockDrop}
          handleSelectBlock={handleSelectBlock}
          handleToggleBlock={handleToggleBlock}
          handleMoveBlockOrder={handleMoveBlockOrder}
          handleOpenBlockEditor={handleOpenBlockEditor}
          handleUpdateField={handleUpdateField}
        />

        {/* Right Main Form */}
        <div className={`${isWorkerRecordingMode ? "lg:col-span-12" : "lg:col-span-8"} space-y-4`}>
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            {/* Header: Title & 3-Step Approval */}
            <ReportTitleHeader
              currentReport={currentReport}
              isWorkerRecordingMode={isWorkerRecordingMode}
              handleUpdateField={handleUpdateField}
              t={t}
            />

            {/* Ordered Blocks Container */}
            <div className="flex flex-col gap-5">
              {/* Material Prep Blocks */}
              <BasicInfoBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateField={handleUpdateField}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <WorkTimeOutputBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <SpecsCuttingBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                handleDeleteCuttingSpecRow={handleDeleteCuttingSpecRow}
                handleAddCuttingSpecRow={handleAddCuttingSpecRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <StepCuttingBlocks
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                handleAddStepCuttingRow={handleAddStepCuttingRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />

              {/* Defect Material Blocks */}
              <DefectMaterialMatrixBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateField={handleUpdateField}
                handleUpdateSpecValue={handleUpdateSpecValue}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <DefectSectionAbcBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                handleAddDefectSectionAbcRow={handleAddDefectSectionAbcRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />

              {/* Joint Process Blocks */}
              <TimeAndOutputBlock
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <JointMaterialBlock
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <InjectionTempConditionBlocks
                currentReport={currentReport}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <JointDefectMatrixBlock
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleAddJointDefectRow={handleAddJointDefectRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />

              {/* Inspection & Common Lifecycle Blocks */}
              <DrawingSpecCheckBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                handleAddDrawingSpecRow={handleAddDrawingSpecRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <RightAngleMatrixBlock
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleAddMachineRow={handleAddMachineRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <FrtRightAngleDefectsBlock
                currentReport={currentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                handleUpdateSpecValue={handleUpdateSpecValue}
                handleAddFrtRightAngleDefectRow={handleAddFrtRightAngleDefectRow}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <SubMaterialAndRemarksBlocks
                currentReport={currentReport}
                handleUpdateField={handleUpdateField}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />
              <CommonInspectionLifecycleBlocks
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                currentLang={currentLang}
                t={t}
                renderBlockWrapper={renderBlockWrapper}
              />

              {/* Custom Photo-Analyzed Blocks */}
              <LegoCustomPhotoBlocks
                combinedSwitchCatalog={combinedSwitchCatalog}
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                isWorkerRecordingMode={isWorkerRecordingMode}
                draggedCustomCol={draggedCustomCol}
                setDraggedCustomCol={setDraggedCustomCol}
                dragOverCustomCol={dragOverCustomCol}
                setDragOverCustomCol={setDragOverCustomCol}
                showToast={showToast}
                renderBlockWrapper={renderBlockWrapper}
              />
            </div>

            {/* Bottom Register Action Bar */}
            <LegoBottomActionBar
              isWorkerRecordingMode={isWorkerRecordingMode}
              currentReport={currentReport}
              onDeleteWorkReport={onDeleteWorkReport}
              savedTemplates={savedTemplates}
              deleteWorkReportTemplate={deleteWorkReportTemplate}
              deleteMachiningWorkReport={deleteMachiningWorkReport}
              setCurrentReport={setCurrentReport}
              setAppliedTemplateBanner={setAppliedTemplateBanner}
              showToast={showToast}
              handleSaveOfficialWorkReport={handleSaveOfficialWorkReport}
              isSubmitting={isSubmitting}
              PRESET_REPORTS={PRESET_REPORTS}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <LegoBlockCollectionModal
        isOpen={showPhotoRefModal}
        onClose={() => setShowPhotoRefModal(false)}
        references={LEGO_IMAGE_REFERENCES}
        customBlocks={customBlocks}
        activeTab={photoModalTab}
        setActiveTab={setPhotoModalTab}
        onSaveCustomBlock={saveCustomLegoBlock}
        onShowToast={showToast}
      />

      <LegoBlockEditorModal
        isOpen={isBlockEditorOpen}
        onClose={() => setIsBlockEditorOpen(false)}
        blockKey={editingBlockKey}
        currentReport={currentReport}
        onUpdateReport={setCurrentReport}
        onShowToast={showToast}
      />

      <LegoSaveCatalogModal
        isOpen={isSaveCatalogModalOpen}
        onClose={() => setIsSaveCatalogModalOpen(false)}
        catalogMeta={catalogMeta}
        setCatalogMeta={setCatalogMeta}
        REPORT_MAJOR_CATEGORIES={REPORT_MAJOR_CATEGORIES}
        handleConfirmSaveCatalog={handleConfirmSaveCatalog}
      />
    </div>
  );
};

export default LegoWorkReportBuilder;
