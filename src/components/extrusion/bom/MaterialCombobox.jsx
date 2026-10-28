import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * 🌟 Custom Material Combobox
 * 항상 '미사용' 최상단 노출 및 전체 원재료 목록 선택/검색/직접입력 지원
 */
export const MaterialCombobox = ({
  value,
  onChange,
  options = [],
  placeholder = "",
  theme = "teal", // "indigo" | "emerald" | "amber" | "sky" | "teal"
  className = "",
  title = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Color schemes
  const colorMap = {
    indigo: {
      border: "border-indigo-500/60 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/30",
      text: "text-indigo-300 font-bold",
      bgHover: "hover:bg-indigo-950/80",
      activeBg: "bg-indigo-900/60 text-indigo-200 font-black"
    },
    emerald: {
      border: "border-emerald-500/60 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/30",
      text: "text-emerald-300 font-bold",
      bgHover: "hover:bg-emerald-950/80",
      activeBg: "bg-emerald-900/60 text-emerald-200 font-black"
    },
    amber: {
      border: "border-amber-500/60 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30",
      text: "text-amber-300 font-bold",
      bgHover: "hover:bg-amber-950/80",
      activeBg: "bg-amber-900/60 text-amber-200 font-black"
    },
    sky: {
      border: "border-sky-500/60 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30",
      text: "text-sky-300 font-bold",
      bgHover: "hover:bg-sky-950/80",
      activeBg: "bg-sky-900/60 text-sky-200 font-black"
    },
    teal: {
      border: "border-teal-500/60 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/30",
      text: "text-teal-300 font-bold",
      bgHover: "hover:bg-teal-950/80",
      activeBg: "bg-teal-900/60 text-teal-200 font-black"
    }
  };
  const themeCls = colorMap[theme] || colorMap.teal;

  const isUnused = !value || value === "미사용" || value === "비사용" || value === "없음" || value === "-";

  // Filter options based on search term if user is searching
  const filteredOptions = useMemo(() => {
    const rawOpts = options.filter((opt) => {
      const name = typeof opt === "string" ? opt : opt.name;
      return name !== "미사용" && name !== "비사용" && name !== "없음";
    });

    if (!searchTerm.trim()) return rawOpts;
    const q = searchTerm.toLowerCase().trim();
    return rawOpts.filter((opt) => {
      const name = typeof opt === "string" ? opt : opt.name;
      const type = typeof opt === "object" ? (opt.type || opt.category || opt.spec || opt.desc || "") : "";
      return name.toLowerCase().includes(q) || type.toLowerCase().includes(q);
    });
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input box with dropdown chevron */}
      <div
        className={`flex items-center rounded-xl bg-slate-800/90 border transition-all shadow-xs ${
          !isUnused ? themeCls.border : "border-slate-700/80 hover:border-slate-600 focus-within:border-slate-500"
        } ${isOpen ? "ring-2 ring-teal-400/40" : ""}`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchTerm(e.target.value);
          }}
          onFocus={() => {
            setSearchTerm("");
            setIsOpen(true);
          }}
          onClick={() => {
            if (!isOpen) {
              setSearchTerm("");
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          title={title}
          className={`w-full px-2.5 py-1.5 bg-transparent text-xs focus:outline-hidden placeholder-slate-500 ${
            !isUnused ? themeCls.text : "text-slate-300 font-normal"
          }`}
        />

        {/* Dropdown Chevron button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOpen) setSearchTerm("");
            setIsOpen(!isOpen);
          }}
          className="px-1.5 py-1 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          title="원재료 목록 전체보기"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-teal-400" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-max min-w-[220px] max-w-[340px] bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-fadeIn max-h-[290px] flex flex-col backdrop-blur-md">
          {/* Top Fixed "미사용" Option */}
          <div className="p-1 border-b border-slate-800 bg-slate-950/90">
            <button
              type="button"
              onClick={() => {
                onChange("미사용");
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-black transition cursor-pointer ${
                isUnused
                  ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-black text-rose-300">미사용 (투입 안함)</span>
              </div>
              {isUnused && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            </button>
          </div>

          {/* Scrollable Material Options List */}
          <div className="overflow-y-auto divide-y divide-slate-800/50 flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px]">
                일치하는 규격이 없습니다. (직접 타이핑 가능)
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const name = typeof opt === "string" ? opt : opt.name;
                const type = typeof opt === "object" ? (opt.type || opt.category || opt.spec || opt.desc || "") : "";
                const isSelected = value === name;

                return (
                  <button
                    key={`${name}_${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                      isSelected ? themeCls.activeBg : `text-slate-200 ${themeCls.bgHover}`
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-100">{name}</span>
                      {type && (
                        <span className="text-[10px] text-slate-400 font-medium">({type})</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialCombobox;
