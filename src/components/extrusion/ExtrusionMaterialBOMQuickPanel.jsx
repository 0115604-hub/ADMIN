import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  CheckCircle2,
  ListFilter,
  X,
  Trash2,
  Search
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

  // Form selections (연고무 2종, 컴파운드 4종, 심금/코팅액 선택/미사용)
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [rubberType, setRubberType] = useState(EPDM_RUBBERS[0]?.name || "W60712$2");
  const [rubberType2, setRubberType2] = useState("");
  const [compoundType, setCompoundType] = useState(EPDM_COMPOUNDS[0]?.name || "IA4-75B_1");
  const [compoundType2, setCompoundType2] = useState("");
  const [compoundType3, setCompoundType3] = useState("");
  const [compoundType4, setCompoundType4] = useState("");
  const [insertType, setInsertType] = useState(""); // 빈 값 = 미사용
  const [coatingType, setCoatingType] = useState(""); // 빈 값 = 미사용

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

  // Pre-fill fields helper
  const applyBOMToFields = (existingBOM) => {
    if (!existingBOM) return;
    setRubberType(existingBOM.rubberType || "");
    setRubberType2(existingBOM.rubberType2 || "");
    setCompoundType(existingBOM.compoundType || "");
    setCompoundType2(existingBOM.compoundType2 || "");
    setCompoundType3(existingBOM.compoundType3 || "");
    setCompoundType4(existingBOM.compoundType4 || "");
    setInsertType(existingBOM.insertType === "미사용" ? "" : (existingBOM.insertType || ""));
    setCoatingType(existingBOM.coatingType === "미사용" ? "" : (existingBOM.coatingType || ""));
  };

  // Initial item key selection
  useEffect(() => {
    if (!selectedItemKey && uniqueItems.length > 0) {
      const first = uniqueItems[0];
      const initialKey = `${first.vehicle}:::${first.itemName}`;
      setSelectedItemKey(initialKey);
      const existingBOM = getMaterialBOMForItem(first.vehicle, first.itemName, first.lineBadge);
      applyBOMToFields(existingBOM);
    }
  }, [uniqueItems, selectedItemKey]);

  // When item selection changes, pre-fill with current BOM
  const handleItemSelect = (itemKey) => {
    setSelectedItemKey(itemKey);
    if (!itemKey) return;
    const [v, n] = itemKey.split(":::");
    const found = uniqueItems.find((it) => it.vehicle === v && it.itemName === n);
    const existing = getMaterialBOMForItem(v, n, found?.lineBadge);
    applyBOMToFields(existing);
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
          rubberType: rubberType || "",
          rubberType2: rubberType2 || "",
          compoundType: compoundType || "",
          compoundType2: compoundType2 || "",
          compoundType3: compoundType3 || "",
          compoundType4: compoundType4 || "",
          insertType: insertType || "미사용",
          coatingType: coatingType || "미사용"
        },
        currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "책임"}` : "설유철 책임"
      );

      showToast(`✅ [${v}] ${n || "전체"} 원재료 BOM 등록 완료!`);
      if (onBOMRegistered) {
        onBOMRegistered({
          vehicle: v,
          itemName: n,
          rubberType,
          rubberType2,
          compoundType,
          compoundType2,
          compoundType3,
          compoundType4,
          insertType: insertType || "미사용",
          coatingType: coatingType || "미사용"
        });
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
        rubberType2: val.rubberType2 || "",
        compoundType: val.compoundType || "-",
        compoundType2: val.compoundType2 || "",
        compoundType3: val.compoundType3 || "",
        insertType: val.insertType || "미사용",
        coatingType: val.coatingType || "미사용",
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
          it.rubberType2.toLowerCase().includes(q) ||
          it.compoundType.toLowerCase().includes(q) ||
          it.compoundType2.toLowerCase().includes(q) ||
          it.compoundType3.toLowerCase().includes(q) ||
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
      {/* ⭐ 깔끔한 한 줄짜리 BOM 등록 패널 (문구 삭제 완료) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-md text-white animate-fadeIn">
        <form onSubmit={handleRegisterBOM} className="flex flex-wrap items-center gap-2 text-xs">
          {/* 1. 품목 선택 */}
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedItemKey}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-teal-500/60 text-white font-black text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer shadow-xs"
              title="생산 품목 선택"
            >
              <option value="">-- 품목 선택 ({uniqueItems.length}종) --</option>
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

          {/* 2. 연고무 #1 */}
          <div className="w-[125px]">
            <select
              value={rubberType}
              onChange={(e) => setRubberType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300 font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
              title="사용연고무 #1"
            >
              <option value="">연고무1: 미사용</option>
              {EPDM_RUBBERS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          {/* 3. 연고무 #2 (2종 투입 가능) */}
          <div className="w-[125px]">
            <select
              value={rubberType2}
              onChange={(e) => setRubberType2(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl bg-slate-800 border text-xs font-bold focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer ${
                rubberType2 ? "border-indigo-500/70 text-indigo-300" : "border-slate-700 text-slate-400"
              }`}
              title="사용연고무 #2 (2종 투입 시 선택)"
            >
              <option value="">연고무2: (없음)</option>
              {EPDM_RUBBERS.map((r) => (
                <option key={`r2_${r.name}`} value={r.name}>
                  + {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          {/* 4. 컴파운드 #1 */}
          <div className="w-[130px]">
            <select
              value={compoundType}
              onChange={(e) => setCompoundType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer"
              title="컴파운드 #1"
            >
              <option value="">컴파운드1: 미사용</option>
              <optgroup label="-- 컴파운드 --">
                {EPDM_COMPOUNDS.map((cp) => (
                  <option key={cp.name} value={cp.name}>
                    {cp.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="-- 연고무 혼합 --">
                {EPDM_RUBBERS.map((r) => (
                  <option key={`cp_r_${r.name}`} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 5. 컴파운드 #2 (2종 투입 가능) */}
          <div className="w-[130px]">
            <select
              value={compoundType2}
              onChange={(e) => setCompoundType2(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl bg-slate-800 border text-xs font-bold focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer ${
                compoundType2 ? "border-emerald-500/70 text-emerald-300" : "border-slate-700 text-slate-400"
              }`}
              title="컴파운드 #2 (2종 투입 시 선택)"
            >
              <option value="">컴파운드2: (없음)</option>
              <optgroup label="-- 컴파운드 --">
                {EPDM_COMPOUNDS.map((cp) => (
                  <option key={`cp2_${cp.name}`} value={cp.name}>
                    + {cp.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="-- 연고무 혼합 --">
                {EPDM_RUBBERS.map((r) => (
                  <option key={`cp2_r_${r.name}`} value={r.name}>
                    + {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 6. 컴파운드 #3 (3종 투입 가능) */}
          <div className="w-[130px]">
            <select
              value={compoundType3}
              onChange={(e) => setCompoundType3(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl bg-slate-800 border text-xs font-bold focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer ${
                compoundType3 ? "border-emerald-500/70 text-emerald-300" : "border-slate-700 text-slate-400"
              }`}
              title="컴파운드 #3 (3종 투입 시 선택)"
            >
              <option value="">컴파운드3: (없음)</option>
              <optgroup label="-- 컴파운드 --">
                {EPDM_COMPOUNDS.map((cp) => (
                  <option key={`cp3_${cp.name}`} value={cp.name}>
                    + {cp.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="-- 연고무 혼합 --">
                {EPDM_RUBBERS.map((r) => (
                  <option key={`cp3_r_${r.name}`} value={r.name}>
                    + {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 7. 심금 (미사용 가능) */}
          <div className="w-[125px]">
            <select
              value={insertType}
              onChange={(e) => setInsertType(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl bg-slate-800 border text-xs font-bold focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer ${
                insertType ? "border-amber-500/70 text-amber-300" : "border-slate-700 text-slate-400"
              }`}
              title="심금(Insert) - 미사용 가능"
            >
              <option value="">심금: 미사용(없음)</option>
              {EPDM_INSERTS.map((ins) => (
                <option key={ins.name} value={ins.name}>
                  심금: {ins.name}
                </option>
              ))}
            </select>
          </div>

          {/* 8. 코팅액 (미사용 가능) */}
          <div className="w-[125px]">
            <select
              value={coatingType}
              onChange={(e) => setCoatingType(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl bg-slate-800 border text-xs font-bold focus:ring-2 focus:ring-teal-400 focus:outline-hidden cursor-pointer ${
                coatingType ? "border-sky-500/70 text-sky-300" : "border-slate-700 text-slate-400"
              }`}
              title="코팅액 - 미사용 가능"
            >
              <option value="">코팅액: 미사용(없음)</option>
              {EPDM_COATINGS.map((ct) => (
                <option key={ct.name} value={ct.name}>
                  코팅: {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* 9. 등록 버튼 & 등록현황 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="py-1.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-md"
              title="선택 품목의 원재료 BOM 등록"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "저장중" : "등록"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsListModalOpen(true)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-slate-700"
              title="등록된 BOM 전체 목록 확인"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>({registeredCount})</span>
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
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
                    품목별 사용연고무(1·2종), 컴파운드(1·2·3종), 심금, 코팅액 매핑 목록
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
                      <th className="p-2.5">연고무 (1·2종)</th>
                      <th className="p-2.5">컴파운드 (1·2·3종)</th>
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
                        <td className="p-2.5 font-black text-indigo-700 dark:text-indigo-400">
                          <div>{row.rubberType || "-"}</div>
                          {row.rubberType2 && (
                            <div className="text-[10.5px] text-indigo-500 font-semibold">+ {row.rubberType2}</div>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <div>{row.compoundType || "-"}</div>
                          {row.compoundType2 && (
                            <div className="text-[10.5px] text-emerald-500 font-semibold">+ {row.compoundType2}</div>
                          )}
                          {row.compoundType3 && (
                            <div className="text-[10.5px] text-emerald-600 font-semibold">+ {row.compoundType3}</div>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                          {row.insertType && row.insertType !== "미사용" ? (
                            <span className="text-amber-700 dark:text-amber-400 font-bold">{row.insertType}</span>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">미사용</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                          {row.coatingType && row.coatingType !== "미사용" ? (
                            <span className="text-sky-700 dark:text-sky-400 font-bold">{row.coatingType}</span>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">미사용</span>
                          )}
                        </td>
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
