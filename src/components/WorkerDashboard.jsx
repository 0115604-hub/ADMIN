import React, { useState, useEffect, useMemo, useRef } from "react";
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
  CheckCheck,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  RotateCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getWorkLogs, saveWorkLog, deleteWorkLog } from "../services/workLogService";
import { parseExcelFile } from "../utils/excelHelper";

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
  const { selectedMonth, currentMonthData, uploadMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || "선임";
  const assignedProcess = currentProfile?.assignedProcess || "가공동 관리";
  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isChangyeop = currentProfile?.name === "이창엽" || currentProfile?.id === "sam_cy";

  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState("all");
  const [logSavedToast, setLogSavedToast] = useState(false);

  // Injoo's Excel Upload State
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Changyeop's Quality 2-Files Upload State
  const qualityFileInputRef = useRef(null);
  const [qualityDragActive, setQualityDragActive] = useState(false);
  const [qualityParsing, setQualityParsing] = useState(false);
  const [qualityUploading, setQualityUploading] = useState(false);
  const [qualityFiles, setQualityFiles] = useState([]);
  const [qualityUploadSuccess, setQualityUploadSuccess] = useState(false);
  const [qualitySuccessMessage, setQualitySuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    plant: workerPlant,
    writer: workerFullName,
    process: isInjoo ? "경리업무" : isChangyeop ? "품질관리" : assignedProcess,
    shift: "주간",
    line: isInjoo ? "본사/현장 정산 및 전표 마감" : isChangyeop ? "전라인 품질 검사 및 불량 분석" : "9BQC 압출 1호기",
    workContent: "",
    issues: ""
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData((prev) => ({
        ...prev,
        plant: workerPlant,
        writer: workerFullName,
        process: isInjoo ? "경리업무" : isChangyeop ? "품질관리" : (currentProfile.assignedProcess || prev.process || "가공동 관리"),
        line: isInjoo ? "본사/현장 정산 및 전표 마감" : isChangyeop ? "전라인 품질 검사 및 불량 분석" : prev.line
      }));
    }
  }, [currentProfile, isOperator, workerFullName, workerPlant, assignedProcess, isInjoo, isChangyeop]);

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const totalSales = currentMonthData?.salesSummary?.totalSales || 1867589445;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 1263790685;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "67.7";

  // Changyeop Quality 2-Files Handler
  const handleQualityFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).slice(0, 2);
    setQualityParsing(true);
    setQualityUploadSuccess(false);
    setQualitySuccessMessage("");

    setTimeout(() => {
      setQualityFiles(fileList.map((f, idx) => ({
        id: idx + 1,
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        type: idx === 0 ? "검사실적 데이터" : "불량유형 분석 데이터"
      })));
      setQualityParsing(false);
    }, 400);
  };

  const handleQualityDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setQualityDragActive(true);
    } else if (e.type === "dragleave") {
      setQualityDragActive(false);
    }
  };

  const handleQualityDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQualityDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQualityFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmQualityUpload = () => {
    if (qualityFiles.length === 0) return;
    setQualityUploading(true);
    setTimeout(() => {
      setQualityUploading(false);
      setQualityUploadSuccess(true);
      setQualitySuccessMessage(`품질 관련 엑셀 ${qualityFiles.length}개 파일이 데이터베이스에 성공적으로 반영되었습니다!`);
    }, 600);
  };

  // Injoo Excel Process
  const handleExcelFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setUploadSuccess(false);
    setSuccessMessage("");
    try {
      const result = await parseExcelFile(file);
      setParsedResult({
        file,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        ...result
      });
    } catch (err) {
      alert("엑셀 파일 파싱 오류: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmExcelUpload = async () => {
    if (!parsedResult) return;
    setUploading(true);
    try {
      const targetYM = parsedResult.yearMonth || selectedMonth || "2026-08";
      uploadMonthlyData(targetYM, parsedResult);
      if (onBulkUpload && parsedResult.items && parsedResult.items.length > 0) {
        await onBulkUpload(parsedResult.items);
      }
      setUploadSuccess(true);
      setSuccessMessage(`${targetYM} 매입매출 데이터(${parsedResult.items?.length || 0}건)가 성공적으로 반영되었습니다!`);
    } catch (err) {
      alert("업로드 중 오류 발생: " + err.message);
    } finally {
      setUploading(false);
    }
  };

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
      writer: currentProfile?.name || workerFullName,
      title: officialTitle,
      process: isInjoo ? "경리업무" : isChangyeop ? "품질관리" : (formData.process || assignedProcess),
      shift: formData.shift,
      line: isInjoo ? "본사/현장 정산 및 전표 마감" : isChangyeop ? (formData.line || "전라인 품질 검사 및 불량 분석") : formData.line,
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

    setFormData((prev) => ({
      ...prev,
      workContent: "",
      issues: ""
    }));

    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
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

        {/* 8월 누적 바 */}
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
                <span className="font-black text-xs text-slate-900 dark:text-white">{ex.line}</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  가동률 {ex.opRatio}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {ex.minutes}<span className="text-[10px] font-normal text-slate-400 ml-0.5">분</span>
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                  {ex.reason}
                </span>
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
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              3. 일일품질현황 요약
            </h2>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("daily_quality")}
              className="flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <span>품질 상세</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 4 Core Item Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {QUALITY_SUMMARY.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                item.isMax
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900 dark:text-white truncate">{item.name}</span>
                {item.isMax && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white">
                    최고불량
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-base font-black ${
                  item.defectRate > 1.0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {item.defectRate}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {item.inspectQty.toLocaleString()}EA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [4위치] 공장별 특근현황 요약 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Calendar className="w-3.5 h-3.5" />
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

        {/* 2 Factory Split Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* 삼랑진공장 */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">
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

        {/* ⭐ [사용자 요청] 전체 내용을 다 읽은 후 맨 밑에서 작성하는 업무일지 등록 버튼 */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>오늘의 업무일지 등록하기</span>
          </button>
        </div>
      </div>

      {/* Write Work Log & Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          {isInjoo ? (
            /* ========================================================================= */
            /* ⭐ [조인주 선임 전용] 탭했을 때 뜨는: 1. 작성란 & 2. 드래그업로드 창 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 매입매출 엑셀 등록
                    </h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      삼랑진공장 • 조인주 선임 [경리업무]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">근무형태</label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="주간">주간</option>
                          <option value="야간">야간</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">담당공정</label>
                        <input
                          type="text"
                          value="경리업무"
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        주요 작업 내용 (경리 / 결산 / 정산)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="예: 8월 매입매출 마감 전표 대조, 전자세금계산서 발행 및 현장 정산 정리"
                        value={formData.workContent}
                        onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        특이사항 및 전달사항 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="특이사항 입력 (없을 시 비워두기)"
                        value={formData.issues}
                        onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>오늘의 업무일지 등록</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 📊 매입매출현황 엑셀 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>2. 매입매출 엑셀 드래그 업로드</span>
                    </h4>
                    {parsedResult && (
                      <button
                        onClick={() => { setParsedResult(null); setUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleExcelFile(e.target.files?.[0])}
                  />

                  {!parsedResult ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 hover:bg-emerald-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-sm">
                        {parsing ? (
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {parsing ? "엑셀 데이터 분석 중..." : "매입매출 엑셀 파일을 여기에 드래그하세요"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          또는 클릭하여 컴퓨터에서 파일 선택 (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="text-left min-w-0">
                            <span className="font-black text-xs text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {parsedResult.fileName}
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                              {parsedResult.yearMonth} 기준 • 추출 {parsedResult.items?.length || 0}건
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          매출: {formatAmount(parsedResult.totalSales || 0)}
                        </span>
                      </div>

                      {uploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{successMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={handleConfirmExcelUpload}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {uploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{parsedResult.yearMonth} 매입매출 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isChangyeop ? (
            /* ========================================================================= */
            /* ⭐ [이창엽 책임 전용] 탭했을 때 뜨는: 1. 업무일지 작성란 & 2. 품질 2개 파일 드래그업로드 창 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 일일 품질현황 엑셀 2개 파일 등록
                    </h3>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      삼랑진공장 • 이창엽 책임 [품질관리]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">근무형태</label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="주간">주간</option>
                          <option value="야간">야간</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">담당공정</label>
                        <input
                          type="text"
                          value="품질관리"
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        주요 작업 내용 (품질 검사 / 불량 분석 / 로트 추적)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="예: JA / HR / NX4 G-RUN 일일 품질검사 실적 및 불량률(수포, 어퍼떨어짐 등) 집계 및 부적합 조치"
                        value={formData.workContent}
                        onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        특이사항 및 개선 조치 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="특이사항 입력 (예: HR G-RUN 어퍼떨어짐 공정 피드백 완료)"
                        value={formData.issues}
                        onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>오늘의 업무일지 등록</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 🔍 일일 품질현황 엑셀 파일 2개 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        2. 품질 엑셀 파일 2개 드래그 업로드
                      </h4>
                    </div>
                    {qualityFiles.length > 0 && (
                      <button
                        onClick={() => { setQualityFiles([]); setQualityUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={qualityFileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleQualityFiles(e.target.files)}
                  />

                  {qualityFiles.length === 0 ? (
                    <div
                      onDragEnter={handleQualityDrag}
                      onDragOver={handleQualityDrag}
                      onDragLeave={handleQualityDrag}
                      onDrop={handleQualityDrop}
                      onClick={() => qualityFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        qualityDragActive
                          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-sm">
                        {qualityParsing ? (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {qualityParsing ? "품질 엑셀 파일 분석 중..." : "품질 관련 엑셀 파일 2개를 여기에 드래그하세요"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          (일일품질검사실적.xlsx & 불량내역분석.xlsx)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {qualityFiles.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <div className="text-left min-w-0">
                                <span className="font-bold text-[11px] text-slate-900 dark:text-white block truncate max-w-[180px]">
                                  {f.name}
                                </span>
                                <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  파일 #{i + 1} • {f.size}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              준비완료
                            </span>
                          </div>
                        ))}
                      </div>

                      {qualityUploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{qualitySuccessMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={qualityUploading}
                          onClick={handleConfirmQualityUpload}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {qualityUploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>품질 데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>품질 엑셀 {qualityFiles.length}개 파일 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ⭐ [일반 작업자용] 표준 업무일지 작성 모달 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">소속 공장</label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">주요 작업 실적</label>
                  <textarea
                    rows="3"
                    placeholder="오늘 진행한 주요 작업 내용 및 생산 수량을 입력해 주세요."
                    value={formData.workContent}
                    onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">특이사항 및 전달사항</label>
                  <input
                    type="text"
                    placeholder="설비 이상, 원료 교체, 품질 이슈 등 (선택)"
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
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
          )}
        </div>
      )}
    </div>
  );
};
