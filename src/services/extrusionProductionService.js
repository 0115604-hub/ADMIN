// Extrusion Production & Daily Work Report Service Facade
// Re-exports all core business logic from modular Lego sub-services under ./extrusion/

export {
  COLLECTION_NAME,
  EXTRUSION_PROD_STORAGE_KEY,
  EXTRUSION_STANDARD_SPECS,
  MATERIAL_PRESETS,
  EXTRUSION_LINE_OPTIONS,
  VEHICLE_PRESETS,
  WORKER_PRESETS,
  DOWNTIME_CATEGORIES,
  TPM_CHECK_ITEMS
} from "./extrusion/extrusionProductionConstants";

export {
  sanitizeRawMaterials,
  sanitizeExtrusionReport,
  normalizeExtrusionLineKey,
  computeExtrusionDocKey,
  INITIAL_EXTRUSION_REPORTS
} from "./extrusion/extrusionSanitizer";

export {
  getLocalExtrusionReports,
  saveLocalExtrusionReports,
  subscribeToExtrusionReports,
  saveExtrusionReport,
  deleteExtrusionReport,
  toggleExtrusionReportApproval
} from "./extrusion/extrusionRepository";

export {
  calculateExtrusionMetrics
} from "./extrusion/extrusionMetrics";

export const exportExtrusionReportsToExcel = async (...args) => {
  const mod = await import("./extrusion/extrusionExcelExporter");
  return mod.exportExtrusionReportsToExcel(...args);
};

export const exportExtrusionCheckSheetExcel = async (...args) => {
  const mod = await import("./extrusion/extrusionExcelExporter");
  return mod.exportExtrusionCheckSheetExcel(...args);
};
