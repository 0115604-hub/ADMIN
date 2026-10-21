import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AlertCircle,
  Plus,
  Send,
  Camera,
  CheckCircle2,
  Search,
  Trash2,
  Edit3,
  X,
  ZoomIn,
  ShieldAlert,
  Flame,
  User,
  Layers,
  Calendar,
  Check
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  HANUL_PROCESSES,
  HANUL_DEFECT_TYPES,
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  saveHanulQualityIssue,
  resolveHanulQualityIssue,
  deleteHanulQualityIssue
} from "../../services/hanulQualityIssueService";
import {
  MACHINING_QUALITY_PROJECTS,
  MACHINING_DEFECT_TYPES,
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  saveMachiningQualityIssue,
  resolveMachiningQualityIssue,
  deleteMachiningQualityIssue
} from "../../services/machiningQualityIssueService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

const ORYUK_PROCESSES = [
  ...MACHINING_QUALITY_PROJECTS,
  { id: "ext_line", name: "압출/성형 라인", badge: "압출", color: "teal" },
  { id: "sam_all", name: "삼랑진공장 (전체)", badge: "전체", color: "blue" }
];

const JOYOUNG_PROCESSES = [
  { id: "hal_all", name: "한림공장 (전체)", badge: "전체", color: "blue" },
  { id: "joyoung_common", name: "한림공장 조영 (공통)", badge: "조영", color: "purple" },
  { id: "9bqc", name: "9BQC (G/RUN)", badge: "9BQC", color: "indigo" },
  { id: "lq2", name: "LQ2 (Hood Side)", badge: "LQ2", color: "purple" },
  { id: "lq2a", name: "LQ2a (Hood Side)", badge: "LQ2a", color: "pink" },
  { id: "burim", name: "부림텍 외주가공", badge: "부림텍", color: "emerald" }
];

// Client-side image compression
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: ((dataUrl.length * 0.75) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
      img.onerror = () => {
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          dataUrl: event.target.result
        });
      };
    };
  });
};

export const HanulQualityIssueModal = ({ isOpen, onClose }) => {
  const { currentProfile } = useAuth();

  // 🌟 접속 관리자별 등록 모드 자동 판별 (오륙: 이창엽·윤경수 / 조영: 김동욱 / 한울: 한울)
  const isOryukManager = Boolean(
    currentProfile?.name === "이창엽" ||
    currentProfile?.id === "sam_cy" ||
    currentProfile?.name === "윤경수" ||
    currentProfile?.id === "sam_ks"
  );
  const isJoyoungManager = Boolean(
    currentProfile?.name === "김동욱" ||
    currentProfile?.id === "hal_dw"
  );
  // 🌟 한울, 이창엽, 윤경수의 부적합경보등록 화면에서는 [첫화면 전사등록] 뱃지 생성 (김동욱 제외 또는 한울·이창엽·윤경수 전용)
  const canBroadcastToFirstScreen = !isJoyoungManager;

  const companyLabel = isOryukManager ? "오륙" : isJoyoungManager ? "조영" : "한울";
  const headerBadgeLabel = isOryukManager
    ? "(주)오륙 삼랑진공장 전담"
    : isJoyoungManager
    ? "(주)조영 한림공장 전담"
    : "한울 외주가공 전담";
  const processOptions = isOryukManager
    ? ORYUK_PROCESSES
    : isJoyoungManager
    ? JOYOUNG_PROCESSES
    : HANUL_PROCESSES;
  const defectOptions = isOryukManager ? MACHINING_DEFECT_TYPES : HANUL_DEFECT_TYPES;
  const defaultLineName = processOptions[0]?.name || "9BQC (G/RUN)";

  const [issues, setIssues] = useState(() =>
    isOryukManager ? getLocalMachiningQualityIssues() : getLocalHanulQualityIssues()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingCauseImages, setIsProcessingCauseImages] = useState(false);
  const [isProcessingActionImages, setIsProcessingActionImages] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [detailModalIssue, setDetailModalIssue] = useState(null);

  // Edit Mode State
  const [editingIssueId, setEditingIssueId] = useState(null);

  // Filter States
  const [selectedLineFilter, setSelectedLineFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ALL", "ACTIVE", "RESOLVED"
  const [searchQuery, setSearchQuery] = useState("");

  // Form State: 발생원인 사진(causeImages)과 조치결과 사진(actionImages) 분리 및 등록일자(date), 첫화면 전사등록(isFirstScreenBroadcast) 명시
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: todayStr,
    createdAt: undefined,
    line: defaultLineName,
    defectType: "외관 스크래치 / 찍힘",
    title: "",
    content: "",
    actionResult: "",
    causeImages: [],
    actionImages: [],
    isFirstScreenBroadcast: false
  });

  // Reset default line when manager profile changes
  useEffect(() => {
    if (!editingIssueId) {
      setForm((prev) => ({
        ...prev,
        line: defaultLineName
      }));
    }
  }, [defaultLineName, editingIssueId]);

  const causeFileInputRef = useRef(null);
  const actionFileInputRef = useRef(null);
  const modalBodyRef = useRef(null);

  // Real-time Cloud Sync (오륙: machiningQualityIssues / 한울·조영: hanulQualityIssues)
  useEffect(() => {
    if (isOryukManager) {
      setIssues(getLocalMachiningQualityIssues());
      const unsub = subscribeMachiningQualityIssues((list) => {
        setIssues(list);
      });
      return () => unsub();
    } else {
      setIssues(getLocalHanulQualityIssues());
      const unsub = subscribeHanulQualityIssues((list) => {
        setIssues(list);
      });
      return () => unsub();
    }
  }, [isOryukManager]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (detailModalIssue) {
          setDetailModalIssue(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, detailModalIssue, onClose]);

  // Image Upload Handlers for 발생원인 사진
  const handleCauseImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingCauseImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingCauseImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        causeImages: [...(prev.causeImages || []), ...processed].slice(0, 8)
      }));
    } catch (err) {
      console.error("Cause image upload error:", err);
      alert("발생원인 사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingCauseImages(false);
    }
  };

  const handleRemoveCauseImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      causeImages: (prev.causeImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Image Upload Handlers for 조치결과 사진
  const handleActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingActionImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...processed].slice(0, 8)
      }));
    } catch (err) {
      console.error("Action image upload error:", err);
      alert("조치결과 사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveActionImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Submit Form (Register or Update Issue) with explicit broadcast mode ('GLOBAL' = 전사부적합등록, 'SITE_ONLY' = 현장내전파등록)
  const handleRegisterWithMode = async (mode) => {
    if (!form.title.trim()) {
      alert("품질경보 제목(불량 현상)을 입력해 주세요.");
      return;
    }
    if (!form.content.trim()) {
      alert("세부 불량 내용 및 발생 원인을 입력해 주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const authorName = currentProfile?.name || companyLabel;
      const authorTitle = currentProfile?.title || "책임";
      const isBroadcast = mode === "GLOBAL";

      const payload = {
        ...form,
        company: companyLabel,
        plant: isOryukManager ? "삼랑진공장" : "한림공장",
        author: authorName,
        authorTitle,
        status: "ACTIVE",
        broadcastScope: isBroadcast ? "GLOBAL" : "SITE_ONLY",
        isFirstScreenBroadcast: isBroadcast,
        isFirstScreenOrigin: isBroadcast
      };

      if (editingIssueId) {
        payload.id = editingIssueId;
      }

      if (isOryukManager) {
        await saveMachiningQualityIssue(payload);
      } else {
        await saveHanulQualityIssue(payload);
      }

      // Reset form
      setForm({
        date: todayStr,
        createdAt: undefined,
        line: defaultLineName,
        defectType: "외관 스크래치 / 찍힘",
        title: "",
        content: "",
        actionResult: "",
        causeImages: [],
        actionImages: [],
        isFirstScreenBroadcast: false
      });

      const isEdit = Boolean(editingIssueId);
      setEditingIssueId(null);

      alert(
        isEdit
          ? `🎉 ${companyLabel} 부적합경보가 성공적으로 수정되었습니다.`
          : isBroadcast
          ? `🌐 [전사부적합등록 완료] 첫화면 부적합품 경보 게시 및 현장 작업자 접속 팝업에 동시 전파되었습니다!`
          : `📢 [현장내전파등록 완료] 현장 작업자 접속 팝업에 전파되었으며 아래 현장내전파 목록표에 등록되었습니다! (첫화면 미게시)`
      );
    } catch (err) {
      console.error("Submit error:", err);
      alert("부적합경보 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegisterWithMode(form.isFirstScreenBroadcast ? "GLOBAL" : "SITE_ONLY");
  };

  // Load Issue into form for editing
  const handleEdit = (issue) => {
    setEditingIssueId(issue.id);
    const causeImgs = Array.isArray(issue.causeImages)
      ? [...issue.causeImages]
      : Array.isArray(issue.images)
      ? [...issue.images]
      : [];
    const actionImgs = Array.isArray(issue.actionImages) ? [...issue.actionImages] : [];

    const issueDate = issue.date || (issue.createdAt ? issue.createdAt.slice(0, 10) : todayStr);

    setForm({
      date: issueDate,
      createdAt: issue.createdAt,
      line: issue.line || defaultLineName,
      defectType: issue.defectType || "외관 스크래치 / 찍힘",
      title: issue.title || "",
      content: issue.content || "",
      actionResult: issue.actionResult || issue.actionGuide || issue.resolutionNote || "",
      causeImages: causeImgs,
      actionImages: actionImgs,
      isFirstScreenBroadcast: Boolean(issue.isFirstScreenBroadcast)
    });

    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Resolve Issue
  const handleResolve = async (issue) => {
    const defaultNote = issue.actionResult || "공정 작업 표준 재준수 및 초물 전수검사 합격 확인";
    const note = window.prompt("조치결과 및 완료 내용을 입력해 주세요:", defaultNote);
    if (note === null) return;

    try {
      if (isOryukManager) {
        await resolveMachiningQualityIssue(issue.id, note, currentProfile?.name || companyLabel);
      } else {
        await resolveHanulQualityIssue(issue.id, note, currentProfile?.name || companyLabel);
      }
      alert(`✅ ${companyLabel} 부적합경보가 [조치 완료] 처리되었습니다.`);
    } catch (err) {
      console.error("Resolve error:", err);
      alert("조치 완료 처리 중 오류가 발생했습니다.");
    }
  };

  // Delete Issue
  const handleDelete = async (id) => {
    if (!window.confirm("이 품질경보를 삭제하시겠습니까?")) return;
    try {
      if (isOryukManager) {
        await deleteMachiningQualityIssue(id);
      } else {
        await deleteHanulQualityIssue(id);
      }
      if (editingIssueId === id) {
        setEditingIssueId(null);
      }
      if (detailModalIssue?.id === id) {
        setDetailModalIssue(null);
      }
      alert("품질경보가 삭제되었습니다.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 🌟 아래 목록표는 '현장내전파등록'(isFirstScreenBroadcast !== true && isFirstScreenOrigin !== true)에 한해 목록화
  const siteOnlyIssues = useMemo(() => {
    return issues.filter(
      (it) => it && !it.isFirstScreenBroadcast && !it.isFirstScreenOrigin
    );
  }, [issues]);

  // Filtered Issues (현장내전파등록 항목만 대상)
  const filteredIssues = useMemo(() => {
    return siteOnlyIssues.filter((it) => {
      if (!it) return false;

      // Status filter
      if (selectedStatusFilter !== "ALL") {
        if (it.status !== selectedStatusFilter) return false;
      }

      // Line filter
      if (selectedLineFilter !== "all") {
        if (
          it.line !== selectedLineFilter &&
          it.line !== "한울 가공·조립 (공통)" &&
          it.line !== "한림공장 (전체)" &&
          it.line !== "가공동 (공통)" &&
          it.line !== "삼랑진공장 (전체)" &&
          it.line !== "한림공장 조영 (공통)"
        ) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionText = it.actionResult || it.actionGuide || it.resolutionNote || "";
        const match =
          (it.title || "").toLowerCase().includes(q) ||
          (it.line || "").toLowerCase().includes(q) ||
          (it.content || "").toLowerCase().includes(q) ||
          (it.defectType || "").toLowerCase().includes(q) ||
          actionText.toLowerCase().includes(q) ||
          (it.author || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [siteOnlyIssues, selectedStatusFilter, selectedLineFilter, searchQuery]);

  // Summary Metrics (현장내전파등록 항목 기준)
  const stats = useMemo(() => {
    const total = siteOnlyIssues.length;
    const active = siteOnlyIssues.filter((it) => it.status === "ACTIVE").length;
    const resolved = siteOnlyIssues.filter((it) => it.status === "RESOLVED").length;
    return { total, active, resolved };
  }, [siteOnlyIssues]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-indigo-500/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden cursor-default animate-scaleUp text-slate-900 dark:text-white"
      >
        {/* ========================================================================= */}
        {/* 1. Modal Header Banner */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4.5 border-b border-purple-500/40 shadow-sm flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {companyLabel} 부적합경보 등록
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-2xs">
                  {headerBadgeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick KPI Badges */}
            <div className="hidden md:flex items-center gap-1.5">
              <div className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/60 text-center">
                <span className="text-[9.5px] font-bold text-rose-300 block">🚨 진행중</span>
                <span className="font-mono font-black text-rose-400 text-xs">{stats.active}건</span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-center">
                <span className="text-[9.5px] font-bold text-emerald-300 block">✅ 조치완료</span>
                <span className="font-mono font-black text-emerald-400 text-xs">{stats.resolved}건</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar">
          {/* Mobile KPI Summary */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">🚨 진행중</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">{stats.active}건</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">✅ 조치완료</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{stats.resolved}건</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">전체</span>
              <span className="font-mono font-black text-slate-700 dark:text-slate-200 text-sm">{stats.total}건</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. Top Section: Quality Issue Registration Panel (압출동과 100% 동일) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${editingIssueId ? "bg-teal-600" : "bg-rose-600"} text-white shadow-xs`}>
                  {editingIssueId ? <Edit3 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {editingIssueId ? `${companyLabel} 부적합경보 수정` : `${companyLabel} 부적합경보 등록 및 현장전파`}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {editingIssueId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIssueId(null);
                      setForm({
                        date: todayStr,
                        createdAt: undefined,
                        line: defaultLineName,
                        defectType: "외관 스크래치 / 찍힘",
                        title: "",
                        content: "",
                        actionResult: "",
                        causeImages: [],
                        actionImages: [],
                        isFirstScreenBroadcast: false
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    수정 취소
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: 발생일자(등록일) & 대상 공정 & 불량 유형 (3열 그리드) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 발생일자 (등록일) */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>발생일자 (등록일)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date || todayStr}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* 대상 공정 */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    대상 공정 / 품목 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.line}
                    onChange={(e) => setForm({ ...form, line: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  >
                    {processOptions.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 불량 유형 */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    불량 유형 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.defectType}
                    onChange={(e) => setForm({ ...form, defectType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  >
                    {defectOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: 품질경보 제목 */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  품질경보 제목 (불량 현상 핵심 요약) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 9BQC G/RUN 조립부 테이프 접착 들뜸 및 외관 스크래치 발생"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Row 3: 발생원인 영역 & 조치결과 영역 (각각 촬영 버튼 및 미리보기 분리) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1) 발생원인 내용 및 발생원인 사진 촬영 */}
                <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      <span>1. 세부 불량 현상 및 발생 원인</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10.5px] text-rose-600/80 font-bold">
                      원인 사진: {form.causeImages?.length || 0}/8장
                    </span>
                  </div>

                  <textarea
                    rows="3"
                    required
                    placeholder="구체적인 불량 현상, 발생 부위 및 추정 원인을 작성해 주세요."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-rose-500/20"
                  ></textarea>

                  {/* 발생원인 전용 사진 첨부 input & button */}
                  <input
                    ref={causeFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleCauseImageFiles(e.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => causeFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-rose-400 dark:border-rose-700 bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-center cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-950/40 transition-all flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="font-black text-rose-700 dark:text-rose-300 text-xs">
                      {isProcessingCauseImages ? "사진 압축 처리 중..." : "📷 발생원인 사진 촬영 또는 사진선택"}
                    </span>
                  </button>

                  {/* 발생원인 사진 썸네일 */}
                  {form.causeImages && form.causeImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                      {form.causeImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 aspect-square bg-slate-100 dark:bg-slate-800"
                        >
                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage({ url: img.dataUrl, name: img.name });
                              }}
                              className="p-1 rounded bg-white text-slate-900 cursor-pointer"
                              title="확대보기"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCauseImage(idx);
                              }}
                              className="p-1 rounded bg-rose-600 text-white cursor-pointer"
                              title="삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2) 조치결과 내용 및 조치결과 사진 촬영 */}
                <div className="p-3.5 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border-2 border-teal-200 dark:border-teal-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      <span>2. 조치결과 (현장 조치 및 개선 내용)</span>
                    </label>
                    <span className="text-[10.5px] text-teal-600/80 font-bold">
                      조치 사진: {form.actionImages?.length || 0}/8장
                    </span>
                  </div>

                  <textarea
                    rows="3"
                    placeholder="예: 조립 가이드 위치 교정 완료, 테이프 압착 압력 강화 및 초물 전수검사 합격 확인"
                    value={form.actionResult}
                    onChange={(e) => setForm({ ...form, actionResult: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-teal-500/20"
                  ></textarea>

                  {/* 조치결과 전용 사진 첨부 input & button */}
                  <input
                    ref={actionFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleActionImageFiles(e.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => actionFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-center cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-950/40 transition-all flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span className="font-black text-teal-700 dark:text-teal-300 text-xs">
                      {isProcessingActionImages ? "사진 압축 처리 중..." : "📷 조치결과 사진 촬영 또는 사진선택"}
                    </span>
                  </button>

                  {/* 조치결과 사진 썸네일 */}
                  {form.actionImages && form.actionImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                      {form.actionImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl overflow-hidden border border-teal-300 dark:border-teal-800 aspect-square bg-slate-100 dark:bg-slate-800"
                        >
                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage({ url: img.dataUrl, name: img.name });
                              }}
                              className="p-1 rounded bg-white text-slate-900 cursor-pointer"
                              title="확대보기"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveActionImage(idx);
                              }}
                              className="p-1 rounded bg-rose-600 text-white cursor-pointer"
                              title="삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Badges (2개 등록뱃지: 전사부적합등록 / 현장내전파등록) */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    등록자: <strong>{currentProfile?.name || "한울"} {currentProfile?.title || "사원"}</strong>
                  </span>
                </span>

                <div className="flex items-center gap-2.5 flex-wrap justify-end">
                  {/* 1. 전사부적합등록 뱃지 */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRegisterWithMode("GLOBAL")}
                    className="px-4 sm:px-5 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 border border-amber-300/60 shadow-rose-600/25 disabled:opacity-50"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-200" />
                    <span>{editingIssueId ? "전사부적합 수정등록" : "전사부적합등록"}</span>
                  </button>

                  {/* 2. 현장내전파등록 뱃지 */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRegisterWithMode("SITE_ONLY")}
                    className="px-4 sm:px-5 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/50 shadow-indigo-600/25 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-cyan-200" />
                    <span>{editingIssueId ? "현장내전파 수정등록" : "현장내전파등록"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ========================================================================= */}
          {/* 3. Bottom Section: 1-Line Table View (현장내전파등록 전용 목록표) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {companyLabel} 현장내전파 목록 ({filteredIssues.length}건)
                  </h3>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="제목, 공정, 불량유형, 조치결과 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: "ACTIVE", label: "🚨 진행중 (조치중)" },
                  { id: "RESOLVED", label: "✅ 조치완료" },
                  { id: "ALL", label: "전체보기" }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedStatusFilter === st.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Process Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">공정:</span>
                <select
                  value={selectedLineFilter}
                  onChange={(e) => setSelectedLineFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                >
                  <option value="all">전체 공정</option>
                  {processOptions.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1-Line Table Container */}
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>해당 조건의 {companyLabel} 부적합경보가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black text-[11px]">
                      <th className="py-2.5 px-3 text-center w-16">상태</th>
                      <th className="py-2.5 px-2.5 text-center w-24">등록일자</th>
                      <th className="py-2.5 px-2.5 text-center w-28">공정/라인</th>
                      <th className="py-2.5 px-2.5 w-28">불량유형</th>
                      <th className="py-2.5 px-3 min-w-[220px]">품질이슈 제목 (불량 현상)</th>
                      <th className="py-2.5 px-3 min-w-[180px]">조치결과</th>
                      <th className="py-2.5 px-2 text-center min-w-[120px]">사진 (원인/조치)</th>
                      <th className="py-2.5 px-2.5 text-center w-20">등록자</th>
                      <th className="py-2.5 px-3 text-center w-28">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredIssues.map((issue) => {
                      const isResolved = issue.status === "RESOLVED";
                      const actionText = issue.actionResult || issue.actionGuide || issue.resolutionNote || "";
                      const causeImgs = Array.isArray(issue.causeImages)
                        ? issue.causeImages
                        : Array.isArray(issue.images)
                        ? issue.images
                        : [];
                      const actionImgs = Array.isArray(issue.actionImages) ? issue.actionImages : [];

                      return (
                        <tr
                          key={issue.id}
                          onClick={() => setDetailModalIssue(issue)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group ${
                            isResolved ? "opacity-75 bg-slate-50/30 dark:bg-slate-900/40" : ""
                          }`}
                        >
                          {/* 상태 */}
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isResolved
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 animate-pulse"
                              }`}
                            >
                              {isResolved ? "✓ 완료" : "● 진행"}
                            </span>
                          </td>

                          {/* 등록일자 */}
                          <td className="py-2 px-2.5 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <Calendar className="w-3 h-3 text-rose-500" />
                              <span>{issue.date || issue.createdAt?.slice(0, 10)}</span>
                            </span>
                          </td>

                          {/* 라인/공정 */}
                          <td className="py-2 px-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {issue.line}
                            </span>
                          </td>

                          {/* 불량유형 */}
                          <td className="py-2 px-2.5 font-bold text-rose-700 dark:text-rose-300">
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10.5px]">
                              {issue.defectType}
                            </span>
                          </td>

                          {/* 제목 */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5 max-w-[260px] sm:max-w-[340px]">
                              {issue.isFirstScreenBroadcast && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-gradient-to-r from-rose-600 to-amber-500 text-white shrink-0 shadow-2xs">
                                  🌐 첫화면 전사등록
                                </span>
                              )}
                              <span className="font-bold text-slate-900 dark:text-white truncate" title={issue.title}>
                                {issue.title}
                              </span>
                            </div>
                          </td>

                          {/* 조치결과 */}
                          <td className="py-2 px-3">
                            <div
                              className={`max-w-[200px] sm:max-w-[260px] truncate text-[11px] ${
                                actionText ? "text-teal-700 dark:text-teal-300 font-medium" : "text-slate-400 italic"
                              }`}
                              title={actionText || "조치 내용 없음"}
                            >
                              {actionText || "-"}
                            </div>
                          </td>

                          {/* 사진 (원인/조치 분리 표시) */}
                          <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {causeImgs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: causeImgs[0].dataUrl || causeImgs[0].url, name: `[원인] ${causeImgs[0].name || "원인 사진"}` })}
                                  className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                  title="발생원인 사진 확대보기"
                                >
                                  <Camera className="w-2.5 h-2.5" />
                                  <span>원인 {causeImgs.length}</span>
                                </button>
                              )}
                              {actionImgs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: actionImgs[0].dataUrl || actionImgs[0].url, name: `[조치] ${actionImgs[0].name || "조치 사진"}` })}
                                  className="px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-[10px] hover:bg-teal-100 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                  title="조치결과 사진 확대보기"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>조치 {actionImgs.length}</span>
                                </button>
                              )}
                              {causeImgs.length === 0 && actionImgs.length === 0 && (
                                <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>
                              )}
                            </div>
                          </td>

                          {/* 등록자 */}
                          <td className="py-2 px-2.5 text-center text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            {issue.author || "한울"}
                          </td>

                          {/* 관리 버튼 */}
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {!isResolved && (
                                <button
                                  type="button"
                                  onClick={() => handleResolve(issue)}
                                  className="px-2 py-0.8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] shadow-2xs flex items-center gap-0.5 cursor-pointer"
                                  title="조치 완료 처리"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>조치</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEdit(issue)}
                                className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(issue.id)}
                                className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Detail Modal (When user clicks a 1-line item) */}
      {/* ========================================================================= */}
      {detailModalIssue && (
        <div
          onClick={() => setDetailModalIssue(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-purple-500/40 shadow-2xl space-y-4 animate-scaleUp cursor-default text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    detailModalIssue.status === "RESOLVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}
                >
                  {detailModalIssue.status === "RESOLVED" ? "✓ 조치완료" : "● 진행중"}
                </span>
                <span className="font-bold text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  {detailModalIssue.line}
                </span>
                <span className="font-bold text-xs text-rose-600">
                  {detailModalIssue.defectType}
                </span>
                <span className="font-mono text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>등록일: {detailModalIssue.date || detailModalIssue.createdAt?.slice(0, 10)}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalIssue(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {detailModalIssue.title}
            </h3>

            {/* 1) 발생원인 내용 및 사진 */}
            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
              <span className="font-black text-rose-800 dark:text-rose-300 block text-[11.5px] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>1. 세부 불량 현상 및 발생 원인</span>
              </span>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                {detailModalIssue.content}
              </p>

              {/* 발생원인 사진 */}
              {(() => {
                const causeImgs = Array.isArray(detailModalIssue.causeImages)
                  ? detailModalIssue.causeImages
                  : Array.isArray(detailModalIssue.images)
                  ? detailModalIssue.images
                  : [];
                if (causeImgs.length === 0) return null;
                return (
                  <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40">
                    <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1.5 text-[10.5px]">
                      📸 발생원인 사진 ({causeImgs.length}장 - 클릭하여 확대)
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                      {causeImgs.map((img, i) => (
                        <div
                          key={img.id || i}
                          onClick={() => setPreviewImage({ url: img.dataUrl || img.url, name: `[원인] ${img.name || "원인 사진"}` })}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-300 dark:border-rose-700 cursor-pointer group shrink-0"
                        >
                          <img src={img.dataUrl || img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2) 조치결과 내용 및 사진 */}
            <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-2 text-xs">
              <span className="font-black text-teal-800 dark:text-teal-300 block text-[11.5px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>2. 조치결과 (현장 조치 및 개선 내용)</span>
              </span>
              <p className="whitespace-pre-wrap leading-relaxed text-teal-950 dark:text-teal-100 font-medium">
                {detailModalIssue.actionResult || detailModalIssue.actionGuide || detailModalIssue.resolutionNote || "등록된 조치결과가 없습니다."}
              </p>

              {/* 조치결과 사진 */}
              {(() => {
                const actionImgs = Array.isArray(detailModalIssue.actionImages) ? detailModalIssue.actionImages : [];
                if (actionImgs.length === 0) return null;
                return (
                  <div className="pt-1.5 border-t border-teal-200/60 dark:border-teal-900/40">
                    <span className="font-bold text-teal-700 dark:text-teal-300 block mb-1.5 text-[10.5px]">
                      📸 조치결과 사진 ({actionImgs.length}장 - 클릭하여 확대)
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                      {actionImgs.map((img, i) => (
                        <div
                          key={img.id || i}
                          onClick={() => setPreviewImage({ url: img.dataUrl || img.url, name: `[조치] ${img.name || "조치 사진"}` })}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-teal-300 dark:border-teal-700 cursor-pointer group shrink-0"
                        >
                          <img src={img.dataUrl || img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px] font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>등록일시: <strong>{detailModalIssue.date || detailModalIssue.createdAt?.slice(0, 10)}</strong> {detailModalIssue.time || ""} (작성: {detailModalIssue.author} {detailModalIssue.authorTitle || ""})</span>
              </span>

              <div className="flex items-center gap-1.5">
                {detailModalIssue.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleResolve(detailModalIssue);
                      setDetailModalIssue(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-xs"
                  >
                    ✓ 조치 완료 처리
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleEdit(detailModalIssue);
                    setDetailModalIssue(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
};
