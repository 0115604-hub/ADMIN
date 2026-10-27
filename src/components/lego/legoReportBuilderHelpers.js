// Helper functions for LegoWorkReportBuilder & useLegoWorkReportBuilderState

export const initReportState = ({
  initialPresetId = "REPORT_CUTTING",
  initialWorkerName = "",
  initialWorkDate = "",
  initialTemplateData = null,
  isWorkerRecordingMode = false,
  presetReports = []
}) => {
  // 🌟 작업자 기록 모드(isWorkerRecordingMode)이고 initialTemplateData가 제공된 경우:
  // 전역 브라우저 캐시("oruk_custom_lego_report_v2") 대신 전달된 작업자의 지정 템플릿/이전 작성 데이터를 최우선 로드
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

  const base = presetReports.find((p) => p.id === initialPresetId) || presetReports[0] || {};
  const clone = JSON.parse(JSON.stringify(base));
  if (initialWorkerName) clone.workerName = initialWorkerName;
  if (initialWorkDate) clone.workDate = initialWorkDate;
  return clone;
};

export const buildFullLegoConfigSnapshot = ({
  currentReport,
  customBlocks = [],
  orderedBlockItems = [],
  overrides = {}
}) => {
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

export const computeReportTotals = (fullLegoConfig) => {
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

  return {
    genuine: totalGenuine,
    bad: finalBad,
    rework: totalRework,
    gross,
    yieldRate,
    defectRate
  };
};

export const detectReportCategory = (fullLegoConfig, categories = []) => {
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
  return categories.find((c) => c.id === matchedCatId) || categories[1] || { id: "MATERIAL_PREP", name: "소재준비" };
};

export const buildTemplateBlocksMetadata = (fullLegoConfig) => ({
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
});
