import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Layers,
  Sparkles,
  Trash2,
  TrendingUp,
  Cpu,
  Calendar,
  Sun,
  Moon,
  Zap,
  Activity,
  Plus,
  Minus,
  Check,
  FileSpreadsheet,
  Package,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Printer,
  FileText,
  Thermometer,
  Gauge,
  Scissors,
  Wrench,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES,
  HANUL_INSPECTION_DEFECT_GROUPS,
  HANUL_WORKERS_MASTER,
  HANUL_SPECS,
  DEFAULT_DEFECT_CATEGORIES,
  HANUL_TPM_MACHINES,
  HANUL_TPM_CHECK_ITEMS,
  createDefaultHanulTpmChecks,
  saveHanulWorkReport,
  exportHanulReportToExcel,
  isExcludedFromWorkReport,
  getLocalHanulWorkReports,
  subscribeHanulWorkReports
} from "../services/hanulWorkReportService";
import { getKSTDateString } from "../utils/dateUtils";
import { useModalHistory } from "../utils/modalHistory";

// 치수 공차 실시간 판정 헬퍼 (초·중·종물 규격 내 여부)
const isDimOk = (val, target, tol) => {
  if (val === undefined || val === null || val === "") return true;
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  return num >= (target - tol) && num <= (target + tol);
};

export const HanulWorkReportModal = ({
  isOpen,
  onClose,
  initialProject = "9BQC",
  initialProcess = "소재준비",
  initialWorker = "",
  editReport = null
}) => {
  const [project, setProject] = useState(initialProject);
  const [processId, setProcessId] = useState(initialProcess);
  const [subProcess, setSubProcess] = useState("정치절단"); // For "소재준비": "정치절단" | "단컷팅"
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
  const [machineTrouble, setMachineTrouble] = useState(""); // 설비 이상 조치사항
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
    return HANUL_SPECS[key] || HANUL_SPECS[`${project}_${processId}`] || [];
  }, [project, processId, subProcess, jointType, inspectionType]);

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

  const [currentStep, setCurrentStep] = useState("report");
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultHanulTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");
  const [isHanulTpmDone, setIsHanulTpmDone] = useState(false);

  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setAllReports(list || []);
    });
    return () => unsub();
  }, []);

  // Sync when editReport provided or opened
  useEffect(() => {
    if (isOpen) {
      const effectiveW = editReport?.worker || initialWorker || "박종미";
      const targetD = editReport?.date || getKSTDateString();
      const alreadyDone = isHanulTpmAlreadyDone(targetD, effectiveW);
      setIsHanulTpmDone(alreadyDone);

      if (editReport) {
        setCurrentStep("report");
        if (editReport.tpmChecks) setTpmChecks(editReport.tpmChecks);
        else setTpmChecks(createDefaultHanulTpmChecks());
        setTpmActionNote(editReport.tpmActionNote || "");
      } else {
        const isSojae = (initialProcess || processId) === "소재준비";
        if (isSojae && !alreadyDone) {
          setCurrentStep("tpm");
        } else {
          setCurrentStep("report");
        }
        setTpmChecks(createDefaultHanulTpmChecks());
        setTpmActionNote("");
      }
    }
  }, [isOpen, editReport, initialProcess, initialWorker]);

  // Sync when editReport provided or opened
  useEffect(() => {
    if (editReport) {
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
      if (editReport.conditions) setConditions(editReport.conditions);
      if (editReport.cleaningTimes) setCleaningTimes(editReport.cleaningTimes);
      if (editReport.notes) setNotes(editReport.notes);
      setTimeout(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      }, 50);
    } else if (isOpen) {
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
      setTimeout(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      }, 50);
    }
  }, [editReport, isOpen, initialProject, initialProcess, initialWorker]);

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

  // 🌟 TPM 점검 이벤트 핸들러 및 요약 통계
  const handleToggleTpmCheck = (machineId, itemNo) => {
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
  };

  const handleSetAllTpmOk = () => {
    setTpmChecks(createDefaultHanulTpmChecks());
  };

  const handleSetMachineAllOk = (machineId) => {
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
  };

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
        machineNo,
        materialLot,
        jointLot,
        clipLot,
        dollyNo,
        extTimeRange,
        bladeChangeTime: (processId === "소재준비" && subProcess === "정치절단") ? bladeChangeTime : "",
        machineTrouble,
        production,
        totals,
        defects,
        measurements,
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

  const handleExcelExport = () => {
    const effectiveWorker = customWorker.trim() || worker;
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
      measurements,
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex justify-center items-start p-0 sm:p-4 overflow-y-auto overflow-x-auto mobile-pan-free animate-fadeIn"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[94dvh] rounded-none sm:rounded-3xl border-0 sm:border-2 border-indigo-500/60 shadow-2xl flex flex-col m-0 sm:mt-3 sm:mb-6 sm:mx-auto text-left mobile-pan-free"
      >
        {/* ========================================================================= */}
        {/* 🌟 1. Modal Header & Project Switcher */}
        {/* ========================================================================= */}
        <div className="p-2.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shrink-0">
                <FileSpreadsheet className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-sm sm:text-xl tracking-tight truncate">
                    한울 외주가공 작업일보
                  </h3>
                  {processId === "소재준비" ? (
                    <span className={`text-[9px] sm:text-xs px-2 py-0.5 rounded-full font-bold border ${
                      isHanulTpmDone
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    }`}>
                      {isHanulTpmDone ? "✓ TPM 점검완료" : "TPM 점검필요"}
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40">
                      실시간 동기화
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-indigo-200 truncate mt-0.5 hidden sm:block">
                  {processId === "소재준비"
                    ? (currentStep === "tpm"
                        ? "1단계: 9BQC 소재준비 설비일상 점검 시트 (TPM 7대 항목 점검)"
                        : "2단계: 9BQC 소재준비 일일 작업일보 작성 (정치절단 / 단컷팅)")
                    : "9BQC G/RUN 및 LQ2a Hood Side 4대 핵심 공정 (소재준비 • 조인트 • 본드로봇 • 검사)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExcelExport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="엑셀 다운로드"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>엑셀 다운</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="닫기 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project Switcher Bar */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3.5 pt-2 sm:pt-3 border-t border-indigo-900/60">
            {HANUL_PROJECTS.map((p) => {
              const isActive = project === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProject(p.id)}
                  className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/90 border-indigo-300 text-white shadow-md shadow-indigo-950/50 scale-[1.01]"
                      : "bg-white/5 border-slate-700/80 text-slate-300 hover:bg-white/10 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-base sm:text-lg">{p.id === "9BQC" ? "🚗" : "⚡"}</span>
                    <div className="text-left min-w-0">
                      <span className="font-black text-xs sm:text-sm block truncate leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-indigo-200 hidden sm:block truncate">
                        {p.carModel} • {p.partName}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 🌟 2. Process Tabs (공정 선택 탭) + 소재준비 세부일보 드롭다운 */}
        {/* ========================================================================= */}
        <div className="px-2.5 sm:px-5 py-1.5 sm:py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-max">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">공정선택:</span>
              </span>
              {(HANUL_PROCESSES[project] || []).map((proc, idx) => {
                const isSelected = processId === proc.id;
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => setProcessId(proc.id)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs scale-102"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="opacity-70 text-[9px] sm:text-[10px]">{idx + 1}.</span>
                    <span>{proc.id}</span>
                  </button>
                );
              })}
            </div>

            {/* 🌟 소재준비 공정일 때 드롭다운 선택기 (정치절단 / 단컷팅) */}
            {processId === "소재준비" && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-indigo-50 dark:bg-indigo-950/90 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl border-2 border-indigo-500 shadow-xs animate-fadeIn">
                <span className="text-[10.5px] sm:text-[11px] font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline">📄 일보:</span>
                </span>
                <div className="relative">
                  <select
                    value={subProcess}
                    onChange={(e) => setSubProcess(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-950 dark:text-indigo-100 font-black text-[11px] sm:text-xs rounded-lg pl-2 sm:pl-3 pr-6 sm:pr-7 py-0.5 sm:py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  >
                    <option value="정치절단">✂️ 정치절단 일보</option>
                    <option value="단컷팅">📐 단컷팅 일보</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* 🌟 조인트 공정일 때 드롭다운 선택기 (4가지 조인트 일보) */}
            {processId === "조인트" && (
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/90 px-3 py-1 rounded-xl border-2 border-purple-500 shadow-xs animate-fadeIn">
                <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 flex items-center gap-1 shrink-0">
                  <span>📄 조인트 일보:</span>
                </span>
                <div className="relative">
                  <select
                    value={jointType}
                    onChange={(e) => setJointType(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border-2 border-purple-600 text-purple-950 dark:text-purple-100 font-black text-xs rounded-lg pl-3 pr-7 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  >
                    <option value="FRT">1. G/RUN FRT (2/3호기)</option>
                    <option value="FIXED_LH">2. G/RUN FIXED LH (부자재)</option>
                    <option value="FIXED_RH">3. G/RUN FIXED RH (부자재)</option>
                    <option value="RR">4. G/RUN RR (2/3호기)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
            {/* 🌟 검사 공정일 때 드롭다운 선택기 (4가지 검사 일보) */}
            {processId === "검사" && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/90 px-3 py-1 rounded-xl border-2 border-emerald-500 shadow-xs animate-fadeIn">
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                  <span>📄 검사 일보:</span>
                </span>
                <div className="relative">
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-black text-xs rounded-lg pl-3 pr-7 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="LENGTH">1. 길이검사 일보</option>
                    <option value="SQUARE">2. 직각검사 일보</option>
                    <option value="FINAL_PAIR">3. 최종검사 일보 (LH / RH)</option>
                    <option value="FINAL_LH">4. 최종검사 일보 (LH 전용)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 2-1. 소재준비 공정일 때: TPM 점검 ➔ 작업일보 2단계 진행 탭 바 (압출과 동일) */}
        {/* ========================================================================= */}
        {processId === "소재준비" && (
          <div className="bg-slate-100 dark:bg-slate-800/90 px-3 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === "tpm"
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1단계: 설비일상 점검 시트 (TPM)</span>
                {isHanulTpmDone ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setCurrentStep("report")}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === "report"
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2단계: 작업일보 작성 ({subProcess})</span>
              </button>
            </div>

            {currentStep === "tpm" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllTpmOk}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>⚡ 6대 설비 전체 양호(○) 일괄 체크</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("tpm")}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>TPM 점검표 다시보기</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 3. Scrollable Form Body */}
        {/* ========================================================================= */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar p-2.5 sm:p-5 space-y-3 sm:space-y-4 mobile-pan-free">
          {/* ========================================================================= */}
          {/* 🌟 STEP 1: 설비일상 점검 시트 (TPM 자주보전 7대 항목 × 6대 설비 점검) */}
          {/* ========================================================================= */}
          {processId === "소재준비" && currentStep === "tpm" ? (
            <div className="space-y-4 animate-fadeIn">
              {/* 서식 메인 헤더 박스: (주)오룩 설비일상 점검 시트 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-900/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black tracking-wider">
                          ㈜오룩 삼랑진공장
                        </span>
                        <h3 className="text-base sm:text-xl font-black tracking-tight">
                          설비일상 점검 시트 (TPM)
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40">
                          개정일자: 2024.10.01
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200 mt-0.5">
                        9BQC 소재준비 라인 6대 절단/단컷팅 설비 7대 일상점검 (작업 전 필수 점검)
                      </p>
                    </div>
                  </div>

                  {/* 결재 정보 블록 (서식 우측 상단 박스 100% 재현) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white/10 p-2 rounded-xl text-center text-xs border border-white/15 shrink-0">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-indigo-300 block">라인명</span>
                      <strong className="text-xs text-white">9BQC 소재준비</strong>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-indigo-300 block">점검일자</span>
                      <strong className="text-xs text-white">{date}</strong>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-indigo-300 block">점검자(작업자)</span>
                      <strong className="text-xs text-emerald-300 truncate block">{customWorker.trim() || worker}</strong>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-indigo-300 block">관리자 확인</span>
                      <strong className="text-xs text-indigo-200">확인 대기</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6대 설비 현황 카드 바 (사진 안내 및 원클릭 설비별 일괄체크) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {HANUL_TPM_MACHINES.map((m) => {
                  const mChecks = tpmChecks[m.id] || {};
                  const isAllOk = HANUL_TPM_CHECK_ITEMS.every((it) => (mChecks[it.no] || "OK") === "OK");
                  const ngCount = HANUL_TPM_CHECK_ITEMS.filter((it) => mChecks[it.no] === "NG").length;

                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        !isAllOk
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-base">{m.icon}</span>
                        {isAllOk ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            7개 양호
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            이상 {ngCount}건
                          </span>
                        )}
                      </div>
                      <div className="font-black text-xs text-slate-900 dark:text-white truncate mb-2">
                        {m.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSetMachineAllOk(m.id)}
                        className="w-full py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95"
                      >
                        ✓ 설비 양호
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 🌟 설비일상 점검 시트 본문 테이블 (서식 매트릭스 100% 일치) */}
              <div className="rounded-2xl border-2 border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto mobile-pan-free">
                  <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700">
                        <th className="py-2.5 px-2 text-center w-12 font-black border-r border-slate-200 dark:border-slate-700">
                          순번
                        </th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200 dark:border-slate-700 min-w-[190px]">
                          설비별 점검 내용
                        </th>
                        <th className="py-2.5 px-2 text-center w-16 font-black border-r border-slate-200 dark:border-slate-700">
                          방법
                        </th>
                        {HANUL_TPM_MACHINES.map((m) => (
                          <th
                            key={m.id}
                            className="py-2.5 px-1.5 text-center font-black text-[11px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[85px]"
                          >
                            <span className="block leading-tight">{m.shortName}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {HANUL_TPM_CHECK_ITEMS.map((item) => (
                        <tr
                          key={item.no}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="py-2 px-2 text-center font-black text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                            {item.no}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                            <div className="font-black text-slate-900 dark:text-white text-xs">
                              {item.content}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.method}
                            </span>
                          </td>
                          {HANUL_TPM_MACHINES.map((m) => {
                            const isOk = (tpmChecks[m.id]?.[item.no] || "OK") === "OK";
                            return (
                              <td
                                key={m.id}
                                className="py-1 px-1.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleTpmCheck(m.id, item.no)}
                                  className={`w-full py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1 ${
                                    isOk
                                      ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                                      : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse border border-rose-500 shadow-md"
                                  }`}
                                  title={`${m.name} - ${item.content} (탭하여 양호/이상 전환)`}
                                >
                                  <span>{isOk ? "○" : "×"}</span>
                                  <span className="text-[10.5px]">{isOk ? "양호" : "이상"}</span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 이상 발생시 조치사항 입력란 & 하단 보고 절차 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      이상 발생시 조치사항 (Abnormality Action Note)
                    </span>
                  </div>
                  {tpmSummary.ngCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      🚨 이상 {tpmSummary.ngCount}건 발생 - 조치 보고 필수
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      ✓ 현재 6대 설비 전 항목 양호 상태
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={tpmActionNote}
                  onChange={(e) => setTpmActionNote(e.target.value)}
                  placeholder="설비 이상(작동 불량, 칼날 마모, 비상버튼 미작동, 컷팅면 불량 등) 발생 시 발견 내용 및 조치결과를 기록해 주십시오."
                  className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {/* ※ 이상 발생시 조치 절차 (서식 하단 절차 100% 재현) */}
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80">
                  <div className="text-[11px] font-black text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                    <span>※ 이상 발생시 조치 절차</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black border border-amber-500 shadow-2xs">
                      <div>1. 작업자</div>
                      <div className="text-[10px] font-medium text-amber-950">이상발생 내용보고</div>
                    </div>
                    <div className="p-2 rounded-xl bg-yellow-300 text-slate-950 font-black border border-yellow-400 shadow-2xs">
                      <div>2. 대리</div>
                      <div className="text-[10px] font-medium text-yellow-950">내용 확인 및 보고</div>
                    </div>
                    <div className="p-2 rounded-xl bg-lime-300 text-slate-950 font-black border border-lime-400 shadow-2xs">
                      <div>3. 과장</div>
                      <div className="text-[10px] font-medium text-lime-950">기계수리의뢰 조치보고</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500 text-white font-black border border-amber-600 shadow-2xs">
                      <div>4. 부서장 확인</div>
                      <div className="text-[10px] font-medium text-amber-100">최종 조치 확인</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 점검 완료 & 다음 단계(작업일보 작성) 진행 버튼 바 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      점검 결과: 양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (총 42개 검사)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      TPM 설비일상점검 완료 후 [작업일보 작성 진행] 버튼을 눌러 일보를 작성하십시오.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSetAllTpmOk}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>전체 양호(○)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToReport}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>TPM 점검 완료 ➔ 작업일보 작성 진행</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* 🌟 소재준비 공정일 때: 정치절단 / 단컷팅 일보 상단 안내 배너 & 원클릭 전환 탭 (모바일에서는 간소화) */}
          {processId === "소재준비" && (
            <div className="hidden sm:flex p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/50 dark:via-blue-950/40 dark:to-indigo-950/50 border-2 border-indigo-400 dark:border-indigo-700 shadow-sm flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shrink-0">
                  {subProcess === "정치절단" ? <Scissors className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm sm:text-base text-indigo-950 dark:text-white">
                      소재 준비 작업 일보 (G/RUN) — {subProcess === "정치절단" ? "✂️ 정치 절단 일보" : "📐 단컷팅 일보"}
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                      적용 중
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {subProcess === "정치절단"
                      ? "정치절단 치수 규격 (FRT A/B/C, RR A/B) • 압출/공정간 불량 집계 • 칼날교체시간"
                      : "단컷팅 치수 규격 (FRT LH/RH 83mm, RR LH 68mm, RR RH 67mm) • 단컷팅 불량 집계"}
                  </p>
                </div>
              </div>

              {/* Segmented Quick Toggle Buttons */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSubProcess("정치절단")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    subProcess === "정치절단"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>정치절단 일보</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubProcess("단컷팅")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    subProcess === "단컷팅"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>단컷팅 일보</span>
                </button>
              </div>
            </div>
          )}

          {/* 🌟 조인트 공정일 때: 4가지 조인트 일보 상단 안내 배너 & 4대 퀵 전환 탭 */}
          {processId === "조인트" && (
            <div className="hidden sm:flex p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/50 dark:via-indigo-950/40 dark:to-purple-950/50 border-2 border-purple-400 dark:border-purple-700 shadow-sm flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm sm:text-base text-purple-950 dark:text-white">
                      조인트 일보 (G/RUN) — {
                        jointType === "FRT" ? "🚗 1. FRT (2호기 / 3호기)" :
                        jointType === "FIXED_LH" ? "📐 2. FIXED LH (Glass/DV/Bracket)" :
                        jointType === "FIXED_RH" ? "📐 3. FIXED RH (Glass/DV/Bracket)" :
                        "⚡ 4. RR (2호기 / 3호기)"
                      }
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                      4대 조인트 서식
                    </span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                    {jointType === "FRT" && "FRT LH/RH • 압출소재 FRT A/B/C • 직각/둔각 사출조건 • 10개 불량항목"}
                    {jointType === "FIXED_LH" && "FIXED LH • 압출소재 RR A/B • 부자재(Glass, D/V, BRACKET) • 13개 불량항목"}
                    {jointType === "FIXED_RH" && "FIXED RH • 압출소재 RR A/B • 부자재(Glass, D/V, BRACKET) • 13개 불량항목"}
                    {jointType === "RR" && "RR LH/RH • 압출소재 RR A/B • 2/3호기 사출조건 • 꼬임 포함 11개 불량항목"}
                  </p>
                </div>
              </div>

              {/* 4 Segmented Quick Toggle Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-purple-200 dark:border-purple-800 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setJointType("FRT")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    jointType === "FRT"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
                  }`}
                >
                  1. FRT
                </button>
                <button
                  type="button"
                  onClick={() => setJointType("FIXED_LH")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    jointType === "FIXED_LH"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
                  }`}
                >
                  2. FIXED LH
                </button>
                <button
                  type="button"
                  onClick={() => setJointType("FIXED_RH")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    jointType === "FIXED_RH"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
                  }`}
                >
                  3. FIXED RH
                </button>
                <button
                  type="button"
                  onClick={() => setJointType("RR")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    jointType === "RR"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
                  }`}
                >
                  4. RR
                </button>
              </div>
            </div>
          )}

          {/* 🌟 검사 공정일 때: 4가지 검사 일보 상단 안내 배너 & 4대 퀵 전환 탭 */}
          {processId === "검사" && (
            <div className="hidden sm:flex p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 shadow-sm flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm sm:text-base text-emerald-950 dark:text-white">
                      검사 일보 (G/RUN RR) — {
                        inspectionType === "LENGTH" ? "📏 1. 길이검사 일보 (부자재 패드 5T)" :
                        inspectionType === "SQUARE" ? "📐 2. 직각검사 일보 (4대 설비호기)" :
                        inspectionType === "FINAL_PAIR" ? "🏁 3. 최종검사 일보 (LH / RH)" :
                        "🏁 4. 최종검사 일보 (LH 1호기 / 2호기)"
                      }
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                      4대 검사 서식
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {inspectionType === "LENGTH" && "기록시간(09:00/13:30/17:00) • 부자재 패드 5T • RR LH/RH (PRI, TIN) • 압출/조인트/후가공 3대 불량 집계"}
                    {inspectionType === "SQUARE" && "기록시간(09:00/13:30/17:00) • LH 2/3호기, RH 2/3호기 • 중요 치수 A/B (482/658mm) • 3대 불량 집계"}
                    {inspectionType === "FINAL_PAIR" && "기록시간(초/중/종) • RR LH/RH (PRI, TIN) • D/V 부자재 LOT • 리워크(DV, 직/둔각) • 중요치수 및 패드 5T/7T"}
                    {inspectionType === "FINAL_LH" && "기록시간(초/중/종) • RR LH 1호기/2호기 (PRI, TIN) • D/V 부자재 LOT • 리워크(DV, 직/둔각) • 패드 5T/7T"}
                  </p>
                </div>
              </div>

              {/* 4 Segmented Quick Toggle Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setInspectionType("LENGTH")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    inspectionType === "LENGTH"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                  }`}
                >
                  1. 길이검사
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType("SQUARE")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    inspectionType === "SQUARE"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                  }`}
                >
                  2. 직각검사
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType("FINAL_PAIR")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    inspectionType === "FINAL_PAIR"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                  }`}
                >
                  3. 최종 (LH/RH)
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType("FINAL_LH")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    inspectionType === "FINAL_LH"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                  }`}
                >
                  4. 최종 (LH 전용)
                </button>
              </div>
            </div>
          )}
          {/* A. 기본 정보 (일자, 주야, 작업자, 시간, 설비호기) */}
          <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. 작업 기본 정보</span>
              </span>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {currentProcessObj.subTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 일자 */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  작업일자
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 주/야 근무 */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  근무구분
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setShift("주간")}
                    className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      shift === "주간"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>주간</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift("야간")}
                    className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      shift === "야간"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>야간</span>
                  </button>
                </div>
              </div>

              {/* 작업자 (26명 드롭다운 + 직접입력) */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  작업자 (총 26명 마스터)
                </label>
                <select
                  value={worker}
                  onChange={(e) => {
                    setWorker(e.target.value);
                    if (e.target.value !== "직접입력") setCustomWorker("");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <optgroup label="9BQC 전담 작업자">
                    {HANUL_WORKERS_MASTER.filter((w) => w.line !== "LQ2").map((w) => (
                      <option key={w.no} value={w.name}>
                        {w.name} ({w.position})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="LQ2 전담 작업자">
                    {HANUL_WORKERS_MASTER.filter((w) => w.line === "LQ2").map((w) => (
                      <option key={w.no} value={w.name}>
                        {w.name} ({w.position})
                      </option>
                    ))}
                  </optgroup>
                  <option value="직접입력">✏️ 직접 입력</option>
                </select>
                {worker === "직접입력" && (
                  <input
                    type="text"
                    placeholder="작업자 이름 입력"
                    value={customWorker}
                    onChange={(e) => setCustomWorker(e.target.value)}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-indigo-400 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
                  />
                )}
              </div>

              {/* 작업시간 */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  작업시간 (시작 ~ 종료)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="06:30"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400 text-xs">~</span>
                  <input
                    type="text"
                    placeholder="17:30"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 🌟 9BQC 정치절단: 1번 설비호기, 칼날교체시간, 대차번호 삭제 -> 절단 부품 구분만 깔끔하게 유지 */}
            {project === "9BQC" && processId === "소재준비" && subProcess === "정치절단" ? (
              <div className="pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
                      <Scissors className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      절단 부품 구분 선택
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      ({cuttingPart === "FRT" ? "FRT A / B / C 3단면" : "RR A / B 2단면"})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCuttingPart("FRT")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                        cuttingPart === "FRT"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <span>🚗 FRT (A/B/C)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCuttingPart("RR")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                        cuttingPart === "RR"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600 border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <span>⚡ RR (A/B)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LOT 번호 및 설비 호기 (타 공정용) */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    설비 호기 / 라인
                  </label>
                  <input
                    type="text"
                    placeholder={processId === "조인트" ? "예: 사출 2호기 / 3호기" : "예: 사출 2호기, X부 LH"}
                    value={machineNo}
                    onChange={(e) => setMachineNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {processId === "조인트"
                      ? (jointType === "FRT" ? "압출소재 LOT (FRT A/B/C)" : "압출소재 LOT (RR A/B)")
                      : "압출소재 LOT (초/중/종)"}
                  </label>
                  <input
                    type="text"
                    placeholder={processId === "조인트" ? (jointType === "FRT" ? "A:09.12 / B:09.12" : "RR A:09.12 / B:09.12") : "초:09.12 / 종:09.12"}
                    value={materialLot.start || ""}
                    onChange={(e) => setMaterialLot((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {processId === "조인트"
                      ? "조인트 재료명 (Grade)"
                      : "조인트/원재료 LOT"}
                  </label>
                  <input
                    type="text"
                    placeholder={processId === "조인트" ? "예: SJ-4004B, W60664$OS" : "W60664$OS 등"}
                    value={processId === "조인트" ? jointGradeName : jointLot}
                    onChange={(e) => {
                      if (processId === "조인트") {
                        setJointGradeName(e.target.value);
                      } else {
                        setJointLot(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {processId === "조인트"
                      ? "조인트 재료일자 (LOT)"
                      : "대차번호 / 클립 LOT"}
                  </label>
                  <input
                    type="text"
                    placeholder={processId === "조인트" ? "예: 24.09.12 (재료일자)" : "대차 3호 / 2T000 WH"}
                    value={processId === "조인트" ? jointGradeLot : (dollyNo || clipLot.start || "")}
                    onChange={(e) => {
                      if (processId === "조인트") {
                        setJointGradeLot(e.target.value);
                      } else {
                        setDollyNo(e.target.value);
                        setClipLot((prev) => ({ ...prev, start: e.target.value }));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* 🌟 조인트 FIXED LH / RH 전용: 4. 부자재 LOT 관리 (Glass / D/V / BRACKET 초·중·종물) */}
            {processId === "조인트" && (jointType === "FIXED_LH" || jointType === "FIXED_RH") && (
              <div className="mt-2.5 pt-2.5 border-t border-purple-200 dark:border-purple-800/80 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>부자재 LOT 관리 — Glass / D/V / BRACKET (초물 · 중물 · 종물)</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                    FIXED {jointType === "FIXED_LH" ? "LH" : "RH"} 일보 필수항목
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Glass */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-1">
                      <span>🪟</span> <span>1. Glass (글라스) LOT</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">초물</span>
                        <input
                          type="text"
                          placeholder="초물 LOT"
                          value={subMaterialsLot.glass?.start || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            glass: { ...(prev.glass || {}), start: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">중물</span>
                        <input
                          type="text"
                          placeholder="중물 LOT"
                          value={subMaterialsLot.glass?.mid || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            glass: { ...(prev.glass || {}), mid: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">종물</span>
                        <input
                          type="text"
                          placeholder="종물 LOT"
                          value={subMaterialsLot.glass?.end || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            glass: { ...(prev.glass || {}), end: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* D/V */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-1">
                      <span>⚙️</span> <span>2. D/V LOT</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">초물</span>
                        <input
                          type="text"
                          placeholder="초물 LOT"
                          value={subMaterialsLot.dv?.start || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            dv: { ...(prev.dv || {}), start: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">중물</span>
                        <input
                          type="text"
                          placeholder="중물 LOT"
                          value={subMaterialsLot.dv?.mid || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            dv: { ...(prev.dv || {}), mid: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">종물</span>
                        <input
                          type="text"
                          placeholder="종물 LOT"
                          value={subMaterialsLot.dv?.end || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            dv: { ...(prev.dv || {}), end: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BRACKET */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-1">
                      <span>🔩</span> <span>3. BRACKET (브라켓) LOT</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">초물</span>
                        <input
                          type="text"
                          placeholder="초물 LOT"
                          value={subMaterialsLot.bracket?.start || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            bracket: { ...(prev.bracket || {}), start: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">중물</span>
                        <input
                          type="text"
                          placeholder="중물 LOT"
                          value={subMaterialsLot.bracket?.mid || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            bracket: { ...(prev.bracket || {}), mid: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">종물</span>
                        <input
                          type="text"
                          placeholder="종물 LOT"
                          value={subMaterialsLot.bracket?.end || ""}
                          onChange={(e) => setSubMaterialsLot((prev) => ({
                            ...prev,
                            bracket: { ...(prev.bracket || {}), end: e.target.value }
                          }))}
                          className="w-full px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🌟 검사 공정 전용: 압출소재 LOT (RR A, RR B 초/중/종) 및 부자재 LOT (패드 5T / D/V) */}
            {processId === "검사" && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-200 dark:border-emerald-800/80 animate-fadeIn space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>검사 LOT 관리 — 압출소재(RR A/B) 및 부자재 (기록시간: 초 09:00 / 중 13:30 / 종 17:00)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    {inspectionType === "LENGTH" ? "부자재: 패드 5T" : inspectionType.includes("FINAL") ? "부자재: D/V" : "압출소재: RR A/B"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* 압출소재 RR A */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-emerald-900 dark:text-emerald-300">
                      🧱 압출소재 RR A (초/중/종)
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="초물"
                        value={rrExtLot.a?.start || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          a: { ...(prev.a || {}), start: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="중물"
                        value={rrExtLot.a?.mid || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          a: { ...(prev.a || {}), mid: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="종물"
                        value={rrExtLot.a?.end || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          a: { ...(prev.a || {}), end: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* 압출소재 RR B */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-emerald-900 dark:text-emerald-300">
                      🧱 압출소재 RR B (초/중/종)
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="초물"
                        value={rrExtLot.b?.start || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          b: { ...(prev.b || {}), start: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="중물"
                        value={rrExtLot.b?.mid || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          b: { ...(prev.b || {}), mid: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="종물"
                        value={rrExtLot.b?.end || ""}
                        onChange={(e) => setRrExtLot((prev) => ({
                          ...prev,
                          b: { ...(prev.b || {}), end: e.target.value }
                        }))}
                        className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* 부자재 LOT (패드 5T 또는 D/V) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
                    <span className="font-black text-[11px] text-emerald-900 dark:text-emerald-300">
                      {inspectionType === "LENGTH" ? "📦 부자재 LOT (패드 5T)" : inspectionType.includes("FINAL") ? "⚙️ 부자재 LOT (D/V)" : "📦 기타 부자재 LOT"}
                    </span>
                    {inspectionType.includes("FINAL") ? (
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          placeholder="초물 D/V"
                          value={dvInspLot.start || ""}
                          onChange={(e) => setDvInspLot((prev) => ({ ...prev, start: e.target.value }))}
                          className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="중물 D/V"
                          value={dvInspLot.mid || ""}
                          onChange={(e) => setDvInspLot((prev) => ({ ...prev, mid: e.target.value }))}
                          className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="종물 D/V"
                          value={dvInspLot.end || ""}
                          onChange={(e) => setDvInspLot((prev) => ({ ...prev, end: e.target.value }))}
                          className="px-1.5 py-1 text-center text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={inspectionType === "LENGTH" ? "예: 패드 5T LOT (24.09.12)" : "부자재 LOT 입력"}
                        value={padLot}
                        onChange={(e) => setPadLot(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-slate-800"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* B. 생산 수량 및 실시간 KPI (정품 / 불량 / 리워크 / 양품률) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800/80 pb-2">
              <span className="font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>2. 생산 수량 및 불량 집계</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black">
                  양품률: {totals.yieldRate}%
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-rose-600 text-white font-black">
                  불량률: {totals.defectRate}%
                </span>
              </div>
            </div>

            {/* 🌟 생산 수량 입력: 검사 (4대 일보 전용 4열 매트릭스) vs 정치절단 (A / B / C 단면) vs 단컷팅 및 기타 (LH / RH) */}
            {processId === "검사" ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {inspColumns.map((col) => {
                    const data = inspProduction[col.key] || { insp: 0, genuine: 0, rework: 0, reworkDv: 0, reworkAngle: 0, scrap: 0 };
                    const isFinal = inspectionType.includes("FINAL");
                    const colTotal = isFinal
                      ? (Number(data.genuine) || 0) + (Number(data.reworkDv) || 0) + (Number(data.reworkAngle) || 0) + (Number(data.scrap) || 0)
                      : (Number(data.genuine) || 0) + (Number(data.rework) || 0) + (Number(data.scrap) || 0);

                    return (
                      <div
                        key={col.key}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-950/60 pb-1.5">
                          <div>
                            <span className="font-black text-xs text-emerald-950 dark:text-emerald-200 block">
                              {col.title}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {col.sub}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">
                            실적계: {colTotal.toLocaleString()} EA
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                              검사수량 (EA)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.insp}
                              onChange={(e) => updateInspProd(col.key, "insp", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white text-center"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                              정품 (EA)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.genuine}
                              onChange={(e) => updateInspProd(col.key, "genuine", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                            />
                          </div>

                          {isFinal ? (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                                  리워크 D/V
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={data.reworkDv}
                                  onChange={(e) => updateInspProd(col.key, "reworkDv", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                                  리워크 직/둔각
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={data.reworkAngle}
                                  onChange={(e) => updateInspProd(col.key, "reworkAngle", e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-1">
                              <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                                리워크 (EA)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={data.rework}
                                onChange={(e) => updateInspProd(col.key, "rework", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                              />
                            </div>
                          )}

                          <div className={isFinal ? "col-span-2" : "col-span-1"}>
                            <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                              폐기불량 (EA)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.scrap}
                              onChange={(e) => updateInspProd(col.key, "scrap", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : processId === "소재준비" && subProcess === "정치절단" ? (
              <div className="space-y-3.5">
                {/* 🌟 1. 정치절단 부품 선택 (FRT vs RR) & 압출소재 투입 LOT 카드 */}
                <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 dark:border-indigo-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-2xs">
                        <Scissors className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <span>🏷️ 투입 압출소재 LOT NO.</span>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            ({cuttingPart === "FRT" ? "FRT A / B / C 3단면" : "RR A / B 2단면"})
                          </span>
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          📱 칸을 누르면 휴대폰에 <b>큼직한 숫자 키패드</b>가 바로 뜹니다 (영문 입력 불필요)
                        </p>
                      </div>
                    </div>

                    {/* FRT / RR Switcher */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-2xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setCuttingPart("FRT")}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                          cuttingPart === "FRT"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                        }`}
                      >
                        <span>🚗 FRT (3단면)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCuttingPart("RR")}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                          cuttingPart === "RR"
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                        }`}
                      >
                        <span>⚡ RR (2단면)</span>
                      </button>
                    </div>
                  </div>

                  {/* LOT 입력 줄들: FRT는 A,B,C 3줄 / RR은 A,B 2줄 */}
                  <div className="space-y-2">
                    {(cuttingPart === "FRT"
                      ? [
                          { key: "a", name: "A단면", spec: "881±3mm", border: "border-indigo-200 dark:border-indigo-800" },
                          { key: "b", name: "B단면", spec: "608±5mm", border: "border-indigo-200 dark:border-indigo-800" },
                          { key: "c", name: "C단면", spec: "582±5mm", border: "border-indigo-200 dark:border-indigo-800" }
                        ]
                      : [
                          { key: "a", name: "A단면", spec: "488±3mm", border: "border-purple-200 dark:border-purple-800" },
                          { key: "b", name: "B단면", spec: "658±5mm", border: "border-purple-200 dark:border-purple-800" }
                        ]
                    ).map((sec) => {
                      const currentLots = cuttingLot[cuttingPart]?.[sec.key] || { start: "", mid: "", end: "" };
                      return (
                        <div
                          key={sec.key}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 px-3 rounded-xl border bg-white dark:bg-slate-900 ${sec.border} shadow-2xs`}
                        >
                          <div className="flex items-center gap-2 sm:w-44 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="font-black text-xs text-slate-900 dark:text-white">
                              {cuttingPart} {sec.name}
                            </span>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              ({sec.spec})
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 flex-1">
                            <div>
                              <input
                                type="text"
                                inputMode="tel"
                                placeholder="초물 숫자 (예: 1013-1)"
                                value={currentLots.start}
                                onChange={(e) =>
                                  setCuttingLot((prev) => ({
                                    ...prev,
                                    [cuttingPart]: {
                                      ...prev[cuttingPart],
                                      [sec.key]: { ...(prev[cuttingPart]?.[sec.key] || {}), start: e.target.value }
                                    }
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:border-indigo-500"
                              />
                              <span className="text-[9px] text-slate-400 block text-center mt-0.5">초물 LOT</span>
                            </div>
                            <div>
                              <input
                                type="text"
                                inputMode="tel"
                                placeholder="중물 숫자"
                                value={currentLots.mid}
                                onChange={(e) =>
                                  setCuttingLot((prev) => ({
                                    ...prev,
                                    [cuttingPart]: {
                                      ...prev[cuttingPart],
                                      [sec.key]: { ...(prev[cuttingPart]?.[sec.key] || {}), mid: e.target.value }
                                    }
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:border-indigo-500"
                              />
                              <span className="text-[9px] text-slate-400 block text-center mt-0.5">중물 LOT</span>
                            </div>
                            <div>
                              <input
                                type="text"
                                inputMode="tel"
                                placeholder="종물 숫자"
                                value={currentLots.end}
                                onChange={(e) =>
                                  setCuttingLot((prev) => ({
                                    ...prev,
                                    [cuttingPart]: {
                                      ...prev[cuttingPart],
                                      [sec.key]: { ...(prev[cuttingPart]?.[sec.key] || {}), end: e.target.value }
                                    }
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:border-indigo-500"
                              />
                              <span className="text-[9px] text-slate-400 block text-center mt-0.5">종물 LOT</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 🌟 2. 절단 작업량 & 초·중·종 치수(Dim's) 일체형 실측 표 */}
                <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2.5 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>📊</span>
                      <span>절단 작업량 및 초·중·종 치수(Dim's) 검사 실측</span>
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      단위: 수량(EA) / 치수(mm)
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                      <thead>
                        <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black">
                          <th className="p-2.5 text-center bg-slate-200/50 dark:bg-slate-700/50">단면</th>
                          <th className="p-2.5 text-center">절단 규격</th>
                          <th className="p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-l border-emerald-200 dark:border-emerald-800">
                            정품 (EA)
                          </th>
                          <th className="p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-r border-emerald-200 dark:border-emerald-800">
                            불량 (EA)
                          </th>
                          <th className="p-2.5 text-center bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200" colSpan={3}>
                            초 / 중 / 종 치수(Dim's) 실측
                          </th>
                          <th className="p-2.5 text-center">판정</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(cuttingPart === "FRT"
                          ? [
                              { key: "frtA", name: "A단면", spec: "881±3", target: 881, tol: 3, genKey: "genuineA", badKey: "badA" },
                              { key: "frtB", name: "B단면", spec: "608±5", target: 608, tol: 5, genKey: "genuineB", badKey: "badB" },
                              { key: "frtC", name: "C단면", spec: "582±5", target: 582, tol: 5, genKey: "genuineC", badKey: "badC" }
                            ]
                          : [
                              { key: "rrA", name: "A단면", spec: "488±3", target: 488, tol: 3, genKey: "genuineA", badKey: "badA" },
                              { key: "rrB", name: "B단면", spec: "658±5", target: 658, tol: 5, genKey: "genuineB", badKey: "badB" }
                            ]
                        ).map((row) => {
                          const curDims = measurements[row.key] || { start: "", mid: "", end: "" };
                          const sOk = isDimOk(curDims.start, row.target, row.tol);
                          const mOk = isDimOk(curDims.mid, row.target, row.tol);
                          const eOk = isDimOk(curDims.end, row.target, row.tol);
                          const rowVerdict = sOk && mOk && eOk;

                          return (
                            <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="p-2.5 text-center font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 whitespace-nowrap">
                                {cuttingPart} {row.name}
                              </td>
                              <td className="p-2.5 text-center font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                {row.spec}mm
                              </td>
                              {/* 정품 수량 (inputmode="numeric") */}
                              <td className="p-2 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-l border-emerald-100 dark:border-emerald-900/40">
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={production[row.genKey] || 0}
                                  onChange={(e) =>
                                    setProduction((p) => ({
                                      ...p,
                                      [row.genKey]: parseInt(e.target.value, 10) || 0
                                    }))
                                  }
                                  className="w-20 px-2 py-1.5 text-center font-black text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500"
                                />
                              </td>
                              {/* 불량 수량 (inputmode="numeric") */}
                              <td className="p-2 text-center bg-rose-50/40 dark:bg-rose-950/20 border-r border-emerald-100 dark:border-emerald-900/40">
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={production[row.badKey] || 0}
                                  onChange={(e) =>
                                    setProduction((p) => ({
                                      ...p,
                                      [row.badKey]: parseInt(e.target.value, 10) || 0
                                    }))
                                  }
                                  className="w-16 px-2 py-1.5 text-center font-black text-xs rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500"
                                />
                              </td>
                              {/* 초물 Dim's (inputmode="decimal") */}
                              <td className="p-2 text-center bg-amber-50/20 dark:bg-amber-950/10">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="초물"
                                  value={curDims.start}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMeasurements((m) => ({
                                      ...m,
                                      [row.key]: { ...(m[row.key] || {}), start: val }
                                    }));
                                  }}
                                  className={`w-18 px-2 py-1.5 text-center font-bold text-xs rounded-lg border transition ${
                                    sOk
                                      ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                      : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black ring-1 ring-rose-400"
                                  }`}
                                />
                                <span className="text-[9px] text-slate-400 block text-center mt-0.5">초물 (06:50)</span>
                              </td>
                              {/* 중물 Dim's (inputmode="decimal") */}
                              <td className="p-2 text-center bg-amber-50/20 dark:bg-amber-950/10">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="중물"
                                  value={curDims.mid}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMeasurements((m) => ({
                                      ...m,
                                      [row.key]: { ...(m[row.key] || {}), mid: val }
                                    }));
                                  }}
                                  className={`w-18 px-2 py-1.5 text-center font-bold text-xs rounded-lg border transition ${
                                    mOk
                                      ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                      : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black ring-1 ring-rose-400"
                                  }`}
                                />
                                <span className="text-[9px] text-slate-400 block text-center mt-0.5">중물 (11:50)</span>
                              </td>
                              {/* 종물 Dim's (inputmode="decimal") */}
                              <td className="p-2 text-center bg-amber-50/20 dark:bg-amber-950/10">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="종물"
                                  value={curDims.end}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMeasurements((m) => ({
                                      ...m,
                                      [row.key]: { ...(m[row.key] || {}), end: val }
                                    }));
                                  }}
                                  className={`w-18 px-2 py-1.5 text-center font-bold text-xs rounded-lg border transition ${
                                    eOk
                                      ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                      : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black ring-1 ring-rose-400"
                                  }`}
                                />
                                <span className="text-[9px] text-slate-400 block text-center mt-0.5">종물 (18:50)</span>
                              </td>
                              {/* 판정 (OK / NG) */}
                              <td className="p-2 text-center whitespace-nowrap">
                                <span
                                  className={`text-[11px] px-2.5 py-1 rounded-full font-black inline-flex items-center gap-1 ${
                                    rowVerdict
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse"
                                  }`}
                                >
                                  {rowVerdict ? "✅ OK" : "❌ NG"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const isFrt = cuttingPart === "FRT";
                          const genSum = (Number(production.genuineA) || 0) + (Number(production.genuineB) || 0) + (isFrt ? (Number(production.genuineC) || 0) : 0);
                          const badSum = (Number(production.badA) || 0) + (Number(production.badB) || 0) + (isFrt ? (Number(production.badC) || 0) : 0);
                          const grossSum = genSum + badSum;
                          const yieldRate = grossSum > 0 ? ((genSum / grossSum) * 100).toFixed(1) : "100.0";

                          const rowsToCheck = isFrt
                            ? [
                                { key: "frtA", target: 881, tol: 3 },
                                { key: "frtB", target: 608, tol: 5 },
                                { key: "frtC", target: 582, tol: 5 }
                              ]
                            : [
                                { key: "rrA", target: 488, tol: 3 },
                                { key: "rrB", target: 658, tol: 5 }
                              ];

                          let overallOk = true;
                          rowsToCheck.forEach((r) => {
                            const m = measurements[r.key] || {};
                            if (!isDimOk(m.start, r.target, r.tol) || !isDimOk(m.mid, r.target, r.tol) || !isDimOk(m.end, r.target, r.tol)) {
                              overallOk = false;
                            }
                          });

                          return (
                            <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-indigo-400">
                              <td className="p-3 text-center">실적계</td>
                              <td className="p-3 text-center text-slate-400">-</td>
                              <td className="p-3 text-center text-emerald-300 font-black text-sm">
                                {genSum.toLocaleString()} EA
                              </td>
                              <td className="p-3 text-center text-rose-300 font-black text-sm">
                                {badSum.toLocaleString()} EA
                              </td>
                              <td className="p-3 text-center text-amber-300" colSpan={3}>
                                총 절단량: <span className="text-white font-black">{grossSum.toLocaleString()} EA</span>{" "}
                                (양품률: <span className="text-emerald-400 font-black">{yieldRate}%</span>)
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full font-black ${
                                    overallOk ? "bg-emerald-500 text-white" : "bg-rose-500 text-white animate-pulse"
                                  }`}
                                >
                                  {overallOk ? "전체 OK" : "공차 NG"}
                                </span>
                              </td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* LH / RH Inputs for 단컷팅, 조인트, 본드로봇, 검사 */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* LH */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                      {processId === "소재준비" && subProcess === "단컷팅"
                        ? "LH (좌측: FRT 83mm / RR 68mm)"
                        : processId === "조인트"
                        ? (jointType === "FRT" ? "🚗 FRT LH (2호기/3호기)"
                          : jointType === "FIXED_LH" ? "📐 LH (1호기) 생산구분"
                          : jointType === "FIXED_RH" ? "📐 RH (1호기) 생산구분"
                          : "⚡ RR LH (2호기/3호기)")
                        : "LH (좌측) / A구간"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      합계: {(Number(production.genuineLH) || 0) + (Number(production.badLH) || 0)} EA
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        정품 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.genuineLH}
                        onChange={(e) => setProduction((p) => ({ ...p, genuineLH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                        불량 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.badLH}
                        onChange={(e) => setProduction((p) => ({ ...p, badLH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                        리워크 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.reworkLH}
                        onChange={(e) => setProduction((p) => ({ ...p, reworkLH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* RH */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                      {processId === "소재준비" && subProcess === "단컷팅"
                        ? "RH (우측: FRT 83mm / RR 67mm)"
                        : processId === "조인트"
                        ? (jointType === "FRT" ? "🚗 FRT RH (2호기/3호기)"
                          : jointType === "FIXED_LH" ? "📐 LH (2호기) 생산구분"
                          : jointType === "FIXED_RH" ? "📐 RH (2호기) 생산구분"
                          : "⚡ RR RH (2호기/3호기)")
                        : "RH (우측) / B구간"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      합계: {(Number(production.genuineRH) || 0) + (Number(production.badRH) || 0)} EA
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        정품 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.genuineRH}
                        onChange={(e) => setProduction((p) => ({ ...p, genuineRH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                        불량 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.badRH}
                        onChange={(e) => setProduction((p) => ({ ...p, badRH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                        리워크 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.reworkRH}
                        onChange={(e) => setProduction((p) => ({ ...p, reworkRH: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                  총 정품
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
                  {totals.genuine.toLocaleString()} EA
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">
                  총 불량
                </span>
                <span className="text-sm sm:text-base font-black text-rose-950 dark:text-rose-100">
                  {totals.bad.toLocaleString()} EA
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
                  총 리워크
                </span>
                <span className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100">
                  {totals.rework.toLocaleString()} EA
                </span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block">
                  총 생산량
                </span>
                <span className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100">
                  {totals.gross.toLocaleString()} EA
                </span>
              </div>
            </div>
          </div>

          {/* C. 공정별 치수측정 & 조건 기록 (초물 / 중물 / 종물) */}
          {currentSpecs.length > 0 && !(processId === "소재준비" && subProcess === "정치절단") && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>3. 주요 규격 및 치수 검사 (초물 06:50 / 중물 11:50 / 종물 18:50)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  단위: mm
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-black">
                      <th className="p-2 rounded-l-lg">검사 부위 및 항목</th>
                      <th className="p-2 text-center">규격(Spec)</th>
                      <th className="p-2 text-center">초물 (Start)</th>
                      <th className="p-2 text-center">중물 (Middle)</th>
                      <th className="p-2 text-center rounded-r-lg">종물 (Finish)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {currentSpecs.map((spec) => {
                      const cur = measurements[spec.key] || { start: "", mid: "", end: "" };
                      return (
                        <tr key={spec.key} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                          <td className="p-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {spec.label}
                          </td>
                          <td className="p-2 text-center font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {spec.spec}
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              placeholder="실측"
                              value={cur.start}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMeasurements((m) => ({
                                  ...m,
                                  [spec.key]: { ...(m[spec.key] || {}), start: val }
                                }));
                              }}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              placeholder="실측"
                              value={cur.mid}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMeasurements((m) => ({
                                  ...m,
                                  [spec.key]: { ...(m[spec.key] || {}), mid: val }
                                }));
                              }}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              placeholder="실측"
                              value={cur.end}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMeasurements((m) => ({
                                  ...m,
                                  [spec.key]: { ...(m[spec.key] || {}), end: val }
                                }));
                              }}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. 조인트 및 가류/사출 성형 조건 (조인트 공정 시 활성화) */}
          {(processId.includes("조인트") || processId.includes("본드")) && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/80 pb-2">
                <span className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {project === "9BQC" ? (
                      processId === "조인트"
                        ? `3. 사출 조건 및 사출온도 (${
                            jointType === "FRT" ? "직각 Machine / 둔각 Machine" :
                            jointType === "FIXED_LH" ? "LH 좌측 / 우측 Machine" :
                            jointType === "FIXED_RH" ? "RH 좌측 / 우측 Machine" :
                            "2호기 / 3호기 Machine"
                          })`
                        : "3. 사출 성형 조건 및 사출온도"
                    ) : "3. 프레스 가류조건 (상/하판 200±20℃, 90±30s)"}
                  </span>
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                  {project === "9BQC" ? `원재료: ${jointGradeName || "SJ-4004B"}` : "고무: W60664$OS"}
                </span>
              </div>

              {project === "9BQC" ? (
                /* 9BQC 사출온도 4개존 + 성형조건 */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">노즐 (Nozzle)</span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={conditions.nozzleTempSet}
                          onChange={(e) => setConditions((c) => ({ ...c, nozzleTempSet: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                          title="설정치"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="text"
                          value={conditions.nozzleTempAct}
                          onChange={(e) => setConditions((c) => ({ ...c, nozzleTempAct: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                          title="실측치"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">실린더 1 (H1)</span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={conditions.cyl1TempSet}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl1TempSet: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="text"
                          value={conditions.cyl1TempAct}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl1TempAct: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">실린더 2 (H2)</span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={conditions.cyl2TempSet}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl2TempSet: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="text"
                          value={conditions.cyl2TempAct}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl2TempAct: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">실린더 3 (H3)</span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={conditions.cyl3TempSet}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl3TempSet: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="text"
                          value={conditions.cyl3TempAct}
                          onChange={(e) => setConditions((c) => ({ ...c, cyl3TempAct: e.target.value }))}
                          className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 사출조건: 거리, 속도, 압력 (초물 / 중물 / 종물) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                        사출 성형 조건 (초물 / 중물 / 종물)
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                        거리(mm) • 속도(mm/s) • 압력(bar)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          거리 (Distance)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="text"
                            placeholder="초물"
                            value={conditions.distance?.start || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              distance: { ...(c.distance || {}), start: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="중물"
                            value={conditions.distance?.mid || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              distance: { ...(c.distance || {}), mid: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="종물"
                            value={conditions.distance?.end || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              distance: { ...(c.distance || {}), end: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          속도 (Speed)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="text"
                            placeholder="초물"
                            value={conditions.speed?.start || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              speed: { ...(c.speed || {}), start: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="중물"
                            value={conditions.speed?.mid || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              speed: { ...(c.speed || {}), mid: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="종물"
                            value={conditions.speed?.end || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              speed: { ...(c.speed || {}), end: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          압력 (Pressure)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="text"
                            placeholder="초물"
                            value={conditions.pressure?.start || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              pressure: { ...(c.pressure || {}), start: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="중물"
                            value={conditions.pressure?.mid || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              pressure: { ...(c.pressure || {}), mid: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="종물"
                            value={conditions.pressure?.end || ""}
                            onChange={(e) => setConditions((c) => ({
                              ...c,
                              pressure: { ...(c.pressure || {}), end: e.target.value }
                            }))}
                            className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* LQ2a 프레스 가류조건 */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">상판 가류온도(℃)</span>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={conditions.cureTempUpperSet}
                        onChange={(e) => setConditions((c) => ({ ...c, cureTempUpperSet: e.target.value }))}
                        className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                        title="셋팅: 200℃"
                      />
                      <span className="text-xs text-slate-400">/</span>
                      <input
                        type="text"
                        value={conditions.cureTempUpperAct}
                        onChange={(e) => setConditions((c) => ({ ...c, cureTempUpperAct: e.target.value }))}
                        className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                        title="현재온도"
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">하판 가류온도(℃)</span>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={conditions.cureTempLowerSet}
                        onChange={(e) => setConditions((c) => ({ ...c, cureTempLowerSet: e.target.value }))}
                        className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                        title="셋팅: 200℃"
                      />
                      <span className="text-xs text-slate-400">/</span>
                      <input
                        type="text"
                        value={conditions.cureTempLowerAct}
                        onChange={(e) => setConditions((c) => ({ ...c, cureTempLowerAct: e.target.value }))}
                        className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                        title="현재온도"
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">가류시간 (초)</span>
                    <input
                      type="text"
                      value={conditions.cureTimeSec}
                      onChange={(e) => setConditions((c) => ({ ...c, cureTimeSec: e.target.value }))}
                      className="w-full px-2 py-1 rounded-lg border border-amber-300 text-xs font-black text-center text-amber-700"
                      placeholder="90s ±30s"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">금형 청소시간</span>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1">
                      <span>시업전: {cleaningTimes.before}</span>
                      <span>시업후: {cleaningTimes.after}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. 불량 세부 내역 매트릭스 (터치 증감 버튼) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-center justify-between border-b border-rose-200/80 dark:border-rose-900/80 pb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-black text-xs sm:text-sm text-rose-950 dark:text-rose-200">
                  {processId === "검사" ? "4. 검사 3대 불량 세부 집계 (압출소재 / 조인트 / 후가공)" : "4. 불량 유형별 세부 집계"}
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black">
                불량 소계: {totals.defectSum} EA
              </span>
            </div>

            {processId === "검사" ? (
              /* 검사 3대 불량 분류 (압출소재, 조인트, 후가공) 그룹핑 뷰 */
              <div className="space-y-3.5">
                {[
                  {
                    title: "1. 압출소재 불량",
                    prefix: "압출_",
                    icon: "🧱",
                    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  },
                  {
                    title: "2. 조인트 불량",
                    prefix: "조인트_",
                    icon: "⚙️",
                    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  },
                  {
                    title: "3. 후가공 불량",
                    prefix: "후가공_",
                    icon: "✂️",
                    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }
                ].map((grp) => {
                  const grpKeys = currentDefectKeys.filter((k) => k.startsWith(grp.prefix));
                  if (grpKeys.length === 0) return null;
                  const grpTotal = grpKeys.reduce((acc, k) => acc + (Number(defects[k]) || 0), 0);

                  return (
                    <div
                      key={grp.prefix}
                      className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                        <span className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{grp.icon}</span>
                          <span>{grp.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${grp.badgeColor}`}>
                            {grpKeys.length}개 항목
                          </span>
                        </span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                          grpTotal > 0
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-black"
                            : "text-slate-400"
                        }`}>
                          소계: {grpTotal.toLocaleString()} EA
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {grpKeys.map((k) => {
                          const count = Number(defects[k]) || 0;
                          const displayName = k.replace(grp.prefix, "");
                          return (
                            <div
                              key={k}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
                                count > 0
                                  ? "bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-100 shadow-xs"
                                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span className="text-xs font-bold truncate" title={displayName}>
                                {displayName}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDefectChange(k, -1)}
                                  className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-200 flex items-center justify-center font-black active:scale-95 cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={count}
                                  onChange={(e) => handleDefectInput(k, e.target.value)}
                                  className="w-10 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDefectChange(k, 1)}
                                  className="w-6 h-6 rounded-lg bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center font-black active:scale-95 cursor-pointer shadow-2xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 기존 일반 공정 불량 그리드 */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {currentDefectKeys.map((k) => {
                  const count = Number(defects[k]) || 0;
                  return (
                    <div
                      key={k}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
                        count > 0
                          ? "bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-100 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{k}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDefectChange(k, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-200 flex items-center justify-center font-black active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count}
                          onChange={(e) => handleDefectInput(k, e.target.value)}
                          className="w-10 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleDefectChange(k, 1)}
                          className="w-6 h-6 rounded-lg bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center font-black active:scale-95 cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* F. 특기사항 및 설비 이상 조치 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>5. 설비 조치 및 특기사항</span>
              </span>

              {project === "9BQC" ? (
                /* 🌟 9BQC 칼날교체알림 뱃지: 5만개 초과 시 점멸 (animate-pulse) */
                <div className="flex flex-wrap items-center gap-2">
                  {isBladeOverdue ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400 dark:ring-rose-500">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      ✂️🚨 칼날교체알림: 5만개 초과 즉시 교체 ({totalCumulativeQty.toLocaleString()} / 50,000 EA)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ✂️ 칼날교체알림: 정상 ({totalCumulativeQty.toLocaleString()} / 50,000 EA)
                    </span>
                  )}
                  {/* 테스트 모드 토글 뱃지 */}
                  <button
                    type="button"
                    onClick={() => setIsBladeTestMode((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      isBladeTestMode
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-300"
                    }`}
                    title="5만개 초과 점멸 상태 테스트"
                  >
                    🧪 {isBladeTestMode ? "테스트 해제" : "5만개 초과 테스트"}
                  </button>
                </div>
              ) : (
                processId === "소재준비" && subProcess === "정치절단" && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    ✂️ 칼날교체시간 기록 항목 지원
                  </span>
                )
              )}
            </div>

            {/* 🌟 9BQC 칼날 수명 및 교체 관리 카드 */}
            {project === "9BQC" && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isBladeOverdue
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600/70 ring-2 ring-rose-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                }`}
              >
                {/* 상단 알림 헤더 */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                      <Scissors className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>9BQC 칼날 수명 및 교체 알림</span>
                        {isBladeOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            ⚠️ 교체 시기 도래 (점멸 경고)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            정상 가동중
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        권장 교체 주기: <strong className="text-slate-800 dark:text-slate-200">50,000 EA</strong> 마다 칼날 교체 필수
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      총 누적생산량:{" "}
                      <span className={isBladeOverdue ? "text-rose-600 dark:text-rose-400 text-sm font-black" : "text-indigo-600 dark:text-indigo-400 font-black"}>
                        {totalCumulativeQty.toLocaleString()}
                      </span>{" "}
                      / 50,000 EA
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isBladeOverdue ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          🚨 {(totalCumulativeQty - BLADE_LIMIT).toLocaleString()} EA 초과 가동 중!
                        </span>
                      ) : (
                        <span>잔여 수명: {(BLADE_LIMIT - totalCumulativeQty).toLocaleString()} EA</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 수명 게이지 바 */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isBladeOverdue
                        ? "bg-rose-600 animate-pulse"
                        : bladeLifePercent >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, bladeLifePercent)}%` }}
                  />
                </div>

                {/* 5만개 초과 시 경고 배너 */}
                {isBladeOverdue && (
                  <div className="p-2.5 mb-3 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                      <span>
                        [경고] 총 누적생산량이 50,000개를 초과했습니다. 절단면 직각도·외관 불량 예방을 위해 지금 즉시 칼날을 교체해 주십시오!
                      </span>
                    </div>
                  </div>
                )}

                {/* 칼날 교체 시간 입력 및 즉시 교체 리셋 버튼 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 items-end">
                  <div className="sm:col-span-6">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>칼날교체시간 기록</span>
                    </label>
                    <input
                      type="text"
                      placeholder="예: 08:30 (1차 교체), 13:40 (2차 교체)"
                      value={bladeChangeTime}
                      onChange={(e) => setBladeChangeTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-6 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRecordBladeChangeNow}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      title="현재 시각을 칼날교체시간으로 기록하고 누적 절단 수량을 0으로 리셋합니다."
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>지금 교체 완료 (누적 0 리셋)</span>
                    </button>
                    {bladeResetInfo && (
                      <button
                        type="button"
                        onClick={handleClearBladeReset}
                        className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 text-xs font-semibold cursor-pointer"
                        title="리셋 취소 (이전 누적으로 복원)"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>

                {bladeResetInfo && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                    ℹ️ 최근 교체 완료 기록: {bladeResetInfo.resetDate} {bladeResetInfo.resetTime} (작업자: {bladeResetInfo.worker || "작업자"}) 기준 이후 생산량 계산 중
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 9BQC가 아닌 다른 프로젝트의 정치절단일 때만 별도 칼날교체시간 표시 */}
              {project !== "9BQC" && processId === "소재준비" && subProcess === "정치절단" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>칼날교체 시간 (Blade Change Time)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 08:30 (1차 교체), 13:40 (2차 교체)"
                    value={bladeChangeTime}
                    onChange={(e) => setBladeChangeTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* 설비 이상 조치사항 */}
              <div className={(project !== "9BQC" && processId === "소재준비" && subProcess === "정치절단") ? "" : "sm:col-span-2"}>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>설비 이상 조치사항</span>
                </label>
                <input
                  type="text"
                  placeholder="설비 이상 및 트러블 발생 시 내용 및 조치사항 기록"
                  value={machineTrouble}
                  onChange={(e) => setMachineTrouble(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 특기사항 및 건의사항 */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                특기 사항 및 건의 사항
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="칼날 교체, 금형 세척, 사출 압력 변동 조치, 부자재 입고 LOT 이상 등 특이사항을 상세히 기록해 주십시오."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 🌟 4. Modal Footer: Save, Excel, and Close Actions */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {toastMessage && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                {toastMessage}
              </span>
            )}
            {processId === "소재준비" && currentStep === "tpm" && (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
                점검완료: {tpmSummary.okCount} / 42 양호
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {processId === "소재준비" && currentStep === "report" && (
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>⬅️ TPM 점검표 다시보기</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              닫기
            </button>

            {processId === "소재준비" && currentStep === "tpm" ? (
              <button
                type="button"
                onClick={handleProceedToReport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span>TPM 점검 완료 ➔ 작업일보 작성 진행</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "저장 중..." : "작업일보 실시간 저장"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HanulWorkReportModal;
