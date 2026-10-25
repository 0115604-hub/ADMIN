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
  Check,
  X,
  FileText
} from "lucide-react";
import {
  subscribeMachiningWorkReports,
  deleteMachiningWorkReport,
  exportMachiningReportToExcel,
  MACHINING_PROJECTS,
  MACHINING_PROCESSES,
  isExcludedFromMachiningWorkReport
} from "../../services/machiningWorkReportService";
import {
  REPORT_MAJOR_CATEGORIES,
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey
} from "../../services/workReportTemplateService";

export const MachiningWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  // 5대 공정 양식 보관함 리스트 & 양식 매핑 상태
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [settingProject, setSettingProject] = useState(null); // "HR" | "JA" | "NX5A" | null
  const [settingProcessId, setSettingProcessId] = useState("소재준비");
  const [settingSubSlot, setSettingSubSlot] = useState("정치절단");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [draftProcessSlots, setDraftProcessSlots] = useState({});
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [assignToast, setAssignToast] = useState("");

  useEffect(() => {
    const unsub = subscribeMachiningWorkReports((list) => {
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

  const handleOpenTemplateSetting = (projKey) => {
    const targetProj = String(projKey || "HR").toUpperCase();
    const firstProc = (MACHINING_PROCESSES[targetProj] || MACHINING_PROCESSES.HR || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot(firstProc === "소재준비" ? "정치절단" : "MAIN");
    setDraftProcessSlots({ ...(templateAssignments?.processSlots || {}) });
    setSelectedCategoryFilter("ALL");
  };

  const handleSwitchSettingProject = (projKey) => {
    const targetProj = String(projKey || "HR").toUpperCase();
    const firstProc = (MACHINING_PROCESSES[targetProj] || MACHINING_PROCESSES.HR || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot(firstProc === "소재준비" ? "정치절단" : "MAIN");
  };

  const handleSwitchSettingProcess = (procId) => {
    setSettingProcessId(procId);
    setSettingSubSlot(procId === "소재준비" ? "정치절단" : "MAIN");
  };

  const currentSlotKey = useMemo(() => {
    if (!settingProject || !settingProcessId) return null;
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

  const handleClearSlotTemplate = () => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      delete next[currentSlotKey];
      return next;
    });
  };

  const handleSaveProcessSlotAssignment = async (openModalAfter = false) => {
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
      setAssignToast(`✅ [${targetProj} G/RUN • ${targetProc}] 공정에 선택한 작업일보 양식이 저장 적용되었습니다!`);
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

  // 5대 공정 양식 필터링
  const filteredCatalogTemplates = useMemo(() => {
    let list = allTemplates || [];
    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((t) => t.categoryId === selectedCategoryFilter);
    }
    return list;
  }, [allTemplates, selectedCategoryFilter]);

  // 일보 필터링
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (isExcludedFromMachiningWorkReport(r.worker)) return false;
      if (projectFilter !== "all") {
        const normFilter = projectFilter.toUpperCase();
        const normProj = String(r.project || "").toUpperCase();
        if (normFilter === "NX5A") {
          if (normProj !== "NX5A" && normProj !== "NX4A") return false;
        } else if (normProj !== normFilter) {
          return false;
        }
      }
      if (processFilter !== "all" && r.processId !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // 차종별 생산 통계
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let hrGross = 0, hrGen = 0;
    let jaGross = 0, jaGen = 0;
    let nx5Gross = 0, nx5Gen = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
      const p = String(r.project || "").toUpperCase();

      if (p === "HR") {
        hrGross += total;
        hrGen += g;
      } else if (p === "JA") {
        jaGross += total;
        jaGen += g;
      } else if (p.includes("NX5") || p.includes("NX4")) {
        nx5Gross += total;
        nx5Gen += g;
      }
    });

    const hrYield = hrGross > 0 ? ((hrGen / hrGross) * 100).toFixed(1) : "100.0";
    const jaYield = jaGross > 0 ? ((jaGen / jaGross) * 100).toFixed(1) : "100.0";
    const nx5Yield = nx5Gross > 0 ? ((nx5Gen / nx5Gross) * 100).toFixed(1) : "100.0";

    return { totalCount, hrGross, hrGen, hrYield, jaGross, jaGen, jaYield, nx5Gross, nx5Gen, nx5Yield };
  }, [filteredReports]);

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    setIsDeleting(id);
    try {
      await deleteMachiningWorkReport(id);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {assignToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{assignToast}</span>
          <button type="button" onClick={() => setAssignToast("")} className="cursor-pointer text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* 헤더 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-teal-600 text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>(주)오륙 삼랑진공장 가공동 작업일보 실시간 현황</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-black">
                {filteredReports.length}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              HR • JA • NX5a(NX4) G/RUN 가공 4대 공정 실시간 보고서 관리
            </span>
          </div>
        </div>

        {/* 5대 공정 양식 설정 버튼 3종 (HR / JA / NX5a) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("HR")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 HR 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚚 HR 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("JA")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 JA 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚗 JA 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("NX5A")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 NX5a 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚡ NX5a 양식설정</span>
          </button>
        </div>
      </div>

      {/* 요약 통계 카드 3종 (HR, JA, NX5a) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* HR */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <span>🚚</span> <span>HR G/RUN (포터)</span>
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">수율 {stats.hrYield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.hrGen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.hrGross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* JA */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <span>🚗</span> <span>JA G/RUN (모닝/레이)</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">수율 {stats.jaYield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.jaGen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.jaGross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* NX5a */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <span>⚡</span> <span>NX5a G/RUN (투싼 PE)</span>
            </span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">수율 {stats.nx5Yield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.nx5Gen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.nx5Gross.toLocaleString()} EA</span>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 차종 필터 */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 차종</option>
              <option value="HR">🚚 HR G/RUN</option>
              <option value="JA">🚗 JA G/RUN</option>
              <option value="NX5A">⚡ NX5a G/RUN</option>
              <option value="NX4">🚙 NX4 G/RUN</option>
            </select>
          </div>

          {/* 공정 필터 */}
          <select
            value={processFilter}
            onChange={(e) => setProcessFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">전체 공정</option>
            <option value="소재준비">소재준비</option>
            <option value="조인트">조인트</option>
            <option value="본드로봇">본드로봇</option>
            <option value="검사">검사</option>
          </select>

          {/* 날짜 필터 */}
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

          {/* 작업자 검색 */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="작업자명 검색"
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="text-xs bg-transparent border-0 outline-none w-24 sm:w-28 text-slate-700 dark:text-slate-200 font-bold"
            />
            {searchWorker && (
              <button type="button" onClick={() => setSearchWorker("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* 신규 일보 작성 버튼들 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("HR", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ HR 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("JA", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ JA 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("NX5A", "소재준비")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ NX5a 일보</span>
          </button>
        </div>
      </div>

      {/* 실시간 테이블 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">차종</th>
              <th className="py-2.5 px-3">공정</th>
              <th className="py-2.5 px-3">작업자</th>
              <th className="py-2.5 px-3 text-right">정품수량</th>
              <th className="py-2.5 px-3 text-right">불량</th>
              <th className="py-2.5 px-3 text-center">수율</th>
              <th className="py-2.5 px-3 text-center">작업일보양식</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400 font-bold">
                  등록된 가공동 작업일보가 없습니다. 상단의 [+ 일보] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => {
                const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
                const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
                const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
                const yieldRate = total > 0 ? ((g / total) * 100).toFixed(1) : "100.0";
                const isAssigned = Boolean(r.assignedTemplateId || r.assignedSlotKey);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(r.project, r.processId, r)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 font-black">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        r.project === "HR" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                        r.project === "JA" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" :
                        "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      }`}>
                        {r.project === "NX4A" ? "NX5a" : r.project}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {r.processId || r.processName || "소재준비"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">
                      {r.worker}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {g.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      {b.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        parseFloat(yieldRate) >= 98
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {yieldRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isAssigned ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                          표준5대양식
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          기본양식
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => exportMachiningReportToExcel(r)}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                          title="엑셀 다운로드"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(r.id, e)}
                          disabled={isDeleting === r.id}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                          title="일보 영구 삭제"
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

      {/* 5대 공정 양식 설정 모달 (한울과 100% 동일한 구조) */}
      {settingProject && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSettingProject(null)}
        >
          <div
            className="bg-slate-900 border-2 border-indigo-500 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-500/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>가공동 [{settingProject} G/RUN] 공정표 기반 5대 공정 양식 설정</span>
                  </h3>
                  <p className="text-[11px] text-indigo-300">
                    ① 공정을 선택한 후 ➔ ② 하단 5대 양식 보관함에서 원하는 양식을 선택하여 매핑하세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingProject(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* 차종 스위치 (HR / JA / NX5a) */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400">설정 차종:</span>
                {["HR", "JA", "NX5A"].map((pk) => (
                  <button
                    key={pk}
                    type="button"
                    onClick={() => handleSwitchSettingProject(pk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      settingProject === pk
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {pk === "HR" ? "🚚 HR G/RUN" : pk === "JA" ? "🚗 JA G/RUN" : "⚡ NX5a G/RUN"}
                  </button>
                ))}
              </div>

              {/* 공정 선택 버튼 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300">1단계: 양식을 지정할 공정 선택</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(MACHINING_PROCESSES[settingProject] || MACHINING_PROCESSES.HR || []).map((proc) => {
                    const isSelected = settingProcessId === proc.id;
                    const slotKey = buildHanulProcessSlotKey(settingProject, proc.id, settingSubSlot);
                    const hasTpl = Boolean(draftProcessSlots?.[slotKey]);

                    return (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => handleSwitchSettingProcess(proc.id)}
                        className={`p-2.5 rounded-2xl border text-left transition ${
                          isSelected
                            ? "border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-400/40"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-white">{proc.name}</span>
                          {hasTpl && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-950 font-black">
                              양식적용
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{proc.subTitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 현재 슬롯에 적용된 양식 확인 */}
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-indigo-300">
                    현재 선택 슬롯: <span className="text-white font-black">[{settingProject} • {settingProcessId}]</span>
                  </div>
                  <div className="text-xs font-black text-white truncate mt-0.5">
                    적용 양식: {currentSlotTemplateObj ? `📄 ${currentSlotTemplateObj.title} (${currentSlotTemplateObj.formNo || "표준양식"})` : "기본 내장 양식 사용 중"}
                  </div>
                </div>
                {currentSlotTemplateObj && (
                  <button
                    type="button"
                    onClick={handleClearSlotTemplate}
                    className="px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold shrink-0"
                  >
                    양식 해제
                  </button>
                )}
              </div>

              {/* 5대 공정 양식 보관함에서 선택 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-300">
                    2단계: 적용할 5대 공정 양식 선택
                  </label>
                  {/* 양식 대분류 필터 */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter("ALL")}
                      className={`px-2 py-0.5 rounded-lg font-bold ${selectedCategoryFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                      전체
                    </button>
                    {REPORT_MAJOR_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap ${selectedCategoryFilter === cat.id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {filteredCatalogTemplates.map((tpl) => {
                    const isSelected = currentSlotTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleToggleTemplateSelect(tpl.id)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-950/50 ring-2 ring-emerald-400/40"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-900/70 text-indigo-300">
                            {tpl.categoryName || "양식"}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                              <Check className="w-3.5 h-3.5" /> 선택됨
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-xs text-white mt-1 truncate">{tpl.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{tpl.processName || tpl.carModel || "-"}</span>
                          <span className="font-mono text-slate-500">{tpl.formNo || ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSettingProject(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleSaveProcessSlotAssignment(false)}
                disabled={isSavingAssign}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md"
              >
                {isSavingAssign ? "저장 중..." : "설정 저장 완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachiningWorkReportTable;
