import React from "react";
import { ShieldCheck } from "lucide-react";
import { HANUL_WORKERS_MASTER } from "../../services/hanulWorkReportService";
import { translateTerm } from "../../services/workLogI18nService";

/**
 * 🌟 [개개인별 작업일보 및 초/중/종물 분할접속 알림 바]
 */
export const HanulReportAssignedWorkerBanner = ({
  currentLang,
  effectiveWorkerName,
  date,
  setDate,
  shift,
  activeAssignedTemplate,
  existingWorkerReport,
  processId,
  setCurrentStep,
  tpmI18n,
  worker,
  setWorker,
  setCustomWorker
}) => {
  return (
    <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/60 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shrink-0 shadow-xs">
          👤
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-white">
              {translateTerm("작업자:", currentLang)}{" "}
              <span className="text-emerald-300 font-extrabold">
                {effectiveWorkerName || translateTerm("미선택", currentLang)}
              </span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-800/80 text-indigo-200 border border-indigo-600/50">
              {date} ({shift})
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/80 text-cyan-300 border border-indigo-400/50 font-black">
              🎯 {translateTerm("목표(오더)", currentLang)}:{" "}
              {(
                activeAssignedTemplate?.targetQty ||
                activeAssignedTemplate?.orderQty ||
                350
              ).toLocaleString()}{" "}
              EA
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black">
              🔒 {translateTerm("SPEC 고정 · 기록 전용", currentLang)}
            </span>
            {existingWorkerReport ? (
              <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-black animate-pulse flex items-center gap-1">
                <span>🔄 {translateTerm("작성 중인 일보 불러옴", currentLang)}</span>
                <span className="text-[9.5px] text-emerald-200">
                  ({translateTerm("초·중·종물 이어서 입력 가능", currentLang)})
                </span>
              </span>
            ) : (
              <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-black">
                ✨ {translateTerm("개별 신규 일보 작성", currentLang)}
              </span>
            )}
            {processId === "소재준비" && (
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-400/50 font-black flex items-center gap-1 cursor-pointer transition active:scale-95"
                title="1단계 TPM 점검표 화면으로 이동"
              >
                <ShieldCheck className="w-3 h-3 text-indigo-300" />
                <span>{tpmI18n?.backToTpm || "TPM 점검표로 돌아가기"}</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            💡{" "}
            {translateTerm(
              "같은 공정이라도 작업자 개개인별로 독립된 일보가 기록되며, 초물·중물·종물 측정 시 하루 3회 이상 접속하여도 이전 측정값이 보존됩니다.",
              currentLang
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 작업자 빠른 변경 */}
        <select
          value={worker}
          onChange={(e) => {
            setWorker(e.target.value);
            if (e.target.value !== "직접입력") setCustomWorker("");
          }}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
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
          <option value="직접입력">✏️ {translateTerm("직접 입력", currentLang)}</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
};

export default HanulReportAssignedWorkerBanner;
