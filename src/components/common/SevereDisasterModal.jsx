import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ShieldAlert,
  Camera,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  PhoneCall,
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeSevereDisasterPhotos,
  uploadSevereDisasterPhotos,
  deleteSevereDisasterPhoto
} from "../../services/severeDisasterService";

export const SevereDisasterModal = ({ isOpen, onClose }) => {
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
    if (!isOpen) return;
    const unsub = subscribeSevereDisasterPhotos((data) => {
      setPhotos(data || []);
    });
    return () => unsub();
  }, [isOpen]);

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
    if (!window.confirm("선택한 중대재해 안전 사진을 삭제하시겠습니까?")) return;

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

  if (!isOpen) return null;

  const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-rose-800 via-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-2xl border border-rose-400/30 backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  중대재해 예방 및 안전보건 공유판
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  현장 필독
                </span>
              </div>
              <p className="text-[11px] text-rose-200/90 font-medium">
                안전 최우선! 전 작업장 무재해 달성을 위한 실시간 안전정보 공유
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Emergency Safety Alert Slogan */}
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 p-3.5 sm:p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-rose-900 dark:text-rose-200 text-xs sm:text-sm">
                🚨 5대 절대 안전 수칙 준수
              </h4>
              <ul className="text-slate-700 dark:text-slate-300 space-y-0.5 font-medium text-[11.5px]">
                <li>① 회전체/압출기 점검 시 <strong>반드시 전원 차단(LOTO)</strong> 후 작업</li>
                <li>② 지게차 작업구역 접근 금지 및 <strong>안전모/보호구 100% 착용</strong></li>
                <li>③ 고온 다이스/노즐 부위 화상 주의 및 <strong>내열장갑 필착</strong></li>
                <li>④ 작업장 내 비상통로 확보 및 <strong>스크랩/오일 바닥 방치 금지</strong></li>
                <li>⑤ 이상 발생 시 즉시 <strong>비상정지(EMERGENCY STOP)</strong> 및 관리자 보고</li>
              </ul>
            </div>
          </div>

          {/* Photo Gallery & Upload Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-600" />
                현장 안전점검 및 중대재해 사례 공유 ({photos.length}건)
              </span>

              {/* Upload Button for Admin/Managers */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>사진 등록</span>
                </button>
              </div>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md hover:scale-102 transition-all"
                  >
                    <img
                      src={photo.url || photo.dataUrl}
                      alt={photo.title || "안전사진"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-[10px]">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(photo.id, e)}
                          className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-bold truncate">{photo.title || "현장안전점검"}</p>
                        <p className="text-[9px] text-slate-300">
                          {photo.uploaderName || "관리자"} • {photo.uploadedAt ? photo.uploadedAt.split("T")[0] : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">등록된 중대재해 안전 사진이 없습니다.</p>
                <p className="text-[11px] text-slate-400">
                  우측 상단의 [사진 등록] 버튼을 눌러 안전 사진을 업로드해주세요.
                </p>
              </div>
            )}
          </div>

          {/* Emergency Hotline Numbers */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span className="font-black text-slate-800 dark:text-slate-200">
                🚨 비상 연락망:
              </span>
              <span className="font-bold text-slate-600 dark:text-slate-400">
                삼랑진공장 총괄 이명재 이사 / 보전반 전재율 책임
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-black text-rose-600">
              <span>긴급신고: 119</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-bold">
            (주)오륙 안전보건관리위원회
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-black text-xs transition active:scale-95 cursor-pointer shadow-xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {currentPhoto && (
        <div
          onClick={() => setSelectedPhotoIndex(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={currentPhoto.url || currentPhoto.dataUrl}
              alt="안전사진"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
            >
              <X className="w-6 h-6" />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SevereDisasterModal;
