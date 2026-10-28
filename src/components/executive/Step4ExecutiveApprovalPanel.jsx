import React, { useState, useEffect, useMemo } from "react";
import {
  Crown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Check,
  Edit3,
  ExternalLink,
  Info,
  Calendar,
  Factory,
  Wrench,
  UserCheck,
  Send,
  RotateCcw,
  Stamp,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  registerToFourMLedger,
  getFourMBadgeColor,
  getFourMRecordCompany
} from "../../services/fourMChangePointService";
import {
  approveDocumentStep,
  rejectDocumentStep,
  getLocalApprovalDocs
} from "../../services/approvalService";
import {
  subscribeToExtrusionReports
} from "../../services/extrusionProductionService";
import {
  subscribeMachiningWorkReports
} from "../../services/machiningWorkReportService";
import {
  getLocalWorkReportNcLedger,
  extractWorkReportNonconformances
} from "../common/WorkReportNonconformanceLedgerPanel";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { KWON_SIGNATURE_RED, KWON_SIGNATURE_BLACK } from "../../assets/kwonSignature";
import * as XLSX from "xlsx";

/**
 * 👑 4단계 경영진(이사/대표이사) 변동점 관리대장 최종점검 및 전사 종합현황 승인 패널
 * 
 * 담당: 이명재 이사 (삼랑진 총괄) / 권태형 대표이사 (본사)
 * 1. 1~3단계 전체 제조/품질 파이프라인 실시간 통합 관제
 * 2. 3단계 품질관리자(이창엽 책임)가 상신한 4M 시정조치(CAPA) 심층 점검
 * 3. [최종 승인 및 전자날인] vs [보완 요청 (반려)]
 * 4. 전사 4M 변동점 관리대장 공식 열람 및 엑셀 다운로드
 */
export default function Step4ExecutiveApprovalPanel({
  currentProfile = null,
  onOpenIssueModal = null
}) {
  const executiveName = currentProfile?.name || "권태형";
  const executiveTitle = currentProfile?.title || (currentProfile?.role === "ADMIN" ? "대표이사" : "이사");
  const isKwon = executiveName.includes("권태형") || currentProfile?.id === "admin_kwon";

  // Data streams
  const [fourMRecords, setFourMRecords] = useState(() => getLocalFourMChangePoints());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [machiningReports, setMachiningReports] = useState([]);
  const [ncLedgerState, setNcLedgerState] = useState(() => getLocalWorkReportNcLedger());

  // UI state
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING | APPROVED | ALL_LEDGER | PIPELINE
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFourMFilter, setSelectedFourMFilter] = useState("ALL");
  const [officialLedgerPage, setOfficialLedgerPage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  // Reject / Revision Request Modal state
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Real-time Subscriptions with Strict Cleanup (Zero Memory Leak)
  useEffect(() => {
    let isMounted = true;

    const unsubFourM = subscribeFourMChangePoints((records) => {
      if (isMounted) setFourMRecords(records || []);
    });

    const unsubExtrusion = subscribeToExtrusionReports((reports) => {
      if (isMounted) setExtrusionReports(reports || []);
    });

    const unsubMachining = subscribeMachiningWorkReports((reports) => {
      if (isMounted) setMachiningReports(reports || []);
    });

    const handleNcLedgerUpdate = (e) => {
      if (isMounted && e?.detail) setNcLedgerState(e.detail);
    };
    window.addEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);

    const handleFourMUpdate = (e) => {
      if (isMounted && Array.isArray(e?.detail)) setFourMRecords(e.detail);
    };
    window.addEventListener("oryuk_four_m_updated", handleFourMUpdate);

    return () => {
      isMounted = false;
      if (typeof unsubFourM === "function") unsubFourM();
      if (typeof unsubExtrusion === "function") unsubExtrusion();
      if (typeof unsubMachining === "function") unsubMachining();
      window.removeEventListener("work_report_nc_ledger_updated", handleNcLedgerUpdate);
      window.removeEventListener("oryuk_four_m_updated", handleFourMUpdate);
    };
  }, []);

  // Extract Work Report Items to count Step 1 and Step 2 statistics
  const extractedWorkReportItems = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      ledgerState: ncLedgerState
    });
  }, [extrusionReports, machiningReports, ncLedgerState]);

  // Statistics across the 1-2-3-4 Pipeline
  const pipelineStats = useMemo(() => {
    // 1단계: 작성된 총 일보 건수
    const step1WorkLogCount = (extrusionReports.length || 0) + (machiningReports.length || 0);

    // 2단계: 1차 소팅 건수 (사내관리 vs 품질이관)
    const step2InternalCount = extractedWorkReportItems.filter((i) => i.registrationType === "INTERNAL").length;
    const step2TransferredCount = extractedWorkReportItems.filter((i) => i.registrationType === "CHANGE_POINT").length;

    // 3단계: 공식 4M 대장 등재 및 품질 시정대책 완료 건수
    const official4MList = fourMRecords.filter((rec) => rec.isOfficialLedger || String(rec.id || "").startsWith("ledger_") || rec.sourceType === "WORK_REPORT_NC");
    const step3CapaCompletedCount = official4MList.filter((rec) => rec.isResolved || rec.status === "RESOLVED").length;

    // 4단계: 경영진 승인 대기 건수 vs 승인 완료 건수
    const step4PendingCount = official4MList.filter((rec) => rec.approvalStatus === "PENDING_APPROVAL" || (rec.isResolved && !rec.approvedBy)).length;
    const step4ApprovedCount = official4MList.filter((rec) => rec.approvalStatus === "APPROVED" || rec.approvedBy).length;

    return {
      step1WorkLogCount,
      step2InternalCount,
      step2TransferredCount,
      step3CapaCompletedCount,
      step4PendingCount,
      step4ApprovedCount,
      totalOfficial4M: official4MList.length
    };
  }, [extrusionReports, machiningReports, extractedWorkReportItems, fourMRecords]);

  // Filtered Lists for Executive Review
  const pendingApprovalItems = useMemo(() => {
    return fourMRecords.filter((rec) => {
      const isOfficial = rec.isOfficialLedger || String(rec.id || "").startsWith("ledger_") || rec.sourceType === "WORK_REPORT_NC" || rec.origin === "변동점";
      if (!isOfficial) return false;
      return rec.approvalStatus === "PENDING_APPROVAL" || (rec.isResolved && !rec.approvedBy);
    });
  }, [fourMRecords]);

  const approvedItems = useMemo(() => {
    return fourMRecords.filter((rec) => {
      const isOfficial = rec.isOfficialLedger || String(rec.id || "").startsWith("ledger_") || rec.sourceType === "WORK_REPORT_NC" || rec.origin === "변동점";
      if (!isOfficial) return false;
      return rec.approvalStatus === "APPROVED" || Boolean(rec.approvedBy);
    });
  }, [fourMRecords]);

  const allOfficialItems = useMemo(() => {
    return fourMRecords.filter((rec) => {
      return rec.isOfficialLedger || String(rec.id || "").startsWith("ledger_") || rec.sourceType === "WORK_REPORT_NC" || rec.origin === "변동점";
    });
  }, [fourMRecords]);

  // 4M 대장 8개씩 페이지네이션
  const PAGE_SIZE_OFFICIAL = 8;
  const filteredAllOfficialItems = useMemo(() => {
    return allOfficialItems.filter(
      (rec) => selectedFourMFilter === "ALL" || rec.fourM === selectedFourMFilter
    );
  }, [allOfficialItems, selectedFourMFilter]);

  useEffect(() => {
    setOfficialLedgerPage(1);
  }, [selectedFourMFilter]);

  const officialTotalPages = Math.max(1, Math.ceil(filteredAllOfficialItems.length / PAGE_SIZE_OFFICIAL));

  const paginatedAllOfficialItems = useMemo(() => {
    const start = (officialLedgerPage - 1) * PAGE_SIZE_OFFICIAL;
    return filteredAllOfficialItems.slice(start, start + PAGE_SIZE_OFFICIAL);
  }, [filteredAllOfficialItems, officialLedgerPage]);

  // Executive Approval Action (최종 승인 및 전자날인)
  const handleApproveItem = async (item) => {
    const confirmMsg = `[${item.line} - ${item.title || item.content}]\n\n이 4M 변동점 및 시정조치 건을 ${executiveName} ${executiveTitle} 명의로 최종 승인 및 전자날인하시겠습니까?`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessingAction(true);
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
        ...item,
        approvalStatus: "APPROVED",
        approvedBy: executiveName,
        approvedTitle: executiveTitle,
        approvedAt: nowStr,
        approvalSignature: isKwon ? "KWON_SIGNATURE_RED" : "OFFICIAL_SEAL",
        approvalComment: `${executiveName} ${executiveTitle} 최종 승인 및 전자날인 완료`
      };

      await registerToFourMLedger(updatedRecord, executiveName);

      // ⭐ 연동된 전자결재 공식 품의서 문서가 있는 경우 함께 최종 승인 처리
      if (item.approvalDocId) {
        try {
          const currentDocs = getLocalApprovalDocs();
          const targetDoc = currentDocs.find((d) => d.id === item.approvalDocId);
          const lastStepIdx = (targetDoc?.steps && targetDoc.steps.length > 0) ? targetDoc.steps.length - 1 : 2;

          await approveDocumentStep(
            item.approvalDocId,
            lastStepIdx,
            executiveName,
            `${executiveName} ${executiveTitle} 최종 승인 및 전자날인 완료`,
            { isAdmin: true, isRepresentative: true }
          );
        } catch (apprErr) {
          console.warn("Could not sync approval document in handleApproveItem:", apprErr);
        }
      }

      alert(`👑 [${item.line}] 변동점 대장이 ${executiveName} ${executiveTitle} 명의로 최종 승인 및 전자날인되었습니다.`);
    } catch (e) {
      console.error("Executive approval failed:", e);
      alert("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Rejection / Revision Request (보완 요청 / 반려)
  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      alert("보완 요청 사유를 입력해주세요.");
      return;
    }

    setIsProcessingAction(true);
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
        ...rejectModalItem,
        approvalStatus: "REVISION_REQUESTED",
        rejectionReason: rejectReason,
        rejectedBy: executiveName,
        rejectedTitle: executiveTitle,
        rejectedAt: nowStr,
        isResolved: false,
        status: "PROGRESS"
      };

      await registerToFourMLedger(updatedRecord, executiveName);

      // ⭐ 연동된 전자결재 공식 품의서 문서가 있는 경우 함께 반려 처리
      if (rejectModalItem.approvalDocId) {
        try {
          await rejectDocumentStep(
            rejectModalItem.approvalDocId,
            3,
            executiveName,
            rejectReason
          );
        } catch (apprErr) {
          console.warn("Could not sync reject in handleConfirmReject:", apprErr);
        }
      }

      alert(`↩️ 3단계 품질관리자(이창엽 책임)에게 보완 요청(반려)이 전달되었습니다.`);
      setRejectModalItem(null);
      setRejectReason("");
    } catch (e) {
      console.error("Executive reject failed:", e);
      alert("보완 요청 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      const exportData = allOfficialItems.map((rec, idx) => ({
        "NO": idx + 1,
        "관리번호": String(rec.id).replace(/^ledger_/, ""),
        "발생일자": rec.date || "",
        "공장": rec.plant || "",
        "소속사": getFourMRecordCompany(rec),
        "공정/차종": rec.line || "",
        "4M구분": rec.fourM || "",
        "SQ통보여부": rec.isSqNotice ? "대상" : "해당없음",
        "변동점내용": rec.title || rec.content || "",
        "비가동(분)": rec.downtimeMinutes || 0,
        "폐기량(kg)": rec.scrapKg || 0,
        "시정대책(CAPA)": rec.actionResult || rec.correctiveAction || "",
        "품질검토자": rec.qualityReviewer || rec.actionAuthor || "이창엽",
        "진행상태": rec.approvalStatus === "APPROVED" ? "최종승인완료" : (rec.approvalStatus === "PENDING_APPROVAL" ? "경영진승인대기" : "대책실행중"),
        "최종승인자": rec.approvedBy ? `${rec.approvedBy} (${rec.approvedTitle || ""})` : "",
        "승인일시": rec.approvedAt || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "4M변동점관리대장");
      XLSX.writeFile(workbook, `4M_변동점_관리대장_전사최종승인본_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-purple-500/40 shadow-xl p-4 sm:p-6 space-y-5 text-left transition-all">
      {/* ========================================================================= */}
      {/* 1. Header Bar with Step 4 Identity */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-black">
                경영진 전용
              </span>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>변동점 관리대장 최종점검 및 전사 종합현황 승인 센터</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>담당: <strong className="text-purple-600 dark:text-purple-400 font-black">{executiveName} {executiveTitle}</strong></span>
              <span>•</span>
              <span>품질 상신건 최종 점검 → 전자날인 승인(또는 반려) → 파이프라인 전사 총괄 관제</span>
            </p>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-purple-600 text-white border-purple-700 shadow-md font-black"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/60 hover:bg-purple-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span>최종 승인 대기</span>
            <span className="font-mono font-black text-sm">{pipelineStats.step4PendingCount}건</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("APPROVED")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "APPROVED"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md font-black"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100"
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>승인 완료</span>
            <span className="font-mono font-black text-sm">{pipelineStats.step4ApprovedCount}건</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL_LEDGER")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ALL_LEDGER"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-md font-black"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>전사 4M 대장</span>
            <span className="font-mono font-black text-sm">{pipelineStats.totalOfficial4M}건</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer font-bold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 1 ➡️ 2 ➡️ 3 ➡️ 4단계 전체 파이프라인 실시간 통합 요약 바 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            1단계: 현장작업자
          </div>
          <div className="font-black text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>제출 작업일보</span>
            <span className="font-mono">{pipelineStats.step1WorkLogCount}건</span>
          </div>
          <div className="text-[10px] text-slate-500">실적·초중종·비가동 등록</div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
            2단계: 생산관리자
          </div>
          <div className="font-black text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>비가동 1차 소팅</span>
            <span className="font-mono text-xs">사내 {pipelineStats.step2InternalCount} / 이관 {pipelineStats.step2TransferredCount}</span>
          </div>
          <div className="text-[10px] text-slate-500">생산오더 달성률 & 소팅</div>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            3단계: 품질관리자 (이창엽)
          </div>
          <div className="font-black text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>4M CAPA 대책수립</span>
            <span className="font-mono">{pipelineStats.step3CapaCompletedCount}건 완료</span>
          </div>
          <div className="text-[10px] text-slate-500">CAPA 시정대책 및 조치결과</div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border-2 border-purple-400 dark:border-purple-700 space-y-1 shadow-xs">
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>4단계: 경영진 승인</span>
            {pipelineStats.step4PendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="font-black text-base text-purple-900 dark:text-purple-200 flex items-center justify-between">
            <span>승인 대기 / 완료</span>
            <span className="font-mono text-xs">{pipelineStats.step4PendingCount}건 대기 / {pipelineStats.step4ApprovedCount}건</span>
          </div>
          <div className="text-[10px] text-slate-500">최종 점검 및 전자날인</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: 4단계 최종 승인 대기 결재함 (PENDING) */}
      {/* ========================================================================= */}
      {activeTab === "PENDING" && (
        <div className="space-y-3.5 p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border-2 border-purple-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-xs">
                결재함
              </span>
              <h4 className="font-black text-sm sm:text-base text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>최종 승인 대기 변동점 대장 ({pendingApprovalItems.length}건 결재 대기)</span>
              </h4>
            </div>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
              ※ 품질관리자(이창엽 책임)의 시정대책(CAPA) 증빙을 확인 후 최종 승인합니다.
            </span>
          </div>

          {pendingApprovalItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                현재 경영진 결재 대기 중인 변동점 건이 없습니다.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                품질관리자가 조치완료 후 상신하면 실시간으로 결재함에 도착합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovalItems.map((item) => {
                const badgeColor = getFourMBadgeColor(item.fourM);

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-400/70 dark:border-purple-500/50 shadow-md space-y-3.5 text-xs"
                  >
                    {/* Item Top Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black text-[11px]">
                          결재 요청
                        </span>
                        <span className={`px-2 py-0.5 rounded font-black border text-[11px] ${badgeColor}`}>
                          {item.fourM || "Machine"}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {item.date} {item.time}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          [{item.plant}] {item.line}
                        </span>
                        {item.isSqNotice && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-black text-[10.5px]">
                            SQ 고객사 통보 대상
                          </span>
                        )}
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
                      <strong className="text-slate-900 dark:text-white font-black">현장 이상 내용: </strong>
                      <span>{item.title || item.content}</span>
                    </div>

                    {/* 3단계 품질관리자 CAPA 분석 결과 */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11.5px] space-y-1">
                      <div className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <span>🛠️ 시정 및 재발방지대책 (CAPA):</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {item.actionResult || item.correctiveAction || "시정 및 재발방지대책 기록됨"}
                      </p>
                    </div>

                    {/* Photo Proof & Reviewer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500 font-bold">
                          품질 검토/상신: <strong className="text-slate-800 dark:text-slate-200">{item.actionAuthor || item.qualityReviewer || "이창엽 책임"}</strong> ({item.actionAt || item.registeredAt})
                        </span>
                        {(item.images?.length > 0 || item.actionImages?.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              const img = item.actionImages?.[0] || item.images?.[0];
                              if (img) setPreviewImage(img);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>개선 증빙 사진 확인</span>
                          </button>
                        )}
                      </div>

                      {/* Executive Action Bar */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => {
                            setRejectModalItem(item);
                            setRejectReason("");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-400 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>보완 요청 (반려)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => handleApproveItem(item)}
                          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 ring-2 ring-purple-400/40 cursor-pointer"
                        >
                          <Stamp className="w-4 h-4" />
                          <span>최종 승인 및 전자날인</span>
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
      {/* 4. SECTION: 승인 완료 이력 (APPROVED) */}
      {/* ========================================================================= */}
      {activeTab === "APPROVED" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Stamp className="w-4 h-4 text-emerald-600" />
              <span>경영진 최종 승인 완료 대장 ({approvedItems.length}건)</span>
            </h4>
            <span className="text-xs text-slate-400">
              ※ 이명재 이사 / 권태형 대표이사 전자서명이 날인된 최종 확정본입니다.
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-28">관리번호</th>
                  <th className="py-2.5 px-2 text-center w-20">4M 구분</th>
                  <th className="py-2.5 px-3 w-32">소속사 / 공정</th>
                  <th className="py-2.5 px-3 min-w-[200px]">변동점 및 이상 내용</th>
                  <th className="py-2.5 px-3 min-w-[240px]">시정 및 재발방지대책 (CAPA)</th>
                  <th className="py-2.5 px-3 text-center w-36">최종 승인 및 전자서명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {approvedItems.map((rec) => {
                  const badgeColor = getFourMBadgeColor(rec.fourM);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {String(rec.id).replace(/^ledger_/, "").slice(0, 16)}
                        <div className="text-[10px] text-slate-400">{rec.date}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${badgeColor}`}>
                          {rec.fourM || "Machine"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-black">
                            {getFourMRecordCompany(rec)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {rec.line || rec.plant}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{rec.title || rec.content}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{rec.actionResult || "시정대책 완료"}</div>
                        <div className="text-[10px] text-slate-400">품질담당: {rec.actionAuthor || "이창엽"}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/60">
                          {rec.approvedBy?.includes("권태형") ? (
                            <img
                              src={KWON_SIGNATURE_RED}
                              alt="권태형 서명"
                              className="h-7 w-auto object-contain"
                            />
                          ) : (
                            <div className="font-black text-rose-600 border-2 border-rose-500 rounded px-1.5 py-0.5 text-[10px]">
                              {rec.approvedBy || "이명재"} 印
                            </div>
                          )}
                          <span className="text-[9.5px] font-bold text-purple-800 dark:text-purple-300 mt-0.5">
                            {rec.approvedBy} {rec.approvedTitle || "승인"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SECTION: 전사 4M 관리대장 전체 (ALL_LEDGER) */}
      {/* ========================================================================= */}
      {activeTab === "ALL_LEDGER" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>전사 공식 4M 변동점 관리대장 종합 ({allOfficialItems.length}건)</span>
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={selectedFourMFilter}
                onChange={(e) => setSelectedFourMFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
              >
                <option value="ALL">4M 전체 구분</option>
                <option value="Machine">Machine</option>
                <option value="Material">Material</option>
                <option value="Method">Method</option>
                <option value="Man">Man</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-28">관리번호</th>
                  <th className="py-2.5 px-2 text-center w-20">4M 구분</th>
                  <th className="py-2.5 px-3 w-32">소속사 / 공정</th>
                  <th className="py-2.5 px-3 min-w-[200px]">변동점 내용</th>
                  <th className="py-2.5 px-3 min-w-[220px]">시정대책(CAPA) 및 조치결과</th>
                  <th className="py-2.5 px-2 text-center w-24">진행상태</th>
                  <th className="py-2.5 px-3 text-center w-32">최종 결재</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedAllOfficialItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-bold text-xs">
                      등록된 공식 4M 변동점 대장 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedAllOfficialItems.map((rec) => {
                    const badgeColor = getFourMBadgeColor(rec.fourM);
                    const isApproved = rec.approvalStatus === "APPROVED" || Boolean(rec.approvedBy);
                    const isPending = rec.approvalStatus === "PENDING_APPROVAL";

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                          {String(rec.id).replace(/^ledger_/, "").slice(0, 16)}
                          <div className="text-[10px] text-slate-400">{rec.date}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${badgeColor}`}>
                            {rec.fourM || "Machine"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-black">
                              {getFourMRecordCompany(rec)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {rec.line || rec.plant}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{rec.title || rec.content}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {rec.actionResult || "대책 수립중"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {isApproved ? (
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 text-[10.5px] font-black">
                              👑 승인완료
                            </span>
                          ) : isPending ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 text-[10.5px] font-bold">
                              🚀 승인대기
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 text-[10.5px] font-bold">
                              🛠️ 조치중
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isApproved ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              {rec.approvedBy} ({rec.approvedTitle || "승인"})
                            </span>
                          ) : isPending ? (
                            <button
                              type="button"
                              onClick={() => handleApproveItem(rec)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                            >
                              승인결재 ➡️
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">3단계 진행중</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 🌟 전사 공식 4M 변동점 관리대장 8개씩 페이지네이션 */}
          {officialTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-bold text-[11.5px]">
                <span>총 {filteredAllOfficialItems.length}건 중 </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  {(officialLedgerPage - 1) * PAGE_SIZE_OFFICIAL + 1} - {Math.min(officialLedgerPage * PAGE_SIZE_OFFICIAL, filteredAllOfficialItems.length)}건
                </span>
                <span> 노출 (페이지 {officialLedgerPage} / {officialTotalPages})</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOfficialLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={officialLedgerPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 font-bold transition cursor-pointer"
                  title="이전 페이지"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: officialTotalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setOfficialLedgerPage(num)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition cursor-pointer ${
                      officialLedgerPage === num
                        ? "bg-purple-600 text-white shadow-xs"
                        : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOfficialLedgerPage((p) => Math.min(officialTotalPages, p + 1))}
                  disabled={officialLedgerPage === officialTotalPages}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 font-bold transition cursor-pointer"
                  title="다음 페이지"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection / Revision Request Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl shadow-2xl w-full max-w-lg p-5 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  품질관리자(이창엽 책임)에게 보완 요청 (반려)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                대상: <strong className="text-slate-900 dark:text-white">{rejectModalItem.line} - {rejectModalItem.title || rejectModalItem.content}</strong>
              </div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                보완 및 재검토 요청 사유:
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 시정대책(CAPA) 및 유효성 검증 데이터 보완 필요. 조치 후 유효성 검증 데이터(초중종 3회 치수 측정표)를 추가 첨부하여 재상신 바랍니다."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md"
              >
                보완요청(반려) 전송
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
