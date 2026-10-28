import React from "react";
import { Camera, X, AlertCircle } from "lucide-react";

/**
 * PersonnelPhotoCaptureModal
 * WebCam snapshot modal for capturing worker personnel ID card photo
 */
export default function PersonnelPhotoCaptureModal({
  isOpen,
  onClose,
  videoRef,
  cameraError,
  handleCapturePhoto,
  mobileCameraInputRef
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
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
            onClick={onClose}
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
            onClick={onClose}
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
  );
}
