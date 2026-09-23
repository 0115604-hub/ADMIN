import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Wrench,
  Clock,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Scale,
  Activity,
  Check,
  X,
  FileSpreadsheet,
  BarChart3
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import masterExtrusionData from "../data/extrusion4LinesMasterData.json";
import { EXTRUSION_LINES } from "../utils/extrusionImageParser";

// Standard Manufacturing Calendar Mapping (월요일 ~ 일요일 기준)
export const WEEK_CALENDAR_MAP = {
  // 7월
  "7월1주": { period: "6/29 ~ 7/05", daysList: ["29일 (월)", "30일 (화)", "01일 (수)", "02일 (목)", "03일 (금)", "04일 (토)", "05일 (일)"] },
  "7월2주": { period: "7/06 ~ 7/12", daysList: ["06일 (월)", "07일 (화)", "08일 (수)", "09일 (목)", "10일 (금)", "11일 (토)", "12일 (일)"] },
  "7월3주": { period: "7/13 ~ 7/19", daysList: ["13일 (월)", "14일 (화)", "15일 (수)", "16일 (목)", "17일 (금)", "18일 (토)", "19일 (일)"] },
  "7월4주": { period: "7/20 ~ 7/26", daysList: ["20일 (월)", "21일 (화)", "22일 (수)", "23일 (목)", "24일 (금)", "25일 (토)", "26일 (일)"] },
  "7월5주": { period: "7/27 ~ 8/02", daysList: ["27일 (월)", "28일 (화)", "29일 (수)", "30일 (목)", "31일 (금)", "01일 (토)", "02일 (일)"] },

  // 8월
  "8월1주": { period: "8/03 ~ 8/09", daysList: ["03일 (월)", "04일 (화)", "05일 (수)", "06일 (목)", "07일 (금)", "08일 (토)", "09일 (일)"] },
  "8월2주": { period: "8/10 ~ 8/16", daysList: ["10일 (월)", "11일 (화)", "12일 (수)", "13일 (목)", "14일 (금)", "15일 (토)", "16일 (일)"] },
  "8월3주": { period: "8/17 ~ 8/23", daysList: ["17일 (월)", "18일 (화)", "19일 (수)", "20일 (목)", "21일 (금)", "22일 (토)", "23일 (일)"] },
  "8월4주": { period: "8/24 ~ 8/30", daysList: ["24일 (월)", "25일 (화)", "26일 (수)", "27일 (목)", "28일 (금)", "29일 (토)", "30일 (일)"] },

  // 9월
  "9월1주": { period: "8/31 ~ 9/06", daysList: ["31일 (월)", "01일 (화)", "02일 (수)", "03일 (목)", "04일 (금)", "05일 (토)", "06일 (일)"] },
  "9월2주": { period: "9/07 ~ 9/13", daysList: ["07일 (월)", "08일 (화)", "09일 (수)", "10일 (목)", "11일 (금)", "12일 (토)", "13일 (일)"] },
  "9월3주": { period: "9/14 ~ 9/18", daysList: ["14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"] },
  "9월4주": { period: "9/21 ~ 9/27", daysList: ["21일 (월)", "22일 (화)", "23일 (수)", "24일 (목)", "25일 (금)", "26일 (토)", "27일 (일)"] },
  "9월5주": { period: "9/28 ~ 10/04", daysList: ["28일 (월)", "29일 (화)", "30일 (수)", "01일 (목)", "02일 (금)", "03일 (토)", "04일 (일)"] },

  // 10월
  "10월1주": { period: "10/05 ~ 10/11", daysList: ["05일 (월)", "06일 (화)", "07일 (수)", "08일 (목)", "09일 (금)", "10일 (토)", "11일 (일)"] },
  "10월2주": { period: "10/12 ~ 10/18", daysList: ["12일 (월)", "13일 (화)", "14일 (수)", "15일 (목)", "16일 (금)", "17일 (토)", "18일 (일)"] },
  "10월3주": { period: "10/19 ~ 10/25", daysList: ["19일 (월)", "20일 (화)", "21일 (수)", "22일 (목)", "23일 (금)", "24일 (토)", "25일 (일)"] },
  "10월4주": { period: "10/26 ~ 11/01", daysList: ["26일 (월)", "27일 (화)", "28일 (수)", "29일 (목)", "30일 (금)", "31일 (토)", "01일 (일)"] }
};

export const getRealCurrentWeekKey = (date = new Date()) => {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const curMonth = d.getMonth() + 1;
  const curDay = d.getDate();

  for (const [weekKey, info] of Object.entries(WEEK_CALENDAR_MAP)) {
    if (!info.period) continue;
    const [startPart, endPart] = info.period.split("~").map((s) => s.trim());
    if (!startPart || !endPart) continue;

    const [startM, startD] = startPart.split("/").map(Number);
    const [endM, endD] = endPart.split("/").map(Number);

    if (startM === endM) {
      if (curMonth === startM && curDay >= startD && curDay <= endD) {
        return weekKey;
      }
    } else {
      if ((curMonth === startM && curDay >= startD) || (curMonth === endM && curDay <= endD)) {
        return weekKey;
      }
    }
  }

  let weekNum = 1;
  if (curDay <= 6) weekNum = 1;
  else if (curDay <= 13) weekNum = 2;
  else if (curDay <= 20) weekNum = 3;
  else if (curDay <= 27) weekNum = 4;
  else weekNum = 5;

  return `${curMonth}월${weekNum}주`;
};

// Pure Storage Key for clean real data
const STORAGE_KEY = "factory_extrusion_downtime_4lines_v24_real_purged";

const CATEGORIES = ["형교환", "승온/준비", "불량/고장", "라인정지", "정상생산"];
const SHIFTS = ["주간", "야간"];

const DEFAULT_ACTIONS = {
  형교환: "금형 체결 및 승온 정상화, 양품 확인",
  "승온/준비": "사전 승온 완료 및 필터 교체 완료",
  "불량/고장": "원인 조치 및 라인 재가동 완료",
  라인정지: "재고 조정에 따른 계획 정지",
  정상생산: "정상 가동 완료"
};

const CATEGORY_COLORS = {
  형교환: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
  "승온/준비": "bg-sky-100 text-sky-900 border-sky-300 font-bold",
  "불량/고장": "bg-rose-100 text-rose-900 border-rose-300 font-bold",
  라인정지: "bg-slate-200 text-slate-800 border-slate-300 font-bold",
  정상생산: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
};

const LINE_THEMES = {
  pcm1: {
    primary: "bg-teal-700 hover:bg-teal-800",
    text: "text-teal-700",
    border: "border-teal-600",
    light: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    accent: "#0f766e"
  },
  pcm3: {
    primary: "bg-blue-700 hover:bg-blue-800",
    text: "text-blue-700",
    border: "border-blue-600",
    light: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    accent: "#1d4ed8"
  },
  pvc: {
    primary: "bg-amber-600 hover:bg-amber-700",
    text: "text-amber-600",
    border: "border-amber-600",
    light: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    accent: "#d97706"
  },
  tpe: {
    primary: "bg-purple-700 hover:bg-purple-800",
    text: "text-purple-700",
    border: "border-purple-600",
    light: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    accent: "#7c3aed"
  }
};

export const LINE_DISPLAY_NAMES = {
  pcm1: "PCM #1 LINE",
  pcm3: "PCM #3 LINE",
  pvc: "PVC LINE",
  tpe: "TPE LINE"
};

// Exact KPI Metrics for 9월 3주 based on actual Excel files
const LINE_EXCEL_KPIS = {
  pcm1: {
    period: "9/14 ~ 9/19",
    days: "5.5일",
    totalRunMinutes: 7860,
    totalDowntime: 1383,
    planStop: 650,
    netDowntime: 733,
    opRate: "82.4%",
    netOpRate: "90.7%",
    lossRate: "5.9%",
    totalScrapKg: 611
  },
  pcm3: {
    period: "9/14 ~ 9/19",
    days: "5.5일",
    totalRunMinutes: 7860,
    totalDowntime: 832,
    planStop: 150,
    netDowntime: 682,
    opRate: "89.4%",
    netOpRate: "91.3%",
    lossRate: "4.2%",
    totalScrapKg: 622
  },
  pvc: {
    period: "9/14 ~ 9/18",
    days: "5.0일",
    totalRunMinutes: 7200,
    totalDowntime: 5643,
    planStop: 5300,
    netDowntime: 343,
    opRate: "21.6%",
    netOpRate: "95.2%",
    lossRate: "5.7%",
    totalScrapKg: 401
  },
  tpe: {
    period: "9/14 ~ 9/18",
    days: "5.0일",
    totalRunMinutes: 7200,
    totalDowntime: 953,
    planStop: 435,
    netDowntime: 518,
    opRate: "86.8%",
    netOpRate: "92.8%",
    lossRate: "3.3%",
    totalScrapKg: 356
  }
};

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();
  const realCurrentWeek = "9월3주";

  const [dataStore, setDataStore] = useState(() => {
    let initialStore = masterExtrusionData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        initialStore = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load store:", e);
    }
    return initialStore;
  });

  const [selectedLineId, setSelectedLineId] = useState("pcm1");
  const [selectedWeek, setSelectedWeek] = useState("9월3주");
  const [monthFilter, setMonthFilter] = useState("9월");
  const [toastMessage, setToastMessage] = useState("");
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  const activeWeekTabRef = useRef(null);
  const weekScrollContainerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataStore));
    } catch (e) {
      console.error("Failed to persist store:", e);
    }
  }, [dataStore]);

  const currentLine = dataStore[selectedLineId] || dataStore["pcm1"];
  const currentLineName = LINE_DISPLAY_NAMES[selectedLineId] || currentLine?.name || "PCM #1 LINE";
  const weeklySheets = Object.keys(currentLine?.weeklyData || {});
  const theme = LINE_THEMES[selectedLineId] || LINE_THEMES.pcm1;
  const lineKpi = LINE_EXCEL_KPIS[selectedLineId] || LINE_EXCEL_KPIS.pcm1;

  // Auto-scroll the active week badge into view
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeWeekTabRef.current) {
        activeWeekTabRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedWeek, selectedLineId, monthFilter]);

  const rawWeekData = currentLine?.weeklyData?.[selectedWeek] || {
    sheetName: selectedWeek,
    period: WEEK_CALENDAR_MAP[selectedWeek]?.period || "",
    daysList: WEEK_CALENDAR_MAP[selectedWeek]?.daysList || [],
    rows: []
  };

  const currentWeekData = useMemo(() => {
    const stdInfo = WEEK_CALENDAR_MAP[selectedWeek] || {};
    return {
      ...rawWeekData,
      period: rawWeekData.period || stdInfo.period || "",
      daysList: rawWeekData.daysList && rawWeekData.daysList.length > 0 ? rawWeekData.daysList : stdInfo.daysList || []
    };
  }, [rawWeekData, selectedWeek]);

  // Real-time SUM Totals
  const weeklyTotals = useMemo(() => {
    const totalMin = (currentWeekData.rows || []).reduce((acc, r) => acc + Number(r.minutes || 0), 0);
    const totalKg = (currentWeekData.rows || []).reduce((acc, r) => acc + Number(r.weight || 0), 0);
    return {
      totalMin,
      totalHours: (totalMin / 60).toFixed(1),
      totalKg: totalKg.toFixed(1)
    };
  }, [currentWeekData]);

  // Days list for dropdown
  const daysOptions = useMemo(() => {
    if (currentWeekData.daysList && currentWeekData.daysList.length > 0) {
      return currentWeekData.daysList;
    }
    return WEEK_CALENDAR_MAP[selectedWeek]?.daysList || [
      "14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"
    ];
  }, [currentWeekData, selectedWeek]);

  const [inputForm, setInputForm] = useState({
    day: "",
    shift: "주간",
    category: "형교환",
    task: "",
    minutes: "",
    weight: "",
    note: "-",
    action: DEFAULT_ACTIONS["형교환"]
  });

  useEffect(() => {
    if (daysOptions.length > 0) {
      setInputForm((prev) => ({
        ...prev,
        day: daysOptions[0]
      }));
    }
  }, [daysOptions, selectedWeek, selectedLineId]);

  const handleCategoryChange = (newCat) => {
    setInputForm((prev) => ({
      ...prev,
      category: newCat,
      action: DEFAULT_ACTIONS[newCat] || prev.action
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!inputForm.task.trim() && !inputForm.minutes && !inputForm.weight) {
      alert("등록할 [품명 및 작업내용] 또는 [비가동 시간/중량]을 입력해주세요.");
      return;
    }

    const newRecord = {
      id: `${selectedWeek}_${Date.now()}`,
      day: inputForm.day,
      parentDay: inputForm.day,
      isNewDay: false,
      shift: inputForm.shift,
      category: inputForm.category,
      task: inputForm.task.trim() || "-",
      minutes: Number(inputForm.minutes) || 0,
      weight: Number(inputForm.weight) || 0,
      note: inputForm.note.trim() || "-",
      action: inputForm.action.trim() || "정상 가동 완료"
    };

    setDataStore((prev) => {
      const lineObj = { ...prev[selectedLineId] };
      const weekObj = { ...(lineObj.weeklyData[selectedWeek] || currentWeekData) };
      const existingRows = [...(weekObj.rows || [])];

      const targetDayIdx = daysOptions.indexOf(inputForm.day);
      let insertIdx = existingRows.length;

      for (let i = 0; i < existingRows.length; i++) {
        const rDayIdx = daysOptions.indexOf(existingRows[i].parentDay);
        if (rDayIdx > targetDayIdx) {
          insertIdx = i;
          break;
        } else if (rDayIdx === targetDayIdx) {
          if (inputForm.shift === "주간" && existingRows[i].shift === "야간") {
            insertIdx = i;
            break;
          }
        }
      }
      existingRows.splice(insertIdx, 0, newRecord);

      let lastD = "";
      const updatedRows = existingRows.map((r) => {
        const isFirst = r.parentDay !== lastD;
        if (isFirst) lastD = r.parentDay;
        return {
          ...r,
          day: isFirst ? r.parentDay : "",
          isNewDay: isFirst
        };
      });

      weekObj.rows = updatedRows;
      lineObj.weeklyData[selectedWeek] = weekObj;

      return {
        ...prev,
        [selectedLineId]: lineObj
      };
    });

    setInputForm((prev) => ({
      ...prev,
      task: "",
      minutes: "",
      weight: "",
      note: "-",
      action: DEFAULT_ACTIONS[prev.category] || "정상 가동 완료"
    }));

    showToast(`✅ [${inputForm.day}] 실적이 성공적으로 등록되었습니다!`);
  };

  const handleDeleteRow = (rowId) => {
    if (!window.confirm("해당 실적 행을 삭제하시겠습니까?")) return;

    setDataStore((prev) => {
      const lineObj = { ...prev[selectedLineId] };
      const weekObj = { ...(lineObj.weeklyData[selectedWeek] || currentWeekData) };
      const updatedRows = (weekObj.rows || []).filter((r) => r.id !== rowId);

      let lastD = "";
      const cleaned = updatedRows.map((r) => {
        const isFirst = r.parentDay !== lastD;
        if (isFirst) lastD = r.parentDay;
        return {
          ...r,
          day: isFirst ? r.parentDay : "",
          isNewDay: isFirst
        };
      });

      weekObj.rows = cleaned;
      lineObj.weeklyData[selectedWeek] = weekObj;

      return {
        ...prev,
        [selectedLineId]: lineObj
      };
    });

    showToast("🗑️ 행이 삭제되었습니다.");
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "모든 데이터를 엑셀 원본 최신 데이터로 리셋하시겠습니까?\n(수동 수정한 내역이 초기화됩니다.)"
      )
    ) {
      setDataStore(masterExtrusionData);
      localStorage.removeItem(STORAGE_KEY);
      showToast("🔄 데이터가 엑셀 원본 상태로 복원되었습니다.");
    }
  };

  const handleExportExcel = () => {
    const rows = [
      [`오륙산업 삼랑진공장 - ${currentLineName} 주간 비가동 및 작업 일지`],
      [`주차: ${selectedWeek} (${currentWeekData.period})   |   담당: 설유철 책임`],
      [],
      ["일자 / 요일", "근무조", "구분", "품명 및 작업내용", "비가동(분)", "중량(Kg)", "비고 및 조치사항"]
    ];

    (currentWeekData.rows || []).forEach((r) => {
      const remark = r.note && r.note !== "-" ? r.note : r.action && r.action !== "정상 가동 완료" ? r.action : "-";
      rows.push([
        r.day || r.parentDay,
        r.shift,
        r.category,
        r.task,
        r.minutes > 0 ? r.minutes : "",
        r.weight > 0 ? r.weight : "",
        remark
      ]);
    });

    rows.push([]);
    rows.push([
      "■ 주간 총 비가동 합계",
      "",
      "",
      "",
      `${weeklyTotals.totalMin}분 (${weeklyTotals.totalHours}시간)`,
      `${weeklyTotals.totalKg}Kg`,
      `총 ${currentWeekData.rows?.length || 0}건 등록 완료`
    ]);

    rows.push([
      `■ [${selectedWeek}] 관리 지표`,
      "",
      `가동률: ${lineKpi.opRate}`,
      `순수가동률(계획정지제외): ${lineKpi.netOpRate}`,
      `총LOSS률: ${lineKpi.lossRate}`,
      `총중량: ${lineKpi.totalScrapKg}Kg`,
      `계획정지: ${lineKpi.planStop}분`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedWeek);
    XLSX.writeFile(wb, `${currentLine.code}_비가동현황_${selectedWeek}.xlsx`);
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn max-w-[1600px] mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Top 4 Lines Selector Tabs (위 패널: PCM #1 LINE, PCM #3 LINE, PVC LINE, TPE LINE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXTRUSION_LINES.map((lMeta) => {
          const lineKey = lMeta.id;
          const isSelected = selectedLineId === lineKey;
          const lTheme = LINE_THEMES[lineKey] || LINE_THEMES.pcm1;
          const lineLabel = LINE_DISPLAY_NAMES[lineKey] || lMeta.name;

          return (
            <button
              key={lineKey}
              type="button"
              onClick={() => setSelectedLineId(lineKey)}
              className={`py-2.5 px-3 sm:px-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                isSelected
                  ? `${lTheme.light} ${lTheme.border} border-2 shadow-xs ring-2 ring-teal-500/20`
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected ? "bg-teal-600 ring-2 ring-teal-300" : "bg-slate-300"
                  }`}
                ></span>
                <span className={`font-black text-xs sm:text-sm tracking-tight truncate ${isSelected ? lTheme.text : "text-slate-800"}`}>
                  {lineLabel}
                </span>
              </div>
              {isSelected ? (
                <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-teal-600 text-white shrink-0">
                  선택
                </span>
              ) : (
                <span className="text-[9.5px] font-bold text-slate-400 uppercase shrink-0">
                  {lMeta.code}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Week Tabs Navigation with Quick Month Filter */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-black text-slate-700">주차 선택:</span>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {["전체", "7월", "8월", "9월", "10월"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonthFilter(m)}
                  className={`px-2 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                    monthFilter === m
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setMonthFilter("9월");
                setSelectedWeek("9월3주");
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>⭐ 9월3주 바로보기</span>
            </button>

            <span>선택:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-black border border-teal-200">
              {selectedWeek} ({currentWeekData.period || lineKpi.period})
            </span>
          </div>
        </div>

        <div
          ref={weekScrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth"
        >
          {weeklySheets
            .filter((w) => (monthFilter === "전체" ? true : w.startsWith(monthFilter)))
            .map((w) => {
              const isSelected = selectedWeek === w;
              const isThisWeek = w === "9월3주";
              const wPeriod = WEEK_CALENDAR_MAP[w]?.period || currentLine?.weeklyData?.[w]?.period || "";

              return (
                <button
                  key={w}
                  ref={isSelected ? activeWeekTabRef : null}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex flex-col items-center gap-0.5 cursor-pointer relative shrink-0 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30 scale-102"
                      : isThisWeek
                      ? "bg-amber-50 text-slate-800 border-2 border-amber-400 hover:bg-amber-100/80 shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{w}</span>
                    {isThisWeek && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-black ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                            : "bg-amber-500 text-white font-black shadow-xs"
                        }`}
                      >
                        ⭐ 기준주
                      </span>
                    )}
                  </div>
                  {wPeriod && (
                    <span
                      className={`text-[10px] font-normal ${
                        isSelected ? "text-slate-300" : isThisWeek ? "text-amber-800 font-bold" : "text-slate-400"
                      }`}
                    >
                      {wPeriod}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* 3. KPI Operational Metrics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="text-[10.5px] font-black text-slate-500">총 비가동시간</div>
          <div className="text-base font-black text-rose-600 mt-0.5">
            {weeklyTotals.totalMin.toLocaleString()}분
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            ({weeklyTotals.totalHours}시간)
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="text-[10.5px] font-black text-slate-500">총 스크랩 중량</div>
          <div className="text-base font-black text-blue-700 mt-0.5">
            {weeklyTotals.totalKg} kg
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            총 {currentWeekData.rows?.length || 0}건 실적
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="text-[10.5px] font-black text-slate-500">계획정지 시간</div>
          <div className="text-base font-black text-amber-600 mt-0.5">
            {lineKpi.planStop}분
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            순수 비가동: {lineKpi.netDowntime}분
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="text-[10.5px] font-black text-slate-500">가동률 (총비가동 기준)</div>
          <div className="text-base font-black text-emerald-600 mt-0.5">
            {lineKpi.opRate}
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            부하시간 {lineKpi.totalRunMinutes.toLocaleString()}분 기준
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs bg-yellow-50/30">
          <div className="text-[10.5px] font-black text-slate-700">순수 가동률 (계획정지 제외)</div>
          <div className="text-base font-black text-teal-700 mt-0.5">
            {lineKpi.netOpRate}
          </div>
          <div className="text-[10px] font-bold text-teal-600">
            기준 가동률
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="text-[10.5px] font-black text-slate-500">총 LOSS률</div>
          <div className="text-base font-black text-purple-700 mt-0.5">
            {lineKpi.lossRate}
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            {lineKpi.totalScrapKg} kg 기준
          </div>
        </div>
      </div>

      {/* 4. Main Weekly Production Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-slate-700" />
            <span className="font-black text-sm text-slate-900">
              {currentLineName} - [{selectedWeek}] 주간 비가동 상세 실적표
            </span>
            <span className="text-xs text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {currentWeekData.rows?.length || 0}건 등록
            </span>
            <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {currentWeekData.period || lineKpi.period} ({lineKpi.days})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualAddOpen((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
            >
              {isManualAddOpen ? "▲ 항목직접등록 닫기" : "➕ 항목직접등록"}
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              엑셀
            </button>
            <button
              onClick={handleResetData}
              title="엑셀 원본 데이터로 복원"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Manual Registration Form */}
        {isManualAddOpen && (
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <h3 className="text-xs font-black text-slate-800">
                [항목직접등록] {currentLineName} • [{selectedWeek}] 실적 1건 추가
              </h3>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">일자/요일</label>
                  <select
                    value={inputForm.day}
                    onChange={(e) => setInputForm({ ...inputForm, day: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                  >
                    {daysOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">근무조</label>
                  <select
                    value={inputForm.shift}
                    onChange={(e) => setInputForm({ ...inputForm, shift: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">구분</label>
                  <select
                    value={inputForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">품명 및 상세 작업내용</label>
                  <input
                    type="text"
                    placeholder="예: JA G/RUN A 형교환"
                    value={inputForm.task}
                    onChange={(e) => setInputForm({ ...inputForm, task: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">비가동(분)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inputForm.minutes}
                    onChange={(e) => setInputForm({ ...inputForm, minutes: e.target.value })}
                    className="w-full text-xs font-black text-right px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">중량(Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={inputForm.weight}
                    onChange={(e) => setInputForm({ ...inputForm, weight: e.target.value })}
                    className="w-full text-xs font-black text-right px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none text-blue-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>실적 등록</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-black border-b border-slate-800">
                <th className="py-3 px-3.5 text-center w-[12%]">일자 / 요일</th>
                <th className="py-3 px-2 text-center w-[10%]">근무조</th>
                <th className="py-3 px-2 text-center w-[10%]">구분</th>
                <th className="py-3 px-3.5 text-left w-[36%]">품명 및 작업내용</th>
                <th className="py-3 px-3.5 text-right w-[10%]">비가동(분)</th>
                <th className="py-3 px-3.5 text-right w-[10%]">중량(Kg)</th>
                <th className="py-3 px-3.5 text-left w-[18%]">비고 및 조치사항</th>
                <th className="py-3 px-2 text-center w-[4%]">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentWeekData.rows && currentWeekData.rows.length > 0 ? (
                currentWeekData.rows.map((r, idx) => {
                  const isFirstOfDay = r.isNewDay;
                  const catColor = CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-700";
                  const remarkText = r.note && r.note !== "-" ? r.note : r.action && r.action !== "정상 가동 완료" ? r.action : "-";

                  return (
                    <tr
                      key={r.id || idx}
                      className={`hover:bg-teal-50/40 transition ${
                        isFirstOfDay ? "border-t-2 border-slate-300 bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center font-black text-slate-900 whitespace-nowrap bg-slate-50/50">
                        {r.day ? (
                          <span className="px-2 py-1 rounded-md bg-slate-200/80 text-slate-900 font-black">
                            {r.day}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md font-black text-[11px] ${
                            r.shift === "주간"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {r.shift}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] border ${catColor}`}>
                          {r.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-900 font-black text-[12.5px]">{r.task}</td>

                      <td className="py-2.5 px-3.5 text-right font-black text-rose-600 text-sm">
                        {r.minutes > 0 ? `${r.minutes.toLocaleString()}분` : "-"}
                      </td>

                      <td className="py-2.5 px-3.5 text-right font-black text-blue-700 text-sm">
                        {r.weight > 0 ? `${r.weight.toLocaleString()}kg` : "-"}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 text-xs font-medium">
                        {remarkText}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(r.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-bold">
                    등록된 비가동 및 작업 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-center font-black text-sm">
                  ■ 주간 총 비가동 합계 (실시간 집계)
                </td>
                <td className="py-3 px-3.5 text-right text-rose-600 text-base font-black">
                  {weeklyTotals.totalMin.toLocaleString()}분 ({weeklyTotals.totalHours}h)
                </td>
                <td className="py-3 px-3.5 text-right text-blue-700 text-base font-black">
                  {weeklyTotals.totalKg}kg
                </td>
                <td colSpan={2} className="py-3 px-3 text-slate-500 italic text-xs">
                  (총 {currentWeekData.rows?.length || 0}건 실적)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionDowntimeView;
