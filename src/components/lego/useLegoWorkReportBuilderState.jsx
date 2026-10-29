import { useState, useEffect, useMemo } from "react";
import { getKSTDateString } from "../../utils/dateUtils";
import { saveMachiningWorkReport } from "../../services/machiningWorkReportService";
import {
  translateTerm,
  getCurrentWorkLogLanguage
} from "../../services/workLogI18nService";
import {
  saveWorkReportTemplate,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  REPORT_MAJOR_CATEGORIES,
  getLocalCustomLegoBlocks,
  subscribeCustomLegoBlocks
} from "../../services/workReportTemplateService";
import {
  PRESET_REPORTS,
  LEGO_BLOCK_SWITCH_CATALOG,
  DEFAULT_BLOCK_ORDER
} from "./legoPresetData.js";
import { LegoBlockWrapper } from "./LegoBlockWrapper.jsx";
import {
  initReportState,
  buildFullLegoConfigSnapshot,
  computeReportTotals,
  detectReportCategory,
  buildTemplateBlocksMetadata
} from "./legoReportBuilderHelpers.js";

export const useLegoWorkReportBuilderState = ({
  initialPresetId = "REPORT_CUTTING",
  initialWorkerName = "",
  initialWorkDate = "",
  initialTemplateData = null,
  onSaveWorkReport,
  onSaveToTemplateManager,
  isWorkerRecordingMode = false,
  currentLang: propLang = null
}) => {
  // Current active report configuration
  const [currentReport, setCurrentReport] = useState(() =>
    initReportState({
      initialPresetId,
      initialWorkerName,
      initialWorkDate,
      initialTemplateData,
      isWorkerRecordingMode,
      presetReports: PRESET_REPORTS
    })
  );

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
  const [draggedCustomCol, setDraggedCustomCol] = useState(null);
  const [dragOverCustomCol, setDragOverCustomCol] = useState(null);

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

  // Auto-persist currentReport to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(currentReport));
    } catch (e) {
      console.warn("Auto-save currentReport quota warning:", e);
    }
  }, [currentReport]);

  // 🌐 현장 근로자 다국어 실시간 번역
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

  // Ordered block switches
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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

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

  // Hydrate from initialTemplateData if provided
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

  // Build complete snapshot of assembled Lego blocks
  const buildFullLegoConfig = (overrides = {}) => {
    return buildFullLegoConfigSnapshot({
      currentReport,
      customBlocks,
      orderedBlockItems,
      overrides
    });
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
        blocks: buildTemplateBlocksMetadata(fullLegoConfig),
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
  const handleAddCuttingSpecRow = () => {
    const count = currentReport.specsCutting?.length || 0;
    const nextChar = String.fromCharCode(65 + count);
    const datePrefix = getKSTDateString().slice(2).replace(/-/g, "");
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

  // 2. [치수 및 인라인 값 수정 헬퍼]
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

  // 3. [공식 작업일보 등록 및 DB 영구 저장]
  const handleSaveOfficialWorkReport = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const fullLegoConfig = buildFullLegoConfig();
      const reportId =
        initialTemplateData?.reportDocId ||
        (initialTemplateData?.isExistingDraft ? initialTemplateData?.id : null) ||
        `lego_report_${fullLegoConfig.carModel || "JA"}_${Date.now()}`;

      const computedTotals = computeReportTotals(fullLegoConfig);

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
        workDate: fullLegoConfig.workDate || getKSTDateString(),
        date: fullLegoConfig.workDate || getKSTDateString(),
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

      // 1. Save to local storage draft
      setCurrentReport(fullLegoConfig);
      try {
        localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(fullLegoConfig));
      } catch (storageErr) {
        console.warn("Draft localStorage quota warning:", storageErr);
      }

      // 2. 5대 공정 양식 보관함 등록
      const matchedCatObj = detectReportCategory(fullLegoConfig, REPORT_MAJOR_CATEGORIES);

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
          blocks: buildTemplateBlocksMetadata(fullLegoConfig),
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

      // 3. Persist to official Machining Work Report Service
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

  return {
    currentReport,
    setCurrentReport,
    viewMode,
    setViewMode,
    showPhotoRefModal,
    setShowPhotoRefModal,
    photoModalTab,
    setPhotoModalTab,
    customBlocks,
    setCustomBlocks,
    savedTemplates,
    setSavedTemplates,
    selectedPhotoFilter,
    setSelectedPhotoFilter,
    toastMsg,
    showToast,
    appliedTemplateBanner,
    setAppliedTemplateBanner,
    isSubmitting,
    selectedBlockKey,
    setSelectedBlockKey,
    isBlockEditorOpen,
    setIsBlockEditorOpen,
    editingBlockKey,
    setEditingBlockKey,
    draggedBlockIdx,
    setDraggedBlockIdx,
    dragOverBlockIdx,
    setDragOverBlockIdx,
    draggedCustomCol,
    setDraggedCustomCol,
    dragOverCustomCol,
    setDragOverCustomCol,
    currentLang,
    t,
    combinedSwitchCatalog,
    orderedBlockItems,
    isSaveCatalogModalOpen,
    setIsSaveCatalogModalOpen,
    catalogMeta,
    setCatalogMeta,
    handleMoveBlockOrder,
    handleBlockDrop,
    handleResetBlockOrder,
    handleLoadPreset,
    handleToggleBlock,
    handleUpdateField,
    handleSelectBlock,
    handleOpenBlockEditor,
    handleOpenSaveCatalogModal,
    handleConfirmSaveCatalog,
    renderBlockWrapper,
    handleAddCuttingSpecRow,
    handleDeleteCuttingSpecRow,
    handleAddStepCuttingRow,
    handleAddDrawingSpecRow,
    handleAddMachineRow,
    handleAddJointDefectRow,
    handleAddDefectSectionAbcRow,
    handleAddFrtRightAngleDefectRow,
    handleUpdateSpecValue,
    handleSaveOfficialWorkReport,
    handlePrint
  };
};

export default useLegoWorkReportBuilderState;
