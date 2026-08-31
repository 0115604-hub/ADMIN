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
  ShieldAlert,
  Sparkles,
  Briefcase
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

export const WorkerDashboard = ({ onBulkUpload }) => {
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

  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 0;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "0.0";

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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Compact Minimized Top Banner for Worker with Assigned Process Badge */}
      <div className={`rounded-2xl px-5 py-3.5 text-white shadow-sm border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        workerPlant === "한림공장"
          ? "bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900"
          : "bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black tracking-tight">
                안녕하세요, {workerFullName}님! 🛠️
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold text-white">
                {workerPlant}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black shadow-sm">
                담당: {assignedProcess}
              </span>
            </div>
            <p className="text-[11px] text-white/70 mt-0.5">
              {monthTitle} 업무일지 작성 및 현황 확인
            </p>
          </div>
        </div>

        {/* Special Toggle for 조인주 (일지/요약 ↔ 엑셀 업로더) */}
        {isInjoo && (
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/15 backdrop-blur-md self-start sm:self-auto">
            <button
              onClick={() => setActiveWorkerTab("summary_log")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeWorkerTab === "summary_log"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              📋 업무일지 & 현황
            </button>
            <button
              onClick={() => setActiveWorkerTab("uploader")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeWorkerTab === "uploader"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-amber-300 hover:text-white"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>엑셀 파일 업로드</span>
            </button>
          </div>
        )}
      </div>

      {/* RENDER INJOO'S UPLOADER IF SELECTED */}
      {isInjoo && activeWorkerTab === "uploader" ? (
        <OperatorWorkspace onBulkUpload={onBulkUpload} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. {monthTitle} 매출 매입현황 (3가지 카드: 총매출액, 총매입액, 매출대비매입액비율) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>{monthTitle} 매출 매입현황</span>
              </h3>
              <span className="text-xs text-slate-400">마스터 정리본 기준</span>
            </div>

            {/* Exact 3 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. 총매출액 Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매출액</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {totalSales > 0 ? formatAmount(totalSales) : "0 원"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {totalSales > 0 ? `${monthTitle} 매출 실적` : "매출자료 업로드 대기"}
                  </p>
                </div>
              </div>

              {/* 2. 총매입액 (전월비) Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액 (원가)</span>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {totalPurchases > 0 ? formatAmount(totalPurchases) : "0 원"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {totalPurchases > 0 ? "원부자재 및 외주 매입액" : "매입자료 업로드 대기"}
                  </p>
                </div>
              </div>

              {/* 3. 매출대비 매입액 비율 Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비 매입액 비율</span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {purchaseRatio}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    매출액 대비 매입원가 비중
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. 일일업무일지 리스트 및 작성 영역 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>공장별 일일업무일지 공유 게시판</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  각 공장의 작업자가 일일 생산 실적, 공정 점검 및 특이사항을 실시간으로 공유합니다.
                </p>
              </div>

              <button
                onClick={() => {
                  setFormData({
                    date: new Date().toISOString().split("T")[0],
                    plant: workerPlant,
                    writer: workerFullName,
                    process: assignedProcess,
                    shift: "주간",
                    line: `${assignedProcess} 세부라인`,
                    workContent: "",
                    issues: ""
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>오늘의 업무일지 작성</span>
              </button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="작성자, 공정, 작업내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <select
                  value={filterPlant}
                  onChange={(e) => setFilterPlant(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">전체 공장 ({workLogs.length}건)</option>
                  <option value="삼랑진공장">삼랑진공장</option>
                  <option value="한림공장">한림공장</option>
                </select>
              </div>
            </div>

            {/* Work Logs List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  등록된 일일업무일지가 없습니다. [오늘의 업무일지 작성] 버튼을 눌러 첫 일지를 작성해 보세요!
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="py-4 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          log.plant === "한림공장"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {log.plant}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {log.writer} {log.title || ""}
                        </span>
                        {/* Process Badge */}
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {log.process || "가공동 관리"}
                        </span>
                        <span className="text-xs text-slate-400">• {log.date} ({log.shift})</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {log.line}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {log.createdAt}
                        </span>
                        {(currentProfile?.name === log.writer || isAdmin) && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                      <div>
                        <strong className="text-slate-900 dark:text-white">작업 실적:</strong>{" "}
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{log.workContent}</span>
                      </div>
                      {log.issues && (
                        <div className="text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span><strong>특이사항:</strong> {log.issues}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: CREATE NEW DAILY WORK LOG (Pre-filled Process) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    일일업무일지 작성
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">
                      {workerPlant} • 작성자: <strong>{workerFullName} {officialTitle}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black">
                      담당: {assignedProcess}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              {/* Date & Shift */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작업 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    근무 형태
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="주간">주간 (08:30 ~ 17:30)</option>
                    <option value="야간">야간 (20:30 ~ 05:30)</option>
                    <option value="연장">연장/특근</option>
                  </select>
                </div>
              </div>

              {/* Pre-filled Assigned Process & Detailed Line */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center justify-between">
                    <span>담당 공정 (자동지정)</span>
                    <span className="text-[10px] text-blue-600 font-black">★ 자동입력됨</span>
                  </label>
                  <select
                    value={formData.process || assignedProcess}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROCESS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} {opt === assignedProcess ? `(기본 담당)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    세부 라인 / 설비
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 9BQC 압출 1호기 / 가공 2라인"
                    value={formData.line}
                    onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Work Content */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  금일 작업 실적 및 주요 생산 내용
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="예: 금일 담당공정 생산 실적 및 점검 사항을 입력해 주세요."
                  value={formData.workContent}
                  onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Issues */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  특이사항 / 설비 점검 / 품질 이슈
                </label>
                <textarea
                  rows="2"
                  placeholder="예: 특이사항 없음 / 금형 점검 완료"
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>업무일지 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
