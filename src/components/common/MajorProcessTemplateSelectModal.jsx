import React, { useState, useEffect, useMemo } from "react";
import {
  Settings,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  REPORT_MAJOR_CATEGORIES,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  getLocalHanulTemplateAssignments,
  subscribeHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey,
  saveWorkReportTemplate
} from "../../services/workReportTemplateService";
import { LegoTemplateEditorModal } from "../WorkReportTemplateManagerView";

/**
 * 🌟 5대 공정 양식 선택 및 매핑 공용 모달
 * 설유철(압출) / 부림텍(외주가공) 등 공정별 작업일보 실시간 현황에서
 * 5대 공정 표준 양식 리스트를 확인하고 선택/매핑 및 전체보기(편집) 지원
 */
export const MajorProcessTemplateSelectModal = ({
  isOpen,
  onClose,
  title = "5대 공정 작업일보 양식 설정",
  subtitle = "공정 및 라인별 적용할 표준 5대 공정 양식을 선택 및 매핑하세요.",
  companyKey = "EXTRUSION",
  companyName = "압출동",
  slots = [],
  defaultCategoryId = "ALL",
  onApplyAndOpenReport = null
}) => {
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [selectedSlotId, setSelectedSlotId] = useState(() => slots[0]?.id || "ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(defaultCategoryId);
  const [draftProcessSlots, setDraftProcessSlots] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Sync templates & assignments
  useEffect(() => {
    const unsubTpl = subscribeWorkReportTemplates((list) => {
      setAllTemplates(list || []);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((assigns) => {
      setTemplateAssignments(assigns || {});
      setDraftProcessSlots({ ...(assigns?.processSlots || {}) });
    });
    return () => {
      unsubTpl();
      unsubAssign();
    };
  }, []);

  // Set default slot if slot list changes
  useEffect(() => {
    if (slots && slots.length > 0 && !slots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(slots[0].id);
    }
  }, [slots, selectedSlotId]);

  if (!isOpen) return null;

  const currentSlotKey = buildHanulProcessSlotKey(companyKey, selectedSlotId, "MAIN");
  const currentSlotTemplateId = draftProcessSlots?.[currentSlotKey] || null;
  const currentSlotTemplateObj = (allTemplates || []).find((t) => t.id === currentSlotTemplateId);
  const activeSlotObj = slots.find((s) => s.id === selectedSlotId) || slots[0];

  // Filter templates by category
  const filteredTemplates = (allTemplates || []).filter((tpl) => {
    if (selectedCategoryFilter !== "ALL" && tpl.categoryId !== selectedCategoryFilter) return false;
    return true;
  });

  // Toggle template selection for current slot
  const handleToggleTemplateSelect = (templateId) => {
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      if (next[currentSlotKey] === templateId) {
        delete next[currentSlotKey];
      } else {
        next[currentSlotKey] = templateId;
      }
      return next;
    });
  };

  // Restore default template
  const handleClearSlotTemplate = () => {
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      delete next[currentSlotKey];
      return next;
    });
  };

  // Save assignments
  const handleSaveAssignments = async (openReportAfter = false) => {
    setIsSaving(true);
    try {
      const slotPrefix = `${companyKey}__`;
      const assignedIds = Object.entries(draftProcessSlots || {})
        .filter(([k, v]) => k.startsWith(slotPrefix) && Boolean(v))
        .map(([, v]) => v);

      await saveHanulTemplateAssignment(companyKey, assignedIds, draftProcessSlots);
      setToastMessage(`✅ [${companyName} • ${activeSlotObj?.name || selectedSlotId}] 공정에 5대 공정 양식이 성공적으로 설정되었습니다!`);
      setTimeout(() => setToastMessage(""), 3500);

      if (openReportAfter && onApplyAndOpenReport) {
        onClose();
        onApplyAndOpenReport(currentSlotTemplateObj || null, selectedSlotId);
      } else {
        setTimeout(() => onClose(), 800);
      }
    } catch (e) {
      console.error(e);
      alert("양식 설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-indigo-500/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-black">
                  {companyName} 전용
                </span>
                <h3 className="font-black text-sm sm:text-base text-white">
                  {title}
                </h3>
              </div>
              <p className="text-[11px] text-indigo-200/90 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1단계: 라인 / 공정 선택 칩 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>양식을 지정할 라인 또는 공정 선택:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                선택한 위치에 5대 공정 양식이 매핑됩니다.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const slotKey = buildHanulProcessSlotKey(companyKey, slot.id, "MAIN");
                const hasCustomTpl = Boolean(draftProcessSlots?.[slotKey]);

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-950/70 ring-2 ring-indigo-400/40 shadow-md"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-xs text-white truncate">{slot.name}</span>
                      {hasCustomTpl && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black shrink-0">
                          양식적용
                        </span>
                      )}
                    </div>
                    {slot.sub && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{slot.sub}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 현재 슬롯에 적용된 양식 상태 배너 */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <span>🎯 현재 대상:</span>
                <span className="text-white font-black">[{companyName} • {activeSlotObj?.name || selectedSlotId}]</span>
              </div>
              <div className="text-xs font-black text-white truncate mt-1 flex items-center gap-1.5">
                <span>적용 양식:</span>
                {currentSlotTemplateObj ? (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                    📄 {currentSlotTemplateObj.title || currentSlotTemplateObj.carModel} ({currentSlotTemplateObj.formNo || "표준양식"})
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs font-medium">
                    기본 내장 양식 사용 중 (아래 보관함에서 원하는 양식을 선택하세요)
                  </span>
                )}
              </div>
            </div>

            {currentSlotTemplateObj && (
              <button
                type="button"
                onClick={handleClearSlotTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>기본양식 복원</span>
              </button>
            )}
          </div>

          {/* 2단계: 5대 공정 양식 보관함에서 선택 */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>적용할 5대 공정 양식 선택:</span>
              </label>

              {/* 5대 공정 대분류 필터 */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter("ALL")}
                  className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategoryFilter === "ALL"
                      ? "bg-cyan-500 text-slate-950 font-black shadow-xs"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  📋 전체 ({allTemplates.length})
                </button>
                {REPORT_MAJOR_CATEGORIES.map((cat) => {
                  const count = allTemplates.filter((t) => t.categoryId === cat.id).length;
                  const isActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? "bg-indigo-600 text-white font-black shadow-xs ring-1 ring-indigo-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        isActive ? "bg-white/20 text-white font-black" : "bg-slate-900 text-slate-400"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto custom-scrollbar p-1">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 font-bold text-xs border border-dashed border-slate-700 rounded-2xl">
                  해당 공정 분류에 등록된 양식이 없습니다.
                </div>
              ) : (
                filteredTemplates.map((tpl) => {
                  const isChecked = currentSlotTemplateId === tpl.id;
                  const catObj =
                    REPORT_MAJOR_CATEGORIES.find((c) => c.id === tpl.categoryId) ||
                    REPORT_MAJOR_CATEGORIES[0];

                  const blockCount = tpl.legoConfig?.activeBlocks
                    ? Object.values(tpl.legoConfig.activeBlocks).filter(Boolean).length
                    : 0;

                  return (
                    <div
                      key={tpl.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 text-left ${
                        isChecked
                          ? "bg-indigo-950/80 border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50"
                          : "bg-slate-950/70 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Meta Tags */}
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

                        {/* Title & Document No */}
                        <div>
                          <h4 className="font-black text-sm text-white line-clamp-1">
                            {tpl.title || `${tpl.carModel || ""} ${tpl.partName || "작업일보"}`}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            품명: <span className="text-slate-200 font-bold">{tpl.partName || "표준"}</span> • 양식번호: <span className="font-mono text-slate-300">{tpl.formNo || "705-01"}</span>
                          </p>
                        </div>

                        {/* Blocks info */}
                        {blockCount > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            <span>레고 블록 {blockCount}개 구성 (실물 A4 연동)</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons (전체보기 / 공정선택) */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {/* 🌟 전체보기 뱃지 (클릭 시 템플릿 열람/수정 및 수정등록 지원) */}
                        <button
                          type="button"
                          onClick={() => setViewingTemplate(tpl)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="양식 템플릿 상세 블록을 확인하고 실물 A4 양식 수정등록도 가능합니다."
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>전체보기</span>
                        </button>

                        {/* 공정 선택 뱃지 */}
                        <button
                          type="button"
                          onClick={() => handleToggleTemplateSelect(tpl.id)}
                          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition cursor-pointer active:scale-95 ${
                            isChecked
                              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md font-black"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ 적용됨</span>
                            </>
                          ) : (
                            <>
                              <span>이 공정에 선택</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-bold">
            💡 위에서 라인/공정을 고른 뒤 양식을 선택하고 <span className="text-emerald-400 font-black">[설정 저장]</span>을 누르면 실시간 반영됩니다.
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              닫기
            </button>
            {onApplyAndOpenReport && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveAssignments(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>이 양식으로 일보 작성</span>
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAssignments(false)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "저장 중..." : "공정별 양식 설정 저장"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 LegoTemplateEditorModal (전체보기 탭 시 템플릿 열람 및 수정등록/적용 지원) */}
      {viewingTemplate && (
        <LegoTemplateEditorModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          onSave={async (updatedTpl) => {
            await saveWorkReportTemplate(updatedTpl);
            setAllTemplates(getLocalWorkReportTemplates());
            setViewingTemplate(null);
            setToastMessage(`✅ [${updatedTpl.carModel || updatedTpl.title}] 템플릿이 성공적으로 수정 등록되었습니다!`);
            setTimeout(() => setToastMessage(""), 3500);
          }}
          onApply={(appliedTpl) => {
            handleToggleTemplateSelect(appliedTpl.id);
            setViewingTemplate(null);
            setToastMessage(`✅ [${appliedTpl.carModel || appliedTpl.title}] 양식이 현재 슬롯에 선택 적용되었습니다!`);
            setTimeout(() => setToastMessage(""), 3500);
          }}
        />
      )}
    </div>
  );
};

export default MajorProcessTemplateSelectModal;
