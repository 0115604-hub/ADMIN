// Smart Overtime & Attendance Service (잔업 스마트 통합관리대장 - 5개사 통합)
// Refactored Facade: Re-exports modular Lego services under src/services/overtime/

export * from "./overtime/overtimeConstants.js";
export * from "./overtime/overtimeCalculations.js";
export * from "./overtime/overtimeMatrixSync.js";
export * from "./overtime/overtimeCompanyModules.js";
export * from "./overtime/overtimeExcelService.js";
export * from "./overtime/overtimeSyncService.js";

// Legacy default export for full backward compatibility
import { getLocalSmartOvertimeData, subscribeSmartOvertimeData, saveSmartOvertimeData } from "./overtime/overtimeSyncService.js";
export const exportSmartOvertimeToExcel = async (...args) => {
  const mod = await import("./overtime/overtimeExcelService.js");
  return mod.exportSmartOvertimeToExcel(...args);
};

export const importSmartOvertimeFromExcel = async (...args) => {
  const mod = await import("./overtime/overtimeExcelService.js");
  return mod.importSmartOvertimeFromExcel(...args);
};

export default {
  getLocalSmartOvertimeData,
  subscribeSmartOvertimeData,
  saveSmartOvertimeData,
  exportSmartOvertimeToExcel,
  importSmartOvertimeFromExcel
};
