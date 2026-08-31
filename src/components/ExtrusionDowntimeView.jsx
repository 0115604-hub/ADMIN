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
  CheckSquare,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Check,
  Flame
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

// 1. 압출 라인 중요도 순서 (사용자 지정 1~4순위)
export const EXTRUSION_LINES = [
  { id: "pcm1", name: "PCM 1호 LINE", rank: 1, rankBadge: "1순위 메인", desc: "DT SILL SEAL / 메인 압출", color: "from-blue-600 to-indigo-700", badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300" },
  { id: "pcm3", name: "PCM 3호 LINE", rank: 2, rankBadge: "2순위 주력", desc: "DT 호리젠탈 / 주력 압출", color: "from-cyan-600 to-blue-700", badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300" },
  { id: "tpe1", name: "TPE 1호 LINE", rank: 3, rankBadge: "3순위 전용", desc: "JA 전용 / TPE 복합 압출", color: "from-emerald-600 to-teal-700", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300" },
  { id: "pvc",  name: "PVC LINE",     rank: 4, rankBadge: "4순위 일반", desc: "PVC 압출 및 피팅", color: "from-amber-600 to-orange-700", badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300" }
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

// Initial Data ordered with exact priorities
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

const STORAGE_KEY = "factory_extrusion_downtime_logs_v4_priority";

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
  const [selectedLineFilter, setSelectedLineFilter] = useState("all");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState("all");
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

  // Overall Statistics
  const totalDowntimeMinutes = useMemo(() => {
    return logs.reduce((sum, log) => sum + (Number(log.durationMinutes) || 0), 0);
  }, [logs]);

  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);
  const standardWeeklyHours = 40 * 4; // 160h = 9600 min
  const operationRatio = (100 - (totalDowntimeMinutes / (standardWeeklyHours * 60)) * 100).toFixed(1);

  // Mold changeover stats
  const changeoverStats = useMemo(() => {
    const moldLogs = logs.filter((l) => l.reason === "형교환");
    const count = moldLogs.length;
    const minutes = moldLogs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
    return { count, minutes };
  }, [logs]);

  // Matrix calculation ordered by EXTRUSION_LINES (PCM 1호 -> PCM 3호 -> TPE 1호 -> PVC)
  const matrixData = useMemo(() => {
    return EXTRUSION_LINES.map((lineMeta) => {
      const lineLogs = logs.filter((l) => l.machine === lineMeta.name);
      const daysData = {};

      WEEK_DAYS.forEach((w) => {
        const match = lineLogs.find((l) => l.date === w.date);
        daysData[w.date] = match
          ? { minutes: match.durationMinutes, reason: match.reason, details: match.details, id: match.id }
          : null;
      });

      const totalMinutes = lineLogs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
      const lineWeeklyHours = 40;
      const opRatio = (100 - (totalMinutes / (lineWeeklyHours * 60)) * 100).toFixed(1);
      const mainReasons = lineLogs.map((l) => `[${l.reason}] ${l.details}`).join(" • ") || "무중단 정상 가동";

      return {
        ...lineMeta,
        daysData,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1),
        opRatio,
        mainReasons,
        count: lineLogs.length
      };
    });
  }, [logs]);

  // Daily totals for bottom footer
  const dailyTotals = useMemo(() => {
    return WEEK_DAYS.map((w) => {
      const dayLogs = logs.filter((l) => l.date === w.date);
      const sum = dayLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
      return { date: w.date, label: w.label, sum, count: dayLogs.length };
    });
  }, [logs]);

  // Handle Save
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

  // Handle Delete
  const handleDelete = (id) => {
    if (!window.confirm("이 비가동 내역을 삭제하시겠습니까?")) return;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Filtered detailed logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchLine = selectedLineFilter === "all" || log.machine === selectedLineFilter;
      const matchReason = selectedReasonFilter === "all" || log.reason === selectedReasonFilter;
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.machine.toLowerCase().includes(searchTerm.toLowerCase());

      return matchLine && matchReason && matchSearch;
    });
  }, [logs, selectedLineFilter, selectedReasonFilter, searchTerm]);

  // Export to Excel Matching Priority & Matrix
  const handleExportExcel = () => {
    const rows = [
      ["압출동 주간 비가동 현황 (PCM 1호 • PCM 3호 • TPE 1호 • PVC)"],
      ["조회일자", new Date().toLocaleDateString(), "조회주차", selectedWeek, "총 비가동시간", `${totalDowntimeMinutes}분 (${totalDowntimeHours}시간)`, "종합 가동률", `${operationRatio}%`],
      [],
      ["[1] 압출 4개 LINE 주간 비가동 매트릭스"],
      ["중요도", "압출 LINE", "월(8/24)", "화(8/25)", "수(8/26)", "목(8/27)", "금(8/28)", "토(8/29)", "주간 합계(분)", "가동률", "금주 주요 발생 사유 및 내용"]
    ];

    matrixData.forEach((m) => {
      rows.push([
        m.rankBadge,
        m.name,
        m.daysData["2026-08-24"] ? `${m.daysData["2026-08-24"].minutes}분` : "-",
        m.daysData["2026-08-25"] ? `${m.daysData["2026-08-25"].minutes}분` : "-",
        m.daysData["2026-08-26"] ? `${m.daysData["2026-08-26"].minutes}분` : "-",
        m.daysData["2026-08-27"] ? `${m.daysData["2026-08-27"].minutes}분` : "-",
        m.daysData["2026-08-28"] ? `${m.daysData["2026-08-28"].minutes}분` : "-",
        m.daysData["2026-08-29"] ? `${m.daysData["2026-08-29"].minutes}분` : "-",
        `${m.totalMinutes}분 (${m.totalHours}h)`,
        `${m.opRatio}%`,
        m.mainReasons
      ]);
    });

    rows.push([]);
    rows.push(["[2] 상세 비가동 발생 일지"]);
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
    XLSX.writeFile(wb, `압출동_비가동현황_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WEEK CONTROLLER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>압출 4대 라인 중요도 순위 정렬 완료</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <span>압출동 주간 비가동 종합 현황</span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 font-bold">
              {selectedWeek}
            </span>
          </h1>
          <p className="text-xs text-slate-300">
            <strong>PCM 1호(1순위)</strong> ➔ <strong>PCM 3호(2순위)</strong> ➔ <strong>TPE 1호(3순위)</strong> ➔ <strong>PVC(4순위)</strong> 라인의 형교환 및 가동 효율을 실시간 관리합니다.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-black text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
          >
            <option value="8월 4주차">8월 4주차 (8/24 ~ 8/29)</option>
            <option value="8월 3주차">8월 3주차 (8/17 ~ 8/22)</option>
            <option value="8월 2주차">8월 2주차 (8/10 ~ 8/15)</option>
            <option value="8월 1주차">8월 1주차 (8/03 ~ 8/08)</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>비가동 내역 등록</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 4-LINE PRIORITY OVERVIEW CARDS (PCM 1호 ➔ PCM 3호 ➔ TPE 1호 ➔ PVC) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {matrixData.map((m) => {
          const isSelected = selectedLineFilter === m.name;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedLineFilter(isSelected ? "all" : m.name)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-50/80 border-blue-500 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Top Rank Badge & Name */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${m.badgeColor}`}>
                    {m.rankBadge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {m.count}건 발생
                  </span>
                </div>

                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{m.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {m.desc}
                </p>
              </div>

              {/* Middle Metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {m.totalMinutes}
                    </span>
                    <span className="text-xs text-slate-400 ml-1 font-bold">분 손실</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {m.opRatio}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">가동률</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, m.opRatio))}%` }}
                  ></div>
                </div>
              </div>

              {/* Bottom Issue Summary */}
              <div className="mt-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate font-semibold">
                {m.mainReasons}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 매트릭스] 4개 LINE × 요일별 주간 비가동 종합 매트릭스 표 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                압출 4개 LINE 주간 비가동 종합 매트릭스
              </h2>
              <p className="text-xs text-slate-400">
                중요도 순서 (PCM 1호 ➔ PCM 3호 ➔ TPE 1호 ➔ PVC) 기준 요일별 비가동 현황
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>형교환 ({changeoverStats.count}건 / {changeoverStats.minutes}분)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500">
              <span>총 비가동: <strong className="text-rose-600 dark:text-rose-400">{totalDowntimeMinutes}분 ({totalDowntimeHours}h)</strong></span>
            </span>
          </div>
        </div>

        {/* Matrix Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                <th className="py-3 px-3 text-left w-[8%]">중요도</th>
                <th className="py-3 px-3 text-left w-[14%]">압출 LINE</th>
                {WEEK_DAYS.map((w) => (
                  <th key={w.date} className="py-3 px-2 w-[9%] font-extrabold">
                    {w.label}
                  </th>
                ))}
                <th className="py-3 px-3 w-[11%] bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-black">
                  주간 합계
                </th>
                <th className="py-3 px-2 w-[8%]">가동률</th>
                <th className="py-3 px-3 text-left w-[18%]">금주 주요 발생 사유 및 내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixData.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Rank Badge */}
                  <td className="py-3.5 px-3 text-left">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${m.badgeColor}`}>
                      {m.rankBadge}
                    </span>
                  </td>

                  {/* Line Name */}
                  <td className="py-3.5 px-3 text-left font-black text-slate-900 dark:text-white">
                    <div className="text-sm font-extrabold">{m.name}</div>
                    <span className="text-[10px] text-slate-400 font-medium block">{m.desc}</span>
                  </td>

                  {/* 6 Day Columns */}
                  {WEEK_DAYS.map((w) => {
                    const cell = m.daysData[w.date];
                    if (!cell) {
                      return (
                        <td key={w.date} className="py-3.5 px-2 text-slate-300 dark:text-slate-600 font-bold">
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
                              ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200"
                              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200"
                          }`}
                          title={`${cell.reason} (${cell.details})`}
                        >
                          <div className="text-xs text-rose-600 dark:text-rose-400 font-black">
                            {cell.minutes}분
                          </div>
                          <div className="text-[10px] font-bold truncate max-w-[75px] mx-auto">
                            {cell.reason}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Line Weekly Sum */}
                  <td className="py-3.5 px-3 bg-slate-50 dark:bg-slate-800/40 font-black text-slate-900 dark:text-white">
                    <span className="text-sm text-rose-600 dark:text-rose-400 font-black">
                      {m.totalMinutes}
                    </span>
                    <span className="text-xs text-slate-400 ml-0.5">분</span>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      ({m.totalHours}시간)
                    </div>
                  </td>

                  {/* Line Operation Ratio */}
                  <td className="py-3.5 px-2 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {m.opRatio}%
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
                <td colSpan="2" className="py-3 px-3 text-left font-black text-xs">
                  일별 비가동 시간 합계
                </td>
                {dailyTotals.map((dt) => (
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
      {/* 4. DETAILED LOG LEDGER (상세 발생 일지 & 필터) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              상세 비가동 발생 일지 ({filteredLogs.length}건)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Line Filter */}
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 압출 LINE</option>
              {EXTRUSION_LINES.map((line) => (
                <option key={line.id} value={line.name}>
                  {line.name} ({line.rankBadge})
                </option>
              ))}
            </select>

            {/* Reason Filter */}
            <select
              value={selectedReasonFilter}
              onChange={(e) => setSelectedReasonFilter(e.target.value)}
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
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-extrabold">
                <th className="py-2.5 px-3">발생 일자</th>
                <th className="py-2.5 px-3">압출 LINE</th>
                <th className="py-2.5 px-3 text-right">비가동 시간</th>
                <th className="py-2.5 px-3">비가동 구분 / 사유</th>
                <th className="py-2.5 px-3">세부 작업 내용</th>
                <th className="py-2.5 px-3">조치 사항 및 정상화</th>
                <th className="py-2.5 px-3">담당 조치자</th>
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
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-extrabold text-[11px] border border-blue-200/60 dark:border-blue-800/60">
                        {log.machine}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                      {log.durationMinutes} 분
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        log.reason === "형교환"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
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
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    압출동 비가동 내역 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    PCM 1호, PCM 3호, TPE 1호, PVC 라인 형교환 및 비가동 등록
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    압출 LINE 선택 (중요도순)
                  </label>
                  <select
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EXTRUSION_LINES.map((line) => (
                      <option key={line.id} value={line.name}>
                        {line.name} ({line.rankBadge})
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    비가동 구분 / 원인
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 font-black text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5"
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
