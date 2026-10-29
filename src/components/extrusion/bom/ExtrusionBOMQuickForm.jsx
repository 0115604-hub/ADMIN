import React from "react";
import { Edit3, Plus, Save, ListFilter } from "lucide-react";
import { MaterialCombobox } from "./MaterialCombobox";
import {
  EPDM_RUBBERS,
  EPDM_INSERTS,
  EPDM_COATINGS
} from "../../../data/extrusionRawMaterialsData";

/**
 * 2줄 BOM 등록 & 오탈자/재료변경 수정 폼
 */
export default function ExtrusionBOMQuickForm({
  allMasterItems,
  customBOMMap,
  selectedItemKey,
  onItemSelect,
  isCustomItemMode,
  setIsCustomItemMode,
  customVehicle,
  setCustomVehicle,
  customItemName,
  setCustomItemName,
  rubberType,
  setRubberType,
  rubberType2,
  setRubberType2,
  compoundType,
  setCompoundType,
  compoundType2,
  setCompoundType2,
  compoundType3,
  setCompoundType3,
  compoundType4,
  setCompoundType4,
  insertType,
  setInsertType,
  coatingType,
  setCoatingType,
  unitWeightG = 500,
  setUnitWeightG,
  compoundOptions,
  isSaving,
  onSubmit,
  onOpenCatalogModal,
  customModifiedCount,
  isUserEditingRef
}) {
  return (
    <div className="bg-slate-900/95 border border-teal-600/50 rounded-2xl p-3 sm:p-3.5 shadow-xl text-white animate-fadeIn space-y-2.5">
      <form onSubmit={onSubmit} className="space-y-2.5 text-xs">
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
                onChange={(e) => onItemSelect(e.target.value)}
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
                  if (isUserEditingRef) isUserEditingRef.current = true;
                  setCustomVehicle(e.target.value);
                }}
                placeholder="신규 차종(예: NX4)"
                className="w-1/2 px-3 py-1.5 rounded-xl bg-slate-800 border border-amber-400 text-amber-300 font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              />
              <input
                type="text"
                value={customItemName}
                onChange={(e) => {
                  if (isUserEditingRef) isUserEditingRef.current = true;
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
              if (isUserEditingRef) isUserEditingRef.current = true;
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
              if (isUserEditingRef) isUserEditingRef.current = true;
              setCoatingType(val);
            }}
            options={EPDM_COATINGS}
            placeholder="코팅액(미사용)"
            title="코팅액 - 미사용 가능"
            theme="sky"
            className="w-[130px]"
          />

          {/* ⚖️ 단위중량 (기본 500g, 설유철 직접 수정 가능) */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-teal-500/60 shadow-xs">
            <span className="text-[10.5px] font-black text-teal-300 whitespace-nowrap">
              ⚖️ 단위중량
            </span>
            <input
              type="number"
              min="1"
              step="10"
              value={unitWeightG || ""}
              onChange={(e) => {
                if (isUserEditingRef) isUserEditingRef.current = true;
                if (setUnitWeightG) setUnitWeightG(e.target.value);
              }}
              placeholder="500"
              className="w-[60px] px-1.5 py-0.5 rounded bg-slate-900 border border-teal-400 text-teal-200 text-xs font-black text-right focus:outline-hidden focus:ring-1 focus:ring-teal-300"
              title="품목 1개(EA)당 단위중량 (g)"
            />
            <span className="text-[10px] font-bold text-teal-400">g</span>
            <span className="text-[9.5px] text-slate-400 font-mono">
              ({((Number(unitWeightG) || 500) / 1000).toFixed(2)}kg)
            </span>
          </div>

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
              onClick={onOpenCatalogModal}
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
                if (isUserEditingRef) isUserEditingRef.current = true;
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
  );
}
