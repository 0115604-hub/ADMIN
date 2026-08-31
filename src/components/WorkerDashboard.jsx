import React, { useState, useEffect, useMemo } from "react";
import {
  Factory,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  Save,
  Edit3,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  PauseCircle,
  CheckSquare,
  Wrench,
  BarChart2,
  ArrowRight,
  Building2,
  CheckCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getWorkLogs, saveWorkLog, deleteWorkLog } from "../services/workLogService";
import { OperatorWorkspace } from "./OperatorWorkspace";

// Extrusion 4-Lines Summary (PCM 1호, PCM 3호, TPE 1호, PVC)
const EXTRUSION_SUMMARY = [
  { line: "PCM 1호", minutes: 45, opRatio: "98.1", reason: "형교환", monthCumulative: 180 },
  { line: "PCM 3호", minutes: 30, opRatio: "98.7", reason: "형교환", monthCumulative: 140 },
  { line: "TPE 1호", minutes: 40, opRatio: "98.3", reason: "형교환", monthCumulative: 135 },
  { line: "PVC", minutes: 25, opRatio: "98.9", reason: "승온대기", monthCumulative: 105 }
];

// Quality 4 Core Items Summary (Sorted by Inspection Volume)
const QUALITY_SUMMARY = [
  { id: "ja", name: "JA G-RUN", inspectQty: 57596, defectQty: 732, defectRate: 1.27, isMax: false },
  { id: "nx4a", name: "NX4a G-RUN", inspectQty: 50400, defectQty: 302, defectRate: 0.60, isMax: false },
  { id: "nx4", name: "NX4 G-RUN", inspectQty: 25880, defectQty: 34, defectRate: 0.13, isMax: false },
  { id: "hr", name: "HR G-RUN", inspectQty: 20858, defectQty: 270, defectRate: 1.29, isMax: true }
];

// Split Overtime Summary (삼랑진공장 & 한림공장)
const SAMRANGJIN_OVERTIME = {
  plant: "삼랑진공장",
  date: "2026-08-29 (토)",
  author: "양인나 선임",
  headcount: 32,
  approval: [
    { role: "담당", name: "양인나" },
    { role: "책임", name: "윤경수" },
    { role: "이사", name: "이명재" },
    { role: "대표", name: "권태형" }
  ],
  lines: [
    { name: "JA", count: 9 },
    { name: "NX4", count: 8 },
    { name: "압출", count: 4 },
    { name: "코팅", count: 3 },
    { name: "DT", count: 8 }
  ],
  reason: "PCM 1/3호/TPE 형교환 생산, DT HOOD 코팅 납품 대응, NX4a 수출창고 입고"
};

const HANLIM_OVERTIME = {
  plant: "한림공장",
  date: "2026-08-29 (토)",
  author: "우창용 선임",
  headcount: 12,
  approval: [
    { role: "담당", name: "우창용" },
    { role: "책임", name: "김동욱" },
    { role: "이사", name: "이명재" },
    { role: "대표", name: "권태형" }
  ],
  lines: [
    { name: "JK1", count: 4 },
    { name: "CHANNEL", count: 3 },
    { name: "CE1/DT", count: 3 },
    { name: "관리", count: 2 }
  ],
  reason: "CHANNEL 밴딩/가공 지원, JK1 조인트 및 후가공 납품 대응, PU KD 재고 확보"
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const { currentProfile, isOperator, isAdmin } = useAuth();
  const { selectedMonth, currentMonthData } = useMonth();
  const { formatAmount } = useCurrency();

  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || "선임";
  const assignedProcess = currentProfile?.assignedProcess || "가공동 관리";
  const isInjoo = currentProfile?.name === "조인주";

  const [activeWorkerTab, setActiveWorkerTab] = useState("summary_log"); // 'summary_log' | 'uploader'
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState("all");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    plant: workerPlant,
    writer: workerFullName,
    process: assignedProcess,
    shift: "주간",
    line: "9BQC 압출 1호기",
    workContent: "",
    issues: ""
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData((prev) => ({
        ...prev,
        plant: workerPlant,
        writer: workerFullName,
        process: currentProfile.assignedProcess || prev.process || "가공동 관리"
      }));
    }
  }, [currentProfile, isOperator, workerFullName, workerPlant, assignedProcess]);

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const totalSales = currentMonthData?.salesSummary?.totalSales || 1867589445;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 1263790685;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "67.7";

  // Save work log
  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!formData.workContent.trim()) {
      alert("작업 내용을 입력해 주세요.");
      return;
    }

    const newLog = {
      id: Date.now(),
      date: formData.date,
      plant: formData.plant,
      writer: currentProfile?.name || "작업자",
      title: officialTitle,
      process: formData.process || assignedProcess,
      shift: formData.shift,
      line: formData.line,
      workContent: formData.workContent,
      issues: formData.issues || "-",
      status: "완료",
      createdAt: new Date().toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updated = saveWorkLog(newLog);
    setWorkLogs(updated);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      plant: workerPlant,
      writer: workerFullName,
      process: assignedProcess,
      shift: "주간",
      line: "9BQC 압출 1호기",
      workContent: "",
      issues: ""
    });
    setIsModalOpen(false);
  };

  const handleDeleteLog = (id) => {
    if (!window.confirm("이 업무일지를 삭제하시겠습니까?")) return;
    const updated = deleteWorkLog(id);
    setWorkLogs(updated);
  };

  const filteredLogs = workLogs.filter((log) => {
    const writerWithTitle = `${log.writer} ${log.title || ""} ${log.process || ""}`;
    const matchSearch =
      writerWithTitle.includes(searchTerm) ||
      log.workContent.includes(searchTerm) ||
      log.line.includes(searchTerm) ||
      (log.issues && log.issues.includes(searchTerm));
    const matchPlant = filterPlant === "all" || log.plant === filterPlant;
    return matchSearch && matchPlant;
  });

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-fadeIn pb-20 max-w-[1600px] mx-auto px-1.5 sm:px-0">
      {isInjoo && activeWorkerTab === "uploader" ? (
        <OperatorWorkspace onBulkUpload={onBulkUpload} />
      ) : (
        <div className="space-y-3 sm:space-y-3.5">
          {/* ========================================================================= */}
          {/* 1. ⭐ [1위치] 매입매출현황 요약 (주석 삭제 • 깔끔한 핵심 수치만 표시) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  1. {monthTitle} 매입매출현황 요약
                </h2>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("vehicle_sales")}
                  className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <span>매출 상세</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3 Core KPI Cards (Clean numbers without annotations) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매출액</span>
                <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                  {formatAmount(totalSales)}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액 (원가)</span>
                <span className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400">
                  {formatAmount(totalPurchases)}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비 매입원가율</span>
                <span className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {purchaseRatio}%
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. ⭐ [2위치] 압출동 주간 비가동내역 요약 (컴팩트 뷰) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  2. 압출동 주간 비가동내역 요약
                </h2>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("extrusion_downtime")}
                  className="flex items-center gap-1 text-[11px] font-black text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  <span>비가동 상세</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 8월 누적 바 (초소형 바) */}
            <div className="bg-slate-900 text-white rounded-xl px-3 py-1.5 border border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="text-amber-400 font-bold text-[10px] sm:text-xs">8월 누적 비가동:</span>
              <div className="flex flex-wrap gap-1.5">
                {EXTRUSION_SUMMARY.map((ex) => (
                  <span key={ex.line} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">
                    <span className="text-slate-300">{ex.line}:</span> <strong className="text-rose-400">{ex.monthCumulative}분</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* 4 Equipment Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {EXTRUSION_SUMMARY.map((ex) => (
                <div
                  key={ex.line}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                      {ex.line}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-black">
                      {ex.reason}
                    </span>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-black text-rose-600 dark:text-rose-400">
                        {ex.minutes}분
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">손실</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {ex.opRatio}%
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">가동률</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. ⭐ [3위치] 일일품질현황 요약 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  3. 일일품질현황 요약
                </h2>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("daily_quality")}
                  className="flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>품질 상세</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 4 Items (2x2 on Mobile, 4 Cols on Desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {QUALITY_SUMMARY.map((q) => (
                <div
                  key={q.id}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    q.isMax
                      ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs truncate ${q.isMax ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-white"}`}>
                      {q.name}
                    </span>
                    {q.isMax ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black shrink-0">
                        경고 🚨
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black shrink-0">
                        달성
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-baseline justify-between">
                    <div>
                      <span className={`text-base font-black ${q.isMax ? "text-rose-600 dark:text-rose-400" : q.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {q.defectRate}%
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">불량률</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {q.inspectQty.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">검사(EA)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. ⭐ [4위치] 특근현황 요약 (삼랑진공장 & 한림공장) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  4. 공장별 특근현황 요약
                </h2>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("overtime_status")}
                  className="flex items-center gap-1 text-[11px] font-black text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <span>특근보고서</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2 Plant Split Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* 삼랑진공장 */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                      삼랑진공장
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{SAMRANGJIN_OVERTIME.author}</span>
                  </div>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                    {SAMRANGJIN_OVERTIME.headcount}명 투입
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {SAMRANGJIN_OVERTIME.lines.map((ln) => (
                    <span key={ln.name} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                      {ln.name}: <strong className="text-purple-600 dark:text-purple-400">{ln.count}명</strong>
                    </span>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {SAMRANGJIN_OVERTIME.reason}
                </p>
              </div>

              {/* 한림공장 */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black">
                      한림공장
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{HANLIM_OVERTIME.author}</span>
                  </div>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                    {HANLIM_OVERTIME.headcount}명 투입
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {HANLIM_OVERTIME.lines.map((ln) => (
                    <span key={ln.name} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                      {ln.name}: <strong className="text-purple-600 dark:text-purple-400">{ln.count}명</strong>
                    </span>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {HANLIM_OVERTIME.reason}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. ⭐ [5위치] 일일업무일지 현황 (한줄 표시 • 주석 삭제 • 맨밑 작성 버튼) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  5. 일일업무일지 현황
                </h3>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <select
                  value={filterPlant}
                  onChange={(e) => setFilterPlant(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">전체 ({workLogs.length})</option>
                  <option value="삼랑진공장">삼랑진</option>
                  <option value="한림공장">한림</option>
                </select>
              </div>
            </div>

            {/* 한줄 리스트 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                    <th className="py-1.5 px-2 w-[11%] text-center">일자</th>
                    <th className="py-1.5 px-2 w-[9%] text-center">공장</th>
                    <th className="py-1.5 px-2 w-[12%]">작성자</th>
                    <th className="py-1.5 px-2 w-[16%]">라인/공정</th>
                    <th className="py-1.5 px-2 w-[35%]">작업 내용</th>
                    <th className="py-1.5 px-2 w-[13%]">특이사항</th>
                    <th className="py-1.5 px-1 w-[4%] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400 font-bold text-xs">
                        등록된 일일업무일지가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-10 group text-[11px]"
                      >
                        <td className="py-1.5 px-2 text-center font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {log.date.slice(5)} ({log.shift})
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.plant === "한림공장"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {log.plant === "한림공장" ? "한림" : "삼랑진"}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 dark:text-white truncate">
                          {log.writer} {log.title || ""}
                        </td>
                        <td className="py-1.5 px-2 font-medium text-slate-600 dark:text-slate-400 truncate" title={log.line}>
                          {log.line}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200 truncate" title={log.workContent}>
                          {log.workContent}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 truncate" title={log.issues || "-"}>
                          {log.issues && log.issues !== "특이사항 없음" ? log.issues : "-"}
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          {(currentProfile?.name === log.writer || isAdmin) && (
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ⭐ [사용자 요청] 전체 내용을 다 읽은 후 맨 밑에서 작성하는 업무일지 버튼 */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>오늘의 업무일지 작성하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Work Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>오늘의 업무일지 작성</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">작성 일자</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">소속 공장</label>
                  <select
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">작성자</label>
                  <input
                    type="text"
                    value={formData.writer}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">담당 공정</label>
                  <input
                    type="text"
                    value={formData.process}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">세부 라인 / 설비</label>
                <input
                  type="text"
                  placeholder="예: PCM 1호 라인, JA 가공 2호기 등"
                  value={formData.line}
                  onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">주요 작업 실적</label>
                <textarea
                  rows="3"
                  placeholder="오늘 진행한 주요 작업 내용 및 생산 수량을 입력해 주세요."
                  value={formData.workContent}
                  onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">특이사항 및 전달사항</label>
                <input
                  type="text"
                  placeholder="설비 이상, 원료 교체, 품질 이슈 등 (선택)"
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
