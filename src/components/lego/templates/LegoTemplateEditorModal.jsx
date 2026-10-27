import { useState, useMemo } from "react";
import { Sliders, Save, X, Zap } from "lucide-react";
import { getOrderedBlocksForTemplate } from "./templateUtils";
import MaterialPrepStandardA4Sheet from "./MaterialPrepStandardA4Sheet";

export const LegoTemplateEditorModal = ({ template, onClose, onSave, onApply }) => {
  const [formData, setFormData] = useState(template);
  const hasLegoConfig = Boolean(formData?.legoConfig?.activeBlocks);
  const orderedBlocks = useMemo(() => getOrderedBlocksForTemplate(formData), [formData]);

  const updateField = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            [field]: val
          }
        : prev.legoConfig
    }));
  };

  const toggleBlock = (blockKey) => {
    setFormData((prev) => {
      if (prev.legoConfig?.activeBlocks) {
        const nextActive = {
          ...prev.legoConfig.activeBlocks,
          [blockKey]: !prev.legoConfig.activeBlocks[blockKey]
        };
        return {
          ...prev,
          legoConfig: {
            ...prev.legoConfig,
            activeBlocks: nextActive
          }
        };
      }
      return {
        ...prev,
        blocks: {
          ...prev.blocks,
          [blockKey]: !prev.blocks?.[blockKey]
        }
      };
    });
  };

  const handleAddSpec = () => {
    const nextIdx = (formData.specs || []).length + 1;
    const letter = String.fromCharCode(64 + nextIdx);
    const newSpec = {
      id: `sp_${Date.now()}_${nextIdx}`,
      section: letter,
      name: `Section "${letter}"`,
      frtSpec: "600 ± 5mm",
      frtTarget: 600,
      frtTol: 5,
      rrSpec: "600 ± 5mm",
      rrTarget: 600,
      rrTol: 5
    };
    setFormData((prev) => ({
      ...prev,
      specs: [...(prev.specs || []), newSpec],
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: [
              ...(prev.legoConfig.specsCutting || []),
              {
                id: newSpec.id,
                section: letter,
                spec1: "600 ± 5mm",
                start1: "",
                half1: "",
                finish1: "",
                lotStart: "",
                lotHalf: "",
                lotFinish: ""
              }
            ]
          }
        : prev.legoConfig
    }));
  };

  const handleRemoveSpec = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).filter((s) => s.id !== idToRemove),
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: (prev.legoConfig.specsCutting || []).filter((s) => s.id !== idToRemove)
          }
        : prev.legoConfig
    }));
  };

  const handleUpdateSpec = (id, key, val) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).map((s) => (s.id === id ? { ...s, [key]: val } : s)),
      legoConfig: prev.legoConfig
        ? {
            ...prev.legoConfig,
            specsCutting: (prev.legoConfig.specsCutting || []).map((s) =>
              s.id === id && key === "frtSpec" ? { ...s, spec1: val } : s
            )
          }
        : prev.legoConfig
    }));
  };

  const handleAddDefect = (groupIndex = 0) => {
    const defaultPrompt = groupIndex === 0 ? "압출소재 불량 항목명 (예: 크랙, 흑점 등):" : "공정간 불량 항목명 (예: 치수불량 등):";
    const name = prompt(defaultPrompt);
    if (!name || !name.trim()) return;
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[groupIndex]) {
        cats[groupIndex] = { name: groupIndex === 0 ? "압출소재 불량 (Extrusion Badness)" : "공정간 불량(Process Badness)", items: [] };
      }
      cats[groupIndex] = { ...cats[groupIndex], items: [...(cats[groupIndex].items || []), name.trim()] };
      return { ...prev, defectCategories: cats };
    });
  };

  const handleRemoveDefect = (catIdx, itemIdx) => {
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[catIdx]) return prev;
      const items = [...cats[catIdx].items];
      items.splice(itemIdx, 1);
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, defectCategories: cats };
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[94vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                작업일보 템플릿 전체보기 및 양식 편집
              </h3>
              <p className="text-xs text-indigo-200">
                {formData.carModel} • {formData.partName} • {formData.processName || "소재준비"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(formData)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>수정등록</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2-Columns (Left: Builder / Right: Live A4 Sheet) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* LEFT: Builder Controls */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto">
            {/* Step 1: Base Meta (한 줄 제목 통일 + 차종 -> 품명 -> 공정명 순서) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                1. 기본 정보 설정 (차종 · 품명 · 공정명 순)
              </span>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">일보 제목 (한 줄 통일)</label>
                <input
                  type="text"
                  value={formData.title || "소재준비작업일보"}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">1. 차종명</label>
                  <input
                    type="text"
                    value={formData.carModel || ""}
                    onChange={(e) => updateField("carModel", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">2. 품명</label>
                  <input
                    type="text"
                    value={formData.partName || ""}
                    onChange={(e) => updateField("partName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">3. 공정명</label>
                  <input
                    type="text"
                    value={formData.processName || ""}
                    onChange={(e) => updateField("processName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">양식 번호</label>
                <input
                  type="text"
                  value={formData.formNo || "705-02(REV.4)"}
                  onChange={(e) => updateField("formNo", e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* Step 2: Lego Block Toggles (조립된 전체 레고 블록 스위치) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                  2. 조립 레고 블록 ON/OFF 스위치
                </span>
                <span className="text-[10px] font-bold text-slate-400">실시간 우측 서식 연동</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {hasLegoConfig
                  ? orderedBlocks.map((b, idx) => {
                      const isChecked = Boolean(formData.legoConfig?.activeBlocks?.[b.key]);
                      return (
                        <label
                          key={b.key}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                            isChecked
                              ? "bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-65"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {idx + 1}. {b.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBlock(b.key)}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  : [
                      { key: "timeAndQty", label: "⏱️ [블록 1] 작업시간 & 생산량 블록" },
                      { key: "specAndLot", label: "📐 [블록 2] 정치 절단 길이 & LOT NO." },
                      { key: "defectMatrix", label: "⚠️ [블록 3] 불량소재구분 매트릭스" },
                      { key: "maintenance", label: "🔧 [블록 4] 칼날교체 & 설비이상 조치" }
                    ].map((b) => (
                      <label
                        key={b.key}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formData.blocks?.[b.key])}
                          onChange={() => toggleBlock(b.key)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </label>
                    ))}
              </div>
            </div>

            {/* Step 3: Spec Items Editor */}
            {(formData.blocks?.specAndLot || formData.legoConfig?.activeBlocks?.specsCutting) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                      3. 정치 절단 치수 규격(Spec) 설정
                    </span>
                    <span className="text-[10px] text-slate-400">단면별 기준 규격</span>
                  </div>
                  <button
                    onClick={handleAddSpec}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-black cursor-pointer hover:bg-indigo-500"
                  >
                    + 단면 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(formData.specs || []).map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs">
                          {s.section || s.name || `Section ${idx + 1}`} 단면
                        </span>
                        <button
                          onClick={() => handleRemoveSpec(s.id)}
                          className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="삭제"
                        >
                          × 단면 제거
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">FRT 규격</label>
                          <input
                            type="text"
                            value={s.frtSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "frtSpec", e.target.value)}
                            placeholder="예: 881 ± 3mm"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-indigo-600 dark:text-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">RR 규격</label>
                          <input
                            type="text"
                            value={s.rrSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "rrSpec", e.target.value)}
                            placeholder="예: 488 ± 3mm"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-purple-600 dark:text-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live A4 Sheet Preview (조립된 전체 블록 100% 반영) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start overflow-y-auto">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                실시간 1:1 조립 블록 & 표준 A4 서식 미리보기
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                설계 블록 100% 동기화
              </span>
            </div>

            <MaterialPrepStandardA4Sheet template={formData} showBlockBadges={true} />
          </div>
        </div>

        {/* Modal Footer: [닫기] / [수정등록] / [템플릿 적용] */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            닫기
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. 수정등록 뱃지 */}
            <button
              type="button"
              onClick={() => onSave(formData)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="수정한 템플릿 내용을 양식보관함에 저장 및 갱신합니다."
            >
              <Save className="w-4 h-4" />
              <span>수정등록</span>
            </button>

            {/* 2. 템플릿 적용 뱃지 */}
            <button
              type="button"
              onClick={() => onApply && onApply(formData)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="이 양식을 작업일보 작성기에 즉시 적용하여 일보 작성을 시작합니다."
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>템플릿 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegoTemplateEditorModal;
