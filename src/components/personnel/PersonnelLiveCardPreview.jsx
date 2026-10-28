import React from "react";
import {
  Sparkles,
  User,
  Star,
  Search,
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate,
  getNationalityMeta
} from "../../services/personnelCardService.js";

/**
 * PersonnelLiveCardPreview
 * Sleek, real-time manufacturing field employee ID card preview
 */
export default function PersonnelLiveCardPreview({
  formData = {},
  companyTheme = {},
  currentSkillMeta = {},
  currentInspectorMeta = {},
  isInspectionSelected = false
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="font-black text-xs text-purple-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>실시간 인사카드 미리보기</span>
        </span>
        <span className="text-[10.5px] text-slate-400 font-mono">ID CARD PREVIEW</span>
      </div>

      {/* The Sleek ID Card Component */}
      <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-purple-500/80 shadow-2xl shadow-purple-950/50 relative overflow-hidden space-y-3.5 text-white">
        {/* Background Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${companyTheme.badge || ""}`}>
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

        {/* Profile Main Row (Photo + Name + Dept + Position) */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar / Photo */}
          <div className="shrink-0 relative">
            {formData.photoUrl ? (
              <img
                src={formData.photoUrl}
                alt={formData.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-purple-400 shadow-md shadow-purple-950/60"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400/60 flex flex-col items-center justify-center shadow-md">
                <User className="w-6 h-6 text-purple-300" />
                <span className="text-[9.5px] font-black text-purple-300 mt-0.5">{formData.position}</span>
              </div>
            )}
            {formData.photoUrl && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold" title="사진 인증 완료">
                ✓
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                {formData.name || "근로자"}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-purple-950 text-purple-300 border border-purple-800">
                {formData.position || "사원"}
              </span>
              {formData.nationality && formData.nationality !== "대한민국" && (
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <span>{getNationalityMeta(formData.nationality).flag}</span>
                  <span>{formData.nationality === "기타" ? (formData.nationalityOther || "기타") : formData.nationality}</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="font-bold text-slate-300">{formData.dept}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">{formData.mainProcess} 공정</span>
            </div>
          </div>
        </div>

        {/* 숙련등급 & 별점 표시 영역 */}
        <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 space-y-1 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400">현장 숙련도 등급</span>
            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${currentSkillMeta.badgeClass || ""}`}>
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

        {/* 검사원 등급 뱃지 (검사 공정 해당 시 실시간 표시) */}
        {isInspectionSelected && (
          <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-2.5 rounded-xl border border-emerald-500/70 space-y-1 relative z-10 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-emerald-300 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>품질 검사원 자격 등급</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${currentInspectorMeta.badgeClass || ""}`}>
                {currentInspectorMeta.shortGrade}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate">
              자격: {currentInspectorMeta.desc}
            </div>
          </div>
        )}

        {/* 2-Column Grid: [입사일 / 근속기간 (자동계산)] & [주공정 / 공정년차 (자동계산)] */}
        <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10">
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">입사일 / 근속기간</span>
            <div className="font-bold text-white font-mono text-[11px]">
              {formData.joinDate}
            </div>
            <div className="text-emerald-400 font-black text-xs">
              {formData.tenure || calculateTenureFromJoinDate(formData.joinDate)}
            </div>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">주공정 / 공정년차</span>
            <div className={`font-black text-xs ${formData.mainProcess === "관리자" ? "text-indigo-300 font-black" : "text-amber-300"}`}>
              {formData.mainProcess}
            </div>
            <div className="text-cyan-300 font-black text-[11.5px]">
              {formData.processYear || calculateProcessYearFromJoinDate(formData.joinDate)}
            </div>
          </div>
        </div>

        {/* 다기능공 뱃지 & 지원 공정 목록 */}
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
              <span className="text-[10px] text-slate-400 self-center">지원공정:</span>
              {formData.subProcesses.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70 text-[10px] font-bold"
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
  );
}
