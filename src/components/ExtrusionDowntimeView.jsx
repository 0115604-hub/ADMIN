import React, { useState, useMemo } from "react";
import {
  PauseCircle,
  PlayCircle,
  Clock,
  Plus,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Factory,
  Save,
  Calendar,
  Layers,
  TrendingDown,
  Activity,
  Wrench,
  BarChart2,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

export const EXTRUSION_LINES = [
  "PVC LINE",
  "PCM 1호 LINE",
  "PCM 3호 LINE",
  "TPE 1호 LINE"
];

export const DOWNTIME_REASONS = [
  "형교환",
  "원료 / 칼라 교체 (퍼징)",
  "온도 안정화 / 승온 대기",
  "설비 정기 점검 / 청소",
  "기계 고장 / 긴급 수리",
  "자재 대기 / 공급 지연",
  "작업 준비 / 교대 점검",
  "기타"
];

const WEEK_DAYS = [
  { day: "월", date: "2026-08-24", label: "월(8/24)" },
  { day: "화", date: "2026-08-25", label: "화(8/25)" },
  { day: "수", date: "2026-08-26", label: "수(8/26)" },
  { day: "목", date: "2026-08-27", label: "목(8/27)" },
  { day: "금", date: "2026-08-28", label: "금(8/28)" },
  { day: "토", date: "2026-08-29", label: "토(8/29)" }
];

const INITIAL_DOWNTIME_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    day: "금",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 1호 LINE",
    durationMinutes: 45,
    reason: "형교환",
    details: "DT SILL SEAL 형교환 및 피팅 세팅 완료",
    actionTaken: "금형 체결 및 145도 승온 정상화 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 2,
    date: "2026-08-28",
    day: "금",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 3호 LINE",
    durationMinutes: 30,
    reason: "형교환",
    details: "DT 호리젠탈 형교환 및 다이스 센터 정렬 완료",
    actionTaken: "금형 장착 및 시험 압출 양품 확인",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 3,
    date: "2026-08-27",
    day: "목",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "TPE 1호 LINE",
    durationMinutes: 40,
    reason: "형교환",
    details: "JA 전용 TPE 압출 형교환 및 원료 투입 점검",
    actionTaken: "호퍼 청소 및 스크류 잔류물 퍼징 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 4,
    date: "2026-08-26",
    day: "수",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PVC LINE",
    durationMinutes: 25,
    reason: "온도 안정화 / 승온 대기",
    details: "PVC 압출 다이스 3존 히터 온도 편차 발생에 따른 승온 안정화",
    actionTaken: "열전대 센서 체결 상태 점검 및 온도 편차 ±1도 이내 정상화",
    operator: "설유철 책임",
    status: "조치완료"
  }
];

const STORAGE_KEY = "factory_extrusion_downtime_logs_v3_matrix";

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();
  const { selectedMonth } = useMonth();

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DOWNTIME_LOGS;
    } catch {
      return INITIAL_DOWNTIME_LOGS;
    }
  });

  const [selectedWeek, setSelectedWeek] = useState("8월 4주차");
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [selectedReason, setSelectedReason] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultOperator = `${currentProfile?.name || "설유철"} ${currentProfile?.title || "책임"}`;
  const defaultPlant = currentProfile?.plant || "삼랑진공장";

  const [formData, setFormData] = useState({
    date: "2026-08-28",
    week: "8월 4주차",
    plant: defaultPlant,
    machine: "PCM 1호 LINE",
    durationMinutes: 30,
    reason: "형교환",
    details: "",
    actionTaken: "",
    operator: defaultOperator
  });

  // KPI Calculations
  const totalDowntimeMinutes = useMemo(() => {
    return logs.reduce((sum, log) => sum + (Number(log.durationMinutes) || 0), 0);
  }, [logs]);

  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);
  const standardWeeklyHours = 40 * 4; // 4 lines * 40h = 160h = 9600m
  const operationRatio = (100 - (totalDowntimeMinutes / (standardWeeklyHours * 60)) * 100).toFixed(1);

  // Total changeover (형교환) count & minutes
  const changeoverStats = useMemo(() => {
    const moldLogs = logs.filter((l) => l.reason === "형교환");
    const mCount = moldLogs.length;
    const mMinutes = moldLogs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
    return { count: mCount, minutes: mMinutes };
  }, [logs]);

  // Matrix calculation: Rows = 4 EXTRUSION_LINES, Columns = 6 WEEK_DAYS
  const matrixData = useMemo(() => {
    return EXTRUSION_LINES.map((line) => {
      const lineLogs = logs.filter((l) => l.machine === line);
      const daysData = {};

      WEEK_DAYS.forEach((w) => {
        const match = lineLogs.find((l) => l.date === w.date);
        daysData[w.date] = match
          ? { minutes: match.durationMinutes, reason: match.reason, details: match.details, id: match.id }
          : null;
      });

      const totalLineMinutes = lineLogs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
      const lineHours = 40; // 40h per week
      const lineOpRatio = (100 - (totalLineMinutes / (lineHours * 60)) * 100).toFixed(1);
      const mainReasons = lineLogs.map((l) => `${l.reason}(${l.details})`).join(", ") || "무중단 정상 가동";

      return {
        line,
        daysData,
        totalLineMinutes,
        lineOpRatio,
        mainReasons,
        count: lineLogs.length
      };
    });
  }, [logs]);

  // Day totals for matrix footer
  const dayTotals = useMemo(() => {
    return WEEK_DAYS.map((w) => {
      const dayLogs = logs.filter((l) => l.date === w.date);
      const sum = dayLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
      return { date: w.date, sum, count: dayLogs.length };
    });
  }, [logs]);

  // Save new log
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.details.trim()) {
      alert("비가동 세부 내용을 입력해 주세요.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      ...formData,
      durationMinutes: Number(formData.durationMinutes) || 0,
      status: "조치완료"
    };

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setFormData({
      date: "2026-08-28",
      week: "8월 4주차",
      plant: defaultPlant,
      machine: "PCM 1호 LINE",
      durationMinutes: 30,
      reason: "형교환",
      details: "",
      actionTaken: "",
      operator: defaultOperator
    });
    setIsModalOpen(false);
  };

  // Delete log
  const handleDelete = (id) => {
    if (!window.confirm("이 비가동 내역을 삭제하시겠습니까?")) return;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Filtered logs for detailed table
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchMachine = selectedMachine === "all" || log.machine === selectedMachine;
      const matchReason = selectedReason === "all" || log.reason === selectedReason;
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.machine.toLowerCase().includes(searchTerm.toLowerCase());

      return matchMachine && matchReason && matchSearch;
    });
  }, [logs, selectedMachine, selectedReason, searchTerm]);

  // Export to Excel Matching Matrix & Detail
  const handleExportExcel = () => {
    const rows = [
      ["압출동 주간 비가동 종합 관리 대장 (한눈에 보기)"],
      ["조회일자", new Date().toLocaleDateString(), "조회주차", selectedWeek, "총 비가동시간", `${totalDowntimeMinutes}분 (${totalDowntimeHours}시간)`, "종합 가동률", `${operationRatio}%`],
      [],
      ["[1] 주간 라인별 비가동 매트릭스"],
      ["압출 LINE", "월(8/24)", "화(8/25)", "수(8/26)", "목(8/27)", "금(8/28)", "토(8/29)", "주간 합계(분)", "라인 가동률", "금주 주요 비가동 내역"]
    ];

    matrixData.forEach((m) => {
      rows.push([
        m.line,
        m.daysData["2026-08-24"] ? `${m.daysData["2026-08-24"].minutes}분` : "-",
        m.daysData["2026-08-25"] ? `${m.daysData["2026-08-25"].minutes}분` : "-",
        m.daysData["2026-08-26"] ? `${m.daysData["2026-08-26"].minutes}분` : "-",
        m.daysData["2026-08-27"] ? `${m.daysData["2026-08-27"].minutes}분` : "-",
        m.daysData["2026-08-28"] ? `${m.daysData["2026-08-28"].minutes}분` : "-",
        m.daysData["2026-08-29"] ? `${m.daysData["2026-08-29"].minutes}분` : "-",
        `${m.totalLineMinutes}분`,
        `${m.lineOpRatio}%`,
        m.mainReasons
      ]);
    });

    rows.push([]);
    rows.push(["[2] 상세 비가동 발생 내역"]);
    rows.push(["NO", "일자", "주차", "공장", "압출 LINE", "비가동시간(분)", "비가동 구분", "세부내용", "조치사항", "담당자", "상태"]);

    filteredLogs.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.date,
        l.week,
        l.plant,
        l.machine,
        l.durationMinutes,
        l.reason,
        l.details,
        l.actionTaken,
        l.operator,
        l.status
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "압출동_주간비가동");
    XLSX.writeFile(wb, `압출동_주간비가동_종합_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HORIZONTAL CONTROL BAR & SUMMARY KPI */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                압출동 주간 비가동 관리 현황
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black">
                {selectedWeek}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              총괄: <strong>설유철 책임</strong> | 4개 LINE 가동률: <strong className="text-emerald-600 font-black">{operationRatio}%</strong> | 총 비가동: <strong className="text-rose-600 font-black">{totalDowntimeMinutes}분 ({totalDowntimeHours}시간)</strong>
            </p>
          </div>
        </div>

        {/* Quick Actions & Week Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="8월 4주차">8월 4주차 (8/24 ~ 8/29)</option>
            <option value="8월 3주차">8월 3주차 (8/17 ~ 8/22)</option>
            <option value="8월 2주차">8월 2주차 (8/10 ~ 8/15)</option>
            <option value="8월 1주차">8월 1주차 (8/03 ~ 8/08)</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>비가동 등록</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [핵심 1] 4대 LINE × 요일별 주간 비가동 한눈에 보기 매트릭스 보드 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h2 className="font-black text-base text-slate-900 dark:text-white">
              4개 압출 LINE 주간 비가동 종합 매트릭스 (한눈에 보기)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300"></span>
              <span>형교환 발생</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></span>
              <span>승온대기/설비점검</span>
            </span>
            <span className="text-slate-400">
              기준: 40시간/라인 (주간 160시간)
            </span>
          </div>
        </div>

        {/* Matrix Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-extrabold">
                <th className="py-3 px-3 text-left w-[16%]">압출 LINE</th>
                {WEEK_DAYS.map((w) => (
                  <th key={w.date} className="py-3 px-2 w-[9%]">
                    {w.label}
                  </th>
                ))}
                <th className="py-3 px-3 w-[12%] bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                  주간 합계
                </th>
                <th className="py-3 px-2 w-[8%]">가동률</th>
                <th className="py-3 px-3 text-left w-[20%]">금주 주요 발생 내역</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixData.map((m) => (
                <tr key={m.line} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Line Name */}
                  <td className="py-3.5 px-3 text-left font-black text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="text-sm tracking-tight">{m.line}</span>
                    </div>
                  </td>

                  {/* 6 Day Columns */}
                  {WEEK_DAYS.map((w) => {
                    const cell = m.daysData[w.date];
                    if (!cell) {
                      return (
                        <td key={w.date} className="py-3.5 px-2 text-slate-300 dark:text-slate-600 font-semibold">
                          -
                        </td>
                      );
                    }
                    const isMold = cell.reason === "형교환";
                    return (
                      <td key={w.date} className="py-2.5 px-1.5">
                        <div
                          className={`p-1.5 rounded-xl border text-center font-black transition-all shadow-sm ${
                            isMold
                              ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200"
                              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200"
                          }`}
                          title={`${cell.reason} (${cell.details})`}
                        >
                          <div className="text-xs text-rose-600 dark:text-rose-400 font-black">
                            {cell.minutes}분
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold truncate">
                            {cell.reason}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Line Weekly Sum */}
                  <td className="py-3.5 px-3 bg-amber-50/40 dark:bg-amber-950/10 font-black text-slate-900 dark:text-white">
                    <span className="text-sm text-rose-600 dark:text-rose-400">
                      {m.totalLineMinutes}
                    </span>
                    <span className="text-xs text-slate-400 ml-0.5">분</span>
                    <div className="text-[10px] text-slate-400 font-bold">
                      ({(m.totalLineMinutes / 60).toFixed(1)}시간)
                    </div>
                  </td>

                  {/* Line Operation Ratio */}
                  <td className="py-3.5 px-2 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {m.lineOpRatio}%
                  </td>

                  {/* Main Reason / Details */}
                  <td className="py-3.5 px-3 text-left font-medium text-slate-600 dark:text-slate-300 text-xs">
                    <div className="truncate max-w-xs" title={m.mainReasons}>
                      {m.mainReasons}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Matrix Footer (Daily Totals) */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs">
                <td className="py-3 px-3 text-left font-black text-xs">
                  일별 비가동 합계
                </td>
                {dayTotals.map((dt) => (
                  <td key={dt.date} className="py-3 px-2">
                    {dt.sum > 0 ? (
                      <div>
                        <span className="text-rose-600 dark:text-rose-400 font-black text-xs">{dt.sum}분</span>
                        <div className="text-[10px] text-slate-400 font-semibold">({dt.count}건)</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold">-</span>
                    )}
                  </td>
                ))}
                <td className="py-3 px-3 bg-amber-100/70 dark:bg-amber-900/40 text-rose-600 dark:text-rose-300 font-black text-sm">
                  {totalDowntimeMinutes} 분
                </td>
                <td className="py-3 px-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  {operationRatio}%
                </td>
                <td className="py-3 px-3 text-left text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                  형교환: <strong>{changeoverStats.count}건 ({changeoverStats.minutes}분)</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 2] 4개 LINE별 현황 카드 (Side-by-Side Horizontal Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {matrixData.map((m) => (
          <div
            key={m.line}
            onClick={() => setSelectedMachine(selectedMachine === m.line ? "all" : m.line)}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
              selectedMachine === m.line
                ? "bg-amber-50/80 border-amber-400 dark:bg-amber-950/40 dark:border-amber-600 ring-2 ring-amber-400/30"
                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>{m.line}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                {m.count}건 발생
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {m.totalLineMinutes}
                </span>
                <span className="text-xs text-slate-400 ml-1 font-bold">분 손실</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {m.lineOpRatio}%
                </span>
                <span className="text-[10px] text-slate-400 block">가동률</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 truncate" title={m.mainReasons}>
              {m.mainReasons}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [핵심 3] 상세 비가동 발생 대장 (Detailed Events Ledger) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              상세 비가동 발생 대장 ({filteredLogs.length}건)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Machine Filter */}
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 압출 LINE</option>
              {EXTRUSION_LINES.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>

            {/* Reason Filter */}
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 사유</option>
              {DOWNTIME_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="검색어..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-extrabold">
                <th className="py-2.5 px-3">일자 / 요일</th>
                <th className="py-2.5 px-3">압출 LINE</th>
                <th className="py-2.5 px-3 text-right">비가동 시간</th>
                <th className="py-2.5 px-3">비가동 구분 / 사유</th>
                <th className="py-2.5 px-3">세부 내용</th>
                <th className="py-2.5 px-3">조치 사항</th>
                <th className="py-2.5 px-3">조치자</th>
                <th className="py-2.5 px-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    등록된 비가동 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">
                      {log.date}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200/60 dark:border-amber-800/60">
                        {log.machine}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                      {log.durationMinutes} 분
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        log.reason === "형교환"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.actionTaken}>
                      {log.actionTaken}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {log.operator}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. REGISTRATION MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    압출동 비가동 내역 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    PVC LINE, PCM 1·3호 LINE, TPE 1호 LINE 형교환 및 비가동 등록
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    발생 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    압출 LINE 선택
                  </label>
                  <select
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {EXTRUSION_LINES.map((line) => (
                      <option key={line} value={line}>
                        {line}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    비가동 시간 (분)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="예: 30"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    비가동 구분 / 원인
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 font-black text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DOWNTIME_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  비가동 세부 내용 (차종/금형/작업)
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="예: DT SILL SEAL 형교환 및 피팅 세팅 진행"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  조치 사항 및 정상화 내용
                </label>
                <textarea
                  rows="2"
                  placeholder="예: 금형 체결 후 145도 승온 완료, 시험 압출 양품 확인"
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>비가동 내역 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
