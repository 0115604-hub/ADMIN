import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  HANUL_PROCESSES,
  HANUL_DEFECT_TYPES,
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  saveHanulQualityIssue,
  resolveHanulQualityIssue,
  deleteHanulQualityIssue
} from "../../../services/hanulQualityIssueService";
import {
  MACHINING_DEFECT_TYPES,
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  saveMachiningQualityIssue,
  resolveMachiningQualityIssue,
  deleteMachiningQualityIssue
} from "../../../services/machiningQualityIssueService";
import {
  YUSEONG_QUALITY_PROJECTS,
  YUSEONG_DEFECT_TYPES,
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues,
  saveYuseongQualityIssue,
  deleteYuseongQualityIssue
} from "../../../services/yuseongQualityIssueService";
import {
  EXTRUSION_LINES,
  DEFECT_TYPES as EXTRUSION_DEFECT_TYPES,
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue,
  resolveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../../../services/extrusionQualityIssueService";
import {
  ORYUK_PROCESSES,
  JOYOUNG_PROCESSES,
  BURIMTECH_PROCESSES
} from "./qualityModalConstants";
import { compressImage } from "./imageCompressUtil";

export function useHanulQualityIssueModalState({ isOpen, onClose }) {
  const { currentProfile } = useAuth();

  // 🌟 접속 관리자별 등록 모드 자동 판별 (오륙: 이창엽·윤경수 / 조영: 김동욱 / 유성: 유성 / 부림텍: 부림텍 / 압출동: 설유철 / 한울: 한울)
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
  const isYuseongManager = Boolean(
    currentProfile?.name === "유성" ||
    currentProfile?.id === "sam_ys" ||
    String(currentProfile?.company || "").includes("유성")
  );
  const isBurimtechManager = Boolean(
    currentProfile?.name === "부림텍" ||
    currentProfile?.id === "hal_br" ||
    String(currentProfile?.company || "").includes("부림")
  );
  const isSeolManager = Boolean(
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc"
  );

  // 🌟 전사부적합등록 뱃지 지원
  const canBroadcastToFirstScreen = !isJoyoungManager;

  const companyLabel = isOryukManager
    ? "오륙"
    : isJoyoungManager
    ? "조영"
    : isYuseongManager
    ? "유성"
    : isBurimtechManager
    ? "부림텍"
    : isSeolManager
    ? "압출동"
    : "한울";

  const targetWorkerGroup = isOryukManager
    ? "machining"
    : isJoyoungManager
    ? "joyoung"
    : isYuseongManager
    ? "yuseong"
    : isBurimtechManager
    ? "burimtech"
    : isSeolManager
    ? "extrusion"
    : "hanul";

  const headerBadgeLabel = isOryukManager
    ? "(주)오륙 가공동 전담"
    : isJoyoungManager
    ? "(주)조영 한림공장 전담"
    : isYuseongManager
    ? "(주)유성 가공/협력업체 전담"
    : isBurimtechManager
    ? "부림텍 가공/협력업체 전담"
    : isSeolManager
    ? "삼랑진 압출동 전담"
    : "한울 가공/협력업체 전담";

  const processOptions = isOryukManager
    ? ORYUK_PROCESSES
    : isJoyoungManager
    ? JOYOUNG_PROCESSES
    : isYuseongManager
    ? YUSEONG_QUALITY_PROJECTS
    : isBurimtechManager
    ? BURIMTECH_PROCESSES
    : isSeolManager
    ? EXTRUSION_LINES
    : HANUL_PROCESSES;

  const defectOptions = isOryukManager
    ? MACHINING_DEFECT_TYPES
    : isYuseongManager
    ? YUSEONG_DEFECT_TYPES
    : isSeolManager
    ? EXTRUSION_DEFECT_TYPES
    : HANUL_DEFECT_TYPES;

  const defaultLineName = processOptions[0]?.name || "9BQC (G/RUN)";

  const [issues, setIssues] = useState(() =>
    isOryukManager
      ? getLocalMachiningQualityIssues()
      : isYuseongManager
      ? getLocalYuseongQualityIssues()
      : isSeolManager
      ? getLocalExtrusionQualityIssues()
      : getLocalHanulQualityIssues()
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

  // Real-time Cloud Sync (오륙: machining / 유성: yuseong / 압출동: extrusion / 한울·부림텍·조영: hanul)
  useEffect(() => {
    if (isOryukManager) {
      setIssues(getLocalMachiningQualityIssues());
      const unsub = subscribeMachiningQualityIssues((list) => {
        setIssues(list);
      });
      return () => unsub();
    } else if (isYuseongManager) {
      setIssues(getLocalYuseongQualityIssues());
      const unsub = subscribeYuseongQualityIssues((list) => {
        setIssues(list);
      });
      return () => unsub();
    } else if (isSeolManager) {
      setIssues(getLocalExtrusionQualityIssues());
      const unsub = subscribeExtrusionQualityIssues((list) => {
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
  }, [isOryukManager, isYuseongManager, isSeolManager]);

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

      const hasAction = Boolean(
        (form.actionResult && form.actionResult.trim().length > 0) ||
        (Array.isArray(form.actionImages) && form.actionImages.length > 0)
      );
      const payload = {
        ...form,
        company: companyLabel,
        targetWorkerGroup,
        plant: isOryukManager || isYuseongManager || isSeolManager ? "삼랑진공장" : "한림공장",
        author: authorName,
        authorTitle,
        status: hasAction ? "RESOLVED" : "ACTIVE",
        isResolved: hasAction,
        actionAuthor: hasAction ? authorName : "",
        broadcastScope: isBroadcast ? "GLOBAL" : "SITE_ONLY",
        isFirstScreenBroadcast: isBroadcast,
        isFirstScreenOrigin: isBroadcast
      };

      if (editingIssueId) {
        payload.id = editingIssueId;
      }

      if (isOryukManager) {
        await saveMachiningQualityIssue(payload);
      } else if (isYuseongManager) {
        await saveYuseongQualityIssue(payload);
      } else if (isSeolManager) {
        await saveExtrusionQualityIssue(payload);
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
      } else if (isYuseongManager) {
        await saveYuseongQualityIssue({
          ...issue,
          status: "RESOLVED",
          actionResult: note || issue.actionResult || "현장 조치 및 품질 확인 완료",
          resolvedBy: currentProfile?.name || companyLabel
        });
      } else if (isSeolManager) {
        await resolveExtrusionQualityIssue(issue.id, note, currentProfile?.name || companyLabel);
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
      } else if (isYuseongManager) {
        await deleteYuseongQualityIssue(id);
      } else if (isSeolManager) {
        await deleteExtrusionQualityIssue(id);
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

  // 🌟 아래 목록표는 '현장내전파등록'(isFirstScreenBroadcast !== true && isFirstScreenOrigin !== true)에 한해 소속 회사별로 목록화
  const siteOnlyIssues = useMemo(() => {
    return issues.filter((it) => {
      if (!it || it.isFirstScreenBroadcast || it.isFirstScreenOrigin) return false;
      if (isOryukManager || isYuseongManager || isSeolManager) return true;
      const itemComp = String(it.company || "한울").trim();
      const itemAuthor = String(it.author || "").trim();
      if (isBurimtechManager) {
        return itemComp === "부림텍" || itemAuthor.includes("부림") || it.targetWorkerGroup === "burimtech";
      }
      if (isJoyoungManager) {
        return itemComp === "조영" || itemAuthor === "김동욱" || it.targetWorkerGroup === "joyoung";
      }
      // 한울 관리자 (기본)
      return (
        (itemComp === "한울" || !it.company) &&
        itemComp !== "부림텍" &&
        itemComp !== "조영" &&
        itemAuthor !== "김동욱" &&
        !itemAuthor.includes("부림")
      );
    });
  }, [issues, isOryukManager, isYuseongManager, isSeolManager, isBurimtechManager, isJoyoungManager]);

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

  return {
    currentProfile,
    companyLabel,
    headerBadgeLabel,
    processOptions,
    defectOptions,
    defaultLineName,
    todayStr,
    stats,
    issues,
    filteredIssues,
    form,
    setForm,
    isProcessing,
    isProcessingCauseImages,
    isProcessingActionImages,
    previewImage,
    setPreviewImage,
    detailModalIssue,
    setDetailModalIssue,
    editingIssueId,
    setEditingIssueId,
    selectedLineFilter,
    setSelectedLineFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    searchQuery,
    setSearchQuery,
    causeFileInputRef,
    actionFileInputRef,
    modalBodyRef,
    handleCauseImageFiles,
    handleRemoveCauseImage,
    handleActionImageFiles,
    handleRemoveActionImage,
    handleRegisterWithMode,
    handleSubmit,
    handleEdit,
    handleResolve,
    handleDelete
  };
}
