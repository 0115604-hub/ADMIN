import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ShieldAlert,
  Calendar,
  User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeSevereDisasterPhotos,
  uploadSevereDisasterPhotos,
  deleteSevereDisasterPhoto
} from "../services/severeDisasterService";

export const SevereDisasterBar = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const fileInputRef = useRef(null);

  const isMyeongjae =
    currentProfile?.name === "이명재" ||
    currentProfile?.id === "sam_mj" ||
    isAdmin ||
    currentProfile?.assignedProcess === "총괄관리";

  useEffect(() => {
    const unsub = subscribeSevereDisasterPhotos((data) => {
      setPhotos(data || []);
    });
    return () => unsub();
  }, []);

  // Handle multi-image file select
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      await uploadSevereDisasterPhotos(files, currentProfile);
    } catch (err) {
      console.error("Disaster photos upload error:", err);
      alert("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("선택한 중대재해 사진을 삭제하시겠습니까?")) return;

    try {
      await deleteSevereDisasterPhoto(photoId);
      if (selectedPhotoIndex !== null) {
        if (photos.length <= 1) {
          setSelectedPhotoIndex(null);
        } else if (selectedPhotoIndex >= photos.length - 1) {
          setSelectedPhotoIndex(photos.length - 2);
        }
      }
    } catch (err) {
      console.error("Delete photo error:", err);
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") setSelectedPhotoIndex(null);
      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
      }
      if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  // If not Myeongjae and no photos exist, do not render
  if (!isMyeongjae && (!photos || photos.length === 0)) {
    return null;
  }

  const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <>
      {/* ⚡ 상태표시줄 밑 1줄짜리 중대재해공유판 패널 */}
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-950/40 border-b border-amber-300/80 dark:border-amber-700/60 px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-xs shadow-2xs backdrop-blur-xs transition-colors z-10 select-none">
        {/* Left: Badge Title & Count */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shadow-xs tracking-tight shrink-0 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">🚨 중대재해공유판</span>
          </div>

          <span className="text-[10.5px] font-bold text-amber-900 dark:text-amber-200 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/90 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700">
            <span>등록:</span>
            <strong className="font-mono text-rose-600 dark:text-rose-400">{photos.length}</strong>장
          </span>
        </div>

        {/* Center: Inline Photo Thumbnails Strip (Single Row) */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 px-2 no-scrollbar min-w-0">
          {photos.slice(0, 8).map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(idx)}
              className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-md overflow-hidden border border-amber-400/90 dark:border-amber-600 hover:border-rose-500 dark:hover:border-rose-400 cursor-pointer shadow-2xs hover:scale-110 transition-transform shrink-0 group bg-slate-900"
              title={`${photo.name} (${photo.uploaderName || "이명재 이사"}) - 클릭 시 확대`}
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
          ))}

          {photos.length > 8 && (
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(0)}
              className="px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold text-[10px] shrink-0 hover:bg-amber-300 transition"
            >
              +{photos.length - 8}
            </button>
          )}

          {photos.length === 0 && (
            <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium truncate">
              {isMyeongjae ? "공유할 중대재해 사진을 [사진 업로드] 버튼으로 등록해주세요." : "등록된 중대재해 공유 사진이 없습니다."}
            </span>
          )}
        </div>

        {/* Right: Upload Button & Full View Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {isMyeongjae && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-[11px] sm:text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="다수의 중대재해 관련 사진 파일 업로드"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>업로드중...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>사진 업로드</span>
                </>
              )}
            </button>
          )}

          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(0)}
              className="px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-amber-300 dark:border-slate-700 shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              title="전체 사진 보기"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">전체보기</span>
            </button>
          )}
        </div>
      </div>

      {/* 🖼️ Full-Screen Image Gallery Modal */}
      {selectedPhotoIndex !== null && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-fadeIn select-none">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center gap-1 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>중대재해공유판</span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-300 truncate max-w-xs sm:max-w-md">
                {currentPhoto.name}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                ({selectedPhotoIndex + 1} / {photos.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentPhoto.url}
                download={currentPhoto.name || "중대재해_사진.jpg"}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="다운로드"
              >
                <Download className="w-4 h-4" />
              </a>

              {isMyeongjae && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(currentPhoto.id, e)}
                  className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
                  title="사진 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="닫기 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Photo Display with Navigation Arrows */}
          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 my-2 overflow-hidden">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition active:scale-90 cursor-pointer"
                title="이전 사진 (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="max-w-full max-h-[72vh] flex items-center justify-center">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.name}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-slate-800 animate-scaleUp"
              />
            </div>

            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition active:scale-90 cursor-pointer"
                title="다음 사진 (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip & Info */}
          <div className="w-full max-w-5xl border-t border-slate-800 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>등록자: <strong className="text-white">{currentPhoto.uploaderName || "이명재 이사"}</strong></span>
              </span>
              {currentPhoto.uploadedAt && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{new Date(currentPhoto.uploadedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              )}
            </div>

            {/* Bottom thumbnail gallery */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    idx === selectedPhotoIndex
                      ? "border-rose-500 scale-105 shadow-md ring-2 ring-rose-500/40"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
