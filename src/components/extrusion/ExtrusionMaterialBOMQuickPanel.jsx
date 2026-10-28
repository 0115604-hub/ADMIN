import React, { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  EPDM_RUBBERS,
  EPDM_COMPOUNDS,
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

import ExtrusionBOMQuickForm from "./bom/ExtrusionBOMQuickForm";
import ExtrusionBOMCatalogModal from "./bom/ExtrusionBOMCatalogModal";

const DRAFT_STORAGE_KEY = "factory_extrusion_bom_draft_v2";

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

      {/* ⭐ 설유철 작업자 전용 2줄 BOM 등록 & 오탈자/재료변경 수정 패널 */}
      <ExtrusionBOMQuickForm
        allMasterItems={allMasterItems}
        customBOMMap={customBOMMap}
        selectedItemKey={selectedItemKey}
        onItemSelect={handleItemSelect}
        isCustomItemMode={isCustomItemMode}
        setIsCustomItemMode={setIsCustomItemMode}
        customVehicle={customVehicle}
        setCustomVehicle={setCustomVehicle}
        customItemName={customItemName}
        setCustomItemName={setCustomItemName}
        rubberType={rubberType}
        setRubberType={setRubberType}
        rubberType2={rubberType2}
        setRubberType2={setRubberType2}
        compoundType={compoundType}
        setCompoundType={setCompoundType}
        compoundType2={compoundType2}
        setCompoundType2={setCompoundType2}
        compoundType3={compoundType3}
        setCompoundType3={setCompoundType3}
        compoundType4={compoundType4}
        setCompoundType4={setCompoundType4}
        insertType={insertType}
        setInsertType={setInsertType}
        coatingType={coatingType}
        setCoatingType={setCoatingType}
        compoundOptions={compoundOptions}
        isSaving={isSaving}
        onSubmit={handleRegisterBOM}
        onOpenCatalogModal={() => setIsListModalOpen(true)}
        customModifiedCount={customModifiedCount}
        isUserEditingRef={isUserEditingRef}
      />

      {/* 📋 전체 압출 품목 원재료 BOM 목록 & 수정/삭제 모달 */}
      <ExtrusionBOMCatalogModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        allMasterItems={allMasterItems}
        fullBOMCatalogList={fullBOMCatalogList}
        customModifiedCount={customModifiedCount}
        lineFilter={lineFilter}
        setLineFilter={setLineFilter}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        onResetAllCustomBOM={async () => {
          if (window.confirm("⚠️ 등록된 모든 커스텀 BOM 수정을 초기화하고 순수 엑셀 원본 BOM으로 리셋하시겠습니까?")) {
            await resetAllCustomBOM();
            showToast("🧹 모든 커스텀 BOM이 초기화되고 원본으로 복원되었습니다.");
          }
        }}
        onEditFromModal={handleEditFromModal}
        onRevertCustomBOM={handleRevertCustomBOM}
      />
    </>
  );
};

export default ExtrusionMaterialBOMQuickPanel;
