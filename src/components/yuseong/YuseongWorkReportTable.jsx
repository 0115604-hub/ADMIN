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
  Download,
  Settings,
  Check,
  X,
  FileText,
  Eye
} from "lucide-react";
import TemplateAppliedPreviewModal from "../common/TemplateAppliedPreviewModal";
import {
  subscribeYuseongWorkReports,
  deleteYuseongWorkReport,
  exportYuseongReportToExcel,
  YUSEONG_PROJECTS,
  YUSEONG_PROCESSES
} from "../../services/yuseongWorkReportService";
import {
  REPORT_MAJOR_CATEGORIES,
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey
} from "../../services/workReportTemplateService";

export const YuseongWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  // 5대 공정 양식 보관함 리스트 & 유성 JK1/CE1/DT 양식 설정 상태
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [settingProject, setSettingProject] = useState(null); // "JK1" | "CE1" | "DT" | null
  const [settingProcessId, setSettingProcessId] = useState("소재준비");
  const [settingSubSlot, setSettingSubSlot] = useState("MAIN");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [draftProcessSlots, setDraftProcessSlots] = useState({});
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [assignToast, setAssignToast] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    const unsub = subscribeYuseongWorkReports((list) => {
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
    const targetProj = String(projKey || "JK1").toUpperCase();
    const firstProc = (YUSEONG_PROCESSES || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot("MAIN");
    setDraftProcessSlots({ ...(templateAssignments?.processSlots || {}) });
    setSelectedCategoryFilter("ALL");
  };

  const handleSwitchSettingProject = (projKey) => {
    const targetProj = String(projKey || "JK1").toUpperCase();
    const firstProc = (YUSEONG_PROCESSES || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot("MAIN");
  };

  const handleSwitchSettingProcess = (procId) => {
    setSettingProcessId(procId);
    setSettingSubSlot("MAIN");
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
      setAssignToast(`✅ [유성 ${targetProj} • ${targetProc}] 공정에 선택한 작업일보 양식이 저장 적용되었습니다!`);
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

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (projectFilter !== "all") {
        const normFilter = projectFilter.toUpperCase();
        const normProj = String(r.project || "").toUpperCase();
        if (normProj !== normFilter) return false;
      }
      if (processFilter !== "all" && r.processId !== processFilter && r.processName !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // Aggregate stats (JK1, CE1, DT Hood)
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let jk1Gross = 0, jk1Gen = 0;
    let ce1Gross = 0, ce1Gen = 0;
    let dtGross = 0, dtGen = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
      const p = String(r.project || "").toUpperCase();

      if (p.includes("JK1")) {
        jk1Gross += total;
        jk1Gen += g;
      } else if (p.includes("CE1")) {
        ce1Gross += total;
        ce1Gen += g;
      } else if (p.includes("DT")) {
        dtGross += total;
        dtGen += g;
      }
    });

    const jk1Yield = jk1Gross > 0 ? ((jk1Gen / jk1Gross) * 100).toFixed(1) : "100.0";
    const ce1Yield = ce1Gross > 0 ? ((ce1Gen / ce1Gross) * 100).toFixed(1) : "100.0";
    const dtYield = dtGross > 0 ? ((dtGen / dtGross) * 100).toFixed(1) : "100.0";

    return { totalCount, jk1Gross, jk1Gen, jk1Yield, ce1Gross, ce1Gen, ce1Yield, dtGross, dtGen, dtYield };
  }, [filteredReports]);

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 유성 가공/협력업체 작업일보를 영구 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteYuseongWorkReport(id);
    } catch (err) {
      console.error("Failed to delete yuseong report:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("다운로드할 유성 작업일보 데이터가 없습니다.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    exportYuseongReportToExcel(filteredReports, `유성_가공협력업체_작업일보_${today}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {assignToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{assignToast}</span>
          <button type="button" onClick={() => setAssignToast("")} className="cursor-pointer text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-600 text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>(주)유성 가공/협력업체 작업일보 실시간 현황</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                총 {stats.totalCount}건
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              JK1 Part'g • CE1 Part'g • DT Hood 실시간 공정별 작업 실적 및 TPM 관리
            </p>
          </div>
        </div>

        {/* 5대 공정 양식 설정 버튼 3종 (JK1 / CE1 / DT) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("JK1")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 JK1 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚗 JK1 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("CE1")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 CE1 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚙 CE1 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenTemplateSetting("DT")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 DT HOOD 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚡ DT HOOD 양식설정</span>
          </button>
        </div>
      </div>

      {/* 종합 통계 카드 3종 (JK1, CE1, DT HOOD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* JK1 */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <span>🚗</span> <span>JK1 Part'g (PARTING)</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">수율 {stats.jk1Yield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.jk1Gen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.jk1Gross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* CE1 */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border border-blue-200/80 dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <span>🚙</span> <span>CE1 Part'g (PARTING)</span>
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">수율 {stats.ce1Yield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.ce1Gen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.ce1Gross.toLocaleString()} EA</span>
          </div>
        </div>

        {/* DT HOOD */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <span>⚡</span> <span>DT Hood (HOOD W/STRIP)</span>
            </span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">수율 {stats.dtYield}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.dtGen.toLocaleString()} <span className="text-xs font-normal text-slate-500">EA 정품</span>
            </div>
            <span className="text-xs font-bold text-slate-500">총 {stats.dtGross.toLocaleString()} EA</span>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
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
              <option value="JK1">🚗 JK1 Part'g</option>
              <option value="CE1">🚙 CE1 Part'g</option>
              <option value="DT">⚡ DT Hood</option>
            </select>
          </div>

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

        {/* 엑셀 다운로드 및 일보 작성 버튼들 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("JK1")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ JK1 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("CE1")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ CE1 일보</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal("DT")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ DT HOOD 일보</span>
          </button>
        </div>
      </div>

      {/* 실시간 테이블 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">차종/아이템</th>
              <th className="py-2.5 px-3">작업자</th>
              <th className="py-2.5 px-3 text-right">총수량</th>
              <th className="py-2.5 px-3 text-right">정품수량</th>
              <th className="py-2.5 px-3 text-right">불량수량</th>
              <th className="py-2.5 px-3 text-center">수율</th>
              <th className="py-2.5 px-3 text-center">TPM점검</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400 font-bold">
                  등록된 유성 가공/협력업체 작업일보가 없습니다. 상단의 [+ 일보] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => {
                const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
                const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
                const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
                const yieldRate = total > 0 ? ((g / total) * 100).toFixed(1) : "100.0";
                const isTpmDone = Boolean(r.tpmCompleted || r.tpmChecks);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onOpenReportModal && onOpenReportModal(r.project, r)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 font-black">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        r.project === "JK1" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" :
                        r.project === "CE1" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                        "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      }`}>
                        {r.project === "DT" ? "DT HOOD" : r.project}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">
                      {r.worker}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {total.toLocaleString()} EA
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
                      {isTpmDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          TPM완료
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          미점검
                        </span>
                      )}
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

      {/* 5대 공정 양식 설정 모달 (유성 JK1 / CE1 / DT) */}
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
                    <span>유성 [{settingProject === "DT" ? "DT HOOD" : settingProject}] 공정표 기반 5대 공정 양식 설정</span>
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
              {/* 차종 스위치 (JK1 / CE1 / DT) */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400">설정 아이템:</span>
                {["JK1", "CE1", "DT"].map((pk) => (
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
                    {pk === "JK1" ? "🚗 JK1 Part'g" : pk === "CE1" ? "🚙 CE1 Part'g" : "⚡ DT Hood"}
                  </button>
                ))}
              </div>

              {/* 공정 선택 버튼 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300">1단계: 양식을 지정할 공정 선택</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {YUSEONG_PROCESSES.map((proc) => {
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
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{proc.sub}</p>
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
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(tpl);
                              }}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                              title="이 양식이 현장 작업자 일보에 적용된 실물 서식을 미리 확인합니다"
                            >
                              <Eye className="w-3 h-3" />
                              <span>미리보기</span>
                            </button>
                            <span className="font-mono text-slate-500">{tpl.formNo || ""}</span>
                          </div>
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

          {/* 🌟 5대 공정 적용 실물 서식 미리보기 모달 */}
          {previewTemplate && (
            <TemplateAppliedPreviewModal
              isOpen={Boolean(previewTemplate)}
              template={previewTemplate}
              slotName={`${settingProject || "유성"} • ${settingProcessId || "공정"}`}
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

export default YuseongWorkReportTable;
