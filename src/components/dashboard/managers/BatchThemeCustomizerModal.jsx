import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, Palette, Check } from "lucide-react";
import {
  PANEL_THEMES,
  BORDER_RADIUS_OPTIONS,
  BORDER_STYLE_OPTIONS,
  FONT_SIZE_OPTIONS
} from "../../../config/panelThemeConfig";

export const BatchThemeCustomizerModal = ({
  isOpen,
  onClose,
  activePanels = [],
  currentManager,
  onApplyBatch
}) => {
  const [selectedTheme, setSelectedTheme] = useState("indigo");
  const [selectedRadius, setSelectedRadius] = useState("rounded-2xl");
  const [selectedBorder, setSelectedBorder] = useState("border-2");
  const [selectedFontSize, setSelectedFontSize] = useState("sm");
  const [hideSubtitle, setHideSubtitle] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const currentThemeObj = PANEL_THEMES[selectedTheme] || PANEL_THEMES.indigo;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const designOptions = {
        theme: selectedTheme,
        borderRadius: selectedRadius,
        borderStyle: selectedBorder,
        fontSize: selectedFontSize,
        hideSubtitle: hideSubtitle
      };
      if (onApplyBatch) {
        await onApplyBatch(designOptions);
      }
      onClose();
    } catch (e) {
      alert("일괄 적용 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border-2 border-teal-500/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                🎨 전체 패널 디자인 & 규격 일괄 통일
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentManager ? `[${currentManager.name} ${currentManager.title}]의 모든 활성 패널 (${activePanels.length}개)을 한 번에 통일합니다.` : "활성 패널 일괄 스타일 적용"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          
          {/* 테마 선택 */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-400" />
              <span>통일할 디자인 테마 선택:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PANEL_THEMES).map((th) => {
                const isSelected = selectedTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedTheme(th.id)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? "bg-slate-800 border-teal-400 shadow-md ring-1 ring-teal-400/40 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: th.colorHex }}
                      />
                      <span className="font-bold text-[11px] truncate">{th.label.split(" ")[0]}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 주석 일괄 삭제 */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-200">모든 패널 제목 아래 주석/부연설명 숨김</div>
              <div className="text-[10.5px] text-slate-400">모든 패널의 헤더를 군더더기 없이 깔끔하게 통일합니다.</div>
            </div>
            <input
              type="checkbox"
              checked={hideSubtitle}
              onChange={(e) => setHideSubtitle(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>

          {/* 규격 선택 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px]">모서리 둥글기:</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs"
              >
                {BORDER_RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px]">테두리 두께:</span>
              <select
                value={selectedBorder}
                onChange={(e) => setSelectedBorder(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs"
              >
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 안내 배너 */}
          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 text-teal-300 text-[11px] leading-relaxed">
            💡 적용 시 현재 화면의 <b>{activePanels.length}개 모든 패널</b>이 선택한 테마({currentThemeObj.label})와 규격으로 즉시 통일됩니다.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isApplying ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-4 h-4" />}
            <span>모든 패널에 일괄 적용</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BatchThemeCustomizerModal;
