import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Type,
  Layout,
  Eye,
  Sliders,
  ShieldCheck,
  Check
} from "lucide-react";
import {
  PANEL_THEMES,
  BORDER_RADIUS_OPTIONS,
  BORDER_STYLE_OPTIONS,
  FONT_SIZE_OPTIONS,
  DEFAULT_PANEL_SETTING
} from "../../../config/panelThemeConfig";
import { ALL_DASHBOARD_BLOCKS, PANEL_KEYS } from "../../../config/dashboardPanelConfig";

export const PanelDesignCustomizerModal = ({
  isOpen,
  onClose,
  blockKey,
  currentManager,
  initialSettings = {},
  onSave,
  onReset
}) => {
  const blockMeta = ALL_DASHBOARD_BLOCKS.find((b) => b.key === blockKey) || {
    label: blockKey || "대시보드 패널",
    category: "일반",
    badge: "패널",
    description: ""
  };

  const isAbnormality4M = blockKey === PANEL_KEYS.ABNORMALITY_4M;

  // Form states
  const [customTitle, setCustomTitle] = useState("");
  const [customTopTitle, setCustomTopTitle] = useState("");
  const [customBottomTitle, setCustomBottomTitle] = useState("");
  const [hideSubtitle, setHideSubtitle] = useState(true);
  const [theme, setTheme] = useState("indigo");
  const [borderRadius, setBorderRadius] = useState("rounded-2xl");
  const [borderStyle, setBorderStyle] = useState("border-2");
  const [fontSize, setFontSize] = useState("sm");
  const [isApplying, setIsApplying] = useState(false);

  // Sync initial settings when opened
  useEffect(() => {
    if (isOpen) {
      setCustomTitle(initialSettings.customTitle || "");
      setCustomTopTitle(initialSettings.customTopTitle || (isAbnormality4M ? "📋 이창엽의 4M 정식대장" : ""));
      setCustomBottomTitle(initialSettings.customBottomTitle || (isAbnormality4M ? "📋 전사 4M 취합대장" : ""));
      setHideSubtitle(initialSettings.hideSubtitle !== false); // default: true
      setTheme(initialSettings.theme || "indigo");
      setBorderRadius(initialSettings.borderRadius || "rounded-2xl");
      setBorderStyle(initialSettings.borderStyle || "border-2");
      setFontSize(initialSettings.fontSize || "sm");
    }
  }, [isOpen, initialSettings, isAbnormality4M]);

  if (!isOpen) return null;

  const currentThemeObj = PANEL_THEMES[theme] || PANEL_THEMES.indigo;
  const currentFontSizeObj = FONT_SIZE_OPTIONS.find((f) => f.id === fontSize) || FONT_SIZE_OPTIONS[0];

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const updated = {
        customTitle: customTitle.trim(),
        customTopTitle: isAbnormality4M ? customTopTitle.trim() : "",
        customBottomTitle: isAbnormality4M ? customBottomTitle.trim() : "",
        hideSubtitle,
        theme,
        borderRadius,
        borderStyle,
        fontSize
      };
      if (onSave) {
        await onSave(blockKey, updated);
      }
      onClose();
    } catch (err) {
      alert("설정 적용 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(`[${blockMeta.label}]의 제목과 디자인을 공장 기본값으로 복원하시겠습니까?`)) {
      if (onReset) {
        await onReset(blockKey);
      }
      setCustomTitle("");
      setCustomTopTitle(isAbnormality4M ? "📋 이창엽의 4M 정식대장" : "");
      setCustomBottomTitle(isAbnormality4M ? "📋 전사 4M 취합대장" : "");
      setHideSubtitle(true);
      setTheme("indigo");
      setBorderRadius("rounded-2xl");
      setBorderStyle("border-2");
      setFontSize("sm");
      onClose();
    }
  };

  // Quick 1-click Preset for 4M
  const handleApply4MPreset = () => {
    setCustomTopTitle("📋 이창엽의 4M 정식대장");
    setCustomBottomTitle("📋 전사 4M 취합대장");
    setHideSubtitle(true);
    setTheme("indigo");
    setBorderRadius("rounded-2xl");
    setBorderStyle("border-2");
    setFontSize("sm");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-indigo-600 text-white shadow-md shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight truncate">
                  🎨 [{blockMeta.label}] 제목 및 디자인 커스터마이저
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80">
                  TEST 스튜디오
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {currentManager ? `[${currentManager.plant} • ${currentManager.name} ${currentManager.title}] 시점 맞춤 설정` : "관리자 맞춤 설정"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">

          {/* 패널 제목 입력 */}
          <div className="space-y-2.5 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>패널 제목 직접 수정</span>
              </label>
              {isAbnormality4M && (
                <button
                  type="button"
                  onClick={handleApply4MPreset}
                  className="px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700 text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>추천 명칭 1클릭 적용 (이창엽 정식대장 + 전사 취합대장)</span>
                </button>
              )}
            </div>

            {isAbnormality4M ? (
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">상단 대장 제목 (품질 정식대장):</span>
                  <input
                    type="text"
                    value={customTopTitle}
                    onChange={(e) => setCustomTopTitle(e.target.value)}
                    placeholder="기본: 📋 이창엽의 4M 정식대장"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">하단 대장 제목 (전사 취합대장):</span>
                  <input
                    type="text"
                    value={customBottomTitle}
                    onChange={(e) => setCustomBottomTitle(e.target.value)}
                    placeholder="기본: 📋 전사 4M 취합대장"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`기본: ${blockMeta.label}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  * 비워두면 기본 제목({blockMeta.label})으로 표시됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 주석 및 부연설명 숨김 옵션 */}
          <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>제목 하단 주석 및 부연설명 제거</span>
              </div>
              <p className="text-[11px] text-slate-400">
                패널 제목 아래의 긴 설명, 결재라인 주석 등을 삭제하여 슬림하고 깔끔하게 유지합니다.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={hideSubtitle}
                onChange={(e) => setHideSubtitle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* 디자인 테마 선택 */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
            <label className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>디자인 테마 선택</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PANEL_THEMES).map((th) => {
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/40 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: th.colorHex }}
                      />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="font-black text-[11.5px] truncate text-slate-200">
                      {th.label}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {th.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 외곽 테두리 및 폰트 규격 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
            {/* 곡률 */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px]">모서리 둥글기:</span>
              <select
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs outline-none cursor-pointer"
              >
                {BORDER_RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 테두리 두께 */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px]">테두리 강조:</span>
              <select
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs outline-none cursor-pointer"
              >
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 폰트 크기 */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px]">헤더 폰트 크기:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs outline-none cursor-pointer"
              >
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. 실시간 미리보기 (Live Preview) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-400 flex items-center gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>실시간 적용 미리보기</span>
            </label>
            <div
              className={`p-3.5 ${borderRadius} ${borderStyle} ${currentThemeObj.borderClass} ${currentThemeObj.headerBg} shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${currentThemeObj.iconGradient} text-white shadow-md shrink-0`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-black ${currentFontSizeObj.titleClass} tracking-tight text-white`}>
                        {isAbnormality4M
                          ? (customBottomTitle || customTitle || "📋 전사 4M 취합대장")
                          : (customTitle || blockMeta.label)}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${currentThemeObj.accentBadge}`}>
                        {currentManager?.name || "관리자"} 관제
                      </span>
                    </div>
                    {!hideSubtitle && (
                      <p className="text-[10.5px] text-slate-300/80 mt-0.5">
                        ※ 주석 표시 모드 활성화됨
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                  미리보기
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition border border-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isApplying ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-4 h-4" />}
              <span>적용하기 (실시간 반영)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PanelDesignCustomizerModal;
