import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  Check,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Layers,
  Wrench,
  CheckCircle2,
  FileText,
  TrendingUp,
  Download,
  Gauge,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Scissors
} from "lucide-react";
import { getKSTDateString } from "../../utils/dateUtils";
import CommonDowntimeDefectPanel from "../common/CommonDowntimeDefectPanel";
import {
  YUSEONG_PROJECTS,
  YUSEONG_PROCESSES,
  YUSEONG_TPM_MACHINES,
  YUSEONG_TPM_CHECK_ITEMS,
  createDefaultYuseongTpmChecks,
  YUSEONG_SPECS,
  YUSEONG_DEFECT_CATEGORIES,
  saveYuseongWorkReport,
  exportYuseongReportToExcel
} from "../../services/yuseongWorkReportService";
import LegoWorkReportBuilder from "../lego/LegoWorkReportBuilder";
import { getAssignedTemplateForWorker } from "../../services/workReportTemplateService";

export const YuseongWorkReportModal = ({
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
  const [isLegoMode, setIsLegoMode] = useState(false);

  // 🌟 유성 관리자가 지정한 5대 공정 작업일보 양식 (JK1, CE1, DT) 자동 연동
  const assignedTemplate = useMemo(() => {
    return getAssignedTemplateForWorker({
      company: "YUSEONG",
      project,
      processId,
      subProcess
    });
  }, [project, processId, subProcess]);

  useEffect(() => {
    if (isOpen && assignedTemplate && !editReport) {
      setIsLegoMode(true);
    }
  }, [isOpen, assignedTemplate, editReport]);
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
  const [downtimeEvents, setDowntimeEvents] = useState(() => Array.isArray(editReport?.downtimeEvents) ? editReport.downtimeEvents : []);
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
      setProduction(editReport.production || { genuineLH: 0, badLH: 0, reworkLH: 0, genuineRH: 0, badRH: 0, reworkRH: 0 });
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

  // Dimension Tolerance Check Helper
  const isDimOk = (val, target, tol) => {
    if (val === undefined || val === null || val === "") return true;
    const num = parseFloat(val);
    if (isNaN(num)) return true;
    if (tol >= 90) return num >= target; // for pulling force
    return num >= target - tol && num <= target + tol;
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* ================================================================= */}
        {/* Modal Header */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  (주)유성 외주가공 작업일보
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-2xs">
                  {currentStep === "tpm" ? "4단계: TPM 설비일상점검" : `5단계: ${project} ${processId} 일보`}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 font-medium">
                {currentStep === "tpm"
                  ? "작업일보 작성 전 5대 설비 35개 항목 일상점검을 먼저 완료해 주십시오."
                  : `${project} 3대 아이템 (${processId}) 실시간 생산 실적 및 치수/불량 등록`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep === "tpm" ? "report" : "tpm")}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{currentStep === "tpm" ? "일보 바로가기" : "TPM 점검표"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Step Indicator Tabs */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => setCurrentStep("tpm")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "tpm"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>4단계: TPM 설비일상점검 (선행)</span>
              {tpmSummary.ngCount > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
              ) : (
                <span className="text-[10px] text-emerald-200 font-mono">OK</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleProceedToReport}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "report"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5단계: {project} 공정별 작업일보</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentStep === "tpm" ? "35개 점검 항목" : "JK1 • CE1 • DT Hood 3대 아이템"}
          </div>
        </div>

        {/* ================================================================= */}
        {/* Modal Body */}
        {/* ================================================================= */}
        <div ref={scrollContainerRef} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {currentStep === "tpm" ? (
            /* 🛠️ 4단계: TPM 설비일상점검 화면 */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
                    4단계: (주)유성 TPM 설비일상점검 체크리스트 (5대 설비)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  작업 개시 전 설비의 안전센서, 비상정지, 칼날 마모, 누유/누기 상태를 확인하십시오.
                </p>
              </div>

              {/* 5대 설비 x 7대 항목 점검표 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3">점검 항목</th>
                        {YUSEONG_TPM_MACHINES.map((m) => (
                          <th key={m.id} className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="font-black">{m.name}</div>
                            <div className="text-[9.5px] font-normal text-slate-400">{m.type}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {YUSEONG_TPM_CHECK_ITEMS.map((item) => (
                        <tr key={item.no} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-400">
                            {item.no}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {item.content}
                          </td>
                          {YUSEONG_TPM_MACHINES.map((m) => {
                            const isOk = (tpmChecks[m.id]?.[item.no] || "OK") === "OK";
                            return (
                              <td key={m.id} className="py-1 px-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTpmCheck(m.id, item.no)}
                                  className={`w-full py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1 ${
                                    isOk
                                      ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                                      : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse border border-rose-500 shadow-md"
                                  }`}
                                  title={`${m.name} - ${item.content} (탭하여 양호/이상 전환)`}
                                >
                                  <span>{isOk ? "○" : "×"}</span>
                                  <span className="text-[10px]">{isOk ? "양호" : "이상"}</span>
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

              {/* 이상 발생시 조치사항 입력란 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 space-y-2.5">
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
                      ✓ 5대 설비 전 항목 양호 상태
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={tpmActionNote}
                  onChange={(e) => setTpmActionNote(e.target.value)}
                  placeholder="설비 이상(작동 불량, 칼날 마모, 비상정지 미작동 등) 발생 시 발견 내용 및 조치결과를 기록해 주십시오."
                  className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* 진행 바 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      점검 결과: 양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (총 35개 검사)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      TPM 설비일상점검 완료 후 [작업일보 작성 계속] 버튼을 눌러 일보를 작성하십시오.
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
                    <span>TPM 점검 완료 ➔ 작업일보 작성 계속</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : isLegoMode && assignedTemplate ? (
            /* 🌟 5대 공정 지정 레고블럭 양식 기록 화면 */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-700/60 flex items-center justify-between text-white flex-wrap gap-2">
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>5대 공정 지정 작업일보 양식 적용</span>
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {assignedTemplate.title} ({project})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLegoMode(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600 transition cursor-pointer"
                >
                  ↩️ 기본 수기양식으로 전환
                </button>
              </div>

              <LegoWorkReportBuilder
                initialTemplateData={assignedTemplate}
                isWorkerRecordingMode={true}
                initialWorkerName={customWorker.trim() || worker}
                initialWorkDate={date}
                onSaveWorkReport={async (reportPayload) => {
                  try {
                    await saveYuseongWorkReport({
                      ...reportPayload,
                      project,
                      worker: customWorker.trim() || worker,
                      date
                    });
                  } catch (e) {}
                  onClose();
                }}
                isEmbedded={true}
              />
            </div>
          ) : (
            /* 🌟 5단계: 유성 3대 아이템 공정별 작업일보 작성 화면 (JK1, CE1, DT Hood) */
            <div className="space-y-3.5">
              {assignedTemplate && (
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                    🧩 관리자가 지정한 5대 공정 양식: <strong>{assignedTemplate.title}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLegoMode(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    지정 양식으로 전환 ➔
                  </button>
                </div>
              )}
              {/* 🚗 1. 차종 선택 (JK1 Part'g, CE1 Part'g, DT Hood) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1. 유성 3대 작업 아이템 선택:</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {YUSEONG_PROJECTS.map((p) => {
                    const isSelected = project === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProject(p.id)}
                        className={`p-3 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-sm font-black">{p.name}</span>
                        <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          {p.partName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ⚙️ 2. 공정 선택 (소재준비 / 조인트 / 본드로봇 / 검사) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. 표준 공정 선택:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {YUSEONG_PROCESSES.map((proc) => {
                    const isSelected = processId === proc.id;
                    return (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => setProcessId(proc.id)}
                        className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        <span className="text-base">{proc.icon}</span>
                        <span className="text-sm font-black">{proc.name}</span>
                        <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          {proc.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

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
              </div>

              {/* 📅 3. 기본 작업 정보 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>3. 기본 작업 정보:</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      근무 형태
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {["주간", "야간"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setShift(s)}
                          className={`py-1.5 text-xs font-black rounded-lg cursor-pointer transition ${
                            shift === s
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      작업자 이름
                    </label>
                    <input
                      type="text"
                      value={customWorker || worker}
                      onChange={(e) => setCustomWorker(e.target.value)}
                      placeholder="작업자 성명"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      작업 시간 (시작~종료)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                      />
                      <span className="text-slate-400">~</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      설비 호기
                    </label>
                    <input
                      type="text"
                      value={machineNo}
                      onChange={(e) => setMachineNo(e.target.value)}
                      placeholder="예: 1호기"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      대차(Dolly) 번호
                    </label>
                    <input
                      type="text"
                      value={dollyNo}
                      onChange={(e) => setDollyNo(e.target.value)}
                      placeholder="대차 번호"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      원재료 LOT
                    </label>
                    <input
                      type="text"
                      value={materialLot}
                      onChange={(e) => setMaterialLot(e.target.value)}
                      placeholder="원재료 LOT"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      칼날 교체 시간
                    </label>
                    <input
                      type="text"
                      value={bladeChangeTime}
                      onChange={(e) => setBladeChangeTime(e.target.value)}
                      placeholder="예: 10:30"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* 📐 4. 초·중·종물 규격 치수 점검 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                    <span>4. 초·중·종물 치수 측정 및 규격 판정 ({project}):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    공차 이탈 시 자동 <span className="text-rose-600 font-black">NG</span> 표시
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

              {/* 📊 5. 생산 실적 수량 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>5. 생산 실적 수량:</span>
                  </span>
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span>총생산: <span className="text-blue-600 font-mono">{totalGross}EA</span></span>
                    <span>양품률: <span className="text-emerald-600 font-mono">{yieldPct}%</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      LH (좌측)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
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

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      RH (우측)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
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
              </div>

              {/* 🚨 6. 세부 불량 내역 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>6. 세부 불량 내역 ({processId}):</span>
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

              {/* 🛠️ 7. TPM 설비일상점검 확인 배지 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      4단계: TPM 설비일상점검 (완료)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (5대 설비 35개 검사 완료)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep("tpm")}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer transition active:scale-95 shadow-xs flex items-center gap-1"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>TPM 점검표 수정/확인</span>
                </button>
              </div>

              {/* ⏱️ 비가동 및 부적합품 발생내역 (유성 전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
              <CommonDowntimeDefectPanel
                title="비가동 및 부적합품 발생내역"
                plantLabel="유성"
                unitLabel="부적합량(EA)"
                events={downtimeEvents}
                onChangeEvents={setDowntimeEvents}
                onSyncSummary={({ totalMinutes, summaryText }) => {
                  setDowntimeMinutes(totalMinutes);
                  if (summaryText) setMachineTrouble(summaryText);
                }}
              />

              {/* 📝 8. 특이사항 및 설비 이상 조치 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>8. 비가동 시간 및 특이사항:</span>
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
          )}
        </div>

        {/* ================================================================= */}
        {/* Footer */}
        {/* ================================================================= */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
            <span>(주)유성 외주가공 실시간 동기화</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              닫기
            </button>

            {currentStep === "tpm" ? (
              <button
                type="button"
                onClick={handleProceedToReport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span>TPM 점검 완료 ➔ 작업일보 작성 계속</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep("tpm")}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-300 dark:border-indigo-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>TPM 점검표</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YuseongWorkReportModal;
