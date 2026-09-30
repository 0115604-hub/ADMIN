import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Package,
  Sliders,
  Thermometer,
  Gauge,
  Flame,
  Wind,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Wrench,
  Camera,
  AlertOctagon,
  Image as ImageIcon
} from "lucide-react";
import {
  WORKER_PRESETS,
  DOWNTIME_CATEGORIES,
  TPM_CHECK_ITEMS,
  sanitizeExtrusionReport
} from "../../services/extrusionProductionService";
import {
  getItemsByLine
} from "../../data/extrusionItemsData";

// Client-side image compression for fast sync & light Firestore storage
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: ((dataUrl.length * (3 / 4)) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
    };
  });
};

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
  
  // Step state: 'tpm' (1단계: TPM 점검) or 'report' (2단계: 작업일보 작성)
  const [currentStep, setCurrentStep] = useState(isEditing ? "report" : "tpm");
  const [showCheckSheetDetails, setShowCheckSheetDetails] = useState(false);

  // Photo Capture & Preview states
  const fileInputRef = useRef(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);

  // TPM Checks State (10 items)
  const [tpmChecks, setTpmChecks] = useState(() => {
    return TPM_CHECK_ITEMS.map((it) => ({
      id: it.id,
      status: "OK", // 'OK' | 'WARN' | 'NG'
      note: ""
    }));
  });

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
        items,
        tpmIssueText: initialData?.tpmIssueText || initialData?.tpmIssueReport?.text || "",
        tpmIssuePhotos: Array.isArray(initialData?.tpmIssuePhotos)
          ? initialData.tpmIssuePhotos
          : (Array.isArray(initialData?.tpmIssueReport?.photos) ? initialData.tpmIssueReport.photos : []),
        rawMaterials: {
          rubberLot: initialData?.rawMaterials?.rubberLot || "",
          coatingLot: initialData?.rawMaterials?.coatingLot || "",
          insertLot: initialData?.rawMaterials?.insertLot || ""
        },
        defectBreakdown: {
          cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
          startLossKg: initialData?.defectBreakdown?.startLossKg || "",
          appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
        },
        conditions: {
          extruder110Rpm: initialData?.conditions?.extruder110Rpm || initialData?.conditions?.extruderRpm || "26.4",
          extruder70Rpm: initialData?.conditions?.extruder70Rpm || "19.2",
          waterTemp: initialData?.conditions?.waterTemp || "47.0",
          cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || "212.0",
          haulOffSpeed: initialData?.conditions?.haulOffSpeed || "19.6",
          sprayGun1: initialData?.conditions?.sprayGun1 || "2.5",
          sprayGun2: initialData?.conditions?.sprayGun2 || "2.6",
          sprayGun3: initialData?.conditions?.sprayGun3 || "2.5",
          sprayGun4: initialData?.conditions?.sprayGun4 || "2.4"
        }
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
      tpmIssueText: "",
      tpmIssuePhotos: [],
      rawMaterials: {
        rubberLot: "W60433 / UF10161726927029200A",
        coatingLot: "UF10161726927032700A",
        insertLot: "SK5 0.5T / LOT-260930A"
      },
      defectBreakdown: {
        cutoffKg: "",
        startLossKg: "",
        appearanceKg: ""
      },
      conditions: {
        extruder110Rpm: "26.4",
        extruder70Rpm: "19.2",
        waterTemp: "47.0",
        cureZoneTemp: "212.0", // 210±20℃
        haulOffSpeed: "19.6",
        sprayGun1: "2.5",
        sprayGun2: "2.6",
        sprayGun3: "2.5",
        sprayGun4: "2.4"
      },
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
      setCurrentStep(isEditing ? "report" : "tpm");
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

        if (Array.isArray(initialData.tpmChecks) && initialData.tpmChecks.length > 0) {
          setTpmChecks(initialData.tpmChecks);
        } else {
          setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        }

        setFormData({
          ...initialData,
          items,
          rawMaterials: {
            rubberLot: initialData?.rawMaterials?.rubberLot || "",
            coatingLot: initialData?.rawMaterials?.coatingLot || "",
            insertLot: initialData?.rawMaterials?.insertLot || ""
          },
          defectBreakdown: {
            cutoffKg: initialData?.defectBreakdown?.cutoffKg || "",
            startLossKg: initialData?.defectBreakdown?.startLossKg || "",
            appearanceKg: initialData?.defectBreakdown?.appearanceKg || ""
          },
          conditions: {
            extruder110Rpm: initialData?.conditions?.extruder110Rpm || initialData?.conditions?.extruderRpm || "26.4",
            extruder70Rpm: initialData?.conditions?.extruder70Rpm || "19.2",
            waterTemp: initialData?.conditions?.waterTemp || "47.0",
            cureZoneTemp: initialData?.conditions?.cureZoneTemp || initialData?.conditions?.cureTemp || "212.0",
            haulOffSpeed: initialData?.conditions?.haulOffSpeed || "19.6",
            sprayGun1: initialData?.conditions?.sprayGun1 || "2.5",
            sprayGun2: initialData?.conditions?.sprayGun2 || "2.6",
            sprayGun3: initialData?.conditions?.sprayGun3 || "2.5",
            sprayGun4: initialData?.conditions?.sprayGun4 || "2.4"
          }
        });
      } else {
        setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
        setFormData({
          date: todayStr,
          shift: "주간",
          plant: "삼랑진공장",
          lineId: "pcm1",
          lineName: "PCM #1 LINE",
          worker: "공영국 대리",
          subWorkers: "",
          items: [createDefaultItem("pcm1")],
          rawMaterials: {
            rubberLot: "W60433 / UF10161726927029200A",
            coatingLot: "UF10161726927032700A",
            insertLot: "SK5 0.5T / LOT-260930A"
          },
          defectBreakdown: {
            cutoffKg: "",
            startLossKg: "",
            appearanceKg: ""
          },
          conditions: {
            extruder110Rpm: "26.4",
            extruder70Rpm: "19.2",
            waterTemp: "47.0",
            cureZoneTemp: "212.0",
            haulOffSpeed: "19.6",
            sprayGun1: "2.5",
            sprayGun2: "2.6",
            sprayGun3: "2.5",
            sprayGun4: "2.4"
          },
          downtimeMinutes: 30,
          downtimeCategory: "형교환",
          downtimeDetail: "",
          notes: "",
          approvalStatus: "대기"
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, isEditing]);

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

  // TPM Handlers
  const handleTpmStatusChange = (itemId, status) => {
    setTpmChecks((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status } : it))
    );
  };

  const handleTpmNoteChange = (itemId, note) => {
    setTpmChecks((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, note } : it))
    );
  };

  const handleSetAllTpmOk = () => {
    setTpmChecks(TPM_CHECK_ITEMS.map((it) => ({ id: it.id, status: "OK", note: "" })));
  };

  // Photo capture handler for Abnormality Report
  const handlePhotoCapture = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsCapturingPhoto(true);
    try {
      const newPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1200, 1200, 0.8);
        newPhotos.push(compressed);
      }
      setFormData((prev) => ({
        ...prev,
        tpmIssuePhotos: [...(prev.tpmIssuePhotos || []), ...newPhotos]
      }));
    } catch (err) {
      console.error("사진 첨부/촬영 처리 오류:", err);
    } finally {
      setIsCapturingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (photoId) => {
    setFormData((prev) => ({
      ...prev,
      tpmIssuePhotos: (prev.tpmIssuePhotos || []).filter((p) => p.id !== photoId)
    }));
  };

  // Switch line
  const handleLineSelect = (lineId, fullName) => {
    const newLineItems = getItemsByLine(lineId);
    const defaultNewItem = newLineItems[0] || { vehicle: "BC4T", itemName: "D/SIDE D" };

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

  // Add Item
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
        const [v, n] = value.split(":::");
        targetItem.vehicle = v || "";
        targetItem.itemName = n || "";
      } else if (["targetQty", "actualQty", "goodQty", "defectQty", "scrapKg"].includes(field)) {
        const num = value === "" ? "" : Math.max(0, Number(value));
        targetItem[field] = num;

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

  const handleNestedFieldChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.date) newErrors.date = "작업일자를 입력해주세요.";
    if (!formData.worker) newErrors.worker = "작업자를 선택해주세요.";

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
      tpmStatus: "완료",
      tpmChecks,
      tpmIssueText: formData.tpmIssueText || "",
      tpmIssuePhotos: formData.tpmIssuePhotos || [],
      downtimeMinutes: Number(formData.downtimeMinutes) || 0
    });

    onSave(reportToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Zap className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isEditing ? "압출 작업일보 및 체크시트 수정" : "압출 TPM 점검 및 작업일보 작성"}
              </h3>
              <p className="text-[11px] text-teal-200/80 font-medium">
                {currentStep === "tpm"
                  ? "[1단계] 설비 TPM 자주보전 10대 항목 일일 점검"
                  : "[2단계] 다품종 생산실적 & 실시간 작업체크시트"}
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

        {/* Step Progression Tabs Header */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep("tpm")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "tpm"
                  ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1단계: TPM 설비 자주보전 점검</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setCurrentStep("report")}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                currentStep === "report"
                  ? "bg-teal-600 text-white shadow-xs ring-2 ring-teal-400/40"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>2단계: 작업일보 및 체크시트 작성</span>
            </button>
          </div>

          {currentStep === "tpm" && (
            <button
              type="button"
              onClick={handleSetAllTpmOk}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>⚡ 전체 양호(○) 일괄 체크</span>
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        {currentStep === "tpm" ? (
          /* ========================================================================= */
          /* STEP 1: TPM 점검일지 화면 */
          /* ========================================================================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
            {/* Guide Header Banner */}
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-black text-teal-900 dark:text-teal-200 text-xs sm:text-sm">
                    압출 설비 TPM 10대 자주보전 항목 점검 (필수)
                  </h4>
                  <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 mt-0.5">
                    각 항목의 점검 상태(양호/요관찰/불량)를 탭하여 체크해 주세요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-teal-600 text-white shadow-2xs">
                  총 {TPM_CHECK_ITEMS.length}개 항목
                </span>
              </div>
            </div>

            {/* TPM 10 Items List - Simplified & Directly Tappable */}
            <div className="space-y-2">
              {TPM_CHECK_ITEMS.map((item, idx) => {
                const currentCheck = tpmChecks.find((c) => c.id === item.id) || { status: "OK", note: "" };
                const isOK = currentCheck.status === "OK";
                const isWarn = currentCheck.status === "WARN";
                const isNG = currentCheck.status === "NG";

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isNG
                        ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
                        : isWarn
                        ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Item Index, Category & Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black text-[11px] shrink-0">
                          {item.category}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {item.name}
                        </span>
                      </div>

                      {/* Right: 3-Way Tappable Buttons (○ 양호 / △ 요관찰 / ✕ 불량) */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "OK")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isOK
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <span>○</span>
                          <span>양호</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "WARN")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isWarn
                              ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          }`}
                        >
                          <span>△</span>
                          <span>요관찰</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpmStatusChange(item.id, "NG")}
                          className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                            isNG
                              ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          }`}
                        >
                          <span>✕</span>
                          <span>불량</span>
                        </button>
                      </div>
                    </div>

                    {/* Note Input for Warn/NG */}
                    {(isWarn || isNG) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={currentCheck.note}
                          onChange={(e) => handleTpmNoteChange(item.id, e.target.value)}
                          placeholder="이상 증상 및 조치 내용 입력 (선택)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* 맨 아래 이상발생신고란 한 줄 + 사진촬영 */}
            {/* ========================================================================= */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
                    <AlertOctagon className="w-4 h-4" />
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    이상발생신고
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold hidden sm:inline">
                    (설비/안전/품질 특이사항 발생 시 기재 및 사진 첨부)
                  </span>
                </div>

                {/* Camera Capture Button */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoCapture}
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCapturingPhoto}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCapturingPhoto ? "압축중..." : "📷 사진촬영"}</span>
                  </button>
                </div>
              </div>

              {/* Single Line Text Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.tpmIssueText || ""}
                  onChange={(e) => setFormData({ ...formData, tpmIssueText: e.target.value })}
                  placeholder="이상 발생 내용 및 긴급 조치 요청사항을 입력하세요 (선택)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Photos Preview Thumbnails */}
              {Array.isArray(formData.tpmIssuePhotos) && formData.tpmIssuePhotos.length > 0 && (
                <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1">
                  {formData.tpmIssuePhotos.map((photo, pIdx) => (
                    <div key={photo.id || pIdx} className="relative group shrink-0">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || "이상발생 사진"}
                        onClick={() => setSelectedPhotoPreview(photo.dataUrl)}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-amber-400 dark:border-amber-600 shadow-xs cursor-pointer hover:opacity-90 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer transition active:scale-90"
                        title="사진 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-slate-950/70 text-white text-[9px] font-bold">
                        {photo.size || "사진"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEP 2: 압출 작업일보 및 체크시트 화면 */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
            {/* TPM Verification Passed Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-black text-emerald-900 dark:text-emerald-200 text-xs">
                  TPM 설비 자주보전 10대 항목 점검 완료 (작업일보 등록 가능)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
              >
                TPM 재확인 ➔
              </button>
            </div>

            {/* ========================================================================= */}
            {/* Section 1: Basic Info (Clean Line Buttons, Shift, Date, Worker Dropdown) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ① 기본 정보 (1. 공정 및 설비명)
                </span>
                <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300">
                  삼랑진공장 압출동 · SL생산팀
                </span>
              </div>

              {/* Clean Line Selection Buttons */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 mb-1.5">
                  생산 호기(라인명) 선택 *
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
                    작업자명 (작업조장 / 담당) *
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
                    <option value="현해">현해</option>
                    <option value="TEST">TEST</option>
                  </select>
                  {errors.worker && <p className="text-rose-500 text-[10px] mt-0.5">{errors.worker}</p>}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Section 2: Multi-Item Production Management (2. 작업현황 - 생산현황) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ② 생산 품목 현황 (다품종 교체 생산 지원)
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
                          📦 생산 품명 선택 (차종/품명 이니셜순 정렬) *
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
                            지시/계획수량 (m)
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
                            작업/총실적 (m) *
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

            {/* ========================================================================= */}
            {/* Section 3: Shift Total Production Metrics (종합 실적 및 전체 수율 요약) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ③ 종합 실적 및 전체 수율 요약 ({formData.items.length}개 품목 합산)
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
            {/* Section 4: 작업체크시트 상세 기록 (원자재 LOT / 불량 세부 / 110Ø·70Ø / 코팅건 1~4 / 가류존 1~13) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCheckSheetDetails(!showCheckSheetDetails)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                    ④ 작업체크시트 상세 (원자재 LOT / 불량 세부 / 110Ø·70Ø 압출 / 코팅건 1~4번 / 가류존 1~13번)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300">
                    {showCheckSheetDetails ? "접기 ▲" : "체크시트 항목 펼치기 ▼"}
                  </span>
                </div>
                {showCheckSheetDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showCheckSheetDetails && (
                <div className="p-4 pt-1 space-y-4 border-t border-slate-200 dark:border-slate-700/80 animate-fadeIn">
                  {/* 1. 원자재 현황 (연고무, 코팅액, 심금 LOT) */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                      <span>원자재 현황 (연고무 / 코팅액 / 심금 LOT)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          연고무 원료코드 & LOT NO
                        </label>
                        <input
                          type="text"
                          value={formData.rawMaterials?.rubberLot || ""}
                          onChange={(e) => handleNestedFieldChange("rawMaterials", "rubberLot", e.target.value)}
                          placeholder="예: W60433 / UF10161726927029200A"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          코팅액 약품명 & LOT NO
                        </label>
                        <input
                          type="text"
                          value={formData.rawMaterials?.coatingLot || ""}
                          onChange={(e) => handleNestedFieldChange("rawMaterials", "coatingLot", e.target.value)}
                          placeholder="예: UF10161726927032700A / HSC-2000B-3"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          심금 규격 & LOT NO
                        </label>
                        <input
                          type="text"
                          value={formData.rawMaterials?.insertLot || ""}
                          onChange={(e) => handleNestedFieldChange("rawMaterials", "insertLot", e.target.value)}
                          placeholder="예: SK5 0.5T / LOT-260930A"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. 불량 세부 현황 (단연조정, 셋지/시동, 치수/외관) */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>불량 세부 현황 (단연조정 / 셋지 / 치수외관)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          단연조정 불량 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.defectBreakdown?.cutoffKg || ""}
                          onChange={(e) => handleNestedFieldChange("defectBreakdown", "cutoffKg", e.target.value)}
                          placeholder="예: 23.2"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-right text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          셋지(시동) 불량 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.defectBreakdown?.startLossKg || ""}
                          onChange={(e) => handleNestedFieldChange("defectBreakdown", "startLossKg", e.target.value)}
                          placeholder="예: 3.8"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-right text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          치수 / 외관 불량 (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.defectBreakdown?.appearanceKg || ""}
                          onChange={(e) => handleNestedFieldChange("defectBreakdown", "appearanceKg", e.target.value)}
                          placeholder="예: 2.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-right text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. 압출기 조건 (110Ø & 70Ø) 및 온수조 */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                      <Sliders className="w-3.5 h-3.5 text-teal-600" />
                      <span>3. 압출조건 (110Ø / 70Ø 압출기 속도 & 온수조 온도)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          110Ø 압출기 속도 (RPM) <span className="text-[10px] text-teal-600 font-bold">[표준: 29.0±2.9]</span>
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.extruder110Rpm || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "extruder110Rpm", e.target.value)}
                          placeholder="예: 26.4"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          70Ø 압출기 속도 (RPM) <span className="text-[10px] text-teal-600 font-bold">[표준: 20.0±2.0]</span>
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.extruder70Rpm || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "extruder70Rpm", e.target.value)}
                          placeholder="예: 19.2"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          온수조 평균온도 (℃) <span className="text-[10px] text-teal-600 font-bold">[표준: 50±5℃]</span>
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.waterTemp || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "waterTemp", e.target.value)}
                          placeholder="예: 47.0"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. 코팅건 분사압력 (1번, 2번, 3번, 4번) */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                      <Wind className="w-3.5 h-3.5 text-blue-600" />
                      <span>코팅건 분사압력 (1번, 2번, 3번, 4번 분사수치 / bar)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          코팅건 1번 분사압력
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.sprayGun1 || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "sprayGun1", e.target.value)}
                          placeholder="예: 2.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          코팅건 2번 분사압력
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.sprayGun2 || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "sprayGun2", e.target.value)}
                          placeholder="예: 2.6"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          코팅건 3번 분사압력
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.sprayGun3 || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "sprayGun3", e.target.value)}
                          placeholder="예: 2.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          코팅건 4번 분사압력
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.sprayGun4 || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "sprayGun4", e.target.value)}
                          placeholder="예: 2.4"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. 가류조 조건 (가류존 1번~13번 : 표준 210℃ ± 20℃) */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span>4-1. 가류조 조건 (가류존 1번~13번 : 표준 210℃ ± 20℃)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">
                        가류존 1~13번 전구역 정상 작동 [OK]
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          가류존 평균온도 (℃) <span className="text-[10px] text-rose-600 font-bold">[표준: 210 ± 20 ℃]</span>
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.cureZoneTemp || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "cureZoneTemp", e.target.value)}
                          placeholder="예: 212.0"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                          라인 인취기 속도 (m/분) <span className="text-[10px] text-teal-600 font-bold">[표준: 20.0 ± 1.0]</span>
                        </label>
                        <input
                          type="text"
                          value={formData.conditions?.haulOffSpeed || ""}
                          onChange={(e) => handleNestedFieldChange("conditions", "haulOffSpeed", e.target.value)}
                          placeholder="예: 19.6"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* Section 5: Downtime & Loss Management */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ⑤ 비가동 시간 및 발생 사유 (2. 작업현황 - 비가동)
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
                    비가동 상세 사유 및 조치 내용 (시간대 포함)
                  </label>
                  <input
                    type="text"
                    value={formData.downtimeDetail}
                    onChange={(e) => setFormData({ ...formData, downtimeDetail: e.target.value })}
                    placeholder="예: 08:00 - 08:50 품종교체 및 시운전 50분 완료"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Section 6: Notes & Handover */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="block font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                ⑥ 특이사항 및 교대 인수인계 사항
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
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          {currentStep === "tpm" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep("report")}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>TPM 점검 완료 ➔ 작업일보 작성 진행</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep("tpm")}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs transition active:scale-95 cursor-pointer border border-slate-300 dark:border-slate-600 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>TPM 점검표 다시보기</span>
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
            </>
          )}
        </div>
      </div>

      {/* Enlarged Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="확대 사진"
              className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrusionWorkReportModal;
