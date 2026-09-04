import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileCheck2,
  FileSignature,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  Building2,
  Printer,
  ChevronRight,
  Trash2,
  Check,
  X,
  AlertCircle,
  FileText,
  DollarSign,
  Send,
  Stamp,
  PauseCircle,
  ShieldCheck,
  Crown,
  Lock,
  ArrowRight,
  Users,
  Image as ImageIcon,
  Camera,
  Eye,
  Download,
  ZoomIn,
  UploadCloud
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  saveApprovalDocument,
  approveDocumentStep,
  holdDocumentStep,
  rejectDocumentStep,
  deleteApprovalDocument,
  checkApprovalPermission,
  getAutoApprovalSteps,
  APPROVAL_MANAGERS
} from "../services/approvalService";

// Client-side instant image compression (keeps Firestore & storage fast & light)
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
          size: (dataUrl.length * (3 / 4) / 1024).toFixed(1) + " KB",
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

export const ElectronicApprovalView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [selectedTab, setSelectedTab] = useState("ALL"); // ALL, PENDING, HOLD, MY_DRAFTS, APPROVED, REJECTED
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("ALL");

  // Modals
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [actionType, setActionType] = useState("APPROVE"); // APPROVE, HOLD, REJECT
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, name }

  // Draft Images State
  const fileInputRef = useRef(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // All eligible workers for Drafter dropdown (전작업자 기안 가능)
  const allWorkers = useMemo(() => {
    const list = [];
    PLANTS.forEach((p) => {
      p.workers.forEach((w) => {
        list.push({ ...w, plantName: p.name });
      });
    });
    return list;
  }, []);

  // New Draft Form State (담당: 전작업자)
  const [draftForm, setDraftForm] = useState({
    type: "OVERTIME",
    typeName: "특근 신청서",
    plant: currentProfile?.plant || "삼랑진공장",
    department: currentProfile?.assignedProcess || "압출동 관리",
    drafter: currentProfile?.name || "방상국",
    drafterTitle: currentProfile?.title || "선임",
    leadName: "설유철", // Default Step 2 (책임)
    directorName: "이명재", // Step 3 (이사)
    ceoName: "대표이사", // Step 4 (대표)
    title: "",
    content: "",
    amount: "",
    images: []
  });

  // Real-time Cloud Synchronization
  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
      if (selectedDoc) {
        const found = docs.find((d) => d.id === selectedDoc.id);
        if (found) setSelectedDoc(found);
      }
    });
    return () => unsub();
  }, [selectedDoc?.id]);

  // Sync draft form with logged-in user
  useEffect(() => {
    if (currentProfile) {
      const p = currentProfile.plant || "삼랑진공장";
      const proc = currentProfile.assignedProcess || "압출동 관리";
      let autoLead = "설유철";
      if (p === "한림공장") {
        autoLead = "김동욱";
      } else {
        if (proc.includes("품질")) autoLead = "이창엽";
        else if (proc.includes("설비")) autoLead = "전재율";
        else if (proc.includes("가공")) autoLead = "윤경수";
        else autoLead = "설유철";
      }

      setDraftForm((prev) => ({
        ...prev,
        plant: p,
        department: proc,
        drafter: currentProfile.name || "작업자",
        drafterTitle: currentProfile.title || "선임",
        leadName: autoLead
      }));
    }
  }, [currentProfile]);

  // When plant/process changes in draft form, auto-suggest the responsible lead
  const handlePlantChange = (newPlant) => {
    let autoLead = newPlant === "한림공장" ? "김동욱" : "설유철";
    setDraftForm((prev) => ({
      ...prev,
      plant: newPlant,
      leadName: autoLead
    }));
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return approvalDocs.filter((doc) => {
      if (selectedPlant !== "ALL" && doc.plant !== selectedPlant) return false;

      if (selectedTab === "PENDING") {
        return doc.status === "IN_PROGRESS";
      }
      if (selectedTab === "HOLD") {
        return doc.status === "HOLD";
      }
      if (selectedTab === "MY_DRAFTS") {
        return doc.drafter === currentProfile?.name;
      }
      if (selectedTab === "APPROVED") {
        return doc.status === "APPROVED";
      }
      if (selectedTab === "REJECTED") {
        return doc.status === "REJECTED";
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.drafter.toLowerCase().includes(q) ||
          doc.docNumber.toLowerCase().includes(q) ||
          doc.content.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [approvalDocs, selectedTab, selectedPlant, searchQuery, currentProfile]);

  // Statistics
  const stats = useMemo(() => {
    const total = approvalDocs.length;
    const pending = approvalDocs.filter((d) => d.status === "IN_PROGRESS").length;
    const hold = approvalDocs.filter((d) => d.status === "HOLD").length;
    const approved = approvalDocs.filter((d) => d.status === "APPROVED").length;
    const rejected = approvalDocs.filter((d) => d.status === "REJECTED").length;
    const myDrafts = approvalDocs.filter((d) => d.drafter === currentProfile?.name).length;
    return { total, pending, hold, approved, rejected, myDrafts };
  }, [approvalDocs, currentProfile]);

  // Permission evaluation for currently opened document
  const currentPermission = useMemo(() => {
    return checkApprovalPermission(selectedDoc, currentProfile, isAdmin);
  }, [selectedDoc, currentProfile, isAdmin]);

  // Image upload and drag handlers for draft form
  const handleImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setDraftForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 10)
      }));
    } catch (err) {
      console.error("Image processing error:", err);
      alert("사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleImageDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveDraftImage = (idx) => {
    setDraftForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  // Handle Save Draft (전작업자 작성 가능)
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!draftForm.title.trim()) {
      alert("문서 제목을 입력해 주세요.");
      return;
    }
    if (!draftForm.content.trim()) {
      alert("기안 상세 내용을 입력해 주세요.");
      return;
    }

    const steps = getAutoApprovalSteps(
      draftForm.plant,
      draftForm.drafter,
      draftForm.drafterTitle,
      draftForm.department,
      draftForm.leadName
    );

    await saveApprovalDocument({
      ...draftForm,
      steps,
      status: "IN_PROGRESS"
    });

    setIsDraftModalOpen(false);
    setDraftForm({
      type: "OVERTIME",
      typeName: "특근 신청서",
      plant: currentProfile?.plant || "삼랑진공장",
      department: currentProfile?.assignedProcess || "압출동 관리",
      drafter: currentProfile?.name || "방상국",
      drafterTitle: currentProfile?.title || "선임",
      leadName: "설유철",
      directorName: "이명재",
      ceoName: "대표이사",
      title: "",
      content: "",
      amount: "",
      images: []
    });
    alert("결재 기안서(사진 첨부 포함)가 성공적으로 상신되었습니다.");
  };

  // Handle Approve Step (직급/대표 권한 체크)
  const handleApprove = async () => {
    if (!selectedDoc) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "결재 권한이 없습니다.");
      return;
    }

    const approverName = currentPermission.approverName || currentProfile?.name || (isAdmin ? "대표이사" : "결재자");
    const updated = await approveDocumentStep(
      selectedDoc.id,
      currentPermission.stepIndex,
      approverName,
      approvalComment || (isAdmin ? "대표이사 최종 승인" : "승인")
    );

    setSelectedDoc(updated);
    setApprovalComment("");
    setActionType("APPROVE");
    alert(`[${approverName}] 전자 인장 날인 및 결재 승인이 완료되었습니다.`);
  };

  // Handle Hold Step (보류)
  const handleHold = async () => {
    if (!selectedDoc) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "보류 권한이 없습니다.");
      return;
    }
    if (!holdReason.trim()) {
      alert("보류 사유를 입력해 주세요.");
      return;
    }

    const holderName = currentPermission.approverName || currentProfile?.name || (isAdmin ? "대표이사" : "결재자");
    const updated = await holdDocumentStep(
      selectedDoc.id,
      currentPermission.stepIndex,
      holderName,
      holdReason
    );

    setSelectedDoc(updated);
    setHoldReason("");
    setActionType("APPROVE");
    alert("문서가 [보류] 처리되었습니다.");
  };

  // Handle Reject Step (반려)
  const handleReject = async () => {
    if (!selectedDoc) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "반려 권한이 없습니다.");
      return;
    }
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해 주세요.");
      return;
    }

    const rejectorName = currentPermission.approverName || currentProfile?.name || (isAdmin ? "대표이사" : "결재자");
    const updated = await rejectDocumentStep(
      selectedDoc.id,
      currentPermission.stepIndex,
      rejectorName,
      rejectReason
    );

    setSelectedDoc(updated);
    setRejectReason("");
    setActionType("APPROVE");
    alert("문서가 [반려] 처리되었습니다.");
  };

  // Delete Document
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("이 결재 문서를 완전히 삭제하시겠습니까?")) {
      const updated = await deleteApprovalDocument(id);
      setApprovalDocs(updated);
      if (selectedDoc?.id === id) setSelectedDoc(null);
    }
  };

  const handleTemplateChange = (type) => {
    let typeName = "특근 신청서";
    let defaultTitle = "";
    let defaultContent = "";

    if (type === "OVERTIME") {
      typeName = "특근 신청서";
      defaultTitle = `${new Date().getMonth() + 1}월 주말 생산라인 특근 신청의 건`;
      defaultContent = "차종 긴급 납품 물량 대응을 위해 아래와 같이 특근을 신청하오니 재가 바랍니다.\n- 일시: 2026-09-06 (일) 08:00 ~ 17:00\n- 대상 공정: 압출 2호기 / 가공 라인\n- 인원: 4명";
    } else if (type === "LEAVE") {
      typeName = "연차/휴가 신청서";
      defaultTitle = `정기 연차 휴가 신청서 (${draftForm.drafter || "작업자"})`;
      defaultContent = "개인 사유로 인하여 아래와 같이 연차 휴가를 신청하오니 결재 바랍니다.\n- 신청기간: 2026-09-08 (1일간)\n- 사유: 개인 용무\n- 업무 인수인계: 정상 완료";
    } else if (type === "EXPENSE") {
      typeName = "설비부품/자재 품의서";
      defaultTitle = "설비 긴급 소모품 및 유지보수 자재 구매 품의 건";
      defaultContent = "설비 안정 가동을 위한 소모품 및 예비 부품 구매 품의입니다.\n- 품명: 고온 히터 센서 및 에어 실린더\n- 공급처: 지정 협력사\n- 소요예산: 아래 참조";
    } else {
      typeName = "일반 업무 기안서";
      defaultTitle = "공정 개선 및 작업 환경 정비 기안의 건";
      defaultContent = "생산성 향상 및 작업장 안전 확보를 위한 개선안을 상신하오니 검토 후 승인 바랍니다.";
    }

    setDraftForm((prev) => ({
      ...prev,
      type,
      typeName,
      title: defaultTitle,
      content: defaultContent
    }));
  };

  return (
    <div className="space-y-3.5 animate-fadeIn pb-16">
      {/* ========================================================================= */}
      {/* 1. Header & Quick Stat Bar */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <FileSignature className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  (주)오륙 스마트 전자결재 목록 현황
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3" />
                    <span>대표 결재 권한 활성</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                담당(전작업자) ➔ 책임(직급별) ➔ 이사(이명재) ➔ 대표(대표이사) 자동결재선 적용
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDraftModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ 새 결재 기안서 작성</span>
          </button>
        </div>

        {/* 5 KPI Summary Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div
            onClick={() => setSelectedTab("PENDING")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === "PENDING"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>미결 (결재대기)</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {stats.pending}건
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("HOLD")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === "HOLD"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5" />
                <span>보류 문서</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {stats.hold}건
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("APPROVED")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === "APPROVED"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>최종 승인 완료</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {stats.approved}건
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("REJECTED")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === "REJECTED"
                ? "bg-slate-200 dark:bg-slate-700 border-slate-400 ring-2 ring-slate-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>반려 문서</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 font-mono">
              {stats.rejected}건
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("ALL")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              selectedTab === "ALL"
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>전체 문서 목록</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
              {stats.total}건
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Filter Navigation & Plant Filter / Search */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `전체 목록 (${stats.total})` },
            { id: "PENDING", label: `🔴 미결/대기 (${stats.pending})`, highlight: stats.pending > 0 },
            { id: "HOLD", label: `⏸️ 보류 (${stats.hold})`, holdLight: stats.hold > 0 },
            { id: "APPROVED", label: `✓ 승인완료 (${stats.approved})` },
            { id: "MY_DRAFTS", label: `내 기안함 (${stats.myDrafts})` },
            { id: "REJECTED", label: `✕ 반려 (${stats.rejected})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 ${
                selectedTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : tab.highlight
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                  : tab.holdLight
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">전체 공장</option>
            <option value="삼랑진공장">삼랑진공장</option>
            <option value="한림공장">한림공장</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 기안자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 1-Line Row Approval Table List */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>해당 조건의 결재 문서가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3 w-28 whitespace-nowrap">문서번호</th>
                  <th className="py-3 px-2.5 w-24 whitespace-nowrap">양식구분</th>
                  <th className="py-3 px-2 w-20 whitespace-nowrap">공장</th>
                  <th className="py-3 px-3 min-w-[220px]">문서 제목</th>
                  <th className="py-3 px-2.5 w-28 whitespace-nowrap">기안자(담당)</th>
                  <th className="py-3 px-2.5 w-28 whitespace-nowrap">기안일시</th>
                  <th className="py-3 px-2.5 w-24 whitespace-nowrap">소요금액</th>
                  <th className="py-3 px-3 w-48 text-center whitespace-nowrap">결재선 (담당/책임/이사/대표)</th>
                  <th className="py-3 px-2.5 w-24 text-center whitespace-nowrap">문서상태</th>
                  <th className="py-3 px-3 w-20 text-center whitespace-nowrap">열람</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredDocs.map((doc) => {
                  const isPending = doc.status === "IN_PROGRESS";
                  const isHold = doc.status === "HOLD";
                  const isApproved = doc.status === "APPROVED";
                  const isRejected = doc.status === "REJECTED";

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isPending ? "bg-rose-50/20 dark:bg-rose-950/10" : isHold ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      {/* 1. 문서번호 */}
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        {doc.docNumber}
                      </td>

                      {/* 2. 양식구분 */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${
                          doc.type === "OVERTIME"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : doc.type === "LEAVE"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : doc.type === "EXPENSE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {doc.typeName}
                        </span>
                      </td>

                      {/* 3. 공장 */}
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap text-[11px]">
                        {doc.plant === "삼랑진공장" ? "삼랑진" : "한림"}
                      </td>

                      {/* 4. 문서 제목 */}
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white max-w-[340px] truncate">
                        <span className="hover:underline text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                      </td>

                      {/* 5. 기안자(담당: 전작업자) */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {doc.drafter} <span className="text-slate-400 font-normal">{doc.drafterTitle}</span>
                      </td>

                      {/* 6. 기안일시 */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap font-mono text-slate-500 text-[10.5px]">
                        {doc.createdAt?.slice(5)}
                      </td>

                      {/* 7. 소요금액 */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                        {doc.amount || "-"}
                      </td>

                      {/* 8. 4단계 결재선 도장 미니 배지 */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {doc.steps.map((st, idx) => (
                            <div
                              key={idx}
                              title={`[${st.role}] ${st.name} : ${st.status}`}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9.5px] font-black border transition-all ${
                                st.status === "APPROVED"
                                  ? "bg-emerald-500 text-white border-emerald-600"
                                  : st.status === "HOLD"
                                  ? "bg-amber-400 text-slate-950 border-amber-500 animate-pulse font-bold"
                                  : st.status === "REJECTED"
                                  ? "bg-rose-500 text-white border-rose-600"
                                  : st.status === "PENDING"
                                  ? "bg-rose-100 text-rose-800 border-rose-400 animate-pulse font-bold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {st.status === "APPROVED"
                                ? "인"
                                : st.status === "HOLD"
                                ? "류"
                                : st.status === "REJECTED"
                                ? "반"
                                : st.status === "PENDING"
                                ? "대"
                                : st.role?.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 9. 문서 상태 */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            ✓ 승인완료
                          </span>
                        ) : isHold ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                            ⏸️ 보류중
                          </span>
                        ) : isRejected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                            ✕ 반려됨
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center justify-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>미결({doc.steps.find((s) => s.status === "PENDING")?.role || "결재"})</span>
                          </span>
                        )}
                      </td>

                      {/* 10. 열람 버튼 */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-white dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all shadow-xs"
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. Official Document Detail & Approval Popup Dialog */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6">
            {/* Header Dialog Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Stamp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    (주)오륙 전자결재 기안문서
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    문서번호: {selectedDoc.docNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 hover:bg-slate-100"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>인쇄</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoc(null);
                    setActionType("APPROVE");
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-black text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official 4-Step Approval Seal Box */}
            <div className="flex justify-end">
              <div className="border-2 border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-5 text-center divide-x divide-slate-900 dark:divide-slate-600 font-bold bg-slate-100 dark:bg-slate-800">
                  <div className="p-1 w-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 font-black text-[11px]">
                    결<br />재
                  </div>
                  {selectedDoc.steps.map((st, idx) => (
                    <div key={idx} className="p-1 w-16 text-[11px] font-black">
                      {st.role}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-5 text-center divide-x divide-slate-900 dark:divide-slate-600 h-16 bg-white dark:bg-slate-900">
                  <div className="w-10 bg-slate-50 dark:bg-slate-800/50"></div>
                  {selectedDoc.steps.map((st, idx) => (
                    <div key={idx} className="w-16 flex flex-col items-center justify-center p-1 relative">
                      {st.status === "APPROVED" ? (
                        <div className="w-11 h-11 rounded-full border-2 border-rose-600 text-rose-600 flex flex-col items-center justify-center font-black leading-none transform rotate-[-6deg] shadow-xs">
                          <span className="text-[7.5px] font-bold">오륙</span>
                          <span className="text-[10.5px] font-black">{st.name?.slice(0, 3)}</span>
                          <span className="text-[7.5px]">승인</span>
                        </div>
                      ) : st.status === "HOLD" ? (
                        <div className="w-11 h-11 rounded-full border-2 border-amber-600 text-amber-600 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-4deg]">
                          <span>보류</span>
                          <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                        </div>
                      ) : st.status === "REJECTED" ? (
                        <div className="w-11 h-11 rounded-full border-2 border-slate-700 text-slate-700 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-6deg]">
                          <span>반려</span>
                          <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                        </div>
                      ) : st.status === "PENDING" ? (
                        <span className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 animate-pulse">
                          결재대기
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-5 text-center divide-x divide-slate-900 dark:divide-slate-600 text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono">
                  <div className="w-10">날짜</div>
                  {selectedDoc.steps.map((st, idx) => (
                    <div key={idx} className="w-16 p-0.5 truncate">
                      {st.date ? st.date.split(" ")[0].slice(5) : "-"}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Info Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="w-24 p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400">
                      기안 부서/공장
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {selectedDoc.plant} • {selectedDoc.department}
                    </td>
                    <td className="w-24 p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400">
                      기안자(담당)
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {selectedDoc.drafter} {selectedDoc.drafterTitle}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400">
                      기안 일시
                    </td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white font-mono">
                      {selectedDoc.createdAt}
                    </td>
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400">
                      소요 금액
                    </td>
                    <td className="p-2.5 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedDoc.amount || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400">
                      문서 제목
                    </td>
                    <td colSpan={3} className="p-2.5 font-black text-slate-900 dark:text-white text-sm">
                      [{selectedDoc.typeName}] {selectedDoc.title}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Content Body */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-black text-slate-500 block">
                [ 기안 상세 내용 ]
              </span>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                {selectedDoc.content}
              </p>
            </div>

            {/* Attached Photos View Section */}
            {selectedDoc.images && selectedDoc.images.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>첨부 사진 및 현장 증빙자료 ({selectedDoc.images.length}장)</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400">클릭하여 확대 및 다운로드</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedDoc.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진_${idx + 1}` })}
                      className="group cursor-pointer rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900 transition-all shadow-xs flex flex-col"
                    >
                      <div className="relative aspect-video sm:aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={img.dataUrl}
                          alt={img.name || `첨부사진 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-2 py-1 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1">
                            <ZoomIn className="w-3 h-3" />
                            <span>확대보기</span>
                          </span>
                        </div>
                      </div>
                      <div className="p-1.5 px-2 bg-white dark:bg-slate-900 text-[10px] flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                          {img.name || `사진 ${idx + 1}`}
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">{img.size || ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hold Reason Box */}
            {selectedDoc.holdReason && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-1">
                <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>결재 보류 사유</span>
                </span>
                <p className="text-amber-950 dark:text-amber-200 font-medium">
                  {selectedDoc.holdReason}
                </p>
              </div>
            )}

            {/* Rejection Notice */}
            {selectedDoc.rejectReason && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs space-y-1">
                <span className="font-black text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>반려 사유 안내</span>
                </span>
                <p className="text-rose-900 dark:text-rose-200 font-medium">
                  {selectedDoc.rejectReason}
                </p>
              </div>
            )}

            {/* Step Comments History */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500">결재 의견 및 결재 이력:</span>
              <div className="space-y-1">
                {selectedDoc.steps.filter((s) => s.date).map((st, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-bold">
                      [{st.role}] {st.name} {st.status === "APPROVED" ? "✓ 승인" : st.status === "HOLD" ? "⏸️ 보류" : "✕ 반려"} : {st.comment || "의견 없음"}
                    </span>
                    <span className="font-mono text-slate-400">{st.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Execution Controls */}
            {(selectedDoc.status === "IN_PROGRESS" || selectedDoc.status === "HOLD") && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Stamp className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isAdmin ? "대표이사 결재 승인 및 인장 날인" : "전자결재 처리 (승인/보류/반려)"}
                    </span>
                  </span>
                  <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                    현재 사용자: <strong>{isAdmin ? "대표이사(ADMIN)" : `${currentProfile?.name} (${currentProfile?.title || "작업자"})`}</strong>
                  </span>
                </div>

                {currentPermission.canApprove ? (
                  <>
                    {actionType === "APPROVE" && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="결재 의견 (예: 이상 없음 승인)"
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                        />

                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActionType("HOLD")}
                            className="px-3.5 py-2 rounded-xl border border-amber-400 text-amber-700 hover:bg-amber-50 text-xs font-bold transition-all"
                          >
                            ⏸️ 보류 처리
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionType("REJECT")}
                            className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                          >
                            ✕ 반려 처리
                          </button>
                          <button
                            type="button"
                            onClick={handleApprove}
                            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <Stamp className="w-3.5 h-3.5" />
                            <span>{isAdmin ? "👑 대표이사 최종 승인 및 날인" : "✓ 승인 및 도장 날인"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {actionType === "HOLD" && (
                      <div className="space-y-2">
                        <textarea
                          rows="2"
                          placeholder="보류 사유를 구체적으로 입력하세요 (추가 확인 사항 등)."
                          value={holdReason}
                          onChange={(e) => setHoldReason(e.target.value)}
                          className="w-full p-2.5 rounded-xl border-2 border-amber-300 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                        ></textarea>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActionType("APPROVE")}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleHold}
                            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
                          >
                            보류 확정
                          </button>
                        </div>
                      </div>
                    )}

                    {actionType === "REJECT" && (
                      <div className="space-y-2">
                        <textarea
                          rows="2"
                          placeholder="반려 사유를 구체적으로 작성해 주세요."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full p-2.5 rounded-xl border-2 border-rose-300 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                        ></textarea>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActionType("APPROVE")}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleReject}
                            className="px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-500/20"
                          >
                            반려 확정
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {currentPermission.reason}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        상위 결재자의 승인이 완료된 후 다음 단계 결재선으로 자동 인계됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {(isAdmin || selectedDoc.drafter === currentProfile?.name) && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(selectedDoc.id, e)}
                  className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>문서 삭제</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedDoc(null);
                  setActionType("APPROVE");
                }}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 ml-auto"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. New Draft Registration Modal (담당: 전작업자, 책임: 책임직급, 이사: 이명재, 대표: 대표이사) */}
      {/* ========================================================================= */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                  <FileSignature className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    새 전자결재 기안서 작성
                  </h3>
                  <p className="text-xs text-slate-400">
                    담당(전작업자) ➔ 책임(직급별) ➔ 이사(이명재) ➔ 대표(대표이사) 결재선
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">
                결재 양식 선택
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: "OVERTIME", label: "특근 신청서", icon: Clock },
                  { key: "LEAVE", label: "휴가/연차 신청", icon: Calendar },
                  { key: "EXPENSE", label: "자재/부품 품의", icon: DollarSign },
                  { key: "GENERAL", label: "일반 업무기안", icon: FileText }
                ].map((tmpl) => (
                  <button
                    type="button"
                    key={tmpl.key}
                    onClick={() => handleTemplateChange(tmpl.key)}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all flex flex-col items-center justify-center gap-1 ${
                      draftForm.type === tmpl.key
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <tmpl.icon className="w-4 h-4 text-emerald-600" />
                    <span>{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveDraft} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 소속 공장 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    소속 공장
                  </label>
                  <select
                    value={draftForm.plant}
                    onChange={(e) => handlePlantChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>

                {/* 1. 담당 (기안자: 전작업자 선택 가능) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    1. 담당 (기안자: 전작업자)
                  </label>
                  <select
                    value={draftForm.drafter}
                    onChange={(e) => {
                      const sel = allWorkers.find((w) => w.name === e.target.value);
                      setDraftForm({
                        ...draftForm,
                        drafter: e.target.value,
                        drafterTitle: sel?.title || "선임",
                        plant: sel?.plantName || draftForm.plant,
                        department: sel?.assignedProcess || draftForm.department
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {allWorkers.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name} ({w.title} • {w.plantName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 기안 제목 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  기안 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 9월 1주차 주말 생산라인 특근 신청의 건"
                  value={draftForm.title}
                  onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* 소요 금액 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  소요 금액 / 특근비 (선택 사항)
                </label>
                <input
                  type="text"
                  placeholder="예: ₩1,248,000 (해당사항 없을 시 비워둠)"
                  value={draftForm.amount}
                  onChange={(e) => setDraftForm({ ...draftForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* 상세 내용 */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  기안 상세 내용
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="구체적인 사유 및 내역을 입력해 주세요."
                  value={draftForm.content}
                  onChange={(e) => setDraftForm({ ...draftForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs"
                ></textarea>
              </div>

              {/* 사진 및 현장 증빙자료 첨부 (선택) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>사진 및 현장 증빙자료 첨부 (선택)</span>
                  </label>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    {draftForm.images?.length || 0}/10장 첨부됨
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragEnter={handleImageDrag}
                  onDragOver={handleImageDrag}
                  onDragLeave={handleImageDrag}
                  onDrop={handleImageDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    imageDragActive
                      ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01]"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 hover:border-emerald-400 hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    {isProcessingImages ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isProcessingImages ? "사진 압축 및 처리 중..." : "사진을 드래그하거나 클릭하여 첨부하세요"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      스마트폰 현장 사진, 영수증, 설비 고장/수리 부위 등 (JPG, PNG, WebP 지원)
                    </p>
                  </div>
                </div>

                {/* Attached Image Thumbnails */}
                {draftForm.images && draftForm.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {draftForm.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name || `첨부사진 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageModal({ url: img.dataUrl, name: img.name });
                            }}
                            className="p-1 rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow-xs"
                            title="크게보기"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDraftImage(idx);
                            }}
                            className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                            title="삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-slate-900/70 text-white text-[9px] truncate text-center font-mono">
                          {img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 자동 결재선 지정 (담당: 전작업자, 책임: 책임직급, 이사: 이명재, 대표: 대표이사) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>자동 결재선 지정 (직급 체계 준수)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">4단계 자동 배정</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* 1. 담당 */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <span className="text-[9.5px] font-bold text-slate-400 block">1. 담당 (기안자)</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs block truncate mt-0.5">
                      {draftForm.drafter} {draftForm.drafterTitle}
                    </strong>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">전작업자</span>
                  </div>

                  {/* 2. 책임 (선택 가능) */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20">
                    <span className="text-[9.5px] font-bold text-slate-400 block">2. 책임 (직급)</span>
                    <select
                      value={draftForm.leadName}
                      onChange={(e) => setDraftForm({ ...draftForm, leadName: e.target.value })}
                      className="w-full bg-transparent font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer mt-0.5"
                    >
                      {APPROVAL_MANAGERS.LEADS.filter((m) => draftForm.plant === "한림공장" ? m.plant === "한림공장" : m.plant === "삼랑진공장").map((m) => (
                        <option key={m.name} value={m.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                          {m.name} ({m.title})
                        </option>
                      ))}
                    </select>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">책임 직급</span>
                  </div>

                  {/* 3. 이사 */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <span className="text-[9.5px] font-bold text-slate-400 block">3. 이사 (임원)</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs block truncate mt-0.5">
                      이명재 이사
                    </strong>
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">총괄 이사</span>
                  </div>

                  {/* 4. 대표 */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <span className="text-[9.5px] font-bold text-slate-400 block">4. 대표 (CEO)</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs block truncate mt-0.5">
                      대표이사
                    </strong>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">ADMIN 승인</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>결재 상신 (기안 요청)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / High-Res Image Preview Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-800 text-white text-xs">
              <span className="font-bold truncate max-w-[240px] sm:max-w-md">{previewImageModal.name || "첨부 사진 확대"}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name || "첨부사진.jpg"}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span>다운로드</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1 text-slate-400 hover:text-white text-sm font-black"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.name}
                className="max-w-full max-h-[76vh] object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
