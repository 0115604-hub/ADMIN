import { useState, useEffect, useMemo } from "react";
import {
  subscribeToExtrusionReports
} from "../../../services/extrusionProductionService";
import {
  subscribeMachiningWorkReports
} from "../../../services/machiningWorkReportService";
import {
  subscribeHanulWorkReports
} from "../../../services/hanulWorkReportService";
import {
  subscribeYuseongWorkReports
} from "../../../services/yuseongWorkReportService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  extractWorkReportNonconformances,
  WORK_REPORT_NC_STORAGE_KEY
} from "../../common/WorkReportNonconformanceLedgerPanel";
import { subscribeWorkLogs } from "../../../services/workLogService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  registerToFourMLedger,
  unregisterFromFourMLedger,
  determineFourMCategory
} from "../../../services/fourMChangePointService";
import {
  saveApprovalDocument,
  subscribeApprovalDocs
} from "../../../services/approvalService";
import { compressImage } from "./imageCompressUtil";

export const useStep3QualityState = ({
  currentProfile = null,
  onNavigateTab = null
}) => {
  const managerName = currentProfile?.name || "이창엽";

  // Raw Work Reports state for extracting transferred items
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [machiningReports, setMachiningReports] = useState([]);
  const [hanulReports, setHanulReports] = useState([]);
  const [yuseongReports, setYuseongReports] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [ncLedgerState, setNcLedgerState] = useState(() => getLocalWorkReportNcLedger());

  // 4M Ledger Records
  const [fourMRecords, setFourMRecords] = useState(() => getLocalFourMChangePoints());
  const [approvalDocs, setApprovalDocs] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | INCOMING | 4M_LEDGER | PENDING_APPROVAL | RESOLVED
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFourMFilter, setSelectedFourMFilter] = useState("ALL");
  const [previewImage, setPreviewImage] = useState(null);

  // Per-item inline selection for 4M classification in the incoming review section
  const [incomingSelections, setIncomingSelections] = useState({});

  // CAPA Action Modal state
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
    plant: "삼랑진공장",
    line: ""
  });
  const [isSubmittingCapa, setIsSubmittingCapa] = useState(false);

  // 1. Safe Real-time Subscriptions (with strict cleanup to prevent memory leaks)
  useEffect(() => {
    let isMounted = true;

    const unsubExtrusion = subscribeToExtrusionReports((reports) => {
      if (isMounted) setExtrusionReports(reports || []);
    });

    const unsubMachining = subscribeMachiningWorkReports((reports) => {
      if (isMounted) setMachiningReports(reports || []);
    });

    const unsubHanul = subscribeHanulWorkReports((reports) => {
      if (isMounted) setHanulReports(reports || []);
    });

    const unsubYuseong = subscribeYuseongWorkReports((reports) => {
      if (isMounted) setYuseongReports(reports || []);
    });

    const unsubWorkLogs = subscribeWorkLogs((logs) => {
      if (isMounted) setWorkLogs(logs || []);
    });

    const unsubFourM = subscribeFourMChangePoints((records) => {
      if (isMounted) setFourMRecords(records || []);
    });

    const unsubApproval = subscribeApprovalDocs((docs) => {
      if (isMounted) setApprovalDocs(docs || []);
    });

    const handleNcLedgerUpdate = (e) => {
      if (isMounted && e?.detail) {
        setNcLedgerState(e.detail);
      }
    };
    window.addEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);

    let unsubFirestoreNc = () => {};
    if (db) {
      try {
        unsubFirestoreNc = onSnapshot(
          doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY),
          (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              const data = snap.data();
              const nextState = {
                overrides: data?.overrides || {},
                manualItems: Array.isArray(data?.manualItems) ? data.manualItems : []
              };
              try {
                localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, JSON.stringify(nextState));
              } catch (err) {}
              setNcLedgerState(nextState);
            }
          }
        );
      } catch (err) {
        console.warn("Firestore NC ledger subscribe error in step3:", err);
      }
    }

    const handleFourMUpdate = (e) => {
      if (isMounted && Array.isArray(e?.detail)) {
        setFourMRecords(e.detail);
      }
    };
    window.addEventListener("oryuk_four_m_updated", handleFourMUpdate);

    return () => {
      isMounted = false;
      if (typeof unsubExtrusion === "function") unsubExtrusion();
      if (typeof unsubMachining === "function") unsubMachining();
      if (typeof unsubHanul === "function") unsubHanul();
      if (typeof unsubYuseong === "function") unsubYuseong();
      if (typeof unsubWorkLogs === "function") unsubWorkLogs();
      if (typeof unsubFourM === "function") unsubFourM();
      if (typeof unsubApproval === "function") unsubApproval();
      if (typeof unsubFirestoreNc === "function") unsubFirestoreNc();
      window.removeEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);
      window.removeEventListener("oryuk_four_m_updated", handleFourMUpdate);
    };
  }, []);

  // 1-1. Approval docs map for fast status check
  const approvalDocsMap = useMemo(() => {
    const map = {};
    (approvalDocs || []).forEach((d) => {
      if (!d) return;
      if (d.id) map[d.id] = d;
      if (d.id && d.id.startsWith("appr_4m_")) {
        const parts = d.id.split("_");
        if (parts[2]) {
          map[parts[2]] = d;
          map[`ledger_${parts[2]}`] = d;
        }
      }
    });
    return map;
  }, [approvalDocs]);

  // Helper: check if a 4M record has final approval by CEO (권태형 대표이사)
  const checkIsCeoApproved = (rec) => {
    if (!rec) return false;
    const docMatch =
      (rec.approvalDocId && approvalDocsMap[rec.approvalDocId]) ||
      approvalDocsMap[rec.id] ||
      approvalDocsMap[String(rec.id).replace(/^ledger_/, "")] ||
      (approvalDocs || []).find((d) =>
        d.id === rec.approvalDocId ||
        (d.id && rec.id && d.id.includes(rec.id)) ||
        (d.id && rec.id && d.id.includes(String(rec.id).replace(/^ledger_/, ""))) ||
        (rec.originalId && d.id && d.id.includes(rec.originalId))
      );

    return Boolean(
      rec.approvalStatus === "APPROVED" ||
      rec.approvalStatus === "결재완료" ||
      rec.status === "APPROVED" ||
      rec.status === "결재완료" ||
      rec.approvedBy?.includes("권태형") ||
      rec.approvalSignature === "KWON_SIGNATURE_RED" ||
      (docMatch && (
        docMatch.status === "APPROVED" ||
        docMatch.approvalStatus === "APPROVED" ||
        (docMatch.steps && docMatch.steps.length > 0 && docMatch.steps[docMatch.steps.length - 1]?.status === "APPROVED")
      ))
    );
  };

  // 2. Extract Work Report Nonconformance events
  const extractedWorkReportItems = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      hanulReports,
      yuseongReports,
      workLogs,
      ledgerState: ncLedgerState
    });
  }, [extrusionReports, machiningReports, hanulReports, yuseongReports, workLogs, ncLedgerState]);

  // 3. Filter items that 2nd stage managers transferred to Quality (CHANGE_POINT) -> 위 패널 (Step3IncomingTransferredSection)
  const incomingTransferredItems = useMemo(() => {
    const map = new Map();

    // 1) From extracted work report items with registrationType === "CHANGE_POINT"
    extractedWorkReportItems.forEach((item) => {
      if (item && item.registrationType === "CHANGE_POINT") {
        const key = item.id;
        const ov = ncLedgerState?.overrides?.[key] || ncLedgerState?.overrides?.[String(key).replace(/^ledger_/, "")] || {};
        if (ov.registrationType === "INTERNAL" || ov.registrationType === "OFFICIAL_LEDGER" || ov.isDeleted) {
          return;
        }
        map.set(key, item);
      }
    });

    // 2) From fourMRecords where item was transferred from 2nd stage (isOfficialLedger !== true or registrationType === "CHANGE_POINT")
    (fourMRecords || []).forEach((rec) => {
      if (!rec) return;
      const isIncoming =
        rec.isOfficialLedger === false ||
        rec.registrationType === "CHANGE_POINT" ||
        (rec.sourceType === "WORK_REPORT_NC" && !rec.isOfficialLedger && rec.classifiedBy !== "이창엽");
      if (isIncoming) {
        const key = rec.originalId || rec.rawId || rec.id;
        const ov = ncLedgerState?.overrides?.[key] || ncLedgerState?.overrides?.[rec.id] || {};
        if (ov.registrationType === "INTERNAL" || ov.registrationType === "OFFICIAL_LEDGER" || ov.isDeleted) {
          return;
        }
        if (!map.has(key)) {
          map.set(key, {
            ...rec,
            id: key,
            registrationType: "CHANGE_POINT",
            downtimeMinutes: Number(rec.downtimeMinutes || 0),
            scrapKg: Number(rec.scrapKg || 0),
            beforePhoto: rec.beforePhotos?.[0] || rec.beforePhoto || rec.images?.[0] || null,
            afterPhoto: rec.afterPhotos?.[0] || rec.afterPhoto || rec.actionImages?.[0] || null
          });
        }
      }
    });

    // 3) Direct fallback from ncLedgerState.overrides where registrationType === "CHANGE_POINT"
    const overrides = ncLedgerState?.overrides || {};
    Object.entries(overrides).forEach(([key, ov]) => {
      if (ov && ov.registrationType === "CHANGE_POINT" && !ov.isDeleted && ov.registrationType !== "OFFICIAL_LEDGER" && ov.registrationType !== "INTERNAL" && !map.has(key)) {
        const rId = key.replace(/^wr_nc_def_/, "").replace(/^wr_nc_/, "").split("_")[0];
        const allReps = [...extrusionReports, ...machiningReports, ...hanulReports, ...yuseongReports, ...(workLogs || [])];
        const matchedRep = allReps.find((r) => String(r.id || "") === rId || key.includes(String(r.id || "")));

        map.set(key, {
          id: key,
          reportId: rId,
          date: ov.actionAt || matchedRep?.date || new Date().toISOString().slice(0, 10),
          time: matchedRep?.time || "",
          company: matchedRep?.company || ov.company || "오륙",
          plant: matchedRep?.plant || ov.plant || "삼랑진공장",
          line: matchedRep?.line || matchedRep?.project || ov.line || "생산라인",
          worker: ov.actionAuthor || matchedRep?.worker || ov.registeredBy || "생산관리자",
          defectType: ov.defectType || "공정 부적합",
          title: ov.title || `[품질이관] ${ov.line || matchedRep?.line || ""} - ${ov.defectType || ov.content || "부적합"}`,
          content: ov.content || "",
          actionResult: ov.actionResult || "",
          scrapKg: Number(ov.scrapKg || 0),
          downtimeMinutes: Number(ov.downtimeMinutes || 0),
          beforePhoto: ov.beforePhoto || ov.beforePhotos?.[0] || null,
          afterPhoto: ov.afterPhoto || ov.afterPhotos?.[0] || null,
          images: ov.beforePhotos || (ov.beforePhoto ? [ov.beforePhoto] : []),
          actionImages: ov.afterPhotos || (ov.afterPhoto ? [ov.afterPhoto] : []),
          registrationType: "CHANGE_POINT",
          registeredBy: ov.registeredBy || "생산관리자",
          registeredAt: ov.registeredAt || "",
          fourM: ov.fourM || "Machine",
          source: "WORK_REPORT"
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.date !== a.date) return String(b.date || "").localeCompare(String(a.date || ""));
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [extractedWorkReportItems, fourMRecords, ncLedgerState, extrusionReports, machiningReports, hanulReports, yuseongReports, workLogs]);

  // 4. Official 4M Change Point Ledger items (오직 이창엽 책임자 공식 등록분만 100% 영구 보존/노출)
  const official4MItems = useMemo(() => {
    return fourMRecords.filter((rec) => {
      if (!rec) return false;
      // 🔒 생산관리자 이관 건(WORK_REPORT_NC)은 이창엽의 공식 등록 이전에는 절대 공식대장에 노출 금지
      if (rec.isOfficialLedger === false) return false;
      if (rec.sourceType === "WORK_REPORT_NC" && rec.isOfficialLedger !== true) return false;
      if (rec.registrationType === "CHANGE_POINT" && rec.isOfficialLedger !== true) return false;

      // 4M 공식대장 등록권한은 오직 이창엽에게만 있음
      const isOfficial =
        rec.isOfficialLedger === true ||
        rec.classifiedBy === "이창엽" ||
        rec.registeredBy === "이창엽" ||
        rec.qualityReviewer === "이창엽";

      return Boolean(isOfficial);
    });
  }, [fourMRecords]);

  // Statistics
  const stats = useMemo(() => {
    const incomingCount = incomingTransferredItems.length;
    const officialCount = official4MItems.length;
    const pendingApprovalCount = official4MItems.filter(
      (it) => it.approvalStatus === "PENDING_APPROVAL" || (it.isResolved && !it.approvedBy)
    ).length;
    const resolvedCount = official4MItems.filter(
      (it) => it.isResolved || it.status === "RESOLVED" || it.approvalStatus === "APPROVED"
    ).length;

    return { incomingCount, officialCount, pendingApprovalCount, resolvedCount };
  }, [incomingTransferredItems, official4MItems]);

  // Handle reclassifying an incoming item to Internal (사내관리로 재분류 - 반송)
  const handleReclassifyToInternal = async (item) => {
    const confirmMsg = `[${item.line} - ${item.defectType || item.content}]\n\n이 건을 '사내관리(현장 자체 조치 종결)'로 재분류하시겠습니까?\n품질 4M 대장에서는 제외되며 현장 내부관리로 유지됩니다.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const nowStr = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const nextOverrides = {
        ...(ncLedgerState.overrides || {}),
        [item.id]: {
          ...(ncLedgerState.overrides?.[item.id] || {}),
          registrationType: "INTERNAL",
          registeredBy: managerName,
          registeredAt: nowStr,
          qualityReviewNote: `[품질 3단계 재검토] ${managerName} 책임: 사내관리(현장 자체 종결)로 재분류 판정`
        }
      };

      const nextState = {
        ...ncLedgerState,
        overrides: nextOverrides
      };

      setNcLedgerState(nextState);
      await saveWorkReportNcLedger(nextState);
      await unregisterFromFourMLedger(item.id);
    } catch (e) {
      console.error("Failed to reclassify to internal:", e);
      alert("재분류 처리 중 오류가 발생했습니다.");
    }
  };

  // Open CAPA modal for an existing 4M ledger record or an incoming record
  const handleOpenCapaModal = (record) => {
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

    const defaultPlant = record.plant || (String(record.line || "").includes("한림") ? "한림공장" : "삼랑진공장");

    setCapaForm({
      fourM: record.fourM || "Machine",
      title: record.title || "",
      content: record.content || record.details || record.defectType || record.title || "",
      rootCause: record.rootCause || record.whyAnalysis || "",
      correctiveAction: record.actionResult || record.correctiveAction || "",
      isSqNotice: Boolean(record.isSqNotice),
      author: record.actionAuthor || managerName,
      beforePhotos: initialBefore.slice(0, 5),
      afterPhotos: initialAfter.slice(0, 5),
      targetDate: record.targetDate || new Date().toISOString().slice(0, 10),
      plant: defaultPlant,
      line: record.line || ""
    });
  };

  // Handle confirming an incoming item into the Official 4M Change Point Ledger
  const handleConfirmToFourMLedger = async (item) => {
    const selectedFourM = incomingSelections[item.id]?.fourM || item.fourM || determineFourMCategory(item) || "Machine";
    const isSqNotice = Boolean(incomingSelections[item.id]?.isSqNotice);

    try {
      const nowStr = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\. /g, "-").replace(/\./g, "");

      const createdLedgerItem = {
        id: `ledger_${item.id}`,
        originalId: item.id,
        rawId: item.id,
        fourM: selectedFourM,
        origin: "작업일보 부적합",
        sourceType: "WORK_REPORT_NC",
        plant: item.plant || "삼랑진공장",
        line: item.line || item.company || "생산라인",
        writer: `${managerName} (품질책임)`,
        title: item.title || `[4M 변동점] ${item.line} - ${item.defectType || item.content}`,
        date: item.date,
        time: item.time || "",
        content: item.content || item.defectType || "",
        actionResult: item.actionResult || "",
        actionAuthor: item.actionResult ? managerName : "",
        actionAt: item.actionResult ? nowStr : "",
        images: item.beforePhoto ? [item.beforePhoto] : (item.images || []),
        actionImages: item.afterPhoto ? [item.afterPhoto] : (item.actionImages || []),
        isResolved: Boolean(item.actionResult || item.afterPhoto || item.status === "RESOLVED"),
        scrapKg: Number(item.scrapKg) || 0,
        downtimeMinutes: Number(item.downtimeMinutes) || 0,
        registrationBadge: "변동점등록",
        isOfficialLedger: true,
        isSqNotice: isSqNotice,
        qualityReviewer: managerName,
        qualityReviewedAt: nowStr,
        status: item.actionResult ? "RESOLVED" : "PROGRESS"
      };

      await registerToFourMLedger(createdLedgerItem, managerName);

      // 🌟 3단계 공식대장 승인 완료 ➔ ncLedgerState에 OFFICIAL_LEDGER로 반영하여 접수함에서 제거
      const nextOverrides = {
        ...(ncLedgerState.overrides || {}),
        [item.id]: {
          ...(ncLedgerState.overrides?.[item.id] || {}),
          registrationType: "OFFICIAL_LEDGER",
          registeredBy: managerName,
          registeredAt: nowStr
        }
      };
      const nextState = { ...ncLedgerState, overrides: nextOverrides };
      setNcLedgerState(nextState);
      await saveWorkReportNcLedger(nextState);

      handleOpenCapaModal(createdLedgerItem);
    } catch (e) {
      console.error("Failed to register to 4M ledger:", e);
      alert("4M 대장 등재 중 오류가 발생했습니다.");
    }
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

  // Replace / Set specific slot for Before photo
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

  // Remove specific Before photo
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

  // Replace / Set specific slot for After photo
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

  // Remove specific After photo
  const handleRemoveAfterPhoto = (index) => {
    setCapaForm((prev) => ({
      ...prev,
      afterPhotos: (prev.afterPhotos || []).filter((_, i) => i !== index)
    }));
  };

  // Save Progress (임시 저장)
  const handleSaveProgress = async () => {
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

      const updatedRecord = {
        ...capaModalItem,
        fourM: capaForm.fourM,
        title: capaForm.title || capaModalItem.title,
        content: capaForm.content || capaModalItem.content,
        rootCause: capaForm.rootCause,
        whyAnalysis: capaForm.rootCause,
        actionResult: capaForm.correctiveAction,
        correctiveAction: capaForm.correctiveAction,
        actionAuthor: capaForm.author || managerName,
        actionAt: nowStr,
        isSqNotice: capaForm.isSqNotice,
        targetDate: capaForm.targetDate,
        beforePhotos: capaForm.beforePhotos,
        causeImages: capaForm.beforePhotos,
        images: capaForm.beforePhotos,
        afterPhotos: capaForm.afterPhotos,
        actionImages: capaForm.afterPhotos
      };

      await registerToFourMLedger(updatedRecord, managerName);
      alert("💾 대책 내용이 성공적으로 수정되었습니다.");
      setCapaModalItem(null);
    } catch (e) {
      console.error("Save progress error:", e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCapa(false);
    }
  };

  // Submit to Electronic Approval
  const handleSubmitToElectronicApproval = async () => {
    if (!capaModalItem) return;

    // ⭐ 엄격한 결재 상신 권한 및 자동상신금지 (품질관리 책임자 이창엽 전용)
    const isLeeChangYeop = managerName === "이창엽" || currentProfile?.name === "이창엽";
    const isAdmin = currentProfile?.role === "ADMIN" || currentProfile?.id === "admin" || currentProfile?.name === "권태형";
    if (!isLeeChangYeop && !isAdmin) {
      alert("4M 변동점 전자결재 상신은 품질관리 책임자(이창엽)만 상신할 수 있습니다.\n자동상신 및 비인가 상신의 결재함 등록은 엄격히 금지되어 있습니다.");
      return;
    }

    const effectiveAction =
      capaForm.correctiveAction?.trim() ||
      capaModalItem.actionResult?.trim() ||
      capaModalItem.correctiveAction?.trim();

    if (!effectiveAction) {
      alert("시정 및 재발방지대책(조치결과) 내용을 입력해주세요.");
      return;
    }

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

      const plant = capaModalItem.plant || capaForm.plant || "삼랑진공장";
      const isHanlim = plant === "한림공장" || String(capaModalItem.line || "").includes("한림");

      const drafterName = "이창엽";
      const reviewerName = "이명재";
      const approverName = "권태형";
      const approverTitle = "대표이사";
      const approverRole = "이창엽(상신) ➔ 이명재(검토) ➔ 권태형(승인)";

      const docId = `appr_4m_${capaModalItem.id}_${Date.now()}`;
      const docNumber = `4M-${isHanlim ? "HL" : "SRJ"}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const docTitle = `[4M 변동점 결재] [${plant}] ${capaModalItem.line || ""} - ${capaModalItem.title || capaForm.content || "변동점 시정대책"}`;

      const steps = [
        {
          role: "담당",
          name: drafterName,
          title: "책임",
          status: "APPROVED",
          date: nowStr,
          comment: `4M 변동점 및 시정대책(CAPA) 기안 상신 (품질관리 책임 이창엽)`
        },
        {
          role: "검토",
          name: reviewerName,
          title: "이사",
          status: "PENDING",
          date: "",
          comment: ""
        },
        {
          role: "승인",
          name: approverName,
          title: approverTitle,
          status: "WAITING",
          date: "",
          comment: ""
        }
      ];

      const docPayload = {
        id: docId,
        docNumber: docNumber,
        title: docTitle,
        category: "품의서",
        type: "FOUR_M_CHANGE_POINT",
        typeName: "4M 변동점 및 CAPA 승인 품의서",
        plant: plant,
        department: "품질보증팀",
        drafter: "이창엽",
        drafterTitle: "책임",
        submittedByManager: "이창엽",
        fourM: capaForm.fourM,
        isSqNotice: capaForm.isSqNotice,
        line: capaModalItem.line || "",
        content: [
          `[4M 변동점 및 이상발생 내용]`,
          `• 발생공장: [${plant}] ${capaModalItem.line || ""}`,
          `• 4M 변동 구분: ${capaForm.fourM}`,
          `• SQ 고객사 통보: ${capaForm.isSqNotice ? "통보 대상 (변동점 신고서 제출)" : "사내관리 종결"}`,
          `• 변동점 및 이상내용: ${capaForm.content || capaModalItem.title}`,
          capaModalItem.downtimeMinutes > 0 ? `• 비가동 시간: ${capaModalItem.downtimeMinutes}분` : "",
          capaModalItem.scrapKg > 0 ? `• 폐기량: ${capaModalItem.scrapKg}kg` : "",
          ``,
          `[조치결과 및 시정/예방대책 (CAPA)]`,
          `${effectiveAction}`,
          ``,
          `[조치 담당자 및 기한]`,
          `• 조치 담당자: ${capaForm.author || "이창엽"}`,
          `• 상신 관리자: 이창엽 (품질책임)`,
          `• 조치완료(예정)일: ${capaForm.targetDate}`,
          `• 증빙사진: 조치 전 ${capaForm.beforePhotos.length}장 / 조치 후 ${capaForm.afterPhotos.length}장 첨부됨`
        ].filter(Boolean).join("\n"),
        causeImages: capaForm.beforePhotos,
        actionImages: capaForm.afterPhotos,
        images: [...capaForm.beforePhotos, ...capaForm.afterPhotos],
        steps: steps,
        currentStep: 2,
        status: "IN_PROGRESS",
        createdAt: nowStr,
        updatedAt: nowStr
      };

      await saveApprovalDocument(docPayload, { isDirectManualDraft: true });

      const updatedRecord = {
        ...capaModalItem,
        fourM: capaForm.fourM,
        title: capaForm.title || capaModalItem.title,
        content: capaForm.content || capaModalItem.content,
        rootCause: capaForm.rootCause,
        whyAnalysis: capaForm.rootCause,
        actionResult: capaForm.correctiveAction,
        correctiveAction: capaForm.correctiveAction,
        actionAuthor: capaForm.author || "이창엽",
        actionAt: nowStr,
        isSqNotice: capaForm.isSqNotice,
        targetDate: capaForm.targetDate,
        beforePhotos: capaForm.beforePhotos,
        causeImages: capaForm.beforePhotos,
        images: capaForm.beforePhotos,
        afterPhotos: capaForm.afterPhotos,
        actionImages: capaForm.afterPhotos,
        isResolved: true,
        status: "RESOLVED",
        approvalStatus: "PENDING_APPROVAL",
        approvalDocId: docId,
        targetApprover: approverRole,
        approvalRequestedAt: nowStr
      };

      await registerToFourMLedger(updatedRecord, "이창엽");

      const origId = capaModalItem.originalId || capaModalItem.rawId || String(capaModalItem.id).replace(/^ledger_/, "");
      if (ncLedgerState.overrides?.[origId]) {
        const nextOverrides = {
          ...ncLedgerState.overrides,
          [origId]: {
            ...ncLedgerState.overrides[origId],
            actionResult: capaForm.correctiveAction,
            afterPhoto: capaForm.afterPhotos[0] || null,
            status: "RESOLVED"
          }
        };
        const nextState = { ...ncLedgerState, overrides: nextOverrides };
        setNcLedgerState(nextState);
        await saveWorkReportNcLedger(nextState);
      }

      setCapaModalItem(null);
      localStorage.setItem("active_approval_doc_id", docId);

      alert(`✅ [4M 변동점 임원결재 상신 완료]\n\n• 공장: ${plant}\n• 결재라인: ${approverRole}\n\n전자결재 문서함으로 이동합니다.`);

      if (typeof onNavigateTab === "function") {
        onNavigateTab("electronic_approval");
      }
    } catch (e) {
      console.error("Submit approval error:", e);
      alert("전자결재 상신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCapa(false);
    }
  };

  const modalApproverInfo = useMemo(() => {
    if (!capaModalItem) {
      return {
        plant: "전사 4M 변동점",
        reviewer: "이명재 이사",
        approver: "권태형 대표이사",
        lineDisplay: "이창엽(상신) ➔ 이명재(검토) ➔ 권태형(승인)"
      };
    }
    const plant = capaModalItem.plant || capaForm.plant || "삼랑진공장";
    return {
      plant,
      reviewer: "이명재 이사",
      approver: "권태형 대표이사",
      lineDisplay: "이창엽(상신) ➔ 이명재(검토) ➔ 권태형(승인)"
    };
  }, [capaModalItem, capaForm.plant]);

  return {
    managerName,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedFourMFilter,
    setSelectedFourMFilter,
    previewImage,
    setPreviewImage,
    incomingSelections,
    setIncomingSelections,
    capaModalItem,
    setCapaModalItem,
    capaForm,
    setCapaForm,
    isSubmittingCapa,
    approvalDocs,
    approvalDocsMap,
    checkIsCeoApproved,
    incomingTransferredItems,
    official4MItems,
    stats,
    handleReclassifyToInternal,
    handleOpenCapaModal,
    handleConfirmToFourMLedger,
    handleAddBeforePhotos,
    handleSetBeforePhotoSlot,
    handleRemoveBeforePhoto,
    handleAddAfterPhotos,
    handleSetAfterPhotoSlot,
    handleRemoveAfterPhoto,
    handleSaveProgress,
    handleSubmitToElectronicApproval,
    modalApproverInfo
  };
};
