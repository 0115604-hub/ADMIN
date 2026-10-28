import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  User,
  TrendingUp,
  Download,
  Settings,
  Clock,
  CheckCircle2
} from "lucide-react";
import {
  subscribeToExtrusionReports,
  deleteExtrusionReport,
  exportExtrusionReportsToExcel
} from "../../services/extrusionProductionService";
import { MajorProcessTemplateSelectModal } from "../common/MajorProcessTemplateSelectModal";
import {
  getLocalProductionOrders,
  saveProductionOrder,
  subscribeProductionOrders
} from "../../services/productionOrderService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  WORK_REPORT_NC_STORAGE_KEY
} from "../common/WorkReportNonconformanceLedgerPanel";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger
} from "../../services/fourMChangePointService";
import { useCapaActionModalState } from "../quality/step3/useCapaActionModalState";
import Step3CapaActionModal from "../quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

const SEOL_EXTRUSION_SLOTS = [
  { id: "ALL", name: "압출 표준", sub: "전체 라인 공통" },
  { id: "pcm1", name: "PCM 1호", sub: "PCM #1 라인" },
  { id: "pcm3", name: "PCM 3호", sub: "PCM #3 라인" },
  { id: "pvc", name: "PVC LINE", sub: "PVC 압출 라인" },
  { id: "tpe", name: "TPE LINE", sub: "TPE 압출 라인" }
];

export const SeolExtrusionWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = "설유철"
}) => {
  const [reports, setReports] = useState([]);
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [lineFilter, setLineFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState(null);
  const [isTemplateSettingOpen, setIsTemplateSettingOpen] = useState(false);

  // 2단계 생산공정: 압출오더 & 비가동 소팅 상태
  const [productionOrders, setProductionOrders] = useState(() => getLocalProductionOrders("extrusion"));
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderModalInput, setOrderModalInput] = useState("");
  const [assignToast, setAssignToast] = useState("");

  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToExtrusionReports((list) => {
      if (isMounted) setReports(list || []);
    });
    const unsubOrders = subscribeProductionOrders("extrusion", (orders) => {
      if (isMounted && orders) setProductionOrders(orders);
    });

    const handleLocalLedgerUpdate = (e) => {
      if (!isMounted) return;
      if (e?.detail) setLedgerState(e.detail);
      else setLedgerState(getLocalWorkReportNcLedger());
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);

    let unsubFirestoreLedger = () => {};
    if (db) {
      try {
        unsubFirestoreLedger = onSnapshot(
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
              setLedgerState(nextState);
            }
          },
          (err) => console.warn("Firestore extrusion ledger listen error:", err)
        );
      } catch (err) {
        console.warn("Firestore extrusion ledger attach error:", err);
      }
    }

    return () => {
      isMounted = false;
      unsub();
      unsubOrders();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
      if (typeof unsubFirestoreLedger === "function") unsubFirestoreLedger();
    };
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (lineFilter !== "all" && r.line !== lineFilter && r.extrusionLine !== lineFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        const w = String(r.worker || r.author || r.leader || "").toLowerCase();
        if (!w.includes(query)) return false;
      }
      if (searchDate) {
        const d = r.date || r.workDate || "";
        if (d !== searchDate) return false;
      }
      return true;
    });
  }, [reports, lineFilter, searchWorker, searchDate]);

  // Stats
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let totalOutputM = 0;
    let totalScrapKg = 0;

    filteredReports.forEach((r) => {
      const out = Number(r.totalOutputMeter || r.outputM || r.goodQty || 0) || 0;
      const scrap = Number(r.scrapWeightKg || r.scrapKg || r.badQty || 0) || 0;
      totalOutputM += out;
      totalScrapKg += scrap;
    });

    return { totalCount, totalOutputM, totalScrapKg };
  }, [filteredReports]);

  // 2단계 생산공정: 압출 오더 및 달성률
  const extrusionOrders = useMemo(() => {
    return { ALL: 9300, pcm1: 2500, pcm3: 3000, pvc: 2000, tpe: 1800, ...(productionOrders || {}) };
  }, [productionOrders]);

  const targetMeter = Number(lineFilter === "all" ? extrusionOrders.ALL : extrusionOrders[lineFilter] || 2500) || 9300;
  const attainmentRate = targetMeter > 0 ? ((stats.totalOutputM / targetMeter) * 100).toFixed(1) : "100.0";
  const yieldRate = (stats.totalOutputM + stats.totalScrapKg) > 0
    ? ((stats.totalOutputM / (stats.totalOutputM + stats.totalScrapKg)) * 100).toFixed(1)
    : "97.5";

  // 2단계 생산공정: 압출 비가동 내역 수합
  const extrusionIncidents = useMemo(() => {
    const list = [];
    const overrides = ledgerState?.overrides || {};

    filteredReports.forEach((r) => {
      if (!r) return;
      const rId = String(r.id || "");
      const date = String(r.date || r.workDate || "").trim();
      const worker = String(r.worker || r.author || r.leader || "설유철").trim();
      const line = String(r.line || r.extrusionLine || "압출라인").trim();
      const dtEvents = Array.isArray(r.downtimeEvents) ? r.downtimeEvents : [];

      dtEvents.forEach((ev, idx) => {
        if (!ev) return;
        const evType = String(ev.type || "").trim();
        const isDefect =
          evType === "불량" ||
          evType === "부적합" ||
          Boolean(ev.beforePhoto || ev.afterPhoto) ||
          String(ev.category || "").includes("불량") ||
          String(ev.category || "").includes("부적합") ||
          Number(ev.minutes) > 0;

        if (!isDefect) return;

        const itemId = `wr_nc_${rId}_${ev.id || idx}`;
        const ov = overrides[itemId] || {};
        if (ov.isDeleted) return;

        const defectType = ov.defectType || ev.category || "압출 비가동";
        const registrationType = ov.registrationType || "UNREGISTERED";

        list.push({
          id: itemId,
          reportId: rId,
          date,
          time: ev.startTime || "",
          worker,
          line,
          defectType,
          minutes: Number(ov.downtimeMinutes !== undefined ? ov.downtimeMinutes : (ev.minutes || 0)),
          scrapKg: Number(ov.scrapKg !== undefined ? ov.scrapKg : (ev.scrapKg || 0)),
          content: ov.content !== undefined ? ov.content : (ev.detail || `${defectType} 발생`),
          actionResult: ov.actionResult !== undefined ? ov.actionResult : (ev.actionDetail || ""),
          beforePhoto: ov.beforePhoto !== undefined ? ov.beforePhoto : (ev.beforePhoto || null),
          afterPhoto: ov.afterPhoto !== undefined ? ov.afterPhoto : (ev.afterPhoto || null),
          registrationType,
          registeredBy: ov.registeredBy || "",
          registeredAt: ov.registeredAt || ""
        });
      });
    });

    return list;
  }, [filteredReports, ledgerState]);

  const incidentStats = useMemo(() => {
    return {
      total: extrusionIncidents.length,
      unsorted: extrusionIncidents.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: extrusionIncidents.filter((i) => i.registrationType === "INTERNAL").length,
      quality: extrusionIncidents.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [extrusionIncidents]);

  const capaModalState = useCapaActionModalState({
    managerName: currentWorkerName || "설유철 책임",
    defaultPlant: "삼랑진공장",
    ledgerState,
    setLedgerState,
    onAfterSave: (item) => {
      setAssignToast(`🚨 [${item.line || "압출라인"}] 조치결과가 전체취합대장(품질 이관)으로 정상 등록되었습니다.`);
      setTimeout(() => setAssignToast(""), 4000);
    }
  });

  const handleSortIncident = async (item, targetType) => {
    if (targetType === "CHANGE_POINT") {
      // ⭐ 품질변동점이관 탭 시: 이창엽의 수정&결재 팝업창과 동일한 CAPA 모달을 열어 조치결과까지 입력 후 전체취합대장으로 이관
      capaModalState.handleOpenCapaModal(item, currentWorkerName || "설유철 책임");
      return;
    }

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const managerName = currentWorkerName || "설유철 책임";
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        registrationType: targetType,
        registeredBy: managerName,
        registeredAt: nowStr
      }
    };

    const nextState = {
      ...ledgerState,
      overrides: nextOverrides
    };
    setLedgerState(nextState);
    await saveWorkReportNcLedger(nextState);

    if (targetType === "INTERNAL") {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`🟢 [${item.line} ${item.defectType}] 건이 사내 내부관리로 종결 처리되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`↩️ [${item.line} ${item.defectType}] 소팅이 초기화되었습니다.`);
    }
    setTimeout(() => setAssignToast(""), 3500);
  };

  const handleSaveOrderModal = async () => {
    const val = parseInt(orderModalInput, 10);
    if (isNaN(val) || val < 0) {
      alert("유효한 수량을 입력해주세요.");
      return;
    }
    const targetKey = lineFilter === "all" ? "ALL" : lineFilter;
    await saveProductionOrder("extrusion", targetKey, val, currentWorkerName);
    setProductionOrders((prev) => ({ ...prev, [targetKey]: val }));
    setAssignToast(`✅ 압출오더가 [${val.toLocaleString()} M]로 설정되었습니다.`);
    setTimeout(() => setAssignToast(""), 3500);
    setOrderModalOpen(false);
  };

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 압출 작업일보를 영구 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteExtrusionReport(id, true);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("다운로드할 압출 작업일보 데이터가 없습니다.");
      return;
    }
    exportExtrusionReportsToExcel(filteredReports, null, "설유철_압출일보현황");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-200 dark:border-teal-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {assignToast && (
        <div className="p-3 rounded-2xl bg-teal-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{assignToast}</span>
          <button type="button" onClick={() => setAssignToast("")} className="cursor-pointer text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>삼랑진공장 압출동 작업일보 & 생산관리 실시간 현황</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-black">
                총 {stats.totalCount}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              설유철 책임 전용 압출 1~4호 라인 실시간 작업 실적 및 일보 현황
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateSettingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 압출 1~4호 라인에 적용할 5대 공정 양식 리스트를 열어 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>양식설정</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>
        </div>
      </div>

      {/* 2단계 압출라인 선택 뱃지 바 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
            <span>🏷️</span> <span>담당 라인 선택:</span>
          </span>
          <button
            type="button"
            onClick={() => setLineFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              lineFilter === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-slate-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            전체 라인 보기 ({reports.length}건)
          </button>
          {["1호기", "2호기", "3호기", "4호기"].map((lineKey) => (
            <button
              key={lineKey}
              type="button"
              onClick={() => setLineFilter(lineFilter === lineKey ? "all" : lineKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                lineFilter === lineKey
                  ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              <span>🏭</span> <span>{lineKey}</span>
              {lineFilter === lineKey && <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
            </button>
          ))}
        </div>

        {lineFilter !== "all" && (
          <button
            type="button"
            onClick={() => setLineFilter("all")}
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>✕ 필터 해제 (전체 보기)</span>
          </button>
        )}
      </div>

      {/* 요약 통계 카드 (오더 vs 실적 달성률 일체형) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: 총 일보 건수 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300">총 작업일보</span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">누적 제출건</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalCount} <span className="text-xs font-normal text-slate-500">건 접수</span>
          </div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
            압출 1~4호기 통합 수합 완료
          </div>
        </div>

        {/* Card 2: 압출 생산량 & 오더 달성률 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300">압출오더 ↔ 생산실적</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(attainmentRate) >= 100 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400" : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-400"}`}>
              달성률 {attainmentRate}%
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">압출오더 (목표)</span>
              <button
                type="button"
                onClick={() => {
                  setOrderModalInput(String(targetMeter));
                  setOrderModalOpen(true);
                }}
                className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm hover:underline cursor-pointer flex items-center gap-1"
                title="클릭하여 당일 압출오더(m)를 수정합니다"
              >
                <span>{targetMeter.toLocaleString()} M</span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {stats.totalOutputM.toLocaleString()} M
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, Number(attainmentRate)))}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: 스크랩 & 수율 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300">스크랩 폐기</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">수율 {yieldRate}%</span>
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {stats.totalScrapKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">Kg 폐기</span>
          </div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
            정상 허용 범위 내 관리 중
          </div>
        </div>
      </div>

      {/* 2단계 생산공정: 당일 압출동 비가동 · 부적합 1차 소팅 바 */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
              <span>⏱️ 당일 압출동 비가동 · 부적합 1차 소팅</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10.5px]">
              전체 {incidentStats.total}건
            </span>
            {incidentStats.unsorted > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10.5px] animate-pulse">
                ⏳ 분류 {incidentStats.unsorted}건
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400 font-bold text-[10.5px]">
                🟢 소팅완료
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10.5px]">
              사내관리 {incidentStats.internal}건
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10.5px]">
              품질이관 {incidentStats.quality}건
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            ※ 설유철 책임 확인 후 원클릭 소팅 ➡️ 품질 변동점 대장 자동 이관
          </span>
        </div>

        {extrusionIncidents.length === 0 ? (
          <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400">
            🟢 오늘 접수된 압출동 일보에 비가동 및 부적합 내역이 없습니다. (정상 가동 중)
          </div>
        ) : (
          <div className="space-y-2">
            {extrusionIncidents.map((inc) => {
              const isUnsorted = !inc.registrationType || inc.registrationType === "UNREGISTERED";
              const isInternal = inc.registrationType === "INTERNAL";
              const isQuality = inc.registrationType === "CHANGE_POINT";

              return (
                <div
                  key={inc.id}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                    isUnsorted
                      ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs"
                      : isQuality
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                      : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnsorted && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                          분류
                        </span>
                      )}
                      {isQuality && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                          🚨 품질이관됨
                        </span>
                      )}
                      {isInternal && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">
                          🟢 사내종결
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[11px]">{inc.date} {inc.time}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inc.line} ({inc.worker || "작업자"})
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10.5px]">
                        {inc.defectType}
                      </span>
                      {inc.minutes > 0 && (
                        <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{inc.minutes}분</span>
                      )}
                      {inc.scrapKg > 0 && (
                        <span className="text-amber-700 dark:text-amber-300 font-mono text-[11px]">{inc.scrapKg}Kg</span>
                      )}
                      {(inc.beforePhoto || inc.afterPhoto) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          📷사진첨부
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11.5px] truncate">
                      {inc.content} {inc.actionResult ? `(조치: ${inc.actionResult})` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {isUnsorted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "INTERNAL")}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          🟢 사내관리
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "CHANGE_POINT")}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          🚨 품질 변동점 이관 ➡️
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        {isQuality && (
                          <button
                            type="button"
                            onClick={() => handleSortIncident(inc, "CHANGE_POINT")}
                            className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1"
                            title="시정조치 및 조치결과 수정"
                          >
                            <span>✏️ 조치수정</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "UNREGISTERED")}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10.5px] font-bold cursor-pointer"
                          title="소팅 취소 및 재설정"
                        >
                          ↩️ 재소팅
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 2단계 관리자: 압출오더 간편 수정 모달 */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-teal-500/80 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-teal-600 text-white font-black text-sm">🎯</span>
                <h4 className="font-black text-sm text-white">
                  압출오더 설정 ({lineFilter === "all" ? "전체 라인" : lineFilter})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                당일 관리자 압출오더 수량 (M)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={orderModalInput}
                onChange={(e) => setOrderModalInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-teal-500/60 font-mono font-black text-white text-base text-right outline-none focus:ring-2 focus:ring-teal-400"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">
                💡 입력하신 압출오더는 현장작업자의 압출작업일보 [🎯 목표수량]에 즉시 자동 반영됩니다.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveOrderModal}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                오더 저장 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 라인</option>
              <option value="1호기">1호기</option>
              <option value="2호기">2호기</option>
              <option value="3호기">3호기</option>
              <option value="4호기">4호기</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="text-xs bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 font-bold"
            />
            {searchDate && (
              <button type="button" onClick={() => setSearchDate("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="작업자/조장 검색"
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="text-xs bg-transparent border-0 outline-none w-24 sm:w-28 text-slate-700 dark:text-slate-200 font-bold"
            />
            {searchWorker && (
              <button type="button" onClick={() => setSearchWorker("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">라인</th>
              <th className="py-2.5 px-3">작업자/조장</th>
              <th className="py-2.5 px-3">차종 / 품명</th>
              <th className="py-2.5 px-3 text-right">생산량 (M)</th>
              <th className="py-2.5 px-3 text-right">스크랩 (Kg)</th>
              <th className="py-2.5 px-3 text-center">승인상태</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-bold">
                  등록된 압출 작업일보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredReports.slice(0, 15).map((r) => {
                const outM = Number(r.totalOutputMeter || r.outputM || r.goodQty || 0) || 0;
                const scrapKg = Number(r.scrapWeightKg || r.scrapKg || r.badQty || 0) || 0;
                const isApproved = Boolean(r.isApproved || r.approved);

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date || r.workDate}
                    </td>
                    <td className="py-2.5 px-3 font-black text-teal-700 dark:text-teal-300">
                      {r.line || r.extrusionLine || "1호기"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {r.worker || r.author || r.leader || "작업자"}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {r.carModel || r.vehicleModel || "공통"} {r.productName ? `(${r.productName})` : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {outM.toLocaleString()} M
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      {scrapKg.toLocaleString()} Kg
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {isApproved ? "승인완료" : "결재대기"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(r.id, e)}
                        disabled={isDeleting === r.id}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="일보 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 5대 공정 양식 설정 모달 (설유철 책임 전용 압출 라인별 양식 매핑) */}
      <MajorProcessTemplateSelectModal
        isOpen={isTemplateSettingOpen}
        onClose={() => setIsTemplateSettingOpen(false)}
        title="삼랑진공장 압출동 5대 공정 작업일보 양식 설정"
        subtitle="압출 1~4호 라인별 적용할 표준 5대 공정 양식을 선택 및 매핑하세요."
        companyKey="EXTRUSION"
        companyName="설유철 압출동"
        slots={SEOL_EXTRUSION_SLOTS}
        defaultCategoryId="EXTRUSION"
        onApplyAndOpenReport={(tpl, slotId) => {
          if (onOpenReportModal) {
            onOpenReportModal({ templateId: tpl?.id, line: slotId });
          }
        }}
      />

      {/* ⭐ 4M 시정조치 수정&결재 및 전체취합대장 이관 모달 (설유철 책임 - 이창엽 수정&결재 팝업과 100% 동일) */}
      {capaModalState.capaModalItem && (
        <Step3CapaActionModal
          capaModalItem={capaModalState.capaModalItem}
          setCapaModalItem={capaModalState.setCapaModalItem}
          capaForm={capaModalState.capaForm}
          setCapaForm={capaModalState.setCapaForm}
          modalApproverInfo={capaModalState.modalApproverInfo}
          checkIsCeoApproved={capaModalState.checkIsCeoApproved}
          handleAddBeforePhotos={capaModalState.handleAddBeforePhotos}
          handleSetBeforePhotoSlot={capaModalState.handleSetBeforePhotoSlot}
          handleRemoveBeforePhoto={capaModalState.handleRemoveBeforePhoto}
          handleAddAfterPhotos={capaModalState.handleAddAfterPhotos}
          handleSetAfterPhotoSlot={capaModalState.handleSetAfterPhotoSlot}
          handleRemoveAfterPhoto={capaModalState.handleRemoveAfterPhoto}
          handleSaveProgress={() => capaModalState.handleSaveAndTransferToUnifiedLedger(currentWorkerName)}
          handleSubmitToElectronicApproval={() => capaModalState.handleSaveAndTransferToUnifiedLedger(currentWorkerName)}
          isSubmittingCapa={capaModalState.isSubmittingCapa}
          setPreviewImage={capaModalState.setPreviewImage}
          modalTitle="4M 시정조치 수정&결재"
          submitButtonText="전체취합대장 이관 등록"
          saveButtonText="수정"
        />
      )}

      {/* 이미지 라이트박스 미리보기 모달 */}
      {capaModalState.previewImage && (
        <ImagePreviewModal
          previewImage={capaModalState.previewImage}
          onClose={() => capaModalState.setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default SeolExtrusionWorkReportTable;
