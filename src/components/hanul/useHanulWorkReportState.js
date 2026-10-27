import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES,
  DEFAULT_DEFECT_CATEGORIES,
  HANUL_TPM_MACHINES,
  HANUL_TPM_CHECK_ITEMS,
  createDefaultHanulTpmChecks,
  saveHanulWorkReport,
  deleteHanulWorkReport,
  exportHanulReportToExcel,
  isExcludedFromWorkReport,
  getLocalHanulWorkReports,
  subscribeHanulWorkReports
} from "../../services/hanulWorkReportService";
import { getKSTDateString } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  buildHanulProcessSlotKey,
  getAssignedTemplateForWorker
} from "../../services/workReportTemplateService";
import {
  getWorkLogText,
  getCurrentWorkLogLanguage,
  getWorkerLanguageInfo,
  syncWorkerLanguage
} from "../../services/workLogI18nService";
import {
  BLADE_RESET_KEY,
  BLADE_LIMIT,
  isHanulTpmAlreadyDone,
  getDefectKeysForProcess,
  getSpecsForProcess,
  getInspColumnsForType,
  calculateTotals
} from "./hanulReportHelpers";

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

  // 🌟 관리자 지정 5대 공정 양식 연동 상태 (공정표 위치별 매핑)
  const [allCatalogTemplates, setAllCatalogTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [forceLegacyMode, setForceLegacyMode] = useState(false);

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

  const [cuttingPart, setCuttingPart] = useState("FRT"); // 정치절단 전용: "FRT" (A/B/C) | "RR" (A/B)
  const [cuttingLot, setCuttingLot] = useState({
    FRT: {
      a: { start: "", mid: "", end: "" },
      b: { start: "", mid: "", end: "" },
      c: { start: "", mid: "", end: "" }
    },
    RR: {
      a: { start: "", mid: "", end: "" },
      b: { start: "", mid: "", end: "" }
    }
  });
  const [jointType, setJointType] = useState("FRT"); // For "조인트": "FRT" | "FIXED_LH" | "FIXED_RH" | "RR"
  const [inspectionType, setInspectionType] = useState("LENGTH"); // For "검사": "LENGTH" | "SQUARE" | "FINAL_PAIR" | "FINAL_LH"
  const [bladeChangeTime, setBladeChangeTime] = useState("");
  const [machineTrouble, setMachineTrouble] = useState("");
  const [downtimeEvents, setDowntimeEvents] = useState(() =>
    Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []
  );
  const [jointGradeName, setJointGradeName] = useState("W60664$OS");
  const [jointGradeLot, setJointGradeLot] = useState("");
  const [subMaterialsLot, setSubMaterialsLot] = useState({
    glass: { start: "", mid: "", end: "" },
    dv: { start: "", mid: "", end: "" },
    bracket: { start: "", mid: "", end: "" }
  });
  const [padLot, setPadLot] = useState("");
  const [dvInspLot, setDvInspLot] = useState({ start: "", mid: "", end: "" });
  const [rrExtLot, setRrExtLot] = useState({
    a: { start: "", mid: "", end: "" },
    b: { start: "", mid: "", end: "" }
  });
  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(() =>
    initialWorker && !isExcludedFromWorkReport(initialWorker) ? initialWorker : "박종미"
  );
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("06:30");
  const [endTime, setEndTime] = useState("17:30");
  const [machineNo, setMachineNo] = useState("");

  // Lot tracking
  const [materialLot, setMaterialLot] = useState({ start: "", mid: "", end: "" });
  const [jointLot, setJointLot] = useState("");
  const [clipLot, setClipLot] = useState({ start: "", mid: "", end: "" });
  const [dollyNo, setDollyNo] = useState("");
  const [extTimeRange, setExtTimeRange] = useState({ start: "", end: "" });

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

  // 🌟 검사 전용 4개 컬럼 생산 수량 (검사/정품/리워크/폐기)
  const [inspProduction, setInspProduction] = useState({
    col1: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col2: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col3: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 },
    col4: { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 }
  });

  const currentDefectKeys = useMemo(() => {
    return getDefectKeysForProcess({ project, processId, subProcess, jointType, inspectionType });
  }, [project, processId, subProcess, jointType, inspectionType]);

  const [defects, setDefects] = useState({});

  const currentSpecs = useMemo(() => {
    return getSpecsForProcess({ project, processId, subProcess, jointType, inspectionType, cuttingPart });
  }, [project, processId, subProcess, jointType, inspectionType, cuttingPart]);

  // 🌟 동적 LOT 목록 및 실측 상태 (한울 모든 일보 공통 지원)
  const [lotEntries, setLotEntries] = useState(() => [
    {
      id: "lot_1",
      lotNo: "",
      subLotNo: "",
      measurements: {}
    }
  ]);

  const handleAddLot = () => {
    const nextIdx = lotEntries.length + 1;
    const newId = `lot_${Date.now()}_${nextIdx}`;
    setLotEntries((prev) => [
      ...prev,
      {
        id: newId,
        lotNo: "",
        subLotNo: "",
        measurements: {}
      }
    ]);
  };

  const handleRemoveLot = (idToRemove) => {
    setLotEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleUpdateLotField = (lotId, field, val) => {
    setLotEntries((prev) =>
      prev.map((item) => (item.id === lotId ? { ...item, [field]: val } : item))
    );
    if (lotEntries[0]?.id === lotId) {
      if (field === "lotNo") {
        setMaterialLot((prev) => ({ ...prev, start: val }));
      } else if (field === "subLotNo") {
        if (processId === "조인트") setJointLot(val);
        if (processId === "검사") setPadLot(val);
      }
    }
  };

  const [measurements, setMeasurements] = useState({});

  const handleUpdateLotMeasurement = (lotId, specKey, timing, val) => {
    setLotEntries((prev) =>
      prev.map((item) => {
        if (item.id !== lotId) return item;
        const prevMeas = item.measurements || {};
        const curSpec = prevMeas[specKey] || {};
        return {
          ...item,
          measurements: {
            ...prevMeas,
            [specKey]: {
              ...curSpec,
              [timing]: val
            }
          }
        };
      })
    );
    if (lotEntries[0]?.id === lotId) {
      setMeasurements((prev) => ({
        ...prev,
        [specKey]: {
          ...(prev[specKey] || {}),
          [timing]: val
        }
      }));
    }
  };

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

  // 🌟 9BQC 칼날 수명 및 누적 생산량 관리 (5만개 주기 알림)
  const [allReports, setAllReports] = useState(() => getLocalHanulWorkReports());
  const [bladeResetInfo, setBladeResetInfo] = useState(() => {
    try {
      const raw = localStorage.getItem(BLADE_RESET_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [isBladeTestMode, setIsBladeTestMode] = useState(false);

  const [currentStep, setCurrentStep] = useState(editReport ? "report" : "tpm");
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultHanulTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");
  const [isHanulTpmDone, setIsHanulTpmDone] = useState(false);

  // 🌐 다국어 번역 상태 및 근로자 국적 기반 자동 언어 동기화
  const [currentLang, setCurrentLang] = useState(() => getCurrentWorkLogLanguage());

  // 작업자 변경 시 해당 작업자의 국적을 확인하여 모국어로 자동 전환
  useEffect(() => {
    const targetW = customWorker.trim() || worker;
    if (targetW) {
      const synched = syncWorkerLanguage({ name: targetW, company: "한울" });
      setCurrentLang(synched);
    }
  }, [worker, customWorker]);

  // 언어 변경 리스너
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, []);

  const workerLangInfo = useMemo(() => {
    const targetW = customWorker.trim() || worker;
    return getWorkerLanguageInfo({ name: targetW, company: "한울" });
  }, [worker, customWorker]);

  // 🌟 공정표에서 현재 선택된 공정/단계 위치(Slot)의 지정 양식 매칭
  const activeSubSlot = useMemo(() => {
    const normProj = String(project || "").toUpperCase() === "LQ2A" ? "LQ2A" : "9BQC";
    if (processId === "소재준비") {
      return normProj === "9BQC" ? (subProcess || "정치절단") : "작업일보";
    }
    if (processId === "조인트") return jointType || "FRT";
    if (processId === "검사") return inspectionType || "LENGTH";
    return "MAIN";
  }, [project, processId, subProcess, jointType, inspectionType]);

  const activeSlotKey = useMemo(() => {
    return buildHanulProcessSlotKey(project, processId, activeSubSlot);
  }, [project, processId, activeSubSlot]);

  const effectiveWorkerName = (customWorker.trim() || worker || "").trim();

  const existingWorkerReport = useMemo(() => {
    if (editReport) return editReport;
    if (!effectiveWorkerName || !date || !allReports || allReports.length === 0) return null;
    return allReports.find((r) => {
      if (!r) return false;
      const matchWorker = String(r.worker || "").trim() === effectiveWorkerName;
      const matchDate = r.date === date;
      const matchProj = String(r.project || "").toUpperCase() === String(project || "").toUpperCase();
      const matchProc = r.processId === processId;
      if (!matchWorker || !matchDate || !matchProj || !matchProc) return false;

      if (processId === "소재준비") {
        return (r.subProcess || "정치절단") === (subProcess || "정치절단");
      }
      if (processId === "조인트") {
        return (r.jointType || "FRT") === (jointType || "FRT");
      }
      if (processId === "검사") {
        return (r.inspectionType || "LENGTH") === (inspectionType || "LENGTH");
      }
      return true;
    }) || null;
  }, [editReport, effectiveWorkerName, date, allReports, project, processId, subProcess, jointType, inspectionType]);

  const activeAssignedTemplate = useMemo(() => {
    const baseAssigned = getAssignedTemplateForWorker({
      company: companyMode,
      project,
      processId,
      subProcess,
      jointType,
      inspectionType,
      allTemplates: allCatalogTemplates,
      assignments: templateAssignments
    });

    if (existingWorkerReport) {
      return {
        id: existingWorkerReport.assignedTemplateId || baseAssigned?.id || existingWorkerReport.id || "edit_lego_tpl",
        reportDocId: existingWorkerReport.id,
        title: existingWorkerReport.processName || existingWorkerReport.title || baseAssigned?.title || "작업일보",
        carModel: existingWorkerReport.carModel || project,
        partName: existingWorkerReport.partName || baseAssigned?.partName || "G/RUN",
        processName: existingWorkerReport.processId || processId || baseAssigned?.processName || "소재준비",
        targetQty: existingWorkerReport.targetQty || existingWorkerReport.orderQty || existingWorkerReport.legoConfig?.targetQty || baseAssigned?.targetQty || 350,
        orderQty: existingWorkerReport.orderQty || existingWorkerReport.targetQty || existingWorkerReport.legoConfig?.orderQty || baseAssigned?.orderQty || 350,
        legoConfig: existingWorkerReport.legoConfig || baseAssigned?.legoConfig || null,
        isExistingDraft: true
      };
    }
    return baseAssigned;
  }, [
    existingWorkerReport,
    templateAssignments,
    allCatalogTemplates,
    companyMode,
    project,
    processId,
    subProcess,
    jointType,
    inspectionType
  ]);

  const isAssignedTemplateMode = Boolean(activeAssignedTemplate) && !forceLegacyMode;

  // ⚡ TPM 다국어 라벨 일괄 사전 계산
  const tpmI18n = useMemo(() => {
    const machines = {};
    HANUL_TPM_MACHINES.forEach((m) => {
      const machKey = `tpm_mach_${m.id}`;
      const txt = getWorkLogText(machKey, currentLang);
      machines[m.id] = {
        fullName: txt !== machKey ? txt : m.name,
        shortName: txt !== machKey ? txt : m.shortName
      };
    });

    const items = {};
    HANUL_TPM_CHECK_ITEMS.forEach((it) => {
      const itemKey = `tpm_item_${it.no}`;
      const txt = getWorkLogText(itemKey, currentLang);
      items[it.no] = txt !== itemKey ? txt : it.content;
    });

    return {
      statusOk: getWorkLogText("tpm_status_ok", currentLang),
      statusNg: getWorkLogText("tpm_status_ng", currentLang),
      machineOk: getWorkLogText("machine_ok", currentLang),
      allOk: getWorkLogText("all_ok", currentLang),
      checkItemsTitle: getWorkLogText("tpm_check_items_title", currentLang),
      sheetTitle: getWorkLogText("tpm_sheet_title", currentLang),
      sheetSubtitle: getWorkLogText("tpm_sheet_subtitle", currentLang),
      saveAndNext: getWorkLogText("tpm_save_and_next", currentLang),
      abnormalityNote: getWorkLogText("abnormality_note", currentLang),
      abnormalityPlaceholder: getWorkLogText("abnormality_placeholder", currentLang),
      backToTpm: getWorkLogText("back_to_tpm", currentLang),
      close: getWorkLogText("close", currentLang),
      saveReport: getWorkLogText("save_report", currentLang),
      autoTranslatedBadge: getWorkLogText("auto_translated_badge", currentLang),
      machines,
      items
    };
  }, [currentLang]);

  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setAllReports(list || []);
    });
    return () => unsub();
  }, []);

  // 🚀 통합 초기화 Effect
  useEffect(() => {
    if (!isOpen) return;

    const effectiveW = editReport?.worker || initialWorker || "박종미";
    const targetD = editReport?.date || getKSTDateString();
    const alreadyDone = isHanulTpmAlreadyDone(targetD, effectiveW, allReports, editReport);
    setIsHanulTpmDone(alreadyDone);

    if (editReport) {
      setCurrentStep("report");
      setTpmChecks(editReport.tpmChecks || createDefaultHanulTpmChecks());
      setTpmActionNote(editReport.tpmActionNote || "");
      setProject(editReport.project || "9BQC");
      setProcessId(editReport.processId || "소재준비");
      if (editReport.subProcess) setSubProcess(editReport.subProcess);
      if (editReport.jointType) setJointType(editReport.jointType);
      if (editReport.cuttingPart) setCuttingPart(editReport.cuttingPart);
      if (editReport.cuttingLot) setCuttingLot(editReport.cuttingLot);
      if (editReport.inspectionType) setInspectionType(editReport.inspectionType);
      if (editReport.bladeChangeTime) setBladeChangeTime(editReport.bladeChangeTime);
      if (editReport.machineTrouble) setMachineTrouble(editReport.machineTrouble);
      if (editReport.jointGradeName) setJointGradeName(editReport.jointGradeName);
      if (editReport.jointGradeLot) setJointGradeLot(editReport.jointGradeLot);
      if (editReport.subMaterialsLot) setSubMaterialsLot(editReport.subMaterialsLot);
      if (editReport.padLot) setPadLot(editReport.padLot);
      if (editReport.dvInspLot) setDvInspLot(editReport.dvInspLot);
      if (editReport.rrExtLot) setRrExtLot(editReport.rrExtLot);
      if (editReport.inspProduction) setInspProduction(editReport.inspProduction);
      setDate(editReport.date || getKSTDateString());
      setShift(editReport.shift || "주간");
      setWorker(editReport.worker && !isExcludedFromWorkReport(editReport.worker) ? editReport.worker : "박종미");
      setStartTime(editReport.startTime || "06:30");
      setEndTime(editReport.endTime || "17:30");
      setMachineNo(editReport.machineNo || "");
      if (editReport.materialLot) setMaterialLot(editReport.materialLot);
      if (editReport.jointLot) setJointLot(editReport.jointLot);
      if (editReport.clipLot) setClipLot(editReport.clipLot);
      if (editReport.dollyNo) setDollyNo(editReport.dollyNo);
      if (editReport.extTimeRange) setExtTimeRange(editReport.extTimeRange);
      if (editReport.production) setProduction(editReport.production);
      if (editReport.defects) setDefects(editReport.defects);
      if (editReport.measurements) setMeasurements(editReport.measurements);
      if (Array.isArray(editReport.lotEntries) && editReport.lotEntries.length > 0) {
        setLotEntries(editReport.lotEntries);
      } else {
        const initialLotNo =
          editReport.materialLot?.start ||
          (typeof editReport.materialLot === "string" ? editReport.materialLot : "") ||
          Object.values(editReport.measurements || {}).map((m) => m?.lot).filter(Boolean)[0] ||
          "";
        setLotEntries([
          {
            id: "lot_1",
            lotNo: initialLotNo,
            subLotNo: editReport.jointLot || editReport.padLot || editReport.jointGradeLot || "",
            measurements: editReport.measurements || {}
          }
        ]);
      }
      if (editReport.conditions) setConditions(editReport.conditions);
      if (editReport.cleaningTimes) setCleaningTimes(editReport.cleaningTimes);
      if (editReport.notes) setNotes(editReport.notes);
    } else {
      const isSojae = (initialProcess || processId) === "소재준비";
      setCurrentStep(isSojae && !alreadyDone ? "tpm" : "report");
      setTpmChecks(createDefaultHanulTpmChecks());
      setTpmActionNote("");

      setProject(initialProject);
      setProcessId(initialProcess);
      setSubProcess("정치절단");
      setCuttingPart("FRT");
      setCuttingLot({
        FRT: {
          a: { start: "", mid: "", end: "" },
          b: { start: "", mid: "", end: "" },
          c: { start: "", mid: "", end: "" }
        },
        RR: {
          a: { start: "", mid: "", end: "" },
          b: { start: "", mid: "", end: "" }
        }
      });
      setJointType("FRT");
      setInspectionType("LENGTH");
      setBladeChangeTime("");
      setMachineTrouble("");
      setPadLot("");
      setDvInspLot({ start: "", mid: "", end: "" });
      setRrExtLot({
        a: { start: "", mid: "", end: "" },
        b: { start: "", mid: "", end: "" }
      });
      setLotEntries([
        {
          id: "lot_1",
          lotNo: "",
          subLotNo: "",
          measurements: {}
        }
      ]);
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

  // Sum calculations
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

  // 🌟 9BQC 누적 생산량 (저장된 9BQC 일보들의 총생산량)
  const past9BQCGross = useMemo(() => {
    return (allReports || []).reduce((acc, r) => {
      if (r.project === "9BQC" && !isExcludedFromWorkReport(r.worker)) {
        const g = Number(r.totals?.gross) || ((Number(r.totals?.genuine) || 0) + (Number(r.totals?.bad) || 0));
        return acc + g;
      }
      return acc;
    }, 0);
  }, [allReports]);

  // 현재 모달에서 작성 중인 실적
  const currentGross = useMemo(() => {
    if (project !== "9BQC") return 0;
    return Number(totals.gross) || 0;
  }, [project, totals.gross]);

  // 총 누적 생산량 (최근 교체 리셋 기준량 차감 반영)
  const totalCumulativeQty = useMemo(() => {
    if (isBladeTestMode) return 52450;
    const grossTotal = past9BQCGross + currentGross;
    const resetOffset = Number(bladeResetInfo?.resetGross) || 0;
    return Math.max(0, grossTotal - resetOffset);
  }, [past9BQCGross, currentGross, bladeResetInfo, isBladeTestMode]);

  const isBladeOverdue = totalCumulativeQty >= BLADE_LIMIT;
  const bladeLifePercent = Math.min(100, (totalCumulativeQty / BLADE_LIMIT) * 100);

  // 칼날 교체 완료 및 누적 리셋 핸들러
  const handleRecordBladeChangeNow = () => {
    const kstTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    const kstDate = getKSTDateString();
    setBladeChangeTime(kstTime);
    const newReset = {
      resetDate: kstDate,
      resetTime: kstTime,
      resetGross: past9BQCGross + currentGross,
      worker: customWorker.trim() || worker
    };
    setBladeResetInfo(newReset);
    try {
      localStorage.setItem(BLADE_RESET_KEY, JSON.stringify(newReset));
    } catch (e) {}
  };

  const handleClearBladeReset = () => {
    setBladeResetInfo(null);
    try {
      localStorage.removeItem(BLADE_RESET_KEY);
    } catch (e) {}
  };

  // 🌟 TPM 점검 이벤트 핸들러 및 요약 통계
  const handleToggleTpmCheck = useCallback((machineId, itemNo) => {
    setTpmChecks((prev) => {
      const cur = prev[machineId]?.[itemNo] || "OK";
      const nextVal = cur === "OK" ? "NG" : "OK";
      return {
        ...prev,
        [machineId]: {
          ...(prev[machineId] || {}),
          [itemNo]: nextVal
        }
      };
    });
  }, []);

  const handleSetAllTpmOk = useCallback(() => {
    setTpmChecks(createDefaultHanulTpmChecks());
  }, []);

  const handleSetMachineAllOk = useCallback((machineId) => {
    setTpmChecks((prev) => {
      const machineChecks = {};
      HANUL_TPM_CHECK_ITEMS.forEach((it) => {
        machineChecks[it.no] = "OK";
      });
      return {
        ...prev,
        [machineId]: machineChecks
      };
    });
  }, []);

  const handleProceedToReport = () => {
    const effectiveWorkerName = (customWorker.trim() || worker).trim();
    const key = `hanul_tpm_done_${date}_${effectiveWorkerName}`;
    try {
      localStorage.setItem(key, "true");
    } catch (e) {}
    setIsHanulTpmDone(true);
    setCurrentStep("report");
    setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, 50);
  };

  const tpmSummary = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    const ngList = [];
    HANUL_TPM_MACHINES.forEach((m) => {
      HANUL_TPM_CHECK_ITEMS.forEach((it) => {
        const st = tpmChecks[m.id]?.[it.no] || "OK";
        if (st === "OK") okCount++;
        else {
          ngCount++;
          ngList.push({ machine: m.shortName, machineName: m.name, item: it.content, itemNo: it.no, method: it.method });
        }
      });
    });
    return { okCount, ngCount, ngList, total: okCount + ngCount };
  }, [tpmChecks]);

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

  const inspColumns = useMemo(() => {
    return getInspColumnsForType(inspectionType);
  }, [inspectionType]);

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
        `hwr_${project}_${legoPayload?.workDate || date}_${processId}_${activeSubSlot}_${effectiveWorker}`.replace(/[\s/]/g, "_");

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
