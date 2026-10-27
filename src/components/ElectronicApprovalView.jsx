import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
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
  APPROVAL_MANAGERS,
  isApprovalDocPending,
  isApprovalDocInProgress,
  isApprovalDocHold,
  isApprovalDocApproved,
  isApprovalDocRejected,
  isApprovalDocMyDraft,
  isOvertimeApprovalDoc,
  isGeneralApprovalDoc,
  isFourMApprovalDoc,
  getApprovalDocSortTimestamp
} from "../services/approvalService";
import { useModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";
import { ImagePreviewModal } from "./common/ImagePreviewModal";
import { ApprovalKPIHeader } from "./approval/ApprovalKPIHeader";
import { ApprovalDocTable, formatConciseApprovalTitle } from "./approval/ApprovalDocTable";
import { ApprovalDetailModal } from "./approval/ApprovalDetailModal";
import { ApprovalDraftModal } from "./approval/ApprovalDraftModal";

// Re-export formatConciseApprovalTitle for backward compatibility
export { formatConciseApprovalTitle };

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

export const ElectronicApprovalView = ({
  onNavigateTab = null,
  onBack = null
}) => {
  const { currentProfile, isAdmin } = useAuth();
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [docCategoryFilter, setDocCategoryFilter] = useState("ALL"); // ALL, OVERTIME, FOUR_M, GENERAL
  const [selectedTab, setSelectedTab] = useState(() => {
    try {
      const initTab = sessionStorage.getItem("approval_initial_tab");
      if (initTab) {
        sessionStorage.removeItem("approval_initial_tab");
        return initTab;
      }
    } catch (e) {}
    return "ALL";
  }); // ALL, PENDING, COMPANY_IN_PROGRESS, HOLD, MY_DRAFTS, APPROVED, REJECTED
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(() => {
    if (isAdmin || currentProfile?.role === "ADMIN" || currentProfile?.name === "권태형" || currentProfile?.name === "최미영") {
      return "ALL";
    }
    return currentProfile?.plant || "ALL";
  });

  // 사용자 전환(Admin <-> 공장총괄) 시 공장 선택 필터 자동 동기화
  useEffect(() => {
    if (isAdmin || currentProfile?.role === "ADMIN" || currentProfile?.name === "권태형" || currentProfile?.name === "최미영") {
      setSelectedPlant("ALL");
    } else if (currentProfile?.plant && (currentProfile.plant === "삼랑진공장" || currentProfile.plant === "한림공장")) {
      setSelectedPlant(currentProfile.plant);
    }
  }, [isAdmin, currentProfile?.name, currentProfile?.plant]);

  // Modals & Action States
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [actionType, setActionType] = useState("APPROVE"); // APPROVE, HOLD, REJECT
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, name }

  // Document Detail Modal Close Handler
  const handleCloseDocModal = () => {
    setSelectedDoc(null);
    setActionType("APPROVE");
    setApprovalComment("");
    sessionStorage.removeItem("approval_return_to_tab");
    localStorage.removeItem("approval_return_to_tab");
    sessionStorage.removeItem("approval_external_direct_open");
    localStorage.removeItem("approval_external_direct_open");
    localStorage.removeItem("active_approval_doc_id");
  };

  // Auto-close all modals on popstate (뒤로가기 시 팝업 닫기)
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      handleCloseDocModal();
      setIsDraftModalOpen(false);
      setEditingDocId(null);
      setPreviewImageModal(null);
    });
    return () => unsub();
  }, []);

  useModalHistory(Boolean(selectedDoc), () => {
    handleCloseDocModal();
  }, "approval_doc_detail");

  useModalHistory(Boolean(isDraftModalOpen), () => {
    setIsDraftModalOpen(false);
    setEditingDocId(null);
  }, "approval_draft");

  useModalHistory(Boolean(previewImageModal), () => {
    setPreviewImageModal(null);
  }, "approval_img_preview");

  // 기안서 수정 가능 여부 판단: 최종 승인(APPROVED)되지 않은 문서는 기안자(본인) 및 ADMIN이 수정 가능
  const canEditDoc = (doc) => {
    if (!doc || doc.status === "APPROVED") return false;
    return isAdmin || isApprovalDocMyDraft(doc, currentProfile, isAdmin);
  };

  const handleOpenDocModal = (doc) => {
    setSelectedDoc(doc);
  };

  const handleOpenDraftModal = () => {
    setEditingDocId(null);
    const defaultCeo = currentProfile?.name === "최미영" ? "최미영" : "권태형";
    let autoLead = (currentProfile?.plant === "한림공장") ? "김동욱" : "설유철";
    setDraftForm({
      type: "OVERTIME",
      typeName: "특근 신청서",
      plant: currentProfile?.plant || "삼랑진공장",
      department: currentProfile?.assignedProcess || "압출동 관리",
      drafter: currentProfile?.name || "작업자",
      drafterTitle: currentProfile?.title || "선임",
      leadName: autoLead,
      directorName: currentProfile?.plant === "한림공장" ? "이명재 / 최미영" : "이명재",
      ceoName: defaultCeo,
      title: "",
      content: "",
      amount: "",
      images: []
    });
    setIsDraftModalOpen(true);
  };

  // 기안서 수정 모달 열기
  const handleOpenEditModal = (doc, e) => {
    if (e) e.stopPropagation();
    if (!canEditDoc(doc)) {
      alert("결재 문서를 수정할 권한이 없거나 이미 최종 승인 완료된 문서입니다.");
      return;
    }

    const steps = Array.isArray(doc.steps) ? doc.steps : [];
    const leadStep = steps[1] || {};
    const directorStep = steps[2] || {};
    const ceoStep = steps[3] || {};

    setDraftForm({
      type: doc.type || "OVERTIME",
      typeName: doc.typeName || "특근 신청서",
      plant: doc.plant || currentProfile?.plant || "삼랑진공장",
      department: doc.department || currentProfile?.assignedProcess || "압출동 관리",
      drafter: doc.drafter || currentProfile?.name || "기안자",
      drafterTitle: doc.drafterTitle || currentProfile?.title || "선임",
      leadName: leadStep.name || (doc.plant === "한림공장" ? "김동욱" : "설유철"),
      directorName: directorStep.name || (doc.plant === "한림공장" ? "이명재 / 최미영" : "이명재"),
      ceoName: ceoStep.name || (currentProfile?.name === "최미영" ? "최미영" : "권태형"),
      title: doc.title || "",
      content: doc.content || "",
      amount: doc.amount || "",
      images: Array.isArray(doc.images) ? [...doc.images] : []
    });

    setEditingDocId(doc.id);
    setIsDraftModalOpen(true);
  };

  const handleOpenImagePreview = (img) => {
    setPreviewImageModal(img);
  };

  // Draft Images State
  const fileInputRef = useRef(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // All eligible workers and managers for Drafter dropdown
  const allWorkers = useMemo(() => {
    return APPROVAL_MANAGERS.DRAFTERS || [];
  }, []);

  // ADMIN Approver Selector State (권태형 대표이사 vs 최미영 전무)
  const [adminApprover, setAdminApprover] = useState(
    currentProfile?.name === "최미영" ? "최미영" : "권태형"
  );

  // New Draft Form State
  const defaultLeadName = ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"].includes(currentProfile?.name)
    ? currentProfile.name
    : (currentProfile?.plant === "한림공장" ? "김동욱" : "설유철");

  const [draftForm, setDraftForm] = useState({
    type: "OVERTIME",
    typeName: "특근 신청서",
    plant: currentProfile?.plant || "삼랑진공장",
    department: currentProfile?.assignedProcess || "압출동 관리",
    drafter: currentProfile?.name || "권태형",
    drafterTitle: currentProfile?.title || (currentProfile?.name === "권태형" ? "대표이사" : "선임"),
    leadName: defaultLeadName,
    directorName: "이명재",
    ceoName: currentProfile?.name === "최미영" ? "최미영" : "권태형",
    title: "",
    content: "",
    amount: "",
    images: []
  });

  const selectedDocRef = useRef(selectedDoc);
  useEffect(() => {
    selectedDocRef.current = selectedDoc;
  }, [selectedDoc]);

  // Real-time Cloud Synchronization
  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
      if (selectedDocRef.current) {
        const found = docs.find((d) => d.id === selectedDocRef.current.id);
        if (found && (found.updatedAt !== selectedDocRef.current.updatedAt || found.status !== selectedDocRef.current.status)) {
          setSelectedDoc(found);
        }
      } else {
        const activeDocId = localStorage.getItem("active_approval_doc_id");
        if (activeDocId) {
          const target = (docs || []).find((d) => d.id === activeDocId);
          if (target) {
            setSelectedDoc(target);
            localStorage.removeItem("active_approval_doc_id");
          }
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

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

      const defaultCeo = currentProfile.name === "최미영" ? "최미영" : "권태형";
      if (currentProfile.role === "ADMIN") {
        setAdminApprover(defaultCeo);
      }

      setDraftForm((prev) => ({
        ...prev,
        plant: p,
        department: proc,
        drafter: currentProfile.name || "작업자",
        drafterTitle: currentProfile.title || "선임",
        leadName: autoLead,
        ceoName: prev.ceoName || defaultCeo
      }));
    }
  }, [currentProfile]);

  const handlePlantChange = (newPlant) => {
    let autoLead = newPlant === "한림공장" ? "김동욱" : "설유철";
    setDraftForm((prev) => ({
      ...prev,
      plant: newPlant,
      leadName: autoLead
    }));
  };

  // Scoped documents according to selected category
  const categoryScopedDocs = useMemo(() => {
    if (docCategoryFilter === "OVERTIME") return approvalDocs.filter(isOvertimeApprovalDoc);
    if (docCategoryFilter === "FOUR_M") return approvalDocs.filter(isFourMApprovalDoc);
    if (docCategoryFilter === "GENERAL") return approvalDocs.filter(isGeneralApprovalDoc);
    return approvalDocs;
  }, [approvalDocs, docCategoryFilter]);

  // Statistics (unified with category and plant scope + 3-way badges)
  const stats = useMemo(() => {
    const plantScoped = categoryScopedDocs.filter((doc) => {
      if (!doc) return false;
      if (selectedPlant !== "ALL" && doc.plant && doc.plant !== selectedPlant && doc.plant !== "공통" && doc.plant !== "본사") {
        return false;
      }
      return true;
    });

    const total = plantScoped.length;
    const pending = plantScoped.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
    const companyInProgress = approvalDocs.filter(isApprovalDocInProgress).length;
    const hold = plantScoped.filter(isApprovalDocHold).length;
    const approved = plantScoped.filter((d) => isApprovalDocApproved(d, currentProfile, isAdmin)).length;
    const rejected = plantScoped.filter(isApprovalDocRejected).length;
    const myDrafts = plantScoped.filter((d) => isApprovalDocMyDraft(d, currentProfile, isAdmin)).length;

    // Sub-counts for Pending 3-way badges
    const overtimeList = approvalDocs.filter(isOvertimeApprovalDoc);
    const fourMList = approvalDocs.filter(isFourMApprovalDoc);
    const generalList = approvalDocs.filter(isGeneralApprovalDoc);
    const overtimePending = overtimeList.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
    const fourMPending = fourMList.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
    const generalPending = generalList.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;

    return {
      total,
      pending,
      companyInProgress,
      hold,
      approved,
      rejected,
      myDrafts,
      overtimePending,
      fourMPending,
      generalPending
    };
  }, [approvalDocs, categoryScopedDocs, selectedPlant, currentProfile, isAdmin]);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    const list = categoryScopedDocs.filter((doc) => {
      if (!doc) return false;

      // 1. Plant filter
      if (selectedPlant !== "ALL" && doc.plant && doc.plant !== selectedPlant && doc.plant !== "공통" && doc.plant !== "본사") {
        return false;
      }

      // 2. Tab filter
      if (selectedTab === "PENDING" && !isApprovalDocPending(doc, currentProfile, isAdmin)) return false;
      if (selectedTab === "COMPANY_IN_PROGRESS" && !isApprovalDocInProgress(doc)) return false;
      if (selectedTab === "HOLD" && !isApprovalDocHold(doc)) return false;
      if (selectedTab === "MY_DRAFTS" && !isApprovalDocMyDraft(doc, currentProfile, isAdmin)) return false;
      if (selectedTab === "APPROVED" && !isApprovalDocApproved(doc, currentProfile, isAdmin)) return false;
      if (selectedTab === "REJECTED" && !isApprovalDocRejected(doc)) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (doc.title || "").toLowerCase().includes(q) ||
          (doc.drafter || "").toLowerCase().includes(q) ||
          (doc.docNumber || "").toLowerCase().includes(q) ||
          (doc.content || "").toLowerCase().includes(q) ||
          (doc.typeName || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const tA = getApprovalDocSortTimestamp(a);
      const tB = getApprovalDocSortTimestamp(b);
      return tB - tA;
    });

    return list;
  }, [categoryScopedDocs, selectedTab, selectedPlant, searchQuery, currentProfile, isAdmin]);

  // Permission evaluation for currently opened document
  const currentPermission = useMemo(() => {
    return checkApprovalPermission(selectedDoc, currentProfile, isAdmin);
  }, [selectedDoc, currentProfile, isAdmin]);

  // Image upload and drag handlers
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

  // Handle Save Draft
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
      draftForm.leadName,
      draftForm.ceoName,
      draftForm.directorName,
      draftForm.type || draftForm.typeName || draftForm.category
    );

    const isEdit = Boolean(editingDocId);
    let docPayload = {
      ...draftForm,
      steps,
      status: "IN_PROGRESS",
      holdReason: "",
      rejectReason: ""
    };

    if (isEdit) {
      const existingDoc = approvalDocs.find((d) => d.id === editingDocId) || selectedDoc;
      docPayload.id = editingDocId;
      if (existingDoc) {
        docPayload.docNumber = existingDoc.docNumber;
        docPayload.createdAt = existingDoc.createdAt;
      }
    }

    const saved = await saveApprovalDocument(docPayload, {
      isDirectManualDraft: true,
      sendDraftTelegram: !isEdit
    });

    setApprovalDocs(getLocalApprovalDocs());

    if (selectedDoc && selectedDoc.id === editingDocId) {
      setSelectedDoc(saved);
    }

    setEditingDocId(null);
    setIsDraftModalOpen(false);

    const defaultCeo = currentProfile?.name === "최미영" ? "최미영" : "권태형";
    let autoLead = currentProfile?.plant === "한림공장" ? "김동욱" : "설유철";
    setDraftForm({
      type: "OVERTIME",
      typeName: "특근 신청서",
      plant: currentProfile?.plant || "삼랑진공장",
      department: currentProfile?.assignedProcess || "압출동 관리",
      drafter: currentProfile?.name || "작업자",
      drafterTitle: currentProfile?.title || "선임",
      leadName: autoLead,
      directorName: currentProfile?.plant === "한림공장" ? "이명재 / 최미영" : "이명재",
      ceoName: defaultCeo,
      title: "",
      content: "",
      amount: "",
      images: []
    });

    alert(isEdit ? "결재 기안서가 성공적으로 수정(재상신)되었습니다." : "결재 기안서(사진 첨부 포함)가 성공적으로 상신되었습니다.");
  };

  // Handle Approve Step
  const handleApprove = async () => {
    if (!selectedDoc) return;
    if (isProcessingAction) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "결재 권한이 없습니다.");
      return;
    }

    setIsProcessingAction(true);
    try {
      const approverName = isAdmin
        ? adminApprover
        : (currentPermission.approverName || currentProfile?.name || "결재자");

      const isRep = approverName === "권태형" || approverName === "최미영" || approverName === "대표이사";
      const totalSteps = selectedDoc?.steps?.length || 4;
      const isFinal = currentPermission.stepIndex >= totalSteps - 1;
      const defaultComment = isFinal
        ? (isAdmin ? `${approverName === "최미영" ? "전무" : "대표이사"} 최종 승인` : "최종 승인")
        : `${currentPermission.stepRole || "검토"} 승인`;

      const updated = await approveDocumentStep(
        selectedDoc.id,
        currentPermission.stepIndex,
        approverName,
        approvalComment || defaultComment,
        { isAdmin, isRepresentative: isRep, isBatchCompleteAll: false }
      );

      setSelectedDoc(updated);
      setApprovalDocs(getLocalApprovalDocs());
      setApprovalComment("");
      setActionType("APPROVE");

      if (updated.status === "APPROVED") {
        alert(`🎉 [${approverName}] 최종 승인 날인이 완료되었습니다. (서류가 결재완료 처리되었습니다.)`);
      } else {
        const nextStepIdx = currentPermission.stepIndex + 1;
        const nextStepObj = updated.steps && updated.steps[nextStepIdx];
        const nextStepName = nextStepObj?.name ? `${nextStepObj.name} ${nextStepObj.role}` : (nextStepObj?.role || "다음 결재자");
        alert(`[${approverName}] 전자 도장 날인 및 [${currentPermission.stepIndex + 1}/${totalSteps}단계] 승인이 완료되었습니다.\n다음 단계(${nextStepName})로 결재가 인계되었습니다.`);
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("결재 승인 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Batch Approve All Pending
  const handleBatchApprovePending = async () => {
    if (!isAdmin) {
      alert("일괄 결재 권한이 없습니다. (총괄관리자 ADMIN 전용)");
      return;
    }
    const pendingList = approvalDocs.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin));
    if (pendingList.length === 0) {
      alert("현재 결재 대기(미결) 중인 문서가 없습니다.");
      return;
    }

    if (
      !window.confirm(
        `현재 미결 상태인 결재 문서 ${pendingList.length}건을 [${adminApprover} ${adminApprover === "최미영" ? "전무" : "대표이사"}] 최종 결재(전결)로 일괄 승인 처리하시겠습니까?\n모든 결재선이 완료 처리되어 최종 결재완료 상태로 즉시 변경됩니다.`
      )
    ) {
      return;
    }

    setIsProcessingAction(true);
    try {
      for (const docItem of pendingList) {
        await approveDocumentStep(
          docItem.id,
          (docItem.steps?.length || 4) - 1,
          adminApprover,
          `${adminApprover === "최미영" ? "전무" : "대표이사"} 일괄 최종 승인`,
          { isAdmin: true, isRepresentative: true, isBatchCompleteAll: true }
        );
      }
      const refreshed = getLocalApprovalDocs();
      setApprovalDocs(refreshed);
      if (selectedDoc) {
        const found = refreshed.find((d) => d.id === selectedDoc.id);
        if (found) setSelectedDoc(found);
      }
      alert(`🎉 미결 문서 ${pendingList.length}건이 성공적으로 대표이사 최종 승인(결재완료) 처리되었습니다.`);
    } catch (err) {
      console.error("Batch approval error:", err);
      alert("일괄 결재 승인 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Hold Step
  const handleHold = async () => {
    if (!selectedDoc) return;
    if (isProcessingAction) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "보류 권한이 없습니다.");
      return;
    }
    if (!holdReason.trim()) {
      alert("보류 사유를 입력해 주세요.");
      return;
    }

    setIsProcessingAction(true);
    try {
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
    } catch (err) {
      console.error("Hold error:", err);
      alert("보류 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject Step
  const handleReject = async () => {
    if (!selectedDoc) return;
    if (isProcessingAction) return;
    if (!currentPermission.canApprove) {
      alert(currentPermission.reason || "반려 권한이 없습니다.");
      return;
    }
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해 주세요.");
      return;
    }

    setIsProcessingAction(true);
    try {
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
    } catch (err) {
      console.error("Reject error:", err);
      alert("반려 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Delete Document (Only ADMIN - Permanent Deletion)
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      alert("결재 문서 삭제 권한이 없습니다. (총괄관리자 ADMIN 전용)");
      return;
    }
    if (window.confirm("이 결재 문서를 영구 삭제하시겠습니까?\n삭제된 문서는 다시 복구되지 않으며 결재함에서 완전히 제거됩니다.")) {
      const updated = await deleteApprovalDocument(id);
      setApprovalDocs(updated);
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setActionType("APPROVE");
      }
      alert("결재 문서가 영구 삭제되었습니다.");
    }
  };

  // Template change handler
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
      {/* 1. Header, KPI & Filter Bar */}
      <ApprovalKPIHeader
        isAdmin={isAdmin}
        stats={stats}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        docCategoryFilter={docCategoryFilter}
        setDocCategoryFilter={setDocCategoryFilter}
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateTab={onNavigateTab}
        onBack={onBack}
        handleOpenDraftModal={handleOpenDraftModal}
        handleBatchApprovePending={handleBatchApprovePending}
      />

      {/* 2. Documents Table / Cards */}
      <ApprovalDocTable
        filteredDocs={filteredDocs}
        handleOpenDocModal={handleOpenDocModal}
        handleOpenEditModal={handleOpenEditModal}
        handleDelete={handleDelete}
        canEditDoc={canEditDoc}
        isAdmin={isAdmin}
        currentProfile={currentProfile}
        docCategoryFilter={docCategoryFilter}
        selectedTab={selectedTab}
        selectedPlant={selectedPlant}
        searchQuery={searchQuery}
        setDocCategoryFilter={setDocCategoryFilter}
        setSelectedTab={setSelectedTab}
        setSelectedPlant={setSelectedPlant}
        setSearchQuery={setSearchQuery}
      />

      {/* 3. Document Detail & Action Modal */}
      <ApprovalDetailModal
        selectedDoc={selectedDoc}
        handleCloseDocModal={handleCloseDocModal}
        currentPermission={currentPermission}
        isAdmin={isAdmin}
        adminApprover={adminApprover}
        setAdminApprover={setAdminApprover}
        currentProfile={currentProfile}
        handleApprove={handleApprove}
        handleHold={handleHold}
        handleReject={handleReject}
        handleDelete={handleDelete}
        handleOpenEditModal={handleOpenEditModal}
        canEditDoc={canEditDoc}
        approvalComment={approvalComment}
        setApprovalComment={setApprovalComment}
        holdReason={holdReason}
        setHoldReason={setHoldReason}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        actionType={actionType}
        setActionType={setActionType}
        handleOpenImagePreview={handleOpenImagePreview}
        isProcessingAction={isProcessingAction}
      />

      {/* 4. New Draft Registration / Edit Modal */}
      <ApprovalDraftModal
        isOpen={isDraftModalOpen}
        onClose={() => {
          setIsDraftModalOpen(false);
          setEditingDocId(null);
        }}
        editingDocId={editingDocId}
        draftForm={draftForm}
        setDraftForm={setDraftForm}
        allWorkers={allWorkers}
        handleTemplateChange={handleTemplateChange}
        handlePlantChange={handlePlantChange}
        handleSaveDraft={handleSaveDraft}
        fileInputRef={fileInputRef}
        handleImageFiles={handleImageFiles}
        handleImageDrag={handleImageDrag}
        handleImageDrop={handleImageDrop}
        imageDragActive={imageDragActive}
        isProcessingImages={isProcessingImages}
        handleRemoveDraftImage={handleRemoveDraftImage}
        setPreviewImageModal={setPreviewImageModal}
      />

      {/* 5. Lightbox Image Preview Modal */}
      {previewImageModal && (
        <ImagePreviewModal
          previewImage={previewImageModal}
          onClose={() => setPreviewImageModal(null)}
        />
      )}
    </div>
  );
};

export default ElectronicApprovalView;
