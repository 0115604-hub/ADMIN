import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getWorkLogs,
  saveWorkLog,
  updateWorkLog,
  isWorkLogApproved,
  deleteWorkLog,
  subscribeWorkLogs,
  approveWorkLog,
  batchApproveWorkLogs,
  rejectWorkLog
} from "../../services/workLogService";
import { getKSTDateString } from "../../utils/dateUtils";
import { pushModalHistory, useModalHistory } from "../../utils/modalHistory";
import { compressImage } from "../../utils/imageCompressor";

export const DEFECT_TYPE_GROUPS = [
  {
    category: "제품부적합",
    label: "📦 제품부적합",
    items: [
      { value: "[제품부적합] 치수", name: "치수" },
      { value: "[제품부적합] 외관", name: "외관" },
      { value: "[제품부적합] 조립", name: "조립" },
      { value: "[제품부적합] 누락/혼입", name: "누락/혼입" }
    ]
  },
  {
    category: "공정부적합",
    label: "⚙️ 공정부적합",
    items: [
      { value: "[공정부적합] 작업조건미준수", name: "작업조건미준수" },
      { value: "[공정부적합] 검사누락", name: "검사누락" },
      { value: "[공정부적합] 설비조건이상", name: "설비조건이상" },
      { value: "[공정부적합] 금형이상", name: "금형이상" },
      { value: "[공정부적합] 치공구이상", name: "치공구이상" }
    ]
  }
];

export const JAEYUL_EQUIPMENT_CATEGORIES = [
  "압출기",
  "사출기",
  "컴프레셔",
  "코팅설비",
  "치공구",
  "기타"
];

export const JAEYUL_EQUIPMENT_OPTIONS = [
  "PCM 1호",
  "PCM 3호",
  "TPE 1호",
  "PVC",
  "300TON",
  "45TON",
  "25TON",
  "압출동 컴프레셔",
  "AB동 컴프레셔",
  "C동 컴프레셔",
  "코팅(8턴)",
  "코팅(서랍)",
  "내용직접입력"
];

export const JAEYUL_CATEGORY_EQUIPMENT_MAP = {
  "압출기": ["PCM 1호", "PCM 3호", "TPE 1호", "PVC", "내용직접입력"],
  "사출기": ["300TON", "45TON", "25TON", "내용직접입력"],
  "컴프레셔": ["압출동 컴프레셔", "AB동 컴프레셔", "C동 컴프레셔", "내용직접입력"],
  "코팅설비": ["코팅(8턴)", "코팅(서랍)", "내용직접입력"],
  "치공구": ["내용직접입력"],
  "기타": ["내용직접입력"]
};

export const LOGS_PER_PAGE = 12;

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
  const [currentLogPage, setCurrentLogPage] = useState(1);
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
  const [editMaintenanceItems, setEditMaintenanceItems] = useState([]);
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

  // Maintenance Items for Jaeyul
  const [maintenanceItems, setMaintenanceItems] = useState([
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

  // Maintenance Items handlers for Jaeyul
  const handleAddMaintenanceItem = () => {
    setMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: "",
        imagesBefore: [],
        imagesAfter: []
      }
    ]);
  };

  const handleRemoveMaintenanceItem = (id) => {
    if (maintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMaintenanceItem = (id, field, value) => {
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const defaultEquips = JAEYUL_CATEGORY_EQUIPMENT_MAP[value] || JAEYUL_EQUIPMENT_OPTIONS;
          return {
            ...item,
            category: value,
            equipmentName: defaultEquips[0] || "PCM 1호",
            customEquipmentName: ""
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = maintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
  };

  // Approval Handlers
  const pendingSamrangjinCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "삼랑진공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  const pendingHallimCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "한림공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  const handleApproveLog = async (logId, customComment) => {
    const finalComment = (typeof customComment === "string" && customComment.trim())
      ? customComment.trim()
      : (approvalCommentInput.trim() || "확인 및 전자결재 승인 완료");

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant,
      comment: finalComment
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const approvedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "결재완료",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: finalComment,
      updatedAt: new Date().toISOString()
    };

    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? approvedLog : l));
      }
      return [approvedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(approvedLog);
    }

    try {
      await approveWorkLog(logId, approver, targetLog);
    } catch (e) {
      console.error("Cloud approval error:", e);
    }

    setToastMessage("결재 및 지시사항 코멘트가 정상적으로 등록되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const handleBatchApproveLogs = async (logIds) => {
    if (!Array.isArray(logIds) || logIds.length === 0) return;
    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const targetIds = new Set(logIds.map(String));
    const updated = workLogs.map((l) => {
      if (targetIds.has(String(l.id))) {
        const targetPlant = l.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(l.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
        const approverName = currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재");
        const approverTitle = currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사");
        return {
          ...l,
          plant: targetPlant,
          approvalStatus: "결재완료",
          approverName,
          approverTitle,
          approverPlant: targetPlant,
          approvedAt: nowFormatted,
          approvalComment: `${targetPlant} 일괄 확인 및 전자결재 승인 완료`,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    setWorkLogs(updated);

    try {
      await batchApproveWorkLogs(logIds, {
        name: currentProfile?.name,
        title: currentProfile?.title,
        plant: currentProfile?.plant || workerPlant
      });
    } catch (e) {
      console.error("Batch approve work logs error:", e);
    }

    setToastMessage(`선택된 ${logIds.length}건의 업무일지가 일괄 결재 승인되었습니다.`);
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const handleRejectLog = async (logId) => {
    const reason = window.prompt("반려 사유 또는 보완 요청 사항을 입력해주세요:", "내용 보완 후 재상신 요망");
    if (!reason) return;

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const rejectedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "반려",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: reason,
      updatedAt: new Date().toISOString()
    };

    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? rejectedLog : l));
      }
      return [rejectedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(rejectedLog);
    }

    try {
      await rejectWorkLog(logId, approver, reason, targetLog);
    } catch (e) {
      console.error("Cloud reject error:", e);
    }

    setToastMessage("업무일지가 반려 처리되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // Save work log (Cloud Firestore + Local)
  const handleSaveLog = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingLog) return;
    setIsSavingLog(true);

    try {
      // 🌟 [설비보전 전용: 전재율 책임]
      if (isJaeyul) {
        const filledItems = maintenanceItems.filter((it) => it.content && it.content.trim());
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

        setMaintenanceItems([
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
      setEditMaintenanceItems(
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
      setEditMaintenanceItems([
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
      setEditMaintenanceItems([]);
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

  const handleAddEditMaintenanceItem = () => {
    setEditMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: "",
        imagesBefore: [],
        imagesAfter: []
      }
    ]);
  };

  const handleRemoveEditMaintenanceItem = (id) => {
    if (editMaintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setEditMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateEditMaintenanceItem = (id, field, value) => {
    setEditMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const defaultEquips = JAEYUL_CATEGORY_EQUIPMENT_MAP[value] || JAEYUL_EQUIPMENT_OPTIONS;
          return {
            ...item,
            category: value,
            equipmentName: defaultEquips[0] || "PCM 1호",
            customEquipmentName: ""
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleEditMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = editMaintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsEditProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setEditMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsEditProcessingImages(false);
    }
  };

  const handleRemoveEditMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setEditMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
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
      editMaintenanceItems.length > 0;

    if (isJaeyulLog && editMaintenanceItems.length > 0) {
      formattedItems = editMaintenanceItems
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

  // Memos & Pagination
  const todayDateStr = useMemo(() => getKSTDateString(), []);

  const todayLog = useMemo(() => {
    return (workLogs || []).find(
      (l) =>
        Boolean(l) &&
        l.date === todayDateStr &&
        (l.writer === workerFullName ||
          l.writer === currentProfile?.name ||
          l.author === currentProfile?.name ||
          (currentProfile?.name && typeof l.writer === "string" && l.writer.includes(currentProfile.name)))
    );
  }, [workLogs, todayDateStr, workerFullName, currentProfile?.name]);

  const workerLogsList = useMemo(() => {
    return (workLogs || [])
      .filter((log) => {
        if (!log) return false;
        if (workerLogScope === "my") {
          const isMy =
            log.writer === workerFullName ||
            log.writer === currentProfile?.name ||
            log.author === currentProfile?.name ||
            (currentProfile?.name && typeof log.writer === "string" && log.writer.includes(currentProfile.name));
          if (!isMy) return false;
        } else if (workerLogScope === "plant") {
          if (workerPlant && log.plant && log.plant !== workerPlant) return false;
        }

        if (workerLogApprovalFilter === "대기") {
          if (isWorkLogApproved(log)) return false;
        } else if (workerLogApprovalFilter === "승인") {
          if (!isWorkLogApproved(log)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (b.date || "").localeCompare(a.date || "");
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [workLogs, workerLogScope, workerFullName, currentProfile?.name, workerPlant, workerLogApprovalFilter]);

  const filteredLogs = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return (workLogs || [])
      .filter((log) => {
        if (!log || typeof log !== "object") return false;
        const writerWithTitle = `${log.writer || ""} ${log.title || ""} ${log.process || ""}`.toLowerCase();
        const content = String(log.workContent || "").toLowerCase();
        const line = String(log.line || "").toLowerCase();
        const issues = String(log.issues || "").toLowerCase();

        const matchSearch =
          !term ||
          writerWithTitle.includes(term) ||
          content.includes(term) ||
          line.includes(term) ||
          issues.includes(term);

        const logPlant = log.plant || log.approverPlant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(log.writer) ? "한림공장" : (["권태형", "최미영"].includes(log.writer) || log.department === "본사 관리팀" ? "본사" : "삼랑진공장"));

        const matchPlant =
          filterPlant === "all" ||
          logPlant === filterPlant ||
          (filterPlant === "한림공장" && (logPlant.includes("한림") || logPlant === "한림")) ||
          (filterPlant === "삼랑진공장" && (logPlant.includes("삼랑진") || logPlant === "삼랑진")) ||
          (filterPlant === "본사" && (logPlant.includes("본사") || logPlant === "본사"));

        return matchSearch && matchPlant;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || "") || String(b.id || "").localeCompare(String(a.id || "")));
  }, [workLogs, searchTerm, filterPlant]);

  useEffect(() => {
    setCurrentLogPage(1);
  }, [searchTerm, filterPlant]);

  const totalLogPages = useMemo(() => {
    return Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  }, [filteredLogs.length]);

  const safeLogPage = Math.min(Math.max(1, currentLogPage), totalLogPages);

  const paginatedLogs = useMemo(() => {
    const startIdx = (safeLogPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);
  }, [filteredLogs, safeLogPage]);

  return {
    workLogs,
    setWorkLogs,
    currentLogPage,
    setCurrentLogPage,
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
    editMaintenanceItems,
    setEditMaintenanceItems,
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
    maintenanceItems,
    setMaintenanceItems,
    pendingSamrangjinCount,
    pendingHallimCount,
    todayLog,
    workerLogsList,
    filteredLogs,
    totalLogPages,
    safeLogPage,
    paginatedLogs,
    handleOpenWorkLogModal,
    handleOpenLogDetail,
    handleWorkLogImageFiles,
    handleRemoveWorkLogImage,
    handleAddMaintenanceItem,
    handleRemoveMaintenanceItem,
    handleUpdateMaintenanceItem,
    handleMaintenanceItemImageFiles,
    handleRemoveMaintenanceItemImage,
    handleApproveLog,
    handleBatchApproveLogs,
    handleRejectLog,
    handleSaveLog,
    handleDeleteLog,
    handleOpenEditModal,
    handleEditLogImageFiles,
    handleRemoveEditLogImage,
    handleAddEditMaintenanceItem,
    handleRemoveEditMaintenanceItem,
    handleUpdateEditMaintenanceItem,
    handleEditMaintenanceItemImageFiles,
    handleRemoveEditMaintenanceItemImage,
    handleSaveEditedLog
  };
}
