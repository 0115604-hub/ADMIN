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
  Settings,
  Check,
  X,
  Save,
  Database,
  ShieldCheck,
  FileText,
  Scissors,
  Eye
} from "lucide-react";
import TemplateAppliedPreviewModal from "./common/TemplateAppliedPreviewModal";
import {
  subscribeHanulWorkReports,
  deleteHanulWorkReport,
  exportHanulReportToExcel,
  HANUL_PROJECTS,
  HANUL_PROCESSES,
  HANUL_JOINT_TYPES,
  HANUL_INSPECTION_TYPES,
  HANUL_WORKERS_MASTER,
  isExcludedFromWorkReport
} from "../services/hanulWorkReportService";
import {
  REPORT_MAJOR_CATEGORIES,
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey
} from "../services/workReportTemplateService";

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

  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setReports(list || []);
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) setAllTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (map) setTemplateAssignments(map);
    });
    return () => {
      unsub();
      unsubTemplates();
      unsubAssign();
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
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
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
            {Array.isArray(templateAssignments?.["9BQC"]) && templateAssignments["9BQC"].length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] font-black">
                {templateAssignments["9BQC"].length}개 지정
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("LQ2A")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 LQ2a 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>LQ2a일보설정</span>
            {Array.isArray(templateAssignments?.["LQ2A"]) && templateAssignments["LQ2A"].length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] font-black">
                {templateAssignments["LQ2A"].length}개 지정
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 현재 설정된 9BQC / LQ2a 지정 양식 바로가기 안내 바 */}
      {((templateAssignments?.["9BQC"]?.length > 0) || (templateAssignments?.["LQ2A"]?.length > 0)) && (
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>작업자 적용 양식:</span>
            </span>
            {templateAssignments?.["9BQC"]?.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenReportModal && onOpenReportModal("9BQC")}
                className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-black text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="클릭 시 9BQC 지정 양식으로 작업일보 기록창 열기"
              >
                <span>🚗 9BQC ({templateAssignments["9BQC"].length}개 양식 기록 열기)</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {templateAssignments?.["LQ2A"]?.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenReportModal && onOpenReportModal("LQ2A")}
                className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 font-black text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="클릭 시 LQ2a 지정 양식으로 작업일보 기록창 열기"
              >
                <span>⚡ LQ2a ({templateAssignments["LQ2A"].length}개 양식 기록 열기)</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            작업자가 로그인 시 위 설정된 양식이 즉시 열립니다.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">
            등록 일보 건수
          </span>
          <span className="text-lg font-black text-indigo-950 dark:text-indigo-100">
            {stats.totalCount} <span className="text-xs font-normal">건</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
              9BQC 정품 / 양품률
            </span>
            <span className="text-[10px] font-black text-emerald-600">
              {stats.bqcYield}%
            </span>
          </div>
          <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">
            {stats.bqcGenuine.toLocaleString()} <span className="text-xs font-normal">EA</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
              LQ2a 정품 / 양품률
            </span>
            <span className="text-[10px] font-black text-purple-600">
              {stats.lq2Yield}%
            </span>
          </div>
          <span className="text-lg font-black text-purple-950 dark:text-purple-100">
            {stats.lq2Genuine.toLocaleString()} <span className="text-xs font-normal">EA</span>
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
        <select
          value={processFilter}
          onChange={(e) => setProcessFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
        >
          <option value="all">전체 공정</option>
          <option value="소재준비">소재준비 (정치절단/단컷팅)</option>
          <option value="조인트">조인트</option>
          <option value="본드로봇">본드로봇</option>
          <option value="검사">검사</option>
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold"
        />
        {searchDate && (
          <button
            type="button"
            onClick={() => setSearchDate("")}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            초기화
          </button>
        )}

        {/* Worker search */}
        <input
          type="text"
          placeholder="작업자 검색..."
          value={searchWorker}
          onChange={(e) => setSearchWorker(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold placeholder:text-slate-400"
        />
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black">
              <th className="p-3">작업일자</th>
              <th className="p-3">차종 / 부품</th>
              <th className="p-3">공정명</th>
              <th className="p-3">작업자</th>
              <th className="p-3 text-center">근무</th>
              <th className="p-3 text-right">정품 (EA)</th>
              <th className="p-3 text-right">불량 (EA)</th>
              <th className="p-3 text-right">리워크</th>
              <th className="p-3 text-center">양품률</th>
              <th className="p-3 text-center">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">
                  등록된 가공/협력업체 작업일보가 없습니다. 상단의 [+ 일보 작성] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => {
                const isBQC = rep.project === "9BQC";
                const gCount = Number(rep.totals?.genuine) || 0;
                const bCount = Number(rep.totals?.bad) || 0;
                const rCount = Number(rep.totals?.rework) || 0;
                const yieldR = rep.totals?.yieldRate || "100.0";

                return (
                  <tr
                    key={rep.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(rep.project, rep.processId, rep)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {rep.date}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[11px] ${
                        isBQC
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      }`}>
                        {isBQC ? "🚗" : "⚡"} {rep.projectName || rep.project}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{rep.processName || rep.processId}</span>
                        {rep.subProcess && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {rep.subProcess === "정치절단" ? "✂️ 정치절단" : "📐 단컷팅"}
                          </span>
                        )}
                        {rep.jointType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {rep.jointType === "FRT" ? "🚗 FRT"
                              : rep.jointType === "FIXED_LH" ? "📐 FIXED LH"
                              : rep.jointType === "FIXED_RH" ? "📐 FIXED RH"
                              : "⚡ RR"}
                          </span>
                        )}
                        {rep.inspectionType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {rep.inspectionType === "LENGTH" ? "📏 길이검사"
                              : rep.inspectionType === "SQUARE" ? "📐 직각검사"
                              : rep.inspectionType === "FINAL_PAIR" ? "🏁 최종(LH/RH)"
                              : rep.inspectionType === "FINAL_LH" ? "🏁 최종(LH)"
                              : rep.inspectionType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {rep.worker}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        rep.shift === "야간"
                          ? "bg-slate-800 text-slate-200"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                      }`}>
                        {rep.shift || "주간"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {gCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {bCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {rCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-black whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded ${
                        Number(yieldR) >= 98
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40"
                          : "text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40"
                      }`}>
                        {yieldR}%
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
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

      {/* ===================================================================== */}
      {/* 🌟 공정표 기반 5대 공정 양식 적용 설정 모달 (9BQC일보설정 / LQ2a일보설정) */}
      {/* ===================================================================== */}
      {settingProject && (
        <div
          onClick={() => setSettingProject(null)}
          className="fixed inset-0 z-[250] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-white border-2 border-indigo-500/60 rounded-3xl w-full max-w-5xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden text-left"
          >
            {/* 1. 상단 타이틀 + 공정표 (9BQC G/RUN • LQ2a Hood Side / 공정선택 / 단계선택) */}
            <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-2xl text-white shadow-md shrink-0 ${
                    settingProject === "9BQC" ? "bg-indigo-600" : "bg-purple-600"
                  }`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-lg font-black text-white">
                        {settingProject === "9BQC" ? "🚗 9BQC일보설정" : "⚡ LQ2a일보설정"} — 공정표 위치 지정 & 5대 공정 양식 적용
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>5대공정 양식 {allTemplates.length}개</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-200 mt-0.5">
                      ① 아래 공정표에서 양식을 넣을 공정을 먼저 클릭한 뒤 ➔ ② 하단 5대 공정 양식 리스트에서 적용할 양식을 선택하세요.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingProject(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 🌟 [공정표 1단] 차종/품목 큰 카드 (9BQC G/RUN | LQ2a Hood Side) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/60">
                {HANUL_PROJECTS.map((p) => {
                  const isActive = settingProject === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSwitchSettingProject(p.id)}
                      className={`p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600/90 border-indigo-300 text-white shadow-md shadow-indigo-950/50 scale-[1.01]"
                          : "bg-white/5 border-slate-700/80 text-slate-300 hover:bg-white/10 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base sm:text-lg">{p.id === "9BQC" ? "🚗" : "⚡"}</span>
                        <div className="text-left min-w-0">
                          <span className="font-black text-xs sm:text-sm block truncate leading-tight">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-indigo-200 block truncate">
                            {p.carModel} • {p.partName}
                          </span>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🌟 [공정표 2단] 공정선택 탭 바 (1. 소재준비 / 2. 조인트 / 3. 본드로봇 / 4. 검사) */}
            <div className="px-3.5 sm:px-5 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
              <div className="flex items-center justify-between gap-2 min-w-max">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>공정선택:</span>
                  </span>
                  {(HANUL_PROCESSES[settingProject] || []).map((proc, idx) => {
                    const isSelected = settingProcessId === proc.id;
                    const procPrefix = `${settingProject}__${proc.id}__`;
                    const assignedCountForProc = Object.entries(draftProcessSlots || {}).filter(
                      ([k, v]) => k.startsWith(procPrefix) && Boolean(v)
                    ).length;

                    return (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => handleSwitchSettingProcess(proc.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                        }`}
                      >
                        <span className="opacity-75 text-[10px]">{idx + 1}.</span>
                        <span>{proc.id}</span>
                        {assignedCountForProc > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                            ✓{assignedCountForProc}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🌟 [공정표 3단] 세부 단계 / 하위 일보 선택 바 (1단계 TPM -> 2단계 작업일보 등) */}
            <div className="px-3.5 sm:px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-2">
              {settingProcessId === "소재준비" ? (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSettingSubSlot("TPM")}
                    className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                      settingSubSlot === "TPM"
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                        : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>1단계: 설비일상 점검 시트 (TPM)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "TPM")] && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                    )}
                  </button>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                  {settingProject === "9BQC" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSettingSubSlot("정치절단")}
                        className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                          settingSubSlot === "정치절단"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                            : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>2단계: 작업일보 작성 (정치절단)</span>
                        {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "정치절단")] && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingSubSlot("단컷팅")}
                        className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                          settingSubSlot === "단컷팅"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                            : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>2단계: 작업일보 작성 (단컷팅)</span>
                        {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "단컷팅")] && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSettingSubSlot("작업일보")}
                      className={`px-3 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                        settingSubSlot === "작업일보"
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/40"
                          : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>2단계: 작업일보 작성 (소재준비)</span>
                      {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "소재준비", "작업일보")] && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                      )}
                    </button>
                  )}
                </div>
              ) : settingProcessId === "조인트" ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-purple-300 mr-1">📄 조인트 세부공정:</span>
                  {HANUL_JOINT_TYPES.map((jt, idx) => {
                    const isSelected = settingSubSlot === jt.id;
                    const hasTpl = Boolean(draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "조인트", jt.id)]);
                    return (
                      <button
                        key={jt.id}
                        type="button"
                        onClick={() => setSettingSubSlot(jt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/40"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <span>{idx + 1}. {jt.name}</span>
                        {hasTpl && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>}
                      </button>
                    );
                  })}
                </div>
              ) : settingProcessId === "검사" ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-emerald-300 mr-1">📄 검사 세부공정:</span>
                  {HANUL_INSPECTION_TYPES.map((it, idx) => {
                    const isSelected = settingSubSlot === it.id;
                    const hasTpl = Boolean(draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, "검사", it.id)]);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setSettingSubSlot(it.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <span>{idx + 1}. {it.name}</span>
                        {hasTpl && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white text-emerald-950 font-black">양식적용</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingSubSlot("MAIN")}
                    className="px-3 py-1.5 rounded-full font-black text-xs bg-indigo-600 text-white border border-indigo-400 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>작업일보 작성 ({settingProcessId})</span>
                    {draftProcessSlots?.[buildHanulProcessSlotKey(settingProject, settingProcessId, "MAIN")] && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">양식적용</span>
                    )}
                  </button>
                </div>
              )}

              {/* 현재 선택된 공정 위치의 적용 양식 표시 배지 */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/40">
                <span className="text-[11px] font-black text-indigo-300">
                  🎯 선택된 공정 적용 양식:
                </span>
                {currentSlotTemplateObj ? (
                  <>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                      ✓ {currentSlotTemplateObj.title}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearCurrentSlotTemplate}
                      className="px-2 py-0.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-700/60 cursor-pointer"
                    >
                      기본양식 복원
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    기본 내장 양식 (아래 리스트에서 클릭하여 변경)
                  </span>
                )}
              </div>
            </div>

            {/* 5대 공정 양식 분류 필터 탭 */}
            <div className="px-3.5 sm:px-5 py-2 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter("ALL")}
                  className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                    selectedCategoryFilter === "ALL"
                      ? "bg-cyan-500 text-slate-950 shadow-xs"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  📋 5대 공정 전체 ({allTemplates.length})
                </button>
                {REPORT_MAJOR_CATEGORIES.map((cat) => {
                  const count = allTemplates.filter((t) => t.categoryId === cat.id).length;
                  const isActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-300"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template List Body */}
            <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-900/90">
              {filteredModalTemplates.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold text-sm border border-dashed border-slate-700 rounded-2xl">
                  해당 공정 분류에 등록된 양식이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredModalTemplates.map((tpl) => {
                    const isChecked = currentSlotTemplateId === tpl.id;
                    const catObj =
                      REPORT_MAJOR_CATEGORIES.find((c) => c.id === tpl.categoryId) ||
                      REPORT_MAJOR_CATEGORIES[1];
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleToggleTemplateSelect(tpl.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isChecked
                            ? "bg-indigo-950/90 border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50"
                            : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900"
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
                              {catObj.icon} {catObj.name}
                            </span>
                            {tpl.carModel && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                                차종: {tpl.carModel}
                              </span>
                            )}
                            {tpl.processName && (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black">
                                공정: {tpl.processName}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-sm text-white truncate">
                            {tpl.title || `${tpl.carModel || ""} ${tpl.partName || "작업일보"}`}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            품명: {tpl.partName || "G/RUN"} • 양식번호: {tpl.formNo || "705-02"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* 👁️ 미리보기 뱃지 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(tpl);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                            title="이 양식이 현장 작업자 일보에 적용된 실물 서식을 미리 확인합니다"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>미리보기</span>
                          </button>

                          {/* 이 공정에 적용 / 적용됨 뱃지 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTemplateSelect(tpl.id);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl flex items-center justify-center text-xs font-black transition active:scale-95 cursor-pointer ${
                              isChecked
                                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            {isChecked ? "✓ 적용됨" : "이 공정에 적용"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400 font-bold">
                💡 위 공정표에서 <span className="text-indigo-300 font-black">[{settingProcessId} • {settingSubSlot}]</span> 위치를 선택한 뒤 양식을 클릭하고 <span className="text-emerald-400 font-black">[설정 저장]</span>을 누르세요.
              </div>
              <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSettingProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isSavingAssign}
                  onClick={() => handleSaveTemplateSetting(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>저장 후 해당 공정 일보 열기</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingAssign}
                  onClick={() => handleSaveTemplateSetting(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAssign ? "저장 중..." : "공정별 양식 설정 저장"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🌟 5대 공정 적용 실물 서식 미리보기 모달 */}
          {previewTemplate && (
            <TemplateAppliedPreviewModal
              isOpen={Boolean(previewTemplate)}
              template={previewTemplate}
              slotName={`${settingProcessId || "공정"} • ${settingSubSlot || "세부"}`}
              isApplied={currentSlotTemplateId === previewTemplate.id}
              onApply={(tpl) => handleToggleTemplateSelect(tpl.id)}
              onClose={() => setPreviewTemplate(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};
