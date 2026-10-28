import React, { useState, useMemo } from "react";
import { Settings, Check, Eye } from "lucide-react";
import { YUSEONG_PROCESSES } from "../../../services/yuseongWorkReportService";
import {
  REPORT_MAJOR_CATEGORIES,
  buildHanulProcessSlotKey,
  saveHanulTemplateAssignment
} from "../../../services/workReportTemplateService";
import TemplateAppliedPreviewModal from "../../common/TemplateAppliedPreviewModal";

/**
 * YuseongTemplateAssignmentModal
 * 유성 (JK1, CE1, DT HOOD) 공정표 기반 5대 공정 양식 설정 모달
 */
export default function YuseongTemplateAssignmentModal({
  isOpen,
  onClose,
  initialProject = "JK1",
  allTemplates = [],
  templateAssignments = {},
  onOpenReportModal,
  onToast
}) {
  const [settingProject, setSettingProject] = useState(initialProject || "JK1");
  const [settingProcessId, setSettingProcessId] = useState(
    (YUSEONG_PROCESSES || [])[0]?.id || "소재준비"
  );
  const [settingSubSlot, setSettingSubSlot] = useState("MAIN");
  const [draftProcessSlots, setDraftProcessSlots] = useState(
    () => ({ ...(templateAssignments?.processSlots || {}) })
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const handleSwitchSettingProject = (projKey) => {
    const targetProj = String(projKey || "JK1").toUpperCase();
    const firstProc = (YUSEONG_PROCESSES || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot("MAIN");
  };

  const handleSwitchSettingProcess = (procId) => {
    setSettingProcessId(procId);
    setSettingSubSlot("MAIN");
  };

  const currentSlotKey = buildHanulProcessSlotKey(settingProject, settingProcessId, settingSubSlot);
  const currentSlotTemplateId = currentSlotKey ? draftProcessSlots?.[currentSlotKey] || null : null;
  const currentSlotTemplateObj = (allTemplates || []).find((t) => t.id === currentSlotTemplateId) || null;

  const handleToggleTemplateSelect = (tplId) => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      if (next[currentSlotKey] === tplId) {
        delete next[currentSlotKey];
      } else {
        next[currentSlotKey] = tplId;
      }
      return next;
    });
  };

  const handleClearSlotTemplate = () => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      delete next[currentSlotKey];
      return next;
    });
  };

  const handleSaveProcessSlotAssignment = async (openModalAfter = false) => {
    if (!settingProject) return;
    setIsSavingAssign(true);
    try {
      const targetProj = settingProject;
      const targetProc = settingProcessId;
      const projPrefix = `${targetProj}__`;
      const assignedIdsForProj = Object.entries(draftProcessSlots || {})
        .filter(([k, v]) => k.startsWith(projPrefix) && Boolean(v))
        .map(([, v]) => v);

      await saveHanulTemplateAssignment(targetProj, assignedIdsForProj, draftProcessSlots);
      if (onToast) {
        onToast(`✅ [유성 ${targetProj} • ${targetProc}] 공정에 선택한 작업일보 양식이 저장 적용되었습니다!`);
      }
      onClose();
      if (openModalAfter && onOpenReportModal) {
        onOpenReportModal(targetProj, targetProc);
      }
    } catch (e) {
      console.error(e);
      alert("양식 설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingAssign(false);
    }
  };

  const filteredCatalogTemplates = useMemo(() => {
    let list = allTemplates || [];
    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((t) => t.categoryId === selectedCategoryFilter);
    }
    return list;
  }, [allTemplates, selectedCategoryFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-indigo-500 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>
                  유성 [{settingProject === "DT" ? "DT HOOD" : settingProject}] 공정표 기반 5대 공정 양식 설정
                </span>
              </h3>
              <p className="text-[11px] text-indigo-300">
                ① 공정을 선택한 후 ➔ ② 하단 5대 양식 보관함에서 원하는 양식을 선택하여 매핑하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* 차종 스위치 (JK1 / CE1 / DT) */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400">설정 아이템:</span>
            {["JK1", "CE1", "DT"].map((pk) => (
              <button
                key={pk}
                type="button"
                onClick={() => handleSwitchSettingProject(pk)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  settingProject === pk
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {pk === "JK1" ? "🚗 JK1 Part'g" : pk === "CE1" ? "🚙 CE1 Part'g" : "⚡ DT Hood"}
              </button>
            ))}
          </div>

          {/* 공정 선택 버튼 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-300">1단계: 양식을 지정할 공정 선택</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {YUSEONG_PROCESSES.map((proc) => {
                const isSelected = settingProcessId === proc.id;
                const slotKey = buildHanulProcessSlotKey(settingProject, proc.id, settingSubSlot);
                const hasTpl = Boolean(draftProcessSlots?.[slotKey]);

                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => handleSwitchSettingProcess(proc.id)}
                    className={`p-2.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-400/40"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white">{proc.name}</span>
                      {hasTpl && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">
                          양식적용
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{proc.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 현재 슬롯에 적용된 양식 확인 */}
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-indigo-300">
                현재 선택 슬롯:{" "}
                <span className="text-white font-black">
                  [{settingProject} • {settingProcessId}]
                </span>
              </div>
              <div className="text-xs font-black text-white truncate mt-0.5">
                적용 양식:{" "}
                {currentSlotTemplateObj
                  ? `📄 ${currentSlotTemplateObj.title} (${currentSlotTemplateObj.formNo || "표준양식"})`
                  : "기본 내장 양식 사용 중"}
              </div>
            </div>
            {currentSlotTemplateObj && (
              <button
                type="button"
                onClick={handleClearSlotTemplate}
                className="px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold shrink-0"
              >
                양식 해제
              </button>
            )}
          </div>

          {/* 5대 공정 양식 보관함에서 선택 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300">2단계: 적용할 5대 공정 양식 선택</label>
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter("ALL")}
                  className={`px-2 py-0.5 rounded-lg font-bold ${
                    selectedCategoryFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  전체
                </button>
                {REPORT_MAJOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap ${
                      selectedCategoryFilter === cat.id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredCatalogTemplates.map((tpl) => {
                const isSelected = currentSlotTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleToggleTemplateSelect(tpl.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-950/50 ring-2 ring-emerald-400/40"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-900/70 text-indigo-300">
                        {tpl.categoryName || "양식"}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> 선택됨
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-xs text-white mt-1 truncate">{tpl.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{tpl.processName || tpl.carModel || "-"}</span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(tpl);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                          title="이 양식이 현장 작업자 일보에 적용된 실물 서식을 미리 확인합니다"
                        >
                          <Eye className="w-3 h-3" />
                          <span>미리보기</span>
                        </button>
                        <span className="font-mono text-slate-500">{tpl.formNo || ""}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => handleSaveProcessSlotAssignment(false)}
            disabled={isSavingAssign}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md"
          >
            {isSavingAssign ? "저장 중..." : "설정 저장 완료"}
          </button>
        </div>
      </div>

      {/* 5대 공정 적용 실물 서식 미리보기 모달 */}
      {previewTemplate && (
        <TemplateAppliedPreviewModal
          isOpen={Boolean(previewTemplate)}
          template={previewTemplate}
          slotName={`${settingProject || "유성"} • ${settingProcessId || "공정"}`}
          isApplied={currentSlotTemplateId === previewTemplate.id}
          onApply={(tpl) => handleToggleTemplateSelect(tpl.id)}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
