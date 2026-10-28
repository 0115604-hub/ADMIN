import React from "react";
import { Star, Search, Check, CheckCircle2 } from "lucide-react";
import {
  STANDARD_PROCESS_LIST,
  SKILL_LEVEL_META,
  INSPECTOR_GRADES
} from "../../services/personnelCardService.js";

/**
 * PersonnelProcessSkillSection
 * Main process selector, 1-5 star skill rating, and QA inspector grade accreditation
 */
export default function PersonnelProcessSkillSection({
  formData = {},
  handleChange,
  hoverStar = 0,
  setHoverStar,
  currentSkillMeta = {},
  currentInspectorMeta = {},
  isInspectionSelected = false
}) {
  return (
    <>
      {/* Section 2: 주 담당 공정 (관리자 포함 7대 공정) & 숙련등급 별점 */}
      <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <span className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>주 담당 공정 & 숙련등급 평가</span>
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${currentSkillMeta.badgeClass || ""}`}>
            {currentSkillMeta.grade}
          </span>
        </div>

        {/* 주 담당 공정 선택 버튼 그룹 */}
        <div>
          <div className="flex items-center justify-between pb-1.5">
            <label className="text-[11px] font-bold text-slate-400">
              주 담당 공정 선택 (표준 제조 및 관리 공정):
            </label>
            <span className="text-[10.5px] text-amber-400 font-bold">
              현재: {formData.mainProcess}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {STANDARD_PROCESS_LIST.map((proc) => {
              const isSelected = formData.mainProcess === proc;
              return (
                <button
                  key={proc}
                  type="button"
                  onClick={() => handleChange("mainProcess", proc)}
                  className={`py-2 px-1 rounded-xl font-black text-xs transition-all cursor-pointer text-center ${
                    isSelected
                      ? proc === "관리자"
                        ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-102 font-black"
                        : "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-102 font-black"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700 font-bold"
                  }`}
                >
                  {proc}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1~5 Star Rating Picker */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-black text-slate-200">숙련 등급 별점 선택 (1~5성)</span>
            <span className="text-[10.5px] text-amber-400 font-bold">
              ★ 클릭하여 숙련도를 설정하세요
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const isFilled = starIdx <= (hoverStar || formData.skillLevel);
              return (
                <button
                  key={starIdx}
                  type="button"
                  onMouseEnter={() => setHoverStar && setHoverStar(starIdx)}
                  onMouseLeave={() => setHoverStar && setHoverStar(0)}
                  onClick={() => handleChange("skillLevel", starIdx)}
                  className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-800 transition-transform active:scale-90 cursor-pointer group"
                  title={`Lv.${starIdx} ${SKILL_LEVEL_META[starIdx]?.grade}`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      isFilled
                        ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
            <div className="ml-2 pl-3 border-l border-slate-800">
              <span className="font-mono font-black text-base text-amber-400 block">
                Lv.{formData.skillLevel}
              </span>
              <span className="text-[10.5px] text-slate-400 font-bold">
                {SKILL_LEVEL_META[formData.skillLevel]?.shortGrade}
              </span>
            </div>
          </div>

          {/* Level Description */}
          <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
            💡 <strong className="text-slate-300">{currentSkillMeta.grade}:</strong> {currentSkillMeta.desc}
          </div>
        </div>
      </div>

      {/* Section 3: 검사 공정 전용 - 검사원 등급 평가 */}
      {isInspectionSelected && (
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-emerald-900/60">
            <span className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>🔍 품질 검사원 자격 등급 평가 (검사 공정 전용)</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${currentInspectorMeta.badgeClass || ""}`}>
              {currentInspectorMeta.grade}
            </span>
          </div>

          {/* Inspector Grade Selector Cards */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              검사원 자격 등급 선택 (S/A/B 등급):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INSPECTOR_GRADES.map((ig) => {
                const isSelected = formData.inspectorGrade === ig.grade;
                return (
                  <div
                    key={ig.grade}
                    onClick={() => handleChange("inspectorGrade", ig.grade)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? `${ig.badgeClass} shadow-md shadow-slate-950/80`
                        : "bg-slate-900/90 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-black text-xs ${isSelected ? ig.color : "text-white"}`}>
                        {ig.grade}
                      </span>
                      {isSelected && <Check className={`w-3.5 h-3.5 ${ig.color}`} />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {ig.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 검사원 취득일자/세부 권한 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[10.5px] font-bold text-slate-400 block pb-1">검사원 자격 취득/인증일자</label>
              <input
                type="date"
                value={formData.inspectorCertDate || formData.joinDate || ""}
                onChange={(e) => handleChange("inspectorCertDate", e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-800/80 focus:border-emerald-400 text-white text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-400 block pb-1">검사원 세부 판정 권한</label>
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{currentInspectorMeta.desc?.split(",")[0] || "공정 자주검사 및 외관 판정"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
