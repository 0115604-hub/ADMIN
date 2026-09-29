import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Scale,
  Activity,
  Download,
  Trash2,
  RotateCcw,
  Plus,
  AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { EXTRUSION_LINES } from "../utils/extrusionImageParser";
import { parseExtrusionExcelFile, detectExtrusionLineKey } from "../utils/extrusionFileParser";

// Standard Manufacturing Calendar Mapping (Preserved for parser compatibility)
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

export const LINE_DISPLAY_NAMES = {
  pcm1: "PCM #1 LINE",
  pcm3: "PCM #3 LINE",
  pvc: "PVC LINE",
  tpe: "TPE LINE"
};

const LINE_THEMES = {
  pcm1: {
    primary: "bg-teal-700 hover:bg-teal-800",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-600",
    light: "bg-teal-50 dark:bg-teal-950/40",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border-teal-200",
    accent: "#0f766e"
  },
  pcm3: {
    primary: "bg-blue-700 hover:bg-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-600",
    light: "bg-blue-50 dark:bg-blue-950/40",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200",
    accent: "#1d4ed8"
  },
  pvc: {
    primary: "bg-amber-600 hover:bg-amber-700",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-600",
    light: "bg-amber-50 dark:bg-amber-950/40",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200",
    accent: "#d97706"
  },
  tpe: {
    primary: "bg-purple-700 hover:bg-purple-800",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-600",
    light: "bg-purple-50 dark:bg-purple-950/40",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200",
    accent: "#7c3aed"
  }
};

const CATEGORY_COLORS = {
  형교환: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200",
  "승온/준비": "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200",
  "불량/고장": "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200",
  라인정지: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  정상생산: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200"
};

const STORAGE_KEY = "factory_extrusion_downtime_user_uploaded_v3";

export const ExtrusionDowntimeView = () => {
  const [selectedLineId, setSelectedLineId] = useState("pcm1");
  const [selectedWeek, setSelectedWeek] = useState("9월3주");
  const [monthFilter, setMonthFilter] = useState("전체");
  const [toastMessage, setToastMessage] = useState("");
  const [dragOverBadge, setDragOverBadge] = useState(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const badgeFileInputRefs = useRef({});
  const activeWeekTabRef = useRef(null);

  // Clean state: Initial state starts completely empty, waiting for user file upload
  const [linesData, setLinesData] = useState(() => {
    try {
      // Clear legacy sample data stores
      localStorage.removeItem("factory_extrusion_downtime_parsed_v2");
      localStorage.removeItem("factory_extrusion_downtime_4lines_v24_real_purged");
      localStorage.removeItem("factory_extrusion_downtime_4lines_v23_pcm1qq_verified");

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return {};
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(linesData));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }, [linesData]);

  const currentLineData = linesData[selectedLineId] || null;
  const currentLineName = LINE_DISPLAY_NAMES[selectedLineId] || "PCM #1 LINE";
  const theme = LINE_THEMES[selectedLineId] || LINE_THEMES.pcm1;

  const weeklySheetKeys = useMemo(() => {
    if (!currentLineData?.sheets) return [];
    return Object.keys(currentLineData.sheets);
  }, [currentLineData]);

  // Adjust selected week if not in weeklySheetKeys
  useEffect(() => {
    if (weeklySheetKeys.length > 0 && !weeklySheetKeys.includes(selectedWeek)) {
      if (weeklySheetKeys.includes("9월3주")) {
        setSelectedWeek("9월3주");
      } else {
        setSelectedWeek(weeklySheetKeys[0]);
      }
    }
  }, [weeklySheetKeys, selectedWeek]);

  // Auto-scroll active week tab
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

  const currentWeekData = useMemo(() => {
    if (!currentLineData?.sheets || !selectedWeek) return null;
    return currentLineData.sheets[selectedWeek] || null;
  }, [currentLineData, selectedWeek]);

  // Handle parsing a dropped or selected file
  const handleProcessFile = async (file, targetLineKey = null) => {
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast("❌ 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = await parseExtrusionExcelFile(file);
      const sheetCount = Object.keys(parsed.sheets).length;

      if (sheetCount === 0) {
        showToast("⚠️ 엑셀 파일에서 주차별 관리대장 시트를 찾을 수 없습니다.");
        setIsProcessing(false);
        return;
      }

      // Detect line key if not explicitly set
      const lineKey = targetLineKey || detectExtrusionLineKey(file.name, selectedLineId);

      setLinesData((prev) => ({
        ...prev,
        [lineKey]: parsed
      }));

      setSelectedLineId(lineKey);
      if (parsed.sheets["9월3주"]) {
        setSelectedWeek("9월3주");
      } else {
        setSelectedWeek(Object.keys(parsed.sheets)[0]);
      }

      showToast(`✅ [${LINE_DISPLAY_NAMES[lineKey]}] ${file.name} (${sheetCount}개 주차) 분석 완료!`);
    } catch (err) {
      console.error("Excel parse error:", err);
      showToast("❌ 엑셀 분석 오류: " + (err.message || "파일을 읽는 중 오류가 발생했습니다."));
    } finally {
      setIsProcessing(false);
      setDragOverBadge(null);
      setIsGlobalDragging(false);
    }
  };

  // Clear single line data
  const handleClearLineData = (lineKey) => {
    if (window.confirm(`[${LINE_DISPLAY_NAMES[lineKey]}] 분석 데이터를 삭제하시겠습니까?`)) {
      setLinesData((prev) => {
        const next = { ...prev };
        delete next[lineKey];
        return next;
      });
      showToast(`🗑️ [${LINE_DISPLAY_NAMES[lineKey]}] 데이터가 삭제되었습니다.`);
    }
  };

  // Clear all lines data
  const handleClearAllData = () => {
    if (window.confirm("모든 라인의 비가동 분석 데이터를 영구 삭제하시겠습니까?")) {
      setLinesData({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      showToast("🗑️ 모든 라인 데이터가 완전히 초기화되었습니다.");
    }
  };

  // Badge Specific Drop
  const handleBadgeDrop = (e, lineKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBadge(null);
    setIsGlobalDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file, lineKey);
    }
  };

  // Global Drop
  const handleGlobalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(false);
    setDragOverBadge(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const detectedKey = detectExtrusionLineKey(file.name, selectedLineId);
      handleProcessFile(file, detectedKey);
    }
  };

  // Export current week to Excel
  const handleExportCurrentWeekExcel = () => {
    if (!currentWeekData || !currentWeekData.rows) {
      showToast("내보낼 실적 데이터가 없습니다.");
      return;
    }

    const rows = [
      [`오륙산업 삼랑진공장 - ${currentLineName} 주간 비가동 상세 실적 [${selectedWeek}]`],
      [`총 비가동시간: ${currentWeekData.totalDowntime}분 (${currentWeekData.totalDowntimeHours}시간) | 총 스크랩: ${currentWeekData.totalScrapKg}kg | 순수가동률: ${currentWeekData.netOpRate}`],
      [],
      ["No", "일자", "요일", "근무조", "구분", "품명 및 상세 작업내용", "비가동(분)", "중량(kg)", "계획정지", "LOSS율/비고", "조치사항 및 결과"]
    ];

    currentWeekData.rows.forEach((r, idx) => {
      rows.push([
        r.no || idx + 1,
        r.date || "-",
        r.day || "-",
        r.shift || "-",
        r.category || "-",
        r.task || "-",
        r.minutes || 0,
        r.weight || 0,
        r.plan || "N",
        r.note || "-",
        r.action || "-"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedWeek);
    XLSX.writeFile(wb, `${currentLineName}_비가동실적_${selectedWeek}.xlsx`);
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setIsGlobalDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsGlobalDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.relatedTarget === null) {
          setIsGlobalDragging(false);
        }
      }}
      onDrop={handleGlobalDrop}
      className="space-y-4 pb-12 animate-fadeIn max-w-[1600px] mx-auto min-w-0 relative"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Global Drag Overlay Hint */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-40 bg-teal-950/40 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none animate-fadeIn">
          <div className="bg-slate-900/95 text-white border-2 border-teal-400 border-dashed rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-3">
            <Upload className="w-12 h-12 text-teal-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-black">압출 주간관리대장 엑셀 파일 드롭</h3>
            <p className="text-xs text-slate-300">
              상단 4개 뱃지 중 해당하는 라인에 놓거나 화면에 드롭하면 자동 분석됩니다.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Top 4 Lines Badges (드래그 앤 드롭 지원 뱃지 4개) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXTRUSION_LINES.map((lMeta) => {
          const lineKey = lMeta.id;
          const isSelected = selectedLineId === lineKey;
          const lTheme = LINE_THEMES[lineKey] || LINE_THEMES.pcm1;
          const lineLabel = LINE_DISPLAY_NAMES[lineKey] || lMeta.name;
          const isDragOver = dragOverBadge === lineKey;
          const lineData = linesData[lineKey];
          const hasParsedData = Boolean(lineData && lineData.sheets && Object.keys(lineData.sheets).length > 0);
          const sheetCount = hasParsedData ? Object.keys(lineData.sheets).length : 0;

          return (
            <div
              key={lineKey}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverBadge(lineKey);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverBadge(null);
              }}
              onDrop={(e) => handleBadgeDrop(e, lineKey)}
              onClick={() => setSelectedLineId(lineKey)}
              className={`relative group py-2.5 px-3 sm:px-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer select-none ${
                isDragOver
                  ? "bg-teal-100 dark:bg-teal-900/80 border-teal-500 border-2 scale-102 shadow-lg ring-4 ring-teal-400/40 animate-pulse"
                  : isSelected
                  ? `${lTheme.light} ${lTheme.border} border-2 shadow-xs ring-2 ring-teal-500/20`
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
              }`}
            >
              {/* Badge Left: Dot + Line Name + Analyzed Status */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected ? "bg-teal-600 ring-2 ring-teal-300" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                ></span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`font-black text-xs sm:text-sm tracking-tight truncate ${
                      isSelected ? lTheme.text : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {lineLabel}
                  </span>
                  {hasParsedData ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      ✓ {sheetCount}개 주차 분석완료
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">
                      파일 드래그 대기중
                    </span>
                  )}
                </div>
              </div>

              {/* Badge Right: Selection Tag or Code */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isSelected ? (
                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-teal-600 text-white shadow-2xs">
                    선택
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                    {lMeta.code}
                  </span>
                )}

                {/* Hidden File Input for clicking */}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={(el) => (badgeFileInputRefs.current[lineKey] = el)}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0], lineKey);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Drag Hint Hover Pill */}
              {isDragOver && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-teal-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap animate-bounce">
                  📂 {lineLabel}에 파일 드롭!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. Main Weekly Analysis Dashboard (아래 화면 분석) */}
      {/* ========================================================================= */}
      {currentLineData && weeklySheetKeys.length > 0 ? (
        <div className="space-y-3.5">
          {/* Top Line Meta & File Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className={`p-2 rounded-xl ${theme.badge} shadow-2xs`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {currentLineName} 주간 비가동 실시간 분석
                  </h2>
                  <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    {weeklySheetKeys.length}개 주차 분석 완료
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  분석 파일: <span className="font-bold text-slate-700 dark:text-slate-300">{currentLineData.fileName}</span> (상단 뱃지에 새 엑셀 파일을 드래그하여 즉시 교체 가능)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => badgeFileInputRefs.current[selectedLineId]?.click()}
                className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 text-teal-800 dark:text-teal-200 text-xs font-black border border-teal-200 dark:border-teal-800 transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>엑셀 파일 교체</span>
              </button>
              <button
                type="button"
                onClick={handleExportCurrentWeekExcel}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>주간 엑셀 다운</span>
              </button>
              <button
                type="button"
                onClick={() => handleClearLineData(selectedLineId)}
                title="이 라인 데이터 삭제"
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Week Tabs Navigation with Quick Month Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">주차 선택:</span>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  {["전체", "7월", "8월", "9월", "10월", "11월", "12월"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonthFilter(m)}
                      className={`px-2 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                        monthFilter === m
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                {weeklySheetKeys.includes("9월3주") && (
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
                )}

                <span>선택:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-black border border-teal-200 dark:border-teal-800">
                  {selectedWeek} {WEEK_CALENDAR_MAP[selectedWeek]?.period ? `(${WEEK_CALENDAR_MAP[selectedWeek].period})` : ""}
                </span>
              </div>
            </div>

            {/* Scrollable Weekly Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth">
              {weeklySheetKeys
                .filter((w) => (monthFilter === "전체" ? true : w.startsWith(monthFilter)))
                .map((w) => {
                  const isSelected = selectedWeek === w;
                  const isThisWeek = w === "9월3주";
                  const wPeriod = WEEK_CALENDAR_MAP[w]?.period || "";
                  const sheetInfo = currentLineData.sheets[w];
                  const dMin = sheetInfo ? sheetInfo.totalDowntime : 0;

                  return (
                    <button
                      key={w}
                      ref={isSelected ? activeWeekTabRef : null}
                      type="button"
                      onClick={() => setSelectedWeek(w)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex flex-col items-center gap-0.5 cursor-pointer relative shrink-0 ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30 scale-102 dark:bg-teal-600 dark:ring-teal-400/40"
                          : isThisWeek
                          ? "bg-amber-50 dark:bg-amber-950/60 text-slate-800 dark:text-amber-200 border-2 border-amber-400 shadow-xs hover:bg-amber-100"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{w}</span>
                        {isThisWeek && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                              isSelected
                                ? "bg-amber-400 text-slate-950 shadow-xs"
                                : "bg-amber-500 text-white shadow-xs"
                            }`}
                          >
                            기준주
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9.5px]">
                        {wPeriod && <span className={isSelected ? "text-slate-300" : "text-slate-400"}>{wPeriod}</span>}
                        {dMin > 0 && (
                          <span
                            className={`px-1 rounded font-bold ${
                              isSelected ? "bg-rose-500 text-white" : "text-rose-600 dark:text-rose-400 font-extrabold"
                            }`}
                          >
                            {dMin.toLocaleString()}분
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Key Metrics KPI Cards for the Selected Week */}
          {currentWeekData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span>총 비가동시간</span>
                </div>
                <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {currentWeekData.totalDowntime.toLocaleString()}분
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  ({currentWeekData.totalDowntimeHours}시간)
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-blue-600" />
                  <span>총 스크랩 중량</span>
                </div>
                <div className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">
                  {currentWeekData.totalScrapKg} kg
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  총 {currentWeekData.rowsCount || 0}건 실적
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400">계획정지 시간</div>
                <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {currentWeekData.planStop.toLocaleString()}분
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  순수 비가동: {currentWeekData.netDowntime.toLocaleString()}분
                </div>
              </div>

              <div className="bg-yellow-50/70 dark:bg-yellow-950/40 rounded-xl p-3 border border-yellow-200 dark:border-yellow-800/60 shadow-2xs">
                <div className="text-[10.5px] font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-600" />
                  <span>순수 가동률</span>
                </div>
                <div className="text-base font-black text-teal-700 dark:text-teal-300 mt-0.5">
                  {currentWeekData.netOpRate}
                </div>
                <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  ★ 기준 가동률
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400">총 가동률 (전체기준)</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentWeekData.opRate}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  부하시간 7,200분 (5일)
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400">작업 실적 건수</div>
                <div className="text-base font-black text-purple-700 dark:text-purple-400 mt-0.5">
                  {currentWeekData.rowsCount || 0}건
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  주간 등록 내역
                </div>
              </div>
            </div>
          )}

          {/* Main Weekly Downtime & Tasks Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  {currentLineName} - [{selectedWeek}] 주간 비가동 상세 실적표
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  총 {currentWeekData?.rows?.length || 0}건 실적
                </span>
                <span className="text-xs text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  {WEEK_CALENDAR_MAP[selectedWeek]?.period || ""} (5.0일 가동)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCurrentWeekExcel}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>엑셀 내보내기</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-black border-b border-slate-800">
                    <th className="py-3 px-3 text-center w-[12%]">일자 / 요일</th>
                    <th className="py-3 px-2 text-center w-[8%]">근무조</th>
                    <th className="py-3 px-2 text-center w-[10%]">구분</th>
                    <th className="py-3 px-3.5 text-left w-[36%]">품명 및 상세 작업내용</th>
                    <th className="py-3 px-3 text-right w-[10%]">비가동(분)</th>
                    <th className="py-3 px-3 text-right w-[9%]">중량(Kg)</th>
                    <th className="py-3 px-2 text-center w-[7%]">계획정지</th>
                    <th className="py-3 px-3 text-left w-[16%]">비고 / 조치사항</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {currentWeekData?.rows && currentWeekData.rows.length > 0 ? (
                    currentWeekData.rows.map((r, idx) => {
                      const catColor = CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                      const isPlan = r.plan === "Y" || r.plan === "y";
                      const remarkText =
                        r.note && r.note !== "-"
                          ? r.note
                          : r.action && r.action !== "정상 가동 완료"
                          ? r.action
                          : "-";

                      return (
                        <tr
                          key={r.id || idx}
                          className="hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition"
                        >
                          {/* 일자 / 요일 */}
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100 whitespace-nowrap bg-slate-50/40 dark:bg-slate-800/30">
                            {r.date ? (
                              <span className="px-2 py-1 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black">
                                {r.date} {r.day ? `(${r.day})` : ""}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* 근무조 */}
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-md font-black text-[11px] ${
                                r.shift === "주간"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              }`}
                            >
                              {r.shift}
                            </span>
                          </td>

                          {/* 구분 */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] border ${catColor}`}>
                              {r.category}
                            </span>
                          </td>

                          {/* 작업내용 */}
                          <td className="py-2.5 px-3.5 text-slate-900 dark:text-slate-100 font-bold text-[12.5px] whitespace-pre-line leading-relaxed">
                            {r.task || "-"}
                          </td>

                          {/* 비가동시간 */}
                          <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                            {r.minutes > 0 ? `${r.minutes.toLocaleString()}분` : "-"}
                          </td>

                          {/* 중량 */}
                          <td className="py-2.5 px-3 text-right font-black text-blue-700 dark:text-blue-400 text-sm">
                            {r.weight > 0 ? `${r.weight.toLocaleString()}kg` : "-"}
                          </td>

                          {/* 계획정지 */}
                          <td className="py-2.5 px-2 text-center">
                            {isPlan ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-black text-[10.5px]">
                                Y
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">N</span>
                            )}
                          </td>

                          {/* 비고/조치 */}
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {remarkText}
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
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white">
                    <td colSpan={4} className="py-3 px-4 text-center font-black text-sm">
                      ■ [{selectedWeek}] 총 비가동 합계
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 text-base font-black">
                      {currentWeekData?.totalDowntime ? `${currentWeekData.totalDowntime.toLocaleString()}분` : "0분"}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 dark:text-blue-400 text-base font-black">
                      {currentWeekData?.totalScrapKg ? `${currentWeekData.totalScrapKg}kg` : "0kg"}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-700 dark:text-amber-400 font-black">
                      {currentWeekData?.planStop ? `${currentWeekData.planStop}분` : "0분"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 italic text-xs">
                      (순수가동률: <strong>{currentWeekData?.netOpRate || "100%"}</strong>)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Drop Zone */
        <div
          onClick={() => badgeFileInputRefs.current[selectedLineId]?.click()}
          className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/20 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              [{currentLineName}] 주간관리대장 엑셀 파일 드래그 & 드롭
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              상단 <span className="font-bold text-teal-600">{currentLineName}</span> 뱃지 또는 이 영역으로 관리대장 엑셀 파일(.xlsx)을 드래그하세요.
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>파일 선택하여 분석하기</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExtrusionDowntimeView;
