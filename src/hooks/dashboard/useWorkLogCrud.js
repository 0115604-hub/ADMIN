import { useState, useEffect, useCallback } from "react";
import {
  getWorkLogs,
  saveWorkLog,
  updateWorkLog,
  isWorkLogApproved,
  deleteWorkLog,
  subscribeWorkLogs
} from "../../services/workLogService";
import { getKSTDateString } from "../../utils/dateUtils";
import { pushModalHistory, useModalHistory } from "../../utils/modalHistory";
import { compressImage } from "../../utils/imageCompressor";

// Re-export constants
import {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
} from "./workLogConstants.js";

export {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
};

import { useWorkLogApproval } from "./useWorkLogApproval.js";
import { useWorkLogMaintenance } from "./useWorkLogMaintenance.js";
import { useWorkLogPagination } from "./useWorkLogPagination.js";

/**
 * Custom hook for Work Log (업무일보) CRUD, approval workflow, Jaeyul maintenance items, and pagination.
 */
export function useWorkLogCrud({
  currentProfile,
  workerFullName,
  workerPlant,
  workerPosition,
  workerDept,
  assignedProcess,
  officialTitle,
  isAdmin,
  isMyeongjae,
  isDongwook,
  isInjoo,
  isJaeyul,
  isQualityWorker,
  isOperator,
  setToastMessage,
  setLogSavedToast
}) {
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Browser/Android Back Button safe modal stack management
  useModalHistory(isModalOpen, () => setIsModalOpen(false), "workerDashboardLogModal");
  useModalHistory(Boolean(selectedLogDetail), () => setSelectedLogDetail(null), "workerDashboardLogDetailModal");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState(() => {
    if (isMyeongjae) return "삼랑진공장";
    if (isDongwook) return "한림공장";
    return "all";
  });

  const [approvalCommentInput, setApprovalCommentInput] = useState("");
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: "",
    date: "",
    plant: "삼랑진공장",
    writer: "",
    title: "",
    process: "",
    shift: "주간",
    line: "",
    workContent: "",
    issues: "",
    images: []
  });
  const [isEditProcessingImages, setIsEditProcessingImages] = useState(false);

  // Field Worker states
  const [workerLogScope, setWorkerLogScope] = useState("my"); // "my" | "plant"
  const [workerLogApprovalFilter, setWorkerLogApprovalFilter] = useState("all"); // "all" | "대기" | "승인"

  // Work Log write form data
  const [formData, setFormData] = useState({
    date: getKSTDateString(),
    plant: workerPlant,
    writer: workerFullName,
    process: isInjoo ? "경리업무" : isQualityWorker ? "품질관리" : assignedProcess,
    shift: "주간",
    line: isInjoo ? "본사/현장 정산 및 전표 마감" : isQualityWorker ? "전라인 품질 검사 및 불량 분석" : "9BQC 압출 1호기",
    workContent: "",
    defectType: "",
    issues: "",
    images: [],
    imagesBefore: [],
    imagesAfter: []
  });

  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  useModalHistory(
    Boolean(previewImageModal),
    () => setPreviewImageModal(null),
    "workerDashboardPreviewImageModal"
  );

  // Sub-module: Jaeyul maintenance items management
  const maintenance = useWorkLogMaintenance({
    setIsProcessingImages,
    setIsEditProcessingImages
  });

  // Sub-module: Approval & rejection workflow
  const approval = useWorkLogApproval({
    workLogs,
    setWorkLogs,
    selectedLogDetail,
    setSelectedLogDetail,
    approvalCommentInput,
    currentProfile,
    workerPlant,
    setToastMessage,
    setLogSavedToast
  });

  // Sub-module: Filtering, sorting, and pagination
  const pagination = useWorkLogPagination({
    workLogs,
    workerFullName,
    currentProfile,
    workerLogScope,
    workerPlant,
    workerLogApprovalFilter,
    searchTerm,
    filterPlant
  });

  // Real-time Cloud Synchronization for Work Logs across all mobile phones & PCs
  useEffect(() => {
    const unsubscribe = subscribeWorkLogs((logs) => {
      setWorkLogs(logs);
    });
    const handleWorkLogsUpdated = (e) => {
      if (e.detail?.logs) {
        setWorkLogs(e.detail.logs);
      }
    };
    window.addEventListener("workLogsUpdated", handleWorkLogsUpdated);
    return () => {
      unsubscribe();
      window.removeEventListener("workLogsUpdated", handleWorkLogsUpdated);
    };
  }, []);

  // Sync approval comment when detail modal opens/changes
  useEffect(() => {
    if (selectedLogDetail) {
      setApprovalCommentInput(
        selectedLogDetail.approvalComment && selectedLogDetail.approvalComment !== "확인 및 전자결재 승인 완료"
          ? selectedLogDetail.approvalComment
          : ""
      );
    } else {
      setApprovalCommentInput("");
    }
  }, [selectedLogDetail]);

  // Sync formData and filterPlant with profile
  useEffect(() => {
    if (currentProfile) {
      const isHQ = isAdmin || currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영" || currentProfile.plant === "본사";
      const isGM = isMyeongjae || isDongwook || currentProfile.assignedProcess === "총괄관리";
      setFormData((prev) => ({
        ...prev,
        plant: prev.plant || (isHQ ? "본사" : workerPlant),
        writer: workerFullName,
        process: isInjoo
          ? "경리업무"
          : isQualityWorker
          ? "품질관리"
          : isHQ
          ? "총괄경영관리"
          : isGM
          ? "총괄관리"
          : (currentProfile.assignedProcess || prev.process || "가공동 관리"),
        line: isInjoo
          ? "본사/현장 정산 및 전표 마감"
          : isQualityWorker
          ? "전라인 품질 검사 및 불량 분석"
          : isHQ
          ? "본사 총괄 경영 및 운영 관리"
          : isGM
          ? `${workerPlant} 총괄 운영 관리`
          : (prev.line || "가공 라인")
      }));

      if (isMyeongjae) setFilterPlant("삼랑진공장");
      else if (isDongwook) setFilterPlant("한림공장");
    }
  }, [currentProfile, isOperator, workerFullName, workerPlant, assignedProcess, isInjoo, isQualityWorker, isMyeongjae, isDongwook, isAdmin]);

  // Open modal handlers
  const handleOpenWorkLogModal = useCallback(() => {
    pushModalHistory("worklog_write");
    setIsModalOpen(true);
  }, []);

  const handleOpenLogDetail = useCallback((log) => {
    pushModalHistory("worklog_detail");
    setSelectedLogDetail(log);
    setApprovalCommentInput(log?.approvalComment || "");
  }, []);

  // Image upload handlers for main work log
  const handleWorkLogImageFiles = async (files, type = "all") => {
    if (!files || files.length === 0) return;
    const isSeparated = type === "before" || type === "after";
    const currentBefore = formData.imagesBefore || [];
    const currentAfter = formData.imagesAfter || [];
    const totalCount = isSeparated
      ? currentBefore.length + currentAfter.length
      : (formData.images || []).length;

    const maxLimit = isSeparated ? 3 : 5;
    if (totalCount >= maxLimit) {
      alert(`현장 사진은 최대 ${maxLimit}장까지 첨부할 수 있습니다.`);
      return;
    }
    const remainingSlots = maxLimit - totalCount;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setFormData((prev) => {
        if (type === "before") {
          const nextBefore = [...(prev.imagesBefore || []), ...processed].slice(0, 3);
          const nextAfter = prev.imagesAfter || [];
          return {
            ...prev,
            imagesBefore: nextBefore,
            imagesAfter: nextAfter,
            images: [...nextBefore, ...nextAfter]
          };
        } else if (type === "after") {
          const nextBefore = prev.imagesBefore || [];
          const nextAfter = [...(prev.imagesAfter || []), ...processed].slice(0, 3);
          return {
            ...prev,
            imagesBefore: nextBefore,
            imagesAfter: nextAfter,
            images: [...nextBefore, ...nextAfter]
          };
        } else {
          return {
            ...prev,
            images: [...(prev.images || []), ...processed].slice(0, 5)
          };
        }
      });
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveWorkLogImage = (idx, type = "all") => {
    setFormData((prev) => {
      if (type === "before") {
        const nextBefore = (prev.imagesBefore || []).filter((_, i) => i !== idx);
        const nextAfter = prev.imagesAfter || [];
        return {
          ...prev,
          imagesBefore: nextBefore,
          imagesAfter: nextAfter,
          images: [...nextBefore, ...nextAfter]
        };
      } else if (type === "after") {
        const nextBefore = prev.imagesBefore || [];
        const nextAfter = (prev.imagesAfter || []).filter((_, i) => i !== idx);
        return {
          ...prev,
          imagesBefore: nextBefore,
          imagesAfter: nextAfter,
          images: [...nextBefore, ...nextAfter]
        };
      } else {
        return {
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== idx)
        };
      }
    });
  };

  // Save work log (Cloud Firestore + Local)
  const handleSaveLog = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingLog) return;
    setIsSavingLog(true);

    try {
      // 🌟 [설비보전 전용: 전재율 책임]
      if (isJaeyul) {
        const filledItems = maintenance.maintenanceItems.filter((it) => it.content && it.content.trim());
        if (filledItems.length === 0) {
          alert("최소 1개 이상의 설비보전내용을 입력해 주세요.");
          return;
        }

        const formattedContent = filledItems
          .map((it, idx) => {
            const eqName = (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
              ? (it.customEquipmentName?.trim() || "직접입력")
              : it.equipmentName;
            return `[${idx + 1}] ${it.category} > ${eqName}\n• 설비보전내용: ${it.content.trim()}`;
          })
          .join("\n\n");

        const lineSummary = filledItems
          .map((it) => {
            const eqName = (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
              ? (it.customEquipmentName?.trim() || "직접입력")
              : it.equipmentName;
            return `${it.category}(${eqName})`;
          })
          .join(", ");

        const allImagesBefore = filledItems.flatMap((it) => it.imagesBefore || []);
        const allImagesAfter = filledItems.flatMap((it) => it.imagesAfter || []);
        const allImages = [...allImagesBefore, ...allImagesAfter];

        const newLog = {
          id: String(Date.now()),
          date: formData.date || getKSTDateString(),
          plant: formData.plant || workerPlant || "삼랑진공장",
          writer: currentProfile?.name || workerFullName || "작업자",
          title: officialTitle || "선임",
          process: "설비보전",
          shift: formData.shift || "주간",
          line: lineSummary || "설비보전 점검",
          workContent: formattedContent,
          maintenanceItems: filledItems.map((it) => ({
            category: it.category,
            equipmentName: (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
              ? (it.customEquipmentName?.trim() || "직접입력")
              : it.equipmentName,
            content: it.content.trim(),
            imagesBefore: Array.isArray(it.imagesBefore) ? it.imagesBefore : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? it.imagesAfter : []
          })),
          issues: "-",
          imagesBefore: allImagesBefore,
          imagesAfter: allImagesAfter,
          images: allImages.length > 0 ? allImages : (formData.images || []),
          status: "완료",
          createdAt: new Date().toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        };

        const updatedList = await saveWorkLog(newLog);
        if (Array.isArray(updatedList)) {
          setWorkLogs(updatedList);
        }

        maintenance.setMaintenanceItems([
          {
            id: 1,
            category: "압출기",
            equipmentName: "PCM 1호",
            customEquipmentName: "",
            content: "",
            imagesBefore: [],
            imagesAfter: []
          }
        ]);

        setFormData((prev) => ({
          ...prev,
          workContent: "",
          issues: "",
          images: []
        }));

        setLogSavedToast(true);
        setTimeout(() => setLogSavedToast(false), 3000);
        setIsModalOpen(false);
        return;
      }

      if (!formData.workContent || !formData.workContent.trim()) {
        alert("작업 내용을 입력해 주세요.");
        return;
      }

      let finalIssues = formData.issues?.trim() || "";
      if (formData.defectType && formData.defectType !== "[직접입력] 기타부적합" && !finalIssues.includes(formData.defectType)) {
        finalIssues = finalIssues ? `${formData.defectType} ${finalIssues}` : formData.defectType;
      }
      if (!finalIssues) finalIssues = "-";

      const isWriterAdmin = isAdmin || currentProfile?.name === "권태형" || currentProfile?.name === "최미영" || currentProfile?.role === "ADMIN";
      const nowFormatted = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      const targetPlant = formData.plant || (isWriterAdmin ? "본사" : workerPlant) || "삼랑진공장";
      const isGM = isMyeongjae || isDongwook || currentProfile?.assignedProcess === "총괄관리";

      const newLog = {
        id: String(Date.now()),
        date: formData.date || getKSTDateString(),
        plant: targetPlant,
        writer: currentProfile?.name || workerFullName || "작업자",
        title: officialTitle || workerPosition || "선임",
        department: workerDept,
        process: isInjoo
          ? "경리업무"
          : isQualityWorker
          ? "품질관리"
          : isWriterAdmin
          ? "총괄경영관리"
          : isGM
          ? "총괄관리"
          : (formData.process || assignedProcess || "가공동 관리"),
        shift: formData.shift || "주간",
        line: isInjoo
          ? "본사/현장 정산 및 전표 마감"
          : isQualityWorker
          ? (formData.line || "전라인 품질 검사 및 불량 분석")
          : isWriterAdmin
          ? "본사 총괄 경영 및 운영 관리"
          : isGM
          ? `${targetPlant} 총괄 운영 관리`
          : (formData.line || "생산 라인"),
        workContent: formData.workContent,
        defectType: formData.defectType || "",
        issues: finalIssues,
        images: formData.images || [...(formData.imagesBefore || []), ...(formData.imagesAfter || [])],
        imagesBefore: formData.imagesBefore || [],
        imagesAfter: formData.imagesAfter || [],
        status: "완료",
        approvalStatus: isWriterAdmin ? "결재완료" : "결재대기",
        approverName: isWriterAdmin ? (currentProfile?.name || "권태형") : undefined,
        approverTitle: isWriterAdmin ? (officialTitle || (currentProfile?.name === "최미영" ? "전무" : "대표이사")) : undefined,
        approverPlant: isWriterAdmin ? "본사" : undefined,
        approvedAt: isWriterAdmin ? nowFormatted : undefined,
        approvalComment: isWriterAdmin ? "대표이사 전결 승인 완료" : "",
        createdAt: new Date().toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      const updatedList = await saveWorkLog(newLog);
      if (Array.isArray(updatedList)) {
        setWorkLogs(updatedList);
      }

      setFormData((prev) => ({
        ...prev,
        workContent: "",
        defectType: "",
        issues: "",
        images: [],
        imagesBefore: [],
        imagesAfter: []
      }));

      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Work log save error:", err);
      alert("업무일지 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleDeleteLog = async (id) => {
    const log = (workLogs || []).find((l) => String(l.id) === String(id));
    if (log && isWorkLogApproved(log)) {
      alert("이미 관리자 승인(결재)이 완료된 업무일보는 삭제할 수 없습니다.");
      return;
    }
    if (!isAdmin && log && log.workerName !== currentProfile?.name && log.writer !== currentProfile?.name) {
      alert("본인이 작성한 업무일지만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 업무일지를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    await deleteWorkLog(id);
    setToastMessage("업무일지가 삭제되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // Open Work Log Edit Modal
  const handleOpenEditModal = (log) => {
    if (!log) return;
    if (isWorkLogApproved(log) && !isAdmin) {
      alert("결재가 완료된 업무일지는 내용을 수정할 수 없습니다.");
      return;
    }
    pushModalHistory("worklog_edit");
    setEditingLog(log);
    let defectType = log.defectType || "";
    let cleanIssues = log.issues === "-" ? "" : (log.issues || "");
    if (!defectType && cleanIssues) {
      for (const grp of DEFECT_TYPE_GROUPS) {
        for (const it of grp.items) {
          if (cleanIssues.startsWith(it.value)) {
            defectType = it.value;
            cleanIssues = cleanIssues.replace(it.value, "").trim();
            break;
          }
        }
        if (defectType) break;
      }
    }

    setEditFormData({
      id: log.id,
      date: log.date || getKSTDateString(),
      plant: log.plant || "삼랑진공장",
      writer: log.writer || "",
      title: log.title || "",
      process: log.process || "",
      shift: log.shift || "주간",
      line: log.line || "",
      workContent: log.workContent || "",
      defectType: defectType,
      issues: cleanIssues,
      images: Array.isArray(log.images) ? [...log.images] : [],
      imagesBefore: Array.isArray(log.imagesBefore) ? [...log.imagesBefore] : [],
      imagesAfter: Array.isArray(log.imagesAfter) ? [...log.imagesAfter] : []
    });

    const isJaeyulLog = log.process === "설비보전" || log.writer === "전재율" || (log.line && log.line.includes("설비보전")) || isJaeyul;
    if (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0) {
      maintenance.setEditMaintenanceItems(
        log.maintenanceItems.map((it, idx) => {
          const category = it.category || "압출기";
          const standardList = JAEYUL_CATEGORY_EQUIPMENT_MAP[category] || JAEYUL_EQUIPMENT_OPTIONS;
          const isStandard = standardList.includes(it.equipmentName) && it.equipmentName !== "내용직접입력" && it.equipmentName !== "직접입력" && it.equipmentName !== "내용입력 (직접입력)";
          return {
            id: it.id || Date.now() + idx,
            category: category,
            equipmentName: isStandard ? it.equipmentName : "내용직접입력",
            customEquipmentName: isStandard ? "" : (it.customEquipmentName || it.equipmentName || ""),
            content: it.content || it.workContent || "",
            imagesBefore: Array.isArray(it.imagesBefore) ? [...it.imagesBefore] : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? [...it.imagesAfter] : []
          };
        })
      );
    } else if (isJaeyulLog) {
      maintenance.setEditMaintenanceItems([
        {
          id: 1,
          category: "압출기",
          equipmentName: "PCM 1호",
          customEquipmentName: "",
          content: log.workContent || "",
          imagesBefore: Array.isArray(log.imagesBefore) ? [...log.imagesBefore] : [],
          imagesAfter: Array.isArray(log.imagesAfter) ? [...log.imagesAfter] : []
        }
      ]);
    } else {
      maintenance.setEditMaintenanceItems([]);
    }
  };

  const handleEditLogImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const currentImages = editFormData.images || [];
    if (currentImages.length >= 5) {
      alert("현장 사진은 최대 5장까지 첨부할 수 있습니다.");
      return;
    }
    const remainingSlots = 5 - currentImages.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsEditProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setEditFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 5)
      }));
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsEditProcessingImages(false);
    }
  };

  const handleRemoveEditLogImage = (idx) => {
    setEditFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSaveEditedLog = async (e) => {
    if (e) e.preventDefault();
    if (!editingLog) return;

    if (isWorkLogApproved(editingLog) && !isAdmin) {
      alert("결재가 완료된 업무일지는 수정할 수 없습니다.");
      return;
    }

    let formattedWorkContent = editFormData.workContent;
    let lineSummary = editFormData.line;
    let formattedItems = [];

    const isJaeyulLog =
      editFormData.process === "설비보전" ||
      editingLog.process === "설비보전" ||
      editingLog.writer === "전재율" ||
      maintenance.editMaintenanceItems.length > 0;

    if (isJaeyulLog && maintenance.editMaintenanceItems.length > 0) {
      formattedItems = maintenance.editMaintenanceItems
        .filter((it) => it.content && it.content.trim())
        .map((it) => {
          const isCustom =
            it.equipmentName === "내용직접입력" ||
            it.equipmentName === "직접입력" ||
            it.equipmentName === "내용입력 (직접입력)" ||
            !JAEYUL_CATEGORY_EQUIPMENT_MAP[it.category]?.includes(it.equipmentName);
          const finalEqName = isCustom ? (it.customEquipmentName?.trim() || "직접입력") : it.equipmentName;
          return {
            id: it.id,
            category: it.category || "기타",
            equipmentName: finalEqName,
            customEquipmentName: isCustom ? (it.customEquipmentName?.trim() || "") : "",
            content: it.content.trim(),
            imagesBefore: Array.isArray(it.imagesBefore) ? it.imagesBefore : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? it.imagesAfter : []
          };
        });

      if (formattedItems.length > 0) {
        formattedWorkContent = formattedItems
          .map((it, idx) => `[${idx + 1}] ${it.category} > ${it.equipmentName}\n• 설비보전내용: ${it.content}`)
          .join("\n\n");

        lineSummary = formattedItems
          .map((it) => `${it.category}(${it.equipmentName})`)
          .join(", ");
      }
    }

    if (!formattedWorkContent || !formattedWorkContent.trim()) {
      alert("작업 내용을 입력해 주세요.");
      return;
    }

    let finalEditIssues = editFormData.issues?.trim() || "";
    if (editFormData.defectType && editFormData.defectType !== "[직접입력] 기타부적합" && !finalEditIssues.includes(editFormData.defectType)) {
      finalEditIssues = finalEditIssues ? `${editFormData.defectType} ${finalEditIssues}` : editFormData.defectType;
    }

    try {
      const allEditBefore = formattedItems.flatMap((it) => it.imagesBefore || []);
      const allEditAfter = formattedItems.flatMap((it) => it.imagesAfter || []);
      const allEditImages = [...allEditBefore, ...allEditAfter];

      const updatedFields = {
        date: editFormData.date,
        plant: editFormData.plant,
        shift: editFormData.shift,
        line: lineSummary || editFormData.line,
        workContent: formattedWorkContent,
        defectType: editFormData.defectType || "",
        issues: finalEditIssues === "" ? "-" : finalEditIssues,
        images: allEditImages.length > 0 ? allEditImages : (editFormData.images || []),
        imagesBefore: allEditBefore.length > 0 ? allEditBefore : (editFormData.imagesBefore || []),
        imagesAfter: allEditAfter.length > 0 ? allEditAfter : (editFormData.imagesAfter || []),
        maintenanceItems: formattedItems.length > 0 ? formattedItems : (editingLog.maintenanceItems || []),
        approvalStatus: editingLog.approvalStatus === "반려" ? "결재대기" : (editingLog.approvalStatus || "결재대기"),
        _forceAdminEdit: isAdmin
      };

      const targetLogId = editingLog.id || editFormData.id;
      const updatedList = await updateWorkLog(targetLogId, updatedFields, editingLog);
      setWorkLogs(updatedList);

      if (selectedLogDetail && String(selectedLogDetail.id) === String(targetLogId)) {
        setSelectedLogDetail(updatedList.find((l) => String(l.id) === String(targetLogId)) || null);
      }

      setEditingLog(null);
      setToastMessage("업무일지 내용이 성공적으로 수정되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("업무일지 수정 중 오류: " + err.message);
    }
  };

  return {
    workLogs,
    setWorkLogs,
    currentLogPage: pagination.currentLogPage,
    setCurrentLogPage: pagination.setCurrentLogPage,
    isModalOpen,
    setIsModalOpen,
    selectedLogDetail,
    setSelectedLogDetail,
    searchTerm,
    setSearchTerm,
    filterPlant,
    setFilterPlant,
    approvalCommentInput,
    setApprovalCommentInput,
    editingLog,
    setEditingLog,
    editFormData,
    setEditFormData,
    editMaintenanceItems: maintenance.editMaintenanceItems,
    setEditMaintenanceItems: maintenance.setEditMaintenanceItems,
    isEditProcessingImages,
    workerLogScope,
    setWorkerLogScope,
    workerLogApprovalFilter,
    setWorkerLogApprovalFilter,
    formData,
    setFormData,
    isSavingLog,
    isProcessingImages,
    previewImageModal,
    setPreviewImageModal,
    maintenanceItems: maintenance.maintenanceItems,
    setMaintenanceItems: maintenance.setMaintenanceItems,
    pendingSamrangjinCount: approval.pendingSamrangjinCount,
    pendingHallimCount: approval.pendingHallimCount,
    todayLog: pagination.todayLog,
    workerLogsList: pagination.workerLogsList,
    filteredLogs: pagination.filteredLogs,
    totalLogPages: pagination.totalLogPages,
    safeLogPage: pagination.safeLogPage,
    paginatedLogs: pagination.paginatedLogs,
    handleOpenWorkLogModal,
    handleOpenLogDetail,
    handleWorkLogImageFiles,
    handleRemoveWorkLogImage,
    handleAddMaintenanceItem: maintenance.handleAddMaintenanceItem,
    handleRemoveMaintenanceItem: maintenance.handleRemoveMaintenanceItem,
    handleUpdateMaintenanceItem: maintenance.handleUpdateMaintenanceItem,
    handleMaintenanceItemImageFiles: maintenance.handleMaintenanceItemImageFiles,
    handleRemoveMaintenanceItemImage: maintenance.handleRemoveMaintenanceItemImage,
    handleApproveLog: approval.handleApproveLog,
    handleBatchApproveLogs: approval.handleBatchApproveLogs,
    handleRejectLog: approval.handleRejectLog,
    handleSaveLog,
    handleDeleteLog,
    handleOpenEditModal,
    handleEditLogImageFiles,
    handleRemoveEditLogImage,
    handleAddEditMaintenanceItem: maintenance.handleAddEditMaintenanceItem,
    handleRemoveEditMaintenanceItem: maintenance.handleRemoveEditMaintenanceItem,
    handleUpdateEditMaintenanceItem: maintenance.handleUpdateEditMaintenanceItem,
    handleEditMaintenanceItemImageFiles: maintenance.handleEditMaintenanceItemImageFiles,
    handleRemoveEditMaintenanceItemImage: maintenance.handleRemoveEditMaintenanceItemImage,
    handleSaveEditedLog
  };
}

export default useWorkLogCrud;
