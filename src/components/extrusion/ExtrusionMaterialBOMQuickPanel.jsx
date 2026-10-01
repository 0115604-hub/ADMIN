import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Package,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  ListFilter,
  X,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
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
  subscribeToCustomBOM,
  getLocalCustomBOMMap
} from "../../services/extrusionBOMService";

export const ExtrusionMaterialBOMQuickPanel = ({ onBOMRegistered = null }) => {
  const { currentProfile, isAdmin } = useAuth();

  // Condition: Visible only to 설유철 (or Admin)
  const isSeolYuCheol =
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    currentProfile?.name?.includes("설유철") ||
    isAdmin;

  // Real-time custom BOM map state
  const [customBOMMap, setCustomBOMMap] = useState(() => getLocalCustomBOMMap());
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form selections
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [rubberType, setRubberType] = useState(EPDM_RUBBERS[0]?.name || "W60712$2");
  const [compoundType, setCompoundType] = useState(EPDM_COMPOUNDS[0]?.name || "IA4-75B_1");
  const [insertType, setInsertType] = useState(EPDM_INSERTS[0]?.name || "SUS430(0.4*51*3)");
  const [coatingType, setCoatingType] = useState(EPDM_COATINGS[0]?.name || "HSL-770K-2(주제)");

  // Real-time listener for BOM updates
  useEffect(() => {
    const unsub = subscribeToCustomBOM((map) => {
      setCustomBOMMap(map || {});
    });
    return () => unsub();
  }, []);

  // Sorted, unique list of all extrusion items
  const uniqueItems = useMemo(() => {
    const all = getAllExtrusionItems();
    const map = new Map();
    all.forEach((it) => {
      const key = `${it.vehicle}:::${it.itemName}`;
      if (!map.has(key)) {
        map.set(key, {
          vehicle: it.vehicle,
          itemName: it.itemName,
          lineBadge: it.lineBadge || it.lineId || "",
          label: `[${it.vehicle}] ${it.itemName}`,
          isAS: it.isAS
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.vehicle !== b.vehicle) return a.vehicle.localeCompare(b.vehicle);
      return a.itemName.localeCompare(b.itemName);
    });
  }, []);

  // When initial item key is unset, select first item
  useEffect(() => {
    if (!selectedItemKey && uniqueItems.length > 0) {
      const first = uniqueItems[0];
      const initialKey = `${first.vehicle}:::${first.itemName}`;
      setSelectedItemKey(initialKey);
      const existingBOM = getMaterialBOMForItem(first.vehicle, first.itemName);
      if (existingBOM) {
        if (existingBOM.rubberType) setRubberType(existingBOM.rubberType);
        if (existingBOM.compoundType) setCompoundType(existingBOM.compoundType);
        if (existingBOM.insertType) setInsertType(existingBOM.insertType);
        if (existingBOM.coatingType) setCoatingType(existingBOM.coatingType);
      }
    }
  }, [uniqueItems, selectedItemKey]);

  // When item selection changes, pre-fill with current BOM
  const handleItemSelect = (itemKey) => {
    setSelectedItemKey(itemKey);
    if (!itemKey) return;
    const [v, n] = itemKey.split(":::");
    const existing = getMaterialBOMForItem(v, n);
    if (existing) {
      if (existing.rubberType) setRubberType(existing.rubberType);
      if (existing.compoundType) setCompoundType(existing.compoundType);
      if (existing.insertType) setInsertType(existing.insertType);
      if (existing.coatingType) setCoatingType(existing.coatingType);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Register BOM mapping handler
  const handleRegisterBOM = async (e) => {
    if (e) e.preventDefault();
    if (!selectedItemKey) {
      showToast("⚠️ 등록할 품목을 선택해 주세요.");
      return;
    }

    const [v, n] = selectedItemKey.split(":::");
    if (!v) {
      showToast("⚠️ 차종 정보가 유효하지 않습니다.");
      return;
    }

    setIsSaving(true);
    try {
      await saveBOMMapping(
        v,
        n,
        {
          rubberType,
          compoundType,
          insertType,
          coatingType
        },
        currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "책임"}` : "설유철 책임"
      );

      showToast(`✅ [${v}] ${n || "전체"} 원재료 BOM이 성공적으로 등록되었습니다!`);
      if (onBOMRegistered) {
        onBOMRegistered({ vehicle: v, itemName: n, rubberType, compoundType, insertType, coatingType });
      }
    } catch (err) {
      console.error("BOM registration error:", err);
      showToast("❌ 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete BOM handler
  const handleDeleteBOM = async (key) => {
    const [v, n] = key.split(":::");
    if (window.confirm(`[${v}] ${n || "전체"} 의 등록된 BOM 설정을 삭제하시겠습니까?`)) {
      try {
        await deleteBOMMapping(key);
        showToast(`🗑️ [${v}] ${n || "전체"} BOM 설정이 삭제되었습니다.`);
      } catch (err) {
        console.error(err);
        showToast("❌ 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // Count registered items
  const registeredCount = Object.keys(customBOMMap).length;

  // Registered BOM items for the list modal
  const registeredList = useMemo(() => {
    return Object.entries(customBOMMap)
      .map(([k, val]) => ({
        key: k,
        vehicle: val.vehicle || k.split(":::")[0],
        itemName: val.itemName || k.split(":::")[1] || "-",
        rubberType: val.rubberType || "-",
        compoundType: val.compoundType || "-",
        insertType: val.insertType || "-",
        coatingType: val.coatingType || "-",
        updatedAt: val.updatedAt || "",
        registeredBy: val.registeredBy || "설유철 책임"
      }))
      .filter((it) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
          it.vehicle.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          it.rubberType.toLowerCase().includes(q) ||
          it.compoundType.toLowerCase().includes(q) ||
          it.insertType.toLowerCase().includes(q) ||
          it.coatingType.toLowerCase().includes(q)
        );
      });
  }, [customBOMMap, searchFilter]);

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
      {/* ⭐ 설유철 책임 전용 한 줄짜리 BOM 등록 패널 (Single-Line Bar) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-2 border-teal-500/60 rounded-2xl p-3 sm:p-3.5 shadow-lg text-white space-y-2 animate-fadeIn">
        {/* Top Header Label */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-teal-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-teal-500/30 text-teal-300 border border-teal-400/40 shrink-0">
              <Wrench className="w-3.5 h-3.5" />
            </span>
            <span className="font-black text-teal-200 tracking-tight text-xs sm:text-sm">
              🛠️ [설유철 책임 전용] 품목별 원재료(연고무·컴파운드·심금·코팅액) BOM 퀵 등록
            </span>
            <span className="hidden md:inline text-[11px] text-teal-300/70 font-medium">
              (여기서 등록하면 작업자가 품목 선택 시 해당 원재료가 일보에 자동 입력됩니다)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsListModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 text-[11px] font-black transition cursor-pointer flex items-center gap-1 border border-teal-400/30"
              title="등록된 BOM 전체 목록 확인 및 관리"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>등록현황 ({registeredCount}건)</span>
            </button>
          </div>
        </div>

        {/* Single-Line Form Grid */}
        <form onSubmit={handleRegisterBOM} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
          {/* 1. 품목 선택 (sm: 3.5 cols) */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold text-teal-300/80 mb-0.5">
              📦 생산 품목 선택 *
            </label>
            <select
              value={selectedItemKey}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-teal-500/50 text-white font-black text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer shadow-xs"
            >
              <option value="">-- 품목을 선택하세요 ({uniqueItems.length}종) --</option>
              {uniqueItems.map((it) => {
                const k = `${it.vehicle}:::${it.itemName}`;
                const isMapped = !!customBOMMap[k];
                return (
                  <option key={k} value={k}>
                    {isMapped ? "✅ " : ""}[{it.vehicle}] {it.itemName}{it.isAS ? " (A/S)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. 사용연고무 (sm: 2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-teal-300/80 mb-0.5">
              ⬛ 사용연고무 *
            </label>
            <select
              value={rubberType}
              onChange={(e) => setRubberType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
            >
              {EPDM_RUBBERS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          {/* 3. 컴파운드 (sm: 2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-teal-300/80 mb-0.5">
              🧬 컴파운드 *
            </label>
            <select
              value={compoundType}
              onChange={(e) => setCompoundType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
            >
              <optgroup label="-- 컴파운드 규격 --">
                {EPDM_COMPOUNDS.map((cp) => (
                  <option key={cp.name} value={cp.name}>
                    {cp.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="-- 연고무 혼합 --">
                {EPDM_RUBBERS.map((r) => (
                  <option key={`r_${r.name}`} value={r.name}>
                    {r.name} (연고무)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. 심금 (sm: 2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-teal-300/80 mb-0.5">
              ⚙️ 심금 (Insert) *
            </label>
            <select
              value={insertType}
              onChange={(e) => setInsertType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
            >
              {EPDM_INSERTS.map((ins) => (
                <option key={ins.name} value={ins.name}>
                  {ins.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 코팅액 (sm: 2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-teal-300/80 mb-0.5">
              🧪 코팅액 *
            </label>
            <select
              value={coatingType}
              onChange={(e) => setCoatingType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
            >
              {EPDM_COATINGS.map((ct) => (
                <option key={ct.name} value={ct.name}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* 6. 등록 버튼 (sm: 1 col) */}
          <div className="sm:col-span-1 pt-3 sm:pt-3.5">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-teal-500/30"
              title="선택한 품목에 원재료 매핑 저장"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "저장중" : "등록"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 📋 등록된 BOM 매핑 목록 모달 */}
      {/* ========================================================================= */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>압출 품목별 원재료 BOM 등록 현황</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold border border-teal-300">
                      총 {registeredCount}건
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    설유철 책임이 등록한 품목별 사용연고무, 컴파운드, 심금, 코팅액 매핑 목록
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

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="차종, 품명, 연고무, 컴파운드, 심금, 코팅액 검색..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {registeredList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  등록된 BOM 데이터가 없거나 검색 결과가 없습니다.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">차종</th>
                      <th className="p-2.5">품명</th>
                      <th className="p-2.5">사용연고무</th>
                      <th className="p-2.5">컴파운드</th>
                      <th className="p-2.5">심금</th>
                      <th className="p-2.5">코팅액</th>
                      <th className="p-2.5 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registeredList.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-2.5 font-black text-slate-900 dark:text-white">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">
                            {row.vehicle}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.itemName}</td>
                        <td className="p-2.5 font-black text-indigo-700 dark:text-indigo-400">{row.rubberType}</td>
                        <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">{row.compoundType}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{row.insertType}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{row.coatingType}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteBOM(row.key)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                            title="BOM 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span>* 등록된 항목은 압출 작업일보 작성 시 작업자에게 자동 적용됩니다.</span>
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
