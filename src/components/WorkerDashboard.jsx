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
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getWorkLogs, saveWorkLog, deleteWorkLog } from "../services/workLogService";
import { OperatorWorkspace } from "./OperatorWorkspace";

const PROCESS_OPTIONS = [
  "총괄관리",
  "압출동 관리",
  "가공동 관리",
  "품질관리",
  "경리업무"
];

// Extrusion 4-Lines Summary (PCM 1호, PCM 3호, TPE 1호, PVC)
const EXTRUSION_SUMMARY = [
  { line: "PCM 1호", minutes: 45, hours: "0.8", opRatio: "98.1", reason: "형교환", count: 1, monthCumulative: 180 },
  { line: "PCM 3호", minutes: 30, hours: "0.5", opRatio: "98.7", reason: "형교환", count: 1, monthCumulative: 140 },
  { line: "TPE 1호", minutes: 40, hours: "0.7", opRatio: "98.3", reason: "형교환", count: 1, monthCumulative: 135 },
  { line: "PVC", minutes: 25, hours: "0.4", opRatio: "98.9", reason: "승온대기", count: 1, monthCumulative: 105 }
];

// Quality 4 Core Items Summary (Sorted by Inspection Volume)
const QUALITY_SUMMARY = [
  { id: "ja", name: "JA G-RUN", inspectQty: 57596, defectQty: 732, defectRate: 1.27, isMax: false, reason: "수포 (318건), 둔_어퍼" },
  { id: "nx4a", name: "NX4a G-RUN", inspectQty: 50400, defectQty: 302, defectRate: 0.60, isMax: false, reason: "스코치 (148건)" },
  { id: "nx4", name: "NX4 G-RUN", inspectQty: 25880, defectQty: 34, defectRate: 0.13, isMax: false, reason: "사상불량, 삽입불량" },
  { id: "hr", name: "HR G-RUN", inspectQty: 20858, defectQty: 270, defectRate: 1.29, isMax: true, reason: "직_어퍼떨어짐 (218건)" }
];

// Overtime Summary (August 29 Saturday)
const OVERTIME_SUMMARY = {
  date: "2026년 8월 29일 토요일",
  author: "양인나 선임",
  totalHeadcount: 44,
  approval: [
    { role: "담당", name: "양인나", status: "완료" },
    { role: "책임", name: "윤경수", status: "완료" },
    { role: "이사", name: "이명재", status: "완료" },
    { role: "대표", name: "권태형", status: "완료" }
  ],
  lineBreakdown: [
    { name: "JA 가공", count: 14 },
    { name: "NX4 가공", count: 10 },
    { name: "압출 라인", count: 9 },
    { name: "DT 코팅", count: 5 },
    { name: "PU 라인", count: 4 },
    { name: "품질/물류", count: 2 }
  ],
  reasons: [
    "PCM 1호, 3호, TPE 형교환 생산 긴급 대응",
    "DT HOOD 코팅 긴급 납품 수량 확보",
    "NX4a 수출창고 입고 일정 준수",
    "PU KD 재고 사전 확보"
  ]
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

  // Work Logs State from shared service
  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState(workerPlant || "all");

  // Form State for New Work Log with Pre-filled Assigned Process
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

  // Keep writer & assigned process updated if profile loads late
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
      issues: formData.issues || "특이사항 없음",
      status: "완료",
      createdAt: new Date().toLocaleString("ko-KR", {
        year: "numeric",
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
      log.issues.includes(searchTerm);
    const matchPlant = filterPlant === "all" || log.plant === filterPlant;
    return matchSearch && matchPlant;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* TOP HEADER & WORKER GREETING BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            workerPlant === "한림공장"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                {workerFullName} {officialTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black">
                {assignedProcess}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black">
                {workerPlant}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              기준월: <strong>{monthTitle}</strong> | 전사 통합 생산·품질·원가 종합 요약 대시보드
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          {isInjoo && (
            <button
              onClick={() => setActiveWorkerTab(activeWorkerTab === "uploader" ? "summary_log" : "uploader")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{activeWorkerTab === "uploader" ? "종합 현황 보기" : "엑셀 파일 업로드"}</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>업무일지 작성</span>
          </button>
        </div>
      </div>

      {isInjoo && activeWorkerTab === "uploader" ? (
        <OperatorWorkspace onBulkUpload={onBulkUpload} />
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* 1. ⭐ [1위치: 최상단] 매입매출현황 요약 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    1. {monthTitle} 매입매출현황 요약
                  </h2>
                  <p className="text-xs text-slate-400">
                    전사 총 매출실적 및 원부자재 매입원가 마스터 현황
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("vehicle_sales")}
                  className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                >
                  <span>매출 상세 분석</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3 Core KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 총매출액 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매출액</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatAmount(totalSales)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                    자동차 부품 23개 차종 납품 실적
                  </p>
                </div>
              </div>

              {/* 총매입액 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액 (원가)</span>
                  <Layers className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatAmount(totalPurchases)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                    원부자재 및 외주가공 매입액
                  </p>
                </div>
              </div>

              {/* 매출대비 매입액 비율 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비 매입원가율</span>
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {purchaseRatio}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                    영업마진율: {(100 - parseFloat(purchaseRatio)).toFixed(1)}% 달성
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. ⭐ [2위치] 압출동 주간 비가동내역 요약 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    2. 압출동 주간 비가동내역 요약
                  </h2>
                  <p className="text-xs text-slate-400">
                    8월 4주차 압출 4대 라인 비가동 시간 및 가동률 현황
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("extrusion_downtime")}
                  className="flex items-center gap-1 text-xs font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors"
                >
                  <span>비가동 전체 매트릭스</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 8월 누적 스트립 */}
            <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-400">8월 설비별 누적 비가동:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {EXTRUSION_SUMMARY.map((ex) => (
                  <span key={ex.line} className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] font-bold">
                    <span className="text-slate-300">{ex.line}:</span> <strong className="text-rose-400">{ex.monthCumulative}분</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* 4 Line Weekly Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {EXTRUSION_SUMMARY.map((ex) => (
                <div
                  key={ex.line}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {ex.line}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black">
                      {ex.reason}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                        {ex.minutes}분
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">주간 비가동</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {ex.opRatio}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">가동률</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. ⭐ [3위치] 일일품질현황 요약 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    3. 일일품질현황 요약 (검사량순 정렬)
                  </h2>
                  <p className="text-xs text-slate-400">
                    4대 핵심 아이템 검사수량 및 불량률(%) 실시간 분석
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("daily_quality")}
                  className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                >
                  <span>품질현황 전체 분석</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 4 Core Item Quality Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUALITY_SUMMARY.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    q.isMax
                      ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-sm ${q.isMax ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-white"}`}>
                      {q.name}
                    </span>
                    {q.isMax ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>최고 불량</span>
                      </span>
                    ) : q.defectRate <= 0.70 ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                        목표달성
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black">
                        주의관리
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className={`text-xl font-black ${q.isMax ? "text-rose-600 dark:text-rose-400" : q.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {q.defectRate}%
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        불량 {q.defectQty.toLocaleString()} EA
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>검사량: <strong>{q.inspectQty.toLocaleString()} EA</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. ⭐ [4위치] 특근현황 요약 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    4. 특근현황 요약 (특근보고서)
                  </h2>
                  <p className="text-xs text-slate-400">
                    {OVERTIME_SUMMARY.date} • 총 {OVERTIME_SUMMARY.totalHeadcount}명 투입 실적
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("overtime_status")}
                  className="flex items-center gap-1 text-xs font-black text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors"
                >
                  <span>특근보고서 상세</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Overtime Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Approval Box & Total Headcount */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">총 특근 인원</span>
                  <span className="text-xs font-bold text-slate-500">작성자: {OVERTIME_SUMMARY.author}</span>
                </div>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  {OVERTIME_SUMMARY.totalHeadcount} <span className="text-sm text-slate-400 font-bold">명 투입</span>
                </div>

                {/* 4 Roles Approval Pills */}
                <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {OVERTIME_SUMMARY.approval.map((ap) => (
                    <div key={ap.role} className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">{ap.role}</span>
                      <strong className="text-xs text-slate-900 dark:text-white font-black block">{ap.name}</strong>
                      <span className="text-[9px] text-emerald-600 font-extrabold">●{ap.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">라인별 특근 인원</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {OVERTIME_SUMMARY.lineBreakdown.map((lb) => (
                    <div key={lb.name} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{lb.name}</span>
                      <span className="font-black text-purple-600 dark:text-purple-400">{lb.count}명</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime Reasons */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">※ 특근 실시 주요 사유</span>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {OVERTIME_SUMMARY.reasons.map((rs, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-black shrink-0">{idx + 1}.</span>
                      <span className="font-medium truncate">{rs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. ⭐ [5위치] 공장별 일일업무일지 공유 게시판 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>공장별 일일업무일지 게시판</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  각 공장 작업자들의 일일 생산 실적 및 점검 특이사항 공유
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select
                  value={filterPlant}
                  onChange={(e) => setFilterPlant(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">전체 공장 ({workLogs.length}건)</option>
                  <option value="삼랑진공장">삼랑진공장</option>
                  <option value="한림공장">한림공장</option>
                </select>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>작성</span>
                </button>
              </div>
            </div>

            {/* Work Logs Feed */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  등록된 일일업무일지가 없습니다.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="py-3.5 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          log.plant === "한림공장"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {log.plant}
                        </span>
                        <span className="font-black text-xs text-slate-900 dark:text-white">
                          {log.writer} {log.title || ""}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {log.process || "가공동 관리"}
                        </span>
                        <span className="text-[11px] text-slate-400">• {log.date} ({log.shift})</span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {log.line}
                        </span>
                      </div>

                      {(currentProfile?.name === log.writer || isAdmin) && (
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <div>
                        <strong className="text-slate-900 dark:text-white">작업 실적:</strong>{" "}
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{log.workContent}</span>
                      </div>
                      {log.issues && (
                        <div className="text-amber-700 dark:text-amber-400">
                          <strong>특이사항:</strong> {log.issues}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
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
