import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  Printer,
  Sparkles,
  Star,
  Award,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Factory,
  User,
  Shield,
  Layers,
  FileCheck,
  Tag,
  Briefcase,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Search,
  Check,
  RefreshCw
} from "lucide-react";
import {
  STANDARD_PROCESS_LIST,
  COMPANY_LIST,
  DEPARTMENTS_LIST,
  POSITIONS_LIST,
  SKILL_LEVEL_META,
  INSPECTOR_GRADES,
  NATIONALITY_LIST,
  getNationalityMeta,
  getSkillMeta,
  getInspectorGradeMeta,
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate,
  getWorkerPersonnelCard,
  normalizeStandardCompany,
  normalizeStandardDept,
  normalizeStandardPosition,
  compressImageToBase64
} from "../services/personnelCardService.js";
import { COMPANY_THEMES, cleanCompanyName } from "../services/overtimeSmartService.js";
import { LanguageSelectBadge } from "./common/LanguageSelectBadge.jsx";

export default function PersonnelCardModal({
  isOpen,
  onClose,
  worker,
  workerIndex,
  onSave
}) {
  if (!isOpen || !worker) return null;

  // Initial Card State
  const initialCard = useMemo(() => {
    return getWorkerPersonnelCard(worker, workerIndex);
  }, [worker, workerIndex]);

  const [formData, setFormData] = useState(initialCard);
  const [hoverStar, setHoverStar] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState("form"); // "form" or "preview"

  // 📷 Camera Modal & Stream State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);

  // Sync state if worker changes
  useEffect(() => {
    setFormData(getWorkerPersonnelCard(worker, workerIndex));
  }, [worker, workerIndex]);

  // Clean up camera stream on unmount or when camera modal closes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Stop WebCam Stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start WebCam Stream
  const handleStartCamera = async () => {
    setCameraError("");
    setIsCameraOpen(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("브라우저에서 카메라를 지원하지 않습니다. 모바일 카메라나 파일 선택을 이용해주세요.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access error:", err);
      setCameraError(err.message || "카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  // Capture Snapshot from WebCam
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const size = Math.min(video.videoWidth, video.videoHeight) || 360;
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");

      // Center Crop Square
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 360, 360);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      handleChange("photoUrl", dataUrl);
      handleCloseCamera();
    } catch (err) {
      console.error("Capture error:", err);
      alert("사진 캡처 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Close Camera
  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError("");
  };

  // File Upload Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageToBase64(file, 360, 360, 0.85);
      handleChange("photoUrl", compressedDataUrl);
    } catch (err) {
      console.error("Image load error:", err);
      alert("이미지 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Handle Input Changes
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // 입사일 변경 시 근속기간 및 공정년차 동시 자동 계산
      if (field === "joinDate") {
        next.tenure = calculateTenureFromJoinDate(value);
        next.processYear = calculateProcessYearFromJoinDate(value);
      }
      // 숙련등급 변경 시 등급 라벨 자동 업데이트
      if (field === "skillLevel") {
        next.skillGrade = getSkillMeta(value).grade;
      }
      // 주공정 변경 시 지원 공정에서 해당 주공정 제거
      if (field === "mainProcess") {
        next.subProcesses = (prev.subProcesses || []).filter((p) => p !== value);
        // 검사 공정 선택 시 기본 검사원 등급 자동 부여
        if (value === "검사" && !prev.inspectorGrade) {
          next.inspectorGrade = "A등급 (정검사원)";
        }
      }
      return next;
    });
  };

  // Toggle Sub-Process Tag (다중 선택 지원)
  const handleToggleSubProcess = (processName) => {
    setFormData((prev) => {
      const current = prev.subProcesses || [];
      const exists = current.includes(processName);
      const next = exists
        ? current.filter((p) => p !== processName)
        : [...current, processName];
      return {
        ...prev,
        subProcesses: next,
        isMultiSkill: next.length > 0 ? true : prev.isMultiSkill
      };
    });
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("인사카드 저장 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Company Theme & Skill Meta & Inspector Meta
  const companyTheme = COMPANY_THEMES[cleanCompanyName(formData.company)] || COMPANY_THEMES["오륙"];
  const currentSkillMeta = getSkillMeta(formData.skillLevel);
  const isInspectionSelected = formData.mainProcess === "검사" || (formData.subProcesses || []).includes("검사");
  const currentInspectorMeta = getInspectorGradeMeta(formData.inspectorGrade);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border-2 border-purple-500 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] cursor-default"
      >
        {/* ========================================================================= */}
        {/* 1. Modal Top Bar */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 sm:p-2 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40">
              <Award className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h2 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>제조현장 인사카드 작성 및 관리</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {formData.name} ({formData.company})
                </span>
              </h2>
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex sm:hidden items-center bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
            <button
              onClick={() => setActiveMobileView("form")}
              className={`px-2 py-1 rounded-md ${activeMobileView === "form" ? "bg-purple-600 text-white" : "text-slate-400"}`}
            >
              작성
            </button>
            <button
              onClick={() => setActiveMobileView("preview")}
              className={`px-2 py-1 rounded-md ${activeMobileView === "preview" ? "bg-purple-600 text-white" : "text-slate-400"}`}
            >
              미리보기
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. Modal Body: 2-Column Grid (Left: Edit Form, Right: Live Personnel Card) */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 text-xs">
          {/* 📝 LEFT COLUMN: Interactive Edit Form (7 cols) */}
          <div className={`lg:col-span-7 space-y-4 ${activeMobileView === "preview" ? "hidden sm:block" : "block"}`}>
            
            {/* Section 1: 사진 촬영/선택 & 기본 인적사항 (소속, 부서: 생산팀/생산관리팀/관리팀, 직위: 이사/책임/선임/사원) */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-purple-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>증명사진 및 기본 인적사항</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">사번: {formData.empNo}</span>
              </div>

              {/* ⭐ 증명사진 촬영 또는 파일 선택 컨트롤 영역 */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                {/* Photo Thumbnail */}
                <div className="relative group shrink-0">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt={formData.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-400 shadow-md shadow-purple-950/60"
                    />
                  ) : (
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-7 h-7 text-slate-500 mb-0.5" />
                      <span className="text-[9.5px] font-bold text-slate-500">사진 미등록</span>
                    </div>
                  )}

                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange("photoUrl", "")}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-md cursor-pointer transition-all active:scale-90"
                      title="사진 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Photo Action Buttons */}
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-white">근로자 프로필 사진</span>
                    <span className="text-[10.5px] text-slate-400">(카메라 촬영 또는 파일 선택)</span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    {/* 📷 촬영 버튼 */}
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>카메라 촬영</span>
                    </button>

                    {/* 📁 파일 선택 버튼 */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>파일 선택</span>
                    </button>

                    {/* Hidden File Inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={mobileCameraInputRef}
                      accept="image/*"
                      capture="user"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange("photoUrl", "")}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>삭제</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    인사카드에 인쇄 및 표시될 증명 사진을 등록합니다 (자동 압축 최적화).
                  </p>
                </div>
              </div>

              {/* 기본 정보 입력 그리드 (성명, 사번, 소속업체, 부서: 3대 부서, 직위: 4대 직위) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">성명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">사번 (Emp No)</label>
                  <input
                    type="text"
                    value={formData.empNo}
                    onChange={(e) => handleChange("empNo", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-mono font-bold"
                  />
                </div>

                {/* 소속 업체 선택: 주)오륙, 주)조영, 유성, 한울, 부림텍 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">소속 업체 (5대 업체)</label>
                  <select
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
                  >
                    {COMPANY_LIST.map((compName) => (
                      <option key={compName} value={compName} className="bg-slate-900 text-white font-bold">{compName}</option>
                    ))}
                  </select>
                </div>

                {/* 부서 선택: 생산팀 / 압출관리팀 / 가공관리팀 / 관리팀 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">부서 (4대 부서)</label>
                  <select
                    value={formData.dept}
                    onChange={(e) => handleChange("dept", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
                  >
                    {DEPARTMENTS_LIST.map((deptName) => (
                      <option key={deptName} value={deptName} className="bg-slate-900 text-white font-bold">{deptName}</option>
                    ))}
                  </select>
                </div>

                {/* 직위 선택: 이사 / 책임 / 선임 / 사원 */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">직위/직급 (4대 직위)</label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {POSITIONS_LIST.map((posName) => (
                      <option key={posName} value={posName}>{posName}</option>
                    ))}
                  </select>
                </div>

                {/* 🌍 국적 선택 (필리핀, 베트남, 태국, 스리랑카, 우즈벡, 인도네시아, 대한민국, 기타 등) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block pb-1">국적 (Nationality)</label>
                  <div className="space-y-1">
                    <select
                      value={formData.nationality || "대한민국"}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange("nationality", val);
                        if (val !== "기타") {
                          handleChange("nationalityOther", "");
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
                    >
                      {NATIONALITY_LIST.map((nat) => (
                        <option key={nat.code} value={nat.code}>{nat.label}</option>
                      ))}
                    </select>
                    {formData.nationality === "기타" && (
                      <input
                        type="text"
                        placeholder="국적 직접 입력 (예: 미얀마, 몽골)"
                        value={formData.nationalityOther || ""}
                        onChange={(e) => handleChange("nationalityOther", e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/80 focus:border-cyan-400 text-cyan-300 text-xs font-bold placeholder:text-slate-500 animate-fadeIn"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* 🌐 외국인 근로자 전용 3배 확장형 언어 선택 패널 (한국인 제외, 주석 제거) */}
                {formData.nationality && formData.nationality !== "대한민국" && (
                  <div className="col-span-2 sm:col-span-3 pt-1">
                    <LanguageSelectBadge variant="elongated" showLabel={false} />
                  </div>
                )}
              </div>

              {/* ⭐ 입사일자 입력 시 근속기간 & 공정년차만 자동계산 표시 */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block pb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>입사일자 *</span>
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => handleChange("joinDate", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border-2 border-cyan-500/50 focus:border-cyan-400 text-white text-xs font-bold font-mono shadow-inner"
                    />
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>근속기간 (자동계산)</span>
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-400 pt-0.5">
                      {formData.tenure || calculateTenureFromJoinDate(formData.joinDate)}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      <span>공정년차 (자동계산)</span>
                    </span>
                    <span className="font-mono font-black text-sm text-amber-300 pt-0.5">
                      {formData.processYear || calculateProcessYearFromJoinDate(formData.joinDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: 주 담당 공정 (압출 / 소재준비 / 조인트 / 사상 / 코팅 / 검사) & 숙련등급 별점 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>주 담당 공정 & 숙련등급 평가</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${currentSkillMeta.badgeClass}`}>
                  {currentSkillMeta.grade}
                </span>
              </div>

              {/* 주공정 6가지 (코팅 포함) 선택 버튼 그룹 */}
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <label className="text-[11px] font-bold text-slate-400">
                    주 담당 공정 선택 (6대 표준 공정):
                  </label>
                  <span className="text-[10.5px] text-amber-400 font-bold">
                    현재: {formData.mainProcess}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {STANDARD_PROCESS_LIST.map((proc) => {
                    const isSelected = formData.mainProcess === proc;
                    return (
                      <button
                        key={proc}
                        type="button"
                        onClick={() => handleChange("mainProcess", proc)}
                        className={`py-2 px-1 rounded-xl font-black text-xs transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-102 font-black"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700 font-bold"
                        }`}
                      >
                        {proc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ⭐ 1~5 Star Rating Picker (인터랙티브 별점) */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-black text-slate-200">숙련 등급 별점 선택 (1~5성)</span>
                  <span className="text-[10.5px] text-amber-400 font-bold">
                    ★ 클릭하여 숙련도를 설정하세요
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isFilled = starIdx <= (hoverStar || formData.skillLevel);
                    return (
                      <button
                        key={starIdx}
                        type="button"
                        onMouseEnter={() => setHoverStar(starIdx)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => handleChange("skillLevel", starIdx)}
                        className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-800 transition-transform active:scale-90 cursor-pointer group"
                        title={`Lv.${starIdx} ${SKILL_LEVEL_META[starIdx].grade}`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                              : "text-slate-600 group-hover:text-slate-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <div className="ml-2 pl-3 border-l border-slate-800">
                    <span className="font-mono font-black text-base text-amber-400 block">
                      Lv.{formData.skillLevel}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-bold">
                      {SKILL_LEVEL_META[formData.skillLevel]?.shortGrade}
                    </span>
                  </div>
                </div>

                {/* Level Description */}
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  💡 <strong className="text-slate-300">{currentSkillMeta.grade}:</strong> {currentSkillMeta.desc}
                </div>
              </div>
            </div>

            {/* ⭐ Section 3: 검사 공정 전용 - 검사원 등급 평가 (검사 선택 시에만 표시) */}
            {isInspectionSelected && (
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-900/60">
                  <span className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-400" />
                    <span>🔍 품질 검사원 자격 등급 평가 (검사 공정 전용)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${currentInspectorMeta.badgeClass}`}>
                    {currentInspectorMeta.grade}
                  </span>
                </div>

                {/* Inspector Grade Selector Cards */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    검사원 자격 등급 선택 (S/A/B 등급):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {INSPECTOR_GRADES.map((ig) => {
                      const isSelected = formData.inspectorGrade === ig.grade;
                      return (
                        <div
                          key={ig.grade}
                          onClick={() => handleChange("inspectorGrade", ig.grade)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? `${ig.badgeClass} shadow-md shadow-slate-950/80`
                              : "bg-slate-900/90 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black text-xs ${isSelected ? ig.color : "text-white"}`}>
                              {ig.grade}
                            </span>
                            {isSelected && <Check className={`w-3.5 h-3.5 ${ig.color}`} />}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {ig.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 검사원 취득일자/메모 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block pb-1">검사원 자격 취득/인증일자</label>
                    <input
                      type="date"
                      value={formData.inspectorCertDate || formData.joinDate}
                      onChange={(e) => handleChange("inspectorCertDate", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-800/80 focus:border-emerald-400 text-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-400 block pb-1">검사원 세부 판정 권한</label>
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{currentInspectorMeta.desc.split(",")[0] || "공정 자주검사 및 외관 판정"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: 다기능공 (Multi-Skill) & 지원 공정 다중 선택 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-black text-xs sm:text-sm text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>다기능공 (Multi-Skill) & 지원 공정 다중 선택</span>
                </span>
                {formData.isMultiSkill ? (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center gap-1 shadow-sm animate-pulse">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>⚡ 다기능공 지정됨</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    단일 공정
                  </span>
                )}
              </div>

              {/* Multi-skill toggle switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="font-black text-xs text-white block">다기능공 (Multi-Skilled Worker) 지정</span>
                  <span className="text-[10.5px] text-slate-400">주공정({formData.mainProcess}) 외 다른 공정을 지원 가능한 근로자</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("isMultiSkill", !formData.isMultiSkill)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    formData.isMultiSkill ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      formData.isMultiSkill ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* ⭐ 지원 공정 다중 선택 버튼 (압출 / 소재준비 / 조인트 / 사상 / 코팅 / 검사) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    지원 가능 공정 선택 (다중 선택 가능):
                  </label>
                  <span className="text-[10.5px] text-cyan-400 font-bold">
                    {(formData.subProcesses || []).length}개 공정 선택됨
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {STANDARD_PROCESS_LIST.map((proc) => {
                    const isSelected = (formData.subProcesses || []).includes(proc);
                    const isMain = formData.mainProcess === proc;
                    return (
                      <button
                        key={proc}
                        type="button"
                        disabled={isMain}
                        onClick={() => handleToggleSubProcess(proc)}
                        className={`py-2 px-1 rounded-xl font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isMain
                            ? "bg-amber-950/60 text-amber-300 border border-amber-700/60 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-cyan-600 text-white shadow-xs ring-2 ring-cyan-400 font-black scale-102"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"
                        }`}
                      >
                        {isMain ? (
                          <>
                            <span className="text-[9.5px] text-amber-400">★ 주공정</span>
                            <span>{proc}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px]">{isSelected ? "✓ 지원" : "+"}</span>
                            <span>{proc}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 5: 특기사항 및 평가 메모 */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>특기사항 및 현장 평가 메모</span>
              </label>
              <textarea
                rows={2}
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="예: 공정 트러블 조치 능숙, 코팅/사상/검사 공정 원활한 백업 가능"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* 🪪 RIGHT COLUMN: Live Real-Time Personnel Card Preview (5 cols) */}
          <div className={`lg:col-span-5 space-y-3 ${activeMobileView === "form" ? "hidden sm:block" : "block"}`}>
            <div className="flex items-center justify-between px-1">
              <span className="font-black text-xs text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>실시간 인사카드 미리보기</span>
              </span>
              <span className="text-[10.5px] text-slate-400 font-mono">ID CARD PREVIEW</span>
            </div>

            {/* ⭐ The Sleek ID Card Component */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-purple-500/80 shadow-2xl shadow-purple-950/50 relative overflow-hidden space-y-3.5 text-white">
              {/* Background Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${companyTheme.badge}`}>
                    {formData.company}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    제조현장 인사카드
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 tracking-wider">
                  NO. {formData.empNo || "250101"}
                </div>
              </div>

              {/* Profile Main Row (Photo + Name + Dept + Position) */}
              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar / Photo */}
                <div className="shrink-0 relative">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt={formData.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-purple-400 shadow-md shadow-purple-950/60"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400/60 flex flex-col items-center justify-center shadow-md">
                      <User className="w-6 h-6 text-purple-300" />
                      <span className="text-[9.5px] font-black text-purple-300 mt-0.5">{formData.position}</span>
                    </div>
                  )}
                  {formData.photoUrl && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold" title="사진 인증 완료">
                      ✓
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                      {formData.name || "근로자"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-purple-950 text-purple-300 border border-purple-800">
                      {formData.position || "사원"}
                    </span>
                    {formData.nationality && formData.nationality !== "대한민국" && (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                        <span>{getNationalityMeta(formData.nationality).flag}</span>
                        <span>{formData.nationality === "기타" ? (formData.nationalityOther || "기타") : formData.nationality}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="font-bold text-slate-300">{formData.dept}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">{formData.mainProcess} 공정</span>
                  </div>
                </div>
              </div>

              {/* 🌐 외국인 근로자 전용 3배 확장형 언어 선택 패널 (한국인 제외, 주석 제거) */}
              {formData.nationality && formData.nationality !== "대한민국" && (
                <div className="relative z-10">
                  <LanguageSelectBadge variant="elongated" showLabel={false} />
                </div>
              )}

              {/* 숙련등급 & 별점 표시 영역 */}
              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 space-y-1 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400">현장 숙련도 등급</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${currentSkillMeta.badgeClass}`}>
                    {currentSkillMeta.grade}
                  </span>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        starIdx <= formData.skillLevel
                          ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                          : "text-slate-700"
                      }`}
                    />
                  ))}
                  <span className="text-[10.5px] text-slate-400 ml-1.5 font-bold truncate">
                    {currentSkillMeta.desc}
                  </span>
                </div>
              </div>

              {/* ⭐ 검사원 등급 뱃지 (검사 공정 해당 시 실시간 표시) */}
              {isInspectionSelected && (
                <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-2.5 rounded-xl border border-emerald-500/70 space-y-1 relative z-10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-emerald-300 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-emerald-400" />
                      <span>품질 검사원 자격 등급</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${currentInspectorMeta.badgeClass}`}>
                      {currentInspectorMeta.shortGrade}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium truncate">
                    자격: {currentInspectorMeta.desc}
                  </div>
                </div>
              )}

              {/* 2-Column Grid: [입사일 / 근속기간 (자동계산)] & [주공정 / 공정년차 (자동계산)] */}
              <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10">
                <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">입사일 / 근속기간</span>
                  <div className="font-bold text-white font-mono text-[11px]">
                    {formData.joinDate}
                  </div>
                  <div className="text-emerald-400 font-black text-xs">
                    {formData.tenure || calculateTenureFromJoinDate(formData.joinDate)}
                  </div>
                </div>

                <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">주공정 / 공정년차</span>
                  <div className="font-black text-amber-300 text-xs">
                    {formData.mainProcess}
                  </div>
                  <div className="text-cyan-300 font-black text-[11.5px]">
                    {formData.processYear || calculateProcessYearFromJoinDate(formData.joinDate)}
                  </div>
                </div>
              </div>

              {/* 다기능공 뱃지 & 지원 공정 목록 */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400">다기능공 여부</span>
                  {formData.isMultiSkill ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center gap-1 shadow-xs">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>⚡ 다기능공 (Multi-Skill)</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      단일 공정
                    </span>
                  )}
                </div>

                {formData.isMultiSkill && (formData.subProcesses || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">지원공정:</span>
                    {formData.subProcesses.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70 text-[10px] font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 특기사항 메모 */}
              {formData.notes && (
                <div className="text-[10.5px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 relative z-10">
                  <span className="text-slate-500 font-bold block pb-0.5">평가 메모:</span>
                  <span className="text-slate-300">{formData.notes}</span>
                </div>
              )}

              {/* Card Footer Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[9.5px] text-slate-500 font-mono relative z-10">
                <span>(주)오륙 제조품질 관리팀</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>인사카드 인증 완료</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Modal Footer Actions */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            취소
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>인쇄</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "저장 중..." : "💾 인사카드 작성 및 저장"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📷 MODAL: 실시간 웹캠 사진 촬영 팝업 */}
      {/* ========================================================================= */}
      {isCameraOpen && (
        <div
          onClick={handleCloseCamera}
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-purple-500 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 cursor-default text-white relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Camera className="w-4 h-4" />
                </span>
                <span className="font-black text-sm text-white">근로자 프로필 사진 촬영</span>
              </div>
              <button
                onClick={handleCloseCamera}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewport with Guide Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square border-2 border-purple-500/50 flex items-center justify-center shadow-inner">
              {cameraError ? (
                <div className="p-4 text-center space-y-2 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                  >
                    기본 카메라 앱 열기
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Face Guide Circle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-dashed border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center">
                      <span className="text-[10px] text-purple-200/80 font-bold bg-slate-950/60 px-2 py-0.5 rounded-full">
                        얼굴을 원 안에 맞춰주세요
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Capture Actions */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                취소
              </button>

              {!cameraError && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/50 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 찰칵! 사진 촬영 및 적용</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
