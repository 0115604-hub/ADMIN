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
import { exportSmartOvertimeToExcel, importSmartOvertimeFromExcel } from "./overtime/overtimeExcelService.js";

export default {
  getLocalSmartOvertimeData,
  subscribeSmartOvertimeData,
  saveSmartOvertimeData,
  exportSmartOvertimeToExcel,
  importSmartOvertimeFromExcel
};
