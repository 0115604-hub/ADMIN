import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Save,
  Printer,
  Award,
  Trash2
} from "lucide-react";
import {
  DEPARTMENTS_LIST,
  getSkillMeta,
  getInspectorGradeMeta,
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate,
  getWorkerPersonnelCard,
  compressImageToBase64
} from "../services/personnelCardService.js";
import { COMPANY_THEMES, cleanCompanyName } from "../services/overtimeSmartService.js";
import { useModalHistory } from "../utils/modalHistory";
import PersonnelBasicInfoSection from "./personnel/PersonnelBasicInfoSection";
import PersonnelProcessSkillSection from "./personnel/PersonnelProcessSkillSection";
import PersonnelMultiSkillSection from "./personnel/PersonnelMultiSkillSection";
import PersonnelLiveCardPreview from "./personnel/PersonnelLiveCardPreview";
import PersonnelPhotoCaptureModal from "./personnel/PersonnelPhotoCaptureModal";

export default function PersonnelCardModal({
  isOpen,
  onClose,
  worker,
  workerIndex,
  onSave,
  onDelete
}) {
  useModalHistory(isOpen, onClose, "personnelCardModal");

  // Initial Card State
  const initialCard = useMemo(() => {
    return worker ? getWorkerPersonnelCard(worker, workerIndex) : null;
  }, [worker, workerIndex]);

  const [formData, setFormData] = useState(initialCard || {});
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
    if (worker) {
      setFormData(getWorkerPersonnelCard(worker, workerIndex));
    }
  }, [worker, workerIndex]);

  // Clean up camera stream on unmount or when camera modal closes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  if (!isOpen || !worker) return null;

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
      if (field === "company") {
        if (!DEPARTMENTS_LIST.includes(next.dept)) {
          next.dept = "생산팀";
        }
      }
      // 입사일 변경 시 근속기간 및 공정년차 동시 자동 계산
      if (field === "joinDate") {
        next.tenure = calculateTenureFromJoinDate(value);
        next.processYear = calculateProcessYearFromJoinDate(value);
      }
      // 숙련등급 변경 시 등급 라벨 자동 업데이트
      if (field === "skillLevel") {
        next.skillGrade = getSkillMeta(value).grade;
      }
      // 주공정 변경 시 지원 공정에서 해당 주공정 제거 및 관리자 선택 시 다기능공 자동 활성화
      if (field === "mainProcess") {
        next.subProcesses = (prev.subProcesses || []).filter((p) => p !== value);
        if (value === "관리자") {
          next.isMultiSkill = true;
          if (!prev.subProcesses || prev.subProcesses.length === 0) {
            next.subProcesses = ["압출", "소재준비", "조인트", "사상", "코팅", "검사"];
          }
          if (!prev.notes || prev.notes.includes("공정 트러블")) {
            next.notes = "관리자 (작업자 결근 시 전 제조공정 대체 투입 및 생산 지원)";
          }
        }
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
            {/* Section 1: 사진 촬영/선택 & 기본 인적사항 */}
            <PersonnelBasicInfoSection
              formData={formData}
              handleChange={handleChange}
              handleStartCamera={handleStartCamera}
              fileInputRef={fileInputRef}
              mobileCameraInputRef={mobileCameraInputRef}
              handleFileChange={handleFileChange}
            />

            {/* Section 2 & 3: 주 담당 공정 & 숙련등급 & 검사원 평가 */}
            <PersonnelProcessSkillSection
              formData={formData}
              handleChange={handleChange}
              hoverStar={hoverStar}
              setHoverStar={setHoverStar}
              currentSkillMeta={currentSkillMeta}
              currentInspectorMeta={currentInspectorMeta}
              isInspectionSelected={isInspectionSelected}
            />

            {/* Section 4 & 5: 다기능공 지정 & 지원 공정 & 특기사항 메모 */}
            <PersonnelMultiSkillSection
              formData={formData}
              handleChange={handleChange}
              handleToggleSubProcess={handleToggleSubProcess}
            />
          </div>

          {/* 🪪 RIGHT COLUMN: Live Real-Time Personnel Card Preview (5 cols) */}
          <div className={`lg:col-span-5 space-y-3 ${activeMobileView === "form" ? "hidden sm:block" : "block"}`}>
            <PersonnelLiveCardPreview
              formData={formData}
              companyTheme={companyTheme}
              currentSkillMeta={currentSkillMeta}
              currentInspectorMeta={currentInspectorMeta}
              isInspectionSelected={isInspectionSelected}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Modal Footer Actions */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
            >
              닫기
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(worker, workerIndex);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>인원 영구 삭제</span>
              </button>
            )}
          </div>

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
      <PersonnelPhotoCaptureModal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        videoRef={videoRef}
        cameraError={cameraError}
        handleCapturePhoto={handleCapturePhoto}
        mobileCameraInputRef={mobileCameraInputRef}
      />
    </div>
  );
}
