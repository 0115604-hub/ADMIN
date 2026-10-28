import React from "react";
import { Zap, Sparkles, FileCheck } from "lucide-react";
import { STANDARD_PROCESS_LIST } from "../../services/personnelCardService.js";

/**
 * PersonnelMultiSkillSection
 * Multi-skill worker designation, cross-training subprocesses multi-select, and notes
 */
export default function PersonnelMultiSkillSection({
  formData = {},
  handleChange,
  handleToggleSubProcess
}) {
  return (
    <>
      {/* Section 4: 다기능공 (Multi-Skill) & 지원 공정 다중 선택 */}
      <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <span className="font-black text-xs sm:text-sm text-cyan-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>다기능공 (Multi-Skill) & 지원 공정 다중 선택</span>
          </span>
          {formData.isMultiSkill ? (
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center gap-1 shadow-sm animate-pulse">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>⚡ 다기능공 지정됨</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              단일 공정
            </span>
          )}
        </div>

        {/* Multi-skill toggle switch */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <span className="font-black text-xs text-white block">다기능공 (Multi-Skilled Worker) 지정</span>
            <span className="text-[10.5px] text-slate-400">주공정({formData.mainProcess}) 외 다른 공정을 지원 가능한 근로자</span>
          </div>
          <button
            type="button"
            onClick={() => handleChange("isMultiSkill", !formData.isMultiSkill)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              formData.isMultiSkill ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                formData.isMultiSkill ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 지원 공정 다중 선택 버튼 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 block">
              지원 가능 공정 선택 (다중 선택 가능):
            </label>
            <span className="text-[10.5px] text-cyan-400 font-bold">
              {(formData.subProcesses || []).length}개 공정 선택됨
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {STANDARD_PROCESS_LIST.map((proc) => {
              const isSelected = (formData.subProcesses || []).includes(proc);
              const isMain = formData.mainProcess === proc;
              return (
                <button
                  key={proc}
                  type="button"
                  disabled={isMain}
                  onClick={() => handleToggleSubProcess(proc)}
                  className={`py-2 px-1 rounded-xl font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isMain
                      ? "bg-amber-950/60 text-amber-300 border border-amber-700/60 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "bg-cyan-600 text-white shadow-xs ring-2 ring-cyan-400 font-black scale-102"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  {isMain ? (
                    <>
                      <span className="text-[9.5px] text-amber-400">★ 주공정</span>
                      <span>{proc}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px]">{isSelected ? "✓ 지원" : "+"}</span>
                      <span>{proc}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 5: 특기사항 및 평가 메모 */}
      <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
        <label className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>특기사항 및 현장 평가 메모</span>
        </label>
        <textarea
          rows={2}
          value={formData.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="예: 공정 트러블 조치 능숙, 코팅/사상/검사 공정 원활한 백업 가능"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-400 placeholder:text-slate-500"
        />
      </div>
    </>
  );
}
