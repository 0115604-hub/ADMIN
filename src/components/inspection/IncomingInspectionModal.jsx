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
  Hash
} from "lucide-react";
import { INSPECTION_CATEGORIES } from "../../services/incomingInspectionService";
import { compressImage } from "../../utils/imageCompressor";

export const IncomingInspectionModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  currentProfile = null
}) => {
  const [category, setCategory] = useState("RAW_MATERIAL");
  const [itemType, setItemType] = useState("FMB");
  const [itemName, setItemName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [plant, setPlant] = useState("삼랑진공장");
  const [inspector, setInspector] = useState("이창엽");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [overallResult, setOverallResult] = useState("PASS");
  const [remarks, setRemarks] = useState("");
  const [inspectionChecks, setInspectionChecks] = useState([]);
  const [mSheetPhotos, setMSheetPhotos] = useState([]);
  const [defectPhotos, setDefectPhotos] = useState([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mSheetCameraRef = useRef(null);
  const mSheetFileRef = useRef(null);
  const defectCameraRef = useRef(null);
  const defectFileRef = useRef(null);

  // 초기화 또는 수정 데이터 바인딩
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCategory(initialData.category || "RAW_MATERIAL");
      setItemType(initialData.itemType || "");
      setItemName(initialData.itemName || "");
      setSupplier(initialData.supplier || "");
      setLotNo(initialData.lotNo || "");
      setQuantity(initialData.quantity || "");
      setPlant(initialData.plant || "삼랑진공장");
      setInspector(initialData.inspector || currentProfile?.name || "이창엽");
      setDate(initialData.date || new Date().toISOString().slice(0, 10));
      setTime(initialData.time || "09:00");
      setOverallResult(initialData.overallResult || "PASS");
      setRemarks(initialData.remarks || "");
      setInspectionChecks(
        Array.isArray(initialData.inspectionChecks) && initialData.inspectionChecks.length > 0
          ? JSON.parse(JSON.stringify(initialData.inspectionChecks))
          : JSON.parse(JSON.stringify(INSPECTION_CATEGORIES[initialData.category || "RAW_MATERIAL"].defaultChecks))
      );
      setMSheetPhotos(initialData.mSheetPhotos || []);
      setDefectPhotos(initialData.defectPhotos || []);
    } else {
      // 신규 등록 기본값
      const defaultCat = "RAW_MATERIAL";
      setCategory(defaultCat);
      const catConfig = INSPECTION_CATEGORIES[defaultCat];
      setItemType(catConfig.items[0]?.id || "");
      setItemName("");
      setSupplier("");
      setLotNo(`LOT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-01`);
      setQuantity("");
      setPlant(currentProfile?.plant || "삼랑진공장");
      setInspector(currentProfile?.name || "이창엽");
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setOverallResult("PASS");
      setRemarks("");
      setInspectionChecks(JSON.parse(JSON.stringify(catConfig.defaultChecks)));
      setMSheetPhotos([]);
      setDefectPhotos([]);
    }
  }, [isOpen, initialData, currentProfile]);

  // 카테고리 변경 시 기본 체크항목 및 아이템타입 자동 전환
  const handleCategoryChange = (newCat) => {
    if (newCat === category) return;
    setCategory(newCat);
    const catConfig = INSPECTION_CATEGORIES[newCat];
    setItemType(catConfig.items[0]?.id || "");
    setInspectionChecks(JSON.parse(JSON.stringify(catConfig.defaultChecks)));
    setOverallResult("PASS");
  };

  // 실측값 변경 시 자동 판정 계산
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

      // 하나라도 FAIL이 있으면 종합판정을 불합격(REJECT)으로 자동 제안
      const hasAnyFail = next.some((c) => c.result === "FAIL");
      if (hasAnyFail && overallResult === "PASS") {
        setOverallResult("REJECT");
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

  // 사진 압축 및 첨부 처리
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

  // 사진 삭제
  const handleRemovePhoto = (photoId, targetSetter) => {
    targetSetter((prev) => prev.filter((p) => p.id !== photoId));
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
      const record = {
        id: initialData?.id || `insp_${Date.now()}`,
        date,
        time,
        category,
        itemType,
        itemName: itemName.trim(),
        supplier: supplier.trim(),
        lotNo: lotNo.trim(),
        quantity: quantity.trim(),
        plant,
        inspector: inspector.trim(),
        overallResult,
        remarks: remarks.trim(),
        inspectionChecks,
        mSheetPhotos,
        defectPhotos,
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
  const isRejected = overallResult === "REJECT" || overallResult === "CONDITIONAL";

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-600/30 border border-cyan-400/40 text-cyan-300">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                {initialData ? "수입검사 성적서 수정" : "신규 원부자재 수입검사 등록"}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  {currentCatConfig.badge}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {currentCatConfig.desc}
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

          {/* 기본 정보 입력 그리드 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="text-xs font-black text-cyan-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>1. 입고 및 기본 식별 정보</span>
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

              {/* 입고 LOT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 LOT 번호
                </label>
                <input
                  type="text"
                  placeholder="예: 261028-01"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* 입고 수량 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  입고 수량 (단위 포함)
                </label>
                <input
                  type="text"
                  placeholder="예: 1,500 kg, 20,000 EA"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
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

              {/* 검사 일자 & 검사원 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  검사자
                </label>
                <input
                  type="text"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 3. 주요 물성 및 스펙 실측 검사 테이블 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>2. 검사 항목 및 주요 물성 실측값 (샘플링)</span>
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

            {/* 검사항목 테이블 (울트라고밀도 스타일) */}
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

          {/* 4. 사진 첨부 영역 (M/Sheet 성적서 & 외관/결함 사진) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 4-A. M/Sheet 성적서 사진 */}
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
                    <Camera className="w-3 h-3" />
                    촬영
                  </button>
                  <button
                    type="button"
                    onClick={() => mSheetFileRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                  >
                    <Upload className="w-3 h-3" />
                    파일
                  </button>
                </div>
              </div>

              {/* 썸네일 그리드 */}
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
                        onClick={() => handleRemovePhoto(p.id, setMSheetPhotos)}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl opacity-80 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4-B. 실측 / 결함 사진 */}
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
                    <Camera className="w-3 h-3" />
                    촬영
                  </button>
                  <button
                    type="button"
                    onClick={() => defectFileRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                  >
                    <Upload className="w-3 h-3" />
                    파일
                  </button>
                </div>
              </div>

              {/* 썸네일 그리드 */}
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
                        onClick={() => handleRemovePhoto(p.id, setDefectPhotos)}
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

          {/* 5. 최종 종합 판정 및 4M 자동연동 알림 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="text-xs font-black text-cyan-400 flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                3. 종합 판정 및 검사의견
              </span>
              <span className="text-[11px] text-slate-400">
                (불합격 시 4M 대장 자동 이관)
              </span>
            </div>

            {/* 판정 라디오 버튼 3종 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOverallResult("PASS")}
                className={`py-2 px-3 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  overallResult === "PASS"
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>합격 (PASS)</span>
              </button>

              <button
                type="button"
                onClick={() => setOverallResult("REJECT")}
                className={`py-2 px-3 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  overallResult === "REJECT"
                    ? "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>불합격 (REJECT)</span>
              </button>

              <button
                type="button"
                onClick={() => setOverallResult("CONDITIONAL")}
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

            {/* 🚨 4M 자동등록 경보 배너 (불합격/조건부합격 시 표시) */}
            {isRejected && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/80 via-red-900/60 to-rose-950/80 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="font-black text-rose-300">
                    🛡️ [4M 실시간 대장 자동 등록 프로세스 가동]
                  </div>
                  <div className="text-[11px] text-rose-200/90 leading-relaxed">
                    본 건은 저장 즉시 <strong className="text-white underline">전사 4M 대장(Material 원자재 부적합)</strong>으로 자동 이관되어 생산/품질 관제 대시보드에 즉시 공유됩니다.
                  </div>
                </div>
              </div>
            )}

            {/* 검사원 종합 의견 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                검사원 종합 의견 / 조치사항
              </label>
              <textarea
                rows={2}
                placeholder="예: M/Sheet 대조 결과 경도 및 비중 규격 일치하여 합격 처리함. (또는 버 발생으로 협력사 반품 요청)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-cyan-500"
              />
            </div>
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
                isRejected
                  ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/50"
                  : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-900/50"
              }`}
            >
              {isSaving ? "저장 및 4M 연동 중..." : isRejected ? "저장 & 4M 대장 자동등록" : "검사 성적서 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
