import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Eye,
  CheckCircle2,
  CheckSquare,
  Square,
  ClipboardList,
  BellRing,
  Activity,
  KeyRound,
  Lock
} from "lucide-react";
import { ADMIN_USERS, useAuth } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";
import { subscribeSevereDisasterPhotos } from "../../services/severeDisasterService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

// Process-specific default tasks generator
const getProcessTasks = (worker) => {
  const process = worker?.assignedProcess || "";
  const name = worker?.name || "";
  const plant = worker?.plant || "삼랑진공장";

  if (worker?.role === "ADMIN" || name === "권태형" || name === "최미영") {
    return [
      { id: "t1", text: "전사 공장(삼랑진/한림) 일일 실시간 생산 및 출하 모니터링", done: true },
      { id: "t2", text: "미결 전자결재 문서 검토 및 긴급 안건 승인", done: false },
      { id: "t3", text: "중대재해 안전 점검 현황 및 품질경보 이슈 피드백 확인", done: false }
    ];
  }

  if (process.includes("총괄") || name === "이명재" || name === "김동욱") {
    return [
      { id: "t1", text: `${plant} 라인별 당일 가동 상태 및 비가동 일지 점검`, done: true },
      { id: "t2", text: "현장 중대재해 예방 안전 사진 촬영 및 공유판 등록", done: false },
      { id: "t3", text: "작업자 근태 현황 확인 및 잔업/특근 인원 배정 조율", done: false }
    ];
  }

  if (process.includes("압출")) {
    return [
      { id: "t1", text: "압출 1~4호기 가동 조건 및 금형 예열/온도 상태 점검", done: true },
      { id: "t2", text: "주간 작업실적표 비가동 시간 기록 및 원인 분석 일지 작성", done: false },
      { id: "t3", text: "압출동 5S 환경 정리 및 안전 보호구 착용 점검", done: false }
    ];
  }

  if (process.includes("가공")) {
    return [
      { id: "t1", text: "가공 라인별 작업 수량 및 치수 불량률 실시간 모니터링", done: true },
      { id: "t2", text: "협력업체 외주 가공 부품 입출고 일정 점검", done: false },
      { id: "t3", text: "절단/밀링 설비 안전 커버 및 작업장 통로 안전 점검", done: false }
    ];
  }

  if (process.includes("품질")) {
    return [
      { id: "t1", text: "원부자재 및 완제품 수입/출하 검사 일지 확인", done: true },
      { id: "t2", text: "오픈이슈 품질경보 등록 항목 조치 결과 검증", done: false },
      { id: "t3", text: "공정별 부적합품 격리 및 개선 대책 수립", done: false }
    ];
  }

  if (process.includes("설비") || process.includes("보전")) {
    return [
      { id: "t1", text: "주요 압출/가공 설비 예방 점검 및 윤활 상태 확인", done: true },
      { id: "t2", text: "비가동 발생 설비 긴급 수리 및 원인 분석 기록", done: false },
      { id: "t3", text: "보전 예비 부품 재고 파악 및 발주 요청 검토", done: false }
    ];
  }

  if (process.includes("경리")) {
    return [
      { id: "t1", text: "당일 출하 세금계산서 및 거래명세표 확인", done: true },
      { id: "t2", text: "작업자 일일 근태 및 연차/휴가 신청 내역 정산", done: false }
    ];
  }

  return [
    { id: "t1", text: `${plant} ${process || "담당"} 표준 작업 안전 수칙 준수`, done: true },
    { id: "t2", text: "일일 작업 실적 기록 및 완료 수량 등록", done: false },
    { id: "t3", text: "작업 종료 전 공구 정돈 및 주변 5S 청결 유지", done: false }
  ];
};

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
  const [pinInput, setPinInput] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);
  const bodyRef = useRef(null);
  const pinInputRef = useRef(null);

  // Todo tasks state with interactive toggle
  const [todos, setTodos] = useState([]);

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
      setTodos(getProcessTasks(selectedUser));
      setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
        }
      }, 100);
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
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
  const expectedPin = selectedUser.pin || (isAdmin ? "0090" : "11");
  const leaveStatus = getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });

  // Filter relevant shared notices / quality alerts / notes from other workers
  const sharedFromOthers = (activeIssues && activeIssues.length > 0 ? activeIssues : urgentIssues || [])
    .filter((it) => !it.isDeleted)
    .slice(0, 5);

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

    // Auto-verify when matching PIN is entered
    if (checkPinValidity(val)) {
      setIsPinVerified(true);
    }
  };

  const handlePinSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (checkPinValidity(pinInput)) {
      setIsPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setIsPinVerified(false);
    }
  };

  const handleToggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isPinVerified) {
      if (checkPinValidity(pinInput)) {
        setIsPinVerified(true);
      } else {
        setPinError(true);
        if (pinInputRef.current) pinInputRef.current.focus();
        return;
      }
    }

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
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden animate-scaleUp relative flex flex-col my-auto max-h-[94vh] md:max-h-[90vh]"
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
                      maxLength={selectedUser.role === "ADMIN" ? 4 : 4}
                      placeholder={selectedUser.role === "ADMIN" ? "0090" : "11"}
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
            className="p-3.5 sm:p-5 md:p-6 overflow-y-auto flex-1 scrollbar-thin space-y-4"
          >
            {!isPinVerified ? (
              /* ========================================================================= */
              /* 🔒 핀번호 입력 대기 안내 화면 (PIN 번호 입력 시 하단 내용 노출) */
              /* ========================================================================= */
              <div className="py-12 sm:py-16 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto animate-fadeIn">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedUser.name} {selectedUser.title || ""} 핀번호를 입력해 주세요
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    상단 이름 옆의 PIN 입력창에 핀번호({selectedUser.role === "ADMIN" ? "0090" : "11"})를 입력하시면
                    <br />
                    <span className="font-bold text-blue-600 dark:text-blue-400">안전공유판 2배 확대 사진</span>과 <span className="font-bold text-amber-600 dark:text-amber-400">할 일·내 상태·공유받은 내용</span>이 즉시 열립니다.
                  </p>
                </div>

                {/* Fast Keypad Preset */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const quickPin = selectedUser.role === "ADMIN" ? "0090" : "11";
                      setPinInput(quickPin);
                      setIsPinVerified(true);
                      setPinError(false);
                    }}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡ 빠른 PIN({selectedUser.role === "ADMIN" ? "0090" : "11"}) 자동인증</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* ✅ 핀번호 인증 완료 시 노출되는 하단 콘텐츠 (안전공유판 2배 확대 + 3-in-1 업무 패널) */
              /* ========================================================================= */
              <div className="space-y-4 animate-fadeIn">
                {/* 개인 당일 근태 등록 알림 (있을 경우) */}
                {leaveStatus && (
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 flex items-center justify-between gap-2 text-xs shadow-2xs animate-pulse">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="font-black text-rose-900 dark:text-rose-200 truncate text-xs sm:text-sm">
                        당일 근태 알림: {selectedUser.name} {selectedUser.title} ({leaveStatus.fullLabel || leaveStatus.label})
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs shrink-0">
                      {leaveStatus.displayBadge || "근태"}
                    </span>
                  </div>
                )}

                {/* PC 2-Column Wide Grid / Mobile 1-Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
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
                            {disasterPhotos.slice(0, 4).map((photo) => (
                              <div
                                key={photo.id}
                                onClick={() => setPreviewImage(photo.url || photo.dataUrl)}
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
                            <div className="text-right pt-1">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                외 {disasterPhotos.length - 4}장의 안전 사진이 더 등록되어 있습니다.
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
                  {/* [우측 패널] 📝 3-in-1 맞춤 패널: 1)내 상태, 2)할 일, 3)공유받은 내용 */}
                  {/* ===================================================================== */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-3.5">
                      {/* 1. 🟢 내 현재 상태 및 공정 */}
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              🟢 내 현재 상태 및 담당
                            </span>
                          </div>
                          <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {leaveStatus ? (leaveStatus.displayBadge || "근태등록") : "정상 근무"}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between flex-wrap gap-1">
                          <span>
                            담당 공정: <strong className="text-slate-900 dark:text-white font-black">{selectedUser.assignedProcess || "작업 총괄"}</strong> ({selectedUser.plant})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            직책: {selectedUser.title || "선임"}
                          </span>
                        </div>
                      </div>

                      {/* 2. 📋 나의 오늘 할 일 (To-Do) */}
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              📋 나의 오늘 할 일 (To-Do)
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {todos.filter((t) => t.done).length}/{todos.length} 완료
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {todos.map((todo) => (
                            <div
                              key={todo.id}
                              onClick={() => handleToggleTodo(todo.id)}
                              className={`p-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                                todo.done
                                  ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                                  : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-slate-200 font-bold"
                              }`}
                            >
                              {todo.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-blue-500 shrink-0" />
                              )}
                              <span className="text-xs flex-1 truncate">{todo.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. 📬 다른 작업자로부터 공유받은 내용 (Received Shares / Alerts) */}
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              📬 다른 작업자로부터 공유받은 내용
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {sharedFromOthers.length}건
                          </span>
                        </div>

                        {sharedFromOthers.length > 0 ? (
                          <div className="space-y-1.5">
                            {sharedFromOthers.slice(0, 3).map((item) => {
                              const badgeStyle = item.category === "품질경보"
                                ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                                : item.category === "회의일정"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300";

                              return (
                                <div
                                  key={item.id || item._docId}
                                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-0.5 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border shrink-0 ${badgeStyle}`}>
                                        {item.category}
                                      </span>
                                      <span className="font-black text-slate-900 dark:text-white truncate">
                                        {item.title || item.content}
                                      </span>
                                    </div>
                                    <span className="text-[9.5px] font-bold text-slate-400 shrink-0">
                                      보낸이: {item.author || "관리자"}
                                    </span>
                                  </div>
                                  {item.title && item.content && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 font-medium">
                                      {item.content}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-3 text-center text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            새로 공유받은 내용이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>개인화 실시간 작업 포털</span>
                      <span>작업 완료 시 대시보드 저장</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🌟 3. Footer: 시원한 전폭 대시보드 접속 버튼 */}
          <div className="p-3.5 sm:p-4 md:px-6 md:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 sm:py-3.5 md:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base md:text-lg shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isPinVerified
                  ? `${selectedUser.name} ${selectedUser.title || ""} 작업 대시보드 접속`
                  : `PIN 인증 후 대시보드 접속 (${selectedUser.role === "ADMIN" ? "0090" : "11"})`}
              </span>
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
