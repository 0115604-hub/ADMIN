import React from "react";
import { DigitalInspectionModal } from "./sq/DigitalInspectionModal";
import { useWorkerDashboardState } from "./dashboard/worker/useWorkerDashboardState";
import { DashboardViewRouter } from "./dashboard/worker/DashboardViewRouter";
import { WorkerDashboardModals } from "./dashboard/worker/WorkerDashboardModals";
import {
  TIME_OPTIONS_30MIN,
  STORAGE_KEY_EXTRUSION,
  getExtrusionSummaryData,
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
} from "./dashboard/worker/workerDashboardConstants";

export {
  TIME_OPTIONS_30MIN,
  STORAGE_KEY_EXTRUSION,
  getExtrusionSummaryData,
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const state = useWorkerDashboardState({ onBulkUpload, onNavigateTab });

  // 1. Operator worker views take precedence with their standalone layouts
  if (state.isOperatorWorker) {
    return <DashboardViewRouter state={state} />;
  }

  // 2. Standard field worker & manager dashboard layout
  return (
    <div className="space-y-2.5 sm:space-y-3 animate-fadeIn pb-12 max-w-[1600px] w-full mx-auto px-0.5 sm:px-0 min-w-0 max-w-full">
      <DashboardViewRouter state={state} />
      <WorkerDashboardModals state={state} />
      <DigitalInspectionModal
        isOpen={state.isInspectionModalOpen}
        onClose={() => state.setIsInspectionModalOpen(false)}
      />
    </div>
  );
};

export default WorkerDashboard;
