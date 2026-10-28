import { useState, useEffect, useMemo, useRef } from "react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES,
  DEFAULT_DEFECT_CATEGORIES,
  saveHanulWorkReport,
  deleteHanulWorkReport,
  exportHanulReportToExcel,
  isExcludedFromWorkReport
} from "../../services/hanulWorkReportService";
import { getKSTDateString } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";
import {
  getDefectKeysForProcess,
  getSpecsForProcess,
  getInspColumnsForType,
  calculateTotals
} from "./hanulReportHelpers";
import { useHanulTpmState } from "./state/useHanulTpmState";
import { useHanulBladeTracker } from "./state/useHanulBladeTracker";
import { useHanulLotMeasurements } from "./state/useHanulLotMeasurements";
import { useHanulAssignedTemplate } from "./state/useHanulAssignedTemplate";

/**
 * useHanulWorkReportState
 * 한울 작업일보 모달의 통합 상태 관리 파사드(Facade) 훅
 * TPM, 칼날 수명 관리, LOT 실측, 5대 공정 지정 양식 서브 훅들을 조합하여 제공합니다.
 */
export const useHanulWorkReportState = ({
  isOpen,
  onClose,
  initialProject = "9BQC",
  initialProcess = "소재준비",
  initialWorker = "",
  editReport = null,
  companyMode = "HANUL"
}) => {
  const [project, setProject] = useState(initialProject);
  const [processId, setProcessId] = useState(initialProcess);
  const [subProcess, setSubProcess] = useState("정치절단"); // For "소재준비": "정치절단" | "단컷팅"
  const [jointType, setJointType] = useState("FRT"); // For "조인트": "FRT" | "FIXED_LH" | "FIXED_RH" | "RR"
  const [inspectionType, setInspectionType] = useState("LENGTH"); // For "검사": "LENGTH" | "SQUARE" | "FINAL_PAIR" | "FINAL_LH"

  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(() =>
    initialWorker && !isExcludedFromWorkReport(initialWorker) ? initialWorker : "박종미"
  );
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("06:30");
  const [endTime, setEndTime] = useState("17:30");
  const [machineNo, setMachineNo] = useState("");
  const [machineTrouble, setMachineTrouble] = useState("");
  const [downtimeEvents, setDowntimeEvents] = useState(() =>
    Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []
  );

  // Production Quantities
  const [production, setProduction] = useState({
    genuineLH: 0,
    badLH: 0,
    reworkLH: 0,
    genuineRH: 0,
    badRH: 0,
    reworkRH: 0,
    genuineA: 0,
    badA: 0,
    genuineB: 0,
    badB: 0,
    genuineC: 0,
    badC: 0
  });

  // 검사 전용 4개 컬럼 생산 수량 (검사/정품/리워크/폐기)
  const [inspProduction, setInspProduction] = useState({
    col1: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col2: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col3: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col4: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 }
  });

  const [defects, setDefects] = useState({});

  // Process-specific conditions
  const [conditions, setConditions] = useState({
    nozzleTempSet: "220",
    nozzleTempAct: "220",
    cyl1TempSet: "215",
    cyl1TempAct: "215",
    cyl2TempSet: "210",
    cyl2TempAct: "210",
    cyl3TempSet: "205",
    cyl3TempAct: "205",
    distance: { start: "", mid: "", end: "" },
    speed: { start: "", mid: "", end: "" },
    pressure: { start: "", mid: "", end: "" },
    time: { start: "", mid: "", end: "" },
    rubberGrade: "W60664$OS",
    cureTempUpperSet: "200",
    cureTempUpperAct: "200",
    cureTempLowerSet: "200",
    cureTempLowerAct: "200",
    cureTimeSec: "90",
    preheatTemp: "40",
    dryingTemp: "80",
    bondName: "PRI",
    tipReplaces: [
      { round: 1, time: "", qty: "", reason: "마모" },
      { round: 2, time: "", qty: "", reason: "막힘" }
    ],
    doorChecks: Array(10).fill({ status: "양호", note: "" })
  });

  // Cleaning times
  const [cleaningTimes, setCleaningTimes] = useState({
    before: "06:20",
    mid: "12:50",
    after: "17:30"
  });

  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const overlayRef = useRef(null);

  // LOT & 측정 상태 서브 훅 연동
  const {
    cuttingPart,
    setCuttingPart,
    cuttingLot,
    setCuttingLot,
    jointGradeName,
    jointGradeLot,
    subMaterialsLot,
    padLot,
    dvInspLot,
    rrExtLot,
    materialLot,
    jointLot,
    clipLot,
    dollyNo,
    extTimeRange,
    lotEntries,
    measurements,
    handleAddLot,
    handleRemoveLot,
    handleUpdateLotField,
    handleUpdateLotMeasurement
  } = useHanulLotMeasurements({
    isOpen,
    editReport,
    processId
  });

  // 계산 항목
  const currentDefectKeys = useMemo(() => {
    return getDefectKeysForProcess({ project, processId, subProcess, jointType, inspectionType });
  }, [project, processId, subProcess, jointType, inspectionType]);

  const currentSpecs = useMemo(() => {
    return getSpecsForProcess({ project, processId, subProcess, jointType, inspectionType, cuttingPart });
  }, [project, processId, subProcess, jointType, inspectionType, cuttingPart]);

  const totals = useMemo(() => {
    return calculateTotals({
      production,
      defects,
      processId,
      subProcess,
      project,
      inspProduction,
      inspectionType,
      cuttingPart
    });
  }, [production, defects, processId, subProcess, project, inspProduction, inspectionType, cuttingPart]);

  const inspColumns = useMemo(() => {
    return getInspColumnsForType(inspectionType);
  }, [inspectionType]);

  // 칼날 수명 및 누적 생산량 관리 서브 훅 연동
  const {
    allReports,
    bladeChangeTime,
    setBladeChangeTime,
    bladeResetInfo,
    handleClearBladeReset,
    isBladeTestMode,
    setIsBladeTestMode,
    totalCumulativeQty,
    isBladeOverdue,
    bladeLifePercent,
    BLADE_LIMIT,
    handleRecordBladeChangeNow
  } = useHanulBladeTracker({
    project,
    totals,
    customWorker,
    worker,
    editReport
  });

  // 5대 공정 지정 양식 및 다국어 서브 훅 연동
  const {
    templateAssignments,
    forceLegacyMode,
    setForceLegacyMode,
    currentLang,
    setCurrentLang,
    workerLangInfo,
    activeSlotKey,
    effectiveWorkerName,
    existingWorkerReport,
    activeAssignedTemplate,
    isAssignedTemplateMode
  } = useHanulAssignedTemplate({
    companyMode,
    project,
    processId,
    subProcess,
    jointType,
    inspectionType,
    worker,
    customWorker,
    date,
    editReport,
    allReports
  });

  // TPM 점검 상태 및 다국어 텍스트 서브 훅 연동
  const {
    currentStep,
    setCurrentStep,
    tpmChecks,
    tpmActionNote,
    setTpmActionNote,
    isHanulTpmDone,
    tpmI18n,
    tpmSummary,
    handleToggleTpmCheck,
    handleSetAllTpmOk,
    handleSetMachineAllOk,
    handleProceedToReport
  } = useHanulTpmState({
    isOpen,
    editReport,
    initialProcess,
    processId,
    worker,
    customWorker,
    date,
    allReports,
    currentLang,
    scrollContainerRef
  });

  // 통합 초기화 Effect (기본 필드 복원)
  useEffect(() => {
    if (!isOpen) return;

    if (editReport) {
      setProject(editReport.project || "9BQC");
      setProcessId(editReport.processId || "소재준비");
      if (editReport.subProcess) setSubProcess(editReport.subProcess);
      if (editReport.jointType) setJointType(editReport.jointType);
      if (editReport.inspectionType) setInspectionType(editReport.inspectionType);
      if (editReport.machineTrouble) setMachineTrouble(editReport.machineTrouble);
      if (editReport.inspProduction) setInspProduction(editReport.inspProduction);
      setDate(editReport.date || getKSTDateString());
      setShift(editReport.shift || "주간");
      setWorker(editReport.worker && !isExcludedFromWorkReport(editReport.worker) ? editReport.worker : "박종미");
      setStartTime(editReport.startTime || "06:30");
      setEndTime(editReport.endTime || "17:30");
      setMachineNo(editReport.machineNo || "");
      if (editReport.production) setProduction(editReport.production);
      if (editReport.defects) setDefects(editReport.defects);
      if (editReport.conditions) setConditions(editReport.conditions);
      if (editReport.cleaningTimes) setCleaningTimes(editReport.cleaningTimes);
      if (editReport.notes) setNotes(editReport.notes);
    } else {
      setProject(initialProject);
      setProcessId(initialProcess);
      setSubProcess("정치절단");
      setJointType("FRT");
      setInspectionType("LENGTH");
      setMachineTrouble("");
      setInspProduction({
        col1: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
        col2: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
        col3: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
        col4: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 }
      });
      if (initialWorker) setWorker(!isExcludedFromWorkReport(initialWorker) ? initialWorker : "박종미");
      const initDef = {};
      let defKey = `${initialProject}_${initialProcess}`;
      if (initialProcess === "소재준비") defKey = `${initialProject}_소재준비_정치절단`;
      if (initialProcess === "조인트") defKey = `${initialProject}_조인트_FRT`;
      if (initialProcess === "검사") defKey = `${initialProject}_검사_LENGTH`;
      const defKeys = DEFAULT_DEFECT_CATEGORIES[defKey] || DEFAULT_DEFECT_CATEGORIES[`${initialProject}_${initialProcess}`] || [];
      defKeys.forEach((k) => { initDef[k] = 0; });
      setDefects(initDef);
    }

    setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, 50);
  }, [isOpen, editReport, initialProject, initialProcess, initialWorker]);

  // Mobile & Desktop Scroll Reset Guarantee
  useEffect(() => {
    if (isOpen) {
      const resetScroll = () => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        if (modalRef.current) modalRef.current.scrollTop = 0;
        if (overlayRef.current) overlayRef.current.scrollTop = 0;
      };
      resetScroll();
      const t1 = setTimeout(resetScroll, 20);
      const t2 = setTimeout(resetScroll, 100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen, project, processId, subProcess]);

  // When project changes, adjust processId if not applicable
  useEffect(() => {
    const validProcesses = HANUL_PROCESSES[project] || [];
    if (!validProcesses.some((p) => p.id === processId)) {
      setProcessId(validProcesses[0]?.id || "소재준비");
    }
  }, [project, processId]);

  // When process or subProcess changes, refresh default defects
  useEffect(() => {
    setDefects((prev) => {
      const next = { ...prev };
      currentDefectKeys.forEach((k) => {
        if (next[k] === undefined) next[k] = 0;
      });
      return next;
    });
  }, [currentDefectKeys]);

  useModalHistory(Boolean(isOpen), onClose, "hanulWorkReportModal");

  const currentProjectObj = HANUL_PROJECTS.find((p) => p.id === project) || HANUL_PROJECTS[0];
  const currentProcessObj = (HANUL_PROCESSES[project] || []).find((p) => p.id === processId) || { name: processId };

  const handleDefectChange = (k, delta) => {
    setDefects((prev) => {
      const cur = Number(prev[k]) || 0;
      const nextVal = Math.max(0, cur + delta);
      return { ...prev, [k]: nextVal };
    });
  };

  const handleDefectInput = (k, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDefects((prev) => ({ ...prev, [k]: num }));
  };

  const updateInspProd = (colKey, field, val) => {
    setInspProduction((prev) => ({
      ...prev,
      [colKey]: {
        ...(prev[colKey] || {}),
        [field]: parseInt(val, 10) || 0
      }
    }));
  };

  const handleSave = async () => {
    const effectiveWorker = customWorker.trim() || worker;
    if (!effectiveWorker) {
      alert("작업자 이름을 선택하거나 입력해 주세요.");
      return;
    }
    if (isExcludedFromWorkReport(effectiveWorker)) {
      alert(`⚠️ 관리자(${effectiveWorker})는 작업일보 작성 대상이 아니므로 실적에 등록할 수 없습니다. 현장 작업자를 선택해 주세요.`);
      return;
    }

    setIsSaving(true);
    try {
      const selectedJointObj = HANUL_JOINT_TYPES.find((j) => j.id === jointType) || HANUL_JOINT_TYPES[0];
      const selectedInspObj = HANUL_INSPECTION_TYPES.find((j) => j.id === inspectionType) || HANUL_INSPECTION_TYPES[0];
      let effectivePartName = currentProjectObj.partName;
      if (processId === "조인트") effectivePartName = selectedJointObj.partName;
      if (processId === "검사") effectivePartName = selectedInspObj.partName;

      const reportPayload = {
        id: editReport?.id,
        project,
        projectName: currentProjectObj.name,
        carModel: currentProjectObj.carModel,
        partName: effectivePartName,
        processId,
        processName: currentProcessObj.name,
        subProcess: processId === "소재준비" ? subProcess : "",
        cuttingPart: (processId === "소재준비" && subProcess === "정치절단") ? cuttingPart : "",
        cuttingLot: (processId === "소재준비" && subProcess === "정치절단") ? cuttingLot : null,
        jointType: processId === "조인트" ? jointType : "",
        jointGradeName: processId === "조인트" ? jointGradeName : "",
        jointGradeLot: processId === "조인트" ? jointGradeLot : "",
        subMaterialsLot: processId === "조인트" ? subMaterialsLot : null,
        inspectionType: processId === "검사" ? inspectionType : "",
        padLot: (processId === "검사" && inspectionType === "LENGTH") ? padLot : "",
        dvInspLot: (processId === "검사" && inspectionType.includes("FINAL")) ? dvInspLot : null,
        rrExtLot: processId === "검사" ? rrExtLot : null,
        inspProduction: processId === "검사" ? inspProduction : null,
        date,
        shift,
        worker: effectiveWorker,
        startTime,
        endTime,
        lotEntries,
        machineNo: machineNo || "",
        materialLot: {
          start: lotEntries[0]?.lotNo || materialLot.start || "",
          mid: lotEntries[1]?.lotNo || materialLot.mid || "",
          end: lotEntries[2]?.lotNo || materialLot.end || ""
        },
        jointLot: lotEntries[0]?.subLotNo || jointLot || "",
        clipLot,
        dollyNo,
        extTimeRange,
        bladeChangeTime: (processId === "소재준비" && subProcess === "정치절단") ? bladeChangeTime : "",
        machineTrouble,
        production,
        totals,
        defects,
        measurements: (lotEntries[0]?.measurements && Object.keys(lotEntries[0].measurements).length > 0)
          ? lotEntries[0].measurements
          : measurements,
        conditions,
        cleaningTimes,
        notes,
        tpmStatus: processId === "소재준비" ? (isHanulTpmDone ? "완료" : "완료") : "미해당",
        tpmChecks: processId === "소재준비" ? tpmChecks : null,
        tpmActionNote: processId === "소재준비" ? tpmActionNote : "",
        createdAt: editReport?.createdAt || new Date().toISOString()
      };

      await saveHanulWorkReport(reportPayload);

      if (processId === "소재준비") {
        try {
          const key = `hanul_tpm_done_${date}_${effectiveWorker}`;
          localStorage.setItem(key, "true");
        } catch (e) {}
      }

      setToastMessage("✅ 작업일보 및 TPM 점검시트가 실시간 저장되었습니다!");
      setTimeout(() => {
        setToastMessage("");
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
      alert("일보 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLegoAssignedReport = async (legoPayload) => {
    const effectiveWorker = String(legoPayload?.workerName || customWorker.trim() || worker || "작업자").trim();
    if (isExcludedFromWorkReport(effectiveWorker)) {
      alert(`⚠️ 관리자(${effectiveWorker})는 작업일보 작성 대상이 아니므로 실적에 등록할 수 없습니다. 현장 작업자를 입력해 주세요.`);
      return;
    }
    setIsSaving(true);
    try {
      const targetDocId =
        editReport?.id ||
        activeAssignedTemplate?.reportDocId ||
        existingWorkerReport?.id ||
        `hwr_${project}_${legoPayload?.workDate || date}_${processId}_${activeSlotKey}_${effectiveWorker}`.replace(/[\s/]/g, "_");

      const hanulPayload = {
        id: targetDocId,
        project,
        projectName: currentProjectObj.name,
        carModel: legoPayload?.carModel || currentProjectObj.carModel,
        partName: legoPayload?.partName || currentProjectObj.partName,
        processId: processId || legoPayload?.processName || activeAssignedTemplate?.processName || "소재준비",
        processName: activeAssignedTemplate?.title || currentProcessObj?.name || legoPayload?.title || "지정양식",
        targetQty: Number(legoPayload?.targetQty || activeAssignedTemplate?.targetQty || 350),
        orderQty: Number(legoPayload?.orderQty || activeAssignedTemplate?.orderQty || 350),
        subProcess: processId === "소재준비" ? subProcess : "",
        jointType: processId === "조인트" ? jointType : "",
        inspectionType: processId === "검사" ? inspectionType : "",
        date: legoPayload?.workDate || date,
        shift: legoPayload?.shift || shift,
        worker: effectiveWorker,
        startTime: legoPayload?.startTime || startTime,
        endTime: legoPayload?.finishTime || endTime,
        totals: legoPayload?.totals || {
          genuine: 0,
          bad: 0,
          rework: 0,
          gross: 0,
          yieldRate: "100.0",
          defectRate: "0.0"
        },
        notes: legoPayload?.remarks || "",
        downtimeEvents: legoPayload?.downtimeEvents || [],
        legoConfig: legoPayload?.legoConfig || null,
        assignedTemplateId: activeAssignedTemplate?.id || null,
        assignedSlotKey: activeSlotKey,
        createdAt: editReport?.createdAt || existingWorkerReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveHanulWorkReport(hanulPayload);

      setToastMessage(`✅ [${hanulPayload.worker} 작업자] ${hanulPayload.processName} 작업일보가 저장되었습니다! (초/중/종물 갱신)`);
      setTimeout(() => {
        setToastMessage("");
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("지정 양식 일보 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLegoAssignedReport = async () => {
    const targetDocId =
      editReport?.id ||
      activeAssignedTemplate?.reportDocId ||
      existingWorkerReport?.id;
    if (!targetDocId) return;
    if (!window.confirm("정말로 이 등록된 한울 가공/협력업체 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    setIsSaving(true);
    try {
      await deleteHanulWorkReport(targetDocId);
      setToastMessage("🗑️ 등록된 작업일보가 영구 삭제되었습니다.");
      setTimeout(() => {
        setToastMessage("");
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcelExport = () => {
    const effectiveWorker = customWorker.trim() || worker;
    const effectiveMeasurements = (lotEntries[0]?.measurements && Object.keys(lotEntries[0].measurements).length > 0)
      ? lotEntries[0].measurements
      : measurements;

    exportHanulReportToExcel({
      project,
      projectName: currentProjectObj.name,
      processId,
      processName: currentProcessObj.name,
      subProcess: processId === "소재준비" ? subProcess : "",
      cuttingPart: (processId === "소재준비" && subProcess === "정치절단") ? cuttingPart : "",
      cuttingLot: (processId === "소재준비" && subProcess === "정치절단") ? cuttingLot : null,
      jointType: processId === "조인트" ? jointType : "",
      inspectionType: processId === "검사" ? inspectionType : "",
      padLot: (processId === "검사" && inspectionType === "LENGTH") ? padLot : "",
      dvInspLot: (processId === "검사" && inspectionType.includes("FINAL")) ? dvInspLot : null,
      rrExtLot: processId === "검사" ? rrExtLot : null,
      inspProduction: processId === "검사" ? inspProduction : null,
      bladeChangeTime,
      machineTrouble,
      date,
      shift,
      worker: effectiveWorker,
      startTime,
      endTime,
      production,
      totals,
      defects,
      measurements: effectiveMeasurements,
      lotEntries,
      materialLot: {
        start: lotEntries[0]?.lotNo || materialLot.start || "",
        mid: lotEntries[1]?.lotNo || materialLot.mid || "",
        end: lotEntries[2]?.lotNo || materialLot.end || ""
      },
      notes
    });
  };

  return {
    project,
    setProject,
    processId,
    setProcessId,
    subProcess,
    setSubProcess,
    currentStep,
    setCurrentStep,
    isHanulTpmDone,
    currentLang,
    setCurrentLang,
    workerLangInfo,
    templateAssignments,
    activeAssignedTemplate,
    forceLegacyMode,
    setForceLegacyMode,
    jointType,
    setJointType,
    inspectionType,
    setInspectionType,
    handleSetAllTpmOk,
    handleExcelExport,
    scrollContainerRef,
    modalRef,
    overlayRef,
    tpmI18n,
    date,
    setDate,
    customWorker,
    setCustomWorker,
    worker,
    setWorker,
    tpmChecks,
    tpmSummary,
    tpmActionNote,
    setTpmActionNote,
    handleSetMachineAllOk,
    handleToggleTpmCheck,
    handleProceedToReport,
    isAssignedTemplateMode,
    effectiveWorkerName,
    shift,
    setShift,
    existingWorkerReport,
    activeSlotKey,
    handleSaveLegoAssignedReport,
    handleDeleteLegoAssignedReport,
    currentProcessObj,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    totals,
    inspColumns,
    inspProduction,
    updateInspProd,
    cuttingPart,
    setCuttingPart,
    production,
    setProduction,
    currentSpecs,
    lotEntries,
    handleAddLot,
    handleUpdateLotField,
    handleRemoveLot,
    handleUpdateLotMeasurement,
    jointGradeName,
    conditions,
    setConditions,
    cleaningTimes,
    currentDefectKeys,
    defects,
    handleDefectChange,
    handleDefectInput,
    downtimeEvents,
    setDowntimeEvents,
    setMachineTrouble,
    isBladeOverdue,
    totalCumulativeQty,
    BLADE_LIMIT,
    bladeLifePercent,
    isBladeTestMode,
    setIsBladeTestMode,
    bladeChangeTime,
    setBladeChangeTime,
    handleRecordBladeChangeNow,
    bladeResetInfo,
    handleClearBladeReset,
    machineTrouble,
    notes,
    setNotes,
    toastMessage,
    handleSave,
    isSaving
  };
};
