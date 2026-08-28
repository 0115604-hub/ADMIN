import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Save,
  Trash2,
  Edit3,
  Factory,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  UploadCloud,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { OperatorWorkspace } from "./OperatorWorkspace";

// Default Initial Work Logs Seed
const DEFAULT_WORK_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "조인주",
    shift: "주간",
    line: "9BQC 압출 1호기",
    workContent: "9BQC FRT LH/RH 압출 생산 (목표 2,400개 / 실적 2,450개 달성)",
    issues: "원료 TPE 공급압력 안정적 유지, 특이사항 없음",
    status: "완료",
    createdAt: "2026-08-28 08:30"
  },
  {
    id: 2,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "설유철",
    shift: "주간",
    line: "가공 2라인",
    workContent: "DT 수출용 웨더스트립 절단 및 피팅 가공 (1,800개 완료)",
    issues: "2호 절단기 칼날 마모 점검 후 교체 완료",
    status: "완료",
    createdAt: "2026-08-28 09:10"
  },
  {
    id: 3,
    date: "2026-08-28",
    plant: "한림공장",
    writer: "김동욱",
    shift: "주간",
    line: "EPDM 사출 라인",
    workContent: "NX4 코너 몰딩 사출 성형 (3,200개 출하 검사 완료)",
    issues: "금형 온도 145도 정상 유지, 품질 이상 없음",
    status: "완료",
    createdAt: "2026-08-28 08:50"
  }
];

export const WorkerDashboard = ({ onBulkUpload }) => {
  const { currentProfile, isOperator, isAdmin } = useAuth();
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();

  const isInjoo = currentProfile?.name === "조인주";
  const [activeWorkerTab, setActiveWorkerTab] = useState("summary_log"); // 'summary_log' | 'uploader'

  // Work Logs State
  const [workLogs, setWorkLogs] = useState(() => {
    const saved = localStorage.getItem("plant_daily_worklogs");
    return saved ? JSON.parse(saved) : DEFAULT_WORK_LOGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState(currentProfile?.plant || "all");

  // Form State for New Work Log
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    plant: currentProfile?.plant || "삼랑진공장",
    writer: currentProfile?.name || "작업자",
    shift: "주간",
    line: "9BQC 압출 1호기",
    workContent: "",
    issues: ""
  });

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
      writer: currentProfile?.name || formData.writer,
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

    const updated = [newLog, ...workLogs];
    setWorkLogs(updated);
    localStorage.setItem("plant_daily_worklogs", JSON.stringify(updated));

    setFormData({
      date: new Date().toISOString().split("T")[0],
      plant: currentProfile?.plant || "삼랑진공장",
      writer: currentProfile?.name || "작업자",
      shift: "주간",
      line: "9BQC 압출 1호기",
      workContent: "",
      issues: ""
    });
    setIsModalOpen(false);
  };

  const handleDeleteLog = (id) => {
    if (!window.confirm("이 업무일지를 삭제하시겠습니까?")) return;
    const updated = workLogs.filter((l) => l.id !== id);
    setWorkLogs(updated);
    localStorage.setItem("plant_daily_worklogs", JSON.stringify(updated));
  };

  const filteredLogs = workLogs.filter((log) => {
    const matchSearch =
      log.writer.includes(searchTerm) ||
      log.workContent.includes(searchTerm) ||
      log.line.includes(searchTerm) ||
      log.issues.includes(searchTerm);
    const matchPlant = filterPlant === "all" || log.plant === filterPlant;
    return matchSearch && matchPlant;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner for Worker */}
      <div className={`rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden ${
        currentProfile?.plant === "한림공장"
          ? "bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900"
          : "bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900"
      }`}>
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold">
              <Factory className="w-3.5 h-3.5" />
              <span>{currentProfile?.plant || "사업장"} • {currentProfile?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              안녕하세요, {currentProfile?.name} 님! 🛠️
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              {monthTitle} 매출·매입 현황을 확인하고 오늘의 일일업무일지를 작성해 주세요.
            </p>
          </div>

          {/* Special Toggle for 조인주 (일지/요약 ↔ 엑셀 업로더) */}
          {isInjoo && (
            <div className="flex items-center bg-black/30 p-1 rounded-2xl border border-white/20 backdrop-blur-md self-start md:self-auto">
              <button
                onClick={() => setActiveWorkerTab("summary_log")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeWorkerTab === "summary_log"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                📋 업무일지 & 현황
              </button>
              <button
                onClick={() => setActiveWorkerTab("uploader")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeWorkerTab === "uploader"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-amber-300 hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>엑셀 파일 업로드</span>
              </button>
            </div>
          )}
        </div>
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
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    {formatAmount(totalSales)}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {monthTitle} 마스터 매출 총액
                  </p>
                </div>
              </div>

              {/* 2. 총매입액 Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액</span>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    {formatAmount(totalPurchases)}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {monthTitle} 마스터 매입 총액
                  </p>
                </div>
              </div>

              {/* 3. 매출대비매입액비율 Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비매입액비율</span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {purchaseRatio}%
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    매출액 대비 총 매입(원가) 비중
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DAILY WORK LOG (일일업무일지 작성 및 조회) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>공장 일일업무일지 관리</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  오늘의 작업 실적 및 설비/품질 특이사항을 기록합니다.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>오늘의 업무일지 작성</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="작성자, 작업내용, 라인 검색..."
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
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          log.plant === "한림공장"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {log.plant}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {log.writer}
                        </span>
                        <span className="text-xs text-slate-400">• {log.date} ({log.shift})</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg">
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
      {/* 3. MODAL: CREATE NEW DAILY WORK LOG */}
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
                  <p className="text-xs text-slate-400">
                    {currentProfile?.plant} • 작성자: {currentProfile?.name}
                  </p>
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

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  담당 공정 / 라인
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 9BQC 압출 1호기 / EPDM 사출 라인 / 포장 검사 라인"
                  value={formData.line}
                  onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  금일 작업 실적 및 주요 생산 내용
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="예: 9BQC FRT LH 2,400개 압출 완료 및 양품 검사 완료. DT 수출품 포장 1,800개 완료"
                  value={formData.workContent}
                  onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  특이사항 / 설비 점검 / 품질 이슈
                </label>
                <textarea
                  rows="2"
                  placeholder="예: 2호 절단기 날 교체 완료, 원료 TPE 공급 압력 정상"
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
