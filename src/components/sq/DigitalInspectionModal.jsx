import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  Gauge,
  Sparkles,
  Save,
  Clock,
  User,
  ShieldCheck,
  Layers,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  saveDigitalInspection,
  saveTpmInspection,
  INSPECTION_SPEC_DEFAULTS
} from "../../services/digitalInspectionService";

export const DigitalInspectionModal = ({ isOpen, onClose, onOpenQualityIssueModal }) => {
  const { currentProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("first_middle_last"); // 'first_middle_last' | 'tpm'

  // Form State: First/Middle/Last Article Inspection
  const [inspForm, setInspForm] = useState({
    line: "압출 1호기",
    partName: "JA PE G/RUN",
    timing: "초물", // 초물 | 중물 | 종물
    dimensionVal: "18.5",
    coatingVal: "25.0",
    cutLengthVal: "850.0",
    visualState: "OK", // OK | NG
    memo: ""
  });

  // Form State: TPM Daily Inspection
  const [tpmForm, setTpmForm] = useState({
    machineName: "압출 1호기 (메인)",
    shift: "주간",
    check1_tempPressure: true, // 가류조/온조기 온도 및 압력 정상
    check2_chillerCooling: true, // 칠러 냉각수 순환 및 온도 정상
    check3_motorNoise: true, // 모터/스크류 이상소음 및 발열 없음
    check4_safetyEmergency: true, // 안전센서/비상정지 정상 작동
    check5_moldClean: true, // 금형/다이스 청소 및 이물질 없음
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  if (!isOpen) return null;

  const currentSpecs = INSPECTION_SPEC_DEFAULTS[inspForm.partName] || INSPECTION_SPEC_DEFAULTS["JA PE G/RUN"];

  // Real-time Poka-Yoke evaluation for measurements
  const dimNum = parseFloat(inspForm.dimensionVal);
  const isDimOk = !isNaN(dimNum) && dimNum >= currentSpecs.dimension.target - currentSpecs.dimension.tolMinus && dimNum <= currentSpecs.dimension.target + currentSpecs.dimension.tolPlus;

  const coatNum = parseFloat(inspForm.coatingVal);
  const isCoatOk = !isNaN(coatNum) && coatNum >= currentSpecs.coatingThickness.target - currentSpecs.coatingThickness.tolMinus && coatNum <= currentSpecs.coatingThickness.target + currentSpecs.coatingThickness.tolPlus;

  const lenNum = parseFloat(inspForm.cutLengthVal);
  const isLenOk = !isNaN(lenNum) && lenNum >= currentSpecs.cutLength.target - currentSpecs.cutLength.tolMinus && lenNum <= currentSpecs.cutLength.target + currentSpecs.cutLength.tolPlus;

  const isVisualOk = inspForm.visualState === "OK";
  const isOverallPass = isDimOk && isCoatOk && isLenOk && isVisualOk;

  // Handle Inspection Submit
  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const inspectorName = currentProfile?.name || "사원";
      const inspectorTitle = currentProfile?.title || "사원";

      const payload = {
        ...inspForm,
        inspector: `${inspectorName} ${inspectorTitle}`,
        isPass: isOverallPass,
        date: new Date().toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };

      await saveDigitalInspection(payload);
      setToastMsg(`✅ ${inspForm.timing} 검사가 정상 등록되었습니다.`);
      setTimeout(() => {
        setToastMsg("");
        onClose();
      }, 1000);
    } catch (err) {
      alert("검사 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle TPM Submit
  const handleTpmSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const inspectorName = currentProfile?.name || "사원";
      const inspectorTitle = currentProfile?.title || "사원";

      const allChecksPass =
        tpmForm.check1_tempPressure &&
        tpmForm.check2_chillerCooling &&
        tpmForm.check3_motorNoise &&
        tpmForm.check4_safetyEmergency &&
        tpmForm.check5_moldClean;

      const payload = {
        ...tpmForm,
        inspector: `${inspectorName} ${inspectorTitle}`,
        allPass: allChecksPass,
        date: new Date().toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };

      await saveTpmInspection(payload);
      setToastMsg("✅ TPM 일상점검이 저장되었습니다.");
      setTimeout(() => {
        setToastMsg("");
        onClose();
      }, 1000);
    } catch (err) {
      alert("TPM 점검 저장 오류: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // One-click TPM All OK
  const handleTpmAllOk = () => {
    setTpmForm((prev) => ({
      ...prev,
      check1_tempPressure: true,
      check2_chillerCooling: true,
      check3_motorNoise: true,
      check4_safetyEmergency: true,
      check5_moldClean: true
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ClipboardCheck className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">현장 모바일 간편 점검</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-900">
                  SQ 디지털 Poka-Yoke
                </span>
              </div>
              <p className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5" />
                <span>점검 사원: <strong>{currentProfile?.name || "사원"} {currentProfile?.title || "사원"}</strong></span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString("ko-KR")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveSubTab("first_middle_last")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === "first_middle_last"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-white/60"
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>📏 초·중·종물 품질 검사</span>
          </button>
          <button
            onClick={() => setActiveSubTab("tpm")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === "tpm"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-white/60"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>⚙️ TPM 설비/금형 일상점검</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {toastMsg && (
            <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-bounce">
              {toastMsg}
            </div>
          )}

          {/* TAB 1: 초·중·종물 검사 */}
          {activeSubTab === "first_middle_last" && (
            <form onSubmit={handleInspectionSubmit} className="space-y-4">
              {/* Timing & Target Selector */}
              <div className="grid grid-cols-3 gap-2">
                {["초물", "중물", "종물"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInspForm({ ...inspForm, timing: t })}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      inspForm.timing === t
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {t === "초물" ? "🌅 초물 (시업)" : t === "중물" ? "☀️ 중물 (주기)" : "🌙 종물 (종업)"}
                  </button>
                ))}
              </div>

              {/* Line & Part Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    점검 공정 / 라인
                  </label>
                  <select
                    value={inspForm.line}
                    onChange={(e) => setInspForm({ ...inspForm, line: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="압출 1호기">압출 1호기</option>
                    <option value="압출 2호기">압출 2호기</option>
                    <option value="압출 3호기">압출 3호기</option>
                    <option value="압출 4호기">압출 4호기</option>
                    <option value="후가공 1라인">후가공 1라인</option>
                    <option value="조인트 성형라인">조인트 성형라인</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    차종 / 품목
                  </label>
                  <select
                    value={inspForm.partName}
                    onChange={(e) => setInspForm({ ...inspForm, partName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="JA PE G/RUN">JA PE G/RUN (메인 양산)</option>
                    <option value="기타 일반 압출">기타 일반 압출</option>
                  </select>
                </div>
              </div>

              {/* Measurements Input Cards */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>실측 데이터 입력 (Poka-Yoke 자동 검증)</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    기준 규격 범위 내 입력 필수
                  </span>
                </div>

                {/* 1. 단면 치수 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  isDimOk ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700" : "bg-rose-50 dark:bg-rose-950/40 border-rose-400"
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-blue-600" />
                      1. 단면 치수 (폭/높이)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      기준: {currentSpecs.dimension.target} ±{currentSpecs.dimension.tolPlus} mm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={inspForm.dimensionVal}
                      onChange={(e) => setInspForm({ ...inspForm, dimensionVal: e.target.value })}
                      placeholder="18.5"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-800 dark:text-white"
                      required
                    />
                    <span className="text-xs font-bold text-slate-400">mm</span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-black ${
                      isDimOk ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {isDimOk ? "합격 (OK)" : "이탈 (NG)"}
                    </span>
                  </div>
                </div>

                {/* 2. 코팅 도포 두께 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  isCoatOk ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700" : "bg-rose-50 dark:bg-rose-950/40 border-rose-400"
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      2. 코팅 도포 두께
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      기준: {currentSpecs.coatingThickness.target} ±{currentSpecs.coatingThickness.tolPlus} μm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={inspForm.coatingVal}
                      onChange={(e) => setInspForm({ ...inspForm, coatingVal: e.target.value })}
                      placeholder="25.0"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-800 dark:text-white"
                      required
                    />
                    <span className="text-xs font-bold text-slate-400">μm</span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-black ${
                      isCoatOk ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {isCoatOk ? "합격 (OK)" : "이탈 (NG)"}
                    </span>
                  </div>
                </div>

                {/* 3. 절단 길이 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  isLenOk ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700" : "bg-rose-50 dark:bg-rose-950/40 border-rose-400"
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                      3. 제품 절단 길이
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      기준: {currentSpecs.cutLength.target} ±{currentSpecs.cutLength.tolPlus} mm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={inspForm.cutLengthVal}
                      onChange={(e) => setInspForm({ ...inspForm, cutLengthVal: e.target.value })}
                      placeholder="850.0"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-800 dark:text-white"
                      required
                    />
                    <span className="text-xs font-bold text-slate-400">mm</span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-black ${
                      isLenOk ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {isLenOk ? "합격 (OK)" : "이탈 (NG)"}
                    </span>
                  </div>
                </div>

                {/* 4. 외관 상태 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    4. 외관 한도견본 대조 (기포/스크래치/미성형)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInspForm({ ...inspForm, visualState: "OK" })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        isVisualOk
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      🟢 양호
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspForm({ ...inspForm, visualState: "NG" })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        !isVisualOk
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      🔴 불량
                    </button>
                  </div>
                </div>
              </div>

              {/* Overall Verdict Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isOverallPass
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/40 text-rose-800 dark:text-rose-200"
              }`}>
                <div className="flex items-center gap-2">
                  {isOverallPass ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                  <div>
                    <div className="text-xs font-black">
                      {isOverallPass ? "✅ 최종 판정: 전 항목 합격 (공정 진행 가능)" : "🚨 최종 판정: 규격 이탈 (후공정 투입 금지)"}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {isOverallPass ? "SQ 검사기준서 충족" : "불합격 항목을 확인하고 현장 조치를 취하세요."}
                    </div>
                  </div>
                </div>
                {!isOverallPass && onOpenQualityIssueModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQualityIssueModal();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black shadow-md cursor-pointer transition-all"
                  >
                    품질이슈 즉시 전파 ➔
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{inspForm.timing} 검사 결과 전자 서명 및 저장</span>
              </button>
            </form>
          )}

          {/* TAB 2: TPM 설비/금형 일상점검 */}
          {activeSubTab === "tpm" && (
            <form onSubmit={handleTpmSubmit} className="space-y-4">
              {/* Quick Actions & Machine */}
              <div className="flex items-center justify-between gap-2">
                <select
                  value={tpmForm.machineName}
                  onChange={(e) => setTpmForm({ ...tpmForm, machineName: e.target.value })}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="압출 1호기 (메인)">압출 1호기 (메인)</option>
                  <option value="압출 2호기">압출 2호기</option>
                  <option value="압출 3호기">압출 3호기</option>
                  <option value="압출 4호기">압출 4호기</option>
                  <option value="조인트 사출 성형기">조인트 사출 성형기</option>
                  <option value="고속 자동 절단기">고속 자동 절단기</option>
                </select>

                <button
                  type="button"
                  onClick={handleTpmAllOk}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>전 항목 일괄 정상(OK)</span>
                </button>
              </div>

              {/* 5-Key TPM Check Items */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  설비·금형 시업 전 5대 필수 점검
                </div>

                {/* Check 1 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      1. 가류조/온조기 온도 및 압력 지침계
                    </div>
                    <div className="text-[10px] text-slate-500">
                      디지털 설정값과 지침계 바늘 오차 ±5℃ 이내 확인
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTpmForm({ ...tpmForm, check1_tempPressure: !tpmForm.check1_tempPressure })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      tpmForm.check1_tempPressure
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {tpmForm.check1_tempPressure ? "정상" : "이상"}
                  </button>
                </div>

                {/* Check 2 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      2. 칠러 냉각수 순환 및 온도 센서
                    </div>
                    <div className="text-[10px] text-slate-500">
                      냉각수 유량 원활, 누수 없음, 칠러 온도 15±2℃ 유지
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTpmForm({ ...tpmForm, check2_chillerCooling: !tpmForm.check2_chillerCooling })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      tpmForm.check2_chillerCooling
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {tpmForm.check2_chillerCooling ? "정상" : "이상"}
                  </button>
                </div>

                {/* Check 3 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      3. 구동 모터/스크류 소음 및 발열
                    </div>
                    <div className="text-[10px] text-slate-500">
                      비정상 마찰음, 이상 진동, 모터 과열 없음
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTpmForm({ ...tpmForm, check3_motorNoise: !tpmForm.check3_motorNoise })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      tpmForm.check3_motorNoise
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {tpmForm.check3_motorNoise ? "정상" : "이상"}
                  </button>
                </div>

                {/* Check 4 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      4. 안전 인터락 & 비상정지(EMO)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      안전 커버 개방 시 즉시 정지 및 비상정지 스위치 복귀 상태
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTpmForm({ ...tpmForm, check4_safetyEmergency: !tpmForm.check4_safetyEmergency })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      tpmForm.check4_safetyEmergency
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {tpmForm.check4_safetyEmergency ? "정상" : "이상"}
                  </button>
                </div>

                {/* Check 5 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      5. 금형/다이스 청소 및 이물질 부착
                    </div>
                    <div className="text-[10px] text-slate-500">
                      다이스 토출부 탄화물 제거, 금형 파팅라인 청결 상태
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTpmForm({ ...tpmForm, check5_moldClean: !tpmForm.check5_moldClean })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      tpmForm.check5_moldClean
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {tpmForm.check5_moldClean ? "정상" : "이상"}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  설비 특이사항 및 조치 메모 (선택)
                </label>
                <input
                  type="text"
                  value={tpmForm.notes}
                  onChange={(e) => setTpmForm({ ...tpmForm, notes: e.target.value })}
                  placeholder="예: 2번 온조기 호스 연결부 미세 누수 점검 완료"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-sm font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Wrench className="w-4 h-4" />
                <span>TPM 일상점검 완료 전자 승인</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
