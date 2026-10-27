import { useState, useMemo } from "react";
import { compressImage } from "./imageCompressUtil";
import {
  determineFourMCategory,
  registerToFourMLedger,
  unregisterFromFourMLedger
} from "../../../services/fourMChangePointService";
import { saveWorkReportNcLedger } from "../../common/WorkReportNonconformanceLedgerPanel";

/**
 * useCapaActionModalState
 * Universal hook for managing 4M CAPA modal dialog, before/after photo slots (5 slots each),
 * and routing sorted work report incidents to the All-Collected (전체취합대장) without
 * prematurely polluting Lee Chang-yeop's official 4M ledger.
 */
export const useCapaActionModalState = ({
  managerName = "관리자",
  defaultPlant = "삼랑진공장",
  ledgerState = null,
  setLedgerState = null,
  onAfterSave = null
} = {}) => {
  const [capaModalItem, setCapaModalItem] = useState(null);
  const [capaForm, setCapaForm] = useState({
    fourM: "Machine",
    title: "",
    content: "",
    rootCause: "",
    correctiveAction: "",
    isSqNotice: false,
    author: managerName,
    beforePhotos: [],
    afterPhotos: [],
    targetDate: new Date().toISOString().slice(0, 10),
    plant: defaultPlant,
    line: ""
  });
  const [isSubmittingCapa, setIsSubmittingCapa] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Open modal with pre-populated fields from an incident
  const handleOpenCapaModal = (record, customManager = managerName) => {
    if (!record) return;
    setCapaModalItem(record);

    let initialBefore = [];
    if (Array.isArray(record.beforePhotos) && record.beforePhotos.length > 0) {
      initialBefore = record.beforePhotos;
    } else if (Array.isArray(record.causeImages) && record.causeImages.length > 0) {
      initialBefore = record.causeImages;
    } else if (Array.isArray(record.images) && record.images.length > 0) {
      initialBefore = record.images;
    } else if (record.beforePhoto) {
      initialBefore = [record.beforePhoto];
    }

    let initialAfter = [];
    if (Array.isArray(record.afterPhotos) && record.afterPhotos.length > 0) {
      initialAfter = record.afterPhotos;
    } else if (Array.isArray(record.actionImages) && record.actionImages.length > 0) {
      initialAfter = record.actionImages;
    } else if (record.afterPhoto) {
      initialAfter = [record.afterPhoto];
    }

    const recPlant =
      record.plant ||
      (String(record.line || "").includes("한림") ? "한림공장" : defaultPlant);

    const authorName =
      record.actionAuthor ||
      record.author ||
      customManager ||
      managerName;

    const defaultTitle =
      record.title ||
      `[${recPlant}] ${record.line || record.project || "해당공정"} - ${record.defectType || "변동점"}`;

    const defaultContent =
      record.content ||
      record.details ||
      record.defectType ||
      record.title ||
      "";

    const defaultTargetDate =
      record.targetDate ||
      (record.actionAt ? String(record.actionAt).slice(0, 10) : record.date || new Date().toISOString().slice(0, 10));

    setCapaForm({
      fourM: record.fourM || determineFourMCategory(record) || "Machine",
      title: defaultTitle,
      content: defaultContent,
      rootCause: record.rootCause || record.whyAnalysis || "",
      correctiveAction: record.actionResult || record.correctiveAction || "",
      isSqNotice: Boolean(record.isSqNotice),
      author: authorName,
      beforePhotos: initialBefore.slice(0, 5),
      afterPhotos: initialAfter.slice(0, 5),
      targetDate: defaultTargetDate,
      plant: recPlant,
      line: record.line || record.project || record.processId || ""
    });
  };

  // Add Before Photos (up to 5)
  const handleAddBeforePhotos = async (files) => {
    if (!files || files.length === 0) return;
    const current = [...(capaForm.beforePhotos || [])];
    const availableSlots = 5 - current.length;
    if (availableSlots <= 0) {
      alert("조치 전 사진은 최대 5장까지 등록 가능합니다.");
      return;
    }
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    for (const file of filesToProcess) {
      const base64 = await compressImage(file, 900, 0.75);
      if (base64) current.push(base64);
    }
    setCapaForm((prev) => ({ ...prev, beforePhotos: current }));
  };

  // Set single Before Photo slot
  const handleSetBeforePhotoSlot = async (file, slotIndex) => {
    if (!file) return;
    const base64 = await compressImage(file, 900, 0.75);
    if (!base64) return;
    setCapaForm((prev) => {
      const updated = [...(prev.beforePhotos || [])];
      updated[slotIndex] = base64;
      return { ...prev, beforePhotos: updated.slice(0, 5) };
    });
  };

  // Remove Before Photo slot
  const handleRemoveBeforePhoto = (index) => {
    setCapaForm((prev) => ({
      ...prev,
      beforePhotos: (prev.beforePhotos || []).filter((_, i) => i !== index)
    }));
  };

  // Add After Photos (up to 5)
  const handleAddAfterPhotos = async (files) => {
    if (!files || files.length === 0) return;
    const current = [...(capaForm.afterPhotos || [])];
    const availableSlots = 5 - current.length;
    if (availableSlots <= 0) {
      alert("조치 후 사진은 최대 5장까지 등록 가능합니다.");
      return;
    }
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    for (const file of filesToProcess) {
      const base64 = await compressImage(file, 900, 0.75);
      if (base64) current.push(base64);
    }
    setCapaForm((prev) => ({ ...prev, afterPhotos: current }));
  };

  // Set single After Photo slot
  const handleSetAfterPhotoSlot = async (file, slotIndex) => {
    if (!file) return;
    const base64 = await compressImage(file, 900, 0.75);
    if (!base64) return;
    setCapaForm((prev) => {
      const updated = [...(prev.afterPhotos || [])];
      updated[slotIndex] = base64;
      return { ...prev, afterPhotos: updated.slice(0, 5) };
    });
  };

  // Remove After Photo slot
  const handleRemoveAfterPhoto = (index) => {
    setCapaForm((prev) => ({
      ...prev,
      afterPhotos: (prev.afterPhotos || []).filter((_, i) => i !== index)
    }));
  };

  // Check if CEO has approved
  const checkIsCeoApproved = (rec) => {
    if (!rec) return false;
    return Boolean(
      rec.approvalStatus === "APPROVED" ||
      rec.approvalStatus === "결재완료" ||
      rec.status === "APPROVED" ||
      rec.approvedBy?.includes("권태형") ||
      rec.approvalSignature === "KWON_SIGNATURE_RED"
    );
  };

  // Dynamic Approver Info
  const modalApproverInfo = useMemo(() => {
    if (!capaModalItem) {
      return {
        plant: defaultPlant,
        reviewer: "이창엽 품질부서장",
        approver: "권태형 대표이사",
        lineDisplay: `${managerName} ➔ 이창엽 ➔ 권태형`
      };
    }
    const plant = capaModalItem.plant || capaForm.plant || defaultPlant;
    const isQuality = managerName === "이창엽";
    const lineDisplay = isQuality
      ? "이창엽(상신) ➔ 이명재(검토) ➔ 권태형(승인)"
      : `생산팀장(${managerName}) ➔ 품질부서장(이창엽) ➔ 대표이사(권태형)`;

    return {
      plant,
      reviewer: isQuality ? "이명재 이사" : "이창엽 품질부서장",
      approver: "권태형 대표이사",
      lineDisplay
    };
  }, [capaModalItem, capaForm.plant, managerName, defaultPlant]);

  // Save Progress or Transfer to Unified Abnormality Ledger (전체취합대장)
  const handleSaveAndTransferToUnifiedLedger = async (activeWorkerName = managerName) => {
    if (!capaModalItem) return;
    setIsSubmittingCapa(true);

    try {
      const nowStr = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const actualWorker = activeWorkerName || managerName || "생산관리자";

      // 1. Update Work Report Nonconformance Ledger
      if (ledgerState && typeof setLedgerState === "function") {
        const nextOverrides = {
          ...(ledgerState.overrides || {}),
          [capaModalItem.id]: {
            ...(ledgerState.overrides?.[capaModalItem.id] || {}),
            registrationType: "CHANGE_POINT",
            registeredBy: actualWorker,
            registeredAt: nowStr,
            fourM: capaForm.fourM,
            isSqNotice: capaForm.isSqNotice,
            content: capaForm.content,
            actionResult: capaForm.correctiveAction,
            actionAuthor: capaForm.author || actualWorker,
            actionAt: capaForm.targetDate || nowStr,
            targetDate: capaForm.targetDate,
            beforePhotos: capaForm.beforePhotos,
            afterPhotos: capaForm.afterPhotos,
            beforePhoto: capaForm.beforePhotos[0] || null,
            afterPhoto: capaForm.afterPhotos[0] || null,
            images: capaForm.beforePhotos,
            actionImages: capaForm.afterPhotos,
            status: capaForm.correctiveAction ? "RESOLVED" : "ACTIVE",
            isResolved: Boolean(capaForm.correctiveAction)
          }
        };

        const nextState = { ...ledgerState, overrides: nextOverrides };
        setLedgerState(nextState);
        await saveWorkReportNcLedger(nextState);
      }

      // ⭐ CRITICAL RULE: 생산관리자는 4M 공식대장(four_m_change_points)에 등록할 권한이 없음 (오직 이창엽만 등록 권한 보유)
      // 생산관리자의 변동점 이관은 work_report_nonconformance_ledger_v1의 registrationType: "CHANGE_POINT"로 저장되어
      // 3단계 품질관리 패널의 [위 패널](Step3IncomingTransferredSection)로만 등록됩니다.
      // four_m_change_points(공식대장)에는 절대 직접 등록되지 않으며, 이전 사본이 있다면 안전하게 제거합니다.
      await unregisterFromFourMLedger(capaModalItem.id);
      await unregisterFromFourMLedger(`ledger_${capaModalItem.id}`);

      if (typeof onAfterSave === "function") {
        onAfterSave(capaModalItem, {
          id: capaModalItem.id,
          registrationType: "CHANGE_POINT",
          registeredBy: actualWorker
        });
      }

      setCapaModalItem(null);
    } catch (err) {
      console.error("Failed to save and transfer to unified ledger:", err);
      alert("전체취합대장 이관 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCapa(false);
    }
  };

  return {
    capaModalItem,
    setCapaModalItem,
    capaForm,
    setCapaForm,
    isSubmittingCapa,
    setIsSubmittingCapa,
    previewImage,
    setPreviewImage,
    handleOpenCapaModal,
    handleAddBeforePhotos,
    handleSetBeforePhotoSlot,
    handleRemoveBeforePhoto,
    handleAddAfterPhotos,
    handleSetAfterPhotoSlot,
    handleRemoveAfterPhoto,
    checkIsCeoApproved,
    modalApproverInfo,
    handleSaveAndTransferToUnifiedLedger
  };
};

export default useCapaActionModalState;
