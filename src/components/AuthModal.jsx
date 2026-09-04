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
import { OryukLogo } from "./OryukLogo";
import { TelegramLogo } from "./TelegramLogo";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection
} from "../services/telegramService";

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
    category: "품질경보",
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

  // Telegram Config & Admin Access State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramAdminPinModal, setTelegramAdminPinModal] = useState({
    isOpen: false,
    pinInput: "",
    errorMsg: ""
  });
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingTelegramPnL, setTestingTelegramPnL] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [telegramSavedToast, setTelegramSavedToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  const handleOpenTelegram = () => {
    setTelegramAdminPinModal({
      isOpen: true,
      pinInput: "",
      errorMsg: ""
    });
  };

  const handleVerifyTelegramAdmin = (e) => {
    e.preventDefault();
    const inputPin = telegramAdminPinModal.pinInput.trim();
    if (inputPin === "0090") {
      setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" });
      setIsTelegramModalOpen(true);
      setTelegramTestResult(null);
    } else {
      setTelegramAdminPinModal((prev) => ({
        ...prev,
        errorMsg: "관리자(Admin) 전용 기능입니다. PIN 번호(0090)가 일치하지 않습니다."
      }));
    }
  };

  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    await saveTelegramConfig(telegramConfig);
    setTelegramSavedToast(true);
    setTimeout(() => setTelegramSavedToast(false), 2500);
  };

  const handleTestTelegram = async (type = "general") => {
    const targetChatId = type === "pnl" ? telegramConfig.pnlChatId : telegramConfig.chatId;
    if (!telegramConfig.botToken || !targetChatId) {
      alert(`Bot Token과 ${type === "pnl" ? "경영/손익 채널 Chat ID" : "일반 알림 채널 Chat ID"}를 모두 입력해주세요.`);
      return;
    }
    if (type === "pnl") {
      setTestingTelegramPnL(true);
    } else {
      setTestingTelegram(true);
    }
    setTelegramTestResult(null);
    try {
      const res = await testTelegramConnection(telegramConfig.botToken, targetChatId);
      setTelegramTestResult(res);
      if (res.success) {
        await saveTelegramConfig(telegramConfig);
      }
    } catch (err) {
      setTelegramTestResult({ success: false, error: err.message });
    } finally {
      if (type === "pnl") {
        setTestingTelegramPnL(false);
      } else {
        setTestingTelegram(false);
      }
    }
  };

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

  // Submit New Urgent Issue (품질경보: 기존색상 / 공유사항: 녹색)
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
      category: newIssueForm.category || "품질경보",
      actionAuthor: hasAction ? (newIssueForm.actionAuthor || newIssueForm.author) : "",
      actionAt: hasAction ? new Date().toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\. /g, "-").replace(/\./g, "") : "",
      isResolved: hasAction
    });

    setNewIssueForm({
      category: "품질경보",
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

  // Delete Issue Authorization Modal State (삼랑진공장: 이명재 / 한림공장: 김동욱 권한 부여)
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    issue: null,
    pinInput: "",
    errorMsg: ""
  });

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

  // Save Action Result (누구나 작성 및 수정 가능)
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

  // Open Delete Authority Modal (삭제는 삼랑진공장: 이명재, 한림공장: 김동욱에게만 권한 부여)
  const handleOpenDeleteModal = (issue, e) => {
    if (e) e.stopPropagation();
    setDeleteModalData({
      isOpen: true,
      issue,
      pinInput: "",
      errorMsg: ""
    });
  };

  // Confirm Delete with Authority Verification
  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    const issue = deleteModalData.issue;
    if (!issue) return;

    const plant = issue.plant;
    const inputPin = deleteModalData.pinInput.trim();

    // Authority Rules:
    // 삼랑진공장: 이명재 이사 (PIN: 11) or ADMIN (PIN: 0090)
    // 한림공장: 김동욱 책임 (PIN: 11) or ADMIN (PIN: 0090)
    let isAuthorized = false;
    let expectedManager = "";

    if (plant === "삼랑진공장") {
      expectedManager = "이명재 이사";
      isAuthorized = (inputPin === "11" || inputPin === "0090");
    } else if (plant === "한림공장") {
      expectedManager = "김동욱 책임";
      isAuthorized = (inputPin === "11" || inputPin === "0090");
    } else {
      expectedManager = "이명재 이사 또는 김동욱 책임";
      isAuthorized = (inputPin === "11" || inputPin === "0090");
    }

    if (!isAuthorized) {
      setDeleteModalData((prev) => ({
        ...prev,
        errorMsg: `삭제 권한이 없습니다. (${expectedManager}의 확인 PIN 번호가 일치하지 않습니다.)`
      }));
      return;
    }

    const updated = await deleteUrgentIssue(issue.id, expectedManager);
    setUrgentIssues(updated);
    setDeleteModalData({
      isOpen: false,
      issue: null,
      pinInput: "",
      errorMsg: ""
    });
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xl animate-fadeIn p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start min-h-screen">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card with Glassmorphism */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-4 sm:p-6">
          {/* Header Brand with Bright OryukLogo */}
          <div className="text-center mb-4 flex flex-col items-center">
            {/* Bright, Elevated Logo Container */}
            <div className="relative mb-2.5">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-3xl blur-md opacity-40 animate-pulse"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl border-2 border-white/80 dark:border-slate-700 flex items-center justify-center">
                <OryukLogo className="w-10 h-10 drop-shadow-md" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[11px] font-black mb-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ORYUK SMART MES PORTAL</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">
                (주)오륙
              </span>
              <span>생산관리 통합시스템</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              작업자 또는 관리자를 선택하여 안전하게 접속해 주세요.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 📢 ⭐ [요청사항 반영] 로그인 상단 품질경보 및 공지사항 패널 (깔끔한 2줄 요약 형태) */}
          {/* ========================================================================= */}
          <div className="mb-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm overflow-hidden transition-all">
            {/* Panel Top Bar */}
            <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 border-b border-rose-200/60 dark:border-rose-900/50 bg-rose-100/40 dark:bg-rose-950/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="p-1 rounded-lg bg-rose-500 text-white shadow-xs">
                  <Megaphone className="w-3 h-3" />
                </div>
                <h3 className="font-black text-xs flex items-center gap-1.5">
                  <span className="text-rose-600 dark:text-rose-400 font-black">품질경보</span>
                  <span className="text-slate-400 font-bold">/</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">공지사항</span>
                </h3>

                <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                  unresolvedIssues.length > 0
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}>
                  {unresolvedIssues.length > 0 ? `미조치 ${unresolvedIssues.length}건` : "조치완료"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  (총 {urgentIssues.length}건)
                </span>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-[10.5px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                  title="신규 품질경보 및 공지사항 등록"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 등록</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenTelegram}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[10.5px] font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  title="텔레그램 실시간 알림 연동 관리 (Admin 전용)"
                >
                  <TelegramLogo className="w-3.5 h-3.5" />
                  <span>telegram</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIssueExpanded((prev) => !prev)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={isIssueExpanded ? "패널 접기" : "패널 펼치기"}
                >
                  {isIssueExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Panel Body: Exactly 2 Lines per Notice Item */}
            {isIssueExpanded && (
              <div className="p-2 sm:p-2.5 space-y-2 max-h-60 overflow-y-auto">
                {urgentIssues.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                    현재 등록된 품질경보 및 공지사항이 없습니다.
                  </div>
                ) : (
                  urgentIssues.map((item) => {
                    const isNotice = item.category === "공지사항" || item.category === "공유사항";
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-center gap-1.5 shadow-xs ${
                          item.isResolved
                            ? "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                            : isNotice
                            ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/25"
                            : "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/80 ring-1 ring-rose-400/20"
                        }`}
                      >
                        {/* 1번째 줄: [품질경보/공지사항] [공장] 전달내용 (작성자 시간) + [조치상태] [삭제] */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {isNotice ? (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-600 text-white shrink-0 shadow-xs">
                                공지사항
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-rose-600 text-white shrink-0 shadow-xs">
                                품질경보
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                              item.plant === "한림공장"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : item.plant === "삼랑진공장"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            }`}>
                              {item.plant}
                            </span>
                            <span className={`truncate text-[11.5px] ${
                              !isNotice
                                ? "font-black text-rose-600 dark:text-rose-400"
                                : "font-black text-slate-900 dark:text-white"
                            }`}>
                              {item.title ? `${item.title} - ${item.content}` : item.content}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium hidden sm:inline">
                              ({item.author} • {item.createdAt})
                            </span>
                          </div>

                          {/* Right: Status & Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.isResolved ? (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓완료
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                ⏳대기
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteModal(item, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                              title={`${item.plant} 품질경보/공지사항 삭제 (권한자: ${item.plant === "한림공장" ? "김동욱 책임" : item.plant === "삼랑진공장" ? "이명재 이사" : "총괄관리자"})`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      {/* 2번째 줄: └ ✓ 조치: [조치내용] (조치자 시간) + [조치입력/수정] */}
                      <div className="flex items-center justify-between gap-2 pl-1">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className="text-slate-400 font-bold shrink-0 text-[11px]">└</span>
                          {item.actionResult ? (
                            <div className="flex items-center gap-1 min-w-0 truncate text-[11px]">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                                ✓ 조치결과:
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {item.actionResult}
                              </span>
                              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 shrink-0 font-bold hidden sm:inline">
                                ({item.actionAuthor || "작업자"} • {item.actionAt})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              <span className="font-bold">⏳ 조치결과:</span>
                              <span className="text-slate-400 italic text-[10.5px]">아직 등록된 조치결과가 없습니다.</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Action Input / Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenActionModal(item, e)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all shrink-0 active:scale-95 ${
                            item.actionResult
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60"
                              : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
                          }`}
                        >
                          {item.actionResult ? "✏️ 수정" : "✍️ 조치입력"}
                        </button>
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
      {/* 🌟 1. 품질이슈 및 공유사항 등록 팝업 모달 (작업자 등록 창) */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    품질경보 및 공지사항 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    로그인 화면 상단에 실시간으로 전파됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewIssue} className="space-y-4 text-xs">
              {/* 구분 & 공장 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 이슈 구분 선택: 품질경보 (기존 붉은색) vs 공지사항 (녹색) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    구분
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewIssueForm({ ...newIssueForm, category: "품질경보" })}
                      className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                        newIssueForm.category === "품질경보"
                          ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>🚨 품질경보</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIssueForm({ ...newIssueForm, category: "공지사항" })}
                      className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                        newIssueForm.category === "공지사항"
                          ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>📢 공지사항</span>
                    </button>
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

              {/* 제목 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  제목
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black shadow-md shadow-rose-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>등록</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp">
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
                    해당 품질경보 및 공지사항에 대한 조치 완료 결과를 기록합니다.
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>조치결과 저장 및 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 3. 공장 품질경보 및 공지사항 삭제 전용 권한 확인 모달 (이명재 / 김동욱 권한 검증) */}
      {/* ========================================================================= */}
      {deleteModalData.isOpen && deleteModalData.issue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    품질경보 및 공지사항 삭제 권한 확인
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    공장별 총괄관리자 전용 삭제 인증
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Issue Info Card */}
            <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  deleteModalData.issue.plant === "한림공장"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {deleteModalData.issue.plant}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  작성자: {deleteModalData.issue.author} ({deleteModalData.issue.createdAt})
                </span>
              </div>
              <div className="font-black text-slate-900 dark:text-white truncate pt-1">
                {deleteModalData.issue.title || deleteModalData.issue.content}
              </div>
            </div>

            {/* Authority Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {deleteModalData.issue.plant === "한림공장"
                    ? "한림공장 삭제 권한자: 김동욱 책임"
                    : deleteModalData.issue.plant === "삼랑진공장"
                    ? "삼랑진공장 삭제 권한자: 이명재 이사"
                    : "삭제 권한자: 총괄관리자 (이명재 이사 / 김동욱 책임)"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                삭제를 진행하려면 해당 총괄관리자의 확인 PIN을 입력해 주세요.
              </p>
            </div>

            {/* PIN Input Form */}
            <form onSubmit={handleConfirmDelete} className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs">
                  총괄관리자 확인 PIN (2자리)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력"
                  value={deleteModalData.pinInput}
                  onChange={(e) => setDeleteModalData({ ...deleteModalData, pinInput: e.target.value, errorMsg: "" })}
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-600 shadow-xs"
                />
              </div>

              {deleteModalData.errorMsg && (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{deleteModalData.errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>권한 인증 후 삭제</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 4. 텔레그램 연동 관리자(Admin) 권한 인증 모달 */}
      {/* ========================================================================= */}
      {telegramAdminPinModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 연동 관리</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    관리자 권한 인증 후 설정 화면으로 진입합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Authority Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                <Lock className="w-3.5 h-3.5 text-sky-500" />
                <span>접속 권한: ADMIN 관리자</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                봇 토큰 및 그룹 채널 설정을 위해 ADMIN 관리자 PIN을 입력해 주세요.
              </p>
            </div>

            {/* PIN Input Form */}
            <form onSubmit={handleVerifyTelegramAdmin} className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs text-center">
                  ADMIN 관리자 확인 PIN (4자리)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력"
                  value={telegramAdminPinModal.pinInput}
                  onChange={(e) =>
                    setTelegramAdminPinModal({ ...telegramAdminPinModal, pinInput: e.target.value, errorMsg: "" })
                  }
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-xs"
                />
              </div>

              {telegramAdminPinModal.errorMsg && (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{telegramAdminPinModal.errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>인증 후 이동</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 5. 텔레그램 봇 실시간 알림 설정 모달 */}
      {/* ========================================================================= */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 실시간 알림 연동</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    품질경보, 모닝브리핑, 월간 경영손익 텔레그램 발송 연동
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTelegramConfig} className="space-y-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  실시간 알림 사용 상태
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramConfig.enabled}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {telegramConfig.enabled ? "켜짐(ON)" : "꺼짐(OFF)"}
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  텔레그램 Bot Token (API 토큰)
                </label>
                <input
                  type="text"
                  placeholder="예: 7812345678:AAHqK_..."
                  value={telegramConfig.botToken || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10.5px] text-slate-400">
                  @BotFather 에서 발급받은 공용 봇 토큰
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📢 일반 알림 채널 ID (오륙 통합방)</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">모닝브리핑/품질경보</span>
                </label>
                <input
                  type="text"
                  placeholder="예: -4186792536 또는 -100..."
                  value={telegramConfig.chatId || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>💼 경영/손익 전용 채널 ID (경영방)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">월간 손익결산</span>
                </label>
                <input
                  type="text"
                  placeholder="예: -1003939516875"
                  value={telegramConfig.pnlChatId || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Test Status Feedback */}
              {telegramTestResult && (
                <div className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200">
                  {telegramTestResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✅ 텔레그램 테스트 메시지가 성공적으로 전송되었습니다!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>❌ 전송 실패: {telegramTestResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={() => handleTestTelegram("general")}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="일반 알림방으로 테스트 발송"
                  >
                    <TelegramLogo className="w-3.5 h-3.5" />
                    <span>{testingTelegram ? "발송 중..." : "일반방 테스트"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={testingTelegramPnL}
                    onClick={() => handleTestTelegram("pnl")}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border border-amber-200 dark:border-amber-800/60"
                    title="경영방으로 테스트 발송"
                  >
                    <TelegramLogo className="w-3.5 h-3.5" />
                    <span>{testingTelegramPnL ? "발송 중..." : "경영방 테스트"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {telegramSavedToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 저장됨!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    <span>설정 저장하기</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
