import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Layers,
  Component,
  Search,
  CheckCircle2,
  Plus,
  ArrowRight,
  Filter,
  PackageCheck,
  Building2,
  Tag,
  CheckSquare,
  Square,
  Sparkles,
  ClipboardList,
  Calendar,
  Clock,
  History,
  AlertCircle,
  Settings,
  Save,
  Check
} from "lucide-react";
import {
  PURCHASES_RAW_MATERIALS,
  PURCHASES_SUB_MATERIALS,
  PURCHASES_RAW_SUPPLIERS,
  PURCHASES_SUB_SUPPLIERS,
  PURCHASES_DAILY_SHIPMENTS,
  CURRENT_PURCHASE_MONTH
} from "../../data/monthlyPurchasesData";

export const MonthlyPurchasesImportModal = ({
  isOpen,
  onClose,
  onImportItem, // 단일 건 즉시 모달 열기: (item) => void
  onBatchImport, // 여러 건 일괄 등록: (items) => void
  initialTab = "RAW_MATERIAL" // "RAW_MATERIAL" | "SUB_MATERIAL"
}) => {
  // 모드: "DAILY_UP_TO_YESTERDAY" (당월 어제까지 실제입고 내역) vs "ALL_ITEMS" (전체 품목 마스터)
  const [viewMode, setViewMode] = useState("DAILY_UP_TO_YESTERDAY");
  const [activeTab, setActiveTab] = useState(initialTab); // "RAW_MATERIAL" | "SUB_MATERIAL" | "ALL"
  const [selectedSupplier, setSelectedSupplier] = useState(""); // 검사할 업체를 직접 선택해야만 목록 표시
  const [selectedDay, setSelectedDay] = useState("ALL"); // 특정 일자 필터 ("ALL" 또는 1..31)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // 오늘 날짜 및 어제 일자 계산
  const today = new Date();
  const currentDay = today.getDate(); // 예: 29일
  const yesterdayDay = Math.max(1, currentDay - 1); // 예: 28일

  // 공급사 명칭 정규화 함수 (개행 문자 및 연속 공백 정리)
  const normalizeSupplier = (name) =>
    (name || "").replace(/\r\n|\r|\n/g, " ").replace(/\s+/g, " ").trim();

  // 사용 가능한 전체 공급사 목록 (풀)
  const fullSuppliersPool = useMemo(() => {
    if (activeTab === "RAW_MATERIAL") return PURCHASES_RAW_SUPPLIERS;
    if (activeTab === "SUB_MATERIAL") return PURCHASES_SUB_SUPPLIERS;
    return Array.from(new Set([...PURCHASES_RAW_SUPPLIERS, ...PURCHASES_SUB_SUPPLIERS]));
  }, [activeTab]);

  // 로컬 스토리지 키: 등록된 검사대상 업체 목록 영구 보존
  const storageKey = `INJOO_REGISTERED_SUPPLIERS_${activeTab}`;

  // 등록된 업체 목록 상태 (재수정/재등록 시까지 이 분류/등록 상태를 영구 유지)
  const [registeredSuppliers, setRegisteredSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem(`INJOO_REGISTERED_SUPPLIERS_${initialTab}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load registered suppliers from storage:", e);
    }
    return initialTab === "RAW_MATERIAL"
      ? PURCHASES_RAW_SUPPLIERS
      : initialTab === "SUB_MATERIAL"
      ? PURCHASES_SUB_SUPPLIERS
      : Array.from(new Set([...PURCHASES_RAW_SUPPLIERS, ...PURCHASES_SUB_SUPPLIERS]));
  });

  // 탭 변경 시 해당 탭의 등록 목록 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRegisteredSuppliers(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    setRegisteredSuppliers(fullSuppliersPool);
  }, [activeTab, storageKey, fullSuppliersPool]);

  // 블록 풀에서 등록 목록으로 추가 (+ 클릭 시 즉시 추가 및 로컬스토리지 영구 반영)
  const handleAddSupplier = (supp) => {
    if (registeredSuppliers.some((s) => normalizeSupplier(s) === normalizeSupplier(supp))) return;
    const nextList = [...registeredSuppliers, supp];
    setRegisteredSuppliers(nextList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (e) {
      console.warn("Failed to save registered suppliers:", e);
    }
  };

  // 등록 목록에서 제거 (X 클릭 시 즉시 제거 및 로컬스토리지 영구 반영)
  const handleRemoveSupplier = (supp) => {
    if (registeredSuppliers.length <= 1) {
      alert("최소 1개 이상의 업체가 유지되어야 합니다.");
      return;
    }
    const nextList = registeredSuppliers.filter((s) => normalizeSupplier(s) !== normalizeSupplier(supp));
    setRegisteredSuppliers(nextList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (e) {
      console.warn("Failed to save registered suppliers:", e);
    }
    if (selectedSupplier && normalizeSupplier(selectedSupplier) === normalizeSupplier(supp)) {
      setSelectedSupplier("");
    }
  };

  // 전체 15개사 복원 초기화
  const handleResetToAll = () => {
    setRegisteredSuppliers([...fullSuppliersPool]);
    try {
      localStorage.setItem(storageKey, JSON.stringify(fullSuppliersPool));
    } catch (e) {
      console.warn("Failed to reset registered suppliers:", e);
    }
  };

  // 추가 가능한 공급사 풀 (현재 등록되지 않은 15개사 중 업체들)
  const unselectedSuppliersPool = useMemo(() => {
    const activeNormSet = new Set(registeredSuppliers.map(normalizeSupplier));
    return fullSuppliersPool.filter((s) => !activeNormSet.has(normalizeSupplier(s)));
  }, [fullSuppliersPool, registeredSuppliers]);

  // 고유 키 생성
  const getShipmentKey = (item, idx) =>
    `${item.date}__${item.supplier}__${item.materialCode || ""}__${item.materialName}__${item.quantity}__${idx}`;
  const getMasterKey = (item) =>
    `${item.supplier}__${item.materialCode || ""}__${item.materialName}`;

  // 등록된 업체 정규화 Set (재수정 전까지 이 업체들만 대상)
  const registeredNormSet = useMemo(() => {
    return new Set(registeredSuppliers.map(normalizeSupplier));
  }, [registeredSuppliers]);

  // 당월 어제까지(day <= yesterdayDay)의 실제 매입내역 필터링
  const dailyShipmentsUpToYesterday = useMemo(() => {
    return PURCHASES_DAILY_SHIPMENTS.filter((item) => {
      const itemNormSupp = normalizeSupplier(item.supplier);
      // 1. 등록된 업체가 아니면 원천 배제 (재수정 전까지 등록된 업체만 표시)
      if (!registeredNormSet.has(itemNormSupp)) return false;

      // 2. 단일 업체 선택 필터 (개별 선택된 경우 그 업체만)
      if (selectedSupplier && selectedSupplier !== "ALL") {
        if (itemNormSupp !== normalizeSupplier(selectedSupplier)) return false;
      }

      // 3. 카테고리 필터
      if (activeTab !== "ALL" && item.category !== activeTab) return false;

      // 4. 당월 어제까지의 일자
      if (item.day > yesterdayDay) return false;

      // 5. 일자 세부 필터
      if (selectedDay !== "ALL" && item.day !== Number(selectedDay)) return false;

      // 6. 검색어
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const mCode = (item.materialCode || "").toLowerCase().includes(kw);
        const mName = (item.materialName || "").toLowerCase().includes(kw);
        const mSupp = itemNormSupp.toLowerCase().includes(kw);
        if (!mCode && !mName && !mSupp) return false;
      }
      return true;
    });
  }, [registeredNormSet, selectedSupplier, activeTab, yesterdayDay, selectedDay, searchKeyword]);

  // 마스터 품목 목록 필터링
  const masterFilteredItems = useMemo(() => {
    const list =
      activeTab === "RAW_MATERIAL"
        ? PURCHASES_RAW_MATERIALS
        : activeTab === "SUB_MATERIAL"
        ? PURCHASES_SUB_MATERIALS
        : [...PURCHASES_RAW_MATERIALS, ...PURCHASES_SUB_MATERIALS];

    return list.filter((item) => {
      const itemNormSupp = normalizeSupplier(item.supplier);
      // 1. 등록된 업체가 아니면 원천 배제
      if (!registeredNormSet.has(itemNormSupp)) return false;

      // 2. 단일 업체 선택 필터
      if (selectedSupplier && selectedSupplier !== "ALL") {
        if (itemNormSupp !== normalizeSupplier(selectedSupplier)) return false;
      }

      // 3. 검색어
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const mCode = (item.materialCode || "").toLowerCase().includes(kw);
        const mName = (item.materialName || "").toLowerCase().includes(kw);
        const mSupp = itemNormSupp.toLowerCase().includes(kw);
        if (!mCode && !mName && !mSupp) return false;
      }
      return true;
    });
  }, [registeredNormSet, selectedSupplier, activeTab, searchKeyword]);

  // 화면 표시 목록
  const activeDisplayList = useMemo(() => {
    if (viewMode === "DAILY_UP_TO_YESTERDAY") {
      // 선택된 업체에 일별 입고건이 없고 마스터 품목이 있는 경우 마스터 자동 출력
      if (selectedSupplier && dailyShipmentsUpToYesterday.length === 0 && masterFilteredItems.length > 0) {
        return masterFilteredItems;
      }
      return dailyShipmentsUpToYesterday;
    }
    return masterFilteredItems;
  }, [viewMode, selectedSupplier, dailyShipmentsUpToYesterday, masterFilteredItems]);

  if (!isOpen) return null;

  // 전체 선택 / 해제 토글
  const handleToggleSelectAll = () => {
    if (selectedKeys.size === activeDisplayList.length && activeDisplayList.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const nextSet = new Set();
      activeDisplayList.forEach((item, idx) => {
        nextSet.add(viewMode === "DAILY_UP_TO_YESTERDAY" ? getShipmentKey(item, idx) : getMasterKey(item));
      });
      setSelectedKeys(nextSet);
    }
  };

  // 단일 체크박스 토글
  const handleToggleItem = (item, idx, e) => {
    if (e) e.stopPropagation();
    const key = viewMode === "DAILY_UP_TO_YESTERDAY" ? getShipmentKey(item, idx) : getMasterKey(item);
    const nextSet = new Set(selectedKeys);
    if (nextSet.has(key)) {
      nextSet.delete(key);
    } else {
      nextSet.add(key);
    }
    setSelectedKeys(nextSet);
  };

  // 단일 품목 바로 상세 검사 모달로 열기
  const handleSelectOne = (item) => {
    if (onImportItem) {
      const qty = item.quantity || item.totalQty || 0;
      onImportItem({
        category: item.category,
        supplier: item.supplier,
        itemName: item.materialCode ? `${item.materialName} (${item.materialCode})` : item.materialName,
        quantityNum: qty > 0 ? String(qty) : "",
        quantityUnit: item.unit || (item.category === "RAW_MATERIAL" ? "kg" : "EA"),
        lotNo: `LOT-${(item.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "").slice(2)}-01`,
        receivingDate: item.date || new Date().toISOString().slice(0, 10)
      });
      onClose();
    }
  };

  // 선택된 여러 품목 일괄 입고대장 등록 (검사대기 PENDING 상태)
  const handleBatchImportSubmit = () => {
    if (selectedKeys.size === 0) {
      alert("입고대장에 등록할 품목을 1개 이상 선택해주세요.");
      return;
    }

    let itemsToImport = [];

    if (viewMode === "DAILY_UP_TO_YESTERDAY") {
      itemsToImport = activeDisplayList
        .filter((it, idx) => selectedKeys.has(getShipmentKey(it, idx)))
        .map((item, idx) => {
          const dateStr = item.date || new Date().toISOString().slice(0, 10);
          const shortDate = dateStr.replace(/-/g, "").slice(2);
          return {
            category: item.category,
            supplier: item.supplier,
            itemName: item.materialCode ? `${item.materialName} (${item.materialCode})` : item.materialName,
            quantityNum: item.quantity,
            quantityUnit: item.unit || (item.category === "RAW_MATERIAL" ? "kg" : "EA"),
            quantity: `${Number(item.quantity).toLocaleString()} ${item.unit || (item.category === "RAW_MATERIAL" ? "kg" : "EA")}`,
            lotNo: `LOT-${shortDate}-${String(idx + 1).padStart(2, "0")}`,
            receivingDate: dateStr,
            remarks: `조인주 매입내역 (${dateStr} 입고분 실물연동)`
          };
        });
    } else {
      itemsToImport = activeDisplayList
        .filter((it) => selectedKeys.has(getMasterKey(it)))
        .map((item, idx) => {
          const dateStr = new Date().toISOString().slice(0, 10);
          const shortDate = dateStr.replace(/-/g, "").slice(2);
          return {
            category: item.category,
            supplier: item.supplier,
            itemName: item.materialCode ? `${item.materialName} (${item.materialCode})` : item.materialName,
            quantityNum: item.totalQty > 0 ? item.totalQty : 0,
            quantityUnit: item.unit || (item.category === "RAW_MATERIAL" ? "kg" : "EA"),
            quantity: item.totalQty > 0 ? `${Number(item.totalQty).toLocaleString()} ${item.unit || "EA"}` : "-",
            lotNo: `LOT-${shortDate}-${String(idx + 1).padStart(2, "0")}`,
            receivingDate: dateStr,
            remarks: `조인주 매입 마스터 품목 연동`
          };
        });
    }

    if (onBatchImport) {
      onBatchImport(itemsToImport);
      setSelectedKeys(new Set());
      onClose();
    }
  };

  const isAllSelected = activeDisplayList.length > 0 && selectedKeys.size === activeDisplayList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>조인주 매입내역 연동 목록</span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  당월(10월) 1일 ~ 어제({yesterdayDay}일) 실제 매입목록
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600">
                  더미 삭제 완료 / 실데이터 반영
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                조인주 선임의 매입매출 원본에서 <strong>당월 어제({yesterdayDay}일)까지 실제 입고된 내역</strong>만 정확하게 목록화하여 보여줍니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 보기 모드 탭: 당월 어제까지 실적 vs 전체 마스터 품목 */}
        <div className="px-5 pt-2.5 pb-2 bg-slate-950 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewMode("DAILY_UP_TO_YESTERDAY");
                setSelectedKeys(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                viewMode === "DAILY_UP_TO_YESTERDAY"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 어제까지의 실물 매입내역 ({PURCHASES_DAILY_SHIPMENTS.filter((d) => d.day <= yesterdayDay).length}건)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("ALL_ITEMS");
                setSelectedKeys(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                viewMode === "ALL_ITEMS"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📦 전체 품목 마스터 ({PURCHASES_RAW_MATERIALS.length + PURCHASES_SUB_MATERIALS.length}개)</span>
            </button>
          </div>

          {/* 원자재 / 부자재 필터 버튼 */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("ALL");
                setSelectedKeys(new Set());
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("RAW_MATERIAL");
                setSelectedKeys(new Set());
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "RAW_MATERIAL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-blue-300 hover:text-white hover:bg-blue-950/60"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>원자재</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("SUB_MATERIAL");
                setSelectedKeys(new Set());
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "SUB_MATERIAL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-300 hover:text-white hover:bg-emerald-950/60"
              }`}
            >
              <Component className="w-3 h-3" />
              <span>부자재</span>
            </button>
          </div>
        </div>

        {/* 🏢 검사대상 업체 추가/삭제 블록 스튜디오 (오른쪽 참고화면과 동일한 2단 블록 구조) */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-3">
          {/* 1. 상단: 현재 등록/배치된 검사대상 업체 블록 (순서/개별 X 삭제 기능) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  현재 등록된 검사대상 업체 ({registeredSuppliers.length}개)
                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                    — [X] 클릭 시 제외되며 재등록 전까지 유지됩니다.
                  </span>
                </span>
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleResetToAll}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title="전체 15개사 복원"
                >
                  전체 15개사 복원
                </button>
              </div>
            </div>

            {/* 등록된 업체 블록 그리드/플렉스 */}
            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-slate-950 border border-slate-800">
              {registeredSuppliers.length === 0 ? (
                <span className="text-xs text-rose-400 p-1">
                  등록된 업체가 없습니다. 아래 풀에서 업체를 추가해주세요.
                </span>
              ) : (
                registeredSuppliers.map((supp, idx) => {
                  const isFiltered =
                    selectedSupplier &&
                    normalizeSupplier(selectedSupplier) === normalizeSupplier(supp);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedSupplier(isFiltered ? "" : supp);
                        setSelectedKeys(new Set());
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs ${
                        isFiltered
                          ? "bg-cyan-900/90 border-cyan-400 text-white shadow-cyan-950/60 ring-1 ring-cyan-400"
                          : "bg-slate-900/90 border-slate-700 text-slate-200 hover:border-slate-500"
                      }`}
                      title={
                        isFiltered
                          ? "클릭 시 전체 보기로 복귀"
                          : "클릭 시 이 업체 내역만 단독 필터링"
                      }
                    >
                      <Building2 className={`w-3 h-3 ${isFiltered ? "text-cyan-300" : "text-cyan-400"}`} />
                      <span>{normalizeSupplier(supp)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSupplier(supp);
                        }}
                        className="p-0.5 rounded hover:bg-rose-900 hover:text-white text-rose-400 transition cursor-pointer ml-0.5"
                        title="이 업체 제외"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. 하단: 추가 가능한 대시보드 블록 풀 (클릭 시 즉시 추가) */}
          {unselectedSuppliersPool.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  + 추가 가능한 구매처 풀 ({unselectedSuppliersPool.length}개 선택 가능)
                  <span className="font-normal text-slate-500 ml-1">— 클릭 시 상단에 추가됩니다.</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {unselectedSuppliersPool.map((supp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSupplier(supp)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-dashed border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer group"
                    title="클릭하여 검사대상 업체로 추가"
                  >
                    <span>{normalizeSupplier(supp)}</span>
                    <Plus className="w-3 h-3 text-emerald-400 group-hover:scale-125 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 필터 바: 일자 필터 & 검색 & 전체선택 */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
          {/* 일자 필터 (일별 모드일 때만 표시) */}
          {viewMode === "DAILY_UP_TO_YESTERDAY" && (
            <div className="sm:col-span-3 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedDay}
                onChange={(e) => {
                  setSelectedDay(e.target.value);
                  setSelectedKeys(new Set());
                }}
                className="bg-transparent text-xs text-white font-bold w-full outline-none"
              >
                <option value="ALL">전체 일자 (1~{yesterdayDay}일)</option>
                {Array.from({ length: yesterdayDay }, (_, i) => yesterdayDay - i).map((d) => (
                  <option key={d} value={d} className="bg-slate-900">
                    {d}일 입고건
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 검색창 */}
          <div className={`${viewMode === "DAILY_UP_TO_YESTERDAY" ? "sm:col-span-5" : "sm:col-span-8"} relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1`}>
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="품명, 자재코드 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full outline-none font-medium"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 일괄 선택 토글 버튼 */}
          <div className="sm:col-span-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition border border-slate-700 cursor-pointer w-full sm:w-auto justify-center"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>전체 해제 ({selectedKeys.size})</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>현재 목록 전체선택</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 매입 데이터 테이블 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                    />
                  </th>
                  {viewMode === "DAILY_UP_TO_YESTERDAY" && (
                    <th className="py-2.5 px-3 text-emerald-400 whitespace-nowrap">입고일자</th>
                  )}
                  <th className="py-2.5 px-3 whitespace-nowrap">분류</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">구매처</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">자재코드</th>
                  <th className="py-2.5 px-3">품명 및 규격</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    {viewMode === "DAILY_UP_TO_YESTERDAY" ? "실제 입고수량" : "당월 누계수량"}
                  </th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">단위</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">검사등록</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeDisplayList.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === "DAILY_UP_TO_YESTERDAY" ? 9 : 8} className="py-12 text-center text-slate-400 font-bold">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-cyan-400/80" />
                      {!selectedSupplier ? (
                        <div>
                          <p className="text-sm text-cyan-200 font-black mb-1">수입검사를 진행할 업체를 상단 버튼에서 선택해주세요.</p>
                          <p className="text-xs text-slate-500">상단에 나열된 구매처 중 원하는 업체를 클릭하면 해당 업체의 매입/입고 내역만 정확하게 표시됩니다.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-300 font-bold mb-1">선택한 업체의 조건에 일치하는 매입 내역이 없습니다.</p>
                          <p className="text-xs text-slate-500">일자 필터나 검색어를 확인하시거나, '전체 품목 마스터' 탭을 확인해주세요.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  activeDisplayList.map((item, idx) => {
                    const itemKey = viewMode === "DAILY_UP_TO_YESTERDAY" ? getShipmentKey(item, idx) : getMasterKey(item);
                    const isChecked = selectedKeys.has(itemKey);
                    const qty = viewMode === "DAILY_UP_TO_YESTERDAY" ? item.quantity : item.totalQty;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors group cursor-pointer ${
                          isChecked ? "bg-cyan-950/40 hover:bg-cyan-950/60" : "hover:bg-slate-800/40"
                        }`}
                        onClick={() => handleToggleItem(item, idx)}
                      >
                        {/* 체크박스 */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleItem(item, idx, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                          />
                        </td>

                        {/* 일자 (어제까지 모드) */}
                        {viewMode === "DAILY_UP_TO_YESTERDAY" && (
                          <td className="py-2 px-3 font-mono font-bold text-emerald-300 whitespace-nowrap">
                            {item.date}
                          </td>
                        )}

                        {/* 분류 */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {item.category === "RAW_MATERIAL" ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800">
                              원자재
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                              부자재
                            </span>
                          )}
                        </td>

                        {/* 구매처 */}
                        <td className="py-2 px-3 font-bold text-cyan-300 whitespace-nowrap">
                          {normalizeSupplier(item.supplier)}
                        </td>

                        {/* 자재코드 */}
                        <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {item.materialCode || "-"}
                        </td>

                        {/* 품명 및 규격 */}
                        <td className="py-2 px-3 font-medium text-white group-hover:text-cyan-200">
                          {item.materialName}
                        </td>

                        {/* 수량 */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {qty > 0 ? Number(qty).toLocaleString() : "-"}
                        </td>

                        {/* 단위 */}
                        <td className="py-2 px-3 text-center text-slate-400 text-[11px] whitespace-nowrap">
                          {item.unit || "-"}
                        </td>

                        {/* 개별 검사 열기 */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOne(item);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 mx-auto border border-slate-700 hover:border-cyan-500 cursor-pointer"
                            title="이 품목 1건만 검사 상세창을 띄워 등록합니다"
                          >
                            <span>상세검사</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer (일괄 등록 버튼 포함) */}
        <div className="px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              총 <strong className="text-white font-mono">{activeDisplayList.length}</strong>건 표시 중
            </span>
            {selectedKeys.size > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-black text-[11px]">
                {selectedKeys.size}건 선택됨
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              닫기
            </button>

            {/* 🔥 일괄 입고대장 등록 (검사대기 상태) 버튼 */}
            <button
              type="button"
              onClick={handleBatchImportSubmit}
              disabled={selectedKeys.size === 0}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
                selectedKeys.size > 0
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>선택한 {selectedKeys.size}건 입고대장 등록 [검사대기 (PENDING)]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
