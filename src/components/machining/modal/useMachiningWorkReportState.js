import { useState, useEffect, useMemo } from "react";
import {
  MACHINING_SPECS,
  MACHINING_TPM_MACHINES,
  MACHINING_TPM_CHECK_ITEMS,
  createDefaultMachiningTpmChecks,
  getMachiningDefectList,
  saveMachiningWorkReport,
  deleteMachiningWorkReport,
  exportMachiningReportToExcel,
  isExcludedFromMachiningWorkReport,
  subscribeMachiningWorkReports,
  getLocalMachiningWorkReports
} from "../../../services/machiningWorkReportService";
import { getKSTDateString } from "../../../utils/dateUtils";
import { useModalHistory } from "../../../utils/modalHistory";
import {
  getAssignedTemplateForWorker,
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments
} from "../../../services/workReportTemplateService";

export const useMachiningWorkReportState = ({
  isOpen,
  onClose,
  initialProject = "JA",
  initialProcess = "소재준비",
  initialWorker = "",
  editReport = null
}) => {
  useModalHistory(Boolean(isOpen), onClose, "machiningWorkReportModal");

  const [project, setProject] = useState(initialProject);
  const [processId, setProcessId] = useState(initialProcess);
  const [subProcess, setSubProcess] = useState("정치절단");
  const [jointType, setJointType] = useState("FRT");
  const [inspectionType, setInspectionType] = useState("LENGTH");

  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(() =>
    initialWorker && !isExcludedFromMachiningWorkReport(initialWorker) ? initialWorker : "크리스토퍼"
  );
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("06:30");
  const [endTime, setEndTime] = useState("17:30");
  const [machineNo, setMachineNo] = useState("");
  const [dollyNo, setDollyNo] = useState("");
  const [isLegoMode, setIsLegoMode] = useState(true);

  // 관리자 지정 양식 카탈로그 및 슬롯 할당 실시간 구독
  const [allCatalogTemplates, setAllCatalogTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [allMachiningReports, setAllMachiningReports] = useState(() => getLocalMachiningWorkReports());

  useEffect(() => {
    const unsubTpl = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) setAllCatalogTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (map) setTemplateAssignments(map);
    });
    const unsubReports = subscribeMachiningWorkReports((list) => {
      if (Array.isArray(list)) setAllMachiningReports(list);
    });
    return () => {
      unsubTpl();
      unsubAssign();
      unsubReports();
    };
  }, []);

  // 관리자가 5대 공정에 지정한 작업일보 양식 자동 로드
  const assignedTemplate = useMemo(() => {
    return getAssignedTemplateForWorker({
      company: "ORYUK",
      project,
      processId,
      subProcess,
      jointType,
      inspectionType,
      allTemplates: allCatalogTemplates,
      assignments: templateAssignments
    });
  }, [project, processId, subProcess, jointType, inspectionType, allCatalogTemplates, templateAssignments]);

  const effectiveWorkerName = (customWorker.trim() || worker || "").trim();

  // 오늘 해당 작업자가 이미 작성/저장한 일보가 있으면 로드
  const existingWorkerReport = useMemo(() => {
    if (editReport) return editReport;
    if (!effectiveWorkerName || !date || !allMachiningReports || allMachiningReports.length === 0) return null;
    return allMachiningReports.find((r) => {
      if (!r) return false;
      const matchWorker = String(r.worker || "").trim() === effectiveWorkerName;
      const matchDate = r.date === date;
      const matchProj = String(r.project || "").toUpperCase() === String(project || "").toUpperCase();
      const matchProc = r.processId === processId;
      return matchWorker && matchDate && matchProj && matchProc;
    }) || null;
  }, [editReport, effectiveWorkerName, date, allMachiningReports, project, processId]);

  // 활성 레고 양식 데이터
  const activeAssignedTemplate = useMemo(() => {
    if (existingWorkerReport) {
      return {
        id: existingWorkerReport.assignedTemplateId || assignedTemplate?.id || existingWorkerReport.id || "edit_lego_tpl",
        reportDocId: existingWorkerReport.id,
        title: existingWorkerReport.processName || existingWorkerReport.title || assignedTemplate?.title || "가공동 작업일보",
        carModel: existingWorkerReport.carModel || project,
        partName: existingWorkerReport.partName || assignedTemplate?.partName || "G/RUN",
        processName: existingWorkerReport.processId || processId || assignedTemplate?.processName || "소재준비",
        targetQty: existingWorkerReport.targetQty || existingWorkerReport.orderQty || existingWorkerReport.legoConfig?.targetQty || assignedTemplate?.targetQty || 350,
        orderQty: existingWorkerReport.orderQty || existingWorkerReport.targetQty || existingWorkerReport.legoConfig?.orderQty || assignedTemplate?.orderQty || 350,
        legoConfig: existingWorkerReport.legoConfig || assignedTemplate?.legoConfig || null,
        isExistingDraft: true
      };
    }
    return assignedTemplate;
  }, [existingWorkerReport, assignedTemplate, project, processId]);

  useEffect(() => {
    if (isOpen) {
      if (activeAssignedTemplate || editReport?.legoConfig) {
        setIsLegoMode(true);
      }
    }
  }, [isOpen, activeAssignedTemplate, editReport]);

  // Lot tracking
  const [materialLot, setMaterialLot] = useState({
    a: { start: "", mid: "", end: "" },
    b: { start: "", mid: "", end: "" }
  });
  const [jointMaterialName, setJointMaterialName] = useState("EPDM 컴파운드");
  const [jointLot, setJointLot] = useState("");
  const [bladeChangeTime, setBladeChangeTime] = useState("");
  const [machineTrouble, setMachineTrouble] = useState("");
  const [downtimeMinutes, setDowntimeMinutes] = useState(0);
  const [downtimeEvents, setDowntimeEvents] = useState(() => (Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []));
  const [notes, setNotes] = useState("");

  // Dimensions
  const [dimensions, setDimensions] = useState({});

  // Production Quantities
  const [production, setProduction] = useState({
    genuineLH: 0,
    badLH: 0,
    reworkLH: 0,
    genuineRH: 0,
    badRH: 0,
    reworkRH: 0
  });

  // Inspection 4-column production
  const [inspProduction, setInspProduction] = useState({
    col1: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
    col2: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
    col3: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
    col4: { insp: 0, genuine: 0, rework: 0, scrap: 0 }
  });

  // Defects
  const [defects, setDefects] = useState({});

  // Step & TPM
  const [currentStep, setCurrentStep] = useState(editReport ? "report" : "tpm");
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultMachiningTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");

  const tpmSummary = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    MACHINING_TPM_MACHINES.forEach((m) => {
      MACHINING_TPM_CHECK_ITEMS.forEach((it) => {
        const val = tpmChecks[m.id]?.[it.no] || "OK";
        if (val === "OK") okCount++;
        else ngCount++;
      });
    });
    return { okCount, ngCount, total: MACHINING_TPM_MACHINES.length * MACHINING_TPM_CHECK_ITEMS.length };
  }, [tpmChecks]);

  const handleSetAllTpmOk = () => {
    setTpmChecks(createDefaultMachiningTpmChecks());
  };

  const handleToggleTpmCheck = (machineId, itemNo) => {
    setTpmChecks((prev) => {
      const current = prev[machineId]?.[itemNo] || "OK";
      const next = current === "OK" ? "NG" : "OK";
      return {
        ...prev,
        [machineId]: {
          ...(prev[machineId] || {}),
          [itemNo]: next
        }
      };
    });
  };

  const handleProceedToReport = () => {
    setCurrentStep("report");
  };

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize from editReport or defaults
  useEffect(() => {
    if (editReport) {
      setCurrentStep("report");
      setProject(editReport.project || initialProject);
      setProcessId(editReport.processId || initialProcess);
      setSubProcess(editReport.subProcess || "정치절단");
      setJointType(editReport.jointType || "FRT");
      setInspectionType(editReport.inspectionType || "LENGTH");
      setDate(editReport.date || getKSTDateString());
      setShift(editReport.shift || "주간");
      setWorker(editReport.worker || "크리스토퍼");
      setStartTime(editReport.startTime || "06:30");
      setEndTime(editReport.endTime || "17:30");
      setMachineNo(editReport.machineNo || "");
      setDollyNo(editReport.dollyNo || "");
      setMaterialLot(editReport.materialLot || { a: { start: "", mid: "", end: "" }, b: { start: "", mid: "", end: "" } });
      setJointMaterialName(editReport.jointMaterialName || "EPDM 컴파운드");
      setJointLot(editReport.jointLot || "");
      setBladeChangeTime(editReport.bladeChangeTime || "");
      setMachineTrouble(editReport.machineTrouble || "");
      setDowntimeMinutes(editReport.downtimeMinutes || 0);
      setNotes(editReport.notes || "");
      setDimensions(editReport.dimensions || {});
      setProduction(editReport.production || { genuineLH: 0, badLH: 0, reworkLH: 0, genuineRH: 0, badRH: 0, reworkRH: 0 });
      setInspProduction(editReport.inspProduction || {
        col1: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
        col2: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
        col3: { insp: 0, genuine: 0, rework: 0, scrap: 0 },
        col4: { insp: 0, genuine: 0, rework: 0, scrap: 0 }
      });
      setDefects(editReport.defects || {});
      setTpmChecks(editReport.tpmChecks || createDefaultMachiningTpmChecks());
      setTpmActionNote(editReport.tpmActionNote || "");
    } else {
      setCurrentStep("tpm");
      setTpmChecks(createDefaultMachiningTpmChecks());
      setTpmActionNote("");
      if (initialProject) setProject(initialProject);
      if (initialProcess) setProcessId(initialProcess);
      if (initialWorker) setWorker(initialWorker);
    }
  }, [editReport, initialProject, initialProcess, initialWorker]);

  // Dynamic Specs Key
  const currentSpecKey = useMemo(() => {
    if (processId === "소재준비") return `${project}_소재준비_${subProcess}`;
    if (processId === "검사") return `${project}_검사_${inspectionType}`;
    return `${project}_${processId}`;
  }, [project, processId, subProcess, inspectionType]);

  const currentSpecs = useMemo(() => {
    return MACHINING_SPECS[currentSpecKey] || MACHINING_SPECS[`${project}_${processId}`] || [];
  }, [currentSpecKey, project, processId]);

  // Current defect list
  const currentDefectKeys = useMemo(() => {
    return getMachiningDefectList(project, processId, subProcess, jointType);
  }, [project, processId, subProcess, jointType]);

  // Totals calculations
  const totalGenuine = useMemo(() => {
    if (processId === "검사") {
      return Object.values(inspProduction).reduce((acc, c) => acc + (Number(c.genuine) || 0), 0);
    }
    return (Number(production.genuineLH) || 0) + (Number(production.genuineRH) || 0);
  }, [processId, inspProduction, production]);

  const totalBad = useMemo(() => {
    if (processId === "검사") {
      return Object.values(inspProduction).reduce((acc, c) => acc + (Number(c.scrap) || 0), 0);
    }
    return (Number(production.badLH) || 0) + (Number(production.badRH) || 0);
  }, [processId, inspProduction, production]);

  const totalRework = useMemo(() => {
    if (processId === "검사") {
      return Object.values(inspProduction).reduce((acc, c) => acc + (Number(c.rework) || 0), 0);
    }
    return (Number(production.reworkLH) || 0) + (Number(production.reworkRH) || 0);
  }, [processId, inspProduction, production]);

  const totalGross = totalGenuine + totalBad;
  const yieldPct = totalGross > 0 ? ((totalGenuine / totalGross) * 100).toFixed(1) : "100.0";

  // Dimension change handler
  const handleDimChange = (key, timing, val) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [timing]: val
      }
    }));
  };

  // Defect change handler
  const handleDefectChange = (defKey, delta) => {
    setDefects((prev) => {
      const cur = Number(prev[defKey]) || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [defKey]: next };
    });
  };

  // Save handler
  const handleSave = async () => {
    const finalWorker = customWorker.trim() || worker;
    if (!finalWorker) {
      alert("작업자를 선택하거나 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...(editReport || {}),
        project,
        processId,
        subProcess: processId === "소재준비" ? subProcess : undefined,
        jointType: processId === "조인트" ? jointType : undefined,
        inspectionType: processId === "검사" ? inspectionType : undefined,
        date,
        shift,
        worker: finalWorker,
        startTime,
        endTime,
        machineNo,
        dollyNo,
        materialLot,
        jointMaterialName,
        jointLot,
        bladeChangeTime,
        machineTrouble,
        downtimeMinutes: Number(downtimeMinutes) || 0,
        notes,
        dimensions,
        production,
        inspProduction: processId === "검사" ? inspProduction : undefined,
        defects,
        tpmChecks,
        tpmActionNote,
        summary: {
          totalGenuine,
          totalBad,
          totalRework,
          totalGross,
          yieldPct: parseFloat(yieldPct)
        }
      };

      await saveMachiningWorkReport(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error("Save machining work report error:", e);
      alert("작업일보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const finalWorker = customWorker.trim() || worker;
    const reportData = {
      project,
      processId,
      subProcess,
      jointType,
      inspectionType,
      date,
      shift,
      worker: finalWorker,
      startTime,
      endTime,
      machineNo,
      dollyNo,
      materialLot,
      jointMaterialName,
      jointLot,
      bladeChangeTime,
      machineTrouble,
      downtimeMinutes,
      notes,
      dimensions,
      production,
      inspProduction,
      defects,
      tpmChecks
    };
    exportMachiningReportToExcel(reportData);
  };

  // Lego save handler
  const handleSaveLegoReport = async (reportPayload) => {
    try {
      const targetDocId =
        editReport?.id ||
        activeAssignedTemplate?.reportDocId ||
        existingWorkerReport?.id ||
        `mwr_${project}_${reportPayload?.workDate || date}_${processId}_${effectiveWorkerName}`.replace(/[\s/]/g, "_");

      const machiningPayload = {
        id: targetDocId,
        project,
        carModel: reportPayload?.carModel || project,
        partName: reportPayload?.partName || "G/RUN",
        processId: processId || reportPayload?.processName || "소재준비",
        subProcess,
        jointType,
        inspectionType,
        date: reportPayload?.workDate || date,
        shift: reportPayload?.shift || shift,
        worker: effectiveWorkerName,
        startTime: reportPayload?.startTime || startTime,
        endTime: reportPayload?.finishTime || endTime,
        totals: reportPayload?.totals || { genuine: 0, bad: 0, rework: 0 },
        notes: reportPayload?.remarks || "",
        downtimeEvents: reportPayload?.downtimeEvents || [],
        legoConfig: reportPayload?.legoConfig || null,
        assignedTemplateId: activeAssignedTemplate?.id || null,
        createdAt: editReport?.createdAt || existingWorkerReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveMachiningWorkReport(machiningPayload);
    } catch (err) {
      console.error("Save machining report error:", err);
    }
    onClose();
  };

  // Lego delete handler
  const handleDeleteLegoReport = (editReport?.id || existingWorkerReport?.id)
    ? async () => {
        const targetId = editReport?.id || existingWorkerReport?.id;
        if (!window.confirm("정말로 이 가공동 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
        try {
          await deleteMachiningWorkReport(targetId);
          onClose();
        } catch (err) {
          alert("삭제 중 오류가 발생했습니다: " + err.message);
        }
      }
    : null;

  return {
    project,
    setProject,
    processId,
    setProcessId,
    subProcess,
    setSubProcess,
    jointType,
    setJointType,
    inspectionType,
    setInspectionType,
    date,
    setDate,
    shift,
    setShift,
    worker,
    setWorker,
    customWorker,
    setCustomWorker,
    effectiveWorkerName,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    machineNo,
    setMachineNo,
    dollyNo,
    setDollyNo,
    isLegoMode,
    setIsLegoMode,
    materialLot,
    setMaterialLot,
    jointMaterialName,
    setJointMaterialName,
    jointLot,
    setJointLot,
    bladeChangeTime,
    setBladeChangeTime,
    machineTrouble,
    setMachineTrouble,
    downtimeMinutes,
    setDowntimeMinutes,
    downtimeEvents,
    setDowntimeEvents,
    notes,
    setNotes,
    dimensions,
    handleDimChange,
    production,
    setProduction,
    inspProduction,
    setInspProduction,
    defects,
    handleDefectChange,
    currentStep,
    setCurrentStep,
    tpmChecks,
    tpmActionNote,
    setTpmActionNote,
    tpmSummary,
    handleSetAllTpmOk,
    handleToggleTpmCheck,
    handleProceedToReport,
    isSaving,
    saveSuccess,
    currentSpecs,
    currentDefectKeys,
    totalGenuine,
    totalBad,
    totalRework,
    totalGross,
    yieldPct,
    handleSave,
    handleExportExcel,
    activeAssignedTemplate,
    handleSaveLegoReport,
    handleDeleteLegoReport
  };
};
