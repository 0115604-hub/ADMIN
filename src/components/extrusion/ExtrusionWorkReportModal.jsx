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
  Plus,
  Check,
  ChevronDown
} from "lucide-react";
import {
  WORKER_PRESETS,
  DOWNTIME_CATEGORIES,
  sanitizeExtrusionReport
} from "../../services/extrusionProductionService";
import {
  getItemsByLine
} from "../../data/extrusionItemsData";

// Clean line definitions (깔끔한 라인명)
const CLEAN_LINE_OPTIONS = [
  { id: "pcm1", name: "PCM 1호", fullName: "PCM #1 LINE", color: "teal" },
  { id: "pcm3", name: "PCM 3호", fullName: "PCM #3 LINE", color: "blue" },
  { id: "pvc", name: "PVC", fullName: "PVC LINE", color: "amber" },
  { id: "tpe", name: "TPE", fullName: "TPE LINE", color: "purple" }
];

const createDefaultItem = (lineId, suffix = Date.now()) => {
  const lineItems = getItemsByLine(lineId || "pcm1");
  const first = lineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };
  return {
    id: `item_${suffix}_${Math.random().toString(36).substring(2, 6)}`,
    vehicle: first.vehicle,
    itemName: first.itemName,
    itemCode: "",
    targetQty: 2000,
    actualQty: 1950,
    goodQty: 1900,
    defectQty: 50,
    scrapKg: 7.5
  };
};

export const ExtrusionWorkReportModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing = false
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const items = (Array.isArray(initialData.items) && initialData.items.length > 0)
        ? initialData.items.map((it, i) => ({
            id: it.id || `item_${i + 1}`,
            vehicle: it.vehicle || "",
            itemName: it.itemName || "",
            itemCode: it.itemCode || "",
            targetQty: it.targetQty ?? 2000,
            actualQty: it.actualQty ?? 1950,
            goodQty: it.goodQty ?? 1900,
            defectQty: it.defectQty ?? 50,
            scrapKg: it.scrapKg ?? 7.5
          }))
        : [
            {
              id: "item_1",
              vehicle: initialData.vehicle || "BC4T",
              itemName: initialData.itemName || "D/SIDE D",
              itemCode: initialData.itemCode || "",
              targetQty: initialData.targetQty ?? 4000,
              actualQty: initialData.actualQty ?? 3950,
              goodQty: initialData.goodQty ?? 3880,
              defectQty: initialData.defectQty ?? 70,
              scrapKg: initialData.scrapKg ?? 15.0
            }
          ];

      return {
        ...initialData,
        items
      };
    }

    return {
      date: todayStr,
      shift: "주간",
      plant: "삼랑진공장",
      lineId: "pcm1",
      lineName: "PCM #1 LINE",
      worker: "공영국 대리",
      subWorkers: "",
      items: [createDefaultItem("pcm1")],
      downtimeMinutes: 30,
      downtimeCategory: "형교환",
      downtimeDetail: "",
      notes: "",
      approvalStatus: "대기"
    };
  });

  const [errors, setErrors] = useState({});

  // Items for currently selected line
  const activeLineItems = useMemo(() => {
    return getItemsByLine(formData.lineId || "pcm1");
  }, [formData.lineId]);

  // Sync on modal open or initialData change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const items = (Array.isArray(initialData.items) && initialData.items.length > 0)
          ? initialData.items.map((it, i) => ({
              id: it.id || `item_${i + 1}`,
              vehicle: it.vehicle || "",
              itemName: it.itemName || "",
              itemCode: it.itemCode || "",
              targetQty: it.targetQty ?? 2000,
              actualQty: it.actualQty ?? 1950,
              goodQty: it.goodQty ?? 1900,
              defectQty: it.defectQty ?? 50,
              scrapKg: it.scrapKg ?? 7.5
            }))
          : [
              {
                id: "item_1",
                vehicle: initialData.vehicle || "BC4T",
                itemName: initialData.itemName || "D/SIDE D",
                itemCode: initialData.itemCode || "",
                targetQty: initialData.targetQty ?? 4000,
                actualQty: initialData.actualQty ?? 3950,
                goodQty: initialData.goodQty ?? 3880,
                defectQty: initialData.defectQty ?? 70,
                scrapKg: initialData.scrapKg ?? 15.0
              }
            ];

        setFormData({
          ...initialData,
          items
        });
      } else {
        setFormData({
          date: todayStr,
          shift: "주간",
          plant: "삼랑진공장",
          lineId: "pcm1",
          lineName: "PCM #1 LINE",
          worker: "공영국 대리",
          subWorkers: "",
          items: [createDefaultItem("pcm1")],
          downtimeMinutes: 30,
          downtimeCategory: "형교환",
          downtimeDetail: "",
          notes: "",
          approvalStatus: "대기"
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Multi-item shift-level aggregated totals
  const totalTargetQty = formData.items.reduce((sum, it) => sum + (Number(it.targetQty) || 0), 0);
  const totalActualQty = formData.items.reduce((sum, it) => sum + (Number(it.actualQty) || 0), 0);
  const totalGoodQty = formData.items.reduce((sum, it) => sum + (Number(it.goodQty) || 0), 0);
  const totalDefectQty = formData.items.reduce((sum, it) => sum + (Number(it.defectQty) || 0), 0);
  const totalScrapKg = Number(formData.items.reduce((sum, it) => sum + (Number(it.scrapKg) || 0), 0).toFixed(1));

  const totalAttainmentRate = totalTargetQty > 0 ? ((totalActualQty / totalTargetQty) * 100).toFixed(1) : "100.0";
  const totalYieldRate = totalActualQty > 0 ? ((totalGoodQty / totalActualQty) * 100).toFixed(1) : "100.0";
  const totalDefectRate = totalActualQty > 0 ? ((totalDefectQty / totalActualQty) * 100).toFixed(1) : "0.0";

  // Switch line (clean line selection in Section 1)
  const handleLineSelect = (lineId, fullName) => {
    const newLineItems = getItemsByLine(lineId);
    const defaultNewItem = newLineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };

    // Update items to match new line items if not matching
    const updatedItems = formData.items.map((it) => {
      const exists = newLineItems.some((n) => n.vehicle === it.vehicle && n.itemName === it.itemName);
      if (exists) return it;
      return {
        ...it,
        vehicle: defaultNewItem.vehicle,
        itemName: defaultNewItem.itemName
      };
    });

    setFormData((prev) => ({
      ...prev,
      lineId,
      lineName: fullName,
      items: updatedItems.length > 0 ? updatedItems : [createDefaultItem(lineId)]
    }));
  };

  // Add Item for mold/product changeover (품종 교체 생산 추가)
  const handleAddItem = () => {
    const newItem = createDefaultItem(formData.lineId, formData.items.length + 1);
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update specific item field
  const handleItemFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      const targetItem = { ...nextItems[index] };

      if (field === "itemSelect") {
        // Value is encoded as "vehicle:::itemName"
        const [v, n] = value.split(":::");
        targetItem.vehicle = v || "";
        targetItem.itemName = n || "";
      } else if (["targetQty", "actualQty", "goodQty", "defectQty", "scrapKg"].includes(field)) {
        const num = value === "" ? "" : Math.max(0, Number(value));
        targetItem[field] = num;

        // Auto adjust defect quantity
        if (field === "actualQty" || field === "goodQty") {
          const act = field === "actualQty" ? (num === "" ? 0 : num) : Number(targetItem.actualQty) || 0;
          const gd = field === "goodQty" ? (num === "" ? 0 : num) : Number(targetItem.goodQty) || 0;
          targetItem.defectQty = Math.max(0, act - gd);
        }
      } else {
        targetItem[field] = value;
      }

      nextItems[index] = targetItem;
      return { ...prev, items: nextItems };
    });
  };

  const handleDowntimeChange = (field, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setFormData((prev) => ({ ...prev, [field]: num }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.date) newErrors.date = "작업일자를 입력해주세요.";
    if (!formData.worker) newErrors.worker = "작업자를 선택해주세요.";

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "생산 품목을 최소 1개 이상 추가해주세요.";
    } else {
      const hasInvalid = formData.items.some((it) => !it.vehicle || !it.itemName);
      if (hasInvalid) {
        newErrors.items = "모든 품목의 아이템을 선택해주세요.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const reportToSave = sanitizeExtrusionReport({
      ...formData,
      items: formData.items,
      targetQty: totalTargetQty,
      actualQty: totalActualQty,
      goodQty: totalGoodQty,
      defectQty: totalDefectQty,
      scrapKg: totalScrapKg,
      downtimeMinutes: Number(formData.downtimeMinutes) || 0
    });

    onSave(reportToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
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
                라인별 생산실적 등록 (주/야간 품종 교체 생산 다품목 추가 지원)
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
          {/* ========================================================================= */}
          {/* Section 1: Basic Info (Clean Line Buttons, Shift, Date, Worker Dropdown) */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                ① 기본 정보 (호기 및 작업자)
              </span>
              <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300">
                삼랑진공장 압출동
              </span>
            </div>

            {/* 🌟 Clean Line Selection Buttons (라인명만 깔끔하게) */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1.5">
                생산 호기 선택 *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CLEAN_LINE_OPTIONS.map((l) => {
                  const isSel = formData.lineId === l.id;
                  const activeStyle =
                    l.id === "pcm1" ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-400/40" :
                    l.id === "pcm3" ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40" :
                    l.id === "pvc" ? "bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40" :
                    "bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/40";

                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLineSelect(l.id, l.fullName)}
                      className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        isSel
                          ? activeStyle
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <span>{l.name}</span>
                      {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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

              {/* Worker Dropdown */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1">
                  작업조장 / 작업자 (드롭다운) *
                </label>
                <select
                  value={formData.worker}
                  onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-teal-500 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer shadow-xs text-xs sm:text-sm"
                >
                  <option value="">-- 작업자를 선택하세요 --</option>
                  {WORKER_PRESETS.map((w) => (
                    <option key={w.name} value={`${w.name} ${w.title}`}>
                      {w.name} {w.title} ({w.role})
                    </option>
                  ))}
                  <option value="TEST">TEST</option>
                </select>
                {errors.worker && <p className="text-rose-500 text-[10px] mt-0.5">{errors.worker}</p>}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Section 2: Multi-Item Production Management (품종 교체 생산 다품목 추가) */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ② 생산 품목 관리 (품종 교체 생산 지원)
              </span>
              <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                {formData.lineName} · 등록 품목 {formData.items.length}개
              </span>
            </div>

            {errors.items && <p className="text-rose-500 text-xs font-bold">{errors.items}</p>}

            {/* List of Item Cards */}
            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const itActual = Number(item.actualQty) || 0;
                const itGood = Number(item.goodQty) || 0;
                const itTarget = Number(item.targetQty) || 0;
                const itYield = itActual > 0 ? ((itGood / itActual) * 100).toFixed(1) : "100.0";
                const itAttain = itTarget > 0 ? ((itActual / itTarget) * 100).toFixed(1) : "100.0";
                const currentVal = `${item.vehicle}:::${item.itemName}`;

                return (
                  <div
                    key={item.id || index}
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
                        {item.vehicle && item.itemName && (
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs hidden sm:inline">
                            [{item.vehicle}] {item.itemName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          수율 {itYield}% (달성 {itAttain}%)
                        </span>
                        {formData.items.length > 1 && (
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
                        📦 생산 아이템 선택 (이니셜순 정렬) *
                      </label>
                      <select
                        value={currentVal}
                        onChange={(e) => handleItemFieldChange(index, "itemSelect", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-600 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer shadow-xs"
                      >
                        <option value="">
                          -- [{CLEAN_LINE_OPTIONS.find((l) => l.id === formData.lineId)?.name}] 아이템을 선택하세요 (총 {activeLineItems.length}개) --
                        </option>
                        {activeLineItems.map((it) => (
                          <option key={it.id} value={`${it.vehicle}:::${it.itemName}`}>
                            [{it.vehicle}] {it.itemName}{it.isAS ? " 🛠️(A/S)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Item Quantities */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                          계획수량 (m)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.targetQty}
                          onChange={(e) => handleItemFieldChange(index, "targetQty", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                          총 실적 (m) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.actualQty}
                          onChange={(e) => handleItemFieldChange(index, "actualQty", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 font-black text-right text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                          양품수량 (m) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.goodQty}
                          onChange={(e) => handleItemFieldChange(index, "goodQty", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-blue-700 dark:text-blue-400 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                          불량수량 (m)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.defectQty}
                          onChange={(e) => handleItemFieldChange(index, "defectQty", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-rose-600 dark:text-rose-400 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-400 mb-1">
                          스크랩 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.scrapKg}
                          onChange={(e) => handleItemFieldChange(index, "scrapKg", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-right text-amber-600 dark:text-amber-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ➕ Add Item Button (생산품목 추가 버튼) */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-teal-400 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>➕ 생산품목 추가 (주/야간 품종 교체 생산)</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* Section 3: Shift Total Production Metrics (종합 실적 및 전체 수율 요약) */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ③ 종합 실적 및 전체 수율 자동 계산 ({formData.items.length}개 품목 합산)
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-300">
                  종합 달성률: {totalAttainmentRate}%
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs border border-blue-300">
                  종합 수율: {totalYieldRate}%
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-xs border border-rose-300">
                  불량률: {totalDefectRate}%
                </span>
              </div>
            </div>

            {/* Total Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10.5px] font-bold text-slate-500">총 계획수량</span>
                <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {totalTargetQty.toLocaleString()} <span className="text-[10px] font-normal">m</span>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10.5px] font-black text-emerald-800 dark:text-emerald-300">총 실적수량</span>
                <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {totalActualQty.toLocaleString()} <span className="text-[10px] font-normal">m</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                <span className="text-[10.5px] font-black text-blue-800 dark:text-blue-300">총 양품수량</span>
                <div className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">
                  {totalGoodQty.toLocaleString()} <span className="text-[10px] font-normal">m</span>
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-[10.5px] font-black text-rose-800 dark:text-rose-300">총 불량수량</span>
                <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {totalDefectQty.toLocaleString()} <span className="text-[10px] font-normal">m</span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10.5px] font-black text-amber-800 dark:text-amber-300">총 스크랩</span>
                <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {totalScrapKg.toLocaleString()} <span className="text-[10px] font-normal">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Section 4: Downtime & Loss Management */}
          {/* ========================================================================= */}
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
                  onChange={(e) => handleDowntimeChange("downtimeMinutes", e.target.value)}
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

          {/* ========================================================================= */}
          {/* Section 5: Notes & Handover */}
          {/* ========================================================================= */}
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
