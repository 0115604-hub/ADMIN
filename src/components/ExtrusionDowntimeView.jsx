import React, { useState, useMemo } from "react";
import {
  PauseCircle,
  Clock,
  Plus,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Save,
  Wrench,
  BarChart2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

// 1. 압출 라인 (설비명)
export const EXTRUSION_LINES = [
  "PCM 1호",
  "PCM 3호",
  "TPE 1호",
  "PVC"
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

// Short abbreviations for clean uniform cell size
const getShortReason = (reason) => {
  if (!reason) return "";
  if (reason.includes("형교환")) return "형교환";
  if (reason.includes("원료") || reason.includes("퍼징")) return "원료교체";
  if (reason.includes("온도") || reason.includes("승온")) return "승온대기";
  if (reason.includes("점검") || reason.includes("청소")) return "설비점검";
  if (reason.includes("고장") || reason.includes("수리")) return "설비수리";
  if (reason.includes("자재") || reason.includes("대기")) return "자재대기";
  if (reason.includes("준비") || reason.includes("교대")) return "작업준비";
  return reason.slice(0, 4);
};

const WEEK_DAYS = [
  { day: "월", date: "2026-08-24", label: "월 (8/24)" },
  { day: "화", date: "2026-08-25", label: "화 (8/25)" },
  { day: "수", date: "2026-08-26", label: "수 (8/26)" },
  { day: "목", date: "2026-08-27", label: "목 (8/27)" },
  { day: "금", date: "2026-08-28", label: "금 (8/28)" },
  { day: "토", date: "2026-08-29", label: "토 (8/29)" }
];

const INITIAL_DOWNTIME_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    day: "금",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 1호",
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
    machine: "PCM 3호",
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
    machine: "TPE 1호",
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
    machine: "PVC",
    durationMinutes: 25,
    reason: "온도 안정화 / 승온 대기",
    details: "PVC 압출 다이스 3존 히터 온도 편차 발생에 따른 승온 안정화",
    actionTaken: "열전대 센서 체결 상태 점검 및 온도 편차 ±1도 이내 정상화",
    operator: "설유철 책임",
    status: "조치완료"
  }
];

const STORAGE_KEY = "factory_extrusion_downtime_logs_v5_clean";

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
    machine: "PCM 1호",
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
  const standardWeeklyHours = 40 * 4; // 160h = 9600 min
  const operationRatio = (100 - (totalDowntimeMinutes / (standardWeeklyHours * 60)) * 100).toFixed(1);

  // Matrix calculation (PCM 1호 -> PCM 3호 -> TPE 1호 -> PVC)
  const matrixData = useMemo(() => {
    return EXTRUSION_LINES.map((lineName) => {
      const lineLogs = logs.filter((l) => l.machine === lineName || l.machine === `${lineName} LINE`);
      const daysData = {};

      WEEK_DAYS.forEach((w) => {
        const match = lineLogs.find((l) => l.date === w.date);
        daysData[w.date] = match
          ? {
              minutes: match.durationMinutes,
              reason: match.reason,
              shortReason: getShortReason(match.reason),
              details: match.details,
              id: match.id
            }
          : null;
      });

      const totalMinutes = lineLogs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
      const lineWeeklyHours = 40;
      const opRatio = (100 - (totalMinutes / (lineWeeklyHours * 60)) * 100).toFixed(1);
      const count = lineLogs.length;

      return {
        lineName,
        daysData,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1),
        opRatio,
        count
      };
    });
  }, [logs]);

  // Daily totals for bottom footer
  const dailyTotals = useMemo(() => {
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
      machine: "PCM 1호",
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

  // Filtered detailed logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchLine = selectedLineFilter === "all" || log.machine === selectedLineFilter || log.machine === `${selectedLineFilter} LINE`;
      const matchReason = selectedReasonFilter === "all" || log.reason === selectedReasonFilter;
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.machine.toLowerCase().includes(searchTerm.toLowerCase());

      return matchLine && matchReason && matchSearch;
    });
  }, [logs, selectedLineFilter, selectedReasonFilter, searchTerm]);

  // Export to Excel Matching Clean Matrix
  const handleExportExcel = () => {
    const rows = [
      ["압출동 주간 비가동 종합 관리 대장"],
      ["조회일자", new Date().toLocaleDateString(), "조회주차", selectedWeek, "총 비가동시간", `${totalDowntimeMinutes}분 (${totalDowntimeHours}시간)`, "종합 가동률", `${operationRatio}%`],
      [],
      ["[1] 압출 라인별 주간 비가동 매트릭스"],
      ["압출LINE (설비명)", "월 (8/24)", "화 (8/25)", "수 (8/26)", "목 (8/27)", "금 (8/28)", "토 (8/29)", "주간 합계", "가동률"]
    ];

    matrixData.forEach((m) => {
      rows.push([
        m.lineName,
        m.daysData["2026-08-24"] ? `${m.daysData["2026-08-24"].minutes}분 (${m.daysData["2026-08-24"].shortReason})` : "-",
        m.daysData["2026-08-25"] ? `${m.daysData["2026-08-25"].minutes}분 (${m.daysData["2026-08-25"].shortReason})` : "-",
        m.daysData["2026-08-26"] ? `${m.daysData["2026-08-26"].minutes}분 (${m.daysData["2026-08-26"].shortReason})` : "-",
        m.daysData["2026-08-27"] ? `${m.daysData["2026-08-27"].minutes}분 (${m.daysData["2026-08-27"].shortReason})` : "-",
        m.daysData["2026-08-28"] ? `${m.daysData["2026-08-28"].minutes}분 (${m.daysData["2026-08-28"].shortReason})` : "-",
        m.daysData["2026-08-29"] ? `${m.daysData["2026-08-29"].minutes}분 (${m.daysData["2026-08-29"].shortReason})` : "-",
        `${m.totalMinutes}분`,
        `${m.opRatio}%`
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
    XLSX.utils.book_append_sheet(wb, ws, "압출동_비가동");
    XLSX.writeFile(wb, `압출동_주간비가동_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 8월 설비별 월간 누적 총 비가동 시간 (PCM 1호, PCM 3호, TPE 1호, PVC)
  const monthlyStats = useMemo(() => {
    const baseMonthly = {
      "PCM 1호": 180,
      "PCM 3호": 140,
      "TPE 1호": 135,
      "PVC": 105
    };

    let totalMin = 0;
    const list = EXTRUSION_LINES.map((line) => {
      const min = baseMonthly[line] || 120;
      totalMin += min;
      return {
        line,
        minutes: min,
        hours: (min / 60).toFixed(1)
      };
    });

    return {
      list,
      totalMinutes: totalMin,
      totalHours: (totalMin / 60).toFixed(1)
    };
  }, []);

  return (
    <div className="space-y-4 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 0. 8월 총 비가동시간 설비별 간략 표시 바 (배너 위 상단 스트립) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl px-4 sm:px-5 py-3 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
        {/* Left Title */}
        <div className="flex items-center gap-2 font-black shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-amber-400 font-black">2026년 08월 누적</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-200 font-bold">설비별 총 비가동 시간</span>
        </div>

        {/* Right: Equipments Concise Pills & Total */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {monthlyStats.list.map((item) => (
            <div
              key={item.line}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-[11px]"
            >
              <span className="font-bold text-slate-300">{item.line}</span>
              <span className="font-black text-rose-400">{item.minutes}분</span>
              <span className="text-[10px] text-slate-400">({item.hours}h)</span>
            </div>
          ))}

          {/* Monthly Sum */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black">
            <span>8월 합계:</span>
            <span className="text-white font-black text-xs">{monthlyStats.totalMinutes}분 ({monthlyStats.totalHours}시간)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WEEK CONTROLLER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                압출동 주간 비가동 내역
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black">
                {selectedWeek}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              총 비가동: <strong className="text-rose-600 font-black">{totalDowntimeMinutes}분 ({totalDowntimeHours}시간)</strong> | 압출 가동률: <strong className="text-emerald-600 font-black">{operationRatio}%</strong>
            </p>
          </div>
        </div>

        {/* Quick Actions & Week Select */}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm active:scale-95"
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
      {/* 2. 4-LINE OVERVIEW CARDS (PCM 1호, PCM 3호, TPE 1호, PVC) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {matrixData.map((m) => {
          const isSelected = selectedLineFilter === m.lineName;
          return (
            <div
              key={m.lineName}
              onClick={() => setSelectedLineFilter(isSelected ? "all" : m.lineName)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
                isSelected
                  ? "bg-amber-50/90 border-amber-400 dark:bg-amber-950/40 dark:border-amber-600 ring-2 ring-amber-400/30 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>{m.lineName}</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {m.count}건 발생
                </span>
              </div>

              <div className="mt-4 pt-2 flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800">
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
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 1] 4대 LINE × 요일별 주간 비가동 매트릭스 표 (동일 규격 그리드) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                압출 LINE 주간 비가동 종합 매트릭스
              </h2>
              <p className="text-xs text-slate-400">
                일자별 비가동 시간 및 사유 요약
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400">
            주간 기준: 라인별 40시간
          </div>
        </div>

        {/* Matrix Grid Table with Fixed Uniform Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                {/* 1. 압출LINE (설비명) */}
                <th className="py-3 px-3 text-left w-[22%]">압출 LINE</th>
                {/* 2. 6 Day Columns (Identical 11% Width Each) */}
                {WEEK_DAYS.map((w) => (
                  <th key={w.date} className="py-3 px-1.5 w-[11%] font-extrabold">
                    {w.label}
                  </th>
                ))}
                {/* 3. Weekly Total (11% Width) */}
                <th className="py-3 px-2 w-[11%] bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-black">
                  주간 합계
                </th>
                {/* 4. Operation Ratio (11% Width) */}
                <th className="py-3 px-2 w-[11%]">가동률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixData.map((m) => (
                <tr key={m.lineName} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Equipment Name */}
                  <td className="py-3 px-3 text-left font-black text-slate-900 dark:text-white">
                    <span className="text-sm font-black">{m.lineName}</span>
                  </td>

                  {/* 6 Day Uniform Boxes */}
                  {WEEK_DAYS.map((w) => {
                    const cell = m.daysData[w.date];
                    if (!cell) {
                      return (
                        <td key={w.date} className="py-2.5 px-1.5">
                          <div className="h-11 flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-sm">
                            -
                          </div>
                        </td>
                      );
                    }
                    const isMold = cell.reason.includes("형교환");
                    return (
                      <td key={w.date} className="py-2.5 px-1.5">
                        <div
                          className={`h-11 flex flex-col items-center justify-center rounded-xl border text-center font-black transition-all shadow-sm ${
                            isMold
                              ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200"
                              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200"
                          }`}
                          title={`${cell.reason} (${cell.details})`}
                        >
                          <span className="text-xs font-black leading-tight text-rose-600 dark:text-rose-400">
                            {cell.minutes}분
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                            {cell.shortReason}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  {/* Weekly Total */}
                  <td className="py-2.5 px-2 bg-slate-50 dark:bg-slate-800/40 font-black text-slate-900 dark:text-white">
                    <div className="h-11 flex flex-col items-center justify-center">
                      <span className="text-sm text-rose-600 dark:text-rose-400 font-black">
                        {m.totalMinutes}분
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        ({m.totalHours}h)
                      </span>
                    </div>
                  </td>

                  {/* Operation Ratio */}
                  <td className="py-2.5 px-2 font-black text-emerald-600 dark:text-emerald-400">
                    <div className="h-11 flex items-center justify-center text-sm font-black">
                      {m.opRatio}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Matrix Footer (Daily Totals) */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs">
                <td className="py-3 px-3 text-left font-black text-xs">
                  일별 합계
                </td>
                {dailyTotals.map((dt) => (
                  <td key={dt.date} className="py-2.5 px-1.5">
                    {dt.sum > 0 ? (
                      <div className="h-9 flex flex-col items-center justify-center">
                        <span className="text-rose-600 dark:text-rose-400 font-black text-xs">{dt.sum}분</span>
                        <span className="text-[10px] text-slate-400 font-semibold">({dt.count}건)</span>
                      </div>
                    ) : (
                      <div className="h-9 flex items-center justify-center text-slate-400 font-semibold">
                        -
                      </div>
                    )}
                  </td>
                ))}
                <td className="py-2.5 px-2 bg-amber-100/70 dark:bg-amber-900/40 text-rose-600 dark:text-rose-300 font-black text-sm">
                  <div className="h-9 flex items-center justify-center">
                    {totalDowntimeMinutes}분
                  </div>
                </td>
                <td className="py-2.5 px-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  <div className="h-9 flex items-center justify-center text-sm">
                    {operationRatio}%
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DETAILED LOG LEDGER (가로형 1줄 상세 발생 일지) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          {/* Quick Line Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedLineFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedLineFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              전체 ({logs.length})
            </button>
            {EXTRUSION_LINES.map((line) => {
              const count = logs.filter((l) => l.machine === line || l.machine === `${line} LINE`).length;
              return (
                <button
                  key={line}
                  onClick={() => setSelectedLineFilter(line)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    selectedLineFilter === line
                      ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {line} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Reason Filter */}
            <select
              value={selectedReasonFilter}
              onChange={(e) => setSelectedReasonFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">전체 사유</option>
              {DOWNTIME_REASONS.map((r) => (
                <option key={r} value={r}>
                  {getShortReason(r)}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Ultra-Clean Horizontal Single-Row Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-black">
                <th className="py-2.5 px-2.5 w-[11%]">일자</th>
                <th className="py-2.5 px-2 w-[12%]">설비</th>
                <th className="py-2.5 px-2 w-[9%] text-center">시간</th>
                <th className="py-2.5 px-2 w-[12%] text-center">구분</th>
                <th className="py-2.5 px-2 w-[30%]">작업 내용</th>
                <th className="py-2.5 px-2 w-[18%]">조치 내용</th>
                <th className="py-2.5 px-2 w-[8%] text-center">담당</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                    등록된 비가동 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isMold = log.reason.includes("형교환");
                  const shortOp = log.operator.replace(/(책임|선임|이사|대표|주임|사원)/g, "").trim();
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-11">
                      {/* 일자 */}
                      <td className="py-2 px-2.5 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.date.slice(5)} {log.day ? `(${log.day})` : ""}
                      </td>
                      {/* 설비 */}
                      <td className="py-2 px-2 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[11px] border border-slate-200 dark:border-slate-700">
                          {log.machine}
                        </span>
                      </td>
                      {/* 시간 */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-black text-xs">
                          {log.durationMinutes}분
                        </span>
                      </td>
                      {/* 구분 */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                          isMold
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {getShortReason(log.reason)}
                        </span>
                      </td>
                      {/* 작업 내용 */}
                      <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200 truncate" title={log.details}>
                        {log.details}
                      </td>
                      {/* 조치 내용 */}
                      <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium truncate" title={log.actionTaken}>
                        {log.actionTaken || "-"}
                      </td>
                      {/* 담당 */}
                      <td className="py-2 px-2 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {shortOp}
                      </td>
                    </tr>
                  );
                })
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    압출 LINE (설비명)
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
