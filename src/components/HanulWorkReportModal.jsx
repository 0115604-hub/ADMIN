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
  ChevronDown
} from "lucide-react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_WORKERS_MASTER,
  HANUL_SPECS,
  DEFAULT_DEFECT_CATEGORIES,
  saveHanulWorkReport,
  exportHanulReportToExcel
} from "../services/hanulWorkReportService";
import { getKSTDateString } from "../utils/dateUtils";
import { useModalHistory } from "../utils/modalHistory";

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
  const [bladeChangeTime, setBladeChangeTime] = useState(""); // 칼날교체시간 (정치절단 전용)
  const [machineTrouble, setMachineTrouble] = useState(""); // 설비 이상 조치사항
  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(initialWorker || "황수현");
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

  // Dynamic Defects (matching sheet categories)
  const currentDefectKeys = useMemo(() => {
    const key = processId === "소재준비"
      ? `${project}_소재준비_${subProcess}`
      : `${project}_${processId}`;
    return (
      DEFAULT_DEFECT_CATEGORIES[key] ||
      DEFAULT_DEFECT_CATEGORIES[`${project}_${processId}`] ||
      DEFAULT_DEFECT_CATEGORIES["9BQC_정재단"] ||
      []
    );
  }, [project, processId, subProcess]);

  const [defects, setDefects] = useState({});

  // Measurements by spec
  const currentSpecs = useMemo(() => {
    const key = processId === "소재준비"
      ? `${project}_소재준비_${subProcess}`
      : `${project}_${processId}`;
    return HANUL_SPECS[key] || HANUL_SPECS[`${project}_${processId}`] || [];
  }, [project, processId, subProcess]);

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

  // Sync when editReport provided or opened
  useEffect(() => {
    if (editReport) {
      setProject(editReport.project || "9BQC");
      setProcessId(editReport.processId || "소재준비");
      if (editReport.subProcess) setSubProcess(editReport.subProcess);
      if (editReport.bladeChangeTime) setBladeChangeTime(editReport.bladeChangeTime);
      if (editReport.machineTrouble) setMachineTrouble(editReport.machineTrouble);
      setDate(editReport.date || getKSTDateString());
      setShift(editReport.shift || "주간");
      setWorker(editReport.worker || "황수현");
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
    } else if (isOpen) {
      setProject(initialProject);
      setProcessId(initialProcess);
      setSubProcess("정치절단");
      setBladeChangeTime("");
      setMachineTrouble("");
      if (initialWorker) setWorker(initialWorker);
      // Reset defects based on categories
      const initDef = {};
      const defKey = initialProcess === "소재준비"
        ? `${initialProject}_소재준비_정치절단`
        : `${initialProject}_${initialProcess}`;
      const defKeys = DEFAULT_DEFECT_CATEGORIES[defKey] || DEFAULT_DEFECT_CATEGORIES[`${initialProject}_${initialProcess}`] || [];
      defKeys.forEach((k) => { initDef[k] = 0; });
      setDefects(initDef);
    }
  }, [editReport, isOpen, initialProject, initialProcess, initialWorker]);

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

    const lhGenuine = (Number(production.genuineLH) || 0) + (Number(production.genuineRH) || 0);
    const lhBad = (Number(production.badLH) || 0) + (Number(production.badRH) || 0);
    const lhRework = (Number(production.reworkLH) || 0) + (Number(production.reworkRH) || 0);

    const abcGenuine = (Number(production.genuineA) || 0) + (Number(production.genuineB) || 0) + (Number(production.genuineC) || 0);
    const abcBad = (Number(production.badA) || 0) + (Number(production.badB) || 0) + (Number(production.badC) || 0);

    if (processId === "소재준비" && subProcess === "정치절단") {
      // In 정치절단, prefer ABC sections if entered, else LH/RH
      if (abcGenuine > 0 || abcBad > 0 || lhGenuine === 0) {
        genuine = abcGenuine;
        bad = abcBad;
      } else {
        genuine = lhGenuine;
        bad = lhBad;
        rework = lhRework;
      }
    } else {
      // In other processes (단컷팅, 조인트, 본드로봇, 검사), prefer LH/RH
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
  }, [production, defects, processId, subProcess, project]);

  if (!isOpen) return null;

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

  const handleSave = async () => {
    const effectiveWorker = customWorker.trim() || worker;
    if (!effectiveWorker) {
      alert("작업자 이름을 선택하거나 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const reportPayload = {
        id: editReport?.id,
        project,
        projectName: currentProjectObj.name,
        carModel: currentProjectObj.carModel,
        partName: currentProjectObj.partName,
        processId,
        processName: currentProcessObj.name,
        subProcess: processId === "소재준비" ? subProcess : "",
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
        createdAt: editReport?.createdAt || new Date().toISOString()
      };

      await saveHanulWorkReport(reportPayload);
      setToastMessage("✅ 작업일보가 실시간 저장되었습니다!");
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
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border-2 border-indigo-500/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp text-left"
      >
        {/* ========================================================================= */}
        {/* 🌟 1. Modal Header & Project Switcher */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shrink-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-xl tracking-tight truncate">
                    한울 외주가공 작업일보
                  </h3>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40">
                    실시간 클라우드 동기화
                  </span>
                </div>
                <p className="text-xs text-indigo-200 truncate mt-0.5">
                  9BQC G/RUN 및 LQ2a Hood Side 4대 핵심 공정 (소재준비 • 조인트 • 본드로봇 • 검사)
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
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="닫기 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project Switcher Bar */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-indigo-900/60">
            {HANUL_PROJECTS.map((p) => {
              const isActive = project === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProject(p.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/90 border-indigo-300 text-white shadow-md shadow-indigo-950/50 scale-[1.01]"
                      : "bg-white/5 border-slate-700/80 text-slate-300 hover:bg-white/10 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{p.id === "9BQC" ? "🚗" : "⚡"}</span>
                    <div className="text-left min-w-0">
                      <span className="font-black text-xs sm:text-sm block truncate leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-indigo-200 block truncate">
                        {p.carModel} • {p.partName}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 🌟 2. Process Tabs (공정 선택 탭) + 소재준비 세부일보 드롭다운 */}
        {/* ========================================================================= */}
        <div className="px-3 sm:px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center justify-between gap-3 min-w-max">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>공정선택:</span>
              </span>
              {(HANUL_PROCESSES[project] || []).map((proc, idx) => {
                const isSelected = processId === proc.id;
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => setProcessId(proc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs scale-102"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="opacity-70 text-[10px]">{idx + 1}.</span>
                    <span>{proc.id}</span>
                  </button>
                );
              })}
            </div>

            {/* 🌟 소재준비 공정일 때 드롭다운 선택기 (정치절단 / 단컷팅) */}
            {processId === "소재준비" && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/90 px-3 py-1 rounded-xl border-2 border-indigo-500 shadow-xs animate-fadeIn">
                <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0">
                  <span>📄 일보 선택:</span>
                </span>
                <div className="relative">
                  <select
                    value={subProcess}
                    onChange={(e) => setSubProcess(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-950 dark:text-indigo-100 font-black text-xs rounded-lg pl-3 pr-7 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  >
                    <option value="정치절단">✂️ 정치절단 작업일보</option>
                    <option value="단컷팅">📐 단컷팅 작업일보</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 3. Scrollable Form Body */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-4">
          {/* 🌟 소재준비 공정일 때: 정치절단 / 단컷팅 일보 상단 안내 배너 & 원클릭 전환 탭 */}
          {processId === "소재준비" && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/50 dark:via-blue-950/40 dark:to-indigo-950/50 border-2 border-indigo-400 dark:border-indigo-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
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
          {/* A. 기본 정보 (일자, 주야, 작업자, 시간, 설비호기) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
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

            {/* LOT 번호 및 설비 호기 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  설비 호기 / 라인
                </label>
                <input
                  type="text"
                  placeholder="예: 사출 2호기, X부 LH"
                  value={machineNo}
                  onChange={(e) => setMachineNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  압출소재 LOT (초/중/종)
                </label>
                <input
                  type="text"
                  placeholder="초:09.12 / 종:09.12"
                  value={materialLot.start || ""}
                  onChange={(e) => setMaterialLot((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  조인트/원재료 LOT
                </label>
                <input
                  type="text"
                  placeholder="W60664$OS 등"
                  value={jointLot}
                  onChange={(e) => setJointLot(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  대차번호 / 클립 LOT
                </label>
                <input
                  type="text"
                  placeholder="대차 3호 / 2T000 WH"
                  value={dollyNo || clipLot.start || ""}
                  onChange={(e) => {
                    setDollyNo(e.target.value);
                    setClipLot((prev) => ({ ...prev, start: e.target.value }));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
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

            {/* 🌟 생산 수량 입력: 정치절단 (A / B / C 단면) vs 단컷팅 및 기타 (LH / RH) */}
            {processId === "소재준비" && subProcess === "정치절단" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Section A */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                      Section "A" (FRT A / RR A 가절단)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      계: {(Number(production.genuineA) || 0) + (Number(production.badA) || 0)} EA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        정품 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.genuineA}
                        onChange={(e) => setProduction((p) => ({ ...p, genuineA: parseInt(e.target.value, 10) || 0 }))}
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
                        value={production.badA}
                        onChange={(e) => setProduction((p) => ({ ...p, badA: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                      Section "B" (FRT B / RR B)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      계: {(Number(production.genuineB) || 0) + (Number(production.badB) || 0)} EA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        정품 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.genuineB}
                        onChange={(e) => setProduction((p) => ({ ...p, genuineB: parseInt(e.target.value, 10) || 0 }))}
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
                        value={production.badB}
                        onChange={(e) => setProduction((p) => ({ ...p, badB: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                      Section "C" (FRT C)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      계: {(Number(production.genuineC) || 0) + (Number(production.badC) || 0)} EA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        정품 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={production.genuineC}
                        onChange={(e) => setProduction((p) => ({ ...p, genuineC: parseInt(e.target.value, 10) || 0 }))}
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
                        value={production.badC}
                        onChange={(e) => setProduction((p) => ({ ...p, badC: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                      />
                    </div>
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
          {currentSpecs.length > 0 && (
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
                    {project === "9BQC" ? "3. 사출 성형 조건 및 사출온도" : "3. 프레스 가류조건 (상/하판 200±20℃, 90±30s)"}
                  </span>
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                  {project === "9BQC" ? "노즐/실린더1~3" : "고무: W60664$OS"}
                </span>
              </div>

              {project === "9BQC" ? (
                /* 9BQC 사출온도 4개존 */
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
                  4. 불량 유형별 세부 집계
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black">
                불량 소계: {totals.defectSum} EA
              </span>
            </div>

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
          </div>

          {/* F. 특기사항 및 설비 이상 조치 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>5. 설비 조치 및 특기사항</span>
              </span>
              {processId === "소재준비" && subProcess === "정치절단" && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  ✂️ 칼날교체시간 기록 항목 지원
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 칼날교체 시간 (정치절단 일보 고유 항목) */}
              {processId === "소재준비" && subProcess === "정치절단" && (
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

              {/* 설비 이상 조치사항 (두 일보 공통) */}
              <div className={processId === "소재준비" && subProcess === "정치절단" ? "" : "sm:col-span-2"}>
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
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "저장 중..." : "작업일보 실시간 저장"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HanulWorkReportModal;
