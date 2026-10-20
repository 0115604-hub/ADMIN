import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Layers,
  Building2,
  Clock,
  UserCheck
} from "lucide-react";
import {
  getLocalIncidentLogs,
  saveIncidentLog,
  deleteIncidentLog,
  subscribeIncidentLogs,
  resetToDefaultIncidentLogs,
  exportIncidentLogsToExcel,
  INCIDENT_CATEGORIES,
  SEVERITY_LEVELS,
  INCIDENT_STATUSES
} from "../services/incidentLogService";
import { useAuth } from "../context/AuthContext";

export const IncidentLogsView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [logs, setLogs] = useState(() => getLocalIncidentLogs());
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, RESOLVED
  const [categoryFilter, setCategoryFilter] = useState("ALL");
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
    const resolved = logs.filter((l) => l.status === "RESOLVED" || l.status === "VERIFIED").length;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, active, resolved, resolveRate };
  }, [logs]);

  // Filtered List
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter === "ACTIVE" && !(l.status === "RECEIVED" || l.status === "IN_PROGRESS")) return false;
      if (statusFilter === "RESOLVED" && !(l.status === "RESOLVED" || l.status === "VERIFIED")) return false;

      if (categoryFilter !== "ALL" && l.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (l.title || "").toLowerCase().includes(q);
        const orderMatch = (l.orderContent || l.symptoms || "").toLowerCase().includes(q);
        const actionMatch = (l.actionResult || l.resolution || "").toLowerCase().includes(q);
        const plantMatch = (l.plant || "").toLowerCase().includes(q);
        const reporterMatch = (l.reporter || "").toLowerCase().includes(q);
        if (!titleMatch && !orderMatch && !actionMatch && !plantMatch && !reporterMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.workDate || a.createdAt || "";
      const dateB = b.workDate || b.createdAt || "";
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.incidentNo || 0) - (a.incidentNo || 0);
    });
  }, [logs, statusFilter, categoryFilter, searchQuery]);

  // Form State for Modal
  const [formData, setFormData] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    category: "화면/패널개편",
    severity: "P1",
    plant: "본사 • 전사",
    reporter: currentProfile?.name || "대표이사",
    title: "",
    orderContent: "",
    actionResult: "",
    status: "RESOLVED",
    resolver: "시스템 관리자",
    notes: ""
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      workDate: new Date().toISOString().slice(0, 10),
      category: "화면/패널개편",
      severity: "P1",
      plant: "본사 • 전사",
      reporter: currentProfile?.name || "대표이사",
      title: "",
      orderContent: "",
      actionResult: "",
      status: "RESOLVED",
      resolver: "시스템 관리자",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      workDate: item.workDate || new Date().toISOString().slice(0, 10),
      category: item.category || "화면/패널개편",
      severity: item.severity || "P1",
      plant: item.plant || "본사 • 전사",
      reporter: item.reporter || "대표이사",
      title: item.title || "",
      orderContent: item.orderContent || item.symptoms || "",
      actionResult: item.actionResult || item.resolution || "",
      status: item.status || "RESOLVED",
      resolver: item.resolver || "시스템 관리자",
      notes: item.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("오더 제목을 입력해주세요.");
      return;
    }
    const targetPayload = editingItem
      ? { ...editingItem, ...formData }
      : { ...formData };

    await saveIncidentLog(targetPayload);
    setIsModalOpen(false);
    triggerToast(editingItem ? "✅ 오더 및 조치 내역이 수정되었습니다." : "🎉 새 오더 내역이 등록되었습니다!");
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`[${title}]\n\n이 항목을 목록에서 삭제하시겠습니까?`)) return;
    await deleteIncidentLog(id);
    triggerToast("🗑️ 항목이 삭제되었습니다.");
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("지금까지의 최신 15건 누적 오더 및 조치 결과 기본 내역으로 동기화하시겠습니까?")) return;
    await resetToDefaultIncidentLogs();
    triggerToast("🔄 최신 15건 누적 내역으로 갱신 완료되었습니다.");
  };

  const handleQuickStatusChange = async (item, newStatus) => {
    const updated = {
      ...item,
      status: newStatus,
      resolvedAt: newStatus === "RESOLVED" || newStatus === "VERIFIED" ? (item.resolvedAt || new Date().toISOString()) : item.resolvedAt
    };
    await saveIncidentLog(updated);
    triggerToast(`상태가 [${INCIDENT_STATUSES[newStatus]?.label || newStatus}]로 변경되었습니다.`);
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
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ClipboardList className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                일일 오더 및 조치 결과 관리대장
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                일자별 누적 관리
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              매일 현장에서 내려진 지시 오더 내용과 시스템 반영 및 개선 조치 결과를 간결하고 명확하게 정리하여 누적 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs shadow-md border border-slate-700 transition cursor-pointer"
              title="최신 15건 누적 내역으로 새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>최신 내역 동기화</span>
            </button>
            <button
              onClick={() => exportIncidentLogsToExcel(logs)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 font-black text-xs shadow-md border border-emerald-500/30 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 오더 등록</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-400 block">전체 누적 오더</span>
            <div className="text-lg sm:text-2xl font-black text-white mt-0.5">{metrics.total}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-300">🟢 조치 완료</span>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">{metrics.resolved}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] font-bold text-rose-300">🚨 대기 / 조치중</span>
            <div className="text-lg sm:text-2xl font-black text-rose-400 mt-0.5">{metrics.active}건</div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-indigo-300">조치 완료율</span>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-2xl font-black text-indigo-400">{metrics.resolveRate}%</span>
              <span className="text-[10px] text-slate-400">{metrics.resolved}/{metrics.total}건</span>
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
              { id: "RESOLVED", label: "🟢 조치완료", count: metrics.resolved },
              { id: "ACTIVE", label: "🚨 대기/진행중", count: metrics.active }
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
              placeholder="오더 제목, 요청 내용, 조치 결과 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Secondary Category Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>업무 분류:</span>
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs"
          >
            <option value="ALL">전체 업무 분류</option>
            {INCIDENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <span className="text-slate-400 ml-auto font-medium">
            조회 결과: <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong>건
          </span>
        </div>
      </div>

      {/* Incident / Order Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/60" />
            <p className="font-bold text-sm">해당 조건에 해당하는 오더 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">우측 상단의 [+ 새 오더 등록] 버튼을 눌러 기록해주세요.</p>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isExpanded = expandedId === item.id;
            const statMeta = INCIDENT_STATUSES[item.status] || INCIDENT_STATUSES.RESOLVED;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header Summary Row */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Number */}
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-black shrink-0">
                          #{item.incidentNo || "-"}
                        </span>

                        {/* Date */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.workDate}</span>
                        </span>

                        {/* Category */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 shrink-0">
                          {item.category}
                        </span>

                        {/* Plant & Reporter */}
                        <span className="text-slate-400 font-medium text-xs flex items-center gap-1">
                          <span>•</span>
                          <span>{item.plant}</span>
                          {item.reporter && <span>({item.reporter})</span>}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight pt-0.5">
                        {item.title}
                      </h3>
                    </div>

                    {/* Actions & Status Dropdown */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-none transition-all ${statMeta.badge}`}
                      >
                        <option value="RESOLVED">🟢 조치완료</option>
                        <option value="IN_PROGRESS">🟡 조치중</option>
                        <option value="RECEIVED">🚨 접수됨</option>
                        <option value="VERIFIED">🔍 점검완료</option>
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
                        title="상세 메모 토글"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2 Main Visual Boxes: [📋 요청 오더 내용] & [✅ 조치 및 반영 결과] */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
                    {/* 📋 요청 오더 내용 */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/40">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-black text-blue-900 dark:text-blue-200 text-xs tracking-tight">
                          [📋 요청 오더 내용]
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed font-medium whitespace-pre-wrap">
                        {item.orderContent || item.symptoms || "요청 내용이 기록되지 않았습니다."}
                      </p>
                    </div>

                    {/* ✅ 조치 및 반영 결과 */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-black text-emerald-900 dark:text-emerald-200 text-xs tracking-tight">
                          [✅ 조치 및 반영 결과]
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed font-medium whitespace-pre-wrap">
                        {item.actionResult || item.resolution || "조치 결과가 기록되지 않았습니다."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details (Notes, Timestamps) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between text-slate-500 gap-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>조치 담당자: <strong>{item.resolver || "시스템 관리자"}</strong></span>
                        {item.resolvedAt && (
                          <span>• 조치일시: {item.resolvedAt.replace("T", " ").slice(0, 16)}</span>
                        )}
                      </div>
                    </div>
                    {item.notes && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-400 block text-[11px] mb-0.5">※ 추가 참고 메모:</span>
                        <span>{item.notes}</span>
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
                  <ClipboardList className="w-4 h-4" />
                </span>
                <h2 className="font-black text-base text-slate-900 dark:text-white">
                  {editingItem ? "오더 및 조치 결과 수정" : "신규 일일 오더 및 조치 등록"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">일자</label>
                  <input
                    type="date"
                    required
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">업무 분류</label>
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
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">진행 상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-emerald-600"
                  >
                    <option value="RESOLVED">🟢 조치완료</option>
                    <option value="IN_PROGRESS">🟡 조치중</option>
                    <option value="RECEIVED">🚨 접수됨</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">발생 사업장/공장</label>
                  <input
                    type="text"
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    placeholder="예: 본사 • 전사 / 삼랑진공장 / 한림공장"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">지시자 / 제보자</label>
                  <input
                    type="text"
                    value={formData.reporter}
                    onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                    placeholder="예: 대표이사 (권태형), 관리자 등"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">오더 제목 (핵심 요약)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: TEST 뱃지 레고블록 작업일보 빌더 1줄 바 개편 및 시인성 개선"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              {/* 📋 요청 오더 내용 */}
              <div>
                <label className="block text-blue-700 dark:text-blue-300 font-black mb-1 flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>[📋 요청 오더 내용] (지시하거나 요청받은 핵심 사항)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.orderContent}
                  onChange={(e) => setFormData({ ...formData, orderContent: e.target.value })}
                  placeholder="현장 작업자나 관리자가 쉽게 이해할 수 있도록 간결하고 명확하게 지시 내용을 적어주세요."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 font-medium text-xs sm:text-sm"
                />
              </div>

              {/* ✅ 조치 및 반영 결과 */}
              <div>
                <label className="block text-emerald-700 dark:text-emerald-300 font-black mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>[✅ 조치 및 반영 결과] (실제 시스템 수정 및 개선 결과)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.actionResult}
                  onChange={(e) => setFormData({ ...formData, actionResult: e.target.value })}
                  placeholder="시스템에 무엇이 어떻게 개선되고 반영되었는지를 간결하고 명확하게 적어주세요."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 font-medium text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">조치 담당자</label>
                  <input
                    type="text"
                    value={formData.resolver}
                    onChange={(e) => setFormData({ ...formData, resolver: e.target.value })}
                    placeholder="시스템 관리자"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">추가 비고 메모 (선택)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="참고사항 등"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                >
                  {editingItem ? "수정 완료" : "오더 등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
