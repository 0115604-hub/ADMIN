import React, { useState, useEffect, useMemo } from "react";
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
  Printer,
  FileText,
  Thermometer,
  Gauge,
  Scissors,
  Wrench,
  RotateCcw,
  Factory
} from "lucide-react";
import {
  MACHINING_PROJECTS,
  MACHINING_PROCESSES,
  MACHINING_JOINT_TYPES,
  MACHINING_INSPECTION_TYPES,
  MACHINING_WORKERS_MASTER,
  MACHINING_SPECS,
  MACHINING_TPM_MACHINES,
  MACHINING_TPM_CHECK_ITEMS,
  createDefaultMachiningTpmChecks,
  getMachiningDefectList,
  saveMachiningWorkReport,
  exportMachiningReportToExcel,
  isExcludedFromMachiningWorkReport
} from "../../services/machiningWorkReportService";
import { getKSTDateString } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";

// 치수 공차 실시간 판정 헬퍼
const isDimOk = (val, target, tol) => {
  if (val === undefined || val === null || val === "") return true;
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  return num >= (target - tol) && num <= (target + tol);
};

export const MachiningWorkReportModal = ({
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
  const [subProcess, setSubProcess] = useState("정치절단"); // For 소재준비: "정치절단" | "단컷팅"
  const [jointType, setJointType] = useState("FRT"); // For 조인트: "FRT" | "RR" | "FIXED_LH" | "FIXED_RH"
  const [inspectionType, setInspectionType] = useState("LENGTH"); // For 검사: "LENGTH" | "SQUARE" | "FINAL_PAIR" | "FINAL_LH"

  const [date, setDate] = useState(() => getKSTDateString());
  const [shift, setShift] = useState("주간");
  const [worker, setWorker] = useState(() => (initialWorker && !isExcludedFromMachiningWorkReport(initialWorker) ? initialWorker : "크리스토퍼"));
  const [customWorker, setCustomWorker] = useState("");
  const [startTime, setStartTime] = useState("06:30");
  const [endTime, setEndTime] = useState("17:30");
  const [machineNo, setMachineNo] = useState("");
  const [dollyNo, setDollyNo] = useState("");

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

  // TPM
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultMachiningTpmChecks());
  const [showTpm, setShowTpm] = useState(false);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize from editReport or defaults
  useEffect(() => {
    if (editReport) {
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
    } else {
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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500/50 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-left animate-scaleUp"
      >
        {/* ================================================================= */}
        {/* Header */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-xs shrink-0">
              <Factory className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-base sm:text-lg tracking-tight">
                  (주)오륙 삼랑진공장 가공동 작업일보
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-amber-800 shadow-xs font-mono">
                  {project} G/RUN
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-900/60 text-amber-100">
                  {processId}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                JA • NX4 • NX4a • HR G/RUN 4대 차종 라인 표준 공정 실적 관리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
              title="엑셀 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">엑셀</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-amber-100 hover:text-white hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Scrollable Content Body */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200">
          {/* 🚗 1. 차종 선택 (4대 G/RUN 라인) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1. 차종 프로젝트 선택 (G/RUN 4대 차종):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MACHINING_PROJECTS.map((p) => {
                const isSelected = project === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProject(p.id)}
                    className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-sm font-black">{p.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                      {p.partName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⚙️ 2. 공정 선택 (한울과 100% 동일한 4대 핵심 공정 분류) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. 표준 공정 선택 (한울 분류 표준 동일 적용):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "소재준비", name: "소재준비", sub: "정치절단, 단컷팅", icon: "✂️" },
                { id: "조인트", name: "조인트", sub: "FRT, RR, 코너 사출", icon: "⚙️" },
                { id: "본드로봇", name: "본드로봇", sub: "로봇 본딩 및 도포", icon: "🤖" },
                { id: "검사", name: "검사", sub: "치수, 단면, 최종검사", icon: "🔍" }
              ].map((proc) => {
                const isSelected = processId === proc.id;
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => setProcessId(proc.id)}
                    className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                    }`}
                  >
                    <span className="text-base">{proc.icon}</span>
                    <span className="text-sm font-black">{proc.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {proc.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-process switches */}
            {processId === "소재준비" && (
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">소재 세부:</span>
                {["정치절단", "단컷팅"].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubProcess(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      subProcess === sub
                        ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {processId === "조인트" && (
              <div className="pt-2 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">조인트 서식:</span>
                {MACHINING_JOINT_TYPES.map((jt) => (
                  <button
                    key={jt.id}
                    type="button"
                    onClick={() => setJointType(jt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      jointType === jt.id
                        ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {jt.label}
                  </button>
                ))}
              </div>
            )}

            {processId === "검사" && (
              <div className="pt-2 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">검사 일보 서식:</span>
                {MACHINING_INSPECTION_TYPES.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setInspectionType(it.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      inspectionType === it.id
                        ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 📅 3. 기본 작업 정보 (일자, 근무, 작업자, 시간, 설비) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>3. 기본 작업 정보:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  작업 일자
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  근무 형태
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShift("주간")}
                    className={`py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      shift === "주간"
                        ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    ☀️ 주간
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift("야간")}
                    className={`py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      shift === "야간"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    🌙 야간
                  </button>
                </div>
              </div>

              {/* Worker Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  작업자 (가공동 31명)
                </label>
                <select
                  value={worker}
                  onChange={(e) => {
                    setWorker(e.target.value);
                    if (e.target.value !== "직접입력") setCustomWorker("");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {MACHINING_WORKERS_MASTER.map((w) => (
                    <option key={w.no} value={w.name}>
                      {w.name} ({w.line} {w.position})
                    </option>
                  ))}
                  <option value="직접입력">✏️ 직접 입력</option>
                </select>
                {worker === "직접입력" && (
                  <input
                    type="text"
                    placeholder="작업자명 입력"
                    value={customWorker}
                    onChange={(e) => setCustomWorker(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-bold"
                  />
                )}
              </div>

              {/* Machine / Dolly */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  설비호기 / 대차번호
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    placeholder="설비호기"
                    value={machineNo}
                    onChange={(e) => setMachineNo(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
                  />
                  <input
                    type="text"
                    placeholder="대차번호"
                    value={dollyNo}
                    onChange={(e) => setDollyNo(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 🏷️ 4. LOT 추적 관리 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span>4. 투입 LOT 관리 (압출 원소재 & 조인트 재료):</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  압출 투입 LOT (A단면 / B단면)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="초물 LOT"
                    value={materialLot.a?.start || ""}
                    onChange={(e) =>
                      setMaterialLot((prev) => ({
                        ...prev,
                        a: { ...(prev.a || {}), start: e.target.value }
                      }))
                    }
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <input
                    type="text"
                    placeholder="중물 LOT"
                    value={materialLot.a?.mid || ""}
                    onChange={(e) =>
                      setMaterialLot((prev) => ({
                        ...prev,
                        a: { ...(prev.a || {}), mid: e.target.value }
                      }))
                    }
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <input
                    type="text"
                    placeholder="종물 LOT"
                    value={materialLot.a?.end || ""}
                    onChange={(e) =>
                      setMaterialLot((prev) => ({
                        ...prev,
                        a: { ...(prev.a || {}), end: e.target.value }
                      }))
                    }
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  조인트/원재료 LOT 및 칼날교체시간
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="조인트 재료 LOT"
                    value={jointLot}
                    onChange={(e) => setJointLot(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <input
                    type="text"
                    placeholder="칼날교체 (예: 10:30)"
                    value={bladeChangeTime}
                    onChange={(e) => setBladeChangeTime(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 📐 5. 초·중·종물 규격 치수 점검 (실시간 공차 OK/NG 자동 판정) */}
          {currentSpecs.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-500" />
                  <span>5. 초·중·종물 치수 측정 및 규격 판정 ({project} {processId}):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  규격 범위 초과 시 자동 <span className="text-rose-600 font-black">NG</span> 표시
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-[11px] bg-slate-50 dark:bg-slate-800/50">
                      <th className="py-2 px-2.5">검사 항목</th>
                      <th className="py-2 px-2.5 text-center">규격(공차)</th>
                      <th className="py-2 px-2 text-center w-20">초물</th>
                      <th className="py-2 px-2 text-center w-20">중물</th>
                      <th className="py-2 px-2 text-center w-20">종물</th>
                      <th className="py-2 px-2.5 text-center w-16">판정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentSpecs.map((spec) => {
                      const rowDims = dimensions[spec.key] || {};
                      const startOk = isDimOk(rowDims.start, spec.target, spec.tol);
                      const midOk = isDimOk(rowDims.mid, spec.target, spec.tol);
                      const endOk = isDimOk(rowDims.end, spec.target, spec.tol);
                      const allOk = startOk && midOk && endOk;

                      return (
                        <tr key={spec.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-2.5 font-bold text-slate-700 dark:text-slate-300">
                            {spec.label}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-500">
                            {spec.spec}
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={spec.target ? String(spec.target) : "측정"}
                              value={rowDims.start || ""}
                              onChange={(e) => handleDimChange(spec.key, "start", e.target.value)}
                              className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                                !startOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
                              }`}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={spec.target ? String(spec.target) : "측정"}
                              value={rowDims.mid || ""}
                              onChange={(e) => handleDimChange(spec.key, "mid", e.target.value)}
                              className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                                !midOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
                              }`}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={spec.target ? String(spec.target) : "측정"}
                              value={rowDims.end || ""}
                              onChange={(e) => handleDimChange(spec.key, "end", e.target.value)}
                              className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                                !endOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                allOk
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                              }`}
                            >
                              {allOk ? "OK" : "NG"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📊 6. 생산 실적 집계 (양품 / 불량 / 리워크 / 총생산) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>6. 생산 실적 수량:</span>
              </span>
              <div className="flex items-center gap-2 text-xs font-black">
                <span>총생산: <span className="text-blue-600 font-mono">{totalGross}EA</span></span>
                <span>양품률: <span className="text-emerald-600 font-mono">{yieldPct}%</span></span>
              </div>
            </div>

            {processId === "검사" ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "col1", label: "LH 1호기 (검사/정품/리워크/폐기)" },
                  { key: "col2", label: "LH 2호기 (검사/정품/리워크/폐기)" },
                  { key: "col3", label: "RH 1호기 (검사/정품/리워크/폐기)" },
                  { key: "col4", label: "RH 2호기 (검사/정품/리워크/폐기)" }
                ].map((col) => {
                  const data = inspProduction[col.key] || {};
                  return (
                    <div key={col.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                        {col.label}
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400">정품</span>
                          <input
                            type="number"
                            value={data.genuine || 0}
                            onChange={(e) =>
                              setInspProduction((prev) => ({
                                ...prev,
                                [col.key]: { ...(prev[col.key] || {}), genuine: Number(e.target.value) || 0 }
                              }))
                            }
                            className="w-full px-1.5 py-1 rounded border text-center font-bold text-emerald-600"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">폐기(불량)</span>
                          <input
                            type="number"
                            value={data.scrap || 0}
                            onChange={(e) =>
                              setInspProduction((prev) => ({
                                ...prev,
                                [col.key]: { ...(prev[col.key] || {}), scrap: Number(e.target.value) || 0 }
                              }))
                            }
                            className="w-full px-1.5 py-1 rounded border text-center font-bold text-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* LH / A */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    LH / A단면 생산 실적
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">정품(EA)</span>
                      <input
                        type="number"
                        value={production.genuineLH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, genuineLH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">불량(EA)</span>
                      <input
                        type="number"
                        value={production.badLH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, badLH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 text-rose-600 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">리워크(EA)</span>
                      <input
                        type="number"
                        value={production.reworkLH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, reworkLH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-amber-600 font-bold text-center text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* RH / B */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    RH / B단면 생산 실적
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">정품(EA)</span>
                      <input
                        type="number"
                        value={production.genuineRH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, genuineRH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">불량(EA)</span>
                      <input
                        type="number"
                        value={production.badRH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, badRH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-rose-300 text-rose-600 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">리워크(EA)</span>
                      <input
                        type="number"
                        value={production.reworkRH || 0}
                        onChange={(e) =>
                          setProduction((prev) => ({ ...prev, reworkRH: Number(e.target.value) || 0 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-amber-600 font-bold text-center text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🚨 7. 세부 불량 내역 (+/- 버튼 간편 입력) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>7. 세부 불량 내역 ({processId}):</span>
              </span>
              <span className="text-[10px] font-bold text-rose-600">
                총 불량: {Object.values(defects).reduce((a, b) => a + (Number(b) || 0), 0)}EA
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentDefectKeys.map((defKey) => {
                const count = Number(defects[defKey]) || 0;
                return (
                  <div
                    key={defKey}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      count > 0
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold truncate pr-1 text-slate-700 dark:text-slate-300">
                      {defKey}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDefectChange(defKey, -1)}
                        className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-slate-300"
                      >
                        -
                      </button>
                      <span className={`w-6 text-center text-xs font-black ${count > 0 ? "text-rose-600 font-mono" : "text-slate-400"}`}>
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDefectChange(defKey, 1)}
                        className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center text-xs font-black cursor-pointer hover:bg-rose-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🛠️ 8. TPM 설비일상점검 시트 (토글) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-teal-600" />
                <span>8. TPM 설비일상점검 시트 (절단기 / 사출기 / 본드로봇):</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTpm(!showTpm)}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                {showTpm ? "▲ 점검표 접기" : "▼ 점검표 확인/입력"}
              </button>
            </div>

            {showTpm && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {MACHINING_TPM_MACHINES.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {m.name}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {MACHINING_TPM_CHECK_ITEMS.map((item) => {
                        const currentVal = tpmChecks[m.id]?.[item.no] || "OK";
                        return (
                          <div key={item.no} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-600 dark:text-slate-400 truncate pr-2">
                              {item.no}. {item.content}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setTpmChecks((prev) => ({
                                    ...prev,
                                    [m.id]: { ...(prev[m.id] || {}), [item.no]: "OK" }
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                                  currentVal === "OK" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                ○ OK
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setTpmChecks((prev) => ({
                                    ...prev,
                                    [m.id]: { ...(prev[m.id] || {}), [item.no]: "NG" }
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                                  currentVal === "NG" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                × NG
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📝 9. 특이사항 및 설비 이상 조치 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>9. 비가동 시간 및 특이사항:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  설비 이상 및 조치사항 (비가동)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="비가동(분)"
                    value={downtimeMinutes || ""}
                    onChange={(e) => setDowntimeMinutes(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
                  />
                  <input
                    type="text"
                    placeholder="설비 이상 내용 및 조치결과 입력"
                    value={machineTrouble}
                    onChange={(e) => setMachineTrouble(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  공정 특이사항 및 전달 메모
                </label>
                <input
                  type="text"
                  placeholder="차기조 인수인계 및 품질 특이사항"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Footer */}
        {/* ================================================================= */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>삼랑진공장 가공동 실시간 동기화</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>저장 완료!</span>
                </>
              ) : isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>작업일보 등록 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachiningWorkReportModal;
