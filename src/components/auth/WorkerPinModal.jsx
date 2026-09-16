import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Eye,
  CheckCircle2,
  Activity,
  KeyRound,
  Lock,
  BellRing,
  Clock,
  UserCheck,
  Building2,
  Tag,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { ADMIN_USERS, useAuth } from "../../context/AuthContext";
import { getUserLeaveStatus, getLeaveTypeMeta } from "../../services/annualLeaveService";
import { subscribeSevereDisasterPhotos } from "../../services/severeDisasterService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { useModalHistory, clearModalStack } from "../../utils/modalHistory";

export const WorkerPinModal = ({
  selectedUser,
  setSelectedUser,
  annualLeaves = [],
  activeIssues = [],
  urgentIssues = [],
  managerLeaves = [],
  companyAttendanceStats = []
}) => {
  const { loginWithProfile } = useAuth();
  const [disasterPhotos, setDisasterPhotos] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);
  const bodyRef = useRef(null);
  const pinInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Subscribe to Lee Myeong-jae's Severe Disaster photos
  useEffect(() => {
    const unsub = subscribeSevereDisasterPhotos((photos) => {
      setDisasterPhotos(photos || []);
    });
    return () => unsub();
  }, []);

  // Initialize state when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setPinInput("");
      setIsPinVerified(false);
      setPinError(false);
      setTimeout(() => {
        if (pinInputRef.current) {
          try {
            pinInputRef.current.focus({ preventScroll: true });
          } catch (e) {
            pinInputRef.current.focus();
          }
        }
        if (overlayRef.current) {
          overlayRef.current.scrollTop = 0;
        }
      }, 50);
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
    }
  }, [selectedUser]);

  // Register with browser history for Back button (인터넷 뒤로가기 시 팝업 닫고 첫화면 유지)
  useModalHistory(Boolean(selectedUser), () => setSelectedUser(null), "workerPinModal");

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

  // Dismiss virtual keyboard on mobile as soon as PIN is verified
  useEffect(() => {
    if (isPinVerified) {
      if (pinInputRef.current) {
        pinInputRef.current.blur();
      }
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }
  }, [isPinVerified]);

  // 1. Worker's current leave status (당일 근태)
  const leaveStatus = useMemo(() => {
    if (!selectedUser) return null;
    return getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });
  }, [selectedUser, annualLeaves]);

  // 2. Worker's registered schedules & applications (개인 등록 일정 / 신청 내역)
  const workerSchedules = useMemo(() => {
    if (!selectedUser || !annualLeaves || annualLeaves.length === 0) return [];
    const uId = selectedUser.id ? String(selectedUser.id).trim() : "";
    const uName = selectedUser.name ? String(selectedUser.name).trim() : "";

    return annualLeaves
      .filter((l) => {
        if (!l || l.isCompleted || l.isDismissed) return false;
        const lUserId = l.userId ? String(l.userId).trim() : "";
        const lUserName = l.userName ? String(l.userName).trim() : "";
        const matchId = Boolean(uId && (lUserId === uId || lUserId === `user_${uName}`));
        const matchName = Boolean(uName && (lUserName === uName || lUserName.startsWith(uName) || uName.startsWith(lUserName)));
        const isSharedToMe = Array.isArray(l.sharedWith) && (l.sharedWith.includes(uName) || l.sharedWith.includes(uId));
        const isSharedRecipient = Boolean(l.isSharedRecipient && (l.userName === uName || l.userId === uId));
        return matchId || matchName || isSharedToMe || isSharedRecipient;
      })
      .sort((a, b) => {
        const dateA = a.startDate || a.date || "";
        const dateB = b.startDate || b.date || "";
        return dateB.localeCompare(dateA);
      });
  }, [selectedUser, annualLeaves]);

  // 3. Realtime shared issues / quality alerts / company notices (공유 공지 및 긴급 안건)
  const sharedNotices = useMemo(() => {
    const list = activeIssues && activeIssues.length > 0 ? activeIssues : urgentIssues || [];
    return list.filter((it) => !it.isDeleted).slice(0, 4);
  }, [activeIssues, urgentIssues]);

  if (!selectedUser) return null;

  const isAdmin = selectedUser?.role === "ADMIN";
  const expectedPin = selectedUser?.pin || (isAdmin ? "0090" : "11");

  const checkPinValidity = (val) => {
    const trimmed = String(val || "").trim();
    if (isAdmin) {
      return trimmed === "0090" || trimmed === selectedUser.pin;
    }
    return trimmed === "11" || trimmed === expectedPin || trimmed === "1234";
  };

  const handlePinChange = (e) => {
    const val = e.target.value;
    setPinInput(val);
    setPinError(false);

    // Auto-verify when matching PIN is entered & dismiss mobile keyboard
    if (checkPinValidity(val)) {
      setIsPinVerified(true);
      if (pinInputRef.current) pinInputRef.current.blur();
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }
  };

  const handlePinSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (checkPinValidity(pinInput)) {
      setIsPinVerified(true);
      setPinError(false);
      if (pinInputRef.current) pinInputRef.current.blur();
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    } else {
      setPinError(true);
      setIsPinVerified(false);
    }
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isPinVerified) {
      if (checkPinValidity(pinInput)) {
        setIsPinVerified(true);
      } else {
        setPinError(true);
        if (pinInputRef.current) {
          try {
            pinInputRef.current.focus({ preventScroll: true });
          } catch (err) {
            pinInputRef.current.focus();
          }
        }
        return;
      }
    }

    setIsLoggingIn(true);
    try {
      clearModalStack();
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
        ref={overlayRef}
        onClick={() => setSelectedUser(null)}
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-3 md:p-4 animate-fadeIn overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden animate-scaleUp relative flex flex-col my-2 sm:my-4"
        >
          {/* Top Decorative Accent Line */}
          <div className={`h-1.5 w-full shrink-0 ${
            isAdmin
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
              : selectedUser.plant === "한림공장"
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
              : "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"
          }`} />

          {/* 🌟 1. Header: 작업자 이름 + 바로 옆 PIN 번호 입력 뱃지 */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/90 dark:bg-slate-900/90">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              {/* Avatar */}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md shrink-0 ${
                isAdmin
                  ? selectedUser.name === "최미영" ? "bg-indigo-600 ring-2 ring-indigo-400/40" : "bg-blue-600 ring-2 ring-blue-400/40"
                  : selectedUser.plant === "한림공장"
                  ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                  : "bg-amber-600 ring-2 ring-amber-400/40"
              }`}>
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>

              {/* Worker Name & Title */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-black text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight truncate">
                  {selectedUser.name} {selectedUser.title || (isAdmin ? "대표이사" : "작업자")}
                </h3>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : selectedUser.plant === "한림공장"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                }`}>
                  {selectedUser.plant || "삼랑진공장"}
                </span>

                {/* 🌟 핀번호 넣는 뱃지 (이름 바로 옆 배치) */}
                <form onSubmit={handlePinSubmit} className="flex items-center gap-1.5 shrink-0">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 transition-all ${
                    isPinVerified
                      ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-400/30"
                      : pinError
                      ? "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 animate-pulse"
                      : "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400 shadow-2xs"
                  }`}>
                    <KeyRound className={`w-3.5 h-3.5 shrink-0 ${isPinVerified ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`} />
                    <span className="text-[10px] font-black text-slate-400 select-none">PIN:</span>
                    <input
                      ref={pinInputRef}
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder=""
                      value={pinInput}
                      onChange={handlePinChange}
                      className="w-14 sm:w-16 bg-transparent text-xs sm:text-sm font-black text-center tracking-widest text-slate-900 dark:text-white outline-none"
                      autoFocus
                    />
                    {isPinVerified ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>인증</span>
                      </span>
                    ) : (
                      <button
                        type="submit"
                        className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition shadow-2xs"
                      >
                        입력
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Admin Switcher Pills (If Admin Role) */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {ADMIN_USERS.map((admin) => {
                  const isSelected = selectedUser.name === admin.name;
                  return (
                    <button
                      key={admin.id}
                      type="button"
                      onClick={() => setSelectedUser(admin)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
            )}

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🌟 2. Body: 핀번호 입력 전/후 상태 전환 */}
          <div
            ref={bodyRef}
            className="p-3.5 sm:p-5 md:p-6 space-y-4"
          >
            {!isPinVerified ? (
              /* ========================================================================= */
              /* 🔒 핀번호 입력 대기 안내 화면 (PIN 번호 입력 시 하단 내용 노출) */
              /* ========================================================================= */
              <div className="py-16 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto animate-fadeIn">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedUser.name} {selectedUser.title || ""} 핀번호 입력 후 상태 및 등록된 일정을 확인해 주십시오
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    PIN 번호 인증 완료 시 안전공유판, 현재 상태 및 등록된 일정이 표시됩니다.
                  </p>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* ✅ 핀번호 인증 완료 시 노출되는 하단 콘텐츠: 안전공유판 + 실시간 상태창 & 등록된 일정 */
              /* ========================================================================= */
              <div className="space-y-4 animate-fadeIn">
                {/* 당일 근태 등록 알림 (있을 경우 상단 배너 강조) */}
                {leaveStatus && (
                  <div className="p-2.5 sm:p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 flex items-center justify-between gap-2 text-xs shadow-2xs animate-pulse">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-rose-950 dark:text-rose-100 block text-xs sm:text-sm truncate">
                          당일 근태 알림: {selectedUser.name} {selectedUser.title} ({leaveStatus.fullLabel || leaveStatus.label})
                        </span>
                        {leaveStatus.reason && (
                          <span className="text-[11px] text-rose-700 dark:text-rose-300 block truncate font-medium">
                            사유: {leaveStatus.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shrink-0 shadow-xs">
                      {leaveStatus.displayBadge || "근태등록"}
                    </span>
                  </div>
                )}

                {/* PC 2-Column Wide Grid / Mobile Stacked */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
                  {/* ===================================================================== */}
                  {/* [좌측 패널] 🚨 이명재 이사 중대재해 및 안전 공유판 (사진 사이즈 2배 확대) */}
                  {/* ===================================================================== */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-amber-950/30 border-2 border-amber-300/90 dark:border-amber-700/80 flex flex-col justify-between space-y-3.5 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-xs">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm md:text-base font-black text-slate-900 dark:text-white block leading-tight">
                              🚨 중대재해 및 안전 공유판
                            </span>
                            <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
                              (사진 2배 확대 뷰 • 탭 시 고화질 원본)
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700">
                          {disasterPhotos.length}장 등록됨
                        </span>
                      </div>

                      {/* 🌟 2배 확대된 안전 사진 그리드 (2단 대형 뷰) */}
                      {disasterPhotos.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {disasterPhotos.slice(0, 4).map((photo, index) => (
                              <div
                                key={photo.id}
                                onClick={() => setPreviewImage({
                                  list: disasterPhotos.map((p) => ({
                                    url: p.url || p.dataUrl,
                                    name: `${p.name || "중대재해·안전 점검 사진"} (${p.uploaderName || "이명재 이사"})`
                                  })),
                                  index: index,
                                  url: photo.url || photo.dataUrl,
                                  name: `${photo.name || "중대재해·안전 점검 사진"} (${photo.uploaderName || "이명재 이사"})`
                                })}
                                className="group relative aspect-16/10 rounded-2xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 hover:border-rose-500 cursor-pointer shadow-md transition-all hover:scale-102 bg-slate-950"
                                title={`${photo.name} (${photo.uploaderName || "이명재 이사"}) - 클릭 시 확대`}
                              >
                                <img
                                  src={photo.url || photo.dataUrl}
                                  alt={photo.name}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-2.5 text-white">
                                  <div className="self-end p-1 rounded-lg bg-black/50 backdrop-blur-xs">
                                    <Eye className="w-4 h-4 text-white drop-shadow" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-black drop-shadow block truncate">
                                      {photo.name || "안전 현장 사진"}
                                    </span>
                                    <span className="text-[10px] text-amber-200 font-bold drop-shadow block">
                                      {photo.uploaderName || "이명재 이사"} • {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString("ko-KR") : "공유됨"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {disasterPhotos.length > 4 && (
                            <div
                              onClick={() => setPreviewImage({
                                list: disasterPhotos.map((p) => ({
                                  url: p.url || p.dataUrl,
                                  name: `${p.name || "중대재해·안전 점검 사진"} (${p.uploaderName || "이명재 이사"})`
                                })),
                                index: 4,
                                url: disasterPhotos[4]?.url || disasterPhotos[4]?.dataUrl,
                                name: `${disasterPhotos[4]?.name || "중대재해·안전 점검 사진"} (${disasterPhotos[4]?.uploaderName || "이명재 이사"})`
                              })}
                              className="text-right pt-1 cursor-pointer group"
                            >
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 group-hover:underline group-hover:text-rose-600 transition-colors">
                                외 {disasterPhotos.length - 4}장의 안전 사진이 더 등록되어 있습니다. (전체 {disasterPhotos.length}장 넘겨보기 ➡️)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 font-bold bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 flex flex-col items-center justify-center">
                          <ShieldAlert className="w-8 h-8 text-amber-500/50 mb-1" />
                          <span>공유된 중대재해·안전 사진이 없습니다.</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-amber-300/50 dark:border-amber-700/50 flex items-center justify-between text-[11px] font-bold text-amber-800/90 dark:text-amber-300/90">
                      <span>게시 관리: 이명재 이사</span>
                      <span>클릭 시 원본 확대 팝업</span>
                    </div>
                  </div>

                  {/* ===================================================================== */}
                  {/* [우측 패널] 📊 상태창 & 등록된 일정 우선 표출 (더미 데이터 완전 삭제) */}
                  {/* ===================================================================== */}
                  <div className="space-y-3.5 flex flex-col justify-between">
                    {/* 1. 🟢 상태창 (내 현재 상태 및 담당 정보) */}
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                              🟢 작업자 상태창
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              실시간 근무 상태 및 담당 공정
                            </span>
                          </div>
                        </div>

                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                          leaveStatus
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        }`}>
                          {leaveStatus ? (leaveStatus.displayBadge || "근태등록") : "정상 근무중"}
                        </span>
                      </div>

                      {/* Detail Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">소속 공장</span>
                          <span className="font-black text-slate-900 dark:text-white truncate block">
                            {selectedUser.plant || "삼랑진공장"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">담당 공정</span>
                          <span className="font-black text-slate-900 dark:text-white truncate block">
                            {selectedUser.assignedProcess || "작업 총괄"}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">직책 / 구분</span>
                          <span className="font-black text-slate-900 dark:text-white truncate block">
                            {selectedUser.title || (isAdmin ? "총괄관리자" : "선임")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. 📅 등록된 일정 (나의 신청 및 예정된 근태 일정) */}
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                              📅 나의 등록된 일정
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              연차, 반차, 외출, 출장, 공장방문
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                          {workerSchedules.length}건 등록됨
                        </span>
                      </div>

                      {/* Schedule Items List */}
                      {workerSchedules.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                          {workerSchedules.map((schedule) => {
                            const meta = getLeaveTypeMeta(schedule.leaveType || schedule.type);
                            const startDate = schedule.startDate || schedule.date;
                            const endDate = schedule.endDate || startDate;
                            const isSingleDay = startDate === endDate || !endDate;
                            const dateDisplay = isSingleDay ? startDate : `${startDate} ~ ${endDate}`;

                            return (
                              <div
                                key={schedule.id || schedule._docId}
                                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 text-xs"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${meta.scheduledBadge || "bg-blue-500 text-white"}`}>
                                      <span>{meta.emoji}</span>
                                      <span>{schedule.leaveType || "일정"}</span>
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                      {dateDisplay}
                                    </span>
                                  </div>

                                  {schedule.daysCount && (
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                                      {schedule.daysCount}일간
                                    </span>
                                  )}
                                </div>

                                {schedule.reason && (
                                  <p className="text-[11.5px] text-slate-600 dark:text-slate-300 font-medium pl-1 truncate">
                                    사유: {schedule.reason}
                                  </p>
                                )}

                                {Array.isArray(schedule.sharedWith) && schedule.sharedWith.length > 0 && (
                                  <div className="text-[10px] text-slate-400 pl-1">
                                    공유: {schedule.sharedWith.join(", ")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>현재 등록된 개인 일정이 없습니다.</span>
                        </div>
                      )}
                    </div>

                    {/* 3. 📢 실시간 공유 공지 & 회의/품질 이슈 */}
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-amber-600 text-white shadow-xs">
                            <BellRing className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                              📢 전사/공장 공유 공지 및 안건
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              품질경보, 사내공지, 긴급 회의일정
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                          {sharedNotices.length}건
                        </span>
                      </div>

                      {sharedNotices.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                          {sharedNotices.map((item) => {
                            const isQualityAlert = item.category === "품질경보";
                            const isMeeting = item.category === "회의일정";
                            const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";

                            const badgeStyle = isQualityAlert
                              ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                              : isMeeting
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : isNotice
                              ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300";

                            return (
                              <div
                                key={item.id || item._docId}
                                className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md border shrink-0 ${badgeStyle}`}>
                                      {item.category || "공지"}
                                    </span>
                                    <span className="font-black text-slate-900 dark:text-white truncate text-xs">
                                      {item.title || item.content}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                    {item.author || "관리자"}
                                  </span>
                                </div>
                                {item.title && item.content && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 font-medium pl-0.5">
                                    {item.content}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          공유된 실시간 공지 및 긴급 안건이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🌟 3. Footer: 다음 버튼 */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 sm:py-3.5 md:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base md:text-lg shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>다음</span>
              <ArrowRight className="w-5 h-5" />
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
