import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  User,
  ArrowRight,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Settings
} from "lucide-react";
import {
  subscribeHanulWorkReports,
  deleteHanulWorkReport,
  exportHanulReportToExcel,
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  isExcludedFromWorkReport
} from "../services/hanulWorkReportService";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey
} from "../services/workReportTemplateService";
import {
  getLocalWorkReportNcLedger,
  WORK_REPORT_NC_STORAGE_KEY
} from "./common/WorkReportNonconformanceLedgerPanel";
import { MachiningIncidentSortingBar } from "./machining/table/MachiningIncidentSortingBar";
import Step3CapaActionModal from "./quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "./common/ImagePreviewModal";
import HanulTemplateAssignmentModal from "./hanul/table/HanulTemplateAssignmentModal";
import { useHanulIncidents } from "./hanul/table/useHanulIncidents";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * HanulWorkReportTable
 * Main management dashboard for Hanul work reports:
 * - 9BQC G/RUN & LQ2a Hood Side performance & yield statistics
 * - Real-time report table list with excel export, edit, and deletion
 * - 1st-stage incident sorting (Internal company vs Quality CAPA)
 * - Process-slot template assignment modal
 */
export const HanulWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  // 🌟 5대 공정 양식 보관함 리스트 & 9BQC / LQ2a 공정표 기반 양식 설정 상태
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [settingProject, setSettingProject] = useState(null); // "9BQC" | "LQ2A" | null
  const [settingProcessId, setSettingProcessId] = useState("소재준비");
  const [settingSubSlot, setSettingSubSlot] = useState("정치절단");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [draftProcessSlots, setDraftProcessSlots] = useState({});
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [assignToast, setAssignToast] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // 2단계 생산공정: 한울 비가동 및 부적합 1차 소팅 상태
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeHanulWorkReports((list) => {
      if (isMounted) setReports(list || []);
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (isMounted && Array.isArray(list)) setAllTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (isMounted && map) setTemplateAssignments(map);
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
          }
        );
      } catch (err) {}
    }

    return () => {
      isMounted = false;
      unsub();
      unsubTemplates();
      unsubAssign();
      unsubFirestoreLedger();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
    };
  }, []);

  const getDefaultSubSlotForProcess = (proj, procId) => {
    if (procId === "소재준비") return proj === "9BQC" ? "정치절단" : "작업일보";
    if (procId === "조인트") return "FRT";
    if (procId === "검사") return "LENGTH";
    return "MAIN";
  };

  const handleOpenTemplateSetting = (projKey) => {
    const normalized = String(projKey || "").toUpperCase() === "LQ2A" ? "LQ2A" : "9BQC";
    const firstProc = (HANUL_PROCESSES[normalized] || [])[0]?.id || "소재준비";
    setSettingProject(normalized);
    setSettingProcessId(firstProc);
    setSettingSubSlot(getDefaultSubSlotForProcess(normalized, firstProc));
    setDraftProcessSlots({ ...(templateAssignments?.processSlots || {}) });
    setSelectedCategoryFilter("ALL");
  };

  const handleSwitchSettingProject = (projKey) => {
    const normalized = String(projKey || "").toUpperCase() === "LQ2A" ? "LQ2A" : "9BQC";
    const firstProc = (HANUL_PROCESSES[normalized] || [])[0]?.id || "소재준비";
    setSettingProject(normalized);
    setSettingProcessId(firstProc);
    setSettingSubSlot(getDefaultSubSlotForProcess(normalized, firstProc));
  };

  const handleSwitchSettingProcess = (procId) => {
    setSettingProcessId(procId);
    setSettingSubSlot(getDefaultSubSlotForProcess(settingProject || "9BQC", procId));
  };

  const currentSlotKey = useMemo(() => {
    if (!settingProject) return "";
    return buildHanulProcessSlotKey(settingProject, settingProcessId, settingSubSlot);
  }, [settingProject, settingProcessId, settingSubSlot]);

  const currentSlotTemplateId = currentSlotKey ? draftProcessSlots?.[currentSlotKey] || null : null;
  const currentSlotTemplateObj = useMemo(() => {
    if (!currentSlotTemplateId) return null;
    return (allTemplates || []).find((t) => t.id === currentSlotTemplateId) || null;
  }, [allTemplates, currentSlotTemplateId]);

  const handleToggleTemplateSelect = (tplId) => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      if (next[currentSlotKey] === tplId) {
        delete next[currentSlotKey];
      } else {
        next[currentSlotKey] = tplId;
      }
      return next;
    });
  };

  const handleClearCurrentSlotTemplate = () => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      delete next[currentSlotKey];
      return next;
    });
  };

  const handleSaveTemplateSetting = async (openModalAfter = false) => {
    if (!settingProject) return;
    setIsSavingAssign(true);
    try {
      const targetProj = settingProject;
      const targetProc = settingProcessId;
      const projPrefix = `${targetProj}__`;
      const assignedIdsForProj = Object.entries(draftProcessSlots || {})
        .filter(([k, v]) => k.startsWith(projPrefix) && Boolean(v))
        .map(([, v]) => v);
      await saveHanulTemplateAssignment(targetProj, assignedIdsForProj, draftProcessSlots);
      const projLabel = targetProj === "9BQC" ? "9BQC G/RUN" : "LQ2a Hood Side";
      setAssignToast(`✅ [${projLabel} • ${targetProc}] 공정에 선택한 작업일보 양식이 적용 저장되었습니다!`);
      setTimeout(() => setAssignToast(""), 3500);
      setSettingProject(null);
      if (openModalAfter && onOpenReportModal) {
        onOpenReportModal(targetProj, targetProc);
      }
    } catch (e) {
      console.error(e);
      alert("양식 설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingAssign(false);
    }
  };

  const filteredModalTemplates = useMemo(() => {
    return (allTemplates || []).filter((tpl) => {
      if (selectedCategoryFilter !== "ALL" && tpl.categoryId !== selectedCategoryFilter) return false;
      return true;
    });
  }, [allTemplates, selectedCategoryFilter]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 🔒 관리자(김동훈, 황수현 등)는 작업일보 작성이 없으므로 실적 집계 및 현황 목록에서 제외
      if (isExcludedFromWorkReport(r.worker)) return false;
      if (projectFilter !== "all" && r.project !== projectFilter) return false;
      if (processFilter !== "all" && r.processId !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let bqcGenuine = 0;
    let bqcBad = 0;
    let lq2Genuine = 0;
    let lq2Bad = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine) || 0;
      const b = Number(r.totals?.bad) || 0;
      if (r.project === "9BQC") {
        bqcGenuine += g;
        bqcBad += b;
      } else {
        lq2Genuine += g;
        lq2Bad += b;
      }
    });

    const bqcGross = bqcGenuine + bqcBad;
    const bqcYield = bqcGross > 0 ? ((bqcGenuine / bqcGross) * 100).toFixed(1) : "100.0";

    const lq2Gross = lq2Genuine + lq2Bad;
    const lq2Yield = lq2Gross > 0 ? ((lq2Genuine / lq2Gross) * 100).toFixed(1) : "100.0";

    return { totalCount, bqcGenuine, bqcBad, bqcYield, lq2Genuine, lq2Bad, lq2Yield };
  }, [filteredReports]);

  // 2단계 생산공정: 비가동 및 부적합 1차 소팅 서브모듈
  const {
    hanulIncidents,
    incidentStats,
    capaModalState,
    handleSortIncident
  } = useHanulIncidents({
    filteredReports,
    ledgerState,
    setLedgerState,
    currentWorkerName,
    setAssignToast
  });

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    setIsDeleting(id);
    try {
      await deleteHanulWorkReport(id);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {/* Toast Alert */}
      {assignToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <span>{assignToast}</span>
          <button
            type="button"
            onClick={() => setAssignToast("")}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="min-w-0">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>한울 작업일보현황</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                {filteredReports.length}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              9BQC G/RUN 및 LQ2a Hood Side 세부 공정 실시간 보고서 관리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("9BQC")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 9BQC 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>9BQC일보설정</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("LQ2A")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 LQ2a 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>LQ2a일보설정</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("9BQC", "소재준비")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>작업일보 등록</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">
            9BQC 생산실적
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-black text-indigo-950 dark:text-indigo-100">
              {stats.bqcGenuine.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              EA ({stats.bqcYield}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
            LQ2a 생산실적
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-black text-purple-950 dark:text-purple-100">
              {stats.lq2Genuine.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              EA ({stats.lq2Yield}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
            총 양품 수량
          </span>
          <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">
            {(stats.bqcGenuine + stats.lq2Genuine).toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">
            총 불량 수량
          </span>
          <span className="text-lg font-black text-rose-950 dark:text-rose-100">
            {(stats.bqcBad + stats.lq2Bad).toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>
      </div>

      {/* 2단계 생산공정: 당일 한울 비가동 · 부적합 1차 소팅 바 */}
      <MachiningIncidentSortingBar
        incidentStats={incidentStats}
        machiningIncidents={hanulIncidents}
        handleSortIncident={handleSortIncident}
        title="당일 한울(한림) 비가동 · 부적합 1차 소팅"
        emptyText="🟢 오늘 접수된 한울 일보에 비가동 및 부적합 내역이 없습니다. (정상 가동 중)"
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Project Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setProjectFilter("all"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              projectFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            전체 차종
          </button>
          <button
            type="button"
            onClick={() => { setProjectFilter("9BQC"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              projectFilter === "9BQC" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            <span>🚗 9BQC</span>
          </button>
          <button
            type="button"
            onClick={() => { setProjectFilter("LQ2A"); setProcessFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              projectFilter === "LQ2A" ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            <span>⚡ LQ2a</span>
          </button>
        </div>

        {/* Process Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setProcessFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              processFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
            }`}
          >
            전체 공정
          </button>
          {((projectFilter === "all" ? HANUL_PROCESSES["9BQC"] : HANUL_PROCESSES[projectFilter]) || []).map((proc) => (
            <button
              key={proc.id}
              type="button"
              onClick={() => setProcessFilter(proc.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                processFilter === proc.id ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500"
              }`}
            >
              {proc.name}
            </button>
          ))}
        </div>

        {/* Search Worker */}
        <div className="relative">
          <input
            type="text"
            value={searchWorker}
            onChange={(e) => setSearchWorker(e.target.value)}
            placeholder="작업자 검색..."
            className="pl-7 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-28 sm:w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate("")}
              className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3 py-2.5">일자</th>
              <th className="px-3 py-2.5">차종</th>
              <th className="px-3 py-2.5">공정명</th>
              <th className="px-3 py-2.5">작업자</th>
              <th className="px-3 py-2.5 text-right">양품수량</th>
              <th className="px-3 py-2.5 text-right">불량</th>
              <th className="px-3 py-2.5 text-right">양품률</th>
              <th className="px-3 py-2.5 text-center">비가동</th>
              <th className="px-3 py-2.5">비고</th>
              <th className="px-3 py-2.5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-slate-400">
                  등록된 한울 작업일보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => {
                const genuine = Number(rep.totals?.genuine) || 0;
                const bad = Number(rep.totals?.bad) || 0;
                const gross = genuine + bad;
                const yieldPct = gross > 0 ? ((genuine / gross) * 100).toFixed(1) : "100.0";
                const downtimeMins = (rep.downtimeEvents || []).reduce((acc, cur) => acc + (Number(cur.minutes) || 0), 0);

                return (
                  <tr
                    key={rep.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(rep.project, rep.processId, rep)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                      {rep.date || "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        rep.project === "9BQC"
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      }`}>
                        {rep.project || "9BQC"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {rep.processName || rep.processId || "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                      {rep.worker || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {genuine.toLocaleString()} EA
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {bad > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {bad.toLocaleString()} EA
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                      <span className={Number(yieldPct) >= 99 ? "text-emerald-600" : Number(yieldPct) >= 95 ? "text-indigo-600" : "text-amber-600"}>
                        {yieldPct}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {downtimeMins > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          {downtimeMins}분
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-xs truncate text-slate-500" title={rep.remark}>
                      {rep.remark || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportHanulReportToExcel(rep);
                          }}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="엑셀 다운로드"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportModal && onOpenReportModal(rep.project, rep.processId, rep);
                          }}
                          className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(rep.id, e)}
                          disabled={isDeleting === rep.id}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 공정표 기반 5대 공정 양식 적용 설정 모달 (9BQC일보설정 / LQ2a일보설정) */}
      <HanulTemplateAssignmentModal
        settingProject={settingProject}
        setSettingProject={setSettingProject}
        allTemplates={allTemplates}
        draftProcessSlots={draftProcessSlots}
        settingProcessId={settingProcessId}
        settingSubSlot={settingSubSlot}
        setSettingSubSlot={setSettingSubSlot}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        handleSwitchSettingProject={handleSwitchSettingProject}
        handleSwitchSettingProcess={handleSwitchSettingProcess}
        handleToggleTemplateSelect={handleToggleTemplateSelect}
        handleClearCurrentSlotTemplate={handleClearCurrentSlotTemplate}
        handleSaveTemplateSetting={handleSaveTemplateSetting}
        isSavingAssign={isSavingAssign}
        currentSlotTemplateId={currentSlotTemplateId}
        currentSlotTemplateObj={currentSlotTemplateObj}
        previewTemplate={previewTemplate}
        setPreviewTemplate={setPreviewTemplate}
        filteredModalTemplates={filteredModalTemplates}
      />

      {/* 🌟 3단계 품질관리자(이창엽 책임) 연동 CAPA 시정조치 & 품질이관 등록 모달 */}
      <Step3CapaActionModal
        isOpen={capaModalState.isCapaModalOpen}
        onClose={capaModalState.handleCloseCapaModal}
        capaModalItem={capaModalState.capaModalItem}
        capaFourM={capaModalState.capaFourM}
        setCapaFourM={capaModalState.setCapaFourM}
        capaActionResult={capaModalState.capaActionResult}
        setCapaActionResult={capaModalState.setCapaActionResult}
        capaStatus={capaModalState.capaStatus}
        setCapaStatus={capaModalState.setCapaStatus}
        capaBeforePhoto={capaModalState.capaBeforePhoto}
        setCapaBeforePhoto={capaModalState.setCapaBeforePhoto}
        capaAfterPhoto={capaModalState.capaAfterPhoto}
        setCapaAfterPhoto={capaModalState.setCapaAfterPhoto}
        isSavingCapa={capaModalState.isSavingCapa}
        onSaveCapa={capaModalState.handleSaveCapaAction}
        isQualityManager={false}
        managerName={currentWorkerName || "한울 관리자"}
        isOfficialLedger={false}
      />

      {/* 사진 미리보기 모달 */}
      {previewImg && (
        <ImagePreviewModal
          isOpen={Boolean(previewImg)}
          imageUrl={previewImg}
          onClose={() => setPreviewImg(null)}
        />
      )}
    </div>
  );
};
export default HanulWorkReportTable;
