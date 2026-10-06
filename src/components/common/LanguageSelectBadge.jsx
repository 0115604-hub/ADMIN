import React, { useState, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  getCurrentWorkLogLanguage,
  setWorkLogLanguage
} from "../../services/workLogI18nService";

export const LanguageSelectBadge = ({
  className = "",
  variant = "badge", // 'badge' | 'select' | 'compact' | 'elongated'
  showLabel = true,
  onLanguageChange = null
}) => {
  const [currentLang, setCurrentLang] = useState(() => getCurrentWorkLogLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
        if (onLanguageChange) onLanguageChange(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, [onLanguageChange]);

  const currentObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleSelect = (code) => {
    setWorkLogLanguage(code);
    setCurrentLang(code);
    setIsOpen(false);
    if (onLanguageChange) onLanguageChange(code);
  };

  if (variant === "select") {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 bg-slate-900/90 dark:bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1 text-white shadow-xs">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={currentLang}
            onChange={(e) => handleSelect(e.target.value)}
            className="bg-transparent text-white font-bold text-xs cursor-pointer focus:outline-hidden pr-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white font-medium">
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // ⭐ 3배 확장형 롱 뱃지 (인사카드 전용: 주석 없이 깔끔한 긴 바 형태)
  if (variant === "elongated") {
    return (
      <div className={`relative w-full ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800/90 text-white border border-cyan-500/40 hover:border-cyan-400 shadow-sm transition-all active:scale-[0.99] cursor-pointer ring-1 ring-cyan-500/20"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-base leading-none">{currentObj.flag}</span>
            <span className="font-black text-xs text-white truncate">{currentObj.nativeName}</span>
            <span className="text-[11px] text-cyan-300/80 font-bold truncate">({currentObj.name})</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 dark:bg-slate-950 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn max-h-80 overflow-y-auto backdrop-blur-md">
              <div className="py-0.5 space-y-0.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === currentLang;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelect(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs">{lang.nativeName}</span>
                          <span className="text-[11px] text-slate-400">({lang.name})</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Badge Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-950 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-cyan-400/60 shadow-xs transition-all active:scale-95 cursor-pointer ring-1 ring-slate-800"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-sm">{currentObj.flag}</span>
        <span className="font-black text-xs text-slate-100">{currentObj.nativeName}</span>
        {showLabel && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60 hidden sm:inline">
            언어선택
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-60 bg-slate-900 dark:bg-slate-950 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn max-h-80 overflow-y-auto backdrop-blur-md">
            <div className="py-0.5 space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-xs leading-tight">{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-400 leading-none">{lang.name} ({lang.country})</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelectBadge;
