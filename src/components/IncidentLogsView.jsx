import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  Wrench,
  Calendar,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  MessageSquare
} from "lucide-react";
import {
  getLocalIncidentLogs,
  saveIncidentLog,
  deleteIncidentLog,
  subscribeIncidentLogs,
  exportIncidentLogsToExcel,
  INCIDENT_CATEGORIES,
  SEVERITY_LEVELS,
  INCIDENT_STATUSES
} from "../services/incidentLogService";
import { useAuth } from "../context/AuthContext";

export const IncidentLogsView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [logs, setLogs] = useState(() => getLocalIncidentLogs());
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, RESOLVED, MONDAY_CHECK
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    const unsub = subscribeIncidentLogs((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsub();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const active = logs.filter((l) => l.status === "RECEIVED" || l.status === "IN_PROGRESS").length;
    const resolved = logs.filter((l) => l.status === "RESOLVED").length;
    const verified = logs.filter((l) => l.status === "VERIFIED" || l.mondayChecked).length;
    const p0Count = logs.filter((l) => l.severity === "P0").length;
    const resolveRate = total > 0 ? Math.round(((resolved + verified) / total) * 100) : 100;
    return { total, active, resolved, verified, p0Count, resolveRate };
  }, [logs]);

  // Filtered List
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter === "ACTIVE" && !(l.status === "RECEIVED" || l.status === "IN_PROGRESS")) return false;
      if (statusFilter === "RESOLVED" && l.status !== "RESOLVED") return false;
      if (statusFilter === "MONDAY_CHECK" && !l.mondayChecked && l.status !== "VERIFIED") return false;

      if (categoryFilter !== "ALL" && l.category !== categoryFilter) return false;
      if (severityFilter !== "ALL" && l.severity !== severityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (l.title || "").toLowerCase().includes(q);
        const symptomsMatch = (l.symptoms || "").toLowerCase().includes(q);
        const causeMatch = (l.rootCause || "").toLowerCase().includes(q);
        const resolutionMatch = (l.resolution || "").toLowerCase().includes(q);
        const reporterMatch = (l.reporter || "").toLowerCase().includes(q);
        if (!titleMatch && !symptomsMatch && !causeMatch && !resolutionMatch && !reporterMatch) return false;
      }
      return true;
    });
  }, [logs, statusFilter, categoryFilter, severityFilter, searchQuery]);

  // Form State for Modal
  const [formData, setFormData] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    category: "근태관리",
    severity: "P1",
    plant: "본사 • 전사",
    reporter: currentProfile?.name || "관리자",
    title: "",
    symptoms: "",
    rootCause: "",
    resolution: "",
    actionCommit: "",
    status: "RECEIVED",
    mondayChecked: false,
    resolver: currentProfile?.name || "시스템 관리자",
    notes: ""
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      workDate: new Date().toISOString().slice(0, 10),
      category: "근태관리",
      severity: "P1",
      plant: "본사 • 전사",
      reporter: currentProfile?.name || "관리자",
      title: "",
      symptoms: "",
      rootCause: "",
      resolution: "",
      actionCommit: "",
      status: "RECEIVED",
      mondayChecked: false,
      resolver: currentProfile?.name || "시스템 관리자",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item
    });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("오류 제목을 입력해주세요.");
      return;
    }
    const targetPayload = editingItem
      ? { ...editingItem, ...formData }
      : { ...formData };

    await saveIncidentLog(targetPayload);
    setIsModalOpen(false);
    triggerToast(editingItem ? "✅ 오류 내역이 수정되었습니다." : "🎉 새 오류 리포트가 등록되었습니다!");
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`[${title}]\n\n이 오류 내역을 정말 삭제하시겠습니까?`)) return;
    await deleteIncidentLog(id);
    triggerToast("🗑️ 오류 내역이 삭제되었습니다.");
  };

  const handleQuickStatusChange = async (item, newStatus) => {
    const updated = {
      ...item,
      status: newStatus,
      resolvedAt: newStatus === "RESOLVED" || newStatus === "VERIFIED" ? (item.resolvedAt || new Date().toISOString()) : item.resolvedAt,
      mondayChecked: newStatus === "VERIFIED" ? true : item.mondayChecked
    };
    await saveIncidentLog(updated);
    triggerToast(`상태가 [${INCIDENT_STATUSES[newStatus]?.label}]로 변경되었습니다.`);
  };

  const handleToggleMondayCheck = async (item) => {
    const nextVal = !item.mondayChecked;
    const updated = {
      ...item,
      mondayChecked: nextVal,
      status: nextVal && item.status === "RESOLVED" ? "VERIFIED" : item.status
    };
    await saveIncidentLog(updated);
    triggerToast(nextVal ? "🔍 월요 정기 재점검 완료로 표시되었습니다." : "월요 점검 체크가 해제되었습니다.");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900/95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-2xl border border-slate-700/80 animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                시스템 오류 및 조치 이력 관리
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                월요 정기 품질 점검
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              일주일간 발생한 기능 오류 및 현장 개선사항을 기록하고, 매주 월요일마다 원인 분석과 조치 결과를 재점검하여 시스템 무결성을 유지합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => exportIncidentLogsToExcel(logs)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 font-black text-xs shadow-md border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 오류 등록</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-400 block">전체 누적 건수</span>
            <div className="text-lg sm:text-2xl font-black text-white mt-0.5">{metrics.total}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
              <span>🚨 조치 대기/진행중</span>
            </span>
            <div className="text-lg sm:text-2xl font-black text-rose-400 mt-0.5">{metrics.active}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-300">🟢 조치 완료</span>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">{metrics.resolved}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[11px] font-bold text-blue-300">🔍 월요 재점검 확인</span>
            <div className="text-lg sm:text-2xl font-black text-blue-400 mt-0.5">{metrics.verified}건</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-indigo-300">조치 완료율</span>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-black text-indigo-400">{metrics.resolveRate}%</span>
              <span className="text-[10px] text-slate-400">{metrics.resolved + metrics.verified}/{metrics.total}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "전체보기" },
              { id: "ACTIVE", label: "🚨 조치대기/진행중", count: metrics.active },
              { id: "RESOLVED", label: "🟢 조치완료", count: metrics.resolved },
              { id: "MONDAY_CHECK", label: "🔍 월요재점검 대상/완료", count: metrics.verified }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === btn.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{btn.label}</span>
                {typeof btn.count === "number" && btn.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === btn.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {btn.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 에러문구, 원인, 조치내용 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Secondary Category & Severity Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>상세분류:</span>
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="ALL">전체 메뉴분류</option>
            {INCIDENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="ALL">전체 심각도</option>
            <option value="P0">🔴 P0 (치명적/긴급)</option>
            <option value="P1">🟡 P1 (중요/기능)</option>
            <option value="P2">🔵 P2 (일반/화면)</option>
          </select>

          <span className="text-slate-400 ml-auto font-medium">
            조회 결과: <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong>건
          </span>
        </div>
      </div>

      {/* Incident Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/60" />
            <p className="font-bold text-sm">해당 조건에 해당하는 오류 리포트가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">새로운 문제가 발생하면 우측 상단의 [+ 새 오류 등록] 버튼을 눌러 기록해주세요.</p>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isExpanded = expandedId === item.id;
            const sevMeta = SEVERITY_LEVELS[item.severity] || SEVERITY_LEVELS.P1;
            const statMeta = INCIDENT_STATUSES[item.status] || INCIDENT_STATUSES.RECEIVED;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header Summary Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-black shrink-0 mt-0.5">
                      #{item.incidentNo || "-"}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 border ${sevMeta.color}`}>
                          {item.severity}
                        </span>

                        {/* Category Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 shrink-0">
                          {item.category}
                        </span>

                        {/* Date & Plant */}
                        <span className="text-slate-400 font-medium text-xs flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.workDate}</span>
                          <span>•</span>
                          <span>{item.plant}</span>
                          {item.reporter && <span>({item.reporter})</span>}
                        </span>
                      </div>

                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Monday Verified Indicator */}
                    <button
                      type="button"
                      onClick={() => handleToggleMondayCheck(item)}
                      title={item.mondayChecked ? "월요 정기 재점검 완료됨 (클릭 시 해제)" : "월요 정기 재점검 미완료 (클릭 시 완료)"}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                        item.mondayChecked
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-400/60"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${item.mondayChecked ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                      <span>{item.mondayChecked ? "월요점검 완료" : "월요점검 미완료"}</span>
                    </button>

                    {/* Status Select Badge */}
                    <select
                      value={item.status}
                      onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer focus:outline-none transition-all ${statMeta.badge}`}
                    >
                      <option value="RECEIVED">🚨 접수됨</option>
                      <option value="IN_PROGRESS">🟡 조치중</option>
                      <option value="RESOLVED">🟢 조치완료</option>
                      <option value="VERIFIED">🔍 월요점검완료</option>
                    </select>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="상세보기 토글"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel (Root Cause, Resolution, Symptoms) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 space-y-3.5 text-xs sm:text-sm animate-fadeIn">
                    {/* Symptoms */}
                    {item.symptoms && (
                      <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40">
                        <span className="font-black text-rose-800 dark:text-rose-300 block mb-1 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500" />
                          <span>오류 현상 및 에러 문구 (Symptoms)</span>
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-[11px] sm:text-xs">
                          {item.symptoms}
                        </p>
                      </div>
                    )}

                    {/* Root Cause */}
                    {item.rootCause && (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                        <span className="font-black text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          <span>근본 원인 분석 (Root Cause Analysis)</span>
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {item.rootCause}
                        </p>
                      </div>
                    )}

                    {/* Resolution & Fix Commit */}
                    {item.resolution && (
                      <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                            <span>조치 결과 및 해결 내역 (Resolution)</span>
                          </span>
                          {item.actionCommit && (
                            <span className="px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-black">
                              {item.actionCommit}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {item.resolution}
                        </p>
                        {item.resolvedAt && (
                          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                            <span>조치 일시: {item.resolvedAt.replace("T", " ").slice(0, 16)}</span>
                            {item.resolver && <span>• 조치자: {item.resolver}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        ※ 추가 메모: {item.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-500">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h2 className="font-black text-base text-slate-900 dark:text-white">
                  {editingItem ? "오류 리포트 및 조치 결과 수정" : "신규 오류 리포트 등록"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">발생 일자</label>
                  <input
                    type="date"
                    required
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">메뉴 분류</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {INCIDENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">심각도</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-rose-600"
                  >
                    <option value="P0">🔴 P0 (치명적/업무중단)</option>
                    <option value="P1">🟡 P1 (중요/기능결함)</option>
                    <option value="P2">🔵 P2 (일반/화면개선)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">발생 공장/부서</label>
                  <input
                    type="text"
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    placeholder="예: 삼랑진공장 / 한림공장 / 본사"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">제보자 / 발견자</label>
                  <input
                    type="text"
                    value={formData.reporter}
                    onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                    placeholder="예: 조인주 선임, 관리자 등"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">오류 제목 (핵심 요약)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 근태 최종 저장 시 ReferenceError 크래시 발생"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-rose-600 dark:text-rose-400 font-bold mb-1">오류 현상 및 에러 문구</label>
                <textarea
                  rows={3}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="어떤 버튼을 눌렀을 때 무슨 메시지가 뜨거나 어떻게 오작동했는지 적어주세요."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-amber-600 dark:text-amber-400 font-bold mb-1">근본 원인 분석 (Root Cause)</label>
                <textarea
                  rows={2}
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  placeholder="오류가 발생하게 된 소스코드 결함, 데이터 누락, 동기화 문제 등의 원인"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-emerald-600 dark:text-emerald-400 font-bold mb-1">조치 결과 및 해결 내역</label>
                  <input
                    type="text"
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    placeholder="예: 변수 선언 위치 수정 및 실서버 배포 완료"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">배포 커밋 / 버전</label>
                  <input
                    type="text"
                    value={formData.actionCommit}
                    onChange={(e) => setFormData({ ...formData, actionCommit: e.target.value })}
                    placeholder="예: Commit cff95b6"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">진행 상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black"
                  >
                    <option value="RECEIVED">🚨 접수됨</option>
                    <option value="IN_PROGRESS">🟡 조치중</option>
                    <option value="RESOLVED">🟢 조치완료</option>
                    <option value="VERIFIED">🔍 월요재점검완료</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.mondayChecked}
                      onChange={(e) => setFormData({ ...formData, mondayChecked: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>월요일 정기 재점검 완료 확인</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition"
                >
                  {editingItem ? "수정사항 저장" : "리포트 등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentLogsView;
