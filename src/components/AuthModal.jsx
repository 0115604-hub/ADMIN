import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  KeyRound,
  ChevronRight,
  Shield,
  Factory,
  ArrowRight,
  QrCode,
  X,
  Sparkles,
  Crown,
  Lock,
  ArrowLeft,
  Smartphone,
  Cpu,
  AlertTriangle,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  Check,
  Flame,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Radio,
  Megaphone,
  Clock,
  Send
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  getLocalUrgentIssues,
  subscribeUrgentIssues,
  saveUrgentIssue,
  deleteUrgentIssue,
  toggleIssueResolved,
  toggleIssueBlinking
} from "../services/urgentIssueService";

export const AuthModal = () => {
  const { loginWithProfile } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());

  // Urgent Issues State
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [isBlinkingEnabled, setIsBlinkingEnabled] = useState(true);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);

  // New Issue Form State
  const [newIssueForm, setNewIssueForm] = useState({
    plant: "삼랑진공장",
    author: "방상국",
    authorTitle: "선임",
    level: "EMERGENCY",
    title: "",
    content: "",
    isBlinking: true
  });

  // Real-time Cloud Synchronization for Annual Leaves
  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  // Real-time Cloud Synchronization for Urgent Issues
  useEffect(() => {
    const unsub = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues);
    });
    return () => unsub();
  }, []);

  // Filter unresolved issues
  const unresolvedIssues = useMemo(() => {
    return urgentIssues.filter((i) => !i.isResolved);
  }, [urgentIssues]);

  // Determine if active blinking alert should be displayed
  const hasActiveBlinkingIssue = useMemo(() => {
    return isBlinkingEnabled && unresolvedIssues.some((i) => i.isBlinking !== false);
  }, [isBlinkingEnabled, unresolvedIssues]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("작업자를 먼저 선택해 주세요.");
      return;
    }
    if (!pin) {
      setErrorMsg("비밀번호(PIN)를 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      loginWithProfile(selectedUser.id, pin);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit New Urgent Issue
  const handleSaveNewIssue = async (e) => {
    e.preventDefault();
    if (!newIssueForm.title.trim()) {
      alert("이슈 제목을 입력해 주세요.");
      return;
    }
    if (!newIssueForm.content.trim()) {
      alert("상세 전달 내용을 입력해 주세요.");
      return;
    }

    await saveUrgentIssue({
      ...newIssueForm,
      isResolved: false
    });

    setNewIssueForm({
      plant: "삼랑진공장",
      author: "방상국",
      authorTitle: "선임",
      level: "EMERGENCY",
      title: "",
      content: "",
      isBlinking: true
    });
    setIsIssueModalOpen(false);
  };

  // Delete Urgent Issue
  const handleDeleteIssue = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("이 긴급 이슈 항목을 삭제하시겠습니까?")) {
      const updated = await deleteUrgentIssue(id);
      setUrgentIssues(updated);
    }
  };

  // Toggle Resolved Status
  const handleToggleResolved = async (id, e) => {
    if (e) e.stopPropagation();
    const updatedItem = await toggleIssueResolved(id);
    if (updatedItem) {
      setUrgentIssues((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isResolved: !it.isResolved } : it))
      );
    }
  };

  // Toggle Blinking for Specific Item
  const handleToggleBlinking = async (id, e) => {
    if (e) e.stopPropagation();
    const updatedItem = await toggleIssueBlinking(id);
    if (updatedItem) {
      setUrgentIssues((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isBlinking: !it.isBlinking } : it))
      );
    }
  };

  // All workers list for author dropdown
  const allWorkers = useMemo(() => {
    const list = [];
    PLANTS.forEach((p) => {
      p.workers.forEach((w) => {
        list.push({ ...w, plantName: p.name });
      });
    });
    return list;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card with Glassmorphism */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-6 relative animate-scaleUp">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-4 sm:p-6">
          {/* Header Brand */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-[11px] font-black mb-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ORYUK SMART MES PORTAL</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                (주)오륙
              </span>
              <span>생산관리 통합시스템</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              작업자 또는 관리자를 선택하여 안전하게 접속해 주세요.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 🚨 ⭐ [요청사항 반영] 로그인 상단 긴급이슈사항 패널 (점멸 기능 & 작업자 등록) */}
          {/* ========================================================================= */}
          <div
            className={`mb-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
              hasActiveBlinkingIssue
                ? "bg-rose-50/90 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20 animate-pulse"
                : unresolvedIssues.length > 0
                ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-sm"
                : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
            }`}
          >
            {/* Panel Top Bar */}
            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {/* Blinking Emergency Strobe Beacon */}
                  {hasActiveBlinkingIssue ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                    </span>
                  ) : (
                    <Flame className="w-4 h-4 text-amber-500" />
                  )}

                  <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🚨 공장 긴급 이슈 및 전달사항</span>
                  </h3>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  unresolvedIssues.length > 0
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}>
                  {unresolvedIssues.length > 0 ? `발생 ${unresolvedIssues.length}건` : "정상 가동"}
                </span>

                {hasActiveBlinkingIssue && (
                  <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 animate-pulse">
                    ⚡ 점멸 경보 작동중
                  </span>
                )}
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1.5">
                {/* 점멸 ON/OFF 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsBlinkingEnabled((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95 ${
                    isBlinkingEnabled
                      ? "bg-rose-600 text-white ring-1 ring-rose-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  title="점멸 애니메이션 켜기/끄기"
                >
                  <Zap className={`w-3 h-3 ${isBlinkingEnabled ? "text-amber-300 animate-bounce" : ""}`} />
                  <span>점멸 {isBlinkingEnabled ? "ON" : "OFF"}</span>
                </button>

                {/* 긴급 이슈 등록 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-[11px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 이슈 등록</span>
                </button>

                {/* Expand / Collapse Button */}
                <button
                  type="button"
                  onClick={() => setIsIssueExpanded((prev) => !prev)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {isIssueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Panel Body: Issue Cards List */}
            {isIssueExpanded && (
              <div className="p-3 sm:p-3.5 space-y-2.5 max-h-60 overflow-y-auto">
                {urgentIssues.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                    현재 등록된 긴급 이슈가 없습니다. 상단의 <strong>[+ 이슈 등록]</strong> 버튼으로 공지할 수 있습니다.
                  </div>
                ) : (
                  urgentIssues.map((item) => {
                    const isItemBlinking = isBlinkingEnabled && item.isBlinking !== false && !item.isResolved;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2 shadow-xs ${
                          item.isResolved
                            ? "bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60"
                            : isItemBlinking
                            ? "bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/50"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Level Badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-0.5 ${
                                item.level === "EMERGENCY"
                                  ? "bg-rose-500 text-white"
                                  : item.level === "WARNING"
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-blue-600 text-white"
                              }`}>
                                {item.level === "EMERGENCY" && "🚨 긴급비상"}
                                {item.level === "WARNING" && "⚠️ 주의경보"}
                                {item.level === "NOTICE" && "📢 긴급공지"}
                              </span>

                              {/* Plant Badge */}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                item.plant === "한림공장"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : item.plant === "삼랑진공장"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              }`}>
                                {item.plant}
                              </span>

                              {/* Title */}
                              <h4 className={`font-black text-xs sm:text-[13px] text-slate-900 dark:text-white ${
                                item.isResolved ? "line-through text-slate-400 dark:text-slate-500" : ""
                              }`}>
                                {item.title}
                              </h4>
                            </div>

                            {/* Content */}
                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium whitespace-pre-wrap pl-0.5">
                              {item.content}
                            </p>
                          </div>
                        </div>

                        {/* Issue Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-400">
                          <span className="font-bold flex items-center gap-1">
                            <span>작성자:</span>
                            <strong className="text-slate-700 dark:text-slate-300 font-black">
                              {item.author} {item.authorTitle || "선임"}
                            </strong>
                            <span>•</span>
                            <span className="font-mono">{item.createdAt}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {/* 조치완료 토글 */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleResolved(item.id, e)}
                              className={`px-2 py-0.5 rounded-md font-black text-[10px] transition-all flex items-center gap-0.5 ${
                                item.isResolved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>{item.isResolved ? "조치완료됨" : "조치완료"}</span>
                            </button>

                            {/* 점멸 토글 */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleBlinking(item.id, e)}
                              className={`p-1 rounded-md text-[10px] border transition-all ${
                                item.isBlinking !== false
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                              }`}
                              title="개별 점멸 효과 토글"
                            >
                              <Zap className="w-3 h-3" />
                            </button>

                            {/* 삭제 */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteIssue(item.id, e)}
                              className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedUser ? (
            <div className="space-y-4">
              {/* ========================================================================= */}
              {/* 1. FACTORY 1: 삼랑진공장 */}
              {/* ========================================================================= */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">삼랑진공장</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {PLANTS[0].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PLANTS[0].workers.map((worker) => {
                    const isChief = worker.name === "이명재" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves);
                    const isOnLeave = leaveStatus?.status === "ACTIVE";

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-center min-h-[74px] ${
                          isOnLeave
                            ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400/40 hover:border-rose-500"
                            : isChief
                            ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-300 dark:border-amber-700/80 hover:border-amber-500 ring-1 ring-amber-400/20"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-105 ${
                          isOnLeave
                            ? "bg-gradient-to-tr from-rose-500 to-rose-600 text-white"
                            : isChief
                            ? "bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 ring-2 ring-amber-400/50"
                            : isPartner
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                            : "bg-gradient-to-tr from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white"
                        }`}>
                          {isOnLeave ? leaveStatus?.emoji || "🌴" : worker.avatar}
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate w-full">
                          {worker.name}
                        </span>

                        {/* Leave Status & Role Badges */}
                        {leaveStatus?.status === "ACTIVE" ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 animate-pulse ${leaveStatus.badgeColor}`}>
                            <span>{leaveStatus.emoji} {leaveStatus.label}</span>
                          </span>
                        ) : leaveStatus?.status === "SCHEDULED" ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${leaveStatus.badgeColor}`}>
                            <span>{leaveStatus.label}</span>
                          </span>
                        ) : isChief ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>총괄관리</span>
                          </span>
                        ) : isPartner ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            협력업체
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. FACTORY 2: 한림공장 */}
              {/* ========================================================================= */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">한림공장</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {PLANTS[1].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PLANTS[1].workers.map((worker) => {
                    const isChief = worker.name === "김동욱" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves);
                    const isOnLeave = leaveStatus?.status === "ACTIVE";

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-center min-h-[74px] ${
                          isOnLeave
                            ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400/40 hover:border-rose-500"
                            : isChief
                            ? "bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 ring-1 ring-emerald-400/20"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-105 ${
                          isOnLeave
                            ? "bg-gradient-to-tr from-rose-500 to-rose-600 text-white"
                            : isChief
                            ? "bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white ring-2 ring-emerald-400/50"
                            : isPartner
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                            : "bg-gradient-to-tr from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white"
                        }`}>
                          {isOnLeave ? leaveStatus?.emoji || "🌴" : worker.avatar}
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate w-full">
                          {worker.name}
                        </span>

                        {/* Leave Status & Role Badges */}
                        {leaveStatus?.status === "ACTIVE" ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 animate-pulse ${leaveStatus.badgeColor}`}>
                            <span>{leaveStatus.emoji} {leaveStatus.label}</span>
                          </span>
                        ) : leaveStatus?.status === "SCHEDULED" ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${leaveStatus.badgeColor}`}>
                            <span>{leaveStatus.label}</span>
                          </span>
                        ) : isChief ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-600 text-white shadow-sm flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>총괄관리</span>
                          </span>
                        ) : isPartner ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            협력업체
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. BOTTOM ACTIONS: ADMIN */}
              {/* ========================================================================= */}
              <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                {ADMIN_USERS.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleUserClick(admin)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-sm group active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ADMIN 관리자</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PIN Input Form View */
            /* ========================================================================= */
            <form onSubmit={handlePinSubmit} className="space-y-4 animate-fadeIn">
              {/* Hero Spotlight Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-blue-950/30 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md ${
                    selectedUser.role === "ADMIN"
                      ? "bg-slate-800 ring-2 ring-indigo-500/40"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                      : "bg-amber-500 ring-2 ring-amber-400/40"
                  }`}>
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {selectedUser.role === "ADMIN" ? "최고 관리자 모드" : `${selectedUser.plant} • ${selectedUser.title || "작업자"}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>변경</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호 입력"
                      : "비밀번호(PIN) 입력"}
                  </span>
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder={
                    selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호"
                      : "비밀번호 입력"
                  }
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-black text-center tracking-widest focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>시스템 접속</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 긴급 이슈 등록 팝업 모달 (작업자 등록 창) */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    공장 긴급 이슈 및 전달사항 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    로그인 화면 상단에 실시간으로 점멸 전파됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewIssue} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 공장 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    발생 공장
                  </label>
                  <select
                    value={newIssueForm.plant}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, plant: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                    <option value="전사 공통">전사 공통</option>
                  </select>
                </div>

                {/* 작성자 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작성자
                  </label>
                  <select
                    value={newIssueForm.author}
                    onChange={(e) => {
                      const found = allWorkers.find((w) => w.name === e.target.value);
                      setNewIssueForm({
                        ...newIssueForm,
                        author: e.target.value,
                        authorTitle: found?.title || "선임"
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {allWorkers.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.plantName} • {w.name} {w.title || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 긴급도 레벨 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  긴급도 / 이슈 유형
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "EMERGENCY", label: "🚨 긴급 비상", desc: "설비정지/품질비상", color: "border-rose-500 bg-rose-50/50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
                    { key: "WARNING", label: "⚠️ 주의 경보", desc: "사전점검/자재납기", color: "border-amber-500 bg-amber-50/50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
                    { key: "NOTICE", label: "📢 긴급 공지", desc: "작업지시/전파", color: "border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" }
                  ].map((lvl) => {
                    const isSelected = newIssueForm.level === lvl.key;
                    return (
                      <button
                        type="button"
                        key={lvl.key}
                        onClick={() => setNewIssueForm({ ...newIssueForm, level: lvl.key })}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                          isSelected ? `${lvl.color} font-black shadow-xs ring-2 ring-indigo-500/20` : "border-slate-200 dark:border-slate-700 text-slate-500"
                        }`}
                      >
                        <span className="text-xs font-black">{lvl.label}</span>
                        <span className="text-[10px] opacity-75 mt-0.5">{lvl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 이슈 제목 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  이슈 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 압출 2호기 금형 히터 온도 센서 이상 점검 요망"
                  value={newIssueForm.title}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white"
                />
              </div>

              {/* 상세 내용 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  상세 전달 내용
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="구체적인 상황 및 조치 요청 사항을 입력해 주세요."
                  value={newIssueForm.content}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white"
                ></textarea>
              </div>

              {/* 점멸 활성화 체크박스 */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="chk_blinking"
                  checked={newIssueForm.isBlinking}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, isBlinking: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="chk_blinking" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                  🚨 로그인 화면에서 경보 점멸(Blinking) 효과 활성화
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black shadow-md shadow-rose-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>긴급 이슈 즉시 등록 및 전파</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
