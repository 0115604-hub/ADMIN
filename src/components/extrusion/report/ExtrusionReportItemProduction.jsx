import React from "react";
import { Layers, Trash2, Plus, X } from "lucide-react";
import {
  EPDM_RUBBERS,
  EPDM_COMPOUNDS,
  EPDM_INSERTS,
  EPDM_COATINGS,
  getMaterialBOMForItem
} from "../../../data/extrusionRawMaterialsData";
import { CLEAN_LINE_OPTIONS } from "./ExtrusionReportBasicInfo";

/**
 * 🌟 Section 2: Multi-Item Production Management (BOM, Raw materials, Weight/LOT, Quantities)
 */
export const ExtrusionReportItemProduction = ({
  formData,
  errors = {},
  activeLineItems = [],
  handleRemoveItem,
  handleItemFieldChange,
  handleItemRawMaterialChange,
  handleAddItem
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ② 생산 품목 현황 (다품종 교체 생산 지원)
        </span>
        <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
          {formData.lineName || "PCM #1 LINE"} · 등록 품목 {(formData.items || []).length}개
        </span>
      </div>

      {errors.items && <p className="text-rose-500 text-xs font-bold">{errors.items}</p>}

      {/* List of Item Cards */}
      <div className="space-y-3">
        {(formData.items || []).map((item, index) => {
          const itActual = Number(item?.actualQty) || 0;
          const itGood = Number(item?.goodQty) || 0;
          const itTarget = Number(item?.targetQty) || 0;
          const itYield = itActual > 0 ? ((itGood / itActual) * 100).toFixed(1) : "100.0";
          const itAttain = itTarget > 0 ? ((itActual / itTarget) * 100).toFixed(1) : "100.0";
          const currentVal = `${item?.vehicle || ""}:::${item?.itemName || ""}`;
          const currentItemBOM = (item?.vehicle && item?.itemName)
            ? (getMaterialBOMForItem(item.vehicle, item.itemName, formData?.lineId) || {})
            : {};

          return (
            <div
              key={item?.id || index}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200/90 dark:border-blue-900/60 shadow-xs space-y-3"
            >
              {/* Item Card Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs">
                    품목 #{index + 1}
                  </span>
                  {index > 0 && (
                    <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      🔄 품종 교체 생산
                    </span>
                  )}
                  {item?.vehicle && item?.itemName && (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs hidden sm:inline">
                      [{item.vehicle}] {item.itemName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    수율 {itYield}% (달성 {itAttain}%)
                  </span>
                  {(formData.items || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                      title="이 품목 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">삭제</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Item Dropdown */}
              <div>
                <label className="block text-[11px] font-black text-blue-900 dark:text-blue-300 mb-1">
                  📦 생산 품명 선택 (차종/품명 이니셜순 정렬) *
                </label>
                <select
                  value={currentVal}
                  onChange={(e) => handleItemFieldChange(index, "itemSelect", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-600 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer shadow-xs"
                >
                  <option value="">
                    -- [
                    {CLEAN_LINE_OPTIONS.find(
                      (l) =>
                        l.id === formData?.lineId ||
                        l.fullName === formData?.lineId ||
                        l.name === formData?.lineId
                    )?.name || "라인"}
                    ] 아이템을 선택하세요 (총 {activeLineItems.length}개) --
                  </option>
                  {activeLineItems.map((it) => (
                    <option key={it.id} value={`${it.vehicle}:::${it.itemName}`}>
                      [{it.vehicle}] {it.itemName}
                      {it.isAS ? " 🛠️(A/S)" : ""}
                    </option>
                  ))}
                </select>

                {/* Minimal Raw Material BOM & Weight/LOT Direct Inputs (한줄짜리 간략한 뱃지) */}
                {(() => {
                  if (!item?.vehicle || !item?.itemName) return null;
                  const itemBOM =
                    getMaterialBOMForItem(item.vehicle, item.itemName, formData?.lineId) || {};
                  const itemRawMat =
                    item.rawMaterials || (index === 0 ? formData?.rawMaterials : null) || {};

                  const ALL_MATERIAL_SLOTS = [
                    {
                      id: "rubberType",
                      weightKey: "rubberWeight",
                      lotKey: "rubberLot",
                      icon: "⬛",
                      label: "연고무1",
                      val:
                        itemRawMat.rubberType !== undefined
                          ? itemRawMat.rubberType
                          : itemBOM.rubberType || "",
                      defaultVal: EPDM_RUBBERS[0]?.name || "W60712$2",
                      containerCls:
                        "bg-slate-900/90 dark:bg-slate-950 border-slate-700 text-slate-100",
                      specTextCls: "text-amber-300",
                      required: true
                    },
                    {
                      id: "rubberType2",
                      weightKey: "rubberWeight2",
                      lotKey: "rubberLot2",
                      icon: "⬛",
                      label: "연고무2",
                      val:
                        itemRawMat.rubberType2 !== undefined
                          ? itemRawMat.rubberType2
                          : itemBOM.rubberType2 || "",
                      defaultVal: EPDM_RUBBERS[1]?.name || "W60712$1",
                      containerCls:
                        "bg-slate-900/90 dark:bg-slate-950 border-slate-700 text-slate-100",
                      specTextCls: "text-amber-300",
                      required: false
                    },
                    {
                      id: "compoundType",
                      weightKey: "compoundWeight",
                      lotKey: "compoundLot",
                      icon: "🧬",
                      label: "컴파운드1",
                      val:
                        itemRawMat.compoundType !== undefined
                          ? itemRawMat.compoundType
                          : itemBOM.compoundType || "",
                      defaultVal: EPDM_COMPOUNDS[0]?.name || "IA4-75B_1",
                      containerCls:
                        "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                      specTextCls: "text-emerald-300",
                      required: true
                    },
                    {
                      id: "compoundType2",
                      weightKey: "compoundWeight2",
                      lotKey: "compoundLot2",
                      icon: "🧬",
                      label: "컴파운드2",
                      val:
                        itemRawMat.compoundType2 !== undefined
                          ? itemRawMat.compoundType2
                          : itemBOM.compoundType2 || "",
                      defaultVal: EPDM_COMPOUNDS[1]?.name || "B64E",
                      containerCls:
                        "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                      specTextCls: "text-emerald-300",
                      required: false
                    },
                    {
                      id: "compoundType3",
                      weightKey: "compoundWeight3",
                      lotKey: "compoundLot3",
                      icon: "🧬",
                      label: "컴파운드3",
                      val:
                        itemRawMat.compoundType3 !== undefined
                          ? itemRawMat.compoundType3
                          : itemBOM.compoundType3 || "",
                      defaultVal: EPDM_COMPOUNDS[2]?.name || "L2KIA7-35B",
                      containerCls:
                        "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                      specTextCls: "text-emerald-300",
                      required: false
                    },
                    {
                      id: "compoundType4",
                      weightKey: "compoundWeight4",
                      lotKey: "compoundLot4",
                      icon: "🧬",
                      label: "컴파운드4",
                      val:
                        itemRawMat.compoundType4 !== undefined
                          ? itemRawMat.compoundType4
                          : itemBOM.compoundType4 || "",
                      defaultVal: EPDM_COMPOUNDS[3]?.name || "ED2-53B",
                      containerCls:
                        "bg-emerald-950/80 dark:bg-emerald-950 border-emerald-700/80 text-emerald-100",
                      specTextCls: "text-emerald-300",
                      required: false
                    },
                    {
                      id: "insertType",
                      weightKey: "insertWeight",
                      lotKey: "insertLot",
                      icon: "⚙️",
                      label: "심금",
                      val:
                        itemRawMat.insertType !== undefined
                          ? itemRawMat.insertType
                          : itemBOM.insertType || "미사용",
                      defaultVal: EPDM_INSERTS[0]?.name || "SUS430(0.4*51*3)",
                      containerCls:
                        "bg-amber-950/80 dark:bg-amber-950 border-amber-700/80 text-amber-100",
                      specTextCls: "text-amber-300",
                      required: false
                    },
                    {
                      id: "coatingType",
                      weightKey: "coatingWeight",
                      lotKey: "coatingLot",
                      icon: "🧪",
                      label: "코팅액",
                      val:
                        itemRawMat.coatingType !== undefined
                          ? itemRawMat.coatingType
                          : itemBOM.coatingType || "미사용",
                      defaultVal: EPDM_COATINGS[0]?.name || "HSC-2000-B-3",
                      containerCls:
                        "bg-sky-950/80 dark:bg-sky-950 border-sky-700/80 text-sky-100",
                      specTextCls: "text-sky-300",
                      required: false
                    }
                  ];

                  const activeSlots = ALL_MATERIAL_SLOTS.filter(
                    (s) =>
                      s.val &&
                      typeof s.val === "string" &&
                      s.val.trim() !== "" &&
                      s.val.trim() !== "미사용" &&
                      s.val.trim() !== "비사용" &&
                      s.val.trim() !== "없음"
                  );
                  const unusedSlots = ALL_MATERIAL_SLOTS.filter(
                    (s) =>
                      !s.val ||
                      typeof s.val !== "string" ||
                      s.val.trim() === "" ||
                      s.val.trim() === "미사용" ||
                      s.val.trim() === "비사용" ||
                      s.val.trim() === "없음"
                  );

                  return (
                    <div className="pt-2 pb-0.5 space-y-2">
                      {activeSlots.length > 0 ? (
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950 border-2 border-slate-700/80 shadow-md space-y-2">
                          {/* Header: Concise single-line badge */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1 border-b border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-xs">
                                🌿 원재료 BOM
                              </span>
                              <span className="text-[11px] font-bold text-emerald-300">
                                투입 LOT 및 이론 소진량
                              </span>
                            </div>

                            {/* Quick Add Unused Materials if needed */}
                            {unusedSlots.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  +자재추가:
                                </span>
                                {unusedSlots.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() =>
                                      handleItemRawMaterialChange(index, u.id, u.defaultVal)
                                    }
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer flex items-center gap-1 transition active:scale-95"
                                  >
                                    <span>{u.icon}</span>
                                    <span>+{u.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Single-line compact material cards */}
                          <div className="space-y-1.5">
                            {activeSlots.map((slot) => {
                              const currentLot = itemRawMat[slot.lotKey] || "";

                              return (
                                <div
                                  key={slot.id}
                                  className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-xs ${slot.containerCls}`}
                                >
                                  {/* Left Badge: Name & Spec */}
                                  <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-[140px] sm:w-[170px] shrink-0">
                                    <div className="flex items-center gap-1 truncate">
                                      <span className="text-xs">{slot.icon}</span>
                                      <span className="opacity-80 font-bold text-[10.5px]">
                                        {slot.label}:
                                      </span>
                                      <span
                                        className={`text-xs font-black truncate ${slot.specTextCls}`}
                                      >
                                        {slot.val}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleItemRawMaterialChange(index, slot.id, "미사용")
                                      }
                                      className="sm:hidden text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                                      title="이 자재 미사용 처리"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Right Direct Inputs: 소진량 이론치(자동계산) & LOT 넘버 (➕ LOT 추가 지원) */}
                                  <div className="flex items-center gap-2 flex-1">
                                    {/* 이론 소진량 (총생산량 * 단위중량) 자동 산출 배지 */}
                                    <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-emerald-500/60 shrink-0">
                                      <span className="text-[10.5px] font-black text-emerald-400 whitespace-nowrap">
                                        이론 소진량
                                      </span>
                                      <span className="text-xs sm:text-sm font-mono font-black text-emerald-300">
                                        {(itActual * ((itemBOM.unitWeightKg || 0.5))).toFixed(1)}kg
                                      </span>
                                      <span className="text-[9.5px] text-slate-400 font-mono">
                                        ({itemBOM.unitWeightG || 500}g/EA)
                                      </span>
                                    </div>

                                    {/* LOT 넘버 입력란 & 원터치 [➕ LOT 추가] */}
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <span className="text-[10px] font-black text-indigo-300 whitespace-nowrap shrink-0">
                                        LOT
                                      </span>
                                      <input
                                        type="text"
                                        value={currentLot}
                                        onChange={(e) =>
                                          handleItemRawMaterialChange(
                                            index,
                                            slot.lotKey,
                                            e.target.value
                                          )
                                        }
                                        placeholder="LOT No. 입력 (교체 시 ➕LOT추가)"
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/90 dark:bg-slate-900 border border-indigo-400/80 text-xs font-bold text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextLot = currentLot ? `${currentLot} ➔ ` : "";
                                          handleItemRawMaterialChange(index, slot.lotKey, nextLot);
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 shrink-0"
                                        title="재료 교체 시 새 LOT 추가 기록"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>LOT추가</span>
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleItemRawMaterialChange(index, slot.id, "미사용")
                                      }
                                      className="hidden sm:block text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer shrink-0"
                                      title="이 자재 미사용 처리"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span>🌿</span>
                            <span>선택된 품목에 매칭된 BOM 원재료가 없습니다.</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-bold">
                              자재 추가:
                            </span>
                            {unusedSlots.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() =>
                                  handleItemRawMaterialChange(index, u.id, u.defaultVal)
                                }
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 cursor-pointer"
                              >
                                <span>{u.icon}</span>
                                <span>+{u.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Item Quantities: 지시/계획수량 & 총생산량만 노출 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1">
                    지시/계획수량 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.targetQty}
                    onChange={(e) =>
                      handleItemFieldChange(index, "targetQty", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
                    <span>총생산량 (EA) *</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      (이론원재료: {(Number(item.actualQty || 0) * (currentItemBOM.unitWeightKg || 0.5)).toFixed(1)}kg)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.actualQty}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleItemFieldChange(index, "actualQty", v);
                      // 양품수량도 총생산량과 동일하게 자동 연동 (내부 데이터 보존)
                      handleItemFieldChange(index, "goodQty", v);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 font-black text-right text-emerald-700 dark:text-emerald-400 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ➕ Add Item Button */}
      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4" />
        <span>➕ 생산품목 추가 (주/야간 품종 교체 생산)</span>
      </button>
    </div>
  );
};

export default ExtrusionReportItemProduction;
