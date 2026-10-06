import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  Printer,
  Sparkles,
  Star,
  Award,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Factory,
  User,
  Shield,
  Layers,
  FileCheck,
  Tag,
  Briefcase,
  AlertCircle
} from "lucide-react";
import {
  STANDARD_PROCESS_LIST,
  SKILL_LEVEL_META,
  getSkillMeta,
  calculateTenureFromJoinDate,
  getWorkerPersonnelCard
} from "../services/personnelCardService.js";
import { COMPANY_THEMES, cleanCompanyName, normalizeDept } from "../services/overtimeSmartService.js";

export default function PersonnelCardModal({
  isOpen,
  onClose,
  worker,
  workerIndex,
  onSave
}) {
  if (!isOpen || !worker) return null;

  // Initial Card State
  const initialCard = useMemo(() => {
    return getWorkerPersonnelCard(worker, workerIndex);
  }, [worker, workerIndex]);

  const [formData, setFormData] = useState(initialCard);
  const [hoverStar, setHoverStar] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState("form"); // "form" or "preview"

  // Sync state if worker changes
  useEffect(() => {
    setFormData(getWorkerPersonnelCard(worker, workerIndex));
  }, [worker, workerIndex]);

  // Handle Input Changes
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // 입사일 변경 시 근속기간 자동 계산
      if (field === "joinDate") {
        next.tenure = calculateTenureFromJoinDate(value);
      }
      // 숙련등급 변경 시 등급 라벨 자동 업데이트
      if (field === "skillLevel") {
        next.skillGrade = getSkillMeta(value).grade;
      }
      return next;
    });
  };

  // Toggle Sub-Process Tag
  const handleToggleSubProcess = (processName) => {
    setFormData((prev) => {
      const current = prev.subProcesses || [];
      const exists = current.includes(processName);
      const next = exists
        ? current.filter((p) => p !== processName)
        : [...current, processName];
      return {
        ...prev,
        subProcesses: next,
        isMultiSkill: next.length > 0 ? true : prev.isMultiSkill
      };
    });
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("인사카드 저장 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Company Theme & Skill Meta
  const companyTheme = COMPANY_THEMES[cleanCompanyName(formData.company)] || COMPANY_THEMES["오륙"];
  const currentSkillMeta = getSkillMeta(formData.skillLevel);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border-2 border-purple-500 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] cursor-default"
      >
        {/* ========================================================================= */}
        {/* 1. Modal Top Bar */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 sm:p-2 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40">
              <Award className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h2 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>제조현장 인사카드 작성 및 관리</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {formData.name} ({formData.company})
                </span>
              </h2>
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex sm:hidden items-center bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
            <button
              onClick={() => setActiveMobileView("form")}
              className={`px-2 py-1 rounded-md ${activeMobileView === "form" ? "bg-purple-600 text-white" : "text-slate-400"}`}
            >
              작성
            </button>
            <button
              onClick={() => setActiveMobileView("preview")}
              className={`px-2 py-1 rounded-md ${activeMobileView === "preview" ? "bg-purple-600 text-white" : "text-slate-400"}`}
            >
              미리보기
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. Modal Body: 2-Column Grid (Left: Edit Form, Right: Live Personnel Card) */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 text-xs">
          {/* 📝 LEFT COLUMN: Interactive Edit Form (7 cols) */}
          <div className={`lg:col-span-7 space-y-4 ${activeMobileView === "preview" ? "hidden sm:block" : "block"}`}>
            {/* Section 1: 기본 인적사항 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-purple-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>기본 인적사항 및 소속</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">사번: {formData.empNo}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">성명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">사번 (Emp No)</label>
                  <input
                    type="text"
                    value={formData.empNo}
                    onChange={(e) => handleChange("empNo", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">소속 업체</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">부서</label>
                  <select
                    value={formData.dept}
                    onChange={(e) => handleChange("dept", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    <option value="압출동">압출동</option>
                    <option value="가공동">가공동</option>
                    <option value="관리부">관리부</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">직위/직급</label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    <option value="작업원">작업원</option>
                    <option value="조장">조장</option>
                    <option value="반장">반장</option>
                    <option value="선임">선임</option>
                    <option value="책임">책임</option>
                    <option value="주임">주임</option>
                    <option value="대리">대리</option>
                    <option value="과장">과장</option>
                    <option value="차장">차장</option>
                    <option value="부장">부장</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">배속 라인/세부공정</label>
                  <input
                    type="text"
                    placeholder="예: 2호기 라인"
                    value={formData.line}
                    onChange={(e) => handleChange("line", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* 입사일자 & 근속기간 & 총 제조경력 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>입사일자</span>
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleChange("joinDate", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>근속기간 (자동계산)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tenure}
                    onChange={(e) => handleChange("tenure", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-emerald-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>총 제조경력</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 총 8년"
                    value={formData.career}
                    onChange={(e) => handleChange("career", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: 주공정 및 숙련등급 (1~5 별점 피커) */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>주공정 & 숙련등급 평가</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${currentSkillMeta.badgeClass}`}>
                  {currentSkillMeta.grade}
                </span>
              </div>

              {/* 주공정 & 공정년차 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">주 담당 공정 *</label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.mainProcess}
                      onChange={(e) => handleChange("mainProcess", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs font-black"
                    >
                      {STANDARD_PROCESS_LIST.map((proc) => (
                        <option key={proc} value={proc}>{proc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">해당 공정 경력/년차</label>
                  <input
                    type="text"
                    placeholder="예: 5년차"
                    value={formData.processYear}
                    onChange={(e) => handleChange("processYear", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* ⭐ 1~5 Star Rating Picker (인터랙티브 별점) */}
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
                        onMouseEnter={() => setHoverStar(starIdx)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => handleChange("skillLevel", starIdx)}
                        className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-800 transition-transform active:scale-90 cursor-pointer group"
                        title={`Lv.${starIdx} ${SKILL_LEVEL_META[starIdx].grade}`}
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

            {/* Section 3: 다기능공 (Multi-Skill) & 지원 가능 공정 태그 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>다기능공 (Multi-Skill) 지정 & 지원 가능 공정</span>
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
                  <span className="font-black text-xs text-white block">다기능공 (Multi-Skilled Worker) 여부</span>
                  <span className="text-[10.5px] text-slate-400">주공정 외 2개 이상의 생산 라인/공정을 능숙하게 백업 지원 가능한 근로자</span>
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

              {/* Sub-process selection pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">
                  지원 가능 서브 공정 선택 (클릭하여 추가/해제):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_PROCESS_LIST.map((proc) => {
                    const isSelected = (formData.subProcesses || []).includes(proc);
                    const isMain = formData.mainProcess === proc;
                    return (
                      <button
                        key={proc}
                        type="button"
                        disabled={isMain}
                        onClick={() => handleToggleSubProcess(proc)}
                        className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                          isMain
                            ? "bg-amber-950 text-amber-300 border border-amber-700/60 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-cyan-600 text-white shadow-xs ring-1 ring-cyan-400"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"
                        }`}
                      >
                        {isMain ? (
                          <span>★ {proc} (주공정)</span>
                        ) : (
                          <>
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{proc}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: 특기사항 및 현장 평가 메모 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>특기사항 및 현장 평가 메모</span>
              </label>
              <textarea
                rows={2}
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="예: 설비 셋업 및 트러블 대응 능숙, 포밍/후가공 전 공정 백업 가능"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* 🪪 RIGHT COLUMN: Live Real-Time Personnel Card Preview (5 cols) */}
          <div className={`lg:col-span-5 space-y-3 ${activeMobileView === "form" ? "hidden sm:block" : "block"}`}>
            <div className="flex items-center justify-between px-1">
              <span className="font-black text-xs text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>실시간 인사카드 미리보기</span>
              </span>
              <span className="text-[10.5px] text-slate-400 font-mono">ID CARD PREVIEW</span>
            </div>

            {/* ⭐ The Sleek ID Card Component */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-purple-500/80 shadow-2xl shadow-purple-950/50 relative overflow-hidden space-y-3.5 text-white">
              {/* Background Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${companyTheme.badge}`}>
                    {formData.company}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    제조현장 인사카드
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 tracking-wider">
                  NO. {formData.empNo || "250101"}
                </div>
              </div>

              {/* Profile Main Row */}
              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar Placeholder */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400/60 flex flex-col items-center justify-center shrink-0 shadow-md">
                  <User className="w-6 h-6 text-purple-300" />
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">{formData.position}</span>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                      {formData.name || "근로자"}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {formData.position || "작업원"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{formData.dept}</span>
                    <span>•</span>
                    <span className="text-slate-300">{formData.line || formData.dept}</span>
                  </div>
                </div>
              </div>

              {/* 숙련등급 & 별점 표시 영역 */}
              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 space-y-1 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400">현장 숙련도 등급</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${currentSkillMeta.badgeClass}`}>
                    {currentSkillMeta.grade}
                  </span>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        starIdx <= formData.skillLevel
                          ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                          : "text-slate-700"
                      }`}
                    />
                  ))}
                  <span className="text-[10.5px] text-slate-400 ml-1.5 font-bold truncate">
                    {currentSkillMeta.desc}
                  </span>
                </div>
              </div>

              {/* 2-Column Career & Process Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10">
                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 block">입사일 / 근속기간</span>
                  <div className="font-bold text-white pt-0.5">
                    {formData.joinDate}
                  </div>
                  <div className="text-emerald-400 font-black text-[10.5px]">
                    {formData.tenure}
                  </div>
                </div>

                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 block">주공정 / 경력년차</span>
                  <div className="font-bold text-amber-300 pt-0.5">
                    {formData.mainProcess}
                  </div>
                  <div className="text-slate-300 font-bold text-[10.5px]">
                    {formData.processYear || "3년차"}
                  </div>
                </div>
              </div>

              {/* 다기능공 뱃지 & 지원 가능 공정 태그 */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400">다기능공 여부</span>
                  {formData.isMultiSkill ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center gap-1 shadow-xs">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>⚡ 다기능공 (Multi-Skill)</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      단일 공정
                    </span>
                  )}
                </div>

                {formData.isMultiSkill && (formData.subProcesses || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 mr-1 self-center">지원공정:</span>
                    {formData.subProcesses.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70 text-[10px] font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 특기사항 메모 */}
              {formData.notes && (
                <div className="text-[10.5px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 relative z-10">
                  <span className="text-slate-500 font-bold block pb-0.5">평가 메모:</span>
                  <span className="text-slate-300">{formData.notes}</span>
                </div>
              )}

              {/* Card Footer Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[9.5px] text-slate-500 font-mono relative z-10">
                <span>(주)오륙 제조품질 관리팀</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>인사카드 인증 완료</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Modal Footer Actions */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            취소
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>인쇄</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "저장 중..." : "💾 인사카드 작성 및 저장"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
