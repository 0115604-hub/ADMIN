import React from "react";
import {
  Settings,
  X,
  Database,
  Layers,
  FileText,
  ShieldCheck,
  Scissors,
  ArrowRight,
  Eye,
  Check,
  FileSpreadsheet,
  Save
} from "lucide-react";
import TemplateAppliedPreviewModal from "../../common/TemplateAppliedPreviewModal";
import {
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES
} from "../../../services/hanulWorkReportService";
import {
  REPORT_MAJOR_CATEGORIES,
  buildHanulProcessSlotKey
} from "../../../services/workReportTemplateService";

/**
 * HanulTemplateAssignmentModal
 * Process slot-based template assignment modal for 9BQC & LQ2A work reports.
 */
export default function HanulTemplateAssignmentModal({
  settingProject,
  setSettingProject,
  allTemplates = [],
  draftProcessSlots = {},
  settingProcessId,
  settingSubSlot,
  setSettingSubSlot,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  handleSwitchSettingProject,
  handleSwitchSettingProcess,
  handleToggleTemplateSelect,
  handleClearCurrentSlotTemplate,
  handleSaveTemplateSetting,
  isSavingAssign,
  currentSlotTemplateId,
  currentSlotTemplateObj,
  previewTemplate,
  setPreviewTemplate,
  filteredModalTemplates = []
}) {
  if (!settingProject) return null;

  return (
    <div
      onClick={() => setSettingProject(null)}
      className="fixed inset-0 z-[250] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white border-2 border-indigo-500/60 rounded-3xl w-full max-w-5xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden text-left"
      >
        {/* 1. 상단 타이틀 + 공정표 (9BQC G/RUN • LQ2a Hood Side / 공정선택 / 단계선택) */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-2xl text-white shadow-md shrink-0 ${
                  settingProject === "9BQC" ? "bg-indigo-600" : "bg-purple-600"
                }`}
              >
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-lg font-black text-white">
                    {settingProject === "9BQC" ? "🚗 9BQC일보설정" : "⚡ LQ2a일보설정"} — 공정표 위치 지정 & 5대 공정 양식 적용
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>5대공정 양식 {allTemplates.length}개</span>
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  ① 아래 공정표에서 양식을 넣을 공정을 먼저 클릭한 뒤 ➔ ② 하단 5대 공정 양식 리스트에서 적용할 양식을 선택하세요.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettingProject(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🌟 [공정표 1단] 차종/품목 큰 카드 (9BQC G/RUN | LQ2a Hood Side) */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/60">
            {HANUL_PROJECTS.map((p) => {
              const isActive = settingProject === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSwitchSettingProject(p.id)}
                  className={`p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/90 border-indigo-300 text-white shadow-md shadow-indigo-950/50 scale-[1.01]"
                      : "bg-white/5 border-slate-700/80 text-slate-300 hover:bg-white/10 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base sm:text-lg">{p.id === "9BQC" ? "🚗" : "⚡"}</span>
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

        {/* 🌟 [공정표 2단] 공정선택 탭 바 (1. 소재준비 / 2. 조인트 / 3. 본드로봇 / 4. 검사) */}
        <div className="px-3.5 sm:px-5 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center justify-between gap-2 min-w-max">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>공정선택:</span>
              </span>
              {(HANUL_PROCESSES[settingProject] || []).map((proc, idx) => {
                const isSelected = settingProcessId === proc.id;
                const procPrefix = `${settingProject}__${proc.id}__`;
                const assignedCountForProc = Object.entries(draftProcessSlots || {}).filter(
                  ([k, v]) => k.startsWith(procPrefix) && Boolean(v)
                ).length;

                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => handleSwitchSettingProcess(proc.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                    }`}
                  >
                    <span className="opacity-75 text-[10px]">{idx + 1}.</span>
                    <span>{proc.id}</span>
                    {assignedCountForProc > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                        ✓{assignedCountForProc}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🌟 [공정표 3단] 세부 단계 / 하위 일보 선택 바 (1단계 TPM -> 2단계 작업일보 등) */}
        <div className="px-3.5 sm:px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-2">
          {settingProcessId === "소재준비" ? (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSettingSubSlot("TPM")}
                className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                  settingSubSlot === "TPM"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1단계: 설비일상 점검 시트 (TPM)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "TPM")] && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                )}
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

              {settingProject === "9BQC" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingSubSlot("정치절단")}
                    className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                      settingSubSlot === "정치절단"
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                        : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>2단계: 작업일보 작성 (정치절단)</span>
                    {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "정치절단")] && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingSubSlot("단컷팅")}
                    className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                      settingSubSlot === "단컷팅"
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                        : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>2단계: 작업일보 작성 (단컷팅)</span>
                    {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "단컷팅")] && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingSubSlot("작업일보")}
                  className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                    settingSubSlot === "작업일보"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>2단계: 작업일보 작성 (소재준비)</span>
                  {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "작업일보")] && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                  )}
                </button>
              )}
            </div>
          ) : settingProcessId === "조인트" ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-purple-300 mr-1">📄 조인트 세부공정:</span>
              {HANUL_JOINT_TYPES.map((jt, idx) => {
                const isSelected = settingSubSlot === jt.id;
                const hasTpl = Boolean(draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "조인트", jt.id)]);
                return (
                  <button
                    key={jt.id}
                    type="button"
                    onClick={() => setSettingSubSlot(jt.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/40"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <span>{idx + 1}. {jt.name}</span>
                    {hasTpl && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>}
                  </button>
                );
              })}
            </div>
          ) : settingProcessId === "검사" ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-emerald-300 mr-1">📄 검사 세부공정:</span>
              {HANUL_INSPECTION_TYPES.map((it, idx) => {
                const isSelected = settingSubSlot === it.id;
                const hasTpl = Boolean(draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "검사", it.id)]);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSettingSubSlot(it.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <span>{idx + 1}. {it.name}</span>
                    {hasTpl && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white text-emerald-950 font-black">양식적용</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingSubSlot("MAIN")}
                className="px-3 py-1.5 rounded-full font-black text-xs bg-indigo-600 text-white border border-indigo-400 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>작업일보 작성 ({settingProcessId})</span>
                {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, settingProcessId, "MAIN")] && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                )}
              </button>
            </div>
          )}

          {/* 현재 선택된 공정 위치의 적용 양식 표시 배지 */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/40">
            <span className="text-[11px] font-black text-indigo-300">
              🎯 선택된 공정 적용 양식:
            </span>
            {currentSlotTemplateObj ? (
              <>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                  ✓ {currentSlotTemplateObj.title}
                </span>
                <button
                  type="button"
                  onClick={handleClearCurrentSlotTemplate}
                  className="px-2 py-0.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-700/60 cursor-pointer"
                >
                  기본양식 복원
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-400">
                기본 내장 양식 (아래 리스트에서 클릭하여 변경)
              </span>
            )}
          </div>
        </div>

        {/* 5대 공정 양식 분류 필터 탭 */}
        <div className="px-3.5 sm:px-5 py-2 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                selectedCategoryFilter === "ALL"
                  ? "bg-cyan-500 text-slate-950 shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              📋 5대 공정 전체 ({allTemplates.length})
            </button>
            {REPORT_MAJOR_CATEGORIES.map((cat) => {
              const count = allTemplates.filter((t) => t.categoryId === cat.id).length;
              const isActive = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-300"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template List Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-900/90">
          {filteredModalTemplates.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold text-sm border border-dashed border-slate-700 rounded-2xl">
              해당 공정 분류에 등록된 양식이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredModalTemplates.map((tpl) => {
                const isChecked = currentSlotTemplateId === tpl.id;
                const catObj =
                  REPORT_MAJOR_CATEGORIES.find((c) => c.id === tpl.categoryId) ||
                  REPORT_MAJOR_CATEGORIES[1];
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleToggleTemplateSelect(tpl.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isChecked
                        ? "bg-indigo-950/90 border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50"
                        : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
                          {catObj.icon} {catObj.name}
                        </span>
                        {tpl.carModel && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                            차종: {tpl.carModel}
                          </span>
                        )}
                        {tpl.processName && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black">
                            공정: {tpl.processName}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-sm text-white truncate">
                        {tpl.title || `${tpl.carModel || ""} ${tpl.partName || "작업일보"}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        품명: {tpl.partName || "G/RUN"} • 양식번호: {tpl.formNo || "705-02"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* 👁️ 미리보기 뱃지 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                        title="이 양식이 현장 작업자 일보에 적용된 실물 서식을 미리 확인합니다"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>미리보기</span>
                      </button>

                      {/* 이 공정에 적용 / 적용됨 뱃지 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTemplateSelect(tpl.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl flex items-center justify-center text-xs font-black transition active:scale-95 cursor-pointer ${
                          isChecked
                            ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                            : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        {isChecked ? "✓ 적용됨" : "이 공정에 적용"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-bold">
            💡 위 공정표에서 <span className="text-indigo-300 font-black">[{settingProcessId} • {settingSubSlot}]</span> 위치를 선택한 뒤 양식을 클릭하고 <span className="text-emerald-400 font-black">[설정 저장]</span>을 누르세요.
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setSettingProject(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isSavingAssign}
              onClick={() => handleSaveTemplateSetting(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>저장 후 해당 공정 일보 열기</span>
            </button>
            <button
              type="button"
              disabled={isSavingAssign}
              onClick={() => handleSaveTemplateSetting(false)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingAssign ? "저장 중..." : "공정별 양식 설정 저장"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 5대 공정 적용 실물 서식 미리보기 모달 */}
      {previewTemplate && (
        <TemplateAppliedPreviewModal
          isOpen={Boolean(previewTemplate)}
          template={previewTemplate}
          slotName={`${settingProcessId || "공정"} • ${settingSubSlot || "세부"}`}
          isApplied={currentSlotTemplateId === previewTemplate.id}
          onApply={(tpl) => handleToggleTemplateSelect(tpl.id)}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
