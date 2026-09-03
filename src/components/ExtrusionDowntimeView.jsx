import React, { useState, useMemo, useEffect } from "react";
import {
  Wrench,
  Clock,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  Filter,
  BarChart2,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  Copy,
  ChevronRight,
  ShieldCheck,
  Package
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";
import {
  subscribeExtrusionDowntimeLogs,
  getLocalExtrusionLogs,
  AVAILABLE_WEEKS,
  getWeekDaysForWeek,
  EXTRUSION_LINES
} from "../services/extrusionDowntimeService";

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

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();
  const { selectedMonth } = useMonth();

  const [logs, setLogs] = useState(() => getLocalExtrusionLogs());
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("2026-08");
  const [selectedWeek, setSelectedWeek] = useState("8월 4주차");
  const [selectedActiveLine, setSelectedActiveLine] = useState("all");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copyToast, setCopyToast] = useState(false);

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsub = subscribeExtrusionDowntimeLogs((updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setLogs(updated);
      }
    });
    return () => unsub();
  }, []);

  // Dynamic 6 Week Days for Selected Week
  const currentWeekDays = useMemo(() => {
    return getWeekDaysForWeek(selectedWeek);
  }, [selectedWeek]);

  // Matrix calculation (Lines x 6 Days) for the selected week
  const matrixData = useMemo(() => {
    const weeklyLogs = logs.filter((l) => l.week === selectedWeek);

    return EXTRUSION_LINES.map((lineName) => {
      const lineLogs = weeklyLogs.filter(
        (l) => l.machine === lineName || l.machine === `${lineName} LINE`
      );

      const daysData = {};
      let lineTotalMinutes = 0;

      currentWeekDays.forEach((w) => {
        const dayMatches = lineLogs.filter((l) => l.date === w.date);
        if (dayMatches.length > 0) {
          const sumMinutes = dayMatches.reduce((acc, cur) => acc + Number(cur.durationMinutes || 0), 0);
          const primaryReason = dayMatches[0].reason;
          daysData[w.date] = {
            minutes: sumMinutes,
            reason: primaryReason,
            shortReason: getShortReason(primaryReason),
            details: dayMatches[0].details,
            actionTaken: dayMatches[0].actionTaken,
            count: dayMatches.length
          };
          lineTotalMinutes += sumMinutes;
        } else {
          daysData[w.date] = null;
        }
      });

      // Weekly Op Ratio (assuming 40 operating hours = 2400 mins per line)
      const lineOpRatio = Math.max(0, ((2400 - lineTotalMinutes) / 2400) * 100).toFixed(1);

      // Monthly Cumulative for this line
      const allMonthLogs = logs.filter((l) => {
        const matchL = l.machine === lineName || l.machine === `${lineName} LINE`;
        const matchM = selectedMonthFilter === "all" || (l.date && l.date.startsWith(selectedMonthFilter));
        return matchL && matchM;
      });
      const monthCumulative = allMonthLogs.reduce((acc, cur) => acc + Number(cur.durationMinutes || 0), 0);

      return {
        lineName,
        daysData,
        totalMinutes: lineTotalMinutes,
        opRatio: lineOpRatio,
        monthCumulative: monthCumulative || lineTotalMinutes * 4,
        downtimeCount: lineLogs.length
      };
    });
  }, [logs, selectedWeek, currentWeekDays, selectedMonthFilter]);

  // Overall Weekly Totals
  const totalDowntimeMinutes = useMemo(() => {
    return matrixData.reduce((acc, cur) => acc + cur.totalMinutes, 0);
  }, [matrixData]);

  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);

  const operationRatio = useMemo(() => {
    const totalWorkingMinutes = EXTRUSION_LINES.length * 40 * 60;
    if (totalWorkingMinutes === 0) return "100.0";
    const actualOperating = totalWorkingMinutes - totalDowntimeMinutes;
    return Math.max(0, (actualOperating / totalWorkingMinutes) * 100).toFixed(1);
  }, [totalDowntimeMinutes]);

  // Daily Column Totals
  const dailyTotals = useMemo(() => {
    return currentWeekDays.map((w) => {
      let sum = 0;
      let count = 0;
      matrixData.forEach((m) => {
        if (m.daysData[w.date]) {
          sum += m.daysData[w.date].minutes;
          count += m.daysData[w.date].count;
        }
      });
      return {
        date: w.date,
        day: w.day,
        label: w.label,
        sum,
        count
      };
    });
  }, [matrixData, currentWeekDays]);

  // Line Matching List (Excel File & Real-time Downtime Summary per Line)
  const lineMatchingList = useMemo(() => {
    return EXTRUSION_LINES.map((lineName) => {
      const lineLogs = logs.filter(
        (l) => l.machine === lineName || l.machine === `${lineName} LINE`
      );
      const weekLogs = lineLogs.filter((l) => l.week === selectedWeek);
      const weekMin = weekLogs.reduce((acc, cur) => acc + Number(cur.durationMinutes || 0), 0);
      const totalMonthMin = lineLogs
        .filter((l) => selectedMonthFilter === "all" || (l.date && l.date.startsWith(selectedMonthFilter)))
        .reduce((acc, cur) => acc + Number(cur.durationMinutes || 0), 0);

      const latestLog = weekLogs[0] || lineLogs[0] || null;
      const fileName = latestLog?.sourceFile || `${lineName.replace(/\s+/g, "")}_비가동.xlsx`;

      return {
        lineName,
        fileName,
        weekMin,
        totalMonthMin: totalMonthMin || weekMin * 4,
        latestReason: latestLog?.reason || "형교환",
        latestDetails: latestLog?.details || `${lineName} 정상 가동 및 비가동 관리`,
        latestAction: latestLog?.actionTaken || "현장 조치 및 승온 정상화 완료",
        operator: latestLog?.operator || "설유철 책임",
        count: lineLogs.length,
        weekCount: weekLogs.length
      };
    });
  }, [logs, selectedWeek, selectedMonthFilter]);

  // Filtered detailed logs based on line tab, reason, search
  const filteredDetailLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchLine =
        selectedActiveLine === "all" ||
        log.machine === selectedActiveLine ||
        log.machine === `${selectedActiveLine} LINE`;

      const matchWeek = selectedWeek === "all" || log.week === selectedWeek;
      const matchReason = selectedReasonFilter === "all" || log.reason === selectedReasonFilter;
      const matchSearch =
        (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.actionTaken || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.operator || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.machine || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.sourceFile || "").toLowerCase().includes(searchTerm.toLowerCase());

      return matchLine && matchWeek && matchReason && matchSearch;
    });
  }, [logs, selectedActiveLine, selectedWeek, selectedReasonFilter, searchTerm]);

  // Copy line match summary text to clipboard
  const handleCopyExtrusionMatchReport = () => {
    const totalMin = lineMatchingList.reduce((acc, cur) => acc + cur.weekMin, 0);
    let text = `[오륙산업 삼랑진공장 - 압출동 라인별 비가동 엑셀 업로드 및 매칭 실적 공유]
`;
    text += `• 담당: 설유철 책임 (삼랑진공장 압출동 관리)
`;
    text += `• 집계 주차: ${selectedWeek} (총 ${lineMatchingList.length}개 라인 / 합계 ${totalMin}분 비가동)

`;

    lineMatchingList.forEach((m, idx) => {
      text += `${idx + 1}. [${m.lineName}] ${m.fileName} (주간 ${m.weekMin}분 비가동)
`;
      text += `   - 주요사유: ${m.latestReason}
`;
      text += `   - 세부내용: ${m.latestDetails}
`;
      text += `   - 조치사항: ${m.latestAction}

`;
    });

    text += `▶ 실시간 대시보드 확인: https://profit-and-loss-7d09b.web.app`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      ["오륙산업 삼랑진공장 - 압출동 주간 비가동 종합 관리 대장"],
      [
        "조회일자",
        new Date().toLocaleDateString(),
        "조회주차",
        selectedWeek,
        "총 비가동시간",
        `${totalDowntimeMinutes}분 (${totalDowntimeHours}시간)`,
        "종합 가동률",
        `${operationRatio}%`
      ],
      [],
      ["[1] 압출 라인별 주간 비가동 매트릭스"],
      ["압출LINE (설비명)", ...currentWeekDays.map((w) => w.label), "주간 합계", "가동률", "월 누적"]
    ];

    matrixData.forEach((m) => {
      rows.push([
        m.lineName,
        ...currentWeekDays.map((w) =>
          m.daysData[w.date] ? `${m.daysData[w.date].minutes}분 (${m.daysData[w.date].shortReason})` : "-"
        ),
        `${m.totalMinutes}분`,
        `${m.opRatio}%`,
        `${m.monthCumulative}분`
      ]);
    });

    rows.push([]);
    rows.push(["[2] 엑셀 동기화 세부 비가동 내역"]);
    rows.push(["NO", "일자", "주차", "공장", "압출 LINE", "매칭 파일", "비가동시간(분)", "비가동 구분", "세부내용", "조치사항", "담당자", "상태"]);

    filteredDetailLogs.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.date,
        l.week,
        l.plant,
        l.machine,
        l.sourceFile || "-",
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
    XLSX.writeFile(wb, `압출동_주간비가동_${selectedWeek}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto px-1.5 sm:px-0">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WEEK CONTROLLER (7월~9월 원터치 탐색) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>압출동 주차별 비가동내역</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  엑셀 동기화 실시간
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                삼랑진공장 설유철 책임이 업로드한 각 라인별 엑셀 파일과 100% 매칭된 분석 현황입니다.
              </p>
            </div>
          </div>

          {/* Month & Week Filters & Export Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {["all", "2026-07", "2026-08", "2026-09"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMonthFilter(m);
                    if (m === "2026-07") setSelectedWeek("7월 4주차");
                    else if (m === "2026-08") setSelectedWeek("8월 4주차");
                    else if (m === "2026-09") setSelectedWeek("9월 1주차");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    selectedMonthFilter === m
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                  }`}
                >
                  {m === "all" ? "전체" : m === "2026-07" ? "7월" : m === "2026-08" ? "8월" : "9월"}
                </button>
              ))}
            </div>

            {/* Week Dropdown */}
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              {AVAILABLE_WEEKS.filter(
                (w) => selectedMonthFilter === "all" || w.month === selectedMonthFilter
              ).map((w) => (
                <option key={w.id} value={w.label}>
                  {w.label} ({w.startDate.slice(5)} ~ {w.endDate.slice(5)})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar for Selected Week */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              선택 주차
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {selectedWeek}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
              주간 총 비가동 시간
            </span>
            <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {totalDowntimeMinutes}분 <span className="text-xs font-normal text-rose-400">({totalDowntimeHours}h)</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
              주간 종합 압출 가동률
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {operationRatio}%
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              동기화 라인 수
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
              총 {EXTRUSION_LINES.length}개 라인
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [요청반영] 각 라인별 엑셀 파일 매칭 & 비가동 공유 카드 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-sm space-y-3.5 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>각 압출 라인별 엑셀 파일 매칭 & 비가동 공유 현황</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedWeek} 기준
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                업로드된 라인별 엑셀 파일과 매칭된 비가동 실적입니다. 버튼을 눌러 메신저로 즉시 공유할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyExtrusionMatchReport}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copyToast ? "✓ 클립보드 복사완료!" : "📋 라인별 매칭 내용 전체 복사 (공유용)"}</span>
          </button>
        </div>

        {/* 4 Lines Matching Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lineMatchingList.map((m) => (
            <div
              key={m.lineName}
              onClick={() => setSelectedActiveLine(m.lineName)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedActiveLine === m.lineName
                  ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md font-black text-xs bg-emerald-600 text-white shadow-xs">
                  {m.lineName}
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-xs font-mono">
                  주간 {m.weekMin}분
                </span>
              </div>

              <div className="text-xs mt-2">
                <span className="text-[10px] text-slate-400 font-bold block">매칭 엑셀 파일</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={m.fileName}>
                  📁 {m.fileName}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px] space-y-1 mt-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  사유: <span className="text-emerald-700 dark:text-emerald-300 font-black">{m.latestReason}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[10.5px] truncate" title={m.latestDetails}>
                  {m.latestDetails}
                </p>
                <p className="text-slate-400 text-[10px] truncate" title={m.latestAction}>
                  조치: {m.latestAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 4-LINES WEEKLY MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{selectedWeek} 압출 라인별 주간 비가동 매트릭스</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            기준: 4개 라인 총 160시간 가동
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse table-fixed min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black h-8 text-[11px]">
                <th className="py-1 px-2 text-left w-[18%]">압출 LINE</th>
                {currentWeekDays.map((w) => (
                  <th key={w.date} className="py-1 px-1 w-[11%]">
                    {w.label}
                  </th>
                ))}
                <th className="py-1 px-1.5 w-[11%] bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white">
                  주간 합계
                </th>
                <th className="py-1 px-1.5 w-[10%]">가동률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {matrixData.map((m) => (
                <tr key={m.lineName} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors h-9">
                  <td className="py-1 px-2 text-left font-black text-slate-900 dark:text-white">
                    {m.lineName}
                  </td>

                  {currentWeekDays.map((w) => {
                    const cell = m.daysData[w.date];
                    if (!cell) {
                      return (
                        <td key={w.date} className="py-1 px-1">
                          <div className="h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-xs">
                            -
                          </div>
                        </td>
                      );
                    }
                    const isMold = cell.reason.includes("형교환");
                    return (
                      <td key={w.date} className="py-1 px-1">
                        <div
                          className={`h-8 flex items-center justify-center gap-1 rounded-lg border text-center font-black transition-all px-1 ${
                            isMold
                              ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200"
                              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200"
                          }`}
                          title={`${cell.reason} (${cell.details})`}
                        >
                          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                            {cell.minutes}분
                          </span>
                          <span className="text-[9.5px] font-semibold text-slate-600 dark:text-slate-300">
                            {cell.shortReason}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-1 px-1.5 bg-slate-50/80 dark:bg-slate-800/40 font-black text-slate-900 dark:text-white">
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-black">
                      {m.totalMinutes}분
                    </span>
                  </td>

                  <td className="py-1 px-1.5 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {m.opRatio}%
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-[11px] h-8">
                <td className="py-1 px-2 text-left font-black">일별 합계</td>
                {dailyTotals.map((dt) => (
                  <td key={dt.date} className="py-1 px-1">
                    {dt.sum > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-black text-[11px]">{dt.sum}분</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                ))}
                <td className="py-1 px-1.5 bg-blue-100/70 dark:bg-blue-900/40 text-rose-600 dark:text-rose-300 font-black text-xs">
                  {totalDowntimeMinutes}분
                </td>
                <td className="py-1 px-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  {operationRatio}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [엑셀 동기화 자료] 라인별 세부 비가동 내역 일지 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>엑셀 동기화 라인별 세부 비가동 내역</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              라인별 탭을 클릭하여 해당 라인의 세부 비가동 이력을 즉시 필터링하여 확인하실 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <select
              value={selectedReasonFilter}
              onChange={(e) => setSelectedReasonFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 비가동 사유</option>
              {DOWNTIME_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="작업내용, 조치사항 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Line Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedActiveLine("all")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedActiveLine === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            전체 라인 ({filteredDetailLogs.length}건)
          </button>

          {EXTRUSION_LINES.map((line) => {
            const count = logs.filter(
              (l) =>
                (l.machine === line || l.machine === `${line} LINE`) &&
                (selectedWeek === "all" || l.week === selectedWeek)
            ).length;
            return (
              <button
                key={line}
                type="button"
                onClick={() => setSelectedActiveLine(line)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 ${
                  selectedActiveLine === line
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {line} ({count}건)
              </button>
            );
          })}
        </div>

        {/* Detailed Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                <th className="py-2 px-2 w-[10%]">일자</th>
                <th className="py-2 px-2 w-[10%]">설비라인</th>
                <th className="py-2 px-2 w-[14%]">매칭 엑셀 파일</th>
                <th className="py-2 px-2 w-[8%] text-center">시간</th>
                <th className="py-2 px-2 w-[12%] text-center">비가동 구분</th>
                <th className="py-2 px-3 w-[26%]">상세 작업 / 현상</th>
                <th className="py-2 px-2 w-[14%]">현장 조치 내용</th>
                <th className="py-2 px-1.5 w-[6%] text-center">담당</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {filteredDetailLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    <Package className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <span>조회 조건에 일치하는 비가동 내역이 없습니다.</span>
                  </td>
                </tr>
              ) : (
                filteredDetailLogs.map((log) => {
                  const isMold = log.reason.includes("형교환");
                  const shortOp = (log.operator || "설유철").replace(/(책임|선임|이사|대표|주임|사원)/g, "").trim();

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-9">
                      <td className="py-1.5 px-2 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.date ? log.date.slice(5) : ""} {log.day ? `(${log.day})` : ""}
                      </td>
                      <td className="py-1.5 px-2 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[10.5px] border border-emerald-200 dark:border-emerald-800">
                          {log.machine}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 truncate text-[10.5px]" title={log.sourceFile}>
                        📁 {log.sourceFile || `${log.machine}_비가동.xlsx`}
                      </td>
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-black text-[11px] font-mono">
                          {log.durationMinutes}분
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isMold
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {getShortReason(log.reason)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200 truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 truncate text-[10.5px]" title={log.actionTaken}>
                        {log.actionTaken || "-"}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
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
    </div>
  );
};

export default ExtrusionDowntimeView;
