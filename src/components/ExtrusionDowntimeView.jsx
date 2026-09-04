import React, { useState, useMemo, useEffect } from "react";
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
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import masterExtrusionData from "../data/extrusion4LinesMasterData.json";

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

  // 9월 (사용자 요청: 9월 1주차는 8월 31일부터 9월 6일까지)
  "9월1주": { period: "8/31 ~ 9/06", daysList: ["31일 (월)", "01일 (화)", "02일 (수)", "03일 (목)", "04일 (금)", "05일 (토)", "06일 (일)"] },
  "9월2주": { period: "9/07 ~ 9/13", daysList: ["07일 (월)", "08일 (화)", "09일 (수)", "10일 (목)", "11일 (금)", "12일 (토)", "13일 (일)"] },
  "9월3주": { period: "9/14 ~ 9/20", daysList: ["14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"] },
  "9월4주": { period: "9/21 ~ 9/27", daysList: ["21일 (월)", "22일 (화)", "23일 (수)", "24일 (목)", "25일 (금)", "26일 (토)", "27일 (일)"] },
  "9월5주": { period: "9/28 ~ 10/04", daysList: ["28일 (월)", "29일 (화)", "30일 (수)", "01일 (목)", "02일 (금)", "03일 (토)", "04일 (일)"] },

  // 10월
  "10월1주": { period: "10/05 ~ 10/11", daysList: ["05일 (월)", "06일 (화)", "07일 (수)", "08일 (목)", "09일 (금)", "10일 (토)", "11일 (일)"] },
  "10월2주": { period: "10/12 ~ 10/18", daysList: ["12일 (월)", "13일 (화)", "14일 (수)", "15일 (목)", "16일 (금)", "17일 (토)", "18일 (일)"] },
  "10월3주": { period: "10/19 ~ 10/25", daysList: ["19일 (월)", "20일 (화)", "21일 (수)", "22일 (목)", "23일 (금)", "24일 (토)", "25일 (일)"] },
  "10월4주": { period: "10/26 ~ 11/01", daysList: ["26일 (월)", "27일 (화)", "28일 (수)", "29일 (목)", "30일 (금)", "31일 (토)", "01일 (일)"] },

  // 11월
  "11월1주": { period: "11/02 ~ 11/08", daysList: ["02일 (월)", "03일 (화)", "04일 (수)", "05일 (목)", "06일 (금)", "07일 (토)", "08일 (일)"] },
  "11월2주": { period: "11/09 ~ 11/15", daysList: ["09일 (월)", "10일 (화)", "11일 (수)", "12일 (목)", "13일 (금)", "14일 (토)", "15일 (일)"] },
  "11월3주": { period: "11/16 ~ 11/22", daysList: ["16일 (월)", "17일 (화)", "18일 (수)", "19일 (목)", "20일 (금)", "21일 (토)", "22일 (일)"] },
  "11월4주": { period: "11/23 ~ 11/29", daysList: ["23일 (월)", "24일 (화)", "25일 (수)", "26일 (목)", "27일 (금)", "28일 (토)", "29일 (일)"] },
  "11월5주": { period: "11/30 ~ 12/06", daysList: ["30일 (월)", "01일 (화)", "02일 (수)", "03일 (목)", "04일 (금)", "05일 (토)", "06일 (일)"] },

  // 12월
  "12월1주": { period: "12/07 ~ 12/13", daysList: ["07일 (월)", "08일 (화)", "09일 (수)", "10일 (목)", "11일 (금)", "12일 (토)", "13일 (일)"] },
  "12월2주": { period: "12/14 ~ 12/20", daysList: ["14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"] },
  "12월3주": { period: "12/21 ~ 12/27", daysList: ["21일 (월)", "22일 (화)", "23일 (수)", "24일 (목)", "25일 (금)", "26일 (토)", "27일 (일)"] },
  "12월4주": { period: "12/28 ~ 01/03", daysList: ["28일 (월)", "29일 (화)", "30일 (수)", "31일 (목)", "01일 (금)", "02일 (토)", "03일 (일)"] }
};

// Auto-resolve current week key based on system date
const getAutoCurrentWeekKey = (availableWeeks) => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  let weekNum = 1;
  if (d <= 6) weekNum = 1;
  else if (d <= 13) weekNum = 2;
  else if (d <= 20) weekNum = 3;
  else if (d <= 27) weekNum = 4;
  else weekNum = 5;

  const candidate = `${m}월${weekNum}주`;
  if (availableWeeks && availableWeeks.includes(candidate)) {
    return candidate;
  }

  if (availableWeeks && availableWeeks.length > 0) {
    const monthWeeks = availableWeeks.filter((w) => w.startsWith(`${m}월`));
    if (monthWeeks.length > 0) {
      return monthWeeks[0];
    }
    return availableWeeks[availableWeeks.length - 1];
  }
  return "9월1주";
};

// Storage key with v6 for clean calendar migration
const STORAGE_KEY = "factory_extrusion_downtime_4lines_v6_clean";

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

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();

  const [dataStore, setDataStore] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load store:", e);
    }
    return masterExtrusionData;
  });

  const [selectedLineId, setSelectedLineId] = useState("pcm1");
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getAutoCurrentWeekKey([
      "7월1주", "7월2주", "7월3주", "7월4주", "7월5주",
      "8월1주", "8월2주", "8월3주", "8월4주", "9월1주"
    ])
  );
  const [toastMessage, setToastMessage] = useState("");

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
  const weeklySheets = Object.keys(currentLine?.weeklyData || {});
  const theme = LINE_THEMES[selectedLineId] || LINE_THEMES.pcm1;

  // Auto-select current week on line switch or login
  useEffect(() => {
    if (weeklySheets.length > 0) {
      const currentWeekKey = getAutoCurrentWeekKey(weeklySheets);
      if (weeklySheets.includes(currentWeekKey)) {
        setSelectedWeek(currentWeekKey);
      } else if (!weeklySheets.includes(selectedWeek)) {
        setSelectedWeek(weeklySheets[weeklySheets.length - 1]);
      }
    }
  }, [selectedLineId, currentProfile?.id]);

  const rawWeekData = currentLine?.weeklyData?.[selectedWeek] || {
    sheetName: selectedWeek,
    period: WEEK_CALENDAR_MAP[selectedWeek]?.period || "",
    daysList: WEEK_CALENDAR_MAP[selectedWeek]?.daysList || [],
    rows: []
  };

  // Ensure week data always uses standard calendar period & daysList
  const currentWeekData = useMemo(() => {
    const stdInfo = WEEK_CALENDAR_MAP[selectedWeek] || {};
    return {
      ...rawWeekData,
      period: stdInfo.period || rawWeekData.period || "",
      daysList: stdInfo.daysList || rawWeekData.daysList || []
    };
  }, [rawWeekData, selectedWeek]);

  // Selected Month (e.g. "9월" or "8월")
  const currentMonthStr = useMemo(() => {
    const m = selectedWeek.match(/^(\d+월)/);
    return m ? m[1] : "9월";
  }, [selectedWeek]);

  // Selected Week Real-time SUM Totals
  const weeklyTotals = useMemo(() => {
    const totalMin = (currentWeekData.rows || []).reduce((acc, r) => acc + Number(r.minutes || 0), 0);
    const totalKg = (currentWeekData.rows || []).reduce((acc, r) => acc + Number(r.weight || 0), 0);
    return {
      totalMin,
      totalHours: (totalMin / 60).toFixed(1),
      totalKg: totalKg.toFixed(1)
    };
  }, [currentWeekData]);

  // Days list for dropdown: Always guarantee full Monday ~ Sunday days
  const daysOptions = useMemo(() => {
    if (currentWeekData.daysList && currentWeekData.daysList.length > 0) {
      return currentWeekData.daysList;
    }
    return WEEK_CALENDAR_MAP[selectedWeek]?.daysList || [
      "31일 (월)", "01일 (화)", "02일 (수)", "03일 (목)", "04일 (금)", "05일 (토)", "06일 (일)"
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

  const handleCreateNextWeek = () => {
    const nextWeekName = prompt("새로 생성할 주차 이름을 입력하세요 (예: 9월2주, 9월3주, 10월1주):", "9월2주");
    if (!nextWeekName || !nextWeekName.trim()) return;

    const trimmed = nextWeekName.trim();
    if (weeklySheets.includes(trimmed)) {
      alert("이미 동일한 이름의 주차가 존재합니다.");
      setSelectedWeek(trimmed);
      return;
    }

    const stdInfo = WEEK_CALENDAR_MAP[trimmed] || {
      period: "미지정",
      daysList: ["01일 (월)", "02일 (화)", "03일 (수)", "04일 (목)", "05일 (금)", "06일 (토)", "07일 (일)"]
    };

    setDataStore((prev) => {
      const lineObj = { ...prev[selectedLineId] };
      const updatedWeekly = { ...lineObj.weeklyData };
      updatedWeekly[trimmed] = {
        sheetName: trimmed,
        period: stdInfo.period,
        daysList: stdInfo.daysList,
        rows: [],
        totalMinutes: 0,
        totalWeight: 0
      };
      lineObj.weeklyData = updatedWeekly;

      return {
        ...prev,
        [selectedLineId]: lineObj
      };
    });

    setSelectedWeek(trimmed);
    showToast(`🎉 [${trimmed} (${stdInfo.period})] 신규 주차가 생성되었습니다. 상단 입력창에서 데이터를 등록해 주세요.`);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "모든 데이터를 엑셀 원본 최신 데이터로 리셋하시겠습니까?\n(직접 추가 등록한 내역이 초기화됩니다.)"
      )
    ) {
      setDataStore(masterExtrusionData);
      localStorage.removeItem(STORAGE_KEY);
      showToast("🔄 데이터가 엑셀 원본 상태로 복원되었습니다.");
    }
  };

  const handleExportExcel = () => {
    const rows = [
      [`오륙산업 삼랑진공장 - ${currentLine.name} 주간 비가동 및 생산 일지`],
      [`주차: ${selectedWeek} (${currentWeekData.period})   |   담당: 설유철 책임`],
      [],
      ["일자 / 요일", "근무조", "구분", "품명 및 상세 작업내용", "비가동(분)", "중량(Kg)", "LOSS율 / 비고", "조치사항 및 결과"]
    ];

    (currentWeekData.rows || []).forEach((r) => {
      rows.push([
        r.day || r.parentDay,
        r.shift,
        r.category,
        r.task,
        r.minutes > 0 ? r.minutes : "",
        r.weight > 0 ? r.weight : "",
        r.note,
        r.action
      ]);
    });

    rows.push([
      "■ 주간 총 비가동 및 LOSS 합계",
      "",
      "",
      "",
      weeklyTotals.totalMin,
      weeklyTotals.totalKg,
      `총 ${weeklyTotals.totalHours}시간`,
      "(=SUM 실시간 자동 연동)"
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

      {/* 4 Lines Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Object.keys(dataStore).map((lineKey) => {
          const lObj = dataStore[lineKey];
          const isSelected = selectedLineId === lineKey;
          const lTheme = LINE_THEMES[lineKey] || LINE_THEMES.pcm1;

          return (
            <button
              key={lineKey}
              onClick={() => setSelectedLineId(lineKey)}
              className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${lTheme.light} ${lTheme.border} border-2 shadow-sm ring-2 ring-teal-500/20`
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">{lObj.code}</span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    선택됨
                  </span>
                )}
              </div>
              <div className={`font-black text-base ${isSelected ? lTheme.text : "text-slate-800"}`}>
                {lObj.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Week Tabs Navigation with Exact Dates (월요일 ~ 일요일) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-black text-slate-700">주차 선택 (월요일~일요일 주간 단위):</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>선택된 주간:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-black border border-teal-200">
              {selectedWeek} ({currentWeekData.period})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {weeklySheets.map((w) => {
            const isSelected = selectedWeek === w;
            const isThisWeek = w === getAutoCurrentWeekKey(weeklySheets);
            const wPeriod = WEEK_CALENDAR_MAP[w]?.period || currentLine?.weeklyData?.[w]?.period || "";

            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{w}</span>
                  {isThisWeek && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded font-black ${
                        isSelected ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      당주
                    </span>
                  )}
                </div>
                {wPeriod && (
                  <span className={`text-[10px] font-normal ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    {wPeriod}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={handleCreateNextWeek}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 whitespace-nowrap flex items-center gap-1 cursor-pointer self-stretch"
          >
            <Plus className="w-3.5 h-3.5" /> 새 주차 생성
          </button>
        </div>
      </div>

      {/* 4. Quick Registration Form (간편 등록 입력창 - 요일 선택 8/31(월)~9/6(일) 전체 지원) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3.5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <h2 className="text-sm font-black text-slate-900">
              📌 [간편 등록] {currentLine.name} • [{selectedWeek}] 실적 등록
            </h2>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              기간: {currentWeekData.period}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            작성 후 등록 시 해당 요일 위치에 자동 삽입/정렬됩니다.
          </span>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Date */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">일자/요일 (선택▼)</label>
              <select
                value={inputForm.day}
                onChange={(e) => setInputForm({ ...inputForm, day: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-amber-50/60 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
              >
                {daysOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Shift */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">근무조 (선택▼)</label>
              <select
                value={inputForm.shift}
                onChange={(e) => setInputForm({ ...inputForm, shift: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Category */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">구분 (선택▼)</label>
              <select
                value={inputForm.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Task */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 mb-1">품명 및 상세 작업내용</label>
              <input
                type="text"
                placeholder="예: GL3 PART'G SEAL 형교환"
                value={inputForm.task}
                onChange={(e) => setInputForm({ ...inputForm, task: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              />
            </div>

            {/* 5. Minutes */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">비가동(분)</label>
              <input
                type="number"
                placeholder="0"
                value={inputForm.minutes}
                onChange={(e) => setInputForm({ ...inputForm, minutes: e.target.value })}
                className="w-full text-xs font-black text-right px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-rose-600"
              />
            </div>

            {/* 6. Weight */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">중량(Kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={inputForm.weight}
                onChange={(e) => setInputForm({ ...inputForm, weight: e.target.value })}
                className="w-full text-xs font-black text-right px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-blue-700"
              />
            </div>

            {/* 7. Note */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">LOSS율/비고</label>
              <input
                type="text"
                placeholder="-. LOSS율 6.5%"
                value={inputForm.note}
                onChange={(e) => setInputForm({ ...inputForm, note: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-center font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="w-full flex-1">
              <input
                type="text"
                placeholder="조치사항 및 결과 (예: 금형 체결 및 승온 정상화, 양품 확인)"
                value={inputForm.action}
                onChange={(e) => setInputForm({ ...inputForm, action: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              ➕ 데이터 자동 등록
            </button>
          </div>
        </form>
      </div>

      {/* 5. Main Weekly Production Table (시인성 대폭 강화) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span className="font-black text-sm text-slate-900">
              {currentLine.name} - [{selectedWeek}] 주간 상세 작업 실적표
            </span>
            <span className="text-xs text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {currentWeekData.rows?.length || 0}건 등록
            </span>
            <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {currentWeekData.period}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>주간 비가동: <strong className="text-rose-600 font-black">{weeklyTotals.totalMin.toLocaleString()}분</strong> ({weeklyTotals.totalHours}h)</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>주간 LOSS: <strong className="text-blue-700 font-black">{weeklyTotals.totalKg}Kg</strong></span>
            </div>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ml-1"
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-black border-b border-slate-800">
                <th className="py-3 px-3.5 text-center w-[12%]">일자 / 요일</th>
                <th className="py-3 px-2 text-center w-[8%]">근무조</th>
                <th className="py-3 px-2 text-center w-[10%]">구분</th>
                <th className="py-3 px-3.5 text-left w-[30%]">품명 및 상세 작업내용</th>
                <th className="py-3 px-3.5 text-right w-[10%]">비가동(분)</th>
                <th className="py-3 px-3.5 text-right w-[9%]">중량(Kg)</th>
                <th className="py-3 px-3 text-center w-[11%]">LOSS율 / 비고</th>
                <th className="py-3 px-3.5 text-left w-[20%]">조치사항 및 결과</th>
                <th className="py-3 px-2 text-center w-[6%]">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentWeekData.rows && currentWeekData.rows.length > 0 ? (
                currentWeekData.rows.map((r, idx) => {
                  const isFirstOfDay = r.isNewDay;
                  const catColor = CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-700";

                  return (
                    <tr
                      key={r.id || idx}
                      className={`hover:bg-teal-50/40 transition ${
                        isFirstOfDay ? "border-t-2 border-slate-300 bg-slate-50/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center font-black text-slate-900 whitespace-nowrap bg-slate-50/50">
                        {r.day ? (
                          <span className="px-2 py-1 rounded-md bg-slate-200/70 text-slate-900 font-black">
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

                      <td className="py-2.5 px-3.5 text-slate-900 font-bold">{r.task}</td>

                      <td className="py-2.5 px-3.5 text-right font-black text-rose-600 text-sm">
                        {r.minutes > 0 ? r.minutes.toLocaleString() : "-"}
                      </td>

                      <td className="py-2.5 px-3.5 text-right font-black text-blue-700 text-sm">
                        {r.weight > 0 ? r.weight.toFixed(1) : "-"}
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">{r.note}</td>

                      <td className="py-2.5 px-3.5 text-slate-600 text-[11.5px] font-medium">{r.action}</td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-bold">
                    등록된 비가동 및 생산 내역이 없습니다. 상단 입력창에서 데이터를 등록해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                <td colSpan={4} className="py-3.5 px-4 text-center font-black text-sm">
                  ■ 주간 총 비가동 및 LOSS 합계 (실시간 자동 연동)
                </td>
                <td className="py-3.5 px-3.5 text-right text-rose-600 text-base font-black">
                  {weeklyTotals.totalMin.toLocaleString()}
                </td>
                <td className="py-3.5 px-3.5 text-right text-blue-700 text-base font-black">
                  {weeklyTotals.totalKg}
                </td>
                <td colSpan={3} className="py-3.5 px-3 text-slate-500 italic text-xs">
                  (=SUM 실시간 자동 계산 연동)
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
