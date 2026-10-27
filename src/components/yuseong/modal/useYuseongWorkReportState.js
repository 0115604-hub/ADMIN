import { useState, useEffect, useMemo, useRef } from "react";
import { getKSTDateString } from "../../../utils/dateUtils";
import {
  YUSEONG_TPM_MACHINES,
  YUSEONG_TPM_CHECK_ITEMS,
  createDefaultYuseongTpmChecks,
  YUSEONG_SPECS,
  YUSEONG_DEFECT_CATEGORIES,
  saveYuseongWorkReport,
  deleteYuseongWorkReport
} from "../../../services/yuseongWorkReportService";
import {
  getAssignedTemplateForWorker,
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments
} from "../../../services/workReportTemplateService";

export const useYuseongWorkReportState = ({
  isOpen,
  onClose,
  initialProject = "JK1",
  initialWorker = "이성기",
  editReport = null
}) => {
  // Modal step: "tpm" (Step 4 선행) | "report" (Step 5 일보)
  const [currentStep, setCurrentStep] = useState("tpm");

  // Project (JK1 Part'g, CE1 Part'g, DT Hood)
  const [project, setProject] = useState(initialProject);
  const [processId, setProcessId] = useState("소재준비");
  const [subProcess, setSubProcess] = useState("정치절단");

  // Basic Information
  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간"); // "주간" | "야간"
  const [worker, setWorker] = useState(initialWorker);
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [machineNo, setMachineNo] = useState("1호기");
  const [isLegoMode, setIsLegoMode] = useState(true);

  // 🌟 관리자 지정 양식 카탈로그 및 슬롯 할당 실시간 구독
  const [allCatalogTemplates, setAllCatalogTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());

  useEffect(() => {
    const unsubTpl = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) setAllCatalogTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (map) setTemplateAssignments(map);
    });
    return () => {
      unsubTpl();
      unsubAssign();
    };
  }, []);

  // 🌟 유성 관리자가 지정한 5대 공정 작업일보 양식 (JK1, CE1, DT) 자동 연동
  const assignedTemplate = useMemo(() => {
    return getAssignedTemplateForWorker({
      company: "YUSEONG",
      project,
      processId,
      subProcess,
      allTemplates: allCatalogTemplates,
      assignments: templateAssignments
    });
  }, [project, processId, subProcess, allCatalogTemplates, templateAssignments]);

  const activeAssignedTemplate = useMemo(() => {
    if (editReport?.legoConfig) {
      return {
        id: editReport.assignedTemplateId || assignedTemplate?.id || editReport.id || "edit_lego_tpl",
        reportDocId: editReport.id,
        title: editReport.processName || editReport.title || assignedTemplate?.title || "유성 작업일보",
        carModel: editReport.carModel || project,
        partName: editReport.partName || assignedTemplate?.partName || "G/RUN",
        processName: editReport.processId || processId || assignedTemplate?.processName || "가공/협력업체",
        targetQty: editReport.targetQty || editReport.orderQty || editReport.legoConfig?.targetQty || assignedTemplate?.targetQty || 350,
        orderQty: editReport.orderQty || editReport.targetQty || editReport.legoConfig?.orderQty || assignedTemplate?.orderQty || 350,
        legoConfig: editReport.legoConfig || assignedTemplate?.legoConfig || null,
        isExistingDraft: true
      };
    }
    return assignedTemplate;
  }, [editReport, assignedTemplate, project, processId]);

  useEffect(() => {
    if (isOpen) {
      if (activeAssignedTemplate || editReport?.legoConfig) {
        setIsLegoMode(true);
      }
    }
  }, [isOpen, activeAssignedTemplate, editReport]);

  const [dollyNo, setDollyNo] = useState("");

  // Material & Blade
  const [materialLot, setMaterialLot] = useState("");
  const [jointLot, setJointLot] = useState("");
  const [bladeChangeTime, setBladeChangeTime] = useState("");

  // Dimensions (초/중/종물)
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

  // Defects Count
  const [defects, setDefects] = useState({});

  // TPM Checks (5 machines x 7 check items = 35 checks)
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultYuseongTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");

  // Downtime & Notes
  const [downtimeMinutes, setDowntimeMinutes] = useState("");
  const [machineTrouble, setMachineTrouble] = useState("");
  const [downtimeEvents, setDowntimeEvents] = useState(() =>
    Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []
  );
  const [notes, setNotes] = useState("");

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const scrollContainerRef = useRef(null);

  // Sync when editReport or props change
  useEffect(() => {
    if (editReport) {
      setProject(editReport.project || "JK1");
      setProcessId(editReport.processId || "소재준비");
      if (editReport.subProcess) setSubProcess(editReport.subProcess);
      setDate(editReport.date || getKSTDateString());
      setShift(editReport.shift || "주간");
      setWorker(editReport.worker || initialWorker);
      setStartTime(editReport.startTime || "08:00");
      setEndTime(editReport.endTime || "17:00");
      setMachineNo(editReport.machineNo || "1호기");
      setDollyNo(editReport.dollyNo || "");
      setMaterialLot(editReport.materialLot || "");
      setJointLot(editReport.jointLot || "");
      setBladeChangeTime(editReport.bladeChangeTime || "");
      setDimensions(editReport.dimensions || {});
      setProduction(
        editReport.production || { genuineLH: 0, badLH: 0, reworkLH: 0, genuineRH: 0, badRH: 0, reworkRH: 0 }
      );
      setDefects(editReport.defects || {});
      if (editReport.tpmChecks) setTpmChecks(editReport.tpmChecks);
      setTpmActionNote(editReport.tpmActionNote || "");
      setDowntimeMinutes(editReport.downtimeMinutes || "");
      setMachineTrouble(editReport.machineTrouble || "");
      setDowntimeEvents(Array.isArray(editReport.downtimeEvents) ? editReport.downtimeEvents : []);
      setNotes(editReport.notes || "");
      setCurrentStep("report"); // Editing starts at report
    } else {
      setProject(initialProject || "JK1");
      setWorker(initialWorker || "이성기");
      setDate(getKSTDateString());
      setCurrentStep("tpm"); // New report always starts with Step 4 TPM
      setTpmChecks(createDefaultYuseongTpmChecks());
      setTpmActionNote("");
      setDowntimeEvents([]);
    }
  }, [editReport, initialProject, initialWorker, isOpen]);

  // Current Specs based on selected project
  const currentSpecs = useMemo(() => {
    const projKey = project.startsWith("JK1") ? "JK1" : project.startsWith("CE1") ? "CE1" : "DT";
    return YUSEONG_SPECS[projKey] || YUSEONG_SPECS.JK1;
  }, [project]);

  // Current Defect Categories
  const currentDefectKeys = useMemo(() => {
    return YUSEONG_DEFECT_CATEGORIES[processId] || YUSEONG_DEFECT_CATEGORIES.소재준비;
  }, [processId]);

  // Production Totals
  const totalGenuine = (Number(production.genuineLH) || 0) + (Number(production.genuineRH) || 0);
  const totalBad = (Number(production.badLH) || 0) + (Number(production.badRH) || 0);
  const totalRework = (Number(production.reworkLH) || 0) + (Number(production.reworkRH) || 0);
  const totalGross = totalGenuine + totalBad;
  const yieldPct = totalGross > 0 ? ((totalGenuine / totalGross) * 100).toFixed(1) : "100.0";

  // TPM Summary
  const tpmSummary = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    const ngList = [];
    YUSEONG_TPM_MACHINES.forEach((m) => {
      YUSEONG_TPM_CHECK_ITEMS.forEach((it) => {
        const st = tpmChecks[m.id]?.[it.no] || "OK";
        if (st === "OK") okCount++;
        else {
          ngCount++;
          ngList.push(`${m.name}: ${it.content}`);
        }
      });
    });
    return { okCount, ngCount, ngList };
  }, [tpmChecks]);

  // Handlers for TPM
  const handleToggleTpmCheck = (machineId, itemNo) => {
    setTpmChecks((prev) => {
      const cur = prev[machineId]?.[itemNo] || "OK";
      const next = cur === "OK" ? "NG" : "OK";
      return {
        ...prev,
        [machineId]: { ...(prev[machineId] || {}), [itemNo]: next }
      };
    });
  };

  const handleSetAllTpmOk = () => {
    setTpmChecks(createDefaultYuseongTpmChecks());
  };

  const handleProceedToReport = () => {
    setCurrentStep("report");
    setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, 50);
  };

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

  // Save Report
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
        date,
        shift,
        worker: finalWorker,
        startTime,
        endTime,
        machineNo,
        dollyNo,
        materialLot,
        jointLot,
        bladeChangeTime,
        machineTrouble,
        downtimeMinutes: Number(downtimeMinutes) || 0,
        downtimeEvents,
        notes,
        dimensions,
        production,
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

      await saveYuseongWorkReport(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error("Save yuseong work report error:", e);
      alert("작업일보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLegoReport = async (reportPayload) => {
    try {
      await saveYuseongWorkReport({
        ...reportPayload,
        project,
        worker: customWorker.trim() || worker,
        date
      });
    } catch (e) {
      console.error("Lego save error:", e);
    }
    onClose();
  };

  const handleDeleteLegoReport = async () => {
    if (!editReport?.id) return;
    if (!window.confirm("정말로 이 등록된 유성 가공/협력업체 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    try {
      await deleteYuseongWorkReport(editReport.id);
      onClose();
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    project,
    setProject,
    processId,
    setProcessId,
    subProcess,
    setSubProcess,
    date,
    setDate,
    shift,
    setShift,
    worker,
    setWorker,
    customWorker,
    setCustomWorker,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    machineNo,
    setMachineNo,
    isLegoMode,
    setIsLegoMode,
    assignedTemplate,
    activeAssignedTemplate,
    dollyNo,
    setDollyNo,
    materialLot,
    setMaterialLot,
    jointLot,
    setJointLot,
    bladeChangeTime,
    setBladeChangeTime,
    dimensions,
    production,
    setProduction,
    defects,
    tpmChecks,
    tpmActionNote,
    setTpmActionNote,
    downtimeMinutes,
    setDowntimeMinutes,
    machineTrouble,
    setMachineTrouble,
    downtimeEvents,
    setDowntimeEvents,
    notes,
    setNotes,
    isSaving,
    saveSuccess,
    scrollContainerRef,
    currentSpecs,
    currentDefectKeys,
    totalGenuine,
    totalBad,
    totalRework,
    totalGross,
    yieldPct,
    tpmSummary,
    handleToggleTpmCheck,
    handleSetAllTpmOk,
    handleProceedToReport,
    handleDimChange,
    handleDefectChange,
    handleSave,
    handleSaveLegoReport,
    handleDeleteLegoReport
  };
};
