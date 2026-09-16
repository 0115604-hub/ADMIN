import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Megaphone,
  Eye
} from "lucide-react";
import { ADMIN_USERS, useAuth } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";
import { subscribeSevereDisasterPhotos } from "../../services/severeDisasterService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

export const WorkerPinModal = ({
  selectedUser,
  setSelectedUser,
  annualLeaves,
  activeIssues = [],
  urgentIssues = []
}) => {
  const { loginWithProfile } = useAuth();
  const [disasterPhotos, setDisasterPhotos] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const bodyRef = useRef(null);

  // Subscribe to Lee Myeong-jae's Severe Disaster photos
  useEffect(() => {
    const unsub = subscribeSevereDisasterPhotos((photos) => {
      setDisasterPhotos(photos || []);
    });
    return () => unsub();
  }, []);

  // Guarantee the modal body always scrolls to top on open
  useEffect(() => {
    if (selectedUser && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [selectedUser]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  const isAdmin = selectedUser.role === "ADMIN";
  const isMyeongjae = selectedUser.name === "이명재" || selectedUser.assignedProcess === "총괄관리";
  const leaveStatus = getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });

  // Filter top relevant active notices/issues
  const displayNotices = (activeIssues && activeIssues.length > 0 ? activeIssues : urgentIssues || [])
    .filter((it) => !it.isDeleted)
    .slice(0, 4);

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoggingIn(true);
    try {
      loginWithProfile(selectedUser, true, false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Worker login error:", err);
      alert("로그인 중 오류가 발생했습니다: " + (err.message || ""));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setSelectedUser(null)}
        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-scaleUp relative flex flex-col my-auto max-h-[92vh]"
        >
          {/* Top Decorative Line */}
          <div className={`h-1.5 w-full shrink-0 ${
            isAdmin
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
              : selectedUser.plant === "한림공장"
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
              : "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"
          }`} />

          {/* 🌟 1. Compact Header: 작업자 이름과 직책 */}
          <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 ${
                isAdmin
                  ? selectedUser.name === "최미영" ? "bg-indigo-600 ring-2 ring-indigo-400/40" : "bg-blue-600 ring-2 ring-blue-400/40"
                  : selectedUser.plant === "한림공장"
                  ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                  : "bg-amber-600 ring-2 ring-amber-400/40"
              }`}>
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                    {selectedUser.name} {selectedUser.title || (isAdmin ? "대표이사" : "작업자")}
                  </h3>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isAdmin
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}>
                    {selectedUser.plant || "삼랑진공장"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                  {isAdmin ? "본사 • 최고 관리자" : `${selectedUser.assignedProcess || "작업자"} 담당`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="닫기 (ESC)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Admin Switcher Pills (If Admin Role) */}
          {isAdmin && (
            <div className="px-3.5 sm:px-4 pt-2.5 shrink-0">
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1">
                {ADMIN_USERS.map((admin) => {
                  const isSelected = selectedUser.name === admin.name;
                  return (
                    <button
                      key={admin.id}
                      type="button"
                      onClick={() => setSelectedUser(admin)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{admin.name === "권태형" ? "👑" : "💎"}</span>
                      <span>{admin.name} {admin.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🌟 2. Body: 이명재 이사 공유 사진 + 사내 공유 내용 패널 (최우선 노출) */}
          <div
            ref={bodyRef}
            className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin"
          >
            {/* 개인 당일 근태 등록 알림 (있을 경우) */}
            {leaveStatus && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between gap-2 text-xs shadow-2xs animate-pulse">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-black text-rose-900 dark:text-rose-200 truncate text-[11px] sm:text-xs">
                    당일 근태: {selectedUser.name} {selectedUser.title} ({leaveStatus.fullLabel || leaveStatus.label})
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[9.5px] shrink-0">
                  {leaveStatus.displayBadge || "근태"}
                </span>
              </div>
            )}

            {/* [패널 1] 🚨 이명재 이사 중대재해 및 안전 공유 사진 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-amber-950/30 border-2 border-amber-300/90 dark:border-amber-700/80 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-rose-600 text-white shadow-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    🚨 중대재해 및 안전 공유판
                  </span>
                </div>

                <span className="text-[10.5px] font-black text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700">
                  {disasterPhotos.length}장 등록됨
                </span>
              </div>

              {disasterPhotos.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {disasterPhotos.slice(0, 4).map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setPreviewImage(photo.url || photo.dataUrl)}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 hover:border-rose-500 cursor-pointer shadow-xs transition-all hover:scale-102 bg-slate-900"
                        title={`${photo.name} (${photo.uploaderName || "이명재 이사"}) - 클릭 시 확대`}
                      >
                        <img
                          src={photo.url || photo.dataUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {disasterPhotos.length > 4 && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        외 {disasterPhotos.length - 4}장의 안전 사진이 등록되어 있습니다. (사진 탭 시 확대)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-amber-800/80 dark:text-amber-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60">
                  공유된 중대재해·안전 사진이 없습니다.
                </div>
              )}
            </div>

            {/* [패널 2] 📢 전사 공지 및 실시간 공유 내용 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-blue-600 text-white shadow-xs">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    📢 사내 공유사항 & 품질/회의 공지
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  {displayNotices.length}건
                </span>
              </div>

              {displayNotices.length > 0 ? (
                <div className="space-y-1.5">
                  {displayNotices.map((item) => {
                    const isQualityAlert = item.category === "품질경보";
                    const isMeeting = item.category === "회의일정";
                    const isNotice = item.category === "공지사항" || item.category === "사내공지";

                    const badgeStyle = isQualityAlert
                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                      : isMeeting
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      : isNotice
                      ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";

                    return (
                      <div
                        key={item.id || item._docId}
                        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md border shrink-0 ${badgeStyle}`}>
                              {item.category}
                            </span>
                            <h5 className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {item.title || item.content}
                            </h5>
                          </div>

                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0">
                            {item.author || "관리자"}
                          </span>
                        </div>

                        {item.title && item.content && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 font-medium leading-tight">
                            {item.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  등록된 사내 공유사항이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 🌟 3. Footer: 간결한 전폭 대시보드 접속 버튼 */}
          <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0 space-y-1">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{selectedUser.name} {selectedUser.title || ""} 작업 대시보드 접속</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Disaster Images */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
};
