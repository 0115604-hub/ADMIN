import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Check,
  Edit3,
  ExternalLink,
  Info,
  Calendar,
  Factory,
  Wrench,
  UserCheck,
  Send,
  RotateCcw
} from "lucide-react";
import {
  subscribeToExtrusionReports
} from "../../services/extrusionProductionService";
import {
  subscribeMachiningWorkReports
} from "../../services/machiningWorkReportService";
import {
  subscribeHanulWorkReports
} from "../../services/hanulWorkReportService";
import {
  subscribeYuseongWorkReports
} from "../../services/yuseongWorkReportService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  extractWorkReportNonconformances
} from "../common/WorkReportNonconformanceLedgerPanel";
import {
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  registerToFourMLedger,
  unregisterFromFourMLedger,
  getFourMBadgeColor,
  determineFourMCategory
} from "../../services/fourMChangePointService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

// Client-side image compression
const compressImage = (file, maxWidth = 900, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

/**
 * 🛡️ 3단계 품질관리자 변동점 재검토 · 4M 대장 등재 및 시정조치(CAPA) 패널
 * 
 * 담당: 이창엽 책임 (품질보증)
 * 1. 2단계 생산관리자가 이관한 변동점 항목을 심층 재검토
 * 2. [사내관리로 재분류] vs [공식 4M 대장 등재] 구분 판정
 * 3. 5-Why 근본원인 분석 및 시정/예방대책(CAPA) 수립
 * 4. 조치완료 증빙 첨부 후 4단계(이명재 이사 / 권태형 대표이사) 최종 승인 상신
 */
export default function Step3QualityControlPanel({
  currentProfile = null,
  onOpenIssueModal = null
}) {
  const managerName = currentProfile?.name || "이창엽";

  // Raw Work Reports state for extracting transferred items
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [machiningReports, setMachiningReports] = useState([]);
  const [hanulReports, setHanulReports] = useState([]);
  const [yuseongReports, setYuseongReports] = useState([]);
  const [ncLedgerState, setNcLedgerState] = useState(() => getLocalWorkReportNcLedger());

  // 4M Ledger Records
  const [fourMRecords, setFourMRecords] = useState(() => getLocalFourMChangePoints());

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
    rootCause: "",
    correctiveAction: "",
    isSqNotice: false,
    author: managerName,
    afterPhoto: null,
    targetDate: new Date().toISOString().slice(0, 10)
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

    const unsubFourM = subscribeFourMChangePoints((records) => {
      if (isMounted) setFourMRecords(records || []);
    });

    const handleNcLedgerUpdate = (e) => {
      if (isMounted && e?.detail) {
        setNcLedgerState(e.detail);
      }
    };
    window.addEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);

    return () => {
      isMounted = false;
      if (typeof unsubExtrusion === "function") unsubExtrusion();
      if (typeof unsubMachining === "function") unsubMachining();
      if (typeof unsubHanul === "function") unsubHanul();
      if (typeof unsubYuseong === "function") unsubYuseong();
      if (typeof unsubFourM === "function") unsubFourM();
      window.removeEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);
    };
  }, []);

  // 2. Extract Work Report Nonconformance events
  const extractedWorkReportItems = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      hanulReports,
      yuseongReports,
      ledgerState: ncLedgerState
    });
  }, [extrusionReports, machiningReports, hanulReports, yuseongReports, ncLedgerState]);

  // 3. Filter items that 2nd stage managers transferred to Quality (CHANGE_POINT)
  const incomingTransferredItems = useMemo(() => {
    return extractedWorkReportItems.filter((item) => {
      return item.registrationType === "CHANGE_POINT";
    });
  }, [extractedWorkReportItems]);

  // 4. Official 4M Change Point Ledger items
  const official4MItems = useMemo(() => {
    return fourMRecords.filter((rec) => {
      // Must be an official 4M ledger entry or registered with origin/source
      return rec.isOfficialLedger || String(rec.id || "").startsWith("ledger_") || rec.sourceType === "WORK_REPORT_NC" || rec.origin === "변동점";
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

      // Register to 4M Ledger
      await registerToFourMLedger(
        {
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
        },
        managerName
      );

      // Open CAPA modal immediately to allow entering root cause & corrective action
      setCapaModalItem({
        ...item,
        id: `ledger_${item.id}`,
        originalId: item.id,
        fourM: selectedFourM,
        isSqNotice
      });
      setCapaForm({
        fourM: selectedFourM,
        rootCause: item.rootCause || "",
        correctiveAction: item.actionResult || "",
        isSqNotice: isSqNotice,
        author: managerName,
        afterPhoto: item.afterPhoto || null,
        targetDate: new Date().toISOString().slice(0, 10)
      });
    } catch (e) {
      console.error("Failed to register to 4M ledger:", e);
      alert("4M 대장 등재 중 오류가 발생했습니다.");
    }
  };

  // Open CAPA modal for an existing 4M ledger record
  const handleOpenCapaModal = (record) => {
    setCapaModalItem(record);
    setCapaForm({
      fourM: record.fourM || "Machine",
      rootCause: record.rootCause || record.whyAnalysis || "",
      correctiveAction: record.actionResult || record.correctiveAction || "",
      isSqNotice: Boolean(record.isSqNotice),
      author: record.actionAuthor || managerName,
      afterPhoto: (record.actionImages && record.actionImages[0]) || record.afterPhoto || null,
      targetDate: record.targetDate || new Date().toISOString().slice(0, 10)
    });
  };

  // Handle Photo Upload inside CAPA Modal
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 900, 0.75);
      if (base64) {
        setCapaForm((prev) => ({ ...prev, afterPhoto: base64 }));
      }
    } catch (err) {
      console.error("Photo compress error:", err);
      alert("사진 압축 및 첨부에 실패했습니다.");
    }
  };

  // Save CAPA action and optionally submit for Step 4 approval
  const handleSaveCapa = async (isSubmitForApproval = false) => {
    if (!capaModalItem) return;
    if (!capaForm.rootCause.trim() && !capaForm.correctiveAction.trim()) {
      alert("원인분석 또는 시정/예방대책 내용을 입력해주세요.");
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

      const isResolved = Boolean(isSubmitForApproval || capaForm.correctiveAction.trim().length > 0 || capaForm.afterPhoto);

      const updatedRecord = {
        ...capaModalItem,
        fourM: capaForm.fourM,
        rootCause: capaForm.rootCause,
        whyAnalysis: capaForm.rootCause,
        actionResult: capaForm.correctiveAction,
        correctiveAction: capaForm.correctiveAction,
        actionAuthor: capaForm.author || managerName,
        actionAt: nowStr,
        isSqNotice: capaForm.isSqNotice,
        targetDate: capaForm.targetDate,
        isResolved: isResolved,
        status: isResolved ? "RESOLVED" : "PROGRESS",
        approvalStatus: isSubmitForApproval ? "PENDING_APPROVAL" : (capaModalItem.approvalStatus || "DRAFT"),
        approvalRequestedAt: isSubmitForApproval ? nowStr : (capaModalItem.approvalRequestedAt || null),
        actionImages: capaForm.afterPhoto ? [capaForm.afterPhoto] : (capaModalItem.actionImages || [])
      };

      await registerToFourMLedger(updatedRecord, managerName);

      // Also update ncLedgerState overrides if applicable
      const origId = capaModalItem.originalId || capaModalItem.rawId || String(capaModalItem.id).replace(/^ledger_/, "");
      if (ncLedgerState.overrides?.[origId]) {
        const nextOverrides = {
          ...ncLedgerState.overrides,
          [origId]: {
            ...ncLedgerState.overrides[origId],
            actionResult: capaForm.correctiveAction,
            afterPhoto: capaForm.afterPhoto || ncLedgerState.overrides[origId].afterPhoto,
            status: isResolved ? "RESOLVED" : "ACTIVE"
          }
        };
        const nextState = { ...ncLedgerState, overrides: nextOverrides };
        setNcLedgerState(nextState);
        await saveWorkReportNcLedger(nextState);
      }

      setCapaModalItem(null);
      if (isSubmitForApproval) {
        alert("✅ 조치완료 처리되었으며, 4단계 경영진(이사/대표이사) 승인 대기로 상신되었습니다.");
      } else {
        alert("💾 원인분석 및 시정대책이 성공적으로 저장되었습니다.");
      }
    } catch (e) {
      console.error("Save CAPA error:", e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCapa(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-500/40 shadow-xl p-4 sm:p-6 space-y-5 text-left transition-all">
      {/* ========================================================================= */}
      {/* 1. Header Bar with Step 3 Identity */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 text-white shadow-lg shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-black">
                3단계 품질관리자 전용
              </span>
              <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                변동점 재검토 · 4M 대장 등재 및 시정조치(CAPA) 센터
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>담당: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{managerName} 책임</strong> (품질보증팀)</span>
              <span>•</span>
              <span>2단계 생산관리자 이관 건 심층 재검토 ➡️ 4M 공식등재 ➡️ 5-Why 원인분석/시정대책 ➡️ 4단계 경영진 승인 상신</span>
            </p>
          </div>
        </div>

        {/* Real-time KPI Counters */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("INCOMING")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "INCOMING"
                ? "bg-amber-500 text-black border-amber-600 shadow-md font-black"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>이관 접수</span>
            <span className="font-mono font-black text-sm">{stats.incomingCount}건</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("4M_LEDGER")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "4M_LEDGER"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-md font-black"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4M 대장</span>
            <span className="font-mono font-black text-sm">{stats.officialCount}건</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PENDING_APPROVAL")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "PENDING_APPROVAL"
                ? "bg-purple-600 text-white border-purple-700 shadow-md font-black"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/60 hover:bg-purple-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>경영진 승인대기</span>
            <span className="font-mono font-black text-sm">{stats.pendingApprovalCount}건</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-black"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
            }`}
          >
            <span>전체보기</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 1: 2단계 관리자 이관 건 재검토 및 4M 대장 등재 (접수함) */}
      {/* ========================================================================= */}
      {(activeTab === "ALL" || activeTab === "INCOMING") && (
        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-black text-xs">
                접수함
              </span>
              <h4 className="font-black text-sm sm:text-base text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <span>🔔 1. 2단계 생산관리자 이관 건 재검토 ({stats.incomingCount}건 대기)</span>
              </h4>
            </div>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
              ※ 현장 이관 사유를 확인 후 <b>[공식 4M 대장 등재]</b> 또는 <b>[사내관리로 재분류(반송)]</b>를 판정합니다.
            </span>
          </div>

          {incomingTransferredItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                현재 2단계에서 이관되어 검토 대기 중인 항목이 없습니다.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                생산관리자가 작업일보에서 [품질 변동점 이관] 버튼을 클릭하면 실시간으로 이곳에 인입됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingTransferredItems.map((item) => {
                const currentSelection = incomingSelections[item.id] || {
                  fourM: item.fourM || determineFourMCategory(item) || "Machine",
                  isSqNotice: false
                };

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400/60 dark:border-amber-500/40 shadow-sm space-y-3 text-xs"
                  >
                    {/* Item Top Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[11px]">
                          신규 이관 접수
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {item.date} {item.time}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          [{item.plant}] {item.line} {item.carModel ? `(${item.carModel})` : ""}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          (이관자: <strong className="text-slate-700 dark:text-slate-300">{item.registeredBy || item.worker || "생산관리자"}</strong>)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold">
                          {item.defectType || "공정 부적합"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                        {item.downtimeMinutes > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            ⏱️ 비가동 {item.downtimeMinutes}분
                          </span>
                        )}
                        {item.scrapKg > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            🗑️ 폐기 {item.scrapKg} kg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Defect Description */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11.5px] space-y-1">
                      <div className="font-medium">
                        <strong className="text-amber-600 dark:text-amber-400 font-black">현장 발생 및 이관 내용: </strong>
                        {item.content || item.title}
                      </div>
                      {item.actionResult && (
                        <div className="text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-600 dark:text-slate-400">현장 응급조치: </strong>
                          {item.actionResult}
                        </div>
                      )}
                    </div>

                    {/* Image Thumbnail */}
                    {item.beforePhoto && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.beforePhoto)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-500" />
                          <span>현장 증빙 사진 확인</span>
                        </button>
                      </div>
                    )}

                    {/* Quality Manager Action Control Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-black text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                          <span>품질 4M 판정:</span>
                        </span>
                        <select
                          value={currentSelection.fourM}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIncomingSelections((prev) => ({
                              ...prev,
                              [item.id]: { ...(prev[item.id] || {}), fourM: val }
                            }));
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-indigo-500/50 text-indigo-800 dark:text-indigo-300 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Machine">Machine (설비/금형 이상)</option>
                          <option value="Material">Material (자재/원단 불량)</option>
                          <option value="Method">Method (작업방법/조건 변경)</option>
                          <option value="Man">Man (작업자 변경/숙련도)</option>
                        </select>

                        <label className="flex items-center gap-1.5 text-[11.5px] text-slate-700 dark:text-slate-300 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={currentSelection.isSqNotice}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIncomingSelections((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] || {}), isSqNotice: checked }
                              }));
                            }}
                            className="rounded accent-indigo-600 w-3.5 h-3.5"
                          />
                          <span className="text-amber-600 dark:text-amber-400">SQ 고객사 통보 대상</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReclassifyToInternal(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>사내관리로 재분류 (반송)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmToFourMLedger(item)}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 ring-2 ring-indigo-400/40 cursor-pointer"
                        >
                          <span>➕ 공식 4M 대장 등재 및 CAPA 착수</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECTION 2: 공식 4M 변동점 관리대장 & 시정조치(CAPA) 실행 현황 */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs">
              4M 대장
            </span>
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📋 2. 공식 4M 변동점 관리대장 & 시정/예방조치(CAPA) 실행</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {official4MItems.length}건
              </span>
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* 4M Filter */}
            <select
              value={selectedFourMFilter}
              onChange={(e) => setSelectedFourMFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs outline-none cursor-pointer"
            >
              <option value="ALL">4M 전체 구분</option>
              <option value="Machine">Machine (설비)</option>
              <option value="Material">Material (자재)</option>
              <option value="Method">Method (공법)</option>
              <option value="Man">Man (작업자)</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="공정/차종/대책 검색..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* 4M Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 text-[11px] font-black border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 w-28">관리번호</th>
                <th className="py-2.5 px-2 text-center w-20">4M 구분</th>
                <th className="py-2.5 px-2.5 w-28">공정/차종</th>
                <th className="py-2.5 px-3 min-w-[200px]">변동점 및 이상 내용</th>
                <th className="py-2.5 px-3 min-w-[240px]">원인분석 (5-Why) & 시정대책(CAPA)</th>
                <th className="py-2.5 px-2 text-center w-24">진행상태</th>
                <th className="py-2.5 px-3 text-center w-36">3단계 후속조치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {official4MItems
                .filter((rec) => {
                  if (selectedFourMFilter !== "ALL" && rec.fourM !== selectedFourMFilter) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const line = String(rec.line || "").toLowerCase();
                    const title = String(rec.title || "").toLowerCase();
                    const content = String(rec.content || "").toLowerCase();
                    const action = String(rec.actionResult || "").toLowerCase();
                    return line.includes(q) || title.includes(q) || content.includes(q) || action.includes(q);
                  }
                  return true;
                })
                .map((rec) => {
                  const badgeColor = getFourMBadgeColor(rec.fourM);
                  const isResolved = Boolean(rec.isResolved || rec.status === "RESOLVED");
                  const isPendingApproval = rec.approvalStatus === "PENDING_APPROVAL";
                  const isApproved = rec.approvalStatus === "APPROVED";

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* ID / Date */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {String(rec.id).replace(/^ledger_/, "").slice(0, 16)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rec.date} {rec.time}
                        </div>
                      </td>

                      {/* 4M Badge */}
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${badgeColor}`}>
                          {rec.fourM || "Machine"}
                        </span>
                        {rec.isSqNotice && (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9.5px] font-black border border-amber-500/30">
                              SQ통보
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Line / Vehicle */}
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.line || rec.plant}
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {rec.plant}
                        </div>
                      </td>

                      {/* Defect Content */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.title || rec.content}
                        </div>
                        {rec.content && rec.content !== rec.title && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {rec.content}
                          </div>
                        )}
                        {(rec.downtimeMinutes > 0 || rec.scrapKg > 0) && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-slate-400 font-mono">
                            {rec.downtimeMinutes > 0 && <span>⏱️ {rec.downtimeMinutes}분</span>}
                            {rec.scrapKg > 0 && <span>🗑️ {rec.scrapKg}kg</span>}
                          </div>
                        )}
                      </td>

                      {/* Root Cause & Corrective Action */}
                      <td className="py-2.5 px-3">
                        {rec.rootCause && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mb-0.5">
                            <span>🔍 원인: </span>
                            <span>{rec.rootCause}</span>
                          </div>
                        )}
                        {rec.actionResult ? (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            <span className="font-bold">🛠️ 대책: </span>
                            <span>{rec.actionResult}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-500 dark:text-rose-400 font-bold">
                            ⚠️ 시정 및 재발방지대책 수립 필요
                          </div>
                        )}
                        {rec.actionAuthor && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            조치자: {rec.actionAuthor} ({rec.actionAt?.slice(0, 16) || ""})
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-black text-[10.5px]">
                            👑 승인완료
                          </span>
                        ) : isPendingApproval ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold text-[10.5px]">
                            🚀 승인대기
                          </span>
                        ) : isResolved ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[10.5px]">
                            🟢 조치완료
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[10.5px]">
                            🛠️ 대책수립중
                          </span>
                        )}
                      </td>

                      {/* Follow-up Action Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCapaModal(rec)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-500" />
                            <span>대책수정</span>
                          </button>

                          {!isPendingApproval && !isApproved && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenCapaModal(rec);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>4단계 상신</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CAPA / 5-Why 원인분석 및 시정대책 작성 모달 */}
      {/* ========================================================================= */}
      {capaModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    3단계 시정/예방조치(CAPA) 및 5-Why 원인분석
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {capaModalItem.line} • {capaModalItem.title || capaModalItem.content}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCapaModalItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 4M & SQ Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4M 변동점 구분
                  </label>
                  <select
                    value={capaForm.fourM}
                    onChange={(e) => setCapaForm({ ...capaForm, fourM: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Machine">Machine (설비/금형 이상)</option>
                    <option value="Material">Material (원단/원자재 불량)</option>
                    <option value="Method">Method (작업방법/조건 변경)</option>
                    <option value="Man">Man (작업자 숙련도/인원 교체)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SQ 고객사 통보 여부
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capaForm.isSqNotice}
                      onChange={(e) => setCapaForm({ ...capaForm, isSqNotice: e.target.checked })}
                      className="rounded accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      SQ 변동점 신고서 발행 대상
                    </span>
                  </label>
                </div>
              </div>

              {/* 5-Why Root Cause Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🔍 5-Why 근본원인 분석 (발생원인 & 유출원인)
                </label>
                <textarea
                  rows={3}
                  value={capaForm.rootCause}
                  onChange={(e) => setCapaForm({ ...capaForm, rootCause: e.target.value })}
                  placeholder="예: 1-Why) 금형 R부 마모로 인한 스크래치 → 2-Why) 슬러지 고착 및 정기 연마주기 초과 → 근본원인: 정기 점검 체크리스트 미준수"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Corrective & Preventive Action */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🛠️ 시정 및 재발방지대책 (CAPA)
                </label>
                <textarea
                  rows={3}
                  value={capaForm.correctiveAction}
                  onChange={(e) => setCapaForm({ ...capaForm, correctiveAction: e.target.value })}
                  placeholder="예: 긴급조치: 해당 로트 전수 선별 및 다이스 세척 교체 / 재발방지: 금형 R부 세척주기 표준 개정(주 1회→일 1회) 및 초물 검사항목 추가"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Photos & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    📷 조치 후 개선 증빙 사진
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <Camera className="w-4 h-4 text-indigo-500" />
                      <span>사진 첨부하기</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {capaForm.afterPhoto && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(capaForm.afterPhoto)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs cursor-pointer"
                      >
                        사진 미리보기
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    조치 담당자 (품질)
                  </label>
                  <input
                    type="text"
                    value={capaForm.author}
                    onChange={(e) => setCapaForm({ ...capaForm, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCapaModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                닫기
              </button>

              <button
                type="button"
                disabled={isSubmittingCapa}
                onClick={() => handleSaveCapa(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
              >
                임시 저장
              </button>

              <button
                type="button"
                disabled={isSubmittingCapa}
                onClick={() => handleSaveCapa(true)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>조치완료 및 4단계 경영진 승인 상신</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
