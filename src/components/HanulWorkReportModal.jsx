import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES,
  HANUL_SPECS,
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
} from "../services/hanulWorkReportService";
import { getKSTDateString } from "../utils/dateUtils";
import { useModalHistory } from "../utils/modalHistory";
import CommonDowntimeDefectPanel from "./common/CommonDowntimeDefectPanel";
import LegoWorkReportBuilder from "./lego/LegoWorkReportBuilder";
import HanulReportHeaderNav from "./hanul/HanulReportHeaderNav";
import HanulReportSubNav from "./hanul/HanulReportSubNav";
import HanulReportTpmPanel from "./hanul/HanulReportTpmPanel";
import HanulReportAssignedWorkerBanner from "./hanul/HanulReportAssignedWorkerBanner";
import HanulReportBasicInfo from "./hanul/HanulReportBasicInfo";
import HanulReportLotSpec from "./hanul/HanulReportLotSpec";
import HanulReportJointCondition from "./hanul/HanulReportJointCondition";
import HanulReportDefectMatrix from "./hanul/HanulReportDefectMatrix";
import HanulReportBladeMaintenance from "./hanul/HanulReportBladeMaintenance";
import HanulReportFooter from "./hanul/HanulReportFooter";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  buildHanulProcessSlotKey,
  getAssignedTemplateForWorker
} from "../services/workReportTemplateService";
import {
  getWorkLogText,
  getCurrentWorkLogLanguage,
  getWorkerLanguageInfo,
  syncWorkerLanguage
} from "../services/workLogI18nService";

export const HanulWorkReportModal = ({
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
  }); // 정치절단 전용 단면별 투입 압출 LOT
  const [jointType, setJointType] = useState("FRT"); // For "조인트": "FRT" | "FIXED_LH" | "FIXED_RH" | "RR"
  const [inspectionType, setInspectionType] = useState("LENGTH"); // For "검사": "LENGTH" | "SQUARE" | "FINAL_PAIR" | "FINAL_LH"
  const [bladeChangeTime, setBladeChangeTime] = useState(""); // 칼날교체시간 (정치절단 전용)
  const [machineTrouble, setMachineTrouble] = useState("");
  const [downtimeEvents, setDowntimeEvents] = useState(() => Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []); // 설비 이상 조치사항
  const [jointGradeName, setJointGradeName] = useState("W60664$OS"); // 조인트 재료명
  const [jointGradeLot, setJointGradeLot] = useState(""); // 조인트 재료일자 / LOT
  const [subMaterialsLot, setSubMaterialsLot] = useState({
    glass: { start: "", mid: "", end: "" },
    dv: { start: "", mid: "", end: "" },
    bracket: { start: "", mid: "", end: "" }
  }); // 부자재 LOT (조인트 FIXED LH/RH 전용)
  const [padLot, setPadLot] = useState(""); // 부자재 LOT (검사 패드 5T 전용)
  const [dvInspLot, setDvInspLot] = useState({ start: "", mid: "", end: "" }); // 부자재 LOT (최종검사 D/V 전용)
  const [rrExtLot, setRrExtLot] = useState({
    a: { start: "", mid: "", end: "" },
    b: { start: "", mid: "", end: "" }
  }); // 압출소재 LOT NO. (RR A, RR B 초/중/종)
  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(() => (initialWorker && !isExcludedFromWorkReport(initialWorker) ? initialWorker : "박종미"));
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("06:30");
  const [endTime, setEndTime] = useState("17:30");
  const [machineNo, setMachineNo] = useState("");

  // Lot tracking
  const [materialLot, setMaterialLot] = useState({ start: "", mid: "", end: "" });
  const [jointLot, setJointLot] = useState("");
  const [clipLot, setClipLot] = useState({ start: "", mid: "", end: "" });
  const [dollyNo, setDollyNo] = useState(""); // 대차번호
  const [extTimeRange, setExtTimeRange] = useState({ start: "", end: "" }); // 압출시간대

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

  // Dynamic Defects (matching sheet categories)
  const currentDefectKeys = useMemo(() => {
    let key;
    if (processId === "소재준비") {
      key = `${project}_소재준비_${subProcess}`;
    } else if (processId === "조인트") {
      key = `${project}_조인트_${jointType}`;
    } else if (processId === "검사") {
      key = `${project}_검사_${inspectionType}`;
    } else {
      key = `${project}_${processId}`;
    }
    return (
      DEFAULT_DEFECT_CATEGORIES[key] ||
      DEFAULT_DEFECT_CATEGORIES[`${project}_${processId}`] ||
      DEFAULT_DEFECT_CATEGORIES["9BQC_검사"] ||
      DEFAULT_DEFECT_CATEGORIES["9BQC_조인트"] ||
      []
    );
  }, [project, processId, subProcess, jointType, inspectionType]);

  const [defects, setDefects] = useState({});

  // Measurements by spec
  const currentSpecs = useMemo(() => {
    let key;
    if (processId === "소재준비") {
      key = `${project}_소재준비_${subProcess}`;
    } else if (processId === "조인트") {
      key = `${project}_조인트_${jointType}`;
    } else if (processId === "검사") {
      key = `${project}_검사_${inspectionType}`;
    } else {
      key = `${project}_${processId}`;
    }
    const specs = HANUL_SPECS[key] || HANUL_SPECS[`${project}_${processId}`] || [];
    if (processId === "소재준비" && subProcess === "정치절단") {
      return cuttingPart === "RR"
        ? specs.filter((s) => s.key.startsWith("rr"))
        : specs.filter((s) => s.key.startsWith("frt"));
    }
    return specs;
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

  const [measurements, setMeasurements] = useState({});

  // Process-specific conditions
  const [conditions, setConditions] = useState({
    // 조인트 사출온도
    nozzleTempSet: "220",
    nozzleTempAct: "220",
    cyl1TempSet: "215",
    cyl1TempAct: "215",
    cyl2TempSet: "210",
    cyl2TempAct: "210",
    cyl3TempSet: "205",
    cyl3TempAct: "205",
    // 사출조건
    distance: { start: "", mid: "", end: "" },
    speed: { start: "", mid: "", end: "" },
    pressure: { start: "", mid: "", end: "" },
    time: { start: "", mid: "", end: "" },
    // 프레스 가류조건 (LQ2a)
    rubberGrade: "W60664$OS",
    cureTempUpperSet: "200",
    cureTempUpperAct: "200",
    cureTempLowerSet: "200",
    cureTempLowerAct: "200",
    cureTimeSec: "90",
    // 본드 로봇
    preheatTemp: "40",
    dryingTemp: "80",
    bondName: "PRI",
    tipReplaces: [
      { round: 1, time: "", qty: "", reason: "마모" },
      { round: 2, time: "", qty: "", reason: "막힘" }
    ],
    // 단면 확인 체크 (1~22)
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
  const BLADE_RESET_KEY = "hanul_9bqc_blade_reset_info";
  const [allReports, setAllReports] = useState(() => getLocalHanulWorkReports());
  const [bladeResetInfo, setBladeResetInfo] = useState(() => {
    try {
      const raw = localStorage.getItem("hanul_9bqc_blade_reset_info");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [isBladeTestMode, setIsBladeTestMode] = useState(false);

  // 🌟 9BQC 소재준비 설비일상 점검 시트 (TPM) 2단계 프로세스 상태 및 헬퍼
  const isHanulTpmAlreadyDone = (targetDate, targetWorker) => {
    if (!targetDate || !targetWorker) return false;
    try {
      const cleanW = String(targetWorker).trim();
      const key = `hanul_tpm_done_${targetDate}_${cleanW}`;
      if (typeof window !== "undefined" && window.localStorage && localStorage.getItem(key) === "true") return true;
      if (editReport && editReport.tpmStatus === "완료") return true;
      if (Array.isArray(allReports) && allReports.length > 0) {
        const found = allReports.some(
          (r) => r && r.date === targetDate && String(r.worker || "").includes(cleanW) && r.tpmStatus === "완료"
        );
        if (found) return true;
      }
    } catch (e) {
      console.warn("isHanulTpmAlreadyDone error:", e);
    }
    return false;
  };

  const [currentStep, setCurrentStep] = useState(editReport ? "report" : "tpm");
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultHanulTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");
  const [isHanulTpmDone, setIsHanulTpmDone] = useState(false);

  // 🌐 다국어 번역 상태 및 근로자 국적 기반 자동 언어 동기화
  const [currentLang, setCurrentLang] = useState(() => getCurrentWorkLogLanguage());

  // 작업자(worker / customWorker) 변경 시 해당 작업자의 국적을 확인하여 모국어로 자동 전환
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

  // 🌟 [개개인별 작업일보 & 초/중/종물 3회 이상 분할 기록 지원]
  // 현재 선택된 작업자(worker) + 날짜(date) + 공정(activeSlotKey)으로 이미 저장된 일보가 있는지 조회
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

      // 공정별 세부 슬롯 매칭
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

    // 1순위: 현재 작업자가 오늘 해당 공정에서 이미 작성 중이거나 저장한 일보가 있으면 그 데이터를 로드 (초/중/종 연속 기록)
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
    // 2순위: 관리자가 지정한 슬롯 템플릿 (8단계 다단계 티어 폴백: 날짜 변경/재로그인 시에도 절대 리셋되지 않음)
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

  // ⚡ TPM 다국어 라벨 일괄 사전 계산 (6대 설비 × 7개 항목 42개 셀 반복 조회 및 GC 오버헤드 영구 제거)
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

  // 🚀 통합 초기화 Effect: editReport 및 모달 오픈 시 단일 패스로 일괄 처리하여 렌더링 폭포 현상 영구 제거
  useEffect(() => {
    if (!isOpen) return;

    const effectiveW = editReport?.worker || initialWorker || "박종미";
    const targetD = editReport?.date || getKSTDateString();
    const alreadyDone = isHanulTpmAlreadyDone(targetD, effectiveW);
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
      // 🌟 신규 일보 작성 진입 시 1단계 TPM 설비점검 표시 (이미 완료된 경우 바로 일보 작성 화면 유지)
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
      // Reset defects based on categories
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
    let genuine = 0;
    let bad = 0;
    let rework = 0;

    if (processId === "검사") {
      const cols = Object.values(inspProduction);
      genuine = cols.reduce((acc, c) => acc + (Number(c.genuine) || 0), 0);
      const scrap = cols.reduce((acc, c) => acc + (Number(c.scrap) || 0), 0);
      rework = cols.reduce((acc, c) => {
        if (inspectionType.includes("FINAL")) {
          return acc + (Number(c.reworkDv) || 0) + (Number(c.reworkAngle) || 0);
        }
        return acc + (Number(c.rework) || 0);
      }, 0);
      const inspTotal = cols.reduce((acc, c) => acc + (Number(c.insp) || 0), 0);
      const defectSum = Object.values(defects).reduce((acc, v) => acc + (Number(v) || 0), 0);
      const finalBad = Math.max(scrap, defectSum);
      const gross = inspTotal > 0 ? inspTotal : (genuine + finalBad);
      const yieldRate = gross > 0 ? ((genuine / gross) * 100).toFixed(1) : "100.0";
      const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

      return { genuine, bad: finalBad, rework, gross, yieldRate, defectRate, defectSum, scrap };
    }

    const lhGenuine = (Number(production.genuineLH) || 0) + (Number(production.genuineRH) || 0);
    const lhBad = (Number(production.badLH) || 0) + (Number(production.badRH) || 0);
    const lhRework = (Number(production.reworkLH) || 0) + (Number(production.reworkRH) || 0);

    const cuttingGenuine = cuttingPart === "RR"
      ? (Number(production.genuineA) || 0) + (Number(production.genuineB) || 0)
      : (Number(production.genuineA) || 0) + (Number(production.genuineB) || 0) + (Number(production.genuineC) || 0);
    const cuttingBad = cuttingPart === "RR"
      ? (Number(production.badA) || 0) + (Number(production.badB) || 0)
      : (Number(production.badA) || 0) + (Number(production.badB) || 0) + (Number(production.badC) || 0);

    const abcGenuine = (Number(production.genuineA) || 0) + (Number(production.genuineB) || 0) + (Number(production.genuineC) || 0);
    const abcBad = (Number(production.badA) || 0) + (Number(production.badB) || 0) + (Number(production.badC) || 0);

    if (processId === "소재준비" && subProcess === "정치절단") {
      genuine = cuttingGenuine;
      bad = cuttingBad;
    } else {
      // In other processes (단컷팅, 조인트, 본드로봇), prefer LH/RH
      if (lhGenuine > 0 || lhBad > 0 || abcGenuine === 0) {
        genuine = lhGenuine;
        bad = lhBad;
        rework = lhRework;
      } else {
        genuine = abcGenuine;
        bad = abcBad;
      }
    }

    // Defect sums from breakdown
    const defectSum = Object.values(defects).reduce((acc, v) => acc + (Number(v) || 0), 0);
    const finalBad = Math.max(bad, defectSum);
    const gross = genuine + finalBad;
    const yieldRate = gross > 0 ? ((genuine / gross) * 100).toFixed(1) : "100.0";
    const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

    return { genuine, bad: finalBad, rework, gross, yieldRate, defectRate, defectSum };
  }, [production, defects, processId, subProcess, project, inspProduction, inspectionType]);

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
    if (isBladeTestMode) return 52450; // 테스트 모드: 5만개 초과 즉시 재현
    const grossTotal = past9BQCGross + currentGross;
    const resetOffset = Number(bladeResetInfo?.resetGross) || 0;
    return Math.max(0, grossTotal - resetOffset);
  }, [past9BQCGross, currentGross, bladeResetInfo, isBladeTestMode]);

  const BLADE_LIMIT = 50000;
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

  // 🌟 TPM 점검 이벤트 핸들러 및 요약 통계 (useCallback 적용으로 리렌더링 시 함수 재생성 방지)
  const handleToggleTpmCheck = React.useCallback((machineId, itemNo) => {
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

  const handleSetAllTpmOk = React.useCallback(() => {
    setTpmChecks(createDefaultHanulTpmChecks());
  }, []);

  const handleSetMachineAllOk = React.useCallback((machineId) => {
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
    if (inspectionType === "SQUARE") {
      return [
        { key: "col1", title: "LH 2호기", sub: "RR LH" },
        { key: "col2", title: "LH 3호기", sub: "RR LH" },
        { key: "col3", title: "RH 2호기", sub: "RR RH" },
        { key: "col4", title: "RH 3호기", sub: "RR RH" }
      ];
    }
    if (inspectionType === "FINAL_LH") {
      return [
        { key: "col1", title: "LH 1호기 (PRI)", sub: "RR LH" },
        { key: "col2", title: "LH 1호기 (TIN)", sub: "RR LH" },
        { key: "col3", title: "LH 2호기 (PRI)", sub: "RR LH" },
        { key: "col4", title: "LH 2호기 (TIN)", sub: "RR LH" }
      ];
    }
    // LENGTH and FINAL_PAIR
    return [
      { key: "col1", title: "RR LH (PRI)", sub: "PRIVACY" },
      { key: "col2", title: "RR LH (TIN)", sub: "TINTED" },
      { key: "col3", title: "RR RH (PRI)", sub: "PRIVACY" },
      { key: "col4", title: "RR RH (TIN)", sub: "TINTED" }
    ];
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

  // 🌟 관리자 지정 5대 공정 양식에서 작업자가 기록·저장할 때 호출되는 핸들러
  // 같은 날짜/공정이라도 작업자(worker)별로 개별 문서를 유지하며, 초/중/종물 작성 시 기존 일보에 이어서 덮어쓰기 저장
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

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex justify-center items-start p-0 sm:p-4 overflow-y-auto overflow-x-auto mobile-pan-free animate-fadeIn"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[94dvh] rounded-none sm:rounded-3xl border-0 sm:border-2 border-indigo-500/60 shadow-2xl flex flex-col m-0 sm:mt-3 sm:mb-6 sm:mx-auto text-left mobile-pan-free"
      >
        <HanulReportHeaderNav
          processId={processId}
          setProcessId={setProcessId}
          project={project}
          setProject={setProject}
          subProcess={subProcess}
          setSubProcess={setSubProcess}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isHanulTpmDone={isHanulTpmDone}
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
          workerLangInfo={workerLangInfo}
          onClose={onClose}
          handleExcelExport={handleExcelExport}
          templateAssignments={templateAssignments}
          activeAssignedTemplate={activeAssignedTemplate}
          forceLegacyMode={forceLegacyMode}
          setForceLegacyMode={setForceLegacyMode}
          jointType={jointType}
          setJointType={setJointType}
          inspectionType={inspectionType}
          setInspectionType={setInspectionType}
          handleSetAllTpmOk={handleSetAllTpmOk}
        />

        {/* 🌟 3. Scrollable Form Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar p-2.5 sm:p-5 space-y-3 sm:space-y-4 mobile-pan-free">
          {processId === "소재준비" && currentStep === "tpm" ? (
            <HanulReportTpmPanel
              currentLang={currentLang}
              tpmI18n={tpmI18n}
              date={date}
              customWorker={customWorker}
              worker={worker}
              tpmChecks={tpmChecks}
              tpmSummary={tpmSummary}
              tpmActionNote={tpmActionNote}
              setTpmActionNote={setTpmActionNote}
              handleSetMachineAllOk={handleSetMachineAllOk}
              handleToggleTpmCheck={handleToggleTpmCheck}
              handleSetAllTpmOk={handleSetAllTpmOk}
              handleProceedToReport={handleProceedToReport}
            />
          ) : isAssignedTemplateMode ? (
            <div className="space-y-4 animate-fadeIn">
              <HanulReportAssignedWorkerBanner
                currentLang={currentLang}
                effectiveWorkerName={effectiveWorkerName}
                date={date}
                setDate={setDate}
                shift={shift}
                activeAssignedTemplate={activeAssignedTemplate}
                existingWorkerReport={existingWorkerReport}
                processId={processId}
                setCurrentStep={setCurrentStep}
                tpmI18n={tpmI18n}
                worker={worker}
                setWorker={setWorker}
                setCustomWorker={setCustomWorker}
              />

              <LegoWorkReportBuilder
                key={`${activeSlotKey}_${existingWorkerReport?.id || activeAssignedTemplate?.id || project}_${effectiveWorkerName}_${date}`}
                isEmbedded={true}
                isWorkerRecordingMode={true}
                initialTemplateData={activeAssignedTemplate}
                initialWorkerName={effectiveWorkerName}
                initialWorkDate={date}
                currentLang={currentLang}
                onSaveWorkReport={handleSaveLegoAssignedReport}
                onDeleteWorkReport={(existingWorkerReport?.id || editReport?.id || activeAssignedTemplate?.isExistingDraft) ? handleDeleteLegoAssignedReport : null}
              />
            </div>
          ) : (
            <>
              <HanulReportSubNav
                processId={processId}
                subProcess={subProcess}
                setSubProcess={setSubProcess}
                jointType={jointType}
                setJointType={setJointType}
                inspectionType={inspectionType}
                setInspectionType={setInspectionType}
                currentLang={currentLang}
              />

              <HanulReportBasicInfo
                currentProcessObj={currentProcessObj}
                date={date}
                setDate={setDate}
                shift={shift}
                setShift={setShift}
                worker={worker}
                setWorker={setWorker}
                customWorker={customWorker}
                setCustomWorker={setCustomWorker}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                totals={totals}
                processId={processId}
                subProcess={subProcess}
                jointType={jointType}
                inspectionType={inspectionType}
                inspColumns={inspColumns}
                inspProduction={inspProduction}
                updateInspProd={updateInspProd}
                cuttingPart={cuttingPart}
                setCuttingPart={setCuttingPart}
                production={production}
                setProduction={setProduction}
              />

              <HanulReportLotSpec
                currentSpecs={currentSpecs}
                lotEntries={lotEntries}
                handleAddLot={handleAddLot}
                handleUpdateLotField={handleUpdateLotField}
                handleRemoveLot={handleRemoveLot}
                handleUpdateLotMeasurement={handleUpdateLotMeasurement}
                processId={processId}
              />

              <HanulReportJointCondition
                processId={processId}
                project={project}
                jointType={jointType}
                jointGradeName={jointGradeName}
                conditions={conditions}
                setConditions={setConditions}
                cleaningTimes={cleaningTimes}
              />

              <HanulReportDefectMatrix
                processId={processId}
                totals={totals}
                currentDefectKeys={currentDefectKeys}
                defects={defects}
                handleDefectChange={handleDefectChange}
                handleDefectInput={handleDefectInput}
              />

              {/* ⏱️ 비가동 및 부적합품 발생내역 (한울·부림텍 전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
              <CommonDowntimeDefectPanel
                title="비가동 및 부적합품 발생내역"
                plantLabel={companyMode === "BURIM" ? "부림텍" : "한울 · 부림텍"}
                unitLabel="부적합량(EA)"
                currentLang={currentLang}
                events={downtimeEvents}
                onChangeEvents={setDowntimeEvents}
                onSyncSummary={({ summaryText }) => {
                  if (summaryText) setMachineTrouble(summaryText);
                }}
              />

              <HanulReportBladeMaintenance
                project={project}
                processId={processId}
                subProcess={subProcess}
                isBladeOverdue={isBladeOverdue}
                totalCumulativeQty={totalCumulativeQty}
                BLADE_LIMIT={BLADE_LIMIT}
                bladeLifePercent={bladeLifePercent}
                isBladeTestMode={isBladeTestMode}
                setIsBladeTestMode={setIsBladeTestMode}
                bladeChangeTime={bladeChangeTime}
                setBladeChangeTime={setBladeChangeTime}
                handleRecordBladeChangeNow={handleRecordBladeChangeNow}
                bladeResetInfo={bladeResetInfo}
                handleClearBladeReset={handleClearBladeReset}
                machineTrouble={machineTrouble}
                setMachineTrouble={setMachineTrouble}
                notes={notes}
                setNotes={setNotes}
              />
            </>
          )}
        </div>

        <HanulReportFooter
          isAssignedTemplateMode={isAssignedTemplateMode}
          processId={processId}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          toastMessage={toastMessage}
          tpmSummary={tpmSummary}
          tpmI18n={tpmI18n}
          onClose={onClose}
          handleProceedToReport={handleProceedToReport}
          handleSave={handleSave}
          isSaving={isSaving}
          currentLang={currentLang}
        />
      </div>
    </div>
  );
};

export default HanulWorkReportModal;
