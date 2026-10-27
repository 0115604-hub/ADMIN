import React from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Scissors,
  Check,
  Layers,
  ChevronDown,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES
} from "../../services/hanulWorkReportService";
import {
  getWorkLogText,
  setWorkLogLanguage,
  SUPPORTED_LANGUAGES
} from "../../services/workLogI18nService";

/**
 * 🌟 1. Modal Header, Project Switcher & Process Navigation Bar
 */
export const HanulReportHeaderNav = ({
  processId,
  setProcessId,
  project,
  setProject,
  subProcess,
  setSubProcess,
  currentStep,
  setCurrentStep,
  isHanulTpmDone,
  currentLang,
  setCurrentLang,
  workerLangInfo,
  onClose,
  handleExcelExport,
  templateAssignments,
  activeAssignedTemplate,
  forceLegacyMode,
  setForceLegacyMode,
  jointType,
  setJointType,
  inspectionType,
  setInspectionType,
  handleSetAllTpmOk
}) => {
  return (
    <>
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
                  한울 가공/협력업체 작업일보
                </h3>
                {processId === "소재준비" ? (
                  <span
                    className={`text-[9px] sm:text-xs px-2 py-0.5 rounded-full font-bold border ${
                      isHanulTpmDone
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    }`}
                  >
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
                  ? currentStep === "tpm"
                    ? getWorkLogText("tpm_sheet_subtitle", currentLang)
                    : "2단계: 9BQC 소재준비 일일 작업일보 작성 (정치절단 / 단컷팅)"
                  : "9BQC G/RUN 및 LQ2a Hood Side 4대 핵심 공정 (소재준비 • 조인트 • 본드로봇 • 검사)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 🌐 국적 및 다국어 선택기 */}
            <div className="flex items-center gap-1.5">
              {workerLangInfo?.isAutoTranslated && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{getWorkLogText("auto_translated_badge", currentLang)}</span>
                </span>
              )}
              <select
                value={currentLang}
                onChange={(e) => {
                  setWorkLogLanguage(e.target.value);
                  setCurrentLang(e.target.value);
                }}
                className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer shadow-xs focus:border-indigo-400"
                title="언어 변경"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.country || l.name})
                  </option>
                ))}
              </select>
            </div>

            {processId === "소재준비" && subProcess === "정치절단" && (
              <button
                type="button"
                onClick={() => {
                  window.open("./oruk_cutting_report_standard.html", "_blank");
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-indigo-100 border border-indigo-400/50 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="표준 A4 양식 (705-02 REV.4) 실물 보기 및 인쇄"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                <span>표준 A4 양식</span>
              </button>
            )}
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
      {/* 🌟 2. 상단 공정표 (공정선택 탭 바 — 항상 표시) */}
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
              const normProj = String(project || "").toUpperCase() === "LQ2A" ? "LQ2A" : "9BQC";
              const procPrefix = `${normProj}__${proc.id}__`;
              const hasAssignedForProc = Object.entries(templateAssignments?.processSlots || {}).some(
                ([k, v]) => k.startsWith(procPrefix) && Boolean(v)
              );
              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => {
                    setProcessId(proc.id);
                    setForceLegacyMode(false);
                    if (proc.id !== "소재준비") {
                      setCurrentStep("report");
                    }
                  }}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs scale-102"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span className="opacity-70 text-[9px] sm:text-[10px]">{idx + 1}.</span>
                  <span>{proc.id}</span>
                  {hasAssignedForProc && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                      양식적용
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {activeAssignedTemplate && (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                  ✓ 적용양식: {activeAssignedTemplate.title}
                </span>
                <button
                  type="button"
                  onClick={() => setForceLegacyMode((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer shrink-0"
                >
                  {forceLegacyMode ? "✓ 설정양식 보기" : "기본양식 보기"}
                </button>
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
                    onChange={(e) => {
                      setJointType(e.target.value);
                      setForceLegacyMode(false);
                    }}
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
                    onChange={(e) => {
                      setInspectionType(e.target.value);
                      setForceLegacyMode(false);
                    }}
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
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2-1. 소재준비 공정일 때: TPM 점검 ➔ 작업일보 2단계 진행 탭 바 (항상 표시) */}
      {/* ========================================================================= */}
      {processId === "소재준비" && (
        <div className="bg-slate-100 dark:bg-slate-800/90 px-3 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCurrentStep("tpm");
                setForceLegacyMode(false);
              }}
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
            {project === "9BQC" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep("report");
                    setSubProcess("정치절단");
                    setForceLegacyMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    currentStep === "report" && subProcess === "정치절단"
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>2단계: 작업일보 작성 (정치절단)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep("report");
                    setSubProcess("단컷팅");
                    setForceLegacyMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    currentStep === "report" && subProcess === "단컷팅"
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>2단계: 작업일보 작성 (단컷팅)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep("report");
                  setForceLegacyMode(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep === "report"
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2단계: 작업일보 작성 (소재준비)</span>
              </button>
            )}
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
    </>
  );
};

export default HanulReportHeaderNav;
