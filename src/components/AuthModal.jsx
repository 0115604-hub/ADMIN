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
  updateUrgentIssueActionResult
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
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIssueExpanded, setIsIssueExpanded] = useState(true);

  // New Issue Form State
  const [newIssueForm, setNewIssueForm] = useState({
    plant: "삼랑진공장",
    author: "방상국",
    authorTitle: "선임",
    title: "",
    content: "",
    actionResult: "",
    actionAuthor: ""
  });

  // Action Result Input Modal State (조치결과 전용 모달)
  const [actionModalData, setActionModalData] = useState({
    isOpen: false,
    issue: null,
    actionResult: "",
    actionAuthor: "설유철"
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

    const hasAction = Boolean(newIssueForm.actionResult && newIssueForm.actionResult.trim());
    await saveUrgentIssue({
      ...newIssueForm,
      category: "긴급공지",
      actionAuthor: hasAction ? (newIssueForm.actionAuthor || newIssueForm.author) : "",
      actionAt: hasAction ? new Date().toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\. /g, "-").replace(/\./g, "") : "",
      isResolved: hasAction
    });

    setNewIssueForm({
      plant: "삼랑진공장",
      author: "방상국",
      authorTitle: "선임",
      title: "",
      content: "",
      actionResult: "",
      actionAuthor: ""
    });
    setIsIssueModalOpen(false);
  };

  // Open Action Result Modal
  const handleOpenActionModal = (issue, e) => {
    if (e) e.stopPropagation();
    setActionModalData({
      isOpen: true,
      issue,
      actionResult: issue.actionResult || "",
      actionAuthor: issue.actionAuthor || "설유철"
    });
  };

  // Save Action Result
  const handleSaveActionResult = async (e) => {
    e.preventDefault();
    if (!actionModalData.issue) return;
    if (!actionModalData.actionResult.trim()) {
      alert("조치결과 내용을 입력해 주세요.");
      return;
    }

    const updated = await updateUrgentIssueActionResult(
      actionModalData.issue.id,
      actionModalData.actionResult,
      actionModalData.actionAuthor
    );

    if (updated) {
      setUrgentIssues((prev) =>
        prev.map((it) => (it.id === actionModalData.issue.id ? updated : it))
      );
    }

    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "설유철"
    });
  };

  // Delete Urgent Issue
  const handleDeleteIssue = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("이 긴급공지 항목을 삭제하시겠습니까?")) {
      const updated = await deleteUrgentIssue(id);
      setUrgentIssues(updated);
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
          {/* 📢 ⭐ [요청사항 반영] 로그인 상단 긴급공지 패널 (전달내용 + 조치결과 관리) */}
          {/* ========================================================================= */}
          <div className="mb-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm overflow-hidden transition-all">
            {/* Panel Top Bar */}
            <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-rose-200/60 dark:border-rose-900/50 bg-rose-100/40 dark:bg-rose-950/40">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-rose-500 text-white shadow-xs">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>공장 긴급공지 및 이슈사항</span>
                  </h3>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  unresolvedIssues.length > 0
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-emerald-600 text-white shadow-xs"
                }`}>
                  {unresolvedIssues.length > 0 ? `미조치 ${unresolvedIssues.length}건` : "전체 조치완료"}
                </span>

                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  총 {urgentIssues.length}건
                </span>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1.5">
                {/* 긴급공지 등록 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-[11px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 긴급공지 등록</span>
                </button>

                {/* Expand / Collapse Button */}
                <button
                  type="button"
                  onClick={() => setIsIssueExpanded((prev) => !prev)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {isIssueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Panel Body: Issue Cards List */}
            {isIssueExpanded && (
              <div className="p-3 sm:p-3.5 space-y-3 max-h-72 overflow-y-auto">
                {urgentIssues.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                    현재 등록된 긴급공지가 없습니다. 상단의 <strong>[+ 긴급공지 등록]</strong> 버튼으로 등록할 수 있습니다.
                  </div>
                ) : (
                  urgentIssues.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-2.5 shadow-xs ${
                        item.isResolved
                          ? "bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800"
                          : "bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-500/20"
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Fixed Badge: 긴급공지 */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white flex items-center gap-0.5 shadow-xs">
                            <Megaphone className="w-2.5 h-2.5" />
                            <span>긴급공지</span>
                          </span>

                          {/* Plant Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${
                            item.plant === "한림공장"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80"
                              : item.plant === "삼랑진공장"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/80"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300/80"
                          }`}>
                            {item.plant}
                          </span>

                          {/* Resolution Status Badge */}
                          {item.isResolved ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>조치완료</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>조치대기</span>
                            </span>
                          )}

                          {/* Title */}
                          <h4 className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      {/* 1. [전달내용] Box */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>📢 전달내용</span>
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>

                      {/* 2. ⭐ [요청사항 반영] 전달내용 아래 [조치결과] Box */}
                      <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                        item.actionResult
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                          : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 border-dashed text-slate-600 dark:text-slate-400"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10.5px] font-black flex items-center gap-1 ${
                            item.actionResult ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-400"
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>조치결과</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleOpenActionModal(item, e)}
                            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95 ${
                              item.actionResult
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                            }`}
                          >
                            <span>{item.actionResult ? "✏️ 조치수정" : "✍️ 조치결과 입력"}</span>
                          </button>
                        </div>

                        {item.actionResult ? (
                          <div>
                            <p className="text-xs leading-relaxed font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                              {item.actionResult}
                            </p>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                              조치자: <strong>{item.actionAuthor || "작업자"}</strong> • {item.actionAt}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            아직 등록된 조치결과가 없습니다. 조치 완료 후 [조치결과 입력] 버튼을 눌러 내용을 작성해 주세요.
                          </p>
                        )}
                      </div>

                      {/* Issue Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400">
                        <span className="font-bold flex items-center gap-1">
                          <span>등록자:</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-black">
                            {item.author} {item.authorTitle || "선임"}
                          </strong>
                          <span>•</span>
                          <span className="font-mono">{item.createdAt}</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteIssue(item.id, e)}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="공지 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
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
      {/* 🌟 1. 긴급공지 등록 팝업 모달 (작업자 등록 창) */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    공장 긴급공지 및 이슈 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    로그인 화면 상단에 실시간으로 전파됩니다.
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
              {/* 구분 & 공장 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 유형 (고정: 긴급공지) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    공지 구분
                  </label>
                  <div className="w-full px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>📢 긴급공지</span>
                  </div>
                </div>

                {/* 발생 공장 선택 */}
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

              {/* 이슈 제목 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  공지 / 이슈 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 압출 2호기 금형 히터 온도 점검 요망"
                  value={newIssueForm.title}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white"
                />
              </div>

              {/* 전달 내용 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  📢 전달 내용
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="구체적인 상황 및 작업자 전달 사항을 입력해 주세요."
                  value={newIssueForm.content}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white"
                ></textarea>
              </div>

              {/* 조치 결과 (선택) */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ✓ 조치 결과 (선택 입력)
                </label>
                <textarea
                  rows="2"
                  placeholder="이미 조치가 완료되었거나 조치 내용이 있는 경우 입력해 주세요 (미입력 시 조치대기 상태로 등록됩니다)."
                  value={newIssueForm.actionResult}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, actionResult: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white"
                ></textarea>
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
                  <span>긴급공지 즉시 등록</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 2. 조치결과 입력/수정 전용 팝업 모달 */}
      {/* ========================================================================= */}
      {actionModalData.isOpen && actionModalData.issue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    조치결과 입력 및 조치완료 처리
                  </h3>
                  <p className="text-xs text-slate-400">
                    해당 공지에 대한 조치 완료 결과를 기록합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalData({ isOpen: false, issue: null, actionResult: "", actionAuthor: "설유철" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Issue Reference Info */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {actionModalData.issue.plant}
                </span>
                <strong className="text-slate-900 dark:text-white font-black">
                  {actionModalData.issue.title}
                </strong>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                📢 {actionModalData.issue.content}
              </p>
            </div>

            <form onSubmit={handleSaveActionResult} className="space-y-4 text-xs">
              {/* 조치자 선택 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  조치자
                </label>
                <select
                  value={actionModalData.actionAuthor}
                  onChange={(e) => setActionModalData({ ...actionModalData, actionAuthor: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                >
                  {allWorkers.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.plantName} • {w.name} {w.title || ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 조치결과 내용 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ✓ 조치결과 상세 내용
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
                  value={actionModalData.actionResult}
                  onChange={(e) => setActionModalData({ ...actionModalData, actionResult: e.target.value })}
                  className="w-full p-3.5 rounded-xl border-2 border-emerald-500/50 dark:border-emerald-500/40 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalData({ isOpen: false, issue: null, actionResult: "", actionAuthor: "설유철" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>조치결과 저장 및 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
