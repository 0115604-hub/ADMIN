import { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Layers,
  Component,
  FileText,
  Building,
  User,
  Hash,
  Truck,
  Warehouse,
  PackageCheck
} from "lucide-react";
import {
  INSPECTION_CATEGORIES,
  STORAGE_LOCATIONS,
  QUANTITY_UNITS,
  RECEIVING_STATUS
} from "../../services/incomingInspectionService";
import { compressImage } from "../../utils/imageCompressor";

export const IncomingInspectionModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  currentProfile = null,
  defaultMode = "FULL" // "FULL" (입고+검사) or "RECEIVE_ONLY" (입고만)
}) => {
  // 모드 상태: "FULL" (입고+검사 동시 진행) vs "RECEIVE_ONLY" (입고만 먼저 등록)
  const [modalMode, setModalMode] = useState("FULL");

  // 입고 기본 정보
  const [category, setCategory] = useState("RAW_MATERIAL");
  const [itemType, setItemType] = useState("FMB");
  const [itemName, setItemName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [deliveryNoteNo, setDeliveryNoteNo] = useState("");
  const [storageLocation, setStorageLocation] = useState("삼랑진 원재료창고");
  const [quantityNum, setQuantityNum] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("kg");
  const [plant, setPlant] = useState("삼랑진공장");
  const [receivedBy, setReceivedBy] = useState("유동길");
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivingTime, setReceivingTime] = useState(
    new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
  );

  // 검사 정보
  const [inspector, setInspector] = useState("이창엽");
  const [overallResult, setOverallResult] = useState("PASS");
  const [receivingStatus, setReceivingStatus] = useState("PASSED");
  const [remarks, setRemarks] = useState("");
  const [inspectionChecks, setInspectionChecks] = useState([]);
  const [mSheetPhotos, setMSheetPhotos] = useState([]);
  const [defectPhotos, setDefectPhotos] = useState([]);
  const [deliverySlipPhotos, setDeliverySlipPhotos] = useState([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mSheetCameraRef = useRef(null);
  const mSheetFileRef = useRef(null);
  const defectCameraRef = useRef(null);
  const defectFileRef = useRef(null);
  const slipCameraRef = useRef(null);
  const slipFileRef = useRef(null);

  // 초기화 및 데이터 바인딩
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const isPending = initialData.receivingStatus === "PENDING" || initialData.overallResult === "PENDING";
      setModalMode(isPending ? "FULL" : "FULL");
      setCategory(initialData.category || "RAW_MATERIAL");
      setItemType(initialData.itemType || "");
      setItemName(initialData.itemName || "");
      setSupplier(initialData.supplier || "");
      setLotNo(initialData.lotNo || "");
      setDeliveryNoteNo(initialData.deliveryNoteNo || "");
      setStorageLocation(initialData.storageLocation || "삼랑진 원재료창고");
      setQuantityNum(initialData.quantityNum || (initialData.quantity ? String(initialData.quantity).replace(/[^0-9.]/g, "") : ""));
      setQuantityUnit(initialData.quantityUnit || (initialData.category === "RAW_MATERIAL" ? "kg" : "EA"));
      setPlant(initialData.plant || "삼랑진공장");
      setReceivedBy(initialData.receivedBy || currentProfile?.name || "유동길");
      setReceivingDate(initialData.receivingDate || initialData.date || new Date().toISOString().slice(0, 10));
      setReceivingTime(initialData.receivingTime || initialData.time || "09:30");
      setInspector(initialData.inspector || currentProfile?.name || "이창엽");
      setOverallResult(initialData.overallResult || (isPending ? "PASS" : "PASS"));
      setReceivingStatus(initialData.receivingStatus || (isPending ? "PENDING" : "PASSED"));
      setRemarks(initialData.remarks || "");

      const checks =
        Array.isArray(initialData.inspectionChecks) && initialData.inspectionChecks.length > 0
          ? JSON.parse(JSON.stringify(initialData.inspectionChecks))
          : JSON.parse(JSON.stringify(INSPECTION_CATEGORIES[initialData.category || "RAW_MATERIAL"].defaultChecks));
      setInspectionChecks(checks);

      setMSheetPhotos(initialData.mSheetPhotos || []);
      setDefectPhotos(initialData.defectPhotos || []);
      setDeliverySlipPhotos(initialData.deliverySlipPhotos || []);
    } else {
      // 신규 등록
      setModalMode(defaultMode);
      const defaultCat = "RAW_MATERIAL";
      setCategory(defaultCat);
      const catConfig = INSPECTION_CATEGORIES[defaultCat];
      setItemType(catConfig.items[0]?.id || "");
      setItemName("");
      setSupplier("");
      const todayShort = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      setLotNo(`LOT-${todayShort}-01`);
      setDeliveryNoteNo(`TR-${todayShort}-01`);
      setStorageLocation("삼랑진 원재료창고");
      setQuantityNum("");
      setQuantityUnit("kg");
      setPlant(currentProfile?.plant || "삼랑진공장");
      setReceivedBy(currentProfile?.name || "유동길");
      setReceivingDate(new Date().toISOString().slice(0, 10));
      setReceivingTime(
        new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
      setInspector(currentProfile?.name || "이창엽");
      setOverallResult("PASS");
      setReceivingStatus(defaultMode === "RECEIVE_ONLY" ? "PENDING" : "PASSED");
      setRemarks("");
      setInspectionChecks(JSON.parse(JSON.stringify(catConfig.defaultChecks)));
      setMSheetPhotos([]);
      setDefectPhotos([]);
      setDeliverySlipPhotos([]);
    }
  }, [isOpen, initialData, currentProfile, defaultMode]);

  // 카테고리 변경
  const handleCategoryChange = (newCat) => {
    if (newCat === category) return;
    setCategory(newCat);
    const catConfig = INSPECTION_CATEGORIES[newCat];
    setItemType(catConfig.items[0]?.id || "");
    setInspectionChecks(JSON.parse(JSON.stringify(catConfig.defaultChecks)));
    setOverallResult("PASS");
    if (newCat === "RAW_MATERIAL") {
      setQuantityUnit("kg");
      setStorageLocation("삼랑진 원재료창고");
    } else {
      setQuantityUnit("EA");
      setStorageLocation("삼랑진 가공동 부자재랙");
    }
  };

  // 실측치 변경 및 자동 합부 계산
  const handleCheckValueChange = (index, field, value) => {
    setInspectionChecks((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "measured" && item.type === "NUMERIC") {
        const numVal = parseFloat(value);
        if (isNaN(numVal) || value.trim() === "") {
          item.result = "PASS";
        } else {
          let isFail = false;
          if (item.specMin !== null && item.specMin !== undefined && numVal < item.specMin) {
            isFail = true;
          }
          if (item.specMax !== null && item.specMax !== undefined && numVal > item.specMax) {
            isFail = true;
          }
          item.result = isFail ? "FAIL" : "PASS";
        }
      }

      next[index] = item;

      // 하나라도 FAIL이 있으면 불합격 제안
      const hasAnyFail = next.some((c) => c.result === "FAIL");
      if (hasAnyFail && overallResult === "PASS") {
        setOverallResult("REJECT");
        setReceivingStatus("REJECTED");
      }

      return next;
    });
  };

  // 판정(합격/불합격) 토글
  const handleToggleCheckResult = (index) => {
    setInspectionChecks((prev) => {
      const next = [...prev];
      const currentRes = next[index].result;
      const nextRes = currentRes === "PASS" ? "FAIL" : "PASS";
      next[index] = { ...next[index], result: nextRes };

      const hasAnyFail = next.some((c) => c.result === "FAIL");
      if (hasAnyFail && overallResult === "PASS") {
        setOverallResult("REJECT");
        setReceivingStatus("REJECTED");
      }
      return next;
    });
  };

  // 검사항목 추가
  const handleAddCustomCheck = () => {
    setInspectionChecks((prev) => [
      ...prev,
      {
        id: `chk_custom_${Date.now()}`,
        name: "신규 검사항목",
        type: "JUDGMENT",
        spec: "기준 규격 입력",
        measured: "",
        result: "PASS",
        note: ""
      }
    ]);
  };

  // 검사항목 삭제
  const handleRemoveCheck = (index) => {
    setInspectionChecks((prev) => prev.filter((_, i) => i !== index));
  };

  // 사진 압축 및 업로드
  const handlePhotoUpload = async (e, targetSetter) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingPhotos(true);
    try {
      const compressedList = await Promise.all(
        files.map((file) => compressImage(file, 1200, 1200, 0.8))
      );
      targetSetter((prev) => [...prev, ...compressedList.filter(Boolean)]);
    } catch (err) {
      console.error("[IncomingInspectionModal] Photo upload error:", err);
      alert("사진 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = "";
    }
  };

  // 종합 판정 변경 시 입고 상태 동기화
  const handleSetOverallResult = (res) => {
    setOverallResult(res);
    if (res === "PASS") {
      setReceivingStatus("PASSED");
    } else if (res === "REJECT") {
      setReceivingStatus("REJECTED");
    } else if (res === "CONDITIONAL") {
      setReceivingStatus("CONDITIONAL");
    }
  };

  // 최종 저장 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert("품명(규격)을 입력해주세요.");
      return;
    }
    if (!supplier.trim()) {
      alert("공급사(가공/협력업체)를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const formattedQty = quantityNum
        ? `${Number(quantityNum).toLocaleString()} ${quantityUnit}`
        : "";

      const finalStatus =
        modalMode === "RECEIVE_ONLY" ? "PENDING" : receivingStatus;
      const finalResult =
        modalMode === "RECEIVE_ONLY" ? "PENDING" : overallResult;

      const record = {
        id: initialData?.id || `mat_rec_${Date.now()}`,
        date: receivingDate,
        time: receivingTime,
        receivingDate,
        receivingTime,
        category,
        itemType,
        itemName: itemName.trim(),
        supplier: supplier.trim(),
        lotNo: lotNo.trim(),
        deliveryNoteNo: deliveryNoteNo.trim(),
        storageLocation,
        quantity: formattedQty,
        quantityNum: Number(quantityNum) || 0,
        quantityUnit,
        plant,
        receivedBy: receivedBy.trim(),
        inspector: modalMode === "RECEIVE_ONLY" ? "" : inspector.trim(),
        receivingStatus: finalStatus,
        overallResult: finalResult,
        remarks: remarks.trim(),
        inspectionChecks: modalMode === "RECEIVE_ONLY" ? [] : inspectionChecks,
        mSheetPhotos,
        defectPhotos,
        deliverySlipPhotos,
        syncedTo4M: initialData?.syncedTo4M || false,
        fourMLedgerId: initialData?.fourMLedgerId || null,
        syncedTo4MAt: initialData?.syncedTo4MAt || null,
        createdAt: initialData?.createdAt || new Date().toISOString()
      };

      await onSave(record);
      onClose();
    } catch (err) {
      console.error("[IncomingInspectionModal] Save error:", err);
      alert("저장 도중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentCatConfig = INSPECTION_CATEGORIES[category] || INSPECTION_CATEGORIES.RAW_MATERIAL;
  const isRejected = modalMode === "FULL" && (overallResult === "REJECT" || overallResult === "CONDITIONAL");
  const isPendingEdit = initialData?.receivingStatus === "PENDING" || initialData?.overallResult === "PENDING";

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-600/30 border border-cyan-400/40 text-cyan-300">
              <PackageCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                {initialData
                  ? isPendingEdit
                    ? "원부자재 입고 수입검사 실시"
                    : "원부자재 입고 & 수입검사 수정"
                  : "원부자재 입고 및 수입검사 등록"}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  {currentCatConfig.badge}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {modalMode === "FULL"
                  ? "원부자재 입고 정보 등록 + M/Sheet 성적서 대조 및 샘플링 수입검사"
                  : "원부자재 물류 입고 우선 등록 (품질 수입검사 대기 상태)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* 🌟 프로세스 모드 선택 바 (입고+검사 동시 vs 입고만 먼저 등록) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-slate-950 rounded-xl border border-cyan-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>진행 방식 선택:</span>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setModalMode("FULL");
                  setReceivingStatus("PASSED");
                  setOverallResult("PASS");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  modalMode === "FULL"
                    ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>입고 + 수입검사 동시 완료 (원스톱)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("RECEIVE_ONLY");
                  setReceivingStatus("PENDING");
                  setOverallResult("PENDING");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  modalMode === "RECEIVE_ONLY"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>입고만 먼저 등록 (검사대기)</span>
              </button>
            </div>
          </div>

          {/* 분류 탭 (원소재 vs 부자재) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleCategoryChange("RAW_MATERIAL")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition ${
                category === "RAW_MATERIAL"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>① 고무/압출 원소재 (FMB, CMB, 펠릿, 심재)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange("SUB_MATERIAL")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition ${
                category === "SUB_MATERIAL"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Component className="w-4 h-4" />
              <span>② 조립/체결 부자재 (클립, 브라켓, 테이프, 본드)</span>
            </button>
          </div>

          {/* 1. 원부자재 입고대장 기본 정보 입력 그리드 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="text-xs font-black text-cyan-400 flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>1. 원부자재 입고대장 정보 (물류·수불 식별)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                입고일자: {receivingDate} ({receivingTime})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* 품목 종류 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  품목 구분
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  {currentCatConfig.items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                  <option value="CUSTOM">기타 (직접입력)</option>
                </select>
              </div>

              {/* 품명 / 규격 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  품명 및 규격 (스펙) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: EPDM FMB-70A / DR-CLIP-01"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                />
              </div>

              {/* 공급사 (가공/협력업체) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  공급사 (가공/협력업체) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 한국합성, 태영정밀"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                />
              </div>

              {/* 거래명세서 번호 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  거래명세서(송장) 번호
                </label>
                <input
                  type="text"
                  placeholder="예: TR-261029-01"
                  value={deliveryNoteNo}
                  onChange={(e) => setDeliveryNoteNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* 입고 LOT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 LOT 번호
                </label>
                <input
                  type="text"
                  placeholder="예: 261029-01"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* 입고 수량 및 단위 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 수량 & 단위 <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="수량"
                    value={quantityNum}
                    onChange={(e) => setQuantityNum(e.target.value)}
                    className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                  />
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                  >
                    {QUANTITY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 보관 창고/위치 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  보관 창고 / 위치
                </label>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  {STORAGE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* 입고 공장 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 공장
                </label>
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="삼랑진공장">삼랑진공장</option>
                  <option value="한림공장">한림공장</option>
                  <option value="본사">본사</option>
                </select>
              </div>

              {/* 입고 담당자 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 담당자 (검수)
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* 검사 담당자 (동시 진행 시) */}
              {modalMode === "FULL" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    품질 검사원
                  </label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* 거래명세서 사진 첨부 */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>거래명세표(송장) 사진 첨부</span>
                {deliverySlipPhotos.length > 0 && (
                  <span className="text-cyan-400 font-bold">({deliverySlipPhotos.length}장 첨부됨)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={slipCameraRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, setDeliverySlipPhotos)}
                />
                <input
                  type="file"
                  ref={slipFileRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, setDeliverySlipPhotos)}
                />
                <button
                  type="button"
                  onClick={() => slipCameraRef.current?.click()}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" /> 촬영
                </button>
                <button
                  type="button"
                  onClick={() => slipFileRef.current?.click()}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" /> 파일
                </button>
              </div>
            </div>
            {deliverySlipPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {deliverySlipPhotos.map((p) => (
                  <div key={p.id} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                    <img src={p.dataUrl} alt="Slip" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDeliverySlipPhotos((prev) => prev.filter((item) => item.id !== p.id))}
                      className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl opacity-80 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 수입검사 실측 및 성적서 영역 (FULL 모드일 때만 표시) */}
          {modalMode === "FULL" ? (
            <>
              {/* 2-A. 검사항목 실측 테이블 */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>2. 수입검사 규격 대조 및 물성 실측 (샘플링)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomCheck}
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>검사항목 추가</span>
                  </button>
                </div>

                {/* 검사항목 테이블 */}
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-800 font-bold text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2.5 w-36">검사항목</th>
                        <th className="py-1.5 px-2.5 w-32">기준 규격</th>
                        <th className="py-1.5 px-2.5 w-36">실측값 (측정치)</th>
                        <th className="py-1.5 px-2.5 w-20 text-center">판정</th>
                        <th className="py-1.5 px-2.5">비고 / 측정비고</th>
                        <th className="py-1.5 px-1.5 w-8 text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-[11px]">
                      {inspectionChecks.map((chk, idx) => (
                        <tr key={chk.id || idx} className="hover:bg-slate-900/50">
                          {/* 항목명 */}
                          <td className="py-1.5 px-2.5 font-bold text-white">
                            <input
                              type="text"
                              value={chk.name}
                              onChange={(e) => handleCheckValueChange(idx, "name", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-cyan-500 focus:ring-0 p-0 text-white font-bold"
                            />
                          </td>

                          {/* 기준 규격 */}
                          <td className="py-1.5 px-2.5 text-slate-300">
                            <input
                              type="text"
                              value={chk.spec}
                              onChange={(e) => handleCheckValueChange(idx, "spec", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-cyan-500 focus:ring-0 p-0 text-slate-300"
                            />
                          </td>

                          {/* 실측치 입력 */}
                          <td className="py-1.5 px-2.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder={chk.type === "NUMERIC" ? "실측수치" : "양호/일치"}
                                value={chk.measured || ""}
                                onChange={(e) => handleCheckValueChange(idx, "measured", e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-bold focus:ring-1 focus:ring-cyan-500"
                              />
                              {chk.unit && (
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {chk.unit}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 판정 토글 */}
                          <td className="py-1.5 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCheckResult(idx)}
                              className={`px-2 py-0.5 rounded font-black text-[10px] transition ${
                                chk.result === "PASS"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-600"
                                  : "bg-rose-950 text-rose-400 border border-rose-600"
                              }`}
                            >
                              {chk.result === "PASS" ? "합격" : "불합격"}
                            </button>
                          </td>

                          {/* 비고 */}
                          <td className="py-1.5 px-2.5">
                            <input
                              type="text"
                              placeholder="특기사항 입력"
                              value={chk.note || ""}
                              onChange={(e) => handleCheckValueChange(idx, "note", e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-cyan-500 focus:ring-0 p-0 text-slate-300 placeholder:text-slate-600"
                            />
                          </td>

                          {/* 삭제 */}
                          <td className="py-1.5 px-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCheck(idx)}
                              className="text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2-B. 성적서(M/Sheet) & 외관 사진 촬영 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* M/Sheet 사진 */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span>M/Sheet(원재료 성적서) 사진 촬영</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        ref={mSheetCameraRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, setMSheetPhotos)}
                      />
                      <input
                        type="file"
                        ref={mSheetFileRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, setMSheetPhotos)}
                      />
                      <button
                        type="button"
                        onClick={() => mSheetCameraRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-blue-950 border border-blue-800 text-[10px] font-bold text-blue-300 hover:bg-blue-900"
                      >
                        <Camera className="w-3 h-3" /> 촬영
                      </button>
                      <button
                        type="button"
                        onClick={() => mSheetFileRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                      >
                        <Upload className="w-3 h-3" /> 파일
                      </button>
                    </div>
                  </div>
                  {mSheetPhotos.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      첨부된 성적서 사진이 없습니다. (촬영 또는 파일 첨부)
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {mSheetPhotos.map((p) => (
                        <div key={p.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-blue-500/40">
                          <img src={p.dataUrl} alt="M/Sheet" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setMSheetPhotos((prev) => prev.filter((item) => item.id !== p.id))}
                            className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl opacity-80 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 결함/실측 사진 */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>실측 및 결함 사진 첨부</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        ref={defectCameraRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, setDefectPhotos)}
                      />
                      <input
                        type="file"
                        ref={defectFileRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, setDefectPhotos)}
                      />
                      <button
                        type="button"
                        onClick={() => defectCameraRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950 border border-rose-800 text-[10px] font-bold text-rose-300 hover:bg-rose-900"
                      >
                        <Camera className="w-3 h-3" /> 촬영
                      </button>
                      <button
                        type="button"
                        onClick={() => defectFileRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                      >
                        <Upload className="w-3 h-3" /> 파일
                      </button>
                    </div>
                  </div>
                  {defectPhotos.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      첨부된 결함/실측 사진이 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {defectPhotos.map((p) => (
                        <div key={p.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-rose-500/40">
                          <img src={p.dataUrl} alt="Defect" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setDefectPhotos((prev) => prev.filter((item) => item.id !== p.id))}
                            className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl opacity-80 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2-C. 종합 판정 및 4M 자동연동 */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="text-xs font-black text-cyan-400 flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    3. 수입검사 종합 판정 & 입고 상태 결정
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (불합격 시 4M 대장 자동 이관)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetOverallResult("PASS")}
                    className={`py-2 px-3 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                      overallResult === "PASS"
                        ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>합격 ➔ 정상 입고</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetOverallResult("REJECT")}
                    className={`py-2 px-3 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                      overallResult === "REJECT"
                        ? "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>불합격 ➔ 반품 격리 (4M연동)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetOverallResult("CONDITIONAL")}
                    className={`py-2 px-3 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                      overallResult === "CONDITIONAL"
                        ? "bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>조건부 합격 (특채)</span>
                  </button>
                </div>

                {isRejected && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/80 via-red-900/60 to-rose-950/80 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-black text-rose-300">
                        🛡️ [4M 실시간 대장 자동 등록 프로세스 가동]
                      </div>
                      <div className="text-[11px] text-rose-200/90 leading-relaxed">
                        본 건은 저장 즉시 <strong className="text-white underline">전사 4M 대장(Material 원자재 부적합)</strong>으로 자동 이관되어 입고불량으로 격리 처리됩니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* RECEIVE_ONLY 모드 안내 배너 */
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-black text-amber-300">
                  📋 [원부자재 입고만 먼저 등록합니다]
                </div>
                <div className="text-[11px] text-amber-200/90 leading-relaxed">
                  거래명세서와 실수량을 확인하여 입고대장에 <strong>'검사대기'</strong> 상태로 등록됩니다. 이후 품질팀이 목록에서 즉시 수입검사 실측을 진행할 수 있습니다.
                </div>
              </div>
            </div>
          )}

          {/* 종합 특기사항 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              입고 및 검사 특기사항 / 비고
            </label>
            <textarea
              rows={2}
              placeholder="예: 입고 수량 및 송장 대조 완료. 성적서 합격 확인 후 삼랑진 원재료창고 A-2랙 적치함."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingPhotos}
              className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg transition flex items-center gap-1.5 ${
                modalMode === "RECEIVE_ONLY"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950"
                  : isRejected
                  ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/50"
                  : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-900/50"
              }`}
            >
              {isSaving
                ? "저장 중..."
                : modalMode === "RECEIVE_ONLY"
                ? "입고 등록 (검사대기)"
                : isRejected
                ? "저장 & 4M 대장 자동등록"
                : "입고 및 검사 완료 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
