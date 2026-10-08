import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Save,
  CheckCircle2,
  ListFilter,
  X,
  Trash2,
  Search,
  Plus,
  RotateCcw,
  Edit3,
  Layers,
  ChevronDown,
  Check
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  EPDM_RUBBERS,
  EPDM_COMPOUNDS,
  EPDM_INSERTS,
  EPDM_COATINGS,
  getMaterialBOMForItem
} from "../../data/extrusionRawMaterialsData";
import { getAllExtrusionItems } from "../../data/extrusionItemsData";
import {
  saveBOMMapping,
  deleteBOMMapping,
  resetAllCustomBOM,
  subscribeToCustomBOM,
  getLocalCustomBOMMap
} from "../../services/extrusionBOMService";
import { useModalHistory } from "../../utils/modalHistory";

const DRAFT_STORAGE_KEY = "factory_extrusion_bom_draft_v2";

// 🌟 Custom Material Combobox (항상 '미사용' 최상단 노출 및 전체 원재료 목록 선택/검색/직접입력 지원)
const MaterialCombobox = ({
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

export const ExtrusionMaterialBOMQuickPanel = ({ onBOMRegistered = null }) => {
  const { currentProfile, isAdmin } = useAuth();

  // Condition: Visible strictly to 설유철 (or Admin)
  const isSeolYuCheol =
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    currentProfile?.name?.includes("설유철") ||
    isAdmin;

  // Real-time custom BOM map state
  const [customBOMMap, setCustomBOMMap] = useState(() => getLocalCustomBOMMap());
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  useModalHistory(isListModalOpen, () => setIsListModalOpen(false), "bomListModal");
  const [searchFilter, setSearchFilter] = useState("");
  const [lineFilter, setLineFilter] = useState("ALL"); // ALL | pcm1 | pcm3 | pvc | tpe | custom_only
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Direct custom vehicle/item entry mode (신규 품목 직접 추가)
  const [isCustomItemMode, setIsCustomItemMode] = useState(false);
  const [customVehicle, setCustomVehicle] = useState("");
  const [customItemName, setCustomItemName] = useState("");

  // Form selections (연고무 2종, 컴파운드 4종, 심금, 코팅액 - 직접 타이핑 및 오탈자 수정 지원)
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [rubberType, setRubberType] = useState("");
  const [rubberType2, setRubberType2] = useState("");
  const [compoundType, setCompoundType] = useState("");
  const [compoundType2, setCompoundType2] = useState("");
  const [compoundType3, setCompoundType3] = useState("");
  const [compoundType4, setCompoundType4] = useState("");
  const [insertType, setInsertType] = useState("");
  const [coatingType, setCoatingType] = useState("");

  // Safeguard refs against frequent unwanted resets while writing
  const hasInitializedRef = useRef(false);
  const isUserEditingRef = useRef(false);

  // Real-time listener for BOM updates
  useEffect(() => {
    const unsub = subscribeToCustomBOM((map) => {
      setCustomBOMMap(map || {});
    });
    return () => unsub();
  }, []);

  // Sorted list of all authentic extrusion items
  const allMasterItems = useMemo(() => {
    const all = getAllExtrusionItems();
    const map = new Map();
    all.forEach((it) => {
      const key = `${it.vehicle}:::${it.itemName}`;
      if (!map.has(key)) {
        map.set(key, {
          id: it.id || key,
          vehicle: it.vehicle,
          itemName: it.itemName,
          lineId: it.lineId || "pcm1",
          lineBadge: it.lineBadge || (it.lineId ? it.lineId.toUpperCase() : "PCM1"),
          label: `[${it.vehicle}] ${it.itemName}`,
          isAS: it.isAS || false
        });
      }
    });

    // Also include any user-created custom items that are not in master
    Object.keys(customBOMMap || {}).forEach((key) => {
      if (!map.has(key) && key.includes(":::")) {
        const [v, n] = key.split(":::");
        if (v && n) {
          map.set(key, {
            id: `custom_${key}`,
            vehicle: v,
            itemName: n,
            lineId: "custom",
            lineBadge: "커스텀",
            label: `[${v}] ${n}`,
            isAS: false,
            isCustomAdded: true
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.vehicle !== b.vehicle) return a.vehicle.localeCompare(b.vehicle);
      return a.itemName.localeCompare(b.itemName);
    });
  }, [customBOMMap]);

  // Pre-fill fields helper from current resolved BOM
  const applyBOMToFields = (resolvedBOM) => {
    if (!resolvedBOM) return;
    setRubberType(resolvedBOM.rubberType === "없음" || resolvedBOM.rubberType === "미사용" || resolvedBOM.rubberType === "비사용" ? "" : (resolvedBOM.rubberType || ""));
    setRubberType2(resolvedBOM.rubberType2 === "없음" || resolvedBOM.rubberType2 === "미사용" || resolvedBOM.rubberType2 === "비사용" ? "" : (resolvedBOM.rubberType2 || ""));
    setCompoundType(resolvedBOM.compoundType === "없음" || resolvedBOM.compoundType === "미사용" || resolvedBOM.compoundType === "비사용" ? "" : (resolvedBOM.compoundType || ""));
    setCompoundType2(resolvedBOM.compoundType2 === "없음" || resolvedBOM.compoundType2 === "미사용" || resolvedBOM.compoundType2 === "비사용" ? "" : (resolvedBOM.compoundType2 || ""));
    setCompoundType3(resolvedBOM.compoundType3 === "없음" || resolvedBOM.compoundType3 === "미사용" || resolvedBOM.compoundType3 === "비사용" ? "" : (resolvedBOM.compoundType3 || ""));
    setCompoundType4(resolvedBOM.compoundType4 === "없음" || resolvedBOM.compoundType4 === "미사용" || resolvedBOM.compoundType4 === "비사용" ? "" : (resolvedBOM.compoundType4 || ""));
    setInsertType(resolvedBOM.insertType === "미사용" || resolvedBOM.insertType === "비사용" || resolvedBOM.insertType === "없음" ? "" : (resolvedBOM.insertType || ""));
    setCoatingType(resolvedBOM.coatingType === "미사용" || resolvedBOM.coatingType === "비사용" || resolvedBOM.coatingType === "없음" ? "" : (resolvedBOM.coatingType || ""));
  };

  // Initial load: Only once on mount to prevent wiping user's typing
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (allMasterItems.length === 0) return;

    // Check if there is an active session draft
    try {
      const savedDraftRaw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftRaw) {
        const d = JSON.parse(savedDraftRaw);
        if (d && (d.selectedItemKey || d.customVehicle)) {
          setSelectedItemKey(d.selectedItemKey || "");
          setIsCustomItemMode(Boolean(d.isCustomItemMode));
          setCustomVehicle(d.customVehicle || "");
          setCustomItemName(d.customItemName || "");
          setRubberType(d.rubberType || "");
          setRubberType2(d.rubberType2 || "");
          setCompoundType(d.compoundType || "");
          setCompoundType2(d.compoundType2 || "");
          setCompoundType3(d.compoundType3 || "");
          setCompoundType4(d.compoundType4 || "");
          setInsertType(d.insertType || "");
          setCoatingType(d.coatingType || "");
          hasInitializedRef.current = true;
          return;
        }
      }
    } catch (e) {}

    // Otherwise load first item
    const first = allMasterItems[0];
    const initialKey = `${first.vehicle}:::${first.itemName}`;
    setSelectedItemKey(initialKey);
    const existingBOM = getMaterialBOMForItem(first.vehicle, first.itemName, first.lineBadge);
    applyBOMToFields(existingBOM);
    hasInitializedRef.current = true;
  }, [allMasterItems]);

  // Auto-save draft into sessionStorage so user typing is never lost across tab switches / renders
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    try {
      const draft = {
        selectedItemKey,
        isCustomItemMode,
        customVehicle,
        customItemName,
        rubberType,
        rubberType2,
        compoundType,
        compoundType2,
        compoundType3,
        compoundType4,
        insertType,
        coatingType
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {}
  }, [
    selectedItemKey,
    isCustomItemMode,
    customVehicle,
    customItemName,
    rubberType,
    rubberType2,
    compoundType,
    compoundType2,
    compoundType3,
    compoundType4,
    insertType,
    coatingType
  ]);

  // When dropdown item selection changes, pre-fill with current BOM
  const handleItemSelect = (itemKey) => {
    isUserEditingRef.current = false;
    setSelectedItemKey(itemKey);
    setIsCustomItemMode(false);
    if (!itemKey) return;
    const [v, n] = itemKey.split(":::");
    const found = allMasterItems.find((it) => it.vehicle === v && it.itemName === n);
    const existing = getMaterialBOMForItem(v, n, found?.lineBadge);
    applyBOMToFields(existing);
  };

  // Select item from list modal for editing in quick bar
  const handleEditFromModal = (item) => {
    isUserEditingRef.current = false;
    const key = `${item.vehicle}:::${item.itemName}`;
    setSelectedItemKey(key);
    setIsCustomItemMode(false);
    const existing = getMaterialBOMForItem(item.vehicle, item.itemName, item.lineBadge);
    applyBOMToFields(existing);
    setIsListModalOpen(false);
    showToast(`✏️ [${item.vehicle}] ${item.itemName} 편집 준비 완료!`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Helper to normalize values
  const cleanVal = (val) => {
    const str = String(val || "").trim();
    if (!str || str === "없음" || str === "미사용" || str === "-") return "";
    return str;
  };

  // Register or Update BOM mapping handler
  const handleRegisterBOM = async (e) => {
    if (e) e.preventDefault();

    let v = "";
    let n = "";

    if (isCustomItemMode) {
      v = String(customVehicle || "").trim();
      n = String(customItemName || "").trim();
      if (!v || !n) {
        showToast("⚠️ 신규 추가할 차종과 품명을 모두 입력해 주세요.");
        return;
      }
    } else {
      if (!selectedItemKey) {
        showToast("⚠️ 등록 또는 수정할 품목을 선택해 주세요.");
        return;
      }
      const parts = selectedItemKey.split(":::");
      v = parts[0]?.trim();
      n = parts[1]?.trim();
    }

    if (!v) {
      showToast("⚠️ 차종 정보가 유효하지 않습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        rubberType: cleanVal(rubberType),
        rubberType2: cleanVal(rubberType2),
        compoundType: cleanVal(compoundType),
        compoundType2: cleanVal(compoundType2),
        compoundType3: cleanVal(compoundType3),
        compoundType4: cleanVal(compoundType4),
        insertType: cleanVal(insertType) || "미사용",
        coatingType: cleanVal(coatingType) || "미사용"
      };

      await saveBOMMapping(
        v,
        n,
        payload,
        currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "책임"}` : "설유철 책임"
      );

      const targetKey = `${v}:::${n}`;
      setSelectedItemKey(targetKey);
      setIsCustomItemMode(false);
      isUserEditingRef.current = false;

      showToast(`✅ [${v}] ${n || "전체"} 원재료 BOM 저장/수정 완료!`);
      if (onBOMRegistered) {
        onBOMRegistered({
          vehicle: v,
          itemName: n,
          ...payload
        });
      }
    } catch (err) {
      console.error("BOM registration error:", err);
      showToast("❌ 저장 중 오류가 발생했습니다: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Revert custom BOM handler
  const handleRevertCustomBOM = async (key) => {
    const [v, n] = key.split(":::");
    if (window.confirm(`[${v}] ${n || "전체"} 의 BOM 설정을 삭제/초기화하시겠습니까?`)) {
      try {
        await deleteBOMMapping(key);
        showToast(`🗑️ [${v}] ${n || "전체"} 가 기본 엑셀 BOM으로 복원되었습니다.`);
        if (selectedItemKey === key) {
          const found = allMasterItems.find((it) => it.vehicle === v && it.itemName === n);
          const existing = getMaterialBOMForItem(v, n, found?.lineBadge);
          applyBOMToFields(existing);
        }
      } catch (err) {
        console.error(err);
        showToast("❌ 초기화 중 오류가 발생했습니다.");
      }
    }
  };

  // Total custom modified count
  const customModifiedCount = Object.keys(customBOMMap || {}).length;

  // Complete List of All Items with Real-time BOM for the List Modal
  const fullBOMCatalogList = useMemo(() => {
    return allMasterItems
      .map((it) => {
        const key = `${it.vehicle}:::${it.itemName}`;
        const isCustom = !!customBOMMap[key];
        const bom = getMaterialBOMForItem(it.vehicle, it.itemName, it.lineBadge) || {};

        return {
          key,
          vehicle: it.vehicle,
          itemName: it.itemName,
          lineId: it.lineId,
          lineBadge: it.lineBadge,
          isAS: it.isAS,
          isCustom,
          rubberType: bom.rubberType || "",
          rubberType2: bom.rubberType2 || "",
          compoundType: bom.compoundType || "",
          compoundType2: bom.compoundType2 || "",
          compoundType3: bom.compoundType3 || "",
          compoundType4: bom.compoundType4 || "",
          insertType: bom.insertType || "미사용",
          coatingType: bom.coatingType || "미사용",
          matchType: bom.matchType || (isCustom ? "CUSTOM" : "EXCEL"),
          updatedAt: isCustom ? customBOMMap[key]?.updatedAt : null,
          registeredBy: isCustom ? customBOMMap[key]?.registeredBy : "엑셀 기준"
        };
      })
      .filter((it) => {
        // Line Filter
        if (lineFilter === "custom_only") {
          if (!it.isCustom) return false;
        } else if (lineFilter !== "ALL") {
          if (it.lineId !== lineFilter && !it.lineBadge?.toLowerCase().includes(lineFilter.toLowerCase())) {
            return false;
          }
        }

        // Search Filter
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
          it.vehicle.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          it.rubberType.toLowerCase().includes(q) ||
          it.rubberType2.toLowerCase().includes(q) ||
          it.compoundType.toLowerCase().includes(q) ||
          it.compoundType2.toLowerCase().includes(q) ||
          it.compoundType3.toLowerCase().includes(q) ||
          it.compoundType4.toLowerCase().includes(q) ||
          it.insertType.toLowerCase().includes(q) ||
          it.coatingType.toLowerCase().includes(q) ||
          it.lineBadge.toLowerCase().includes(q)
        );
      });
  }, [allMasterItems, customBOMMap, lineFilter, searchFilter]);

  // Combined options for compound fields (컴파운드 + 연고무 혼합)
  const compoundOptions = useMemo(() => {
    const cpList = EPDM_COMPOUNDS.filter((cp) => cp.name !== "미사용" && cp.name !== "비사용");
    const rbList = EPDM_RUBBERS.filter((r) => r.name !== "미사용" && r.name !== "비사용").map((r) => ({
      name: r.name,
      type: `${r.type} 고무혼합`
    }));
    return [...cpList, ...rbList];
  }, []);

  // If not 설유철 and not Admin, do not render
  if (!isSeolYuCheol) return null;

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-teal-500/50 backdrop-blur-md text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ 설유철 작업자 전용 2줄 BOM 등록 & 오탈자/재료변경 수정 패널 */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 border border-teal-600/50 rounded-2xl p-3 sm:p-3.5 shadow-xl text-white animate-fadeIn space-y-2.5">
        <form onSubmit={handleRegisterBOM} className="space-y-2.5 text-xs">
          
          {/* ━━━ [1줄] 품목 선택 / 신규 등록 & 심금 / 코팅액 & 액션 버튼 ━━━ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Title / Badge indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 font-black text-xs shrink-0 border border-teal-500/30 shadow-xs">
              <Edit3 className="w-3.5 h-3.5 text-teal-400" />
              <span>설유철 BOM 설정</span>
            </div>

            {/* 품목 선택 (또는 신규 직접입력) */}
            {!isCustomItemMode ? (
              <div className="flex-1 min-w-[240px]">
                <select
                  value={selectedItemKey}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-teal-500/70 text-white font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer shadow-xs"
                  title="생산 품목 선택 (선택 시 기존 BOM 자동로딩)"
                >
                  <option value="">-- 대상 품목 선택 (총 {allMasterItems.length}종) --</option>
                  {allMasterItems.map((it) => {
                    const k = `${it.vehicle}:::${it.itemName}`;
                    const isMod = !!customBOMMap[k];
                    return (
                      <option key={k} value={k}>
                        {isMod ? "✍️ " : ""}[{it.lineBadge}] [{it.vehicle}] {it.itemName}{it.isAS ? " (A/S)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={customVehicle}
                  onChange={(e) => {
                    isUserEditingRef.current = true;
                    setCustomVehicle(e.target.value);
                  }}
                  placeholder="신규 차종(예: NX4)"
                  className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-800 border border-amber-400 text-amber-300 font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => {
                    isUserEditingRef.current = true;
                    setCustomItemName(e.target.value);
                  }}
                  placeholder="신규 품명(예: G/RUN)"
                  className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-800 border border-amber-400 text-amber-300 font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
              </div>
            )}

            {/* Toggle New Item Input Mode Button */}
            <button
              type="button"
              onClick={() => {
                setIsCustomItemMode(!isCustomItemMode);
                if (!isCustomItemMode) {
                  setCustomVehicle("");
                  setCustomItemName("");
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                isCustomItemMode
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600"
              }`}
              title={isCustomItemMode ? "목록 선택 모드로 전환" : "목록에 없는 신규 품목 직접 추가"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCustomItemMode ? "선택모드" : "신규추가"}</span>
            </button>

            {/* 심금 (미사용/직접선택/입력) */}
            <MaterialCombobox
              value={insertType}
              onChange={(val) => {
                isUserEditingRef.current = true;
                setInsertType(val);
              }}
              options={EPDM_INSERTS}
              placeholder="심금(미사용)"
              title="심금(Insert) - 미사용 가능"
              theme="amber"
              className="w-[130px]"
            />

            {/* 코팅액 (미사용/직접선택/입력) */}
            <MaterialCombobox
              value={coatingType}
              onChange={(val) => {
                isUserEditingRef.current = true;
                setCoatingType(val);
              }}
              options={EPDM_COATINGS}
              placeholder="코팅액(미사용)"
              title="코팅액 - 미사용 가능"
              theme="sky"
              className="w-[130px]"
            />

            {/* 저장/등록 버튼 & 전체목록 버튼 */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="submit"
                disabled={isSaving}
                className="py-1.5 px-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-teal-500/20"
                title="선택/입력 품목의 원재료 BOM 저장"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "저장중..." : "저장"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsListModalOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 shadow-xs"
                title="268종 전체 압출 품목 BOM 목록 조회 및 관리"
              >
                <ListFilter className="w-3.5 h-3.5 text-teal-400" />
                <span>전체목록 ({allMasterItems.length})</span>
                {customModifiedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black">
                    {customModifiedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ━━━ [2줄] 연고무 2종 + 컴파운드 4종 배합 상세 ━━━ */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            {/* 연고무 묶음 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[280px] bg-slate-950/40 p-1.5 rounded-xl border border-indigo-900/40">
              <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] shrink-0 border border-indigo-500/30">
                연고무
              </span>
              <MaterialCombobox
                value={rubberType}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setRubberType(val);
                }}
                options={EPDM_RUBBERS}
                placeholder="연고무 1종(미사용)"
                title="사용연고무 #1 (목록 선택/타이핑, 미사용 선택 가능)"
                theme="indigo"
                className="flex-1 min-w-[110px]"
              />
              <MaterialCombobox
                value={rubberType2}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setRubberType2(val);
                }}
                options={EPDM_RUBBERS}
                placeholder="연고무 2종(미사용)"
                title="사용연고무 #2 (2종 투입 시, 미사용 선택 가능)"
                theme="indigo"
                className="flex-1 min-w-[110px]"
              />
            </div>

            {/* 컴파운드 4종 묶음 */}
            <div className="flex items-center gap-1.5 flex-2 min-w-[520px] bg-slate-950/40 p-1.5 rounded-xl border border-emerald-900/40">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] shrink-0 border border-emerald-500/30">
                컴파운드
              </span>
              <MaterialCombobox
                value={compoundType}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setCompoundType(val);
                }}
                options={compoundOptions}
                placeholder="컴파운드 1종"
                title="컴파운드 #1 (목록 선택/타이핑, 미사용 선택 가능)"
                theme="emerald"
                className="flex-1 min-w-[110px]"
              />
              <MaterialCombobox
                value={compoundType2}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setCompoundType2(val);
                }}
                options={compoundOptions}
                placeholder="컴파운드 2종"
                title="컴파운드 #2 (2종 투입 시, 미사용 선택 가능)"
                theme="emerald"
                className="flex-1 min-w-[110px]"
              />
              <MaterialCombobox
                value={compoundType3}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setCompoundType3(val);
                }}
                options={compoundOptions}
                placeholder="컴파운드 3종"
                title="컴파운드 #3 (3종 투입 시, 미사용 선택 가능)"
                theme="emerald"
                className="flex-1 min-w-[110px]"
              />
              <MaterialCombobox
                value={compoundType4}
                onChange={(val) => {
                  isUserEditingRef.current = true;
                  setCompoundType4(val);
                }}
                options={compoundOptions}
                placeholder="컴파운드 4종"
                title="컴파운드 #4 (4종 투입 시, 미사용 선택 가능)"
                theme="emerald"
                className="flex-1 min-w-[110px]"
              />
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 📋 전체 압출 품목 원재료 BOM 목록 & 수정/삭제 모달 */}
      {/* ========================================================================= */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-6 space-y-3.5 max-h-[88vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>압출 전체 품목 원재료 BOM 현황 및 관리</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black border border-teal-300">
                      총 {allMasterItems.length}종 (조회: {fullBOMCatalogList.length}건)
                    </span>
                    {customModifiedCount > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-300">
                        설유철 수정 {customModifiedCount}건
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    삼랑진공장 PCM 1호·3호, PVC, TPE 라인 268개 품목별 연고무, 컴파운드 4종, 심금, 코팅액 전체 BOM 목록
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Line Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                {[
                  { id: "ALL", label: "전체" },
                  { id: "pcm1", label: "PCM 1호" },
                  { id: "pcm3", label: "PCM 3호" },
                  { id: "pvc", label: "PVC" },
                  { id: "tpe", label: "TPE" },
                  { id: "custom_only", label: `✍️ 수정본 (${customModifiedCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLineFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      lineFilter === tab.id
                        ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs font-black"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="차종, 품명, 연고무, 컴파운드, 심금, 코팅액 검색..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Reset All Custom Overrides Button */}
              {customModifiedCount > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("⚠️ 등록된 모든 커스텀 BOM 수정을 초기화하고 순수 엑셀 원본 BOM으로 리셋하시겠습니까?")) {
                      await resetAllCustomBOM();
                      showToast("🧹 모든 커스텀 BOM이 초기화되고 원본으로 복원되었습니다.");
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  title="모든 수정사항 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>수정초기화</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {fullBOMCatalogList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  검색 조건과 일치하는 압출 품목이 없습니다.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 text-center w-12">라인</th>
                      <th className="p-2.5 w-16">차종</th>
                      <th className="p-2.5">품명</th>
                      <th className="p-2.5">연고무 (1·2종)</th>
                      <th className="p-2.5">컴파운드 (1·2·3·4종)</th>
                      <th className="p-2.5">심금</th>
                      <th className="p-2.5">코팅액</th>
                      <th className="p-2.5 text-center w-16">상태</th>
                      <th className="p-2.5 text-center w-24">수정 / 삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fullBOMCatalogList.map((row) => (
                      <tr
                        key={row.key}
                        className={`transition ${
                          row.isCustom
                            ? "bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {/* 라인 뱃지 */}
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-black ${
                              row.lineId === "pcm1"
                                ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300"
                                : row.lineId === "pcm3"
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                                : row.lineId === "pvc"
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                                : "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                            }`}
                          >
                            {row.lineBadge}
                          </span>
                        </td>

                        {/* 차종 */}
                        <td className="p-2.5 font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {row.vehicle}
                        </td>

                        {/* 품명 */}
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          <span>{row.itemName}</span>
                          {row.isAS && (
                            <span className="ml-1 text-[10px] text-amber-600 font-bold">(A/S)</span>
                          )}
                        </td>

                        {/* 연고무 */}
                        <td className="p-2.5 font-black text-indigo-700 dark:text-indigo-400">
                          <div>{row.rubberType || "-"}</div>
                          {row.rubberType2 && (
                            <div className="text-[10.5px] text-indigo-500 font-semibold">+ {row.rubberType2}</div>
                          )}
                        </td>

                        {/* 컴파운드 (1~4종) */}
                        <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <div>{row.compoundType || "-"}</div>
                          {row.compoundType2 && (
                            <div className="text-[10.5px] text-emerald-500 font-semibold">+ {row.compoundType2}</div>
                          )}
                          {row.compoundType3 && (
                            <div className="text-[10.5px] text-emerald-600 font-semibold">+ {row.compoundType3}</div>
                          )}
                          {row.compoundType4 && (
                            <div className="text-[10.5px] text-emerald-600 font-semibold">+ {row.compoundType4}</div>
                          )}
                        </td>

                        {/* 심금 */}
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                          {row.insertType && row.insertType !== "미사용" && row.insertType !== "비사용" && row.insertType !== "없음" ? (
                            <span className="text-amber-700 dark:text-amber-400 font-bold">{row.insertType}</span>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">미사용</span>
                          )}
                        </td>

                        {/* 코팅액 */}
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                          {row.coatingType && row.coatingType !== "미사용" && row.coatingType !== "비사용" && row.coatingType !== "없음" ? (
                            <span className="text-sky-700 dark:text-sky-400 font-bold">{row.coatingType}</span>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">미사용</span>
                          )}
                        </td>

                        {/* 상태 */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {row.isCustom ? (
                            <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black border border-teal-300">
                              ✍️ 수정완료
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                              기본 BOM
                            </span>
                          )}
                        </td>

                        {/* 수정 / 삭제 액션 */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditFromModal(row)}
                              className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                              title="이 품목 상단 폼에 불러와 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRevertCustomBOM(row.key)}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer border border-transparent hover:border-rose-300"
                              title="BOM 삭제 / 초기화"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-teal-700 dark:text-teal-300 font-bold">
                * [수정]을 누르면 상단 입력바에 즉시 로드되고, [삭제] 아이콘을 누르면 해당 BOM 설정이 삭제/초기화됩니다.
              </span>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExtrusionMaterialBOMQuickPanel;
