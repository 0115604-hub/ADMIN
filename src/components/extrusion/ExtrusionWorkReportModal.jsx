import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Layers,
  Sparkles,
  Trash2,
  TrendingUp,
  Cpu,
  Calendar,
  Sun,
  Moon,
  Zap,
  Activity,
  Search,
  Check,
  ChevronDown
} from "lucide-react";
import {
  EXTRUSION_LINE_OPTIONS,
  VEHICLE_PRESETS,
  WORKER_PRESETS,
  DOWNTIME_CATEGORIES,
  sanitizeExtrusionReport
} from "../../services/extrusionProductionService";
import {
  EXTRUSION_LINE_BADGES,
  EXTRUSION_ITEMS_BY_LINE,
  getItemsByLine
} from "../../data/extrusionItemsData";

export const ExtrusionWorkReportModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing = false
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState(() => {
    if (initialData) return { ...initialData };
    return {
      date: todayStr,
      shift: "주간",
      plant: "삼랑진공장",
      lineId: "pcm1",
      lineName: "PCM #1 LINE",
      worker: "공영국 대리",
      subWorkers: "",
      vehicle: "MCA",
      itemCode: "",
      itemName: "HOOD A",
      targetQty: 4000,
      actualQty: 3950,
      goodQty: 3880,
      defectQty: 70,
      scrapKg: 15.0,
      downtimeMinutes: 30,
      downtimeCategory: "형교환",
      downtimeDetail: "",
      notes: "",
      approvalStatus: "대기"
    };
  });

  const [errors, setErrors] = useState({});
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all");

  // Items for currently active line (PCM1, PCM3, PVC, TPE)
  const activeLineItems = useMemo(() => {
    return getItemsByLine(formData.lineId || "pcm1");
  }, [formData.lineId]);

  // Unique vehicles for currently active line (sorted alphabetically)
  const lineUniqueVehicles = useMemo(() => {
    const set = new Set();
    activeLineItems.forEach((it) => {
      if (it.vehicle) set.add(it.vehicle);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko-KR"));
  }, [activeLineItems]);

  // Filtered items by search query and vehicle filter
  const filteredLineItems = useMemo(() => {
    let list = activeLineItems;
    if (selectedVehicleFilter !== "all") {
      list = list.filter((it) => it.vehicle === selectedVehicleFilter);
    }
    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase().trim();
      list = list.filter((it) =>
        it.vehicle?.toLowerCase().includes(q) ||
        it.itemName?.toLowerCase().includes(q) ||
        it.label?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeLineItems, selectedVehicleFilter, itemSearchQuery]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          date: todayStr,
          shift: "주간",
          plant: "삼랑진공장",
          lineId: "pcm1",
          lineName: "PCM #1 LINE",
          worker: "공영국 대리",
          subWorkers: "",
          vehicle: "MCA",
          itemCode: "",
          itemName: "HOOD A",
          targetQty: 4000,
          actualQty: 3950,
          goodQty: 3880,
          defectQty: 70,
          scrapKg: 15.0,
          downtimeMinutes: 30,
          downtimeCategory: "형교환",
          downtimeDetail: "",
          notes: "",
          approvalStatus: "대기"
        });
      }
      setErrors({});
      setItemSearchQuery("");
      setSelectedVehicleFilter("all");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Auto-calculated rates
  const targetNum = Number(formData.targetQty) || 0;
  const actualNum = Number(formData.actualQty) || 0;
  const goodNum = Number(formData.goodQty) || 0;
  const defectNum = Number(formData.defectQty) || Math.max(0, actualNum - goodNum);

  const attainmentRate = targetNum > 0 ? ((actualNum / targetNum) * 100).toFixed(1) : "100.0";
  const yieldRate = actualNum > 0 ? ((goodNum / actualNum) * 100).toFixed(1) : "100.0";
  const defectRate = actualNum > 0 ? ((defectNum / actualNum) * 100).toFixed(1) : "0.0";

  const handleLineSelect = (lineId) => {
    const opt = EXTRUSION_LINE_OPTIONS.find((l) => l.id === lineId);
    setFormData((prev) => ({
      ...prev,
      lineId,
      lineName: opt ? opt.name : lineId
    }));
    setSelectedVehicleFilter("all");
    setItemSearchQuery("");
  };

  const handleItemSelect = (itemId) => {
    if (!itemId) return;
    const found = activeLineItems.find((it) => it.id === itemId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicle: found.vehicle,
        itemName: found.itemName
      }));
    }
  };

  const handleWorkerSelect = (w) => {
    setFormData((prev) => ({
      ...prev,
      worker: `${w.name} ${w.title}`
    }));
  };

  const handleNumberChange = (field, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setFormData((prev) => {
      const next = { ...prev, [field]: num };
      // Auto adjust defect if actual or good changes
      if (field === "actualQty" || field === "goodQty") {
        const act = field === "actualQty" ? (num === "" ? 0 : num) : Number(prev.actualQty) || 0;
        const gd = field === "goodQty" ? (num === "" ? 0 : num) : Number(prev.goodQty) || 0;
        next.defectQty = Math.max(0, act - gd);
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.date) newErrors.date = "작업일자를 입력해주세요.";
    if (!formData.worker) newErrors.worker = "작업자를 입력해주세요.";
    if (!formData.vehicle) newErrors.vehicle = "차종을 선택해주세요.";
    if (Number(formData.actualQty) < 0) newErrors.actualQty = "생산수량을 확인해주세요.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const reportToSave = sanitizeExtrusionReport({
      ...formData,
      targetQty: Number(formData.targetQty) || 0,
      actualQty: Number(formData.actualQty) || 0,
      goodQty: Number(formData.goodQty) || 0,
      defectQty: Number(formData.defectQty) || 0,
      scrapKg: Number(formData.scrapKg) || 0,
      downtimeMinutes: Number(formData.downtimeMinutes) || 0
    });

    onSave(reportToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Zap className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isEditing ? "압출 작업일보 수정" : "압출 작업일보 신규 작성"}
              </h3>
              <p className="text-[11px] text-teal-200/80 font-medium">
                현장 실시간 생산실적, 품질수율 및 비가동 내역을 등록합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
          {/* Section 1: Basic Info (Line, Shift, Date, Worker) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                ① 기본 정보 (호기 및 작업자)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300">
                삼랑진공장 압출동
              </span>
            </div>

            {/* Line Selection Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXTRUSION_LINE_OPTIONS.map((l) => {
                const isSel = formData.lineId === l.id;
                const activeBg =
                  l.id === "pcm1" ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-400/40" :
                  l.id === "pcm3" ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40" :
                  l.id === "pvc" ? "bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40" :
                  "bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/40";

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleLineSelect(l.id)}
                    className={`py-2 px-3 rounded-2xl font-black text-xs transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isSel
                        ? activeBg
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.2 rounded-md font-black ${
                        isSel ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      }`}>
                        {l.badge || l.shortName}
                      </span>
                      <span className="font-black text-xs">{l.shortName}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${isSel ? "text-white/80" : "text-slate-400"}`}>
                      아이템 {l.count || 0}종
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  작업일자 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                {errors.date && <p className="text-rose-500 text-[10px] mt-0.5">{errors.date}</p>}
              </div>

              {/* Shift Toggle */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  근무조 *
                </label>
                <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, shift: "주간" })}
                    className={`py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                      formData.shift === "주간"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>주간</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, shift: "야간" })}
                    className={`py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                      formData.shift === "야간"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>야간</span>
                  </button>
                </div>
              </div>

              {/* Worker Preset Quick Pick */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  작업조장 / 작업자 *
                </label>
                <input
                  type="text"
                  value={formData.worker}
                  onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
                  placeholder="예: 공영국 대리"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                {errors.worker && <p className="text-rose-500 text-[10px] mt-0.5">{errors.worker}</p>}
              </div>
            </div>

            {/* Quick Worker Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400">빠른 작업자 선택:</span>
              {WORKER_PRESETS.slice(0, 8).map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => handleWorkerSelect(w)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-lg font-bold transition cursor-pointer border ${
                    formData.worker.includes(w.name)
                      ? "bg-teal-100 text-teal-800 border-teal-400 dark:bg-teal-950 dark:text-teal-300 font-black"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                  }`}
                >
                  {w.name} {w.title}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Vehicle & Part Info with Line Badges and Dropdown */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ② 생산 품목 및 차종 (라인별 아이템 드롭다운)
              </span>
              <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                선택 라인: {EXTRUSION_LINE_OPTIONS.find((l) => l.id === formData.lineId)?.shortName || formData.lineId} ({activeLineItems.length}개 품목)
              </span>
            </div>

            {/* Line Badges Selector */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              <span className="text-[10.5px] font-bold text-slate-500">라인 뱃지:</span>
              {EXTRUSION_LINE_OPTIONS.map((l) => {
                const isSel = formData.lineId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleLineSelect(l.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                      isSel
                        ? l.id === "pcm1" ? "bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-300/40" :
                          l.id === "pcm3" ? "bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300/40" :
                          l.id === "pvc" ? "bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-300/40" :
                          "bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-300/40"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>🏷️ {l.badge || l.shortName}</span>
                    <span className="text-[10px] opacity-80">({l.count}개)</span>
                  </button>
                );
              })}
            </div>

            {/* 🌟 Item Dropdown & Live Search Filter */}
            <div className="space-y-2 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900/60 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-xs font-black text-blue-900 dark:text-blue-300">
                  📦 [{EXTRUSION_LINE_OPTIONS.find((l) => l.id === formData.lineId)?.badge || "선택"}] 생산 아이템 드롭다운 (이니셜/차종순 정렬) *
                </label>
                {itemSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery("")}
                    className="text-[10.5px] font-bold text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    검색 초기화 ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Search Input Filter */}
                <div className="sm:col-span-4 relative">
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="🔍 품명/차종 검색 (예: HOOD, GL3)..."
                    className="w-full pl-3 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery("")}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Main Select Dropdown */}
                <div className="sm:col-span-8">
                  <select
                    onChange={(e) => handleItemSelect(e.target.value)}
                    value={
                      activeLineItems.find(
                        (it) => it.vehicle === formData.vehicle && it.itemName === formData.itemName
                      )?.id || ""
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer shadow-xs"
                  >
                    <option value="">
                      -- [{EXTRUSION_LINE_OPTIONS.find((l) => l.id === formData.lineId)?.badge || "선택"}] 아이템을 선택하세요 (총 {filteredLineItems.length}개) --
                    </option>
                    {filteredLineItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.vehicle}] {it.itemName}{it.isAS ? " 🛠️(A/S)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Vehicle Code Chips (이니셜/차종 바로가기) */}
              {lineUniqueVehicles.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10.5px]">
                    <span className="font-bold text-slate-400 shrink-0">차종 필터:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleFilter("all")}
                      className={`px-2 py-0.5 rounded-lg font-black transition shrink-0 cursor-pointer ${
                        selectedVehicleFilter === "all"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      전체 ({activeLineItems.length})
                    </button>
                    {lineUniqueVehicles.map((v) => {
                      const count = activeLineItems.filter((it) => it.vehicle === v).length;
                      const isSel = selectedVehicleFilter === v || formData.vehicle === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setSelectedVehicleFilter(v);
                            const firstOfCar = activeLineItems.find((it) => it.vehicle === v);
                            if (firstOfCar) {
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: firstOfCar.vehicle,
                                itemName: firstOfCar.itemName
                              }));
                            }
                          }}
                          className={`px-2 py-0.5 rounded-lg font-bold transition shrink-0 cursor-pointer border ${
                            isSel
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-400 font-black ring-1 ring-blue-400/40"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <span>{v}</span>
                          {count > 1 && <span className="text-[9px] text-slate-400 ml-0.5">({count})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Editable Inputs for Vehicle, Part Number, Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  차종 코드 *
                </label>
                <input
                  type="text"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  placeholder="예: MCA, GL3, BL7M"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {errors.vehicle && <p className="text-rose-500 text-[10px] mt-0.5">{errors.vehicle}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  품번 (Part Number)
                </label>
                <input
                  type="text"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="예: 86811-N9000 (선택)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  품명 (Part Description) *
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="예: HOOD A, D/SIDE C"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Production Quantities & Live Yield Calculation */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ③ 생산 수량 및 실시간 수율/달성률 자동 계산
              </span>
              {/* Calculated Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-300">
                  달성률: {attainmentRate}%
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs border border-blue-300">
                  양품수율: {yieldRate}%
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-xs border border-rose-300">
                  불량률: {defectRate}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  계획수량 (m)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetQty}
                  onChange={(e) => handleNumberChange("targetQty", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-right focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  총 생산실적 (m) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.actualQty}
                  onChange={(e) => handleNumberChange("actualQty", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 font-black text-right text-emerald-700 dark:text-emerald-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                {errors.actualQty && <p className="text-rose-500 text-[10px] mt-0.5">{errors.actualQty}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  양품수량 (m) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goodQty}
                  onChange={(e) => handleNumberChange("goodQty", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-right text-blue-700 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  불량수량 (m)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.defectQty}
                  onChange={(e) => handleNumberChange("defectQty", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-right text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  스크랩 발생 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.scrapKg}
                  onChange={(e) => handleNumberChange("scrapKg", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-right text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Downtime & Loss Management */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ④ 비가동 시간 및 발생 사유
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                총 {formData.downtimeMinutes || 0}분 ({(Number(formData.downtimeMinutes || 0) / 60).toFixed(1)}시간)
              </span>
            </div>

            {/* Downtime Categories Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-bold text-slate-400">사유 구분:</span>
              {DOWNTIME_CATEGORIES.map((c) => {
                const isSel = formData.downtimeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, downtimeCategory: c.id })}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                      isSel
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-300/40"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  비가동 시간 (분)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.downtimeMinutes}
                  onChange={(e) => handleNumberChange("downtimeMinutes", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-right text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  비가동 상세 사유 및 조치 내용
                </label>
                <input
                  type="text"
                  value={formData.downtimeDetail}
                  onChange={(e) => setFormData({ ...formData, downtimeDetail: e.target.value })}
                  placeholder="예: 금형 교체 30분 완료, 온도 승온 15분 정상 가동"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Notes & Handover */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="block font-black text-slate-900 dark:text-white text-xs sm:text-sm">
              ⑤ 특이사항 및 인수인계 사항
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="교대 작업자에게 전달할 내용이나 설비 이상 조짐, 원료 수급 이슈 등을 자유롭게 기재하세요."
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600"
          >
            취소
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? "작업일보 수정 저장" : "실시간 작업일보 등록"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionWorkReportModal;
